// Check the real DeadlineCard (Sprint 6): seed tasks with deadlines, confirm
// the countdown card renders on the timeline with no errors.
const { chromium } = require('playwright-core');
const fs = require('fs');
function findChrome() {
  for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'])
    if (fs.existsSync(c)) return c;
}
function ds(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
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

  const today = new Date(); today.setHours(0,0,0,0);
  const plus = (n) => { const d = new Date(today); d.setDate(today.getDate()+n); return ds(d); };
  const tasks = [
    { id:'d0', date: ds(today), start:'10:00', end:'11:00', title:'Pagar arriendo', icon:'dollar', color:'coral', status:'todo', deadline: plus(0) },
    { id:'d1', date: ds(today), start:'12:00', end:'13:00', title:'Entregar informe', icon:'briefcase', color:'amber', status:'todo', deadline: plus(2) },
    { id:'d2', date: ds(today), start:'15:00', end:'16:00', title:'Renovar pasaporte', icon:'plane', color:'sky', status:'todo', deadline: plus(9) },
    { id:'d3', date: ds(today), start:'17:00', end:'18:00', title:'Sin deadline', icon:'coffee', color:'mint', status:'todo' },
  ];
  await page.evaluate((t) => {
    localStorage.setItem('lifeos.tasks.v2', JSON.stringify(t));
    localStorage.setItem('lifeos.user', JSON.stringify({ name:'Tomas', onboarded:true, createdAt: Date.now() }));
  }, tasks);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const found = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      header: /Fechas l[ií]mite/i.test(txt),
      venceHoy: /Vence hoy/i.test(txt),
      dias: /\b2 d[ií]as\b/i.test(txt),
      titulo: /Entregar informe/i.test(txt),
    };
  });
  await page.screenshot({ path: 'shot-deadline.png', fullPage: false });
  const pass = found.header && found.venceHoy && found.dias && found.titulo && errors.length===0;
  console.log('deadline card:', JSON.stringify(found));
  console.log('errors:', errors.length ? errors.join(' | ') : '(none)');
  console.log(pass ? 'DEADLINE PASS ✅' : 'DEADLINE CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
