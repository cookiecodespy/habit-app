const STORAGE_KEY = 'boss-mode-v1';
const todayKey = new Date().toISOString().slice(0, 10);
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
    { id: crypto.randomUUID(), title: 'Prepararme para la próxima clase', category: 'universidad', reward: 10, done: false, date: todayKey },
    { id: crypto.randomUUID(), title: 'Revisar pendientes de trabajo prioritarios', category: 'trabajo', reward: 15, done: false, date: todayKey }
  ],
  habits: [
    { id: crypto.randomUUID(), title: 'Leer 20 min', category: 'salud', reward: 20, streak: 0, bestStreak: 0, lastCompletedDate: null },
    { id: crypto.randomUUID(), title: 'No fumar hoy', category: 'salud', reward: 35, streak: 0, bestStreak: 0, lastCompletedDate: null },
    { id: crypto.randomUUID(), title: 'Avanzar 1 mejora a OpenClaw', category: 'openclaw', reward: 25, streak: 0, bestStreak: 0, lastCompletedDate: null }
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
  tabs: [...document.querySelectorAll('.tab')],
  panels: [...document.querySelectorAll('.tab-panel')],
  categoryChips: document.getElementById('categoryChips'),
  remindersList: document.getElementById('remindersList'),
  habitsList: document.getElementById('habitsList'),
  rewardsList: document.getElementById('rewardsList'),
  todayTodos: document.getElementById('todayTodos'),
  reminderForm: document.getElementById('reminderForm'),
  habitForm: document.getElementById('habitForm'),
  rewardForm: document.getElementById('rewardForm'),
  todoDialog: document.getElementById('todoDialog'),
  todoForm: document.getElementById('todoForm'),
  addTodayTodoBtn: document.getElementById('addTodayTodoBtn'),
  seedBtn: document.getElementById('seedBtn')
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : { categories: defaultCategories, reminders: [], todos: [], habits: [], rewards: [], points: 0, redeemedRewards: [] };
};
let state = loadState();
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const getCategory = (id) => state.categories.find(cat => cat.id === id) || state.categories[0];
const formatDate = () => new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
const isYesterday = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
};

function fillCategorySelects() {
  const options = state.categories.map(cat => `<option value="${cat.id}">${cat.emoji} ${cat.name}</option>`).join('');
  ['reminderCategory', 'habitCategory', 'todoCategory'].forEach(id => {
    document.getElementById(id).innerHTML = options;
  });
}

function renderCategories() {
  els.categoryChips.innerHTML = state.categories.map(cat => `<span class="chip">${cat.emoji} ${cat.name}</span>`).join('');
}

function renderSummary() {
  const todayTodos = state.todos.filter(todo => todo.date === todayKey);
  const done = todayTodos.filter(todo => todo.done).length;
  const streaks = state.habits.map(h => h.bestStreak || 0);
  els.todayDate.textContent = formatDate();
  els.dailySummary.textContent = `${done}/${todayTodos.length || 0} tareas listas hoy · ${state.habits.length} hábitos activos`;
  els.pointsValue.textContent = state.points || 0;
  els.bestStreakValue.textContent = streaks.length ? Math.max(...streaks) : 0;
}

function renderTodos() {
  const todayTodos = state.todos.filter(todo => todo.date === todayKey);
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
            <span class="${todo.done ? 'strike' : ''}">${todo.title}</span>
          </label>
          <span class="badge">+${todo.reward} pts</span>
        </div>
        <div class="item-actions">
          <span class="chip">${cat.emoji} ${cat.name}</span>
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
            <strong>${reminder.title}</strong>
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
            <strong>${habit.title}</strong>
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
          <strong>${reward.title}</strong>
          <p class="muted tiny">Canjéalo cuando quieras darte una recompensa con intención.</p>
        </div>
        <span class="badge">${reward.cost} pts</span>
      </div>
      <div class="item-actions">
        <button class="primary-btn" data-action="redeem-reward" data-id="${reward.id}" ${state.points < reward.cost ? 'disabled' : ''}>Canjear</button>
        <button class="ghost-btn" data-action="delete-reward" data-id="${reward.id}">Eliminar</button>
      </div>
    </article>`).join('');
}

function renderAll() {
  fillCategorySelects();
  renderCategories();
  renderSummary();
  renderTodos();
  renderReminders();
  renderHabits();
  renderRewards();
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
  renderAll();
}

els.tabs.forEach(tab => tab.addEventListener('click', () => {
  els.tabs.forEach(t => t.classList.toggle('active', t === tab));
  els.panels.forEach(panel => panel.classList.toggle('active', panel.id === tab.dataset.tab));
}));

els.reminderForm.addEventListener('submit', e => {
  e.preventDefault();
  state.reminders.unshift({
    id: crypto.randomUUID(),
    title: reminderTitle.value.trim(),
    category: reminderCategory.value,
    reward: Number(reminderReward.value) || 10,
    createdAt: todayKey
  });
  e.target.reset();
  reminderReward.value = 15;
  renderAll();
});

els.habitForm.addEventListener('submit', e => {
  e.preventDefault();
  state.habits.unshift({
    id: crypto.randomUUID(),
    title: habitTitle.value.trim(),
    category: habitCategory.value,
    reward: Number(habitReward.value) || 20,
    streak: 0,
    bestStreak: 0,
    lastCompletedDate: null
  });
  e.target.reset();
  habitReward.value = 20;
  renderAll();
});

els.rewardForm.addEventListener('submit', e => {
  e.preventDefault();
  state.rewards.unshift({
    id: crypto.randomUUID(),
    title: rewardTitle.value.trim(),
    cost: Number(rewardCost.value) || 60
  });
  e.target.reset();
  rewardCost.value = 60;
  renderAll();
});

els.addTodayTodoBtn.addEventListener('click', () => els.todoDialog.showModal());
els.todoForm.addEventListener('submit', e => {
  e.preventDefault();
  state.todos.unshift({
    id: crypto.randomUUID(),
    title: todoTitle.value.trim(),
    category: todoCategory.value,
    reward: Number(todoReward.value) || 10,
    done: false,
    date: todayKey
  });
  els.todoDialog.close();
  e.target.reset();
  todoReward.value = 10;
  renderAll();
});
els.seedBtn.addEventListener('click', seedData);

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'promote-reminder') {
    const reminder = state.reminders.find(item => item.id === id);
    state.reminders = state.reminders.filter(item => item.id !== id);
    state.todos.unshift({ ...reminder, done: false, date: todayKey });
  }

  if (action === 'delete-reminder') state.reminders = state.reminders.filter(item => item.id !== id);
  if (action === 'delete-todo') state.todos = state.todos.filter(item => item.id !== id);
  if (action === 'delete-habit') state.habits = state.habits.filter(item => item.id !== id);
  if (action === 'delete-reward') state.rewards = state.rewards.filter(item => item.id !== id);

  if (action === 'redeem-reward') {
    const reward = state.rewards.find(item => item.id === id);
    if (reward && state.points >= reward.cost) {
      state.points -= reward.cost;
      state.redeemedRewards = [...(state.redeemedRewards || []), { ...reward, redeemedAt: new Date().toISOString() }];
    }
  }

  if (action === 'complete-habit') {
    state.habits = state.habits.map(habit => {
      if (habit.id !== id) return habit;
      const streak = habit.lastCompletedDate && isYesterday(habit.lastCompletedDate) ? habit.streak + 1 : habit.lastCompletedDate === todayKey ? habit.streak : 1;
      const bestStreak = Math.max(habit.bestStreak || 0, streak);
      addPoints(habit.reward);
      return { ...habit, streak, bestStreak, lastCompletedDate: todayKey };
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
    if (nextDone && !todo.done) addPoints(todo.reward);
    return { ...todo, done: nextDone };
  });
  renderAll();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

renderAll();
