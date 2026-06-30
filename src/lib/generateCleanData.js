// Clean historical data generator for March–May 2026
// Focused on quality, relational consistency, and dashboard functionality

function rb(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rf(min, max, dec = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

function dateStr(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// March 1 - May 21, 2026 (82 days)
function getDateRange() {
  const dates = [];
  for (let d = 1; d <= 31; d++) dates.push(dateStr(2026, 3, d)); // March
  for (let d = 1; d <= 30; d++) dates.push(dateStr(2026, 4, d)); // April
  for (let d = 1; d <= 21; d++) dates.push(dateStr(2026, 5, d)); // May
  return dates;
}

const veterinarios = ["Dr. Carlos Vega", "Dra. María Sánchez", "Dr. Rodrigo Pozo"];
const medicamentos = ["Ivermectina", "Penicilina", "Vitamina ADE", "Calcio IV", "Amoxicilina"];

// Generate daily milk production records (RegistroLeche)
// animalIds: array of actual animal IDs, animalNames: matching names
export function generateRegistroLeche(animalIds, animalNames) {
  const records = [];
  const dates = getDateRange();
  
  // Create production baseline for each cow (stays constant throughout)
  const cowProduction = {};
  animalIds.forEach((id, i) => {
    cowProduction[id] = {
      am: rf(8, 16, 1),
      pm: rf(6, 14, 1),
    };
  });

  // Generate daily records with realistic variation
  dates.forEach((fecha, dateIdx) => {
    animalIds.forEach((animalId, cowIdx) => {
      // Base production + daily variation (±12%)
      const variation = 0.88 + Math.random() * 0.24;
      const baseAm = cowProduction[animalId].am;
      const basePm = cowProduction[animalId].pm;
      
      let litros_am = Math.round(baseAm * variation * 10) / 10;
      let litros_pm = Math.round(basePm * variation * 10) / 10;
      
      // Apply illness/treatment dips (random ~5% of days, 20-40% production drop)
      if (Math.random() < 0.05) {
        litros_am *= rf(0.6, 0.8, 2);
        litros_pm *= rf(0.6, 0.8, 2);
      }
      
      // Milk withdrawal period: skip if animal has retiro_leche_hasta set
      // (handled by filtering on frontend)
      
      records.push({
        fecha,
        animal_id: animalId,
        animal_nombre: animalNames[cowIdx],
        litros_am,
        litros_pm,
        total_litros: parseFloat((litros_am + litros_pm).toFixed(2)),
      });
    });
  });

  return records;
}

// Generate farm-level production totals + events
export function generateEventos(animalIds, animalNames, inventarioIA = []) {
  const eventos = [];
  const dates = getDateRange();
  
  // Daily farm production totals
  dates.forEach((fecha) => {
    const baseFarmProd = 2050 + rb(-150, 200); // Average ~2100L/day with variation
    eventos.push({
      tipo: "Produccion",
      fecha,
      valor_litros: baseFarmProd,
      descripcion: `Producción total del día – ${baseFarmProd}L`,
    });
  });

  // Reproduction events (inseminations, pregnancy checks, calvings)
  const inseminationDates = [
    { animalName: "Valentina", fecha: "2026-03-05" },
    { animalName: "Sofia", fecha: "2026-03-12" },
    { animalName: "Pamela", fecha: "2026-03-18" },
    { animalName: "Natalia", fecha: "2026-03-25" },
    { animalName: "Giselle", fecha: "2026-04-02" },
    { animalName: "Daniela", fecha: "2026-04-08" },
    { animalName: "Rosa", fecha: "2026-04-15" },
    { animalName: "Nadia", fecha: "2026-04-22" },
  ];
  const pajuelasDisponibles = inventarioIA.flatMap((item) =>
    Array.from({ length: Number(item.stock_actual || 0) }, () => item)
  );
  
  inseminationDates.slice(0, pajuelasDisponibles.length).forEach(({ animalName, fecha }, index) => {
    const pajuela = pajuelasDisponibles[index];

    eventos.push({
      tipo: "Inseminacion",
      animal_nombre: animalName,
      fecha,
      descripcion: "Inseminación artificial – semen Holstein importado",
      veterinario: veterinarios[rb(0, veterinarios.length - 1)],
      inventario_ia_id: pajuela.id,
    });
  });

  // Pregnancy confirmations (35 days post-insemination)
  inseminationDates.slice(0, pajuelasDisponibles.length).forEach(({ animalName, fecha }) => {
    const checkDate = new Date(fecha + "T12:00:00");
    checkDate.setDate(checkDate.getDate() + 35);
    const checkDateStr = checkDate.toISOString().split("T")[0];
    
    const result = Math.random() > 0.1 ? 
      "Preñez confirmada – 35 días" : 
      "Resultado negativo – repetir inseminación";
    
    eventos.push({
      tipo: "Otro",
      animal_nombre: animalName,
      fecha: checkDateStr,
      descripcion: `Diagnóstico preñez: ${result}`,
      veterinario: veterinarios[rb(0, veterinarios.length - 1)],
    });
  });

  // Calvings in late April/May
  const calvingDates = [
    { animalName: "Marisol", fecha: "2026-04-28", cria: "Hembra, 38kg" },
    { animalName: "Lorena", fecha: "2026-05-05", cria: "Macho, 41kg" },
    { animalName: "Estela", fecha: "2026-05-12", cria: "Hembra, 39kg" },
  ];
  
  calvingDates.forEach(({ animalName, fecha, cria }) => {
    eventos.push({
      tipo: "Parto",
      animal_nombre: animalName,
      fecha,
      descripcion: `Parto eutócico. ${cria}`,
    });
  });

  // Vaccinations and treatments (monthly)
  [
    { fecha: "2026-03-08", desc: "Vacunación contra Fiebre Aftosa – 180 animales", med: "Vacuna Aftosa bivalente", dosis: "2ml SC" },
    { fecha: "2026-04-05", desc: "Desparasitación interna", med: "Ivermectina + Albendazol", dosis: "1ml/50kg" },
    { fecha: "2026-05-10", desc: "Vacunación IBR + BVD – vacas lecheras", med: "Bovilis BVD+IBR", dosis: "5ml IM" },
  ].forEach(({ fecha, desc, med, dosis }) => {
    eventos.push({
      tipo: "Tratamiento",
      fecha,
      descripcion: desc,
      veterinario: veterinarios[rb(0, veterinarios.length - 1)],
      medicamento: med,
      dosis,
    });
  });

  // Individual health events (sparse, realistic)
  const healthEvents = [
    { animalName: "Nube", fecha: "2026-03-02", desc: "Mastitis clínica – cuarto trasero", med: "Mastijet intramamario", dosis: "1 tubo × 3 días" },
    { animalName: "Gema", fecha: "2026-03-08", desc: "Cojera leve – úlcera de suela", med: "Sulfato de cobre", dosis: "Tópico" },
    { animalName: "Blanca", fecha: "2026-04-03", desc: "Neumonía leve, tos, fiebre", med: "Oxitetraciclina LA", dosis: "20mg/kg IM" },
    { animalName: "Dulce", fecha: "2026-04-12", desc: "Metritis posparto", med: "Penicilina", dosis: "Por veterinario" },
    { animalName: "Manchas", fecha: "2026-05-01", desc: "Hipocalcemia posparto", med: "Calcio IV", dosis: "500ml lento" },
  ];
  
  healthEvents.forEach(({ animalName, fecha, desc, med, dosis }) => {
    eventos.push({
      tipo: "Enfermedad",
      animal_nombre: animalName,
      fecha,
      descripcion: desc,
      veterinario: veterinarios[rb(0, veterinarios.length - 1)],
      medicamento: med,
      dosis,
    });
  });

  return eventos;
}

// Generate financial transactions (milk sales + monthly expenses)
export function generateTransacciones() {
  const transacciones = [];
  const dates = getDateRange();
  
  // Daily milk sales
  // Base: ~2050-2150 L/day at $0.42/L = ~$861-903 per day
  dates.forEach((fecha) => {
    const litros = rb(1900, 2250);
    const precio = 0.42;
    const monto = parseFloat((litros * precio).toFixed(2));
    
    transacciones.push({
      tipo: "Ingreso",
      categoria: "Venta de leche",
      monto_usd: monto,
      fecha,
      descripcion: `Venta de leche – ${litros}L a $${precio}/L`,
      litros,
      precio_por_litro: precio,
      referencia: `REC-${fecha.replace(/-/g, '')}`,
    });
  });

  // Monthly expenses (recurring)
  const months = [
    { month: 3, year: 2026 },
    { month: 4, year: 2026 },
    { month: 5, year: 2026 },
  ];
  
  months.forEach(({ month, year }) => {
    const dayOfMonth = (d) => dateStr(year, month, d);
    
    // Alimentación
    transacciones.push({
      tipo: "Egreso",
      categoria: "Alimentacion",
      monto_usd: rb(1450, 1700),
      fecha: dayOfMonth(3),
      descripcion: "Compra de balanceado lechero 22% – 5 toneladas",
    });
    transacciones.push({
      tipo: "Egreso",
      categoria: "Alimentacion",
      monto_usd: rb(200, 280),
      fecha: dayOfMonth(15),
      descripcion: "Sal mineralizada y suplemento vitamínico",
    });

    // Mano de obra
    transacciones.push({
      tipo: "Egreso",
      categoria: "Mano de obra",
      monto_usd: rb(1900, 2200),
      fecha: dayOfMonth(1),
      descripcion: "Nómina – 3 ordeñadores + 1 vaquero",
    });

    // Veterinario
    transacciones.push({
      tipo: "Egreso",
      categoria: "Veterinario",
      monto_usd: rb(350, 500),
      fecha: dayOfMonth(8),
      descripcion: "Visita veterinaria y servicios sanitarios",
    });
    transacciones.push({
      tipo: "Egreso",
      categoria: "Medicamentos",
      monto_usd: rb(200, 350),
      fecha: dayOfMonth(14),
      descripcion: "Antibióticos, vitaminas, antiparasitarios",
    });

    // Servicios
    transacciones.push({
      tipo: "Egreso",
      categoria: "Servicios",
      monto_usd: rb(90, 140),
      fecha: dayOfMonth(10),
      descripcion: "Energía eléctrica – ordeño y refrigeración",
    });

    // Combustible
    transacciones.push({
      tipo: "Egreso",
      categoria: "Combustible",
      monto_usd: rb(130, 180),
      fecha: dayOfMonth(20),
      descripcion: "Diésel – tractor y riego",
    });

    // Mantenimiento (occasional)
    if (month === 3) {
      transacciones.push({
        tipo: "Egreso",
        categoria: "Mantenimiento",
        monto_usd: 350,
        fecha: dayOfMonth(22),
        descripcion: "Reparación de cercas eléctricas",
      });
    }
  });

  // Occasional animal sales
  transacciones.push({
    tipo: "Ingreso",
    categoria: "Venta de animal",
    monto_usd: 2200,
    fecha: "2026-03-20",
    descripcion: "Venta de 2 terneros machos Mestiza",
    referencia: "VTA-2026-0320",
  });

  return transacciones;
}
