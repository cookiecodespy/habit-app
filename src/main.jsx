// main.jsx — entry point: mounts the app, fades the boot splash and wires the PWA shell.

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { setPersistErrorHandler, subscribeStore } from './domain/storage';
import { loMigrateLegacyTasks } from './domain/store';
import { ErrorBoundary } from './error-boundary.jsx';
import { App } from './lifeos-app.jsx';
import { toast } from './lifeos-notify.jsx';
import { persistenceWasRequested, registerServiceWorker, requestPersistentStorage } from './pwa.js';

loMigrateLegacyTasks();
setPersistErrorHandler((kind) => toast(
  kind === 'quota' ? 'No hay espacio para guardar. Exporta o libera datos.' : 'No se pudo guardar el cambio.',
  { tone: 'error', icon: kind === 'quota' ? 'alert' : undefined },
));

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App/>
  </ErrorBoundary>,
);

requestAnimationFrame(() => {
  setTimeout(() => {
    const splash = document.getElementById('lo-boot');
    if (!splash) return;
    splash.classList.add('gone');
    setTimeout(() => splash.remove(), 400);
  }, 350);
});

// The first time something is saved, ask the browser to keep this device's data safe.
if (!persistenceWasRequested()) {
  const stop = subscribeStore(() => { stop(); requestPersistentStorage(); });
}

registerServiceWorker({
  onUpdateReady: () => toast('Hay una versión nueva de LifeOS', {
    icon: 'sparkle', duration: 12000, action: { label: 'Actualizar', run: () => window.location.reload() },
  }),
});
