// categories.ts — themes for the Agenda filter, and the icon/colour guessed from a title.

import type { CategoryId } from './types';

/** Lower-case and strip accents, for accent-insensitive matching. */
export function loStrip(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  color: string;
  icon: string;
}

/** Fixed taxonomy with a meaning-coded palette colour each. */
export const LO_CATEGORIES: Category[] = [
  { id: 'vida', label: 'Vida', short: 'Vida', color: 'mint', icon: 'heart' },
  { id: 'trabajo', label: 'Trabajo', short: 'Trabajo', color: 'sky', icon: 'briefcase' },
  { id: 'uni', label: 'Universidad', short: 'U', color: 'amber', icon: 'book' },
];

export const LO_CAT_BY_ID = Object.fromEntries(LO_CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

// Guess a theme from the wording so the user rarely has to pick. Order = priority.
const LO_CAT_RULES: Array<[CategoryId, RegExp]> = [
  ['uni', /\b(prueba|examen|certamen|control|clase|ramo|universidad|uni|facultad|profe|profesor|materia|estudiar|estudio|tarea|ensayo|laboratorio|ayudant|calculo|algebra|quimica|fisica|programacion|paradigmas|semestre|nota|notas|disertacion|trabajo grupal)\b/],
  ['trabajo', /\b(reunion|junta|trabajo|pega|jefe|jefa|cliente|oficina|turno|informe|deadline|entrega|proyecto|correo|email|presentacion|factura|sueldo|nomina|reunirme|llamada laboral|standup|sprint)\b/],
  ['vida', /\b(gym|gimnasio|comida|almuerzo|cena|desayuno|medico|doctor|dentista|polola|pololo|novia|familia|casa|super|mercado|compras|ducha|dormir|descansar|cumpleanos|cita|amig|cine|salir|vacaciones|viaje|mascota|perro|gato)\b/],
];

export function loGuessCategory(text: string | null | undefined): CategoryId | null {
  const low = loStrip(String(text || ''));
  for (const [id, re] of LO_CAT_RULES) if (re.test(low)) return id;
  return null;
}

// Icon + colour guessed from the task wording (matched on the accent-free title). Each
// alternative is the start of a word, so "estudi" also covers "estudiar" and "estudio"; short
// words that are not stems end in \b so "call" does not match "calle".
const LO_ICON_RULES: Array<[RegExp, string, string]> = [
  [/\b(?:gym\b|gimnasio|entren|ejercicio|pesas|crossfit|deporte|workout|correr\b|running|trot)/, '💪', 'coral'],
  [/\b(?:yoga|estir|medit|respira|mindful)/, '🧘', 'lavender'],
  [/\b(?:camin|pase(?:o|ar))/, '🏃', 'lime'],
  [/\b(?:estudi|leer\b|lectura|libro|clase|tarea|examen|prueba|universidad|repas|ingles)/, '📚', 'plum'],
  [/\b(?:reunion|meeting|junta\b|zoom|call\b|llamada|videollamada|sync\b|standup|entrevista)/, '📊', 'sky'],
  [/\b(?:llamar|telefon)/, '📞', 'teal'],
  [/\b(?:almuerzo|almorzar|comer\b|comida|cena|desayun|brunch|restaurant)/, '🍽️', 'sun'],
  [/\b(?:cafe\b|coffee|espresso)/, '☕', 'ember'],
  [/\b(?:compr|super\b|supermercado|mercado|tienda|mall\b)/, '🛒', 'coral'],
  [/\b(?:dormir|sueno|acostar|noche|descans|siesta)/, '😴', 'lavender'],
  [/\b(?:trabaj|deep work|foco\b|proyecto|codigo|program|disen|oficina)/, '💼', 'slate'],
  [/\b(?:ducha|bano\b|duchar)/, '🚿', 'sky'],
  [/\b(?:doctor|dentista|medic|cita\b|salud|pastilla|remedio)/, '💊', 'rose'],
  [/\b(?:bici|andar\b)/, '🚴', 'mint'],
  [/\b(?:journal|diario|escrib|anotar|nota\b)/, '✏️', 'rose'],
  [/\b(?:plane|planific|organiz|revis|review)/, '✨', 'lavender'],
];

export function loGuessIconColor(title: string): { icon: string; color: string } {
  const t = loStrip(title);
  for (const [re, icon, color] of LO_ICON_RULES) if (re.test(t)) return { icon, color };
  return { icon: '✨', color: 'mint' };
}
