// The planner by phrases: what it understands, and that its replies are true.
import { expect, test } from 'vitest';
import { loGuessIconColor } from '../../src/domain/categories';
import { loDayLabel, loExecuteCommand, loParseCommand, loRecurLabel } from '../../src/domain/nlp';
import { LOStore } from '../../src/domain/store';
import { at, freshWorld } from './helpers';

const TUE = '2026-09-29';
const NOW = at(2026, 9, 29, 10, 0); // Tuesday 10:00

const say = (text: string) => loExecuteCommand(loParseCommand(text));
const create = (text: string) => {
  const parsed = loParseCommand(text);
  if (parsed.intent !== 'create') throw new Error(`"${text}" → ${parsed.intent}`);
  return parsed.task;
};

test('hours: afternoon by default, parts of the day, words', () => {
  freshWorld(NOW);
  expect(create('dentista a las 4').start).toBe('16:00');
  expect(create('gym a las 6').start).toBe('06:00');
  expect(create('gym 5am').start).toBe('05:00');
  expect(create('cena a las 8 de la noche').start).toBe('20:00');
  expect(create('desayuno a las 7 de la mañana').start).toBe('07:00');
  expect(create('fiesta a las 12 de la noche').start).toBe('00:00');
  expect(create('reunión a las tres y media').start).toBe('15:30');
  expect(create('almuerzo al mediodía')).toMatchObject({ title: 'Almuerzo', start: '12:00' });
  expect(create('llamar a Ana mañana por la tarde')).toMatchObject({ title: 'Llamar a Ana', date: '2026-09-30', start: '15:00' });
  expect(create('estudiar mañana por la mañana')).toMatchObject({ title: 'Estudiar', date: '2026-09-30', start: '09:00' });
  expect(create('correr por la mañana')).toMatchObject({ title: 'Correr', date: TUE, start: '09:00' });
});

test('an amount of money or a plain number is not an hour', () => {
  freshWorld(NOW);
  expect(create('pagar 15.000 de luz')).toMatchObject({ title: 'Pagar 15.000 de luz', start: null });
  expect(create('comprar 2 entradas')).toMatchObject({ title: 'Comprar 2 entradas', start: null });
  expect(create('leer capítulo 12')).toMatchObject({ title: 'Leer capítulo 12', start: null });
});

test('dates: numeric, relative and already gone this year', () => {
  freshWorld(NOW);
  expect(create('pagar cuenta 15/11').date).toBe('2026-11-15');
  expect(create('viaje el 15 de enero').date).toBe('2027-01-15');
  expect(create('control en 3 días').date).toBe('2026-10-02');
  expect(create('entrega la próxima semana').date).toBe('2026-10-06');
  expect(create('asado el fin de semana').date).toBe('2026-10-03');
  expect(create('pagar arriendo el 31').date).toBe('2026-10-31'); // September has 30 days
  expect(create('empezar en 20 minutos')).toMatchObject({ title: 'Empezar', date: TUE, start: '10:20' });
  expect(loParseCommand('dentista el 31 de febrero')).toMatchObject({ intent: 'unknown', reason: 'date' });
  expect(say('dentista el 31 de febrero').reply).toMatch(/no existe/);
  expect(LOStore.allTasks()).toEqual([]);
});

test('lengths are not read twice', () => {
  freshWorld(NOW);
  expect(create('reunión 19h')).toMatchObject({ start: '19:00', durationMin: 30 });
  expect(create('película 2h30 mañana 9pm')).toMatchObject({ title: 'Película', start: '21:00', durationMin: 150 });
  expect(create('estudiar 1 hora y 15 minutos').durationMin).toBe(75);
  expect(create('deep work 2 horas y media').durationMin).toBe(150);
  expect(create('siesta durante 20 min')).toMatchObject({ title: 'Siesta', durationMin: 20 });
});

test('repetition: several days, weekends, "los martes"', () => {
  freshWorld(NOW);
  expect(create('yoga lunes, miércoles y viernes 7am')).toMatchObject({ title: 'Yoga', recur: { freq: 'weekly', days: [1, 3, 5] } });
  expect(create('inglés los martes y jueves 6pm')).toMatchObject({ title: 'Inglés', recur: { freq: 'weekly', days: [2, 4] }, start: '18:00' });
  expect(create('correr los fines de semana 9am').recur).toEqual({ freq: 'weekly', days: [0, 6] });
  expect(create('reunión el martes 10am').recur).toBeNull();
  expect(create('regar plantas todo el día mañana')).toMatchObject({ title: 'Regar plantas', allDay: true, start: null });
});

test('the title keeps its own words', () => {
  freshWorld(NOW);
  expect(create('La cena con Ana mañana 9pm').title).toBe('La cena con Ana');
  expect(create('tengo que estudiar para la prueba el jueves 4pm').title).toBe('Estudiar para la prueba');
  expect(create('comprar lo que quiero mañana').title).toBe('Comprar lo que quiero');
  expect(create('recuérdame que llame al banco mañana 9am')).toMatchObject({ title: 'Llame al banco', reminder: true });
  expect(create('ESTUDIAR CÁLCULO mañana').title).toBe('ESTUDIAR CÁLCULO');
});

test('icons are guessed from word stems', () => {
  expect(loGuessIconColor('Estudiar cálculo').icon).toBe('📚');
  expect(loGuessIconColor('Entrenar piernas').icon).toBe('💪');
  expect(loGuessIconColor('Comprar pan').icon).toBe('🛒');
  expect(loGuessIconColor('Desayunar con Ana').icon).toBe('🍽️');
  expect(loGuessIconColor('Calle Larga 123').icon).toBe('✨'); // "call" is not "calle"
});

test('small talk and questions never become tasks', () => {
  freshWorld(NOW);
  for (const text of ['hola', 'Hola!', 'buenas tardes', 'gracias', 'muchas gracias!', 'ok', '¿por qué el cielo es azul?', 'agéndame', '7am', '']) {
    expect(loParseCommand(text).intent, text).not.toBe('create');
    say(text);
  }
  expect(LOStore.allTasks()).toEqual([]);
  expect(say('asdf?').reply).toMatch(/No entendí/);
  expect(say('ayuda').reply).toMatch(/gym mañana 7am/);
});

test('"¿qué tengo…?" lists the day', () => {
  freshWorld(NOW);
  expect(say('¿qué tengo hoy?')).toEqual({ reply: 'No tienes nada agendado hoy.' });
  LOStore.addTask({ title: 'Gym', date: TUE, start: '07:00', status: 'done' });
  LOStore.addTask({ title: 'Dentista', date: TUE, start: '16:00' });
  const answer = say('qué tengo hoy');
  expect(answer.reply).toBe('Tienes 2 tareas hoy, 1 por hacer:');
  expect(answer.tasks!.map((t) => t.title)).toEqual(['Gym', 'Dentista']);
  expect(say('qué hay mañana').reply).toBe('No tienes nada agendado mañana.');
});

test('the reply says exactly what was saved, and warns about a clash', () => {
  freshWorld(NOW);
  expect(say('gym mañana 7am 1h').reply).toBe('Listo. Agendé "Gym" mañana a las 7:00 AM (1 h).');
  expect(say('leer cada día 10pm').reply).toBe('Listo. Agendé "Leer" cada día, a las 10:00 PM (30 min).');
  expect(say('inglés los martes y jueves 6pm').reply).toBe('Listo. Agendé "Inglés" cada martes y jueves, a las 6:00 PM (30 min).');
  expect(say('desayuno mañana 7:30').reply).toBe('Listo. Agendé "Desayuno" mañana a las 7:30 AM (30 min). Ojo: se cruza con "Gym".');
  expect(say('feriado el viernes todo el día').reply).toBe('Listo. Agendé "Feriado" el viernes 2 de octubre todo el día.');
});

test('an infinitive is a to-do unless it names an existing task', () => {
  freshWorld(NOW);
  expect(loParseCommand('mover muebles mañana 10am').intent).toBe('create');
  expect(loParseCommand('cancelar la suscripción de netflix').intent).toBe('create');
  expect(loParseCommand('borrar la tarea de gym').intent).toBe('delete');
  LOStore.addTask({ title: 'Reunión', date: TUE, start: '12:00' });
  expect(loParseCommand('mover reunión a las 15:30')).toMatchObject({ intent: 'move', query: 'reunión', start: '15:30' });
  expect(say('mover reunión a las 15:30').reply).toBe('Moví "Reunión" a las 3:30 PM.');
  expect(LOStore.tasksForDate(TUE)[0].start).toBe('15:30');
});

test('moving to another day, completing twice, and commands that look like tasks', () => {
  freshWorld(NOW);
  LOStore.addTask({ id: 'g', title: 'Gym', date: TUE, start: '18:00' });
  expect(say('mueve gym a mañana').reply).toBe('Moví "Gym" para mañana.');
  expect(LOStore.getTask('g')).toMatchObject({ date: '2026-09-30', start: '18:00' });
  expect(say('mueve gym a hoy a las 7pm').reply).toBe('Moví "Gym" para hoy a las 7:00 PM.');
  expect(say('completa gym').reply).toBe('Hecho. Marqué "Gym" como completada.');
  expect(say('ya hice gym').reply).toBe('"Gym" ya estaba completada.');
  expect(LOStore.getTask('g')!.status).toBe('done');
  expect(say('reprograma gym').reply).toMatch(/a qué hora o día/);
  expect(loParseCommand('pasa a buscar a Ana a las 5pm')).toMatchObject({ intent: 'create', task: { title: 'Pasa a buscar a Ana', start: '17:00' } });
});

test('deleting by phrase can be undone', () => {
  const world = freshWorld(NOW);
  LOStore.addTask({ id: 'g', title: 'Gym', date: TUE, recur: { freq: 'daily' } });
  LOStore.toggleTask(`g@${TUE}`);
  const before = world.dump();
  const result = say('borra gym');
  expect(result.reply).toBe('Eliminé "Gym" y todas sus repeticiones.');
  expect(LOStore.allTasks()).toEqual([]);
  LOStore.restore(result.undo!);
  expect(world.dump()).toEqual(before);
});

test('labels', () => {
  freshWorld(NOW);
  expect(loDayLabel(TUE)).toBe('hoy');
  expect(loDayLabel('2026-09-28')).toBe('ayer');
  expect(loDayLabel('2027-01-15')).toBe('el viernes 15 de enero de 2027');
  expect(loRecurLabel(null)).toBe('no se repite');
  expect(loRecurLabel({ freq: 'weekdays' })).toBe('de lunes a viernes');
  expect(loRecurLabel({ freq: 'weekly' }, TUE)).toBe('cada martes');
  expect(loRecurLabel({ freq: 'weekly', days: [0, 1, 6] })).toBe('cada lunes, sábado y domingo');
  expect(loRecurLabel({ freq: 'weekly', days: [0, 6] })).toBe('los fines de semana');
});
