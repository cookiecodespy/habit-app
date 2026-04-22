const STORAGE_KEY = 'boss-mode-v2';
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
    { id: crypto.randomUUID(), title: 'Agregar una skill útil a OpenClaw', category: 'skills', reward: 25, createdAt: todayKey },
    { id: crypto.randomUUID(), title: 'Dejar lista una mejora chica en OpenClaw', category: 'openclaw', reward: 20, createdAt: todayKey },
    { id: crypto.randomUUID(), title: 'Repasar cálculo antes de salir', category: 'universidad', reward: 15, createdAt: todayKey }
  ],
  todos: [
    { id: crypto.randomUUID(), title: 'Prepararme para la próxima clase', category: 'universidad', reward: 10, done: false, date: todayKey, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Revisar pendientes de trabajo prioritarios', category: 'trabajo', reward: 15, done: false, date: todayKey, createdAt: new Date().toISOString() }
  ],
  habits: [
    { id: crypto.randomUUID(), title: 'Leer 20 min', category: 'salud', reward: 20, streak: 0, bestStreak: 0, lastCompletedDate: null, completions: [] },
    { id: crypto.randomUUID(), title: 'No fumar hoy', category: 'salud', reward: 35, streak: 0, bestStreak: 0, lastCompletedDate: null, completions: [] },
    { id: crypto.randomUUID(), title: 'Avanzar 1 mejora a OpenClaw', category: 'openclaw', reward: 25, streak: 0, bestStreak: 0, lastCompletedDate: null, completions: [] }
  ],
  rewards: [
    { id: crypto.randomUUID(), title: 'Pedir algo rico', cost: 60 },
    { id: crypto.randomUUID(), title: '1 hora sin culpa para descansar', cost: 90 },
    { id: crypto.randomUUID(), title: 'Comprar algo chico que me motive', cost: 140 }
  ]
};

const els = {
  todayDate: document.getElementById('todayDate'),
  dailySummary: document.getElementById('dailySummary'),
  pointsValue: document.getElementById('pointsValue'),
  bestStreakValue: document.getElementById('bestStreakValue'),
  doneTodayValue: document.getElementById('doneTodayValue'),
  redeemedCountValue: document.getElementById('redeemedCountValue'),
  todayProgressLabel: document.getElementById('todayProgressLabel'),
  todayProgressBar: document.getElementById('todayProgressBar'),
  tabs: [...document.querySelectorAll('.tab')],
  panels: [...document.querySelectorAll('.tab-panel')],
  categoryChips: document.getElementById('categoryChips'),
  remindersList: document.getElementById('remindersList'),
  habitsList: document.getElementById('habitsList'),
  rewardsList: document.getElementById('rewardsList'),
  redeemedRewardsList: document.getElementById('redeemedRewardsList'),
  todayTodos: document.getElementById('todayTodos'),
  insightCards: document.getElementById('insightCards'),
  recentActivity: document.getElementById('recentActivity'),
  reminderForm: document.getElementById('reminderForm'),
  habitForm: document.getElementById('habitForm'),
  rewardForm: document.getElementById('rewardForm'),
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
  rewards: [],
  points: 0,
  redeemedRewards: [],
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
const escapeHtml = value => value.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

function addActivity(text) {
  state.activity = [{ id: crypto.randomUUID(), text, at: new Date().toISOString() }, ...(state.activity || [])].slice(0, 20);
}

function fillCategorySelects() {
  const options = state.categories.map(cat => `<option value="${cat.id}">${cat.emoji} ${cat.name}</option>`).join('');
  ['reminderCategory', 'habitCategory', 'todoCategory'].forEach(id => {
    document.getElementById(id).innerHTML = options;
  });
}

function renderCategories() {
  els.categoryChips.innerHTML = state.categories.map(cat => `<span class="chip">${cat.emoji} ${cat.name}</span>`).join('');
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
  els.todayDate.textContent = formatDate();
  els.dailySummary.textContent = `${done}/${todayTodos.length || 0} tareas listas hoy · ${state.habits.length} hábitos activos · ${state.reminders.length} recordatorios pendientes`;
  els.pointsValue.textContent = state.points || 0;
  els.bestStreakValue.textContent = streaks.length ? Math.max(...streaks) : 0;
  els.doneTodayValue.textContent = done;
  els.redeemedCountValue.textContent = (state.redeemedRewards || []).length;
  els.todayProgressLabel.textContent = `${progress}%`;
  els.todayProgressBar.style.width = `${progress}%`;
}

function renderInsights() {
  const topHabit = [...state.habits].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
  const cheapestReward = [...state.rewards].sort((a, b) => a.cost - b.cost)[0];
  const dueReminders = state.reminders.length;
  const cards = [
    {
      title: 'Siguiente foco',
      body: getTodayTodos().find(todo => !todo.done)?.title || 'Vas al día, agrega otra tarea si quieres seguir con impulso.'
    },
    {
      title: 'Mejor racha activa',
      body: topHabit ? `${topHabit.title} · ${topHabit.streak} día(s)` : 'Aún no hay hábitos activos.'
    },
    {
      title: 'Premio más cercano',
      body: cheapestReward ? `${cheapestReward.title} por ${cheapestReward.cost} pts` : 'Crea un premio que te motive.'
    },
    {
      title: 'Bandeja pendiente',
      body: dueReminders ? `${dueReminders} recordatorio(s) esperando pasar a acción.` : 'Tu bandeja está limpia.'
    }
  ];
  els.insightCards.innerHTML = cards.map(card => `
    <article class="mini-card">
      <p class="eyebrow small">${card.title}</p>
      <strong>${card.body}</strong>
    </article>
  `).join('');
}

function renderRecentActivity() {
  const activity = state.activity || [];
  if (!activity.length) {
    els.recentActivity.innerHTML = `<div class="item compact"><p class="muted">Todavía no hay actividad. Cuando completes cosas, aparecerán aquí.</p></div>`;
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
    els.todayTodos.innerHTML = `<div class="item"><p class="muted">Todavía no hay TODOs para hoy. Agrega uno o convierte un recordatorio.</p></div>`;
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
          <span class="badge">+${todo.reward} pts</span>
        </div>
        <div class="item-actions">
          <span class="chip">${cat.emoji} ${cat.name}</span>
          <button class="ghost-btn" data-action="carry-over-todo" data-id="${todo.id}">Mañana</button>
          <button class="ghost-btn" data-action="delete-todo" data-id="${todo.id}">Eliminar</button>
        </div>
      </article>`;
  }).join('');
}

function renderReminders() {
  if (!state.reminders.length) {
    els.remindersList.innerHTML = `<div class="item"><p class="muted">Sin recordatorios pendientes. Buen momento para capturar uno.</p></div>`;
    return;
  }
  els.remindersList.innerHTML = state.reminders.map(reminder => {
    const cat = getCategory(reminder.category);
    return `
      <article class="item">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(reminder.title)}</strong>
            <p class="muted tiny">${cat.emoji} ${cat.name}</p>
          </div>
          <span class="badge">+${reminder.reward}</span>
        </div>
        <div class="item-actions">
          <button class="primary-btn" data-action="promote-reminder" data-id="${reminder.id}">Pasar a hoy</button>
          <button class="ghost-btn" data-action="delete-reminder" data-id="${reminder.id}">Borrar</button>
        </div>
      </article>`;
  }).join('');
}

function renderHabits() {
  if (!state.habits.length) {
    els.habitsList.innerHTML = `<div class="item"><p class="muted">Aún no tienes hábitos. Crea uno y parte suave.</p></div>`;
    return;
  }
  els.habitsList.innerHTML = state.habits.map(habit => {
    const cat = getCategory(habit.category);
    const progress = Math.min((habit.streak / 7) * 100, 100);
    const completedToday = habit.lastCompletedDate === todayKey;
    return `
      <article class="item">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(habit.title)}</strong>
            <p class="muted tiny">${cat.emoji} ${cat.name}</p>
          </div>
          <span class="badge">🔥 ${habit.streak} / ⭐ ${habit.bestStreak}</span>
        </div>
        <div class="progress-line"><span style="width:${progress}%"></span></div>
        <div class="item-actions">
          <button class="primary-btn" data-action="complete-habit" data-id="${habit.id}" ${completedToday ? 'disabled' : ''}>${completedToday ? 'Hecho hoy' : 'Marcar hoy'}</button>
          <span class="chip">+${habit.reward} pts</span>
          <button class="ghost-btn" data-action="delete-habit" data-id="${habit.id}">Eliminar</button>
        </div>
      </article>`;
  }).join('');
}

function renderRewards() {
  if (!state.rewards.length) {
    els.rewardsList.innerHTML = `<div class="item"><p class="muted">Todavía no hay premios. Agrega uno rico o útil.</p></div>`;
    return;
  }
  els.rewardsList.innerHTML = state.rewards.map(reward => `
    <article class="item">
      <div class="item-top">
        <div>
          <strong>${escapeHtml(reward.title)}</strong>
          <p class="muted tiny">Canjéalo con intención, no por impulso.</p>
        </div>
        <span class="badge">${reward.cost} pts</span>
      </div>
      <div class="item-actions">
        <button class="primary-btn" data-action="redeem-reward" data-id="${reward.id}" ${state.points < reward.cost ? 'disabled' : ''}>Canjear</button>
        <button class="ghost-btn" data-action="delete-reward" data-id="${reward.id}">Eliminar</button>
      </div>
    </article>`).join('');
}

function renderRedeemedRewards() {
  const redeemed = state.redeemedRewards || [];
  if (!redeemed.length) {
    els.redeemedRewardsList.innerHTML = `<div class="item compact"><p class="muted">Todavía no has canjeado premios.</p></div>`;
    return;
  }
  els.redeemedRewardsList.innerHTML = redeemed.slice(0, 8).map(item => `
    <article class="item compact">
      <strong>${escapeHtml(item.title)}</strong>
      <p class="muted tiny">${item.cost} pts · ${formatActivityDate(item.redeemedAt)}</p>
    </article>`).join('');
}

function renderAll() {
  fillCategorySelects();
  renderCategories();
  renderSummary();
  renderInsights();
  renderRecentActivity();
  renderTodos();
  renderReminders();
  renderHabits();
  renderRewards();
  renderRedeemedRewards();
  saveState();
}

function addPoints(points) {
  state.points += points;
}

function seedData() {
  state = {
    ...state,
    reminders: [...state.reminders, ...presetData.reminders],
    todos: [...state.todos, ...presetData.todos],
    habits: [...state.habits, ...presetData.habits],
    rewards: [...state.rewards, ...presetData.rewards]
  };
  addActivity('Se cargaron presets iniciales');
  renderAll();
}

els.tabs.forEach(tab => tab.addEventListener('click', () => {
  els.tabs.forEach(t => t.classList.toggle('active', t === tab));
  els.panels.forEach(panel => panel.classList.toggle('active', panel.id === tab.dataset.tab));
}));

els.reminderForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = reminderTitle.value.trim();
  if (!title) return;
  state.reminders.unshift({
    id: crypto.randomUUID(),
    title,
    category: reminderCategory.value,
    reward: Number(reminderReward.value) || 10,
    createdAt: todayKey
  });
  addActivity(`Nuevo recordatorio: ${title}`);
  e.target.reset();
  reminderReward.value = 15;
  renderAll();
});

els.habitForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = habitTitle.value.trim();
  if (!title) return;
  state.habits.unshift({
    id: crypto.randomUUID(),
    title,
    category: habitCategory.value,
    reward: Number(habitReward.value) || 20,
    streak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    completions: []
  });
  addActivity(`Nuevo hábito: ${title}`);
  e.target.reset();
  habitReward.value = 20;
  renderAll();
});

els.rewardForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = rewardTitle.value.trim();
  if (!title) return;
  state.rewards.unshift({
    id: crypto.randomUUID(),
    title,
    cost: Number(rewardCost.value) || 60
  });
  addActivity(`Nuevo premio: ${title}`);
  e.target.reset();
  rewardCost.value = 60;
  renderAll();
});

els.addTodayTodoBtn.addEventListener('click', () => els.todoDialog.showModal());
els.todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = todoTitle.value.trim();
  if (!title) return;
  state.todos.unshift({
    id: crypto.randomUUID(),
    title,
    category: todoCategory.value,
    reward: Number(todoReward.value) || 10,
    done: false,
    date: todayKey,
    createdAt: new Date().toISOString()
  });
  addActivity(`Nueva tarea para hoy: ${title}`);
  els.todoDialog.close();
  e.target.reset();
  todoReward.value = 10;
  renderAll();
});

els.seedBtn.addEventListener('click', seedData);
els.resetDayBtn.addEventListener('click', () => {
  const current = getTodayTodos();
  state.todos = state.todos.filter(todo => todo.date !== todayKey).concat(current.filter(todo => !todo.done).map(todo => ({ ...todo, done: false })));
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
      state.todos.unshift({ ...reminder, done: false, date: todayKey, createdAt: new Date().toISOString() });
      addActivity(`Recordatorio convertido a tarea: ${reminder.title}`);
    }
  }

  if (action === 'delete-reminder') state.reminders = state.reminders.filter(item => item.id !== id);
  if (action === 'delete-todo') state.todos = state.todos.filter(item => item.id !== id);
  if (action === 'delete-habit') state.habits = state.habits.filter(item => item.id !== id);
  if (action === 'delete-reward') state.rewards = state.rewards.filter(item => item.id !== id);

  if (action === 'carry-over-todo') {
    state.todos = state.todos.map(todo => todo.id === id ? { ...todo, done: false, date: new Date(Date.now() + 86400000).toISOString().slice(0, 10) } : todo);
    addActivity('Se movió una tarea para mañana');
  }

  if (action === 'redeem-reward') {
    const reward = state.rewards.find(item => item.id === id);
    if (reward && state.points >= reward.cost) {
      state.points -= reward.cost;
      state.redeemedRewards = [{ ...reward, redeemedAt: new Date().toISOString() }, ...(state.redeemedRewards || [])];
      addActivity(`Premio canjeado: ${reward.title}`);
    }
  }

  if (action === 'complete-habit') {
    state.habits = state.habits.map(habit => {
      if (habit.id !== id) return habit;
      const streak = habit.lastCompletedDate === yesterdayKey ? habit.streak + 1 : habit.lastCompletedDate === todayKey ? habit.streak : 1;
      const bestStreak = Math.max(habit.bestStreak || 0, streak);
      addPoints(habit.reward);
      addActivity(`Hábito completado: ${habit.title}`);
      return {
        ...habit,
        streak,
        bestStreak,
        lastCompletedDate: todayKey,
        completions: [...(habit.completions || []), todayKey].slice(-30)
      };
    });
  }

  renderAll();
});

document.addEventListener('change', e => {
  const checkbox = e.target.closest('[data-action="toggle-todo"]');
  if (!checkbox) return;
  state.todos = state.todos.map(todo => {
    if (todo.id !== checkbox.dataset.id) return todo;
    const nextDone = checkbox.checked;
    if (nextDone && !todo.done) {
      addPoints(todo.reward);
      addActivity(`Tarea completada: ${todo.title}`);
    }
    return { ...todo, done: nextDone };
  });
  renderAll();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

renderAll();
