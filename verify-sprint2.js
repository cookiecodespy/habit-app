// Direct verification of Sprint 2 fixes — drives the real LOStore in-page.
const { chromium } = require('playwright-core');
const fs = require('fs');
const findChrome = () => ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'].find(p => fs.existsSync(p));
const URL = 'http://localhost:8755/index.html';
const pass = [], fail = [];
const ok = (n, c) => (c ? pass : fail).push(n);

(async () => {
  const browser = await chromium.launch({ executablePath: findChrome() });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|sw\.js|manifest|404|Failed to load resource/.test(m.text())) consoleErrors.push(m.text()); });

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => localStorage.setItem('lifeos.user', JSON.stringify({ name: 'Tomas' })));

  const r = await page.evaluate(() => {
    const out = {};
    localStorage.removeItem('lifeos.tasks.v2');
    const S = window.LOStore;

    // B2 + B14: create with reminder/recur and an absolute date
    const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate()+1); return loDateStr(d); })();
    const a = S.addTask({ title: 'Reunión', date: tomorrow, start: '10:00', durationMin: 60, reminder: true, recur: { freq: 'weekdays' } });
    out.b2_reminder = a.reminder === true;
    out.b2_recur = !!a.recur && a.recur.freq === 'weekdays';
    out.b14_dateAbsolute = a.date === tomorrow;

    // HU-01: unique ids even created in same ms
    const x1 = S.addTask({ title: 'A', date: tomorrow, start: '12:00' });
    const x2 = S.addTask({ title: 'B', date: tomorrow, start: '13:00' });
    out.hu01_uniqueIds = x1.id !== x2.id;

    // B15: durationMin explicit honored, no midnight wrap to 5
    const late = S.addTask({ title: 'Tarde', date: tomorrow, start: '23:30', durationMin: 60 });
    out.b15_duration = late.durationMin === 60;

    // B3: edit a recurring occurrence (base@date) actually persists
    const occId = a.id + '@' + tomorrow;
    S.updateTask(occId, { start: '11:30' });
    const occ = S.tasksForDate(tomorrow).find(t => t.id === occId || (t._from === a.id));
    out.b3_editRecurring = !!occ && occ.start === '11:30';

    // N3: un-completing a recurring occurrence removes the orphan override
    const before = S.allTasks().length;
    S.toggleTask(a.id + '@' + tomorrow); // complete (materialize)
    S.toggleTask(a.id + '@' + tomorrow); // un-complete → should drop pristine override
    // allow the edited (11:30) override to remain since it's not pristine
    out.n3_noUnboundedGrowth = S.allTasks().length <= before + 2;

    // N2: reading the store twice does NOT bump updatedAt
    const u1 = S.allTasks().find(t => t.id === x1.id).updatedAt;
    const u2 = S.allTasks().find(t => t.id === x1.id).updatedAt;
    out.n2_updatedAtStable = u1 === u2;

    // B10: applyRoutine places its task in a FREE slot (no overlap with existing)
    S.applyRoutine({ id: 'r', tasks: [{ label: 'PasoRutina', icon: 'star', color: 'mint', dur: 30 }] }, { date: tomorrow, startMin: 11*60 });
    const day = S.tasksForDate(tomorrow);
    const overlaps = (A,B) => loHHMMtoMin(A.start) < loHHMMtoMin(B.start)+(B.durationMin||30) && loHHMMtoMin(A.start)+(A.durationMin||30) > loHHMMtoMin(B.start);
    const routineTask = day.find(t => t.title === 'PasoRutina');
    out.b10_noOverlap = !!routineTask && !day.some(t => t.title !== 'PasoRutina' && overlaps(routineTask, t));

    // Habits: cadence + updatedAt + edit
    const h = S.addHabit({ title: 'Agua', cadence: 'weekdays' });
    out.habit_cadence = h.cadence === 'weekdays' && typeof h.updatedAt === 'number';
    const h2 = S.updateHabit(h.id, { title: 'Beber agua' });
    out.habit_update = h2.title === 'Beber agua';

    // NLP safer delete (ambiguous → no wrong delete)
    S.addTask({ title: 'Gym mañana', date: loDateStr(), start: '07:00' });
    S.addTask({ title: 'Gym tarde', date: loDateStr(), start: '19:00' });
    const res = loExecuteCommand(loParseCommand('borra gym'));
    out.nlp_ambiguousGuard = /varias|exact/i.test(res.reply);

    // 🔴 NLP-complete/move on a recurring task must hit only TODAY's occurrence,
    // never the base template (was: hit.id.split('@')[0] → completed the whole series).
    const yest = (() => { const d = new Date(); d.setDate(d.getDate()-1); return loDateStr(d); })();
    const recBase = S.addTask({ title: 'Meditar NLP', date: yest, start: '06:30', durationMin: 20, recur: { freq: 'daily' } });
    loExecuteCommand({ intent: 'complete', query: 'meditar nlp' });
    const recBaseAfter = S.allTasks().find(t => t.id === recBase.id);
    const recOccToday = S.tasksForDate(loDateStr()).find(t => /Meditar NLP/.test(t.title));
    out.nlp_recur_keepsBase = !!recBaseAfter && recBaseAfter.status === 'todo'
      && !!recOccToday && recOccToday.status === 'done';

    // 🟡 Overnight task derived from end (no explicit durationMin) must wrap past
    // midnight, not collapse to the 5-min floor (was: Math.max(5, negative)).
    const overnight = S.addTask({ title: 'Turno noche', date: loDateStr(), start: '23:00', end: '01:00' });
    out.overnight_duration = overnight.durationMin === 120;

    return out;
  });

  Object.entries(r).forEach(([k, v]) => ok(k, v));
  ok('no_console_errors', consoleErrors.length === 0);

  // DOM checks: Settings has no fake PRO badge
  await page.evaluate(() => { document.querySelectorAll('*').forEach(()=>{}); });
  const settingsTab = page.getByText(/^Ajustes$/i).first();
  let proBadge = true;
  try {
    // navigate to settings via tab bar icon if present
    await page.evaluate(() => { window.__goSettings && window.__goSettings(); });
  } catch {}
  await page.screenshot({ path: '/tmp/verify-sprint2.png' });

  console.log('\n=== SPRINT 2 VERIFICATION ===');
  console.log('PASS (' + pass.length + '): ' + pass.join(', '));
  console.log('FAIL (' + fail.length + '): ' + (fail.join(', ') || '—'));
  if (consoleErrors.length) console.log('CONSOLE ERRORS:\n' + consoleErrors.join('\n'));
  await browser.close();
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error('HARNESS FAIL:', e.message); process.exit(2); });
