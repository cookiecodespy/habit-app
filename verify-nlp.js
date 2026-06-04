// Verify the NLP title/recurrence parser (B-NLP-1: "miércoles → ércoles").
const { chromium } = require('playwright-core');
const fs = require('fs');
function findChrome(){ for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium']) if (fs.existsSync(c)) return c; }
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8755/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  const cases = [
    { text: 'reunión con cliente Acme todos los miércoles 10am 1h', wantTitle: 'Reunión con cliente Acme', wantFreq: 'weekly', wantDay: 3 },
    { text: 'gym mañana 7am 1h', wantTitle: 'Gym' },
    { text: 'estudiar inglés hoy 2pm 90 min', wantTitle: 'Estudiar inglés' },
    { text: 'tomar agua cada día', wantTitle: 'Tomar agua', wantFreq: 'daily' },
    { text: 'yoga cada lunes 8am', wantTitle: 'Yoga', wantFreq: 'weekly', wantDay: 1 },
  ];
  const out = await page.evaluate((cs) => cs.map(c => {
    const p = loParseCommand(c.text);
    const tk = (p && p.task) || {};
    return { text: c.text, title: tk.title, freq: tk.recur && tk.recur.freq, day: tk.recur && tk.recur.days && tk.recur.days[0], want: c };
  }), cases);

  let pass = true;
  for (const r of out) {
    const titleOk = r.title === r.want.wantTitle;
    const freqOk = r.want.wantFreq ? r.freq === r.want.wantFreq : true;
    const dayOk = (r.want.wantDay !== undefined) ? r.day === r.want.wantDay : true;
    const noGarbage = !/ércoles|todos|miércoles\b/i.test(r.title);
    const ok = titleOk && freqOk && dayOk && noGarbage;
    if (!ok) pass = false;
    console.log(`${ok?'✅':'❌'} "${r.text}"  →  título="${r.title}"  recur=${r.freq||'-'}${r.day!==undefined?('/'+r.day):''}  (esperado "${r.want.wantTitle}")`);
  }
  console.log('errors:', errs.length ? errs.join(' | ') : '(none)');
  console.log(pass && errs.length===0 ? 'NLP PASS ✅' : 'NLP CHECK ⚠️');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
