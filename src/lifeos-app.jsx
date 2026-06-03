// lifeos-app.jsx — wires the prototype frame + variants into a DesignCanvas

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "density": "comfy",
  "blockShape": "rounded",
  "accent": "#FF8765"
}/*EDITMODE-END*/;

const ACCENT_SWATCHES = ['#FF8765', '#FFB347', '#5BE0B5', '#B79EFF'];

// First free 30-min slot on a day — from now if it's today, else 9:00.
// Used when scheduling an inbox item so it doesn't stomp on a busy hour (B12).
function loFreeSlotStart(date, durationMin = 30) {
  const isToday = date === loDateStr();
  const now = new Date();
  let cursor = isToday ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30 : 9 * 60;
  const busy = (LOStore.tasksForDate(date) || []).map(t => ({ s: loHHMMtoMin(t.start), e: loHHMMtoMin(t.start) + (t.durationMin || 30) }));
  let guard = 0, clash;
  const overlaps = (s) => busy.find(o => s < o.e && (s + durationMin) > o.s);
  while ((clash = overlaps(cursor)) && guard++ < 48) cursor = clash.e;
  return loMinToHHMM(cursor);
}

function useThemed(t) {
  const base = t.dark ? TL_THEMES.dark : TL_THEMES.light;
  return React.useMemo(() => ({
    ...base,
    accent: t.accent,
    accentSoft: t.accent + (t.dark ? '22' : '18'),
  }), [t.dark, t.accent]);
}

// ──────────────────────────────────────────────────────────────
// PrototypeFrame — the navigable demo, lives in its own iOS frame
// (task persistence now lives in the LifeOS store, see lifeos-data.jsx)
// ──────────────────────────────────────────────────────────────
function PrototypeFrame({ t, setTweak }) {
  const theme = useThemed(t);
  const { user, setName } = useUser();
  const [tab, setTab] = React.useState('timeline');
  const [overlay, setOverlay] = React.useState(null);
  const [detailTask, setDetailTask] = React.useState(null);
  const [editHabit, setEditHabit] = React.useState(null);
  const tasks = useTasks();
  const userTasks = tasks.all;

  useTaskNotifications(user);

  const isDense = t.density === 'compact';

  const addUserTask = React.useCallback((task) => {
    const saved = tasks.add(task);
    toast(`Tarea "${saved.title}" agendada`, { tone: 'success', icon: 'check' });
    return saved;
  }, [tasks]);

  const deleteUserTask = React.useCallback((id) => {
    tasks.remove(id);
    setOverlay(null);
    toast('Tarea eliminada', { icon: 'trash' });
  }, [tasks]);

  const scheduleInbox = React.useCallback((it) => {
    const date = loDateStr();
    const saved = tasks.add({ title: it.text, start: loFreeSlotStart(date), durationMin: 30, date });
    toast(`"${saved.title}" agendada a las ${fmt12(saved.start)}`, { tone: 'success', icon: 'check' });
  }, [tasks]);

  const completeFocus = React.useCallback(() => {
    if (detailTask) tasks.toggle(detailTask.id);
    setOverlay(null);
    toast('¡Tarea completada! 🎉', { tone: 'success', icon: 'check' });
  }, [tasks, detailTask]);

  const openTaskDetail = (task) => { setDetailTask(task); setOverlay('detail'); };
  const startFocus = (task) => { setDetailTask(task); setOverlay('focus'); };
  const openHabitEdit = (h) => { setEditHabit(h); setOverlay('habitEdit'); };

  // First-time gate
  if (!user) {
    return <WelcomeScreen theme={theme} onDone={(u) => {
      setName(u.name);
      toast(`¡Hola, ${u.name}! Tu LifeOS está listo`, { tone: 'success', icon: 'check' });
    }}/>;
  }

  // Scrollable content holder; tab bar pinned at bottom.
  return (
    <div data-screen-label="Prototype" style={{ position: 'relative', width: '100%', height: '100%', background: theme.bg, overflow: 'hidden' }}>
      {tab === 'timeline' && (
        <div className="lo-tab-fade" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Sticky top bar with safe-area + solid bg */}
          <div style={{
            flexShrink: 0,
            paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 40px) + 6px)',
            background: theme.bg,
            position: 'relative', zIndex: 5,
          }}>
            <TimelineTopBar theme={theme} userName={user.name} onOpen={(k) => {
              if (k === 'inbox') setOverlay('inbox');
              else if (k === 'ai') setTab('ai');
              else if (k === 'month') setTab('month');
              else if (k === 'settings') setTab('settings');
              else if (k === 'search') setOverlay('search');
            }}/>
          </div>
          {/* Scrollable rest */}
          <div style={{
            flex: 1, overflowY: 'auto', minHeight: 0,
            paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 6px) + 88px)',
          }}>
            <TimelineHeaderBody theme={theme} userTasks={userTasks}/>
            <HabitsStrip theme={theme} onAdd={() => setOverlay('habit')} onEdit={openHabitEdit}/>
            <DeadlineCard theme={theme} onOpenTask={openTaskDetail}/>
            <TimelineClassic
              theme={theme}
              dense={isDense}
              blockShape={t.blockShape}
              onOpenTask={openTaskDetail}
              onAdd={() => setOverlay('create')}
              onToggle={tasks.toggle}
              userTasks={userTasks}
            />
          </div>
        </div>
      )}
      {tab !== 'timeline' && tab !== 'ai' && (
        <div className="lo-tab-fade" key={tab} style={{
          position: 'absolute', inset: 0,
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 40px) + 6px)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 6px) + 88px)',
          overflowY: 'auto',
        }}>
          {tab === 'month' && <CalendarScreen theme={theme} onBack={() => setTab('timeline')} embedded onOpenTask={openTaskDetail} onAdd={() => setOverlay('create')} userTasks={userTasks}/>}
          {tab === 'stats' && <StatsScreen theme={theme} onBack={() => setTab('timeline')} embedded userTasks={userTasks}/>}
          {tab === 'settings' && <SettingsScreen theme={theme} onBack={() => setTab('timeline')} embedded
            user={user} userTasks={userTasks} t={t} setTweak={setTweak}
            onEditName={() => setOverlay('editname')}/>}
        </div>
      )}
      {tab === 'ai' && (
        <div className="lo-tab-fade" style={{
          position: 'absolute', inset: 0,
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 40px) + 6px)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 6px) + 88px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <AIScreen theme={theme} onBack={() => setTab('timeline')} embedded/>
        </div>
      )}

      {/* Overlays */}
      {overlay === 'inbox' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <InboxScreen theme={theme} onBack={() => setOverlay(null)} onSchedule={scheduleInbox}/>
        </Sheet>
      )}
      {overlay === 'create' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <CreateScreen theme={theme} onBack={() => setOverlay(null)} onSave={addUserTask}/>
        </Sheet>
      )}
      {overlay === 'detail' && detailTask && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <DetailScreen theme={theme}
            task={userTasks.find(x => x.id === detailTask.id) || detailTask}
            onBack={() => setOverlay(null)}
            onStartFocus={() => setOverlay('focus')}
            onComplete={() => tasks.toggle(detailTask.id)}
            onToggleSubtask={(subId) => tasks.toggleSubtask(detailTask.id, subId)}
            onUpdate={(patch) => tasks.update(detailTask.id, patch)}
            onDelete={() => deleteUserTask(detailTask.id)}/>
        </Sheet>
      )}
      {overlay === 'routines' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <RoutinesScreen theme={theme} onBack={() => setOverlay(null)} onApply={(routine) => {
            const n = LOStore.applyRoutine(routine);
            toast(`Rutina agendada · ${n} ${n === 1 ? 'tarea' : 'tareas'}`, { tone: 'success', icon: 'check' });
            setOverlay(null);
          }}/>
        </Sheet>
      )}
      {overlay === 'habit' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <HabitCreateSheet theme={theme} onClose={() => setOverlay(null)}/>
        </Sheet>
      )}
      {overlay === 'habitEdit' && editHabit && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <HabitCreateSheet theme={theme} habit={editHabit} onClose={() => setOverlay(null)}/>
        </Sheet>
      )}
      {overlay === 'editname' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <EditNameSheet theme={theme} currentName={user.name}
            onSave={(name) => setName(name)}
            onClose={() => setOverlay(null)}/>
        </Sheet>
      )}
      {overlay === 'onboarding' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)} full>
          <OnboardingScreen theme={theme} onBack={() => setOverlay(null)}/>
        </Sheet>
      )}
      {overlay === 'search' && (
        <SearchOverlay theme={theme} onClose={() => setOverlay(null)} onPickTask={openTaskDetail}/>
      )}
      {overlay === 'focus' && detailTask && (
        <FocusMode theme={theme} task={detailTask} onClose={() => setOverlay(null)} onComplete={completeFocus}/>
      )}
      {overlay === 'quickadd' && (
        <QuickAddMenu theme={theme} onClose={() => setOverlay(null)} onSelect={(kind) => {
          if (kind === 'task') setOverlay('create');
          else if (kind === 'habit') setOverlay('habit');
          else if (kind === 'routine') setOverlay('routines');
          else if (kind === 'inbox') setOverlay('inbox');
          else if (kind === 'voice') setTab('ai');
        }}/>
      )}

      {tab === 'timeline' && !overlay && <FAB theme={theme} onClick={() => setOverlay('quickadd')}/>}
      {!overlay && <TabBar theme={theme} current={tab} onChange={setTab}/>}
      <ToastStack theme={theme}/>
    </div>
  );
}

function Sheet({ theme, onClose, children, full }) {
  return (
    <div className="lo-fade" style={{
      position: 'absolute', inset: 0, zIndex: 30,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', justifyContent: full ? 'stretch' : 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="lo-sheet-enter" style={{
        background: theme.bg,
        borderRadius: full ? 0 : '28px 28px 0 0',
        height: full ? '100%' : '93%',
        paddingTop: full ? 0 : 16,
        boxShadow: '0 -20px 80px rgba(0,0,0,0.5)',
        overflowY: 'auto',
        position: 'relative',
        willChange: 'transform',
      }}>
        {!full && (
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            width: 40, height: 5, borderRadius: 3, background: theme.rail,
            zIndex: 10,
          }}/>
        )}
        {children}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// VariantArtboard — wraps a timeline variant in a labelled frame
// ──────────────────────────────────────────────────────────────
function VariantFrame({ t, label, sub, children }) {
  const theme = useThemed(t);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, paddingTop: 58, paddingBottom: 80, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: theme.text3, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{sub}</div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: theme.text, letterSpacing: -0.6, marginTop: 2 }}>
                {label}
              </h1>
            </div>
            <div style={{ color: theme.text2, display: 'flex', gap: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UIIcon name="search" size={16} color={theme.text2}/>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: theme.surface, border: `0.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UIIcon name="ai" size={16} color={theme.text2}/>
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
      <FAB theme={theme} onClick={() => {}}/>
      <TabBar theme={theme} current="timeline" onChange={() => {}}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Static screen wrapper (for non-timeline screens shown as artboards)
// ──────────────────────────────────────────────────────────────
function ScreenArtboard({ t, children, withTabBar = true }) {
  const theme = useThemed(t);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: theme.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, paddingTop: 58, paddingBottom: withTabBar ? 76 : 0, overflowY: 'auto' }}>
        {children}
      </div>
      {withTabBar && <TabBar theme={theme} current="timeline" onChange={() => {}}/>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MobileApp — renders only the PrototypeFrame filling the viewport
// Used on real phones instead of the full design canvas
// ──────────────────────────────────────────────────────────────
function MobileApp({ t, setTweak }) {
  const theme = useThemed(t);
  React.useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.overscrollBehavior = 'none';
  }, [theme.bg]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.bg }}>
      <PrototypeFrame t={t} setTweak={setTweak}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// TabletApp — sidebar + main content layout for iPad / wide touch
// ──────────────────────────────────────────────────────────────
const TABLET_NAV = [
  { id: 'timeline', icon: 'timeline', label: 'Hoy' },
  { id: 'month',    icon: 'calendar', label: 'Agenda' },
  { id: 'ai',       icon: 'ai',       label: 'IA Planner' },
  { id: 'stats',    icon: 'stats',    label: 'Stats' },
  { id: 'settings', icon: 'settings', label: 'Ajustes' },
];

function TabletApp({ t, setTweak }) {
  const theme = useThemed(t);
  const { user, setName } = useUser();
  const [tab, setTab] = React.useState('timeline');
  const [overlay, setOverlay] = React.useState(null);
  const [detailTask, setDetailTask] = React.useState(null);
  const [editHabit, setEditHabit] = React.useState(null);
  const tasks = useTasks();
  const userTasks = tasks.all;

  useTaskNotifications(user);

  const isDense = t.density === 'compact';

  // Wide desktop → 2-column dashboard; narrow tablet → single column.
  const [isWide, setIsWide] = React.useState(() => typeof window !== 'undefined' && window.innerWidth >= 1000);
  React.useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1000);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const addUserTask = React.useCallback((task) => {
    const saved = tasks.add(task);
    toast(`Tarea "${saved.title}" agendada`, { tone: 'success', icon: 'check' });
    return saved;
  }, [tasks]);

  const deleteUserTask = React.useCallback((id) => {
    tasks.remove(id);
    setOverlay(null);
    toast('Tarea eliminada', { icon: 'trash' });
  }, [tasks]);

  const scheduleInbox = React.useCallback((it) => {
    const date = loDateStr();
    const saved = tasks.add({ title: it.text, start: loFreeSlotStart(date), durationMin: 30, date });
    toast(`"${saved.title}" agendada a las ${fmt12(saved.start)}`, { tone: 'success', icon: 'check' });
  }, [tasks]);

  const completeFocus = React.useCallback(() => {
    if (detailTask) tasks.toggle(detailTask.id);
    setOverlay(null);
    toast('¡Tarea completada! 🎉', { tone: 'success', icon: 'check' });
  }, [tasks, detailTask]);

  const openTaskDetail = (task) => { setDetailTask(task); setOverlay('detail'); };
  const openHabitEdit = (h) => { setEditHabit(h); setOverlay('habitEdit'); };

  if (!user) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: theme.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 420, maxWidth: '90vw' }}>
          <WelcomeScreen theme={theme} onDone={(u) => {
            setName(u.name);
            toast(`¡Hola, ${u.name}! Tu LifeOS está listo`, { tone: 'success', icon: 'check' });
          }}/>
        </div>
        <ToastStack theme={theme}/>
      </div>
    );
  }

  const SIDEBAR_W = 256;

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', background: theme.bg, overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: theme.surface,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
      }}>
        {/* Logo + greeting */}
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 12px ${theme.accent}44`,
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>L</span>
            </div>
            <div>
              <div style={{ fontSize: 10, color: theme.text3, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>LifeOS</div>
              <div style={{ fontSize: 13, color: theme.text2, fontWeight: 500 }}>Hola, {user.name.split(' ')[0]} 👋</div>
            </div>
          </div>
        </div>

        {/* Date header */}
        <div style={{ padding: '0 20px 16px', borderBottom: `1px solid ${theme.border}` }}>
          {(() => {
            const now = new Date();
            const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
            const MON = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return (
              <div>
                <div className="lo-display" style={{ fontSize: 24, fontWeight: 600, color: theme.text, letterSpacing: -0.4 }}>
                  {DAY_NAMES[now.getDay()]} <span style={{ color: theme.accent }}>{now.getDate()}</span>
                </div>
                <div style={{ fontSize: 12, color: theme.text3, marginTop: 1 }}>
                  {MON[now.getMonth()]} {now.getFullYear()}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {TABLET_NAV.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id}
                className="lo-press"
                onClick={() => setTab(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 13, marginBottom: 2,
                  background: active ? theme.accentSoft : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s',
                }}>
                <UIIcon name={item.icon} size={20} color={active ? theme.accent : theme.text3}/>
                <span style={{
                  fontSize: 15, fontWeight: active ? 700 : 500,
                  color: active ? theme.accent : theme.text2,
                }}>
                  {item.label}
                </span>
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: 3, background: theme.accent }}/>}
              </button>
            );
          })}
        </div>

        {/* Nueva tarea CTA */}
        <div style={{ padding: '12px 12px 4px' }}>
          <button
            className="lo-press"
            onClick={() => setOverlay('create')}
            style={{
              width: '100%', padding: '13px 16px',
              background: theme.accent, color: '#fff',
              border: 'none', borderRadius: 15, cursor: 'pointer',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 4px 16px ${theme.accent}55`,
            }}>
            <UIIcon name="plus" size={17} color="#fff"/>
            Nueva tarea
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {tab === 'timeline' && (
          <div className="lo-tab-fade" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              flexShrink: 0, background: theme.bg,
              paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
              zIndex: 5,
            }}>
              <TimelineTopBar theme={theme} userName={user.name} onOpen={(k) => {
                if (k === 'inbox') setOverlay('inbox');
                else if (k === 'ai') setTab('ai');
                else if (k === 'search') setOverlay('search');
              }}/>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 48 }}>
              {isWide ? (
                /* ── Desktop dashboard: timeline (main) + right rail ── */
                <div style={{
                  maxWidth: 1180, margin: '0 auto', padding: '0 24px',
                  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px',
                  gap: 28, alignItems: 'start',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <TimelineHeaderBody theme={theme} userTasks={userTasks}/>
                    <TimelineClassic
                      theme={theme} dense={isDense} blockShape={t.blockShape}
                      onOpenTask={openTaskDetail} onAdd={() => setOverlay('create')} onToggle={tasks.toggle}
                      userTasks={userTasks}
                    />
                  </div>
                  <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column' }}>
                    <HabitsStrip theme={theme} onAdd={() => setOverlay('habit')} onEdit={openHabitEdit}/>
                    <DeadlineCard theme={theme} onOpenTask={openTaskDetail}/>
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                  <TimelineHeaderBody theme={theme} userTasks={userTasks}/>
                  <HabitsStrip theme={theme} onAdd={() => setOverlay('habit')} onEdit={openHabitEdit}/>
                  <DeadlineCard theme={theme} onOpenTask={openTaskDetail}/>
                  <TimelineClassic
                    theme={theme} dense={isDense} blockShape={t.blockShape}
                    onOpenTask={openTaskDetail} onAdd={() => setOverlay('create')} onToggle={tasks.toggle}
                    userTasks={userTasks}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'month' && (
          <div className="lo-tab-fade" key="month" style={{
            position: 'absolute', inset: 0, overflowY: 'auto',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 32,
          }}>
            <CalendarScreen theme={theme} onBack={() => setTab('timeline')} embedded onOpenTask={openTaskDetail} onAdd={() => setOverlay('create')} userTasks={userTasks}/>
          </div>
        )}

        {tab === 'stats' && (
          <div className="lo-tab-fade" key="stats" style={{
            position: 'absolute', inset: 0, overflowY: 'auto',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 32,
          }}>
            <StatsScreen theme={theme} onBack={() => setTab('timeline')} embedded userTasks={userTasks}/>
          </div>
        )}

        {tab === 'settings' && (
          <div className="lo-tab-fade" key="settings" style={{
            position: 'absolute', inset: 0, overflowY: 'auto',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)', paddingBottom: 32,
          }}>
            <SettingsScreen theme={theme} onBack={() => setTab('timeline')} embedded
              user={user} userTasks={userTasks} t={t} setTweak={setTweak} onEditName={() => setOverlay('editname')}/>
          </div>
        )}

        {tab === 'ai' && (
          <div className="lo-tab-fade" key="ai" style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
          }}>
            <AIScreen theme={theme} onBack={() => setTab('timeline')} embedded/>
          </div>
        )}

        {/* FAB only on timeline */}
        {tab === 'timeline' && !overlay && <FAB theme={theme} onClick={() => setOverlay('create')}/>}

        {/* Overlays — full-screen over everything */}
        {overlay === 'inbox' && (
          <Sheet theme={theme} onClose={() => setOverlay(null)}>
            <InboxScreen theme={theme} onBack={() => setOverlay(null)} onSchedule={scheduleInbox}/>
          </Sheet>
        )}
        {overlay === 'create' && (
          <Sheet theme={theme} onClose={() => setOverlay(null)}>
            <CreateScreen theme={theme} onBack={() => setOverlay(null)} onSave={addUserTask}/>
          </Sheet>
        )}
        {overlay === 'habit' && (
          <Sheet theme={theme} onClose={() => setOverlay(null)}>
            <HabitCreateSheet theme={theme} onClose={() => setOverlay(null)}/>
          </Sheet>
        )}
        {overlay === 'habitEdit' && editHabit && (
          <Sheet theme={theme} onClose={() => setOverlay(null)}>
            <HabitCreateSheet theme={theme} habit={editHabit} onClose={() => setOverlay(null)}/>
          </Sheet>
        )}
        {overlay === 'detail' && detailTask && (
          <Sheet theme={theme} onClose={() => setOverlay(null)}>
            <DetailScreen theme={theme}
              task={userTasks.find(x => x.id === detailTask.id) || detailTask}
              onBack={() => setOverlay(null)}
              onStartFocus={() => setOverlay('focus')}
              onComplete={() => tasks.toggle(detailTask.id)}
              onToggleSubtask={(subId) => tasks.toggleSubtask(detailTask.id, subId)}
              onUpdate={(patch) => tasks.update(detailTask.id, patch)}
              onDelete={() => deleteUserTask(detailTask.id)}/>
          </Sheet>
        )}
        {overlay === 'focus' && detailTask && (
          <FocusMode theme={theme} task={detailTask} onClose={() => setOverlay(null)} onComplete={completeFocus}/>
        )}
        {overlay === 'search' && (
          <SearchOverlay theme={theme} onClose={() => setOverlay(null)} onPickTask={openTaskDetail}/>
        )}
        {overlay === 'editname' && (
          <Sheet theme={theme} onClose={() => setOverlay(null)}>
            <EditNameSheet theme={theme} currentName={user.name}
              onSave={(name) => setName(name)}
              onClose={() => setOverlay(null)}/>
          </Sheet>
        )}

        <ToastStack theme={theme}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main App: DesignCanvas with all sections
// ──────────────────────────────────────────────────────────────
function useLifeOSFonts() {
  React.useEffect(() => {
    if (document.getElementById('lo-fonts')) return;
    const pre1 = document.createElement('link'); pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link'); pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = 'anonymous';
    const link = document.createElement('link'); link.id = 'lo-fonts'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap';
    const style = document.createElement('style');
    style.id = 'lo-font-vars';
    style.textContent = `
:root{--font-ui:'Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
--font-display:'Fraunces','Georgia',serif;}
html,body,input,button,textarea,select{font-family:var(--font-ui);}
/* Display font carries optical weight + editorial character on big numbers/headers */
.lo-display{font-family:var(--font-display);font-optical-sizing:auto;letter-spacing:-0.01em;}
/* Film grain — the tactile signature that flat AI UIs forget. Sits over everything
   at low opacity, never blocks input. */
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.045;
mix-blend-mode:overlay;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
/* Respect users who ask for less motion (accessibility). */
@media (prefers-reduced-motion: reduce){
*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}
}`;
    document.head.append(pre1, pre2, link, style);
  }, []);
}

// ──────────────────────────────────────────────────────────────
// Main App — always renders the real product (no design-canvas chrome).
// Phone → single-column app; tablet/desktop → sidebar app.
// ──────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useLifeOSFonts();

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
    ? <MobileApp t={t} setTweak={setTweak}/>
    : <TabletApp t={t} setTweak={setTweak}/>;
}

Object.assign(window, { App, PrototypeFrame, TabletApp, MobileApp, Sheet, useThemed, TWEAK_DEFAULTS, ACCENT_SWATCHES, VariantFrame, ScreenArtboard });
