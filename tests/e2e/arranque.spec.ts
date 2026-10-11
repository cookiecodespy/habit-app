import { expect, test } from '@playwright/test';
import { appReady, goTo, openApp, watchForProblems } from './helpers';

test('la primera pintura ya es la app: oscura, adaptada al teléfono y en español', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return;
      (window as unknown as { __first: unknown }).__first = {
        viewport: !!document.querySelector('meta[name=viewport]'),
        background: getComputedStyle(document.body).backgroundColor,
        layoutWidth: document.documentElement.clientWidth,
        lang: document.documentElement.lang,
        manifest: !!document.querySelector('link[rel=manifest]'),
        touchIcon: !!document.querySelector('link[rel="apple-touch-icon"]'),
        text: document.body.innerText.trim(),
      };
    });
  });
  await page.goto('/');
  const first = await page.evaluate(() => (window as unknown as { __first: Record<string, unknown> }).__first);
  expect(first).toEqual({
    viewport: true,
    background: 'rgb(11, 11, 17)',
    layoutWidth: page.viewportSize()!.width,
    lang: 'es',
    manifest: true,
    touchIcon: true,
    text: 'L',
  });
});

test('recorrer todas las secciones no produce errores ni infracciones de seguridad', async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto('/');
  await page.getByPlaceholder('Tu nombre').fill('Prueba');
  await page.getByRole('button', { name: /Empezar/ }).click();
  await appReady(page);
  for (const section of ['Agenda', 'Planner', 'Hábitos', 'Ajustes', 'Hoy'] as const) {
    await goTo(page, section);
    await page.waitForTimeout(250);
  }
  await expect(page.getByText(/LifeOS · .+ · Hecho con cariño en Chile/)).toHaveCount(0); // footer lives in Ajustes only
  await goTo(page, 'Ajustes');
  await expect(page.getByText(/LifeOS · \S+/)).toBeVisible();
  expect(problems).toEqual([]);
});

test('el servidor publica solo la app, con cabeceras de seguridad y caché correctas', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  const headers = home.headers();
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).not.toContain('unsafe-eval');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');

  const html = await home.text();
  const script = html.match(/src="(\/assets\/[^"]+\.js)"/)![1];
  const asset = await request.get(script);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['cache-control']).toContain('immutable');

  const worker = await request.get('/sw.js');
  expect(worker.status()).toBe(200);
  expect(worker.headers()['cache-control'] ?? '').not.toContain('immutable');

  for (const hidden of ['/package.json', '/src/main.jsx', '/README.md', '/wrangler.jsonc', '/_headers', '/tests/e2e/helpers.ts', '/.git/config']) {
    expect((await request.get(hidden)).status(), hidden).toBe(404);
  }
});

test('la app es instalable: manifest válido con sus iconos', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toBe('LifeOS');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/');
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.status(), icon.src).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');
  }
});

test('un usuario existente entra directo a su día', async ({ page }) => {
  await openApp(page);
  await expect(page.getByText('Buen', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Empieza tu día')).toBeVisible();
});
