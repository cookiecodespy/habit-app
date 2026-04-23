const STORAGE_KEY = 'boss-mode-v5';
const todayKey = new Date().toISOString().slice(0, 10);
const yesterdayKey = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
})();

const defaultCategories = [
  { id: 'universidad', name: 'Universidad', emoji: '🎓' },
  { id: 'trabajo', name: 'Trabajo', emoji: '💼' },
  { id: 'openclaw', name: 'OpenClaw', emoji: '🦞' },
  { id: 'skills', name: 'Skills', emoji: '🛠️' },
  { id: 'salud', name: 'Salud', emoji: '🌿' }
];

const presetData = {
  reminders: [
    { id: crypto.randomUUID(), title: 'Repasar cálculo antes de salir', category: 'universidad', createdAt: todayKey },
    { id: crypto.randomUUID(), title: 'Dejar lista una mejora chica en OpenClaw', category: 'openclaw', createdAt: todayKey }
  ],
  todos: [
    { id: crypto.randomUUID(), title: 'Prepararme para la próxima clase', category: 'universidad', done: false, date: todayKey },
    { id: crypto.randomUUID(), title: 'Revisar pendientes importantes', category: 'trabajo', done: false, date: todayKey }
  ],
  habits: [
    { id: crypto.randomUUID(), title: 'Leer 20 min', category: 'salud', streak: 0, bestStreak: 0, lastCompletedDate: null, completions: [] },
    { id: crypto.randomUUID(), title: 'Avanzar 1 mejora a OpenClaw', category: 'openclaw', streak: 0, bestStreak: 0, lastCompletedDate: null, completions: [] }
  ],
  goals: [
    { id: crypto.randomUUID(), title: 'Aprobar cálculo', progress: 3, target: 10, category: 'universidad', active: true },
    { id: crypto.randomUUID(), title: 'Cerrar una skill útil', progress: 1, target: 5, category: 'skills', active: true }
  ]
};

const els = {
  todayDate: document.getElementById('todayDate'),
  dailySummary: document.getElementById('dailySummary'),
  bestStreakValue: document.getElementById('bestStreakValue'),
  doneTodayValue: document.getElementById('doneTodayValue'),
  habitCountValue: document.getElementById('habitCountValue'),
  goalCountValue: document.getElementById('goalCountValue'),
  todayProgressLabel: document.getElementById('todayProgressLabel'),
  todayProgressBar: document.getElementById('todayProgressBar'),
  tabs: [...document.querySelectorAll('.tab')],
  panels: [...document.querySelectorAll('.tab-panel')],
  remindersList: document.getElementById('remindersList'),
  habitsList: document.getElementById('habitsList'),
  goalsList: document.getElementById('goalsList'),
  todayTodos: document.getElementById('todayTodos'),
  recentActivity: document.getElementById('recentActivity'),
  habitHeatmap: document.getElementById('habitHeatmap'),
  reminderForm: document.getElementById('reminderForm'),
  habitForm: document.getElementById('habitForm'),
  goalForm: document.getElementById('goalForm'),
  todoDialog: document.getElementById('todoDialog'),
  todoForm: document.getElementById('todoForm'),
  addTodayTodoBtn: document.getElementById('addTodayTodoBtn'),
  seedBtn: document.getElementById('seedBtn'),
  resetDayBtn: document.getElementById('resetDayBtn')
};

const baseState = {
  categories: defaultCategories,
  reminders: [],
  todos: [],
  habits: [],
  goals: [],
  activity: []
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(baseState);
  try {
    return { ...structuredClone(baseState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(baseState);
  }
};

let state = loadState();
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const getCategory = (id) => state.categories.find(cat => cat.id === id) || state.categories[0];
const formatDate = () => new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const formatActivityDate = value => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const escapeHtml = value => value.replace(/[&<>\"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

function addActivity(text) {
  state.activity = [{ id: crypto.randomUUID(), text, at: new Date().toISOString() }, ...(state.activity || [])].slice(0, 20);
}

function fillCategorySelects() {
  const options = state.categories.map(cat => `<option value="${cat.id}">${cat.emoji} ${cat.name}</option>`).join('');
  ['reminderCategory', 'habitCategory', 'todoCategory'].forEach(id => {
    document.getElementById(id).innerHTML = options;
  });
}

function getTodayTodos() {
  return state.todos.filter(todo => todo.date === todayKey);
}

function getDoneTodayCount() {
  return getTodayTodos().filter(todo => todo.done).length;
}

function getTodayProgress() {
  const todos = getTodayTodos();
  if (!todos.length) return 0;
  return Math.round((todos.filter(todo => todo.done).length / todos.length) * 100);
}

function renderSummary() {
  const todayTodos = getTodayTodos();
  const done = getDoneTodayCount();
  const streaks = state.habits.map(h => h.bestStreak || 0);
  const progress = getTodayProgress();
  const activeGoals = state.goals.filter(goal => goal.active).length;
  els.todayDate.textContent = formatDate();
  els.dailySummary.textContent = `${done}/${todayTodos.length || 0} tareas hechas hoy · ${state.reminders.length} recordatorios pendientes`;
  els.bestStreakValue.textContent = streaks.length ? Math.max(...streaks) : 0;
  els.doneTodayValue.textContent = done;
  els.habitCountValue.textContent = state.habits.length;
  els.goalCountValue.textContent = activeGoals;
  els.todayProgressLabel.textContent = `${progress}%`;
  els.todayProgressBar.style.width = `${progress}%`;
}

function renderRecentActivity() {
  const activity = state.activity || [];
  if (!activity.length) {
    els.recentActivity.innerHTML = `<div class="item compact"><p class="muted">Todavía no hay actividad. Cuando avances, aparecerá aquí.</p></div>`;
    return;
  }
  els.recentActivity.innerHTML = activity.slice(0, 6).map(item => `
    <article class="item compact">
      <strong>${escapeHtml(item.text)}</strong>
      <p class="muted tiny">${formatActivityDate(item.at)}</p>
    </article>
  `).join('');
}

function renderTodos() {
  const todayTodos = getTodayTodos();
  if (!todayTodos.length) {
    els.todayTodos.innerHTML = `<div class="item"><p class="muted">No tienes tareas para hoy. Agrega una y parte por ahí.</p></div>`;
    return;
  }
  els.todayTodos.innerHTML = todayTodos.map(todo => {
    const cat = getCategory(todo.category);
    return `
      <article class="item">
        <div class="item-top">
          <label class="checkbox-row">
            <input type="checkbox" ${todo.done ? 'checked' : ''} data-action="toggle-todo" data-id="${todo.id}">
            <span class="${todo.done ? 'strike' : ''}">${escapeHtml(todo.title)}</span>
          </label>
          <span class="chip">${cat.emoji} ${cat.name}</span>
        </div>
      </article>`;
  }).join('');
}

function renderReminders() {
  if (!state.reminders.length) {
    els.remindersList.innerHTML = `<div class="item"><p class="muted">Sin recordatorios. Bien.</p></div>`;
    return;
  }
  els.remindersList.innerHTML = state.reminders.map(reminder => {
    const cat = getCategory(reminder.category);
    return `
      <article class="item compact">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(reminder.title)}</strong>
            <p class="muted tiny">${cat.emoji} ${cat.name}</p>
          </div>
          <button class="ghost-btn" data-action="promote-reminder" data-id="${reminder.id}">Hoy</button>
        </div>
      </article>`;
  }).join('');
}

function renderHabits() {
  if (!state.habits.length) {
    els.habitsList.innerHTML = `<div class="item"><p class="muted">Aún no tienes hábitos. Crea uno pequeño y sostenible.</p></div>`;
    return;
  }
  els.habitsList.innerHTML = state.habits.map(habit => {
    const cat = getCategory(habit.category);
    const completedToday = habit.lastCompletedDate === todayKey;
    return `
      <article class="item">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(habit.title)}</strong>
            <p class="muted tiny">${cat.emoji} ${cat.name}</p>
          </div>
          <span class="badge">🔥 ${habit.streak}</span>
        </div>
        <div class="item-actions">
          <button class="primary-btn" data-action="complete-habit" data-id="${habit.id}" ${completedToday ? 'disabled' : ''}>${completedToday ? 'Hecho hoy' : 'Marcar hoy'}</button>
        </div>
      </article>`;
  }).join('');
}

function renderHeatmap() {
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last14.push(d.toISOString().slice(0, 10));
  }
  const completionSet = new Set(state.habits.flatMap(habit => habit.completions || []));
  els.habitHeatmap.innerHTML = `
    <div class="heatmap-grid">
      ${last14.map(day => `<div class="heat-cell ${completionSet.has(day) ? 'active' : ''}"></div>`).join('')}
    </div>
    <p class="muted tiny">Últimos 14 días de consistencia.</p>
  `;
}

function renderGoals() {
  if (!state.goals.length) {
    els.goalsList.innerHTML = `<div class="item"><p class="muted">Aún no tienes objetivos. Agrega una meta importante.</p></div>`;
    return;
  }
  els.goalsList.innerHTML = state.goals.map(goal => {
    const pct = Math.min(Math.round((goal.progress / goal.target) * 100), 100);
    const cat = getCategory(goal.category);
    return `
      <article class="item">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(goal.title)}</strong>
            <p class="muted tiny">${cat.emoji} ${cat.name}</p>
          </div>
          <span class="badge">${pct}%</span>
        </div>
        <div class="progress-line"><span style="width:${pct}%"></span></div>
        <div class="item-actions">
          <button class="ghost-btn" data-action="goal-minus" data-id="${goal.id}">-</button>
          <button class="primary-btn" data-action="goal-plus" data-id="${goal.id}">Actualizar</button>
        </div>
      </article>`;
  }).join('');
}

function renderAll() {
  fillCategorySelects();
  renderSummary();
  renderTodos();
  renderReminders();
  renderHabits();
  renderHeatmap();
  renderGoals();
  renderRecentActivity();
  saveState();
}

els.tabs.forEach(tab => tab.addEventListener('click', () => {
  els.tabs.forEach(t => t.classList.toggle('active', t === tab));
  els.panels.forEach(panel => panel.classList.toggle('active', panel.id === tab.dataset.tab));
}));

els.reminderForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = reminderTitle.value.trim();
  if (!title) return;
  state.reminders.unshift({ id: crypto.randomUUID(), title, category: reminderCategory.value, createdAt: todayKey });
  addActivity(`Nuevo recordatorio: ${title}`);
  e.target.reset();
  renderAll();
});

els.habitForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = habitTitle.value.trim();
  if (!title) return;
  state.habits.unshift({ id: crypto.randomUUID(), title, category: habitCategory.value, streak: 0, bestStreak: 0, lastCompletedDate: null, completions: [] });
  addActivity(`Nuevo hábito: ${title}`);
  e.target.reset();
  renderAll();
});

els.goalForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = goalTitle.value.trim();
  if (!title) return;
  state.goals.unshift({ id: crypto.randomUUID(), title, progress: 0, target: Number(goalTarget.value) || 10, category: 'trabajo', active: true });
  addActivity(`Nuevo objetivo: ${title}`);
  e.target.reset();
  goalTarget.value = 10;
  renderAll();
});

els.addTodayTodoBtn.addEventListener('click', () => els.todoDialog.showModal());
els.todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = todoTitle.value.trim();
  if (!title) return;
  state.todos.unshift({ id: crypto.randomUUID(), title, category: todoCategory.value, done: false, date: todayKey });
  addActivity(`Nueva tarea: ${title}`);
  els.todoDialog.close();
  e.target.reset();
  renderAll();
});

els.seedBtn.addEventListener('click', () => {
  state = {
    ...state,
    reminders: [...state.reminders, ...presetData.reminders],
    todos: [...state.todos, ...presetData.todos],
    habits: [...state.habits, ...presetData.habits],
    goals: [...state.goals, ...presetData.goals]
  };
  addActivity('Se cargaron presets iniciales');
  renderAll();
});

els.resetDayBtn.addEventListener('click', () => {
  state.todos = state.todos.map(todo => todo.date === todayKey ? { ...todo, done: false } : todo);
  addActivity('Se reseteó el estado del día');
  renderAll();
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'promote-reminder') {
    const reminder = state.reminders.find(item => item.id === id);
    if (reminder) {
      state.reminders = state.reminders.filter(item => item.id !== id);
      state.todos.unshift({ id: crypto.randomUUID(), title: reminder.title, category: reminder.category, done: false, date: todayKey });
      addActivity(`Recordatorio pasado a hoy: ${reminder.title}`);
    }
  }

  if (action === 'complete-habit') {
    state.habits = state.habits.map(habit => {
      if (habit.id !== id) return habit;
      const streak = habit.lastCompletedDate === yesterdayKey ? habit.streak + 1 : habit.lastCompletedDate === todayKey ? habit.streak : 1;
      const bestStreak = Math.max(habit.bestStreak || 0, streak);
      addActivity(`Hábito completado: ${habit.title}`);
      return { ...habit, streak, bestStreak, lastCompletedDate: todayKey, completions: [...(habit.completions || []), todayKey].slice(-60) };
    });
  }

  if (action === 'goal-plus') {
    state.goals = state.goals.map(goal => goal.id === id ? { ...goal, progress: Math.min(goal.progress + 1, goal.target) } : goal);
    addActivity('Objetivo actualizado');
  }

  if (action === 'goal-minus') {
    state.goals = state.goals.map(goal => goal.id === id ? { ...goal, progress: Math.max(goal.progress - 1, 0) } : goal);
  }

  renderAll();
});

document.addEventListener('change', e => {
  const checkbox = e.target.closest('[data-action="toggle-todo"]');
  if (!checkbox) return;
  state.todos = state.todos.map(todo => {
    if (todo.id !== checkbox.dataset.id) return todo;
    const nextDone = checkbox.checked;
    if (nextDone && !todo.done) addActivity(`Tarea completada: ${todo.title}`);
    return { ...todo, done: nextDone };
  });
  renderAll();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  }).catch(() => {});
}

renderAll();
