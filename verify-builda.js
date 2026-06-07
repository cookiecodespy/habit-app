// Sprint A boot verification: no Babel, CSP on, app mounts, 0 console errors.
const { chromium } = require('playwright-core');
const fs = require('fs');
const findChrome = () => ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'].find(p => fs.existsSync(p));
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome() });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [], csp = [], reqs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|sw\.js|manifest|404/.test(m.text())) errs.push(m.text()); });
  // CSP violations surface as console errors containing "Content Security Policy"
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
  page.on('requestfinished', r => reqs.push(r.url()));
  page.on('requestfailed', r => errs.push('REQ FAILED: ' + r.url().slice(0,60) + ' ' + (r.failure()||{}).errorText));

  await page.goto('http://localhost:8755/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  // Seed a user so the app shows the Today screen (not onboarding) and reload.
  await page.evaluate(() => localStorage.setItem('lifeos.user', JSON.stringify({ name: 'Tomas' })));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);

  // Did the app actually mount real UI (not just the boot splash)?
  const mounted = await page.evaluate(() => {
    const root = document.getElementById('root');
    const txt = document.body.innerText || '';
    return {
      rootChildren: root ? root.children.length : 0,
      hasReact: typeof window.React !== 'undefined',
      babelGone: typeof window.Babel === 'undefined',
      seesGreeting: /Buen|Hoy|tarea|día|Agenda/i.test(txt),
      bytesText: txt.length,
    };
  });

  // Network: confirm Babel (3MB) is no longer fetched
  const fetchedBabel = reqs.some(u => /babel/i.test(u));

  await page.screenshot({ path: 'shot-builda.png' });
  console.log('mounted:', JSON.stringify(mounted));
  console.log('babel network fetch:', fetchedBabel, '| total requests:', reqs.length);
  console.log('CSP violations:', csp.length ? csp : '(none)');
  console.log('console/page errors:', errs.length ? errs : '(none)');
  const ok = mounted.rootChildren > 0 && mounted.hasReact && mounted.babelGone && mounted.seesGreeting && csp.length === 0 && errs.length === 0 && !fetchedBabel;
  console.log(ok ? 'SPRINT A BOOT PASS ✅' : 'SPRINT A BOOT FAIL ❌');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
