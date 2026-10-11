// clock.ts — the single source of "now" for the domain layer.
// Everything date-dependent asks here instead of calling new Date()/Date.now() directly, so
// tests can pin the clock and the UI can re-render on a real tick.

let source: () => number = () => Date.now();

/** Replace the clock (tests). Pass null to go back to the system clock. */
export function setClock(fn: (() => number) | null): void {
  source = fn ?? (() => Date.now());
}

export function nowMs(): number {
  return source();
}

export function now(): Date {
  return new Date(source());
}
