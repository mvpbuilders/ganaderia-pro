import { useQuery } from "@tanstack/react-query";
import { dashboardService, DASHBOARD_QUERY_KEY } from "@/services/dashboardService";
import { X, AlertTriangle, CheckCircle2, Info, Bell } from "lucide-react";

const CONFIG_ICONS = {
  error: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon_color: "text-red-500" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon_color: "text-yellow-500" },
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon_color: "text-blue-500" },
  success: { icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon_color: "text-green-500" },
};

export default function AlertasPanel({ onClose }) {
  // Las alertas se calculan en el backend; aquí solo se renderizan.
  const { data: dashboard } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: dashboardService.get,
  });

  const alertas = dashboard?.alertas || [];

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
            const c = CONFIG_ICONS[a.tipo] || CONFIG_ICONS.info;
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
