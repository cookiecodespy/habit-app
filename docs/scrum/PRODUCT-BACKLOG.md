# Product Backlog — LifeOS

> Generado con la skill `/scrum` (método curso INGEC005, Semana 2.2: historias de usuario + tareas).
> **Objetivo del Producto:** un planner+hábitos para Tomás y su polola que iguale el núcleo de
> Structured y le gane donde Structured no quiere competir: **hábitos reales, modo pareja y sync**.
> **PO:** Tomás · **Scrum Master + Developers:** Claude Code + Tomás.
> Orden = prioridad. 🔴 bloqueante · 🟡 importante · 🟢 después.

## Definición de Terminado (DoD) del proyecto
- [ ] `node check.js` OK (syntax-check de los 9 src)
- [ ] `python3 rebuild.py` ejecutado (src → index.html)
- [ ] Verificado corriendo (headless `smoke.js`/`flow.js` o navegador)
- [ ] No rompe features previas · respeta la Disciplina de código del CLAUDE.md
- [ ] Nota de sesión en `docs/session/` (regla del repo)

---

## EPIC B — Bugs de interacción confirmados (auditoría runtime 2026-05-30) 🔴
Defectos verificados en vivo que las auditorías previas dieron por "✅ completos".
**Detalle, evidencia y fixes en `docs/scrum/BUG-MAP.md`.** Sprint 2 ataca los 🔴 (B1-B7, B13, B14).
Incluye el bug que la polola encontró: **B14 — tareas que caen +1 día al cruzar medianoche**.

## EPIC 0 — Tapar lo que finge funcionar (deuda + base para sync) 🔴
Lo barato y de alto impacto. La mayoría es Sprint 1.

### HU-01: IDs robustos para no romper el sync futuro 🔴
**Como** dueño que sincronizará entre su teléfono y el de su polola, **quiero** que cada tarea/subtarea tenga un ID único de verdad **para** que no colisionen al sincronizar.
Estimación: S
Tareas:
- [ ] Reemplazar `Date.now()` por `loUid()` en `lifeos-screens.jsx:742, 768, 903`
- [ ] Que la creación de IDs viva en `LOStore` (no en la UI)
Aceptación: crear 2 tareas en el mismo ms produce IDs distintos.

### HU-02: No perder metadata de edición 🔴
**Como** futuro usuario de sync, **quiero** que `updatedAt` refleje la edición real **para** que la resolución de conflictos funcione.
Estimación: S
Tareas:
- [ ] `lifeos-data.jsx:208` → `t.updatedAt = t.updatedAt || Date.now()`
Aceptación: leer datos del store no cambia `updatedAt`.

### HU-03: Avisar si no se pueden guardar los datos 🟡
**Como** usuario, **quiero** que la app me avise si el almacenamiento falla **para** no perder cambios en silencio.
Estimación: S
Tareas:
- [ ] En `loWrite()` (`lifeos-data.jsx:150`) capturar QuotaExceeded y emitir toast "No hay espacio"
- [ ] Validar/filtrar items corruptos en migración legacy (`lifeos-data.jsx:575`)

### HU-04: La IA no debe desaparecer en producción 🟡
**Como** usuario de la versión desplegada, **quiero** que la IA local siga existiendo **para** no perder la función al subir a Cloudflare.
Estimación: S
Tareas:
- [ ] Incluir `lo-ai.js` en `/deploy/`
- [ ] Conectar funciones muertas o eliminarlas: `classifyCapture`, `suggestPriority`, `getDailyInsight`

### HU-05: Vista semana con datos reales 🟡
**Como** usuario, **quiero** ver mi semana real (no una demo) **para** confiar en lo que muestra.
Estimación: M
Tareas:
- [ ] Conectar `WeekScreen` (`lifeos-screens.jsx:265`) a `LOStore.tasksForDate()`
- [ ] Quitar datos hardcodeados; respetar tema/densidad
Aceptación: las tareas reales del usuario aparecen en su día/hora.

---

## EPIC 1 — Núcleo timeline al nivel Structured 🔴
Lo que más se siente "como Structured".

### HU-06: Arrastrar tareas en la timeline 🔴
**Como** usuario, **quiero** arrastrar una tarea para moverla de hora o cambiar su duración **para** reorganizar mi día rápido.
Estimación: L
Tareas:
- [ ] Drag para mover bloque (cambiar `start`)
- [ ] Arrastrar borde para cambiar `durationMin`
- [ ] Drag desde Inbox → timeline (reemplazar botón "Agendar")
Aceptación: mover una tarjeta actualiza la hora en el store y persiste.

### HU-07: Tres tipos de tarea claros 🟡
**Como** usuario, **quiero** tareas con hora, todo-el-día e inbox (sin hora) **para** capturar cualquier cosa.
Estimación: M
Tareas:
- [ ] Soporte explícito all-day en store y timeline
- [ ] UI para elegir el tipo al crear

### HU-08: Deadlines de verdad 🟢
**Como** usuario, **quiero** marcar y ver fechas límite **para** no atrasarme.
Estimación: M
Tareas:
- [ ] Resucitar campo `deadline` + UI en CreateScreen/Detail
- [ ] Implementar `DeadlineCard` (hoy es no-op)

---

## EPIC 2 — Modo pareja + sync (el diferenciador imbatible) 🔴
Structured juró NUNCA hacer colaboración. Esta es nuestra ventaja.

### HU-09: Dos cuentas con sus propios datos 🔴
**Como** pareja, **queremos** cada uno su cuenta **para** que nuestros datos no se mezclen.
Estimación: L
Tareas:
- [ ] Versionar keys de localStorage por usuario YA: `lifeos.tasks.${userId}.v2`
- [ ] Auth con [[stack-supabase]] (2 cuentas)

### HU-10: Sync entre dispositivos 🔴
**Como** pareja con varios dispositivos, **queremos** que los cambios se sincronicen **para** ver lo mismo en todos.
Estimación: L
Tareas:
- [ ] Tablas `tasks/habits/inbox` con `user_id` en Supabase
- [ ] Sync con resolución last-write-wins (depende de HU-01/HU-02)

### HU-11: Vista "nuestro día" compartida 🟡
**Como** pareja, **queremos** una vista con las tareas/planes compartidos **para** coordinarnos.
Estimación: L
Tareas:
- [ ] Marcar tareas como compartidas
- [ ] Vista combinada de ambos

---

## EPIC 3 — IA de verdad (superar el regex) 🟡

### HU-12: Crear/editar tareas en lenguaje natural con IA real 🟡
**Como** usuario, **quiero** hablarle a la app en lenguaje libre **para** crear tareas sin pelear con el formato.
Estimación: L
Tareas:
- [ ] Cambiar el parser regex por Claude API (ver skill `claude-api`, con prompt caching)
- [ ] Mantener fallback offline (regex actual)

### HU-13: Escanear un planner con la cámara 🟡
**Como** usuario, **quiero** fotografiar mi agenda de papel **para** convertirla en tareas (el feature estrella de Structured).
Estimación: L
Tareas:
- [ ] `getUserMedia` + captura
- [ ] Claude vision → tareas estructuradas

---

## EPIC 4 — Calendario 🟢

### HU-14: Importar Google Calendar 🟢
**Como** usuario, **quiero** ver mis eventos del calendario en la timeline **para** tener todo junto.
Estimación: L
(Apuntar a two-way sync, el agujero de 3.000 votos de Structured.)

---

## EPIC 5 — Pulido senior 🟡

### HU-15: Sistema de tokens CSS 🟡
**Como** dueño que quiere calidad "20 devs senior", **quiero** tokens de spacing/tipografía/radios/duración **para** eliminar hardcodes y mantener consistencia.
Estimación: M
Tareas:
- [ ] Definir `--sp-*`, `--fs-*`, `--radius-*`, `--dur-*` en `:root`
- [ ] `hexToRgb()` para opacidades de accent (hoy `accent + '22'` se rompe)
- [ ] Estados hover/active/focus consistentes
