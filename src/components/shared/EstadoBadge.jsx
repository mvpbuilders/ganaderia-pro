import { cn } from "@/lib/utils";

const ESTADO_COLORS = {
  "Ordeño": "bg-green-100 text-green-700",
  "Lactando": "bg-green-100 text-green-700",
  "Seca": "bg-yellow-100 text-yellow-700",
  "Preparto": "bg-blue-100 text-blue-700",
  "Preñada": "bg-blue-100 text-blue-700",
  "Ternera": "bg-purple-100 text-purple-700",
  "Ternero": "bg-purple-100 text-purple-700",
  "Vacona": "bg-orange-100 text-orange-700",
  "Enfermería": "bg-red-100 text-red-700",
  "Enferma": "bg-red-100 text-red-700",
  "Vendida": "bg-gray-100 text-gray-500",
  "Vendido": "bg-gray-100 text-gray-500",
  "Muerta": "bg-gray-100 text-gray-400",
  "Muerto": "bg-gray-100 text-gray-400",
};

const ESTADO_REPRO_COLORS = {
  "Abierta": "bg-orange-100 text-orange-700",
  "En celo": "bg-pink-100 text-pink-700",
  "Inseminada": "bg-blue-100 text-blue-700",
  "Pendiente chequeo": "bg-yellow-100 text-yellow-700",
  "Preñada positiva": "bg-green-100 text-green-700",
  "Negativa": "bg-red-100 text-red-700",
  "Dudosa": "bg-gray-100 text-gray-600",
  "Aborto": "bg-red-200 text-red-800",
};

export default function EstadoBadge({ estado, type = "estado", size = "sm" }) {
  const colorMap = type === "reproductivo" ? ESTADO_REPRO_COLORS : ESTADO_COLORS;
  const color = colorMap[estado] || "bg-gray-100 text-gray-600";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-semibold rounded-full",
      color,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {estado}
    </span>
  );
}