# Sprint 1 — LifeOS

> Generado con `/scrum` (Semana 2.3). Sprint corto (recomendado ≤1 semana para este proyecto).
> **Inicio:** 2026-05-29 · **Estado:** 📋 planificado (esperando OK del PO para arrancar)

## Sprint Goal (por qué este sprint es valioso)
Eliminar todo lo que **finge funcionar** y dejar la base de datos lista para el sync de pareja —
sin esto, EPIC 2 nace roto. Es lo más barato y de mayor impacto del backlog.

## Qué se entrega (ítems seleccionados del backlog)
- 🔴 **HU-01** — IDs robustos (`loUid()`)
- 🔴 **HU-02** — proteger `updatedAt`
- 🟡 **HU-03** — avisar si falla el guardado + sanear migración legacy
- 🟡 **HU-04** — `lo-ai.js` en `/deploy/` + limpiar IA muerta
- 🟡 **HU-05** — vista semana con datos reales

> Fuera del sprint (siguiente): HU-06 drag&drop (es L, merece su propio sprint).

## Cómo (plan — tareas de ≤1 día)
- [ ] T1 · `loUid()` en `lifeos-screens.jsx:742, 768, 903`
- [ ] T2 · `updatedAt = updatedAt || Date.now()` en `lifeos-data.jsx:208`
- [ ] T3 · manejo de QuotaExceeded + toast en `loWrite()`
- [ ] T4 · filtrar items corruptos en migración legacy (`:575`)
- [ ] T5 · copiar `lo-ai.js` a `/deploy/` y verificar carga
- [ ] T6 · conectar o borrar `classifyCapture`/`suggestPriority`/`getDailyInsight`
- [ ] T7 · `WeekScreen` consume `LOStore.tasksForDate()` (quitar demo)
- [ ] T8 · `check.js` + `rebuild.py` + smoke + nota de sesión

## Definición de Terminado (aplica a cada tarea)
- [ ] `node check.js` OK · [ ] `python3 rebuild.py` corrido · [ ] verificado headless
- [ ] no rompe lo anterior · [ ] respeta Disciplina de código

## Daily (bitácora, ≤15 min)
- _2026-05-29:_ Sprint planificado. Pendiente OK del PO para iniciar T1.

## Para la Review/Retro al cierre
- ¿Se cumplió el Sprint Goal? ¿Qué quedó "Terminado" según DoD?
- Retro: qué salió bien / mal / mejora para el Sprint 2 (probablemente HU-06 drag&drop).
