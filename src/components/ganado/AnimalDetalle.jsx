import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDate, calcularEdad } from "@/lib/utils";
import EstadoBadge from "@/components/shared/EstadoBadge";
import EventoRapidoModal from "@/components/ganado/EventoRapidoModal";
import { ChevronLeft, Plus, Milk, Heart, Weight, Users, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TABS = ["General", "Registro Lechero", "Reproducción", "Salud", "Agrupamiento"];

export default function AnimalDetalle({ animal, onBack, onEdit }) {
  const [tab, setTab] = useState("General");
  const [showEventoModal, setShowEventoModal] = useState(false);

  const { data: eventos = [], refetch: refetchEventos } = useQuery({
    queryKey: ['eventos-animal', animal.id],
    queryFn: () => base44.entities.Evento.filter({ animal_id: animal.id }, '-fecha', 100),
  });

  const { data: registrosLeche = [] } = useQuery({
    queryKey: ['leche-animal', animal.id],
    queryFn: () => base44.entities.RegistroLeche.filter({ animal_id: animal.id }, '-fecha', 60),
  });

  const hoy = new Date().toISOString().split('T')[0];
  const enRetiro = animal.retiro_leche_hasta && animal.retiro_leche_hasta >= hoy;
  const diasRetiro = enRetiro ? Math.ceil((new Date(animal.retiro_leche_hasta) - new Date()) / 86400000) : 0;

  // Chart data from milk records
  const chartData = registrosLeche.slice(0, 30).reverse().map(r => ({
    fecha: formatDate(r.fecha),
    AM: r.litros_am || 0,
    PM: r.litros_pm || 0,
    total: r.total_litros || 0,
  }));

  const eventosOrdenados = [...eventos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const eventosSalud = eventosOrdenados.filter(e => ["Enfermedad", "Tratamiento", "Vacuna", "Chequeo veterinario"].includes(e.tipo));
  const eventosRepro = eventosOrdenados.filter(e => ["Parto", "Inseminacion", "Celo", "Chequeo veterinario"].includes(e.tipo));

  const TIPO_EMOJI = {
    Parto: "🐣", Inseminacion: "🧬", Celo: "💕", "Chequeo veterinario": "🩺",
    Tratamiento: "💊", Vacuna: "💉", Enfermedad: "🤒", "Cambio de grupo": "👥",
    Produccion: "🥛", Muerte: "💀", Venta: "💰", Destete: "🍼"
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{animal.nombre}</h1>
            {animal.numero_id && <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{animal.numero_id}</span>}
            <EstadoBadge estado={animal.estado} size="md" />
            {animal.estado_reproductivo && <EstadoBadge estado={animal.estado_reproductivo} type="reproductivo" size="sm" />}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{animal.raza} · {calcularEdad(animal.fecha_nacimiento)}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && <Button variant="outline" size="sm" onClick={onEdit}>Editar</Button>}
          <Button size="sm" className="bg-primary text-primary-foreground gap-1.5" onClick={() => setShowEventoModal(true)}>
            <Plus className="w-4 h-4" /> Registrar
          </Button>
        </div>
      </div>

      {/* Retiro Leche Alert */}
      {enRetiro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700">🚫 En retiro de leche</p>
            <p className="text-xs text-red-600">Hasta {formatDate(animal.retiro_leche_hasta)} · {diasRetiro} días restantes. Leche no apta para venta.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/10'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {tab === "General" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4" />Información General</h3>
            {[
              ["Nombre", animal.nombre],
              ["ID / Arete", animal.numero_id || "-"],
              ["Raza", animal.raza || "-"],
              ["Edad", calcularEdad(animal.fecha_nacimiento)],
              ["Peso actual", animal.peso_kg ? `${animal.peso_kg} kg` : "-"],
              ["Grupo / Lote", animal.grupo || "-"],
              ["Padre", animal.padre_nombre || "-"],
              ["ID Madre", animal.madre_id || "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Milk className="w-4 h-4" />Producción actual</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">AM</p>
                  <p className="text-xl font-bold text-blue-700">{animal.produccion_am || 0}L</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">PM</p>
                  <p className="text-xl font-bold text-blue-700">{animal.produccion_pm || 0}L</p>
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">{(animal.produccion_am || 0) + (animal.produccion_pm || 0)}L</p>
                </div>
              </div>
              {animal.racion_actual && (
                <p className="text-xs text-muted-foreground">🌾 Ración: {animal.racion_actual}</p>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />Fechas clave</h3>
              {[
                ["Último parto", animal.fecha_ultimo_parto],
                ["Próx. parto estimado", animal.fecha_proxima_cria],
                ["Fecha secado", animal.fecha_secado],
                ["Próx. chequeo vet.", animal.fecha_proximo_chequeo],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-semibold ${value ? 'text-foreground' : 'text-muted-foreground'}`}>{value ? formatDate(value) : '-'}</span>
                </div>
              ))}
            </div>
          </div>
          {animal.notas && (
            <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Notas</p>
              <p className="text-sm text-yellow-800">{animal.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* Registro Lechero */}
      {tab === "Registro Lechero" && (
        <div className="space-y-4">
          {chartData.length > 0 ? (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Producción últimos 30 días</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152,60%,32%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(152,60%,32%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}L`, '']} />
                  <Area type="monotone" dataKey="total" stroke="hsl(152,60%,32%)" fill="url(#grad)" name="Total" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
              <Milk className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin registros de leche aún. Usa el Registro Lechero Maestro para ingresar datos.</p>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Historial de producciones</h3></div>
            {registrosLeche.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Sin registros</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">Fecha</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground">AM</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground">PM</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {registrosLeche.slice(0, 30).map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(r.fecha)}</td>
                      <td className="px-4 py-2 text-center">{r.litros_am || '-'}</td>
                      <td className="px-4 py-2 text-center">{r.litros_pm || '-'}</td>
                      <td className="px-4 py-2 text-center font-bold text-primary">{r.total_litros || '-'}L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Reproducción */}
      {tab === "Reproducción" && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Heart className="w-4 h-4" />Estado reproductivo actual</h3>
            <EstadoBadge estado={animal.estado_reproductivo || "Abierta"} type="reproductivo" size="md" />
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Timeline reproductivo</h3></div>
            {eventosRepro.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Sin eventos reproductivos</p>
            ) : (
              <div className="divide-y divide-border">
                {eventosRepro.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xl">{TIPO_EMOJI[ev.tipo] || '📋'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{ev.tipo}</p>
                      {ev.veterinario && <p className="text-xs text-muted-foreground">Vet: {ev.veterinario}</p>}
                      {ev.resultado && <p className="text-xs text-blue-600 font-semibold">Resultado: {ev.resultado}</p>}
                      {ev.notas && <p className="text-xs text-muted-foreground">{ev.notas}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(ev.fecha)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salud */}
      {tab === "Salud" && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Historial de salud</h3></div>
            {eventosSalud.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Sin eventos de salud registrados</p>
            ) : (
              <div className="divide-y divide-border">
                {eventosSalud.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xl">{TIPO_EMOJI[ev.tipo] || '📋'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{ev.tipo}</p>
                      {ev.medicamento && <p className="text-xs text-muted-foreground">💊 {ev.medicamento} {ev.dosis && `· ${ev.dosis}`}</p>}
                      {ev.veterinario && <p className="text-xs text-muted-foreground">Vet: {ev.veterinario}</p>}
                      {ev.requiere_retiro_leche && <p className="text-xs text-red-600 font-semibold">🚫 Retiro: {ev.dias_retiro} días</p>}
                      {ev.notas && <p className="text-xs text-muted-foreground">{ev.notas}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(ev.fecha)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agrupamiento */}
      {tab === "Agrupamiento" && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Users className="w-4 h-4" />Grupo actual</h3>
            <p className="text-2xl font-bold text-foreground">{animal.grupo || "Sin grupo"}</p>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Historial de grupos</h3></div>
            {eventosOrdenados.filter(e => e.tipo === "Cambio de grupo").length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Sin cambios de grupo registrados</p>
            ) : (
              <div className="divide-y divide-border">
                {eventosOrdenados.filter(e => e.tipo === "Cambio de grupo").map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">👥</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{ev.grupo_anterior || '?'} → {ev.grupo_nuevo || '?'}</p>
                      {ev.notas && <p className="text-xs text-muted-foreground">{ev.notas}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(ev.fecha)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEventoModal && (
        <EventoRapidoModal
          animal={animal}
          onClose={() => setShowEventoModal(false)}
          onSave={() => { setShowEventoModal(false); refetchEventos(); }}
        />
      )}
    </div>
  );
}