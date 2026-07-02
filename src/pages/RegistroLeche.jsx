import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ANIMALS_QUERY_KEY, animalService } from "@/services/animalService";
import { MILK_RECORDS_QUERY_KEY, milkRecordService } from "@/services/milkRecordService";
import { ChevronLeft, ChevronRight, Save, Milk, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "short", day: "numeric", month: "short"
  });
}

export default function RegistroLeche() {
  const today = new Date().toISOString().split("T")[0];
  const queryClient = useQueryClient();
  const [windowStart, setWindowStart] = useState(addDays(today, -4));
  const [activeDate, setActiveDate] = useState(today);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState({ campo: "nombre", direccion: "asc" });

  const dates = Array.from({ length: 5 }, (_, i) => addDays(windowStart, i));

  useEffect(() => {
    if (!dates.includes(activeDate)) {
      setActiveDate(dates[0]);
    }
  }, [windowStart]);

  const { data: animales = [] } = useQuery({
    queryKey: ANIMALS_QUERY_KEY,
    queryFn: animalService.list,
  });

  const vacasOrdenio = animales.filter(a => a.estado === "Ordeño");

  const { data: registros = [], refetch: refetchRegistros } = useQuery({
    queryKey: MILK_RECORDS_QUERY_KEY,
    queryFn: milkRecordService.list,
    placeholderData: (prev) => prev,
  });

  const recordMap = {};
  registros.forEach(r => {
    recordMap[`${r.fecha}__${r.animal_id}`] = r;
  });

  const handleSaveAll = async () => {
    const entries = Object.entries(edits);
    if (entries.length === 0) return;

    setSaving(true);
    try {
      const records = entries.map(([key, vals]) => {
        const [fecha, animalIdStr] = key.split("__");
        const animalId = Number(animalIdStr);
        const animal = vacasOrdenio.find(a => a.id === animalId);
        if (!animal) return null;

        const existing = recordMap[key];
        const litros_am = vals.am !== undefined
          ? (parseFloat(vals.am) || 0)
          : (existing?.litros_am ?? 0);
        const litros_pm = vals.pm !== undefined
          ? (parseFloat(vals.pm) || 0)
          : (existing?.litros_pm ?? 0);

        return {
          animal_id: animalId,
          animal_nombre: animal.nombre,
          fecha,
          litros_am,
          litros_pm,
        };
      }).filter(Boolean);

      await milkRecordService.bulkUpsert(records);
      await refetchRegistros();
      setEdits({});
      toast.success("Registros guardados correctamente");
    } catch {
      toast.error("Error al guardar los registros");
    } finally {
      setSaving(false);
    }
  };

  const getVal = (fecha, animalId, field) => {
    const key = `${fecha}__${animalId}`;

    if (edits[key]?.[field] !== undefined) {
      return edits[key][field];
    }

    const rec = recordMap[key];
    if (rec) {
      const value = field === "am" ? rec.litros_am : rec.litros_pm;
      return value === null || value === undefined ? "" : Number(value).toFixed(1);
    }

    return "";
  };

  const setVal = (fecha, animalId, field, value) => {
    const key = `${fecha}__${animalId}`;
    setEdits(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const produccionDia = (animal, fecha) => {
    const am = parseFloat(getVal(fecha, animal.id, "am")) || 0;
    const pm = parseFloat(getVal(fecha, animal.id, "pm")) || 0;
    return { am, pm, total: am + pm };
  };

  const vacasVisibles = vacasOrdenio
    .filter(animal => {
      const query = busqueda.trim().toLowerCase();
      if (!query) return true;

      return (
        animal.nombre?.toLowerCase().includes(query) ||
        animal.arete?.toLowerCase().includes(query) ||
        animal.numero_id?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const prodA = produccionDia(a, activeDate);
      const prodB = produccionDia(b, activeDate);
      const valores = {
        nombre: [a.nombre || "", b.nombre || ""],
        arete: [a.arete || "", b.arete || ""],
        am: [prodA.am, prodB.am],
        pm: [prodA.pm, prodB.pm],
        total: [prodA.total, prodB.total],
      };
      const [valueA, valueB] = valores[orden.campo] || valores.nombre;
      const result = typeof valueA === "number" || typeof valueB === "number"
        ? Number(valueA || 0) - Number(valueB || 0)
        : String(valueA || "").localeCompare(String(valueB || ""), "es", {
            numeric: true,
            sensitivity: "base",
          });

      return orden.direccion === "asc" ? result : -result;
    });

  const cambiarOrden = (campo) => {
    setOrden(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === "asc" ? "desc" : "asc",
    }));
  };

  const indicadorOrden = (campo) => {
    if (orden.campo !== campo) return "";
    return orden.direccion === "asc" ? " ↑" : " ↓";
  };

  const dayTotals = dates.map(fecha => {
    let am = 0, pm = 0;
    vacasOrdenio.forEach(a => {
      am += parseFloat(getVal(fecha, a.id, "am")) || 0;
      pm += parseFloat(getVal(fecha, a.id, "pm")) || 0;
    });
    return { am, pm, total: am + pm };
  });

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Milk className="w-6 h-6 text-primary" /> Registro Lechero
          </h1>
          <p className="text-muted-foreground text-sm">{vacasOrdenio.length} vacas en ordeño</p>
        </div>
        <div className="flex items-center gap-2">
          {hasEdits && (
            <Button onClick={handleSaveAll} className="gap-2" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : `Guardar (${Object.keys(edits).length})`}
            </Button>
          )}
        </div>
      </div>

      {vacasOrdenio.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          <Milk className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay vacas en estado "Ordeño".</p>
          <p className="text-sm mt-1">Cambia el estado de las vacas en el módulo de Ganado.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="border-b border-border p-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, arete o ID..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 sticky top-0 z-30">
                  <th className="text-left px-4 py-3 font-semibold text-foreground sticky left-0 z-40 bg-secondary/50 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setWindowStart(w => addDays(w, -1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setWindowStart(w => addDays(w, -5))}>
                        ‹‹
                      </Button>
                    </div>
                  </th>

                  {dates.map(fecha => (
                    <th
                      key={fecha}
                      colSpan={2}
                      onClick={() => setActiveDate(fecha)}
                      className={`cursor-pointer text-center px-2 py-3 font-semibold min-w-[120px] ${
                        fecha === activeDate ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <div className="hidden sm:block text-xs">{formatDate(fecha)}</div>
                      <div className="sm:hidden text-xs">{fecha.slice(5)}</div>
                    </th>
                  ))}

                  <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px] bg-secondary/50">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setWindowStart(w => addDays(w, 5))}>
                        ››
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setWindowStart(w => addDays(w, 1))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </th>
                </tr>

                <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/20 sticky top-[57px] z-20">
                  <th className="sticky left-0 z-30 bg-secondary/20 px-4 py-1">
                    <button
                      type="button"
                      onClick={() => cambiarOrden(orden.campo === "nombre" ? "arete" : "nombre")}
                      className="hover:text-foreground"
                    >
                      Vaca{orden.campo === "nombre" || orden.campo === "arete" ? indicadorOrden(orden.campo) : ""}
                    </button>
                  </th>
                  {dates.map(fecha => (
                    <>
                      <th key={`${fecha}-am`} className={`text-center py-1 px-1 ${fecha === activeDate ? "bg-accent/50" : ""}`}>
                        <button type="button" onClick={() => cambiarOrden("am")} className="hover:text-foreground">
                          AM{fecha === activeDate ? indicadorOrden("am") : ""}
                        </button>
                      </th>
                      <th key={`${fecha}-pm`} className={`text-center py-1 px-1 ${fecha === activeDate ? "bg-accent/50" : ""}`}>
                        <button type="button" onClick={() => cambiarOrden("pm")} className="hover:text-foreground">
                          PM{fecha === activeDate ? indicadorOrden("pm") : ""}
                        </button>
                      </th>
                    </>
                  ))}
                  <th className="text-center px-3 py-1 bg-secondary/20">
                    <button type="button" onClick={() => cambiarOrden("total")} className="hover:text-foreground">
                      Prom.{indicadorOrden("total")}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {vacasVisibles.length === 0 ? (
                  <tr>
                    <td colSpan={dates.length * 2 + 2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No hay vacas que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : vacasVisibles.map((animal, idx) => {
                  let sumDays = 0, countDays = 0;
                  dates.forEach(fecha => {
                    const am = parseFloat(getVal(fecha, animal.id, "am")) || 0;
                    const pm = parseFloat(getVal(fecha, animal.id, "pm")) || 0;
                    if (am > 0 || pm > 0) { sumDays += am + pm; countDays++; }
                  });
                  const avg = countDays > 0 ? (sumDays / countDays).toFixed(1) : "—";

                  return (
                    <tr key={animal.id} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-secondary/10"} hover:bg-accent/20 transition-colors`}>
                      <td className={`px-4 py-2 font-medium text-foreground sticky left-0 ${idx % 2 === 0 ? "bg-white" : "bg-secondary/10"}`}>
                        <div className="truncate max-w-[130px]">{animal.nombre}</div>
                        {animal.numero_id && <div className="text-xs text-muted-foreground">#{animal.numero_id}</div>}
                        {animal.arete && <div className="text-xs text-muted-foreground">Arete {animal.arete}</div>}
                      </td>
                      {dates.map(fecha => {
                        const isActive = fecha === activeDate;
                        const am = getVal(fecha, animal.id, "am");
                        const pm = getVal(fecha, animal.id, "pm");
                        return (
                          <>
                            <td key={`${fecha}-am`} className={`px-1 py-1.5 text-center ${isActive ? "bg-accent/30" : ""}`}>
                              {isActive ? (
                                <Input
                                  type="number" min="0" step="0.1" value={am}
                                  onChange={e => setVal(fecha, animal.id, "am", e.target.value)}
                                  onBlur={e => { if (e.target.value !== "") setVal(fecha, animal.id, "am", Number(e.target.value).toFixed(1)); }}
                                  className="w-16 h-7 text-center text-xs px-1" placeholder="0"
                                />
                              ) : (
                                <span className={`text-xs ${am === "" ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                                  {am === "" ? "—" : `${am}L`}
                                </span>
                              )}
                            </td>
                            <td key={`${fecha}-pm`} className={`px-1 py-1.5 text-center ${isActive ? "bg-accent/30" : ""}`}>
                              {isActive ? (
                                <Input
                                  type="number" min="0" step="0.1" value={pm}
                                  onChange={e => setVal(fecha, animal.id, "pm", e.target.value)}
                                  className="w-16 h-7 text-center text-xs px-1" placeholder="0"
                                />
                              ) : (
                                <span className={`text-xs ${pm === "" ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                                  {pm === "" ? "—" : `${pm}L`}
                                </span>
                              )}
                            </td>
                          </>
                        );
                      })}
                      <td className="px-3 py-2 text-center text-xs font-semibold text-primary">{avg}{avg !== "—" ? "L" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-secondary/50 font-semibold">
                  <td className="px-4 py-3 text-sm sticky left-0 bg-secondary/50">Totales</td>
                  {dates.map((fecha, i) => (
                    <>
                      <td key={`${fecha}-am-total`} className={`text-center px-1 py-3 text-xs ${fecha === activeDate ? "bg-accent/50" : ""}`}>
                        {dayTotals[i].am.toFixed(1)}L
                      </td>
                      <td key={`${fecha}-pm-total`} className={`text-center px-1 py-3 text-xs ${fecha === activeDate ? "bg-accent/50" : ""}`}>
                        {dayTotals[i].pm.toFixed(1)}L
                      </td>
                    </>
                  ))}
                  <td className="text-center px-3 py-3 text-xs text-primary">
                    {(dates.reduce((s, _, i) => s + dayTotals[i].total, 0) / dates.length).toFixed(1)}L
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
