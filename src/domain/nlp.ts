// nlp.ts — the offline planner: turns a Spanish phrase into an action on the store.
// It is a rule-based parser with a limited grammar, not a language model. Whatever it does
// not understand it says so; it never claims an action it did not perform.
//
// How a phrase is read: every recognised piece (repetition, hour, part of the day, date,
// length) is located in an accent-free copy of the text and blanked out, so no word is read
// twice ("19h" is an hour, not also a 19-hour length). What is left is the title.

import { now } from './clock';
import { loGuessIconColor, loStrip } from './categories';
import { type DateStr, type TimeStr, fmt12, loAddDays, loDateStr, loDow, loHHMMtoMin, loMinToHHMM } from './dates';
import { LOStore, type StoreSnapshot } from './store';
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
  allDay?: boolean;
}

export type ParsedCommand =
  | { intent: 'create'; task: DraftTask; meta: { hadDate: boolean; hadTime: boolean; dayLabel: string | null; timeLabel: string | null } }
  | { intent: 'delete' | 'complete'; query: string }
  | { intent: 'move'; query: string; start: TimeStr | null; date?: DateStr | null }
  | { intent: 'agenda'; date: DateStr }
  | { intent: 'chat'; kind: 'greeting' | 'thanks' }
  | { intent: 'help' }
  | { intent: 'unknown'; raw: string; reason?: 'date' };

export interface CommandResult {
  reply: string;
  /** The task that was created or changed. */
  task?: Task;
  /** Tasks listed in the reply (answer to "¿qué tengo hoy?"). */
  tasks?: Task[];
  /** The data as it was before a destructive action, so the caller can offer to undo it. */
  undo?: StoreSnapshot;
}

const DOW = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DOW_LABELS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOW_RE = '(?:domingo|lunes|martes|miercoles|jueves|viernes|sabado)(?:s|es)?';
const MONTH_RE = '(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)';
const HOUR_WORDS: Record<string, number> = {
  una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
};
const COUNT_WORDS: Record<string, number> = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 };

type DayPart = 'manana' | 'tarde' | 'noche' | 'madrugada';
/** Hour used when a phrase names a part of the day but no hour ("esta tarde"). */
const DAY_PART_START: Record<DayPart, TimeStr> = { madrugada: '05:00', manana: '09:00', tarde: '15:00', noche: '20:00' };

const dowIndex = (word: string): number => DOW.findIndex((d) => word.startsWith(d));
const hhmm = (h: number, m: number): TimeStr => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// The text being read. `rest` is the accent-free text with every recognised piece replaced
// by spaces, so positions keep matching the original.
class Scan {
  rest: string;
  readonly spans: Array<[number, number]> = [];

  constructor(readonly low: string) { this.rest = low; }

  take(re: RegExp): RegExpExecArray | null {
    const m = re.exec(this.rest);
    if (!m || !m[0].trim()) return null;
    this.consume(m.index, m[0].length);
    return m;
  }

  consume(index: number, length: number): void {
    this.spans.push([index, index + length]);
    this.rest = this.rest.slice(0, index) + ' '.repeat(length) + this.rest.slice(index + length);
  }
}

// ── repetition ───────────────────────────────────────────────
function scanRecur(scan: Scan): { recur: Recur; matched: string } | null {
  if (scan.take(/\b(?:entre\s+semana|(?:los\s+)?dias?\s+(?:de\s+semana|habiles)|(?:de\s+)?lunes\s+a\s+viernes)\b/)) {
    return { recur: { freq: 'weekdays' }, matched: 'entre semana' };
  }
  if (scan.take(/\b(?:cada\s+dia|todos\s+los\s+dias|diariamente|a\s+diario)\b/)) {
    return { recur: { freq: 'daily' }, matched: 'cada día' };
  }
  if (scan.take(/\b(?:(?:los|todos\s+los)\s+fines\s+de\s+semana|cada\s+fin\s+de\s+semana)\b/)) {
    return { recur: { freq: 'weekly', days: [0, 6] }, matched: 'fines de semana' };
  }
  // "cada lunes", "los martes y jueves", "lunes, miércoles y viernes" (a list of days repeats).
  const sep = '(?:\\s*,\\s*(?:y\\s+)?|\\s+y\\s+|\\s+e\\s+)';
  const list = scan.take(new RegExp(`\\b(?:(?:cada|todos\\s+los|los)\\s+${DOW_RE}(?:${sep}${DOW_RE})*|${DOW_RE}(?:${sep}${DOW_RE})+)\\b`));
  if (list) {
    const days = [...new Set((list[0].match(new RegExp(DOW_RE, 'g')) || []).map(dowIndex))].sort((a, b) => a - b);
    return { recur: { freq: 'weekly', days }, matched: `cada ${days.map((d) => DOW[d]).join(', ')}` };
  }
  if (scan.take(/\b(?:cada\s+semana|todas\s+las\s+semanas|semanalmente)\b/)) {
    return { recur: { freq: 'weekly' }, matched: 'cada semana' };
  }
  return null;
}

// ── hour ─────────────────────────────────────────────────────
interface FoundTime { start: TimeStr; matched: string; part: DayPart | null }

// Scans every number and keeps the first one that carries a real time cue ("a las", am/pm,
// a colon, "y media", a part of the day or 24h "h"), so a length like "20 min" or an amount
// like "15.000" is never mistaken for the hour.
function scanTime(scan: Scan): FoundTime | null {
  const fixed = scan.take(/\b(?:al?\s+)?(mediodia|medianoche)\b/);
  if (fixed) return { start: fixed[1] === 'mediodia' ? '12:00' : '00:00', matched: fixed[0].trim(), part: null };

  const words = Object.keys(HOUR_WORDS).join('|');
  const re = new RegExp(
    `(?<![\\w/.,:])(a\\s+las?\\s+)?(\\d{1,2}|${words})(?:[:.](\\d{2})(?!\\d))?\\s*(a\\.\\s?m\\.?|p\\.\\s?m\\.?|am|pm|hrs|hs|hr|h)?(?![\\w/])`
    + '(?:\\s+y\\s+(media|cuarto))?(?:\\s+(?:de|en|por)\\s+la\\s+(manana|tarde|noche|madrugada))?',
    'g',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(scan.rest))) {
    const las = !!m[1];
    const word = HOUR_WORDS[m[2]];
    if (word && !las) continue; // "dos" alone is a number, not an hour
    let h = word ?? Number(m[2]);
    let min = m[3] ? Number(m[3]) : 0;
    const suffix = (m[4] || '').replace(/[.\s]/g, '');
    const isMer = suffix === 'am' || suffix === 'pm';
    const isH24 = !isMer && !!suffix && h >= 13; // "19h"; a bare "1h" is a length
    const part = (m[6] as DayPart | undefined) || null;
    if (!(las || m[3] || isMer || m[5] || part || isH24)) continue;
    if (!isMer && suffix && !isH24) continue;
    if (m[5] === 'media') min = 30;
    if (m[5] === 'cuarto') min = 15;
    if (h > 23 || min > 59 || (isMer && h > 12)) continue;
    if (suffix === 'pm' && h < 12) h += 12;
    else if (suffix === 'am' && h === 12) h = 0;
    else if (!isMer && !isH24) {
      if ((part === 'tarde' || part === 'noche') && h < 12) h += 12;
      else if (part === 'noche' && h === 12) h = 0;
      // "a las 4" with nothing else is the afternoon: nobody plans the dentist for 4 a.m.
      else if (!part && las && h >= 1 && h <= 5) h += 12;
    }
    scan.consume(m.index, m[0].length);
    return { start: hhmm(h, min), matched: m[0].trim(), part };
  }
  return null;
}

// "esta tarde", "por la mañana", "en la noche": a part of the day without an hour.
function scanDayPart(scan: Scan): { part: DayPart; today: boolean } | null {
  const m = scan.take(/\b(?:(esta)|(?:por|en|a|de)\s+la)\s+(manana|tarde|noche|madrugada)\b/)
    || scan.take(/\b(?:de|por)\s+(noche)\b/);
  return m ? { part: (m[2] || m[1]) as DayPart, today: m[1] === 'esta' } : null;
}

// ── date ─────────────────────────────────────────────────────
interface FoundDate { date: DateStr; matched: string; invalid?: boolean }

function scanDate(scan: Scan, base: Date): FoundDate | null {
  const today = loDateStr(base);
  const todayDow = loDow(today);
  const [year, month1] = today.split('-').map(Number);
  const daysIn = (y: number, m0: number): number => new Date(y, m0 + 1, 0).getDate();
  const iso = (y: number, m0: number, d: number): DateStr => loDateStr(new Date(y, m0, d));

  let m = scan.take(/\bpasado\s+manana\b/);
  if (m) return { date: loAddDays(today, 2), matched: 'pasado mañana' };
  m = scan.take(/\bmanana\b/);
  if (m) return { date: loAddDays(today, 1), matched: 'mañana' };
  m = scan.take(/\bhoy\b/);
  if (m) return { date: today, matched: 'hoy' };

  // "en 3 días", "en una semana"
  m = scan.take(/\b(?:en|dentro\s+de)\s+(\d{1,3}|un|una|dos|tres|cuatro|cinco|seis)\s+(dias?|semanas?)\b/);
  if (m) {
    const n = COUNT_WORDS[m[1]] ?? Number(m[1]);
    return { date: loAddDays(today, m[2].startsWith('sem') ? n * 7 : n), matched: m[0] };
  }
  m = scan.take(/\b(?:la\s+)?(?:proxima\s+semana|semana\s+que\s+viene|semana\s+proxima)\b/);
  if (m) return { date: loAddDays(today, 7), matched: m[0] };
  m = scan.take(/\b(?:(?:el|este)\s+)?fin\s+de\s+semana\b/);
  if (m) return { date: loAddDays(today, ((6 - todayDow + 7) % 7) || 7), matched: m[0] };

  // "15/11", "15/11/2026"
  m = scan.take(/(?<![\w/])(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?![\w/])/);
  if (m) {
    const d = Number(m[1]);
    const m0 = Number(m[2]) - 1;
    let y = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : year;
    if (m0 < 0 || m0 > 11 || d < 1 || d > daysIn(y, m0)) return { date: today, matched: m[0], invalid: true };
    if (!m[3] && iso(y, m0, d) < today) y += 1;
    return { date: iso(y, m0, d), matched: m[0] };
  }

  // "el 5 de junio", "5 de junio de 2027"
  m = scan.take(new RegExp(`\\b(?:el\\s+(?:dia\\s+)?)?(\\d{1,2})\\s+de\\s+(${MONTH_RE})(?:\\s+(?:de|del)\\s+(\\d{4}))?\\b`));
  if (m) {
    const d = Number(m[1]);
    const m0 = MONTHS.findIndex((name) => name.startsWith(m![2].slice(0, 3)));
    let y = m[3] ? Number(m[3]) : year;
    if (d < 1 || d > daysIn(y, m0)) return { date: today, matched: m[0], invalid: true };
    if (!m[3] && iso(y, m0, d) < today) y += 1; // already gone this year → next year
    return { date: iso(y, m0, d), matched: m[0] };
  }

  // a weekday: the next one, never today
  m = scan.take(new RegExp(`\\b(?:(?:el|este|esta)\\s+)?(?:proximo\\s+)?(${DOW_RE})(?:\\s+(?:que\\s+viene|proximo))?\\b`));
  if (m) {
    const delta = ((dowIndex(m[1]) - todayDow + 7) % 7) || 7;
    return { date: loAddDays(today, delta), matched: DOW[dowIndex(m[1])] };
  }

  // "el 5", "el día 20": the next month that has that day
  m = scan.take(/\bel\s+(?:dia\s+)?(\d{1,2})\b/);
  if (m) {
    const d = Number(m[1]);
    if (d < 1 || d > 31) return { date: today, matched: m[0], invalid: true };
    for (let i = 0; i < 12; i++) {
      const m0 = month1 - 1 + i;
      const y = year + Math.floor(m0 / 12);
      const mm = m0 % 12;
      if (d <= daysIn(y, mm) && iso(y, mm, d) >= today) return { date: iso(y, mm, d), matched: m[0] };
    }
  }
  return null;
}

// "en 2 horas", "en 20 minutos": a start relative to now.
function scanRelativeTime(scan: Scan, base: Date): { date: DateStr; start: TimeStr; matched: string } | null {
  const m = scan.take(/\b(?:en|dentro\s+de)\s+(\d{1,3}|un|una|dos|tres|cuatro|cinco|seis|media)\s+(horas?|h|minutos?|mins?)\b/);
  if (!m) return null;
  const hours = m[2].startsWith('h');
  const amount = m[1] === 'media' ? 0.5 : COUNT_WORDS[m[1]] ?? Number(m[1]);
  const when = new Date(base.getTime() + amount * (hours ? 60 : 1) * 60000);
  return { date: loDateStr(when), start: hhmm(when.getHours(), when.getMinutes()), matched: m[0] };
}

// ── length ───────────────────────────────────────────────────
function scanDuration(scan: Scan): { durationMin: number; matched: string } | null {
  const lead = '\\b(?:(?:por|durante)\\s+)?';
  const found = (m: RegExpExecArray | null, minutes: number) => (m && minutes > 0 ? { durationMin: Math.min(1440, Math.round(minutes)), matched: m[0].trim() } : null);
  let m = scan.take(new RegExp(`${lead}(\\d{1,2}|una|dos|tres)\\s*(?:horas?|hrs?|h)\\s+y\\s+media\\b`));
  if (m) return found(m, (COUNT_WORDS[m[1]] ?? Number(m[1])) * 60 + 30);
  m = scan.take(new RegExp(`${lead}hora\\s+y\\s+media\\b`));
  if (m) return found(m, 90);
  m = scan.take(new RegExp(`${lead}(\\d{1,2})\\s*(?:horas?|hrs?|h)\\s*(?:y\\s+|con\\s+)?(\\d{1,2})\\s*(?:minutos?|mins?|m)?\\b`));
  if (m) return found(m, Number(m[1]) * 60 + Number(m[2]));
  m = scan.take(new RegExp(`${lead}media\\s+hora\\b`));
  if (m) return found(m, 30);
  m = scan.take(new RegExp(`${lead}(?:un\\s+)?cuarto\\s+de\\s+hora\\b`));
  if (m) return found(m, 15);
  m = scan.take(new RegExp(`${lead}(\\d{1,2}(?:[.,]5)?|una|dos|tres|cuatro|cinco|seis)\\s*(?:horas?|hrs?|h)\\b`));
  if (m) return found(m, (COUNT_WORDS[m[1]] ?? Number(m[1].replace(',', '.'))) * 60);
  m = scan.take(new RegExp(`${lead}(\\d{1,4})\\s*(?:minutos?|mins?|m)\\b`));
  if (m) return found(m, Number(m[1]));
  return null;
}

// ── title ────────────────────────────────────────────────────
const LEADING_VERBS = /^(?:por\s+favor[\s,]+)?(?:agendame|agendar|agenda|agregame|agregar|agrega|anademe|anadir|anade|anota|apunta|creame|crear|crea|ponme|poner|pon|programame|programar|programa|recuerdame(?:\s+que)?|recordar|nueva\s+tarea|necesito|quiero|tengo\s+que|debo|hay\s+que)\b[\s:,]*/;
const LEADING_GLUE = /^(?:(?:que|una|un|la|el|los|las|mi|de|del|para|tarea|recordatorio)\b[\s:,]*)+/;
// Words left hanging right before a piece that was taken out ("reunión el [lunes]").
const HANGING_GLUE = /(?:^|[\s,;:])(?:a\s+las?|al?|para(?:\s+(?:el|la|los|las))?|el|la|los|las|de|del|en|por|este|esta|desde|hasta|durante|cada|todos\s+los|que\s+sea)\s*$/;
const EDGE_PUNCT = /^[\s,;:.\-–—]+|[\s,;:\-–—]+$/g;

// What is left of the original text once the recognised pieces are removed.
function leftover(raw: string, low: string, spans: Array<[number, number]>): string {
  const keep = (text: string): string[] => {
    const parts: string[] = [];
    let cursor = 0;
    for (const [from, to] of [...spans].sort((a, b) => a[0] - b[0])) {
      if (from > cursor) parts.push(text.slice(cursor, from));
      cursor = Math.max(cursor, to);
    }
    parts.push(text.slice(cursor));
    return parts;
  };
  const original = keep(raw);
  const plain = keep(low);
  // Drop the glue hanging before each removed piece, measuring on the accent-free text.
  for (let i = 0; i < original.length - 1; i++) {
    for (;;) {
      const hang = HANGING_GLUE.exec(plain[i]);
      if (!hang) break;
      plain[i] = plain[i].slice(0, hang.index);
      original[i] = original[i].slice(0, hang.index);
    }
  }
  return original.join(' ').replace(/\s+/g, ' ').replace(/\s+([,;:.])/g, '$1').replace(EDGE_PUNCT, '');
}

function cleanTitle(text: string): string {
  let title = text;
  // Articles are only noise right after a command verb ("pon una alarma"); on their own they
  // belong to the title ("La cena con Ana").
  let afterVerb = false;
  for (let i = 0; i < 4; i++) {
    const low = loStrip(title);
    const verb = LEADING_VERBS.exec(low);
    const m = verb || (afterVerb ? LEADING_GLUE.exec(low) : null);
    if (!m || !m[0]) break;
    afterVerb = afterVerb || !!verb;
    title = title.slice(m[0].length);
  }
  title = title.replace(/\s+(?:y|e|o|,)\s*$/i, '').replace(EDGE_PUNCT, '').trim();
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : '';
}

/** Same text, accent-free and lower-case, guaranteed to have the same length as `raw`. */
function aligned(text: string): { raw: string; low: string } {
  const raw = text.trim().normalize('NFC');
  const low = loStrip(raw);
  return low.length === raw.length ? { raw, low } : { raw: low, low };
}

// ── intent ───────────────────────────────────────────────────
const DELETE_RE = /^(?:por\s+favor[\s,]+)?(borra|elimina|quita|cancela|borrar|eliminar|quitar|cancelar)\b/;
const COMPLETE_RE = /^(?:por\s+favor[\s,]+)?(?:(completa|completar|marca|marcar)\b|ya\s+(?:hice|termine|complete)\b|termine\b|complete\b|list[oa]\s+(?:el|la|lo|con)\b)/;
const MOVE_RE = /^(?:por\s+favor[\s,]+)?(?:(mueve|posterga|reprograma|atrasa|adelanta|mover|postergar|reprogramar)\b|cambia(?:r)?\s+(?:la\s+)?hora\s+(?:de|del|a)\b|pasa\s+(?!a\b|por\b|al\b))/;
const INFINITIVE_RE = /^(?:borrar|eliminar|quitar|cancelar|completar|marcar|mover|postergar|reprogramar)\b/;
const QUERY_GLUE = /^(?:(?:por\s+favor|la|el|los|las|mi|mis|de|del|tarea|tareas|que|como|hora|a)\b[\s,]*)+/;

function commandQuery(raw: string, low: string, verb: RegExp, scan: Scan): string {
  const head = verb.exec(low);
  if (head) scan.consume(head.index, head[0].length);
  scan.take(/\bcomo\s+(?:hech[oa]|list[oa]|completad[oa]|terminad[oa])\b/);
  let query = leftover(raw, low, scan.spans);
  for (let i = 0; i < 3; i++) {
    const glue = QUERY_GLUE.exec(loStrip(query));
    if (!glue || !glue[0]) break;
    query = query.slice(glue[0].length);
  }
  return query.replace(EDGE_PUNCT, '').trim();
}

/** Main entry: what a phrase asks for. Reads the store only to tell "mover muebles" (a to-do) from "mover gym" (a command). */
export function loParseCommand(text: string): ParsedCommand {
  const { raw, low } = aligned(text);
  if (!low) return { intent: 'unknown', raw };
  const base = now();

  if (/^(?:hola|holi|hey|buenas|buen\s+dia|buenos\s+dias|buenas\s+(?:tardes|noches)|que\s+tal)\b[\s!.,¡]*$/.test(low)) return { intent: 'chat', kind: 'greeting' };
  if (/^(?:muchas\s+)?gracias\b|^(?:ok|okay|vale|perfecto|genial|excelente|buenisimo|dale)[\s!.,]*$/.test(low)) return { intent: 'chat', kind: 'thanks' };
  if (/^(?:ayuda|help|\?+|tutorial|ejemplos?)[\s!.?]*$/.test(low) || /\b(?:como\s+(?:funciona|funcionas|se\s+usa|te\s+uso|uso)|que\s+(?:puedes|puedo|sabes)\s+hacer|que\s+haces)\b/.test(low)) return { intent: 'help' };

  // "¿qué tengo mañana?", "qué hay el viernes"
  if (/^¿?\s*(?:que|cuales?|cuantas?)\s+(?:tareas\s+)?(?:tengo|hay|me\s+toca|tareas)\b/.test(low) || /^¿?\s*(?:mi\s+)?agenda\b/.test(low)) {
    const when = scanDate(new Scan(low), base);
    return { intent: 'agenda', date: when && !when.invalid ? when.date : loDateStr(base) };
  }

  // An infinitive ("mover muebles") is how people write a to-do; it is a command only when
  // it clearly names a task that exists.
  const names = (verb: RegExp): boolean => {
    if (/^\w+\s+(?:la\s+|mi\s+|una\s+)?tareas?\b/.test(low)) return true; // "borrar la tarea de gym"
    const found = findUpcoming(commandQuery(raw, low, verb, timeAndDate(new Scan(low), base).scan));
    return !!found.hit || found.ambiguous;
  };
  const asCommand = (verb: RegExp): boolean => verb.test(low) && (!INFINITIVE_RE.test(low) || names(verb));

  if (asCommand(DELETE_RE)) return { intent: 'delete', query: commandQuery(raw, low, DELETE_RE, new Scan(low)) };
  if (asCommand(COMPLETE_RE)) return { intent: 'complete', query: commandQuery(raw, low, COMPLETE_RE, new Scan(low)) };
  if (asCommand(MOVE_RE)) {
    const found = timeAndDate(new Scan(low), base);
    return {
      intent: 'move', query: commandQuery(raw, low, MOVE_RE, found.scan),
      start: found.start, date: found.date && !found.date.invalid && found.hadDate ? found.date.date : null,
    };
  }
  // Any other question is not something to schedule.
  if (/\?\s*$/.test(low) || low.startsWith('¿')) return { intent: 'unknown', raw };

  // Default: create.
  const scan = new Scan(low);
  const recur = scanRecur(scan);
  const allDay = !!scan.take(/\btodo\s+el\s+dia\b/);
  const found = timeAndDate(scan, base);
  const dur = scanDuration(scan);
  if (found.date && found.date.invalid) return { intent: 'unknown', raw, reason: 'date' };

  const title = cleanTitle(leftover(raw, low, scan.spans));
  if (!title) return { intent: 'unknown', raw };

  const ic = loGuessIconColor(title);
  return {
    intent: 'create',
    task: {
      title,
      date: found.date ? found.date.date : loDateStr(base),
      start: allDay ? null : found.start,
      durationMin: dur ? dur.durationMin : 30,
      recur: recur ? recur.recur : null,
      icon: ic.icon, color: ic.color,
      reminder: !!recur || /\brecuerda/.test(low),
      ...(allDay ? { allDay: true } : {}),
    },
    meta: { hadDate: found.hadDate, hadTime: !!found.start, dayLabel: found.hadDate && found.date ? found.date.matched : null, timeLabel: found.start },
  };
}

// The "when" of a phrase: hour, part of the day, relative start and date, in the order that
// keeps "mañana por la mañana" and "a las 5 de la tarde" unambiguous.
function timeAndDate(scan: Scan, base: Date): { scan: Scan; start: TimeStr | null; date: FoundDate | null; hadDate: boolean } {
  const time = scanTime(scan);
  const part = scanDayPart(scan);
  const relative = time ? null : scanRelativeTime(scan, base);
  let date = scanDate(scan, base);
  const hadDate = !!date || !!relative || !!(part && part.today);
  if (!date && relative) date = { date: relative.date, matched: relative.matched };
  if (!date && part && part.today) date = { date: loDateStr(base), matched: 'hoy' };
  let start: TimeStr | null = time ? time.start : relative ? relative.start : null;
  if (time && part && !time.part && loHHMMtoMin(time.start) < 720 && (part.part === 'tarde' || part.part === 'noche')) {
    start = loMinToHHMM(loHHMMtoMin(time.start) + 720); // "a las 8 … por la noche"
  }
  if (!start && part) start = DAY_PART_START[part.part];
  return { scan, start, date, hadDate };
}

// Kept for callers that only need one piece of a phrase.
export function loParseDate(low: string, base: Date = now()): { date: DateStr; matched: string } | null {
  const scan = new Scan(loStrip(low));
  scanDayPart(scan);
  const found = scanDate(scan, base);
  return found && !found.invalid ? { date: found.date, matched: found.matched } : null;
}
export function loParseTime(low: string): { start: TimeStr; matched: string } | null {
  const found = scanTime(new Scan(loStrip(low)));
  return found ? { start: found.start, matched: found.matched } : null;
}
export function loParseDuration(low: string): { durationMin: number; matched: string } | null {
  return scanDuration(new Scan(loStrip(low)));
}
export function loParseRecur(low: string): { recur: Recur; matched: string } | null {
  return scanRecur(new Scan(loStrip(low)));
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

// ── wording of the replies ───────────────────────────────────
const joinY = (items: string[]): string => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`);

/** "hoy", "mañana", "el viernes 16 de octubre". */
export function loDayLabel(date: DateStr): string {
  const today = loDateStr();
  if (date === today) return 'hoy';
  if (date === loAddDays(today, 1)) return 'mañana';
  if (date === loAddDays(today, -1)) return 'ayer';
  const [y, mo, da] = date.split('-').map(Number);
  const label = `el ${DOW_LABELS[loDow(date)]} ${da} de ${MONTHS[mo - 1]}`;
  return y === Number(today.slice(0, 4)) ? label : `${label} de ${y}`;
}

/** "cada día", "de lunes a viernes", "cada martes y jueves". */
export function loRecurLabel(recur: Recur | null | undefined, date?: DateStr): string {
  if (!recur) return 'no se repite';
  if (recur.freq === 'daily') return 'cada día';
  if (recur.freq === 'weekdays') return 'de lunes a viernes';
  const days = recur.days && recur.days.length ? recur.days : date ? [loDow(date)] : [];
  if (!days.length) return 'cada semana';
  if (days.length === 7) return 'cada día';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'los fines de semana';
  const mondayFirst = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return `cada ${joinY(mondayFirst.map((d) => DOW_LABELS[d]))}`;
}

const durationLabel = (min: number): string => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const HELP_REPLY = 'Entiendo frases cortas. Para agendar: "gym mañana 7am 1h", "dentista el viernes a las 4", "leer cada día 10pm". '
  + 'También: "¿qué tengo mañana?", "completa gym", "mueve gym a las 6pm" y "borra gym".';

// Open tasks of the next days that a command can refer to, nearest day first.
function findUpcoming(query: string): { hit: Task | null; ambiguous: boolean } {
  const today = loDateStr();
  let ambiguous = false;
  for (let d = 0; d <= 7; d++) {
    const found = loFindTaskByQuery(LOStore.tasksForDate(loAddDays(today, d)), query);
    if (found.hit) return found;
    ambiguous = ambiguous || found.ambiguous;
    if (ambiguous) break;
  }
  return { hit: null, ambiguous };
}

/** Carry out a parsed phrase and say, truthfully, what happened. */
export function loExecuteCommand(parsed: ParsedCommand): CommandResult {
  if (parsed.intent === 'create') {
    const tk = parsed.task;
    // No explicit time → next free 30-min slot on that day.
    if (!tk.start && !tk.allDay) {
      if (tk.date === loDateStr()) { const n = now(); tk.start = loMinToHHMM(Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30); }
      else tk.start = '09:00';
    }
    const clash = tk.allDay || tk.recur ? undefined : LOStore.tasksForDate(tk.date).find((t) => {
      const s = loHHMMtoMin(t.start);
      const mine = loHHMMtoMin(tk.start);
      return !t.allDay && t.status !== 'done' && mine < s + t.durationMin && mine + tk.durationMin > s;
    });
    const saved = LOStore.addTask({ ...tk, start: tk.start || undefined });
    const hour = saved.allDay ? 'todo el día' : `a las ${fmt12(saved.start)}`;
    const when = saved.recur
      ? `${loRecurLabel(saved.recur, saved.date)}, ${hour}`
      : `${loDayLabel(saved.date)} ${hour}`;
    const length = saved.allDay ? '' : ` (${durationLabel(saved.durationMin)})`;
    const warn = clash ? ` Ojo: se cruza con "${clash.title}".` : '';
    return { reply: `Listo. Agendé "${saved.title}" ${when}${length}.${warn}`, task: saved };
  }
  if (parsed.intent === 'delete') {
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.allTasks().filter(t => !t._deleted && !t._from), parsed.query);
    if (ambiguous) return { reply: 'Hay varias tareas parecidas. Dime el nombre más exacto para no borrar la equivocada.' };
    if (!hit) return { reply: 'No encontré esa tarea. ¿Cómo se llama exactamente?' };
    const undo = LOStore.snapshot();
    LOStore.removeTask(hit.id);
    return { reply: hit.recur ? `Eliminé "${hit.title}" y todas sus repeticiones.` : `Eliminé "${hit.title}".`, undo };
  }
  if (parsed.intent === 'complete') {
    const { hit, ambiguous } = loFindTaskByQuery(LOStore.tasksForDate(loDateStr()), parsed.query);
    if (ambiguous) return { reply: 'Tengo varias parecidas hoy. ¿Cuál exactamente?' };
    if (!hit) return { reply: 'No vi esa tarea en tu día de hoy.' };
    if (hit.status === 'done') return { reply: `"${hit.title}" ya estaba completada.` };
    LOStore.toggleTask(hit.id);
    return { reply: `Hecho. Marqué "${hit.title}" como completada.` };
  }
  if (parsed.intent === 'move') {
    if (!parsed.start && !parsed.date) return { reply: 'Dime qué tarea mover y a qué hora o día. Por ejemplo: "mueve gym a las 6pm".' };
    const { hit, ambiguous } = findUpcoming(parsed.query);
    if (ambiguous) return { reply: 'Hay varias parecidas. Dime cuál mover con su nombre exacto.' };
    if (!hit) return { reply: 'No encontré esa tarea en los próximos días.' };
    const patch: { start?: TimeStr; date?: DateStr } = {};
    if (parsed.start) patch.start = parsed.start;
    if (parsed.date) patch.date = parsed.date;
    const saved = LOStore.updateTask(hit.id, patch);
    const where = [parsed.date ? loDayLabel(parsed.date) : '', parsed.start ? `a las ${fmt12(parsed.start)}` : ''].filter(Boolean).join(' ');
    return { reply: `Moví "${hit.title}" ${parsed.date ? 'para ' : ''}${where}.`, task: saved };
  }
  if (parsed.intent === 'agenda') {
    const tasks = LOStore.tasksForDate(parsed.date);
    const day = loDayLabel(parsed.date);
    if (!tasks.length) return { reply: `No tienes nada agendado ${day}.` };
    const open = tasks.filter((t) => t.status !== 'done').length;
    const count = `${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'}`;
    return { reply: `Tienes ${count} ${day}${open < tasks.length ? `, ${open} por hacer` : ''}:`, tasks };
  }
  if (parsed.intent === 'chat') {
    return { reply: parsed.kind === 'greeting' ? 'Hola. Dime qué quieres agendar, por ejemplo "gym mañana 7am 1h".' : 'De nada.' };
  }
  if (parsed.intent === 'help') return { reply: HELP_REPLY };
  if (parsed.intent === 'unknown' && parsed.reason === 'date') return { reply: 'Esa fecha no existe. Dímela de nuevo, por ejemplo "el 28 de febrero".' };
  return { reply: `No entendí eso. ${HELP_REPLY}` };
}
