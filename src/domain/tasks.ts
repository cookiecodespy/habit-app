// tasks.ts — task records: normalization, recurrence, and the cached, indexed read side.

import { nowMs } from './clock';
import { type DateStr, loDateStr, loDow, loHHMMtoMin, loMinToHHMM } from './dates';
import { LO_KEYS, loReadRaw } from './storage';
import type { Subtask, Task, TaskInput } from './types';

export function loUid(prefix = 't'): string {
  return prefix + nowMs().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Accepts a partial or legacy task object and returns a canonical one. */
export function loNormalizeTask(raw: TaskInput): Task {
  const t: TaskInput = { ...raw };
  t.id = t.id || loUid('t');
  t.kind = t.kind || 'task';
  t.title = (t.title || '').trim();
  t.icon = t.icon || 'star';
  t.color = t.color || 'mint';
  t.status = t.status || 'todo';
  t.priority = t.priority || 'medium';
  t.date = t.date || t.targetDate || loDateStr();
  t.targetDate = t.date; // legacy alias kept in sync for old screens
  t.start = t.start || '09:00';
  if (typeof t.durationMin !== 'number') {
    if (t.start && t.end) {
      let dur = loHHMMtoMin(t.end) - loHHMMtoMin(t.start);
      if (dur < 0) dur += 1440; // task crosses midnight → keep duration positive
      t.durationMin = Math.max(5, dur);
    } else t.durationMin = 30;
  }
  t.end = loMinToHHMM(loHHMMtoMin(t.start) + t.durationMin);
  // Subtasks are always an array of {id,label,done}. Legacy {done,total} objects are
  // expanded into placeholder steps so progress still renders.
  if (Array.isArray(t.subtasks)) {
    t.subtasks = t.subtasks.map((s): Subtask => ({ id: s.id || loUid('s'), label: s.label || 'Paso', done: !!s.done }));
  } else if (t.subtasks && typeof t.subtasks === 'object') {
    const { done = 0, total = 0 } = t.subtasks;
    t.subtasks = Array.from({ length: total }, (_, i): Subtask => ({ id: loUid('s'), label: `Paso ${i + 1}`, done: i < done }));
  } else {
    t.subtasks = [];
  }
  t.note = t.note ?? t.subtitle ?? '';
  t.subtitle = t.note || undefined; // legacy alias
  t.reminder = t.reminder == null ? !!t.alarm : !!t.reminder;
  t.alarm = t.reminder;
  t.recur = t.recur || null;
  t.deadline = t.deadline || null;
  t.allDay = !!t.allDay;
  t.category = t.category || null;
  t.isHabit = !!t.isHabit;
  t.createdAt = t.createdAt || nowMs();
  // Preserve the real last-edit time. Reading the store must NOT bump this, or a future
  // last-write-wins sync between two phones would pick the wrong record.
  t.updatedAt = t.updatedAt || t.createdAt;
  return t as Task;
}

/** An occurrence id is "<series id>@<date>". */
export function loIsOccurrenceId(id: string): boolean {
  return String(id).includes('@');
}

// Ensure a concrete record exists for an id. Occurrences of a recurring task are virtual
// ("base@date") until something about that one day changes; materialize it so the edit persists.
export function loMaterializeOccurrence(list: Task[], id: string): Task | null {
  let task = list.find((t) => t.id === id);
  if (task) return task;
  if (loIsOccurrenceId(id)) {
    const [baseId, date] = id.split('@');
    const base = list.find((t) => t.id === baseId);
    if (base) {
      task = loNormalizeTask({ ...base, id, date, recur: null, _from: baseId });
      list.push(task);
      return task;
    }
  }
  return null;
}

// A stored occurrence is "pristine" when it is back to todo with no completed steps and no
// explicit edit — indistinguishable from its virtual form. Those are dropped so overrides do
// not pile up forever.
export function loIsPristineOccurrence(t: Task): boolean {
  return !!t._from && loIsOccurrenceId(t.id) && t.status === 'todo' && !t._edited && !t._deleted
    && !(t.subtasks || []).some((s) => s.done);
}

/** Subtask-derived progress, used by the timeline cards. */
export function loSubProgress(t: Pick<Task, 'subtasks'>): { done: number; total: number } | null {
  if (!t.subtasks || !t.subtasks.length) return null;
  return { done: t.subtasks.filter((s) => s.done).length, total: t.subtasks.length };
}

/** Does a recurring template occur on dateStr? */
export function loRecurOccursOn(task: Pick<Task, 'date' | 'recur'>, dateStr: DateStr): boolean {
  if (!task.recur) return false;
  if (dateStr < task.date) return false; // not before its start
  if (task.recur.until && dateStr > task.recur.until) return false;
  const dow = loDow(dateStr);
  switch (task.recur.freq) {
    case 'daily': return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekly': return (task.recur.days || [loDow(task.date)]).includes(dow);
    default: return false;
  }
}

// ── read side ────────────────────────────────────────────────
// Parsing and normalizing the whole list on every read made the Agenda slower the longer the
// app was used. The list is parsed once per stored value and indexed by date; records handed
// out are frozen, so nothing can corrupt the cache by accident. Writers start from a fresh copy.

interface TaskIndex {
  raw: string | null;
  all: readonly Task[];
  visible: readonly Task[];
  ids: Set<string>;
  byDate: Map<DateStr, Task[]>;
  series: Task[];
  days: Map<DateStr, readonly Task[]>;
}

let index: TaskIndex | null = null;
let parses = 0;

function parseTasks(raw: string | null): TaskInput[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value as TaskInput[] : [];
  } catch {
    return [];
  }
}

function freezeTask(task: Task): Task {
  for (const step of task.subtasks) Object.freeze(step);
  Object.freeze(task.subtasks);
  if (task.recur) {
    if (task.recur.days) Object.freeze(task.recur.days);
    Object.freeze(task.recur);
  }
  return Object.freeze(task);
}

function taskIndex(): TaskIndex {
  const raw = loReadRaw(LO_KEYS.tasks);
  if (index && index.raw === raw) return index;
  parses++;
  const all = parseTasks(raw).map((record) => freezeTask(loNormalizeTask(record)));
  const byDate = new Map<DateStr, Task[]>();
  const series: Task[] = [];
  for (const task of all) {
    if (task._deleted) continue;
    if (task.recur) { series.push(task); continue; }
    const day = byDate.get(task.date);
    if (day) day.push(task); else byDate.set(task.date, [task]);
  }
  index = {
    raw, all, byDate, series,
    visible: all.filter((t) => !t._deleted),
    ids: new Set(all.map((t) => t.id)),
    days: new Map(),
  };
  return index;
}

/** How many times the stored list had to be parsed (a regression guard for tests). */
export function loTaskParseCount(): number {
  return parses;
}

/** A fresh, mutable copy of every stored record — the starting point of every write. */
export function loMutableTasks(): Task[] {
  return parseTasks(loReadRaw(LO_KEYS.tasks)).map(loNormalizeTask);
}

/** Every stored record, including deletion tombstones. Read-only. */
export function loAllTasks(): Task[] {
  return taskIndex().all.slice();
}

/** Stored records without tombstones. The same array is returned until the store changes. */
export function loVisibleTasks(): readonly Task[] {
  return taskIndex().visible;
}

/**
 * Concrete tasks for a date, expanding recurring templates into virtual occurrences whose id
 * is suffixed with @date so completion is per day. A stored occurrence (edit, completion or
 * deletion tombstone) replaces the virtual one for its original date.
 */
export function loTasksForDate(dateStr: DateStr): Task[] {
  const idx = taskIndex();
  let day = idx.days.get(dateStr);
  if (!day) {
    const direct = idx.byDate.get(dateStr) || [];
    const recurring = idx.series
      .filter((t) => loRecurOccursOn(t, dateStr) && !idx.ids.has(`${t.id}@${dateStr}`))
      .map((t) => freezeTask(loNormalizeTask({ ...t, id: `${t.id}@${dateStr}`, date: dateStr, recur: null, _from: t.id })));
    day = [...direct, ...recurring].sort((a, b) => loHHMMtoMin(a.start) - loHHMMtoMin(b.start));
    idx.days.set(dateStr, day);
  }
  return day.slice();
}

/** Open tasks with a hard due date today or later, nearest first. */
export function loUpcomingDeadlines(limit = 3): Task[] {
  const today = loDateStr();
  return taskIndex().visible
    .filter((t) => t.deadline && t.status !== 'done' && !loIsOccurrenceId(t.id) && t.deadline >= today)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : a.deadline! > b.deadline! ? 1 : 0))
    .slice(0, limit);
}
