// storage.ts — persistence boundary. The rest of the domain reads and writes through here, so
// the backing store can be swapped (tests use an in-memory one; a sync adapter could too).

export const LO_KEYS = {
  tasks: 'lifeos.tasks.v2',
  habits: 'lifeos.habits.v1',
  inbox: 'lifeos.inbox.v1',
  routines: 'lifeos.routines.v1',
} as const;

export const USER_KEY = 'lifeos.user';
/** When the last backup file was downloaded (epoch ms). Not part of a backup. */
export const LAST_BACKUP_KEY = 'lifeos.lastBackupAt';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type PersistErrorKind = 'quota' | 'unknown';

let backing: StorageLike | null = null;
const listeners = new Set<(key?: string) => void>();
let onPersistError: (kind: PersistErrorKind) => void = () => {};

/** Replace the backing store (tests). Pass null to use the browser's localStorage. */
export function setStorage(storage: StorageLike | null): void {
  backing = storage;
}

export function storage(): StorageLike {
  return backing ?? globalThis.localStorage;
}

/** The UI registers how to tell the user that a change could not be saved. */
export function setPersistErrorHandler(handler: (kind: PersistErrorKind) => void): void {
  onPersistError = handler;
}

/** Subscribe to "something in the store changed". Returns the unsubscribe function. */
export function subscribeStore(listener: (key?: string) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Tell subscribers the store changed (after a write, or when another tab wrote). */
export function notifyStoreChange(key?: string): void {
  for (const listener of [...listeners]) listener(key);
}

export function loReadRaw(key: string): string | null {
  try { return storage().getItem(key); }
  catch { return null; }
}

export function loRead<T>(key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

/**
 * A stored collection. Anything that is not a list of records with an id (a damaged or
 * hand-edited value) reads as empty or is skipped, so one bad entry cannot crash a screen.
 */
export function loReadList<T extends { id: string }>(key: string): T[] {
  const value = loRead<unknown>(key, []);
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is T => !!x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string');
}

/** Persist a value. A refused write warns the user, throws, and never announces a change. */
export function loWrite(key: string, val: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(val));
  } catch (e) {
    const err = e as { name?: string; message?: string } | null;
    const quota = !!err && (err.name === 'QuotaExceededError' || /quota|exceeded/i.test(err.message || ''));
    onPersistError(quota ? 'quota' : 'unknown');
    throw e;
  }
  notifyStoreChange(key);
}
