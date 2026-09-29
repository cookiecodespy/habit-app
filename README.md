# LifeOS 

Planner diario + tracker de hábitos, mobile-first y PWA. Timeline visual del día, hábitos con
rachas, captura rápida (inbox), rutinas, modo enfoque, y un **IA Planner** que crea/mueve/completa/
borra tareas por lenguaje natural en español (texto y voz) — 100% offline, sin backend.

<p align="center">
  <img src="shot-agenda.png" alt="LifeOS — agenda mensual en desktop" width="68%">
  <img src="shot-coherence-today.png" alt="LifeOS — vista Hoy en móvil" width="24%">
</p>

## Funciona en
- **Teléfono** → app full-screen de una columna.
- **Desktop / tablet** → layout con sidebar.
Mismo código, layout responsivo (`App()` en `src/lifeos-app.jsx`).

## Características
- Timeline del día por secciones (mañana/tarde/noche), completar tocando el anillo, subtasks con progreso.
- Tareas recurrentes (cada día / entre semana / semanal), recordatorios, prioridad, posponer.
- Inbox de captura rápida → agendar en un toque.
- Rutinas reutilizables (Pomodoro, Día de clases, Workout…) que se agendan de una.
- IA Planner: *"gym mañana 7am 1h"*, *"reunión con Ana el lunes 10am"*, *"llamar a mamá cada día 8pm"* → tarea real.
- Agenda mensual + semanal (estilo Fantastical), pantalla **Hábitos** con heatmap de consistencia, ajustes (tema/acento/densidad), exportar/importar respaldo JSON.
- Persistencia local (`localStorage`); store sync-ready para una futura capa Supabase (cuentas + sync multi-dispositivo).

## Desarrollo (arquitectura bundle)
`index.html` es un bundle autocontenido de un solo archivo: los 9 módulos JSX se **precompilan
offline** (Babel vía `build.py` + `transpile.js`) y viajan como JS plano dentro de un manifest
gzip+base64. **Ya NO se transpila en el navegador** (sin `@babel/standalone`, CSP sin `unsafe-eval`).
**La fuente de verdad son los `src/*.jsx`.**

```bash
# 1. editar src/*.jsx
npm ci                 # herramientas con versiones fijadas
npm test               # regresión del store y recordatorios
python3 build.py       # precompila src/ -> index.html  (rebuild.py delega aquí)
python3 -m http.server 8755   # probar en http://localhost:8755
npm run test:browser   # flujos móvil/escritorio en Chromium
node verify-builda.js   # arranque y CSP (servidor :8755)
```

> El **entry real** (`ReactDOM.render(<App/>)`) vive en el template inline de `index.html`;
> `build.py` lo transpila junto con los módulos, así que basta con correr `build.py` tras editar `src/`.

Las dependencias y pruebas están versionadas. `node_modules/`, pruebas y documentación
se excluyen de los assets públicos. `CHROME_PATH` permite indicar el ejecutable de Chromium.

## Deploy
App estática en **Cloudflare Workers**, conectada a `main` mediante Workers Builds.
URL: https://habit-app.tomas-sotz.workers.dev. Ver [despliegue](DEPLOY-CLOUDFLARE.md) y
[auditoría/cronología](docs/AUDITORIA-2026-09-29.md).

Los datos viven sólo en el navegador del dispositivo (`localStorage`).
