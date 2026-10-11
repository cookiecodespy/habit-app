# Despliegue

- **Sitio:** https://habit-app.tomas-sotz.workers.dev (Cloudflare Workers, solo archivos estáticos).
- **Origen:** rama `main` de este repositorio.
- **Mecanismo:** la integración de GitHub con Cloudflare (*Workers Builds*) publica cada commit
  de `main`. Ejecuta `npx wrangler deploy`, que lee `wrangler.jsonc`, corre `npm run build` y
  sube `dist/`. El resultado aparece en el commit como el check **Workers Builds: habit-app**.

No hace falta acceso a Cloudflare para publicar: basta con llevar el cambio a `main`.

## Antes de llevar un cambio a `main`

1. Trabajar en una rama y abrir un pull request.
2. Esperar a que pase la integración continua (`.github/workflows/ci.yml`): lint, tipos,
   pruebas de lógica, build y pruebas de navegador (Chromium móvil y escritorio, WebKit móvil).
   En local es `npm run check`.
3. Si el cambio toca cómo se guardan los datos, la prueba de actualización
   (`tests/e2e/actualizacion.spec.ts`) debe seguir pasando: es la que garantiza que quien ya
   usa la app no pierde nada.
4. Dejar una entrada fechada en [BITACORA.md](BITACORA.md).

## Después de publicar

Un push correcto no demuestra que la gente reciba la versión nueva. Comprobarlo:

1. El check **Workers Builds: habit-app** del commit termina en verde.
2. La versión servida es la del commit. En **Ajustes**, al pie, aparece la fecha y el hash
   corto del commit publicado (`AAAA.MM.DD · abc1234`).
3. Las pruebas de navegador pasan contra producción (usan contextos aislados y datos
   sintéticos; no tocan datos de nadie):

   ```bash
   TEST_URL=https://habit-app.tomas-sotz.workers.dev npm run test:e2e
   ```

## Volver atrás

- Revertir el commit en `main` (`git revert`) y hacer push: se publica la versión anterior.
- O, desde el panel de Cloudflare, elegir una versión anterior del Worker y promoverla.

El service worker pide siempre la página a la red, así que quien tenga conexión recibe la
versión restaurada en su siguiente visita.

### Interruptor de emergencia del service worker

Si alguna vez un service worker defectuoso llegara a producción, publicar un `sw.js` que se
elimine a sí mismo:

```js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const name of await caches.keys()) await caches.delete(name);
  await self.registration.unregister();
  for (const client of await self.clients.matchAll()) client.navigate(client.url);
})()));
```

## Qué no cambiar

- **El dominio.** Los datos de cada persona viven en el almacenamiento del navegador asociado
  a `habit-app.tomas-sotz.workers.dev`. Mover la app a otro dominio la deja sin datos.
- **Las claves y el formato de `localStorage`** sin una migración probada (ver
  [ARQUITECTURA.md](ARQUITECTURA.md)).
