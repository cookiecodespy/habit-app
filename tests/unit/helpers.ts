// Test helpers: an in-memory storage and a pinned clock for the domain layer.
import { setClock } from '../../src/domain/clock';
import { setStorage, type StorageLike } from '../../src/domain/storage';

export interface MemoryStorage extends StorageLike {
  data: Map<string, string>;
  dump(): Record<string, unknown>;
}

export function memoryStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key)! : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
    dump: () => Object.fromEntries([...data.keys()].sort().map((key) => [key, JSON.parse(data.get(key)!)])),
  };
}

/** Fresh empty storage + clock pinned at `ms`. Returns the storage. */
export function freshWorld(ms: number): MemoryStorage {
  const store = memoryStorage();
  setStorage(store);
  setClock(() => ms);
  return store;
}

/** Local time in the test time zone → epoch ms. Month is 1-12. */
export function at(y: number, m: number, d: number, h = 0, mi = 0): number {
  return new Date(y, m - 1, d, h, mi).getTime();
}
