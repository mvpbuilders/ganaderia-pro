import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDate, calcularEdad } from "@/lib/utils";
import EstadoBadge from "@/components/shared/EstadoBadge";
import { Search, Plus, Eye, Edit, Milk, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnimalModal from "@/components/ganado/AnimalModal";
import AnimalDetalle from "@/components/ganado/AnimalDetalle";
import { getCurrentFinca } from "@/lib/current-finca";

const FILTROS = [
  { key: "Todos", label: "Todos" },
  { key: "Ordeño", label: "Ordeño" },
  { key: "Seca", label: "Seca" },
  { key: "Preparto", label: "Preparto" },
  { key: "Ternera", label: "Terneras" },
  { key: "Vacona", label: "Vaconas" },
  { key: "Enfermería", label: "Enfermería" },
  { key: "Vendida", label: "Vendidas" },
  { key: "Muerta", label: "Muertas" },
];

export default function Ganado() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [animalEditar, setAnimalEditar] = useState(null);
  const [animalDetalle, setAnimalDetalle] = useState(null);

  const queryClient = useQueryClient();
  const hoy = new Date().toISOString().split('T')[0];

  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: animales = [], isLoading } = useQuery({
    queryKey: ['animales', fincaId],
    enabled: !!fincaId,
    queryFn: () => base44.entities.Animal.filter({ finca_id: fincaId }, '-created_date', 500),
  });

  const handleSave = () => {
    queryClient.invalidateQueries(['animales']);
    setShowModal(false);
    setAnimalEditar(null);
  };

  const filtrados = animales.filter(a => {
    const matchEstado = filtroEstado === "Todos" || a.estado === filtroEstado;
    const matchBusqueda = !busqueda ||
      a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.numero_id?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const conteos = FILTROS.slice(1).reduce((acc, f) => {
    acc[f.key] = animales.filter(a => a.estado === f.key).length;
    return acc;
  }, {});

  const totalActivos = animales.filter(a => !["Vendida", "Muerta"].includes(a.estado)).length;

  // Quick stats
  const enOrdenio = animales.filter(a => a.estado === "Ordeño").length;
  const enRetiro = animales.filter(a => a.retiro_leche_hasta && a.retiro_leche_hasta >= hoy).length;
  const produccionTotal = animales.filter(a => a.estado === "Ordeño")
    .reduce((s, a) => s + (a.produccion_am || 0) + (a.produccion_pm || 0), 0);

  if (animalDetalle) {
    return (
      <AnimalDetalle
        animal={animalDetalle}
        onBack={() => setAnimalDetalle(null)}
        onEdit={() => { setAnimalEditar(animalDetalle); setShowModal(true); }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario de Ganado</h1>
          <p className="text-muted-foreground text-sm">{totalActivos} animales activos</p>
        </div>
        <Button onClick={() => { setAnimalEditar(null); setShowModal(true); }} className="bg-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Animal</span>
        </Button>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">En Ordeño</p>
          <p className="text-2xl font-bold text-green-600">{enOrdenio}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Producción hoy</p>
          <p className="text-2xl font-bold text-primary">{produccionTotal.toFixed(0)}L</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${enRetiro > 0 ? 'bg-red-50 border-red-200' : 'bg-card border-border'}`}>
          <p className="text-xs text-muted-foreground mb-1">En retiro leche</p>
          <p className={`text-2xl font-bold ${enRetiro > 0 ? 'text-red-600' : 'text-foreground'}`}>{enRetiro}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltroEstado(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filtroEstado === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
            }`}
          >
            {f.label} {f.key !== "Todos" ? `(${conteos[f.key] || 0})` : `(${animales.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o ID..."
          className="pl-9"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Cargando animales...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <p className="text-4xl mb-3">🐄</p>
          <p className="text-foreground font-semibold">No hay animales en este filtro</p>
          <Button onClick={() => { setAnimalEditar(null); setShowModal(true); }} className="mt-4 bg-primary text-primary-foreground">
            + Agregar animal
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">ID / Nombre</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Raza</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Edad</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Estado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Reproductivo</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Grupo</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">AM / PM</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.slice(0, 100).map(animal => {
                  const enRetiro = animal.retiro_leche_hasta && animal.retiro_leche_hasta >= hoy;
                  return (
                    <tr key={animal.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setAnimalDetalle(animal)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {enRetiro && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                          <div>
                            <p className="font-semibold text-sm text-foreground">{animal.nombre}</p>
                            <p className="text-xs text-muted-foreground">{animal.numero_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{animal.raza || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{calcularEdad(animal.fecha_nacimiento)}</td>
                      <td className="px-4 py-3"><EstadoBadge estado={animal.estado} /></td>
                      <td className="px-4 py-3">
                        {animal.estado_reproductivo ? <EstadoBadge estado={animal.estado_reproductivo} type="reproductivo" /> : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{animal.grupo || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {animal.estado === "Ordeño" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Milk className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-semibold text-primary">
                              {animal.produccion_am || 0}/{animal.produccion_pm || 0}L
                            </span>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setAnimalEditar(animal); setShowModal(true); }}
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {filtrados.slice(0, 50).map(animal => {
              const enRetiro = animal.retiro_leche_hasta && animal.retiro_leche_hasta >= hoy;
              return (
                <div key={animal.id} className={`bg-card rounded-xl border p-4 ${enRetiro ? 'border-red-200' : 'border-border'}`}
                  onClick={() => setAnimalDetalle(animal)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {enRetiro && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        <p className="font-semibold text-foreground">{animal.nombre}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{animal.numero_id} · {animal.raza} · {calcularEdad(animal.fecha_nacimiento)}</p>
                    </div>
                    <EstadoBadge estado={animal.estado} />
                  </div>
                  {animal.estado === "Ordeño" && (
                    <p className="text-sm text-primary font-semibold mt-2">🥛 {(animal.produccion_am || 0) + (animal.produccion_pm || 0)}L/día (AM:{animal.produccion_am || 0} PM:{animal.produccion_pm || 0})</p>
                  )}
                  {animal.grupo && <p className="text-xs text-muted-foreground mt-1">👥 {animal.grupo}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <AnimalModal
          animal={animalEditar}
          fincaId={fincaId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}