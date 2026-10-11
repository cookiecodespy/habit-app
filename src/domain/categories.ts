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

// Icon + colour guessed from the task wording.
const LO_ICON_RULES: Array<[RegExp, string, string]> = [
  [/\b(gym|gimnasio|entren|ejercicio|pesas|crossfit|deporte|workout|correr|running|trotar)\b/, '💪', 'coral'],
  [/\b(yoga|estir|medita|respira|mindful)\b/, '🧘', 'lavender'],
  [/\b(camin|paseo|pasear|caminata)\b/, '🏃', 'lime'],
  [/\b(estudi|leer|lectura|libro|clase|tarea|examen|prueba|universidad|repasar|ingl[eé]s)\b/, '📚', 'plum'],
  [/\b(reuni[oó]n|meeting|junta|zoom|call|llamada|videollamada|sync|standup|entrevista)\b/, '📊', 'sky'],
  [/\b(llamar|telefon|tel[eé]fono)\b/, '📞', 'teal'],
  [/\b(almuerzo|almorzar|comer|comida|cena|cenar|desayun|brunch|restaurant)\b/, '🍽️', 'sun'],
  [/\b(caf[eé]|coffee|espresso)\b/, '☕', 'ember'],
  [/\b(compr|super|mercado|tienda|mall)\b/, '🛒', 'coral'],
  [/\b(dormir|sue[nñ]o|acostar|noche|descansar)\b/, '😴', 'lavender'],
  [/\b(trabaj|deep work|foco|proyecto|c[oó]digo|programar|dise[nñ]ar|oficina)\b/, '💼', 'slate'],
  [/\b(ducha|ba[nñ]o|ducharme)\b/, '🚿', 'sky'],
  [/\b(doctor|dentista|m[eé]dico|cita|salud|pastilla|remedio|medicamento)\b/, '💊', 'rose'],
  [/\b(bici|bicicleta|andar)\b/, '🚴', 'mint'],
  [/\b(journal|diario|escribir|anotar|nota)\b/, '✏️', 'rose'],
  [/\b(planear|planificar|organizar|revisar|review)\b/, '✨', 'lavender'],
];

export function loGuessIconColor(title: string): { icon: string; color: string } {
  const t = loStrip(title);
  for (const [re, icon, color] of LO_ICON_RULES) if (re.test(t)) return { icon, color };
  return { icon: '✨', color: 'mint' };
}
