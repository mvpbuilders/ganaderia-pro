import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, DollarSign, BarChart2, Milk, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import CowIcon from "@/components/icons/CowIcon.jsx";
import { useAuth } from "@/lib/AuthContext";
import { isPlatformAdmin } from "@/lib/platform-admins"; 

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Inicio" },
  { path: "/ganado", icon: CowIcon, label: "Ganado" },
  { path: "/registro-leche", icon: Milk, label: "Leche" },
  { path: "/finanzas", icon: DollarSign, label: "Finanzas" },
  { path: "/reportes", icon: BarChart2, label: "Reportes" },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

const items = isPlatformAdmin(user)
  ? [...navItems, { path: "/admin", icon: Shield, label: "Admin" }]
  : navItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
            >
              {Icon ? (
                <Icon className={cn("w-5 h-5", active ? "text-sidebar-primary" : "text-sidebar-foreground opacity-70")} />
              ) : (
                <span className="w-5 h-5 text-center text-base leading-5">{item.emoji}</span>
              )}
              <span className={cn("text-xs", active ? "text-sidebar-primary font-semibold" : "text-sidebar-foreground opacity-70")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}