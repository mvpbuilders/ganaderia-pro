import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat('es-EC').format(num);
}

export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "-";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const diffMs = hoy - nacimiento;
  const años = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  const meses = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  if (años > 0) return `${años} año${años !== 1 ? 's' : ''}`;
  return `${meses} mes${meses !== 1 ? 'es' : ''}`;
}

export function getEstadoColor(estado) {
  const colors = {
    "Lactando": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
    "Seca": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
    "Preñada": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    "Enferma": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
    "Ternero": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
    "Vendido": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
    "Muerto": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
    "Disponible": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
    "Pastoreando": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    "Descansando": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
    "Critico": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  };
  return colors[estado] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" };
}

export function getTipoEventoColor(tipo) {
  const colors = {
    "Produccion": { bg: "bg-green-100", text: "text-green-700" },
    "Parto": { bg: "bg-blue-100", text: "text-blue-700" },
    "Muerte": { bg: "bg-gray-100", text: "text-gray-700" },
    "Venta": { bg: "bg-yellow-100", text: "text-yellow-700" },
    "Enfermedad": { bg: "bg-red-100", text: "text-red-700" },
    "Tratamiento": { bg: "bg-orange-100", text: "text-orange-700" },
    "Inseminacion": { bg: "bg-purple-100", text: "text-purple-700" },
    "Destete": { bg: "bg-blue-100", text: "text-blue-700" },
    "Otro": { bg: "bg-gray-100", text: "text-gray-700" },
  };
  return colors[tipo] || { bg: "bg-gray-100", text: "text-gray-700" };
}

export function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

export function getMonthName(monthIndex) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return months[monthIndex];
}