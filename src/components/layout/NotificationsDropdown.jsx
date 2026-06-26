import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService, DASHBOARD_QUERY_KEY } from "@/services/dashboardService";
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

  // Las notificaciones provienen de las alertas calculadas en el backend.
  const { data: dashboard } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardService.get,
  });

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const alertas = dashboard?.alertas || [];
  const notifications = alertas.length > 0
    ? alertas.map((a) => ({ type: a.tipo, title: a.titulo, desc: a.descripcion }))
    : [{ type: "success", title: "Todo en orden", desc: "No hay alertas activas en este momento." }];

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
          const { icon: Icon, color, bg } = typeConfig[n.type] || typeConfig.info;
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
