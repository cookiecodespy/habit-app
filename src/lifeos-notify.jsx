// lifeos-notify.jsx — notifications + in-app toast system

import React from 'react';
import { loDateStr } from './domain/dates';
import { loDueReminders } from './domain/reminders';
import { subscribeStore } from './domain/storage';
import { LOStore } from './domain/store';
import { LIFE_PALETTE, UIIcon } from './lifeos-icons.jsx';
import { SettingsIconBadge } from './lifeos-screens.jsx';

const TOAST_KEY_NEXT = { v: 0 };

// In-app toast bus — components subscribe via useToasts(); anyone can call toast(msg, opts).
// opts: { tone: 'success'|'error', icon, duration, action: { label, run } }
const __TOAST_LISTENERS = new Set();
function toast(msg, opts = {}) {
  const t = { id: ++TOAST_KEY_NEXT.v, msg, ...opts };
  __TOAST_LISTENERS.forEach(fn => fn(t));
}

function useToasts() {
  const [items, setItems] = React.useState([]);
  const dismiss = React.useCallback((id) => setItems(prev => prev.filter(x => x.id !== id)), []);
  React.useEffect(() => {
    const fn = (t) => {
      setItems(prev => [...prev, t]);
      setTimeout(() => dismiss(t.id), t.duration || (t.action ? 6000 : 2800));
    };
    __TOAST_LISTENERS.add(fn);
    return () => __TOAST_LISTENERS.delete(fn);
  }, [dismiss]);
  return [items, dismiss];
}

function ToastStack({ theme }) {
  const [items, dismiss] = useToasts();
  return (
    <div aria-live="polite" style={{
      position: 'absolute', left: 0, right: 0,
      top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
    }}>
      {items.map(t => (
        <div key={t.id} role="status" className="lo-slide-in" style={{
          background: t.tone === 'success'
            ? `linear-gradient(135deg, #1FA98F, #147A68)`
            : t.tone === 'error'
            ? `linear-gradient(135deg, ${LIFE_PALETTE.coral.from}, ${LIFE_PALETTE.coral.to})`
            : theme.surfaceHi,
          color: t.tone ? '#fff' : theme.text,
          border: t.tone ? 'none' : `0.5px solid ${theme.border}`,
          borderRadius: 14, padding: t.action ? '7px 7px 7px 16px' : '10px 16px',
          fontSize: 13.5, fontWeight: 600, letterSpacing: -0.1,
          maxWidth: '88%',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', gap: 8,
          pointerEvents: t.action ? 'auto' : 'none',
        }}>
          {t.icon && <UIIcon name={t.icon} size={16} color={t.tone ? '#fff' : theme.text} strokeWidth={2.2}/>}
          <span>{t.msg}</span>
          {t.action && (
            <button className="lo-press" onClick={() => { dismiss(t.id); t.action.run(); }} style={{
              marginLeft: 6, border: 'none', borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              background: t.tone ? 'rgba(0,0,0,0.22)' : theme.accent, color: '#fff',
            }}>{t.action.label}</button>
          )}
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

// Shows a system notification. Phones (Android, installed iOS apps) only accept notifications
// raised through the service worker; desktop browsers also accept the direct constructor.
// Resolves to whether it could be shown.
async function sendNotif(title, body, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  const details = { body, tag: options.tag || 'lifeos', icon: '/icons/icon-192.png', lang: 'es' };
  try {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (registration && registration.active) {
      await registration.showNotification(title, details);
      return true;
    }
  } catch {
    // fall through to the direct constructor
  }
  try {
    new Notification(title, details);
    return true;
  } catch {
    return false;
  }
}

// Heartbeat: checks the day's tasks and notifies ~10 min before each one that has its
// reminder on. Runs every minute, when the tab becomes visible and when the data changes.
// It only works while the app is open (or recently in the background).
function useTaskNotifications(user) {
  React.useEffect(() => {
    if (!user) return;
    const sent = new Set();
    const check = () => {
      if (notifPermission() !== 'granted') return;
      for (const { key, task, minutes } of loDueReminders(LOStore.tasksForDate(loDateStr()), new Date(), sent)) {
        sent.add(key);
        sendNotif(`En ${minutes} min: ${task.title}`, task.note || '', { tag: task.id })
          .then((shown) => { if (!shown) sent.delete(key); });
      }
    };
    check();
    const id = setInterval(check, 60000);
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    const unsubscribe = subscribeStore(check);
    window.addEventListener('lo-notification-permission', check);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); unsubscribe(); window.removeEventListener('lo-notification-permission', check); };
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
    window.dispatchEvent(new CustomEvent('lo-notification-permission'));
    if (p === 'granted') {
      sendNotif('Notificaciones activadas', 'Te avisaré de las tareas con recordatorio mientras LifeOS esté abierta.');
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
      <span style={{ flex: 1, fontSize: 14.5, color: theme.text, letterSpacing: -0.1 }}>Notificaciones<small style={{ display: 'block', fontWeight: 400, fontSize: 11.5, marginTop: 3, color: theme.text3 }}>Avisan 10 min antes de una tarea con recordatorio, mientras LifeOS está abierta</small></span>
      <span style={{ fontSize: 13, color: perm === 'granted' ? LIFE_PALETTE.mint.to : theme.text2 }}>{label}</span>
    </button>
  );
}

export { NotifSettingsRow, toast, ToastStack, useTaskNotifications };
