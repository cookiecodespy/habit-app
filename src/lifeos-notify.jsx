// lifeos-notify.jsx — notifications + in-app toast system

const TOAST_KEY_NEXT = { v: 0 };

// In-app toast bus — components subscribe via useToasts(), anyone can call window.lifeosToast()
const __TOAST_LISTENERS = new Set();
function toast(msg, opts = {}) {
  const t = { id: ++TOAST_KEY_NEXT.v, msg, ...opts };
  __TOAST_LISTENERS.forEach(fn => fn(t));
}

function useToasts() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const fn = (t) => {
      setItems(prev => [...prev, t]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), t.duration || 2800);
    };
    __TOAST_LISTENERS.add(fn);
    return () => __TOAST_LISTENERS.delete(fn);
  }, []);
  return items;
}

function ToastStack({ theme }) {
  const items = useToasts();
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      top: 'calc(env(safe-area-inset-top, 0px) + 70px)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
    }}>
      {items.map(t => (
        <div key={t.id} className="lo-slide-in" style={{
          background: t.tone === 'success'
            ? `linear-gradient(135deg, ${LIFE_PALETTE.mint.from}, ${LIFE_PALETTE.mint.to})`
            : t.tone === 'error'
            ? `linear-gradient(135deg, ${LIFE_PALETTE.coral.from}, ${LIFE_PALETTE.coral.to})`
            : theme.surfaceHi,
          color: t.tone ? '#fff' : theme.text,
          border: t.tone ? 'none' : `0.5px solid ${theme.border}`,
          borderRadius: 14, padding: '10px 16px',
          fontSize: 13.5, fontWeight: 600, letterSpacing: -0.1,
          maxWidth: '88%',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {t.icon && <UIIcon name={t.icon} size={16} color={t.tone ? '#fff' : theme.text} strokeWidth={2.2}/>}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Browser Notification API wrapper
// ──────────────────────────────────────────────────────────────
function notifPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

async function requestNotifPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch { return 'denied'; }
}

function sendNotif(title, body, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
  try {
    return new Notification(title, {
      body, icon: options.icon, tag: options.tag || 'lifeos',
      ...options,
    });
  } catch { return null; }
}

// Useful: schedule a heartbeat that checks if any task starts soon and notifies.
// In a real app this would be a service worker. For now: on each tab activation,
// check upcoming tasks within next 10 min and notify if needed.
function useTaskNotifications(user) {
  React.useEffect(() => {
    if (!user) return;
    if (notifPermission() !== 'granted') return;
    const seen = new Set();
    const check = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      TODAY_TASKS.forEach(t => {
        if (t.kind === 'break' || t.status !== 'todo') return;
        const [h, m] = t.start.split(':').map(Number);
        const diff = (h * 60 + m) - nowMins;
        if (diff > 0 && diff <= 10 && !seen.has(t.id)) {
          seen.add(t.id);
          sendNotif(`En ${diff} min: ${t.title}`, t.subtitle || '', { tag: t.id });
        }
      });
    };
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user]);
}

// ──────────────────────────────────────────────────────────────
// Settings row for notifications toggle
// ──────────────────────────────────────────────────────────────
function NotifSettingsRow({ theme }) {
  const [perm, setPerm] = React.useState(notifPermission());
  const enable = async () => {
    const p = await requestNotifPermission();
    setPerm(p);
    if (p === 'granted') {
      sendNotif('Notificaciones activadas', 'Te avisaré antes de cada tarea.');
      toast('Notificaciones activadas', { tone: 'success', icon: 'check' });
    } else if (p === 'denied') {
      toast('Permiso denegado · actívalas desde ajustes del sistema', { tone: 'error' });
    }
  };
  const label = perm === 'granted' ? 'Activadas'
              : perm === 'denied'  ? 'Bloqueadas en el sistema'
              : perm === 'unsupported' ? 'No disponibles'
              : 'Tocar para activar';
  return (
    <button onClick={enable} className="lo-press" disabled={perm === 'granted' || perm === 'unsupported'} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
      cursor: perm === 'granted' || perm === 'unsupported' ? 'default' : 'pointer',
      fontFamily: 'inherit',
    }}>
      <SettingsIconBadge name="bell" color="coral" size={32}/>
      <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Notificaciones</span>
      <span style={{ fontSize: 13, color: perm === 'granted' ? LIFE_PALETTE.mint.to : theme.text2 }}>{label}</span>
    </button>
  );
}

Object.assign(window, {
  toast, useToasts, ToastStack,
  notifPermission, requestNotifPermission, sendNotif,
  useTaskNotifications, NotifSettingsRow,
});
