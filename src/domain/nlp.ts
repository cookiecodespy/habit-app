// nlp.ts — the offline planner: turns a Spanish phrase into an action on the store.
// It is a rule-based parser with a limited grammar, not a language model.

import { now } from './clock';
import { loGuessIconColor, loStrip } from './categories';
import { type DateStr, type TimeStr, fmt12, loDateStr, loMinToHHMM } from './dates';
import { LOStore } from './store';
import type { Recur, Task } from './types';

export interface DraftTask {
  title: string;
  date: DateStr;
  start: TimeStr | null;
  durationMin: number;
  recur: Recur | null;
  icon: string;
  color: string;
  reminder: boolean;
}

export type ParsedCommand =
  | { intent: 'create'; task: DraftTask; meta: { hadDate: boolean; hadTime: boolean; dayLabel: string | null; timeLabel: string | null } }
  | { intent: 'delete' | 'complete'; query: string }
  | { intent: 'move'; query: string; start: TimeStr | null }
  | { intent: 'help' }
  | { intent: 'unknown'; raw: string };

export interface CommandResult {
  reply: string;
  task?: Task;
}

const LO_DOW_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const LO_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Parse a date reference. Returns { date, matched } or null.
export function loParseDate(low: string, base: Date = now()): { date: DateStr; matched: string } | null {
  const today = new Date(base);
  today.setHours(0, 0, 0, 0);
  const thisMorning = low.match(/\besta\s+ma[nñ]ana\b/);
  if (thisMorning) return { date: loDateStr(today), matched: thisMorning[0] };
  const mk = (off: number): DateStr => { const d = new Date(today); d.setDate(today.getDate() + off); return loDateStr(d); };
  if (/\bpasado\s+ma[nñ]ana\b/.test(low)) return { date: mk(2), matched: 'pasado mañana' };
  if (/\bma[nñ]ana\b/.test(low)) return { date: mk(1), matched: 'mañana' };
  if (/\bhoy\b|\besta\s+(tarde|noche|ma[nñ]ana)\b/.test(low)) return { date: mk(0), matched: 'hoy' };
  // weekday name (next occurrence)
  for (let i = 0; i < 7; i++) {
    const name = loStrip(LO_DOW_NAMES[i]);
    if (new RegExp(`\\b(este |pr[oó]ximo |el )?${name}\\b`).test(low)) {
      const cur = today.getDay();
      let delta = (i - cur + 7) % 7; if (delta === 0) delta = 7; // next, not today
      return { date: mk(delta), matched: name };
    }
  }
  // "el 5 de junio" / "el 5"
  const m = low.match(/\bel\s+(\d{1,2})(?:\s+de\s+([a-z]+))?/);
  if (m) {
    const day = +m[1];
    let month = today.getMonth();
    const monthWord = m[2];
    if (monthWord) { const mi = LO_MONTHS.findIndex((mo) => loStrip(mo).startsWith(monthWord.slice(0, 3))); if (mi >= 0) month = mi; }
    const year = today.getFullYear();
    const cand = new Date(year, month, day);
    if (cand < today && !monthWord) cand.setMonth(month + 1); // next month if past
    return { date: loDateStr(cand), matched: m[0] };
  }
  return null;
}

// Parse a clock time. Scans ALL number tokens and keeps the first one that
// carries a real time cue ("a las", am/pm, a colon, "y media", or 24h "h"),
// so a leading duration like "20 min" never gets mistaken for the time.
export function loParseTime(low: string): { start: TimeStr; matched: string } | null {
  const re = /(a\s+las?\s+)?(\d{1,2})([:.](\d{2}))?\s*(am|a\.m\.|pm|p\.m\.|hrs|hs|hr|h)?(\s+y\s+(media|cuarto))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(low))) {
    if (!m[0].trim()) { re.lastIndex++; continue; }
    const las = !!m[1], colon = !!m[4], mer = (m[5] || '').replace(/\./g, ''), yq = m[7];
    let h = +m[2], min = m[4] ? +m[4] : 0;
    const isMer = mer === 'am' || mer === 'pm';
    const isH24 = (mer === 'h' || mer === 'hr' || mer === 'hrs' || mer === 'hs') && h >= 13; // "19h"; bare "1h" is a duration
    const cue = las || colon || isMer || !!yq || isH24;
    if (!cue) continue;
    if (yq === 'media') min = 30;
    if (yq === 'cuarto') min = 15;
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (h > 23 || min > 59) continue;
    return { start: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`, matched: m[0].trim() };
  }
  return null;
}

// Parse a duration. Returns { durationMin, matched } or null.
export function loParseDuration(low: string): { durationMin: number; matched: string } | null {
  if (/\bhora\s+y\s+media\b/.test(low)) return { durationMin: 90, matched: 'hora y media' };
  if (/\bmedia\s+hora\b/.test(low)) return { durationMin: 30, matched: 'media hora' };
  let m = low.match(/\b(\d+)\s*(h|hr|hrs|hora|horas)\b/);
  if (m) return { durationMin: +m[1] * 60, matched: m[0] };
  m = low.match(/\b(\d+)\s*(m|min|mins|minuto|minutos)\b/);
  if (m) return { durationMin: +m[1], matched: m[0] };
  if (/\buna\s+hora\b/.test(low)) return { durationMin: 60, matched: 'una hora' };
  return null;
}

// Parse recurrence. Returns { recur, matched } or null.
export function loParseRecur(low: string): { recur: Recur; matched: string } | null {
  if (/\b(entre\s+semana|d[ií]as?\s+de\s+semana|lunes\s+a\s+viernes)\b/.test(low)) return { recur: { freq: 'weekdays' }, matched: 'entre semana' };
  if (/\b(cada\s+d[ií]a|todos\s+los\s+d[ií]as|diariamente|a\s+diario)\b/.test(low)) return { recur: { freq: 'daily' }, matched: 'cada día' };
  for (let i = 0; i < 7; i++) {
    const name = loStrip(LO_DOW_NAMES[i]);
    if (new RegExp(`\\b(cada|todos\\s+los)\\s+${name}s?\\b`).test(low)) return { recur: { freq: 'weekly', days: [i] }, matched: `cada ${name}` };
  }
  if (/\bcada\s+semana|semanalmente\b/.test(low)) return { recur: { freq: 'weekly' }, matched: 'cada semana' };
  return null;
}

const LO_CMD_VERBS = /\b(ag[eé]ndame|ag[eé]nda|agendar|agrega|agregar|a[nñ]ade|a[nñ]adir|crea|crear|pon|poner|ponme|programa|programar|recu[eé]rdame|recordar|nueva\s+tarea|necesito|quiero|tengo\s+que|debo)\b/g;
const loWordListRE = (words: string[], flags = 'giu'): RegExp => new RegExp(`(?<![\\p{L}\\p{N}_])(?:${words.join('|')})(?![\\p{L}\\p{N}_])`, flags);
const LO_TITLE_GLUE_RE = loWordListRE(['a\\s+las?', 'para', 'el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'esta', 'este', 'pr[oó]ximo', 'que', 'me', 'mi', 'cada', 'todos\\s+los', 'todos', 'todas']);
const LO_DELETE_GLUE_RE = loWordListRE(['borra', 'borrar', 'elimina', 'eliminar', 'quita', 'quitar', 'cancela', 'cancelar', 'la', 'el', 'tarea', 'de', 'mi']);
const LO_COMPLETE_GLUE_RE = loWordListRE(['completa', 'completar', 'marca', 'marcar', 'como', 'hecho', 'hecha', 'ya', 'hice', 'termin[eé]', 'el', 'la', 'tarea', 'de', 'mi']);

// Main entry: produce an action plan from free text.
export function loParseCommand(text: string): ParsedCommand {
  const raw = text.trim();
  const low = loStrip(raw);

  // Intent: delete / complete / move take priority if their verbs appear.
  if (/\b(borra|borrar|elimina|eliminar|quita|quitar|cancela|cancelar)\b/.test(low)) {
    return { intent: 'delete', query: raw.replace(LO_DELETE_GLUE_RE, '').replace(/\s+/g, ' ').trim() };
  }
  if (/\b(completa|completar|marca.*hech[oa]|ya\s+hice|termine|hecho|listo\s+el)\b/.test(low)) {
    return { intent: 'complete', query: raw.replace(LO_COMPLETE_GLUE_RE, '').replace(/\s+/g, ' ').trim() };
  }
  if (/\b(mueve|mover|posterga|postergar|cambia.*hora|reprograma|pasa)\b/.test(low)) {
    const time = loParseTime(low);
    return { intent: 'move', query: raw.replace(/\b(mueve|mover|posterga|postergar|reprograma|pasa|cambia\s+la\s+hora\s+de)\b/gi, '').replace(time ? time.matched : /$^/, '').trim(), start: time && time.start };
  }
  if (/\b(c[oó]mo|ayuda|qu[eé]\s+puedo|qu[eé]\s+haces|tutorial|funciona)\b/.test(low)) {
    return { intent: 'help' };
  }

  // Default: create.
  const date = loParseDate(low);
  const time = loParseTime(low);
  const dur = loParseDuration(low);
  const recur = loParseRecur(low);

  // Build the title by removing every matched token + command verbs + glue words.
  let title = raw;
  // Remove matched date / time / duration tokens literally.
  for (const part of [date, time, dur]) {
    const k = part && part.matched;
    if (k) title = title.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
  }
  // Recurrence: strip the weekday by its real accented name (so "todos los miércoles"
  // leaves the title clean). The generic stopword pass must NOT touch weekday words.
  if (recur) {
    const days = recur.recur && recur.recur.days;
    if (days && days.length) {
      title = title.replace(new RegExp(`(cada|todos\\s+los)\\s+${LO_DOW_NAMES[days[0]]}s?`, 'iu'), ' ');
    } else if (recur.matched) {
      title = title.replace(new RegExp(recur.matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
    }
  }
  title = title.replace(LO_CMD_VERBS, ' ')
    .replace(LO_TITLE_GLUE_RE, ' ')
    .replace(/\s+/g, ' ').trim();
  // Capitalize first letter.
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);

  if (!title) return { intent: 'unknown', raw };

  const ic = loGuessIconColor(title);
  return {
    intent: 'create',
    task: {
      title,
      date: date ? date.date : loDateStr(),
      start: time ? time.start : null,
      durationMin: dur ? dur.durationMin : 30,
      recur: recur ? recur.recur : null,
      icon: ic.icon, color: ic.color,
      reminder: !!recur || /\brecu[eé]rda/.test(low),
    },
    meta: { hadDate: !!date, hadTime: !!time, dayLabel: date && date.matched, timeLabel: time && time.start },
  };
}

// Find the single best task matching a free-text query. Scores each candidate
// (full-phrase > all-words > first-word) and only returns a winner when it's
// unambiguous, so "borra gym" never deletes the wrong task silently.
export function loFindTaskByQuery<T extends { title: string }>(tasks: readonly T[], query: string | null | undefined): { hit: T | null; ambiguous: boolean } {
  const q = loStrip(query || '').trim();
  if (!q) return { hit: null, ambiguous: false };
  const words = q.split(/\s+/).filter(w => w.length > 2);
  const scored = tasks.map(t => {
    const title = loStrip(t.title);
    let score = 0;
    if (title === q) score = 100;
    else if (title.includes(q)) score = 60;
    else if (words.length && words.every(w => title.includes(w))) score = 40;
    // A first-word-only match is unsafe for delete/complete/move.
    return { t, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return { hit: null, ambiguous: false };
  // Two tasks tied at the top and neither is an exact title match → too risky, ask.
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { hit: null, ambiguous: true };
  }
  return { hit: scored[0].t, ambiguous: false };
}

// Execute a parsed plan against the store and return a human reply.
export function loExecuteCommand(parsed: ParsedCommand): CommandResult | null {
  const fmtDay = (d: DateStr): string => {
    if (d === loDateStr()) return 'hoy';
    const tm = now(); tm.setDate(tm.getDate() + 1);
    if (d === loDateStr(tm)) return 'mañana';
    const [, mo, da] = d.split('-').map(Number);
    return `el ${da} de ${LO_MONTHS[mo - 1]}`;
  };
  if (parsed.intent === 'create') {
    const tk = parsed.task;
    // No explicit time → next free 30-min slot on that day.
    if (!tk.start) {
      if (tk.date === loDateStr()) { const n = now(); tk.start = loMinToHHMM(Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30); }
      else tk.start = '09:00';
    }
    const saved = LOStore.addTask({ ...tk, start: tk.start });
    const when = tk.recur
      ? (tk.recur.freq === 'daily' ? 'cada día' : tk.recur.freq === 'weekdays' ? 'entre semana' : 'cada semana')
      : `${fmtDay(saved.date)} a las ${fmt12(saved.start)}`;
    return { reply: `Listo ✅ Agendé "${saved.title}" ${when}. La puedes ver en tu timeline.`, task: saved };
  }
  if (parsed.intent === 'delete') {
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.allTasks().filter(t => !t._deleted && !t._from), parsed.query);
    if (ambiguous) return { reply: 'Hay varias tareas parecidas. Dime el nombre más exacto para no borrar la equivocada.' };
    if (hit) { LOStore.removeTask(hit.id); return { reply: `Eliminé "${hit.title}".` }; }
    return { reply: 'No encontré esa tarea. ¿Cómo se llama exactamente?' };
  }
  if (parsed.intent === 'complete') {
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.tasksForDate(loDateStr()), parsed.query);
    if (ambiguous) return { reply: 'Tengo varias parecidas hoy. ¿Cuál exactamente?' };
    if (hit) { if (hit.status !== 'done') LOStore.toggleTask(hit.id); return { reply: `¡Hecho! Marqué "${hit.title}" como completada. 🎉` }; }
    return { reply: 'No vi esa tarea en tu día de hoy.' };
  }
  if (parsed.intent === 'move') {
    const q = (parsed.query || '').replace(/\b(a\s+las?|hora)\b/g, '').trim();
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.tasksForDate(loDateStr()), q);
    if (ambiguous) return { reply: 'Hay varias parecidas. Dime cuál mover con su nombre exacto.' };
    if (hit && parsed.start) { LOStore.updateTask(hit.id, { start: parsed.start }); return { reply: `Moví "${hit.title}" a las ${fmt12(parsed.start)}.` }; }
    return { reply: 'Dime qué tarea mover y a qué hora — ej: "mueve gym a las 6pm".' };
  }
  return null; // help / unknown handled by caller
}
