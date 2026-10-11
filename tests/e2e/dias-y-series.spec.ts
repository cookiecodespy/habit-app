// Moving between days, repeated tasks as a series, and undoing what was deleted.
import { expect, test } from '@playwright/test';
import { KEYS, appReady, day, goTo, openApp, stored, taskCard, watchForProblems } from './helpers';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const dialog = (page: import('@playwright/test').Page, name: string | RegExp) => page.getByRole('dialog', { name });

async function seedTasks(page: import('@playwright/test').Page, build: (today: string, tomorrow: string) => Row[]): Promise<{ today: string; tomorrow: string }> {
  await openApp(page);
  const [today, tomorrow] = [await day(page), await day(page, 1)];
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [KEYS.tasks, JSON.stringify(build(today, tomorrow))]);
  await page.reload();
  await appReady(page);
  return { today, tomorrow };
}

test('la tira de la semana muestra otro día y permite agendar en él', async ({ page }) => {
  const { tomorrow } = await seedTasks(page, (today, next) => [
    { id: 'a', title: 'Solo hoy', date: today, start: '09:00', durationMin: 30 },
    { id: 'b', title: 'Solo mañana', date: next, start: '11:00', durationMin: 30 },
  ]);
  await expect(taskCard(page, 'Solo hoy')).toBeVisible();
  await expect(page.getByText('Solo mañana')).toHaveCount(0);

  // The day after today: in this week's strip, or in next week's when today is Sunday.
  const number = Number(tomorrow.slice(8));
  const dayButton = page.getByRole('button', { name: new RegExp(`^\\S+ ${number}, 1 tarea$`) });
  if (!(await dayButton.count())) await page.getByRole('button', { name: 'Semana siguiente' }).click();
  await dayButton.click();
  await expect(taskCard(page, 'Solo mañana')).toBeVisible();
  await expect(page.getByText('Solo hoy')).toHaveCount(0);

  // "+" creates on the day being shown.
  await page.getByRole('button', { name: 'Añadir', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva tarea', exact: true }).click();
  await page.getByPlaceholder('Nombre de la tarea').fill('Para ese día');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(taskCard(page, 'Para ese día')).toBeVisible();
  expect((await stored<Row[]>(page, KEYS.tasks)).find((t) => t.title === 'Para ese día')!.date).toBe(tomorrow);

  await page.getByRole('button', { name: /Volver a hoy/ }).click();
  await expect(taskCard(page, 'Solo hoy')).toBeVisible();
});

test('una tarea repetida se edita por día o como serie, sin anidar series', async ({ page }) => {
  const problems = watchForProblems(page);
  const { today, tomorrow } = await seedTasks(page, (date) => [
    { id: 'gym', title: 'Gym', date, start: '07:00', durationMin: 60, recur: { freq: 'daily' } },
  ]);
  await taskCard(page, 'Gym').click();
  const detail = dialog(page, 'Detalle de la tarea');
  await expect(detail.getByText('Se repite cada día. Los cambios quedan solo en este día.')).toBeVisible();

  // Only this day: a new title for today.
  await detail.getByLabel('Título').fill('Gym suave');
  await detail.getByLabel('Título').press('Enter');
  await expect.poll(async () => (await stored<Row[]>(page, KEYS.tasks)).map((t) => t.id).sort()).toEqual(['gym', `gym@${today}`]);
  let tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.find((t) => t.id === 'gym')!.title).toBe('Gym');
  expect(tasks.find((t) => t.id === `gym@${today}`)).toMatchObject({ title: 'Gym suave', recur: null });

  // The whole series: repeat on weekdays only.
  await detail.getByRole('radio', { name: 'Toda la serie' }).click();
  await detail.getByRole('radio', { name: 'Lun a vie' }).click();
  tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.find((t) => t.id === 'gym')!.recur).toEqual({ freq: 'weekdays' });
  expect(tasks.find((t) => t.id === `gym@${today}`)!.recur).toBeNull(); // the day did not become a series
  expect(tasks.every((t) => (t.id.match(/@/g) || []).length <= 1)).toBe(true);
  expect(tomorrow).toBeTruthy();

  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('eliminar una tarea repetida pregunta cuánto borrar, y se puede deshacer', async ({ page }) => {
  const { today } = await seedTasks(page, (date) => [
    { id: 'leer', title: 'Leer', date: '2026-01-01', start: '21:00', durationMin: 20, recur: { freq: 'daily' } },
    { id: 'x', title: 'Otra cosa', date, start: '10:00', durationMin: 30 },
  ]);
  const before = await page.evaluate((key) => localStorage.getItem(key), KEYS.tasks);

  await taskCard(page, 'Leer').click();
  await page.getByRole('button', { name: 'Eliminar tarea' }).click();
  await dialog(page, 'Esta tarea se repite').getByRole('button', { name: 'Solo este día' }).click();
  await expect(page.getByText('Tarea eliminada')).toBeVisible();
  await expect(page.locator('[role=button]').filter({ hasText: 'Leer' })).toHaveCount(0);
  let tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.find((t) => t.id === `leer@${today}`)).toMatchObject({ _deleted: true });
  expect(tasks.find((t) => t.id === 'leer')!.recur).toEqual({ freq: 'daily' }); // the series lives on

  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(taskCard(page, 'Leer')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEYS.tasks)).toBe(before);

  // The whole series this time.
  await taskCard(page, 'Leer').click();
  await page.getByRole('button', { name: 'Eliminar tarea' }).click();
  await dialog(page, 'Esta tarea se repite').getByRole('button', { name: 'Toda la serie' }).click();
  await expect(page.getByText('Serie eliminada')).toBeVisible();
  tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.map((t) => t.id)).toEqual(['x']);
});

test('abrir una serie desde la búsqueda actúa sobre su día, no sobre toda la serie', async ({ page }) => {
  const { today } = await seedTasks(page, () => [
    { id: 'leer', title: 'Leer', date: '2026-01-01', start: '21:00', durationMin: 20, recur: { freq: 'daily' } },
  ]);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByPlaceholder('Buscar en tus tareas y notas…').fill('leer');
  await page.getByRole('dialog', { name: 'Buscar' }).getByRole('button', { name: /Leer/ }).click();

  const detail = dialog(page, 'Detalle de la tarea');
  await detail.getByRole('button', { name: 'Completar' }).click();
  let tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.find((t) => t.id === 'leer')!.status).toBe('todo'); // the series itself stays open
  expect(tasks.find((t) => t.id === `leer@${today}`)!.status).toBe('done');

  await detail.getByRole('button', { name: 'Eliminar tarea' }).click();
  await dialog(page, 'Esta tarea se repite').getByRole('button', { name: 'Solo este día' }).click();
  await expect(page.getByText('Tarea eliminada')).toBeVisible();
  tasks = await stored<Row[]>(page, KEYS.tasks);
  expect(tasks.find((t) => t.id === 'leer')!.recur).toEqual({ freq: 'daily' });
  expect(tasks.find((t) => t.id === `leer@${today}`)).toMatchObject({ _deleted: true });
});

test('una tarea sin repetición se elimina sin preguntas y se puede deshacer', async ({ page }) => {
  await seedTasks(page, (date) => [{ id: 'x', title: 'Dentista', date, start: '10:00', durationMin: 30 }]);
  await taskCard(page, 'Dentista').click();
  await page.getByRole('button', { name: 'Eliminar tarea' }).click();
  await expect(page.getByText('Tarea eliminada')).toBeVisible();
  expect(await stored<Row[]>(page, KEYS.tasks)).toEqual([]);
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(taskCard(page, 'Dentista')).toBeVisible();
});

test('el planner no convierte un saludo en tarea y deshace lo que agenda', async ({ page }) => {
  await openApp(page);
  await goTo(page, 'Planner');
  const input = page.getByPlaceholder('Escribe una frase…');
  await input.fill('hola');
  await input.press('Enter');
  await expect(page.getByText(/Dime qué quieres agendar/)).toBeVisible();
  expect(await stored(page, KEYS.tasks)).toBeNull();

  await input.fill('cena con Ana a las 8 de la noche');
  await input.press('Enter');
  await expect(page.getByText(/Agendé "Cena con Ana" hoy a las 8:00 PM/)).toBeVisible();
  expect(await stored<Row[]>(page, KEYS.tasks)).toMatchObject([{ title: 'Cena con Ana', start: '20:00' }]);

  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.getByText('Deshecho.')).toBeVisible();
  expect(await stored(page, KEYS.tasks)).toBeNull(); // exactly as before: there was no list yet
});

test('el modo enfoque completa la tarea una sola vez', async ({ page }) => {
  await seedTasks(page, (date) => [{ id: 'x', title: 'Escribir informe', date, start: '10:00', durationMin: 30 }]);
  await taskCard(page, 'Escribir informe').click();
  await page.getByRole('button', { name: /Iniciar modo enfoque/ }).click();
  await expect(page.getByText('Modo enfoque')).toBeVisible();
  await page.getByRole('button', { name: 'Completar la tarea' }).click();
  await expect(taskCard(page, 'Escribir informe').getByTitle('Reabrir')).toBeVisible();
  expect((await stored<Row[]>(page, KEYS.tasks))[0].status).toBe('done');
});
