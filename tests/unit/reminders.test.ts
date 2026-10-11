import { expect, test } from 'vitest';
import { loDueReminders } from '../../src/domain/reminders';
import { loNormalizeTask } from '../../src/domain/tasks';
import { at, freshWorld } from './helpers';

const NOW = at(2026, 9, 29, 10, 0);
const task = (extra: Record<string, unknown>) => loNormalizeTask({ date: '2026-09-29', start: '10:05', reminder: true, ...extra });

test('only timed, open tasks with the reminder on are due, and only once', () => {
  freshWorld(NOW);
  const tasks = [
    task({ id: 'yes', title: 'Sí' }),
    task({ id: 'off', title: 'Sin recordatorio', reminder: false }),
    task({ id: 'day', title: 'Todo el día', allDay: true }),
    task({ id: 'done', title: 'Hecha', status: 'done' }),
    task({ id: 'far', title: 'Lejos', start: '10:11' }),
    task({ id: 'now', title: 'Ya empezó', start: '10:00' }),
    task({ id: 'edge', title: 'Justo a 10 min', start: '10:10' }),
  ];
  const sent = new Set<string>();
  const due = loDueReminders(tasks, new Date(NOW), sent);
  expect(due.map((d) => [d.task.id, d.minutes])).toEqual([['yes', 5], ['edge', 10]]);
  for (const d of due) sent.add(d.key);
  expect(loDueReminders(tasks, new Date(NOW), sent)).toEqual([]);
});

test('moving a task to a new time makes it due again', () => {
  freshWorld(NOW);
  const sent = new Set<string>();
  const first = loDueReminders([task({ id: 'a' })], new Date(NOW), sent);
  sent.add(first[0].key);
  const moved = loDueReminders([task({ id: 'a', start: '10:08' })], new Date(NOW), sent);
  expect(moved.map((d) => d.minutes)).toEqual([8]);
});
