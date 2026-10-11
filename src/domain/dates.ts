// dates.ts — local-time date helpers. Dates are 'YYYY-MM-DD' and times 'HH:MM' strings in the
// device's time zone; nothing here touches UTC, which is what caused off-by-one days before.

import { now } from './clock';

export type DateStr = string;
export type TimeStr = string;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local (not UTC) date string. */
export function loDateStr(d: Date | number | string = now()): DateStr {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function loHHMMtoMin(s?: string | null): number {
  if (!s) return 0;
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + m;
}

/** Minutes since midnight → 'HH:MM', wrapping around the day in both directions. */
export function loMinToHHMM(t: number): TimeStr {
  t = ((t % 1440) + 1440) % 1440;
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

/** Day of week of a date string, 0 = Sunday. */
export function loDow(dateStr: DateStr): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** The date `days` after (or before) a date string. */
export function loAddDays(dateStr: DateStr, days: number): DateStr {
  const [y, m, d] = dateStr.split('-').map(Number);
  return loDateStr(new Date(y, m - 1, d + days));
}

/** "09:00" → "9:00 AM" */
export function fmt12(hhmm: TimeStr): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${pad(m)} ${ap}`;
}

/** Minutes from a to b; a task that crosses midnight keeps a positive length. */
export function minutesBetween(a: TimeStr, b: TimeStr): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  let d = (bh * 60 + bm) - (ah * 60 + am);
  if (d < 0) d += 1440;
  return d;
}

export const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export interface MonthCell {
  d: number;
  muted?: boolean;
  inMonth?: boolean;
}

/** A 6-row, Monday-first month grid for any (year, month0). */
export function buildMonth(year: number, month0: number): MonthCell[] {
  const first = new Date(year, month0, 1);
  const firstDow = (first.getDay() + 6) % 7; // Monday = 0 … Sunday = 6
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const prevDays = new Date(year, month0, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ d: prevDays - firstDow + 1 + i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, inMonth: true });
  while (cells.length % 7) cells.push({ d: cells.length - firstDow - daysInMonth + 1, muted: true });
  // pad to 6 rows for a stable height
  while (cells.length < 42) cells.push({ d: cells.length - firstDow - daysInMonth + 1, muted: true });
  return cells;
}
