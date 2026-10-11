// Repeated tasks as a whole: reading one day, changing or ending the series, undo.
import { expect, test } from 'vitest';
import { LO_KEYS } from '../../src/domain/storage';
import { LOStore } from '../../src/domain/store';
import { loNormalizeTask, loSplitOccurrenceId } from '../../src/domain/tasks';
import { at, freshWorld } from './helpers';

const TUE = '2026-09-29';
const WED = '2026-09-30';
const THU = '2026-10-01';
const FRI = '2026-10-02';
const NOW = at(2026, 9, 29, 10, 0);

const dailyGym = () => LOStore.addTask({ id: 'gym', title: 'Gym', date: TUE, start: '07:00', durationMin: 60, recur: { freq: 'daily' } });
const titles = (date: string) => LOStore.tasksForDate(date).map((t) => t.title);

test('a day of a series is found by id while it is still virtual', () => {
  freshWorld(NOW);
  dailyGym();
  const day = LOStore.getTask(`gym@${WED}`);
  expect(day).toMatchObject({ id: `gym@${WED}`, date: WED, _from: 'gym', recur: null, status: 'todo' });
  expect(LOStore.seriesOf(day!)).toMatchObject({ id: 'gym', recur: { freq: 'daily' } });
  expect(LOStore.getTask('gym@2026-09-01')).toBeNull(); // before the series starts
  expect(LOStore.getTask('nope')).toBeNull();
});

test('reopening a completed day gives back the open day, not a stale copy', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.toggleTask(`gym@${TUE}`);
  expect(LOStore.getTask(`gym@${TUE}`)!.status).toBe('done');
  LOStore.toggleTask(`gym@${TUE}`);
  expect(LOStore.getTask(`gym@${TUE}`)!.status).toBe('todo');
  expect(LOStore.allTasks()).toHaveLength(1); // the override is gone again
});

test('editing one day never turns it into a second series', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.updateTask(`gym@${WED}`, { recur: { freq: 'weekdays' }, title: 'Gym suave' });
  const stored = LOStore.allTasks().find((t) => t.id === `gym@${WED}`)!;
  expect(stored.recur).toBeNull();
  expect(stored.title).toBe('Gym suave');
  expect(titles(WED)).toEqual(['Gym suave']);
  expect(titles(THU)).toEqual(['Gym']);
});

test('data already damaged by the old nesting bug still reads as days', () => {
  expect(loSplitOccurrenceId('gym@2026-09-30@2026-10-01')).toEqual(['gym@2026-09-30', '2026-10-01']);
  expect(loSplitOccurrenceId('gym')).toBeNull();
  const world = freshWorld(NOW);
  world.setItem(LO_KEYS.tasks, JSON.stringify([
    loNormalizeTask({ id: 'gym', title: 'Gym', date: TUE, recur: { freq: 'daily' } }),
    loNormalizeTask({ id: `gym@${WED}`, title: 'Gym B', date: WED, _from: 'gym', recur: { freq: 'daily' } }),
  ]));
  const nested = LOStore.tasksForDate(THU).find((t) => t.title === 'Gym B')!;
  LOStore.toggleTask(nested.id);
  expect(LOStore.getTask(nested.id)!.status).toBe('done');
});

test('changing the series reaches the days that were only completed, not the ones edited by hand', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.toggleTask(`gym@${TUE}`); // completed
  LOStore.updateTask(`gym@${WED}`, { start: '18:00' }); // edited by hand
  LOStore.updateSeries('gym', { title: 'Gimnasio', start: '06:30', durationMin: 45, recur: { freq: 'weekdays' } });

  expect(LOStore.getTask(`gym@${TUE}`)).toMatchObject({ title: 'Gimnasio', start: '06:30', end: '07:15', status: 'done' });
  expect(LOStore.getTask(`gym@${WED}`)).toMatchObject({ title: 'Gym', start: '18:00' });
  expect(LOStore.getTask(`gym@${THU}`)).toMatchObject({ title: 'Gimnasio', start: '06:30', durationMin: 45 });
  expect(titles('2026-10-03')).toEqual([]); // Saturday: now only on weekdays
});

test('updateSeries ignores a request to stop repeating and unknown ids', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.updateSeries('gym', { recur: null, title: 'Gym AM' });
  expect(LOStore.getTask('gym')).toMatchObject({ title: 'Gym AM', recur: { freq: 'daily' } });
  expect(LOStore.updateSeries('missing', { title: 'x' })).toBeUndefined();
});

test('ending a series keeps the days lived and removes the later ones', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.toggleTask(`gym@${TUE}`);
  LOStore.updateTask(`gym@${FRI}`, { title: 'Gym viernes' });
  LOStore.endSeries('gym', WED);
  expect(titles(TUE)).toEqual(['Gym']);
  expect(LOStore.getTask(`gym@${TUE}`)!.status).toBe('done');
  expect(titles(WED)).toEqual(['Gym']);
  expect(titles(THU)).toEqual([]);
  expect(titles(FRI)).toEqual([]);
  LOStore.endSeries('gym', '2026-09-01'); // before it starts → nothing left
  expect(LOStore.allTasks()).toEqual([]);
});

test('removing from a series: one day, that day onwards, or all of it', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.removeFromSeries(`gym@${WED}`, 'day');
  expect([titles(TUE), titles(WED), titles(THU)]).toEqual([['Gym'], [], ['Gym']]);
  LOStore.removeFromSeries(`gym@${THU}`, 'following');
  expect([titles(TUE), titles(THU), titles(FRI)]).toEqual([['Gym'], [], []]);
  LOStore.removeFromSeries(`gym@${TUE}`, 'all');
  expect(LOStore.allTasks()).toEqual([]);
});

test('removeFromSeries on a plain task simply removes it', () => {
  freshWorld(NOW);
  LOStore.addTask({ id: 'one', title: 'Dentista', date: TUE });
  LOStore.removeFromSeries('one', 'following');
  expect(LOStore.allTasks()).toEqual([]);
});

test('setTaskDone is idempotent', () => {
  freshWorld(NOW);
  dailyGym();
  LOStore.setTaskDone(`gym@${TUE}`, true);
  LOStore.setTaskDone(`gym@${TUE}`, true);
  expect(LOStore.getTask(`gym@${TUE}`)!.status).toBe('done');
  LOStore.setTaskDone(`gym@${TUE}`, false);
  LOStore.setTaskDone(`gym@${TUE}`, false);
  expect(LOStore.getTask(`gym@${TUE}`)!.status).toBe('todo');
});

test('a snapshot puts every collection back exactly as it was', () => {
  const world = freshWorld(NOW);
  dailyGym();
  LOStore.addHabit({ id: 'h1', title: 'Leer' });
  LOStore.addInbox('Comprar pan');
  const before = world.dump();
  const snapshot = LOStore.snapshot();

  LOStore.removeTask('gym');
  LOStore.removeHabit('h1');
  LOStore.addRoutine({ name: 'Nueva', tasks: [{ label: 'Paso' }] });
  LOStore.removeInbox(LOStore.allInbox()[0].id);
  expect(LOStore.allTasks()).toEqual([]);

  LOStore.restore(snapshot);
  expect(world.dump()).toEqual(before);
  expect(titles(TUE)).toEqual(['Gym']);
  expect(LOStore.customRoutines()).toEqual([]);
});

test('damaged collections read as empty instead of crashing', () => {
  const world = freshWorld(NOW);
  world.setItem(LO_KEYS.habits, '{"oops":true}');
  world.setItem(LO_KEYS.inbox, '[null, 3, {"id":"i1","text":"ok"}]');
  world.setItem(LO_KEYS.routines, '[{"id":"r1","name":"sin pasos"},{"id":"r2","name":"bien","tasks":[]}]');
  expect(LOStore.allHabits()).toEqual([]);
  expect(LOStore.allInbox()).toEqual([{ id: 'i1', text: 'ok' }]);
  expect(LOStore.customRoutines().map((r) => r.id)).toEqual(['r2']);
  LOStore.addHabit({ title: 'Meditar' }); // writing over the damage works
  expect(LOStore.allHabits()).toHaveLength(1);
});

test('a damaged time or length falls back to a usable one', () => {
  freshWorld(NOW);
  expect(loNormalizeTask({ title: 'a', start: '25:99', durationMin: -5 })).toMatchObject({ start: '09:00', end: '09:30', durationMin: 30 });
  expect(loNormalizeTask({ title: 'b', start: '10:00', durationMin: Number.NaN })).toMatchObject({ end: '10:30', durationMin: 30 });
  expect(loNormalizeTask({ title: 'c', status: 'weird' as never, priority: 'x' as never })).toMatchObject({ status: 'todo', priority: 'medium' });
});

test('an empty inbox note is not saved', () => {
  freshWorld(NOW);
  LOStore.addInbox('   ');
  expect(LOStore.allInbox()).toEqual([]);
});

test('a backup from a newer version is refused without touching the data', () => {
  const world = freshWorld(NOW);
  dailyGym();
  const before = world.dump();
  expect(() => LOStore.importAll({ app: 'lifeos', version: 3, tasks: [] })).toThrow(/versión más nueva/);
  expect(world.dump()).toEqual(before);
});

test('storage usage and the backup mark', () => {
  freshWorld(NOW);
  expect(LOStore.lastBackupAt()).toBeNull();
  dailyGym();
  const usage = LOStore.storageUsage();
  expect(usage.tasks).toBe(1);
  expect(usage.bytes).toBeGreaterThan(200);
  LOStore.markBackup();
  expect(LOStore.lastBackupAt()).toBe(NOW);
  expect(LOStore.exportAll()).not.toHaveProperty('lastBackupAt');
});
