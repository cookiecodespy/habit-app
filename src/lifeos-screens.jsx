// lifeos-screens.jsx — auxiliary screens (Month, Week, Create, Detail, Onboarding, AI, Settings, Inbox, Stats)

// Reusable: bottom tab bar
function TabBar({ theme, current, onChange }) {
  const tabs = [
    { id: 'timeline', icon: 'timeline', label: 'Hoy' },
    { id: 'month',    icon: 'calendar', label: 'Agenda' },
    { id: 'ai',       icon: 'ai',       label: 'IA' },
    { id: 'stats',    icon: 'stats',    label: 'Stats' },
    { id: 'settings', icon: 'settings', label: 'Ajustes' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      paddingTop: 10,
      background: theme.bg,
      borderTop: `0.5px solid ${theme.border}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 10,
    }}>
      {tabs.map(t => {
        const active = current === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} className="lo-press" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '4px 6px', position: 'relative',
            color: active ? theme.accent : theme.text3, fontFamily: 'inherit',
            minWidth: 52,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: active ? theme.accent + '1A' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
            }}>
              <UIIcon name={t.icon} size={20} color={active ? theme.accent : theme.text3} strokeWidth={active ? 2.2 : 1.8}/>
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.2 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// FAB
function FAB({ theme, onClick }) {
  return (
    <button onClick={onClick} className="lo-press lo-scale-in" style={{
      position: 'absolute', right: 20,
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 104px)',
      zIndex: 11,
      width: 58, height: 58, borderRadius: 29,
      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)`,
      border: 'none', cursor: 'pointer',
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 10px 30px ${theme.accent}77, 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)`,
      transition: 'transform .2s var(--ease-out-back)',
    }}>
      <UIIcon name="plus" size={26} color="#fff" strokeWidth={2.4}/>
    </button>
  );
}

// Generic top bar with back + title; pass embedded to drop the back chevron.
function ScreenTopBar({ theme, title, onBack, trailing, embedded }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 14px', height: 44 }}>
      {embedded ? <div style={{ width: 36 }}/> : (
        <button onClick={onBack} className="lo-press" style={{
          width: 36, height: 36, borderRadius: 18,
          background: theme.surface, border: `0.5px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: theme.text,
        }}>
          <UIIcon name="chevronL" size={18} color={theme.text}/>
        </button>
      )}
      <span style={{ fontSize: 16, fontWeight: 600, color: theme.text, letterSpacing: -0.2 }}>{title}</span>
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
    </div>
  );
}

function SettingsIconBadge({ name, color, size = 32 }) {
  return (
    <LifeIconBox color={color} size={size} shape="rounded">
      <UIIcon name={name} size={size * 0.55} color="#fff" strokeWidth={2}/>
    </LifeIconBox>
  );
}

// ──────────────────────────────────────────────────────────────
// Agenda — month calendar with month navigation, selectable days,
// task dots, and a list of the selected day's tasks below.
// ──────────────────────────────────────────────────────────────
function MonthScreen({ theme, onBack, embedded = false, onOpenTask }) {
  const [yyMm, setYyMm] = React.useState({ y: 2026, m: 4 });  // May 2026
  const [selected, setSelected] = React.useState(16);          // today
  const cells = React.useMemo(() => buildMonth(yyMm.y, yyMm.m), [yyMm.y, yyMm.m]);
  const todayKey = `${2026}-${4}-${16}`;
  const monthKey = `${yyMm.y}-${yyMm.m}`;

  const goPrev = () => setYyMm(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
  const goNext = () => setYyMm(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });

  // Color of dots for each day (deterministic from tasksForDay)
  const dotsFor = (day) => tasksForDay(day, yyMm.y, yyMm.m).slice(0, 5).map(t => t.color);
  const tasksForSelected = tasksForDay(selected, yyMm.y, yyMm.m);

  return (
    <div>
      {!embedded && <ScreenTopBar theme={theme} title="Agenda" onBack={onBack} trailing={
        <button style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <UIIcon name="search" size={17} color={theme.text2}/>
        </button>
      }/>}

      <div style={{ padding: '0 18px' }}>
        {/* Header: month nav + Today pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: embedded ? 2 : 0, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: -0.6 }}>
              {MONTH_NAMES[yyMm.m]}
            </h2>
            <span style={{ fontSize: 28, fontWeight: 400, letterSpacing: -0.4, color: theme.text3 }}>{yyMm.y}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => { setYyMm({ y: 2026, m: 4 }); setSelected(16); }}
              style={{ background: theme.accentSoft, color: theme.accent, border: 'none',
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', marginRight: 6 }}>Hoy</button>
            <CalChev theme={theme} dir="left" onClick={goPrev}/>
            <CalChev theme={theme} dir="right" onClick={goNext}/>
          </div>
        </div>

        {/* Day-of-week */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {['L','M','X','J','V','S','D'].map((d, i) => (
            <div key={i} style={{ fontSize: 10.5, color: theme.text3, fontWeight: 600, textAlign: 'center', letterSpacing: 0.6 }}>{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((c, i) => {
            const dots = c.inMonth ? dotsFor(c.d) : [];
            const isToday = c.inMonth && monthKey === '2026-4' && c.d === 16;
            const isSelected = c.inMonth && monthKey === '2026-4' && c.d === selected;
            return (
              <button key={i}
                disabled={!c.inMonth}
                onClick={() => c.inMonth && setSelected(c.d)}
                style={{
                  appearance: 'none', border: 'none', cursor: c.inMonth ? 'pointer' : 'default',
                  height: 46,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  paddingTop: 7,
                  borderRadius: 14,
                  background: isSelected ? theme.accent : (isToday ? theme.accentSoft : 'transparent'),
                  opacity: c.inMonth ? 1 : 0.22,
                  transition: 'background .15s',
                }}>
                <span style={{
                  fontSize: 14, fontWeight: isSelected || isToday ? 700 : 500,
                  color: isSelected ? '#fff' : (isToday ? theme.accent : theme.text),
                  fontVariantNumeric: 'tabular-nums',
                }}>{c.d}</span>
                <div style={{ display: 'flex', gap: 2, marginTop: 4, height: 4 }}>
                  {dots.slice(0, 5).map((dot, k) => (
                    <div key={k} style={{
                      width: 3.5, height: 3.5, borderRadius: 2,
                      background: isSelected ? 'rgba(255,255,255,0.95)' : LIFE_PALETTE[dot].to,
                    }}/>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected day header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {selectedDayLabel(yyMm.y, yyMm.m, selected)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: -0.4, marginTop: 2 }}>
              {MONTH_NAMES[yyMm.m]} {selected}
            </div>
          </div>
          <span style={{ fontSize: 12, color: theme.text2, fontWeight: 500 }}>
            {tasksForSelected.length} {tasksForSelected.length === 1 ? 'tarea' : 'tareas'}
          </span>
        </div>

        {/* Day's tasks list (compact) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tasksForSelected.map(t => (
            <AgendaTaskRow key={t.id} task={t} theme={theme} onClick={() => onOpenTask && onOpenTask(t)}/>
          ))}
          {tasksForSelected.length === 0 && (
            <EmptyState theme={theme}
              icon="sparkle"
              title="Nada agendado para este día"
              body="Tómate el día libre o añade tu primera tarea."
              ctaLabel="Añadir tarea"
              onCta={() => {}}/>
          )}
        </div>
      </div>
    </div>
  );
}

function CalChev({ theme, dir, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: 16,
      background: theme.surface, border: `0.5px solid ${theme.border}`,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: theme.text2,
    }}>
      <UIIcon name={dir === 'left' ? 'chevronL' : 'chevronR'} size={14} color={theme.text} strokeWidth={2}/>
    </button>
  );
}

function selectedDayLabel(y, m, d) {
  const dn = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return dn[new Date(y, m, d).getDay()];
}

function AgendaTaskRow({ task, theme, onClick }) {
  const c = LIFE_PALETTE[task.color];
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      background: theme.surface, border: `0.5px solid ${theme.border}`,
      borderRadius: 14, cursor: 'pointer', textAlign: 'left', color: theme.text,
      opacity: task.status === 'done' ? 0.55 : 1,
    }}>
      <LifeIcon name={task.icon} color={task.color} size={34} shape="rounded"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, letterSpacing: -0.1,
          textDecoration: task.status === 'done' ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>{task.title}</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
          {fmt12(task.start)} · {Math.round((parseInt(task.end.split(':')[0])*60 + parseInt(task.end.split(':')[1])) - (parseInt(task.start.split(':')[0])*60 + parseInt(task.start.split(':')[1])))} min
        </div>
      </div>
      <StatusRing task={task} theme={theme}/>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Week screen — 7-day swimlanes
// ──────────────────────────────────────────────────────────────
function WeekScreen({ theme, onBack }) {
  // 7 mini timelines side by side
  const days = ['M','T','W','T','F','S','S'];
  // sample blocks per day
  const blocks = days.map((_, i) => {
    const palette = ['coral','mint','sky','amber','lavender','rose','sun','plum'];
    const arr = [];
    let h = 7 + (i % 2);
    for (let k = 0; k < 5 + (i%3); k++) {
      const dur = 1 + (k % 3);
      arr.push({ start: h, dur, color: palette[(i*3+k)%palette.length] });
      h += dur + (k%2);
    }
    return arr;
  });
  const startH = 6, endH = 22, hPx = 22;
  return (
    <div>
      <ScreenTopBar theme={theme} title="Semana 20" onBack={onBack}/>
      <div style={{ padding: '0 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: 4 }}>
          <div/>
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: theme.text3, fontWeight: 600 }}>{d}</div>
              <div style={{
                fontSize: 13, fontWeight: i === 4 ? 700 : 500,
                color: i === 4 ? '#fff' : theme.text,
                background: i === 4 ? theme.accent : 'transparent',
                width: 22, height: 22, borderRadius: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '2px auto 0',
              }}>{12+i}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: 4, marginTop: 14, position: 'relative' }}>
          {/* hour rail */}
          <div style={{ paddingTop: 0 }}>
            {Array.from({ length: endH-startH+1 }).map((_, i) => (
              <div key={i} style={{ height: hPx, fontSize: 9, color: theme.text3, lineHeight: 1 }}>
                {startH+i === 12 ? '12p' : startH+i > 12 ? `${startH+i-12}p` : `${startH+i}a`}
              </div>
            ))}
          </div>
          {blocks.map((dayBlocks, di) => (
            <div key={di} style={{ position: 'relative', borderLeft: `0.5px solid ${theme.border}` }}>
              {Array.from({ length: endH-startH+1 }).map((_, hi) => (
                <div key={hi} style={{ height: hPx, borderTop: `0.5px solid ${theme.border}` }}/>
              ))}
              {dayBlocks.map((b, bi) => {
                const c = LIFE_PALETTE[b.color];
                return (
                  <div key={bi} style={{
                    position: 'absolute', left: 2, right: 2,
                    top: (b.start - startH) * hPx, height: b.dur * hPx - 2,
                    background: `linear-gradient(135deg, ${c.from}66, ${c.to}88)`,
                    borderRadius: 6,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18)`,
                  }}/>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Create / Edit Task — hero immersive sheet (not a form!)
// Full-bleed color hero · visual time picker · tactile pickers
// ──────────────────────────────────────────────────────────────
function CreateScreen({ theme, onBack, onSave }) {
  const ICON_CATEGORIES = [
    { id: 'all',    label: 'Todos',    icons: ['yoga','shower','coffee','bike','briefcase','book','call','meal','meditate','presentation','moon','walk','pencil','cart','sparkle','clock','music','gift','home','car','dumbbell','paw','camera','heart','palm','star','plane','globe','pill','dollar','mail','laptop','gamepad','flower','fire','lightning','target','cake'] },
    { id: 'health', label: 'Salud',    icons: ['yoga','meditate','shower','walk','dumbbell','heart','pill','flower'] },
    { id: 'work',   label: 'Trabajo',  icons: ['briefcase','presentation','laptop','mail','call','dollar','target','lightning'] },
    { id: 'life',   label: 'Vida',     icons: ['home','meal','coffee','cart','car','paw','gift','cake','heart','music'] },
    { id: 'study',  label: 'Estudio',  icons: ['book','pencil','clock','target','laptop','star'] },
    { id: 'fun',    label: 'Diversión', icons: ['palm','plane','globe','camera','gamepad','music','star','fire'] },
  ];
  const colors = ['coral','amber','rose','mint','sky','lavender','lime','teal','plum','sun','ember','slate'];
  const [pickedColor, setColor] = React.useState('mint');
  const [pickedIcon, setIcon] = React.useState('star');
  const [iconCat, setIconCat] = React.useState('all');
  const [title, setTitle] = React.useState('');
  const [subtitle, setSub] = React.useState('');
  const [duration, setDuration] = React.useState(30);

  // Default start time = next rounded 30m from now
  const defaultStart = React.useMemo(() => {
    const n = new Date();
    const total = n.getHours() * 60 + n.getMinutes();
    return Math.ceil(total / 30) * 30;
  }, []);
  const [startMins, setStartMins] = React.useState(defaultStart);
  const [reminderOn, setReminder] = React.useState(false);
  const [repeatOn, setRepeat] = React.useState(false);
  const [subtasks, setSubtasks] = React.useState([]);

  const iconList = ICON_CATEGORIES.find(c => c.id === iconCat).icons;

  const c = LIFE_PALETTE[pickedColor];
  const endMins = startMins + duration;
  const fmtMin = (m) => {
    const h = Math.floor(m / 60), mm = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2,'0')} ${ap}`;
  };

  // Day ribbon: 6 AM (360min) → midnight (24*60=1440min) → 18 hours wide
  const RIBBON_START = 6 * 60, RIBBON_END = 24 * 60;
  const RIBBON_SPAN = RIBBON_END - RIBBON_START;
  const blockLeft = ((startMins - RIBBON_START) / RIBBON_SPAN) * 100;
  const blockWidth = (duration / RIBBON_SPAN) * 100;

  return (
    <div data-screen-label="Create Task" style={{ position: 'relative', minHeight: '100%' }}>
      {/* ─── HERO ─── */}
      <div style={{
        background: `linear-gradient(165deg, ${c.from} 0%, ${c.to} 60%, ${theme.bg} 100%)`,
        padding: '0 16px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* subtle radial overlay */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 280, height: 280,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.from}66 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}/>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 44, position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} className="lo-press" style={glassBtn}>
            <UIIcon name="x" size={18} color="#fff" strokeWidth={2.2}/>
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: 0.4, textTransform: 'uppercase' }}>Nueva tarea</span>
          <div style={{ width: 36 }}/>
        </div>

        {/* Hero icon + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 18, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 24px ${c.to}77)` }}>
            <LifeIcon name={pickedIcon} color={pickedColor} size={92} shape="squircle"/>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la tarea"
            autoFocus
            style={{
              marginTop: 18,
              background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', width: '100%',
              fontSize: 26, fontWeight: 700, color: '#fff',
              letterSpacing: -0.5, fontFamily: 'inherit',
              caretColor: '#fff',
            }}
          />
          <input
            value={subtitle}
            onChange={(e) => setSub(e.target.value)}
            placeholder="Añade una nota… (opcional)"
            style={{
              marginTop: 2, background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', width: '100%',
              fontSize: 13, color: 'rgba(255,255,255,0.78)',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div style={{ padding: '0 16px 110px', marginTop: -8, position: 'relative', zIndex: 3 }}>

        {/* Time visual picker */}
        <Card theme={theme} style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <SectionLabel theme={theme} inline>Cuándo</SectionLabel>
            <span style={{ fontSize: 11, color: theme.text3, fontWeight: 500 }}>
              {duration < 60 ? `${duration} min` : `${Math.floor(duration/60)} hr${duration%60 ? ` ${duration%60}m` : ''}`}
            </span>
          </div>

          {/* Big time display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontVariantNumeric: 'tabular-nums', marginBottom: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Inicio</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{fmtMin(startMins)}</div>
            </div>
            <div style={{ width: 24, height: 1, background: theme.border, borderRadius: 1 }}/>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Fin</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{fmtMin(endMins)}</div>
            </div>
          </div>

          {/* Day arc ribbon — premium visual */}
          <div style={{ position: 'relative', height: 56, marginBottom: 16 }}>
            {/* Bg track — gradient representing the day cycle */}
            <div style={{
              position: 'absolute', top: 22, left: 0, right: 0, height: 14,
              borderRadius: 8,
              background: `linear-gradient(90deg,
                ${LIFE_PALETTE.slate.to}40 0%,
                ${LIFE_PALETTE.amber.from}50 18%,
                ${LIFE_PALETTE.sun.from}55 36%,
                ${LIFE_PALETTE.sky.from}55 60%,
                ${LIFE_PALETTE.plum.to}50 84%,
                ${LIFE_PALETTE.slate.to}40 100%)`,
              border: `0.5px solid ${theme.border}`,
              overflow: 'hidden',
            }}>
              {/* Inner shimmer */}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%)` }}/>
            </div>

            {/* Hour ticks (subtle) */}
            {[6, 9, 12, 15, 18, 21, 24].map(h => {
              const left = ((h*60 - RIBBON_START) / RIBBON_SPAN) * 100;
              return (
                <div key={h} style={{ position: 'absolute', left: `${left}%`, top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: theme.text3, fontWeight: 600, letterSpacing: 0.3 }}>
                    {h === 24 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h-12}p` : `${h}a`}
                  </span>
                  <div style={{ width: 1, height: 6, background: theme.text3, opacity: 0.4 }}/>
                </div>
              );
            })}

            {/* Sun + Moon at edges */}
            <div style={{ position: 'absolute', left: 4, top: 26, width: 18, height: 18, borderRadius: 9,
              background: `linear-gradient(135deg, ${LIFE_PALETTE.amber.from}, ${LIFE_PALETTE.amber.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
              boxShadow: `0 0 12px ${LIFE_PALETTE.amber.to}66`,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#fff"/></svg>
            </div>
            <div style={{ position: 'absolute', right: 4, top: 26, width: 18, height: 18, borderRadius: 9,
              background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from}, ${LIFE_PALETTE.plum.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
              boxShadow: `0 0 12px ${LIFE_PALETTE.plum.to}66`,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24"><path d="M19 14 A8 8 0 1 1 10 5 a6 6 0 0 0 9 9 Z" fill="#fff"/></svg>
            </div>

            {/* Task block — looks like a draggable pill */}
            <div className="lo-fade" style={{
              position: 'absolute', top: 18, left: `${blockLeft}%`, width: `${blockWidth}%`,
              height: 22, minWidth: 18,
              borderRadius: 11,
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              boxShadow: `0 0 0 3px ${theme.surface}, 0 0 0 4px ${c.to}88, 0 6px 16px ${c.to}66, inset 0 1px 0 rgba(255,255,255,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 4px',
              zIndex: 2,
            }}>
              {/* Grab handles on edges */}
              <div style={{ width: 2, height: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }}/>
              <div style={{ width: 2, height: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }}/>
            </div>
          </div>

          {/* duration chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0' }}>
            {[15, 30, 45, 60, 90, 120].map(d => {
              const active = duration === d;
              return (
                <button key={d} onClick={() => setDuration(d)} className="lo-press" style={{
                  flexShrink: 0,
                  background: active
                    ? `linear-gradient(135deg, ${c.from}, ${c.to})`
                    : theme.surfaceHi,
                  color: active ? '#fff' : theme.text2,
                  border: `0.5px solid ${active ? c.to : theme.border}`,
                  padding: '8px 14px', borderRadius: 999, fontSize: 12.5,
                  fontWeight: active ? 700 : 500, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: -0.1,
                  boxShadow: active ? `0 4px 12px ${c.to}55` : 'none',
                  transition: 'all .2s var(--ease-out-back)',
                }}>{d < 60 ? `${d} min` : `${Math.floor(d/60)}h${d%60 ? ` ${d%60}m` : ''}`}</button>
              );
            })}
          </div>
        </Card>

        {/* Color row */}
        <Card theme={theme} style={{ padding: 14 }}>
          <SectionLabel theme={theme} inline>Color</SectionLabel>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 2, overflowX: 'auto' }}>
            {colors.map(col => {
              const cc = LIFE_PALETTE[col];
              const active = pickedColor === col;
              return (
                <button key={col} onClick={() => setColor(col)} className="lo-press" style={{
                  flexShrink: 0,
                  width: active ? 42 : 32, height: active ? 42 : 32,
                  borderRadius: '50%',
                  background: `linear-gradient(160deg, ${cc.from}, ${cc.to})`,
                  border: 'none', cursor: 'pointer', padding: 0,
                  boxShadow: active ? `0 0 0 3px ${theme.bg}, 0 0 0 5px ${cc.to}` : 'none',
                  transition: 'all .25s var(--ease-out-back)',
                  position: 'relative', alignSelf: 'center',
                }} aria-label={col}>
                  {active && <span key={col} className="lo-pop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <UIIcon name="check" size={18} color="#fff" strokeWidth={2.6}/>
                  </span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Icon picker — categorized */}
        <Card theme={theme} style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <SectionLabel theme={theme} inline>Icono</SectionLabel>
            <span style={{ fontSize: 10.5, color: theme.text3, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{iconList.length}</span>
          </div>
          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', padding: '2px 0' }}>
            {ICON_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setIconCat(cat.id)} className="lo-press" style={{
                flexShrink: 0,
                background: iconCat === cat.id ? c.to : 'transparent',
                color: iconCat === cat.id ? '#fff' : theme.text2,
                border: `0.5px solid ${iconCat === cat.id ? c.to : theme.border}`,
                padding: '6px 12px', borderRadius: 999,
                fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: -0.1,
                transition: 'all .2s var(--ease-smooth)',
              }}>{cat.label}</button>
            ))}
          </div>
          {/* Icons grid */}
          <div key={iconCat} className="lo-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {iconList.map(n => {
              const active = pickedIcon === n;
              return (
                <button key={n} onClick={() => setIcon(n)} className="lo-press" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, borderRadius: 14,
                  background: active ? c.to + '22' : 'transparent',
                  border: `1.5px solid ${active ? c.to : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all .2s var(--ease-smooth)',
                }}>
                  <span className={active ? 'lo-pop' : ''} key={n + (active ? 'a' : 'i')}>
                    <LifeIcon name={n} color={pickedColor} size={36} shape="rounded"/>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Smart options */}
        <Card theme={theme} style={{ padding: 0, overflow: 'hidden' }}>
          <OptionRow theme={theme} icon="bell" tint="coral" label="Recordatorio"
            on={reminderOn} onToggle={() => setReminder(!reminderOn)}
            sub={reminderOn ? '10 min antes' : 'Apagado'} />
          <Divider theme={theme}/>
          <OptionRow theme={theme} icon="repeat" tint="lavender" label="Repetir"
            on={repeatOn} onToggle={() => setRepeat(!repeatOn)}
            sub={repeatOn ? 'Entre semana · Lun–Vie' : 'No se repite'} />
          <Divider theme={theme}/>
          <OptionRow theme={theme} icon="calendar" tint="sky" label="Calendario" sub="Personal" arrow/>
        </Card>

        {/* Subtasks */}
        <Card theme={theme} style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <SectionLabel theme={theme} inline>Checklist <span style={{ color: theme.text2, fontWeight: 500, marginLeft: 4 }}>· {subtasks.length}</span></SectionLabel>
          </div>
          <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column' }}>
            {subtasks.map((s, i) => (
              <div key={s.id} style={{ '--i': i, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: i < subtasks.length - 1 ? `0.5px solid ${theme.border}` : 'none' }}>
                <button className="lo-press" onClick={() => setSubtasks(subtasks.map(x => x.id === s.id ? { ...x, done: !x.done } : x))} style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `1.5px solid ${s.done ? c.to : theme.rail}`,
                  background: s.done ? c.to : 'transparent',
                  cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}>
                  {s.done && <UIIcon name="check" size={13} color="#fff" strokeWidth={2.6}/>}
                </button>
                <span style={{ flex: 1, fontSize: 14, color: s.done ? theme.text3 : theme.text, textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
                <button onClick={() => setSubtasks(subtasks.filter(x => x.id !== s.id))} style={{ background: 'transparent', border: 'none', color: theme.text3, cursor: 'pointer', padding: 4 }}>
                  <UIIcon name="x" size={14} color={theme.text3}/>
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setSubtasks([...subtasks, { id: 's' + Date.now(), label: 'Nuevo paso', done: false }])}
            className="lo-press" style={{
              marginTop: 10, background: 'transparent', border: `1px dashed ${theme.border}`,
              color: theme.text2, padding: '8px 14px', borderRadius: 12,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <UIIcon name="plus" size={14} color={theme.text2}/> Añadir paso
          </button>
        </Card>
      </div>

      {/* ─── Floating CTA ─── */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        padding: '12px 16px 18px',
        background: `linear-gradient(180deg, transparent 0%, ${theme.bg} 40%)`,
        zIndex: 5,
      }}>
        {!title.trim() && (
          <div style={{ textAlign: 'center', fontSize: 12, color: theme.text3, marginBottom: 8 }}>
            Escribe un nombre para la tarea
          </div>
        )}
        <button onClick={() => {
          if (!title.trim()) return;
          const pad = n => String(n).padStart(2, '0');
          const sh = Math.floor(startMins / 60), sm = startMins % 60;
          const endMinsVal = startMins + duration;
          const eh = Math.floor(endMinsVal / 60) % 24, em = endMinsVal % 60;
          const task = {
            id: 't' + Date.now(),
            start: `${pad(sh)}:${pad(sm)}`,
            end: `${pad(eh)}:${pad(em)}`,
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            icon: pickedIcon,
            color: pickedColor,
            status: 'todo',
          };
          if (onSave) onSave(task);
          onBack();
        }} disabled={!title.trim()} className="lo-press" style={{
          width: '100%', height: 54,
          background: title.trim()
            ? `linear-gradient(135deg, ${c.from}, ${c.to})`
            : theme.rail,
          color: '#fff', border: 'none', borderRadius: 18,
          fontSize: 16, fontWeight: 700,
          cursor: title.trim() ? 'pointer' : 'default',
          letterSpacing: -0.2, fontFamily: 'inherit',
          boxShadow: title.trim() ? `0 8px 28px ${c.to}66, 0 2px 6px rgba(0,0,0,0.3)` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: title.trim() ? 1 : 0.5,
          transition: 'all .2s',
        }}>
          <UIIcon name="check" size={18} color="#fff" strokeWidth={2.6}/> Agendar tarea
        </button>
      </div>
    </div>
  );
}

const glassBtn = {
  width: 36, height: 36, borderRadius: 18,
  background: 'rgba(0,0,0,0.25)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  border: '0.5px solid rgba(255,255,255,0.18)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};

function Card({ theme, children, style }) {
  return (
    <div className="lo-slide-in" style={{
      background: theme.surface, borderRadius: 18,
      border: `0.5px solid ${theme.border}`,
      marginTop: 12,
      overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}

function OptionRow({ theme, icon, tint, label, sub, on, onToggle, arrow }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      <SettingsIconBadge name={icon} color={tint} size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: theme.text, fontWeight: 500, letterSpacing: -0.1 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1 }}>{sub}</div>
      </div>
      {onToggle ? (
        <Toggle on={on} onChange={onToggle} theme={theme}/>
      ) : arrow ? (
        <UIIcon name="chevronR" size={14} color={theme.text3}/>
      ) : null}
    </div>
  );
}

function Toggle({ on, onChange, theme }) {
  return (
    <button onClick={onChange} className="lo-press" style={{
      width: 44, height: 26, borderRadius: 13,
      background: on ? '#34C759' : theme.rail,
      border: 'none', padding: 0, cursor: 'pointer',
      position: 'relative',
      transition: 'background .25s var(--ease-smooth)',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 11,
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        transition: 'left .25s var(--ease-out-back)',
      }}/>
    </button>
  );
}

function SectionLabel({ children, theme, inline }) {
  return <div style={{
    fontSize: 11, fontWeight: 700, color: theme.text3,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: inline ? 0 : 24,
    marginBottom: inline ? 8 : 12,
    padding: inline ? 0 : '0 6px',
  }}>{children}</div>;
}
function Row({ children, theme }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', fontSize: 14.5, color: theme.text }}>{children}</div>;
}
function Pill({ children, theme, muted }) {
  return <span style={{ fontSize: 13, color: muted ? theme.text2 : theme.accent, fontWeight: 500 }}>{children} <span style={{ opacity: 0.5 }}>›</span></span>;
}
function Divider({ theme }) { return <div style={{ height: 0.5, background: theme.border, marginLeft: 14 }}/>; }

// ──────────────────────────────────────────────────────────────
// Detail screen — opened by tapping a task. Hero gradient + content cards.
// ──────────────────────────────────────────────────────────────
function DetailScreen({ theme, task, onBack, onStartFocus }) {
  const t = task || TODAY_TASKS[3];
  const c = LIFE_PALETTE[t.color];
  const [subtasks, setSubtasks] = React.useState([
    { done: true,  label: 'Casco y luces' },
    { done: true,  label: 'Botella de agua' },
    { done: false, label: 'Llevar laptop' },
    { done: false, label: 'Dejar carta en el correo' },
    { done: false, label: 'Audio: playlist de foco' },
  ]);
  const doneCount = subtasks.filter(s => s.done).length;
  const pct = Math.round((doneCount / subtasks.length) * 100);

  return (
    <div data-screen-label="Task Detail" className="lo-detail">
      {/* HERO */}
      <div style={{
        background: `linear-gradient(165deg, ${c.from} 0%, ${c.to} 55%, ${theme.bg} 100%)`,
        padding: '0 16px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, left: -80, width: 320, height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.from}55 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}/>
        {/* top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 44, position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} className="lo-press" style={glassBtn}>
            <UIIcon name="chevronL" size={18} color="#fff" strokeWidth={2.2}/>
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="lo-press" style={glassBtn}><UIIcon name="bell" size={16} color="#fff" strokeWidth={2}/></button>
            <button className="lo-press" style={glassBtn}><UIIcon name="pencil" size={16} color="#fff" strokeWidth={2}/></button>
          </div>
        </div>
        {/* hero icon + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 24px ${c.to}77)` }}>
            <LifeIcon name={t.icon} color={t.color} size={92} shape="squircle"/>
          </div>
          <div style={{ marginTop: 18, fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -0.5, textAlign: 'center' }}>{t.title}</div>
          {t.subtitle && <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.78)', textAlign: 'center' }}>{t.subtitle}</div>}
          <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 999, backdropFilter: 'blur(20px)' }}>
            <UIIcon name="clock" size={14} color="rgba(255,255,255,0.92)" strokeWidth={2}/>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.1 }}>
              {fmt12(t.start)} – {fmt12(t.end)} · {minutesBetween(t.start, t.end)}m
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT CARDS */}
      <div className="lo-stagger" style={{ padding: '0 16px 40px', marginTop: 4 }}>
        {/* Progress card */}
        <div style={{ '--i': 0 }}>
          <Card theme={theme} style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <SectionLabel theme={theme} inline>Progreso</SectionLabel>
              <span style={{ fontSize: 22, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>{pct}<span style={{ fontSize: 14, color: theme.text2 }}>%</span></span>
            </div>
            <div style={{ height: 8, background: theme.rail, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${c.from}, ${c.to})`, transition: 'width .4s var(--ease-out-quart)' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: theme.text3, fontWeight: 500 }}>
              <span>{doneCount} de {subtasks.length} hechos</span>
              <span>faltan {subtasks.length - doneCount}</span>
            </div>
          </Card>
        </div>

        {/* Subtasks */}
        <div style={{ '--i': 1 }}>
          <Card theme={theme} style={{ padding: 14, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <SectionLabel theme={theme} inline>Checklist</SectionLabel>
              <button style={{ background: 'transparent', border: 'none', color: c.to, cursor: 'pointer', padding: 0 }}>
                <UIIcon name="plus" size={16} color={c.to} strokeWidth={2.4}/>
              </button>
            </div>
            {subtasks.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? `0.5px solid ${theme.border}` : 'none' }}>
                <button className="lo-press" onClick={() => setSubtasks(subtasks.map((x, j) => j === i ? { ...x, done: !x.done } : x))} style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `1.5px solid ${s.done ? c.to : theme.rail}`,
                  background: s.done ? c.to : 'transparent',
                  cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}>{s.done && <UIIcon name="check" size={13} color="#fff" strokeWidth={2.6}/>}</button>
                <span style={{ flex: 1, fontSize: 14, color: s.done ? theme.text3 : theme.text, textDecoration: s.done ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>{s.label}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Focus mode CTA */}
        <div style={{ '--i': 2 }}>
          <button onClick={onStartFocus} className="lo-press lo-lift" style={{
            marginTop: 12, width: '100%',
            background: `linear-gradient(135deg, ${c.from}22, ${c.to}11)`,
            border: `0.5px solid ${c.to}55`,
            borderRadius: 18, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', color: theme.text, fontFamily: 'inherit', textAlign: 'left',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${c.to}55`,
            }}>
              <UIIcon name="play" size={18} color="#fff"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>Iniciar modo enfoque</div>
              <div style={{ fontSize: 12, color: theme.text2, marginTop: 1 }}>Cronómetro fullscreen sin distracciones</div>
            </div>
            <UIIcon name="chevronR" size={14} color={theme.text3}/>
          </button>
        </div>

        {/* Options */}
        <div style={{ '--i': 3 }}>
          <Card theme={theme} style={{ padding: 0, marginTop: 10 }}>
            <OptionRow theme={theme} icon="bell" tint="coral" label="Recordatorio" sub="10 min antes" arrow/>
            <Divider theme={theme}/>
            <OptionRow theme={theme} icon="repeat" tint="lavender" label="Repetir" sub="Entre semana · Lun–Vie" arrow/>
            <Divider theme={theme}/>
            <OptionRow theme={theme} icon="calendar" tint="sky" label="Calendario" sub="Personal" arrow/>
            <Divider theme={theme}/>
            <OptionRow theme={theme} icon="flag" tint="amber" label="Prioridad" sub="Alta" arrow/>
          </Card>
        </div>

        {/* Action buttons */}
        <div style={{ '--i': 4, display: 'flex', gap: 10, marginTop: 14 }}>
          <button className="lo-press lo-lift" style={{
            flex: 1, padding: '14px 12px', borderRadius: 16,
            background: theme.surface, border: `0.5px solid ${theme.border}`,
            color: theme.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
          }}>
            <UIIcon name="pause" size={16} color={theme.text}/> Posponer
          </button>
          <button className="lo-press lo-lift" style={{
            flex: 1, padding: '14px 12px', borderRadius: 16,
            background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
            boxShadow: `0 6px 20px ${c.to}55`,
          }}>
            <UIIcon name="check" size={16} color="#fff" strokeWidth={2.4}/> Completar
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Onboarding — 3-page paged flow with paged indicator
// ──────────────────────────────────────────────────────────────
function OnboardingScreen({ theme, onBack }) {
  const [page, setPage] = React.useState(0);
  const pages = [
    {
      key: 'p1',
      visual: <OnbVisualTimeline theme={theme}/>,
      eyebrow: 'Bienvenido',
      title: <>Tu día, <span style={{ color: theme.accent }}>visualizado.</span></>,
      body: 'LifeOS convierte tus tareas en una timeline elegante para que el día fluya como debe.',
    },
    {
      key: 'p2',
      visual: <OnbVisualCapture theme={theme}/>,
      eyebrow: 'Captura',
      title: <>Añade cualquier cosa, <span style={{ color: theme.accent }}>agenda con un toque.</span></>,
      body: 'Tira tareas al inbox y luego arrastra a la timeline cuando estés listo. Subtareas, recordatorios y repeticiones incluidos.',
    },
    {
      key: 'p3',
      visual: <OnbVisualAI theme={theme}/>,
      eyebrow: 'IA Planner',
      title: <>Deja que la IA <span style={{ color: theme.accent }}>arme el resto.</span></>,
      body: 'Dícele qué quieres lograr. Encuentra el tiempo, sugiere descansos y reorganiza cuando la vida se mete.',
    },
  ];
  const isLast = page === pages.length - 1;
  return (
    <div data-screen-label="Onboarding" style={{ padding: '0 24px 36px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: theme.text3, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{pages[page].eyebrow}</span>
        <button onClick={onBack} className="lo-press" style={{ background: 'transparent', border: 'none', color: theme.text3, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Saltar</button>
      </div>
      <div key={pages[page].key} className="lo-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 28 }}>
        <div className="lo-scale-in">{pages[page].visual}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: theme.text, letterSpacing: -0.7, lineHeight: 1.1 }}>
            {pages[page].title}
          </h1>
          <p style={{ margin: '14px auto 0', maxWidth: 300, fontSize: 14, color: theme.text2, lineHeight: 1.5 }}>
            {pages[page].body}
          </p>
        </div>
      </div>
      {/* dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
        {pages.map((p, i) => (
          <div key={p.key} style={{
            width: i === page ? 22 : 6, height: 6, borderRadius: 3,
            background: i === page ? theme.accent : theme.rail,
            transition: 'width .3s var(--ease-out-back)',
          }}/>
        ))}
      </div>
      {/* Buttons */}
      <button onClick={() => isLast ? onBack() : setPage(page + 1)} className="lo-press" style={{
        background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)`,
        color: '#fff', border: 'none',
        height: 56, borderRadius: 18, fontSize: 16, fontWeight: 700, cursor: 'pointer',
        letterSpacing: -0.2, fontFamily: 'inherit',
        boxShadow: `0 10px 28px ${theme.accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {isLast ? 'Empezar' : 'Continuar'}
        {!isLast && <UIIcon name="chevronR" size={18} color="#fff" strokeWidth={2.4}/>}
      </button>
      {!isLast && page > 0 && (
        <button onClick={() => setPage(page - 1)} style={{
          background: 'transparent', border: 'none',
          color: theme.text3, fontSize: 13, marginTop: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}>Atrás</button>
      )}
      {isLast && (
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: theme.text3, fontSize: 13, marginTop: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          Ya tengo una cuenta
        </button>
      )}
    </div>
  );
}

// Onboarding visuals — mini timeline preview
function OnbVisualTimeline({ theme }) {
  const items = [
    { icon: 'sun', color: 'amber',  t: '7:00' },
    { icon: 'coffee', color: 'ember', t: '7:30' },
    { icon: 'briefcase', color: 'slate', t: '9:00' },
    { icon: 'meal', color: 'sun', t: '12:30' },
    { icon: 'walk', color: 'lime', t: '15:00' },
  ];
  return (
    <div style={{ width: 240, padding: 14, background: theme.surface, borderRadius: 22, border: `0.5px solid ${theme.border}`, boxShadow: `0 20px 50px rgba(0,0,0,0.4)` }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', opacity: i < 2 ? 0.4 : 1 }}>
          <span style={{ fontSize: 10.5, color: theme.text3, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{it.t}</span>
          <LifeIcon name={it.icon} color={it.color} size={28} shape="rounded"/>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: LIFE_PALETTE[it.color].to + '55' }}/>
        </div>
      ))}
    </div>
  );
}
function OnbVisualCapture({ theme }) {
  return (
    <div style={{ position: 'relative', width: 240, height: 200 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 160, padding: 12, background: theme.surface, borderRadius: 16, border: `0.5px solid ${theme.border}`, transform: 'rotate(-4deg)', boxShadow: `0 12px 30px rgba(0,0,0,0.3)` }}>
        <div style={{ fontSize: 10, color: theme.text3, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Inbox</div>
        {['Llamar dentista', 'Leer capítulo 4', 'Comprar flores'].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, border: `1.5px solid ${theme.rail}` }}/>
            <span style={{ fontSize: 11, color: theme.text }}>{t}</span>
          </div>
        ))}
      </div>
      {/* arrow */}
      <div style={{ position: 'absolute', right: 30, top: 80, color: theme.accent }}>
        <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
          <path d="M2 10 H 32 M 24 3 L 32 10 L 24 17" stroke={theme.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {/* timeline pill */}
      <div style={{ position: 'absolute', right: 0, bottom: 0, width: 140, padding: 10, background: `linear-gradient(135deg, ${LIFE_PALETTE.coral.from}22, ${LIFE_PALETTE.coral.to}11)`, borderRadius: 16, border: `0.5px solid ${LIFE_PALETTE.coral.to}55`, transform: 'rotate(6deg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LifeIcon name="call" color="coral" size={34} shape="squircle"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>2:00 PM</div>
            <div style={{ fontSize: 11, color: theme.text, fontWeight: 600 }}>Llamar dentista</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function OnbVisualAI({ theme }) {
  return (
    <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ alignSelf: 'flex-end', maxWidth: 200, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)`, color: '#fff', padding: '8px 12px', borderRadius: 14, borderBottomRightRadius: 4, fontSize: 11.5, boxShadow: `0 6px 16px ${theme.accent}55` }}>
        Planea mañana para deep work
      </div>
      <div style={{ alignSelf: 'flex-start', maxWidth: 220, background: theme.surface, border: `0.5px solid ${theme.border}`, color: theme.text, padding: '8px 12px', borderRadius: 14, borderBottomLeftRadius: 4, fontSize: 11.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <UIIcon name="sparkle" size={11} color={LIFE_PALETTE.lavender.to} strokeWidth={2}/>
          <span style={{ fontWeight: 600 }}>Listo — bloqué 8–10 AM.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 6, background: theme.bg, borderRadius: 8, marginTop: 4 }}>
          <LifeIcon name="briefcase" color="slate" size={24} shape="rounded"/>
          <div style={{ fontSize: 10.5, color: theme.text }}>Deep Work · 2 hr</div>
        </div>
      </div>
    </div>
  );
}
function Dot({ active, theme }) { return <div style={{ width: active ? 22 : 6, height: 6, borderRadius: 3, background: active ? theme.accent : theme.rail, transition: 'width .2s' }}/>; }

// ──────────────────────────────────────────────────────────────
// AI Planner — premium chat with typing indicator + rich suggestions
// ──────────────────────────────────────────────────────────────
function AIScreen({ theme, onBack, embedded }) {
  const chips = ['¿Cómo uso la app?', 'Planea mañana', 'Encuéntrame 1hr para gym', 'Mueve mis reuniones'];
  const [input, setInput] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { from: 'user', text: 'Hola, ¿en qué me puedes ayudar?' },
    { from: 'ai', text: 'Soy tu planner. Puedo agendar tareas, mover eventos, sugerir descansos y explicarte cómo usar la app. Solo dime qué necesitas — ej: "agenda gym mañana 7am 1h" o "¿cómo creo una rutina?".' },
  ]);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  // Smart local fallback — covers common intents without requiring a backend
  const AI_PATTERNS = [
    { re: /cómo uso|cómo funciona|qué puedo|cómo se usa|ayuda|tutorial|manual/i,
      reply: 'Toca + para crear tareas con hora, ícono y color. La pestaña Agenda muestra el calendario mensual. Stats registra tu progreso. Para rutinas rápidas (Pomodoro, Día de estudio), mantén presionado el +. ¿En qué más te ayudo?' },
    { re: /agend[ae]|cre[ae] una|añad[ei]|ponme|pong[ao]|guard[ae]/i,
      replies: ['Listo, lo agendo ahora. También puedes hacerlo manualmente con el botón + desde la pantalla principal.', 'Anotado. Para que quede en tu timeline, toca + y llena los detalles de la tarea.'] },
    { re: /muev[ae]|cambi[ae] la hora|desplaz[ae]|posterg[ae]/i,
      reply: 'Para mover una tarea, ábrela tocándola y edita la hora. Pronto podrás decírmelo directamente.' },
    { re: /bor[ar]|elimin[ae]|quita|suprim/i,
      reply: 'Abre la tarea tocándola y toca el ícono de borrar. Ojo que no se puede deshacer.' },
    { re: /hábito|rutina/i,
      reply: 'Para rutinas predefinidas, mantén presionado el + abajo. Están Pomodoro, Día de clases, Mañana activa y más — se agregan a tu timeline de una.' },
    { re: /pomodoro|focus|enfoque|concentra/i,
      reply: 'El modo enfoque se activa desde el detalle de cualquier tarea (toca la tarea). Te da un temporizador con la duración que definiste, pantalla limpia, sin distracciones.' },
    { re: /stats|estadístic|progreso|racha/i,
      reply: 'En la pestaña Stats ves las tareas completadas por semana, tu racha diaria y el tiempo de enfoque acumulado. Cualquier cosa que completes hoy suma al registro.' },
    { re: /agenda|calendario|mes|semana/i,
      reply: 'La pestaña Agenda muestra el mes completo. Toca cualquier día para ver sus tareas. También puedes ver la semana deslizando desde la pantalla de hoy.' },
    { re: /hola|buenos|hey|qué tal|buenas/i,
      replies: ['¡Hola! Soy tu asistente de LifeOS. Puedo explicarte cómo usar la app o ayudarte a planear el día. ¿Qué necesitas?', '¡Hola! Pregúntame cómo usar cualquier función o cuéntame qué quieres agendar.'] },
    { re: /gracias|perfecto|genial|excelente|listo/i,
      replies: ['¡Con gusto! ¿Algo más?', 'Para eso estoy. ¿Necesitas algo más?'] },
  ];

  function localReply(text) {
    for (const p of AI_PATTERNS) {
      if (p.re.test(text)) {
        const opts = p.replies || [p.reply];
        return opts[Math.floor(Math.random() * opts.length)];
      }
    }
    const fallbacks = [
      'Entendido. Para eso, toca + en la pantalla principal. ¿Necesitas más detalles?',
      'Buena pregunta. La app está pensada para ser simple: + para crear, el timeline para ver tu día, Agenda para el mes.',
      'Puedo ayudarte con eso. ¿Quieres que te explique paso a paso cómo funciona esa sección?',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  const send = async (txt) => {
    const text = (txt || input).trim();
    if (!text || thinking) return;
    setInput('');
    setMessages(m => [...m, { from: 'user', text }]);
    setThinking(true);

    // Try real AI (Ollama local) if available, else fallback
    try {
      let reply = null;
      if (typeof window !== 'undefined' && typeof window.LOAI !== 'undefined' && window.LOAI.getSettings().enabled) {
        const sys = 'Eres el asistente de LifeOS, un planner diario en español. Responde en 1-3 oraciones, tono amable. Si el usuario pide agendar/mover/borrar algo, confirma brevemente. Si pregunta cómo usar la app: + para crear tareas, Agenda para el mes, Stats para progreso, mantén presionado + para rutinas.';
        reply = await window.LOAI.chat(`${sys}\n\nUsuario: ${text}`);
      }
      // Artificial 400-800ms delay so it feels like thinking even on fallback
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
      setMessages(m => [...m, { from: 'ai', text: reply || localReply(text) }]);
    } catch {
      await new Promise(r => setTimeout(r, 300));
      setMessages(m => [...m, { from: 'ai', text: localReply(text) }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div data-screen-label="AI Planner" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <ScreenTopBar theme={theme} title="IA Planner" onBack={onBack} embedded={embedded}
          trailing={<button className="lo-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <UIIcon name="settings" size={16} color={theme.text2}/>
          </button>}/>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 16px', minHeight: 0 }}>
        {/* Hero */}
        <div className="lo-scale-in" style={{
          background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from}22, ${LIFE_PALETTE.sky.to}18)`,
          border: `0.5px solid ${theme.border}`,
          borderRadius: 22, padding: 18,
          display: 'flex', alignItems: 'center', gap: 14,
          marginTop: 4,
        }}>
          <div className="lo-breath" style={{ filter: `drop-shadow(0 6px 16px ${LIFE_PALETTE.lavender.to}66)` }}>
            <LifeIcon name="sparkle" color="lavender" size={48} shape="squircle"/>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>
              ¿En qué te ayudo hoy?
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: theme.text2, lineHeight: 1.4 }}>
              Agendo tareas, sugiero descansos y respondo dudas de la app.
            </p>
          </div>
        </div>

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {messages.map((m, i) => (
            <Bubble key={i} theme={theme} side={m.from === 'user' ? 'right' : 'left'}>{m.text}</Bubble>
          ))}
          {thinking && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div style={{
                background: theme.surface, border: `0.5px solid ${theme.border}`,
                borderRadius: 18, borderBottomLeftRadius: 6,
                padding: '12px 14px', display: 'inline-flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: 3, background: theme.text3,
                    animation: `lo-breath 1.4s var(--ease-smooth) ${i * 0.15}s infinite`,
                  }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick chips — show when convo is short */}
        {messages.length <= 2 && !thinking && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 18, paddingBottom: 12 }}>
            {chips.map((c) => (
              <button key={c} onClick={() => send(c)} className="lo-press" style={{
                background: theme.surface, border: `0.5px solid ${theme.border}`, color: theme.text,
                padding: '8px 13px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontFamily: 'inherit',
              }}>
                <UIIcon name="sparkle" size={11} color={theme.accent} strokeWidth={2}/> {c}
              </button>
            ))}
          </div>
        )}
        <div style={{ height: 12 }}/>
      </div>

      {/* Fixed input bar */}
      <div style={{
        flexShrink: 0,
        padding: '10px 16px 12px',
        background: theme.bg,
        borderTop: `0.5px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: theme.surface, border: `0.5px solid ${theme.border}`,
          borderRadius: 26, padding: 6,
          boxShadow: `0 4px 16px rgba(0,0,0,0.2)`,
        }}>
          <button className="lo-press" style={{
            width: 36, height: 36, borderRadius: 18, background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <UIIcon name="plus" size={18} color={theme.text2} strokeWidth={2}/>
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Pregúntame lo que sea…" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: 14, padding: '0 4px',
            fontFamily: 'inherit',
          }}/>
          <button onClick={() => send()} className="lo-press" disabled={!input.trim() || thinking} style={{
            width: 38, height: 38, borderRadius: 19,
            background: input.trim() && !thinking ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)` : theme.rail,
            border: 'none', cursor: input.trim() && !thinking ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() && !thinking ? `0 4px 12px ${theme.accent}55` : 'none',
            transition: 'all .2s var(--ease-smooth)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12 L19 12 M13 6 L19 12 L13 18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
function Bubble({ theme, side, children }) {
  return (
    <div style={{
      maxWidth: '88%', alignSelf: side === 'right' ? 'flex-end' : 'flex-start',
      background: side === 'right' ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)` : theme.surface,
      color: side === 'right' ? '#fff' : theme.text,
      border: side === 'right' ? 'none' : `0.5px solid ${theme.border}`,
      borderRadius: 18,
      borderBottomRightRadius: side === 'right' ? 6 : 18,
      borderBottomLeftRadius: side === 'left' ? 6 : 18,
      padding: '11px 14px', fontSize: 13.5, lineHeight: 1.45,
      boxShadow: side === 'right' ? `0 4px 16px ${theme.accent}33` : 'none',
    }}>{children}</div>
  );
}

// ──────────────────────────────────────────────────────────────
// Inbox — filter chips · smart AI hint · drag-to-schedule cards
// ──────────────────────────────────────────────────────────────
function InboxScreen({ theme, onBack }) {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all',      label: 'Todas',      count: 6 },
    { id: 'today',    label: 'Hoy',    count: 2 },
    { id: 'soon',     label: 'Pronto',     count: 3 },
    { id: 'someday',  label: 'Algún día',  count: 1 },
  ];
  return (
    <div data-screen-label="Inbox">
      <ScreenTopBar theme={theme} title="Inbox" onBack={onBack}
        trailing={<button className="lo-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <UIIcon name="search" size={16} color={theme.text2}/>
        </button>}/>

      <div style={{ padding: '0 16px 100px' }}>
        <div className="lo-fade" style={{ padding: '0 4px 6px' }}>
          <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500 }}>Captura cualquier cosa</div>
          <h2 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 700, color: theme.text, letterSpacing: -0.7 }}>
            Inbox <span style={{ color: theme.text3, fontWeight: 400, fontSize: 22 }}>· 6</span>
          </h2>
        </div>

        {/* Smart AI banner */}
        <div className="lo-scale-in" style={{
          marginTop: 12,
          background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from}22, ${LIFE_PALETTE.sky.to}14)`,
          border: `0.5px solid ${LIFE_PALETTE.lavender.to}44`,
          borderRadius: 16, padding: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <LifeIcon name="sparkle" color="lavender" size={34} shape="rounded"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>3 rápidas en menos de 30 min</div>
            <div style={{ fontSize: 11, color: theme.text2, marginTop: 1 }}>¿Quieres que las acomode hoy?</div>
          </div>
          <button className="lo-press" style={{
            background: LIFE_PALETTE.lavender.to, color: '#fff',
            border: 'none', padding: '7px 12px', borderRadius: 999,
            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Planear</button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', padding: '2px 0' }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className="lo-press" style={{
              flexShrink: 0,
              background: filter === f.id ? theme.text : theme.surface,
              color: filter === f.id ? theme.bg : theme.text,
              border: `0.5px solid ${filter === f.id ? theme.text : theme.border}`,
              padding: '7px 13px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all .2s var(--ease-smooth)',
            }}>
              {f.label}
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 999,
                background: filter === f.id ? theme.bg + '33' : theme.rail,
                color: filter === f.id ? theme.bg : theme.text2,
                fontVariantNumeric: 'tabular-nums',
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {INBOX_ITEMS.map((it, i) => {
            const c = LIFE_PALETTE[it.color];
            return (
              <div key={it.id} className="lo-press lo-lift" style={{
                '--i': i,
                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                background: theme.surface, borderRadius: 16, border: `0.5px solid ${theme.border}`,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: `linear-gradient(180deg, ${c.from}, ${c.to})` }}/>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `1.5px solid ${theme.rail}`,
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>{it.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 10.5, color: c.to, fontWeight: 600,
                      background: c.to + '22', padding: '2px 7px', borderRadius: 999 }}>{it.color}</span>
                    <span style={{ fontSize: 11, color: theme.text3 }}>{it.hint}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', color: theme.text3 }}>
                  <UIIcon name="grip" size={18} color={theme.text3}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick capture input */}
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
          padding: 4, background: theme.surface,
          border: `1px dashed ${theme.border}`, borderRadius: 16,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: theme.accent + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UIIcon name="plus" size={18} color={theme.accent} strokeWidth={2.4}/>
          </div>
          <input placeholder="Captura rápida — escribe o pega cualquier cosa" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: 13.5, fontFamily: 'inherit',
          }}/>
          <span style={{ fontSize: 10, color: theme.text3, padding: '0 10px', fontWeight: 600 }}>⌘N</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Stats — streak banner + heatmap + charts + insight
// ──────────────────────────────────────────────────────────────
function StatsScreen({ theme, onBack, embedded }) {
  const bars = [4, 7, 6, 9, 11, 8, 5];
  const days = ['M','T','W','T','F','S','S'];
  return (
    <div data-screen-label="Stats">
      <ScreenTopBar theme={theme} title="Stats" onBack={onBack} embedded={embedded}
        trailing={<button className="lo-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <UIIcon name="chevronR" size={14} color={theme.text2}/>
        </button>}/>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="lo-fade" style={{ padding: '0 4px 14px' }}>
          <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500 }}>Esta semana</div>
          <h2 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 700, color: theme.text, letterSpacing: -0.7 }}>
            Buen <span style={{ color: theme.accent }}>momentum</span>
          </h2>
        </div>

        {/* Streak banner */}
        <div className="lo-scale-in" style={{
          background: `linear-gradient(135deg, ${LIFE_PALETTE.ember.from} 0%, ${LIFE_PALETTE.coral.to} 100%)`,
          borderRadius: 20, padding: 16,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: `0 12px 32px ${LIFE_PALETTE.coral.to}44`,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 28,
            background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 C 9 8 14 9 14 14 C 14 17 12 19 10 19 C 8 19 7 17 7 15 C 7 13 8 11 10 11 C 9 14 10 16 11 16 C 12 16 13 14 13 12 C 13 8 16 6 16 2 Z" fill="#fff"/>
            </svg>
          </div>
          <div style={{ flex: 1, color: '#fff' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.85 }}>Racha actual</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1, marginTop: 4 }}>
              12 <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.85 }}>días</span>
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4 }}>Mejor: 23 días · Sigue así.</div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <StatCard theme={theme} label="Hechas" value="32" sub="↑ 18% sem" tone="mint"/>
          <StatCard theme={theme} label="Foco" value="18h" sub="meta 20h" tone="sky"/>
          <StatCard theme={theme} label="A tiempo" value="91%" sub="↑ 4%" tone="lavender"/>
        </div>

        {/* Activity heatmap (12 weeks) */}
        <div style={{ marginTop: 14, background: theme.surface, borderRadius: 20, padding: 16, border: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 12.5, color: theme.text, fontWeight: 600 }}>Actividad</span>
            <span style={{ fontSize: 10.5, color: theme.text3 }}>Feb — May</span>
          </div>
          <Heatmap theme={theme} accent={theme.accent}/>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 10, color: theme.text3 }}>
            <span>Menos</span>
            {[0, 0.25, 0.5, 0.75, 1].map((a, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: 3,
                background: i === 0 ? theme.rail : `color-mix(in srgb, ${theme.accent} ${a*100}%, transparent)` }}/>
            ))}
            <span>Más</span>
          </div>
        </div>

        {/* Weekly bar chart */}
        <div style={{ marginTop: 14, background: theme.surface, borderRadius: 20, padding: 16, border: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12.5, color: theme.text, fontWeight: 600 }}>Tareas por día</span>
            <span style={{ fontSize: 10.5, color: theme.text3 }}>12 – 18 May</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, marginTop: 16 }}>
            {bars.map((b, i) => {
              const active = i === 4;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: '100%', height: `${(b/12)*100}%`, minHeight: 8,
                    background: active
                      ? `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accent}AA 100%)`
                      : `linear-gradient(180deg, ${theme.surfaceHi} 0%, ${theme.rail} 100%)`,
                    borderRadius: 8,
                    boxShadow: active ? `0 4px 12px ${theme.accent}44` : 'none',
                    transition: 'all .4s var(--ease-out-quart)',
                  }}/>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: active ? theme.text : theme.text3, fontWeight: active ? 700 : 500, fontVariantNumeric: 'tabular-nums' }}>{b}</span>
                    <span style={{ fontSize: 9.5, color: theme.text3, fontWeight: 500 }}>{days[i]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ marginTop: 14, background: theme.surface, borderRadius: 20, padding: 16, border: `0.5px solid ${theme.border}` }}>
          <div style={{ fontSize: 12.5, color: theme.text, marginBottom: 12, fontWeight: 600 }}>En qué se va tu tiempo</div>
          {[
            { label: 'Deep work',  pct: 32, hr: '5.8h', color: 'slate' },
            { label: 'Salud',      pct: 22, hr: '4.0h', color: 'mint' },
            { label: 'Social',     pct: 18, hr: '3.2h', color: 'rose' },
            { label: 'Aprender',   pct: 14, hr: '2.5h', color: 'plum' },
            { label: 'Recados',    pct: 14, hr: '2.5h', color: 'coral' },
          ].map((row, i) => {
            const c = LIFE_PALETTE[row.color];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 4 ? 12 : 0 }}>
                <div style={{ width: 8, height: 24, borderRadius: 4, background: `linear-gradient(180deg, ${c.from}, ${c.to})` }}/>
                <span style={{ flex: 1, fontSize: 13.5, color: theme.text, fontWeight: 500 }}>{row.label}</span>
                <div style={{ flex: 1.5, height: 6, background: theme.rail, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', background: `linear-gradient(90deg, ${c.from}, ${c.to})`, transition: 'width .6s var(--ease-out-quart)' }}/>
                </div>
                <span style={{ fontSize: 11.5, color: theme.text2, width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{row.hr}</span>
              </div>
            );
          })}
        </div>

        {/* AI Insight */}
        <div style={{ marginTop: 14, padding: 16,
          background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from}22, ${LIFE_PALETTE.sky.to}14)`,
          borderRadius: 20, border: `0.5px solid ${LIFE_PALETTE.lavender.to}44` }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <LifeIcon name="sparkle" color="lavender" size={36} shape="rounded"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: LIFE_PALETTE.lavender.to, letterSpacing: 0.4, textTransform: 'uppercase' }}>Insight</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, marginTop: 2, letterSpacing: -0.1 }}>Los viernes son tu mejor día</div>
              <div style={{ fontSize: 12, color: theme.text2, lineHeight: 1.45, marginTop: 4 }}>
                Completas 23% más tareas los viernes. ¿Quieres mover el deep work a ese día?
              </div>
              <button className="lo-press" style={{
                marginTop: 10, background: 'transparent', border: `1px solid ${LIFE_PALETTE.lavender.to}66`,
                color: LIFE_PALETTE.lavender.to, padding: '7px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Aplicar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function StatCard({ theme, label, value, sub, tone }) {
  const c = LIFE_PALETTE[tone] || LIFE_PALETTE.coral;
  return (
    <div className="lo-lift" style={{ flex: 1, background: theme.surface, borderRadius: 18, padding: 14, border: `0.5px solid ${theme.border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, borderRadius: 30, background: `radial-gradient(circle, ${c.to}33, transparent 70%)`, pointerEvents: 'none' }}/>
      <div style={{ fontSize: 10.5, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginTop: 4, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: c.to, marginTop: 4, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}
function Heatmap({ theme, accent }) {
  // 14 cols × 7 rows so cells are bigger; weeks read left→right
  const cols = 14, rows = 7;
  const cells = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const seed = (c * 13 + r * 5) % 11;
    const v = seed > 8 ? 1 : seed > 6 ? 0.75 : seed > 4 ? 0.5 : seed > 2 ? 0.25 : 0;
    cells.push(v);
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
      {Array.from({ length: cols }).map((_, c) => (
        <div key={c} style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 3 }}>
          {Array.from({ length: rows }).map((_, r) => {
            const v = cells[c * rows + r];
            return (
              <div key={r} style={{
                aspectRatio: '1/1', minHeight: 12, borderRadius: 3,
                background: v === 0 ? theme.rail : `color-mix(in srgb, ${accent} ${v*100}%, transparent)`,
              }}/>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Settings — profile hero · pro card · grouped lists with badges
// ──────────────────────────────────────────────────────────────
function SettingsScreen({ theme, onBack, embedded, user, onEditName }) {
  const name = (user && user.name) || 'Tú';
  return (
    <div data-screen-label="Settings">
      <ScreenTopBar theme={theme} title="Ajustes" onBack={onBack} embedded={embedded}/>
      <div style={{ padding: '0 16px 24px' }}>
        {/* Profile hero */}
        <button onClick={onEditName} className="lo-press lo-scale-in" style={{
          position: 'relative', borderRadius: 22, overflow: 'hidden', marginBottom: 14,
          border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
          padding: 0, fontFamily: 'inherit',
        }}>
          <div style={{ position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${LIFE_PALETTE.coral.from}40, ${LIFE_PALETTE.plum.to}30, ${theme.surface} 80%)` }}/>
          <div style={{ position: 'relative', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              background: `linear-gradient(135deg, ${LIFE_PALETTE.coral.from}, ${LIFE_PALETTE.plum.to})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 26, fontWeight: 700, letterSpacing: -0.5,
              boxShadow: `0 8px 20px ${LIFE_PALETTE.plum.to}55`,
            }}>{avatarLetter(name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>{name}</div>
              <div style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>Toca para editar tu nombre</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: `linear-gradient(135deg, ${LIFE_PALETTE.amber.from}, ${LIFE_PALETTE.coral.to})`,
                  color: '#fff', fontWeight: 700, letterSpacing: 0.3 }}>PRO</span>
                <span style={{ fontSize: 10.5, color: theme.text3, fontWeight: 500, paddingTop: 2 }}>Desde hoy</span>
              </div>
            </div>
            <UIIcon name="chevronR" size={16} color={theme.text3}/>
          </div>
        </button>

        {/* Quick stats strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Tareas', value: '342' },
            { label: 'Racha', value: '12d' },
            { label: 'Foco', value: '124h' },
          ].map((s, i) => (
            <div key={i} className="lo-lift" style={{
              flex: 1, padding: 12, background: theme.surface,
              border: `0.5px solid ${theme.border}`, borderRadius: 14,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <SectionLabel theme={theme}>General</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          <NotifSettingsRow theme={theme}/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="calendar" tint="mint" label="Sync de calendario" trail="iCloud, Google"/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="clock" tint="lavender" label="El día empieza a las" trail="6:30 AM"/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="flag" tint="amber" label="Meta diaria" trail="20 hr de foco"/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="repeat" tint="teal" label="Recordatorios" trail="Inteligentes"/>
        </div>

        <SectionLabel theme={theme}>Apariencia</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          <SettingsRow theme={theme} icon="moon" tint="slate" label="Apariencia" trail="Oscuro"/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="sparkle" tint="plum" label="Color de acento" trailNode={
            <div style={{ width: 18, height: 18, borderRadius: 9, background: theme.accent, boxShadow: `0 0 0 2px ${theme.surface}, 0 0 0 3px ${theme.border}` }}/>
          }/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="timeline" tint="sky" label="Estilo de timeline" trail="Clásico"/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="grip" tint="coral" label="Densidad" trail="Comfy"/>
        </div>

        {/* Pro upgrade card */}
        <div className="lo-lift" style={{
          marginTop: 18, position: 'relative', overflow: 'hidden', borderRadius: 22,
          background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from} 0%, ${LIFE_PALETTE.plum.to} 100%)`,
          padding: 18, color: '#fff',
          boxShadow: `0 12px 32px ${LIFE_PALETTE.plum.to}55`,
        }}>
          <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <UIIcon name="sparkle" size={18} color="#fff" strokeWidth={2}/>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Pro · Activo</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>Todo ilimitado</div>
          <div style={{ fontSize: 12.5, opacity: 0.88, marginTop: 4, lineHeight: 1.4 }}>
            IA planner · Sync calendario · Backup en la nube · Soporte prioritario
          </div>
          <button className="lo-press" style={{
            marginTop: 12, background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Administrar suscripción</button>
        </div>

        <SectionLabel theme={theme}>Sobre</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          <SettingsRow theme={theme} icon="message" tint="teal" label="Ayuda y soporte" trail=""/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="book" tint="rose" label="Novedades" trail="v2.4"/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="ai" tint="lavender" label="Enviar feedback"/>
        </div>

        <div style={{ textAlign: 'center', padding: '22px 0 8px', color: theme.text3, fontSize: 11 }}>
          LifeOS · v2.4.1 · Hecho con cariño
        </div>
      </div>
    </div>
  );
}
function SettingsRow({ theme, icon, tint, label, trail, trailNode }) {
  return (
    <button className="lo-press" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <SettingsIconBadge name={icon} color={tint} size={32}/>
      <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>{label}</span>
      {trailNode || (trail && <span style={{ fontSize: 13, color: theme.text2 }}>{trail}</span>)}
      <UIIcon name="chevronR" size={14} color={theme.text3}/>
    </button>
  );
}

Object.assign(window, {
  TabBar, FAB, ScreenTopBar,
  MonthScreen, WeekScreen, CreateScreen, DetailScreen,
  OnboardingScreen, AIScreen, InboxScreen, StatsScreen, SettingsScreen,
  SettingsIconBadge, AgendaTaskRow, Card, OptionRow, Toggle, glassBtn,
});
