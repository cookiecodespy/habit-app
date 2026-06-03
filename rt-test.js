// Runtime test for LifeOS — drives real flows on mobile viewport, captures bugs.
const { chromium } = require('playwright-core');
const fs = require('fs');
const findChrome = () => ['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium-browser','/snap/bin/chromium'].find(p => fs.existsSync(p));

const URL = 'http://localhost:8755/index.html';
const MOBILE = { width: 390, height: 844 };
const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };

function attachConsole(page, tag) {
  const errs = [];
  page.on('pageerror', e => { errs.push(`[${tag}] PAGEERROR: ${e.message}`); });
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      if (/favicon|sw\.js|manifest|404|Failed to load resource/.test(t)) return;
      errs.push(`[${tag}] console.error: ${t}`);
    }
  });
  return errs;
}

async function newApp(browser, tag, { seedUser = true, clean = true } = {}) {
  const ctx = await browser.newContext({ viewport: MOBILE, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  const errs = attachConsole(page, tag);
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  if (clean) {
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
  }
  if (seedUser) {
    // Welcome screen — type name and Empezar
    try {
      await page.fill('input', 'Tomás', { timeout: 4000 });
      await page.getByText('Empezar', { exact: false }).click({ timeout: 4000 });
      await page.waitForTimeout(1500);
    } catch (e) { log(`[${tag}] WARN welcome flow: ${e.message}`); }
  }
  return { ctx, page, errs };
}

const dump = (page) => page.evaluate(() => ({
  tasks: JSON.parse(localStorage.getItem('lifeos.tasks.v2') || '[]'),
  habits: JSON.parse(localStorage.getItem('lifeos.habits.v1') || '[]'),
  inbox: JSON.parse(localStorage.getItem('lifeos.inbox.v1') || '[]'),
  tweaks: JSON.parse(localStorage.getItem('lifeos.tweaks') || '{}'),
}));

(async () => {
  const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] });

  // ───────────────────────────────────────────────
  // TEST 1: Welcome / onboarding from clean state
  // ───────────────────────────────────────────────
  log('\n===== TEST 1: Welcome from clean state =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'welcome', { seedUser: false, clean: true });
    const bodyBefore = await page.evaluate(() => document.body.innerText);
    log('Welcome visible:', /BIENVENIDO|Cómo te llamas|Empezar/i.test(bodyBefore));
    // Try clicking Empezar with empty name
    let emptyBlocked = false;
    try {
      await page.getByText('Empezar', { exact: false }).click({ timeout: 3000 });
      await page.waitForTimeout(800);
      const after = await page.evaluate(() => document.body.innerText);
      emptyBlocked = /BIENVENIDO|Cómo te llamas/i.test(after);
    } catch (e) {}
    log('Empty name blocks entry (stays on welcome):', emptyBlocked);
    // Now real entry
    await page.fill('input', 'Tomás');
    await page.getByText('Empezar', { exact: false }).click();
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    log('After entry, timeline-ish text present:', /Tomás|Hoy|tarea|hábito|Hábitos/i.test(body));
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-1-welcome.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 2: Create task with steps via CreateScreen
  // ───────────────────────────────────────────────
  log('\n===== TEST 2: Create task + checklist steps (CreateScreen) =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'create');
    // Open FAB → quickadd → task
    await page.locator('button').filter({ hasText: '' }); // noop
    // The FAB: find by tapping bottom-right plus. Use quickadd menu.
    // Tap FAB (last big round button). We'll click any element with aria/plus.
    await page.evaluate(() => { window.__seedClick = true; });
    // Open quickadd via FAB — find the floating action button
    const fab = page.locator('button').last();
    // Better: open CreateScreen directly through the timeline "Add" path.
    // Try the FAB then "Tarea"
    let opened = false;
    try {
      // FAB is fixed bottom; click center-bottom-right
      await page.mouse.click(MOBILE.width - 40, MOBILE.height - 120);
      await page.waitForTimeout(700);
      // quickadd menu — pick "Tarea"
      const tarea = page.getByText('Tarea', { exact: false }).first();
      if (await tarea.count()) { await tarea.click(); opened = true; }
    } catch (e) { log('FAB path err:', e.message); }
    await page.waitForTimeout(800);
    let body = await page.evaluate(() => document.body.innerText);
    log('CreateScreen opened (Checklist/Nueva tarea visible):', /Checklist|tarea|Título|Guardar|Crear/i.test(body), '| quickadd opened:', opened);

    // Fill title
    try {
      const titleInput = page.locator('input, textarea').first();
      await titleInput.fill('Preparar presentación');
    } catch (e) { log('title fill err:', e.message); }

    // Expand checklist and add 2 steps
    try {
      const checklistBtn = page.getByText('Checklist', { exact: false }).first();
      await checklistBtn.click();
      await page.waitForTimeout(400);
      const addStep = page.getByText('Añadir paso', { exact: false });
      const hadStepInputBefore = await page.evaluate(() => {
        // Is there any text input near "Nuevo paso"?
        return [...document.querySelectorAll('input')].map(i => i.placeholder || i.value);
      });
      await addStep.click();
      await page.waitForTimeout(300);
      await addStep.click();
      await page.waitForTimeout(300);
      const stepBody = await page.evaluate(() => document.body.innerText);
      const nuevoPasoCount = (stepBody.match(/Nuevo paso/g) || []).length;
      log('Steps added — count of "Nuevo paso" labels:', nuevoPasoCount);
      // Can we edit a step? Look for an editable input bound to step label
      const editable = await page.evaluate(() => {
        // find a span/input containing "Nuevo paso" — is it an input?
        const inputs = [...document.querySelectorAll('input')].filter(i => i.value === 'Nuevo paso');
        const spans = [...document.querySelectorAll('span')].filter(s => s.textContent.trim() === 'Nuevo paso');
        return { editableInputs: inputs.length, readonlySpans: spans.length };
      });
      log('Step editability:', JSON.stringify(editable), '(editableInputs=0 & readonlySpans>0 → CANNOT name steps)');
    } catch (e) { log('checklist err:', e.message); }

    // Save
    try {
      const saveBtn = page.getByText(/Guardar|Crear|Agendar|Listo/i).last();
      await saveBtn.click({ timeout: 3000 });
      await page.waitForTimeout(800);
    } catch (e) { log('save err:', e.message); }

    let st = await dump(page);
    log('Tasks saved:', st.tasks.length, '| first task subtasks:', JSON.stringify((st.tasks[0]||{}).subtasks));
    // Reload and check persistence
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    st = await dump(page);
    log('After reload — tasks:', st.tasks.length, '| subtasks persisted:', JSON.stringify((st.tasks[0]||{}).subtasks));
    const tlBody = await page.evaluate(() => document.body.innerText);
    log('Task "Preparar presentación" visible on timeline after reload:', /Preparar presentaci/i.test(tlBody));
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-2-create.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 3: Detail screen — edit title/hour, add step, complete
  // ───────────────────────────────────────────────
  log('\n===== TEST 3: Task detail — edit title/hour, add named step, complete =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'detail');
    // Seed a task via store
    await page.evaluate(() => {
      LOStore.addTask({ title: 'Revisar correos', start: '09:00', durationMin: 30, date: loDateStr(), color: 'sky', icon: 'briefcase' });
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    // Open the task by tapping its title in the timeline
    try {
      await page.getByText('Revisar correos', { exact: false }).first().click({ timeout: 4000 });
      await page.waitForTimeout(800);
    } catch (e) { log('open detail err:', e.message); }
    let body = await page.evaluate(() => document.body.innerText);
    log('Detail opened (Checklist/Progreso/Completar visible):', /Checklist|Completar|Progreso|enfoque/i.test(body));

    // Is the title editable? Try clicking title text and see if an input appears
    const titleEditable = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input')];
      return {
        anyInputWithTitleValue: inputs.some(i => /Revisar correos/.test(i.value)),
        inputCount: inputs.length,
        inputPlaceholders: inputs.map(i => i.placeholder).filter(Boolean),
      };
    });
    log('Title/hour editability in detail:', JSON.stringify(titleEditable));

    // Add a NAMED step via the detail input
    try {
      const stepInput = page.getByPlaceholder(/Añadir un paso/i);
      await stepInput.fill('Paso uno con nombre');
      await stepInput.press('Enter');
      await page.waitForTimeout(500);
      const b2 = await page.evaluate(() => document.body.innerText);
      log('Named step added in detail:', /Paso uno con nombre/.test(b2));
    } catch (e) { log('detail step err:', e.message); }

    // Mark the step done — click its checkbox (first round button in checklist)
    // Then Complete the task
    try {
      await page.getByText(/Completar/i).click({ timeout: 3000 });
      await page.waitForTimeout(600);
    } catch (e) { log('complete err:', e.message); }

    let st = await dump(page);
    const tk = st.tasks[0] || {};
    log('Task status:', tk.status, '| subtasks:', JSON.stringify(tk.subtasks));
    // close detail, reload
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    st = await dump(page);
    const tk2 = st.tasks[0] || {};
    log('After reload — status:', tk2.status, '| subtasks:', JSON.stringify(tk2.subtasks));
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-3-detail.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 4: Habit create, complete, streak, persist
  // ───────────────────────────────────────────────
  log('\n===== TEST 4: Habit create + complete + streak + persist =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'habit');
    // Open habit sheet via quickadd FAB
    try {
      await page.mouse.click(MOBILE.width - 40, MOBILE.height - 120);
      await page.waitForTimeout(600);
      const h = page.getByText(/Hábito/i).first();
      if (await h.count()) await h.click();
      await page.waitForTimeout(700);
    } catch (e) { log('open habit sheet err:', e.message); }
    let body = await page.evaluate(() => document.body.innerText);
    log('Habit sheet opened:', /hábito|Hábito|Nombre|Crear|Guardar/i.test(body));
    // Fill habit name and save
    try {
      const inp = page.locator('input, textarea').first();
      await inp.fill('Beber agua');
      const save = page.getByText(/Crear|Guardar|Añadir|Listo/i).last();
      await save.click({ timeout: 3000 });
      await page.waitForTimeout(700);
    } catch (e) { log('habit save err:', e.message); }
    let st = await dump(page);
    log('Habits saved:', st.habits.length, '| names:', st.habits.map(h=>h.title).join(','));
    // Complete the habit — tap it in the HabitsStrip
    try {
      const hb = page.getByText('Beber agua', { exact: false }).first();
      await hb.click({ timeout: 3000 });
      await page.waitForTimeout(600);
    } catch (e) { log('habit toggle err:', e.message); }
    st = await dump(page);
    const h0 = st.habits.find(h => h.title === 'Beber agua') || st.habits[0] || {};
    log('Habit log after tap:', JSON.stringify(h0.log));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    st = await dump(page);
    const h1 = st.habits.find(h => h.title === 'Beber agua') || st.habits[0] || {};
    log('After reload — habit exists:', !!h1.title, '| log:', JSON.stringify(h1.log));
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-4-habit.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 5: Inbox add + Agendar → timeline
  // ───────────────────────────────────────────────
  log('\n===== TEST 5: Inbox add + Agendar =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'inbox');
    // Open inbox via quickadd
    try {
      await page.mouse.click(MOBILE.width - 40, MOBILE.height - 120);
      await page.waitForTimeout(600);
      const ib = page.getByText(/Inbox|Captura|Captura rápida|Bandeja/i).first();
      if (await ib.count()) await ib.click();
      await page.waitForTimeout(700);
    } catch (e) { log('open inbox err:', e.message); }
    let body = await page.evaluate(() => document.body.innerText);
    log('Inbox opened:', /Inbox|Captura|Bandeja|Agendar|agrega/i.test(body));
    // Add an item
    try {
      const inp = page.locator('input, textarea').first();
      await inp.fill('Comprar pan');
      await inp.press('Enter');
      await page.waitForTimeout(600);
    } catch (e) { log('inbox add err:', e.message); }
    let st = await dump(page);
    log('Inbox items:', st.inbox.length, '| text:', (st.inbox[0]||{}).text);
    // Agendar
    try {
      const ag = page.getByText(/Agendar/i).first();
      if (await ag.count()) { await ag.click(); await page.waitForTimeout(700); }
      else log('No "Agendar" button found in inbox');
    } catch (e) { log('agendar err:', e.message); }
    st = await dump(page);
    log('Tasks after Agendar:', st.tasks.length, '| task:', JSON.stringify((st.tasks[0]||{}).title), 'start:', (st.tasks[0]||{}).start);
    log('Inbox items after Agendar:', st.inbox.length, '(did the inbox item get removed?)');
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-5-inbox.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 6: AI — "gym mañana 7am" then "borra gym"
  // ───────────────────────────────────────────────
  log('\n===== TEST 6: AI planner — create + delete =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'ai');
    // Switch to AI tab
    try {
      // AI tab — open via quickadd "voz"/IA or tab bar. Use store-level command parse too.
      const parseRes = await page.evaluate(() => {
        const p = loParseCommand('gym mañana 7am');
        return { intent: p.intent, hasExec: typeof loExecuteCommand === 'function' };
      });
      log('loParseCommand("gym mañana 7am") intent:', parseRes.intent);
    } catch (e) { log('parse err:', e.message); }
    // Drive the actual AI UI
    try {
      // Open AI screen via tab bar — click the tab labeled IA / asistente
      const aiTab = page.getByText(/^IA$|Asistente|Planner/i).first();
      if (await aiTab.count()) { await aiTab.click(); await page.waitForTimeout(800); }
      else {
        // via quickadd voice
        await page.mouse.click(MOBILE.width - 40, MOBILE.height - 120);
        await page.waitForTimeout(500);
        const v = page.getByText(/Voz|IA|Asistente/i).first();
        if (await v.count()) { await v.click(); await page.waitForTimeout(800); }
      }
    } catch (e) { log('open AI err:', e.message); }
    let body = await page.evaluate(() => document.body.innerText);
    log('AI screen opened:', /planner|agendar|asistente|Soy tu/i.test(body));
    // Type the command
    try {
      const inp = page.locator('input, textarea').last();
      await inp.fill('gym mañana 7am');
      await inp.press('Enter');
      await page.waitForTimeout(1500);
    } catch (e) { log('ai send err:', e.message); }
    let st = await dump(page);
    log('Tasks after "gym mañana 7am":', st.tasks.length, '| titles:', st.tasks.map(t=>`${t.title}@${t.date} ${t.start}`).join(' | '));
    // Now "borra gym"
    try {
      const inp = page.locator('input, textarea').last();
      await inp.fill('borra gym');
      await inp.press('Enter');
      await page.waitForTimeout(1500);
    } catch (e) { log('ai delete err:', e.message); }
    st = await dump(page);
    log('Tasks after "borra gym":', st.tasks.length, '| titles:', st.tasks.map(t=>t.title).join(' | '));
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-6-ai.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 7: Settings — theme/density/accent persist
  // ───────────────────────────────────────────────
  log('\n===== TEST 7: Settings — appearance persistence =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'settings');
    // Go to settings tab
    try {
      const setTab = page.getByText(/Ajustes|Settings|Perfil/i).first();
      if (await setTab.count()) { await setTab.click(); await page.waitForTimeout(800); }
    } catch (e) { log('open settings err:', e.message); }
    let body = await page.evaluate(() => document.body.innerText);
    log('Settings opened:', /Ajustes|Apariencia|Tema|Densidad|Acento|Oscuro|Claro/i.test(body));
    const before = (await dump(page)).tweaks;
    log('Tweaks before:', JSON.stringify(before));
    // Try toggling dark mode / density / accent — click toggles/options
    const clicked = [];
    for (const label of ['Oscuro', 'Compacto', 'Compact', 'Denso', 'Lavanda', 'Coral', 'Menta', 'Cielo']) {
      try {
        const el = page.getByText(new RegExp('^'+label+'$', 'i')).first();
        if (await el.count()) { await el.click({ timeout: 1500 }); clicked.push(label); await page.waitForTimeout(300); }
      } catch (e) {}
    }
    log('Clicked appearance options:', clicked.join(', ') || '(none found)');
    await page.waitForTimeout(400);
    const after = (await dump(page)).tweaks;
    log('Tweaks after clicks:', JSON.stringify(after));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const reloaded = (await dump(page)).tweaks;
    log('Tweaks after reload:', JSON.stringify(reloaded));
    log('Persisted across reload:', JSON.stringify(after) === JSON.stringify(reloaded));
    log('errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-7-settings.png' });
    await ctx.close();
  }

  // ───────────────────────────────────────────────
  // TEST 8: Visit ALL tabs + open ALL sheets, capture console errors
  // ───────────────────────────────────────────────
  log('\n===== TEST 8: Visit all tabs + open all sheets (console error sweep) =====');
  {
    const { ctx, page, errs } = await newApp(browser, 'sweep');
    // Seed some data so screens render fully
    await page.evaluate(() => {
      const d = loDateStr();
      LOStore.addHabit({ title: 'Meditar', icon: 'meditate', color: 'lavender', log: { [d]: true } });
      LOStore.addTask({ title: 'Deep work', start: '09:00', durationMin: 90, date: d, color: 'slate', icon: 'briefcase', subtasks: [{id:'a',label:'x',done:false}] });
      LOStore.addInbox('Algo por agendar');
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2500);
    // Iterate tabs via store-level setTab is internal; click tab bar items by label
    const tabLabels = ['Hoy', 'Agenda', 'Mes', 'Stats', 'IA', 'Ajustes', 'Asistente'];
    for (const lbl of tabLabels) {
      try {
        const el = page.getByText(new RegExp('^'+lbl+'$','i')).first();
        if (await el.count()) {
          await el.click({ timeout: 1500 });
          await page.waitForTimeout(700);
          log(`Tab "${lbl}" clicked. errors so far: ${errs.length}`);
        }
      } catch (e) {}
    }
    // Back to timeline, open sheets via quickadd
    try {
      const hoy = page.getByText(/^Hoy$/i).first();
      if (await hoy.count()) await hoy.click();
      await page.waitForTimeout(500);
    } catch (e) {}
    // Open each quickadd option in turn
    for (const opt of ['Tarea', 'Hábito', 'Rutina', 'Inbox', 'Voz']) {
      try {
        await page.mouse.click(MOBILE.width - 40, MOBILE.height - 120);
        await page.waitForTimeout(500);
        const el = page.getByText(new RegExp('^'+opt+'$','i')).first();
        if (await el.count()) {
          await el.click({ timeout: 1500 });
          await page.waitForTimeout(700);
          log(`Sheet "${opt}" opened. errors so far: ${errs.length}`);
          // close it: press Escape / click backdrop top
          await page.keyboard.press('Escape').catch(()=>{});
          await page.mouse.click(10, 10).catch(()=>{});
          await page.waitForTimeout(400);
        }
      } catch (e) {}
    }
    log('TOTAL sweep errors:', errs.length ? '\n' + errs.join('\n') : '(none)');
    await page.screenshot({ path: '/tmp/rt-8-sweep.png' });
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync('/tmp/rt-report.txt', out.join('\n'));
  log('\n===== DONE — report at /tmp/rt-report.txt =====');
})().catch(e => { console.error('TEST HARNESS FAILED:', e.stack || e.message); process.exit(1); });
