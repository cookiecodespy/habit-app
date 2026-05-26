// lifeos-app.jsx — wires the prototype frame + variants into a DesignCanvas

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "density": "comfy",
  "blockShape": "rounded",
  "accent": "#FF8765"
}/*EDITMODE-END*/;

const ACCENT_SWATCHES = ['#FF8765', '#FFB347', '#5BE0B5', '#B79EFF'];

function useThemed(t) {
  const base = t.dark ? TL_THEMES.dark : TL_THEMES.light;
  return React.useMemo(() => ({
    ...base,
    accent: t.accent,
    accentSoft: t.accent + (t.dark ? '22' : '18'),
  }), [t.dark, t.accent]);
}

// ──────────────────────────────────────────────────────────────
// User task store — persists to localStorage
// ──────────────────────────────────────────────────────────────
const USER_TASKS_KEY = 'lifeos.user_tasks';

function loadUserTasks() {
  try { const r = localStorage.getItem(USER_TASKS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveUserTasks(tasks) {
  try { localStorage.setItem(USER_TASKS_KEY, JSON.stringify(tasks)); } catch {}
}

// ──────────────────────────────────────────────────────────────
// PrototypeFrame — the navigable demo, lives in its own iOS frame
// ──────────────────────────────────────────────────────────────
function PrototypeFrame({ t, setTweak }) {
  const theme = useThemed(t);
  const { user, setName } = useUser();
  const [tab, setTab] = React.useState('timeline');
  const [overlay, setOverlay] = React.useState(null);
  const [detailTask, setDetailTask] = React.useState(null);
  const [userTasks, setUserTasksState] = React.useState(loadUserTasks);

  useTaskNotifications(user);

  const isDense = t.density === 'compact';

  const addUserTask = React.useCallback((task) => {
    setUserTasksState(prev => {
      const next = [...prev, task];
      saveUserTasks(next);
      return next;
    });
    toast(`Tarea "${task.title}" agendada`, { tone: 'success', icon: 'check' });
  }, []);

  const openTaskDetail = (task) => { setDetailTask(task); setOverlay('detail'); };
  const startFocus = (task) => { setDetailTask(task); setOverlay('focus'); };

  // First-time gate
  if (!user) {
    return <WelcomeScreen theme={theme} onDone={(u) => {
      setName(u.name);
      toast(`¡Hola, ${u.name}! Bienvenida a LifeOS`, { tone: 'success', icon: 'check' });
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
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
          }}>
            <TimelineHeaderBody theme={theme} userTasks={userTasks}/>
            <DeadlineCard theme={theme}/>
            <QuickActionsRow theme={theme} onAdd={() => setOverlay('create')}/>
            <TimelineClassic
              theme={theme}
              dense={isDense}
              blockShape={t.blockShape}
              onOpenTask={openTaskDetail}
              onAdd={() => setOverlay('create')}
              userTasks={userTasks}
            />
          </div>
        </div>
      )}
      {tab !== 'timeline' && tab !== 'ai' && (
        <div className="lo-tab-fade" key={tab} style={{
          position: 'absolute', inset: 0,
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 40px) + 6px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
          overflowY: 'auto',
        }}>
          {tab === 'month' && <MonthScreen theme={theme} onBack={() => setTab('timeline')} embedded onOpenTask={openTaskDetail} />}
          {tab === 'stats' && <StatsScreen theme={theme} onBack={() => setTab('timeline')} embedded/>}
          {tab === 'settings' && <SettingsScreen theme={theme} onBack={() => setTab('timeline')} embedded
            user={user}
            onEditName={() => setOverlay('editname')}/>}
        </div>
      )}
      {tab === 'ai' && (
        <div className="lo-tab-fade" style={{
          position: 'absolute', inset: 0,
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 40px) + 6px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <AIScreen theme={theme} onBack={() => setTab('timeline')} embedded/>
        </div>
      )}

      {/* Overlays */}
      {overlay === 'inbox' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <InboxScreen theme={theme} onBack={() => setOverlay(null)}/>
        </Sheet>
      )}
      {overlay === 'create' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <CreateScreen theme={theme} onBack={() => setOverlay(null)} onSave={addUserTask}/>
        </Sheet>
      )}
      {overlay === 'detail' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <DetailScreen theme={theme} task={detailTask} onBack={() => setOverlay(null)} onStartFocus={() => setOverlay('focus')}/>
        </Sheet>
      )}
      {overlay === 'routines' && (
        <Sheet theme={theme} onClose={() => setOverlay(null)}>
          <RoutinesScreen theme={theme} onBack={() => setOverlay(null)} onApply={() => setOverlay(null)}/>
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
        <FocusMode theme={theme} task={detailTask} onClose={() => setOverlay(null)}/>
      )}
      {overlay === 'quickadd' && (
        <QuickAddMenu theme={theme} onClose={() => setOverlay(null)} onSelect={(kind) => {
          if (kind === 'task') setOverlay('create');
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
      <div style={{ position: 'absolute', inset: 0, paddingTop: 58, paddingBottom: 90, overflowY: 'auto' }}>
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
      <div style={{ position: 'absolute', inset: 0, paddingTop: 58, paddingBottom: withTabBar ? 80 : 0, overflowY: 'auto' }}>
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
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: theme.bg,
      // Handle iOS safe areas
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <PrototypeFrame t={t} setTweak={setTweak}/>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main App: DesignCanvas with all sections
// ──────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = useThemed(t);

  // On real phones, skip design canvas and render the app directly
  const isMobile = typeof window !== 'undefined' &&
    (window.matchMedia('(max-width: 600px)').matches || /Mobi|iPhone|iPad|Android/i.test(navigator.userAgent));

  if (isMobile) {
    return <MobileApp t={t} setTweak={setTweak}/>;
  }

  const W = 390, H = 844;

  return (
    <>
      <DesignCanvas>
        <DCSection id="prototype" title="LifeOS · Prototipo interactivo" subtitle="Toca: timeline → detalle de tarea → IA planner → ajustes. La barra inferior cambia de pantalla.">
          <DCArtboard id="proto" label="Interactivo · Hoy" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <PrototypeFrame t={t} setTweak={setTweak}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="timeline-variants" title="Timeline · 4 diseños" subtitle="Misma data, cuatro formas de ver el día. Usa el panel de Personalizar para cambiar densidad / forma / paleta.">
          <DCArtboard id="v1" label="01 · Clásico" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <VariantFrame t={t} label="Hoy" sub="Viernes · 16 May">
                <QuickActionsRow theme={useThemed(t)}/>
                <TimelineClassic theme={useThemed(t)} dense={t.density === 'compact'} blockShape={t.blockShape}/>
              </VariantFrame>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="v2" label="02 · Cards" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <VariantFrame t={t} label="Hoy" sub="Viernes · 16 May">
                <TimelineCards theme={useThemed(t)} dense={t.density === 'compact'} blockShape={t.blockShape}/>
              </VariantFrame>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="v3" label="03 · Rejilla horaria" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <VariantFrame t={t} label="Hoy" sub="6 AM → 11 PM">
                <TimelineHourly theme={useThemed(t)} dense={t.density === 'compact'} blockShape={t.blockShape}/>
              </VariantFrame>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="v4" label="04 · Mínimo" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <VariantFrame t={t} label="Hoy" sub="Sin chrome">
                <TimelineMinimal theme={useThemed(t)}/>
              </VariantFrame>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="screens" title="Pantallas" subtitle="Todas las que usa el prototipo.">
          <DCArtboard id="onboarding" label="Onboarding" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t} withTabBar={false}>
                <OnboardingScreen theme={useThemed(t)} onBack={() => {}}/>
              </ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="month" label="Agenda" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t}><MonthScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="week" label="Semana" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t}><WeekScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="ai" label="IA Planner" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t}><AIScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="create" label="Crear tarea" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t} withTabBar={false}><CreateScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="detail" label="Detalle de tarea" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t} withTabBar={false}><DetailScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="inbox" label="Inbox" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t}><InboxScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="stats" label="Stats" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t}><StatsScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="settings" label="Ajustes" width={W} height={H}>
            <IOSDevice width={W} height={H} dark={t.dark}>
              <ScreenArtboard t={t}><SettingsScreen theme={useThemed(t)} onBack={() => {}}/></ScreenArtboard>
            </IOSDevice>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="LifeOS — Personalizar">
        <TweakSection label="Apariencia"/>
        <TweakToggle label="Modo oscuro" value={t.dark} onChange={(v) => setTweak('dark', v)}/>
        <TweakColor label="Acento" value={t.accent}
          options={ACCENT_SWATCHES}
          onChange={(v) => setTweak('accent', v)}/>
        <TweakSection label="Diseño"/>
        <TweakRadio label="Densidad" value={t.density}
          options={['compact','comfy']}
          onChange={(v) => setTweak('density', v)}/>
        <TweakRadio label="Forma" value={t.blockShape}
          options={['rounded','squircle','pill']}
          onChange={(v) => setTweak('blockShape', v)}/>
      </TweaksPanel>
    </>
  );
}

Object.assign(window, { App, PrototypeFrame, Sheet, useThemed, TWEAK_DEFAULTS, ACCENT_SWATCHES, VariantFrame, ScreenArtboard });
