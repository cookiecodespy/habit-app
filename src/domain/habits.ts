// habits.ts — when a habit is due, and how consistently it has been kept.

import { now } from './clock';
import { type DateStr, loDateStr, loDow } from './dates';
import type { Habit } from './types';

type HabitLike = Partial<Pick<Habit, 'cadence' | 'days' | 'log'>>;

/** Is a habit scheduled on a given date, per its cadence? */
export function loHabitScheduledOn(habit: HabitLike, dateStr: DateStr): boolean {
  const cad = habit.cadence || 'daily';
  const dow = loDow(dateStr); // 0 = Sunday
  if (cad === 'daily') return true;
  if (cad === 'weekdays') return dow >= 1 && dow <= 5;
  if (cad === 'weekly' || cad === 'custom') {
    const days = (habit.days && habit.days.length) ? habit.days : [now().getDay()];
    return days.includes(dow);
  }
  return true;
}

/** Completion rate over the scheduled days among the last `days` days (0..100). */
export function loHabitRate(habit: HabitLike, days = 30): number {
  const log = habit.log || {};
  let scheduled = 0;
  let done = 0;
  const today = now();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = loDateStr(d);
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
