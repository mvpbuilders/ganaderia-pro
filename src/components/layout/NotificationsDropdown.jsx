import { getCurrentFinca } from "@/lib/current-finca";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  error:   { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50 border-red-100" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-100" },
  success: { icon: CheckCircle,   color: "text-green-500",  bg: "bg-green-50 border-green-100" },
  info:    { icon: Info,          color: "text-blue-500",   bg: "bg-blue-50 border-blue-100" },
};

export default function NotificationsDropdown({ onClose }) {
  const ref = useRef(null);
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

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.Transaccion.filter(
        { finca_id: fincaId },
        '-fecha',
        200
      ),
  });

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Build notifications from live data
  const notifications = [];

  const enfermas = animales.filter(a => a.estado === 'Enferma');
  if (enfermas.length > 0) {
    notifications.push({
      type: "error",
      title: `${enfermas.length} animales enfermos`,
      desc: enfermas.slice(0, 2).map(a => a.nombre || a.numero_id).join(", ") + (enfermas.length > 2 ? "..." : ""),
    });
  }

  const partoInminente = animales.filter(a => {
    if (!a.fecha_proxima_cria) return false;
    const days = (new Date(a.fecha_proxima_cria) - new Date()) / 86400000;
    return days >= 0 && days <= 14;
  });
  if (partoInminente.length > 0) {
    notifications.push({
      type: "warning",
      title: `${partoInminente.length} partos en ≤ 14 días`,
      desc: partoInminente.slice(0, 2).map(a => `${a.nombre || a.numero_id} (${new Date(a.fecha_proxima_cria).toLocaleDateString('es-EC')})`).join(", "),
    });
  }

  const prenadas = animales.filter(a => a.estado === 'Preñada');
  if (prenadas.length > 0) {
    notifications.push({
      type: "info",
      title: `${prenadas.length} vacas preñadas`,
      desc: "Verificar fechas de parto y preparar maternidad",
    });
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const transaccionesMes = transacciones.filter(t => {
    const d = new Date(t.fecha);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const ingresos = transaccionesMes.filter(t => t.tipo === 'Ingreso').reduce((s, t) => s + t.monto_usd, 0);
  const egresos = transaccionesMes.filter(t => t.tipo === 'Egreso').reduce((s, t) => s + t.monto_usd, 0);
  if (egresos > ingresos && egresos > 0) {
    notifications.push({
      type: "warning",
      title: "Gastos superan ingresos este mes",
      desc: `Déficit de $${(egresos - ingresos).toFixed(2)}`,
    });
  }

  const lactando = animales.filter(a => a.estado === 'Lactando');
  const totalProd = lactando.reduce((s, a) => s + (a.produccion_diaria_litros || 0), 0);
  if (totalProd > 0) {
    notifications.push({
      type: "success",
      title: `${totalProd.toLocaleString('es-EC')}L producción estimada hoy`,
      desc: `${lactando.length} vacas lactando · promedio ${lactando.length > 0 ? (totalProd / lactando.length).toFixed(1) : 0}L/vaca`,
    });
  }

  if (notifications.length === 0) {
    notifications.push({ type: "success", title: "Todo en orden", desc: "No hay alertas activas en este momento." });
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Notificaciones</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {notifications.map((n, i) => {
          const { icon: Icon, color, bg } = typeConfig[n.type];
          return (
            <div key={i} className={cn("flex items-start gap-3 px-4 py-3", bg)}>
              <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
              <div>
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                {n.desc && <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}