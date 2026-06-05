import { getCurrentFinca } from "@/lib/current-finca";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatNumber, getMonthName } from "@/lib/utils";
import StatCard from "@/components/dashboard/StatCard";
import AlertaCard from "@/components/dashboard/AlertaCard";
import AlertasPanel from "@/components/dashboard/AlertasPanel";
import { DollarSign, Plus, Droplets, Milk, Bell, ArrowRight } from "lucide-react";
import CowIcon from "@/components/icons/CowIcon.jsx";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [showAlertas, setShowAlertas] = useState(false);
  const [diaDetalle, setDiaDetalle] = useState(null);

  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: animales = [], isLoading } = useQuery({
    queryKey: ['animales', fincaId],
    enabled: !!fincaId,
    queryFn: () => base44.entities.Animal.filter({ finca_id: fincaId }, '-created_date', 500),
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones', fincaId],
    enabled: !!fincaId,
    queryFn: () => base44.entities.Transaccion.filter({ finca_id: fincaId }, '-fecha', 500),
  });

  const { data: eventos = [] } = useQuery({
    queryKey: ['eventos', fincaId],
    enabled: !!fincaId,
    queryFn: () => base44.entities.Evento.filter({ finca_id: fincaId }, '-fecha', 100),
  });

  const { data: registrosLeche = [] } = useQuery({
    queryKey: ['leche-reciente', fincaId],
    enabled: !!fincaId,
    queryFn: () => base44.entities.RegistroLeche.filter({ finca_id: fincaId }, '-fecha', 200),
  });

  const hoy = new Date().toISOString().split('T')[0];

  const totalGanado = animales.filter(a => !["Vendida", "Muerta"].includes(a.estado)).length;
  const vacasOrdenio = animales.filter(a => a.estado === 'Ordeño');
  const vacasSecas = animales.filter(a => a.estado === 'Seca').length;
  const vacasPreñadas = animales.filter(a => a.estado_reproductivo === 'Preñada positiva').length;
  const vacasEnfermas = animales.filter(a => a.estado === 'Enfermería').length;
  const enRetiro = animales.filter(a => a.retiro_leche_hasta && a.retiro_leche_hasta >= hoy).length;

  const produccionHoy = vacasOrdenio.reduce((s, a) => s + (a.produccion_am || 0) + (a.produccion_pm || 0), 0);
  const promedioPorVaca = vacasOrdenio.length > 0 ? (produccionHoy / vacasOrdenio.length).toFixed(1) : 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const transaccionesMes = transacciones.filter(t => {
    const d = new Date(t.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const ingresosMes = transaccionesMes.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + (t.monto_usd || 0), 0);
  const egresosMes = transaccionesMes.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + (t.monto_usd || 0), 0);
  const gananciaMes = ingresosMes - egresosMes;

  // Farm-total records for charts
  const farmTotalRecords = registrosLeche
    .filter(r => r.animal_id === 'farm_total')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Last 14 days production - interpolate between known records
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const produccionChart = last14Days.map(date => {
    const exact = farmTotalRecords.find(r => r.fecha === date);
    // Interpolate if no exact match
    const prev = [...farmTotalRecords].filter(r => r.fecha <= date).slice(-1)[0];
    const next = farmTotalRecords.find(r => r.fecha >= date);
    let litros = 0, am = 0, pm = 0;
    if (exact) {
      litros = exact.total_litros; am = exact.litros_am || 0; pm = exact.litros_pm || 0;
    } else if (prev && next && prev.fecha !== next.fecha) {
      const t1 = new Date(prev.fecha).getTime(), t2 = new Date(next.fecha).getTime(), tc = new Date(date).getTime();
      const ratio = (tc - t1) / (t2 - t1);
      litros = Math.round(prev.total_litros + (next.total_litros - prev.total_litros) * ratio);
      am = Math.round((prev.litros_am || 0) + ((next.litros_am || 0) - (prev.litros_am || 0)) * ratio);
      pm = Math.round((prev.litros_pm || 0) + ((next.litros_pm || 0) - (prev.litros_pm || 0)) * ratio);
    } else if (prev) {
      litros = prev.total_litros; am = prev.litros_am || 0; pm = prev.litros_pm || 0;
    } else if (date === hoy && produccionHoy > 0) {
      litros = produccionHoy;
    }
    return {
      fecha: date,
      dia: new Date(date + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' }),
      litros,
      am,
      pm,
    };
  });

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: d.getMonth(), year: d.getFullYear() };
  }).map(({ month, year }) => {
    const monthTrans = transacciones.filter(t => {
      const d = new Date(t.fecha);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      mes: getMonthName(month).substring(0, 3),
      ingresos: monthTrans.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + (t.monto_usd || 0), 0),
      egresos: monthTrans.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + (t.monto_usd || 0), 0),
    };
  });

  // Alertas count
  const alertasCount = [
    vacasEnfermas > 0,
    enRetiro > 0,
    vacasPreñadas > 0,
    gananciaMes < 0,
  ].filter(Boolean).length;

  const alertasSummary = [
    vacasEnfermas > 0 && { tipo: "error", titulo: `${vacasEnfermas} animales en Enfermería`, descripcion: "Atención veterinaria urgente" },
    enRetiro > 0 && { tipo: "error", titulo: `${enRetiro} vacas en retiro de leche`, descripcion: "Leche no apta para venta" },
    vacasPreñadas > 0 && { tipo: "info", titulo: `${vacasPreñadas} vacas preñadas confirmadas`, descripcion: "Verificar fechas de parto" },
    gananciaMes < 0 && { tipo: "warning", titulo: "Gastos superan ingresos este mes", descripcion: `Déficit: ${formatCurrency(Math.abs(gananciaMes))}` },
    produccionHoy > 0 && { tipo: "success", titulo: `${formatNumber(produccionHoy)}L producidos hoy`, descripcion: `Promedio: ${promedioPorVaca}L/vaca` },
  ].filter(Boolean);

  const recentEventos = eventos.slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel Principal</h1>
          <p className="text-muted-foreground text-sm capitalize">{getMonthName(currentMonth)} {currentYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/registro-leche">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
              <Milk className="w-3.5 h-3.5" />
              Registro Lechero
            </Button>
          </Link>
          <Link to="/eventos/nuevo">
            <Button className="bg-primary text-primary-foreground gap-2 hidden md:flex" size="sm">
              <Plus className="w-4 h-4" />
              Registrar Evento
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link to="/ganado">
          <StatCard title="Total Ganado" value={formatNumber(totalGanado)} subtitle={`${vacasSecas} secas`} icon={CowIcon} color="green" />
        </Link>
        <Link to="/ganado?estado=Ordeño">
          <StatCard title="Vacas en Ordeño" value={formatNumber(vacasOrdenio.length)} subtitle={`${vacasPreñadas} preñadas`} icon={Milk} color="blue" />
        </Link>
        <Link to="/registro-leche">
          <StatCard title="Producción Hoy" value={`${formatNumber(produccionHoy)}L`} subtitle={`${promedioPorVaca}L por vaca`} icon={Droplets} color="blue" />
        </Link>
        <Link to="/finanzas">
          <StatCard title="Ingresos del Mes" value={formatCurrency(ingresosMes)} subtitle={`Gastos: ${formatCurrency(egresosMes)}`} icon={DollarSign} color="green"
            trend={gananciaMes >= 0 ? "up" : "down"} trendValue={`Ganancia: ${formatCurrency(gananciaMes)}`} />
        </Link>
      </div>

      {/* Charts & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Production Chart - clickable days */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Producción Últimos 14 Días</h2>
            <Link to="/registro-leche" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver registro <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {diaDetalle ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{new Date(diaDetalle.fecha + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                <button onClick={() => setDiaDetalle(null)} className="text-xs text-primary hover:underline">← Volver</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">AM</p>
                  <p className="text-2xl font-bold text-blue-700">{diaDetalle.am.toFixed(1)}L</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">PM</p>
                  <p className="text-2xl font-bold text-blue-700">{diaDetalle.pm.toFixed(1)}L</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">{diaDetalle.litros.toFixed(1)}L</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                💡 Para ver producción por vaca de este día, ir al{' '}
                <Link to="/registro-leche" className="text-primary hover:underline">Registro Lechero</Link>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={produccionChart} onClick={(d) => d?.activePayload && setDiaDetalle(d.activePayload[0]?.payload)}>
                <defs>
                  <linearGradient id="colorLitros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152,60%,32%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(152,60%,32%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'hsl(220,15%,50%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220,15%,50%)' }} />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}L`, "Litros"]} />
                <Area type="monotone" dataKey="litros" stroke="hsl(152,60%,32%)" strokeWidth={2} fill="url(#colorLitros)" style={{ cursor: 'pointer' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {!diaDetalle && <p className="text-xs text-muted-foreground mt-2 text-center">Haz clic en un día para ver detalle</p>}
        </div>

        {/* Alerts - clickable */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              Alertas y Avisos
              {alertasCount > 0 && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{alertasCount}</span>}
            </h2>
            <button onClick={() => setShowAlertas(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <Bell className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {alertasSummary.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Todo está en orden ✅</p>
            ) : (
              alertasSummary.slice(0, 4).map((a, i) => <AlertaCard key={i} {...a} />)
            )}
          </div>
          {alertasSummary.length > 4 && (
            <button onClick={() => setShowAlertas(true)} className="w-full mt-3 text-xs text-primary hover:underline text-center">
              +{alertasSummary.length - 4} alertas más
            </button>
          )}
        </div>
      </div>

      {/* Herd Summary + Financial Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Herd Breakdown */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Estado del Hato</h2>
            <Link to="/ganado" className="text-xs text-primary hover:underline">Ver ganado</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Ordeño", count: vacasOrdenio.length, color: "bg-green-500" },
              { label: "Preñadas", count: vacasPreñadas, color: "bg-blue-500" },
              { label: "Secas", count: vacasSecas, color: "bg-yellow-500" },
              { label: "Enfermería", count: vacasEnfermas, color: "bg-red-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-20 text-xs text-muted-foreground">{item.label}</div>
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: totalGanado > 0 ? `${(item.count / totalGanado * 100).toFixed(0)}%` : '0%' }} />
                </div>
                <div className="w-8 text-xs font-semibold text-right text-foreground">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Ingresos vs Gastos (6 meses)</h2>
            <Link to="/finanzas" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver finanzas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(220,15%,50%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220,15%,50%)' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toFixed(0)}`, ""]} />
              <Bar dataKey="ingresos" fill="hsl(152,60%,40%)" radius={[4,4,0,0]} name="Ingresos" />
              <Bar dataKey="egresos" fill="hsl(0,75%,65%)" radius={[4,4,0,0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Eventos Recientes</h2>
          <Link to="/eventos/nuevo" className="text-xs text-primary hover:underline flex items-center gap-1">
            + Registrar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentEventos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay eventos registrados</p>
            <Link to="/eventos/nuevo">
              <Button size="sm" className="mt-3 bg-primary text-primary-foreground">Registrar primer evento</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEventos.map((ev, i) => {
              const EMOJI = { Produccion: '🥛', Parto: '🐣', Tratamiento: '💊', Venta: '💰', Enfermedad: '🤒', Inseminacion: '🧬', Celo: '💕', Vacuna: '💉', "Chequeo veterinario": '🩺' };
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {EMOJI[ev.tipo] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.tipo}: {ev.animal_nombre || ev.descripcion || '-'}</p>
                    <p className="text-xs text-muted-foreground">{ev.fecha}</p>
                  </div>
                  {ev.valor_litros > 0 && <span className="text-xs font-semibold text-primary">{ev.valor_litros}L</span>}
                  {ev.valor_usd > 0 && <span className="text-xs font-semibold text-green-600">${ev.valor_usd}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAlertas && <AlertasPanel onClose={() => setShowAlertas(false)} />}
    </div>
  );
}