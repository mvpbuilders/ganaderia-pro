import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDate, getTipoEventoColor } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const TIPOS = ["Produccion", "Parto", "Muerte", "Venta", "Enfermedad", "Tratamiento", "Inseminacion", "Celo", "Chequeo veterinario", "Vacuna", "Destete", "Cambio de grupo", "Otro"];

const TIPO_EMOJIS = {
  Produccion: "🥛", Parto: "🐣", Muerte: "💀", Venta: "💰",
  Enfermedad: "🤒", Tratamiento: "💊", Inseminacion: "🧬",
  Celo: "💕", "Chequeo veterinario": "🩺", Vacuna: "💉",
  Destete: "🍼", "Cambio de grupo": "👥", Otro: "📋"
};

export default function Eventos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    tipo: "Produccion", animal_nombre: "", fecha: new Date().toISOString().split('T')[0],
    valor_litros: "", valor_usd: "", descripcion: "", veterinario: "",
    medicamento: "", dosis: "", notas: "",
    requiere_retiro_leche: false, dias_retiro: "",
    sexo_cria: "Hembra", nombre_cria: "", peso_cria: "",
    resultado: "", grupo_nuevo: "",
  });
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const { data: animales = [] } = useQuery({
    queryKey: ['animales'],
    queryFn: () => base44.entities.Animal.list('-nombre', 500),
  });

  const { data: eventos = [] } = useQuery({
    queryKey: ['eventos'],
    queryFn: () => base44.entities.Evento.list('-fecha', 50),
  });

  const animalSeleccionado = animales.find(a => a.nombre === form.animal_nombre);

  const handleSave = async () => {
    setLoading(true);
    const eventoData = {
      tipo: form.tipo, animal_nombre: form.animal_nombre || null,
      animal_id: animalSeleccionado?.id || null,
      fecha: form.fecha, notas: form.notas,
      descripcion: form.descripcion,
      valor_litros: form.valor_litros ? Number(form.valor_litros) : undefined,
      valor_usd: form.valor_usd ? Number(form.valor_usd) : undefined,
      veterinario: form.veterinario || undefined,
      medicamento: form.medicamento || undefined,
      dosis: form.dosis || undefined,
    };

    if (form.tipo === "Parto") {
      Object.assign(eventoData, { sexo_cria: form.sexo_cria, nombre_cria: form.nombre_cria, peso_cria: form.peso_cria ? Number(form.peso_cria) : undefined });
      if (animalSeleccionado) {
        await base44.entities.Animal.update(animalSeleccionado.id, { fecha_ultimo_parto: form.fecha, estado: "Ordeño", estado_reproductivo: "Abierta" });
      }
    } else if (form.tipo === "Inseminacion" && animalSeleccionado) {
      const checkDate = new Date(form.fecha);
      checkDate.setDate(checkDate.getDate() + 35);
      await base44.entities.Animal.update(animalSeleccionado.id, { estado_reproductivo: "Inseminada", fecha_proximo_chequeo: checkDate.toISOString().split('T')[0] });
    } else if (form.tipo === "Tratamiento") {
      Object.assign(eventoData, { requiere_retiro_leche: form.requiere_retiro_leche, dias_retiro: form.dias_retiro ? Number(form.dias_retiro) : 0 });
      if (form.requiere_retiro_leche && form.dias_retiro && animalSeleccionado) {
        const retiroDate = new Date(form.fecha);
        retiroDate.setDate(retiroDate.getDate() + Number(form.dias_retiro));
        await base44.entities.Animal.update(animalSeleccionado.id, { retiro_leche_hasta: retiroDate.toISOString().split('T')[0], estado: "Enfermería" });
      }
    } else if (form.tipo === "Chequeo veterinario" && animalSeleccionado) {
      Object.assign(eventoData, { resultado: form.resultado });
      if (form.resultado === "Preñada positiva") {
        const partoDate = new Date(form.fecha); partoDate.setDate(partoDate.getDate() + 210);
        const secadoDate = new Date(form.fecha); secadoDate.setDate(secadoDate.getDate() + 150);
        await base44.entities.Animal.update(animalSeleccionado.id, { estado_reproductivo: "Preñada positiva", fecha_proxima_cria: partoDate.toISOString().split('T')[0], fecha_secado: secadoDate.toISOString().split('T')[0] });
      } else if (form.resultado) {
        await base44.entities.Animal.update(animalSeleccionado.id, { estado_reproductivo: form.resultado });
      }
    } else if (form.tipo === "Celo" && animalSeleccionado) {
      await base44.entities.Animal.update(animalSeleccionado.id, { estado_reproductivo: "En celo" });
    } else if (form.tipo === "Cambio de grupo") {
      Object.assign(eventoData, { grupo_anterior: animalSeleccionado?.grupo, grupo_nuevo: form.grupo_nuevo });
      if (animalSeleccionado && form.grupo_nuevo) {
        await base44.entities.Animal.update(animalSeleccionado.id, { grupo: form.grupo_nuevo });
      }
    }

    await base44.entities.Evento.create(eventoData);
    setLoading(false);
    setSuccess(true);
    toast.success("Evento registrado correctamente");
    setForm(f => ({ ...f, animal_nombre: "", valor_litros: "", valor_usd: "", descripcion: "", notas: "" }));
    queryClient.invalidateQueries(['eventos']);
    queryClient.invalidateQueries(['animales']);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registrar Evento</h1>
          <p className="text-muted-foreground text-sm">Registro rápido de actividades</p>
        </div>
      </div>

      {/* Tipo selector */}
      <div className="bg-card rounded-xl border border-border p-5">
        <Label className="text-xs font-semibold mb-3 block">Tipo de Evento</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {TIPOS.map(tipo => (
            <button key={tipo} onClick={() => set("tipo", tipo)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${form.tipo === tipo ? 'border-primary bg-accent' : 'border-border hover:border-primary/30 hover:bg-secondary/50'}`}>
              <span className="text-2xl">{TIPO_EMOJIS[tipo]}</span>
              <span className="text-xs font-semibold text-foreground leading-tight">{tipo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Fecha</Label>
            <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Animal (opcional)</Label>
            <Select value={form.animal_nombre || "__ninguno__"} onValueChange={v => set("animal_nombre", v === "__ninguno__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ninguno__">General (sin animal)</SelectItem>
                {animales.filter(a => a.nombre).map(a => (
                  <SelectItem key={a.id} value={a.nombre}>{a.nombre} {a.numero_id ? `(${a.numero_id})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {form.tipo === "Produccion" && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Total de Litros</Label>
            <div className="relative">
              <Input type="number" className="pr-12 text-lg font-semibold" value={form.valor_litros} onChange={e => set("valor_litros", e.target.value)} placeholder="2000" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">L</span>
            </div>
          </div>
        )}

        {form.tipo === "Venta" && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Valor (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input type="number" className="pl-7 text-lg font-semibold" value={form.valor_usd} onChange={e => set("valor_usd", e.target.value)} placeholder="0.00" />
            </div>
          </div>
        )}

        {form.tipo === "Parto" && (
          <div className="space-y-3">
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
          </div>
        )}

        {(form.tipo === "Tratamiento" || form.tipo === "Enfermedad" || form.tipo === "Vacuna" || form.tipo === "Chequeo veterinario") && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Veterinario</Label>
            <Input value={form.veterinario} onChange={e => set("veterinario", e.target.value)} placeholder="Nombre del veterinario" />
          </div>
        )}

        {(form.tipo === "Tratamiento" || form.tipo === "Vacuna") && (
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

        {form.tipo === "Tratamiento" && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={form.requiere_retiro_leche} onChange={e => set("requiere_retiro_leche", e.target.checked)} className="rounded border-border" />
              <span className="text-sm font-semibold">Requiere retiro de leche</span>
            </label>
            {form.requiere_retiro_leche && (
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Días de retiro</Label>
                <Input type="number" value={form.dias_retiro} onChange={e => set("dias_retiro", e.target.value)} placeholder="7" />
              </div>
            )}
          </div>
        )}

        {form.tipo === "Chequeo veterinario" && (
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

        {form.tipo === "Cambio de grupo" && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Nuevo Grupo</Label>
            <Input value={form.grupo_nuevo} onChange={e => set("grupo_nuevo", e.target.value)} placeholder="Ej: Lote Alto" />
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Descripción / Notas</Label>
          <Input value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Observaciones adicionales..." />
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading}
        className={`w-full h-14 text-base font-bold transition-all ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'} text-white`}>
        {loading ? "Guardando..." : success ? "✅ Evento registrado" : `Registrar ${form.tipo}`}
      </Button>

      {/* Recent Events */}
      {eventos.length > 0 && (
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Eventos Recientes</h3>
          </div>
          <div className="divide-y divide-border">
            {eventos.slice(0, 10).map((ev, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{TIPO_EMOJIS[ev.tipo] || '📋'}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{ev.tipo}: {ev.animal_nombre || ev.descripcion || "General"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(ev.fecha)}</p>
                </div>
                {ev.valor_litros > 0 && <span className="text-xs font-bold text-primary">{ev.valor_litros}L</span>}
                {ev.valor_usd > 0 && <span className="text-xs font-bold text-green-600">${ev.valor_usd}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}