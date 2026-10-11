import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { KEYS, appReady, day, goTo, isPhone, openApp, quickAdd, stored, taskCard, watchForProblems } from './helpers';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

test('bienvenida → crear una tarea → sigue ahí tras recargar', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Tu nombre').fill('Valentina');
  await page.getByRole('button', { name: /Empezar/ }).click();
  await appReady(page);
  await expect(page.getByText('Valentina').first()).toBeVisible();

  await quickAdd(page, 'Nueva tarea');
  await page.getByPlaceholder('Nombre de la tarea').fill('Revisar contrato');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(taskCard(page, 'Revisar contrato')).toBeVisible();

  await page.reload();
  await appReady(page);
  await expect(taskCard(page, 'Revisar contrato')).toBeVisible();
  const tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({ title: 'Revisar contrato', status: 'todo', date: await day(page) });
});

test('completar y reabrir una tarea actualiza el progreso y se guarda', async ({ page }) => {
  await openApp(page);
  const today = await day(page);
  await page.evaluate(([key, date]) => localStorage.setItem(key, JSON.stringify([
    { id: 'a', title: 'Gym', date, start: '07:00', durationMin: 60 },
    { id: 'b', title: 'Almuerzo', date, start: '13:00', durationMin: 60 },
  ])), [KEYS.tasks, today]);
  await page.reload();
  await appReady(page);

  await expect(page.getByText('de 2 tareas')).toBeVisible();
  await taskCard(page, 'Gym').getByTitle('Completar').click();
  await expect(taskCard(page, 'Gym').getByTitle('Reabrir')).toBeVisible();
  expect((await stored<Row[]>(page, KEYS.tasks)).find((t) => t.id === 'a')!.status).toBe('done');

  await page.reload();
  await appReady(page);
  await taskCard(page, 'Gym').getByTitle('Reabrir').click();
  await expect(taskCard(page, 'Gym').getByTitle('Completar')).toBeVisible();
  expect((await stored<Row[]>(page, KEYS.tasks)).find((t) => t.id === 'a')!.status).toBe('todo');
});

test('una tarea diaria aparece cada día y se completa día por día', async ({ page }) => {
  await openApp(page);
  const [yesterday, today] = [await day(page, -1), await day(page)];
  await page.evaluate(([key, date]) => localStorage.setItem(key, JSON.stringify([
    { id: 'serie', title: 'Leer 20 minutos', date, start: '21:00', durationMin: 20, recur: { freq: 'daily' } },
  ])), [KEYS.tasks, yesterday]);
  await page.reload();
  await appReady(page);

  await taskCard(page, 'Leer 20 minutos').getByTitle('Completar').click();
  await expect(taskCard(page, 'Leer 20 minutos').getByTitle('Reabrir')).toBeVisible();
  const tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.map((t) => t.id).sort()).toEqual(['serie', `serie@${today}`]);
  expect(tasks.find((t) => t.id === 'serie')!.status).toBe('todo'); // the series itself stays open
});

test('capturar en la bandeja y agendar pasa el pendiente al día de hoy', async ({ page }) => {
  await openApp(page);
  await quickAdd(page, 'Inbox rápido');
  const input = page.getByPlaceholder('Escribe cualquier idea, recado o pendiente…');
  await input.fill('Renovar pasaporte');
  await input.press('Enter');
  await expect(page.getByText('Renovar pasaporte')).toBeVisible();
  expect(await stored<Row[]>(page, KEYS.inbox)).toHaveLength(1);

  await page.getByTitle('Agendar hoy').click();
  expect(await stored<Row[]>(page, KEYS.inbox)).toHaveLength(0);
  const tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({ title: 'Renovar pasaporte', date: await day(page) });
});

test('crear un hábito y marcarlo hoy', async ({ page }) => {
  await openApp(page);
  await quickAdd(page, 'Nuevo hábito');
  await page.getByPlaceholder('Nombre del hábito').fill('Meditar');
  await page.getByRole('button', { name: /Empezar a construir el hábito/ }).click();
  const habit = page.getByRole('button', { name: /Meditar/ }).first();
  await expect(habit).toBeVisible();
  await habit.click();
  const habits = await stored<Row[]>(page, KEYS.habits);
  expect(habits).toHaveLength(1);
  expect(habits[0].log).toEqual({ [await day(page)]: true });
});

test('aplicar una rutina agenda todas sus tareas sin solaparlas', async ({ page }) => {
  await openApp(page);
  await quickAdd(page, 'Nueva rutina');
  await page.getByRole('button', { name: /Workout completo/ }).click();
  await page.getByRole('button', { name: /Agendar rutina hoy/ }).click();
  await expect(page.getByText(/Rutina agendada · 4 tareas/)).toBeVisible();
  const tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.map((t) => t.title)).toEqual(['Calentamiento', 'Cardio', 'Fuerza', 'Stretching']);
  // Each one starts when the previous one ends, on consecutive absolute minutes.
  const absolute = (t: Row) => Date.parse(`${t.date}T${t.start}:00`) / 60000;
  for (let i = 1; i < tasks.length; i++) expect(absolute(tasks[i]) - absolute(tasks[i - 1])).toBe(tasks[i - 1].durationMin);
});

test('el planner entiende una frase y agenda la tarea', async ({ page }) => {
  await openApp(page);
  await goTo(page, 'IA');
  const input = page.getByPlaceholder('Pregúntame lo que sea…');
  await input.fill('gym mañana 7am 1h');
  await input.press('Enter');
  await expect(page.getByText(/Agendé "Gym" mañana a las 7:00 AM/)).toBeVisible();
  const tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({ title: 'Gym', date: await day(page, 1), start: '07:00', durationMin: 60 });
});

test('el tema claro se puede activar y desactivar desde Ajustes y se recuerda', async ({ page }) => {
  await openApp(page);
  await goTo(page, 'Ajustes');
  const toggle = page.getByText('Modo oscuro', { exact: true }).locator('..').getByRole('switch');
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  // The desktop shell paints its own surface; read the theme where both shells store it.
  const dark = async () => (await stored<Row | null>(page, KEYS.tweaks))?.dark;

  await toggle.click();
  expect(await dark()).toBe(false);
  if (isPhone(page)) expect(await background()).toBe('rgb(244, 242, 238)');
  await page.reload();
  await appReady(page);
  expect(await dark()).toBe(false);

  await goTo(page, 'Ajustes');
  await page.getByText('Modo oscuro', { exact: true }).locator('..').getByRole('switch').click();
  expect(await dark()).toBe(true);
});

test('exportar un respaldo, borrar todo e importarlo devuelve los mismos datos', async ({ page }, testInfo) => {
  const problems = watchForProblems(page);
  const today = '2026-10-10';
  const data = {
    [KEYS.tasks]: [
      { id: 't1', title: 'Con pasos', date: today, start: '09:00', durationMin: 45, subtasks: [{ id: 's1', label: 'Uno', done: true }], category: 'trabajo', deadline: today },
      { id: 't2', title: 'Diaria', date: today, start: '20:00', durationMin: 15, recur: { freq: 'daily' }, reminder: true },
      { id: `t2@${today}`, title: 'Diaria', date: today, start: '20:00', durationMin: 15, _from: 't2', status: 'done' },
    ],
    [KEYS.habits]: [{ id: 'h1', title: 'Agua', icon: '💧', color: 'sky', cadence: 'daily', days: null, log: { [today]: true }, createdAt: 1, updatedAt: 1 }],
    [KEYS.inbox]: [{ id: 'i1', text: 'Idea suelta', createdAt: 1, updatedAt: 1 }],
    [KEYS.routines]: [{ id: 'r1', name: 'Mía', icon: '✨', color: 'coral', tasks: [{ label: 'Paso', dur: 10 }], custom: true, createdAt: 1, updatedAt: 1 }],
  };
  await openApp(page, data);
  await goTo(page, 'Ajustes');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar' }).click();
  const file = testInfo.outputPath('respaldo.json');
  await (await download).saveAs(file);
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(backup).toMatchObject({ app: 'lifeos', version: 2 });
  expect(backup.tasks).toEqual(data[KEYS.tasks]);
  expect(backup.habits).toEqual(data[KEYS.habits]);

  // Wipe the device.
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Borrar todos mis datos' }).click();
  await expect(page.getByPlaceholder('Tu nombre')).toBeVisible();
  expect(await stored(page, KEYS.tasks)).toBeNull();

  // Restore from the file.
  await page.getByPlaceholder('Tu nombre').fill('Otra persona');
  await page.getByRole('button', { name: /Empezar/ }).click();
  await appReady(page);
  await goTo(page, 'Ajustes');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByText(/Importado: 3 tareas, 1 hábitos/)).toBeVisible();
  await page.waitForLoadState('load');
  await appReady(page);

  const restored = await stored<Row[]>(page, KEYS.tasks);
  expect(restored.map((t) => t.id)).toEqual(['t1', 't2', `t2@${today}`]);
  expect(restored[0]).toMatchObject(data[KEYS.tasks][0]);
  expect(await stored(page, KEYS.habits)).toEqual(data[KEYS.habits]);
  expect(await stored(page, KEYS.inbox)).toEqual(data[KEYS.inbox]);
  expect(await stored(page, KEYS.routines)).toEqual(data[KEYS.routines]);
  expect(await stored<Row>(page, KEYS.user)).toMatchObject({ name: 'Prueba' });
  expect(problems).toEqual([]);
});

test('un respaldo dañado se rechaza sin tocar los datos', async ({ page }, testInfo) => {
  await openApp(page, { [KEYS.tasks]: [{ id: 'keep', title: 'Conservar', date: '2026-10-10', start: '09:00', durationMin: 30 }] });
  await goTo(page, 'Ajustes');
  const { writeFileSync } = await import('node:fs');
  const file = testInfo.outputPath('malo.json');
  writeFileSync(file, JSON.stringify({ app: 'lifeos', tasks: [{ id: 'x', title: 'Mala', date: '2026-02-30' }] }));
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByText(/Respaldo inválido: revisa tasks/)).toBeVisible();
  expect((await stored<Row[]>(page, KEYS.tasks)).map((t) => t.id)).toEqual(['keep']);
});
