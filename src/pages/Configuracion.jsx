import { getCurrentFinca } from "@/lib/current-finca";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configuracionService, CONFIGURACION_QUERY_KEY } from "@/services/configuracionService";
import { fincaUserService, FINCA_USERS_QUERY_KEY } from "@/services/fincaUserService";
import { animalService } from "@/services/animalService";
import { eventoService } from "@/services/eventoService";
import { inventarioIAService, INVENTARIO_IA_QUERY_KEY } from "@/services/inventarioIAService";
import { milkRecordService } from "@/services/milkRecordService";
import { financialTransactionService } from "@/services/financialTransactionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { generateRegistroLeche, generateEventos, generateTransacciones } from "@/lib/generateCleanData";

export default function Configuracion() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [isLoadingSeed, setIsLoadingSeed] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("worker");

  const { data: fincaData } = useQuery({
    queryKey: ["current-finca"],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;
  const currentRole = fincaData?.relacion?.role;
  const canManageUsers = ["owner", "admin"].includes(currentRole);

  const { data: usuariosFinca = [] } = useQuery({
    queryKey: FINCA_USERS_QUERY_KEY,
    enabled: !!fincaId,
    queryFn: fincaUserService.list,
  });

  const { data: config } = useQuery({
    queryKey: CONFIGURACION_QUERY_KEY,
    enabled: !!fincaId,
    queryFn: configuracionService.get,
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animales-config"],
    enabled: !!fincaId,
    queryFn: animalService.list,
  });

  const { data: inventarioIA = [] } = useQuery({
    queryKey: [...INVENTARIO_IA_QUERY_KEY, "disponible"],
    enabled: !!fincaId,
    queryFn: () => inventarioIAService.list({ disponibles: true }),
  });

  const animalesOrdenio = animales.filter((a) => a.estado === "Ordeño");

  const saveMutation = useMutation({
    mutationFn: (data) => configuracionService.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFIGURACION_QUERY_KEY });
      toast.success("Configuración guardada");
    },
    onError: (error) => {
      toast.error(error.message || "Error al guardar la configuración");
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleSeedData = async () => {
    if (animalesOrdenio.length === 0) {
      toast.error("No hay animales en estado 'Ordeño'");
      return;
    }

    setIsLoadingSeed(true);
    try {
      const animalIds = animalesOrdenio.map((a) => a.id);
      const animalNames = animalesOrdenio.map((a) => a.nombre);

      // El backend resuelve finca_id desde el token; el frontend nunca lo envía.
      const registroLeche = generateRegistroLeche(animalIds, animalNames);
      const stockPajuelas = inventarioIA.reduce(
        (sum, item) => sum + Number(item.stock_actual || 0),
        0
      );
      const eventos = generateEventos(animalIds, animalNames, inventarioIA);
      const transacciones = generateTransacciones();

      if (stockPajuelas === 0) {
        toast.warning("Datos demo: se omitieron inseminaciones porque no hay pajuelas disponibles.");
      } else if (stockPajuelas < 8) {
        toast.warning(`Datos demo: solo se generaron ${stockPajuelas} inseminaciones con pajuela disponible.`);
      }

      await milkRecordService.bulkUpsert(registroLeche);
      await Promise.all(eventos.map((e) => eventoService.create(e)));
      await Promise.all(transacciones.map((t) => financialTransactionService.create(t)));

      queryClient.invalidateQueries({ queryKey: ["milk_records"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      queryClient.invalidateQueries({ queryKey: INVENTARIO_IA_QUERY_KEY });

      toast.success(
        `✅ Datos generados: ${registroLeche.length} registros lecheros, ${eventos.length} eventos, ${transacciones.length} transacciones`
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoadingSeed(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !fincaId) return;

    try {
      await fincaUserService.invite(inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail("");
      setInviteRole("worker");
      queryClient.invalidateQueries({ queryKey: FINCA_USERS_QUERY_KEY });
      toast.success("Usuario invitado correctamente");
    } catch (error) {
      toast.error(error.message || "No se pudo invitar al usuario");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración de Finca</h1>
        <p className="text-muted-foreground text-sm">Parámetros operacionales y datos de farm</p>
      </div>

      <Card className="p-6 border border-border">
        <div className="space-y-4">
          <div>
            <Label>Nombre de la Finca</Label>
            <Input
              value={formData.nombre_finca || ""}
              onChange={(e) => handleInputChange("nombre_finca", e.target.value)}
              placeholder="Ej. Hacienda El Paraíso"
            />
          </div>

          <div>
            <Label>Propietario</Label>
            <Input
              value={formData.propietario || ""}
              onChange={(e) => handleInputChange("propietario", e.target.value)}
              placeholder="Nombre del propietario"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Provincia</Label>
              <Input
                value={formData.provincia || ""}
                onChange={(e) => handleInputChange("provincia", e.target.value)}
                placeholder="Pichincha"
              />
            </div>
            <div>
              <Label>Cantón</Label>
              <Input
                value={formData.canton || ""}
                onChange={(e) => handleInputChange("canton", e.target.value)}
                placeholder="Mejía"
              />
            </div>
          </div>

          <div>
            <Label>Teléfono</Label>
            <Input
              value={formData.telefono || ""}
              onChange={(e) => handleInputChange("telefono", e.target.value)}
              placeholder="+593..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio por Litro (USD)</Label>
              <Input
                type="number"
                value={formData.precio_litro_usd ?? 0.42}
                onChange={(e) => handleInputChange("precio_litro_usd", parseFloat(e.target.value))}
                step="0.01"
              />
            </div>
            <div>
              <Label>Meta Producción Diaria (L)</Label>
              <Input
                type="number"
                value={formData.meta_produccion_diaria || ""}
                onChange={(e) => handleInputChange("meta_produccion_diaria", parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Hectáreas Totales</Label>
              <Input
                type="number"
                value={formData.hectareas_totales || ""}
                onChange={(e) => handleInputChange("hectareas_totales", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label>Días Gestación</Label>
              <Input
                type="number"
                value={formData.dias_gestacion ?? 280}
                onChange={(e) => handleInputChange("dias_gestacion", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Chequeo Post-IA (días)</Label>
              <Input
                type="number"
                value={formData.dias_chequeo_post_inseminacion ?? 35}
                onChange={(e) => handleInputChange("dias_chequeo_post_inseminacion", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Días para Secado</Label>
              <Input
                type="number"
                value={formData.dias_para_secado ?? 210}
                onChange={(e) => handleInputChange("dias_para_secado", parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        </div>
      </Card>

      {canManageUsers && (
        <Card className="p-6 border border-border">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Usuarios de la finca
              </h2>
              <p className="text-sm text-muted-foreground">
                Invitá personas para que accedan a esta misma finca.
              </p>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="empleado@email.com"
              />
            </div>

            <div>
              <Label>Rol</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="worker">Empleado</option>
                <option value="admin">Administrador</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <Button
              onClick={handleInviteUser}
              disabled={!inviteEmail || !fincaId}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invitar usuario
            </Button>

            {usuariosFinca.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-medium mb-3">Usuarios actuales</h3>

                <div className="space-y-2">
                  {usuariosFinca.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium">{usuario.email}</p>
                      </div>

                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {usuario.role === "owner"
                          ? "Owner"
                          : usuario.role === "admin"
                          ? "Administrador"
                          : "Empleado"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 border border-border bg-accent/5">
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Generar Datos Históricos (Marzo–Mayo 2026)
          </h2>
          <p className="text-sm text-muted-foreground">
            Crea registros de producción lechera, eventos (reproducción, salud) y transacciones financieras para los últimos 3 meses.
            Esto poblará dashboards, reportes y gráficos con datos reales.
          </p>
          <p className="text-sm text-foreground font-medium">
            {animalesOrdenio.length > 0
              ? `✓ ${animalesOrdenio.length} vacas en Ordeño listas`
              : "⚠️ Se necesitan animales en estado 'Ordeño'"}
          </p>
          <Button
            onClick={handleSeedData}
            disabled={isLoadingSeed || animalesOrdenio.length === 0}
            className="gap-2 bg-primary text-primary-foreground w-full"
          >
            {isLoadingSeed ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando datos...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Generar Datos Históricos
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
