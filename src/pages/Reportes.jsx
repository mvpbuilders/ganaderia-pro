import { getCurrentFinca } from "@/lib/current-finca";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatCurrency, getMonthName } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const TABS = ["Producción", "Reproducción", "Salud", "Inventario", "Finanzas"];

export default function Reportes() {
  const [activeTab, setActiveTab] = useState("Producción");
  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: animales = [] } = useQuery({
    queryKey: ['animales', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.Animal.filter(
        { finca_id: fincaId },
        '-created_date',
        500
    ),
  });

  const { data: eventos = [] } = useQuery({
    queryKey: ['eventos', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.Evento.filter(
        { finca_id: fincaId },
        '-fecha',
        500
      ),
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.Transaccion.filter(
        { finca_id: fincaId },
        '-fecha',
        500
      ),
  });

  const { data: registrosLeche = [] } = useQuery({
    queryKey: ['registros-leche-reportes', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.RegistroLeche.filter(
        { finca_id: fincaId },
        '-fecha',
        500
      ),
  });

  const now = new Date();

  // Aggregate individual cow records by date (exclude farm_total if any)
  const cowRecords = registrosLeche.filter(r => r.animal_id !== 'farm_total');

  // Group cow records by date → sum total_litros per day
  const byDate = cowRecords.reduce((acc, r) => {
    if (!r.fecha) return acc;
    acc[r.fecha] = (acc[r.fecha] || 0) + (r.total_litros || 0);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort();

  // Production data - show actual data from last 30 days
  const last30Days = sortedDates
    .filter(dt => {
      const dtDate = new Date(dt);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return dtDate >= thirtyDaysAgo && dtDate <= now;
    })
    .map(dt => ({
      dia: new Date(dt + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }),
      litros: byDate[dt],
    }));

  // Monthly production - last 3 months with actual data
  const monthlyProd = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const datesInMonth = sortedDates.filter(dt => dt.startsWith(monthStr));
    const totalLitros = datesInMonth.reduce((s, dt) => s + byDate[dt], 0);
    return {
      mes: getMonthName(d.getMonth()).substring(0, 3),
      litros: totalLitros,
    };
  }).filter(m => m.litros > 0);

  // Inventory by raza
  const byRaza = animales.reduce((acc, a) => {
    if (a.estado === 'Vendido' || a.estado === 'Muerto') return acc;
    acc[a.raza || 'Sin raza'] = (acc[a.raza || 'Sin raza'] || 0) + 1;
    return acc;
  }, {});

  const razaData = Object.entries(byRaza).map(([name, value]) => ({ name, value }));
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const byEstado = animales.reduce((acc, a) => {
    if (a.estado !== 'Vendido' && a.estado !== 'Muerto') {
      acc[a.estado] = (acc[a.estado] || 0) + 1;
    }
    return acc;
  }, {});

  const estadoData = Object.entries(byEstado).map(([name, value]) => ({ name, value }));

  // Health events
  const saludEventos = eventos.filter(e => ['Enfermedad', 'Tratamiento'].includes(e.tipo));
  const enfermedadesPorMes = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      mes: getMonthName(d.getMonth()).substring(0, 3),
      enfermedades: eventos.filter(e => e.tipo === 'Enfermedad' && e.fecha?.startsWith(monthStr)).length,
      tratamientos: eventos.filter(e => e.tipo === 'Tratamiento' && e.fecha?.startsWith(monthStr)).length,
    };
  });

  // Financial by month
  const finByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mt = transacciones.filter(t => {
      const td = new Date(t.fecha);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    return {
      mes: getMonthName(d.getMonth()).substring(0, 3),
      ingresos: mt.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + (t.monto_usd || 0), 0),
      egresos: mt.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + (t.monto_usd || 0), 0),
    };
  });

  // Reproduction
  const partos = eventos.filter(e => e.tipo === 'Parto');
  const inseminaciones = eventos.filter(e => e.tipo === 'Inseminacion');
  const reproByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      mes: getMonthName(d.getMonth()).substring(0, 3),
      partos: partos.filter(e => e.fecha?.startsWith(monthStr)).length,
      inseminaciones: inseminaciones.filter(e => e.fecha?.startsWith(monthStr)).length,
    };
  });

  const vacasOrdenio = animales.filter(a => a.estado === 'Ordeño');
  // Latest known daily total from aggregated cow records
  const latestDate = sortedDates[sortedDates.length - 1];
  const produccionHoyReal = latestDate ? byDate[latestDate] : vacasOrdenio.reduce((s, a) => s + (a.produccion_diaria_litros || 0), 0);
  const promedio = vacasOrdenio.length > 0 ? (produccionHoyReal / vacasOrdenio.length).toFixed(1) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm">Análisis detallado de tu ganadería</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Producción Tab */}
      {activeTab === "Producción" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Producción Hoy</p>
              <p className="text-2xl font-bold text-primary">{produccionHoyReal.toLocaleString()}L</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Promedio/Vaca</p>
              <p className="text-2xl font-bold text-foreground">{promedio}L</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Vacas en Ordeño</p>
              <p className="text-2xl font-bold text-foreground">{vacasOrdenio.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Ingreso Estimado/día</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(produccionHoyReal * 0.42)}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Producción Últimos 30 Días</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={last30Days}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152,60%,32%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(152,60%,32%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [`${v}L`, "Litros"]} />
                <Area type="monotone" dataKey="litros" stroke="hsl(152,60%,32%)" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Producción Mensual</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyProd}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`${v.toLocaleString()}L`, "Litros"]} />
                <Bar dataKey="litros" fill="hsl(152,60%,40%)" radius={[4,4,0,0]} name="Litros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reproducción Tab */}
      {activeTab === "Reproducción" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Vacas Preñadas</p>
              <p className="text-2xl font-bold text-blue-600">{animales.filter(a => a.estado_reproductivo === 'Preñada positiva').length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Partos (total)</p>
              <p className="text-2xl font-bold text-foreground">{partos.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Inseminaciones</p>
              <p className="text-2xl font-bold text-foreground">{inseminaciones.length}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Partos e Inseminaciones por Mes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reproByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="partos" fill="#3b82f6" radius={[4,4,0,0]} name="Partos" />
                <Bar dataKey="inseminaciones" fill="#8b5cf6" radius={[4,4,0,0]} name="Inseminaciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3">Próximos Partos</h3>
            {animales.filter(a => a.fecha_proxima_cria).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sin partos registrados</p>
            ) : (
              <div className="space-y-2">
                {animales.filter(a => a.fecha_proxima_cria).slice(0, 10).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-semibold text-foreground">{a.nombre}</span>
                    <span className="text-xs text-blue-600 font-semibold">{a.fecha_proxima_cria}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salud Tab */}
      {activeTab === "Salud" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-card rounded-xl border border-red-200 p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Enfermas Ahora</p>
              <p className="text-2xl font-bold text-red-500">{animales.filter(a => a.estado === 'Enferma').length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Eventos Enfermedad</p>
              <p className="text-2xl font-bold text-foreground">{eventos.filter(e => e.tipo === 'Enfermedad').length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Tratamientos</p>
              <p className="text-2xl font-bold text-foreground">{eventos.filter(e => e.tipo === 'Tratamiento').length}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Enfermedades y Tratamientos por Mes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={enfermedadesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="enfermedades" fill="#ef4444" radius={[4,4,0,0]} name="Enfermedades" />
                <Bar dataKey="tratamientos" fill="#f97316" radius={[4,4,0,0]} name="Tratamientos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventario Tab */}
      {activeTab === "Inventario" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(byEstado).map(([estado, count], i) => (
              <div key={estado} className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground font-semibold mb-1">{estado}</p>
                <p className="text-2xl font-bold text-foreground">{count}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Por Raza</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={razaData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {razaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Por Estado</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={estadoData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {estadoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Finanzas Tab */}
      {activeTab === "Finanzas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {finByMonth.slice(-1).map((m, i) => (
              <>
                <div key="ing" className="bg-card rounded-xl border border-green-200 p-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Ingresos Mes</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(m.ingresos)}</p>
                </div>
                <div key="egr" className="bg-card rounded-xl border border-red-200 p-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Egresos Mes</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(m.egresos)}</p>
                </div>
                <div key="gan" className={`bg-card rounded-xl border p-4 ${m.ingresos - m.egresos >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Ganancia</p>
                  <p className={`text-2xl font-bold ${m.ingresos - m.egresos >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(m.ingresos - m.egresos)}</p>
                </div>
                <div key="rent" className="bg-card rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Rentabilidad</p>
                  <p className="text-2xl font-bold text-foreground">
                    {m.ingresos > 0 ? `${((m.ingresos - m.egresos) / m.ingresos * 100).toFixed(1)}%` : '-'}
                  </p>
                </div>
              </>
            ))}
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">Ingresos vs Egresos (6 meses)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={finByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`$${v.toFixed(0)}`, '']} />
                <Legend />
                <Bar dataKey="ingresos" fill="#22c55e" radius={[4,4,0,0]} name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" radius={[4,4,0,0]} name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}