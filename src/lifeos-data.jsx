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
// Returns tasks for a given day from user's stored tasks.
// userTasks array must be passed in; no more demo data.
function tasksForDay(day, year, month, userTasks) {
  if (!userTasks || !userTasks.length) return [];
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return userTasks.filter(t => t.targetDate === dateStr).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
}

// Today's tasks — always empty; real tasks come from user's localStorage
function getTodayTasks() {
  return [];
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

// ══════════════════════════════════════════════════════════════
// LifeOS Store — single source of truth, localStorage-backed.
// Shaped for a future Supabase sync: every record carries id +
// createdAt + updatedAt, mutations are pure, and the persistence
// layer is isolated so a remote adapter can drop in later.
// ══════════════════════════════════════════════════════════════
const LO_KEYS = {
  tasks:    'lifeos.tasks.v2',
  habits:   'lifeos.habits.v1',
  inbox:    'lifeos.inbox.v1',
  routines: 'lifeos.routines.v1',
};

// ── low-level helpers ────────────────────────────────────────
function loRead(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function loWrite(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    // Storage full (or blocked): warn the user instead of dropping data silently,
    // so a task never "disappears" after a success toast.
    if (e && (e.name === 'QuotaExceededError' || /quota|exceeded/i.test(e.message || ''))) {
      if (window.toast) window.toast('No hay espacio para guardar. Exporta o libera datos.', { tone: 'error', icon: 'alert' });
    } else if (window.toast) {
      window.toast('No se pudo guardar el cambio.', { tone: 'error' });
    }
  }
  // Broadcast so every mounted hook re-reads — keeps phone/tablet shells and
  // any open screen in lockstep without prop drilling.
  window.dispatchEvent(new CustomEvent('lo-store-change', { detail: { key } }));
}
function loUid(prefix = 't') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Local (not UTC) date string — avoids the off-by-one near midnight in
// Chile's timezone that the old toISOString().slice(0,10) path had.
function loDateStr(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
function loHHMMtoMin(s) { if (!s) return 0; const [h, m] = String(s).split(':').map(Number); return h * 60 + m; }
function loMinToHHMM(t) { t = ((t % 1440) + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }
function loDow(dateStr) { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d).getDay(); } // 0=Sun

// ── task normalization ───────────────────────────────────────
// Accepts a partial/legacy task object and returns a canonical one.
function loNormalizeTask(raw) {
  const t = { ...raw };
  t.id = t.id || loUid('t');
  t.kind = t.kind || 'task';
  t.title = (t.title || '').trim();
  t.icon = t.icon || 'star';
  t.color = t.color || 'mint';
  t.status = t.status || 'todo';
  t.priority = t.priority || 'medium';
  t.date = t.date || t.targetDate || loDateStr();
  t.targetDate = t.date; // legacy alias kept in sync for old screens
  t.start = t.start || '09:00';
  if (typeof t.durationMin !== 'number') {
    t.durationMin = (t.start && t.end) ? Math.max(5, loHHMMtoMin(t.end) - loHHMMtoMin(t.start)) : 30;
  }
  t.end = loMinToHHMM(loHHMMtoMin(t.start) + t.durationMin);
  // Subtasks are always an array of {id,label,done}. Legacy {done,total}
  // objects are expanded into placeholder steps so progress still renders.
  if (Array.isArray(t.subtasks)) {
    t.subtasks = t.subtasks.map(s => ({ id: s.id || loUid('s'), label: s.label || 'Paso', done: !!s.done }));
  } else if (t.subtasks && typeof t.subtasks === 'object') {
    const { done = 0, total = 0 } = t.subtasks;
    t.subtasks = Array.from({ length: total }, (_, i) => ({ id: loUid('s'), label: `Paso ${i + 1}`, done: i < done }));
  } else {
    t.subtasks = [];
  }
  t.note = t.note || t.subtitle || '';
  t.subtitle = t.note || undefined; // legacy alias
  t.reminder = !!t.reminder || !!t.alarm;
  t.recur = t.recur || null;           // { freq:'daily'|'weekly'|'weekdays', days:[0..6] }
  t.deadline = t.deadline || null;     // 'YYYY-MM-DD'
  t.allDay = !!t.allDay;               // no time slot — rides the all-day pill row
  t.category = t.category || null;     // 'vida' | 'trabajo' | 'uni' | null — Agenda filter theme
  t.isHabit = !!t.isHabit;
  t.createdAt = t.createdAt || Date.now();
  // Preserve the real last-edit time. Reading the store must NOT bump this,
  // or future last-write-wins sync between two phones picks the wrong record.
  // Mutations bump updatedAt explicitly (see addTask/updateTask/toggle*).
  t.updatedAt = t.updatedAt || t.createdAt;
  return t;
}

// Ensure a concrete record exists for an id. Recurring occurrences come in as
// virtual "base@date" ids that aren't in the store yet; materialize them so
// edits (update/toggleSubtask) actually persist instead of being silent no-ops.
function loMaterializeOccurrence(list, id) {
  let task = list.find(t => t.id === id);
  if (task) return task;
  if (String(id).includes('@')) {
    const [baseId, date] = id.split('@');
    const base = list.find(t => t.id === baseId);
    if (base) {
      task = loNormalizeTask({ ...base, id, date, recur: null, _from: baseId });
      list.push(task);
      return task;
    }
  }
  return null;
}

// A materialized recurring occurrence is "pristine" when it's back to todo with
// no completed steps AND carries no explicit edit — i.e. indistinguishable from
// its virtual form. We drop those so overrides don't pile up forever (bad for
// storage and sync). An edited occurrence (_edited) is always kept.
function loIsPristineOccurrence(t) {
  return t._from && String(t.id).includes('@') && t.status === 'todo' && !t._edited
    && !(t.subtasks || []).some(s => s.done);
}

// Subtask-derived progress, used by the timeline cards.
function loSubProgress(t) {
  if (!t.subtasks || !t.subtasks.length) return null;
  return { done: t.subtasks.filter(s => s.done).length, total: t.subtasks.length };
}

// ── recurrence ───────────────────────────────────────────────
// Does a recurring template occur on dateStr?
function loRecurOccursOn(task, dateStr) {
  if (!task.recur) return false;
  if (dateStr < task.date) return false;             // not before its start
  if (task.recur.until && dateStr > task.recur.until) return false;
  const dow = loDow(dateStr);
  switch (task.recur.freq) {
    case 'daily':    return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekly':   return (task.recur.days || [loDow(task.date)]).includes(dow);
    default:         return false;
  }
}

// ── public store API ─────────────────────────────────────────
const LOStore = {
  // -- tasks --
  allTasks() { return loRead(LO_KEYS.tasks, []).map(loNormalizeTask); },
  saveTasks(list) { loWrite(LO_KEYS.tasks, list); return list; },

  addTask(partial) {
    const list = LOStore.allTasks();
    const task = loNormalizeTask({ ...partial, updatedAt: Date.now() });
    list.push(task);
    LOStore.saveTasks(list);
    return task;
  },
  updateTask(id, patch) {
    const list = LOStore.allTasks();
    // Materialize a virtual recurring occurrence first, so editing a recurring
    // task on a given day actually persists (was a silent no-op before). Mark it
    // _edited so the orphan-cleanup never discards a deliberate change.
    loMaterializeOccurrence(list, id);
    const isOcc = String(id).includes('@');
    const next = list.map(t => t.id === id ? loNormalizeTask({ ...t, ...patch, id, updatedAt: Date.now(), _edited: isOcc ? true : t._edited }) : t);
    LOStore.saveTasks(next);
    return next.find(t => t.id === id);
  },
  removeTask(id) {
    LOStore.saveTasks(LOStore.allTasks().filter(t => t.id !== id));
  },
  toggleTask(id) {
    const list = LOStore.allTasks();
    const existing = list.find(t => t.id === id);
    // Recurring occurrence not yet materialized → create a per-day done copy.
    if (!existing && id.includes('@')) {
      const [baseId, date] = id.split('@');
      const base = list.find(t => t.id === baseId);
      if (base) {
        list.push(loNormalizeTask({ ...base, id, date, recur: null, _from: baseId, status: 'done', completedAt: Date.now(), updatedAt: Date.now() }));
        LOStore.saveTasks(list);
        return;
      }
    }
    const next = list
      .map(t => {
        if (t.id !== id) return t;
        const status = t.status === 'done' ? 'todo' : 'done';
        return loNormalizeTask({ ...t, status, completedAt: status === 'done' ? Date.now() : null, updatedAt: Date.now() });
      })
      // Un-completing a recurring occurrence returns it to its virtual form;
      // drop the now-pristine override instead of leaving orphan records.
      .filter(t => !loIsPristineOccurrence(t));
    LOStore.saveTasks(next);
  },
  toggleSubtask(taskId, subId) {
    const list = LOStore.allTasks();
    loMaterializeOccurrence(list, taskId);
    const isOcc = String(taskId).includes('@');
    const next = list.map(t => {
      if (t.id !== taskId) return t;
      const subtasks = t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s);
      // Auto-complete the parent when every step is done.
      const allDone = subtasks.length > 0 && subtasks.every(s => s.done);
      return loNormalizeTask({ ...t, subtasks, status: allDone ? 'done' : (t.status === 'done' ? 'todo' : t.status), updatedAt: Date.now(), _edited: isOcc ? true : t._edited });
    });
    LOStore.saveTasks(next);
  },

  // Concrete tasks for a given date, expanding recurring templates into
  // virtual occurrences (id suffixed with @date so completion is per-day).
  tasksForDate(dateStr) {
    const all = LOStore.allTasks();
    // Materialized recurring occurrences (id "base@date") are surfaced by the
    // recurring branch below — keep them out of `direct` to avoid duplicates.
    const direct = all.filter(t => !t.recur && t.date === dateStr && !String(t.id).includes('@'));
    const recurring = all
      .filter(t => t.recur && loRecurOccursOn(t, dateStr))
      .map(t => {
        const occId = `${t.id}@${dateStr}`;
        const override = all.find(o => o.id === occId); // a materialized completion
        return override || loNormalizeTask({ ...t, id: occId, date: dateStr, recur: null, _from: t.id });
      });
    return [...direct, ...recurring].sort((a, b) => loHHMMtoMin(a.start) - loHHMMtoMin(b.start));
  },

  // Open tasks with a hard due date today or later, nearest first.
  upcomingDeadlines(limit = 3) {
    const today = loDateStr();
    return LOStore.allTasks()
      .filter(t => t.deadline && t.status !== 'done' && !String(t.id).includes('@') && t.deadline >= today)
      .sort((a, b) => a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0)
      .slice(0, limit);
  },

  // -- habits --
  allHabits() { return loRead(LO_KEYS.habits, []); },
  saveHabits(list) { loWrite(LO_KEYS.habits, list); return list; },
  addHabit(partial) {
    const list = LOStore.allHabits();
    const habit = { id: loUid('h'), title: '', icon: 'fire', color: 'coral', cadence: 'daily',
      days: null, log: {}, createdAt: Date.now(), updatedAt: Date.now(), ...partial };
    list.push(habit); LOStore.saveHabits(list); return habit;
  },
  updateHabit(id, patch) {
    const list = LOStore.allHabits().map(h => h.id === id ? { ...h, ...patch, id, updatedAt: Date.now() } : h);
    LOStore.saveHabits(list);
    return list.find(h => h.id === id);
  },
  toggleHabitToday(id, dateStr = loDateStr()) {
    const list = LOStore.allHabits().map(h => {
      if (h.id !== id) return h;
      const log = { ...(h.log || {}) };
      if (log[dateStr]) delete log[dateStr]; else log[dateStr] = true;
      return { ...h, log, updatedAt: Date.now() };
    });
    LOStore.saveHabits(list);
  },
  removeHabit(id) { LOStore.saveHabits(LOStore.allHabits().filter(h => h.id !== id)); },

  // -- inbox (quick capture, schedule later) --
  allInbox() { return loRead(LO_KEYS.inbox, []); },
  addInbox(text) {
    const list = LOStore.allInbox();
    list.unshift({ id: loUid('i'), text: String(text).trim(), createdAt: Date.now(), updatedAt: Date.now() });
    loWrite(LO_KEYS.inbox, list);
  },
  removeInbox(id) { loWrite(LO_KEYS.inbox, LOStore.allInbox().filter(i => i.id !== id)); },

  // -- custom routines (user-made reusable task packs; defaults live in the UI) --
  customRoutines() { return loRead(LO_KEYS.routines, []); },
  addRoutine(partial) {
    const list = LOStore.customRoutines();
    const routine = { id: loUid('r'), name: 'Mi rutina', icon: 'sparkle', color: 'coral',
      tasks: [], custom: true, createdAt: Date.now(), updatedAt: Date.now(), ...partial };
    list.push(routine); loWrite(LO_KEYS.routines, list);
    return routine;
  },
  updateRoutine(id, patch) {
    const list = LOStore.customRoutines().map(r => r.id === id ? { ...r, ...patch, id, updatedAt: Date.now() } : r);
    loWrite(LO_KEYS.routines, list);
    return list.find(r => r.id === id);
  },
  removeRoutine(id) { loWrite(LO_KEYS.routines, LOStore.customRoutines().filter(r => r.id !== id)); },

  // -- data sovereignty: export / import the whole dataset as JSON --
  exportAll() {
    return {
      app: 'lifeos', version: 2, exportedAt: new Date().toISOString(),
      tasks: loRead(LO_KEYS.tasks, []),
      habits: LOStore.allHabits(),
      inbox: LOStore.allInbox(),
      routines: LOStore.customRoutines(),
      user: loRead('lifeos.user', null),
    };
  },
  importAll(data, { merge = false } = {}) {
    if (!data || data.app !== 'lifeos' || !Array.isArray(data.tasks)) {
      throw new Error('Archivo inválido: no es un respaldo de LifeOS.');
    }
    if (merge) {
      const byId = (arr, extra) => { const m = {}; [...extra, ...arr].forEach(x => { if (x && x.id) m[x.id] = x; }); return Object.values(m); };
      loWrite(LO_KEYS.tasks, byId(data.tasks, loRead(LO_KEYS.tasks, [])));
      loWrite(LO_KEYS.habits, byId(data.habits || [], LOStore.allHabits()));
      loWrite(LO_KEYS.inbox, byId(data.inbox || [], LOStore.allInbox()));
      loWrite(LO_KEYS.routines, byId(data.routines || [], LOStore.customRoutines()));
    } else {
      loWrite(LO_KEYS.tasks, data.tasks.map(loNormalizeTask));
      loWrite(LO_KEYS.habits, data.habits || []);
      loWrite(LO_KEYS.inbox, data.inbox || []);
      loWrite(LO_KEYS.routines, data.routines || []);
    }
    return { tasks: data.tasks.length, habits: (data.habits || []).length, inbox: (data.inbox || []).length };
  },

  // -- routines: schedule a pack of tasks on a given day, skipping busy slots --
  applyRoutine(routine, opts = {}) {
    const date = opts.date || loDateStr();
    // Default start: the next 30-min boundary from now (or 9:00 for other days).
    let cursor;
    if (typeof opts.startMin === 'number') cursor = opts.startMin;
    else if (date === loDateStr()) {
      const n = new Date();
      cursor = Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30;
    } else cursor = 9 * 60;
    const list = LOStore.allTasks();
    // Don't stack on top of what's already scheduled that day.
    const busy = LOStore.tasksForDate(date)
      .map(t => ({ s: loHHMMtoMin(t.start), e: loHHMMtoMin(t.start) + (t.durationMin || 30) }));
    const overlaps = (s, dur) => busy.find(o => s < o.e && (s + dur) > o.s);
    (routine.tasks || []).forEach(rt => {
      const dur = rt.dur || 30;
      let guard = 0;
      let clash;
      while ((clash = overlaps(cursor, dur)) && guard++ < 48) cursor = clash.e; // jump past the busy block
      list.push(loNormalizeTask({
        title: rt.label, icon: rt.icon, color: rt.color,
        start: loMinToHHMM(cursor), durationMin: dur, date,
        routineId: routine.id,
      }));
      busy.push({ s: cursor, e: cursor + dur });
      cursor += dur;
    });
    LOStore.saveTasks(list);
    return (routine.tasks || []).length;
  },
};

// ══════════════════════════════════════════════════════════════
// LONLP — natural-language scheduler (Spanish). Turns free text into
// real task actions on the store. Works fully offline; the AIScreen
// layers an optional Claude/Supabase pass on top for richer planning.
// ══════════════════════════════════════════════════════════════
const LO_DOW_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const LO_DOW_ALIASES = { 'miercoles': 3, 'sabado': 6, 'lun': 1, 'mar': 2, 'mié': 3, 'mie': 3, 'jue': 4, 'vie': 5, 'sáb': 6, 'sab': 6, 'dom': 0 };
const LO_MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function loStrip(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

// Agenda themes — fixed taxonomy with a meaning-coded palette colour each.
const LO_CATEGORIES = [
  { id: 'vida',    label: 'Vida',        short: 'Vida',  color: 'mint', icon: 'heart' },
  { id: 'trabajo', label: 'Trabajo',     short: 'Trabajo', color: 'sky',  icon: 'briefcase' },
  { id: 'uni',     label: 'Universidad', short: 'U',     color: 'amber', icon: 'book' },
];
const LO_CAT_BY_ID = Object.fromEntries(LO_CATEGORIES.map(c => [c.id, c]));

// Guess a theme from the wording so the user rarely has to pick. Order = priority.
const LO_CAT_RULES = [
  ['uni',     /\b(prueba|examen|certamen|control|clase|ramo|universidad|uni|facultad|profe|profesor|materia|estudiar|estudio|tarea|ensayo|laboratorio|ayudant|calculo|algebra|quimica|fisica|programacion|paradigmas|semestre|nota|notas|disertacion|trabajo grupal|uss)\b/],
  ['trabajo', /\b(reunion|junta|trabajo|pega|jefe|jefa|cliente|oficina|turno|informe|deadline|entrega|proyecto|correo|email|presentacion|factura|sueldo|nomina|reunirme|llamada laboral|standup|sprint)\b/],
  ['vida',    /\b(gym|gimnasio|comida|almuerzo|cena|desayuno|medico|doctor|dentista|polola|pololo|novia|familia|casa|super|mercado|compras|ducha|dormir|descansar|cumpleanos|cita|amig|cine|salir|vacaciones|viaje|mascota|perro|gato)\b/],
];
function loGuessCategory(text) {
  const low = loStrip(String(text || ''));
  for (const [id, re] of LO_CAT_RULES) if (re.test(low)) return id;
  return null;
}

// Icon + color guessed from the task wording — mirrors Structured's auto-icon.
const LO_ICON_RULES = [
  [/\b(gym|gimnasio|entren|ejercicio|pesas|crossfit|deporte|workout|correr|running|trotar)\b/, 'yoga', 'coral'],
  [/\b(yoga|estir|medita|respira|mindful)\b/, 'meditate', 'lavender'],
  [/\b(camin|paseo|pasear|caminata)\b/, 'walk', 'lime'],
  [/\b(estudi|leer|lectura|libro|clase|tarea|examen|prueba|universidad|repasar|ingl[eé]s)\b/, 'book', 'plum'],
  [/\b(reuni[oó]n|meeting|junta|zoom|call|llamada|videollamada|sync|standup|entrevista)\b/, 'presentation', 'sky'],
  [/\b(llamar|telefon|tel[eé]fono)\b/, 'call', 'teal'],
  [/\b(almuerzo|almorzar|comer|comida|cena|cenar|desayun|brunch|restaurant)\b/, 'meal', 'sun'],
  [/\b(caf[eé]|coffee|espresso)\b/, 'coffee', 'ember'],
  [/\b(compr|super|mercado|tienda|mall)\b/, 'cart', 'coral'],
  [/\b(dormir|sue[nñ]o|acostar|noche|descansar)\b/, 'moon', 'lavender'],
  [/\b(trabaj|deep work|foco|proyecto|c[oó]digo|programar|dise[nñ]ar|oficina|openclaw)\b/, 'briefcase', 'slate'],
  [/\b(ducha|ba[nñ]o|ducharme)\b/, 'shower', 'sky'],
  [/\b(doctor|dentista|m[eé]dico|cita|salud|pastilla|remedio|medicamento)\b/, 'pill', 'rose'],
  [/\b(bici|bicicleta|andar)\b/, 'bike', 'mint'],
  [/\b(journal|diario|escribir|anotar|nota)\b/, 'pencil', 'rose'],
  [/\b(planear|planificar|organizar|revisar|review)\b/, 'sparkle', 'lavender'],
];
function loGuessIconColor(title) {
  const t = loStrip(title);
  for (const [re, icon, color] of LO_ICON_RULES) if (re.test(t)) return { icon, color };
  return { icon: 'star', color: 'mint' };
}

// Parse a date reference. Returns { date, matched } or null.
function loParseDate(low, base = new Date()) {
  const today = new Date(base);
  const mk = (off) => { const d = new Date(today); d.setDate(today.getDate() + off); return loDateStr(d); };
  if (/\bpasado\s+ma[nñ]ana\b/.test(low)) return { date: mk(2), matched: 'pasado mañana' };
  if (/\bma[nñ]ana\b/.test(low)) return { date: mk(1), matched: 'mañana' };
  if (/\bhoy\b|\besta\s+(tarde|noche|ma[nñ]ana)\b/.test(low)) return { date: mk(0), matched: 'hoy' };
  // weekday name (next occurrence)
  for (let i = 0; i < 7; i++) {
    const name = loStrip(LO_DOW_NAMES[i]);
    if (new RegExp(`\\b(este |pr[oó]ximo |el )?${name}\\b`).test(low)) {
      const cur = today.getDay();
      let delta = (i - cur + 7) % 7; if (delta === 0) delta = 7; // next, not today
      return { date: mk(delta), matched: name };
    }
  }
  // "el 5 de junio" / "el 5"
  let m = low.match(/\bel\s+(\d{1,2})(?:\s+de\s+([a-z]+))?/);
  if (m) {
    const day = +m[1];
    let month = today.getMonth();
    if (m[2]) { const mi = LO_MONTHS.findIndex(mo => loStrip(mo).startsWith(m[2].slice(0, 3))); if (mi >= 0) month = mi; }
    let year = today.getFullYear();
    const cand = new Date(year, month, day);
    if (cand < today && !m[2]) cand.setMonth(month + 1); // next month if past
    return { date: loDateStr(cand), matched: m[0] };
  }
  return null;
}

// Parse a clock time. Scans ALL number tokens and keeps the first one that
// carries a real time cue ("a las", am/pm, a colon, "y media", or 24h "h"),
// so a leading duration like "20 min" never gets mistaken for the time.
function loParseTime(low) {
  const re = /(a\s+las?\s+)?(\d{1,2})([:.](\d{2}))?\s*(am|a\.m\.|pm|p\.m\.|hrs|hs|hr|h)?(\s+y\s+(media|cuarto))?/g;
  let m;
  while ((m = re.exec(low))) {
    if (!m[0].trim()) { re.lastIndex++; continue; }
    const las = !!m[1], colon = !!m[4], mer = (m[5] || '').replace(/\./g, ''), yq = m[7];
    let h = +m[2], min = m[4] ? +m[4] : 0;
    const isMer = mer === 'am' || mer === 'pm';
    const isH24 = (mer === 'h' || mer === 'hr' || mer === 'hrs' || mer === 'hs') && h >= 13; // "19h"; bare "1h" is a duration
    const cue = las || colon || isMer || !!yq || isH24;
    if (!cue) continue;
    if (yq === 'media') min = 30; if (yq === 'cuarto') min = 15;
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (h > 23 || min > 59) continue;
    return { start: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`, matched: m[0].trim() };
  }
  return null;
}

// Parse a duration. Returns { durationMin, matched } or null.
function loParseDuration(low) {
  if (/\bhora\s+y\s+media\b/.test(low)) return { durationMin: 90, matched: 'hora y media' };
  if (/\bmedia\s+hora\b/.test(low)) return { durationMin: 30, matched: 'media hora' };
  let m = low.match(/\b(\d+)\s*(h|hr|hrs|hora|horas)\b/);
  if (m) return { durationMin: +m[1] * 60, matched: m[0] };
  m = low.match(/\b(\d+)\s*(m|min|mins|minuto|minutos)\b/);
  if (m) return { durationMin: +m[1], matched: m[0] };
  if (/\buna\s+hora\b/.test(low)) return { durationMin: 60, matched: 'una hora' };
  return null;
}

// Parse recurrence. Returns { recur, matched } or null.
function loParseRecur(low) {
  if (/\b(entre\s+semana|d[ií]as?\s+de\s+semana|lunes\s+a\s+viernes)\b/.test(low)) return { recur: { freq: 'weekdays' }, matched: 'entre semana' };
  if (/\b(cada\s+d[ií]a|todos\s+los\s+d[ií]as|diariamente|a\s+diario)\b/.test(low)) return { recur: { freq: 'daily' }, matched: 'cada día' };
  for (let i = 0; i < 7; i++) {
    const name = loStrip(LO_DOW_NAMES[i]);
    if (new RegExp(`\\b(cada|todos\\s+los)\\s+${name}s?\\b`).test(low)) return { recur: { freq: 'weekly', days: [i] }, matched: `cada ${name}` };
  }
  if (/\bcada\s+semana|semanalmente\b/.test(low)) return { recur: { freq: 'weekly' }, matched: 'cada semana' };
  return null;
}

const LO_CMD_VERBS = /\b(ag[eé]ndame|ag[eé]nda|agendar|agrega|agregar|a[nñ]ade|a[nñ]adir|crea|crear|pon|poner|ponme|programa|programar|recu[eé]rdame|recordar|nueva\s+tarea|necesito|quiero|tengo\s+que|debo)\b/g;
const loWordListRE = (words, flags = 'giu') => new RegExp(`(?<![\\p{L}\\p{N}_])(?:${words.join('|')})(?![\\p{L}\\p{N}_])`, flags);
const LO_TITLE_GLUE_RE = loWordListRE(['a\\s+las?', 'para', 'el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'esta', 'este', 'pr[oó]ximo', 'que', 'me', 'mi', 'cada', 'todos\\s+los', 'todos', 'todas']);
const LO_DELETE_GLUE_RE = loWordListRE(['borra', 'borrar', 'elimina', 'eliminar', 'quita', 'quitar', 'cancela', 'cancelar', 'la', 'el', 'tarea', 'de', 'mi']);
const LO_COMPLETE_GLUE_RE = loWordListRE(['completa', 'completar', 'marca', 'marcar', 'como', 'hecho', 'hecha', 'ya', 'hice', 'termin[eé]', 'el', 'la', 'tarea', 'de', 'mi']);

// Main entry: produce an action plan from free text.
function loParseCommand(text) {
  const raw = text.trim();
  const low = loStrip(raw);

  // Intent: delete / complete / move take priority if their verbs appear.
  if (/\b(borra|borrar|elimina|eliminar|quita|quitar|cancela|cancelar)\b/.test(low)) {
    return { intent: 'delete', query: raw.replace(LO_DELETE_GLUE_RE, '').replace(/\s+/g, ' ').trim() };
  }
  if (/\b(complet|marca.*hech|ya\s+hice|termin[eé]|hecho|listo\s+el)\b/.test(low)) {
    return { intent: 'complete', query: raw.replace(LO_COMPLETE_GLUE_RE, '').replace(/\s+/g, ' ').trim() };
  }
  if (/\b(mueve|mover|posterga|postergar|cambia.*hora|reprograma|pasa)\b/.test(low)) {
    const time = loParseTime(low);
    return { intent: 'move', query: raw.replace(LO_CMD_VERBS, '').trim(), start: time && time.start };
  }
  if (/\b(c[oó]mo|ayuda|qu[eé]\s+puedo|qu[eé]\s+haces|tutorial|funciona)\b/.test(low)) {
    return { intent: 'help' };
  }

  // Default: create.
  const date = loParseDate(low);
  const time = loParseTime(low);
  const dur = loParseDuration(low);
  const recur = loParseRecur(low);

  // Build the title by removing every matched token + command verbs + glue words.
  let title = raw;
  // Remove matched date / time / duration tokens literally.
  for (const k of [date, time, dur].filter(Boolean).map(x => x.matched)) {
    if (k) title = title.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
  }
  // Recurrence: strip the weekday by its real accented name (so "todos los miércoles"
  // leaves the title clean). The generic stopword pass must NOT touch weekday words.
  if (recur) {
    const days = recur.recur && recur.recur.days;
    if (days && days.length) {
      title = title.replace(new RegExp(`(cada|todos\\s+los)\\s+${LO_DOW_NAMES[days[0]]}s?`, 'iu'), ' ');
    } else if (recur.matched) {
      title = title.replace(new RegExp(recur.matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
    }
  }
  title = title.replace(LO_CMD_VERBS, ' ')
    .replace(LO_TITLE_GLUE_RE, ' ')
    .replace(/\s+/g, ' ').trim();
  // Capitalize first letter.
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);

  if (!title) return { intent: 'unknown', raw };

  const ic = loGuessIconColor(title);
  return {
    intent: 'create',
    task: {
      title,
      date: date ? date.date : loDateStr(),
      start: time ? time.start : null,
      durationMin: dur ? dur.durationMin : 30,
      recur: recur ? recur.recur : null,
      icon: ic.icon, color: ic.color,
      reminder: !!recur || /\brecu[eé]rda/.test(low),
    },
    meta: { hadDate: !!date, hadTime: !!time, dayLabel: date && date.matched, timeLabel: time && time.start },
  };
}

// Find the single best task matching a free-text query. Scores each candidate
// (full-phrase > all-words > first-word) and only returns a winner when it's
// unambiguous, so "borra gym" never deletes the wrong task silently.
function loFindTaskByQuery(tasks, query) {
  const q = loStrip(query || '').trim();
  if (!q) return { hit: null, ambiguous: false };
  const words = q.split(/\s+/).filter(w => w.length > 2);
  const scored = tasks.map(t => {
    const title = loStrip(t.title);
    let score = 0;
    if (title === q) score = 100;
    else if (title.includes(q)) score = 60;
    else if (words.length && words.every(w => title.includes(w))) score = 40;
    else if (words.length && title.includes(words[0])) score = 15;
    return { t, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return { hit: null, ambiguous: false };
  // Two tasks tied at the top and neither is an exact title match → too risky, ask.
  if (scored.length > 1 && scored[0].score === scored[1].score && scored[0].score < 100) {
    return { hit: null, ambiguous: true };
  }
  return { hit: scored[0].t, ambiguous: false };
}

// Execute a parsed plan against the store and return a human reply.
function loExecuteCommand(parsed) {
  const fmtDay = (d) => {
    if (d === loDateStr()) return 'hoy';
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    if (d === loDateStr(tm)) return 'mañana';
    const [y, mo, da] = d.split('-').map(Number);
    return `el ${da} de ${LO_MONTHS[mo - 1]}`;
  };
  if (parsed.intent === 'create') {
    const tk = parsed.task;
    // No explicit time → next free 30-min slot on that day.
    if (!tk.start) {
      if (tk.date === loDateStr()) { const n = new Date(); tk.start = loMinToHHMM(Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30); }
      else tk.start = '09:00';
    }
    const saved = LOStore.addTask(tk);
    const when = tk.recur
      ? (tk.recur.freq === 'daily' ? 'cada día' : tk.recur.freq === 'weekdays' ? 'entre semana' : 'cada semana')
      : `${fmtDay(saved.date)} a las ${fmt12(saved.start)}`;
    return { reply: `Listo ✅ Agendé "${saved.title}" ${when}. La puedes ver en tu timeline.`, task: saved };
  }
  if (parsed.intent === 'delete') {
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.allTasks(), parsed.query);
    if (ambiguous) return { reply: 'Hay varias tareas parecidas. Dime el nombre más exacto para no borrar la equivocada.' };
    if (hit) { LOStore.removeTask(hit.id); return { reply: `Eliminé "${hit.title}".` }; }
    return { reply: 'No encontré esa tarea. ¿Cómo se llama exactamente?' };
  }
  if (parsed.intent === 'complete') {
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.tasksForDate(loDateStr()), parsed.query);
    if (ambiguous) return { reply: 'Tengo varias parecidas hoy. ¿Cuál exactamente?' };
    if (hit) { LOStore.toggleTask(hit.id.split('@')[0]); return { reply: `¡Hecho! Marqué "${hit.title}" como completada. 🎉` }; }
    return { reply: 'No vi esa tarea en tu día de hoy.' };
  }
  if (parsed.intent === 'move') {
    const q = (parsed.query || '').replace(/\b(a\s+las?|hora)\b/g, '').trim();
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.tasksForDate(loDateStr()), q);
    if (ambiguous) return { reply: 'Hay varias parecidas. Dime cuál mover con su nombre exacto.' };
    if (hit && parsed.start) { LOStore.updateTask(hit.id.split('@')[0], { start: parsed.start }); return { reply: `Moví "${hit.title}" a las ${fmt12(parsed.start)}.` }; }
    return { reply: 'Dime qué tarea mover y a qué hora — ej: "mueve gym a las 6pm".' };
  }
  return null; // help / unknown handled by caller
}

// One-time migration from the pre-store key ('lifeos.user_tasks').
(function migrateLegacyTasks() {
  try {
    if (localStorage.getItem(LO_KEYS.tasks)) return;          // already on v2
    const legacy = localStorage.getItem('lifeos.user_tasks');
    if (!legacy) return;
    const arr = JSON.parse(legacy);
    if (Array.isArray(arr) && arr.length) {
      localStorage.setItem(LO_KEYS.tasks, JSON.stringify(arr.map(loNormalizeTask)));
    } else {
      // Unexpected shape — keep a backup instead of discarding it silently.
      localStorage.setItem('lifeos.user_tasks.bak', legacy);
    }
  } catch {}
})();

// Is a habit "scheduled" on a given date, per its cadence?
function loHabitScheduledOn(habit, dateStr) {
  const cad = habit.cadence || 'daily';
  const dow = loDow(dateStr); // 0=Sun
  if (cad === 'daily') return true;
  if (cad === 'weekdays') return dow >= 1 && dow <= 5;
  if (cad === 'weekly' || cad === 'custom') {
    const days = (habit.days && habit.days.length) ? habit.days : [new Date().getDay()];
    return days.includes(dow);
  }
  return true;
}

// Longest run of consecutive completed calendar days in a habit's history.
function loHabitBestStreak(habit) {
  const log = habit.log || {};
  const dates = Object.keys(log).filter(d => log[d]).sort();
  if (!dates.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

// Completion rate over the last `days` SCHEDULED days (0..100).
function loHabitRate(habit, days = 30) {
  const log = habit.log || {};
  let scheduled = 0, done = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const ds = loDateStr(d);
    if (!loHabitScheduledOn(habit, ds)) continue;
    scheduled++;
    if (log[ds]) done++;
  }
  return scheduled ? Math.round(done / scheduled * 100) : 0;
}

// Current streak for a habit, counting only days the habit was scheduled.
// A skipped non-scheduled day doesn't break the run.
function loHabitStreak(habit, asOf = new Date()) {
  let streak = 0;
  for (let i = 0; i < 730; i++) {
    const d = new Date(asOf); d.setDate(asOf.getDate() - i);
    const ds = loDateStr(d);
    if ((habit.log || {})[ds]) streak++;
    else if (!loHabitScheduledOn(habit, ds)) continue; // not due that day → keep going
    else if (i > 0) break;          // a missed scheduled day breaks the run
  }
  return streak;
}

// ── React binding ────────────────────────────────────────────
// useStore() re-renders any component when the store changes, anywhere.
function useStoreVersion() {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const h = () => force();
    window.addEventListener('lo-store-change', h);
    window.addEventListener('storage', h); // cross-tab
    return () => { window.removeEventListener('lo-store-change', h); window.removeEventListener('storage', h); };
  }, []);
}

function useTasks() {
  useStoreVersion();
  return {
    all: LOStore.allTasks(),
    forDate: LOStore.tasksForDate,
    add: LOStore.addTask, update: LOStore.updateTask, remove: LOStore.removeTask,
    toggle: LOStore.toggleTask, toggleSubtask: LOStore.toggleSubtask,
  };
}
function useHabits() {
  useStoreVersion();
  return {
    all: LOStore.allHabits(),
    add: LOStore.addHabit, update: LOStore.updateHabit, toggleToday: LOStore.toggleHabitToday, remove: LOStore.removeHabit,
    streak: loHabitStreak, scheduledOn: loHabitScheduledOn,
  };
}
function useInbox() {
  useStoreVersion();
  return { all: LOStore.allInbox(), add: LOStore.addInbox, remove: LOStore.removeInbox };
}

Object.assign(window, {
  TODAY_TASKS_RAW, getTodayTasks,
  QUICK_ACTIONS, INBOX_ITEMS, WEEK_DAYS, MONTH_CELLS,
  TASK_TEMPLATES, tasksForDay, MONTH_NAMES, buildMonth,
  // store
  LO_KEYS, LOStore, loDateStr, loHHMMtoMin, loMinToHHMM, loDow,
  loNormalizeTask, loSubProgress, loHabitStreak, loHabitBestStreak, loHabitRate, loHabitScheduledOn, loRecurOccursOn, loUid,
  loMaterializeOccurrence, loFindTaskByQuery,
  useTasks, useHabits, useInbox, useStoreVersion,
  // NL parser
  loParseCommand, loExecuteCommand, loGuessIconColor,
  loParseDate, loParseTime, loParseDuration, loParseRecur,
});
