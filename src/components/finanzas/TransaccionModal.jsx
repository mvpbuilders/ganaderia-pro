import { useState } from "react";
import { financialTransactionService } from "@/services/financialTransactionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const CATEGORIAS_INGRESO = ["Venta de leche", "Venta de animal", "Otros"];
const CATEGORIAS_EGRESO = ["Alimentacion", "Veterinario", "Medicamentos", "Mano de obra", "Equipos", "Combustible", "Mantenimiento", "Servicios", "Otros"];

export default function TransaccionModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    tipo: "Ingreso", categoria: "Venta de leche", monto_usd: "", fecha: new Date().toISOString().split('T')[0],
    descripcion: "", litros: "", precio_por_litro: "", notas: ""
  });
  const [loading, setLoading] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const categorias = form.tipo === "Ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  const handleSave = async () => {
    if (!form.monto_usd || !form.categoria) return;
    setLoading(true);
    try {
      await financialTransactionService.create({
        tipo: form.tipo,
        categoria: form.categoria,
        monto_usd: Number(form.monto_usd),
        fecha: form.fecha,
        descripcion: form.descripcion || undefined,
        litros: form.litros ? Number(form.litros) : undefined,
        precio_por_litro: form.precio_por_litro ? Number(form.precio_por_litro) : undefined,
        notas: form.notas || undefined,
      });
      onSave();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Nueva Transacción</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Ingreso", "Egreso"].map(t => (
                <button key={t} onClick={() => { set("tipo", t); set("categoria", t === "Ingreso" ? "Venta de leche" : "Alimentacion"); }}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${form.tipo === t ? (t === "Ingreso" ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                  {t === "Ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Categoría</Label>
            <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Monto (USD) *</Label>
              <Input type="number" step="0.01" value={form.monto_usd} onChange={e => set("monto_usd", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
            </div>
          </div>
          {form.categoria === "Venta de leche" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Litros</Label>
                <Input type="number" value={form.litros} onChange={e => set("litros", e.target.value)} placeholder="2000" />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block">Precio/Litro</Label>
                <Input type="number" step="0.01" value={form.precio_por_litro} onChange={e => set("precio_por_litro", e.target.value)} placeholder="0.42" />
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Descripción</Label>
            <Input value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Detalle..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || !form.monto_usd} className="flex-1 bg-primary text-primary-foreground">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
