// Habit numbers: constancy that does not punish a new habit, and plain counts.
import { expect, test } from 'vitest';
import { loHabitRate, loHabitScheduledOn, loHabitStats } from '../../src/domain/habits';
import { at, freshWorld } from './helpers';

const NOW = at(2026, 9, 29, 10, 0); // Tuesday
const days = (...list: string[]) => Object.fromEntries(list.map((d) => [d, true]));

test('a habit kept every day since it started is at 100, however new it is', () => {
  freshWorld(NOW);
  const created = at(2026, 9, 27, 9, 0);
  expect(loHabitRate({ createdAt: created, log: days('2026-09-27', '2026-09-28', '2026-09-29') })).toBe(100);
  // today still open does not count against it…
  expect(loHabitRate({ createdAt: created, log: days('2026-09-27', '2026-09-28') })).toBe(100);
  // …a day really missed does
  expect(loHabitRate({ createdAt: created, log: days('2026-09-27') })).toBe(50);
  expect(loHabitRate({ createdAt: NOW, log: {} })).toBe(0);
});

test('days done before the creation date extend the period that counts', () => {
  freshWorld(NOW);
  // started on the 25th (first day done), missed the 26th
  expect(loHabitRate({ createdAt: NOW, log: days('2026-09-25', '2026-09-27', '2026-09-28', '2026-09-29') })).toBe(80);
});

test('an old habit is measured over the whole window', () => {
  freshWorld(NOW);
  const log = days('2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28');
  expect(loHabitRate({ createdAt: at(2026, 1, 1), log }, 7)).toBe(100);
  expect(loHabitRate({ createdAt: at(2026, 1, 1), log }, 30)).toBe(21); // 6 of 29
});

test('a weekly habit without chosen days keeps the weekday it was created on', () => {
  freshWorld(NOW);
  const friday = at(2026, 9, 25, 9, 0);
  expect(loHabitScheduledOn({ cadence: 'weekly', createdAt: friday }, '2026-10-02')).toBe(true);
  expect(loHabitScheduledOn({ cadence: 'weekly', createdAt: friday }, '2026-09-29')).toBe(false);
});

test('counts: week, month, total, current and best run', () => {
  freshWorld(NOW);
  const log = days('2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-20', '2026-09-28', '2026-09-29');
  expect(loHabitStats({ cadence: 'daily', createdAt: at(2026, 8, 1), log })).toEqual({
    week: 2, month: 6, total: 7, streak: 2, best: 4, doneToday: true,
  });
  expect(loHabitStats({ log: {} })).toEqual({ week: 0, month: 0, total: 0, streak: 0, best: 0, doneToday: false });
});

test('days the habit is not due do not break the best run', () => {
  freshWorld(NOW);
  // weekdays habit: Thu 24, Fri 25, Mon 28 — the weekend in between is not a miss
  expect(loHabitStats({ cadence: 'weekdays', log: days('2026-09-24', '2026-09-25', '2026-09-28') })).toMatchObject({ best: 3, streak: 3 });
});
