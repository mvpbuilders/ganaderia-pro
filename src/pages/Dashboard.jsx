import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardService, DASHBOARD_QUERY_KEY } from "@/services/dashboardService";
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

  // Todos los cálculos viven en el backend; el frontend solo renderiza.
  const { data: dashboard } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardService.get,
  });

  const stats = dashboard?.stats || {};
  const alertas = dashboard?.alertas || [];
  const recentEventos = dashboard?.eventos_recientes || [];

  const totalGanado = stats.total_ganado || 0;
  const vacasOrdenio = stats.vacas_ordenio || 0;
  const vacasSecas = stats.vacas_secas || 0;
  const vacasPreñadas = stats.vacas_prenadas || 0;
  const vacasEnfermas = stats.vacas_enfermas || 0;
  const produccionHoy = stats.produccion_hoy || 0;
  const promedioPorVaca = stats.promedio_por_vaca || 0;
  const ingresosMes = stats.ingresos_mes || 0;
  const egresosMes = stats.egresos_mes || 0;
  const gananciaMes = stats.ganancia_mes || 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const produccionChart = (dashboard?.produccion_chart || []).map((d) => ({
    ...d,
    dia: new Date(d.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric" }),
  }));

  const last6Months = dashboard?.finanzas_chart || [];

  const alertasCount = alertas.length;
  const alertasSummary = alertas;

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
          <StatCard title="Vacas en Ordeño" value={formatNumber(vacasOrdenio)} subtitle={`${vacasPreñadas} preñadas`} icon={Milk} color="blue" />
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
                  <p className="text-2xl font-bold text-blue-700">{Number(diaDetalle.am).toFixed(1)}L</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">PM</p>
                  <p className="text-2xl font-bold text-blue-700">{Number(diaDetalle.pm).toFixed(1)}L</p>
                </div>
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">{Number(diaDetalle.litros).toFixed(1)}L</p>
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
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}L`, "Litros"]} />
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
              alertasSummary.slice(0, 4).map((a, i) => <AlertaCard key={i} tipo={a.tipo} titulo={a.titulo} descripcion={a.descripcion} />)
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
              { label: "Ordeño", count: vacasOrdenio, color: "bg-green-500" },
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
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(0)}`, ""]} />
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
