import { readFile } from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join } from 'node:path';
import { type BrowserContext, type Page, expect, test } from '@playwright/test';
import { KEYS, appReady, openApp, quickAdd, seed, stored, taskCard } from './helpers';

// Service workers need a secure context; Playwright's WebKit does not expose them the same
// way a real iPhone does, so this is verified on Chromium.
test.skip(({ browserName }) => browserName !== 'chromium', 'service worker tests run on Chromium');

/** Waits until a service worker is active AND controls the page. */
async function workerInControl(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration?.active && !!navigator.serviceWorker.controller;
  }), { timeout: 20_000 }).toBe(true);
}

const cacheNames = (page: Page) => page.evaluate(() => caches.keys());

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
  const names = await cacheNames(page);
  expect(names).toHaveLength(1);
  expect(names[0]).toMatch(/^lifeos-[0-9a-f]{12}$/);
  const urls = await page.evaluate(async (name) => (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname), names[0]);
  const html = await (await request.get('/')).text();
  const referenced = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  expect(referenced.length).toBeGreaterThan(1);
  for (const url of ['/', '/manifest.webmanifest', ...referenced]) expect(urls, url).toContain(url);
});

// ── updates ──────────────────────────────────────────────────
// A deploy is simulated with a small server that serves the built site and lets the test
// replace sw.js, exactly what the browser sees when a new version is published.
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

async function serveBuild() {
  const dist = join(process.cwd(), 'dist');
  let worker = await readFile(join(dist, 'sw.js'), 'utf8');
  let broken = false;
  const server = http.createServer(async (request, response) => {
    const requested = decodeURIComponent((request.url || '/').split('?')[0]);
    const path = requested === '/' ? '/index.html' : requested;
    if (broken && path === '/index.html') {
      response.writeHead(503, { 'Content-Type': 'text/plain' }).end('Service Unavailable');
      return;
    }
    try {
      const body = path === '/sw.js' ? Buffer.from(worker) : await readFile(join(dist, path));
      response.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
    publish(edit: (script: string) => string) { worker = edit(worker); },
    /** Make the page itself answer with a server error, as during an outage. */
    breakPage() { broken = true; },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function openOwnServer(page: Page, context: BrowserContext, url: string): Promise<void> {
  await seed(page, { [KEYS.user]: { name: 'Prueba', installedAt: 1 } });
  await page.goto(url);
  await appReady(page);
  await workerInControl(page);
}

const checkForUpdate = (page: Page) => page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });

test.describe('actualizaciones', () => {
  test.skip(!!process.env.TEST_URL, 'needs the local build to simulate a deploy');

  test('una versión nueva publicada con la app abierta se anuncia y se aplica al recargar', async ({ page, context }) => {
    const site = await serveBuild();
    try {
      await openOwnServer(page, context, site.url);
      const [before] = await cacheNames(page);

      site.publish((script) => script
        .replace(/const BUILD = '[0-9a-f]+'/, "const BUILD = 'ffffffffffff'")
        .replace(/const APP_VERSION = '[^']+'/, "const APP_VERSION = '2099.01.01 · fffffff'"));
      await checkForUpdate(page);

      await expect(page.getByText('Hay una versión nueva de LifeOS')).toBeVisible({ timeout: 20_000 });
      // The new worker replaced the old cache instead of piling up next to it.
      await expect.poll(() => cacheNames(page)).toEqual(['lifeos-ffffffffffff']);
      expect(before).not.toBe('lifeos-ffffffffffff');

      await page.getByRole('button', { name: 'Actualizar' }).click();
      await page.waitForLoadState('load');
      await appReady(page);
      await expect(page.getByText('Empieza tu día')).toBeVisible();
    } finally {
      await site.close();
    }
  });

  test('si la página ya está al día, el cambio de service worker no molesta', async ({ page, context }) => {
    const site = await serveBuild();
    try {
      await openOwnServer(page, context, site.url);
      // Same app version, different worker build (as when only the worker file changed).
      site.publish((script) => script.replace(/const BUILD = '[0-9a-f]+'/, "const BUILD = 'eeeeeeeeeeee'"));
      await checkForUpdate(page);
      await expect.poll(() => cacheNames(page), { timeout: 20_000 }).toEqual(['lifeos-eeeeeeeeeeee']);
      await page.waitForTimeout(1000);
      await expect(page.getByText('Hay una versión nueva de LifeOS')).toHaveCount(0);
    } finally {
      await site.close();
    }
  });

  test('si el servidor responde con error, la app abre con la copia guardada', async ({ page, context }) => {
    const site = await serveBuild();
    try {
      await openOwnServer(page, context, site.url);
      site.breakPage();
      await page.reload();
      await appReady(page);
      await expect(page.getByText('Empieza tu día')).toBeVisible();
    } finally {
      await site.close();
    }
  });
});
