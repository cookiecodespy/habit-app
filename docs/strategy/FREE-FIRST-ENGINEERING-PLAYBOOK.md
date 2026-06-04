# Free-first Engineering Playbook — LifeOS / Habit App

> Inicio formal: 2026-06-03 21:34 America/Santiago.  
> Contexto: continuación del trabajo de Claude Code; Boss pidió tomar este proyecto como caso serio y reutilizable para futuros proyectos.

## Principios

1. **Gratis primero**
   - Usar free tiers y herramientas open-source siempre que sea razonable.
   - Si una herramienta tiene costo, riesgo de cobro, trial limitado o requiere tarjeta con posibilidad de cargo, Jared debe consultar a Boss antes.

2. **Arquitectura antes de features grandes**
   - No seguir acumulando lógica en un bundle gigante.
   - Antes de Supabase/sync/IA real: definir módulos, modelo de datos, gates y estrategia de migración.

3. **Incremental, verificable, desplegable**
   - Cambios chicos.
   - Cada pasada debe cerrar con checks/rebuild/tests aplicables.
   - Deploy al cierre si Boss lo pide o si la pasada queda estable.

4. **Proyecto como plantilla de aprendizaje**
   - Todo patrón bueno que aprendamos aquí se debe documentar para replicarlo en futuros proyectos.
   - Mantener decisiones, tradeoffs y errores en docs, no solo en memoria conversacional.

5. **Local-first + sync cuando tenga sentido**
   - La app debe funcionar offline.
   - Supabase se usará para sync/auth/datos multi-dispositivo si el diseño de datos y RLS quedan claros.

## Stack objetivo preliminar

- GitHub: source of truth, issues, milestones, actions.
- Cloudflare: hosting/deploy, Workers/API ligera, headers/CSP, eventualmente cron/R2 si aplica.
- Supabase: Auth, Postgres, RLS, Realtime/sync, backups/export.
- Vite + React + TypeScript: reemplazar Babel-in-browser y modularizar.
- IndexedDB/local-first: almacenamiento offline robusto antes de sincronizar.
- Playwright/Vitest: regresión de flujos y lógica crítica.

## Gates mínimos por pasada

- `node check.js` mientras exista arquitectura actual.
- `python3 rebuild.py` tras tocar `src/*.jsx` mientras exista bundle embebido.
- Test/regresión específico del bug o feature.
- `git diff` revisado antes de commit.
- Handoff actualizado si la pasada cambia dirección, arquitectura o estado.

## Decisión de costo

Cualquier herramienta no claramente gratis requiere confirmación explícita de Boss antes de usarse.
