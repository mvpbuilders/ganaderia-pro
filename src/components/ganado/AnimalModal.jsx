import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const RAZAS = ["Holstein", "Jersey", "Brown Swiss", "Montbeliarde", "Mestiza", "Otra"];
const ESTADOS = ["Ordeño", "Seca", "Preparto", "Ternera", "Vacona", "Enfermería", "Vendida", "Muerta"];
const ESTADOS_REPRO = ["Abierta", "En celo", "Inseminada", "Pendiente chequeo", "Preñada positiva", "Negativa", "Dudosa", "Aborto"];

export default function AnimalModal({ animal, fincaId, onClose, onSave }) {
  const [form, setForm] = useState(animal ? {
    ...animal,
    raza: animal.raza || "Holstein",
    sexo: animal.sexo || "Hembra",
    estado: animal.estado || "Ordeño",
    estado_reproductivo: animal.estado_reproductivo || "Abierta",
  } : {
    nombre: "", numero_id: "", raza: "Holstein", fecha_nacimiento: "",
    sexo: "Hembra", estado: "Ordeño", estado_reproductivo: "Abierta",
    grupo: "", peso_kg: "", produccion_am: "", produccion_pm: "",
    produccion_diaria_litros: "", racion_actual: "", notas: "",
    padre_nombre: "", madre_id: ""
  });
  const [loading, setLoading] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.nombre) return;
    setLoading(true);
    const am = form.produccion_am ? Number(form.produccion_am) : undefined;
    const pm = form.produccion_pm ? Number(form.produccion_pm) : undefined;
    const data = {
      ...form,
      finca_id: fincaId,
      peso_kg: form.peso_kg ? Number(form.peso_kg) : undefined,
      produccion_am: am,
      produccion_pm: pm,
      produccion_diaria_litros:
        (am || 0) + (pm || 0) ||
        (form.produccion_diaria_litros
          ? Number(form.produccion_diaria_litros)
          : undefined),
    };
    if (animal?.id) await base44.entities.Animal.update(animal.id, data);
    else await base44.entities.Animal.create(data);
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">{animal ? "Editar Animal" : "Nuevo Animal"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Identificación */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Identificación</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Nombre *</Label>
              <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Estrella" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">ID / Arete</Label>
              <Input value={form.numero_id} onChange={e => set("numero_id", e.target.value)} placeholder="EC-0001" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Raza</Label>
              <Select value={form.raza} onValueChange={v => set("raza", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RAZAS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Sexo</Label>
              <Select value={form.sexo} onValueChange={v => set("sexo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hembra">Hembra</SelectItem>
                  <SelectItem value="Macho">Macho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Fecha Nacimiento</Label>
              <Input type="date" value={form.fecha_nacimiento || ""} onChange={e => set("fecha_nacimiento", e.target.value)} />
            </div>
          </div>

          {/* Estado */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-2">Estado</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Estado productivo</Label>
              <Select value={form.estado} onValueChange={v => set("estado", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Estado reproductivo</Label>
              <Select value={form.estado_reproductivo} onValueChange={v => set("estado_reproductivo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS_REPRO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Grupo / Lote</Label>
              <Input value={form.grupo || ""} onChange={e => set("grupo", e.target.value)} placeholder="Ej: Lote Alto" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Peso (kg)</Label>
              <Input type="number" value={form.peso_kg || ""} onChange={e => set("peso_kg", e.target.value)} placeholder="450" />
            </div>
          </div>

          {/* Producción */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-2">Producción</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Litros AM</Label>
              <Input type="number" step="0.1" value={form.produccion_am || ""} onChange={e => set("produccion_am", e.target.value)} placeholder="12.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Litros PM</Label>
              <Input type="number" step="0.1" value={form.produccion_pm || ""} onChange={e => set("produccion_pm", e.target.value)} placeholder="10.5" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Ración actual</Label>
            <Input value={form.racion_actual || ""} onChange={e => set("racion_actual", e.target.value)} placeholder="Ej: Balanceado 5kg + pasto" />
          </div>

          {/* Reproducción */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-2">Reproducción</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Último Parto</Label>
              <Input type="date" value={form.fecha_ultimo_parto || ""} onChange={e => set("fecha_ultimo_parto", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Próx. Parto estimado</Label>
              <Input type="date" value={form.fecha_proxima_cria || ""} onChange={e => set("fecha_proxima_cria", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Fecha Secado estimado</Label>
              <Input type="date" value={form.fecha_secado || ""} onChange={e => set("fecha_secado", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Retiro leche hasta</Label>
              <Input type="date" value={form.retiro_leche_hasta || ""} onChange={e => set("retiro_leche_hasta", e.target.value)} />
            </div>
          </div>

          {/* Pedigree */}
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-2">Pedigree</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Nombre del Padre</Label>
              <Input value={form.padre_nombre || ""} onChange={e => set("padre_nombre", e.target.value)} placeholder="Ej: Campeón 5" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">ID de la Madre</Label>
              <Input value={form.madre_id || ""} onChange={e => set("madre_id", e.target.value)} placeholder="EC-0002" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Notas</Label>
            <Input value={form.notas || ""} onChange={e => set("notas", e.target.value)} placeholder="Observaciones..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !form.nombre} className="flex-1 bg-primary text-primary-foreground">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}