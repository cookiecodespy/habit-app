# Mapa de Bugs — LifeOS (auditoría profunda 2026-05-30)

> Hallado con 5 agentes (3 de trazado de código + 1 de runtime con Playwright + 1 de research Structured).
> Cada bug **verificado en vivo** salvo donde se indique. Severidad: 🔴 rompe función / engaña · 🟡 a medias · 🟢 menor.
> Lección de las auditorías anteriores: tenían `onClick` → asumieron que funcionaba. Aquí se verificó el EFECTO real.

## 🔴 Bloqueantes (la función parece andar pero no anda)

| ID | Bug | Evidencia (archivo:línea) | Verificado | Fix |
|---|---|---|---|---|
| **B1** | Checklist en **Create no editable**: cada paso es `<span>` de solo lectura y "Añadir paso" inserta `label:'Nuevo paso'` hardcodeado | `lifeos-screens.jsx:736, 742` | ✅ runtime (3 inputs en DOM, 0 para pasos) | Reemplazar `<span>` por `<input>` enlazado por id; "Añadir paso" crea `label:''` con autofocus (copiar patrón de DetailScreen:1012) |
| **B2** | **Create descarta "Recordatorio" y "Repetir"**: los toggles funcionan en pantalla pero el dato no se incluye al guardar | `lifeos-screens.jsx:767-780` (faltan `reminder`/`recur`) | ✅ runtime (`reminder:false, recur:null`) | Añadir `reminder: reminderOn` y `recur` al objeto guardado |
| **B3** | **Editar tarea recurrente = no-op silencioso**: +30min, prioridad, agregar paso no hacen nada (el id `base@fecha` no existe en el store) | `lifeos-data.jsx:247` `updateTask` retorna null | ✅ runtime | En `updateTask`/`toggleSubtask` materializar la ocurrencia como hace `toggleTask` (`data.jsx:258-265`) |
| **B4** | **Focus Mode ✓ no completa la tarea** (botón ✓ = botón cerrar; ambos llaman `onClose`) | `lifeos-extras.jsx:114`; falta `onComplete` en `app.jsx:184,559` | ✅ runtime (status sigue `todo`) | Pasar `onComplete` a FocusMode; ✓ completa y cierra; al llegar a 0 disparar onComplete/toast |
| **B5** | **Toggle Notificaciones es placebo**: hay un `NotifSettingsRow` falso en screens que **ensombrece** al real de notify.jsx; no pide permiso ni persiste | `lifeos-screens.jsx:2056-2077` shadow de `lifeos-notify.jsx:115` | ✅ runtime (permiso `default`, no escribe LS) | Borrar la función duplicada de screens.jsx para que se use la real |
| **B7** | **Stats con datos falsos** presentados como reales: "En qué se va tu tiempo" (32% inventado), "viernes +23%" + botón "Aplicar" muerto | `lifeos-screens.jsx:1767-1786, 1796-1804` | ✅ código | Calcular por color/categoría real (`durationMin`) o quitar; quitar el insight falso o calcularlo real |
| **B13** | **IDs con `Date.now()`** (colisión en sync futuro) | `lifeos-screens.jsx:742, 768, 903` | ✅ código | Usar `loUid()` (ya existe en `data.jsx:159`, accesible global) |
| **B14** | **Off-by-one de FECHA** ⭐ (el que encontró la polola): la franja de fechas se arma con `new Date()` al abrir pero guarda **offset relativo**; al guardar se re-resuelve con `new Date()` fresco. Si cruza la medianoche entre abrir y guardar → la tarea cae **+1 día** | `lifeos-screens.jsx:393-408` (strip) + `766` (`_d.setDate(getDate()+dateOffset)`) | ✅ simulación: guardar 22:31 → 08-jun; guardar 00:05 → 09-jun | Guardar la **fecha absoluta** (`YYYY-MM-DD`) al elegir el día, no un offset re-resuelto al guardar |

## 🟡 A medias / engañosos

| ID | Bug | Evidencia | Fix |
|---|---|---|---|
| **B6** | `<button>` dentro de `<button>` en SettingsRow → warning React de hydration | consola runtime; `lifeos-screens.jsx` SettingsRow | Cambiar el wrapper externo a `<div role="button">` o el interno a `<div>` |
| **B8** | **Botones muertos** (sin `onClick`): días de la semana en timeline, BreakRow "+Fill", Rutinas "+"/"Crear rutina"/lápiz editar, campana de Focus, lupa de Month, chevron de Stats, "Aplicar" de Stats | `timeline.jsx:216,490`; `extras.jsx:287,332,361,100`; `screens.jsx:119,1661,1800` | Cablear cada uno o quitar la apariencia de interactivo |
| **B9** | **WeekScreen 100% demo e inalcanzable**; onboarding promete "deslizar para ver la semana" que no existe | `lifeos-screens.jsx:265-333`; copy en `1121,1295` | Conectar a `tasksForDate` por 7 días y dar ruta, o eliminar y corregir copy |
| **B10** | **`applyRoutine` pisa horas ocupadas** (apila back-to-back sin chequear solapamiento ni respetar el `hint`) | `lifeos-data.jsx:331-351` | Consultar `tasksForDate` y saltar bloques ocupados |
| **B11** | **Hábito: cadencia hardcodeada `'daily'`**; no se puede editar ni borrar un hábito (el store sí tiene `removeHabit`) | `lifeos-extras.jsx:599` | Selector de cadencia + sheet de editar/borrar; `loHabitStreak` debe respetar cadencia |
| **B12** | **Inbox "Agendar"** crea a la hora actual redondeada **pisando** lo que haya; items no editables ni reordenables | `lifeos-app.jsx:134`; `screens.jsx:1604` | Buscar primer hueco libre; permitir editar texto del item |
| **B15** | **`durationMin` / cruce de medianoche**: `end` se calcula con wrap (`23:30`+120 → `01:30`) y una re-edición que recalcula `dur = end - start` daría negativo→5min | `lifeos-screens.jsx:386-391` | Persistir `durationMin` explícito en el guardado |
| **B16** | **Detail no deja editar lo esencial**: título, nota, icono, color, fecha, hora de inicio, duración solo se muestran; para corregir hay que borrar y recrear | `lifeos-screens.jsx` DetailScreen 961-962 etc. | Hacer editables esos campos en el detalle |

## 🟢 Menores / deuda
- Rama IA remota `window.LOAI` siempre falsa (código muerto) — `screens.jsx:1339-1342`.
- Variantes `TimelineCards/Hourly/Minimal` leen `TODAY_TASKS` (vacío) — muertas para datos reales; solo `TimelineClassic` sirve.
- `QuickActionsRow` usa un placeholder; `QUICK_ACTIONS` ya no se usa.
- Fechas hardcodeadas en Stats ("Feb–May", "12–18 May") sobre datos reales — quedan desfasadas.

## Lo que SÍ funciona (NO tocar)
Completar desde el detalle · hábitos (crear/completar/streak/persistencia) · inbox capturar · **IA NLP offline** (crear/borrar por texto y por voz) · persistencia de tema/densidad/acento · navegación sin pageerror · empty states de timeline/inbox/search.
