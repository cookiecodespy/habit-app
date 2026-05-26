// lifeos-timeline.jsx — main timeline screen + 4 layout variants
// All variants take the same props { tasks, density, blockShape, theme }.

const TL_THEMES = {
  dark: {
    bg: '#0B0B11',
    bg2: 'linear-gradient(180deg, #14141C 0%, #0B0B11 100%)',
    surface: '#16161E',
    surfaceHi: '#1E1E28',
    rail: 'rgba(255,255,255,0.06)',
    railFilled: 'rgba(255,255,255,0.18)',
    border: 'rgba(255,255,255,0.07)',
    text: '#FFFFFF',
    text2: 'rgba(255,255,255,0.62)',
    text3: 'rgba(255,255,255,0.38)',
    accent: '#FF8765',
    accentSoft: 'rgba(255,135,101,0.12)',
    doneTick: 'rgba(255,255,255,0.4)',
  },
  light: {
    bg: '#F4F2EE',
    bg2: 'linear-gradient(180deg, #FAFAF7 0%, #EFECE6 100%)',
    surface: '#FFFFFF',
    surfaceHi: '#FFFFFF',
    rail: 'rgba(20,20,30,0.07)',
    railFilled: 'rgba(20,20,30,0.22)',
    border: 'rgba(20,20,30,0.07)',
    text: '#15151B',
    text2: 'rgba(20,20,30,0.62)',
    text3: 'rgba(20,20,30,0.38)',
    accent: '#E8623C',
    accentSoft: 'rgba(232,98,60,0.10)',
    doneTick: 'rgba(20,20,30,0.4)',
  },
};

// Density tokens
const DENSITY = {
  compact: { rowGap: 4, cardPad: 10, iconSize: 36, titleSize: 14.5, subSize: 11.5, timeSize: 11 },
  comfy:   { rowGap: 10, cardPad: 16, iconSize: 44, titleSize: 16,   subSize: 12.5, timeSize: 12 },
};

// Pretty time formatter "09:00" -> "9:00 AM"
function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2,'0')} ${ap}`;
}
function minutesBetween(a, b) {
  const [ah, am] = a.split(':').map(Number), [bh, bm] = b.split(':').map(Number);
  return (bh*60 + bm) - (ah*60 + am);
}

// ──────────────────────────────────────────────────────────────
// Shared header — greeting + progress + month/year + week selector
// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// Sticky top bar — greeting + day title + nav icons (never scrolls)
// ──────────────────────────────────────────────────────────────
function TimelineTopBar({ theme, userName, onOpen }) {
  const greeting = greetingFor();
  const now = new Date();
  const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const dayName = DAY_NAMES[now.getDay()];
  const dayNum  = now.getDate();
  return (
    <div className="lo-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 20px 14px' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {greeting}, {userName || 'amigo'}
        </div>
        <h1 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 700, color: theme.text, letterSpacing: -0.7 }}>
          {dayName} <span style={{ color: theme.accent, fontWeight: 400 }}>{dayNum}</span>
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: theme.text2, paddingTop: 4, flexShrink: 0 }}>
        <button onClick={() => onOpen && onOpen('search')} className="lo-press" style={btn(theme)}>
          <UIIcon name="search" size={20}/>
        </button>
        <button onClick={() => onOpen && onOpen('ai')} className="lo-press" style={btn(theme)}>
          <UIIcon name="ai" size={20}/>
        </button>
        <button onClick={() => onOpen && onOpen('inbox')} className="lo-press" style={btn(theme)}>
          <UIIcon name="inbox" size={20}/>
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Below-the-fold header content — progress + week selector (scrolls)
// ──────────────────────────────────────────────────────────────
// Build real current week (Mon–Sun containing today)
function buildCurrentWeek() {
  const today = new Date();
  const todayD = today.getDate();
  const dow = today.getDay(); // 0=Sun,1=Mon..6=Sat
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { d: d.getDate(), label: SHORT[d.getDay()], today: d.getDate() === todayD && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(), dots: [] };
  });
}

function TimelineHeaderBody({ theme, userTasks }) {
  const seedTasks = (typeof getTodayTasks === 'function' ? getTodayTasks() : TODAY_TASKS_RAW).filter(t => t.kind !== 'break');
  const extra = (userTasks || []).filter(t => t.kind !== 'break');
  const tasks = [...seedTasks, ...extra];
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const next = tasks.find(t => t.status === 'todo' || t.status === 'doing');

  const week = buildCurrentWeek();

  return (
    <div style={{ padding: '0 20px 14px' }}>
      {/* Progress card */}
      <div className="lo-slide-in" style={{
        padding: '12px 14px',
        background: theme.surface, borderRadius: 16,
        border: `0.5px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ position: 'relative', width: 40, height: 40 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" stroke={theme.rail} strokeWidth="3" fill="none"/>
            {total > 0 && (
              <circle cx="20" cy="20" r="16" stroke={theme.accent} strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * 16} strokeDashoffset={(2 * Math.PI * 16) * (1 - pct/100)}
                strokeLinecap="round" transform="rotate(-90 20 20)"
                style={{ transition: 'stroke-dashoffset .6s var(--ease-out-quart)' }}/>
            )}
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: total > 0 ? 11 : 13, fontWeight: 700,
            color: total > 0 ? theme.text : theme.text3,
            fontVariantNumeric: 'tabular-nums' }}>
            {total > 0 ? pct : '·'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {total > 0 ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>
                {done} de {total} {total === 1 ? 'tarea hecha' : 'tareas hechas'}
              </div>
              <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1 }}>
                {next ? `Siguiente: ${next.title}` : '¡Todo listo por hoy! 🎉'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1 }}>
                Tu día empieza vacío
              </div>
              <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1 }}>
                Toca + para agendar tu primera tarea.
              </div>
            </>
          )}
        </div>
        <UIIcon name="chevronR" size={14} color={theme.text3}/>
      </div>

      {/* Real week selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        {week.map((day) => (
          <button key={day.d + day.label} className="lo-press" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 38, padding: 0,
          }}>
            <span style={{ fontSize: 11, color: day.today ? theme.accent : theme.text3, fontWeight: 600, letterSpacing: 0.3 }}>{day.label}</span>
            <div style={{
              width: 34, height: 34, borderRadius: 17,
              background: day.today ? theme.accent : 'transparent',
              color: day.today ? '#fff' : theme.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: day.today ? 700 : 500,
              boxShadow: day.today ? `0 4px 12px ${theme.accent}55` : 'none',
              transition: 'all .25s var(--ease-out-back)',
            }}>{day.d}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Legacy combined header — kept for non-prototype contexts (variants etc.)
function TimelineHeader({ theme, onOpen, userName }) {
  return (
    <>
      <TimelineTopBar theme={theme} onOpen={onOpen} userName={userName}/>
      <TimelineHeaderBody theme={theme}/>
    </>
  );
}

function btn(theme) {
  return {
    width: 36, height: 36, borderRadius: 12,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: theme.text2, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  };
}

// ──────────────────────────────────────────────────────────────
// Quick Actions row — favorite tasks one tap to schedule
// ──────────────────────────────────────────────────────────────
function QuickActionsRow({ theme, onAdd }) {
  const showSeed = typeof isWithinFirstWeekFromStorage !== 'function' || isWithinFirstWeekFromStorage();
  return (
    <div style={{ display: 'flex', gap: 10, padding: '0 20px 16px', overflowX: 'auto' }}>
      {showSeed && QUICK_ACTIONS.map((q) => (
        <button key={q.id} className="lo-press lo-lift" style={{
          flex: '0 0 auto', width: 80, height: 96,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 6px',
          background: theme.surface, borderRadius: 20,
          border: `0.5px solid ${theme.border}`,
          cursor: 'pointer', color: theme.text, fontFamily: 'inherit',
        }}>
          <LifeIcon name={q.icon} color={q.color} size={38} shape="rounded" />
          <span style={{
            fontSize: 11, fontWeight: 500, color: theme.text2,
            textAlign: 'center', lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {q.label}
          </span>
        </button>
      ))}
      <button onClick={onAdd} className="lo-press" style={{
        flex: '0 0 auto', width: 80, height: 96,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '10px 6px',
        background: 'transparent', borderRadius: 20,
        border: `1px dashed ${theme.border}`,
        cursor: 'pointer', color: theme.text3, fontFamily: 'inherit',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, border: `1.5px dashed ${theme.text3}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UIIcon name="plus" size={18} color={theme.text3} strokeWidth={2}/>
        </div>
        <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>
          {showSeed ? 'Añadir' : 'Crear acceso'}
        </span>
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Status ring (right side)
// ──────────────────────────────────────────────────────────────
function StatusRing({ task, theme }) {
  const c = LIFE_PALETTE[task.color] || LIFE_PALETTE.coral;
  if (task.status === 'done') {
    return (
      <div style={{
        width: 26, height: 26, borderRadius: 13, background: c.to,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <UIIcon name="check" size={15} color="#fff" strokeWidth={2.4}/>
      </div>
    );
  }
  if (task.status === 'doing') {
    const p = task.progress || 0.3;
    const r = 11, C = 2*Math.PI*r;
    return (
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r={r} stroke={theme.rail} strokeWidth="2" fill="none"/>
        <circle cx="13" cy="13" r={r} stroke={c.to} strokeWidth="2.4" fill="none"
                strokeDasharray={C} strokeDashoffset={C*(1-p)} strokeLinecap="round"
                transform="rotate(-90 13 13)"/>
      </svg>
    );
  }
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 12,
      border: `2px solid ${theme.rail}`,
    }}/>
  );
}

// ──────────────────────────────────────────────────────────────
// VARIANT 1: Classic — pill-rail timeline (the main one)
// ──────────────────────────────────────────────────────────────
function TimelineClassic({ theme, dense, blockShape, currentTime = '07:55', onOpenTask, onAdd, userTasks }) {
  const d = dense ? DENSITY.compact : DENSITY.comfy;
  const seed = (typeof getTodayTasks === 'function' ? getTodayTasks() : TODAY_TASKS_RAW);
  const tasks = [...seed, ...(userTasks || [])].sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  // Compute remaining minutes for active task
  const [nowH, nowM] = currentTime.split(':').map(Number);
  const nowMins = nowH * 60 + nowM;

  // Empty state — no tasks for today
  if (tasks.length === 0) {
    return (
      <div style={{ paddingTop: 12, paddingBottom: 40 }}>
        <EmptyState theme={theme}
          icon="sparkle"
          title="Aún no tienes nada para hoy"
          body="¿Quieres anotar algo para hoy, esta semana o este mes? Empieza con una tarea simple."
          ctaLabel="Agendar mi primera tarea"
          onCta={onAdd}/>
      </div>
    );
  }

  // Section dividers by time-of-day for visual rhythm
  const sections = [
    { id: 'morning',   label: 'Mañana',   start: 0,    end: 12*60 },
    { id: 'afternoon', label: 'Tarde',    start: 12*60, end: 17*60 },
    { id: 'evening',   label: 'Noche',    start: 17*60, end: 24*60 },
  ];
  const groups = sections.map(s => ({
    ...s,
    items: tasks.filter(t => {
      const [h, m] = t.start.split(':').map(Number);
      return h*60+m >= s.start && h*60+m < s.end;
    }),
  })).filter(s => s.items.length);

  let rowIdx = 0;
  return (
    <div className="lo-stagger" style={{ paddingBottom: 120 }}>
      {groups.map((sec) => {
        const sectionHeader = (
          <div key={sec.id + '-h'} style={{ '--i': rowIdx++, padding: '10px 24px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 1.4, textTransform: 'uppercase' }}>{sec.label}</span>
            <div style={{ flex: 1, height: 0.5, background: theme.border }}/>
            <span style={{ fontSize: 10, color: theme.text3, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{sec.items.filter(t => t.kind !== 'break').length}</span>
          </div>
        );
        const rows = sec.items.map((t, i) => {
          if (t.kind === 'break') return <BreakRow key={t.id} task={t} theme={theme} dense={dense} />;
          const isLast = i === sec.items.length - 1;
          const isActive = t.status === 'doing';
          const isDone = t.status === 'done';
          const radius = blockShape === 'pill' ? 999 : blockShape === 'squircle' ? 26 : 22;
          const c = LIFE_PALETTE[t.color];
          const [eh, em] = t.end.split(':').map(Number);
          const remaining = isActive ? Math.max(0, (eh * 60 + em) - nowMins) : 0;
          return (
            <div key={t.id} style={{ '--i': rowIdx++, display: 'flex', gap: 12, padding: '0 16px', marginBottom: d.rowGap, opacity: isDone ? 0.5 : 1 }}>
              <div style={{ width: 54, flexShrink: 0, paddingTop: 8, textAlign: 'right' }}>
                <div style={{ fontSize: d.timeSize, color: isActive ? theme.accent : theme.text3, fontVariantNumeric: 'tabular-nums', fontWeight: isActive ? 700 : 500, letterSpacing: -0.2 }}>
                  {fmt12(t.start)}
                </div>
                <div style={{ fontSize: d.timeSize - 1, color: theme.text3, opacity: 0.55, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {fmt12(t.end)}
                </div>
              </div>
              <div style={{ position: 'relative', width: d.iconSize + 12, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute', top: 0, bottom: isLast ? 12 : -d.rowGap, left: '50%',
                  transform: 'translateX(-50%)',
                  width: d.iconSize + 8, borderRadius: radius,
                  background: isActive ? `linear-gradient(180deg, ${c.from}40 0%, ${c.to}20 100%)` : theme.surface,
                  border: `0.5px solid ${isActive ? c.to + '88' : theme.border}`,
                  boxShadow: isActive ? `0 0 0 4px ${c.to}11, 0 8px 24px ${c.to}22` : 'none',
                }}/>
                <div style={{ position: 'relative', paddingTop: 4 }}>
                  <LifeIcon name={t.icon} color={t.color} size={d.iconSize} shape={blockShape === 'pill' ? 'pill' : 'rounded'} />
                </div>
              </div>
              <button onClick={() => onOpenTask && onOpenTask(t)} className="lo-press" style={{
                flex: 1, minWidth: 0,
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: `${d.cardPad - 2}px 4px ${d.cardPad - 2}px 4px`,
                color: theme.text, fontFamily: 'inherit',
              }}>
                {isActive ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 3, paddingLeft: 4 }}>
                    <span className="lo-pulse" style={{
                      width: 6, height: 6, borderRadius: 3, background: theme.accent, flexShrink: 0,
                      '--pulse-c': theme.accent + '99', '--pulse-c-end': theme.accent + '00',
                    }}/>
                    <span style={{ fontSize: d.subSize, color: theme.accent, fontWeight: 700, letterSpacing: 0.2 }}>
                      {remaining}m restantes
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: d.subSize, color: theme.text2, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>
                    {fmt12(t.start)}–{fmt12(t.end)} <span style={{ opacity: 0.55 }}>({minutesBetween(t.start, t.end)} min)</span>
                  </div>
                )}
                <div style={{ fontSize: d.titleSize, fontWeight: 600, letterSpacing: -0.2, textDecoration: isDone ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>
                  {t.title}
                </div>
                {t.subtitle && !isDone && (
                  <div style={{ fontSize: d.subSize, color: theme.text2, marginTop: 3 }}>{t.subtitle}</div>
                )}
                {t.subtasks && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 10.5, color: theme.text3, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {t.subtasks.done}/{t.subtasks.total}
                    </span>
                    <div style={{ height: 3, flex: 1, maxWidth: 90, background: theme.rail, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(t.subtasks.done/t.subtasks.total)*100}%`, height: '100%', background: c.to }}/>
                    </div>
                  </div>
                )}
                {t.alarm && !isDone && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10.5, color: theme.text3 }}>
                    <UIIcon name="bell" size={11} color={theme.text3} strokeWidth={1.8}/> Recordatorio
                  </div>
                )}
              </button>
              <div style={{ paddingTop: 10, flexShrink: 0 }}>
                <StatusRing task={t} theme={theme}/>
              </div>
            </div>
          );
        });
        return [sectionHeader, ...rows];
      })}
    </div>
  );
}

function BreakRow({ task, theme, dense }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 16px 10px' }}>
      <div style={{ width: 54, flexShrink: 0 }}/>
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: theme.accentSoft,
        borderRadius: 14,
        border: `0.5px dashed ${theme.accent}55`,
      }}>
        <UIIcon name="coffee_break" size={18} color={theme.accent} strokeWidth={1.8}/>
        <div style={{ flex: 1, fontSize: 12, color: theme.text2 }}>
          <b style={{ color: theme.text, fontWeight: 600 }}>{task.minutes}m</b> {task.title.replace(/.*— /, '')}
        </div>
        {task.suggest && (
          <button style={{
            background: theme.accent, color: '#fff', border: 'none',
            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>+ Fill</button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// VARIANT 2: Cards — large rounded cards, no rail, vibrant icon
// ──────────────────────────────────────────────────────────────
function TimelineCards({ theme, dense, blockShape }) {
  const d = dense ? DENSITY.compact : DENSITY.comfy;
  return (
    <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {TODAY_TASKS.filter(t => t.kind !== 'break').map((t) => {
        const c = LIFE_PALETTE[t.color];
        const isActive = t.status === 'doing';
        return (
          <div key={t.id} style={{
            display: 'flex', gap: 14, alignItems: 'center',
            padding: 14,
            background: isActive
              ? `linear-gradient(135deg, ${c.from}22 0%, ${theme.surface} 60%)`
              : theme.surface,
            borderRadius: 22,
            border: `0.5px solid ${isActive ? c.to + '55' : theme.border}`,
            opacity: t.status === 'done' ? 0.5 : 1,
          }}>
            <LifeIcon name={t.icon} color={t.color} size={48} shape={blockShape === 'pill' ? 'pill' : blockShape === 'squircle' ? 'squircle' : 'rounded'}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: theme.text3, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                {fmt12(t.start)} · {minutesBetween(t.start, t.end)} min
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginTop: 2, letterSpacing: -0.2, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                {t.title}
              </div>
              {t.subtitle && <div style={{ fontSize: 12, color: theme.text2, marginTop: 2 }}>{t.subtitle}</div>}
            </div>
            <StatusRing task={t} theme={theme}/>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// VARIANT 3: Hourly grid — time blocks on an hour grid
// ──────────────────────────────────────────────────────────────
function TimelineHourly({ theme, dense, blockShape }) {
  const startH = 6, endH = 23;
  const px = 56; // px per hour
  const hours = [];
  for (let h = startH; h <= endH; h++) hours.push(h);

  const radius = blockShape === 'pill' ? 999 : blockShape === 'squircle' ? 22 : 18;

  return (
    <div style={{ position: 'relative', padding: '0 16px 120px' }}>
      <div style={{ position: 'relative', marginLeft: 48 }}>
        {/* hour grid */}
        {hours.map((h, i) => (
          <div key={h} style={{
            height: px, borderTop: `0.5px solid ${theme.border}`,
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', left: -44, top: -7,
              fontSize: 10.5, color: theme.text3, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
            }}>
              {h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}
            </span>
          </div>
        ))}
        {/* current time line */}
        <div style={{ position: 'absolute', left: -8, right: 0, top: (7.92 - startH) * px, height: 1, background: theme.accent, zIndex: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: theme.accent, position: 'absolute', left: -4, top: -4 }}/>
        </div>
        {/* tasks */}
        {TODAY_TASKS.filter(t => t.kind !== 'break').map((t) => {
          const [sh, sm] = t.start.split(':').map(Number);
          const top = (sh + sm/60 - startH) * px;
          const h = (minutesBetween(t.start, t.end) / 60) * px;
          const c = LIFE_PALETTE[t.color];
          return (
            <div key={t.id} style={{
              position: 'absolute', left: 6, right: 0,
              top, height: h - 2,
              background: `linear-gradient(135deg, ${c.from}28 0%, ${c.to}18 100%)`,
              border: `0.5px solid ${c.to}55`,
              borderRadius: radius,
              padding: '6px 10px',
              display: 'flex', alignItems: 'center', gap: 8,
              overflow: 'hidden',
              opacity: t.status === 'done' ? 0.45 : 1,
            }}>
              <LifeIcon name={t.icon} color={t.color} size={26} shape={blockShape}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                {h > 36 && <div style={{ fontSize: 10.5, color: theme.text2, fontVariantNumeric: 'tabular-nums' }}>{fmt12(t.start)}–{fmt12(t.end)}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// VARIANT 4: Minimal — type-led, no chrome
// ──────────────────────────────────────────────────────────────
function TimelineMinimal({ theme }) {
  return (
    <div style={{ padding: '0 24px 120px' }}>
      {TODAY_TASKS.filter(t => t.kind !== 'break').map((t) => {
        const c = LIFE_PALETTE[t.color];
        const isActive = t.status === 'doing';
        return (
          <div key={t.id} style={{
            display: 'flex', gap: 14, padding: '14px 0',
            borderBottom: `0.5px solid ${theme.border}`,
            opacity: t.status === 'done' ? 0.4 : 1,
          }}>
            <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: c.to, opacity: isActive ? 1 : 0.35 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, letterSpacing: 0.4, color: theme.text3, fontWeight: 600, textTransform: 'uppercase' }}>
                {fmt12(t.start)} — {fmt12(t.end)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: theme.text, letterSpacing: -0.3, marginTop: 2, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                {t.title}
              </div>
              {t.subtitle && <div style={{ fontSize: 12.5, color: theme.text2, marginTop: 2 }}>{t.subtitle}</div>}
            </div>
            <div style={{ paddingTop: 4 }}>
              <StatusRing task={t} theme={theme}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  TL_THEMES, DENSITY,
  TimelineTopBar, TimelineHeaderBody, TimelineHeader,
  QuickActionsRow,
  TimelineClassic, TimelineCards, TimelineHourly, TimelineMinimal,
  StatusRing, BreakRow, fmt12, minutesBetween,
});
