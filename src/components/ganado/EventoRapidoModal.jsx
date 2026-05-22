import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ACCIONES = [
  { key: "parto", label: "Registrar Parto", emoji: "🐣", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { key: "inseminacion", label: "Inseminación", emoji: "🧬", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { key: "celo", label: "Celo detectado", emoji: "💕", color: "bg-pink-50 border-pink-200 text-pink-700" },
  { key: "chequeo", label: "Chequeo veterinario", emoji: "🩺", color: "bg-green-50 border-green-200 text-green-700" },
  { key: "tratamiento", label: "Tratamiento", emoji: "💊", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { key: "vacuna", label: "Vacuna", emoji: "💉", color: "bg-cyan-50 border-cyan-200 text-cyan-700" },
  { key: "enfermedad", label: "Enfermedad", emoji: "🤒", color: "bg-red-50 border-red-200 text-red-700" },
  { key: "grupo", label: "Cambio de Grupo", emoji: "👥", color: "bg-gray-50 border-gray-200 text-gray-700" },
];

export default function EventoRapidoModal({ animal, onClose, onSave }) {
  const [accion, setAccion] = useState(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    sexo_cria: "Hembra", nombre_cria: "", peso_cria: "",
    veterinario: "", medicamento: "", dosis: "",
    requiere_retiro_leche: false, dias_retiro: "",
    resultado: "", grupo_nuevo: "", notas: ""
  });
  const [loading, setLoading] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setLoading(true);
    const today = form.fecha;
    const eventoData = {
      fecha: today,
      animal_id: animal.id,
      animal_nombre: animal.nombre,
      notas: form.notas,
    };

    if (accion === "parto") {
      Object.assign(eventoData, {
        tipo: "Parto", sexo_cria: form.sexo_cria,
        nombre_cria: form.nombre_cria, peso_cria: form.peso_cria ? Number(form.peso_cria) : undefined,
      });
      // Auto-calc next checkup date (35 days)
      const nextCheck = new Date(today);
      nextCheck.setDate(nextCheck.getDate() + 35);
      await base44.entities.Animal.update(animal.id, {
        fecha_ultimo_parto: today,
        estado_reproductivo: "Abierta",
        estado: "Ordeño",
      });
    } else if (accion === "inseminacion") {
      Object.assign(eventoData, { tipo: "Inseminacion", veterinario: form.veterinario });
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + 35);
      await base44.entities.Animal.update(animal.id, {
        estado_reproductivo: "Inseminada",
        fecha_proximo_chequeo: checkDate.toISOString().split('T')[0],
      });
    } else if (accion === "celo") {
      Object.assign(eventoData, { tipo: "Celo" });
      await base44.entities.Animal.update(animal.id, { estado_reproductivo: "En celo" });
    } else if (accion === "chequeo") {
      Object.assign(eventoData, { tipo: "Chequeo veterinario", veterinario: form.veterinario, resultado: form.resultado });
      const updates = { fecha_ultimo_chequeo: today, estado_reproductivo: form.resultado || animal.estado_reproductivo };
      if (form.resultado === "Preñada positiva") {
        const partoDate = new Date(today);
        partoDate.setDate(partoDate.getDate() + 210);
        const secadoDate = new Date(today);
        secadoDate.setDate(secadoDate.getDate() + 150);
        updates.fecha_proxima_cria = partoDate.toISOString().split('T')[0];
        updates.fecha_secado = secadoDate.toISOString().split('T')[0];
      }
      await base44.entities.Animal.update(animal.id, updates);
    } else if (accion === "tratamiento") {
      const retiro = form.dias_retiro ? Number(form.dias_retiro) : 0;
      Object.assign(eventoData, {
        tipo: "Tratamiento", medicamento: form.medicamento, dosis: form.dosis,
        veterinario: form.veterinario, requiere_retiro_leche: form.requiere_retiro_leche,
        dias_retiro: retiro,
      });
      if (form.requiere_retiro_leche && retiro > 0) {
        const retiroDate = new Date(today);
        retiroDate.setDate(retiroDate.getDate() + retiro);
        await base44.entities.Animal.update(animal.id, {
          retiro_leche_hasta: retiroDate.toISOString().split('T')[0],
          estado: "Enfermería",
        });
      }
    } else if (accion === "vacuna") {
      Object.assign(eventoData, { tipo: "Vacuna", medicamento: form.medicamento, veterinario: form.veterinario });
    } else if (accion === "enfermedad") {
      Object.assign(eventoData, { tipo: "Enfermedad", descripcion: form.notas });
      await base44.entities.Animal.update(animal.id, { estado: "Enfermería" });
    } else if (accion === "grupo") {
      Object.assign(eventoData, { tipo: "Cambio de grupo", grupo_anterior: animal.grupo, grupo_nuevo: form.grupo_nuevo });
      await base44.entities.Animal.update(animal.id, { grupo: form.grupo_nuevo });
    }

    await base44.entities.Evento.create(eventoData);
    setLoading(false);
    toast.success("Evento registrado correctamente");
    onSave();
  };

  if (!accion) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-bold text-lg text-foreground">Nuevo Registro</h2>
              <p className="text-xs text-muted-foreground">{animal.nombre} · {animal.numero_id}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {ACCIONES.map(({ key, label, emoji, color }) => (
              <button key={key} onClick={() => setAccion(key)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${color}`}>
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const accionInfo = ACCIONES.find(a => a.key === accion);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-lg text-foreground">{accionInfo?.label}</h2>
            <p className="text-xs text-muted-foreground">{animal.nombre} · {animal.numero_id}</p>
          </div>
          <button onClick={() => setAccion(null)} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Fecha</Label>
            <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
          </div>

          {accion === "parto" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Sexo de la cría</Label>
                  <Select value={form.sexo_cria} onValueChange={v => set("sexo_cria", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hembra">Hembra</SelectItem>
                      <SelectItem value="Macho">Macho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Peso cría (kg)</Label>
                  <Input type="number" value={form.peso_cria} onChange={e => set("peso_cria", e.target.value)} placeholder="35" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Nombre de la cría</Label>
                <Input value={form.nombre_cria} onChange={e => set("nombre_cria", e.target.value)} placeholder="Opcional" />
              </div>
            </>
          )}

          {(accion === "inseminacion" || accion === "chequeo" || accion === "tratamiento" || accion === "vacuna") && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Veterinario</Label>
              <Input value={form.veterinario} onChange={e => set("veterinario", e.target.value)} placeholder="Nombre del veterinario" />
            </div>
          )}

          {accion === "chequeo" && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Resultado</Label>
              <Select value={form.resultado || "Pendiente chequeo"} onValueChange={v => set("resultado", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Preñada positiva", "Negativa", "Dudosa", "Pendiente chequeo"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(accion === "tratamiento" || accion === "vacuna") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Medicamento / Vacuna</Label>
                <Input value={form.medicamento} onChange={e => set("medicamento", e.target.value)} placeholder="Ej: Ivermectina" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Dosis</Label>
                <Input value={form.dosis} onChange={e => set("dosis", e.target.value)} placeholder="5ml" />
              </div>
            </div>
          )}

          {accion === "tratamiento" && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiere_retiro_leche}
                  onChange={e => set("requiere_retiro_leche", e.target.checked)}
                  className="rounded border-border" />
                <span className="text-sm font-semibold text-foreground">Requiere retiro de leche</span>
              </label>
              {form.requiere_retiro_leche && (
                <div className="mt-2">
                  <Label className="text-xs font-semibold mb-1.5 block">Días de retiro</Label>
                  <Input type="number" value={form.dias_retiro} onChange={e => set("dias_retiro", e.target.value)} placeholder="7" />
                </div>
              )}
            </div>
          )}

          {accion === "grupo" && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Nuevo Grupo</Label>
              <Input value={form.grupo_nuevo} onChange={e => set("grupo_nuevo", e.target.value)} placeholder="Ej: Lote Alto" />
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Notas</Label>
            <Input value={form.notas} onChange={e => set("notas", e.target.value)} placeholder="Observaciones adicionales..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={() => setAccion(null)} className="flex-1">Atrás</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-primary text-primary-foreground">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}