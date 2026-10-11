// types.ts — the shapes LifeOS keeps in the device's storage.

import type { DateStr, TimeStr } from './dates';

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Priority = 'low' | 'medium' | 'high';
export type CategoryId = 'vida' | 'trabajo' | 'uni';
export type RecurFreq = 'daily' | 'weekdays' | 'weekly';

export interface Recur {
  freq: RecurFreq;
  /** Days of the week for 'weekly' (0 = Sunday). Defaults to the weekday of the first date. */
  days?: number[];
  /** Last date the series occurs on, inclusive. */
  until?: DateStr;
}

export interface Subtask {
  id: string;
  label: string;
  done: boolean;
}

export interface Task {
  id: string;
  kind: string;
  title: string;
  icon: string;
  color: string;
  status: TaskStatus;
  priority: Priority;
  date: DateStr;
  /** Legacy alias of `date`, kept in sync. */
  targetDate: DateStr;
  start: TimeStr;
  end: TimeStr;
  durationMin: number;
  subtasks: Subtask[];
  note: string;
  /** Legacy alias of `note`. */
  subtitle?: string;
  reminder: boolean;
  /** Legacy alias of `reminder`. */
  alarm: boolean;
  recur: Recur | null;
  deadline: DateStr | null;
  allDay: boolean;
  category: CategoryId | null;
  isHabit: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
  routineId?: string;
  /** Set on a stored occurrence of a recurring task: the id of its series. */
  _from?: string;
  /** The occurrence was changed by hand and must survive clean-up. */
  _edited?: boolean;
  /** Tombstone: this occurrence of the series was deleted. */
  _deleted?: boolean;
}

/** Anything that can be turned into a Task: a stored record, a legacy one or a partial draft. */
export type TaskInput = Partial<Omit<Task, 'subtasks'>> & {
  subtasks?: Array<Partial<Subtask>> | { done?: number; total?: number } | null;
  [legacy: string]: unknown;
};

export type HabitCadence = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  title: string;
  icon: string;
  color: string;
  cadence: HabitCadence;
  days: number[] | null;
  /** Days the habit was done: { 'YYYY-MM-DD': true }. */
  log: Record<DateStr, boolean>;
  createdAt: number;
  updatedAt: number;
}

export interface InboxItem {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface RoutineStep {
  label: string;
  icon?: string;
  color?: string;
  dur?: number;
}

export interface Routine {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasks: RoutineStep[];
  custom: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  installedAt?: number;
}

export interface Backup {
  app: 'lifeos';
  version: number;
  exportedAt: string;
  tasks: unknown[];
  habits: Habit[];
  inbox: InboxItem[];
  routines: Routine[];
  user: UserProfile | null;
}
