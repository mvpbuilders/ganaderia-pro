import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const ESTADOS = ["Disponible", "Pastoreando", "Descansando", "Critico"];

export default function PotreroModal({ potrero, fincaId, onClose, onSave }) {
  const [form, setForm] = useState(potrero ? {
    ...potrero,
    estado: potrero.estado || "Disponible",
  } : {
    nombre: "", numero: "", estado: "Disponible", hectareas: "",
    tipo_pasto: "", capacidad_animales: "", animales_actuales: "", notas: ""
  });
  const [loading, setLoading] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.nombre) return;
    setLoading(true);
    const data = {
      ...form,
      finca_id: fincaId,
      hectareas: form.hectareas ? Number(form.hectareas) : undefined,
      capacidad_animales: form.capacidad_animales ? Number(form.capacidad_animales) : undefined,
      animales_actuales: form.animales_actuales ? Number(form.animales_actuales) : undefined,
    };
    if (potrero?.id) await base44.entities.Potrero.update(potrero.id, data);
    else await base44.entities.Potrero.create(data);
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">{potrero ? "Editar Potrero" : "Nuevo Potrero"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Nombre *</Label>
              <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Potrero A" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Número</Label>
              <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Estado</Label>
            <Select value={form.estado} onValueChange={v => set("estado", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Hectáreas</Label>
              <Input type="number" value={form.hectareas} onChange={e => set("hectareas", e.target.value)} placeholder="4.5" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Tipo de Pasto</Label>
              <Input value={form.tipo_pasto} onChange={e => set("tipo_pasto", e.target.value)} placeholder="Rye grass" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Capacidad</Label>
              <Input type="number" value={form.capacidad_animales} onChange={e => set("capacidad_animales", e.target.value)} placeholder="50" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Animales actuales</Label>
              <Input type="number" value={form.animales_actuales} onChange={e => set("animales_actuales", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Último uso</Label>
              <Input type="date" value={form.ultimo_uso || ""} onChange={e => set("ultimo_uso", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Próx. uso</Label>
              <Input type="date" value={form.proximo_uso || ""} onChange={e => set("proximo_uso", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Notas</Label>
            <Input value={form.notas} onChange={e => set("notas", e.target.value)} placeholder="Observaciones..." />
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