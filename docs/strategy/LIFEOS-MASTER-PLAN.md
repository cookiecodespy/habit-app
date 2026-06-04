# LifeOS / Habit App — Plan Maestro Técnico y Free-first

> Creado: 2026-06-03 21:40 America/Santiago  
> Dueño: Boss / Tomas Sotz  
> Asistente: Jared  
> Contexto: proyecto serio y reutilizable como patrón para futuros proyectos. Todo gratis primero; cualquier costo se consulta antes.

## 1. Norte del producto

Construir una app tipo LifeOS / habit planner que se sienta profesional, moderna e intencional: no una demo, sino una app que parezca hecha por un equipo senior. La ambición explícita es competir y superar a Structured en lo que importa para Boss:

- Planner diario visual.
- Hábitos con consistencia real.
- IA útil para crear/mover/borrar/planificar.
- Stats accionables.
- Offline-first.
- Sync multi-dispositivo.
- Performance seria.
- Diseño premium y consistente.

## 2. Política de herramientas y costos

Regla madre: **gratis primero**.

Se puede usar sin preguntar si está razonablemente dentro de free tier y no requiere riesgo de cargo:

- GitHub Free.
- Cloudflare Free / Pages / Workers dentro de límites gratuitos.
- Supabase Free, con diseño eficiente.
- Vite, React, TypeScript, Vitest, Playwright.
- Cloudflare Web Analytics.
- Herramientas open-source locales.

Consultar antes si:

- Requiere tarjeta o puede cobrar por uso.
- Es trial temporal.
- Tiene overage automático.
- Requiere plan pago para una feature clave.
- Puede generar costo por volumen: AI APIs, Sentry excesivo, PostHog eventos, Workers abusivos, storage grande.

## 3. Estado técnico actual

La app actual funciona y está desplegada, pero técnicamente es una arquitectura legacy/prototipo avanzado:

- SPA React funcional.
- Fuente real: `src/lifeos-*.jsx`.
- `index.html` embebe assets/source en manifest gzip+base64.
- `python3 rebuild.py` recompone el bundle.
- React + Babel corren en navegador.
- Sin TypeScript.
- Sin imports/exports modernos.
- Comunicación entre archivos vía globals en `window`.
- Persistencia local-first en `localStorage`.
- Mucho estilo inline.
- QA existente útil: `check.js`, `verify-*.js`, `rt-test.js`.

Esto permite iterar, pero no escala bien.

## 4. Riesgos principales

1. **Cold start lento** por Babel en navegador.
2. **Colisiones globales** por funciones compartidas vía `window`.
3. **Refactors frágiles** por mezcla de UI, estado y dominio.
4. **Storage débil para sync** si seguimos acoplando lógica a `localStorage` directo.
5. **Sin type safety** para tasks, habits, recurrence, settings, import/export.
6. **Design system incompleto** por inline styles y tokens dispersos.
7. **Testing disperso**: existe, pero falta pirámide clara.
8. **Notificaciones no confiables** por limitaciones PWA/browser.
9. **Sync/calendario ausentes**: principal brecha contra Structured.

## 5. Stack objetivo recomendado

### Núcleo gratis recomendado

- **GitHub**
  - Source of truth.
  - Issues, milestones, PRs.
  - GitHub Actions para checks.

- **Cloudflare**
  - Hosting/deploy.
  - Workers para API glue, healthchecks, cron simple.
  - Web Analytics gratis.
  - Headers/CSP.

- **Supabase Free**
  - Auth.
  - Postgres.
  - Row Level Security.
  - Sync/realtime cuando haga sentido.
  - Backups/export.

- **Frontend moderno**
  - Vite + React + TypeScript.
  - Vitest para lógica.
  - Playwright para flujos reales.

- **Local-first**
  - IndexedDB o Dexie como almacenamiento local robusto.
  - Cola de cambios para sync.

### Herramientas opcionales por fase

- Sentry Free: errores, con sampling/filtros.
- UptimeRobot / Better Stack Free: uptime.
- Resend Free: emails transaccionales si hace falta.
- ICS export/import: calendario antes de OAuth.
- Google Calendar API: fase posterior.
- Web Push: fase posterior, con mucho cuidado en iOS/PWA.

No usar primero:

- Plausible/Fathom pagados.
- PostHog cloud masivo sin control de eventos.
- Backend propio pesado en Workers si Supabase resuelve.

## 6. Estrategia de migración: no rewrite ciego

### Fase 0 — Baseline estable

Mantener la app actual como producción.

Gates:

```bash
node check.js
python3 rebuild.py
node verify-sprint2.js
node rt-test.js
```

Toda mejora legacy debe ser chica y verificable.

### Fase 1 — Dominio testeable

Extraer lógica pura antes que UI:

- fechas
- horas
- recurrencia
- parser NLP
- normalización de tasks/habits
- import/export
- storage adapters

Crear tests unitarios.

### Fase 2 — Vite + TypeScript en paralelo

Agregar app moderna al lado, sin romper producción:

- `app/` o `src-modern/`
- `vite.config.ts`
- `tsconfig.json`
- `src-modern/main.tsx`
- `src-modern/domain/*`
- `src-modern/components/*`

El legacy sigue deployando hasta que la moderna pase gates.

### Fase 3 — Compatibility layer

Durante transición, exponer compatibilidad si hace falta:

- `window.LOStore`
- `window.loParseCommand`
- `window.LIFE_PALETTE`

Esto permite migrar por islas.

### Fase 4 — Migrar UI por islas

Orden recomendado:

1. Theme/tokens/components UI.
2. Create task.
3. NLP Planner.
4. Timeline/Hoy.
5. Agenda semana/mes.
6. Stats.
7. Ajustes/export/import.

### Fase 5 — Switch controlado

- Generar `dist/` con Vite.
- Mantener `index.legacy.html` como fallback.
- Probar rutas y datos reales.
- Deploy moderno solo cuando supere legacy.
- Rollback documentado.

## 7. Módulos objetivo

```txt
core/date.ts
core/time.ts
core/ids.ts
core/result.ts

domain/tasks.ts
domain/recurrence.ts
domain/habits.ts
domain/routines.ts
domain/inbox.ts
domain/nlp/index.ts

data/schema.ts
data/migrations.ts
storage/localStorageAdapter.ts
storage/indexedDbAdapter.ts
store/lifeosStore.ts

sync/syncTypes.ts
sync/changeQueue.ts
sync/supabaseClient.ts
sync/supabaseSync.ts

notifications/browserNotifications.ts
calendar/ics.ts
calendar/googleCalendar.ts

theme/tokens.ts
theme/palette.ts
components/ui/*
components/task/*
layouts/MobileLayout.tsx
layouts/DesktopLayout.tsx
screens/today/*
screens/create-task/*
screens/agenda/*
screens/stats/*
screens/settings/*

testing/fixtures.ts
```

## 8. Modelo Supabase preliminar

No implementar aún sin revisar RLS, pero dirección sugerida:

- `profiles`
  - `id uuid primary key references auth.users`
  - `display_name`
  - `created_at`
  - `updated_at`

- `tasks`
  - `id uuid`
  - `user_id uuid`
  - `title`
  - `notes`
  - `date`
  - `start_time`
  - `duration_min`
  - `all_day`
  - `category`
  - `priority`
  - `status`
  - `recur_rule jsonb`
  - `completed_at`
  - `deleted_at`
  - `created_at`
  - `updated_at`

- `habits`
  - `id uuid`
  - `user_id uuid`
  - `name`
  - `icon`
  - `color`
  - `schedule jsonb`
  - `archived_at`
  - `created_at`
  - `updated_at`

- `habit_logs`
  - `id uuid`
  - `habit_id uuid`
  - `user_id uuid`
  - `date`
  - `done boolean`
  - `created_at`

- `settings`
  - `user_id uuid`
  - `data jsonb`
  - `updated_at`

- `sync_devices`
  - `id uuid`
  - `user_id uuid`
  - `device_name`
  - `last_seen_at`

Principios:

- RLS obligatoria por `user_id = auth.uid()`.
- `updated_at` en todo.
- `deleted_at` para soft delete y sync.
- UUIDs generados localmente para offline-first.
- Export/import siempre disponible aunque exista Supabase.

## 9. Gates de calidad

### Legacy actual

- `node check.js`
- `python3 rebuild.py`
- `node verify-sprint2.js`
- `node rt-test.js`
- Test puntual por bug/feature.
- Live smoke: HTTP 200 + tamaño esperado + sin errores críticos.

### App moderna

- `npm run typecheck`
- `npm run build`
- `npm run test`
- Playwright mobile + desktop smoke.
- Bundle size.
- Cold start medido.
- Migración localStorage → nuevo store.
- Screenshot checks para Today/Create/Agenda.

## 10. Roadmap recomendado

### Sprint 1 — Orden y control

- Consolidar documentos.
- Asegurar GitHub como source of truth.
- Crear issues/milestones.
- Definir scripts claros.
- Añadir CI básico.

### Sprint 2 — Cerrar bugs críticos legacy

- B-NLP-2 comandos compuestos.
- Backdrop no debe guardar tareas sucias.
- Saludo consistente.
- Conteos consistentes.
- Header sticky create overlap.

### Sprint 3 — S3 performance

- Sacar Babel-in-browser.
- React production build real.
- CSP/headers.
- Medir cold start antes/después.

### Sprint 4 — Dominio + tests

- Extraer NLP/recurrence/store a módulos testeables.
- Vitest.
- Fixtures reales.

### Sprint 5 — Vite/TS paralelo

- App moderna al lado.
- Componentes UI base.
- Theme tokens.
- Build moderno sin activar producción todavía.

### Sprint 6 — Supabase diseño e implementación inicial

- Crear proyecto Supabase solo si Boss confirma cuenta/free tier.
- Schema + RLS.
- Auth opcional.
- Sync experimental con tasks/settings.
- Export/import como seguro.

### Sprint 7 — Calendar / notifications

- ICS primero.
- Google Calendar después.
- Web Push / email reminders con límites claros.

## 11. Decisiones pendientes para Boss

1. Confirmar si usamos la cuenta Supabase existente o creamos proyecto nuevo.
2. Decidir acento visual principal: coral actual vs menta/teal premium.
3. Definir si GitHub repo será público o privado.
4. Confirmar si deploy final debe seguir en Workers actual o migrar a Cloudflare Pages cuando usemos Vite.
5. Decidir si auth será obligatoria o modo local-first sin cuenta + sync opcional.

## 12. Próxima acción recomendada

No partir todavía con Supabase. Primero:

1. Commit del playbook + plan maestro.
2. Crear inventario de scripts/tests actuales.
3. Crear GitHub Actions básico para `node check.js` + `python3 rebuild.py`.
4. Cerrar B-NLP-2 o B-UX-backdrop.
5. Después iniciar Fase 1: dominio testeable.
