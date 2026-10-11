import { expect, test } from '@playwright/test';
import { KEYS, appReady, openApp, quickAdd, stored, taskCard } from './helpers';

// Service workers need a secure context; Playwright's WebKit does not expose them the same
// way a real iPhone does, so this is verified on Chromium.
test.skip(({ browserName }) => browserName !== 'chromium', 'service worker tests run on Chromium');

async function workerInControl(page: import('@playwright/test').Page) {
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration?.active && !!navigator.serviceWorker.controller;
  }, undefined, { timeout: 20_000 });
}

test('la app abre y guarda cambios sin conexión', async ({ page, context }) => {
  await openApp(page, { [KEYS.tasks]: [{ id: 'a', title: 'Ya estaba', date: '2020-01-01', start: '09:00', durationMin: 30, recur: { freq: 'daily' } }] });
  await workerInControl(page);

  await context.setOffline(true);
  await page.reload();
  await appReady(page);
  await expect(taskCard(page, 'Ya estaba')).toBeVisible();
  // Fonts come from the cache too: no third-party request is needed.
  const fonts = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).sort(); });
  expect(fonts).toEqual(['Fraunces', 'Hanken Grotesk']);

  await quickAdd(page, 'Nueva tarea');
  await page.getByPlaceholder('Nombre de la tarea').fill('Creada sin red');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(taskCard(page, 'Creada sin red')).toBeVisible();

  await page.reload();
  await appReady(page);
  await expect(taskCard(page, 'Creada sin red')).toBeVisible();
  expect(await stored<unknown[]>(page, KEYS.tasks)).toHaveLength(2);
});

test('todo lo necesario queda guardado en el dispositivo tras la primera visita', async ({ page, request }) => {
  await openApp(page);
  await workerInControl(page);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names[0]);
    return { names, urls: (await cache.keys()).map((r) => new URL(r.url).pathname).sort() };
  });
  expect(cached.names).toHaveLength(1);
  expect(cached.names[0]).toMatch(/^lifeos-[0-9a-f]{12}$/);
  const html = await (await request.get('/')).text();
  const referenced = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  expect(referenced.length).toBeGreaterThan(1);
  for (const url of ['/', '/manifest.webmanifest', ...referenced]) expect(cached.urls, url).toContain(url);
});
