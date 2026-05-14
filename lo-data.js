// LifeOS — Data Layer v2
// Estructura: captures, tasks (by context), calendar events, habits, reminders, focus, radar

const LOData = (() => {
  const KEYS = {
    captures: 'lo_captures',
    tasks: 'lo_tasks',
    events: 'lo_events',
    habits: 'lo_habits',
    reminders: 'lo_reminders',
    focus: 'lo_focus',
    settings: 'lo_settings',
    radar: 'lo_radar',
    dailyCheck: 'lo_daily',
  };

  const defaultSettings = {
    name: 'Tomás',
    pomodoroWork: 25,
    pomodoroBreak: 5,
    points: 0,
  };

  function load(key, fallback) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  const today = () => new Date().toISOString().split('T')[0];
  const emit = (ev) => window.dispatchEvent(new Event(ev || 'lo:refresh'));

  // ── CAPTURES ─────────────────────────────────────────────────────
  // Quick capture: text, voice, idea — unprocessed inbox
  const captures = {
    getAll: () => load(KEYS.captures, []),
    add: (data) => {
      const list = captures.getAll();
      const item = { id: Date.now(), date: today(), processed: false, type: 'text', ...data };
      list.unshift(item);
      save(KEYS.captures, list);
      emit();
      return item;
    },
    delete: (id) => { save(KEYS.captures, captures.getAll().filter(c => c.id !== id)); emit(); },
    process: (id, target) => {
      // target: 'task' | 'reminder' | 'event' | 'note'
      const list = captures.getAll();
      const c = list.find(x => x.id === id);
      if (!c) return;
      c.processed = true;
      c.processedAs = target;
      save(KEYS.captures, list);
      emit();
      return c;
    },
    getUnprocessed: () => captures.getAll().filter(c => !c.processed),
    markProcessed: (id) => {
      const list = captures.getAll();
      const c = list.find(x => x.id === id);
      if (c) c.processed = true;
      save(KEYS.captures, list);
    },
  };

  // ── TASKS ─────────────────────────────────────────────────────────
  // Contexts: Hoy, Universidad, Trabajo, Proyectos, Personal, En espera
  // Priority: urgente, importante, cuando_pueda
  const CONTEXTS = ['Hoy', 'Universidad', 'Trabajo', 'Proyectos', 'Personal', 'En espera'];
  const PRIORITIES = ['urgente', 'importante', 'cuando_pueda'];

  const tasks = {
    CONTEXTS,
    PRIORITIES,
    getAll: () => load(KEYS.tasks, []),
    getByContext: (ctx) => tasks.getAll().filter(t => t.context === ctx),
    add: (data) => {
      const list = tasks.getAll();
      const t = { id: Date.now(), completed: false, createdAt: today(), context: 'Hoy', priority: 'importante', ...data };
      list.unshift(t);
      save(KEYS.tasks, list);
      emit();
      return t;
    },
    delete: (id) => { save(KEYS.tasks, tasks.getAll().filter(t => t.id !== id)); emit(); },
    toggle: (id) => {
      const list = tasks.getAll();
      const t = list.find(x => x.id === id);
      if (t) { t.completed = !t.completed; if (t.completed) { addPoints(15); t.completedAt = today(); } }
      save(KEYS.tasks, list);
      emit();
    },
    update: (id, patch) => {
      const list = tasks.getAll();
      const idx = list.findIndex(x => x.id === id);
      if (idx >= 0) list[idx] = { ...list[idx], ...patch };
      save(KEYS.tasks, list);
      emit();
    },
    getTodayPending: () => tasks.getAll().filter(t => t.context === 'Hoy' && !t.completed),
    getUrgent: () => tasks.getAll().filter(t => t.priority === 'urgente' && !t.completed),
  };

  // ── CALENDAR EVENTS ───────────────────────────────────────────────
  // Categories: Universidad, Trabajo, Proyecto, Personal, Salud
  const EVENT_CATEGORIES = ['Universidad', 'Trabajo', 'Proyecto', 'Personal', 'Salud'];
  const CATEGORY_COLORS = {
    Universidad: 'var(--accent)',
    Trabajo: 'var(--amber)',
    Proyecto: 'var(--purple)',
    Personal: 'var(--green)',
    Salud: 'var(--red)',
  };

  const events = {
    CATEGORIES: EVENT_CATEGORIES,
    COLORS: CATEGORY_COLORS,
    getAll: () => load(KEYS.events, []),
    getForDate: (ds) => events.getAll().filter(e => e.date === ds).sort((a, b) => a.time?.localeCompare(b.time)),
    getUpcoming: (n = 3) => {
      const t = today();
      return events.getAll().filter(e => e.date >= t).sort((a, b) => a.date.localeCompare(b.date) || a.time?.localeCompare(b.time)).slice(0, n);
    },
    getToday: () => events.getForDate(today()),
    add: (data) => {
      const list = events.getAll();
      const e = { id: Date.now(), category: 'Personal', ...data };
      list.push(e);
      save(KEYS.events, list);
      emit();
      return e;
    },
    delete: (id) => { save(KEYS.events, events.getAll().filter(e => e.id !== id)); emit(); },
    update: (id, patch) => {
      const list = events.getAll();
      const idx = list.findIndex(e => e.id === id);
      if (idx >= 0) list[idx] = { ...list[idx], ...patch };
      save(KEYS.events, list);
      emit();
    },
  };

  // ── HABITS ─────────────────────────────────────────────────────────
  // Minimal: sueño, comer, clases, estudio, ejercicio, agua, revisión agenda
  const DEFAULT_HABITS = [
    { id: 1, name: 'Dormir temprano', icon: '😴', streak: 0, completedDates: [] },
    { id: 2, name: 'Estudiar 30 min', icon: '📚', streak: 0, completedDates: [] },
    { id: 3, name: 'Tomar agua', icon: '💧', streak: 0, completedDates: [] },
    { id: 4, name: 'Ir a clases', icon: '🎓', streak: 0, completedDates: [] },
    { id: 5, name: 'Ejercicio', icon: '🏃', streak: 0, completedDates: [] },
  ];

  const habits = {
    getAll: () => load(KEYS.habits, DEFAULT_HABITS),
    add: (data) => {
      const list = habits.getAll();
      const h = { id: Date.now(), streak: 0, completedDates: [], ...data };
      list.push(h);
      save(KEYS.habits, list);
      emit();
    },
    delete: (id) => { save(KEYS.habits, habits.getAll().filter(h => h.id !== id)); emit(); },
    toggle: (id) => {
      const list = habits.getAll();
      const h = list.find(x => x.id === id);
      if (!h) return;
      const t = today();
      const wasDone = h.completedDates.includes(t);
      if (wasDone) {
        h.completedDates = h.completedDates.filter(d => d !== t);
        h.streak = Math.max(0, h.streak - 1);
      } else {
        h.completedDates.push(t);
        let streak = 0, d = new Date();
        while (h.completedDates.includes(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate() - 1); }
        h.streak = streak;
        addPoints(10);
      }
      save(KEYS.habits, list);
      emit();
    },
    isToday: (h) => h.completedDates.includes(today()),
    getWeek: (h) => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      return { ds, done: h.completedDates.includes(ds), label: 'DLMXJVS'[d.getDay()] };
    }),
    getTodayRate: () => {
      const all = habits.getAll();
      if (!all.length) return 0;
      return Math.round((all.filter(h => habits.isToday(h)).length / all.length) * 100);
    },
  };

  // ── REMINDERS ────────────────────────────────────────────────────
  const reminders = {
    getAll: () => load(KEYS.reminders, []),
    add: (data) => {
      const list = reminders.getAll();
      const r = { id: Date.now(), active: true, repeat: 'once', ...data };
      list.push(r);
      save(KEYS.reminders, list);
      emit();
    },
    delete: (id) => { save(KEYS.reminders, reminders.getAll().filter(r => r.id !== id)); emit(); },
    toggle: (id) => {
      const list = reminders.getAll();
      const r = list.find(x => x.id === id);
      if (r) r.active = !r.active;
      save(KEYS.reminders, list);
      emit();
    },
    getActive: () => reminders.getAll().filter(r => r.active),
  };

  // ── FOCUS ────────────────────────────────────────────────────────
  const focus = {
    get: () => load(KEYS.focus, { sessions: [], totalMinutes: 0 }),
    addSession: (mins, label = '') => {
      const data = focus.get();
      data.sessions.unshift({ date: today(), minutes: mins, label, ts: Date.now() });
      data.totalMinutes = (data.totalMinutes || 0) + mins;
      save(KEYS.focus, data);
      addPoints(mins);
      emit();
    },
    getTodayMinutes: () => focus.get().sessions.filter(s => s.date === today()).reduce((a, s) => a + s.minutes, 0),
    getWeekData: () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const minutes = focus.get().sessions.filter(s => s.date === ds).reduce((a, s) => a + s.minutes, 0);
      return { ds, minutes, label: 'DLMXJVS'[d.getDay()] };
    }),
    getRecentSessions: (n = 5) => focus.get().sessions.slice(0, n),
  };

  // ── DAILY CHECK-IN ────────────────────────────────────────────────
  const dailyCheck = {
    get: () => load(KEYS.dailyCheck, {}),
    setToday: (data) => {
      const all = dailyCheck.get();
      all[today()] = { ...all[today()], ...data, date: today() };
      save(KEYS.dailyCheck, all);
      emit();
    },
    getToday: () => (dailyCheck.get())[today()] || null,
    getWeek: () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      return { ds, ...(dailyCheck.get()[ds] || {}), label: 'DLMXJVS'[d.getDay()] };
    }),
  };

  // ── RADAR ─────────────────────────────────────────────────────────
  const RADAR_AREAS = ['Universidad', 'Trabajo', 'Proyectos', 'Salud', 'Personal', 'Finanzas'];
  const radar = {
    AREAS: RADAR_AREAS,
    get: () => load(KEYS.radar, Object.fromEntries(RADAR_AREAS.map(a => [a, 5]))),
    set: (area, val) => { const d = radar.get(); d[area] = val; save(KEYS.radar, d); emit(); },
    saveAll: (data) => { save(KEYS.radar, data); emit(); },
  };

  // ── SETTINGS / POINTS ─────────────────────────────────────────────
  const settings = {
    get: () => load(KEYS.settings, defaultSettings),
    save: (patch) => { save(KEYS.settings, { ...settings.get(), ...patch }); emit(); },
    getName: () => (load(KEYS.settings, defaultSettings)).name || 'Tomás',
  };

  const addPoints = (pts) => {
    const s = settings.get();
    s.points = (s.points || 0) + pts;
    save(KEYS.settings, s);
    window.dispatchEvent(new CustomEvent('lo:points', { detail: s.points }));
  };

  // ── GASTOS ───────────────────────────────────────────────────────
  const GASTO_CATS = ['Comida','Transporte','Estudio','Entretenimiento','Salud','Ropa','Hogar','Otros'];
  const GASTO_COLORS = { Comida:'#FF9F0A', Transporte:'#0A84FF', Estudio:'#BF5AF2', Entretenimiento:'#FF453A', Salud:'#30D158', Ropa:'#FF6B81', Hogar:'#64D2FF', Otros:'#636366' };
  const GASTO_ICONS  = { Comida:'🍔', Transporte:'🚌', Estudio:'📚', Entretenimiento:'🎮', Salud:'💊', Ropa:'👕', Hogar:'🏠', Otros:'💸' };

  function getAllGastos() { return load('lo_gastos', []); }

  const gastos = {
    CATS: GASTO_CATS,
    COLORS: GASTO_COLORS,
    ICONS: GASTO_ICONS,
    getAll: getAllGastos,
    add: function(data) {
      const list = getAllGastos();
      const g = { id: Date.now(), date: today(), ...data };
      list.unshift(g);
      save('lo_gastos', list);
      emit();
      return g;
    },
    delete: function(id) {
      save('lo_gastos', getAllGastos().filter(function(g){ return g.id !== id; }));
      emit();
    },
    getByMonth: function(ym) {
      return getAllGastos().filter(function(g){ return g.date && g.date.startsWith(ym); });
    },
    getCurrentMonth: function() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    },
    getMonthTotal: function(ym) {
      return getAllGastos().filter(function(g){ return g.date && g.date.startsWith(ym); }).reduce(function(s,g){ return s+(g.amount||0); }, 0);
    },
    getTodayTotal: function() {
      return getAllGastos().filter(function(g){ return g.date === today(); }).reduce(function(s,g){ return s+(g.amount||0); }, 0);
    },
    getByCat: function(ym) {
      const list = getAllGastos().filter(function(g){ return g.date && g.date.startsWith(ym); });
      const result = {};
      GASTO_CATS.forEach(function(c){ result[c] = list.filter(function(g){ return g.category===c; }).reduce(function(s,g){ return s+(g.amount||0); }, 0); });
      return result;
    },
    getBudget: function() { return load('lo_budget', { monthly: 50000, categories: {} }); },
    saveBudget: function(data) { save('lo_budget', data); emit(); },
  };

  // ── SCORE ─────────────────────────────────────────────────────────
  const getDailyScore = () => {
    const allH = habits.getAll();
    const doneH = allH.filter(h => habits.isToday(h)).length;
    const todayTasks = tasks.getAll().filter(t => (t.context === 'Hoy') && t.completed && t.completedAt === today()).length;
    const focusMins = focus.getTodayMinutes();
    const check = dailyCheck.getToday();

    let score = 40;
    if (allH.length > 0) score += (doneH / allH.length) * 25;
    score += Math.min(20, todayTasks * 5);
    if (focusMins >= 25) score += 10;
    if (focusMins >= 60) score += 5;
    if (check) score += 5; // did check-in
    return Math.min(100, Math.round(score));
  };

  return { captures, tasks, events, habits, reminders, focus, dailyCheck, radar, settings, gastos, addPoints, getDailyScore, today };
})();

window.LOData = LOData;
