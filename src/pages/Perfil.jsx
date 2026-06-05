import { getCurrentFinca } from "@/lib/current-finca";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { User, LogOut, Save } from "lucide-react";
import { toast } from "sonner";

export default function Perfil() {
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: configs = [] } = useQuery({
    queryKey: ['configuracion', fincaId],
    enabled: !!fincaId,
    queryFn: () => base44.entities.Configuracion.filter({ finca_id: fincaId }),
  });

  const config = configs[0] || {};

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  return (
    <div className="max-w-lg space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground text-sm">Tu cuenta y finca</p>
      </div>

      {/* User Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-foreground">{user?.full_name || 'Usuario'}</h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mt-1">
              {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Correo</span>
            <span className="font-medium text-foreground">{user?.email}</span>
          </div>
          {config.nombre_finca && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Finca</span>
              <span className="font-medium text-foreground">{config.nombre_finca}</span>
            </div>
          )}
          {config.provincia && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ubicación</span>
              <span className="font-medium text-foreground">{config.canton}, {config.provincia}</span>
            </div>
          )}
          {config.precio_litro_usd && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio por litro</span>
              <span className="font-medium text-foreground">${config.precio_litro_usd}</span>
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-3">Acerca de GanaderíaPro</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>🐄 Gestión completa de tu ganadería lechera</p>
          <p>🇪🇨 Diseñado para fincas de Ecuador</p>
          <p>📱 Funciona en móvil y escritorio</p>
          <p>💡 Versión 1.0.0</p>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 gap-2 border-red-200 text-red-500 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </Button>
    </div>
  );
}