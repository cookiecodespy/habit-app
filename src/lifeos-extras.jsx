// lifeos-extras.jsx — focus mode, quick add, routines, search, empty states, habits, deadlines

import React from 'react';
import { loStrip } from './domain/categories';
import { fmt12, loAddDays, loDateStr } from './domain/dates';
import { loHabitRate, loHabitScheduledOn, loHabitStats } from './domain/habits';
import { loDayLabel } from './domain/nlp';
import { LOStore } from './domain/store';
import { EmojiPicker, LIFE_PALETTE, LifeIcon, TaskGlyph, UIIcon } from './lifeos-icons.jsx';
import { toast } from './lifeos-notify.jsx';
import { Divider, ScreenTopBar, SectionLabel, SettingsIconBadge, glassBtn } from './lifeos-screens.jsx';
import { ColorSwatches, Sheet, confirmAsk, haptic, pal } from './lifeos-ui.jsx';
import { useHabits, useStoreVersion } from './store-hooks.js';

// ──────────────────────────────────────────────────────────────
// FOCUS MODE — full-screen countdown for one task ("Iniciar enfoque" in its detail)
// ──────────────────────────────────────────────────────────────
function FocusMode({ theme, task, onClose, onComplete }) {
  const c = pal(task.color);
  const totalSec = Math.max(60, (task.durationMin || 25) * 60);
  // The countdown follows the clock (an end time), not a per-second decrement: phones
  // throttle timers in the background and the old count drifted or froze.
  const [endsAt, setEndsAt] = React.useState(() => Date.now() + totalSec * 1000);
  const [pausedLeft, setPausedLeft] = React.useState(null); // seconds left while paused
  const [, tick] = React.useReducer((x) => x + 1, 0);
  const paused = pausedLeft != null;
  const remaining = paused ? pausedLeft : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [paused]);

  // Escape leaves focus mode.
  React.useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reaching zero is a real event: say it once.
  React.useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      haptic(30);
      toast('Tiempo cumplido. Toca ✓ para completar', { tone: 'success', icon: 'check' });
    }
  }, [remaining]);

  const togglePause = () => {
    if (paused) { setEndsAt(Date.now() + pausedLeft * 1000); setPausedLeft(null); }
    else setPausedLeft(remaining);
  };
  const finish = () => { if (onComplete) onComplete(); else onClose(); };
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const pct = totalSec > 0 ? 1 - remaining / totalSec : 1;

  return (
    <div data-screen-label="Focus Mode" className="lo-fade" style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: `radial-gradient(circle at 50% 0%, ${c.from}55 0%, ${c.to}22 35%, transparent 75%), ${theme.bg}`,
      display: 'flex', flexDirection: 'column',
      color: theme.text,
    }}>
      {/* Top bar — close + task chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0', height: 56 }}>
        <button onClick={onClose} aria-label="Salir del modo enfoque" className="lo-press" style={{
          width: 36, height: 36, borderRadius: 18,
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <UIIcon name="chevronD" size={18} color={theme.text}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999,
          background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.08)' }}>
          <TaskGlyph icon={task.icon} color={task.color} size={20} shape="rounded"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{task.title}</span>
        </div>
        <div style={{ width: 36 }}/>
      </div>

      {/* Hero — breathing circle with countdown */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: c.to }}>
          Modo enfoque
        </div>

        {/* Ring with breathing icon center */}
        <div style={{ position: 'relative', width: 260, height: 260 }}>
          {/* glow */}
          <div style={{ position: 'absolute', inset: -20, borderRadius: '50%',
            background: `radial-gradient(circle, ${c.to}22 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}/>
          {/* ring */}
          <svg width="260" height="260" viewBox="0 0 260 260" style={{ position: 'relative' }}>
            <defs>
              <linearGradient id="focusgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={c.from}/>
                <stop offset="100%" stopColor={c.to}/>
              </linearGradient>
            </defs>
            <circle cx="130" cy="130" r="120" stroke={theme.rail} strokeWidth="3" fill="none"/>
            <circle cx="130" cy="130" r="120" stroke="url(#focusgrad)" strokeWidth="6" fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - pct)}
              strokeLinecap="round"
              transform="rotate(-90 130 130)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}/>
          </svg>
          {/* center */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div className="lo-breath" style={{ filter: `drop-shadow(0 12px 32px ${c.to}66)` }}>
              <TaskGlyph icon={task.icon} color={task.color} size={72} shape="squircle"/>
            </div>
            <div className="lo-display" style={{ fontSize: 56, fontWeight: 600, color: theme.text, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {String(mm).padStart(2,'0')}<span style={{ opacity: 0.5 }}>:</span>{String(ss).padStart(2,'0')}
            </div>
            <div style={{ fontSize: 12, color: theme.text3, fontWeight: 500 }}>
              {paused ? 'en pausa' : remaining > 0 ? 'restante' : '¡Listo!'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14, color: theme.text2, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
          Una sola cosa a la vez. El tiempo sigue corriendo aunque cambies de pestaña.
        </div>
      </div>

      {/* Controls — pause/resume + complete (✓ completes the task, B4) */}
      <div style={{ padding: '24px 24px 40px', display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={togglePause} aria-label={paused ? 'Reanudar' : 'Pausar'} className="lo-press" style={{
          ...focusBtn(theme),
          width: 72, height: 72,
          background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
          border: 'none',
          boxShadow: `0 12px 32px ${c.to}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}>
          {paused
            ? <UIIcon name="play" size={28} color="#fff"/>
            : <UIIcon name="pause" size={28} color="#fff" strokeWidth={2.4}/>}
        </button>
        <button onClick={finish} aria-label="Completar la tarea" className="lo-press" style={{
          ...focusBtn(theme),
          width: 72, height: 72,
          background: remaining === 0 ? `linear-gradient(135deg, ${LIFE_PALETTE.mint.from}, ${LIFE_PALETTE.mint.to})` : 'rgba(255,255,255,0.08)',
          border: remaining === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: remaining === 0 ? `0 12px 32px ${LIFE_PALETTE.mint.to}66` : 'none',
        }}>
          <UIIcon name="check" size={26} color="#fff" strokeWidth={2.6}/>
        </button>
      </div>
    </div>
  );
}
function focusBtn(theme) {
  return {
    width: 56, height: 56, borderRadius: 28,
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#fff',
  };
}

// ──────────────────────────────────────────────────────────────
// QUICK ADD MENU — what the + button offers
// ──────────────────────────────────────────────────────────────
function QuickAddMenu({ theme, onClose, onSelect }) {
  const items = [
    { id: 'task',    label: 'Nueva tarea',     hint: 'Con día y hora',            icon: 'plus',    color: 'coral'    },
    { id: 'habit',   label: 'Nuevo hábito',    hint: 'Algo que quieres sostener', icon: 'flame',   color: 'amber'    },
    { id: 'routine', label: 'Nueva rutina',    hint: 'Varias tareas de una vez',  icon: 'repeat',  color: 'lavender' },
    { id: 'inbox',   label: 'Inbox rápido',    hint: 'Anotar ahora, agendar después', icon: 'inbox', color: 'mint'   },
    { id: 'voice',   label: 'Escribir una frase', hint: '"gym mañana 7am 1h"',    icon: 'sparkle', color: 'sky'      },
  ];
  return (
    <Sheet theme={theme} onClose={onClose} label="Añadir" width={380} plain>
      <div data-screen-label="Quick Add" className="lo-stagger" style={{ padding: '14px 8px calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        {items.map((it, i) => (
          <button key={it.id} onClick={() => onSelect(it.id)} aria-label={it.label} className="lo-press lo-row-btn" style={{
            '--i': i,
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '11px 12px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: theme.text, fontFamily: 'inherit', textAlign: 'left',
            borderRadius: 14,
          }}>
            <SettingsIconBadge name={it.icon} color={it.color} size={38}/>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, letterSpacing: -0.1 }}>{it.label}</span>
              <span style={{ display: 'block', fontSize: 12, color: theme.text3, marginTop: 1 }}>{it.hint}</span>
            </span>
            <UIIcon name="chevronR" size={14} color={theme.text3}/>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────
// ROUTINES SCREEN — reusable task packs
// ──────────────────────────────────────────────────────────────
const ROUTINES = [
  {
    id: 'morning',
    name: 'Mañana ideal',
    sub: '5 tareas · 2h 30m',
    color: 'amber',
    icon: '☀️',
    tasks: [
      { icon: '☀️', color: 'amber', label: 'Despertar suave', dur: 15 },
      { icon: '🧘', color: 'lavender', label: 'Meditar 20m', dur: 20 },
      { icon: '🚿', color: 'sky', label: 'Ducha fría', dur: 15 },
      { icon: '☕', color: 'ember', label: 'Café + lectura', dur: 30 },
      { icon: '💼', color: 'slate', label: 'Deep work', dur: 90 },
    ],
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro · 4 ciclos',
    sub: '8 bloques · 2h',
    color: 'coral',
    icon: '⏰',
    tasks: [
      { icon: '📚', color: 'plum', label: 'Estudio · ciclo 1', dur: 25 },
      { icon: '☕', color: 'ember', label: 'Pausa corta', dur: 5 },
      { icon: '📚', color: 'plum', label: 'Estudio · ciclo 2', dur: 25 },
      { icon: '☕', color: 'ember', label: 'Pausa corta', dur: 5 },
      { icon: '📚', color: 'plum', label: 'Estudio · ciclo 3', dur: 25 },
      { icon: '☕', color: 'ember', label: 'Pausa corta', dur: 5 },
      { icon: '📚', color: 'plum', label: 'Estudio · ciclo 4', dur: 25 },
      { icon: '🏃', color: 'lime', label: 'Pausa larga', dur: 15 },
    ],
  },
  {
    id: 'classday',
    name: 'Día de clases',
    sub: '6 tareas · 8h',
    color: 'sky',
    icon: '📚',
    tasks: [
      { icon: '☕', color: 'ember', label: 'Desayuno + ducha', dur: 45 },
      { icon: '🚴', color: 'mint', label: 'Camino a la U', dur: 30 },
      { icon: '📊', color: 'sky', label: 'Clase de la mañana', dur: 180 },
      { icon: '🍽️', color: 'sun', label: 'Almuerzo en casino', dur: 45 },
      { icon: '📚', color: 'plum', label: 'Estudio en biblioteca', dur: 120 },
      { icon: '🏃', color: 'lime', label: 'Regreso + descanso', dur: 60 },
    ],
  },
  {
    id: 'workout',
    name: 'Workout completo',
    sub: '4 tareas · 1h 15m',
    color: 'coral',
    icon: '💪',
    tasks: [
      { icon: '💪', color: 'coral', label: 'Calentamiento', dur: 10 },
      { icon: '🏃', color: 'lime', label: 'Cardio', dur: 25 },
      { icon: '💪', color: 'coral', label: 'Fuerza', dur: 30 },
      { icon: '🧘', color: 'lavender', label: 'Stretching', dur: 10 },
    ],
  },
  {
    id: 'datenight',
    name: 'Date night',
    sub: '4 tareas · 3h',
    color: 'rose',
    icon: '🍽️',
    tasks: [
      { icon: '🚿', color: 'sky', label: 'Arreglarse', dur: 45 },
      { icon: '🏃', color: 'lime', label: 'Caminar al lugar', dur: 20 },
      { icon: '🍽️', color: 'rose', label: 'Cena especial', dur: 90 },
      { icon: '😴', color: 'lavender', label: 'Caminata nocturna', dur: 30 },
    ],
  },
  {
    id: 'evening',
    name: 'Cerrar el día',
    sub: '4 tareas · 2h',
    color: 'lavender',
    icon: '😴',
    tasks: [
      { icon: '🍽️', color: 'sun', label: 'Cocinar cena', dur: 60 },
      { icon: '✏️', color: 'rose', label: 'Journal', dur: 20 },
      { icon: '📚', color: 'plum', label: 'Leer', dur: 30 },
      { icon: '😴', color: 'lavender', label: 'Bajar revoluciones', dur: 10 },
    ],
  },
  {
    id: 'deep',
    name: 'Sesión deep work',
    sub: '3 tareas · 3h',
    color: 'slate',
    icon: '💼',
    tasks: [
      { icon: '💼', color: 'slate', label: 'Foco profundo', dur: 90 },
      { icon: '🏃', color: 'lime', label: 'Caminata break', dur: 15 },
      { icon: '💼', color: 'slate', label: 'Foco profundo', dur: 75 },
    ],
  },
];

// Human "N tareas · 2h 30m" summary computed from a routine's steps.
function routineSub(tasks) {
  const total = (tasks || []).reduce((s, t) => s + (Number(t.dur) || 0), 0);
  const h = Math.floor(total / 60), m = total % 60;
  const dur = h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
  return `${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'} · ${dur}`;
}

const STEP_ICONS = ['✨', '☕', '📚', '💼', '🧘', '🍽️', '🏃', '🚿', '🧠', '😴', '✏️', '🎵', '💪', '❤️', '💊', '⏰'];

function RoutinesScreen({ theme, onBack, onApply, date }) {
  const [picked, setPicked] = React.useState(null);
  const [editing, setEditing] = React.useState(null); // routine object | 'new' | null
  useStoreVersion();

  // Custom routines persist in the store; defaults are read-only.
  const custom = LOStore.customRoutines().map(r => ({ ...r, custom: true, sub: routineSub(r.tasks) }));
  const all = [...custom, ...ROUTINES];
  const r = picked && all.find(x => x.id === picked);

  if (editing) return (
    <RoutineEditor theme={theme}
      initial={editing === 'new' ? null : editing}
      onCancel={() => setEditing(null)}
      onSaved={() => setEditing(null)}
      onDeleted={() => { setEditing(null); setPicked(null); }}/>
  );
  if (r) return <RoutineDetail theme={theme} routine={r} onBack={() => setPicked(null)} date={date}
    onApply={onApply} onEdit={r.custom ? () => setEditing(r) : null}/>;

  return (
    <div data-screen-label="Routines" className="lo-fade">
      <ScreenTopBar theme={theme} title="Rutinas" onBack={onBack}/>
      <div style={{ padding: '0 16px 24px' }}>
        <div className="lo-fade" style={{ padding: '0 4px 14px' }}>
          <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500 }}>Bloques reutilizables</div>
          <h2 style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: -0.6 }}>
            Tus <span style={{ color: theme.accent }}>rutinas</span>
          </h2>
          <p style={{ fontSize: 12.5, color: theme.text2, lineHeight: 1.4, marginTop: 6, marginBottom: 0 }}>
            Guarda secuencias de tareas y agéndalas en un toque.
          </p>
        </div>

        {/* Create custom routine */}
        <button onClick={() => setEditing('new')} className="lo-press lo-lift" style={{
          width: '100%', marginBottom: 12, padding: '13px 16px', borderRadius: 16,
          background: `linear-gradient(135deg, ${theme.accent}1f, ${theme.surface} 80%)`,
          border: `1px dashed ${theme.accent}66`, cursor: 'pointer', color: theme.text,
          display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UIIcon name="plus" size={20} color="#fff" strokeWidth={2.4}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>Crear rutina</div>
            <div style={{ fontSize: 12, color: theme.text2, marginTop: 1 }}>Arma tu propio pack de tareas</div>
          </div>
        </button>

        {custom.length > 0 && <SectionLabel theme={theme}>Mis rutinas</SectionLabel>}
        <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {all.map((r, i) => {
            const c = pal(r.color);
            if (i === custom.length && custom.length > 0) {
              return <React.Fragment key="__sep"><SectionLabel theme={theme}>Plantillas</SectionLabel>{routineCard(r, i, c)}</React.Fragment>;
            }
            return routineCard(r, i, c);
          })}
        </div>
      </div>
    </div>
  );

  function routineCard(r, i, c) {
    return (
      <button key={r.id} onClick={() => setPicked(r.id)} className="lo-press lo-lift" style={{
        '--i': i,
        background: `linear-gradient(135deg, ${c.from}22 0%, ${theme.surface} 70%)`,
        border: `0.5px solid ${c.to}33`,
        borderRadius: 20, padding: 14,
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', color: theme.text, textAlign: 'left',
        fontFamily: 'inherit',
      }}>
        <TaskGlyph icon={r.icon} color={r.color} size={50} shape="squircle"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2, display: 'flex', alignItems: 'center', gap: 7 }}>
            {r.name}
            {r.custom && <span style={{ fontSize: 9.5, fontWeight: 700, color: theme.accent, background: `${theme.accent}22`, padding: '2px 6px', borderRadius: 6, letterSpacing: 0.3 }}>MÍA</span>}
          </div>
          <div style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>{r.sub}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {r.tasks.slice(0, 5).map((t, k) => (
              <TaskGlyph key={k} icon={t.icon} color={t.color || r.color} size={22} shape="rounded"/>
            ))}
          </div>
        </div>
        <UIIcon name="chevronR" size={14} color={theme.text3}/>
      </button>
    );
  }
}

// Create / edit a custom routine: name, look, and an ordered list of steps.
function RoutineEditor({ theme, initial, onCancel, onSaved, onDeleted }) {
  const editing = !!(initial && initial.id);
  const [name, setName] = React.useState(initial?.name || '');
  const [icon, setIcon] = React.useState(initial?.icon || '✨');
  const [color, setColor] = React.useState(initial?.color || 'coral');
  const [tasks, setTasks] = React.useState(() =>
    (initial?.tasks?.length ? initial.tasks.map(t => ({ ...t })) : [{ icon: '✨', color: initial?.color || 'coral', label: '', dur: 30 }]));
  const setStep = (i, patch) => setTasks(ts => ts.map((t, k) => k === i ? { ...t, ...patch } : t));
  const cycleStepIcon = (i) => setStep(i, { icon: STEP_ICONS[(STEP_ICONS.indexOf(tasks[i].icon) + 1 + STEP_ICONS.length) % STEP_ICONS.length] });
  const addStep = () => setTasks(ts => [...ts, { icon: '✨', color, label: '', dur: 30 }]);
  const removeStep = (i) => setTasks(ts => ts.length > 1 ? ts.filter((_, k) => k !== i) : ts);

  const valid = name.trim() && tasks.some(t => t.label.trim());
  const save = () => {
    if (!valid) return;
    const clean = tasks.map(t => ({ ...t, color: t.color || color, label: t.label.trim() })).filter(t => t.label);
    const payload = { name: name.trim(), icon, color, tasks: clean };
    if (editing) LOStore.updateRoutine(initial.id, payload); else LOStore.addRoutine(payload);
    onSaved();
  };
  const del = async () => {
    if (!await confirmAsk('¿Borrar esta rutina?', { body: 'Las tareas que ya agendaste con ella no se tocan.', confirm: 'Borrar rutina', danger: true })) return;
    LOStore.removeRoutine(initial.id); onDeleted();
  };

  const fieldLabel = { fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '18px 0 9px' };

  return (
    <div data-screen-label="Routine Editor" className="lo-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 6px', height: 44 }}>
        <button onClick={onCancel} className="lo-press" style={{ background: 'transparent', border: 'none', color: theme.text2, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{editing ? 'Editar rutina' : 'Nueva rutina'}</span>
        <button onClick={save} disabled={!valid} className="lo-press" style={{ background: 'transparent', border: 'none', color: valid ? theme.accent : theme.text3, fontSize: 15, fontWeight: 700, cursor: valid ? 'pointer' : 'default', fontFamily: 'inherit' }}>Guardar</button>
      </div>

      <div style={{ padding: '0 16px 28px' }}>
        {/* Name */}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la rutina" autoFocus style={{
          width: '100%', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14,
          padding: '14px 16px', fontSize: 17, fontWeight: 600, color: theme.text, fontFamily: 'inherit', outline: 'none', marginTop: 6,
        }}/>

        {/* Icon picker */}
        <div style={fieldLabel}>Ícono</div>
        <EmojiPicker theme={theme} value={icon} onChange={setIcon} color={color}/>

        {/* Color picker */}
        <div style={fieldLabel}>Color</div>
        <ColorSwatches theme={theme} value={color} onChange={setColor} size={32}/>

        {/* Steps */}
        <div style={fieldLabel}>Pasos · {routineSub(tasks)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: '8px 10px' }}>
              <button onClick={() => cycleStepIcon(i)} className="lo-press" title="Cambiar ícono" aria-label={`Cambiar ícono del paso ${i + 1}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <TaskGlyph icon={t.icon} color={color} size={36} shape="rounded"/>
              </button>
              <input value={t.label} onChange={e => setStep(i, { label: e.target.value })} placeholder={`Paso ${i + 1}`} style={{
                flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14.5, color: theme.text, fontFamily: 'inherit',
              }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button onClick={() => setStep(i, { dur: Math.max(5, (t.dur || 30) - 5) })} aria-label="Cinco minutos menos" className="lo-press" style={stepBtn(theme)}>−</button>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.text2, minWidth: 34, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{t.dur}m</span>
                <button onClick={() => setStep(i, { dur: Math.min(240, (t.dur || 30) + 5) })} aria-label="Cinco minutos más" className="lo-press" style={stepBtn(theme)}>+</button>
              </div>
              <button onClick={() => removeStep(i)} aria-label={`Quitar el paso ${i + 1}`} className="lo-press" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.text3, flexShrink: 0, padding: '4px 2px' }}>
                <UIIcon name="x" size={15} color={theme.text3}/>
              </button>
            </div>
          ))}
        </div>
        <button onClick={addStep} className="lo-press" style={{
          width: '100%', marginTop: 10, padding: '11px', borderRadius: 13, cursor: 'pointer',
          background: 'transparent', border: `1px dashed ${theme.border}`, color: theme.accent,
          fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
        }}>+ Añadir paso</button>

        {editing && (
          <button onClick={del} className="lo-press" style={{
            width: '100%', marginTop: 22, padding: '13px', borderRadius: 13, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${LIFE_PALETTE.coral.to}55`, color: LIFE_PALETTE.coral.to,
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
          }}>Borrar rutina</button>
        )}
      </div>
    </div>
  );
}

function stepBtn(theme) {
  return { width: 26, height: 26, borderRadius: 8, background: theme.surfaceHi || theme.bg2 || theme.border, border: `1px solid ${theme.border}`, color: theme.text2, fontSize: 16, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' };
}

function RoutineDetail({ theme, routine, onBack, onApply, onEdit, date }) {
  const c = pal(routine.color);
  const today = loDateStr();
  const when = !date || date <= today ? 'hoy' : loDayLabel(date);
  return (
    <div data-screen-label="Routine Detail" className="lo-fade">
      <div style={{
        background: `linear-gradient(165deg, ${c.from} 0%, ${c.to} 55%, ${theme.bg} 100%)`,
        padding: '0 16px 22px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.from}55 0%, transparent 70%)` }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 44, position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} aria-label="Volver" className="lo-press" style={glassBtn}>
            <UIIcon name="chevronL" size={18} color="#fff" strokeWidth={2.2}/>
          </button>
          {onEdit ? (
            <button onClick={onEdit} aria-label="Editar rutina" className="lo-press" style={glassBtn}>
              <UIIcon name="pencil" size={17} color="#fff" strokeWidth={2.2}/>
            </button>
          ) : <div style={{ width: 36 }}/>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 24px ${c.to}77)` }}>
            <TaskGlyph icon={routine.icon} color={routine.color} size={84} shape="squircle"/>
          </div>
          <div style={{ marginTop: 16, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>{routine.name}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{routine.sub}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <SectionLabel theme={theme}>Tareas en la secuencia</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {routine.tasks.map((t, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 11.5, color: theme.text3, fontWeight: 600, width: 18, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                <TaskGlyph icon={t.icon} color={t.color} size={36} shape="rounded"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: theme.text2, marginTop: 1 }}>{t.dur} min</div>
                </div>
              </div>
              {i < routine.tasks.length - 1 && <Divider theme={theme}/>}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* CTA */}
      <div style={{ position: 'sticky', left: 0, right: 0, bottom: 0,
        padding: '12px 16px 24px',
        background: `linear-gradient(180deg, transparent 0%, ${theme.bg} 40%)` }}>
        <button onClick={() => { onApply && onApply(routine); }} className="lo-press" style={{
          width: '100%', height: 54,
          background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
          color: '#fff', border: 'none', borderRadius: 18,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          letterSpacing: -0.2, fontFamily: 'inherit',
          boxShadow: `0 8px 28px ${c.to}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <UIIcon name="check" size={18} color="#fff" strokeWidth={2.6}/> Agendar rutina {when}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SEARCH OVERLAY — global search across all tasks
// ──────────────────────────────────────────────────────────────
function SearchOverlay({ theme, onClose, onPickTask }) {
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);
  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  React.useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // One entry per task: a series appears once, not once per day already lived.
  const all = LOStore.allTasks().filter(t => !t._deleted && !t._from && t.kind !== 'break');
  const needle = loStrip(q.trim());
  const matches = needle
    ? all.filter(t => loStrip(`${t.title} ${t.note || ''}`).includes(needle)).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40)
    : all.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);

  return (
    <div className="lo-fade" role="dialog" aria-modal="true" aria-label="Buscar" style={{
      position: 'absolute', inset: 0, zIndex: 45,
      background: theme.bg,
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', height: '100%' }}>
      {/* Search bar */}
      <div style={{ padding: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 4px) 16px 12px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: `0.5px solid ${theme.border}` }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: theme.surface, border: `0.5px solid ${theme.border}`,
          borderRadius: 12, padding: '8px 12px' }}>
          <UIIcon name="search" size={16} color={theme.text2}/>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en tus tareas y notas…" aria-label="Buscar"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: theme.text, fontSize: 14.5, fontFamily: 'inherit' }}/>
          {q && (
            <button onClick={() => setQ('')} aria-label="Borrar búsqueda" style={{ background: 'transparent', border: 'none', color: theme.text3, cursor: 'pointer', padding: 0, display: 'flex' }}>
              <UIIcon name="x" size={14} color={theme.text3}/>
            </button>
          )}
        </div>
        <button onClick={onClose} className="lo-press" style={{
          background: 'transparent', border: 'none', color: theme.accent, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', padding: '0 4px',
        }}>Cancelar</button>
      </div>

      {/* Results */}
      <div style={{ padding: '8px 16px 16px', overflowY: 'auto', height: 'calc(100% - 64px)' }}>
        {!q && (
          <SectionLabel theme={theme}>Recientes</SectionLabel>
        )}
        {q && matches.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: theme.text3 }}>
            <LifeIcon name="sparkle" color="lavender" size={48} shape="rounded"/>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginTop: 16 }}>Nada encontrado</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Intenta con otra palabra</div>
          </div>
        )}
        {matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: q ? 0 : 6 }}>
            {matches.map(t => (
              <button key={t.id} onClick={() => onPickTask(t)} className="lo-press lo-card" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                background: theme.surface, border: `0.5px solid ${theme.border}`,
                borderRadius: 14, cursor: 'pointer', textAlign: 'left', color: theme.text,
                fontFamily: 'inherit',
              }}>
                <TaskGlyph icon={t.icon} color={t.color} size={36} shape="rounded"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {t.recur ? 'Se repite' : loDayLabel(t.date)} · {t.allDay ? 'todo el día' : fmt12(t.start)}
                  </div>
                </div>
                {t.status === 'done' && <UIIcon name="check" size={15} color={theme.text3} strokeWidth={2.4}/>}
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// EMPTY STATE — illustrated, for first-time users
// ──────────────────────────────────────────────────────────────
function EmptyState({ theme, icon = 'sparkle', title, body, ctaLabel, onCta }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div className="lo-breath" aria-hidden="true" style={{ filter: `drop-shadow(0 10px 26px ${LIFE_PALETTE.plum.to}38)` }}>
        <LifeIcon name={icon} color="lavender" size={72} shape="squircle"/>
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>{title}</h3>
        <p style={{ margin: '6px auto 0', maxWidth: 260, fontSize: 13, color: theme.text2, lineHeight: 1.5 }}>{body}</p>
      </div>
      {ctaLabel && (
        <button onClick={onCta} className="lo-press" style={{
          marginTop: 4,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)`,
          color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 14,
          fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: `0 6px 18px ${theme.accent}55`,
        }}>{ctaLabel}</button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// HABITS — daily streak tracker, surfaced on the Today screen.
// This is the soul of the app: build habits, keep the streak alive.
// ──────────────────────────────────────────────────────────────
function HabitsStrip({ theme, onAdd, onEdit, date, today = loDateStr(), wrap = false }) {
  const habits = useHabits();
  const day = date || today;
  const list = habits.all;
  // Long-press (or right-click) a habit → edit; a normal tap marks the day shown.
  const timerRef = React.useRef(null);
  const longRef = React.useRef(false);
  const startPress = (h) => { longRef.current = false; timerRef.current = setTimeout(() => { longRef.current = true; haptic(15); if (onEdit) onEdit(h); }, 480); };
  const endPress = () => clearTimeout(timerRef.current);
  const onTapHabit = (h) => { if (longRef.current) { longRef.current = false; return; } haptic(); habits.toggleToday(h.id, day); };

  if (day > today) return null; // a habit cannot be done ahead of time

  if (list.length === 0) {
    return (
      <div style={{ padding: '4px 16px 8px' }}>
        <button onClick={onAdd} className="lo-press" style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
          background: `linear-gradient(135deg, ${LIFE_PALETTE.coral.from}1A, ${theme.surface} 70%)`,
          border: `1px dashed ${theme.accent}66`, borderRadius: 18, cursor: 'pointer',
          color: theme.text, fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: theme.accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UIIcon name="flame" size={19} color={theme.accent} strokeWidth={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1 }}>Crea tu primer hábito</div>
            <div style={{ fontSize: 12, color: theme.text2, marginTop: 1 }}>Algo pequeño que quieras sostener</div>
          </div>
          <UIIcon name="plus" size={18} color={theme.accent} strokeWidth={2.4}/>
        </button>
      </div>
    );
  }

  const due = list.filter((h) => loHabitScheduledOn(h, day));
  const doneCount = due.filter((h) => (h.log || {})[day]).length;
  return (
    <div style={{ padding: '2px 0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 24px 8px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 1.4, textTransform: 'uppercase' }}>Hábitos</span>
        {due.length > 0 && <span style={{ fontSize: 10.5, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>{doneCount}/{due.length}{day !== today ? ` · ${loDayLabel(day).replace(/^el /, '').replace(/ de \w+$/, '')}` : ''}</span>}
        <div style={{ flex: 1, height: 0.5, background: theme.border }}/>
        <button onClick={onAdd} aria-label="Nuevo hábito" title="Nuevo hábito" className="lo-press lo-icon-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.accent, display: 'flex', padding: 6, margin: -6, borderRadius: 10 }}>
          <UIIcon name="plus" size={16} color={theme.accent} strokeWidth={2.4}/>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 4, overflowX: wrap ? 'visible' : 'auto', flexWrap: wrap ? 'wrap' : 'nowrap', padding: '2px 14px 4px', scrollbarWidth: 'none' }}>
        {list.map(h => {
          const c = pal(h.color);
          const done = !!(h.log || {})[day];
          const scheduled = loHabitScheduledOn(h, day);
          // Ring: constancy of the last 30 days, since the habit started.
          const rate = Math.max(0, Math.min(1, loHabitRate(h, 30) / 100));
          const R = 25, CIRC = 2 * Math.PI * R;
          return (
            <button key={h.id} onClick={() => onTapHabit(h)}
              onPointerDown={() => startPress(h)} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
              onContextMenu={(e) => { e.preventDefault(); endPress(); if (onEdit) onEdit(h); }}
              aria-pressed={done} aria-label={`${h.title}${done ? ', hecho' : ''}`} title="Toca para marcar · mantén para editar"
              className="lo-press" style={{
                flexShrink: 0, width: 72, padding: '4px 2px 6px', borderRadius: 16, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'center', background: 'transparent', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: scheduled || done ? 1 : 0.5,
              }}>
              <div style={{ position: 'relative', width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx="29" cy="29" r={R} fill="none" stroke={theme.rail} strokeWidth="3.5"/>
                  <circle cx="29" cy="29" r={R} fill="none" stroke={c.to} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - (done ? Math.max(rate, 0.04) : rate))}
                    style={{ transition: 'stroke-dashoffset .7s var(--ease-out-quart)' }}/>
                </svg>
                <div style={{ filter: done ? 'none' : 'saturate(0.7)', opacity: done ? 1 : 0.86, transition: 'filter .25s, opacity .25s' }}>
                  <TaskGlyph icon={h.icon} color={h.color} size={40} shape="pill"/>
                </div>
                {done && (
                  <span key="ok" className="lo-check-in" style={{
                    position: 'absolute', right: -1, bottom: -1, width: 20, height: 20, borderRadius: 10,
                    background: c.to, border: `2px solid ${theme.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><UIIcon name="check" size={11} color="#fff" strokeWidth={3}/></span>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: done ? theme.text : theme.text2, letterSpacing: -0.1,
                lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', maxWidth: '100%' }}>{h.title}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Month calendar of a single habit — done days marked as filled squares,
// with month navigation. The "por mes" view Tomas asked for.
function HabitMonthGrid({ theme, habit, onToggle }) {
  const c = pal(habit.color);
  const [cursor, setCursor] = React.useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const log = habit.log || {};
  const MON = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const first = new Date(cursor.y, cursor.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysIn = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const todayStr = loDateStr();
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) {
    const ds = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, ds, done: !!log[ds], today: ds === todayStr, future: new Date(cursor.y, cursor.m, d) > endToday });
  }
  const monthDone = cells.filter(x => x && x.done).length;
  const shift = (delta) => setCursor(cur => { const m = cur.m + delta; return { y: cur.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }; });
  const DOW = ['L','M','X','J','V','S','D'];
  const nav = { width: 30, height: 30, borderRadius: 10, background: theme.surfaceHi, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => shift(-1)} aria-label="Mes anterior" className="lo-press" style={nav}><UIIcon name="chevronL" size={15} color={theme.text2}/></button>
        <span style={{ fontSize: 14, fontWeight: 700, color: theme.text, letterSpacing: -0.2 }}>{MON[cursor.m]} {cursor.y}</span>
        <button onClick={() => shift(1)} aria-label="Mes siguiente" className="lo-press" style={nav}><UIIcon name="chevronR" size={15} color={theme.text2}/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
        {DOW.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 0.3 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {cells.map((cell, i) => cell ? (
          <button key={i} disabled={cell.future || !onToggle} onClick={() => onToggle(cell.ds)}
            aria-pressed={cell.done} aria-label={`${cell.d} de ${MON[cursor.m]}${cell.done ? ', hecho' : ''}`} className={cell.future ? '' : 'lo-press'}
            style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            fontFamily: 'inherit', cursor: cell.future || !onToggle ? 'default' : 'pointer',
            fontSize: 11.5, fontWeight: cell.done ? 700 : 500,
            color: cell.done ? '#fff' : (cell.future ? theme.text3 : theme.text2),
            background: cell.done ? `linear-gradient(145deg, ${c.from}, ${c.to})` : (cell.future ? 'transparent' : theme.surfaceHi),
            border: cell.today && !cell.done ? `1.5px solid ${c.to}` : `1px solid ${cell.done ? 'transparent' : theme.border}`,
            boxShadow: cell.done ? `0 2px 8px ${c.to}55` : 'none', fontVariantNumeric: 'tabular-nums',
          }}>{cell.d}</button>
        ) : <div key={i}/>)}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: theme.text2, textAlign: 'center' }}>
        <span className="lo-display" style={{ color: c.to, fontWeight: 700, fontSize: 16 }}>{monthDone}</span> {monthDone === 1 ? 'vez' : 'veces'} en {MON[cursor.m].toLowerCase()}
        {onToggle && <span style={{ display: 'block', marginTop: 4, fontSize: 11.5, color: theme.text3 }}>Toca un día pasado para marcarlo o desmarcarlo.</span>}
      </div>
    </div>
  );
}

// HABITS SCREEN — dedicated tab (replaces Stats). Clean list; tap a habit to
// see its month-by-month activity. No streaks — just honest tracking.
function HabitsScreen({ theme, onAddHabit, onEditHabit }) {
  const habits = useHabits();
  const list = habits.all;
  const [selId, setSelId] = React.useState(null);
  const sel = list.find(h => h.id === selId);
  const today = loDateStr();
  const ib = { width: 34, height: 34, borderRadius: 11, background: theme.surfaceHi, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };

  if (sel) {
    const c = pal(sel.color);
    const counts = loHabitStats(sel);
    const doneToday = counts.doneToday;
    const rate = loHabitRate(sel, 30);
    return (
      <div data-screen-label="Habit detail" className="lo-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 12px' }}>
          <button onClick={() => setSelId(null)} aria-label="Volver a hábitos" className="lo-press" style={ib}><UIIcon name="chevronL" size={18} color={theme.text}/></button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: theme.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.title}</span>
          <button onClick={() => onEditHabit && onEditHabit(sel)} aria-label="Editar hábito" className="lo-press" style={ib}><UIIcon name="pencil" size={16} color={theme.text2}/></button>
        </div>
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '6px 0 20px' }}>
            <div style={{ filter: `drop-shadow(0 12px 28px ${c.to}66)` }}><TaskGlyph icon={sel.icon} color={sel.color} size={76} shape="squircle"/></div>
            <button onClick={() => { haptic(); habits.toggleToday(sel.id); }} aria-pressed={doneToday} className="lo-press" style={{
              padding: '10px 20px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
              border: doneToday ? 'none' : `1px solid ${theme.border}`, display: 'inline-flex', alignItems: 'center', gap: 7,
              background: doneToday ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
              color: doneToday ? '#fff' : theme.text, boxShadow: doneToday ? `0 6px 18px ${c.to}55` : 'none',
            }}>
              <UIIcon name="check" size={15} color={doneToday ? '#fff' : theme.text3} strokeWidth={2.6}/>
              {doneToday ? 'Hecho hoy' : 'Marcar hoy'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[['Este mes', counts.month], ['Constancia', `${rate}%`], ['Total', counts.total]].map(([label, val]) => (
              <div key={label} style={{ flex: 1, background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
                <div className="lo-display" style={{ fontSize: 22, fontWeight: 600, color: theme.text, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
          <SectionLabel theme={theme}>Actividad por mes</SectionLabel>
          <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 18, padding: 16, marginBottom: 18 }}>
            <HabitMonthGrid theme={theme} habit={sel} onToggle={(ds) => habits.toggleToday(sel.id, ds)}/>
          </div>
          <SectionLabel theme={theme}>Últimas 18 semanas</SectionLabel>
          <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 18, padding: 16 }}>
            <HabitHeatmap theme={theme} habit={sel}/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-screen-label="Habits" className="lo-fade">
      <div style={{ padding: '4px 16px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 className="lo-display" style={{ margin: 0, fontSize: 30, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>Hábitos</h1>
        <span style={{ fontSize: 12.5, color: theme.text3 }}>{list.length} {list.length === 1 ? 'hábito' : 'hábitos'}</span>
      </div>
      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 && (
          <EmptyState theme={theme} icon="sparkle" title="Sin hábitos aún" body="Crea tu primer hábito y ve, día a día, cuánto lo sostienes." ctaLabel="Crear hábito" onCta={onAddHabit}/>
        )}
        {list.map(h => {
          const c = pal(h.color);
          const counts = loHabitStats(h);
          const doneToday = counts.doneToday;
          const dots = Array.from({ length: 7 }, (_, i) => !!(h.log || {})[loAddDays(today, i - 6)]);
          return (
            <button key={h.id} onClick={() => setSelId(h.id)} className="lo-press" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 18, cursor: 'pointer',
              background: theme.surface, border: `0.5px solid ${theme.border}`, fontFamily: 'inherit', textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <TaskGlyph icon={h.icon} color={h.color} size={46} shape="squircle"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {dots.map((on, i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: 2.5, background: on ? c.to : theme.rail }}/>))}
                  <span style={{ fontSize: 11.5, color: theme.text3, marginLeft: 6 }}>{counts.month} este mes · {loHabitRate(h, 30)}%</span>
                </div>
              </div>
              {doneToday
                ? <div style={{ width: 26, height: 26, borderRadius: 13, background: c.to, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UIIcon name="check" size={15} color="#fff" strokeWidth={2.6}/></div>
                : <UIIcon name="chevronR" size={16} color={theme.text3}/>}
            </button>
          );
        })}
        {list.length > 0 && (
          <button onClick={onAddHabit} className="lo-press" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 16, cursor: 'pointer',
            background: 'transparent', border: `1px dashed ${theme.accent}66`, color: theme.accent, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, marginTop: 2,
          }}><UIIcon name="plus" size={16} color={theme.accent} strokeWidth={2.4}/> Nuevo hábito</button>
        )}
      </div>
    </div>
  );
}

const HABIT_CADENCES = [
  { id: 'daily',    label: 'Diario' },
  { id: 'weekdays', label: 'Entre semana' },
  { id: 'custom',   label: 'Días específicos' },
];
const DOW_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // index 0=Sun

// Consistency grid (GitHub-style) for a single habit — the feature Structured
// doesn't have. 18 weeks back, one column per week, one cell per day.
function HabitHeatmap({ theme, habit }) {
  const WEEKS = 18;
  const c = pal(habit.color);
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7; // Mon=0
  const start = new Date(today);
  start.setDate(today.getDate() - todayDow - (WEEKS - 1) * 7);
  const log = habit.log || {};
  const cols = [];
  for (let w = 0; w < WEEKS; w++) {
    const col = [];
    for (let r = 0; r < 7; r++) {
      const d = new Date(start); d.setDate(start.getDate() + w * 7 + r);
      const ds = loDateStr(d);
      col.push({ ds, done: !!log[ds], future: d > today, scheduled: loHabitScheduledOn(habit, ds) });
    }
    cols.push(col);
  }
  return (
    <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
      {cols.map((col, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          {col.map((cell, ri) => (
            <div key={ri} title={cell.ds} style={{
              width: 12, height: 12, borderRadius: 3,
              background: cell.future ? 'transparent'
                : cell.done ? `linear-gradient(135deg, ${c.from}, ${c.to})`
                : cell.scheduled ? theme.rail : 'transparent',
              border: cell.future ? `1px dashed ${theme.border}` : (cell.scheduled || cell.done ? 'none' : `1px solid ${theme.rail}`),
              boxShadow: cell.done ? `0 1px 4px ${c.to}55` : 'none',
            }}/>
          ))}
        </div>
      ))}
    </div>
  );
}

function HabitStatPill({ theme, label, value, accent }) {
  return (
    <div style={{ flex: 1, background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 14, padding: '10px 8px', textAlign: 'center' }}>
      <div className="lo-display" style={{ fontSize: 20, fontWeight: 600, color: accent || theme.text, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function HabitCreateSheet({ theme, onClose, habit = null }) {
  const habits = useHabits();
  const editing = !!habit;
  const [name, setName] = React.useState(habit?.title || '');
  const [icon, setIcon] = React.useState(habit?.icon || '🔥');
  // New habits rotate through the 5 families so a fresh list isn't a wall of red.
  const [color, setColor] = React.useState(habit?.color || ['coral','sky','amber','mint','lavender'][habits.all.length % 5]);
  const [cadence, setCadence] = React.useState(habit?.cadence || 'daily');
  const [days, setDays] = React.useState(habit?.days || [1, 3, 5]);
  const c = pal(color);
  const stats = editing ? loHabitStats(habit) : null;

  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const save = () => {
    if (!name.trim()) return;
    const payload = { title: name.trim(), icon, color, cadence, days: cadence === 'custom' ? days : null };
    if (editing) {
      habits.update(habit.id, payload);
      toast('Hábito actualizado', { tone: 'success', icon: 'check' });
    } else {
      habits.add(payload);
      toast(`Hábito "${name.trim()}" creado`, { tone: 'success', icon: 'check' });
    }
    onClose();
  };

  const del = async () => {
    if (!await confirmAsk(`¿Borrar el hábito "${habit.title}"?`, { body: 'Se borra también su historial de días.', confirm: 'Borrar hábito', danger: true })) return;
    const snapshot = LOStore.snapshot();
    habits.remove(habit.id);
    toast('Hábito eliminado', { icon: 'trash', duration: 7000, action: { label: 'Deshacer', run: () => LOStore.restore(snapshot) } });
    onClose();
  };

  return (
    <div data-screen-label="New Habit">
      <div style={{
        background: `linear-gradient(165deg, ${c.from} 0%, ${c.to} 55%, ${theme.bg} 100%)`,
        padding: '0 16px 26px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -90, right: -50, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${c.from}55, transparent 70%)` }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 54, position: 'relative', zIndex: 2 }}>
          <button onClick={onClose} aria-label="Cerrar" className="lo-press" style={glassBtn}><UIIcon name="x" size={16} color="#fff" strokeWidth={2.5}/></button>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{editing ? 'Editar hábito' : 'Nuevo hábito'}</span>
          {editing
            ? <button onClick={del} aria-label="Borrar hábito" className="lo-press" style={glassBtn}><UIIcon name="trash" size={16} color="#fff" strokeWidth={2}/></button>
            : <div style={{ width: 36 }}/>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 26px ${c.to}AA)` }}>
            <TaskGlyph icon={icon} color={color} size={80} shape="squircle"/>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del hábito" aria-label="Nombre del hábito" autoFocus maxLength={60} className="lo-on-color"
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            style={{ marginTop: 16, width: '100%', background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: -0.5,
              fontFamily: 'inherit', caretColor: 'rgba(255,255,255,0.8)' }}/>
        </div>
      </div>

      <div style={{ padding: '16px 16px 28px' }}>
        {editing && (
          <div className="lo-fade" style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <HabitStatPill theme={theme} label="Este mes" value={stats.month} accent={c.to}/>
              <HabitStatPill theme={theme} label="Esta semana" value={stats.week}/>
              <HabitStatPill theme={theme} label="Total" value={stats.total}/>
            </div>
            <SectionLabel theme={theme}>Consistencia</SectionLabel>
            <div style={{ background: theme.surface, border: `0.5px solid ${theme.border}`, borderRadius: 16, padding: 14 }}>
              <HabitHeatmap theme={theme} habit={habit}/>
            </div>
          </div>
        )}
        <SectionLabel theme={theme}>Ícono</SectionLabel>
        <EmojiPicker theme={theme} value={icon} onChange={setIcon} color={color}/>

        <SectionLabel theme={theme}>Color</SectionLabel>
        <ColorSwatches theme={theme} value={color} onChange={setColor} size={36}/>

        <SectionLabel theme={theme}>Frecuencia</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {HABIT_CADENCES.map(cd => {
            const active = cadence === cd.id;
            return (
              <button key={cd.id} onClick={() => setCadence(cd.id)} className="lo-press" style={{
                flex: 1, padding: '10px 6px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit',
                background: active ? theme.accentSoft : theme.surface,
                border: `1.5px solid ${active ? theme.accent : theme.border}`,
                color: active ? theme.accent : theme.text2, fontSize: 12.5, fontWeight: active ? 700 : 500,
              }}>{cd.label}</button>
            );
          })}
        </div>
        {cadence === 'custom' && (
          <div className="lo-fade" style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5, 6, 0].map(d => {
              const active = days.includes(d);
              return (
                <button key={d} onClick={() => toggleDay(d)} aria-pressed={active} className="lo-press" style={{
                  flex: 1, aspectRatio: '1', maxWidth: 48, borderRadius: '50%', cursor: 'pointer', fontFamily: 'inherit',
                  background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surface,
                  border: `1.5px solid ${active ? 'transparent' : theme.border}`,
                  color: active ? '#fff' : theme.text2, fontSize: 13, fontWeight: 700,
                }}>{DOW_LABELS[d]}</button>
              );
            })}
          </div>
        )}

        <button onClick={save} disabled={!name.trim()} className="lo-press" style={{
          marginTop: 24, width: '100%', height: 54, borderRadius: 18, border: 'none',
          background: name.trim() ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.rail,
          color: name.trim() ? '#fff' : theme.text3, fontSize: 16, fontWeight: 700,
          cursor: name.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
          boxShadow: name.trim() ? `0 8px 28px ${c.to}66` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <UIIcon name="flame" size={18} color={name.trim() ? '#fff' : theme.text3} strokeWidth={2.2}/>
          {editing ? 'Guardar cambios' : 'Empezar a construir el hábito'}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DEADLINE CARD — surfaces upcoming hard due dates with a countdown
// ──────────────────────────────────────────────────────────────
function DeadlineCard({ theme, onOpenTask, compact = false }) {
  const items = LOStore.upcomingDeadlines(compact ? 6 : 3);
  if (!items.length) return null;

  const today = loDateStr();
  const daysLeft = (ds) => {
    const [y, m, d] = ds.split('-').map(Number);
    const [ty, tm, td] = today.split('-').map(Number);
    return Math.round((new Date(y, m - 1, d) - new Date(ty, tm - 1, td)) / 86400000);
  };
  const countLabel = (n) => n <= 0 ? 'Vence hoy' : n === 1 ? 'Mañana' : `${n} días`;
  const niceDate = (ds) => { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }); };
  const label = <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.text3 }}>Fechas límite</div>;

  if (compact) {
    return (
      <div style={{ padding: '4px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 24px 8px' }}>
          {label}<div style={{ flex: 1, height: 0.5, background: theme.border }}/>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
          {items.map((t) => {
            const n = daysLeft(t.deadline);
            const urgent = n <= 1;
            const c = pal(t.color);
            return (
              <button key={t.id} onClick={() => onOpenTask && onOpenTask(t)} className="lo-press lo-card" style={{
                flexShrink: 0, maxWidth: 250, display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                padding: '7px 8px 7px 7px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                background: theme.surface, border: `0.5px solid ${urgent ? `${c.to}66` : theme.border}`,
              }}>
                <TaskGlyph icon={t.icon} color={t.color} size={28} shape="rounded"/>
                <span style={{ minWidth: 0, fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                <span style={{
                  flexShrink: 0, fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 9,
                  color: urgent ? '#fff' : c.to, background: urgent ? `linear-gradient(135deg, ${c.from}, ${c.to})` : `${c.to}1f`,
                  whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                }}>{countLabel(n)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 16px 14px' }}>
      <div style={{ margin: '0 8px 8px' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((t) => {
          const n = daysLeft(t.deadline);
          const urgent = n <= 1;
          const c = pal(t.color);
          return (
            <button key={t.id} onClick={() => onOpenTask && onOpenTask(t)} className="lo-press lo-card" style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              padding: '11px 13px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
              background: theme.surface, border: `0.5px solid ${urgent ? `${c.to}66` : theme.border}`,
            }}>
              <TaskGlyph icon={t.icon} color={t.color} size={36} shape="rounded"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                <div style={{ fontSize: 12, color: theme.text3, textTransform: 'capitalize' }}>{niceDate(t.deadline)}</div>
              </div>
              <div style={{
                fontSize: 12.5, fontWeight: 700, padding: '5px 11px', borderRadius: 10,
                color: urgent ? '#fff' : c.to,
                background: urgent ? `linear-gradient(135deg, ${c.from}, ${c.to})` : `${c.to}1f`,
                whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
              }}>{countLabel(n)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export {
  DeadlineCard, EmptyState, FocusMode, HabitCreateSheet, HabitsScreen, HabitsStrip, QuickAddMenu,
  RoutinesScreen, SearchOverlay,
};
