// habits.ts — when a habit is due, and how consistently it has been kept.

import { now } from './clock';
import { type DateStr, loAddDays, loDateStr, loDow } from './dates';
import type { Habit } from './types';

type HabitLike = Partial<Pick<Habit, 'cadence' | 'days' | 'log' | 'createdAt'>>;

/** Is a habit scheduled on a given date, per its cadence? */
export function loHabitScheduledOn(habit: HabitLike, dateStr: DateStr): boolean {
  const cad = habit.cadence || 'daily';
  const dow = loDow(dateStr); // 0 = Sunday
  if (cad === 'daily') return true;
  if (cad === 'weekdays') return dow >= 1 && dow <= 5;
  if (cad === 'weekly' || cad === 'custom') {
    // Without chosen days, a weekly habit keeps the weekday it was created on.
    const fallback = habit.createdAt ? new Date(habit.createdAt).getDay() : now().getDay();
    const days = (habit.days && habit.days.length) ? habit.days : [fallback];
    return days.includes(dow);
  }
  return true;
}

/**
 * Completion rate over the scheduled days among the last `days` days (0..100). Only the
 * days since the habit started count (its creation or its first day done, whichever is
 * earlier), and today does not count against it until it is over: a habit kept every day
 * since Monday is at 100, not at 13.
 */
export function loHabitRate(habit: HabitLike, days = 30): number {
  const log = habit.log || {};
  const today = loDateStr();
  const firstDone = Object.keys(log).filter((d) => log[d]).sort()[0];
  const born = habit.createdAt ? loDateStr(habit.createdAt) : firstDone;
  const since = born && firstDone ? (firstDone < born ? firstDone : born) : born;
  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const ds = loAddDays(today, -i);
    if (since && ds < since) break;
    if (ds === today && !log[ds]) continue;
    if (!loHabitScheduledOn(habit, ds)) continue;
    scheduled++;
    if (log[ds]) done++;
  }
  return scheduled ? Math.round((done / scheduled) * 100) : 0;
}

/**
 * Current streak, counting only days the habit was scheduled: a day it was not due does not
 * break the run, and today not being done yet does not either.
 */
export function loHabitStreak(habit: HabitLike, asOf: Date = now()): number {
  let streak = 0;
  for (let i = 0; i < 730; i++) {
    const d = new Date(asOf);
    d.setDate(asOf.getDate() - i);
    const ds = loDateStr(d);
    if ((habit.log || {})[ds]) streak++;
    else if (!loHabitScheduledOn(habit, ds)) continue; // not due that day → keep going
    else if (i > 0) break; // a missed scheduled day breaks the run
  }
  return streak;
}

export interface HabitStats {
  /** Days done in the current week (Monday to Sunday). */
  week: number;
  /** Days done in the current calendar month. */
  month: number;
  total: number;
  /** Current run of scheduled days kept. */
  streak: number;
  /** Longest run ever. */
  best: number;
  doneToday: boolean;
}

/** Plain counts from a habit's log: what actually happened, nothing estimated. */
export function loHabitStats(habit: HabitLike): HabitStats {
  const log = habit.log || {};
  const done = Object.keys(log).filter((d) => log[d]).sort();
  const today = loDateStr();
  const monday = loAddDays(today, -((loDow(today) + 6) % 7));
  const sunday = loAddDays(monday, 6);

  let best = 0;
  let run = 0;
  // Walk from the first day done to today; cap the walk so a typo'd year cannot hang the app.
  for (let ds = done[0], i = 0; ds && ds <= today && i < 3660; ds = loAddDays(ds, 1), i++) {
    if (log[ds]) { run++; best = Math.max(best, run); }
    else if (loHabitScheduledOn(habit, ds) && ds !== today) run = 0;
  }

  return {
    week: done.filter((d) => d >= monday && d <= sunday).length,
    month: done.filter((d) => d.startsWith(today.slice(0, 7))).length,
    total: done.length,
    streak: loHabitStreak(habit),
    best,
    doneToday: !!log[today],
  };
}
