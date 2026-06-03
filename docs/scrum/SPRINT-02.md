# Sprint 2 — LifeOS · "Reparar lo que finge funcionar"

> Generado con `/scrum`. Toma precedencia sobre el Sprint 1 (deuda/base): estos son **defectos confirmados que ya golpearon el uso real** (la polola perdió una tarea por el bug de fecha).
> Ver detalle y evidencia en `docs/scrum/BUG-MAP.md`.
> **Estado:** 📋 planificado — esperando OK del Scrum Master (Tomás) para ejecutar.

## Sprint Goal
Que cada cosa que la app dice que hace, la haga de verdad: sin botones-placebo, sin datos que se pierden, sin tareas que caen el día equivocado.

## Qué se entrega (bugs 🔴 del mapa)
- **B14** — off-by-one de fecha (guardar fecha absoluta, no offset relativo) ⭐ prioridad
- **B1** — checklist editable en Create
- **B2** — Create guarda Recordatorio y Repetir
- **B3** — editar/togglear tarea recurrente deja de ser no-op (materializar ocurrencia)
- **B4** — Focus Mode ✓ completa la tarea
- **B5** — eliminar el toggle de Notificaciones falso (usar el real)
- **B6** — quitar `<button>` dentro de `<button>` en SettingsRow
- **B7** — Stats: quitar/realizar los datos falsos (tiempo por categoría + insight)
- **B13** — IDs con `loUid()` en los 3 puntos

> Fuera de este sprint (van al Sprint 3): B8 botones muertos, B9 WeekScreen, B10 rutinas que pisan, B11 cadencia/editar hábito, B12 inbox, B15 durationMin, B16 editar en Detail.

## Cómo (tareas ≤1 día)
- [ ] T1 · **B14**: en CreateScreen, al elegir día guardar `pickedDate` (string `YYYY-MM-DD`) en estado; el guardado usa esa fecha, no `new Date()+dateOffset`
- [ ] T2 · **B1**: `<input>` por paso enlazado por id + "Añadir paso" con `label:''` y autofocus
- [ ] T3 · **B2**: incluir `reminder` y `recur` en el objeto guardado (`screens.jsx:779`)
- [ ] T4 · **B13**: `loUid()` en `screens.jsx:742, 768, 903`
- [ ] T5 · **B3**: `updateTask` y `toggleSubtask` materializan ocurrencia `base@fecha` (patrón de `toggleTask`)
- [ ] T6 · **B4**: pasar `onComplete` a `FocusMode`; ✓ completa+cierra; timer a 0 dispara toast/onComplete
- [ ] T7 · **B5**: borrar `NotifSettingsRow` duplicado de `screens.jsx:2056-2077`
- [ ] T8 · **B6**: arreglar anidamiento de botones en SettingsRow
- [ ] T9 · **B7**: quitar (o calcular real) "En qué se va tu tiempo" y el insight "viernes +23%"
- [ ] T10 · `node check.js` + `python3 rebuild.py` + `node smoke.js` + nota de sesión

## Definición de Terminado
- [ ] `node check.js` OK · [ ] `rebuild.py` corrido · [ ] verificado en runtime (re-test del flujo que fallaba)
- [ ] sin warnings de consola nuevos · [ ] respeta Disciplina de código (CLAUDE.md)

## Verificación específica (el Scrum Master revisa esto)
- Crear tarea para el día 8 cruzando medianoche → cae en el día 8. ✅/❌
- Crear con 2 pasos nombrados + Recordatorio + Repetir → se guardan y persisten tras recargar. ✅/❌
- Editar +30min y prioridad de una tarea recurrente → tiene efecto. ✅/❌
- Focus ✓ → tarea queda `done`. ✅/❌
- Toggle Notificaciones → pide permiso del navegador. ✅/❌
- Consola limpia al abrir Ajustes. ✅/❌

## Retro (al cierre)
- ¿Se cumplió el Sprint Goal? ¿Qué bugs quedaron "Terminados" según DoD?
