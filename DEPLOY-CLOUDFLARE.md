# Despliegue verificado — LifeOS

- Repositorio: `cookiecodespy/habit-app`, rama `main`.
- Worker: `habit-app` (coincide con `wrangler.jsonc`).
- URL canónica: https://habit-app.tomas-sotz.workers.dev
- Integración existente: GitHub → **Workers Builds: habit-app**. No es un proyecto Pages.

Antes de publicar: `npm ci`, `npm test`, `npm run build`, `npm run test:browser`,
`npx wrangler deploy --dry-run`; inspeccionar el diff y versionar el `index.html` generado.
Un push a main activa la integración existente. Esperar el check y verificar que el
HTML servido coincide con el local; revisar el marcador `2026.09.29` en Ajustes.

Las claves localStorage existentes se conservan. No cambiar de dominio como solución
al despliegue: los datos del usuario pertenecen al origen original.

El despliegue manual `npx wrangler deploy` requiere autenticación Cloudflare. La sesión
local de Omarchy no estaba autenticada durante la auditoría. No se crearon tokens ni
se cambiaron controles de acceso.

Referencia: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
