// Demo data generators for GanaderíaPro — Finca Lechera Ecuador

// --- Helpers ---
function rb(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rf(min, max, dec = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}
function dateStr(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function addDays(ds, n) {
  const d = new Date(ds + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function subDays(n) {
  const d = new Date('2026-04-07T12:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function randomPastDate(daysBack) {
  return subDays(rb(0, daysBack));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Cow names ---
const nombresVacas = [
  "Estrella","Luna","Rosa","Margarita","Canela","Blanca","Negra","Nube","Dulce","Flor",
  "Miel","Perla","Gema","Clara","Lola","Pinta","Manchas","Suerte","Fe","Esperanza",
  "Caridad","Gloria","Paz","Virtud","Gracia","Paloma","Brisa","Aurora","Amanecer","Rocío",
  "Niebla","Reina","Princesa","Condesa","Dama","Victoria","Beatriz","Natalia","Valentina","Camila",
  "Isabella","Daniela","Fernanda","Gabriela","Helena","Irene","Julia","Karen","Laura","Melissa",
  "Nadia","Olivia","Patricia","Rebecca","Sofia","Teresa","Viviana","Ximena","Zoe","Alicia",
  "Brenda","Carmen","Diana","Elena","Fatima","Giselle","Hilda","Ingrid","Jessica","Katia",
  "Lorena","Marisol","Norma","Ofelia","Pilar","Rosario","Sandra","Tamara","Veronica","Yolanda",
  "Adriana","Barbara","Carolina","Debora","Estela","Francisca","Gilma","Hortencia","Irma","Jazmin",
  "Luz","Marcia","Nancy","Orquidea","Paulina","Rita","Susana","Tania","Valeria","Xenia",
  "Abigail","Belen","Cecilia","Doris","Eugenia","Flavia","Gladys","Haydee","Ines","Jana",
  "Karina","Leila","Miriam","Noemi","Pamela","Renata","Soledad","Anita","Betsy","Celia",
  "Dolores","Fanny","Gregoria","Jenny","Katy","Lily","Mirta","Nelly","Olga","Petra",
  "Rocio","Sara","Tere","Vera","Zelda","Azul","Cielo","Sol","Lago","Bosque",
  "Valle","Sierra","Campo","Prado","Monte","Cumbre","Loma","Querida","Alegria","Fortuna",
  "Bonita","Hermosa","Linda","Bella","Preciosa","Chispa","Veloz","Fuerte","Grande","Noble"
];

const veterinarios = ["Dr. Carlos Vega", "Dra. María Sánchez", "Dr. Rodrigo Pozo", "Dr. Luis Mora"];
const medicamentos = ["Ivermectina", "Oxitocina", "Penicilina", "Vitamina ADE", "Calcio IV", "Dexametasona", "Amoxicilina", "Oxitetraciclina"];

// ---- ANIMALS ----
export function generateAnimals() {
  const animals = [];
  let idx = 0;

  // Helper: random birth date for adult cow (2–7 years old as of April 2026)
  function adultBirth() {
    const yearsAgo = rf(2, 7, 0);
    const d = new Date('2026-04-07');
    d.setFullYear(d.getFullYear() - yearsAgo);
    d.setDate(d.getDate() - rb(0, 180));
    return d.toISOString().split('T')[0];
  }

  // Helper: last calving within last 1–18 months
  function lastCalving(monthsBack = 18) {
    return subDays(rb(30, monthsBack * 30));
  }

  const razaDist = [
    ...Array(65).fill("Holstein"),
    ...Array(30).fill("Jersey"),
    ...Array(25).fill("Brown Swiss"),
    ...Array(30).fill("Mestiza"),
  ];

  // ---- 120 Vacas Lactando ----
  for (let i = 0; i < 120; i++) {
    const raza = razaDist[rb(0, razaDist.length - 1)];
    // Holstein produces more, Jersey less but consistent
    let prod;
    if (raza === 'Holstein') prod = rb(16, 25);
    else if (raza === 'Jersey') prod = rb(12, 20);
    else if (raza === 'Brown Swiss') prod = rb(14, 22);
    else prod = rb(10, 18);

    const ultimoParto = lastCalving(10);
    animals.push({
      nombre: nombresVacas[idx] || `Vaca-${idx+1}`,
      numero_id: `V${String(idx + 1).padStart(3, '0')}`,
      raza,
      fecha_nacimiento: adultBirth(),
      sexo: "Hembra",
      estado: "Lactando",
      peso_kg: raza === 'Holstein' ? rb(450, 620) : raza === 'Jersey' ? rb(340, 450) : rb(380, 560),
      produccion_diaria_litros: prod,
      fecha_ultimo_parto: ultimoParto,
      notas: i % 15 === 0 ? "Excelente productora, seleccionada para reproducción" : "",
    });
    idx++;
  }

  // ---- 25 Vacas Secas ----
  for (let i = 0; i < 25; i++) {
    const raza = razaDist[rb(0, razaDist.length - 1)];
    const ultimoParto = subDays(rb(240, 400));
    animals.push({
      nombre: nombresVacas[idx] || `Vaca-${idx+1}`,
      numero_id: `V${String(idx + 1).padStart(3, '0')}`,
      raza,
      fecha_nacimiento: adultBirth(),
      sexo: "Hembra",
      estado: "Seca",
      peso_kg: rb(400, 640),
      produccion_diaria_litros: 0,
      fecha_ultimo_parto: ultimoParto,
      notas: i % 5 === 0 ? "En período de secado, preparación para próximo parto" : "",
    });
    idx++;
  }

  // ---- 30 Vacas Preñadas ----
  for (let i = 0; i < 30; i++) {
    const raza = razaDist[rb(0, razaDist.length - 1)];
    const ultimoParto = subDays(rb(180, 500));
    // Próxima cría: 60–180 days from now
    const diasParaParto = rb(15, 180);
    const proximaCria = addDays('2026-04-07', diasParaParto);
    animals.push({
      nombre: nombresVacas[idx] || `Vaca-${idx+1}`,
      numero_id: `V${String(idx + 1).padStart(3, '0')}`,
      raza,
      fecha_nacimiento: adultBirth(),
      sexo: "Hembra",
      estado: "Preñada",
      peso_kg: rb(420, 650),
      produccion_diaria_litros: rb(6, 15),
      fecha_ultimo_parto: ultimoParto,
      fecha_proxima_cria: proximaCria,
      notas: diasParaParto < 30 ? "Parto inminente, separar del hato" : "",
    });
    idx++;
  }

  // ---- 8 Vacas Enfermas ----
  const enfermedades = [
    "Mastitis clínica, bajo tratamiento con antibiótico",
    "Cojera leve, tratamiento podal en curso",
    "Metritis posparto, bajo antibioticoterapia",
    "Hipocalcemia, suplementada con calcio",
    "Diarrea bovina, rehidratación oral",
    "Neumonía leve, tratamiento con oxitetraciclina",
    "Retención de placenta, tratamiento hormonal",
    "Fiebre de origen no determinado, en observación",
  ];
  for (let i = 0; i < 8; i++) {
    const raza = razaDist[rb(0, razaDist.length - 1)];
    animals.push({
      nombre: nombresVacas[idx] || `Vaca-${idx+1}`,
      numero_id: `V${String(idx + 1).padStart(3, '0')}`,
      raza,
      fecha_nacimiento: adultBirth(),
      sexo: "Hembra",
      estado: "Enferma",
      peso_kg: rb(300, 520),
      produccion_diaria_litros: rb(2, 8),
      notas: enfermedades[i],
    });
    idx++;
  }

  // ---- 55 Terneros (calves) ----
  // Group 0–3 months: 20
  for (let i = 0; i < 20; i++) {
    const diasVida = rb(5, 90);
    const nacimiento = subDays(diasVida);
    animals.push({
      nombre: i % 3 === 0 ? `Ternero ${i+1}` : "",
      numero_id: `T${String(i + 1).padStart(3, '0')}`,
      raza: razaDist[rb(0, razaDist.length - 1)],
      fecha_nacimiento: nacimiento,
      sexo: i % 2 === 0 ? "Hembra" : "Macho",
      estado: "Ternero",
      peso_kg: rb(35, 80),
      produccion_diaria_litros: 0,
      notas: diasVida < 15 ? "Recién nacido, en calostro" : "Alimentación con leche + sustituto",
    });
    idx++;
  }
  // Group 4–6 months: 20
  for (let i = 0; i < 20; i++) {
    const diasVida = rb(120, 180);
    animals.push({
      nombre: "",
      numero_id: `T${String(i + 21).padStart(3, '0')}`,
      raza: razaDist[rb(0, razaDist.length - 1)],
      fecha_nacimiento: subDays(diasVida),
      sexo: i % 2 === 0 ? "Hembra" : "Macho",
      estado: "Ternero",
      peso_kg: rb(80, 140),
      produccion_diaria_litros: 0,
      notas: "En destete, dieta mixta",
    });
    idx++;
  }
  // Group 7–12 months: 15
  for (let i = 0; i < 15; i++) {
    const diasVida = rb(210, 365);
    animals.push({
      nombre: "",
      numero_id: `T${String(i + 41).padStart(3, '0')}`,
      raza: razaDist[rb(0, razaDist.length - 1)],
      fecha_nacimiento: subDays(diasVida),
      sexo: i % 2 === 0 ? "Hembra" : "Macho",
      estado: "Ternero",
      peso_kg: rb(140, 240),
      produccion_diaria_litros: 0,
      notas: "Consumo de forraje y concentrado",
    });
    idx++;
  }

  return animals;
}

// ---- POTREROS ----
export function generatePotreros() {
  return [
    {
      nombre: "Potrero 1 – El Llano", numero: "1", estado: "Pastoreando",
      hectareas: 5.5, tipo_pasto: "Rye grass perenne", capacidad_animales: 60,
      animales_actuales: 55, ultimo_uso: "2026-04-07",
      dias_descanso: 0,
      notas: "Lote principal de producción, riego por aspersión"
    },
    {
      nombre: "Potrero 2 – La Loma", numero: "2", estado: "Descansando",
      hectareas: 4.2, tipo_pasto: "Kikuyo mejorado", capacidad_animales: 45,
      animales_actuales: 0, ultimo_uso: "2026-03-28",
      dias_descanso: 21,
      proximo_uso: "2026-04-18",
      notas: "Fertilización con urea completada el 30/03"
    },
    {
      nombre: "Potrero 3 – La Quebrada", numero: "3", estado: "Disponible",
      hectareas: 6.0, tipo_pasto: "Pasto azul + trébol", capacidad_animales: 70,
      animales_actuales: 0, ultimo_uso: "2026-03-15",
      dias_descanso: 35,
      notas: "Listo para uso, excelente recuperación"
    },
    {
      nombre: "Potrero 4 – El Alto", numero: "4", estado: "Pastoreando",
      hectareas: 3.8, tipo_pasto: "Rye grass + pasto azul", capacidad_animales: 40,
      animales_actuales: 38, ultimo_uso: "2026-04-05",
      dias_descanso: 0,
      notas: "Vacas preñadas y secas"
    },
    {
      nombre: "Potrero 5 – La Vega", numero: "5", estado: "Critico",
      hectareas: 2.8, tipo_pasto: "Kikuyo degradado", capacidad_animales: 30,
      animales_actuales: 0, ultimo_uso: "2026-03-10",
      dias_descanso: 28,
      notas: "⚠️ Sobrepastoreo severo. Requiere resembrado y 45 días descanso"
    },
    {
      nombre: "Potrero 6 – El Pantano", numero: "6", estado: "Descansando",
      hectareas: 4.5, tipo_pasto: "Rye grass italiano", capacidad_animales: 50,
      animales_actuales: 0, ultimo_uso: "2026-03-22",
      dias_descanso: 18,
      proximo_uso: "2026-04-22",
      notas: "Encalado realizado, aguardando recuperación"
    },
    {
      nombre: "Potrero 7 – Las Palmas", numero: "7", estado: "Disponible",
      hectareas: 5.0, tipo_pasto: "Mezcla forrajera", capacidad_animales: 55,
      animales_actuales: 0, ultimo_uso: "2026-03-01",
      dias_descanso: 37,
      notas: "Excelente condición, destinado a novillas"
    },
    {
      nombre: "Potrero 8 – El Eucal", numero: "8", estado: "Pastoreando",
      hectareas: 3.2, tipo_pasto: "Kikuyo + trébol blanco", capacidad_animales: 35,
      animales_actuales: 32, ultimo_uso: "2026-04-06",
      dias_descanso: 0,
      notas: "Terneros 4–12 meses"
    },
    {
      nombre: "Potrero 9 – La Orilla", numero: "9", estado: "Disponible",
      hectareas: 4.0, tipo_pasto: "Pasto azul orchoro", capacidad_animales: 45,
      animales_actuales: 0, ultimo_uso: "2026-03-05",
      dias_descanso: 33,
      notas: "Cercano a fuente de agua natural"
    },
    {
      nombre: "Potrero 10 – Los Ceibos", numero: "10", estado: "Descansando",
      hectareas: 3.6, tipo_pasto: "Rye grass + festuca", capacidad_animales: 40,
      animales_actuales: 0, ultimo_uso: "2026-03-30",
      dias_descanso: 8,
      proximo_uso: "2026-04-29",
      notas: "Aplicación de herbicida el 01/04"
    },
  ];
}

// ---- TRANSACCIONES ----
export function generateTransacciones() {
  const transacciones = [];
  const TODAY = new Date('2026-04-07T12:00:00');

  function fmtDate(d) { return d.toISOString().split('T')[0]; }
  function daysAgo(n) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - n);
    return fmtDate(d);
  }
  function dateOfMonth(monthsBack, day) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - monthsBack, day);
    return fmtDate(d);
  }

  // -------- ÚLTIMOS 3 MESES: Ventas de leche diarias --------
  // Base daily production ~2100L, price $0.42/L, slight variation
  const baseProd = [2050, 2100, 2150]; // avg per month (older to recent)
  for (let m = 2; m >= 0; m--) {
    const monthDays = m === 0 ? TODAY.getDate() : 30;
    const baseL = baseProd[2 - m];
    for (let d = 1; d <= monthDays; d++) {
      const date = new Date(TODAY.getFullYear(), TODAY.getMonth() - m, d);
      if (date > TODAY) continue;
      // Slight daily variation ±8%
      const variation = 0.92 + Math.random() * 0.16;
      const litros = Math.round(baseL * variation);
      const precio = 0.42;
      transacciones.push({
        tipo: "Ingreso",
        categoria: "Venta de leche",
        monto_usd: parseFloat((litros * precio).toFixed(2)),
        fecha: fmtDate(date),
        descripcion: `Venta de leche – ${litros}L a $${precio}/L`,
        litros,
        precio_por_litro: precio,
        referencia: `REC-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(d).padStart(2,'0')}`,
      });
    }
  }

  // -------- VENTAS DE ANIMALES --------
  transacciones.push({
    tipo: "Ingreso", categoria: "Venta de animal",
    monto_usd: 2400,
    fecha: daysAgo(68),
    descripcion: "Venta de 3 terneros machos Mestiza a Hacienda La Merced",
    referencia: "FAC-2026-0312",
  });
  transacciones.push({
    tipo: "Ingreso", categoria: "Venta de animal",
    monto_usd: 1800,
    fecha: daysAgo(42),
    descripcion: "Venta de 2 vacas Holstein de descarte",
    referencia: "FAC-2026-0357",
  });
  transacciones.push({
    tipo: "Ingreso", categoria: "Venta de animal",
    monto_usd: 950,
    fecha: daysAgo(18),
    descripcion: "Venta 1 ternero macho Jersey – 6 meses",
    referencia: "FAC-2026-0401",
  });

  // -------- EGRESOS MENSUALES DETALLADOS --------
  for (let m = 0; m < 3; m++) {
    // Alimentación – compra mensual concentrado y sal mineral
    transacciones.push({
      tipo: "Egreso", categoria: "Alimentacion",
      monto_usd: rb(1400, 1700),
      fecha: dateOfMonth(m, 3),
      descripcion: "Compra de balanceado lechero 22% proteína – 5 ton",
      referencia: `COMP-BAL-${m}`,
    });
    transacciones.push({
      tipo: "Egreso", categoria: "Alimentacion",
      monto_usd: rb(180, 260),
      fecha: dateOfMonth(m, 10),
      descripcion: "Sal mineralizada, melaza y suplemento vitamínico",
    });
    // Mano de obra
    transacciones.push({
      tipo: "Egreso", categoria: "Mano de obra",
      monto_usd: rb(1800, 2100),
      fecha: dateOfMonth(m, 28),
      descripcion: "Nómina mensual – 3 ordeñadores + 1 vaquero",
    });
    transacciones.push({
      tipo: "Egreso", categoria: "Mano de obra",
      monto_usd: rb(280, 380),
      fecha: dateOfMonth(m, 15),
      descripcion: "Pago por trabajos de mantenimiento y limpieza",
    });
    // Veterinario
    transacciones.push({
      tipo: "Egreso", categoria: "Veterinario",
      monto_usd: rb(320, 520),
      fecha: dateOfMonth(m, 8),
      descripcion: `Visita Dr. Vega – revisión sanitaria y vacunación (${rb(20,40)} animales)`,
    });
    transacciones.push({
      tipo: "Egreso", categoria: "Medicamentos",
      monto_usd: rb(180, 350),
      fecha: dateOfMonth(m, 14),
      descripcion: "Antibióticos, vitaminas, antiparasitarios y hormonas reproductivas",
    });
    // Servicios
    transacciones.push({
      tipo: "Egreso", categoria: "Servicios",
      monto_usd: rb(85, 130),
      fecha: dateOfMonth(m, 6),
      descripcion: "Energía eléctrica – ordeño mecánico y enfriamiento leche",
    });
    // Combustible
    transacciones.push({
      tipo: "Egreso", categoria: "Combustible",
      monto_usd: rb(120, 180),
      fecha: dateOfMonth(m, 20),
      descripcion: "Diésel tractor y bomba de riego",
    });
    // Mantenimiento
    if (m < 2) {
      transacciones.push({
        tipo: "Egreso", categoria: "Mantenimiento",
        monto_usd: rb(200, 450),
        fecha: dateOfMonth(m, 22),
        descripcion: m === 0 ? "Reparación sistema de ordeño y sellado de corrales" : "Mantenimiento cercas eléctricas y bebederos",
      });
    }
  }

  // Compra semillas/fertilizante (una vez)
  transacciones.push({
    tipo: "Egreso", categoria: "Otros",
    monto_usd: 680,
    fecha: daysAgo(55),
    descripcion: "Fertilizante urea + semilla rye grass – 3 potreros",
  });
  transacciones.push({
    tipo: "Egreso", categoria: "Equipos",
    monto_usd: 1200,
    fecha: daysAgo(72),
    descripcion: "Compra de bomba centrífuga para sistema de riego",
    referencia: "FAC-PROV-0124",
  });

  return transacciones;
}

// ---- EVENTOS ----
export function generateEventos() {
  const eventos = [];

  // Names pool for events
  const lacNames = nombresVacas.slice(0, 120);
  const prenNames = nombresVacas.slice(145, 175);

  // ---- Producción diaria últimos 60 días ----
  const baseProdEvento = 2100;
  for (let d = 0; d < 60; d++) {
    const variation = 0.93 + Math.random() * 0.14;
    const litros = Math.round(baseProdEvento * variation);
    eventos.push({
      tipo: "Produccion",
      fecha: subDays(d),
      valor_litros: litros,
      descripcion: `Producción total del día – ${litros}L`,
    });
  }

  // ---- Partos recientes ----
  const partosRecientes = [
    { nombre: "Marisol", dias: 3, ternero: "Hembra sana, 38kg" },
    { nombre: "Valentina", dias: 9, ternero: "Macho, 42kg, vigoroso" },
    { nombre: "Esperanza", dias: 14, ternero: "Hembra, 36kg" },
    { nombre: "Camila", dias: 21, ternero: "Macho, 44kg" },
    { nombre: "Lorena", dias: 28, ternero: "Hembra, 39kg – gemelar, ternero 2 débil" },
    { nombre: "Fernanda", dias: 35, ternero: "Hembra, 37kg" },
    { nombre: "Beatriz", dias: 42, ternero: "Macho, 46kg" },
    { nombre: "Helena", dias: 50, ternero: "Hembra, 40kg" },
  ];
  partosRecientes.forEach(({ nombre, dias, ternero }) => {
    eventos.push({
      tipo: "Parto",
      animal_nombre: nombre,
      fecha: subDays(dias),
      descripcion: `Parto eutócico. ${ternero}`,
      veterinario: dias < 15 ? pick(veterinarios) : "",
      notas: nombre === "Lorena" ? "Segundo ternero requirió cuidados intensivos" : "",
    });
  });

  // ---- Inseminaciones ----
  const inseminaciones = [
    { nombre: "Sofia", dias: 5 }, { nombre: "Irene", dias: 8 },
    { nombre: "Natalia", dias: 12 }, { nombre: "Pamela", dias: 18 },
    { nombre: "Giselle", dias: 22 }, { nombre: "Daniela", dias: 30 },
    { nombre: "Rosa", dias: 38 }, { nombre: "Nadia", dias: 45 },
    { nombre: "Brenda", dias: 52 }, { nombre: "Carmen", dias: 58 },
  ];
  inseminaciones.forEach(({ nombre, dias }) => {
    eventos.push({
      tipo: "Inseminacion",
      animal_nombre: nombre,
      fecha: subDays(dias),
      descripcion: `Inseminación artificial con semen sexado – Holstein importado`,
      veterinario: pick(veterinarios),
    });
  });

  // ---- Confirmaciones de preñez (ecografía) ----
  [
    { nombre: "Patricia", dias: 10, result: "Preñez confirmada 42 días" },
    { nombre: "Lorena", dias: 16, result: "Preñez 38 días, feto viable" },
    { nombre: "Viviana", dias: 25, result: "Preñez 60 días, gemelos" },
    { nombre: "Teresa", dias: 31, result: "Preñez 45 días confirmada" },
    { nombre: "Alicia", dias: 44, result: "Vacía – repetir inseminación" },
  ].forEach(({ nombre, dias, result }) => {
    eventos.push({
      tipo: "Otro",
      animal_nombre: nombre,
      fecha: subDays(dias),
      descripcion: `Diagnóstico preñez ecográfico: ${result}`,
      veterinario: pick(veterinarios),
    });
  });

  // ---- Vacunaciones colectivas ----
  [
    { dias: 7, desc: "Vacunación contra Fiebre Aftosa – 185 animales", med: "Vacuna Aftosa bivalente", dosis: "2ml SC" },
    { dias: 20, desc: "Vacunación Brucelosis – 45 novillas", med: "RB51", dosis: "2ml SC" },
    { dias: 38, desc: "Desparasitación interna – todo el hato", med: "Ivermectina + Albendazol", dosis: "1ml/50kg" },
    { dias: 55, desc: "Vacunación IBR + BVD – vacas lecheras", med: "Bovilis BVD+IBR", dosis: "5ml IM" },
  ].forEach(({ dias, desc, med, dosis }) => {
    eventos.push({
      tipo: "Tratamiento",
      fecha: subDays(dias),
      descripcion: desc,
      veterinario: pick(veterinarios),
      medicamento: med,
      dosis,
    });
  });

  // ---- Enfermedades individuales ----
  const enfermedades = [
    { nombre: "Nube", dias: 2, desc: "Mastitis clínica cuarto trasero derecho", med: "Mastijet Fort intramamario", dosis: "1 tubo/día × 3 días" },
    { nombre: "Gema", dias: 4, desc: "Cojera por úlcera de suela – podología", med: "Sulfato de cobre + vendaje", dosis: "Tópico" },
    { nombre: "Manchas", dias: 6, desc: "Hipocalcemia posparto (fiebre de leche)", med: "Calcio IV gluconato 23%", dosis: "500ml IV lento" },
    { nombre: "Lola", dias: 11, desc: "Diarrea aguda – posible salmonelosis", med: "Fluidoterapia + Enrofloxacina", dosis: "5mg/kg IM" },
    { nombre: "Canela", dias: 15, desc: "Retención de placenta – 24h posparto", med: "Oxitocina + Antibiótico", dosis: "20UI IM" },
    { nombre: "Blanca", dias: 19, desc: "Neumonía leve, tos seca, fiebre 39.8°C", med: "Oxitetraciclina LA", dosis: "20mg/kg IM" },
    { nombre: "Dulce", dias: 26, desc: "Metritis posparto, secreción purulenta", med: "Penicilina + Metronidazol", dosis: "Por prescripción veterinaria" },
    { nombre: "Azul", dias: 33, desc: "Timpanismo espumoso post cambio de pastura", med: "Poloxaleno + trocar ruminal", dosis: "Emergencia resuelta" },
  ];
  enfermedades.forEach(({ nombre, dias, desc, med, dosis }) => {
    eventos.push({
      tipo: "Enfermedad",
      animal_nombre: nombre,
      fecha: subDays(dias),
      descripcion: desc,
      veterinario: pick(veterinarios),
      medicamento: med,
      dosis,
    });
  });

  // ---- Ventas de animales ----
  eventos.push({
    tipo: "Venta",
    animal_nombre: "Toro mestizo 3 años",
    fecha: subDays(68),
    descripcion: "Venta toro reproductor descarte – peso 520kg",
    valor_usd: 1450,
  });
  eventos.push({
    tipo: "Venta",
    animal_nombre: "Lote 3 terneros machos",
    fecha: subDays(42),
    descripcion: "Venta terneros machos 6–8 meses a intermediario",
    valor_usd: 2400,
  });
  eventos.push({
    tipo: "Venta",
    animal_nombre: "Vaca Holstein descarte",
    fecha: subDays(18),
    descripcion: "Descarte por baja producción crónica (<8L/día). Venta a camal.",
    valor_usd: 920,
  });

  // ---- Muertes (muy pocas) ----
  eventos.push({
    tipo: "Muerte",
    animal_nombre: "Ternero T012",
    fecha: subDays(22),
    descripcion: "Muerte por diarrea neonatal severa, 8 días de vida",
    notas: "Se aplicó tratamiento oportuno sin resultado. Notificado a veterinario.",
  });
  eventos.push({
    tipo: "Muerte",
    animal_nombre: "Vaca Orquidea",
    fecha: subDays(51),
    descripcion: "Muerte por complicaciones de parto distócico",
    veterinario: pick(veterinarios),
    notas: "Ternero sobrevivió, en lactancia artificial",
  });

  // ---- Destejes ----
  [
    { nombre: "T003", dias: 17 }, { nombre: "T007", dias: 24 },
    { nombre: "T011", dias: 36 }, { nombre: "T015", dias: 45 },
  ].forEach(({ nombre, dias }) => {
    eventos.push({
      tipo: "Destete",
      animal_nombre: nombre,
      fecha: subDays(dias),
      descripcion: "Destete a los 60 días – transición a alimento sólido",
    });
  });

  // ---- Partos futuros (en calendario) ----
  [
    { nombre: "Isabella", dias: -8, desc: "Parto esperado – primera cría Holstein" },
    { nombre: "Karen", dias: -14, desc: "Segundo parto, excelente historial" },
    { nombre: "Gabriela", dias: -21, desc: "Parto esperado – vigilancia especial" },
    { nombre: "Melissa", dias: -30, desc: "Tercer parto" },
    { nombre: "Noemi", dias: -38, desc: "Parto esperado – preparar calostro" },
    { nombre: "Renata", dias: -52, desc: "Primer parto Holstein, 2 años" },
    { nombre: "Soledad", dias: -60, desc: "Parto esperado" },
  ].forEach(({ nombre, dias, desc }) => {
    eventos.push({
      tipo: "Parto",
      animal_nombre: nombre,
      fecha: subDays(dias), // negative = future
      descripcion: desc,
    });
  });

  // ---- Inseminaciones próximas ----
  [
    { nombre: "Alegria", dias: -5 }, { nombre: "Fortuna", dias: -10 },
    { nombre: "Bonita", dias: -18 },
  ].forEach(({ nombre, dias }) => {
    eventos.push({
      tipo: "Inseminacion",
      animal_nombre: nombre,
      fecha: subDays(dias),
      descripcion: "Inseminación programada – seguimiento ciclo estral",
      veterinario: pick(veterinarios),
    });
  });

  // ---- Tratamientos individuales recientes ----
  for (let i = 0; i < 8; i++) {
    eventos.push({
      tipo: "Tratamiento",
      animal_nombre: pick(lacNames),
      fecha: subDays(rb(1, 30)),
      descripcion: pick([
        "Suplementación vitamínica ADE posparto",
        "Control pedal preventivo",
        "Revisión reproductiva – palpación rectal",
        "Aplicación sellador de pezones post ordeño",
        "Bolo de calcio oral preventivo",
        "Examen de condición corporal",
      ]),
      veterinario: pick(veterinarios),
      medicamento: pick(medicamentos),
      dosis: `${rb(2, 20)}ml ${pick(['IM','SC','IV','oral'])}`,
    });
  }

  return eventos;
}

// Re-export names for use in other modules
export { nombresVacas };