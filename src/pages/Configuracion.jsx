import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateRegistroLeche, generateEventos, generateTransacciones } from "@/lib/generateCleanData";

export default function Configuracion() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [isLoadingSeed, setIsLoadingSeed] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["configuracion"],
    queryFn: async () => {
      const items = await base44.entities.Configuracion.list();
      return items[0] || {};
    },
  });

  const { data: animalesOrdenio = [] } = useQuery({
    queryKey: ["animales-ordenio"],
    queryFn: () => base44.entities.Animal.filter({ estado: "Ordeño" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config.id) {
        return base44.entities.Configuracion.update(config.id, data);
      } else {
        return base44.entities.Configuracion.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      toast.success("Configuración guardada");
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const animalIds = animalesOrdenio.map(a => a.id);
      const animalNames = animalesOrdenio.map(a => a.nombre);

      // Generate all data
      const registroLeche = generateRegistroLeche(animalIds, animalNames);
      const eventos = generateEventos(animalIds, animalNames);
      const transacciones = generateTransacciones();

      // Bulk insert
      await base44.entities.RegistroLeche.bulkCreate(registroLeche);
      await base44.entities.Evento.bulkCreate(eventos);
      await base44.entities.Transaccion.bulkCreate(transacciones);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["registros-leche"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["transacciones"] });
      queryClient.invalidateQueries({ queryKey: ["leche-reciente"] });

      toast.success(
        `✅ Datos generados: ${registroLeche.length} registros lecheros, ${eventos.length} eventos, ${transacciones.length} transacciones`
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoadingSeed(false);
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
                value={formData.precio_litro_usd || 0.42}
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

          <div className="grid grid-cols-3 gap-4">
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
                value={formData.dias_gestacion || 280}
                onChange={(e) => handleInputChange("dias_gestacion", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Chequeo Post-IA (días)</Label>
              <Input
                type="number"
                value={formData.dias_chequeo_post_inseminacion || 35}
                onChange={(e) => handleInputChange("dias_chequeo_post_inseminacion", parseInt(e.target.value))}
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