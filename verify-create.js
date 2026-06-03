// Redesigned Create screen: open it, screenshot, fill + save end-to-end.
const { chromium } = require('playwright-core');
const fs = require('fs');
function findChrome(){ for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium']) if (fs.existsSync(c)) return c; }
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type()==='error' && !/404|favicon/i.test(m.text())) errors.push('console.error: ' + m.text()); });
  await page.goto('http://localhost:8755/index.html', { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('lifeos.user', JSON.stringify({ name:'Tomas', onboarded:true, createdAt: Date.now() })); });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1800);

  // Open Create via the sidebar "Nueva tarea" button (desktop path).
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /Nueva tarea/i.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(700);
  // Type a title that auto-categorises (Universidad)
  const inp = await page.$('input[placeholder="Nombre de la tarea"]');
  let opened = !!inp;
  if (inp) { await inp.fill('Prueba de cálculo'); await page.waitForTimeout(500); }
  await page.screenshot({ path: 'shot-create.png', fullPage: false });

  // Save
  let saved = 0;
  if (inp) {
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Agendar tarea/i.test(x.textContent)); if (b) b.click(); });
    await page.waitForTimeout(800);
    saved = await page.evaluate(() => LOStore.allTasks().filter(t => /Prueba de c/.test(t.title)).length);
  }
  const cat = await page.evaluate(() => { const t = LOStore.allTasks().find(t => /Prueba de c/.test(t.title)); return t ? t.category : null; });
  console.log('create opened:', opened, '· saved:', saved, '· auto-category:', cat);
  console.log('errors:', errors.length ? errors.join(' | ') : '(none)');
  console.log(opened && saved===1 && cat==='uni' && errors.length===0 ? 'CREATE PASS ✅' : 'CREATE CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
