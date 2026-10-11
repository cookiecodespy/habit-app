import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { KEYS, appReady, goTo, isPhone } from './helpers';

// The exact page that was in production before the v2 rebuild (single-file bundle, commit
// f121b36). The test lets THAT code write a varied dataset, then opens the current app on the
// same origin and checks that nothing is lost, rewritten or read differently.
const PREVIOUS_VERSION = readFileSync(new URL('./fixtures/lifeos-2026-09-29.html', import.meta.url), 'utf8');

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

test('los datos creados con la versión anterior se leen idénticos tras actualizar', async ({ page }, testInfo) => {
  await page.route('**/version-anterior.html', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: PREVIOUS_VERSION }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto('/version-anterior.html');
  await page.waitForFunction(() => !!(window as unknown as Row).LOStore);

  const before = await page.evaluate(() => {
    const w = window as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const S = w.LOStore;
    const today: string = w.loDateStr();
    localStorage.setItem('lifeos.user', JSON.stringify({ name: 'Usuaria Antigua', installedAt: 1750000000000 }));
    localStorage.setItem('lifeos.tweaks', JSON.stringify({ dark: false, density: 'compact', blockShape: 'rounded', accent: '#22B8A0' }));
    S.addTask({ title: 'Reunión con cliente', start: '10:00', durationMin: 45, note: 'Zoom', category: 'trabajo', priority: 'high', reminder: true });
    const steps = S.addTask({ title: 'Informe trimestral', start: '15:00', end: '16:30', subtasks: [{ label: 'Borrador' }, { label: 'Revisión' }], deadline: today });
    S.toggleSubtask(steps.id, S.allTasks().find((t: any) => t.id === steps.id).subtasks[0].id); // eslint-disable-line @typescript-eslint/no-explicit-any
    S.addTask({ title: 'Cumpleaños de Ana', allDay: true });
    const daily = S.addTask({ title: 'Leer antes de dormir', start: '21:00', durationMin: 20, recur: { freq: 'daily' }, date: '2026-01-01' });
    S.toggleTask(`${daily.id}@${today}`); // completed today
    S.removeTask(`${daily.id}@2026-01-05`); // one occurrence deleted
    S.updateTask(`${daily.id}@2026-01-07`, { start: '22:15', date: '2026-01-08' }); // one occurrence moved
    S.addTask({ title: 'Gym', start: '07:00', durationMin: 60, recur: { freq: 'weekly', days: [1, 3, 5] }, date: '2026-01-05' });
    const done = S.addTask({ title: 'Ya hecha', start: '08:00' });
    S.toggleTask(done.id);
    const habit = S.addHabit({ title: 'Meditar', icon: '🧘', color: 'lavender' });
    S.toggleHabitToday(habit.id);
    S.toggleHabitToday(habit.id, '2026-01-02');
    S.addHabit({ title: 'Correr', cadence: 'custom', days: [1, 3, 5] });
    S.addInbox('Comprar regalo');
    S.addInbox('Renovar pasaporte');
    S.addRoutine({ name: 'Mi mañana', icon: '☀️', color: 'amber', tasks: [{ label: 'Agua', icon: '☕', color: 'ember', dur: 5 }] });
    const dump: Record<string, string | null> = {};
    for (const key of Object.keys(localStorage).sort()) dump[key] = localStorage.getItem(key);
    return {
      dump,
      exported: S.exportAll(),
      todayTitles: S.tasksForDate(today).map((t: any) => t.title), // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  });
  expect(before.todayTitles.length).toBeGreaterThanOrEqual(5);

  // Update: same origin, current app.
  await page.goto('/');
  await appReady(page);

  // 1. Starting the new version neither rewrites nor drops anything.
  const after = await page.evaluate(() => {
    const dump: Record<string, string | null> = {};
    for (const key of Object.keys(localStorage).sort()) dump[key] = localStorage.getItem(key);
    return dump;
  });
  expect(after).toEqual(before.dump);

  // 2. The person and their appearance settings are recognised.
  await expect(page.getByText('Usuaria Antigua').first()).toBeVisible();
  if (isPhone(page)) expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(244, 242, 238)');

  // 3. Today shows the same tasks the previous version listed, and the habits.
  for (const title of before.todayTitles) await expect(page.getByText(title).first(), title).toBeVisible();
  await expect(page.getByRole('button', { name: /Meditar/ }).first()).toBeVisible();

  // 4. A backup exported by the new version contains exactly the old records.
  await goTo(page, 'Ajustes');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar' }).click();
  const file = testInfo.outputPath('respaldo.json');
  await (await download).saveAs(file);
  const exported = JSON.parse(readFileSync(file, 'utf8'));
  for (const collection of ['tasks', 'habits', 'inbox', 'routines', 'user'] as const) {
    expect(exported[collection], collection).toEqual(before.exported[collection]);
  }
  expect(Object.keys(after)).toEqual(expect.arrayContaining(Object.values(KEYS)));
});
