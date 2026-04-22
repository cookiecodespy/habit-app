# Deploy Lessons - Boss Mode

Fecha: 2026-04-22

## Qué pasó
Durante los primeros deploys, la app mostró versiones viejas aunque el código local y GitHub sí tenían cambios nuevos.

## Causa principal
El problema vino de una combinación de factores:

1. **Service worker demasiado temprano**
   - Se agregó cacheo offline/PWA mientras la app aún estaba cambiando rápido.
   - Eso hizo que clientes siguieran viendo assets viejos.

2. **Validación insuficiente del deploy visible**
   - Se asumió que `push + deploy` significaba que el usuario ya estaba viendo la versión nueva.
   - Faltó una verificación explícita del contenido visible servido.

3. **Flujo de Cloudflare poco ordenado al inicio**
   - Hubo mezcla entre panel web, deploy manual y deploy por CLI.
   - También se creó una URL alterna de diagnóstico (`habit-app-v3`) que sirvió para aislar el problema, pero no debe ser parte del flujo normal final.

## Qué se hizo para corregirlo
1. Se verificó que el código local y `origin/main` sí tenían los cambios.
2. Se usó una URL alterna solo para diagnóstico y confirmar que Cloudflare sí podía servir la versión nueva.
3. Se saneó el deployment principal `habit-app`.
4. **Se desactivó el service worker** para evitar cache agresiva durante esta etapa de iteración.
5. Se mantuvo una **versión visible en UI** para validar rápido si un cambio realmente llegó.

## Regla de trabajo desde ahora
### Mientras la app siga iterándose rápido:
- **No reactivar service worker**.
- No meter cache offline agresivo.
- Siempre dejar una **versión visible arriba** (`vX.Y`).
- Después de cada cambio importante:
  1. commit
  2. push
  3. deploy
  4. verificar marcador visible en UI

## Flujo recomendado
1. Editar localmente
2. `git status`
3. `git add ... && git commit ...`
4. `git push`
5. `wrangler deploy`
6. Verificar en la URL canónica:
   - `https://habit-app.tomas-sotz.workers.dev`
7. Confirmar visualmente:
   - número de versión
   - badge de release si aplica
   - cambio visible esperado

## URL canónica
- `https://habit-app.tomas-sotz.workers.dev`

## URL de diagnóstico creada durante incidente
- `https://habit-app-v3.tomas-sotz.workers.dev`

Mantenerla solo como referencia temporal. Idealmente después limpiar o dejar de usar.

## Próxima mejora de proceso
- Definir una convención fija de versiones visibles.
- Agregar una mini sección de build/version en UI más elegante.
- Cuando la UI esté más estable, recién ahí evaluar reactivar PWA/service worker.
