// The read side must not get slower with every call: one parse per stored value, however
// many days are asked for. These tests also pin down that cached records cannot be mutated.
import { beforeEach, expect, test } from 'vitest';
import { loDateStr } from '../../src/domain/dates';
import { LO_KEYS } from '../../src/domain/storage';
import { LOStore } from '../../src/domain/store';
import { loTaskParseCount, loVisibleTasks } from '../../src/domain/tasks';
import { at, freshWorld, type MemoryStorage } from './helpers';

const NOW = at(2026, 10, 10, 12, 0);
let world: MemoryStorage;

function seedYearsOfUse(count: number): void {
  const list = [];
  const first = new Date(NOW);
  first.setDate(first.getDate() - Math.floor(count / 6));
  for (let i = 0; i < count; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + Math.floor(i / 6));
    list.push({ id: `p${i}`, title: `Tarea ${i}`, date: loDateStr(d), start: `${String(8 + (i % 6) * 2).padStart(2, '0')}:00`, durationMin: 45, status: i % 3 ? 'done' : 'todo' });
  }
  for (let k = 0; k < 8; k++) list.push({ id: `r${k}`, title: `Recurrente ${k}`, date: loDateStr(first), start: '06:00', durationMin: 30, recur: { freq: 'daily' } });
  world.setItem(LO_KEYS.tasks, JSON.stringify(list));
}

beforeEach(() => { world = freshWorld(NOW); });

test('a month of day queries over 3,000 tasks parses the stored list once', () => {
  seedYearsOfUse(3000);
  const before = loTaskParseCount();
  for (let pass = 0; pass < 3; pass++) {
    for (let day = 1; day <= 31; day++) LOStore.tasksForDate(`2026-10-${String(day).padStart(2, '0')}`);
    LOStore.allTasks();
    loVisibleTasks();
    LOStore.upcomingDeadlines();
  }
  expect(loTaskParseCount() - before).toBe(1);
  // The seeded history ends yesterday: 6 one-off tasks plus the 8 daily series.
  expect(LOStore.tasksForDate('2026-10-09')).toHaveLength(6 + 8);
  expect(LOStore.tasksForDate('2026-10-10')).toHaveLength(8);
});

test('a write is visible on the next read, in every view', () => {
  seedYearsOfUse(60);
  expect(LOStore.tasksForDate('2026-10-11').map((t) => t.title)).not.toContain('Nueva');
  const added = LOStore.addTask({ title: 'Nueva', date: '2026-10-11', start: '05:00' });
  expect(LOStore.tasksForDate('2026-10-11')[0].id).toBe(added.id);
  expect(loVisibleTasks().some((t) => t.id === added.id)).toBe(true);
  LOStore.removeTask(added.id);
  expect(LOStore.tasksForDate('2026-10-11').map((t) => t.title)).not.toContain('Nueva');
});

test('a change made directly to storage (another tab, an import) is picked up', () => {
  seedYearsOfUse(12);
  expect(LOStore.allTasks()).toHaveLength(12 + 8);
  world.setItem(LO_KEYS.tasks, JSON.stringify([{ id: 'solo', title: 'Única', date: '2026-10-10' }]));
  expect(LOStore.allTasks().map((t) => t.id)).toEqual(['solo']);
  world.removeItem(LO_KEYS.tasks);
  expect(LOStore.allTasks()).toEqual([]);
});

test('records handed out by the store are read-only; lists are private copies', () => {
  seedYearsOfUse(12);
  const day = LOStore.tasksForDate('2026-10-09');
  expect(Object.isFrozen(day[0])).toBe(true);
  expect(() => { (day[0] as { title: string }).title = 'cambiada'; }).toThrow(TypeError);
  day.length = 0; // emptying my copy must not affect anyone else
  expect(LOStore.tasksForDate('2026-10-09').length).toBeGreaterThan(0);
  expect(loVisibleTasks()).toBe(loVisibleTasks()); // stable identity until something changes
});

test('corrupt stored data does not crash the app', () => {
  world.setItem(LO_KEYS.tasks, '{not json');
  expect(LOStore.allTasks()).toEqual([]);
  world.setItem(LO_KEYS.tasks, '{"an":"object"}');
  expect(LOStore.tasksForDate('2026-10-10')).toEqual([]);
  expect(LOStore.addTask({ title: 'Sigue funcionando' }).title).toBe('Sigue funcionando');
});
