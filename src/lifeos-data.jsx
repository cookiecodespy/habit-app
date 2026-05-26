// lifeos-data.jsx — sample task data for the demo day

const TODAY_TASKS_RAW = [
  { id: 't1', start: '06:30', end: '06:45', title: 'Despertar suave',         subtitle: 'Ritual de la mañana', icon: 'sun',         color: 'amber',    status: 'done',  alarm: true },
  { id: 't2', start: '06:45', end: '07:15', title: 'Estirar y meditar',      subtitle: '10m respiración, 20m flow', icon: 'meditate',   color: 'lavender', status: 'done' },
  { id: 't3', start: '07:15', end: '07:45', title: 'Ducha fría',             subtitle: 'Wim Hof · 30s al final', icon: 'shower',     color: 'sky',      status: 'done' },
  { id: 't4', start: '07:45', end: '08:15', title: 'Espresso lento',           subtitle: 'Leer 5 páginas', icon: 'coffee',     color: 'ember',    status: 'doing', progress: 0.4 },
  { id: 't5', start: '08:15', end: '08:45', title: 'Bici al estudio',         subtitle: '4.2 km · ruta escénica', icon: 'bike',       color: 'mint',     status: 'todo' },
  { id: 't6', start: '09:00', end: '11:00', title: 'Deep work — LifeOS Beta', subtitle: '2 hr · sin teléfono', icon: 'briefcase',  color: 'slate',    status: 'todo', subtasks: { done: 2, total: 5 } },
  { id: 'br1', kind: 'break', start: '11:00', end: '11:15', title: 'Descanso — estirar y agua', minutes: 15 },
  { id: 't7', start: '11:15', end: '12:00', title: 'Revisión de diseño',           subtitle: 'con Tomás · Zoom', icon: 'presentation', color: 'rose', status: 'todo', alarm: true },
  { id: 't8', start: '12:00', end: '13:00', title: 'Almuerzo con María',        subtitle: 'Café Forma', icon: 'meal',       color: 'sun',      status: 'todo' },
  { id: 't9', start: '13:00', end: '14:30', title: 'Estudiar inglés',           subtitle: 'Capítulo 7 · 90 min', icon: 'book',       color: 'plum',     status: 'todo', subtasks: { done: 0, total: 3 } },
  { id: 't10', start: '14:30', end: '15:00', title: 'Caminar en el parque',       subtitle: 'Sin teléfono', icon: 'walk',       color: 'lime',     status: 'todo' },
  { id: 't11', start: '15:00', end: '17:00', title: 'Llamadas con clientes',           subtitle: '3 llamadas agendadas', icon: 'call',       color: 'teal',     status: 'todo', alarm: true },
  { id: 'br2', kind: 'break', start: '17:00', end: '17:30', title: 'Margen 30 min — ¿algo más?', minutes: 30, suggest: true },
  { id: 't12', start: '17:30', end: '18:30', title: 'Supermercado',              subtitle: 'Lista lista · 8 items', icon: 'cart',       color: 'coral',    status: 'todo', subtasks: { done: 0, total: 8 } },
  { id: 't13', start: '19:00', end: '20:00', title: 'Cocinar la cena',            subtitle: 'Salmón + verdes', icon: 'meal',       color: 'sun',      status: 'todo' },
  { id: 't14', start: '20:30', end: '21:30', title: 'Leer y journaling',         subtitle: '30 min de lectura', icon: 'pencil',     color: 'rose',     status: 'todo' },
  { id: 't15', start: '22:30', end: '23:00', title: 'Bajar revoluciones',              subtitle: 'Sin pantallas', icon: 'moon',       color: 'lavender', status: 'todo' },
];

const QUICK_ACTIONS = [
  { id: 'q1', label: 'Llamar a mamá',     icon: 'call',     color: 'mint' },
  { id: 'q2', label: 'Planear mañana',    icon: 'sparkle',  color: 'lavender' },
  { id: 'q3', label: 'Viaje a Tokio',     icon: 'palm',     color: 'sun' },
  { id: 'q4', label: 'Sesión de gym',     icon: 'yoga',     color: 'coral' },
];

const INBOX_ITEMS = [
  { id: 'i1', title: 'Agendar cita con el dentista',     hint: 'Sugerido: esta semana',     color: 'rose'   },
  { id: 'i2', title: 'Leer “Hábitos Atómicos” cap. 4',   hint: '15 min · noche',         color: 'plum'   },
  { id: 'i3', title: 'Comprar flores para el aniversario',  hint: 'Antes del viernes',                color: 'coral'  },
  { id: 'i4', title: 'Refactor de la capa de datos',       hint: '2 hr · deep work',   color: 'slate'  },
  { id: 'i5', title: 'Enviar reembolso del viaje',      hint: '20 min',                   color: 'amber'  },
  { id: 'i6', title: 'Elegir clase de yoga para el martes',    hint: '5 min',                    color: 'mint'   },
];

// Days of current visible week. Selected = today.
const WEEK_DAYS = [
  { d: 12, label: 'Lun', dots: ['coral','mint','sky'] },
  { d: 13, label: 'Mar', dots: ['amber','rose','mint','sky'] },
  { d: 14, label: 'Mié', dots: ['lavender','coral'] },
  { d: 15, label: 'Jue', dots: ['sky','mint','sun','rose'] },
  { d: 16, label: 'Vie', dots: ['coral','amber','mint','sky','lavender'], today: true },
  { d: 17, label: 'Sáb', dots: ['lime','sun'] },
  { d: 18, label: 'Dom', dots: ['rose'] },
];

// Month grid for May 2026 — first day = Friday, 31 days.
function buildMonthCells() {
  const cells = [];
  // pad: Mon=1...Sun=7. May 1 2026 is Friday=5. Lead from Mon.
  for (let i = 0; i < 4; i++) cells.push({ d: 27 + i, muted: true, dots: [] });
  for (let d = 1; d <= 31; d++) {
    const seed = (d * 31) % 7;
    const palette = ['coral','mint','sky','amber','lavender','rose','sun','plum','lime','teal'];
    const count = (d % 5 === 0) ? 5 : (d % 3 === 0 ? 4 : (d % 2 === 0 ? 3 : 2));
    const dots = Array.from({length: count}, (_, k) => palette[(d + k * 3 + seed) % palette.length]);
    cells.push({ d, dots, today: d === 16 });
  }
  // pad trailing
  while (cells.length % 7) cells.push({ d: cells.length - 30, muted: true, dots: [] });
  return cells;
}
const MONTH_CELLS = buildMonthCells();

// ──────────────────────────────────────────────────────────────
// Per-day tasks — deterministic by day-of-month so Agenda can show
// different tasks when you tap different days.
// ──────────────────────────────────────────────────────────────
const TASK_TEMPLATES = [
  { title: 'Despertar suave',       sub: 'Ritual de la mañana',           icon: 'sun',        color: 'amber',    dur: 15 },
  { title: 'Estirar y meditar',   sub: '10m respiración, 20m flow',     icon: 'meditate',   color: 'lavender', dur: 30 },
  { title: 'Ducha fría',          sub: 'Protocolo Wim Hof',         icon: 'shower',     color: 'sky',      dur: 20 },
  { title: 'Espresso lento',        sub: 'Leer 5 páginas',             icon: 'coffee',     color: 'ember',    dur: 25 },
  { title: 'Bici al estudio',      sub: '4.2 km · escénico',          icon: 'bike',       color: 'mint',     dur: 25 },
  { title: 'Deep work',            sub: 'Sin teléfono · bloque 2 hr',   icon: 'briefcase',  color: 'slate',    dur: 120 },
  { title: 'Revisión de diseño',        sub: 'Zoom · con Tomás',        icon: 'presentation', color: 'rose',   dur: 45 },
  { title: 'Almuerzo',                sub: 'Café Forma',               icon: 'meal',       color: 'sun',      dur: 60 },
  { title: 'Estudiar inglés',        sub: 'Capítulo 7',                icon: 'book',       color: 'plum',     dur: 90 },
  { title: 'Caminar en el parque',     sub: 'Sin teléfono',                 icon: 'walk',       color: 'lime',     dur: 30 },
  { title: 'Llamadas con clientes',         sub: '3 llamadas agendadas',        icon: 'call',       color: 'teal',     dur: 60 },
  { title: 'Supermercado',            sub: 'Lista · 8 items',           icon: 'cart',       color: 'coral',    dur: 60 },
  { title: 'Cocinar la cena',          sub: 'Salmón + verdes',          icon: 'meal',       color: 'sun',      dur: 60 },
  { title: 'Leer y journaling',       sub: '30 min de lectura',           icon: 'pencil',     color: 'rose',     dur: 60 },
  { title: 'Bajar revoluciones',            sub: 'Sin pantallas',               icon: 'moon',       color: 'lavender', dur: 30 },
  { title: 'Gym',          sub: 'Día de empuje',                 icon: 'yoga',       color: 'coral',    dur: 75 },
  { title: 'Standup del equipo',         sub: 'Sync diario',               icon: 'message',    color: 'sky',      dur: 15 },
  { title: 'Planear mañana',        sub: 'Review de 10 min',            icon: 'sparkle',    color: 'lavender', dur: 10 },
];

// Returns tasks for a given day (year, month0-indexed, day).
// Demo data ONLY for May 11–17, 2026 (the seed week shown to new users)
// AND only during the first 7 days from when the user signed up.
// After that, every day is empty so the user fills it themselves.
function tasksForDay(day, year, month) {
  if (typeof isWithinFirstWeekFromStorage === 'function' && !isWithinFirstWeekFromStorage()) return [];
  if (year !== undefined && month !== undefined) {
    if (year !== 2026 || month !== 4) return [];  // not May 2026
  }
  if (day < 11 || day > 17) return [];
  const out = [];
  const count = 4 + ((day * 7) % 5);
  let cursor = 6.5 + ((day * 3) % 2);
  for (let i = 0; i < count; i++) {
    const tpl = TASK_TEMPLATES[(day * 5 + i * 3) % TASK_TEMPLATES.length];
    const sh = Math.floor(cursor), sm = Math.round((cursor - sh) * 60);
    const dur = tpl.dur;
    const eh = sh + Math.floor((sm + dur) / 60), em = (sm + dur) % 60;
    out.push({
      id: `d${day}-${i}`,
      start: `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`,
      end:   `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`,
      title: tpl.title, subtitle: tpl.sub,
      icon: tpl.icon, color: tpl.color,
      status: (day < 16 || (day === 16 && i < 3)) ? 'done' : (day === 16 && i === 3 ? 'doing' : 'todo'),
    });
    cursor = eh + em/60 + 0.25 + ((i % 2) * 0.25);
    if (cursor > 22) break;
  }
  return out;
}

// Today's tasks — empty if past first week
function getTodayTasks() {
  if (typeof isWithinFirstWeekFromStorage === 'function' && !isWithinFirstWeekFromStorage()) return [];
  return TODAY_TASKS_RAW;
}

// Month name helper
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Build a 6-row month grid for any (year, month0)
function buildMonth(year, month0) {
  const first = new Date(year, month0, 1);
  // Make Monday=0 ... Sunday=6
  const firstDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const prevDays = new Date(year, month0, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ d: prevDays - firstDow + 1 + i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, inMonth: true });
  while (cells.length % 7) cells.push({ d: cells.length - firstDow - daysInMonth + 1, muted: true });
  // pad to 6 rows for stable height
  while (cells.length < 42) cells.push({ d: cells.length - firstDow - daysInMonth + 1, muted: true });
  return cells;
}

// Backwards-compat constant — code that reads TODAY_TASKS directly gets
// the dynamic gated list. New code should call getTodayTasks().
Object.defineProperty(window, 'TODAY_TASKS', {
  configurable: true,
  get() { return getTodayTasks(); },
});

Object.assign(window, {
  TODAY_TASKS_RAW, getTodayTasks,
  QUICK_ACTIONS, INBOX_ITEMS, WEEK_DAYS, MONTH_CELLS,
  TASK_TEMPLATES, tasksForDay, MONTH_NAMES, buildMonth,
});
