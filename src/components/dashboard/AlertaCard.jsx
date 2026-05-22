import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertTypes = {
  warning: { icon: AlertTriangle, color: "bg-yellow-50 border-yellow-200 text-yellow-800", iconColor: "text-yellow-500" },
  info: { icon: Info, color: "bg-blue-50 border-blue-200 text-blue-800", iconColor: "text-blue-500" },
  success: { icon: CheckCircle, color: "bg-green-50 border-green-200 text-green-800", iconColor: "text-green-500" },
  error: { icon: XCircle, color: "bg-red-50 border-red-200 text-red-800", iconColor: "text-red-500" },
};

export default function AlertaCard({ tipo = "info", titulo, descripcion }) {
  const config = alertTypes[tipo];
  const Icon = config.icon;
  
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border text-sm", config.color)}>
      <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", config.iconColor)} />
      <div>
        <p className="font-semibold">{titulo}</p>
        {descripcion && <p className="opacity-80 mt-0.5">{descripcion}</p>}
      </div>
    </div>
  );
}