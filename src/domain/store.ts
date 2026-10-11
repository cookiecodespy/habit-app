// store.ts — LOStore: every change to the user's data goes through here.
// Records carry id + createdAt + updatedAt and mutations are explicit, so a remote adapter
// could be added later without touching the screens.

import { now, nowMs } from './clock';
import { type DateStr, loAddDays, loDateStr, loHHMMtoMin, loMinToHHMM } from './dates';
import { LAST_BACKUP_KEY, LO_KEYS, USER_KEY, loRead, loReadList, loReadRaw, loWrite, notifyStoreChange, storage } from './storage';
import {
  loAllTasks, loIsOccurrenceId, loIsPristineOccurrence, loMaterializeOccurrence, loMutableTasks,
  loNormalizeTask, loSeriesIdOf, loSeriesOf, loSplitOccurrenceId, loTaskById, loTasksForDate, loUid,
  loUpcomingDeadlines,
} from './tasks';
import type { Backup, Habit, InboxItem, Recur, Routine, RoutineStep, Task, TaskInput, UserProfile } from './types';

/** The newest backup format this version can read. */
const BACKUP_VERSION = 2;

type Collection = keyof typeof LO_KEYS;
type Row = Record<string, unknown>;

const isObject = (x: unknown): x is Row => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = (x: unknown): x is string => typeof x === 'string';
const isDate = (x: unknown): boolean => isString(x) && /^\d{4}-\d{2}-\d{2}$/.test(x) && loDateStr(new Date(`${x}T12:00:00`)) === x;
const isDow = (d: unknown): boolean => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6;

// Reject malformed records rather than silently dropping them from a restore.
function validRecord(x: unknown, type: Collection): boolean {
  if (!isObject(x) || !isString(x.id) || !x.id) return false;
  for (const k of ['title', 'text', 'name', 'note', 'subtitle', 'icon', 'color', 'status', 'priority', 'category', '_from']) {
    if (x[k] != null && !isString(x[k])) return false;
  }
  if (type === 'tasks') {
    if (!isString(x.title)) return false;
    for (const k of ['date', 'targetDate', 'deadline']) if (x[k] != null && !isDate(x[k])) return false;
    for (const k of ['start', 'end']) {
      const v = x[k];
      if (v != null && (!isString(v) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v))) return false;
    }
    const dur = x.durationMin;
    if (dur != null && (!Number.isFinite(dur) || (dur as number) <= 0 || (dur as number) > 1440)) return false;
    const recur = x.recur;
    if (recur != null && (!isObject(recur) || !['daily', 'weekdays', 'weekly'].includes(recur.freq as string) || (recur.until != null && !isDate(recur.until)))) return false;
    if (isObject(recur) && recur.days != null && (!Array.isArray(recur.days) || !recur.days.every(isDow))) return false;
    const subs = x.subtasks;
    if (subs != null) {
      const ok = Array.isArray(subs)
        ? subs.every((t) => isObject(t) && isString(t.label) && (t.id == null || isString(t.id)))
        : isObject(subs) && Number.isInteger(subs.total) && (subs.total as number) >= 0 && (subs.total as number) <= 1000;
      if (!ok) return false;
    }
  }
  if (type === 'habits' && (!isString(x.title) || (x.log != null && !isObject(x.log)) || (x.days != null && (!Array.isArray(x.days) || !x.days.every(isDow))))) return false;
  if (type === 'inbox' && !isString(x.text)) return false;
  if (type === 'routines') {
    const steps = x.tasks;
    if (!isString(x.name) || !Array.isArray(steps)) return false;
    const stepOk = (t: unknown): boolean => isObject(t) && isString(t.label) && (t.icon == null || isString(t.icon)) && (t.color == null || isString(t.color))
      && (t.dur == null || (Number.isFinite(t.dur) && (t.dur as number) > 0 && (t.dur as number) <= 1440));
    if (!steps.every(stepOk)) return false;
  }
  return true;
}

/** The raw stored collections at one moment, to put back with LOStore.restore (undo). */
export type StoreSnapshot = Record<string, string | null>;

/** Fields of a series that also apply to the days already stored for it. */
const SERIES_FIELDS = ['title', 'icon', 'color', 'priority', 'category', 'note', 'start', 'durationMin', 'allDay', 'reminder'] as const;

export interface RoutineLike {
  id?: string;
  tasks?: RoutineStep[] | null;
}

export const LOStore = {
  // -- tasks --
  allTasks(): Task[] { return loAllTasks(); },
  saveTasks(list: Task[]): Task[] { loWrite(LO_KEYS.tasks, list); return list; },

  addTask(partial: TaskInput): Task {
    const list = loMutableTasks();
    const task = loNormalizeTask({ ...partial, updatedAt: nowMs() });
    list.push(task);
    LOStore.saveTasks(list);
    return task;
  },
  updateTask(id: string, patch: TaskInput): Task | undefined {
    const list = loMutableTasks();
    // Materialize a virtual recurring occurrence first, so editing a recurring task on a
    // given day actually persists. Mark it _edited so clean-up never discards the change.
    loMaterializeOccurrence(list, id);
    const isOcc = loIsOccurrenceId(id);
    // One day of a series never repeats on its own: the repetition belongs to the series
    // (see updateSeries). Storing it here would turn the day into a second, nested series.
    const change = isOcc ? { ...patch, recur: null } : patch;
    const next = list.map((t) => (t.id === id ? loNormalizeTask({ ...t, ...change, id, updatedAt: nowMs(), _edited: isOcc ? true : t._edited }) : t));
    LOStore.saveTasks(next);
    return next.find((t) => t.id === id);
  },
  /** A stored task or a day of a series, by id. */
  getTask(id: string): Task | null { return loTaskById(id); },
  /** The series a task belongs to, or null when it does not repeat. */
  seriesOf(task: Pick<Task, 'id' | 'recur' | '_from'>): Task | null { return loSeriesOf(task); },
  /**
   * Change every day of a series. Days stored only because they were completed follow the
   * change; days edited by hand keep what was edited. `recur: null` is ignored here — use
   * endSeries, which keeps the days already lived.
   */
  updateSeries(seriesId: string, patch: TaskInput): Task | undefined {
    const list = loMutableTasks();
    const series = list.find((t) => t.id === seriesId);
    if (!series || !series.recur) return undefined;
    const change: TaskInput = { ...patch };
    if ('recur' in change && !change.recur) delete change.recur;
    delete change.date; delete change.targetDate; delete change.status; delete change.subtasks;
    const shared: Record<string, unknown> = {};
    for (const key of SERIES_FIELDS) if (key in change) shared[key] = change[key];
    // A new start or length: let the end time be derived again.
    const retime = 'start' in shared || 'durationMin' in shared ? { end: undefined } : {};
    const next = list.map((t) => {
      if (t.id === seriesId) return loNormalizeTask({ ...t, ...change, ...retime, id: seriesId, updatedAt: nowMs() });
      if (t._from === seriesId && !t._edited && !t._deleted) return loNormalizeTask({ ...t, ...shared, ...retime, updatedAt: nowMs() });
      return t;
    });
    LOStore.saveTasks(next);
    return next.find((t) => t.id === seriesId);
  },
  /**
   * Stop a series after `lastDate` (inclusive): later days disappear, earlier ones stay as
   * they were. Ending it before its first day removes it altogether.
   */
  endSeries(seriesId: string, lastDate: DateStr): void {
    const list = loMutableTasks();
    const series = list.find((t) => t.id === seriesId);
    if (!series || !series.recur) return;
    if (lastDate < series.date) { LOStore.removeTask(seriesId); return; }
    const isLater = (t: Task): boolean => {
      const split = loSplitOccurrenceId(t.id);
      return t._from === seriesId && !!split && split[1] > lastDate;
    };
    const next = list.filter((t) => !isLater(t))
      .map((t) => (t.id === seriesId ? loNormalizeTask({ ...t, recur: { ...(t.recur as Recur), until: lastDate }, updatedAt: nowMs() }) : t));
    LOStore.saveTasks(next);
  },
  /** Remove one day of a series, that day and the following ones, or the whole series. */
  removeFromSeries(id: string, scope: 'day' | 'following' | 'all'): void {
    const task = loTaskById(id);
    const seriesId = task ? loSeriesIdOf(task) : null;
    if (!task || !seriesId) { LOStore.removeTask(id); return; }
    if (scope === 'all') LOStore.removeTask(seriesId);
    else if (scope === 'following') LOStore.endSeries(seriesId, loAddDays(loSplitOccurrenceId(task.id)?.[1] ?? task.date, -1));
    else LOStore.removeTask(id);
  },
  /** Mark a task done (or open again) without toggling: asking twice changes nothing. */
  setTaskDone(id: string, done: boolean): void {
    const task = loTaskById(id);
    if (task && (task.status === 'done') !== done) LOStore.toggleTask(id);
  },
  removeTask(id: string): void {
    const list = loMutableTasks();
    if (loIsOccurrenceId(id)) {
      const occurrence = loMaterializeOccurrence(list, id);
      if (occurrence) Object.assign(occurrence, { _deleted: true, _edited: true, updatedAt: nowMs() });
      LOStore.saveTasks(list);
    } else {
      LOStore.saveTasks(list.filter((t) => t.id !== id && t._from !== id));
    }
  },
  toggleTask(id: string): void {
    const list = loMutableTasks();
    const existing = list.find((t) => t.id === id);
    // Recurring occurrence not yet materialized → create a per-day done copy.
    const split = existing ? null : loSplitOccurrenceId(id);
    if (split) {
      const [baseId, date] = split;
      const base = list.find((t) => t.id === baseId);
      if (base) {
        list.push(loNormalizeTask({ ...base, id, date, recur: null, _from: baseId, status: 'done', completedAt: nowMs(), updatedAt: nowMs() }));
        LOStore.saveTasks(list);
        return;
      }
    }
    const next = list
      .map((t) => {
        if (t.id !== id) return t;
        const status = t.status === 'done' ? 'todo' : 'done';
        return loNormalizeTask({ ...t, status, completedAt: status === 'done' ? nowMs() : null, updatedAt: nowMs() });
      })
      // Un-completing a recurring occurrence returns it to its virtual form; drop the
      // now-pristine override instead of leaving orphan records.
      .filter((t) => !loIsPristineOccurrence(t));
    LOStore.saveTasks(next);
  },
  toggleSubtask(taskId: string, subId: string): void {
    const list = loMutableTasks();
    loMaterializeOccurrence(list, taskId);
    const isOcc = loIsOccurrenceId(taskId);
    const next = list.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks = t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
      // Auto-complete the parent when every step is done.
      const allDone = subtasks.length > 0 && subtasks.every((s) => s.done);
      return loNormalizeTask({ ...t, subtasks, status: allDone ? 'done' : (t.status === 'done' ? 'todo' : t.status), updatedAt: nowMs(), _edited: isOcc ? true : t._edited });
    });
    LOStore.saveTasks(next);
  },

  tasksForDate(dateStr: DateStr): Task[] { return loTasksForDate(dateStr); },
  upcomingDeadlines(limit = 3): Task[] { return loUpcomingDeadlines(limit); },

  // -- habits --
  allHabits(): Habit[] { return loReadList<Habit>(LO_KEYS.habits); },
  saveHabits(list: Habit[]): Habit[] { loWrite(LO_KEYS.habits, list); return list; },
  addHabit(partial: Partial<Habit>): Habit {
    const list = LOStore.allHabits();
    const habit: Habit = {
      id: loUid('h'), title: '', icon: '🔥', color: 'coral', cadence: 'daily',
      days: null, log: {}, createdAt: nowMs(), updatedAt: nowMs(), ...partial,
    };
    list.push(habit);
    LOStore.saveHabits(list);
    return habit;
  },
  updateHabit(id: string, patch: Partial<Habit>): Habit | undefined {
    const list = LOStore.allHabits().map((h) => (h.id === id ? { ...h, ...patch, id, updatedAt: nowMs() } : h));
    LOStore.saveHabits(list);
    return list.find((h) => h.id === id);
  },
  toggleHabitToday(id: string, dateStr: DateStr = loDateStr()): void {
    const list = LOStore.allHabits().map((h) => {
      if (h.id !== id) return h;
      const log = { ...(h.log || {}) };
      if (log[dateStr]) delete log[dateStr]; else log[dateStr] = true;
      return { ...h, log, updatedAt: nowMs() };
    });
    LOStore.saveHabits(list);
  },
  removeHabit(id: string): void { LOStore.saveHabits(LOStore.allHabits().filter((h) => h.id !== id)); },

  // -- inbox (quick capture, schedule later) --
  allInbox(): InboxItem[] { return loReadList<InboxItem>(LO_KEYS.inbox); },
  addInbox(text: string): void {
    const clean = String(text).trim();
    if (!clean) return;
    const list = LOStore.allInbox();
    list.unshift({ id: loUid('i'), text: clean, createdAt: nowMs(), updatedAt: nowMs() });
    loWrite(LO_KEYS.inbox, list);
  },
  removeInbox(id: string): void { loWrite(LO_KEYS.inbox, LOStore.allInbox().filter((i) => i.id !== id)); },

  // -- custom routines (user-made reusable task packs; defaults live in the UI) --
  customRoutines(): Routine[] { return loReadList<Routine>(LO_KEYS.routines).filter((r) => Array.isArray(r.tasks)); },
  addRoutine(partial: Partial<Routine>): Routine {
    const list = LOStore.customRoutines();
    const routine: Routine = {
      id: loUid('r'), name: 'Mi rutina', icon: '✨', color: 'coral',
      tasks: [], custom: true, createdAt: nowMs(), updatedAt: nowMs(), ...partial,
    };
    list.push(routine);
    loWrite(LO_KEYS.routines, list);
    return routine;
  },
  updateRoutine(id: string, patch: Partial<Routine>): Routine | undefined {
    const list = LOStore.customRoutines().map((r) => (r.id === id ? { ...r, ...patch, id, updatedAt: nowMs() } : r));
    loWrite(LO_KEYS.routines, list);
    return list.find((r) => r.id === id);
  },
  removeRoutine(id: string): void { loWrite(LO_KEYS.routines, LOStore.customRoutines().filter((r) => r.id !== id)); },

  // -- undo: capture the collections before a destructive change, put them back after --
  snapshot(): StoreSnapshot {
    return Object.fromEntries(Object.values(LO_KEYS).map((key) => [key, loReadRaw(key)]));
  },
  restore(snapshot: StoreSnapshot): void {
    const store = storage();
    for (const key of Object.values(LO_KEYS)) {
      if (!(key in snapshot)) continue;
      const raw = snapshot[key];
      if (raw == null) store.removeItem(key); else store.setItem(key, raw);
    }
    notifyStoreChange();
  },

  /** How much of the browser's storage the data takes, in bytes (2 per character). */
  storageUsage(): { bytes: number; tasks: number } {
    let chars = 0;
    for (const key of [...Object.values(LO_KEYS), USER_KEY]) chars += key.length + (loReadRaw(key) || '').length;
    return { bytes: chars * 2, tasks: loAllTasks().length };
  },
  lastBackupAt(): number | null {
    const at = Number(loReadRaw(LAST_BACKUP_KEY));
    return Number.isFinite(at) && at > 0 ? at : null;
  },
  /** Remember that a backup file was just downloaded. */
  markBackup(): void {
    try { storage().setItem(LAST_BACKUP_KEY, String(nowMs())); } catch { /* best effort */ }
    notifyStoreChange(LAST_BACKUP_KEY);
  },

  // -- data sovereignty: export / import the whole dataset as JSON --
  exportAll(): Backup {
    return {
      app: 'lifeos', version: BACKUP_VERSION, exportedAt: now().toISOString(),
      tasks: loRead<unknown[]>(LO_KEYS.tasks, []),
      habits: LOStore.allHabits(),
      inbox: LOStore.allInbox(),
      routines: LOStore.customRoutines(),
      user: loRead<UserProfile | null>(USER_KEY, null),
    };
  },
  importAll(data: unknown, { merge = false }: { merge?: boolean } = {}): { tasks: number; habits: number; inbox: number } {
    if (!isObject(data) || data.app !== 'lifeos' || !Array.isArray(data.tasks)) {
      throw new Error('Archivo inválido: no es un respaldo de LifeOS.');
    }
    if (typeof data.version === 'number' && data.version > BACKUP_VERSION) {
      throw new Error('Este respaldo es de una versión más nueva de LifeOS. Actualiza la app antes de importarlo.');
    }
    // Validate every collection before touching existing data.
    const pending: Record<string, unknown> = {};
    for (const type of Object.keys(LO_KEYS) as Collection[]) {
      const records = (data[type] ?? []) as Row[];
      if (!Array.isArray(records) || !records.every((x) => validRecord(x, type)) || new Set(records.map((x) => x.id)).size !== records.length) {
        throw new Error(`Respaldo inválido: revisa ${type}. No se modificaron tus datos.`);
      }
      const incoming: Row[] = type === 'tasks' ? records.map((r) => loNormalizeTask(r as TaskInput) as unknown as Row) : records;
      pending[LO_KEYS[type]] = merge
        ? Array.from(new Map([...loRead<Row[]>(LO_KEYS[type], []), ...incoming].map((x) => [x.id, x])).values())
        : incoming;
    }
    if (data.user != null) {
      if (!isObject(data.user) || (data.user.name != null && !isString(data.user.name))) throw new Error('Perfil inválido en el respaldo.');
      pending[USER_KEY] = merge ? { ...loRead<Row>(USER_KEY, {}), ...data.user } : data.user;
    }
    // Serialize and snapshot first; notify observers only after every write. Roll back the
    // completed writes if the browser refuses a later collection.
    const store = storage();
    const entries = Object.entries(pending).map(([key, value]) => [key, JSON.stringify(value)] as const);
    const previous = new Map(entries.map(([key]) => [key, store.getItem(key)]));
    const written: string[] = [];
    try {
      for (const [key, value] of entries) { store.setItem(key, value); written.push(key); }
    } catch (error) {
      let restored = true;
      for (const key of written.reverse()) {
        try {
          const old = previous.get(key);
          if (old == null) store.removeItem(key); else store.setItem(key, old);
        } catch { restored = false; }
      }
      throw new Error(
        restored ? 'No se pudo importar. Se conservaron los datos anteriores.' : 'Falló la restauración. Conserva el archivo de respaldo y libera espacio antes de reintentar.',
        { cause: error },
      );
    }
    notifyStoreChange();
    return {
      tasks: data.tasks.length,
      habits: Array.isArray(data.habits) ? data.habits.length : 0,
      inbox: Array.isArray(data.inbox) ? data.inbox.length : 0,
    };
  },

  // -- routines: schedule a pack of tasks on a given day, skipping busy slots --
  applyRoutine(routine: RoutineLike, opts: { date?: DateStr; startMin?: number } = {}): number {
    const date = opts.date || loDateStr();
    // Default start: the next 30-min boundary from now (or 9:00 for other days).
    let cursor: number;
    if (typeof opts.startMin === 'number') cursor = opts.startMin;
    else if (date === loDateStr()) {
      const n = now();
      cursor = Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30;
    } else cursor = 9 * 60;
    const list = loMutableTasks();
    const origin = new Date(`${date}T12:00:00`);
    const busy = new Map<number, Array<{ s: number; e: number }>>();
    const dayAt = (offset: number): DateStr => { const d = new Date(origin); d.setDate(d.getDate() + offset); return loDateStr(d); };
    const slots = (offset: number): Array<{ s: number; e: number }> => {
      let day = busy.get(offset);
      if (!day) {
        day = LOStore.tasksForDate(dayAt(offset)).filter((t) => !t.allDay)
          .map((t) => ({ s: offset * 1440 + loHHMMtoMin(t.start), e: offset * 1440 + loHHMMtoMin(t.start) + t.durationMin }));
        busy.set(offset, day);
      }
      return day;
    };
    for (const rt of routine.tasks || []) {
      const dur = rt.dur || 30;
      if (!Number.isFinite(dur) || dur <= 0 || dur > 1440 || !Number.isFinite(cursor) || cursor < 0) throw new Error('Horario de rutina inválido.');
      let placed = false;
      for (let attempt = 0; attempt < 10000; attempt++) {
        const day = Math.floor(cursor / 1440);
        const at = cursor;
        const clashes = [day - 1, day, Math.floor((cursor + dur - 1) / 1440)].flatMap(slots).filter((o) => at < o.e && at + dur > o.s);
        if (clashes.length) { cursor = Math.max(...clashes.map((o) => o.e)); continue; }
        const actualDate = dayAt(day);
        list.push(loNormalizeTask({ title: rt.label, icon: rt.icon, color: rt.color, start: loMinToHHMM(cursor), durationMin: dur, date: actualDate, routineId: routine.id }));
        slots(day).push({ s: cursor, e: cursor + dur });
        cursor += dur;
        placed = true;
        break;
      }
      if (!placed) throw new Error('No se encontró espacio para la rutina.');
    }
    LOStore.saveTasks(list);
    return (routine.tasks || []).length;
  },
};

// One-time migration from the pre-store key ('lifeos.user_tasks').
export function loMigrateLegacyTasks(): void {
  try {
    const store = storage();
    if (store.getItem(LO_KEYS.tasks)) return; // already on v2
    const legacy = store.getItem('lifeos.user_tasks');
    if (!legacy) return;
    const arr: unknown = JSON.parse(legacy);
    if (Array.isArray(arr) && arr.length) {
      store.setItem(LO_KEYS.tasks, JSON.stringify(arr.map((t) => loNormalizeTask(t as TaskInput))));
    } else {
      // Unexpected shape — keep a backup instead of discarding it silently.
      store.setItem('lifeos.user_tasks.bak', legacy);
    }
  } catch {
    // Nothing to migrate, or storage is unavailable.
  }
}
