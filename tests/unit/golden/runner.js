// Runs the scenario data against an implementation of the domain API and returns plain JSON.
// Shared by the golden tests and by the script that first captured the reference results.
import { CLOCKS, PHRASES, STORE_SCENARIOS } from './scenarios.js';

export const PHRASE_CLOCKS = ['tuesdayMorning', 'saturdayLateNight', 'yearEnd', 'sundayNoon'];

export function clockMs(name) {
  const [y, m, d, h, mi] = CLOCKS[name];
  return new Date(y, m - 1, d, h, mi).getTime();
}

const lookup = (root, path) => path.split('.').reduce((value, key) => (value == null ? value : value[key]), root);

function resolveRefs(value, saved) {
  if (typeof value === 'string') {
    const whole = value.match(/^\$(\w+(?:\.\w+)*)$/);
    if (whole) return lookup(saved, whole[1]);
    return value.replace(/\$(\w+(?:\.\w+)*)/g, (_, path) => String(lookup(saved, path)));
  }
  if (Array.isArray(value)) return value.map((item) => resolveRefs(item, saved));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveRefs(item, saved)]));
  }
  return value;
}

// Helpers that combine several API calls the way the UI does.
function helpers(api) {
  return {
    say(text) {
      const parsed = api.loParseCommand(text);
      return { parsed, result: api.loExecuteCommand(parsed) };
    },
    habitStats(id) {
      const habit = api.LOStore.allHabits().find((h) => h.id === id);
      return {
        streak: api.loHabitStreak(habit),
        rate30: api.loHabitRate(habit, 30),
        rate7: api.loHabitRate(habit, 7),
        scheduledToday: api.loHabitScheduledOn(habit, api.loDateStr()),
      };
    },
  };
}

const plain = (value) => (value === undefined ? { __undefined: true } : JSON.parse(JSON.stringify(value)));

// `api` exposes the domain functions; `storageDump()` returns the persisted state.
export function runStoreScenario(api, storageDump, scenario) {
  const saved = {};
  const extra = helpers(api);
  const results = [];
  for (const call of scenario.calls) {
    const target = extra[call.fn] ? extra : api;
    const fn = lookup(target, call.fn);
    if (typeof fn !== 'function') throw new Error(`unknown function in scenario: ${call.fn}`);
    let entry;
    try {
      const returned = fn(...resolveRefs(call.args, saved));
      if (call.as) saved[call.as] = returned;
      entry = { fn: call.fn, returns: plain(returned) };
    } catch (error) {
      entry = { fn: call.fn, throws: String(error && error.message) };
    }
    results.push(entry);
  }
  return { results, storage: storageDump() };
}

export function runPhrases(api) {
  return PHRASES.map((text) => {
    try {
      return { text, parsed: plain(api.loParseCommand(text)) };
    } catch (error) {
      return { text, throws: String(error && error.message) };
    }
  });
}

// Generated ids embed randomness. Replace each one by a placeholder numbered by first
// appearance so two runs can be compared.
export function stableIds(value, nowMs) {
  const stamp = nowMs.toString(36);
  const seen = new Map();
  const json = JSON.stringify(value).replace(new RegExp(`\\b([a-z]{1,3})${stamp}[0-9a-z]{0,5}`, 'g'), (id, prefix) => {
    if (!seen.has(id)) seen.set(id, `${prefix}#${seen.size + 1}`);
    return seen.get(id);
  });
  return JSON.parse(json);
}

export { STORE_SCENARIOS };
