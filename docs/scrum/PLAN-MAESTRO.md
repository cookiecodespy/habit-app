# Plan Maestro — LifeOS / habit-app

> Consolidación de la **auditoría de 5 agentes (2026-05-31)** + roadmap de sprints.
> Método: skill `/agentes` (horda de auditoría) + `/scrum` (INGEC005, Semana 2.2/2.3).
> **Objetivo del Producto:** un planner + hábitos **local-first** que iguale el núcleo de
> Structured y lo **supere** donde Structured no quiere competir: **hábitos reales con heatmap,
> modo pareja/sync entre 2 teléfonos y AI real**.
> **PO:** Tomás · **Scrum Master + Developers:** Tomás + Claude Code.
> Severidad: 🔴 rompe función/engaña/perf · 🟡 importante · 🟢 deuda.

---

## 0. Veredicto consolidado

**El concepto está completo; la ejecución está a medias.** La app cubre casi todo el mapa de
features de Structured (timeline, inbox, subtareas, recurrencia, rutinas, focus, temas, NLP offline,
PWA), pero **los flujos centrales están rotos o son demo**. Hoy NO es "más grande que Structured":
es Structured con los botones desconectados.

| Eje | Nota | Lectura corta |
|---|---|---|
| **Lógica/datos** | ⚠️ frágil | Notificaciones inoperantes, edición de recurrentes = no-op, `updatedAt` se pisa en cada lectura (mata el sync futuro) |
| **Pantallas/botones** | ⚠️ varios placebo | Stats con datos inventados, botones muertos (lupa, chevron, "Aplicar"), Detail no editable |
| **Focus/rutinas/hábitos** | ⚠️ demo | Focus ✓ no completa, CRUD de rutinas inexistente, hábito sin cadencia ni heatmap |
| **Diseño** | **6.3/10** vs Structured | No es AI-slop genérico (acento coral, dark con capas, íconos propios) pero le falta tokens, Fraunces sin usar, cero textura |
| **Plataforma** | 🔴 2 bloqueantes | React **dev build** (1MB) + **Babel transpilando en el teléfono** en cada arranque |

---

## 1. Hallazgos consolidados (deduplicado)

### 🔴 Bloqueantes — rompen función, engañan o matan performance

| ID | Problema | Evidencia | Fix |
|---|---|---|---|
| **B2** | Create **descarta** "Recordatorio" y "Repetir" al guardar | `lifeos-screens.jsx:767-781` | Añadir `reminder`/`recur` al objeto |
| **B3** | **Editar ocurrencia recurrente = no-op silencioso** (id `base@fecha` no existe en store) | `lifeos-data.jsx:246`, `app.jsx:148-150` | Materializar la ocurrencia antes del patch (como hace `toggleTask`) |
| **B4** | **Focus Mode ✓ no completa la tarea** y el timer a 0 no hace nada | `lifeos-extras.jsx:114`; `app.jsx:184,559` sin `onComplete` | Pasar `onComplete`; ✓ completa+cierra; timer 0 dispara onComplete+toast |
| **B5** | **Toggle Notificaciones placebo** (duplicado que ensombrece al real) | `lifeos-screens.jsx:2056-2077` vs `notify.jsx:115` | Borrar el duplicado de screens.jsx |
| **B7** | **Stats con datos inventados** presentados como reales + botón "Aplicar" muerto | `lifeos-screens.jsx:1766-1804` | Calcular desde `durationMin` real o quitar; cablear/quitar "Aplicar" |
| **B14** ⭐ | **Off-by-one de FECHA** (el que encontró la polola): guarda offset re-resuelto con `new Date()` al guardar → cruza medianoche → +1 día | `lifeos-screens.jsx:765-778` | Guardar la **fecha absoluta** elegida en el strip, no un offset |
| **N1** 🆕 | **Notificaciones 100% inoperantes**: leen `TODAY_TASKS` (siempre `[]`) y solo corren en `visibilitychange` (sin `setInterval`) | `lifeos-notify.jsx:88-110` | Leer `LOStore.tasksForDate()` + `setInterval(check,60000)` (o sw.js) |
| **N2** 🆕 | **`allTasks()` muta en cada lectura**: regenera IDs de subtask legacy y pisa `updatedAt` en cada render → IDs inestables + sync envenenado | `lifeos-data.jsx:195-208, 236` | Normalizar UNA vez (en escritura/migración), idempotente |
| **N3** 🆕 | **Overrides huérfanos**: una ocurrencia destoggleada vuelve a `todo` y queda como registro basura que nunca se limpia (crece sin límite) | `lifeos-data.jsx:286-299` | Al volver a `todo` sin más cambios, borrar el override (volver a virtual) |
| **A1** 🆕 | **React *development* build embebido** (react-dom.development.js = 1.05 MB) | `index.html` asset manifest | Cambiar a `*.production.min.js` (−1 MB) |
| **A2** 🆕 | **Babel-standalone (3 MB) viaja al cliente y transpila los JSX en el teléfono en cada arranque** | `index.html:140-164` loader `text/babel` | Pre-transpilar en build (esbuild/`@babel/core` ya está en Node); eliminar Babel del bundle |
| **A8** 🆕 | **`rebuild.py` mapea UUID→archivo hardcodeado**; si el bundle se regenera, el mapeo se rompe en silencio (`continue` sin avisar) | `rebuild.py:6-16` | Que falle ruidosamente si un `src` no mapea; migrar a build determinista |

### 🟡 Importantes — UX, confianza, mantenimiento

| ID | Problema | Evidencia | Fix |
|---|---|---|---|
| **B1** | "Añadir paso" en Create inserta texto hardcodeado `'Nuevo paso'` (el checklist ya es editable) | `lifeos-screens.jsx:742` | Input vacío + autofocus (patrón ya en Detail:1012) |
| **B8** | **Botones muertos** sin `onClick`: lupa Agenda (`screens.jsx:119`), chevron Stats (`1661`), "Aplicar" (`1800`), fila "Calendario" Create (`699`), campana Focus (`extras.jsx:100`), días timeline (`timeline.jsx:216`), "+Fill" (`490`), Rutinas +/Crear/editar (`extras.jsx:287,332,361`), `SettingsRow` "Sync/Idioma" sin handler (`2079`) | varias | Cablear cada uno o quitar la apariencia interactiva |
| **B9** | **WeekScreen 100% demo e inalcanzable**; onboarding promete "deslizar para ver la semana" que no existe | `lifeos-screens.jsx:265-333`, copy `1295` | Conectar a `tasksForDate` 7 días + ruta, o eliminar y corregir copy |
| **B10** | `applyRoutine` apila back-to-back **pisando** horas ocupadas | `lifeos-data.jsx:331-351` | Saltar al primer hueco libre (`tasksForDate`) |
| **B11** | **Hábito**: cadencia hardcodeada `'daily'`, no se puede editar/borrar (el store sí tiene `removeHabit`); el streak ignora cadencia | `lifeos-extras.jsx:599`, `data.jsx:583` | Selector de cadencia + sheet editar/borrar; streak respeta cadencia |
| **B12** | **Inbox "Agendar"** crea a la hora actual redondeada **pisando** lo que haya y no quita el item del inbox | `lifeos-app.jsx:134,533` | Buscar hueco libre (DRY con B10) + eliminar item del inbox |
| **B15** | `durationMin` no se persiste; con cruce de medianoche `end<start` → 5 min | `lifeos-screens.jsx:386-391`, `data.jsx:188` | Guardar `durationMin` explícito en Create |
| **B16** | **Detail no edita lo esencial**: título, nota, icono, color, fecha, hora, duración son solo lectura | `lifeos-screens.jsx:961-966` | Hacer editables reusando pickers de Create |
| **HU-01** | **IDs con `Date.now()`** (colisión en clics rápidos y sync) | `screens.jsx:742,768,903` | `loUid()` (ya global) |
| **D-quota** | `QuotaExceeded` se traga en silencio → la tarea "desaparece" tras el toast de éxito | `lifeos-data.jsx:153-157` | Detectar y emitir toast de error real |
| **D-nlp** | Borrar/completar por NLP matchea substring del primer token → borra la tarea equivocada sin confirmar | `lifeos-data.jsx:550-562` | Match palabra completa + confirmación |
| **A4/A5** | Service worker cache-first sin revalidación; **sin CSP** ni `X-Content-Type-Options` | `sw.js:18-31`; `index.html` head | `stale-while-revalidate` + CSP por Cloudflare (tras matar Babel) |
| **A7** | **`localStorage` es la única verdad**, sin export/import ni manejo de cuota | persistencia global | Export/import JSON + quota — cimiento del sync de pareja |
| **DS-1** | **Fraunces (display serif) casi sin usar** (7 ocurrencias); los números grandes salen en grotesk plano | `lifeos-app.jsx:594` | `.lo-display` en todos los números grandes (StatCard, streak, progreso) |
| **DS-2** | **Sin sistema de tokens**: ~30 tamaños de fuente (10.5/11.5/13.5…), paddings off-grid, 25+ radios | toda la base | Escala tipográfica de 8 pasos + tokens de spacing 4pt + 5 radios |
| **DS-3** | **Cero textura/atmósfera**: solo glows; falta el grano fino que da Structured | toda la base | Capa de grano SVG `feTurbulence` 2-4% + fondo de shell con gradiente (`bg2` ya existe) |

### 🟢 Deuda — polish / código muerto

- Variantes `TimelineCards/Hourly/Minimal` leen `TODAY_TASKS` (vacío) → muertas; solo `TimelineClassic` sirve datos reales (`timeline.jsx:507,572,608`).
- Código muerto: `updateUserTask` (`app.jsx:44-46,330`), rama IA remota `window.LOAI` (`screens.jsx:1339`), gating "primera semana" (`user.jsx:57-69`), badge "PRO" falso (`screens.jsx:1928`).
- Ícono de hábito: `HABIT_ICONS[0]='flame'` no existe en `LifeIcon`→ cae a estrella (`icons.jsx:339`); alias `flame→fire`.
- `currentTime` hardcodeado `'07:55'` en timeline (`timeline.jsx:329`).
- Fechas hardcodeadas en Stats ("Feb–May", "12–18 May") sobre datos reales (`screens.jsx:1717,1734`).
- Carpeta `deploy/` es copia stale; Cloudflare sirve la **raíz** (`wrangler.jsonc:8-9`). Borrar o documentar.
- `applyRoutine`/Inbox-Agendar deberían DRY-ear el "buscar hueco libre".
- Gradiente lavender→sky de la card Insight = único roce con "AI slop" (`screens.jsx:1790`).

### Lo que SÍ funciona — **NO tocar**
Completar desde el detalle · hábitos crear/completar/streak/persistencia · inbox capturar ·
**IA NLP offline** (crear/borrar por texto y voz) · persistencia de tema/densidad/acento (tweaks) ·
navegación sin pageerror · empty states · acento coral coherente · íconos propios · `lo-press` universal.

---

## 2. Riesgos para el SYNC futuro (meta "modo pareja")
1. **`updatedAt` pisado en cada lectura** → last-write-wins elige mal. **Crítico, arreglar antes de cualquier sync.**
2. **IDs `Date.now()`** → colisión entre 2 teléfonos en el mismo ms. Usar UUID v4.
3. **Ocurrencias virtuales `base@fecha`** → difíciles de deduplicar en merge; definir esquema de "exception records".
4. **Overrides `todo` huérfanos** → crecen sin límite y se replican.
5. **Habits/inbox sin `updatedAt`** → sin resolución de conflictos.
6. **Migración legacy destructiva** → descarta payloads de otro device sin backup.

---

## 3. Roadmap de Sprints

> Sprints de duración fija (sugerido **1 semana** cada uno, timebox del curso ≤1 mes).
> Un sprint arranca apenas cierra el anterior. Orden = prioridad del PO.

| Sprint | Tema | Sprint Goal | Épicas |
|---|---|---|---|
| **S2** *(próximo)* | **Que lo que existe funcione de verdad** | Cero botones placebo, cero datos falsos, persistencia correcta | B1-B5, B7, B14, N1-N3, HU-01, B15 |
| **S3** | **Plataforma sólida** | Arranque rápido en móvil + build confiable + datos exportables | A1, A2, A8, A7, A4/A5 |
| **S4** | **Diseño nivel Structured** | Que no parezca hecho por IA: tokens, Fraunces, textura | DS-1, DS-2, DS-3, AI-slop |
| **S5** | **Hábitos de primera clase** (diferenciador #1) | Hábitos reales con heatmap que Structured no tiene | B11 + heatmap por hábito + anual |
| **S6** | **Completar el planner** | Paridad de planner con Structured | B8, B9, B10, B12, B16, all-day, deadlines, timeline variants |
| **S7** | **Modo pareja + sync** (diferenciador #2) | "Nuestro día" sincronizado entre 2 teléfonos | Worker+D1/Supabase, cuentas, sync, vista compartida |
| **S8** | **AI real** (diferenciador #3) | NLP cloud + escaneo de planner por cámara, sin keys en cliente | Claude vía Worker proxy, auto-reschedule, fallback offline |

**Por qué este orden:** primero que lo existente no engañe (S2), luego el cimiento técnico sobre el
que todo lo demás se para (S3: sin persistencia robusta no hay sync; sin arranque rápido la PWA pierde),
después el diferenciador visual barato (S4), y recién ahí las 3 apuestas que **superan** a Structured
(S5-S8). Igualar = S2+S6. Superar = S5+S7+S8.

---

## 3.bis Progreso de ejecución (2026-05-31)

**Sprints 2, 4 y 5 (núcleo) ejecutados y verificados en la misma sesión.** Verificación con
`verify-sprint2.js` (13/13 ✅), `smoke.js` y `flow.js` (0 errores de consola), `rt-test.js` (sweep
de pantallas sin `pageerror`).

- **Sprint 2 — bugs ✅** B1 (pasos editables), B2 (reminder/recur se guardan), B3 (editar recurrente
  ya persiste), B4 (Focus ✓ completa + timer→toast), B5 (placebo de notificaciones borrado),
  B6 (button-in-button arreglado), B7 (stats reales: reparto por color + insight de mejor día + rangos
  de fecha reales; quitados datos inventados, badge PRO y botón "Aplicar"), B8 (botones muertos
  removidos: lupa Agenda, chevron Stats, "+"/"Crear rutina"/lápiz de Rutinas, fila Calendario),
  B9 (copy de onboarding que mentía sobre la semana corregido), B10 (`applyRoutine` salta horas
  ocupadas), B11 (hábitos: cadencia diaria/entre-semana/días + editar/borrar por long-press; streak
  respeta cadencia), B12 (inbox "Agendar" busca hueco libre y quita el item), B14 (⭐ off-by-one de
  fecha: se guarda fecha absoluta), B15 (`durationMin` explícito), B16 (Detail editable: título, nota,
  hora, fecha, duración, color, icono), HU-01 (IDs con `loUid`). **Nuevos:** N1 (notificaciones reales
  + intervalo 60s), N2 (`updatedAt` no se pisa en lectura), N3 (overrides huérfanos se limpian),
  quota toast, habits/inbox con `updatedAt`, NLP no borra la tarea equivocada, regex diacríticos.
- **Sprint 4 — diseño ✅** Grano de película global (firma táctil, `body::after` turbulence 4.5%),
  Fraunces aplicada a TODOS los números grandes (stats, racha, progreso, timer Focus, "de N tareas"),
  `prefers-reduced-motion`, ícono de hábito `flame`→`fire`.
- **Sprint 5 — diferenciador (núcleo) ✅** Heatmap de consistencia por hábito (18 semanas, tipo GitHub)
  + stats Racha / Mejor racha / % 30 días en la hoja de edición. Esto Structured **no lo tiene**.

- **Sprint 3 — plataforma (parcial) ✅** **A1: React dev→producción** swap en el manifest del bundle
  (react-dom 1.05 MB → 132 KB; ~940 KB menos de payload, arranque más rápido; verificado con
  smoke/flow/verify, 0 errores). **A7: export/import de datos** (soberanía local-first: respaldo JSON
  exportable/importable entre teléfonos — Structured no lo da). Backup del bundle en `/tmp/index.html.bak-a1`.

**Pendiente (próximas sesiones):** S3-A2 (matar Babel-in-browser — reescribe `rebuild.py`+template+loader,
riesgoso, sesión dedicada), CSP/headers, S6 (WeekScreen real, CRUD de rutinas custom, all-day, deadlines),
S7 (modo pareja + sync, ya con export/import + `updatedAt` listos como cimiento), S8 (AI real con Claude
+ escaneo de planner). Scripts de regresión: `verify-sprint2.js`, `verify-heatmap.js`.

---

## 4. Sprint 2 — plan detallado (arrancable ya)

**Fechas:** 2026-05-31 → 2026-06-06 (1 semana)
**Sprint Goal:** *Todo lo que la app muestra como funcional, funciona y persiste de verdad — y el
bug de fecha de la polola desaparece.*

### Qué se entrega (HU del backlog)
- B14 (off-by-one fecha) · B2 (reminder/recur) · B3 (editar recurrente) · B4 (Focus completa) ·
  B5 (notif placebo) · B7 (stats reales) · N1 (notif operativas) · N2/N3 (store sano) · HU-01 (IDs) · B15 (durationMin).

### Cómo (tareas ≤1 día)
- [ ] **B14**: en el strip de fecha guardar `date:'YYYY-MM-DD'` absoluto; quitar `dateOffset` del objeto.
- [ ] **B2**: añadir `reminder: reminderOn` y `recur` al task de Create (`screens.jsx:767`).
- [ ] **B3**: en `updateTask`/`toggleSubtask`, si `id.includes('@')` materializar ocurrencia antes del patch (`data.jsx:246`).
- [ ] **B4**: pasar `onComplete` a `FocusMode` en `app.jsx:184,559`; ✓ y timer-0 → completa+toast.
- [ ] **B5**: borrar `NotifSettingsRow` duplicado de `screens.jsx:2056-2077`.
- [ ] **B7**: calcular "En qué se va tu tiempo" por color sumando `durationMin`; quitar insight "+23%" y botón "Aplicar".
- [ ] **N1**: `useTaskNotifications` lee `LOStore.tasksForDate()` + `setInterval(check,60000)` (`notify.jsx`).
- [ ] **N2**: hacer `loNormalizeTask` idempotente; no pisar `updatedAt` ni regenerar IDs en lectura (`data.jsx:208`).
- [ ] **N3**: limpiar overrides que vuelven a `todo` sin otros cambios (`data.jsx:286`).
- [ ] **HU-01 + B15**: `loUid()` en `742,768,903`; `durationMin: duration` explícito en Create.

### DoD del Sprint (regla del repo)
- [ ] `node check.js` OK · [ ] `python3 rebuild.py` ejecutado (src→index.html) · [ ] verificado con `rt-test.js`/navegador
- [ ] no rompe features previas · respeta Disciplina de código del CLAUDE.md · [ ] nota de sesión en `docs/session/`

### Primer paso
Arrancar por **B14** (es el bug que ya golpeó a la polola y es de bajo riesgo): cambiar el guardado
de offset relativo a fecha absoluta en `lifeos-screens.jsx`, luego `rebuild.py` y verificar con `rt-test.js`.
