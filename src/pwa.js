// pwa.js — service worker registration and update detection.

const UPDATE_CHECK_EVERY_MS = 30 * 60 * 1000;

// Registers the worker in production builds. `onUpdateReady` fires when a newer deploy has
// taken control while this page was open — the page keeps running the old code until reloaded.
function registerServiceWorker({ onUpdateReady } = {}) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && onUpdateReady) onUpdateReady();
    hadController = true;
  });

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      // An installed app can stay open for days: look for a new deploy when it comes back.
      let lastCheck = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || Date.now() - lastCheck < UPDATE_CHECK_EVERY_MS) return;
        lastCheck = Date.now();
        registration.update().catch(() => {});
      });
    } catch {
      // Offline support is an enhancement; the app works without it.
    }
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

const PERSIST_ASKED_KEY = 'lifeos.persistAsked';

// Everything lives in this browser's storage, which the browser may evict under pressure
// (and Safari clears after a week without use unless the app is installed). Asking for
// persistent storage tells the browser this data matters. Asked once, after the user has
// actually saved something; some browsers show a prompt, most decide silently.
async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return 'unsupported';
    if (await navigator.storage.persisted()) return 'persisted';
    localStorage.setItem(PERSIST_ASKED_KEY, String(Date.now()));
    return (await navigator.storage.persist()) ? 'persisted' : 'best-effort';
  } catch {
    return 'unsupported';
  }
}

const persistenceWasRequested = () => {
  try { return !!localStorage.getItem(PERSIST_ASKED_KEY); } catch { return true; }
};

export { persistenceWasRequested, registerServiceWorker, requestPersistentStorage };
