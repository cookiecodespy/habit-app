// Shared helpers for the end-to-end tests. Every test runs in its own browser context with
// synthetic data, so nothing here can touch a real user's storage.
import { expect, type Page } from '@playwright/test';

export const KEYS = {
  tasks: 'lifeos.tasks.v2',
  habits: 'lifeos.habits.v1',
  inbox: 'lifeos.inbox.v1',
  routines: 'lifeos.routines.v1',
  user: 'lifeos.user',
  tweaks: 'lifeos.tweaks',
} as const;

/** Local date string in the browser's time zone, `offset` days from today. */
export function day(page: Page, offset = 0): Promise<string> {
  return page.evaluate((off) => {
    const d = new Date();
    d.setDate(d.getDate() + off);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, offset);
}

/** Collects anything that should never happen while using the app. */
export function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  return problems;
}

/**
 * Put values in localStorage before the app first loads. Runs once per context: later
 * reloads keep whatever the app wrote.
 */
export async function seed(page: Page, entries: Record<string, unknown>): Promise<void> {
  await page.addInitScript((items) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    for (const [key, value] of Object.entries(items)) localStorage.setItem(key, JSON.stringify(value));
  }, entries);
}

/** Open the app as an existing user (skips the welcome screen). */
export async function openApp(page: Page, entries: Record<string, unknown> = {}): Promise<void> {
  await seed(page, { [KEYS.user]: { name: 'Prueba', installedAt: 1 }, ...entries });
  await page.goto('/');
  await appReady(page);
}

export async function appReady(page: Page): Promise<void> {
  await expect(page.locator('#lo-boot')).toHaveCount(0);
}

export function stored<T = unknown>(page: Page, key: string): Promise<T> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key);
}

export const isPhone = (page: Page): boolean => (page.viewportSize()?.width ?? 0) < 760;

/** Go to a main section by its visible name in the tab bar (phone) or the sidebar (desktop). */
export async function goTo(page: Page, section: 'Hoy' | 'Agenda' | 'IA' | 'Hábitos' | 'Ajustes'): Promise<void> {
  const label = section === 'IA' && !isPhone(page) ? 'IA Planner' : section;
  await page.locator('button.lo-press').filter({ hasText: new RegExp(`^${label}$`) }).first().click();
}

/** Open the "add" menu and pick an entry. */
export async function quickAdd(page: Page, entry: 'Nueva tarea' | 'Nuevo hábito' | 'Nueva rutina' | 'Inbox rápido' | 'Dictar con IA'): Promise<void> {
  await page.getByRole('button', { name: 'Añadir', exact: true }).click();
  await page.locator('[data-screen-label="Quick Add"]').getByRole('button', { name: entry, exact: true }).click();
}

/** A task card in the day timeline. */
export const taskCard = (page: Page, title: string) => page.locator('[role=button]').filter({ hasText: title }).first();
