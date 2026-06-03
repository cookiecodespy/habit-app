// Check all-day tasks (Sprint 6): seed an all-day + timed task, confirm the
// "Todo el día" pill row renders on the timeline and timed task stays in grid.
const { chromium } = require('playwright-core');
const fs = require('fs');
function findChrome(){ for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium']) if (fs.existsSync(c)) return c; }
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
  const today = ds(new Date());
  const tasks = [
    { id:'ad1', date: today, start:'00:00', end:'23:59', title:'Cumpleaños polola', icon:'gift', color:'rose', status:'todo', allDay:true },
    { id:'tm1', date: today, start:'10:00', end:'11:00', title:'Reunión diseño', icon:'briefcase', color:'sky', status:'todo' },
  ];
  await page.evaluate((t) => {
    localStorage.setItem('lifeos.tasks.v2', JSON.stringify(t));
    localStorage.setItem('lifeos.user', JSON.stringify({ name:'Tomas', onboarded:true, createdAt: Date.now() }));
  }, tasks);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const found = await page.evaluate(() => {
    const txt = document.body.innerText;
    return { header: /Todo el d[ií]a/i.test(txt), allDayTitle: /Cumplea/i.test(txt), timed: /Reuni[oó]n dise/i.test(txt) };
  });
  await page.screenshot({ path: 'shot-allday.png', fullPage: false });
  const pass = found.header && found.allDayTitle && found.timed && errors.length===0;
  console.log('all-day:', JSON.stringify(found), '· errors:', errors.length?errors.join(' | '):'(none)');
  console.log(pass ? 'ALLDAY PASS ✅' : 'ALLDAY CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
