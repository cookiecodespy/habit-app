# LifeOS — Tu día, visualizado

Planner diario + tracker de hábitos, mobile-first y PWA. Timeline visual del día, hábitos con
rachas, captura rápida (inbox), rutinas, modo enfoque, y un **IA Planner** que crea/mueve/completa/
borra tareas por lenguaje natural en español (texto y voz) — 100% offline, sin backend.

Pensado para igualar y superar a apps tipo *Structured*, con identidad propia: tipografía con
carácter (Fraunces display + Hanken Grotesk), tema oscuro cálido con acento ámbar, y micro-interacciones cuidadas.

## Funciona en
- **Teléfono** → app full-screen de una columna.
- **Desktop / tablet** → layout con sidebar.
Mismo código, layout responsivo (`App()` en `src/lifeos-app.jsx`).

## Características
- Timeline del día por secciones (mañana/tarde/noche), completar tocando el anillo, subtasks con progreso.
- Hábitos con racha diaria 🔥 (la sección de "Hoy").
- Tareas recurrentes (cada día / entre semana / semanal), recordatorios, prioridad, posponer.
- Inbox de captura rápida → agendar en un toque.
- Rutinas reutilizables (Pomodoro, Día de clases, Workout…) que se agendan de una.
- IA Planner: *"gym mañana 7am 1h"*, *"reunión con Ana el lunes 10am"*, *"llamar a mamá cada día 8pm"* → tarea real.
- Agenda mensual, Stats con heatmap, ajustes (tema/acento/densidad), exportar respaldo JSON.
- Persistencia local (`localStorage`); store sync-ready para una futura capa Supabase (cuentas + sync multi-dispositivo).

## Desarrollo (arquitectura bundle)
`index.html` es un bundle autocontenido: los módulos JSX viven gzip+base64 en un manifest y se
transpilan en el navegador con Babel standalone. **La fuente de verdad son los `src/*.jsx`.**

```bash
# 1. editar src/*.jsx
node check.js          # syntax-check (Babel) de los 9 módulos
python3 rebuild.py     # reempaqueta src/ -> index.html
python3 -m http.server 8000   # probar en http://localhost:8000
node smoke.js          # smoke test headless (Playwright + Chrome del sistema)
```

> El **entry real** (`ReactDOM.render(<App/>)`) vive en el template inline de `index.html`, que
> `rebuild.py` no toca — si necesitas cambiar el componente raíz, edita `index.html` directamente.

`check.js`, `smoke.js`, `flow.js`, `node_modules/` y `package*.json` son herramientas de dev locales
(ignoradas en git y en el deploy).

## Deploy
App web estática → GitHub Pages / Cloudflare Pages. Sube la carpeta; sirve `index.html` desde la raíz.

Los datos viven sólo en el navegador del dispositivo (`localStorage`).
