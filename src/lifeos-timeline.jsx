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
        <h1 className="lo-display" style={{ margin: '2px 0 0', fontSize: 32, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>
          {dayName} <span style={{ color: theme.accent }}>{dayNum}</span>
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
// Build real current week (Mon–Sun containing today), includes ISO dateStr for task filtering
function buildCurrentWeek() {
  const today = new Date();
  const todayD = today.getDate();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = loDateStr(d);
    return {
      d: d.getDate(), label: SHORT[d.getDay()], dateStr,
      today: d.getDate() === todayD && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
      dots: [],
    };
  });
}

function TimelineHeaderBody({ theme, userTasks }) {
  const todayStr = loDateStr();
  const tasks = (LOStore.tasksForDate(todayStr) || []).filter(t => t.kind !== 'break');
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const next = tasks.find(t => t.status === 'todo' || t.status === 'doing');

  const week = buildCurrentWeek();
  const weekWithDots = week.map(day => ({
    ...day,
    dots: (userTasks || []).filter(t => t.targetDate === day.dateStr).slice(0, 4).map(t => t.color),
    count: (userTasks || []).filter(t => t.targetDate === day.dateStr).length,
  }));

  const r = 30, C = 2 * Math.PI * r;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Premium progress card */}
      <div className="lo-slide-in" style={{
        borderRadius: 24, position: 'relative', overflow: 'hidden',
        background: total > 0
          ? `linear-gradient(145deg, ${theme.accent}1C 0%, ${theme.accentSoft} 100%)`
          : theme.surface,
        border: `0.5px solid ${total > 0 ? theme.accent + '55' : theme.border}`,
        padding: '16px',
        boxShadow: total > 0
          ? `0 8px 32px ${theme.accent}18, inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 2px 8px rgba(0,0,0,0.14)`,
      }}>
        {total > 0 && (
          <div style={{
            position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.accent}1E 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}/>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Big progress ring */}
          <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r={r} stroke={theme.rail} strokeWidth="5" fill="none"/>
              {total > 0 && (
                <circle cx="34" cy="34" r={r} stroke={theme.accent} strokeWidth="5" fill="none"
                  strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
                  strokeLinecap="round" transform="rotate(-90 34 34)"
                  style={{ transition: 'stroke-dashoffset .8s var(--ease-out-quart)' }}/>
              )}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {total > 0 ? (
                <>
                  <span style={{ fontSize: 17, fontWeight: 800, color: theme.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pct}</span>
                  <span style={{ fontSize: 9, color: theme.text3, fontWeight: 700, marginTop: 1 }}>%</span>
                </>
              ) : (
                <UIIcon name="sparkle" size={22} color={theme.text3} strokeWidth={1.5}/>
              )}
            </div>
          </div>

          {/* Text side */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {total > 0 ? (
              <>
                <div className="lo-display" style={{ fontSize: 24, fontWeight: 600, color: theme.text, letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {done} <span style={{ fontSize: 14, color: theme.text2, fontWeight: 500, fontFamily: 'var(--font-ui)' }}>de {total} {total === 1 ? 'tarea' : 'tareas'}</span>
                </div>
                <div style={{ marginTop: 8, height: 3, background: theme.rail, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `linear-gradient(90deg, ${theme.accent}AA, ${theme.accent})`,
                    borderRadius: 2, transition: 'width .8s var(--ease-out-quart)',
                  }}/>
                </div>
                {next ? (
                  <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, background: theme.accent + '22', color: theme.accent, fontWeight: 700, letterSpacing: 0.4, flexShrink: 0 }}>SIGUE</span>
                    <span style={{ fontSize: 12, color: theme.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{next.title}</span>
                  </div>
                ) : done === total && total > 0 ? (
                  <div style={{ marginTop: 7, fontSize: 12, color: theme.accent, fontWeight: 600 }}>¡Todo listo para hoy!</div>
                ) : null}
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>Tu día empieza aquí</div>
                <div style={{ fontSize: 12.5, color: theme.text2, marginTop: 4, lineHeight: 1.4 }}>
                  Toca <span style={{ fontWeight: 700, color: theme.accent }}>+</span> para añadir tu primera tarea de hoy.
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Week strip with per-day task dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        {weekWithDots.map((day) => (
          <button key={day.d + day.label} className="lo-press" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 40, padding: 0,
          }}>
            <span style={{ fontSize: 10, color: day.today ? theme.accent : theme.text3, fontWeight: 600, letterSpacing: 0.3 }}>{day.label}</span>
            <div style={{
              width: 34, height: 34, borderRadius: 17,
              background: day.today ? theme.accent : 'transparent',
              color: day.today ? '#fff' : theme.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14.5, fontWeight: day.today ? 700 : 500,
              boxShadow: day.today ? `0 4px 14px ${theme.accent}66` : 'none',
              border: day.count > 0 && !day.today ? `1.5px solid ${theme.border}` : 'none',
              transition: 'all .2s var(--ease-out-back)',
            }}>{day.d}</div>
            <div style={{ display: 'flex', gap: 2, height: 5 }}>
              {day.dots.slice(0, 3).map((color, k) => (
                <div key={k} style={{
                  width: 4, height: 4, borderRadius: 2,
                  background: day.today ? 'rgba(255,255,255,0.7)' : (LIFE_PALETTE[color] || LIFE_PALETTE.coral).to,
                }}/>
              ))}
              {day.dots.length === 0 && <div style={{ width: 4, height: 4 }}/>}
            </div>
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
  return (
    <div style={{ display: 'flex', gap: 10, padding: '0 20px 16px', overflowX: 'auto' }}>
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
          Crear acceso
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
function TimelineClassic({ theme, dense, blockShape, currentTime = '07:55', onOpenTask, onAdd, onToggle, userTasks }) {
  const d = dense ? DENSITY.compact : DENSITY.comfy;
  // Pull today's concrete tasks straight from the store so recurring
  // templates expand into occurrences and completions stay in sync.
  const todayStr = loDateStr();
  const all = (LOStore.tasksForDate(todayStr) || []);
  // All-day tasks have no time slot — they ride a pill row above the timeline.
  const allDayTasks = all.filter(t => t.allDay);
  const tasks = all.filter(t => !t.allDay);

  // Compute remaining minutes for active task
  const [nowH, nowM] = currentTime.split(':').map(Number);
  const nowMins = nowH * 60 + nowM;

  // Empty state — nothing scheduled today (timed or all-day)
  if (tasks.length === 0 && allDayTasks.length === 0) {
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
      {allDayTasks.length > 0 && (
        <div style={{ '--i': rowIdx++, padding: '4px 16px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 1.4, textTransform: 'uppercase', margin: '0 8px 8px' }}>Todo el día</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allDayTasks.map((t) => {
              const c = LIFE_PALETTE[t.color] || LIFE_PALETTE.coral;
              const isDone = t.status === 'done';
              return (
                <div key={t.id} role="button" tabIndex={0} onClick={() => onOpenTask && onOpenTask(t)} className="lo-press" style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '8px 13px 8px 9px', borderRadius: 13, opacity: isDone ? 0.5 : 1,
                  background: `linear-gradient(135deg, ${c.from}26, ${c.to}1a)`,
                  border: `0.5px solid ${c.to}3a`,
                }}>
                  <LifeIcon name={t.icon} color={t.color} size={26} shape={blockShape === 'pill' ? 'pill' : 'rounded'}/>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
          const isActive = t.status === 'doing';
          const isDone = t.status === 'done';
          const c = LIFE_PALETTE[t.color];
          const [eh, em] = t.end.split(':').map(Number);
          const remaining = isActive ? Math.max(0, (eh * 60 + em) - nowMins) : 0;
          // Compact time string: "9:30a" instead of "9:30 AM"
          const shortTime = (hhmm) => fmt12(hhmm).replace(' AM','a').replace(' PM','p');
          return (
            <div key={t.id} style={{ '--i': rowIdx++, display: 'flex', gap: 8, padding: '0 16px', marginBottom: d.rowGap + 6, opacity: isDone ? 0.5 : 1 }}>
              {/* Slim time column */}
              <div style={{ width: 38, flexShrink: 0, paddingTop: 16, textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: isActive ? theme.accent : theme.text3, fontVariantNumeric: 'tabular-nums', fontWeight: isActive ? 700 : 500, letterSpacing: -0.2, lineHeight: 1.2 }}>
                  {shortTime(t.start)}
                </div>
              </div>
              {/* Full-width card with colored left accent bar (div so the
                  status ring can be its own button — no nested buttons) */}
              <div role="button" tabIndex={0} onClick={() => onOpenTask && onOpenTask(t)} className="lo-press" style={{
                flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 12px 12px 14px',
                background: isActive
                  ? `linear-gradient(135deg, ${c.from}1E 0%, ${c.to}0F 100%)`
                  : theme.surface,
                borderRadius: 20,
                border: `0.5px solid ${isActive ? c.to + '66' : theme.border}`,
                borderLeft: `3.5px solid ${isActive ? c.to : c.to + 'AA'}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: theme.text,
                boxShadow: isActive
                  ? `0 6px 24px ${c.to}28, inset 0 1px 0 rgba(255,255,255,0.06)`
                  : `0 2px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.04)`,
                transition: 'all .2s var(--ease-smooth)',
              }}>
                <LifeIcon name={t.icon} color={t.color} size={d.iconSize} shape={blockShape === 'pill' ? 'pill' : 'rounded'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isActive ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span className="lo-pulse" style={{
                        width: 5, height: 5, borderRadius: 3, background: theme.accent, flexShrink: 0,
                        '--pulse-c': theme.accent + '99', '--pulse-c-end': theme.accent + '00',
                      }}/>
                      <span style={{ fontSize: 10.5, color: theme.accent, fontWeight: 700, letterSpacing: 0.3 }}>
                        {remaining}m restantes
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10.5, color: theme.text3, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>
                      {minutesBetween(t.start, t.end)} min
                    </div>
                  )}
                  <div style={{ fontSize: d.titleSize, fontWeight: 600, letterSpacing: -0.2, color: theme.text, textDecorationLine: isDone ? 'line-through' : 'none', textDecorationColor: theme.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                  {t.subtitle && !isDone && (
                    <div style={{ fontSize: d.subSize, color: theme.text2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subtitle}</div>
                  )}
                  {(() => {
                    const prog = loSubProgress(t);
                    if (!prog) return null;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                        <div style={{ height: 3, flex: 1, maxWidth: 80, background: theme.rail, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${(prog.done / prog.total) * 100}%`, height: '100%', background: c.to }}/>
                        </div>
                        <span style={{ fontSize: 10, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>
                          {prog.done}/{prog.total}
                        </span>
                      </div>
                    );
                  })()}
                  {t.alarm && !isDone && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: theme.text3 }}>
                      <UIIcon name="bell" size={10} color={theme.text3} strokeWidth={1.8}/> Recordatorio
                    </div>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggle && onToggle(t.id); }} className="lo-press"
                  title={isDone ? 'Reabrir' : 'Completar'} style={{
                    background: 'transparent', border: 'none', padding: 4, margin: -4, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <StatusRing task={t} theme={theme}/>
                </button>
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
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginTop: 2, letterSpacing: -0.2, textDecorationLine: t.status === 'done' ? 'line-through' : 'none' }}>
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
              <div style={{ fontSize: 17, fontWeight: 600, color: theme.text, letterSpacing: -0.3, marginTop: 2, textDecorationLine: t.status === 'done' ? 'line-through' : 'none' }}>
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
