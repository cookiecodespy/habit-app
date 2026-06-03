// Visual + functional check for the real WeekScreen (Sprint 6).
// Seeds tasks across the current week, opens Calendar tab → "Semana",
// verifies real blocks render and there are no console/page errors.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
function findChrome() {
  for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'])
    if (fs.existsSync(c)) return c;
}
function dateStr(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
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

  const url = 'http://localhost:8755/index.html';
  await page.goto(url, { waitUntil: 'load' });

  // Build a week of tasks (Mon..Sun) and seed them, skip onboarding.
  const today = new Date(); today.setHours(0,0,0,0);
  const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay()+6)%7));
  const colors = ['coral','mint','sky','amber','lavender','rose','plum'];
  const tasks = [];
  for (let i=0;i<7;i++){
    const d = new Date(mon); d.setDate(mon.getDate()+i);
    const ds = dateStr(d);
    tasks.push({ id:'w'+i+'a', date:ds, start:'08:00', end:'09:30', title:'Mañana '+i, icon:'coffee', color:colors[i%colors.length], status: i===2?'done':'todo' });
    tasks.push({ id:'w'+i+'b', date:ds, start:(13+i%3)+':00', end:(15+i%3)+':00', title:'Tarde '+i, icon:'briefcase', color:colors[(i+3)%colors.length], status:'todo' });
  }
  await page.evaluate(([t, ds]) => {
    localStorage.setItem('lifeos.tasks.v2', JSON.stringify(t));
    localStorage.setItem('lifeos.user', JSON.stringify({ name:'Tomas', onboarded:true, createdAt: Date.now() }));
  }, [tasks, dateStr(today)]);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);

  // Open Calendar (month) tab. Try the header calendar control / nav.
  // The TabletApp shows a sidebar; click the "Agenda"/month entry by text fallback.
  const opened = await page.evaluate(() => {
    // Tablet sidebar nav item labelled "Agenda" opens the calendar tab.
    const items = [...document.querySelectorAll('button, [role=button], div')];
    const hit = items.find(e => e.offsetParent && /^\s*Agenda\s*$/.test(e.textContent) && e.querySelector && (e.onclick || e.closest('button')));
    const target = hit && (hit.closest('button') || hit);
    if (target) { target.click(); return true; }
    // fallback: any clickable containing Agenda
    const f = items.find(e => e.offsetParent && e.textContent.includes('Agenda'));
    if (f) { (f.closest('button')||f).click(); return true; }
    return false;
  });
  await page.waitForTimeout(900);

  // Click "Semana" segment
  const weekBtn = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim()==='Semana');
    if (b) { b.click(); return true; } return false;
  });
  await page.waitForTimeout(900);

  // Count rendered task blocks (absolute buttons with a linear-gradient bg inside swimlanes)
  const blocks = await page.evaluate(() => {
    return [...document.querySelectorAll('button')].filter(b => {
      const s = b.getAttribute('style')||'';
      return s.includes('position: absolute') && s.includes('linear-gradient');
    }).length;
  });

  await page.screenshot({ path: 'shot-week.png', fullPage: false });
  console.log('opened calendar tab:', opened, '· clicked Semana:', weekBtn);
  console.log('week task blocks rendered:', blocks);
  console.log('errors:', errors.length ? errors.join(' | ') : '(none)');
  console.log(blocks >= 8 && weekBtn && errors.length===0 ? 'WEEK PASS ✅' : 'WEEK CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
