// Verify habit heatmap + edit sheet renders with history.
const { chromium } = require('playwright-core');
const fs = require('fs');
const findChrome = () => ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'].find(p => fs.existsSync(p));
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome() });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|sw\.js|manifest|404|Failed to load/.test(m.text())) errs.push(m.text()); });
  await page.goto('http://localhost:8755/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1800);
  // Seed a user + a habit with ~6 weeks of history
  await page.evaluate(() => {
    localStorage.setItem('lifeos.user', JSON.stringify({ name: 'Tomas' }));
    const log = {};
    const today = new Date();
    for (let i = 0; i < 42; i++) { const d = new Date(today); d.setDate(today.getDate() - i); if (i % 3 !== 0) log[loDateStr(d)] = true; }
    localStorage.setItem('lifeos.habits.v1', JSON.stringify([{ id: 'h1', title: 'Meditar', icon: 'meditate', color: 'lavender', cadence: 'daily', log, createdAt: Date.now(), updatedAt: Date.now() }]));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1800);
  // Long-press the habit card to open edit
  const card = page.getByText('Meditar').first();
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    await page.waitForTimeout(900);
  }
  const editVisible = await page.getByText(/Editar hábito/i).count();
  const consistency = await page.getByText(/Consistencia/i).count();
  const bestLabel = await page.getByText(/Mejor/i).count();
  await page.screenshot({ path: '/tmp/lo-heatmap.png' });
  // also screenshot full edit sheet
  console.log('editSheet:', editVisible > 0, '| consistencia:', consistency > 0, '| mejorPill:', bestLabel > 0);
  console.log('errors:', errs.length ? errs.join('\n') : '(none)');
  await browser.close();
  process.exit(errs.length || !consistency ? 1 : 0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(2); });
