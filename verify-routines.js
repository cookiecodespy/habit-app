// Custom routines CRUD (Sprint 6): exercises the real store in-browser
// (add/update/remove + export) and best-effort renders the "MÍA" card.
const { chromium } = require('playwright-core');
const fs = require('fs');
function findChrome(){ for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium']) if (fs.existsSync(c)) return c; }
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type()==='error' && !/404|favicon/i.test(m.text())) errors.push('console.error: ' + m.text()); });
  await page.goto('http://localhost:8755/index.html', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('lifeos.user', JSON.stringify({ name:'Tomas', onboarded:true, createdAt: Date.now() })));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2000);

  // Store-level CRUD in real app context
  const store = await page.evaluate(() => {
    const out = {};
    LOStore.removeRoutine && (LOStore.customRoutines() || []).forEach(r => LOStore.removeRoutine(r.id));
    const r = LOStore.addRoutine({ name: 'Test rutina', icon: 'coffee', color: 'sky', tasks: [{ icon: 'coffee', color: 'sky', label: 'Paso A', dur: 20 }, { icon: 'book', color: 'plum', label: 'Paso B', dur: 40 }] });
    out.added = LOStore.customRoutines().length === 1 && !!r.id;
    LOStore.updateRoutine(r.id, { name: 'Editada' });
    out.updated = LOStore.customRoutines()[0].name === 'Editada';
    out.inExport = (LOStore.exportAll().routines || []).length === 1;
    LOStore.removeRoutine(r.id);
    out.removed = LOStore.customRoutines().length === 0;
    return out;
  });

  // Seed one + render: open FAB → QuickAdd → Rutinas (best-effort)
  await page.evaluate(() => {
    LOStore.addRoutine({ name: 'Mi mañana', icon: 'sun', color: 'amber', tasks: [{ icon: 'sun', color: 'amber', label: 'Despertar', dur: 10 }] });
  });
  let ui = { reachedRoutines: false, miaBadge: false, crearBtn: false };
  try {
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1800);
    // FAB (+) — bottom-right round button
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].reverse().find(x => { const s=getComputedStyle(x); return s.borderRadius && parseInt(s.borderRadius)>=20 && x.offsetParent && x.getBoundingClientRect().bottom > window.innerHeight-160; }); if (b) b.click(); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('*')].find(x => x.offsetParent && /rutina/i.test(x.textContent) && x.textContent.length < 30); if (b) (b.closest('button')||b).click(); });
    await page.waitForTimeout(700);
    ui = await page.evaluate(() => {
      const txt = document.body.innerText;
      return { reachedRoutines: /Tus rutinas|Mis rutinas|Crear rutina/i.test(txt), miaBadge: /MÍA|MIA/i.test(txt), crearBtn: /Crear rutina/i.test(txt) };
    });
  } catch (e) { ui.err = e.message; }

  await page.screenshot({ path: 'shot-routines.png', fullPage: false });
  const storePass = store.added && store.updated && store.inExport && store.removed && errors.length===0;
  console.log('store CRUD:', JSON.stringify(store));
  console.log('ui:', JSON.stringify(ui));
  console.log('errors:', errors.length ? errors.join(' | ') : '(none)');
  console.log(storePass ? 'ROUTINES STORE PASS ✅' : 'ROUTINES CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
