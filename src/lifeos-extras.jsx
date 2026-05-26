// lifeos-extras.jsx — Focus Mode · Routines · Quick Add · Search · Notes · Empty states

// ──────────────────────────────────────────────────────────────
// FOCUS MODE — fullscreen current task with countdown + breathing
// Triggered from Detail screen "Iniciar enfoque"
// ──────────────────────────────────────────────────────────────
function FocusMode({ theme, task, onClose }) {
  const c = LIFE_PALETTE[task.color];
  const totalSec = minutesBetween(task.start, task.end) * 60;
  const [remaining, setRemaining] = React.useState(totalSec);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [paused]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const pct = 1 - remaining / totalSec;

  return (
    <div data-screen-label="Focus Mode" className="lo-fade" style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: `radial-gradient(circle at 50% 0%, ${c.from}55 0%, ${c.to}22 35%, transparent 75%), ${theme.bg}`,
      display: 'flex', flexDirection: 'column',
      color: theme.text,
    }}>
      {/* Top bar — close + task chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 0', height: 56 }}>
        <button onClick={onClose} className="lo-press" style={{
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
          <LifeIcon name={task.icon} color={task.color} size={20} shape="rounded"/>
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
              <LifeIcon name={task.icon} color={task.color} size={72} shape="squircle"/>
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, color: theme.text, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {String(mm).padStart(2,'0')}<span style={{ opacity: 0.5 }}>:</span>{String(ss).padStart(2,'0')}
            </div>
            <div style={{ fontSize: 12, color: theme.text3, fontWeight: 500 }}>
              {remaining > 0 ? 'restante' : '¡Listo!'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14, color: theme.text2, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
          Sin notificaciones. Sin distracciones. Solo tú y la tarea.
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '24px 24px 40px', display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="lo-press" style={focusBtn(theme)}>
          <UIIcon name="bell" size={18} color={theme.text}/>
        </button>
        <button onClick={() => setPaused(!paused)} className="lo-press" style={{
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
        <button onClick={onClose} className="lo-press" style={focusBtn(theme)}>
          <UIIcon name="check" size={20} color={theme.text} strokeWidth={2.4}/>
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
// QUICK ADD MENU — long-press / tap FAB → radial menu
// ──────────────────────────────────────────────────────────────
function QuickAddMenu({ theme, onClose, onSelect }) {
  const items = [
    { id: 'task',    label: 'Nueva tarea',     icon: 'plus',     color: 'coral'    },
    { id: 'routine', label: 'Nueva rutina',    icon: 'repeat',   color: 'lavender' },
    { id: 'inbox',   label: 'Inbox rápido',    icon: 'inbox',    color: 'mint'     },
    { id: 'voice',   label: 'Dictar tarea',    icon: 'sparkle',  color: 'sky'      },
  ];
  return (
    <div className="lo-fade" onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: '0 16px 110px',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="lo-stagger" style={{
        background: theme.surface, borderRadius: 22,
        border: `0.5px solid ${theme.border}`,
        padding: 8,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxWidth: 360, margin: '0 auto', width: '100%',
      }}>
        {items.map((it, i) => (
          <button key={it.id} onClick={() => onSelect(it.id)} className="lo-press" style={{
            '--i': i,
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 14px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: theme.text, fontFamily: 'inherit', textAlign: 'left',
            borderRadius: 14, transition: 'background .15s',
          }}>
            <SettingsIconBadge name={it.icon} color={it.color} size={38}/>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 500, letterSpacing: -0.1 }}>{it.label}</span>
            <UIIcon name="chevronR" size={14} color={theme.text3}/>
          </button>
        ))}
      </div>
    </div>
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
    icon: 'sun',
    tasks: [
      { icon: 'sun', color: 'amber', label: 'Despertar suave', dur: 15 },
      { icon: 'meditate', color: 'lavender', label: 'Meditar 20m', dur: 20 },
      { icon: 'shower', color: 'sky', label: 'Ducha fría', dur: 15 },
      { icon: 'coffee', color: 'ember', label: 'Café + lectura', dur: 30 },
      { icon: 'briefcase', color: 'slate', label: 'Deep work', dur: 90 },
    ],
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro · 4 ciclos',
    sub: '8 bloques · 2h',
    color: 'coral',
    icon: 'clock',
    tasks: [
      { icon: 'book', color: 'plum', label: 'Estudio · ciclo 1', dur: 25 },
      { icon: 'coffee', color: 'ember', label: 'Pausa corta', dur: 5 },
      { icon: 'book', color: 'plum', label: 'Estudio · ciclo 2', dur: 25 },
      { icon: 'coffee', color: 'ember', label: 'Pausa corta', dur: 5 },
      { icon: 'book', color: 'plum', label: 'Estudio · ciclo 3', dur: 25 },
      { icon: 'coffee', color: 'ember', label: 'Pausa corta', dur: 5 },
      { icon: 'book', color: 'plum', label: 'Estudio · ciclo 4', dur: 25 },
      { icon: 'walk', color: 'lime', label: 'Pausa larga', dur: 15 },
    ],
  },
  {
    id: 'classday',
    name: 'Día de clases',
    sub: '6 tareas · 8h',
    color: 'sky',
    icon: 'book',
    tasks: [
      { icon: 'coffee', color: 'ember', label: 'Desayuno + ducha', dur: 45 },
      { icon: 'bike', color: 'mint', label: 'Camino a la U', dur: 30 },
      { icon: 'presentation', color: 'sky', label: 'Clase de la mañana', dur: 180 },
      { icon: 'meal', color: 'sun', label: 'Almuerzo en casino', dur: 45 },
      { icon: 'book', color: 'plum', label: 'Estudio en biblioteca', dur: 120 },
      { icon: 'walk', color: 'lime', label: 'Regreso + descanso', dur: 60 },
    ],
  },
  {
    id: 'workout',
    name: 'Workout completo',
    sub: '4 tareas · 1h 15m',
    color: 'coral',
    icon: 'yoga',
    tasks: [
      { icon: 'yoga', color: 'coral', label: 'Calentamiento', dur: 10 },
      { icon: 'walk', color: 'lime', label: 'Cardio', dur: 25 },
      { icon: 'yoga', color: 'coral', label: 'Fuerza', dur: 30 },
      { icon: 'meditate', color: 'lavender', label: 'Stretching', dur: 10 },
    ],
  },
  {
    id: 'datenight',
    name: 'Date night',
    sub: '4 tareas · 3h',
    color: 'rose',
    icon: 'meal',
    tasks: [
      { icon: 'shower', color: 'sky', label: 'Arreglarse', dur: 45 },
      { icon: 'walk', color: 'lime', label: 'Caminar al lugar', dur: 20 },
      { icon: 'meal', color: 'rose', label: 'Cena especial', dur: 90 },
      { icon: 'moon', color: 'lavender', label: 'Caminata nocturna', dur: 30 },
    ],
  },
  {
    id: 'evening',
    name: 'Cerrar el día',
    sub: '4 tareas · 2h',
    color: 'lavender',
    icon: 'moon',
    tasks: [
      { icon: 'meal', color: 'sun', label: 'Cocinar cena', dur: 60 },
      { icon: 'pencil', color: 'rose', label: 'Journal', dur: 20 },
      { icon: 'book', color: 'plum', label: 'Leer', dur: 30 },
      { icon: 'moon', color: 'lavender', label: 'Bajar revoluciones', dur: 10 },
    ],
  },
  {
    id: 'deep',
    name: 'Sesión deep work',
    sub: '3 tareas · 3h',
    color: 'slate',
    icon: 'briefcase',
    tasks: [
      { icon: 'briefcase', color: 'slate', label: 'Foco profundo', dur: 90 },
      { icon: 'walk', color: 'lime', label: 'Caminata break', dur: 15 },
      { icon: 'briefcase', color: 'slate', label: 'Foco profundo', dur: 75 },
    ],
  },
];

function RoutinesScreen({ theme, onBack, onApply }) {
  const [picked, setPicked] = React.useState(null);
  const r = picked && ROUTINES.find(x => x.id === picked);

  if (r) return <RoutineDetail theme={theme} routine={r} onBack={() => setPicked(null)} onApply={onApply}/>;

  return (
    <div data-screen-label="Routines" className="lo-fade">
      <ScreenTopBar theme={theme} title="Rutinas" onBack={onBack}
        trailing={<button className="lo-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <UIIcon name="plus" size={18} color={theme.text2}/>
        </button>}/>
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

        <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ROUTINES.map((r, i) => {
            const c = LIFE_PALETTE[r.color];
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
                <LifeIcon name={r.icon} color={r.color} size={50} shape="squircle"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>{r.sub}</div>
                  {/* Mini preview */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {r.tasks.slice(0, 5).map((t, k) => (
                      <LifeIcon key={k} name={t.icon} color={t.color} size={22} shape="rounded"/>
                    ))}
                  </div>
                </div>
                <UIIcon name="chevronR" size={14} color={theme.text3}/>
              </button>
            );
          })}
        </div>

        {/* Create new */}
        <button className="lo-press" style={{
          marginTop: 12, width: '100%',
          background: 'transparent', border: `1px dashed ${theme.border}`,
          borderRadius: 18, padding: 14,
          color: theme.text2, fontSize: 13.5, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit',
        }}>
          <UIIcon name="plus" size={16} color={theme.text2}/> Crear rutina nueva
        </button>
      </div>
    </div>
  );
}

function RoutineDetail({ theme, routine, onBack, onApply }) {
  const c = LIFE_PALETTE[routine.color];
  return (
    <div data-screen-label="Routine Detail" className="lo-fade">
      <div style={{
        background: `linear-gradient(165deg, ${c.from} 0%, ${c.to} 55%, ${theme.bg} 100%)`,
        padding: '0 16px 22px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.from}55 0%, transparent 70%)` }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 44, position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} className="lo-press" style={glassBtn}>
            <UIIcon name="chevronL" size={18} color="#fff" strokeWidth={2.2}/>
          </button>
          <button className="lo-press" style={glassBtn}>
            <UIIcon name="pencil" size={16} color="#fff" strokeWidth={2}/>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 24px ${c.to}77)` }}>
            <LifeIcon name={routine.icon} color={routine.color} size={84} shape="squircle"/>
          </div>
          <div style={{ marginTop: 16, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>{routine.name}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>{routine.sub}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 110px' }}>
        <SectionLabel theme={theme}>Tareas en la secuencia</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {routine.tasks.map((t, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 11.5, color: theme.text3, fontWeight: 600, width: 18, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                <LifeIcon name={t.icon} color={t.color} size={36} shape="rounded"/>
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
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '12px 16px 24px',
        background: `linear-gradient(180deg, transparent 0%, ${theme.bg} 40%)` }}>
        <button onClick={() => { onApply && onApply(routine); onBack(); }} className="lo-press" style={{
          width: '100%', height: 54,
          background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
          color: '#fff', border: 'none', borderRadius: 18,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          letterSpacing: -0.2, fontFamily: 'inherit',
          boxShadow: `0 8px 28px ${c.to}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <UIIcon name="check" size={18} color="#fff" strokeWidth={2.6}/> Agendar rutina hoy
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

  const all = TODAY_TASKS.filter(t => t.kind !== 'break');
  const matches = q.trim()
    ? all.filter(t => (t.title + ' ' + (t.subtitle || '')).toLowerCase().includes(q.toLowerCase()))
    : all.slice(0, 5);

  return (
    <div className="lo-fade" style={{
      position: 'absolute', inset: 0, zIndex: 45,
      background: theme.bg,
    }}>
      {/* Search bar */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: `0.5px solid ${theme.border}` }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: theme.surface, border: `0.5px solid ${theme.border}`,
          borderRadius: 12, padding: '8px 12px' }}>
          <UIIcon name="search" size={16} color={theme.text2}/>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tareas, rutinas, notas…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: theme.text, fontSize: 14.5, fontFamily: 'inherit' }}/>
          {q && (
            <button onClick={() => setQ('')} style={{ background: 'transparent', border: 'none', color: theme.text3, cursor: 'pointer', padding: 0, display: 'flex' }}>
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
              <button key={t.id} onClick={() => { onPickTask(t); onClose(); }} className="lo-press" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                background: theme.surface, border: `0.5px solid ${theme.border}`,
                borderRadius: 14, cursor: 'pointer', textAlign: 'left', color: theme.text,
                fontFamily: 'inherit',
              }}>
                <LifeIcon name={t.icon} color={t.color} size={36} shape="rounded"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt12(t.start)} · {minutesBetween(t.start, t.end)} min
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
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
      <div className="lo-breath" style={{ filter: `drop-shadow(0 12px 32px ${theme.accent}55)` }}>
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
// DEADLINE CARD — countdown to next exam / important date
// Only seeded for first-week users
// ──────────────────────────────────────────────────────────────
function DeadlineCard({ theme }) {
  const showSeed = typeof isWithinFirstWeekFromStorage !== 'function' || isWithinFirstWeekFromStorage();
  if (!showSeed) return null;
  const deadlines = [
    { title: 'Examen de Cálculo II', subtitle: 'Universidad de Chile · 14:00', days: 3, color: 'coral', icon: 'pencil' },
    { title: 'Entrega proyecto Diseño', subtitle: 'Sala 502', days: 7, color: 'plum', icon: 'briefcase' },
  ];
  return (
    <div style={{ padding: '0 20px 12px', display: 'flex', gap: 10, overflowX: 'auto' }}>
      {deadlines.map((d, i) => {
        const c = LIFE_PALETTE[d.color];
        return (
          <button key={i} className="lo-press lo-lift" style={{
            flex: '0 0 auto', minWidth: 200, maxWidth: 240,
            background: `linear-gradient(135deg, ${c.from}22, ${c.to}11)`,
            border: `0.5px solid ${c.to}55`,
            borderRadius: 16, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', color: theme.text, fontFamily: 'inherit', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 10px', borderRadius: 10,
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              minWidth: 44,
              boxShadow: `0 4px 12px ${c.to}55`,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{d.days}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4, marginTop: 2 }}>{d.days === 1 ? 'DÍA' : 'DÍAS'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, letterSpacing: -0.1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
              <div style={{ fontSize: 11, color: theme.text2, marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.subtitle}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  FocusMode, QuickAddMenu, RoutinesScreen, SearchOverlay, EmptyState, DeadlineCard, ROUTINES,
});
