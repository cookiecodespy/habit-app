// Golden tests: the domain layer must reproduce, call by call, the reference results stored
// next to the scenarios. A deliberate behaviour change is made visible by regenerating them
// (UPDATE_GOLDEN=1 npm test) and reviewing the diff.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';
import * as categories from '../../src/domain/categories';
import { setClock } from '../../src/domain/clock';
import * as dates from '../../src/domain/dates';
import * as habits from '../../src/domain/habits';
import * as nlp from '../../src/domain/nlp';
import { setStorage } from '../../src/domain/storage';
import { LOStore } from '../../src/domain/store';
import * as tasks from '../../src/domain/tasks';
import { PHRASE_CLOCKS, STORE_SCENARIOS, clockMs, runPhrases, runStoreScenario, stableIds } from './golden/runner.js';
import { freshWorld } from './helpers';

const api = { ...dates, ...tasks, ...habits, ...categories, ...nlp, LOStore };
const file = (name: string) => fileURLToPath(new URL(`./golden/${name}`, import.meta.url));
const load = (name: string) => JSON.parse(readFileSync(file(name), 'utf8'));
const update = process.env.UPDATE_GOLDEN === '1';

const storeGolden = load('store.golden.json');
const phrasesGolden = load('phrases.golden.json');

afterAll(() => { setClock(null); setStorage(null); });

describe('store scenarios', () => {
  for (const scenario of STORE_SCENARIOS) {
    test(scenario.name, () => {
      const now = clockMs(scenario.clock);
      const world = freshWorld(now);
      const actual = stableIds(runStoreScenario(api, world.dump, scenario), now);
      if (update) storeGolden[scenario.name] = actual;
      else expect(actual).toEqual(storeGolden[scenario.name]);
    });
  }
});

describe('planner phrases', () => {
  for (const clock of PHRASE_CLOCKS) {
    test(`parsed at ${clock}`, () => {
      const now = clockMs(clock);
      freshWorld(now);
      const actual = stableIds(runPhrases(api), now);
      if (update) phrasesGolden[clock] = actual;
      else expect(actual).toEqual(phrasesGolden[clock]);
    });
  }
});

afterAll(() => {
  if (!update) return;
  writeFileSync(file('store.golden.json'), `${JSON.stringify(storeGolden, null, 1)}\n`);
  writeFileSync(file('phrases.golden.json'), `${JSON.stringify(phrasesGolden, null, 1)}\n`);
});
