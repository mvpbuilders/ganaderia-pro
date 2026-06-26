import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventoService, eventosQueryKey } from "@/services/eventoService";
import { animalService, ANIMALS_QUERY_KEY } from "@/services/animalService";
import { getCurrentFinca } from "@/lib/current-finca";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthName, formatDate } from "@/lib/utils";

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getEventoColor(tipo) {
  const m = {
    Produccion: 'bg-green-500', Parto: 'bg-blue-500', Muerte: 'bg-gray-500',
    Venta: 'bg-yellow-500', Enfermedad: 'bg-red-500', Tratamiento: 'bg-orange-500',
    Inseminacion: 'bg-purple-500', Destete: 'bg-teal-500', Otro: 'bg-slate-400',
  };
  return m[tipo] || 'bg-slate-400';
}

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const { data: fincaData } = useQuery({
    queryKey: ['current-finca'],
    queryFn: getCurrentFinca,
  });

  const fincaId = fincaData?.finca?.id;

  const { data: eventos = [] } = useQuery({
    queryKey: eventosQueryKey({ limit: 200 }),
    enabled: !!fincaId,
    queryFn: () => eventoService.list({ limit: 200 }),
  });

  const { data: animales = [] } = useQuery({
    queryKey: ANIMALS_QUERY_KEY,
    enabled: !!fincaId,
    queryFn: animalService.list,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Events per day
  const eventsByDay = {};
  eventos.forEach(ev => {
    if (!ev.fecha) return;
    const d = new Date(ev.fecha + 'T00:00:00');
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  // Upcoming births from animals
  const proximosPartos = animales.filter(a => a.fecha_proxima_cria).map(a => {
    const d = new Date(a.fecha_proxima_cria + 'T00:00:00');
    return { fecha: a.fecha_proxima_cria, animal: a.nombre, tipo: "Parto" };
  });

  proximosPartos.forEach(ev => {
    const d = new Date(ev.fecha + 'T00:00:00');
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push({ ...ev, tipo: "Parto", descripcion: `Parto esperado: ${ev.animal}` });
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedDateStr = selectedDate
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
    : null;

  const selectedEventos = selectedDate ? (eventsByDay[selectedDate] || []) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground text-sm">Eventos y ciclos reproductivos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-foreground text-lg capitalize">
              {getMonthName(month)} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = day === selectedDate;
              const dayEvents = eventsByDay[day] || [];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                  className={`relative min-h-[60px] md:min-h-[72px] p-1.5 rounded-lg text-left transition-all hover:bg-secondary/80 ${
                    isSelected ? 'bg-primary/10 ring-2 ring-primary' : isToday ? 'bg-accent' : ''
                  }`}
                >
                  <span className={`text-sm font-semibold block mb-1 ${isToday ? 'text-primary' : isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <div key={j} className={`w-2 h-2 rounded-full ${getEventoColor(ev.tipo)}`} title={ev.tipo} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
            {[
              { tipo: "Produccion", color: "bg-green-500", label: "Producción" },
              { tipo: "Parto", color: "bg-blue-500", label: "Parto" },
              { tipo: "Tratamiento", color: "bg-orange-500", label: "Tratamiento" },
              { tipo: "Inseminacion", color: "bg-purple-500", label: "Inseminación" },
            ].map(item => (
              <div key={item.tipo} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Events */}
        <div className="bg-card rounded-xl border border-border p-5">
          {selectedDate ? (
            <div>
              <h3 className="font-semibold text-foreground mb-3">
                {selectedDate} de {getMonthName(month)}
              </h3>
              {selectedEventos.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Sin eventos este día</p>
              ) : (
                <div className="space-y-3">
                  {selectedEventos.map((ev, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${getEventoColor(ev.tipo)}`} />
                        <span className="text-xs font-bold text-foreground">{ev.tipo}</span>
                      </div>
                      {ev.animal_nombre && <p className="text-sm font-semibold text-foreground">{ev.animal_nombre}</p>}
                      {ev.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{ev.descripcion}</p>}
                      {ev.valor_litros && <p className="text-xs font-bold text-primary mt-1">🥛 {ev.valor_litros} litros</p>}
                      {ev.valor_usd > 0 && <p className="text-xs font-bold text-green-600 mt-1">💰 ${ev.valor_usd}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Próximos Eventos</h3>
              <div className="space-y-3">
                {animales.filter(a => a.fecha_proxima_cria).slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🐣</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{a.nombre}</p>
                      <p className="text-xs text-blue-600">Parto: {formatDate(a.fecha_proxima_cria)}</p>
                    </div>
                  </div>
                ))}
                {animales.filter(a => a.fecha_proxima_cria).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">Sin partos próximos registrados</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}