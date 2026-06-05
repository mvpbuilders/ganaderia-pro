import { getCurrentFinca } from "@/lib/current-finca";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import TransaccionModal from "@/components/finanzas/TransaccionModal";

const CATEGORIAS_COLORES = {
  "Venta de leche": "#22c55e",
  "Venta de animal": "#3b82f6",
  "Alimentacion": "#f59e0b",
  "Veterinario": "#ef4444",
  "Medicamentos": "#f97316",
  "Mano de obra": "#8b5cf6",
  "Equipos": "#06b6d4",
  "Combustible": "#84cc16",
  "Mantenimiento": "#6b7280",
  "Servicios": "#ec4899",
  "Otros": "#94a3b8",
};

export default function Finanzas() {
  const [showModal, setShowModal] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const queryClient = useQueryClient();
  const now = new Date();
  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: transacciones = [], isLoading } = useQuery({
    queryKey: ['transacciones', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.Transaccion.filter(
        { finca_id: fincaId },
        '-fecha',
        500
      ),
  });

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mesFiltradas = transacciones.filter(t => {
    const d = new Date(t.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const ingresosMes = mesFiltradas.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + (t.monto_usd || 0), 0);
  const egresosMes = mesFiltradas.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + (t.monto_usd || 0), 0);
  const gananciaMes = ingresosMes - egresosMes;
  const litrosMes = mesFiltradas.filter(t => t.categoria === 'Venta de leche').reduce((s, t) => s + (t.litros || 0), 0);
  const costoPorLitro = litrosMes > 0 ? (egresosMes / litrosMes).toFixed(3) : 0;

  // Gastos por categoría para pie chart
  const gastosCategorias = mesFiltradas
    .filter(t => t.tipo === 'Egreso')
    .reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + (t.monto_usd || 0);
      return acc;
    }, {});

  const pieData = Object.entries(gastosCategorias).map(([name, value]) => ({ name, value }));

  // Monthly chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth(), year: d.getFullYear(), label: getMonthName(d.getMonth()).substring(0, 3) };
  }).map(({ month, year, label }) => {
    const monthTrans = transacciones.filter(t => {
      const d = new Date(t.fecha);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      mes: label,
      ingresos: monthTrans.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + (t.monto_usd || 0), 0),
      egresos: monthTrans.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + (t.monto_usd || 0), 0),
    };
  });

  const transFiltered = tipoFiltro === "Todos" ? transacciones : transacciones.filter(t => t.tipo === tipoFiltro);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanzas</h1>
          <p className="text-muted-foreground text-sm">{getMonthName(currentMonth)} {currentYear}</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Transacción</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-green-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-green-600" />
            <p className="text-xs text-muted-foreground font-semibold">Ingresos</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(ingresosMes)}</p>
          <p className="text-xs text-muted-foreground mt-1">este mes</p>
        </div>
        <div className="bg-card rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="w-4 h-4 text-red-500" />
            <p className="text-xs text-muted-foreground font-semibold">Egresos</p>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(egresosMes)}</p>
          <p className="text-xs text-muted-foreground mt-1">este mes</p>
        </div>
        <div className={`bg-card rounded-xl border p-5 ${gananciaMes >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {gananciaMes >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            <p className="text-xs text-muted-foreground font-semibold">Ganancia</p>
          </div>
          <p className={`text-2xl font-bold ${gananciaMes >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(gananciaMes)}</p>
          <p className="text-xs text-muted-foreground mt-1">este mes</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Costo/Litro</p>
          </div>
          <p className="text-2xl font-bold text-primary">${costoPorLitro}</p>
          <p className="text-xs text-muted-foreground mt-1">{litrosMes.toLocaleString()} L vendidos</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Ingresos vs Egresos (6 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'hsl(220,15%,50%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220,15%,50%)' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`$${v.toFixed(0)}`, '']} />
              <Bar dataKey="ingresos" fill="#22c55e" radius={[4,4,0,0]} name="Ingresos" />
              <Bar dataKey="egresos" fill="#ef4444" radius={[4,4,0,0]} name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Gastos por Categoría</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORIAS_COLORES[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`$${v.toFixed(0)}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-8">Sin gastos registrados</p>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Transacciones</h2>
          <div className="flex gap-2">
            {["Todos", "Ingreso", "Egreso"].map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${tipoFiltro === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/10'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Cargando...</div>
        ) : transFiltered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-sm">No hay transacciones</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transFiltered.slice(0, 50).map((t, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${t.tipo === 'Ingreso' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {t.tipo === 'Ingreso' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.categoria}</p>
                  <p className="text-xs text-muted-foreground">{t.descripcion || '-'} · {formatDate(t.fecha)}</p>
                </div>
                <p className={`text-sm font-bold ${t.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(t.monto_usd)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TransaccionModal
          fincaId={fincaId}
          onClose={() => setShowModal(false)}
          onSave={() => {
            queryClient.invalidateQueries(['transacciones', fincaId]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}