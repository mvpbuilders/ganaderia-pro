import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, AlertTriangle, CheckCircle2, Info, Bell } from "lucide-react";

const CONFIG_ICONS = {
  error: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon_color: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon_color: "text-yellow-500" },
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon_color: "text-blue-500" },
  success: { icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon_color: "text-green-500" },
};

export default function AlertasPanel({ onClose }) {
  const { data: animales = [] } = useQuery({
    queryKey: ['animales'],
    queryFn: () => base44.entities.Animal.list('-created_date', 500),
  });
  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => base44.entities.Transaccion.list('-fecha', 200),
  });

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  const en7Dias = new Date(hoy); en7Dias.setDate(hoy.getDate() + 7);
  const en7Str = en7Dias.toISOString().split('T')[0];

  const now = hoy;
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const mesTrans = transacciones.filter(t => {
    const d = new Date(t.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const ingresosMes = mesTrans.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.monto_usd, 0);
  const egresosMes = mesTrans.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + t.monto_usd, 0);

  const alertas = [];

  // En retiro de leche
  const enRetiro = animales.filter(a => a.retiro_leche_hasta && a.retiro_leche_hasta >= hoyStr);
  if (enRetiro.length > 0) alertas.push({ tipo: "error", titulo: `${enRetiro.length} vaca(s) en retiro de leche`, descripcion: enRetiro.map(a => `${a.nombre} hasta ${a.retiro_leche_hasta}`).join(' · ') });

  // Vacas enfermas
  const enfermas = animales.filter(a => a.estado === "Enfermería");
  if (enfermas.length > 0) alertas.push({ tipo: "error", titulo: `${enfermas.length} animales en Enfermería`, descripcion: enfermas.map(a => a.nombre).join(', ') });

  // Próximos partos (7 días)
  const proxPartos = animales.filter(a => a.fecha_proxima_cria && a.fecha_proxima_cria >= hoyStr && a.fecha_proxima_cria <= en7Str);
  if (proxPartos.length > 0) alertas.push({ tipo: "warning", titulo: `${proxPartos.length} parto(s) en los próximos 7 días`, descripcion: proxPartos.map(a => `${a.nombre}: ${a.fecha_proxima_cria}`).join(' · ') });

  // Secado próximo (14 días)
  const en14Dias = new Date(hoy); en14Dias.setDate(hoy.getDate() + 14);
  const en14Str = en14Dias.toISOString().split('T')[0];
  const proxSecado = animales.filter(a => a.fecha_secado && a.fecha_secado >= hoyStr && a.fecha_secado <= en14Str);
  if (proxSecado.length > 0) alertas.push({ tipo: "warning", titulo: `${proxSecado.length} vaca(s) para secar en 14 días`, descripcion: proxSecado.map(a => a.nombre).join(', ') });

  // Chequeo pendiente
  const chequeoVencido = animales.filter(a => a.fecha_proximo_chequeo && a.fecha_proximo_chequeo <= hoyStr);
  if (chequeoVencido.length > 0) alertas.push({ tipo: "warning", titulo: `${chequeoVencido.length} chequeo(s) veterinario(s) pendientes`, descripcion: chequeoVencido.map(a => a.nombre).join(', ') });

  // Vacas en celo
  const enCelo = animales.filter(a => a.estado_reproductivo === "En celo");
  if (enCelo.length > 0) alertas.push({ tipo: "info", titulo: `${enCelo.length} vaca(s) en celo detectado`, descripcion: enCelo.map(a => a.nombre).join(', ') });

  // Vacas abiertas sin inseminación
  const abiertas = animales.filter(a => a.estado_reproductivo === "Abierta" && a.estado === "Ordeño");
  if (abiertas.length > 0) alertas.push({ tipo: "info", titulo: `${abiertas.length} vaca(s) abiertas sin inseminación`, descripcion: abiertas.map(a => a.nombre).join(', ') });

  // Deficit financiero
  if (egresosMes > ingresosMes) alertas.push({ tipo: "warning", titulo: "Egresos superan ingresos este mes", descripcion: `Déficit de $${(egresosMes - ingresosMes).toFixed(2)}` });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-foreground">Alertas y Avisos</h2>
            {alertas.length > 0 && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">{alertas.length}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          {alertas.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-foreground">Todo en orden</p>
              <p className="text-sm text-muted-foreground mt-1">No hay alertas activas en este momento</p>
            </div>
          ) : alertas.map((a, i) => {
            const c = CONFIG_ICONS[a.tipo];
            const Icon = c.icon;
            return (
              <div key={i} className={`rounded-xl p-4 border ${c.bg} ${c.border}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.icon_color}`} />
                  <div>
                    <p className={`text-sm font-bold ${c.text}`}>{a.titulo}</p>
                    {a.descripcion && <p className={`text-xs mt-0.5 ${c.text} opacity-80`}>{a.descripcion}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}