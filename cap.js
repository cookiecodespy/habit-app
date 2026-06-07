const { chromium } = require('playwright-core'); const fs = require('fs');
const fc = () => ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'].find(p => fs.existsSync(p));
(async () => {
  const b = await chromium.launch({ executablePath: fc() });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await p.goto('http://localhost:8755/index.html', { waitUntil: 'load' }); await p.waitForTimeout(1600);
  await p.evaluate(() => {
    localStorage.setItem('lifeos.user', JSON.stringify({ name: 'Tomas' }));
    const mk = (id,t,ic,co,e) => { const log={}; const d=new Date(); for(let i=0;i<70;i++){const x=new Date(d);x.setDate(d.getDate()-i);if(e>0&&i%e!==0)log[loDateStr(x)]=true;} return {id,title:t,icon:ic,color:co,cadence:'daily',log,createdAt:Date.now(),updatedAt:Date.now()}; };
    localStorage.setItem('lifeos.habits.v1', JSON.stringify([
      mk('h1','Hacer la cama','🛏️','coral',5), mk('h2','Meditar','🧘','lavender',3),
      mk('h3','Beber agua','💧','sky',2), mk('h4','Leer 30 min','📚','mint',4),
    ]));
  });
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2300);
  await p.screenshot({ path: 'h-empty.png' });  // empty Today (fix check)
  // Go to Hábitos tab
  try { await p.getByText('Hábitos', { exact: true }).last().click({ timeout: 2000 }); await p.waitForTimeout(1200); } catch(e){ console.log('tab fail', e.message.slice(0,40)); }
  await p.screenshot({ path: 'h-list.png' });
  // open a habit detail
  try { await p.getByText('Meditar', { exact: true }).first().click({ timeout: 2000 }); await p.waitForTimeout(1200); } catch(e){ console.log('detail fail', e.message.slice(0,40)); }
  await p.screenshot({ path: 'h-detail.png' });
  console.log('done'); await b.close();
})();
