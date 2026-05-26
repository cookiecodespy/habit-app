// lifeos-user.jsx — user state persisted to localStorage + welcome screen

const USER_KEY = 'lifeos.user';

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || typeof u.name !== 'string' || !u.name.trim()) return null;
    // Migrate: pre-existing users without installedAt get NOW as their install
    // date so they still see demo data for their first week.
    if (!u.installedAt) {
      u.installedAt = Date.now();
      try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {}
    }
    return u;
  } catch { return null; }
}

function saveUser(u) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {}
}

function clearUser() {
  try { localStorage.removeItem(USER_KEY); } catch {}
}

function useUser() {
  const [user, setUser] = React.useState(loadUser);

  const setName = React.useCallback((name) => {
    const existing = user || {};
    const u = {
      ...existing,
      name: name.trim(),
      installedAt: existing.installedAt || Date.now(),
    };
    setUser(u);
    saveUser(u);
  }, [user]);

  const update = React.useCallback((patch) => {
    const u = { ...(user || {}), ...patch };
    setUser(u);
    saveUser(u);
  }, [user]);

  const reset = React.useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return { user, setName, update, reset };
}

// True for the first 7 days from when the user first signed up.
// Used to gate demo seed data: after a week, the app empties so the user
// fills it with their own real tasks.
function isWithinFirstWeek(user) {
  if (!user) return false;
  // Missing installedAt = treat as brand-new (legacy users)
  if (!user.installedAt) return true;
  return Date.now() - user.installedAt < 7 * 24 * 60 * 60 * 1000;
}

function isWithinFirstWeekFromStorage() {
  return isWithinFirstWeek(loadUser());
}

// First letter of name for avatar
function avatarLetter(name) {
  if (!name) return '?';
  const n = name.trim();
  return n.charAt(0).toUpperCase();
}

// Saludo según hora
function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ──────────────────────────────────────────────────────────────
// WelcomeScreen — first-launch onboarding to capture name
// ──────────────────────────────────────────────────────────────
function WelcomeScreen({ theme, onDone }) {
  const [name, setName] = React.useState('');
  const inputRef = React.useRef(null);
  const trimmed = name.trim();
  const canContinue = trimmed.length >= 2;

  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  const submit = () => {
    if (!canContinue) return;
    onDone({ name: trimmed });
  };

  return (
    <div data-screen-label="Welcome" className="lo-fade" style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: `radial-gradient(circle at 50% 0%, ${theme.accent}33 0%, transparent 60%), ${theme.bg}`,
      display: 'flex', flexDirection: 'column',
      padding: '32px 24px',
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
    }}>
      {/* Spacer top */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        {/* Logo mark */}
        <div className="lo-scale-in lo-breath" style={{
          width: 88, height: 88, borderRadius: 26,
          background: `linear-gradient(160deg, ${theme.accent}, ${theme.accent}AA)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 44, fontWeight: 800, letterSpacing: -2,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 16px 40px ${theme.accent}55`,
        }}>L</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.6, textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>
            Bienvenido a LifeOS
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: theme.text, letterSpacing: -0.8, lineHeight: 1.1 }}>
            ¿Cómo te <span style={{ color: theme.accent }}>llamas?</span>
          </h1>
          <p style={{ margin: '14px auto 0', maxWidth: 280, fontSize: 14, color: theme.text2, lineHeight: 1.5 }}>
            Usamos tu nombre para personalizar el saludo y tu perfil. Se guarda solo en este dispositivo.
          </p>
        </div>

        {/* Name input */}
        <div style={{ width: '100%', maxWidth: 360, marginTop: 8 }}>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Tu nombre"
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={32}
            style={{
              width: '100%', textAlign: 'center',
              background: theme.surface,
              border: `1px solid ${trimmed ? theme.accent + '88' : theme.border}`,
              borderRadius: 16,
              padding: '16px 20px',
              fontSize: 20, fontWeight: 600,
              color: theme.text,
              outline: 'none',
              fontFamily: 'inherit',
              letterSpacing: -0.2,
              transition: 'border-color .2s',
            }}/>
          {trimmed && (
            <div className="lo-fade" style={{
              marginTop: 12, textAlign: 'center',
              fontSize: 14, color: theme.text2,
            }}>
              <span style={{ opacity: 0.6 }}>{greetingFor()}, </span>
              <span style={{ color: theme.text, fontWeight: 600 }}>{trimmed}</span>
              <span style={{ opacity: 0.6 }}> 👋</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <button onClick={submit} disabled={!canContinue} className="lo-press" style={{
        background: canContinue
          ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent}DD)`
          : theme.surface,
        color: canContinue ? '#fff' : theme.text3,
        border: canContinue ? 'none' : `1px solid ${theme.border}`,
        height: 56, borderRadius: 18, fontSize: 16, fontWeight: 700,
        cursor: canContinue ? 'pointer' : 'default',
        letterSpacing: -0.2, fontFamily: 'inherit',
        boxShadow: canContinue ? `0 10px 28px ${theme.accent}55` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all .25s var(--ease-out-back)',
      }}>
        Empezar
        {canContinue && <UIIcon name="chevronR" size={18} color="#fff" strokeWidth={2.4}/>}
      </button>

      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11.5, color: theme.text3, lineHeight: 1.4 }}>
        Sin cuentas, sin emails. Tus datos viven en tu dispositivo.
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// EditNameSheet — opened from Settings to rename
// ──────────────────────────────────────────────────────────────
function EditNameSheet({ theme, currentName, onSave, onClose }) {
  const [name, setName] = React.useState(currentName || '');
  const inputRef = React.useRef(null);
  const trimmed = name.trim();
  const canSave = trimmed.length >= 2;

  React.useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  return (
    <div data-screen-label="Edit Name" style={{ padding: '0 16px 24px' }}>
      <ScreenTopBar theme={theme} title="Tu nombre" onBack={onClose}
        trailing={canSave ? (
          <button onClick={() => { onSave(trimmed); onClose(); }} className="lo-press" style={{
            background: 'transparent', border: 'none', color: theme.accent,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit',
          }}>Guardar</button>
        ) : null}/>
      <div style={{ padding: '20px 4px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.text3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>
          Cómo quieres que te llamemos
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canSave) { onSave(trimmed); onClose(); } }}
          placeholder="Tu nombre"
          maxLength={32}
          style={{
            width: '100%',
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 14, padding: '14px 16px',
            fontSize: 17, fontWeight: 500,
            color: theme.text, outline: 'none', fontFamily: 'inherit',
          }}/>
        <div style={{ fontSize: 12, color: theme.text3, marginTop: 10, lineHeight: 1.4 }}>
          Aparece en el saludo y en tu perfil. Puedes cambiarlo cuando quieras.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  useUser, loadUser, saveUser, clearUser, avatarLetter, greetingFor,
  isWithinFirstWeek, isWithinFirstWeekFromStorage,
  WelcomeScreen, EditNameSheet,
});
