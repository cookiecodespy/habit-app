# CONTINUAR-AQUÍ — Estado y handoff de LifeOS / habit-app

> **Léeme primero al abrir una sesión nueva de Claude Code.** Resume TODO lo reciente para
> continuar sin perder contexto. Última actualización: **2026-06-03**.
> Complementos: `docs/scrum/PLAN-MAESTRO.md`, `docs/scrum/BUG-MAP.md`, `docs/session/*`.

---

## 0. TL;DR — cómo continuar
- La app está **desplegada y funcionando**: https://habit-app.tomas-sotz.workers.dev
- Trabajamos **incremental**, una pasada a la vez, **verificando y desplegando al cierre de cada pasada**,
  y **terminando siempre con sugerencias** de mejora (reglas de Tomás).
- **Próxima acción concreta pendiente:** arreglar **uno por uno** los bugs confirmados por el synthetic
  user testing (sección 6). El primero es el **bug NLP "miércoles → ércoles"** (causa raíz ya diagnosticada).
- **Meta del producto:** que LifeOS sea **más grande y mejor que Structured** (features + diseño + código).
  Nota promedio actual de power-users de Structured probándola: **~6.6/10** (ver sección 5).

---

## 1. Arquitectura (importante — NO es un proyecto React normal)
- **SPA React de un solo bundle, sin build moderno ni TypeScript.** Fuente real: `src/lifeos-*.jsx`
  (~6.700 líneas, 9 archivos: app/data/screens/extras/timeline/icons/notify/user/tweaks-panel).
- `index.html` (~1.09 MB) es un **bundle que embebe los src** (gzip+base64) y se reconstruye con
  **`python3 rebuild.py`** tras CADA cambio a `src/*.jsx`.
- **React + Babel se ejecutan EN EL NAVEGADOR** (el JSX se transpila en cada arranque → primer arranque
  lento). Matar esto = **S3-A2 pendiente** (ver roadmap).
- Persistencia: **solo `localStorage`** (local-first, sin backend). Claves: `lifeos.tasks.v2`,
  `lifeos.habits.v1`, `lifeos.inbox.v1`, `lifeos.routines.v1`, `lifeos.user`.
- Deploy: **Cloudflare Workers** (estáticos). `.assetsignore` excluye src/docs/test scripts del público.
- Repo: `cookiecodespy/habit-app` (rama `main`). El `.gitignore` excluye backups y screenshots.
- **Globals del bundle** (sin imports; funciones top-level compartidas): `LOStore`, `loDateStr`,
  `LIFE_PALETTE`, `LifeIcon`, `UIIcon`, `TaskGlyph`, `loIsEmoji`, `loParseCommand`, etc.
  ⚠️ Cuidado con **colisiones de nombres de función entre archivos** (ya nos pasó con `SectionLabel`).

## 2. Cómo correr / verificar / desplegar
```bash
cd /home/tomas/habit-app
node check.js                 # syntax-check de cada src/*.jsx
python3 rebuild.py            # reconstruye index.html desde src/ (SIEMPRE tras tocar src)
python3 -m http.server 8755   # servir local; los verify-*.js apuntan a :8755
node verify-sprint2.js        # regresión núcleo (13 asserts)
node verify-week.js / verify-deadline.js / verify-allday.js / verify-agenda.js / verify-create.js / verify-heatmap.js / verify-routines.js
node rt-test.js               # 8 flujos móviles reales (el más completo)
# Deploy (al cierre de cada pasada):
npx wrangler deploy           # ya logueado (tomas.sotz@outlook.com)
# Verificar live = local:
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://habit-app.tomas-sotz.workers.dev/
```
⚠️ El `Failed to fetch (Bundle unpack)` que sale a veces en los verify es un **artefacto de reload
programático** del loader basado en fetch — NO ocurre en carga normal. Lo elimina S3-A2.

## 3. Reglas de trabajo (Tomás)
1. **Subir todo (commit + deploy) al cierre de cada pasada** — ver `[[feedback_deploy_each_sprint]]`.
2. **Terminar siempre con sugerencias** de mejora priorizadas — ver `[[feedback_suggest_after_each_pass]]`.
3. Diseño: invocar skills `diseno` + `frontend-design`; estándar senior, anti-AI-slop, intencional.
4. Verificar antes de decir "listo" (check/rebuild/regresión). NUNCA `build` con dev server sobre `.next` (no aplica aquí).
5. Hacerlo **uno por uno** cuando importa la calidad (no batch apresurado).

## 4. Qué se hizo recientemente (cronología, todo desplegado)
- **Sprint 2/4/5** (antes): bugs núcleo, grano+Fraunces, heatmap de hábitos.
- **S3 parcial:** A1 (React dev→prod) ✅, A7 (export/import JSON) ✅. **Falta A2 (matar Babel) + CSP.**
- **Sprint B "Planner completo"** ✅: WeekScreen real + `CalendarScreen` (toggle Mes/Semana); deadlines
  (`DeadlineCard` + `upcomingDeadlines` + `DeadlineRow`); all-day (`t.allDay` + pills en timeline);
  CRUD de rutinas custom (`RoutineEditor`); fix `isWide` (crash desktop).
- **Sprint "Agenda interactiva"** ✅: temas/categoría (`t.category` vida/trabajo/uni) + `loGuessCategory`
  (auto-sugerencia) + `CategoryPicker`; MonthScreen con toggle Día/Todo-el-mes + chips de filtro + lista
  agrupada por fecha estilo extracto + tap→ir al día; `AgendaTaskRow` con barra de acento por tema.
- **Rediseño "Añadir tarea"** ✅ (2 iteraciones): de hero plano → carded → **nivel mockup**: header con
  botón "Guardar", grid (par Color|Icono), tarjeta de nombre, Prioridad con descripciones, banner Consejo.
- **Emojis nativos tipo iPhone EN TODA la app** ✅: `TaskGlyph` (emoji con **fallback a LifeIcon**),
  `loIsEmoji`; selector de íconos = emojis por categoría; default '✨'. Hábitos/rutinas siguen con LifeIcon.
- **Sidebar de escritorio rediseñado** ✅: marca, chip de usuario, **nav agrupada** (Planifica/Analiza/Cuenta),
  card "Enfoque de hoy" con anillo de progreso real, toggle de tema, CTA.
- **Bug arreglado en auditoría:** colisión de `SectionLabel` (labels en blanco en toda la app) → corregido.
- Últimos commits relevantes en `main`: f699ef0 (Create mockup), f998efd (sidebar). (Correr `git log --oneline -8`.)

## 5. SYNTHETIC USER TESTING — 2026-06-03 (skill `/agentes`)
4 power-users de **Structured** (desde el día 0) probaron la app EN VIVO (renderizada con Playwright).
**Nota promedio vs Structured: ~6.6/10.** ⚠️ Corrieron en paralelo sobre el MISMO navegador Playwright →
se contaminaron el `localStorage` entre ellos (de ahí que varios vieran el nombre "Valentina" y data demo
ajena). **El bug del nombre de onboarding NO es real** (el código guarda el nombre tipeado; fue el test).

| Persona | Perfil | Nota /10 | Veredicto (¿deja Structured hoy?) |
|---|---|---|---|
| Martín, 29 | Diseñador de producto, exigente con pulido | 7.5 | No (falta sync/Calendar/widgets) |
| Camila, 34 | Consultora freelance, multi-cliente, Google Cal | 5 | No (sin sync ni Google Calendar = inservible para trabajo) |
| Diego, 22 | Estudiante, 100% iPhone, hábitos | 7.5 | No aún, pero la deja instalada |
| Valentina, 41 | Gerente ops, fiabilidad + privacidad | 6.5 | No (notificaciones no confiables + sin sync) |

**Dónde LifeOS YA gana a Structured (consenso de los 4):**
- 🔥 **Heatmap de consistencia de hábitos tipo GitHub** (Structured no lo tiene) — el ganador unánime.
- IA Planner por texto/voz offline · Stats ("en qué se va tu tiempo") · Rutinas/packs · Export-import +
  privacidad local-first · Identidad visual (Fraunces, coral, grano).

**Brechas vs Structured (lo que más los frena, consenso):**
1. **Sync entre dispositivos + Google/Apple Calendar** = deal-breaker #1 de los 4.
2. **Notificaciones/recordatorios confiables en segundo plano** (hoy dependen de la PWA abierta).
3. Widgets / Apple Watch / sensación nativa iOS (haptics, swipe-completar/posponer, drag-reagendar).
4. **Recurrencia flexible** (hoy solo "Entre semana · Lun-Vie"; falta "semanal el día X", "cada 2 semanas", fin de repetición).
5. **Áreas/temas personalizables** (hoy hardcodeado Vida/Trabajo/Universidad; Camila necesita sus clientes).
6. Revisión semanal guiada (ritual de cerrar/planificar la semana).

## 6. BUGS CONFIRMADOS POR EL TESTING — arreglar UNO POR UNO (priorizado)
> Mantener este orden; marcar [x] al cerrar cada uno (verificar + deploy + sugerencias).

- [x] **B-NLP-1 · "miércoles → ércoles" — ✅ ARREGLADO Y DESPLEGADO (2026-06-04).** Causa: el stopword
  `mi` se comía el "mi" de "miércoles" (`\b` ASCII trata "é" como borde) + la frase de recurrencia no se
  quitaba del título. Fix: stopwords ya usan bordes Unicode (`loWordListRE`); la recurrencia ahora se quita
  por el nombre del día con su acento real; se añadió `cada/todos` a los stopwords para limpiar huérfanos.
  Verificado con **`verify-nlp.js`** (5 casos PASS, incl. "reunión…todos los miércoles 10am" → "Reunión con
  cliente Acme" + weekly/3) y `verify-sprint2.js` 13/13.
- [ ] **B-NLP-2 · comandos compuestos.** "gym y almuerzo el viernes" crea UNA tarea y descarta la 2ª.
  Dividir por " y "/comas en varias tareas (Martín). Media complejidad.
- [ ] **B-UX-color · acentos compitiendo.** El acento es coral pero en Crear los toggles salen verde/azul
  y "guardado" en menta; + cuadrado/gradientes **morados** en empty-state y card "Tus datos" = "AI slop"
  (Martín + Camila). **Decisión pendiente con Tomás:** ¿acento principal a **menta/teal** (como el mockup,
  coral/amber solo prioridad) o unificar todo a coral? (ver sección 7).
- [ ] **B-UX-saludo.** "Buenas noches" (header) vs "Hola, ¡buen día!" (chip sidebar, hardcodeado) a la
  misma hora. Hacer el saludo del sidebar consistente con la hora.
- [ ] **B-UX-metrics.** "Hoy 0/2", "Stats Esta sem 3 / Total 4" cuentan distinto las instancias recurrentes.
  Unificar el conteo entre Hoy/Agenda/Stats.
- [ ] **B-UX-backdrop.** Tocar fuera de la hoja de Nueva tarea la cierra **guardando** una tarea sucia
  (título perdido, tema arbitrario) (Camila). El cierre por backdrop no debe guardar.
- [ ] **B-UX-create-overlap.** El header "Guardar" pegajoso se solapa con la sección Prioridad al hacer
  scroll en el panel de crear (Martín).
- [ ] **B-UX-week-labels.** Bloques de la vista Semana sin título/hora dentro (Martín).
- [ ] **B-UX-autotema.** El auto-tema se aplica solo y en silencio; puede clasificar mal (Valentina "prueba
  de cálculo" → Universidad sin pedirlo). Que la sugerencia se vea pero sea fácil de corregir / default "Vida".
- [ ] **B-PERF-coldstart.** Primer arranque lento (Babel-in-browser) = todos lo notan. Lo cierra **S3-A2**.

## 7. Decisiones de diseño (acordadas con Tomás) + 1 pendiente
- **Emojis iPhone SE QUEDAN** (no migrar a íconos de línea, pese a que el mockup/masterprompt los usan).
- **Ambas plataformas por igual:** móvil premium (la polola usa iPhone) + dashboard escritorio (mockup).
- **Incremental + design system** como objetos JS en el bundle actual (NO rewrite, NO multi-archivo/TS —
  eso requiere primero matar Babel = S3). Design system actual = `theme` (tokens de color) + componentes
  reutilizables: `Card`, `CardHead`, `SectionTitle`, `TaskGlyph`, `CategoryPicker`, `DeadlineRow`,
  `loCardStyle`. Falta formalizar tokens de spacing/typography/radius.
- **PENDIENTE (preguntar a Tomás):** acento principal — el mockup usa **menta/teal**; hoy es **coral**.
  Define el "look sobrio premium". Es un cambio global del `theme`.
- Norte visual: el mockup en `~/Downloads/ChatGPT Image Jun 3, 2026, 08_24_13 PM.png` + el masterprompt
  GPT (guardado en el chat) — estilo Linear/Things/Notion Calendar/Structured con identidad propia.
  El masterprompt está escrito para otra arquitectura (multi-archivo/TS); usarlo como dirección, no literal.

## 8. Roadmap (orden sugerido)
1. **Cerrar bugs del testing** (sección 6, uno por uno). ← estamos aquí.
2. **Decisión de acento** (coral vs menta/teal) → aplicar al `theme`.
3. **Sprint A = cerrar S3:** matar Babel-in-browser (arranque instantáneo + elimina fetch frágil) + CSP/headers.
4. **Diseño premium incremental por pantalla:** Hoy (dashboard) → Agenda (semana con línea de hora actual)
   → IA Planner → Stats → Ajustes → responsive/accesibilidad.
5. **S7 — Modo pareja + sync** (Supabase, gratis free-tier 2 teléfonos, con `/security`). Cimiento listo
   (export/import + `updatedAt`). Es el deal-breaker #1 del testing.
6. **S8 — AI real (Claude vía Worker)** — única feature que cuesta API.
7. Recurrencia flexible + áreas personalizables + notificaciones confiables + revisión semanal.

## 9. ¿Qué tan avanzada está? (respuesta a Tomás, 2026-06-03)
- **Concepto y features: ~80%** del mapa de Structured + diferenciadores propios (hábitos/heatmap, IA
  offline, rutinas, local-first). En features de planner puro **ya iguala o supera** a Structured.
- **Pulido visual: ~70%** — identidad fuerte pero con inconsistencias que delatan (color, copy, métricas).
- **Plataforma/fiabilidad: ~50%** — falta sync, notificaciones confiables, arranque rápido (S3), calendar.
- **Para "ser claramente mejor que Structured":** falta sobre todo **sync + notificaciones confiables**
  (deal-breakers) y cerrar las inconsistencias de pulido. Con eso, los testers pasan de "no la dejo aún"
  a reconsiderarla en serio (ya gana en hábitos, IA y stats).
</content>
