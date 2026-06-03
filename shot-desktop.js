// Screenshot the app at desktop width to confirm the 2-column dashboard.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
function findChrome() {
  for (const c of ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'])
    if (fs.existsSync(c)) return c;
}
(async () => {
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });
  // Desktop viewport — also fake a desktop UA so it picks the TabletApp branch.
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type()==='error') errors.push('console.error: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'), { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  // Onboarding: fill name + Empezar if present
  const inp = await page.$('input');
  if (inp) { await inp.fill('Tomas'); await page.waitForTimeout(200);
    const emp = await page.$('text=Empezar'); if (emp) { await emp.click().catch(()=>{}); await page.waitForTimeout(800); } }
  // Seed a couple tasks via localStorage would be ideal, but just capture the shell.
  await page.screenshot({ path: 'shot-desktop.png', fullPage: false });
  console.log('saved shot-desktop.png');
  console.log('errors:', errors.length ? errors.join(' | ') : '(none)');
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
