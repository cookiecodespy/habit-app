// lifeos-app.jsx — the app shells: phone (single column + tab bar) and tablet/desktop
// (sidebar + dashboard). Both share one controller (state and actions) and one set of overlays.

import React from 'react';
import { fmt12, loDateStr, loHHMMtoMin, loMinToHHMM } from './domain/dates';
import { LOStore } from './domain/store';
import {
  DeadlineCard, FocusMode, HabitCreateSheet, HabitsScreen, HabitsStrip, QuickAddMenu, RoutinesScreen,
  SearchOverlay,
} from './lifeos-extras.jsx';
import { LIFE_PALETTE, UIIcon } from './lifeos-icons.jsx';
import { ToastStack, toast, useTaskNotifications } from './lifeos-notify.jsx';
import {
  AIScreen, CalendarScreen, CreateScreen, DetailScreen, FAB, InboxScreen, SettingsScreen, TabBar,
} from './lifeos-screens.jsx';
import { TL_THEMES, TimelineClassic, TimelineHeaderBody, TimelineTopBar } from './lifeos-timeline.jsx';
import { DialogHost, Sheet, ask, useMediaQuery, useNow } from './lifeos-ui.jsx';
import { EditNameSheet, WelcomeScreen, greetingFor, useUser } from './lifeos-user.jsx';
import { useTasks } from './store-hooks.js';
import { useTweaks } from './tweaks.js';

const TWEAK_DEFAULTS = {
  "dark": true,
  "density": "comfy",
  "blockShape": "rounded",
  "accent": "#E0241B"
};

// First free 30-min slot on a day — from now if it's today, else 9:00.
// Used when scheduling an inbox item so it doesn't stomp on a busy hour.
function loFreeSlotStart(date, durationMin = 30) {
  const isToday = date === loDateStr();
  const now = new Date();
  let cursor = isToday ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30 : 9 * 60;
  const busy = LOStore.tasksForDate(date).filter(t => !t.allDay).map(t => ({ s: loHHMMtoMin(t.start), e: loHHMMtoMin(t.start) + (t.durationMin || 30) }));
  let guard = 0, clash;
  const overlaps = (s) => busy.find(o => s < o.e && (s + durationMin) > o.s);
  while ((clash = overlaps(cursor)) && guard++ < 48) cursor = clash.e;
  return loMinToHHMM(cursor);
}

function useThemed(t) {
  // The keyboard focus ring follows the accent colour.
  React.useEffect(() => { document.documentElement.style.setProperty('--lo-focus', t.accent); }, [t.accent]);
  return React.useMemo(() => ({
    ...(t.dark ? TL_THEMES.dark : TL_THEMES.light),
    accent: t.accent,
    accentSoft: t.accent + (t.dark ? '22' : '18'),
  }), [t.dark, t.accent]);
}

/** A toast with a "Deshacer" button that puts the data back as it was in `snapshot`. */
function toastUndo(message, snapshot, options = {}) {
  toast(message, {
    icon: 'trash', duration: 7000, ...options,
    action: { label: 'Deshacer', run: () => { LOStore.restore(snapshot); toast('Restaurado', { icon: 'check' }); } },
  });
}

// ──────────────────────────────────────────────────────────────
// useApp — everything both shells need: which section and overlay are open, which day
// "Hoy" shows, and the actions the screens trigger.
// ──────────────────────────────────────────────────────────────
function useApp() {
  const { user, setName } = useUser();
  const [tab, setTab] = React.useState('timeline');
  const [overlay, setOverlay] = React.useState(null); // { name, ...params } | null
  const now = useNow();
  const today = loDateStr(now);
  const [date, setDate] = React.useState(today);
  useTasks(); // re-render whenever the stored data changes
  useTaskNotifications(user);

  // At midnight "Hoy" moves to the new day, unless the person is looking at another one.
  const lastToday = React.useRef(today);
  React.useEffect(() => {
    if (lastToday.current === today) return;
    const previous = lastToday.current;
    lastToday.current = today;
    setDate((shown) => (shown === previous ? today : shown));
  }, [today]);

  const open = React.useCallback((name, params = {}) => setOverlay({ name, ...params }), []);
  const close = React.useCallback(() => setOverlay(null), []);

  const actions = React.useMemo(() => ({
    openTask: (task) => open('detail', { id: task.id }),
    openHabit: (habit) => open('habitEdit', { id: habit.id }),
    create: (forDate) => open('create', { date: forDate }),
    addTask(task) {
      const saved = LOStore.addTask(task);
      toast(`Tarea "${saved.title}" agendada`, { tone: 'success', icon: 'check' });
      return saved;
    },
    // Removes a task; for a repeated one, asks how much of the series first.
    async deleteTask(id) {
      const task = LOStore.getTask(id);
      if (!task) return false;
      let scope = 'all';
      const repeats = !!LOStore.seriesOf(task);
      if (repeats) {
        scope = await ask({
          title: 'Esta tarea se repite',
          body: `¿Qué quieres eliminar de "${task.title}"?`,
          options: [
            { id: 'day', label: 'Solo este día' },
            { id: 'following', label: 'Este día y los siguientes' },
            { id: 'all', label: 'Toda la serie', tone: 'danger' },
          ],
        });
        if (!scope) return false;
      }
      const snapshot = LOStore.snapshot();
      LOStore.removeFromSeries(id, scope);
      toastUndo(scope === 'all' && repeats ? 'Serie eliminada' : 'Tarea eliminada', snapshot);
      return true;
    },
    scheduleInbox(item) {
      const day = loDateStr();
      const saved = LOStore.addTask({ title: item.text, start: loFreeSlotStart(day), durationMin: 30, date: day });
      toast(`"${saved.title}" agendada a las ${fmt12(saved.start)}`, { tone: 'success', icon: 'check' });
    },
    applyRoutine(routine, forDate) {
      const snapshot = LOStore.snapshot();
      const n = LOStore.applyRoutine(routine, forDate && forDate !== loDateStr() ? { date: forDate } : {});
      toastUndo(`Rutina agendada · ${n} ${n === 1 ? 'tarea' : 'tareas'}`, snapshot, { tone: 'success', icon: 'check' });
    },
    completeFocus(id) {
      LOStore.setTaskDone(id, true);
      toast('Tarea completada', { tone: 'success', icon: 'check' });
    },
    welcome(name) {
      setName(name);
      toast(`¡Hola, ${name}! Tu LifeOS está listo`, { tone: 'success', icon: 'check' });
    },
  }), [open, setName]);

  // Keyboard shortcuts for people with a keyboard: N new task, / search, T today.
  React.useEffect(() => {
    const onKey = (event) => {
      if (overlay || !user || event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const key = event.key.toLowerCase();
      if (key === 'n') { event.preventDefault(); open('create', { date }); }
      else if (key === '/') { event.preventDefault(); open('search'); }
      else if (key === 't') { setTab('timeline'); setDate(loDateStr()); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [overlay, user, open, date]);

  return { user, setName, tab, setTab, overlay, open, close, now, today, date, setDate, ...actions };
}

// ──────────────────────────────────────────────────────────────
// Overlays — sheets and full-screen layers, the same in both shells
// ──────────────────────────────────────────────────────────────
// What an overlay was about no longer exists (deleted here or in another tab): just close it.
function Gone({ onClose }) {
  React.useEffect(() => { onClose(); }, [onClose]);
  return null;
}

function Overlays({ app, theme }) {
  const { overlay, open, close } = app;
  if (!overlay) return null;
  switch (overlay.name) {
    case 'inbox':
      return <Sheet theme={theme} onClose={close} label="Bandeja" width={520}>
        {(dismiss) => <InboxScreen theme={theme} onBack={dismiss} onSchedule={app.scheduleInbox}/>}
      </Sheet>;
    case 'create':
      return <Sheet theme={theme} onClose={close} label="Nueva tarea" width={880}>
        {(dismiss) => <CreateScreen theme={theme} onBack={dismiss} onSave={app.addTask} initialDate={overlay.date}/>}
      </Sheet>;
    case 'detail':
      return <Sheet theme={theme} onClose={close} label="Detalle de la tarea" width={560}>
        {(dismiss) => <DetailScreen theme={theme} taskId={overlay.id} onBack={dismiss}
          onStartFocus={(id) => open('focus', { id })}
          onDelete={async (id) => { if (await app.deleteTask(id)) dismiss(); }}/>}
      </Sheet>;
    case 'routines':
      return <Sheet theme={theme} onClose={close} label="Rutinas" width={560}>
        {(dismiss) => <RoutinesScreen theme={theme} onBack={dismiss} date={app.date}
          onApply={(routine) => { app.applyRoutine(routine, app.date >= app.today ? app.date : app.today); dismiss(); }}/>}
      </Sheet>;
    case 'habit':
      return <Sheet theme={theme} onClose={close} label="Nuevo hábito" width={480}>
        {(dismiss) => <HabitCreateSheet theme={theme} onClose={dismiss}/>}
      </Sheet>;
    case 'habitEdit': {
      const habit = LOStore.allHabits().find((h) => h.id === overlay.id);
      if (!habit) return <Gone onClose={close}/>;
      return <Sheet theme={theme} onClose={close} label="Editar hábito" width={480}>
        {(dismiss) => <HabitCreateSheet theme={theme} habit={habit} onClose={dismiss}/>}
      </Sheet>;
    }
    case 'editname':
      return <Sheet theme={theme} onClose={close} label="Tu nombre" width={420} plain>
        {(dismiss) => <EditNameSheet theme={theme} currentName={app.user.name} onSave={app.setName} onClose={dismiss}/>}
      </Sheet>;
    case 'search':
      return <SearchOverlay theme={theme} onClose={close} onPickTask={app.openTask}/>;
    case 'focus': {
      const task = LOStore.getTask(overlay.id);
      if (!task) return <Gone onClose={close}/>;
      return <FocusMode theme={theme} task={task} onClose={close} onComplete={() => { app.completeFocus(overlay.id); close(); }}/>;
    }
    case 'quickadd':
      return <QuickAddMenu theme={theme} onClose={close} onSelect={(kind) => {
        if (kind === 'task') app.create(app.date >= app.today ? app.date : app.today);
        else if (kind === 'habit') open('habit');
        else if (kind === 'routine') open('routines');
        else if (kind === 'inbox') open('inbox');
        else if (kind === 'voice') { close(); app.setTab('ai'); }
      }}/>;
    default:
      return null;
  }
}

const topBarOpen = (app) => (what) => {
  if (what === 'ai') app.setTab('ai');
  else app.open(what);
};

// ──────────────────────────────────────────────────────────────
// Phone — one column, tab bar at the bottom
// ──────────────────────────────────────────────────────────────
const SAFE_TOP = 'calc(max(env(safe-area-inset-top, 0px), 12px) + 6px)';
const SAFE_BOTTOM = 'calc(max(env(safe-area-inset-bottom, 0px), 6px) + 88px)';

function PhoneApp({ t, setTweak }) {
  const theme = useThemed(t);
  const app = useApp();
  const { tab, setTab, overlay, date, now } = app;
  React.useEffect(() => {
    document.body.style.background = theme.bg;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme.bg);
  }, [theme.bg]);

  if (!app.user) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: theme.bg }}>
        <WelcomeScreen theme={theme} onDone={(u) => app.welcome(u.name)}/>
        <ToastStack theme={theme}/>
      </div>
    );
  }

  const addForDay = () => app.create(date >= app.today ? date : app.today);
  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.bg }}>
      <div style={{ position: 'relative', width: '100%', height: '100%',
        background: `radial-gradient(78% 36% at 8% -6%, ${theme.accent}1F, transparent 70%), radial-gradient(68% 34% at 96% -3%, #9B6DFF18, transparent 70%), ${theme.bg}`,
        overflow: 'hidden' }}>
        <main inert={overlay ? '' : undefined} style={{ position: 'absolute', inset: 0 }}>
          {tab === 'timeline' && (
            <div className="lo-tab-fade" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flexShrink: 0, paddingTop: SAFE_TOP, position: 'relative', zIndex: 5 }}>
                <TimelineTopBar theme={theme} userName={app.user.name} date={date} now={now}
                  onToday={() => app.setDate(app.today)} onOpen={topBarOpen(app)}/>
              </div>
              {/* A flex column, so the empty state can fill what is left of the screen */}
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', paddingBottom: SAFE_BOTTOM }}>
                <TimelineHeaderBody theme={theme} date={date} now={now} onSelect={app.setDate}/>
                <HabitsStrip theme={theme} date={date} today={app.today} onAdd={() => app.open('habit')} onEdit={app.openHabit}/>
                <DeadlineCard theme={theme} compact onOpenTask={app.openTask}/>
                <TimelineClassic theme={theme} dense={t.density === 'compact'} blockShape={t.blockShape}
                  date={date} now={now} onOpenTask={app.openTask} onAdd={addForDay} onToggle={LOStore.toggleTask}/>
              </div>
            </div>
          )}
          {tab !== 'timeline' && tab !== 'ai' && (
            <div className="lo-tab-fade" key={tab} style={{ position: 'absolute', inset: 0, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM, overflowY: 'auto' }}>
              {tab === 'month' && <CalendarScreen theme={theme} now={now} onOpenTask={app.openTask} onAdd={app.create}/>}
              {tab === 'stats' && <HabitsScreen theme={theme} onAddHabit={() => app.open('habit')} onEditHabit={app.openHabit}/>}
              {tab === 'settings' && <SettingsScreen theme={theme} user={app.user} t={t} setTweak={setTweak} onEditName={() => app.open('editname')}/>}
            </div>
          )}
          {tab === 'ai' && (
            <div className="lo-tab-fade" style={{ position: 'absolute', inset: 0, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM, display: 'flex', flexDirection: 'column' }}>
              <AIScreen theme={theme} onOpenTask={app.openTask}/>
            </div>
          )}
          {/* Keep routines and quick capture reachable even on an empty day */}
          {tab === 'timeline' && !overlay && <FAB theme={theme} onClick={() => app.open('quickadd')}/>}
          {!overlay && <TabBar theme={theme} current={tab} onChange={setTab}/>}
        </main>
        <Overlays app={app} theme={theme}/>
        <DialogHost theme={theme}/>
        <ToastStack theme={theme}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Tablet / desktop — sidebar + main content
// ──────────────────────────────────────────────────────────────
const SIDE_NAV = [
  { section: 'Planifica', items: [
    { id: 'timeline', icon: 'timeline', label: 'Hoy' },
    { id: 'month',    icon: 'calendar', label: 'Agenda' },
    { id: 'ai',       icon: 'ai',       label: 'Planner' },
  ] },
  { section: 'Constancia', items: [
    { id: 'stats',    icon: 'repeat',   label: 'Hábitos' },
  ] },
  { section: 'Cuenta', items: [
    { id: 'settings', icon: 'settings', label: 'Ajustes' },
  ] },
];
const SIDEBAR_W = 256;

function DesktopApp({ t, setTweak }) {
  const theme = useThemed(t);
  const app = useApp();
  const { tab, setTab, overlay, date, now } = app;
  // Wide desktop → 2-column dashboard; narrow tablet → single column.
  const isWide = useMediaQuery('(min-width: 1000px)');
  React.useEffect(() => { document.body.style.background = theme.bg; }, [theme.bg]);

  if (!app.user) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 420, maxWidth: '90vw' }}>
          <WelcomeScreen theme={theme} onDone={(u) => app.welcome(u.name)}/>
        </div>
        <ToastStack theme={theme}/>
      </div>
    );
  }

  const addForDay = () => app.create(date >= app.today ? date : app.today);
  const todayTasks = LOStore.tasksForDate(app.today).filter(x => x.kind !== 'break');
  const total = todayTasks.length;
  const done = todayTasks.filter(x => x.status === 'done').length;
  const R = 16, C = 2 * Math.PI * R;
  const pane = { position: 'absolute', inset: 0, overflowY: 'auto', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 32 };

  const timeline = (
    <TimelineClassic theme={theme} dense={t.density === 'compact'} blockShape={t.blockShape}
      date={date} now={now} onOpenTask={app.openTask} onAdd={addForDay} onToggle={LOStore.toggleTask}/>
  );
  const header = <TimelineHeaderBody theme={theme} date={date} now={now} onSelect={app.setDate}/>;
  const habits = <HabitsStrip theme={theme} date={date} today={app.today} wrap={isWide} onAdd={() => app.open('habit')} onEdit={app.openHabit}/>;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: theme.bg, overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <nav aria-label="Secciones" inert={overlay ? '' : undefined} style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
      }}>
        <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: `linear-gradient(140deg, ${theme.accent}, ${LIFE_PALETTE.plum.to})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${theme.accent}40`,
          }}>
            <UIIcon name="sparkle" size={19} color="#fff"/>
          </div>
          <span className="lo-display" style={{ fontSize: 20, fontWeight: 600, color: theme.text, letterSpacing: -0.3 }}>LifeOS</span>
        </div>

        <div style={{ margin: '0 12px 10px', padding: '10px 12px', borderRadius: 14, background: theme.surfaceHi, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(140deg, ${theme.accent}, ${theme.accent}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
            {(app.user.name || 'T').trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.user.name.split(' ')[0]}</div>
            <div style={{ fontSize: 11, color: theme.text3 }}>{greetingFor(now)}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '6px 10px', overflowY: 'auto' }}>
          {SIDE_NAV.map(group => (
            <div key={group.section} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: theme.text3, letterSpacing: 1.2, textTransform: 'uppercase', padding: '4px 12px 6px' }}>{group.section}</div>
              {group.items.map(item => {
                const active = tab === item.id;
                return (
                  <button key={item.id} className="lo-press lo-nav-btn" onClick={() => setTab(item.id)} aria-current={active ? 'page' : undefined} style={{
                    position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                    padding: '9px 12px', borderRadius: 11, marginBottom: 2,
                    background: active ? theme.accentSoft : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    {active && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: theme.accent }}/>}
                    <UIIcon name={item.icon} size={18} color={active ? theme.accent : theme.text3}/>
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? theme.text : theme.text2 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Today's progress */}
        <div style={{ margin: '0 12px 10px', padding: '11px 12px', borderRadius: 14, background: theme.surfaceHi, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width={42} height={42} aria-hidden="true" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={21} cy={21} r={R} fill="none" stroke={theme.rail} strokeWidth={4}/>
            <circle cx={21} cy={21} r={R} fill="none" stroke={theme.accent} strokeWidth={4} strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - (total ? done / total : 0))} style={{ transition: 'stroke-dashoffset .45s var(--ease-out-quart)' }}/>
          </svg>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>Tu día</div>
            <div style={{ fontSize: 11, color: theme.text3 }}>{total ? `${done}/${total} completadas` : 'Sin tareas hoy'}</div>
          </div>
        </div>

        <div style={{ margin: '0 12px 8px', display: 'flex', gap: 6 }}>
          {[['light', '☀', 'Tema claro'], ['dark', '☾', 'Tema oscuro']].map(([mode, glyph, label]) => {
            const on = mode === 'dark' ? t.dark : !t.dark;
            return (
              <button key={mode} className="lo-press" aria-label={label} title={label} aria-pressed={on} onClick={() => setTweak('dark', mode === 'dark')} style={{
                flex: 1, padding: '7px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                background: on ? theme.accentSoft : theme.surfaceHi, border: `0.5px solid ${on ? theme.accent + '66' : theme.border}`,
                color: on ? theme.accent : theme.text3, fontWeight: 600,
              }}>{glyph}</button>
            );
          })}
        </div>

        <div style={{ padding: '0 12px' }}>
          <button className="lo-press" onClick={addForDay} style={{
            width: '100%', padding: '12px 16px',
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`, color: '#fff',
            border: 'none', borderRadius: 14, cursor: 'pointer', fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 6px 18px ${theme.accent}55`,
          }}>
            <UIIcon name="plus" size={17} color="#fff"/> Nueva tarea
            <kbd style={{ marginLeft: 4, fontFamily: 'inherit', fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: 'rgba(0,0,0,0.2)' }}>N</kbd>
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <main inert={overlay ? '' : undefined} style={{ position: 'absolute', inset: 0 }}>
          {tab === 'timeline' && (
            <div className="lo-tab-fade" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flexShrink: 0, paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', zIndex: 5 }}>
                <div style={{ maxWidth: isWide ? 1180 : 680, margin: '0 auto', padding: isWide ? '0 8px' : 0 }}>
                  <TimelineTopBar theme={theme} userName={app.user.name} date={date} now={now}
                    onToday={() => app.setDate(app.today)} onOpen={topBarOpen(app)}/>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 48 }}>
                {isWide ? (
                  <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 28, alignItems: 'start' }}>
                    <div style={{ minWidth: 0 }}>{header}{timeline}</div>
                    <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column' }}>
                      {habits}
                      <DeadlineCard theme={theme} onOpenTask={app.openTask}/>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    {header}{habits}
                    <DeadlineCard theme={theme} compact onOpenTask={app.openTask}/>
                    {timeline}
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'month' && (
            <div className="lo-tab-fade" key="month" style={pane}>
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <CalendarScreen theme={theme} now={now} onOpenTask={app.openTask} onAdd={app.create}/>
              </div>
            </div>
          )}
          {tab === 'stats' && (
            <div className="lo-tab-fade" key="stats" style={pane}>
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <HabitsScreen theme={theme} onAddHabit={() => app.open('habit')} onEditHabit={app.openHabit}/>
              </div>
            </div>
          )}
          {tab === 'settings' && (
            <div className="lo-tab-fade" key="settings" style={pane}>
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <SettingsScreen theme={theme} user={app.user} t={t} setTweak={setTweak} onEditName={() => app.open('editname')}/>
              </div>
            </div>
          )}
          {tab === 'ai' && (
            <div className="lo-tab-fade" key="ai" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)' }}>
              <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
                <AIScreen theme={theme} onOpenTask={app.openTask}/>
              </div>
            </div>
          )}
          {tab === 'timeline' && !overlay && <FAB theme={theme} onClick={() => app.open('quickadd')}/>}
        </main>
        <Overlays app={app} theme={theme}/>
        <DialogHost theme={theme}/>
        <ToastStack theme={theme}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// App — phone → single-column app; tablet/desktop → sidebar app.
// ──────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Live viewport tracking so rotating / resizing swaps layouts cleanly.
  const getIsPhone = React.useCallback(() => {
    const ua = navigator.userAgent;
    const isIPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    const isPhoneUA = /iPhone|Android.*Mobile|Mobile.*Android/i.test(ua);
    const isTabletUA = /iPad/i.test(ua) || isIPadOS;
    const isNarrow = window.matchMedia('(max-width: 760px)').matches;
    return isPhoneUA || (isNarrow && !isTabletUA);
  }, []);

  const [isPhone, setIsPhone] = React.useState(getIsPhone);
  React.useEffect(() => {
    const onResize = () => setIsPhone(getIsPhone());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getIsPhone]);

  return isPhone
    ? <PhoneApp t={t} setTweak={setTweak}/>
    : <DesktopApp t={t} setTweak={setTweak}/>;
}

export { App };
