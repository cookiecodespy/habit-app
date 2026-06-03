// lifeos-screens.jsx — auxiliary screens (Month, Week, Create, Detail, Onboarding, AI, Settings, Inbox, Stats)

// Reusable: bottom tab bar — solid background, pill indicator, safe-area aware
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
      background: theme.bg,
      borderTop: `0.5px solid ${theme.border}`,
      zIndex: 10,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0 0' }}>
        {tabs.map(t => {
          const active = current === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} className="lo-press" style={{
              flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '0 2px 10px', fontFamily: 'inherit',
            }}>
              <div style={{
                width: active ? 42 : 32, height: 32, borderRadius: 12,
                background: active ? theme.accentSoft : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .25s var(--ease-out-back)',
              }}>
                <UIIcon name={t.icon} size={21} color={active ? theme.accent : theme.text3} strokeWidth={active ? 2.2 : 1.7}/>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500, color: active ? theme.accent : theme.text3, letterSpacing: 0.1 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// FAB
function FAB({ theme, onClick }) {
  return (
    <button onClick={onClick} className="lo-press lo-scale-in" style={{
      position: 'absolute', right: 20,
      bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 4px) + 84px)',
      zIndex: 11,
      width: 58, height: 58, borderRadius: 29,
      background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent}CC)`,
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 10px 30px ${theme.accent}77, 0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
      transition: 'transform .2s var(--ease-out-back)',
    }}>
      <UIIcon name="plus" size={25} color="#fff" strokeWidth={2.5}/>
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
function MonthScreen({ theme, onBack, embedded = false, onOpenTask, onAdd, userTasks = [] }) {
  const _today = new Date();
  const _ty = _today.getFullYear(), _tm = _today.getMonth(), _td = _today.getDate();
  const [yyMm, setYyMm] = React.useState({ y: _ty, m: _tm });
  const [selected, setSelected] = React.useState(_td);
  const [filter, setFilter] = React.useState('todo');   // 'todo' | 'vida' | 'trabajo' | 'uni'
  const [scope, setScope] = React.useState('day');      // 'day' | 'month'
  const cells = React.useMemo(() => buildMonth(yyMm.y, yyMm.m), [yyMm.y, yyMm.m]);
  const catMatch = (t) => filter === 'todo' || t.category === filter;

  const goPrev = () => setYyMm(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });
  const goNext = () => setYyMm(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });

  const dotsFor = (day) => {
    const dateStr = `${yyMm.y}-${String(yyMm.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return LOStore.tasksForDate(dateStr).filter(t => t.kind !== 'break').slice(0, 5).map(t => t.color);
  };
  const tasksForSelected = React.useMemo(() => {
    const dateStr = `${yyMm.y}-${String(yyMm.m + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}`;
    return LOStore.tasksForDate(dateStr);
  }, [userTasks, yyMm.y, yyMm.m, selected]);

  // Every day of the month that has tasks, grouped → the bank-style list.
  const monthGroups = React.useMemo(() => {
    const daysInMonth = new Date(yyMm.y, yyMm.m + 1, 0).getDate();
    const groups = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yyMm.y}-${String(yyMm.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const tasks = LOStore.tasksForDate(dateStr);
      if (tasks.length) groups.push({ day, dateStr, tasks });
    }
    return groups;
  }, [userTasks, yyMm.y, yyMm.m]);

  const dayList = tasksForSelected.filter(catMatch);
  const monthFiltered = monthGroups.map(g => ({ ...g, tasks: g.tasks.filter(catMatch) })).filter(g => g.tasks.length);
  const monthCount = monthFiltered.reduce((n, g) => n + g.tasks.length, 0);
  const goToDay = (dateStr) => { const day = Number(dateStr.split('-')[2]); setSelected(day); setScope('day'); };

  return (
    <div>
      {!embedded && <ScreenTopBar theme={theme} title="Agenda" onBack={onBack}/>}

      <div style={{ padding: '0 18px' }}>
        {/* Header: month nav + Today pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: embedded ? 2 : 0, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 className="lo-display" style={{ margin: 0, fontSize: 30, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>
              {MONTH_NAMES[yyMm.m]}
            </h2>
            <span className="lo-display" style={{ fontSize: 28, fontWeight: 400, letterSpacing: -0.4, color: theme.text3 }}>{yyMm.y}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => { setYyMm({ y: _ty, m: _tm }); setSelected(_td); }}
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
            const isToday = c.inMonth && yyMm.y === _ty && yyMm.m === _tm && c.d === _td;
            const isSelected = c.inMonth && c.d === selected;
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

        {/* Día / Mes scope toggle */}
        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 12, background: theme.bg2 || theme.surface, marginTop: 18 }}>
          {[['day', 'Día'], ['month', 'Todo el mes']].map(([id, label]) => (
            <button key={id} onClick={() => setScope(id)} className="lo-press" style={{
              flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 9, fontFamily: 'inherit',
              background: scope === id ? theme.surface : 'transparent',
              color: scope === id ? theme.text : theme.text3,
              fontSize: 13, fontWeight: 600, letterSpacing: -0.2,
              boxShadow: scope === id ? '0 1px 3px rgba(0,0,0,0.22)' : 'none',
              transition: 'background .18s, color .18s',
            }}>{label}</button>
          ))}
        </div>

        {/* Theme filter chips */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '12px 0 4px', marginLeft: -2, marginRight: -2 }}>
          {[{ id: 'todo', label: 'Todo', color: theme.accentRaw || 'coral' }, ...LO_CATEGORIES].map(cat => {
            const active = filter === cat.id;
            const cc = LIFE_PALETTE[cat.color] || { from: theme.accent, to: theme.accent };
            return (
              <button key={cat.id} onClick={() => setFilter(cat.id)} className="lo-press" style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 700 : 500,
                color: active ? '#fff' : theme.text2,
                background: active ? `linear-gradient(135deg, ${cc.from}, ${cc.to})` : theme.surface,
                border: `1px solid ${active ? 'transparent' : theme.border}`,
                boxShadow: active ? `0 3px 10px ${cc.to}4d` : 'none',
                transition: 'all .18s var(--ease-out-back)',
              }}>
                {cat.id !== 'todo' && <span style={{ width: 7, height: 7, borderRadius: 4, background: active ? 'rgba(255,255,255,0.92)' : cc.to }}/>}
                {cat.label}
              </button>
            );
          })}
        </div>

        {scope === 'day' ? (
          <>
            {/* Selected day header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  {selectedDayLabel(yyMm.y, yyMm.m, selected)}
                </div>
                <div className="lo-display" style={{ fontSize: 22, fontWeight: 600, color: theme.text, letterSpacing: -0.4, marginTop: 2 }}>
                  {MONTH_NAMES[yyMm.m]} {selected}
                </div>
              </div>
              <span style={{ fontSize: 12, color: theme.text2, fontWeight: 500 }}>
                {dayList.length} {dayList.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dayList.map(t => (
                <AgendaTaskRow key={t.id} task={t} theme={theme} onClick={() => onOpenTask && onOpenTask(t)}/>
              ))}
              {dayList.length === 0 && (
                <EmptyState theme={theme}
                  icon="sparkle"
                  title={filter === 'todo' ? 'Nada agendado para este día' : `Nada de ${LO_CAT_BY_ID[filter].label.toLowerCase()} este día`}
                  body={filter === 'todo' ? 'Tómate el día libre o añade tu primera tarea.' : 'Prueba otro tema o cambia a “Todo el mes”.'}
                  ctaLabel="+ Añadir tarea"
                  onCta={onAdd || (() => {})}/>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Month total */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8, marginBottom: 6 }}>
              <div className="lo-display" style={{ fontSize: 18, fontWeight: 600, color: theme.text, letterSpacing: -0.3 }}>
                Todo {MONTH_NAMES[yyMm.m]}
              </div>
              <span style={{ fontSize: 12, color: theme.text2, fontWeight: 500 }}>
                {monthCount} {monthCount === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>

            {monthFiltered.length === 0 ? (
              <EmptyState theme={theme} icon="sparkle"
                title={filter === 'todo' ? 'Nada agendado este mes' : `Sin tareas de ${LO_CAT_BY_ID[filter].label.toLowerCase()}`}
                body="Lo que agendes este mes aparecerá aquí, ordenado por día."
                ctaLabel="+ Añadir tarea" onCta={onAdd || (() => {})}/>
            ) : (
              <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {monthFiltered.map((g, gi) => {
                  const [yy, mm, dd] = g.dateStr.split('-').map(Number);
                  const wd = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][new Date(yy, mm - 1, dd).getDay()];
                  const isToday = yy === _ty && mm - 1 === _tm && dd === _td;
                  return (
                    <div key={g.dateStr} style={{ '--i': gi }}>
                      {/* Date header — the recurring "rule line" motif */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 2px 8px' }}>
                        <span className="lo-display" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase',
                          color: isToday ? theme.accent : theme.text2 }}>
                          {wd} {dd} {MONTH_NAMES[mm - 1].slice(0, 3)}{isToday ? ' · hoy' : ''}
                        </span>
                        <div style={{ flex: 1, height: 0.5, background: theme.border }}/>
                        <span style={{ fontSize: 11, color: theme.text3, fontVariantNumeric: 'tabular-nums' }}>{g.tasks.length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {g.tasks.map(t => (
                          <AgendaTaskRow key={t.id} task={t} theme={theme} showChevron onClick={() => goToDay(g.dateStr)}/>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
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

function AgendaTaskRow({ task, theme, onClick, showChevron }) {
  const cat = task.category && LO_CAT_BY_ID[task.category];
  const catC = cat && LIFE_PALETTE[cat.color];
  const timeLabel = task.allDay
    ? 'Todo el día'
    : `${fmt12(task.start)} · ${Math.round((parseInt(task.end.split(':')[0]) * 60 + parseInt(task.end.split(':')[1])) - (parseInt(task.start.split(':')[0]) * 60 + parseInt(task.start.split(':')[1])))} min`;
  return (
    <button onClick={onClick} className="lo-press" style={{
      display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px 10px 0',
      background: theme.surface, border: `0.5px solid ${theme.border}`,
      borderRadius: 14, cursor: 'pointer', textAlign: 'left', color: theme.text, overflow: 'hidden',
      opacity: task.status === 'done' ? 0.55 : 1,
    }}>
      {/* Theme accent bar — colour-coded "rule" down the left edge */}
      <div style={{ width: 3.5, alignSelf: 'stretch', flexShrink: 0,
        background: catC ? `linear-gradient(${catC.from}, ${catC.to})` : 'transparent', borderRadius: 2 }}/>
      <LifeIcon name={task.icon} color={task.color} size={34} shape="rounded"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, letterSpacing: -0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textDecorationLine: task.status === 'done' ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>{task.title}</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span>{timeLabel}</span>
          {cat && <span style={{ color: catC.to, fontWeight: 600 }}>· {cat.label}</span>}
        </div>
      </div>
      {showChevron ? <UIIcon name="chevronR" size={15} color={theme.text3}/> : <StatusRing task={task} theme={theme}/>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// Week screen — 7-day swimlanes
// ──────────────────────────────────────────────────────────────
function WeekScreen({ theme, onOpenTask, userTasks = [] }) {
  const [weekOffset, setWeekOffset] = React.useState(0);
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Monday (Mon-first, matching MonthScreen) of the visible week.
  const monday = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const dow = (t.getDay() + 6) % 7; // 0 = Monday
    t.setDate(t.getDate() - dow + weekOffset * 7);
    return t;
  }, [weekOffset]);

  const todayStr = loDateStr();
  const week = React.useMemo(() => (
    Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = loDateStr(d);
      return {
        dateStr,
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        tasks: LOStore.tasksForDate(dateStr).filter(t => t.kind !== 'break' && !t.allDay),
      };
    })
  ), [monday, todayStr, userTasks]);

  const monthLabel = monday.toLocaleDateString('es-CL', { month: 'long' });
  const rangeLabel = `${monday.getDate()} – ${week[6].dayNum} ${monthLabel}`;
  const empty = week.every(d => d.tasks.length === 0);

  const startH = 6, endH = 23, hPx = 20, span = endH - startH;

  return (
    <div className="lo-fade">
      {/* week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
        <CalChev theme={theme} dir="left" onClick={() => setWeekOffset(o => o - 1)}/>
        <button onClick={() => setWeekOffset(0)} className="lo-press" style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 10px',
        }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, letterSpacing: -0.2, textTransform: 'capitalize' }}>{rangeLabel}</span>
        </button>
        <CalChev theme={theme} dir="right" onClick={() => setWeekOffset(o => o + 1)}/>
      </div>

      <div style={{ padding: '0 10px' }}>
        {/* day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '26px repeat(7, 1fr)', gap: 3 }}>
          <div/>
          {week.map((d, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 600 }}>{dayLabels[i]}</div>
              <div style={{
                fontSize: 12.5, fontWeight: d.isToday ? 700 : 500,
                color: d.isToday ? '#fff' : theme.text,
                background: d.isToday ? theme.accent : 'transparent',
                width: 21, height: 21, borderRadius: 11, margin: '2px auto 0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}>{d.dayNum}</div>
            </div>
          ))}
        </div>

        {/* swimlanes with real tasks */}
        <div style={{ display: 'grid', gridTemplateColumns: '26px repeat(7, 1fr)', gap: 3, marginTop: 12, position: 'relative' }}>
          {/* hour rail */}
          <div>
            {Array.from({ length: span + 1 }).map((_, i) => (
              <div key={i} style={{ height: hPx, fontSize: 8.5, color: theme.text3, lineHeight: 1, textAlign: 'right', paddingRight: 3 }}>
                {startH + i === 12 ? '12p' : startH + i > 12 ? `${startH + i - 12}p` : `${startH + i}a`}
              </div>
            ))}
          </div>
          {week.map((d, di) => (
            <div key={di} style={{
              position: 'relative', borderLeft: `0.5px solid ${theme.border}`,
              background: d.isToday ? `${theme.accent}0d` : 'transparent',
            }}>
              {Array.from({ length: span + 1 }).map((_, hi) => (
                <div key={hi} style={{ height: hPx, borderTop: `0.5px solid ${theme.border}` }}/>
              ))}
              {d.tasks.map((t) => {
                const c = LIFE_PALETTE[t.color] || LIFE_PALETTE.coral;
                const top = ((loHHMMtoMin(t.start) / 60) - startH) * hPx;
                const h = (Math.max(20, minutesBetween(t.start, t.end)) / 60) * hPx;
                if (top + h < 0 || top > span * hPx) return null;
                return (
                  <button key={t.id} onClick={() => onOpenTask && onOpenTask(t)} className="lo-press" title={`${t.start} · ${t.title}`} style={{
                    position: 'absolute', left: 1.5, right: 1.5,
                    top: Math.max(0, top), height: Math.max(7, h - 1.5),
                    background: `linear-gradient(135deg, ${c.from}66, ${c.to}88)`,
                    borderRadius: 5, border: 'none', cursor: 'pointer', padding: 0,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18)`,
                    opacity: t.status === 'done' ? 0.4 : 1,
                  }}/>
                );
              })}
            </div>
          ))}
        </div>

        {empty && (
          <div style={{ textAlign: 'center', color: theme.text3, fontSize: 12.5, padding: '22px 0 8px' }}>
            Nada agendado esta semana.
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Calendar tab — segmented Month / Week switch over a shared header
// ──────────────────────────────────────────────────────────────
function CalendarScreen({ theme, onBack, embedded = false, onOpenTask, onAdd, userTasks = [] }) {
  const [view, setView] = React.useState('month');
  const seg = (id, label) => (
    <button key={id} onClick={() => setView(id)} className="lo-press" style={{
      flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 9,
      background: view === id ? theme.surface : 'transparent',
      color: view === id ? theme.text : theme.text3,
      fontSize: 13, fontWeight: 600, letterSpacing: -0.2,
      boxShadow: view === id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
      transition: 'background 0.18s, color 0.18s',
    }}>{label}</button>
  );
  return (
    <div>
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', gap: 3, padding: 3, borderRadius: 12, background: theme.bg2 || theme.border }}>
          {seg('month', 'Mes')}
          {seg('week', 'Semana')}
        </div>
      </div>
      {view === 'month'
        ? <MonthScreen theme={theme} onBack={onBack} embedded onOpenTask={onOpenTask} onAdd={onAdd} userTasks={userTasks}/>
        : <WeekScreen theme={theme} onOpenTask={onOpenTask} userTasks={userTasks}/>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Create / Edit Task — premium immersive modal
// Hero gradient · date picker · visual time ribbon · priority
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
  const COLOR_LABELS = { coral:'Coral', amber:'Ámbar', rose:'Rosa', mint:'Menta', sky:'Cielo', lavender:'Lavanda', lime:'Lima', teal:'Verde', plum:'Ciruela', sun:'Sol', ember:'Fuego', slate:'Pizarra' };
  const PRIORITIES = [
    { id: 'low',    label: 'Baja',  color: 'mint' },
    { id: 'medium', label: 'Media', color: 'amber' },
    { id: 'high',   label: 'Alta',  color: 'coral' },
  ];

  const [pickedColor, setColor] = React.useState('mint');
  const [pickedIcon, setIcon] = React.useState('sparkle');
  const [iconCat, setIconCat] = React.useState('all');
  const [title, setTitle] = React.useState('');
  const [subtitle, setSub] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [selectedDate, setSelectedDate] = React.useState(() => loDateStr());
  const [showCal, setShowCal] = React.useState(false);
  const [calCursor, setCalCursor] = React.useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [priority, setPriority] = React.useState('medium');
  const [showChecklist, setShowChecklist] = React.useState(false);

  const [reminderOn, setReminder] = React.useState(false);
  const [repeatOn, setRepeat] = React.useState(false);
  const [allDayOn, setAllDay] = React.useState(false);
  const [deadline, setDeadline] = React.useState(null); // 'YYYY-MM-DD' hard due date
  const [category, setCategory] = React.useState(null); // Agenda theme
  const [catTouched, setCatTouched] = React.useState(false);
  const [subtasks, setSubtasks] = React.useState([]);

  // Auto-suggest the theme from the title until the user picks one by hand.
  React.useEffect(() => {
    if (!catTouched) setCategory(loGuessCategory(title));
  }, [title, catTouched]);

  const iconList = ICON_CATEGORIES.find(cat => cat.id === iconCat).icons;
  const c = LIFE_PALETTE[pickedColor];

  // Start time as "HH:MM" string — native <input type="time"> drives it on iOS (opens wheel picker)
  const defaultStartTime = React.useMemo(() => {
    const n = new Date();
    const total = n.getHours() * 60 + n.getMinutes();
    const rounded = Math.ceil(total / 30) * 30;
    const h = Math.floor(rounded / 60) % 24, m = rounded % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }, []);
  const [startTime, setStartTime] = React.useState(defaultStartTime);
  const startMins = React.useMemo(() => {
    const [h, m] = startTime.split(':').map(Number);
    return h * 60 + m;
  }, [startTime]);
  const endTime = React.useMemo(() => {
    const total = (startMins + duration) % (24 * 60);
    const h = Math.floor(total / 60), m = total % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }, [startMins, duration]);
  const endMins = startMins + duration;

  // 14-day scrollable date strip
  const dateStrip = React.useMemo(() => {
    const _today = new Date();
    const DAY_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const MON_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return Array.from({ length: 14 }, (_, off) => {
      const d = new Date(_today);
      d.setDate(_today.getDate() + off);
      return {
        off,
        dow: off === 0 ? 'Hoy' : off === 1 ? 'Mañ' : DAY_SHORT[d.getDay()],
        day: d.getDate(),
        mon: (off === 0 || d.getDate() === 1) ? MON_SHORT[d.getMonth()] : null,
        // Resolve the absolute date NOW (when the strip is built), so crossing
        // midnight between opening Create and saving can't shift it by a day.
        dateStr: loDateStr(d),
      };
    });
  }, []);

  const fmtMin = (m) => {
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2,'0')} ${ap}`;
  };

  // Human label for any absolute date string — Hoy / Mañana / "Vie 6 Jun"
  const DOW_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MON_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const MON_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const fmtDateLabel = (ds) => {
    if (ds === loDateStr()) return 'Hoy';
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    if (ds === loDateStr(tm)) return 'Mañana';
    const [y, m, d] = ds.split('-').map(Number);
    const dd = new Date(y, m - 1, d);
    return `${DOW_SHORT[dd.getDay()]} ${d} ${MON_SHORT[m - 1]}`;
  };

  // Month grid for the "pick any date" calendar (Mon-first, leading blanks)
  const calCells = React.useMemo(() => {
    const { y, m } = calCursor;
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
    const total = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(loDateStr(new Date(y, m, d)));
    return cells;
  }, [calCursor]);
  const moveMonth = (delta) => setCalCursor(({ y, m }) => {
    const nm = m + delta;
    return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });

  const RIBBON_START = 6 * 60, RIBBON_END = 24 * 60, RIBBON_SPAN = RIBBON_END - RIBBON_START;
  const blockLeft = Math.max(0, ((startMins - RIBBON_START) / RIBBON_SPAN) * 100);
  const blockWidth = Math.min(100 - blockLeft, (duration / RIBBON_SPAN) * 100);

  return (
    <div data-screen-label="Create Task" style={{ position: 'relative', minHeight: '100%', background: theme.bg }}>
      {/* ─── HERO — dark ground, colour used as focused light not a flat fill ─── */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: 26, background: theme.bg }}>
        {/* Aura: a soft halo of the picked colour behind the icon */}
        <div style={{ position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)', width: 480, height: 380, pointerEvents: 'none',
          background: `radial-gradient(58% 58% at 50% 42%, ${c.to}5e 0%, ${c.from}24 36%, transparent 72%)` }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 140, pointerEvents: 'none',
          background: `linear-gradient(180deg, ${c.to}1c 0%, transparent 100%)` }}/>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 54, padding: '0 16px', position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} className="lo-press" style={{
            width: 36, height: 36, borderRadius: 18, cursor: 'pointer',
            background: theme.surfaceHi, border: `0.5px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UIIcon name="x" size={16} color={theme.text2} strokeWidth={2.5}/>
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.text3, letterSpacing: 1.6, textTransform: 'uppercase' }}>Nueva tarea</span>
          <div style={{ width: 36 }}/>
        </div>

        {/* Icon tile — layered aura + drop shadow for real depth */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, paddingBottom: 4, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -16, borderRadius: 34, background: `radial-gradient(circle, ${c.to}66 0%, transparent 68%)`, filter: 'blur(10px)', pointerEvents: 'none' }}/>
            <div style={{ position: 'relative', filter: `drop-shadow(0 20px 36px ${c.to}80)` }}>
              <LifeIcon name={pickedIcon} color={pickedColor} size={90} shape="squircle"/>
            </div>
          </div>
        </div>

        {/* Title + note inputs */}
        <div style={{ padding: '12px 24px 0', position: 'relative', zIndex: 2 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la tarea"
            autoFocus
            style={{
              display: 'block', width: '100%',
              background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', fontSize: 26, fontWeight: 700, color: theme.text,
              letterSpacing: -0.6, fontFamily: 'inherit', caretColor: c.to,
            }}
          />
          <input
            value={subtitle}
            onChange={(e) => setSub(e.target.value)}
            placeholder="Añade una nota…"
            style={{
              display: 'block', width: '100%', marginTop: 7,
              background: 'transparent', border: 'none', outline: 'none',
              textAlign: 'center', fontSize: 13.5, color: theme.text3,
              fontFamily: 'inherit', caretColor: c.to,
            }}
          />
        </div>

        {/* Selected date + time badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, position: 'relative', zIndex: 2 }}>
          <div style={{
            background: theme.surfaceHi, border: `0.5px solid ${theme.border}`, borderRadius: 999,
            padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <UIIcon name="calendar" size={12} color={c.to}/>
            <span style={{ fontSize: 12.5, color: theme.text, fontWeight: 600, letterSpacing: -0.1, fontVariantNumeric: 'tabular-nums' }}>
              {fmtDateLabel(selectedDate)}{!allDayOn && ` · ${fmtMin(startMins)}`}
            </span>
          </div>
        </div>
      </div>

      {/* ─── BODY — clean sections ─── */}
      <div style={{ paddingBottom: 120 }}>

        {/* ── Fecha — 14-day horizontal strip ── */}
        <div style={{ padding: '18px 0 16px', borderBottom: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
            <SectionTitle theme={theme} accent={c.to}>¿Para cuándo?</SectionTitle>
            <button onClick={() => { setShowCal(v => !v); const [y, m] = selectedDate.split('-').map(Number); setCalCursor({ y, m: m - 1 }); }}
              className="lo-press" style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
                background: showCal ? c.to : theme.surfaceHi, border: `1px solid ${showCal ? 'transparent' : theme.border}`,
                borderRadius: 999, padding: '5px 11px',
                color: showCal ? '#fff' : theme.accent, fontSize: 12, fontWeight: 700,
                transition: 'all .18s var(--ease-smooth)',
              }}>
              <UIIcon name="calendar" size={13} color={showCal ? '#fff' : theme.accent}/>
              {fmtDateLabel(selectedDate)}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 20px 6px', WebkitOverflowScrolling: 'touch' }}>
            {dateStrip.map(({ off, dow, day, mon, dateStr }) => {
              const active = selectedDate === dateStr;
              return (
                <button key={off} onClick={() => setSelectedDate(dateStr)} className="lo-press" style={{
                  flexShrink: 0, width: 58, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 4px 10px',
                  borderRadius: 20,
                  background: active ? `linear-gradient(145deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                  border: `1.5px solid ${active ? 'transparent' : theme.border}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: active ? `0 6px 20px ${c.to}55` : 'none',
                  transition: 'all .22s var(--ease-smooth)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'rgba(255,255,255,0.82)' : theme.text3, letterSpacing: 0.4 }}>{dow}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: active ? '#fff' : theme.text, letterSpacing: -0.5, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{day}</span>
                  {mon && <span style={{ fontSize: 9, fontWeight: 700, color: active ? 'rgba(255,255,255,0.68)' : theme.text3, marginTop: 2, letterSpacing: 0.5 }}>{mon}</span>}
                </button>
              );
            })}
          </div>

          {showCal && (
            <div className="lo-fade" style={{ padding: '16px 20px 4px' }}>
              <div style={{
                background: theme.surface, border: `0.5px solid ${theme.border}`,
                borderRadius: 20, padding: '14px 14px 10px',
              }}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <button onClick={() => moveMonth(-1)} className="lo-press" style={{
                    width: 32, height: 32, borderRadius: 10, background: theme.surfaceHi,
                    border: `1px solid ${theme.border}`, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <UIIcon name="chevronL" size={16} color={theme.text2}/>
                  </button>
                  <span className="lo-display" style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: -0.2 }}>
                    {MON_FULL[calCursor.m]} {calCursor.y}
                  </span>
                  <button onClick={() => moveMonth(1)} className="lo-press" style={{
                    width: 32, height: 32, borderRadius: 10, background: theme.surfaceHi,
                    border: `1px solid ${theme.border}`, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <UIIcon name="chevronR" size={16} color={theme.text2}/>
                  </button>
                </div>
                {/* Weekday header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                  {['L','M','M','J','V','S','D'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: theme.text3, letterSpacing: 0.5 }}>{d}</div>
                  ))}
                </div>
                {/* Day grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                  {calCells.map((ds, i) => {
                    if (!ds) return <div key={`b${i}`}/>;
                    const day = Number(ds.split('-')[2]);
                    const active = selectedDate === ds;
                    const isToday = ds === loDateStr();
                    return (
                      <button key={ds} onClick={() => { setSelectedDate(ds); setShowCal(false); }} className="lo-press" style={{
                        aspectRatio: '1', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                        background: active ? `linear-gradient(145deg, ${c.from}, ${c.to})` : 'transparent',
                        border: !active && isToday ? `1.5px solid ${c.to}` : '1.5px solid transparent',
                        color: active ? '#fff' : (isToday ? c.to : theme.text),
                        fontSize: 13.5, fontWeight: active || isToday ? 800 : 500,
                        fontVariantNumeric: 'tabular-nums',
                        boxShadow: active ? `0 4px 14px ${c.to}66` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .16s var(--ease-smooth)',
                      }}>{day}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Horario ── */}
        <div style={{ padding: '18px 20px 18px', borderBottom: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionTitle theme={theme} accent={c.to}>Horario</SectionTitle>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 12.5, color: theme.text2, fontWeight: 500 }}>Todo el día</span>
              <Toggle on={allDayOn} onChange={() => setAllDay(v => !v)} theme={theme}/>
            </label>
          </div>
          {allDayOn ? (
            <div style={{ fontSize: 12.5, color: theme.text3, padding: '2px 2px 4px' }}>Sin hora — aparecerá en la fila “Todo el día”.</div>
          ) : (<>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 18 }}>
            {/* Tapping opens iOS native time wheel picker */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ padding: '12px 10px', background: theme.surfaceHi, borderRadius: 14, border: `1.5px solid ${c.to}66`, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Inicio</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(startMins)}</div>
                <div style={{ fontSize: 9, color: theme.text3, marginTop: 3, letterSpacing: 0.2 }}>toca para cambiar</div>
              </div>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', borderRadius: 14 }}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: theme.text3, fontSize: 20, padding: '0 4px', paddingBottom: 18 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ padding: '12px 10px', background: theme.surfaceHi, borderRadius: 14, border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: theme.text3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Fin</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{fmtMin(endMins)}</div>
                <div style={{ fontSize: 9, color: theme.text3, marginTop: 3, letterSpacing: 0.2 }}>según duración</div>
              </div>
            </div>
          </div>

          {/* Ribbon */}
          <div style={{ position: 'relative', height: 48, marginBottom: 18 }}>
            <div style={{
              position: 'absolute', top: 16, left: 0, right: 0, height: 14, borderRadius: 8,
              background: `linear-gradient(90deg, ${LIFE_PALETTE.slate.to}44 0%, ${LIFE_PALETTE.amber.from}55 18%, ${LIFE_PALETTE.sun.from}55 36%, ${LIFE_PALETTE.sky.from}55 60%, ${LIFE_PALETTE.plum.to}55 84%, ${LIFE_PALETTE.slate.to}44 100%)`,
              border: `0.5px solid ${theme.border}`, overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 50%)' }}/>
            </div>
            {[6, 9, 12, 15, 18, 21, 24].map(h => {
              const left = ((h*60 - RIBBON_START) / RIBBON_SPAN) * 100;
              return (
                <div key={h} style={{ position: 'absolute', left: `${left}%`, top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 8, color: theme.text3, fontWeight: 700 }}>{h === 24 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h-12}p` : `${h}a`}</span>
                  <div style={{ width: 1, height: 5, background: theme.text3, opacity: 0.35 }}/>
                </div>
              );
            })}
            <div className="lo-fade" style={{
              position: 'absolute', top: 13, left: `${blockLeft}%`, width: `${blockWidth}%`,
              height: 20, minWidth: 14, borderRadius: 10,
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              boxShadow: `0 0 0 2.5px ${theme.bg}, 0 0 0 4px ${c.to}88, 0 4px 12px ${c.to}66, inset 0 1px 0 rgba(255,255,255,0.35)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', zIndex: 2,
            }}>
              <div style={{ width: 2, height: 8, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }}/>
              <div style={{ width: 2, height: 8, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }}/>
            </div>
          </div>

          <SectionTitle theme={theme} accent={c.to} style={{ marginBottom: 10 }}>Duración</SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 2 }}>
            {[15, 30, 45, 60, 90, 120].map(d => {
              const active = duration === d;
              return (
                <button key={d} onClick={() => setDuration(d)} className="lo-press" style={{
                  flexShrink: 0,
                  background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                  color: active ? '#fff' : theme.text2,
                  border: `1px solid ${active ? 'transparent' : theme.border}`,
                  padding: '9px 16px', borderRadius: 999, fontSize: 13,
                  fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: active ? `0 4px 12px ${c.to}55` : 'none',
                  transition: 'all .18s var(--ease-out-back)',
                }}>{d < 60 ? `${d}m` : `${Math.floor(d/60)}h${d%60 ? `${d%60}m` : ''}`}</button>
              );
            })}
          </div>
          </>)}
        </div>

        {/* ── Color ── */}
        <div style={{ padding: '18px 20px 18px', borderBottom: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionTitle theme={theme} accent={c.to}>Color</SectionTitle>
            <span style={{ fontSize: 12.5, color: c.from, fontWeight: 700 }}>{COLOR_LABELS[pickedColor]}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingBottom: 6, alignItems: 'center', rowGap: 14 }}>
            {colors.map(col => {
              const cc = LIFE_PALETTE[col];
              const active = pickedColor === col;
              return (
                <button key={col} onClick={() => setColor(col)} className="lo-press" style={{
                  flexShrink: 0, alignSelf: 'center',
                  width: active ? 48 : 38, height: active ? 48 : 38,
                  borderRadius: '50%',
                  background: `linear-gradient(145deg, ${cc.from}, ${cc.to})`,
                  border: 'none', cursor: 'pointer', padding: 0,
                  boxShadow: active ? `0 0 0 3px ${theme.bg}, 0 0 0 5.5px ${cc.to}, 0 4px 14px ${cc.to}66` : `0 2px 8px ${cc.to}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .22s var(--ease-out-back)',
                }}>
                  {active && <span key={col} className="lo-pop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UIIcon name="check" size={21} color="#fff" strokeWidth={2.8}/>
                  </span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Icono ── */}
        <div style={{ padding: '18px 20px 18px', borderBottom: `0.5px solid ${theme.border}` }}>
          <SectionTitle theme={theme} accent={c.to} style={{ marginBottom: 14 }}>Icono</SectionTitle>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
            {ICON_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setIconCat(cat.id)} className="lo-press" style={{
                flexShrink: 0,
                background: iconCat === cat.id ? c.to : theme.surfaceHi,
                color: iconCat === cat.id ? '#fff' : theme.text2,
                border: `1px solid ${iconCat === cat.id ? 'transparent' : theme.border}`,
                padding: '7px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .18s var(--ease-smooth)',
              }}>{cat.label}</button>
            ))}
          </div>
          <div key={iconCat} className="lo-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {iconList.map(n => {
              const active = pickedIcon === n;
              return (
                <button key={n} onClick={() => setIcon(n)} className="lo-press" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, borderRadius: 13,
                  background: active ? `${c.to}22` : 'transparent',
                  border: `1.5px solid ${active ? c.to : 'transparent'}`,
                  cursor: 'pointer', transition: 'all .18s var(--ease-smooth)',
                }}>
                  <span className={active ? 'lo-pop' : ''} key={n + (active ? 'a' : 'i')}>
                    <LifeIcon name={n} color={pickedColor} size={32} shape="rounded"/>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Prioridad ── */}
        <div style={{ padding: '18px 20px 18px', borderBottom: `0.5px solid ${theme.border}` }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Prioridad</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {PRIORITIES.map(p => {
              const active = priority === p.id;
              const pc = LIFE_PALETTE[p.color];
              return (
                <button key={p.id} onClick={() => setPriority(p.id)} className="lo-press" style={{
                  flex: 1, padding: '12px 8px', borderRadius: 16,
                  background: active ? `linear-gradient(145deg, ${pc.from}28, ${pc.to}40)` : theme.surfaceHi,
                  border: `1.5px solid ${active ? pc.to : theme.border}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  transition: 'all .18s var(--ease-smooth)',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: `linear-gradient(135deg, ${pc.from}, ${pc.to})`, boxShadow: active ? `0 2px 8px ${pc.to}66` : 'none' }}/>
                  <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? pc.to : theme.text2 }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tema (Agenda filter) ── */}
        <div style={{ padding: '18px 20px 18px', borderBottom: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <SectionTitle theme={theme} accent={c.to}>Tema</SectionTitle>
            {category && !catTouched && <span style={{ fontSize: 10.5, color: c.to, fontWeight: 700 }}>✦ sugerido</span>}
          </div>
          <CategoryPicker theme={theme} value={category} onChange={(v) => { setCatTouched(true); setCategory(v); }}/>
        </div>

        {/* ── Opciones ── */}
        <div style={{ borderBottom: `0.5px solid ${theme.border}` }}>
          <OptionRow theme={theme} icon="bell" tint="coral" label="Recordatorio"
            on={reminderOn} onToggle={() => setReminder(!reminderOn)}
            sub={reminderOn ? '10 min antes' : 'Apagado'} />
          <Divider theme={theme}/>
          <OptionRow theme={theme} icon="repeat" tint="lavender" label="Repetir"
            on={repeatOn} onToggle={() => setRepeat(!repeatOn)}
            sub={repeatOn ? 'Entre semana · Lun–Vie' : 'No se repite'} />
          <Divider theme={theme}/>
          <DeadlineRow theme={theme} value={deadline} onChange={setDeadline}/>
        </div>

        {/* ── Checklist (collapsible) ── */}
        <div style={{ padding: '0 20px' }}>
          <button onClick={() => setShowChecklist(!showChecklist)} className="lo-press" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '16px 0', fontFamily: 'inherit',
            borderBottom: showChecklist ? `0.5px solid ${theme.border}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 11, background: `${LIFE_PALETTE.sky.from}22`, border: `1px solid ${LIFE_PALETTE.sky.from}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UIIcon name="check" size={16} color={LIFE_PALETTE.sky.from}/>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Checklist</div>
                <div style={{ fontSize: 12, color: theme.text3 }}>{subtasks.length === 0 ? 'Sin pasos — toca para añadir' : `${subtasks.filter(s=>s.done).length}/${subtasks.length} completados`}</div>
              </div>
            </div>
            <div style={{ transform: showChecklist ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .22s var(--ease-smooth)' }}>
              <UIIcon name="chevronR" size={16} color={theme.text3}/>
            </div>
          </button>
          {showChecklist && (
            <div className="lo-fade" style={{ paddingBottom: 14 }}>
              {subtasks.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < subtasks.length - 1 ? `0.5px solid ${theme.border}` : 'none' }}>
                  <button className="lo-press" onClick={() => setSubtasks(subtasks.map(x => x.id === s.id ? { ...x, done: !x.done } : x))} style={{
                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                    border: `1.5px solid ${s.done ? c.to : theme.rail}`,
                    background: s.done ? c.to : 'transparent',
                    cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s',
                  }}>
                    {s.done && <UIIcon name="check" size={12} color="#fff" strokeWidth={2.6}/>}
                  </button>
                  <input
                    value={s.label}
                    onChange={(e) => setSubtasks(subtasks.map(x => x.id === s.id ? { ...x, label: e.target.value } : x))}
                    placeholder="Describe el paso…"
                    autoFocus={!s.label}
                    style={{
                      flex: 1, fontSize: 14, background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'inherit', color: s.done ? theme.text3 : theme.text,
                      textDecorationLine: s.done ? 'line-through' : 'none', caretColor: c.to,
                    }}/>
                  <button onClick={() => setSubtasks(subtasks.filter(x => x.id !== s.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <UIIcon name="x" size={14} color={theme.text3}/>
                  </button>
                </div>
              ))}
              <button onClick={() => setSubtasks([...subtasks, { id: loUid('s'), label: '', done: false }])}
                className="lo-press" style={{
                  marginTop: 10, background: 'transparent', border: `1.5px dashed ${theme.border}`,
                  color: theme.text2, padding: '10px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                }}>
                <UIIcon name="plus" size={14} color={theme.text2}/> Añadir paso
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Sticky CTA ─── */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        padding: '16px 20px 22px',
        background: `linear-gradient(180deg, transparent 0%, ${theme.bg} 38%)`,
        zIndex: 5,
      }}>
        <button onClick={() => {
          if (!title.trim()) return;
          // Absolute date chosen in the strip or the full-month calendar (B14 fix),
          // never a relative offset re-applied to a fresh `new Date()` at save.
          const dateStr = selectedDate;
          const cleanSteps = subtasks.map(s => ({ ...s, label: s.label.trim() })).filter(s => s.label);
          const task = {
            id: loUid('t'),
            start: startTime,
            durationMin: duration,            // explicit — avoids midnight-wrap end<start
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            icon: pickedIcon,
            color: pickedColor,
            status: 'todo',
            priority,
            date: dateStr,
            reminder: reminderOn,             // was dropped before (B2)
            recur: repeatOn ? { freq: 'weekdays' } : null,
            deadline: deadline || null,       // hard due date (surfaced by DeadlineCard)
            allDay: allDayOn,                 // no time slot — rides the all-day row
            category: category || null,       // Agenda theme (vida/trabajo/uni)
            subtasks: cleanSteps.length > 0 ? cleanSteps : undefined,
          };
          if (onSave) onSave(task);
          onBack();
        }} disabled={!title.trim()} className="lo-press" style={{
          width: '100%', height: 56,
          background: title.trim() ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.rail,
          color: title.trim() ? '#fff' : theme.text3,
          border: 'none', borderRadius: 18,
          fontSize: 17, fontWeight: 700,
          cursor: title.trim() ? 'pointer' : 'default',
          letterSpacing: -0.3, fontFamily: 'inherit',
          boxShadow: title.trim() ? `0 8px 28px ${c.to}77, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          opacity: title.trim() ? 1 : 0.45,
          transition: 'all .25s var(--ease-smooth)',
        }}>
          {title.trim()
            ? <><UIIcon name="check" size={20} color="#fff" strokeWidth={2.5}/> Agendar tarea</>
            : 'Escribe un nombre primero'}
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

// Section header with a small colour tick — the recurring "intention" motif.
function SectionTitle({ theme, accent, children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...(style || {}) }}>
      <span style={{ width: 3, height: 11, borderRadius: 2, background: accent || theme.accent, flexShrink: 0 }}/>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase' }}>{children}</span>
    </div>
  );
}

// Theme chips (Vida / Trabajo / Universidad) — tap active to clear. Colour-coded.
function CategoryPicker({ theme, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {LO_CATEGORIES.map(cat => {
        const active = value === cat.id;
        const cc = LIFE_PALETTE[cat.color];
        return (
          <button key={cat.id} onClick={() => onChange(active ? null : cat.id)} className="lo-press" style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: active ? 700 : 500,
            color: active ? '#fff' : theme.text2,
            background: active ? `linear-gradient(135deg, ${cc.from}, ${cc.to})` : theme.surface,
            border: `1.5px solid ${active ? 'transparent' : theme.border}`,
            boxShadow: active ? `0 4px 12px ${cc.to}55` : 'none',
            transition: 'all .18s var(--ease-out-back)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: active ? 'rgba(255,255,255,0.92)' : cc.to }}/>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// Row to set/clear a hard due date — native <input type="date"> (iOS wheel).
function DeadlineRow({ theme, value, onChange }) {
  const niceDate = (ds) => { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      <SettingsIconBadge name="calendar" color="rose" size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: theme.text, fontWeight: 500, letterSpacing: -0.1 }}>Fecha límite</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1, textTransform: 'capitalize' }}>{value ? niceDate(value) : 'Sin fecha límite'}</div>
      </div>
      {value && (
        <button onClick={() => onChange(null)} className="lo-press" style={{ background: 'transparent', border: 'none', color: theme.text3, fontSize: 12, cursor: 'pointer', marginRight: 4, fontFamily: 'inherit' }}>Quitar</button>
      )}
      <label className="lo-press" style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '7px 13px', borderRadius: 10, background: theme.surface, border: `0.5px solid ${theme.border}`,
        color: value ? theme.text : theme.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>
        {value ? 'Cambiar' : 'Elegir'}
        <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value || null)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}/>
      </label>
    </div>
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
const DETAIL_DEMO = { id: 'demo', title: 'Bici al estudio', subtitle: '4.2 km · ruta escénica', icon: 'bike', color: 'mint', status: 'todo', start: '08:15', end: '08:45' };

const PRIORITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };
const RECUR_LABELS = { daily: 'Cada día', weekdays: 'Entre semana', weekly: 'Cada semana' };
function recurSub(recur) { return recur ? (RECUR_LABELS[recur.freq] || 'Personalizada') : 'No se repite'; }

function DetailScreen({ theme, task, onBack, onStartFocus, onComplete, onToggleSubtask, onUpdate, onDelete }) {
  const t = task || DETAIL_DEMO;
  const c = LIFE_PALETTE[t.color] || LIFE_PALETTE.mint;
  const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
  const isDone = t.status === 'done';
  const doneCount = subtasks.filter(s => s.done).length;
  const pct = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : (isDone ? 100 : 0);
  const live = !!onUpdate; // only wired when opened from the real app (not the static artboard)
  const [newStep, setNewStep] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);

  // Inline-editable title + note (B16) — drafts reset when a different task opens.
  const [titleDraft, setTitleDraft] = React.useState(t.title);
  const [noteDraft, setNoteDraft] = React.useState(t.note || t.subtitle || '');
  React.useEffect(() => { setTitleDraft(t.title); setNoteDraft(t.note || t.subtitle || ''); }, [t.id]);
  const commitTitle = () => { const v = titleDraft.trim(); if (live && v && v !== t.title) onUpdate({ title: v }); else if (!v) setTitleDraft(t.title); };
  const commitNote = () => { if (live && noteDraft.trim() !== (t.note || t.subtitle || '')) onUpdate({ note: noteDraft.trim() }); };
  const durMin = minutesBetween(t.start, t.end);
  const setField = (patch) => { if (live) onUpdate(patch); };

  const DETAIL_COLORS = ['coral','amber','rose','mint','sky','lavender','lime','teal','plum','sun','ember','slate'];
  const DETAIL_ICONS = ['yoga','shower','coffee','bike','briefcase','book','call','meal','meditate','presentation','moon','walk','pencil','cart','sparkle','clock','music','gift','home','heart','star','pill','fire','target'];
  const DETAIL_DATES = React.useMemo(() => {
    const _t = new Date(); const DS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']; const MS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return Array.from({ length: 14 }, (_, off) => { const d = new Date(_t); d.setDate(_t.getDate() + off); return { off, dow: off === 0 ? 'Hoy' : off === 1 ? 'Mañ' : DS[d.getDay()], day: d.getDate(), mon: (off === 0 || d.getDate() === 1) ? MS[d.getMonth()] : null, dateStr: loDateStr(d) }; });
  }, []);

  const toggleSub = (s) => { if (onToggleSubtask) onToggleSubtask(s.id); };
  const addStep = () => {
    const label = newStep.trim();
    if (!label || !onUpdate) return;
    onUpdate({ subtasks: [...subtasks, { id: loUid('sub'), label, done: false }] });
    setNewStep('');
  };
  const cyclePriority = () => {
    if (!onUpdate) return;
    const order = ['low', 'medium', 'high'];
    onUpdate({ priority: order[(order.indexOf(t.priority || 'medium') + 1) % 3] });
  };
  const cycleRecur = () => {
    if (!onUpdate) return;
    const order = [null, { freq: 'daily' }, { freq: 'weekdays' }, { freq: 'weekly', days: [loDow(t.date)] }];
    const idx = t.recur ? order.findIndex(o => o && o.freq === t.recur.freq) : 0;
    onUpdate({ recur: order[(idx + 1) % order.length] });
  };
  const snooze = () => {
    if (!onUpdate) return;
    onUpdate({ start: loMinToHHMM(loHHMMtoMin(t.start) + 30) });
    toast('Pospuesta 30 min', { icon: 'clock' });
  };
  const del = () => {
    if (!onDelete) return;
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar esta tarea?')) return;
    onDelete();
  };

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
            <button onClick={() => live && onUpdate({ reminder: !t.reminder })} className="lo-press" style={{ ...glassBtn, background: t.reminder ? 'rgba(255,255,255,0.32)' : glassBtn.background }}>
              <UIIcon name="bell" size={16} color="#fff" strokeWidth={2}/>
            </button>
            <button onClick={del} className="lo-press" style={glassBtn}>
              <UIIcon name="trash" size={16} color="#fff" strokeWidth={2}/>
            </button>
          </div>
        </div>
        {/* hero icon + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, position: 'relative', zIndex: 2 }}>
          <div className="lo-scale-in" style={{ filter: `drop-shadow(0 12px 24px ${c.to}77)` }}>
            <LifeIcon name={t.icon} color={t.color} size={92} shape="squircle"/>
          </div>
          {live ? (
            <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
              className="lo-display" placeholder="Título de la tarea"
              style={{ marginTop: 18, width: '100%', background: 'transparent', border: 'none', outline: 'none',
                textAlign: 'center', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.5,
                caretColor: 'rgba(255,255,255,0.7)' }}/>
          ) : (
            <div className="lo-display" style={{ marginTop: 18, fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.5, textAlign: 'center' }}>{t.title}</div>
          )}
          {live ? (
            <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onBlur={commitNote}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
              placeholder="Añade una nota…"
              style={{ marginTop: 4, width: '100%', background: 'transparent', border: 'none', outline: 'none',
                textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.82)', fontFamily: 'inherit',
                caretColor: 'rgba(255,255,255,0.7)' }}/>
          ) : (
            (t.note || t.subtitle) && <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.78)', textAlign: 'center' }}>{t.note || t.subtitle}</div>
          )}
          <div style={{ marginTop: 12, position: 'relative', display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 12px', borderRadius: 999, backdropFilter: 'blur(20px)' }}>
            <UIIcon name="clock" size={14} color="rgba(255,255,255,0.92)" strokeWidth={2}/>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.1 }}>
              {fmt12(t.start)} – {fmt12(t.end)} · {durMin}m
            </span>
            {live && <input type="time" value={t.start} onChange={(e) => setField({ start: e.target.value })}
              aria-label="Cambiar hora de inicio"
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', borderRadius: 999 }}/>}
          </div>
        </div>
      </div>

      {/* CONTENT CARDS */}
      <div className="lo-stagger" style={{ padding: '0 16px 40px', marginTop: 4 }}>
        {/* Progress card — only if there are subtasks */}
        {subtasks.length > 0 && (
          <div style={{ '--i': 0 }}>
            <Card theme={theme} style={{ padding: 16, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <SectionLabel theme={theme} inline>Progreso</SectionLabel>
                <span className="lo-display" style={{ fontSize: 26, fontWeight: 600, color: theme.text, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.4 }}>{pct}<span style={{ fontSize: 14, color: theme.text2, fontFamily: 'var(--font-ui)' }}>%</span></span>
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
        )}

        {/* Subtasks / checklist */}
        <div style={{ '--i': 1 }}>
          <Card theme={theme} style={{ padding: 14, marginTop: subtasks.length > 0 ? 10 : 12 }}>
            <SectionLabel theme={theme} inline>Checklist</SectionLabel>
            {subtasks.map((s, i) => (
              <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? `0.5px solid ${theme.border}` : 'none', marginTop: i ? 0 : 6 }}>
                <button className="lo-press" onClick={() => toggleSub(s)} style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `1.5px solid ${s.done ? c.to : theme.rail}`,
                  background: s.done ? c.to : 'transparent',
                  cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s',
                }}>{s.done && <UIIcon name="check" size={13} color="#fff" strokeWidth={2.6}/>}</button>
                <span style={{ flex: 1, fontSize: 14, color: s.done ? theme.text3 : theme.text, textDecorationLine: s.done ? 'line-through' : 'none', textDecorationColor: theme.text3 }}>{s.label}</span>
              </div>
            ))}
            {live && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: subtasks.length ? 8 : 6 }}>
                <input value={newStep} onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addStep(); }}
                  placeholder="Añadir un paso…" style={{
                    flex: 1, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10,
                    padding: '9px 12px', color: theme.text, fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
                  }}/>
                <button className="lo-press" onClick={addStep} style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0, border: 'none', cursor: 'pointer',
                  background: newStep.trim() ? c.to : theme.rail, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><UIIcon name="plus" size={16} color="#fff" strokeWidth={2.6}/></button>
              </div>
            )}
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

        {/* Options — now reflect real task data and are tappable */}
        <div style={{ '--i': 3 }}>
          <Card theme={theme} style={{ padding: 0, marginTop: 10 }}>
            <OptionRow theme={theme} icon="bell" tint="coral" label="Recordatorio"
              sub={t.reminder ? 'Activado' : 'Desactivado'}
              on={t.reminder} onToggle={() => live && onUpdate({ reminder: !t.reminder })}/>
            <Divider theme={theme}/>
            <button onClick={cycleRecur} className="lo-press" style={detailRowBtn}>
              <OptionRow theme={theme} icon="repeat" tint="lavender" label="Repetir" sub={recurSub(t.recur)} arrow/>
            </button>
            <Divider theme={theme}/>
            <button onClick={cyclePriority} className="lo-press" style={detailRowBtn}>
              <OptionRow theme={theme} icon="flag" tint="amber" label="Prioridad" sub={PRIORITY_LABELS[t.priority || 'medium']} arrow/>
            </button>
            {live && <><Divider theme={theme}/>
              <DeadlineRow theme={theme} value={t.deadline || null} onChange={(v) => onUpdate({ deadline: v })}/>
              <Divider theme={theme}/>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 11.5, color: theme.text2, fontWeight: 500, marginBottom: 10 }}>Tema</div>
                <CategoryPicker theme={theme} value={t.category || null} onChange={(v) => onUpdate({ category: v })}/>
              </div>
            </>}
          </Card>
        </div>

        {/* Edit panel — change date, duration, color, icon (B16) */}
        {live && (
          <div style={{ '--i': 3.5 }}>
            <Card theme={theme} style={{ padding: 0, marginTop: 10, overflow: 'hidden' }}>
              <button onClick={() => setEditOpen(v => !v)} className="lo-press" style={{ ...detailRowBtn, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <SettingsIconBadge name="pencil" color="sky" size={32}/>
                <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Editar detalles</span>
                <div style={{ transform: editOpen ? 'rotate(90deg)' : 'none', transition: 'transform .22s var(--ease-smooth)' }}>
                  <UIIcon name="chevronR" size={14} color={theme.text3}/>
                </div>
              </button>
              {editOpen && (
                <div className="lo-fade" style={{ padding: '4px 14px 16px' }}>
                  {/* Fecha */}
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '6px 0 8px' }}>Fecha</div>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    {DETAIL_DATES.map(d => {
                      const active = t.date === d.dateStr;
                      return (
                        <button key={d.off} onClick={() => setField({ date: d.dateStr })} className="lo-press" style={{
                          flexShrink: 0, width: 52, padding: '8px 4px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                          background: active ? `linear-gradient(145deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                          border: `1.5px solid ${active ? 'transparent' : theme.border}`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? 'rgba(255,255,255,0.85)' : theme.text3 }}>{d.dow}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: active ? '#fff' : theme.text, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{d.day}</span>
                          {d.mon && <span style={{ fontSize: 8, fontWeight: 700, color: active ? 'rgba(255,255,255,0.7)' : theme.text3 }}>{d.mon}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {/* Duración */}
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0 8px' }}>Duración</div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                    {[15, 30, 45, 60, 90, 120].map(d => {
                      const active = durMin === d;
                      return (
                        <button key={d} onClick={() => setField({ durationMin: d })} className="lo-press" style={{
                          flexShrink: 0, padding: '8px 15px', borderRadius: 999, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                          fontWeight: active ? 700 : 500, color: active ? '#fff' : theme.text2,
                          background: active ? `linear-gradient(135deg, ${c.from}, ${c.to})` : theme.surfaceHi,
                          border: `1px solid ${active ? 'transparent' : theme.border}`,
                        }}>{d < 60 ? `${d}m` : `${Math.floor(d/60)}h${d%60 ? `${d%60}m` : ''}`}</button>
                      );
                    })}
                  </div>
                  {/* Color */}
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0 8px' }}>Color</div>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, alignItems: 'center' }}>
                    {DETAIL_COLORS.map(col => {
                      const cc = LIFE_PALETTE[col]; const active = t.color === col;
                      return (
                        <button key={col} onClick={() => setField({ color: col })} className="lo-press" style={{
                          flexShrink: 0, width: active ? 38 : 30, height: active ? 38 : 30, borderRadius: '50%', padding: 0, border: 'none', cursor: 'pointer',
                          background: `linear-gradient(145deg, ${cc.from}, ${cc.to})`,
                          boxShadow: active ? `0 0 0 2.5px ${theme.surface}, 0 0 0 4.5px ${cc.to}` : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{active && <UIIcon name="check" size={16} color="#fff" strokeWidth={2.8}/>}</button>
                      );
                    })}
                  </div>
                  {/* Icono */}
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0 8px' }}>Icono</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {DETAIL_ICONS.map(n => {
                      const active = t.icon === n;
                      return (
                        <button key={n} onClick={() => setField({ icon: n })} className="lo-press" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 12, cursor: 'pointer',
                          background: active ? `${c.to}22` : 'transparent', border: `1.5px solid ${active ? c.to : 'transparent'}`,
                        }}><LifeIcon name={n} color={t.color} size={28} shape="rounded"/></button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ '--i': 4, display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={snooze} className="lo-press lo-lift" style={{
            flex: 1, padding: '14px 12px', borderRadius: 16,
            background: theme.surface, border: `0.5px solid ${theme.border}`,
            color: theme.text, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
          }}>
            <UIIcon name="clock" size={16} color={theme.text}/> +30 min
          </button>
          <button onClick={() => { if (onComplete) onComplete(); }} className="lo-press lo-lift" style={{
            flex: 1, padding: '14px 12px', borderRadius: 16,
            background: isDone ? theme.surface : `linear-gradient(135deg, ${c.from}, ${c.to})`,
            border: isDone ? `0.5px solid ${theme.border}` : 'none',
            color: isDone ? theme.text2 : '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
            boxShadow: isDone ? 'none' : `0 6px 20px ${c.to}55`,
            transition: 'all .3s var(--ease-smooth)',
          }}>
            <UIIcon name="check" size={16} color={isDone ? theme.text2 : '#fff'} strokeWidth={2.4}/>
            {isDone ? 'Reabrir' : 'Completar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const detailRowBtn = { display: 'block', width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' };

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
  const chips = ['Gym mañana 7am 1h', 'Estudiar inglés hoy 2pm 90 min', 'Reunión con Ana el lunes 10am', 'Llamar a mamá cada día 8pm'];
  const INITIAL_MSGS = [
    { from: 'ai', text: 'Soy tu planner. Dime qué quieres agendar en lenguaje natural — ej: "gym mañana 7am 1h" o "estudiar inglés el lunes 2pm 90 min" — y lo agrego a tu día. También puedo completar, mover o borrar tareas.' },
  ];
  const [input, setInput] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [messages, setMessages] = React.useState(INITIAL_MSGS);
  const recogRef = React.useRef(null);
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
      reply: 'La pestaña Agenda muestra el mes completo. Toca cualquier día para ver sus tareas de ese día.' },
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

    await new Promise(r => setTimeout(r, 350 + Math.random() * 350)); // feels considered

    try {
      // 1) Parse the message into a real action against the task store.
      const parsed = loParseCommand(text);
      if (parsed.intent === 'create' || parsed.intent === 'delete' || parsed.intent === 'complete' || parsed.intent === 'move') {
        const result = loExecuteCommand(parsed);
        if (result) {
          setMessages(m => [...m, { from: 'ai', text: result.reply, task: result.task || null }]);
          setThinking(false);
          return;
        }
      }
      // 2) Help / smalltalk → optional remote model, else the local knowledge base.
      let reply = null;
      if (typeof window !== 'undefined' && window.LOAI && window.LOAI.getSettings && window.LOAI.getSettings().enabled) {
        const sys = 'Eres el asistente de LifeOS, un planner diario en español. Responde en 1-3 oraciones, tono amable.';
        reply = await window.LOAI.chat(`${sys}\n\nUsuario: ${text}`).catch(() => null);
      }
      setMessages(m => [...m, { from: 'ai', text: reply || localReply(text) }]);
    } catch {
      setMessages(m => [...m, { from: 'ai', text: localReply(text) }]);
    } finally {
      setThinking(false);
    }
  };

  // Voice dictation (Structured-style) via the Web Speech API.
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Tu navegador no soporta dictado por voz', { icon: 'mic' }); return; }
    if (listening) { try { recogRef.current && recogRef.current.stop(); } catch {} return; }
    const r = new SR(); recogRef.current = r;
    r.lang = 'es-ES'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const txt = e.results[0][0].transcript; setInput(txt); setTimeout(() => send(txt), 250); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setListening(true); try { r.start(); } catch { setListening(false); }
  };
  const clearChat = () => { setMessages(INITIAL_MSGS); setInput(''); };

  return (
    <div data-screen-label="AI Planner" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        <ScreenTopBar theme={theme} title="IA Planner" onBack={onBack} embedded={embedded}
          trailing={<button onClick={clearChat} title="Limpiar conversación" className="lo-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <UIIcon name="trash" size={16} color={theme.text2}/>
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
            <React.Fragment key={i}>
              <Bubble theme={theme} side={m.from === 'user' ? 'right' : 'left'}>{m.text}</Bubble>
              {m.task && <AITaskCard theme={theme} task={m.task}/>}
            </React.Fragment>
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
          <button onClick={startVoice} title="Dictar por voz" className={listening ? 'lo-press lo-pulse' : 'lo-press'} style={{
            width: 36, height: 36, borderRadius: 18, border: 'none', cursor: 'pointer',
            background: listening ? theme.accent : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            '--pulse-c': theme.accent + '88', '--pulse-c-end': theme.accent + '00',
          }}>
            <UIIcon name="mic" size={18} color={listening ? '#fff' : theme.text2} strokeWidth={2}/>
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
function AITaskCard({ theme, task }) {
  const c = LIFE_PALETTE[task.color] || LIFE_PALETTE.mint;
  const when = task.recur
    ? (task.recur.freq === 'daily' ? 'Cada día' : task.recur.freq === 'weekdays' ? 'Entre semana' : 'Cada semana')
    : `${fmt12(task.start)} · ${task.durationMin} min`;
  return (
    <div className="lo-scale-in" style={{
      alignSelf: 'flex-start', maxWidth: '88%',
      display: 'flex', alignItems: 'center', gap: 11, padding: 10,
      background: `linear-gradient(135deg, ${c.from}1A, ${theme.surface} 75%)`,
      border: `0.5px solid ${c.to}44`, borderRadius: 16,
    }}>
      <LifeIcon name={task.icon} color={task.color} size={38} shape="rounded"/>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, letterSpacing: -0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
        <div style={{ fontSize: 11.5, color: theme.text2, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{when}</div>
      </div>
      <div style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 4, color: c.to, fontSize: 11, fontWeight: 700 }}>
        <UIIcon name="check" size={13} color={c.to} strokeWidth={2.6}/> Agendada
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
function InboxScreen({ theme, onBack, onSchedule }) {
  const inbox = useInbox();
  const items = inbox.all;
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef(null);

  const capture = () => {
    const text = draft.trim();
    if (!text) return;
    inbox.add(text);
    setDraft('');
    if (inputRef.current) inputRef.current.focus();
  };
  const schedule = (it) => {
    if (onSchedule) onSchedule(it);
    else { LOStore.addTask({ title: it.text, date: loDateStr() }); }
    inbox.remove(it.id);
    toast('Movida a tu día', { tone: 'success', icon: 'check' });
  };

  return (
    <div data-screen-label="Inbox">
      <ScreenTopBar theme={theme} title="Inbox" onBack={onBack}/>

      <div style={{ padding: '0 16px 100px' }}>
        <div className="lo-fade" style={{ padding: '0 4px 6px' }}>
          <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500 }}>Captura ahora, organiza después</div>
          <h2 className="lo-display" style={{ margin: '2px 0 0', fontSize: 32, fontWeight: 600, color: theme.text, letterSpacing: -0.5 }}>
            Inbox {items.length > 0 && <span style={{ color: theme.text3, fontWeight: 400, fontSize: 22 }}>· {items.length}</span>}
          </h2>
        </div>

        {/* Quick capture input — the heart of the inbox */}
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
          padding: 5, background: theme.surface,
          border: `1px solid ${draft ? theme.accent + '99' : theme.border}`, borderRadius: 16,
          transition: 'border-color .15s',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: theme.accent + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UIIcon name="inbox" size={18} color={theme.accent} strokeWidth={2}/>
          </div>
          <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') capture(); }}
            placeholder="Escribe cualquier idea, recado o pendiente…" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: theme.text, fontSize: 14, fontFamily: 'inherit',
          }}/>
          <button className="lo-press" onClick={capture} disabled={!draft.trim()} style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0, border: 'none',
            background: draft.trim() ? theme.accent : theme.rail, cursor: draft.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><UIIcon name="plus" size={18} color="#fff" strokeWidth={2.6}/></button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div className="lo-breath" style={{ filter: `drop-shadow(0 10px 28px ${LIFE_PALETTE.lavender.to}44)` }}>
              <LifeIcon name="sparkle" color="lavender" size={60} shape="squircle"/>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 16 }}>Tu inbox está vacío</div>
            <div style={{ fontSize: 12.5, color: theme.text2, marginTop: 4, maxWidth: 240, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              Anota lo que pase por tu cabeza sin pensar en cuándo. Luego lo agendas en un toque.
            </div>
          </div>
        ) : (
          <div className="lo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {items.map((it, i) => (
              <div key={it.id} className="lo-lift" style={{
                '--i': i,
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: theme.surface, borderRadius: 16, border: `0.5px solid ${theme.border}`,
              }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: `linear-gradient(180deg, ${LIFE_PALETTE.lavender.from}, ${LIFE_PALETTE.sky.to})` }}/>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: -0.1, wordBreak: 'break-word' }}>{it.text}</div>
                <button className="lo-press" onClick={() => schedule(it)} title="Agendar hoy" style={{
                  flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: theme.accent + '1F', color: theme.accent, fontWeight: 700, fontSize: 11.5,
                  padding: '7px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5,
                }}><UIIcon name="calendar" size={13} color={theme.accent} strokeWidth={2}/> Agendar</button>
                <button className="lo-press" onClick={() => inbox.remove(it.id)} title="Eliminar" style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: theme.text3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><UIIcon name="trash" size={15} color={theme.text3} strokeWidth={2}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Stats — streak banner + heatmap + charts + insight
// ──────────────────────────────────────────────────────────────
function StatsScreen({ theme, onBack, embedded, userTasks = [] }) {
  const today = new Date();
  const todayStr = loDateStr(today);

  // Real stats
  const totalTasks = userTasks.length;
  const doneTasks = userTasks.filter(t => t.status === 'done').length;
  const completionPct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

  // This week's per-day task counts (Mon=0...Sun=6)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return userTasks.filter(t => t.targetDate === loDateStr(d)).length;
  });
  const maxBar = Math.max(...bars, 1);
  const todayDow = (today.getDay() + 6) % 7;

  // Real streak: consecutive days (going backwards) with at least 1 done task
  const completedDays = new Set(userTasks.filter(t => t.status === 'done' && t.targetDate).map(t => t.targetDate));
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (completedDays.has(loDateStr(d))) streak++;
    else if (i > 0) break;
  }

  const weekTotal = bars.reduce((a, b) => a + b, 0);
  const days = ['L','M','X','J','V','S','D'];
  const MON3 = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  // Real date ranges (no more hardcoded "Feb — May" / "12 – 18 May").
  const heatStart = new Date(weekStart); heatStart.setDate(weekStart.getDate() - 11 * 7);
  const heatRange = `${MON3[heatStart.getMonth()]} — ${MON3[today.getMonth()]}`;
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const weekRange = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${MON3[weekStart.getMonth()]}`
    : `${weekStart.getDate()} ${MON3[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MON3[weekEnd.getMonth()]}`;

  // Real "where your time goes" — group by color, summing duration (B7).
  const COLOR_ES = { coral:'Coral', amber:'Ámbar', rose:'Rosa', mint:'Menta', sky:'Cielo', lavender:'Lavanda', lime:'Lima', teal:'Verde', plum:'Ciruela', sun:'Sol', ember:'Fuego', slate:'Pizarra' };
  const fmtHrs = (min) => min >= 60 ? `${(min / 60).toFixed(min % 60 ? 1 : 0)}h` : `${min}m`;
  const catTotals = {};
  userTasks.forEach(t => { const k = t.color || 'mint'; catTotals[k] = (catTotals[k] || 0) + (t.durationMin || 30); });
  const catTotalMin = Object.values(catTotals).reduce((a, b) => a + b, 0) || 1;
  const catRows = Object.entries(catTotals)
    .map(([color, min]) => ({ color, min, pct: Math.round(min / catTotalMin * 100), hr: fmtHrs(min) }))
    .sort((a, b) => b.min - a.min).slice(0, 5);

  // Real insight — most productive weekday from completed tasks (B7).
  const dowDone = [0,0,0,0,0,0,0]; // Mon..Sun
  userTasks.filter(t => t.status === 'done' && t.targetDate).forEach(t => {
    const [y, m, d] = t.targetDate.split('-').map(Number);
    dowDone[(new Date(y, m - 1, d).getDay() + 6) % 7]++;
  });
  const dowDoneTotal = dowDone.reduce((a, b) => a + b, 0);
  const bestDowIdx = dowDone.indexOf(Math.max(...dowDone));
  const DOW_FULL = ['lunes','martes','miércoles','jueves','viernes','sábados','domingos'];
  const bestDowPct = dowDoneTotal > 0 ? Math.round(dowDone[bestDowIdx] / dowDoneTotal * 100) : 0;

  return (
    <div data-screen-label="Stats">
      <ScreenTopBar theme={theme} title="Stats" onBack={onBack} embedded={embedded}/>

      <div style={{ padding: '0 16px 24px' }}>
        <div className="lo-fade" style={{ padding: '0 4px 14px' }}>
          <div style={{ fontSize: 12.5, color: theme.text3, fontWeight: 500 }}>Esta semana</div>
          <h2 style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 700, color: theme.text, letterSpacing: -0.7 }}>
            Buen <span style={{ color: theme.accent }}>momentum</span>
          </h2>
        </div>

        {/* Streak banner */}
        <div className="lo-scale-in" style={{
          background: streak > 0
            ? `linear-gradient(135deg, ${LIFE_PALETTE.ember.from} 0%, ${LIFE_PALETTE.coral.to} 100%)`
            : theme.surface,
          borderRadius: 20, padding: 16,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: streak > 0 ? `0 12px 32px ${LIFE_PALETTE.coral.to}44` : `0 2px 8px rgba(0,0,0,0.12)`,
          border: streak > 0 ? 'none' : `0.5px solid ${theme.border}`,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 28,
            background: streak > 0 ? 'rgba(255,255,255,0.18)' : theme.accentSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: streak > 0 ? 'blur(10px)' : 'none' }}>
            {streak > 0 ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 C 9 8 14 9 14 14 C 14 17 12 19 10 19 C 8 19 7 17 7 15 C 7 13 8 11 10 11 C 9 14 10 16 11 16 C 12 16 13 14 13 12 C 13 8 16 6 16 2 Z" fill="#fff"/>
              </svg>
            ) : (
              <UIIcon name="sparkle" size={24} color={theme.accent} strokeWidth={2}/>
            )}
          </div>
          <div style={{ flex: 1, color: streak > 0 ? '#fff' : theme.text }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', opacity: streak > 0 ? 0.85 : 1, color: streak > 0 ? '#fff' : theme.text3 }}>Racha actual</div>
            <div className="lo-display" style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {streak} <span style={{ fontSize: 15, fontWeight: 600, opacity: streak > 0 ? 0.85 : 1, fontFamily: 'var(--font-ui)' }}>{streak === 1 ? 'día' : 'días'}</span>
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, color: streak > 0 ? '#fff' : theme.text2 }}>
              {streak > 0 ? 'Completa algo hoy para mantenerla.' : 'Completa una tarea hoy para empezar.'}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <StatCard theme={theme} label="Hechas" value={String(doneTasks)} sub={totalTasks > 0 ? `${completionPct}% tasa` : 'Agrega tareas'} tone="mint"/>
          <StatCard theme={theme} label="Esta sem." value={String(weekTotal)} sub={weekTotal === 1 ? 'tarea' : 'tareas'} tone="sky"/>
          <StatCard theme={theme} label="Total" value={String(totalTasks)} sub={totalTasks > 0 ? `${doneTasks} completadas` : 'Sin tareas aún'} tone="lavender"/>
        </div>

        {/* Activity heatmap (12 weeks) */}
        <div style={{ marginTop: 14, background: theme.surface, borderRadius: 20, padding: 16, border: `0.5px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 12.5, color: theme.text, fontWeight: 600 }}>Actividad</span>
            <span style={{ fontSize: 10.5, color: theme.text3 }}>{heatRange}</span>
          </div>
          <Heatmap theme={theme} accent={theme.accent} userTasks={userTasks}/>
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
            <span style={{ fontSize: 10.5, color: theme.text3 }}>{weekRange}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, marginTop: 16 }}>
            {bars.map((b, i) => {
              const active = i === todayDow;
              const pctH = maxBar > 0 ? Math.max((b / maxBar) * 100, b > 0 ? 8 : 0) : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', height: `${pctH}%`, minHeight: b > 0 ? 8 : 3,
                    background: active
                      ? `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accent}AA 100%)`
                      : b > 0
                        ? `linear-gradient(180deg, ${theme.surfaceHi} 0%, ${theme.rail} 100%)`
                        : theme.rail,
                    borderRadius: 8,
                    boxShadow: active ? `0 4px 12px ${theme.accent}44` : 'none',
                    transition: 'all .4s var(--ease-out-quart)',
                    opacity: b === 0 && !active ? 0.4 : 1,
                  }}/>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: active ? theme.text : theme.text3, fontWeight: active ? 700 : 500, fontVariantNumeric: 'tabular-nums' }}>{b}</span>
                    <span style={{ fontSize: 9.5, color: active ? theme.accent : theme.text3, fontWeight: active ? 700 : 500 }}>{days[i]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown — real, grouped by color */}
        <div style={{ marginTop: 14, background: theme.surface, borderRadius: 20, padding: 16, border: `0.5px solid ${theme.border}` }}>
          <div style={{ fontSize: 12.5, color: theme.text, marginBottom: 12, fontWeight: 600 }}>En qué se va tu tiempo</div>
          {catRows.length === 0 ? (
            <div style={{ fontSize: 12.5, color: theme.text3, padding: '6px 0' }}>Agenda tareas con duración y aquí verás tu reparto real.</div>
          ) : catRows.map((row, i) => {
            const c = LIFE_PALETTE[row.color] || LIFE_PALETTE.mint;
            return (
              <div key={row.color} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < catRows.length - 1 ? 12 : 0 }}>
                <div style={{ width: 8, height: 24, borderRadius: 4, background: `linear-gradient(180deg, ${c.from}, ${c.to})` }}/>
                <span style={{ flex: 1, fontSize: 13.5, color: theme.text, fontWeight: 500 }}>{COLOR_ES[row.color] || row.color}</span>
                <div style={{ flex: 1.5, height: 6, background: theme.rail, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${row.pct}%`, height: '100%', background: `linear-gradient(90deg, ${c.from}, ${c.to})`, transition: 'width .6s var(--ease-out-quart)' }}/>
                </div>
                <span style={{ fontSize: 11.5, color: theme.text2, width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{row.hr}</span>
              </div>
            );
          })}
        </div>

        {/* Insight — real best-weekday, only when there's enough signal */}
        {dowDoneTotal >= 3 && (
          <div style={{ marginTop: 14, padding: 16,
            background: `linear-gradient(135deg, ${LIFE_PALETTE.lavender.from}22, ${LIFE_PALETTE.sky.to}14)`,
            borderRadius: 20, border: `0.5px solid ${LIFE_PALETTE.lavender.to}44` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <LifeIcon name="sparkle" color="lavender" size={36} shape="rounded"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: LIFE_PALETTE.lavender.to, letterSpacing: 0.4, textTransform: 'uppercase' }}>Insight</div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, marginTop: 2, letterSpacing: -0.1 }}>Los {DOW_FULL[bestDowIdx]} son tu mejor día</div>
                <div style={{ fontSize: 12, color: theme.text2, lineHeight: 1.45, marginTop: 4 }}>
                  Ahí completas el {bestDowPct}% de tus tareas. Aprovecha ese día para lo más importante.
                </div>
              </div>
            </div>
          </div>
        )}
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
      <div className="lo-display" style={{ fontSize: 28, fontWeight: 600, color: theme.text, marginTop: 4, letterSpacing: -0.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10.5, color: c.to, marginTop: 4, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}
function Heatmap({ theme, accent, userTasks = [] }) {
  const cols = 14, rows = 7;
  const today = new Date();

  // Build activity map from real done tasks
  const activityMap = {};
  userTasks.filter(t => t.status === 'done' && t.targetDate).forEach(t => {
    activityMap[t.targetDate] = (activityMap[t.targetDate] || 0) + 1;
  });
  const maxActivity = Math.max(...Object.values(activityMap), 1);

  // Grid: 14 weeks back, each col = one week (Mon→Sun)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // this Monday

  const grid = Array.from({ length: cols }, (_, ci) => {
    const colMonday = new Date(weekStart);
    colMonday.setDate(weekStart.getDate() - (cols - 1 - ci) * 7);
    return Array.from({ length: rows }, (_, ri) => {
      const d = new Date(colMonday);
      d.setDate(colMonday.getDate() + ri);
      const ds = loDateStr(d);
      const isFuture = d > today;
      const activity = activityMap[ds] || 0;
      return isFuture ? -1 : activity / maxActivity;
    });
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
      {grid.map((col, c) => (
        <div key={c} style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 3 }}>
          {col.map((v, r) => (
            <div key={r} style={{
              aspectRatio: '1/1', minHeight: 12, borderRadius: 3,
              background: v < 0 ? 'transparent' : (v === 0 ? theme.rail : `color-mix(in srgb, ${accent} ${Math.max(v * 100, 25)}%, transparent)`),
            }}/>
          ))}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Settings — profile hero · pro card · grouped lists with badges
// ──────────────────────────────────────────────────────────────
function SettingsScreen({ theme, onBack, embedded, user, onEditName, userTasks = [], t = {}, setTweak }) {
  const name = (user && user.name) || 'Tú';
  const totalTasks = userTasks.length;
  const doneTasks = userTasks.filter(t => t.status === 'done').length;
  const completedDays = new Set(userTasks.filter(t => t.status === 'done' && t.targetDate).map(t => t.targetDate));
  const today = new Date();
  let settingsStreak = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (completedDays.has(loDateStr(d))) settingsStreak++;
    else if (i > 0) break;
  }

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(LOStore.exportAll(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `lifeos-backup-${loDateStr()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Respaldo descargado', { tone: 'success', icon: 'check' });
    } catch { toast('No se pudo exportar', { tone: 'error' }); }
  };
  const resetApp = () => {
    if (typeof window !== 'undefined' && !window.confirm('Esto borra TODAS tus tareas, hábitos y datos de este dispositivo. ¿Seguro?')) return;
    try {
      [LO_KEYS.tasks, LO_KEYS.habits, LO_KEYS.inbox, 'lifeos.user', 'lifeos.user_tasks'].forEach(k => localStorage.removeItem(k));
      window.dispatchEvent(new CustomEvent('lo-store-change', { detail: {} }));
      location.reload();
    } catch {}
  };

  // Data sovereignty — import a backup (export already defined above). No lock-in.
  const importRef = React.useRef(null);
  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!window.confirm('Esto reemplazará tus datos actuales con los del respaldo. ¿Continuar?')) return;
        const n = LOStore.importAll(data);
        toast(`Importado: ${n.tasks} tareas, ${n.habits} hábitos`, { tone: 'success', icon: 'check' });
        setTimeout(() => location.reload(), 800);
      } catch (e) { toast(e.message || 'Archivo inválido', { tone: 'error' }); }
    };
    reader.readAsText(file);
  };

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
            </div>
            <UIIcon name="chevronR" size={16} color={theme.text3}/>
          </div>
        </button>

        {/* Quick stats strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Tareas', value: String(totalTasks) },
            { label: 'Racha', value: `${settingsStreak}d` },
            { label: 'Hechas', value: String(doneTasks) },
          ].map((s, i) => (
            <div key={i} className="lo-lift" style={{
              flex: 1, padding: 12, background: theme.surface,
              border: `0.5px solid ${theme.border}`, borderRadius: 14,
              textAlign: 'center',
            }}>
              <div className="lo-display" style={{ fontSize: 21, fontWeight: 600, color: theme.text, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: theme.text3, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <SectionLabel theme={theme}>General</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          <NotifSettingsRow theme={theme}/>
          <Divider theme={theme}/>
          <SettingsRow theme={theme} icon="calendar" tint="mint" label="Sync entre dispositivos" trail="Pronto"/>
        </div>

        <SectionLabel theme={theme}>Apariencia</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          {/* Dark mode — real toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <SettingsIconBadge name="moon" color="slate" size={32}/>
            <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Modo oscuro</span>
            <Toggle on={!!t.dark} theme={theme} onChange={(v) => setTweak && setTweak('dark', v)}/>
          </div>
          <Divider theme={theme}/>
          {/* Accent swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <SettingsIconBadge name="sparkle" color="plum" size={32}/>
            <span style={{ fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Acento</span>
            <div style={{ flex: 1, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {['#FF8765', '#FFB347', '#5BE0B5', '#B79EFF'].map((c) => {
                const active = (t.accent || '').toLowerCase() === c.toLowerCase();
                return (
                  <button key={c} className="lo-press" onClick={() => setTweak && setTweak('accent', c)} style={{
                    width: 26, height: 26, borderRadius: 13, background: c, border: 'none', cursor: 'pointer', padding: 0,
                    boxShadow: active ? `0 0 0 2px ${theme.surface}, 0 0 0 4px ${c}` : 'none',
                    transition: 'box-shadow .15s',
                  }} aria-label={`Acento ${c}`}/>
                );
              })}
            </div>
          </div>
          <Divider theme={theme}/>
          {/* Density segmented control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <SettingsIconBadge name="grip" color="coral" size={32}/>
            <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Densidad</span>
            <div style={{ display: 'flex', background: theme.rail, borderRadius: 10, padding: 2 }}>
              {[['comfy', 'Cómoda'], ['compact', 'Compacta']].map(([id, lbl]) => {
                const active = (t.density || 'comfy') === id;
                return (
                  <button key={id} className="lo-press" onClick={() => setTweak && setTweak('density', id)} style={{
                    border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    fontFamily: 'inherit', background: active ? theme.surface : 'transparent',
                    color: active ? theme.text : theme.text3,
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.18)' : 'none', transition: 'all .15s',
                  }}>{lbl}</button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data card — honest, local-first, with a real export */}
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
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Tus datos, tuyos</span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4 }}>Todo vive en tu dispositivo</div>
          <div style={{ fontSize: 12.5, opacity: 0.88, marginTop: 4, lineHeight: 1.4 }}>
            Sin cuentas ni servidores. Exporta un respaldo o impórtalo en otro teléfono; la sync en la nube llega pronto.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={exportData} className="lo-press" style={{
              background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(255,255,255,0.2)', color: '#fff',
              padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}><UIIcon name="inbox" size={14} color="#fff" strokeWidth={2}/> Exportar</button>
            <button onClick={() => importRef.current && importRef.current.click()} className="lo-press" style={{
              background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(255,255,255,0.2)', color: '#fff',
              padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}><UIIcon name="plus" size={14} color="#fff" strokeWidth={2}/> Importar</button>
            <input ref={importRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) importData(f); e.target.value = ''; }}/>
          </div>
        </div>

        <SectionLabel theme={theme}>Cuenta</SectionLabel>
        <div style={{ background: theme.surface, borderRadius: 18, border: `0.5px solid ${theme.border}`, overflow: 'hidden' }}>
          <SettingsRow theme={theme} icon="pencil" tint="sky" label="Cambiar nombre" trail={name} onClick={onEditName}/>
          <Divider theme={theme}/>
          <button onClick={resetApp} className="lo-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
            <SettingsIconBadge name="trash" color="coral" size={32}/>
            <span style={{ flex: 1, fontSize: 14.5, color: LIFE_PALETTE.coral.to, letterSpacing: -0.1, fontWeight: 600 }}>Borrar todos mis datos</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '22px 0 8px', color: theme.text3, fontSize: 11 }}>
          LifeOS · Hecho con cariño en Chile 🇨🇱
        </div>
      </div>
    </div>
  );
}
// NotifSettingsRow lives in lifeos-notify.jsx (the real one that requests
// permission and persists). The placebo duplicate that used to shadow it here
// was removed (B5).

function SettingsRow({ theme, icon, tint, label, trail, trailNode, onClick, disabled }) {
  const interactive = !!onClick && !disabled;
  return (
    <button onClick={interactive ? onClick : undefined} className={interactive ? 'lo-press' : ''} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
      cursor: interactive ? 'pointer' : 'default', fontFamily: 'inherit',
      opacity: disabled ? 0.6 : 1,
    }}>
      <SettingsIconBadge name={icon} color={tint} size={32}/>
      <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>{label}</span>
      {trailNode || (trail && <span style={{ fontSize: 13, color: theme.text2 }}>{trail}</span>)}
      {interactive && <UIIcon name="chevronR" size={14} color={theme.text3}/>}
    </button>
  );
}

Object.assign(window, {
  TabBar, FAB, ScreenTopBar,
  MonthScreen, WeekScreen, CalendarScreen, CreateScreen, DetailScreen,
  OnboardingScreen, AIScreen, InboxScreen, StatsScreen, SettingsScreen,
  SettingsIconBadge, AgendaTaskRow, Card, OptionRow, Toggle, glassBtn,
});
