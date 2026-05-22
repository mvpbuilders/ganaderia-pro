// Seed script - run from Configuracion page to generate milk records
// This is called by the seeder button

export const COWS_ORDENIO = [
  { id: '69eab5476eb0501e166ace99', nombre: 'Abigail', am: 13.0, pm: 11.0 },
  { id: '69eab5476eb0501e166ace85', nombre: 'Adriana', am: 13.5, pm: 11.5 },
  { id: '69eab5476eb0501e166ace70', nombre: 'Alicia', am: 11.5, pm: 9.5 },
  { id: '69eab5476eb0501e166ace51', nombre: 'Aurora', am: 16.5, pm: 14.5 },
  { id: '69eab5476eb0501e166ace86', nombre: 'Barbara', am: 12.0, pm: 10.5 },
  { id: '69eab5476eb0501e166ace59', nombre: 'Beatriz', am: 11.5, pm: 10.0 },
  { id: '69eab5476eb0501e166ace9a', nombre: 'Belen', am: 15.0, pm: 13.0 },
  { id: '69eab5476eb0501e166ace3d', nombre: 'Blanca', am: 16.0, pm: 14.0 },
  { id: '69eab5476eb0501e166ace71', nombre: 'Brenda', am: 17.5, pm: 15.5 },
  { id: '69eab5476eb0501e166ace50', nombre: 'Brisa', am: 9.5, pm: 8.0 },
  { id: '69eab5476eb0501e166ace8f', nombre: 'Luz', am: 6.5, pm: 5.5 },
  { id: '69eab5476eb0501e166ace91', nombre: 'Nancy', am: 11.5, pm: 9.5 },
  { id: '69eab5476eb0501e166ace97', nombre: 'Valeria', am: 11.0, pm: 9.5 },
  { id: '69eab5476eb0501e166ace79', nombre: 'Jessica', am: 7.0, pm: 6.0 },
  { id: '69eab5476eb0501e166ace7c', nombre: 'Marisol', am: 14.0, pm: 12.0 },
  { id: '69eab5476eb0501e166ace92', nombre: 'Orquidea', am: 14.0, pm: 12.0 },
  { id: '69eab5476eb0501e166ace82', nombre: 'Tamara', am: 10.0, pm: 8.5 },
  { id: '69eab5476eb0501e166ace89', nombre: 'Estela', am: 14.5, pm: 12.5 },
  { id: '69eab5476eb0501e166ace98', nombre: 'Xenia', am: 9.0, pm: 7.5 },
];

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function vary(base, pct = 0.08) {
  return parseFloat((base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(1));
}

export function generateMilkRecords(cows) {
  const records = [];
  const START = '2026-03-01';
  const END = '2026-05-21';
  
  // Generate all dates
  const dates = [];
  let cur = START;
  while (cur <= END) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }

  for (const cow of cows) {
    for (const fecha of dates) {
      // Slight weekly pattern: Monday slight dip, weekend slight boost
      const dow = new Date(fecha + 'T12:00:00').getDay();
      const dowFactor = dow === 1 ? 0.97 : dow === 0 || dow === 6 ? 1.01 : 1.0;
      
      // Gradual production curve: slight increase March→April, slight decline May (seasonal)
      const dayIndex = dates.indexOf(fecha);
      const totalDays = dates.length;
      let seasonFactor;
      if (dayIndex < 31) seasonFactor = 0.97 + (dayIndex / 31) * 0.03; // March: ramp up
      else if (dayIndex < 61) seasonFactor = 1.0 + ((dayIndex - 31) / 30) * 0.02; // April: peak
      else seasonFactor = 1.02 - ((dayIndex - 61) / (totalDays - 61)) * 0.04; // May: slight decline

      const am = vary(cow.am * dowFactor * seasonFactor, 0.07);
      const pm = vary(cow.pm * dowFactor * seasonFactor, 0.07);
      const total = parseFloat((am + pm).toFixed(1));

      records.push({
        fecha,
        animal_id: cow.id,
        animal_nombre: cow.nombre,
        litros_am: Math.max(0.1, am),
        litros_pm: Math.max(0.1, pm),
        total_litros: Math.max(0.2, total),
        en_retiro: false,
      });
    }
  }

  return records;
}