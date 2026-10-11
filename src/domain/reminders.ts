// reminders.ts — which tasks deserve a "starts soon" notification right now.

import { loHHMMtoMin } from './dates';
import type { Task } from './types';

export const REMINDER_LEAD_MIN = 10;

export interface DueReminder {
  /** Identifies this reminder so it is sent only once. */
  key: string;
  task: Task;
  minutes: number;
}

/**
 * Timed, still-open tasks with the reminder switched on that start within the next
 * REMINDER_LEAD_MIN minutes. `sent` holds the keys already notified.
 */
export function loDueReminders(todayTasks: readonly Task[], nowDate: Date, sent: ReadonlySet<string>): DueReminder[] {
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  const due: DueReminder[] = [];
  for (const task of todayTasks) {
    if (task.kind === 'break' || task.status !== 'todo' || !task.start || !task.reminder || task.allDay) continue;
    const minutes = loHHMMtoMin(task.start) - nowMin;
    const key = `${task.id}:${task.date}:${task.start}`;
    if (minutes > 0 && minutes <= REMINDER_LEAD_MIN && !sent.has(key)) due.push({ key, task, minutes });
  }
  return due;
}
