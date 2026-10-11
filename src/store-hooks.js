// store-hooks.js — React bindings for the store: components re-render when the data changes,
// in this tab or in another one.

import React from 'react';
import { loHabitScheduledOn, loHabitStreak } from './domain/habits';
import { subscribeStore } from './domain/storage';
import { LOStore } from './domain/store';
import { loVisibleTasks } from './domain/tasks';

function useStoreVersion() {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const unsubscribe = subscribeStore(() => force());
    const onOtherTab = () => force();
    window.addEventListener('storage', onOtherTab);
    return () => { unsubscribe(); window.removeEventListener('storage', onOtherTab); };
  }, []);
}

function useTasks() {
  useStoreVersion();
  return {
    all: loVisibleTasks(),
    forDate: LOStore.tasksForDate,
    add: LOStore.addTask, update: LOStore.updateTask, remove: LOStore.removeTask,
    toggle: LOStore.toggleTask, toggleSubtask: LOStore.toggleSubtask,
  };
}

function useHabits() {
  useStoreVersion();
  return {
    all: LOStore.allHabits(),
    add: LOStore.addHabit, update: LOStore.updateHabit, toggleToday: LOStore.toggleHabitToday, remove: LOStore.removeHabit,
    streak: loHabitStreak, scheduledOn: loHabitScheduledOn,
  };
}

function useInbox() {
  useStoreVersion();
  return { all: LOStore.allInbox(), add: LOStore.addInbox, remove: LOStore.removeInbox };
}

export { useHabits, useInbox, useStoreVersion, useTasks };
