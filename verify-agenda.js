// Agenda interactiva (sprint "Agenda"): theme field + auto-guess, list view
// (Todo el mes), theme filter chips, grouped-by-date list. Tablet sidebar path.
const { chromium } = require('playwright-core');
const fs = require('fs');
function findChrome(){ for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium']) if (fs.existsSync(c)) return c; }
function ds(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
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

  const today = new Date(); today.setHours(0,0,0,0);
  const d = (n) => { const x = new Date(today); x.setDate(today.getDate()+n); return ds(x); };
  const tasks = [
    { id:'a1', date: d(0), start:'08:00', end:'09:00', title:'Gym', icon:'yoga', color:'coral', status:'todo', category:'vida' },
    { id:'a2', date: d(0), start:'10:00', end:'11:00', title:'Reunión cliente', icon:'briefcase', color:'sky', status:'todo', category:'trabajo' },
    { id:'a3', date: d(1), start:'09:00', end:'11:00', title:'Prueba de cálculo', icon:'book', color:'amber', status:'todo', category:'uni' },
    { id:'a4', date: d(2), start:'15:00', end:'16:00', title:'Almuerzo familia', icon:'meal', color:'rose', status:'todo', category:'vida' },
    { id:'a5', date: d(3), start:'12:00', end:'13:00', title:'Informe mensual', icon:'briefcase', color:'slate', status:'todo', category:'trabajo' },
  ];
  await page.evaluate((t) => {
    localStorage.setItem('lifeos.tasks.v2', JSON.stringify(t));
    localStorage.setItem('lifeos.user', JSON.stringify({ name:'Tomas', onboarded:true, createdAt: Date.now() }));
  }, tasks);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2200);

  // Data-layer: auto-guess
  const guess = await page.evaluate(() => ({
    uni: loGuessCategory('prueba de álgebra'),
    trabajo: loGuessCategory('reunión con el jefe'),
    vida: loGuessCategory('gym y almuerzo'),
    none: loGuessCategory('xyz cosa rara'),
  }));

  // Open Agenda tab via sidebar (exact-text match, like verify-week)
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('button, [role=button], div')];
    const hit = items.find(e => e.offsetParent && /^\s*Agenda\s*$/.test(e.textContent));
    const target = hit && (hit.closest('button') || hit);
    if (target) target.click();
  });
  await page.waitForTimeout(900);

  const ui1 = await page.evaluate(() => {
    const txt = document.body.innerText;
    return { toggle: /Todo el mes/i.test(txt), chips: /\bVida\b/.test(txt) && /\bTrabajo\b/.test(txt) && /Universidad/.test(txt) };
  });

  // Switch to "Todo el mes"
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim()==='Todo el mes'); if (b) b.click(); });
  await page.waitForTimeout(600);
  const monthAll = await page.evaluate(() => {
    const txt = document.body.innerText;
    return { gym: /Gym/.test(txt), prueba: /Prueba de c/.test(txt), informe: /Informe mensual/.test(txt) };
  });

  // Filter: Trabajo
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim()==='Trabajo'); if (b) b.click(); });
  await page.waitForTimeout(600);
  const filtered = await page.evaluate(() => {
    const txt = document.body.innerText;
    return { reunion: /Reuni[oó]n cliente/.test(txt), informe: /Informe mensual/.test(txt), gymHidden: !/\bGym\b/.test(txt), pruebaHidden: !/Prueba de c/.test(txt) };
  });

  await page.screenshot({ path: 'shot-agenda.png', fullPage: false });
  const guessPass = guess.uni==='uni' && guess.trabajo==='trabajo' && guess.vida==='vida' && guess.none===null;
  const uiPass = ui1.toggle && ui1.chips && monthAll.gym && monthAll.prueba && monthAll.informe
    && filtered.reunion && filtered.informe && filtered.gymHidden && filtered.pruebaHidden;
  console.log('guess:', JSON.stringify(guess));
  console.log('ui:', JSON.stringify(ui1), '· monthAll:', JSON.stringify(monthAll), '· filtered:', JSON.stringify(filtered));
  console.log('errors:', errors.length ? errors.join(' | ') : '(none)');
  console.log(guessPass && uiPass && errors.length===0 ? 'AGENDA PASS ✅' : 'AGENDA CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
