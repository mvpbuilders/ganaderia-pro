import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDate, getEstadoColor } from "@/lib/utils";
import { Plus, Edit, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import EstadoBadge from "@/components/shared/EstadoBadge";
import PotreroModal from "@/components/potreros/PotreroModal";
import { getCurrentFinca } from "@/lib/current-finca";

export default function Potreros() {
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const queryClient = useQueryClient();
  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: potreros = [], isLoading } = useQuery({
    queryKey: ['potreros', fincaId],
    enabled: !!fincaId,
    queryFn: () =>
      base44.entities.Potrero.filter(
        { finca_id: fincaId },
        '-created_date',
        100
      ),
  });

  const estadoColors = {
    "Disponible": "border-green-200 bg-green-50",
    "Pastoreando": "border-blue-200 bg-blue-50",
    "Descansando": "border-yellow-200 bg-yellow-50",
    "Critico": "border-red-200 bg-red-50",
  };

  const estadoEmoji = {
    "Disponible": "✅",
    "Pastoreando": "🐄",
    "Descansando": "😴",
    "Critico": "⚠️",
  };

  const resumen = {
    Disponible: potreros.filter(p => p.estado === "Disponible").length,
    Pastoreando: potreros.filter(p => p.estado === "Pastoreando").length,
    Descansando: potreros.filter(p => p.estado === "Descansando").length,
    Critico: potreros.filter(p => p.estado === "Critico").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Potreros</h1>
          <p className="text-muted-foreground text-sm">{potreros.length} potreros registrados</p>
        </div>
        <Button onClick={() => { setEditando(null); setShowModal(true); }} className="bg-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Potrero</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(resumen).map(([estado, count]) => {
          const colors = getEstadoColor(estado);
          return (
            <div key={estado} className={`rounded-xl border p-4 ${estadoColors[estado]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{estadoEmoji[estado]}</span>
                <span className="text-xs font-semibold text-muted-foreground">{estado}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">potreros</p>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Cargando potreros...</div>
      ) : potreros.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-foreground font-semibold">No hay potreros</p>
          <p className="text-muted-foreground text-sm mt-1">Registra tus áreas de pastoreo</p>
          <Button onClick={() => { setEditando(null); setShowModal(true); }} className="mt-4 bg-primary text-primary-foreground">
            + Agregar potrero
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {potreros.map(potrero => (
            <div key={potrero.id} className={`rounded-xl border-2 p-5 transition-all hover:shadow-md ${estadoColors[potrero.estado] || 'border-border bg-card'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{potrero.nombre}</h3>
                  <p className="text-xs text-muted-foreground">Potrero {potrero.numero}</p>
                </div>
                <EstadoBadge estado={potrero.estado} />
              </div>

              <div className="space-y-2 mb-4">
                {potrero.hectareas && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hectáreas</span>
                    <span className="font-semibold text-foreground">{potrero.hectareas} ha</span>
                  </div>
                )}
                {potrero.tipo_pasto && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pasto</span>
                    <span className="font-semibold text-foreground">{potrero.tipo_pasto}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Animales</span>
                  <span className="font-semibold text-foreground">
                    {potrero.animales_actuales || 0} / {potrero.capacidad_animales || '-'}
                  </span>
                </div>
                {potrero.animales_actuales > 0 && potrero.capacidad_animales > 0 && (
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((potrero.animales_actuales / potrero.capacidad_animales) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {potrero.ultimo_uso && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Último uso</span>
                    <span className="font-semibold text-foreground">{formatDate(potrero.ultimo_uso)}</span>
                  </div>
                )}
              </div>

              {potrero.notas && (
                <p className="text-xs text-muted-foreground bg-white/60 rounded-lg px-2 py-1.5 mb-3">{potrero.notas}</p>
              )}

              <button
                onClick={() => { setEditando(potrero); setShowModal(true); }}
                className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 hover:bg-white/50 rounded-lg transition-all"
              >
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PotreroModal
          potrero={editando}
          fincaId={fincaId}
          onClose={() => { setShowModal(false); setEditando(null); }}
          onSave={() => { queryClient.invalidateQueries(['potreros', fincaId]); setShowModal(false); }}
        />
      )}
    </div>
  );
}