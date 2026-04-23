const STORAGE_KEY = 'boss-mode-v3';
const todayKey = new Date().toISOString().slice(0, 10);
const categories = ['universidad', 'trabajo', 'openclaw', 'skills', 'salud', 'personal', 'focus'];
const defaultState = {
  habits: [],
  tasks: [],
  events: [],
  journal: [],
  focus: { intent: '', totalMinutes: 0, sessions: 0, timerSecondsLeft: 1500, isRunning: false, lastTickAt: null },
};
const presets = {
  habits: [
    { text: 'Leer 20 minutos', category: 'salud', frequency: 'daily' },
    { text: 'No fumar hoy', category: 'salud', frequency: 'daily' },
    { text: 'Revisar una tarea de la U', category: 'universidad', frequency: 'daily' },
  ],
  tasks: [
    { text: 'Cerrar pendiente urgente de universidad', category: 'universidad', priority: 'high', dueDate: todayKey },
    { text: 'Mover barbershop una etapa más', category: 'trabajo', priority: 'high', dueDate: todayKey },
    { text: 'Pulir una mejora de OpenClaw', category: 'openclaw', priority: 'medium', dueDate: '' },
  ],
};
const els = {
  screens: document.querySelectorAll('.screen'),
  navBtns: document.querySelectorAll('.nav-btn'),
  todayLabel: document.querySelector('#todayLabel'),
  todayMessage: document.querySelector('#todayMessage'),
  dailyScore: document.querySelector('#dailyScore'),
  pendingCount: document.querySelector('#pendingCount'),
  doneHabitsCount: document.querySelector('#doneHabitsCount'),
  focusMinutesToday: document.querySelector('#focusMinutesToday'),
  todaySummary: document.querySelector('#todaySummary'),
  calendarPreview: document.querySelector('#calendarPreview'),
  habitForm: document.querySelector('#habitForm'),
  habitInput: document.querySelector('#habitInput'),
  habitCategory: document.querySelector('#habitCategory'),
  habitFrequency: document.querySelector('#habitFrequency'),
  habitList: document.querySelector('#habitList'),
  seedHabitsBtn: document.querySelector('#seedHabitsBtn'),
  taskForm: document.querySelector('#taskForm'),
  taskInput: document.querySelector('#taskInput'),
  taskCategory: document.querySelector('#taskCategory'),
  taskPriority: document.querySelector('#taskPriority'),
  taskDate: document.querySelector('#taskDate'),
  taskList: document.querySelector('#taskList'),
  seedTasksBtn: document.querySelector('#seedTasksBtn'),
  eventForm: document.querySelector('#eventForm'),
  eventTitle: document.querySelector('#eventTitle'),
  eventTime: document.querySelector('#eventTime'),
  eventTag: document.querySelector('#eventTag'),
  eventList: document.querySelector('#eventList'),
  focusIntent: document.querySelector('#focusIntent'),
  focusTimerLabel: document.querySelector('#focusTimerLabel'),
  focusStateLabel: document.querySelector('#focusStateLabel'),
  startFocusBtn: document.querySelector('#startFocusBtn'),
  pauseFocusBtn: document.querySelector('#pauseFocusBtn'),
  resetFocusBtn: document.querySelector('#resetFocusBtn'),
  focusSessionsCount: document.querySelector('#focusSessionsCount'),
  focusMinutesTotal: document.querySelector('#focusMinutesTotal'),
  journalForm: document.querySelector('#journalForm'),
  journalMood: document.querySelector('#journalMood'),
  journalWins: document.querySelector('#journalWins'),
  journalNotes: document.querySelector('#journalNotes'),
  journalList: document.querySelector('#journalList'),
  insightTaskRate: document.querySelector('#insightTaskRate'),
  insightHabitRate: document.querySelector('#insightHabitRate'),
  insightFocusRate: document.querySelector('#insightFocusRate'),
  insightJournalCount: document.querySelector('#insightJournalCount'),
  insightHighlights: document.querySelector('#insightHighlights'),
  installBtn: document.querySelector('#installBtn'),
};
let state = loadState();
let deferredPrompt;
let focusInterval = null;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...structuredClone(defaultState), ...saved, focus: { ...defaultState.focus, ...(saved.focus || {}) } } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function formatToday() {
  els.todayLabel.textContent = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function emptyCard(text) {
  return `<div class="empty">${text}</div>`;
}
function renderToday() {
  const pendingTasks = state.tasks.filter((task) => !task.done);
  const doneHabits = state.habits.filter((habit) => habit.doneDates?.includes(todayKey));
  const focusToday = state.focus.totalMinutes;
  const score = pendingTasks.length === 0 ? 92 : Math.max(35, 100 - pendingTasks.length * 9 + doneHabits.length * 6 + Math.floor(focusToday / 10));
  els.dailyScore.textContent = score;
  els.pendingCount.textContent = pendingTasks.length;
  els.doneHabitsCount.textContent = doneHabits.length;
  els.focusMinutesToday.textContent = focusToday;
  els.todayMessage.textContent = pendingTasks.length ? `Tienes ${pendingTasks.length} frentes activos. Si eliges uno bien, ya ganaste el día.` : 'Buen ritmo. Hoy se ve despejado y ordenado.';

  const summaryItems = [
    pendingTasks[0] ? `Prioridad: ${pendingTasks[0].text}` : 'No hay tareas urgentes cargadas.',
    doneHabits[0] ? `Hábito marcado: ${doneHabits[0].text}` : 'Todavía no marcas hábitos hoy.',
    state.focus.intent ? `Foco actual: ${state.focus.intent}` : 'Define una intención antes de tu siguiente bloque.',
  ];
  els.todaySummary.innerHTML = summaryItems.map((item) => `<article class="stack-item"><p>${escapeHtml(item)}</p></article>`).join('');

  const nextEvents = [...state.events].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3);
  els.calendarPreview.innerHTML = nextEvents.length
    ? nextEvents.map((event) => `<article class="stack-item"><div class="row-inline"><strong>${escapeHtml(event.title)}</strong><span class="badge">${event.time}</span></div><div class="badges"><span class="badge">${event.tag}</span></div></article>`).join('')
    : emptyCard('No tienes bloques cargados todavía.');
}
function renderHabits() {
  if (!state.habits.length) {
    els.habitList.innerHTML = emptyCard('Sin hábitos aún.');
    return;
  }
  els.habitList.innerHTML = state.habits.map((habit) => {
    const doneToday = (habit.doneDates || []).includes(todayKey);
    return `<article class="stack-item">
      <div class="stack-item-top"><strong>${escapeHtml(habit.text)}</strong><span class="badge">${habit.frequency === 'daily' ? 'Diario' : 'Semanal'}</span></div>
      <div class="badges"><span class="badge">${habit.category}</span><span class="badge">🔥 ${habit.streak || 0} días</span><span class="badge">${doneToday ? 'hecho hoy' : 'pendiente'}</span></div>
      <div class="item-actions">
        <button type="button" class="ghost" data-action="toggle-habit" data-id="${habit.id}">${doneToday ? 'Desmarcar' : 'Marcar'}</button>
        <button type="button" class="ghost" data-action="edit-habit" data-id="${habit.id}">Editar</button>
        <button type="button" class="danger" data-action="delete-habit" data-id="${habit.id}">Borrar</button>
      </div>
    </article>`;
  }).join('');
}
function renderTasks() {
  if (!state.tasks.length) {
    els.taskList.innerHTML = emptyCard('No hay tareas cargadas todavía.');
    return;
  }
  const sorted = [...state.tasks].sort((a, b) => Number(a.done) - Number(b.done) || ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
  els.taskList.innerHTML = sorted.map((task) => `<article class="stack-item">
    <div class="stack-item-top"><strong>${escapeHtml(task.text)}</strong><span class="badge priority-${task.priority}">${task.priority}</span></div>
    <div class="badges"><span class="badge">${task.category}</span>${task.dueDate ? `<span class="badge">${task.dueDate}</span>` : ''}<span class="badge">${task.done ? 'done' : 'active'}</span></div>
    <div class="item-actions">
      <button type="button" class="ghost" data-action="toggle-task" data-id="${task.id}">${task.done ? 'Reabrir' : 'Completar'}</button>
      <button type="button" class="ghost" data-action="edit-task" data-id="${task.id}">Editar</button>
      <button type="button" class="danger" data-action="delete-task" data-id="${task.id}">Borrar</button>
    </div>
  </article>`).join('');
}
function renderEvents() {
  if (!state.events.length) {
    els.eventList.innerHTML = emptyCard('Sin eventos todavía.');
    return;
  }
  els.eventList.innerHTML = [...state.events].sort((a, b) => a.time.localeCompare(b.time)).map((event) => `<article class="stack-item">
    <div class="stack-item-top"><strong>${escapeHtml(event.title)}</strong><span class="badge">${event.time}</span></div>
    <div class="badges"><span class="badge">${event.tag}</span></div>
    <div class="item-actions">
      <button type="button" class="ghost" data-action="delete-event" data-id="${event.id}">Borrar</button>
    </div>
  </article>`).join('');
}
function renderJournal() {
  if (!state.journal.length) {
    els.journalList.innerHTML = emptyCard('Tu journal está vacío por ahora.');
    return;
  }
  els.journalList.innerHTML = [...state.journal].reverse().map((entry) => `<article class="stack-item">
    <div class="stack-item-top"><strong>${escapeHtml(entry.mood)}</strong><span class="badge">${entry.date}</span></div>
    <p>${escapeHtml(entry.wins || 'Sin wins anotados.')}</p>
    <p class="subtitle">${escapeHtml(entry.notes || 'Sin notas extra.')}</p>
  </article>`).join('');
}
function renderInsights() {
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((task) => task.done).length;
  const totalHabits = state.habits.length;
  const doneHabits = state.habits.filter((habit) => habit.doneDates?.includes(todayKey)).length;
  els.insightTaskRate.textContent = totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}%` : '0%';
  els.insightHabitRate.textContent = totalHabits ? `${Math.round((doneHabits / totalHabits) * 100)}%` : '0%';
  els.insightFocusRate.textContent = state.focus.totalMinutes;
  els.insightJournalCount.textContent = state.journal.length;

  const highlights = [
    doneTasks ? `Has completado ${doneTasks} tarea${doneTasks === 1 ? '' : 's'}.` : 'Todavía no completas tareas.',
    doneHabits ? `Llevas ${doneHabits} hábito${doneHabits === 1 ? '' : 's'} marcados hoy.` : 'Te falta activar los hábitos de hoy.',
    state.focus.sessions ? `Ya hiciste ${state.focus.sessions} sesión${state.focus.sessions === 1 ? '' : 'es'} de foco.` : 'Todavía no haces una sesión de foco.',
  ];
  els.insightHighlights.innerHTML = highlights.map((item) => `<article class="stack-item"><p>${escapeHtml(item)}</p></article>`).join('');
}
function renderFocus() {
  const mins = Math.floor(state.focus.timerSecondsLeft / 60).toString().padStart(2, '0');
  const secs = (state.focus.timerSecondsLeft % 60).toString().padStart(2, '0');
  els.focusTimerLabel.textContent = `${mins}:${secs}`;
  els.focusStateLabel.textContent = state.focus.isRunning ? `En curso: ${state.focus.intent || 'bloque de foco'}` : (state.focus.intent ? `Listo para: ${state.focus.intent}` : 'Sesión lista');
  els.focusIntent.value = state.focus.intent || '';
  els.focusSessionsCount.textContent = state.focus.sessions || 0;
  els.focusMinutesTotal.textContent = state.focus.totalMinutes || 0;
}
function render() {
  renderToday();
  renderHabits();
  renderTasks();
  renderEvents();
  renderFocus();
  renderJournal();
  renderInsights();
  saveState();
}
function addHabit(text, category, frequency) {
  state.habits.unshift({ id: uid(), text, category, frequency, streak: 0, doneDates: [] });
  render();
}
function addTask(text, category, priority, dueDate) {
  state.tasks.unshift({ id: uid(), text, category, priority, dueDate, done: false });
  render();
}
function addEvent(title, time, tag) {
  state.events.push({ id: uid(), title, time, tag });
  render();
}
function addJournal(mood, wins, notes) {
  state.journal.push({ id: uid(), date: todayKey, mood, wins, notes });
  render();
}
function seed(kind) {
  presets[kind].forEach((item) => {
    if (kind === 'habits' && !state.habits.some((habit) => habit.text === item.text)) addHabit(item.text, item.category, item.frequency);
    if (kind === 'tasks' && !state.tasks.some((task) => task.text === item.text)) addTask(item.text, item.category, item.priority, item.dueDate);
  });
}
function toggleHabit(id) {
  state.habits = state.habits.map((habit) => {
    if (habit.id !== id) return habit;
    const doneDates = new Set(habit.doneDates || []);
    if (doneDates.has(todayKey)) {
      doneDates.delete(todayKey);
      return { ...habit, doneDates: [...doneDates] };
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const continued = doneDates.has(yesterday);
    doneDates.add(todayKey);
    return { ...habit, doneDates: [...doneDates], streak: continued ? (habit.streak || 0) + 1 : 1 };
  });
  render();
}
function toggleTask(id) {
  state.tasks = state.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
  render();
}
function deleteBy(collection, id) {
  state[collection] = state[collection].filter((item) => item.id !== id);
  render();
}
function editEntity(collection, id, fields) {
  const item = state[collection].find((entry) => entry.id === id);
  if (!item) return;
  const updated = { ...item };
  fields.forEach(({ key, label }) => {
    const nextValue = window.prompt(label, updated[key] || '');
    if (nextValue === null) return;
    updated[key] = nextValue.trim();
  });
  state[collection] = state[collection].map((entry) => entry.id === id ? updated : entry);
  render();
}
function handleListClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;
  if (action === 'toggle-habit') return toggleHabit(id);
  if (action === 'delete-habit') return deleteBy('habits', id);
  if (action === 'edit-habit') return editEntity('habits', id, [{ key: 'text', label: 'Editar hábito' }, { key: 'category', label: 'Categoría' }]);
  if (action === 'toggle-task') return toggleTask(id);
  if (action === 'delete-task') return deleteBy('tasks', id);
  if (action === 'edit-task') return editEntity('tasks', id, [{ key: 'text', label: 'Editar tarea' }, { key: 'priority', label: 'Prioridad (high/medium/low)' }, { key: 'dueDate', label: 'Fecha (YYYY-MM-DD)' }]);
  if (action === 'delete-event') return deleteBy('events', id);
}
function setupNavigation() {
  els.navBtns.forEach((btn) => btn.addEventListener('click', () => {
    els.navBtns.forEach((item) => item.classList.toggle('active', item === btn));
    els.screens.forEach((screen) => screen.classList.toggle('active', screen.id === btn.dataset.screen));
  }));
}
function setupForms() {
  els.habitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addHabit(els.habitInput.value.trim(), els.habitCategory.value, els.habitFrequency.value);
    els.habitForm.reset();
  });
  els.taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTask(els.taskInput.value.trim(), els.taskCategory.value, els.taskPriority.value, els.taskDate.value);
    els.taskForm.reset();
  });
  els.eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addEvent(els.eventTitle.value.trim(), els.eventTime.value, els.eventTag.value);
    els.eventForm.reset();
  });
  els.journalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addJournal(els.journalMood.value, els.journalWins.value.trim(), els.journalNotes.value.trim());
    els.journalForm.reset();
  });
}
function tickFocus() {
  if (!state.focus.isRunning) return;
  if (state.focus.timerSecondsLeft <= 0) {
    state.focus.isRunning = false;
    state.focus.sessions += 1;
    state.focus.totalMinutes += 25;
    state.focus.timerSecondsLeft = 1500;
    clearInterval(focusInterval);
    focusInterval = null;
    render();
    return;
  }
  state.focus.timerSecondsLeft -= 1;
  renderFocus();
  saveState();
}
function setupFocus() {
  els.focusIntent.addEventListener('input', (event) => {
    state.focus.intent = event.target.value;
    saveState();
    renderFocus();
  });
  els.startFocusBtn.addEventListener('click', () => {
    if (state.focus.isRunning) return;
    state.focus.isRunning = true;
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = setInterval(tickFocus, 1000);
    renderFocus();
    saveState();
  });
  els.pauseFocusBtn.addEventListener('click', () => {
    state.focus.isRunning = false;
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = null;
    renderFocus();
    saveState();
  });
  els.resetFocusBtn.addEventListener('click', () => {
    state.focus.isRunning = false;
    state.focus.timerSecondsLeft = 1500;
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = null;
    renderFocus();
    saveState();
  });
}
function setupPresets() {
  els.seedHabitsBtn.addEventListener('click', () => seed('habits'));
  els.seedTasksBtn.addEventListener('click', () => seed('tasks'));
  [els.habitList, els.taskList, els.eventList].forEach((list) => list.addEventListener('click', handleListClick));
}
function setupPWA() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    els.installBtn.classList.remove('hidden');
  });
  els.installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installBtn.classList.add('hidden');
  });
}
formatToday();
setupNavigation();
setupForms();
setupFocus();
setupPresets();
setupPWA();
render();
