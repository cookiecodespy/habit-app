# Arquitectura

LifeOS es un sitio estático: no hay servidor de aplicación ni base de datos. El navegador
descarga la app, y a partir de ahí todo ocurre en el dispositivo.

## Capas

```
src/
  main.jsx              arranque: monta la app, quita el splash, registra el service worker
  styles.css            fuentes, tokens, base y primitivas de animación
  domain/               LÓGICA Y DATOS — TypeScript estricto, sin React ni DOM
    clock.ts            única fuente de "ahora" (las pruebas fijan el reloj)
    dates.ts            fechas y horas locales como texto ('YYYY-MM-DD', 'HH:MM')
    types.ts            formas de los datos guardados
    storage.ts          lectura/escritura, avisos de cambio, errores de guardado
    tasks.ts            normalización, repetición, lectura con caché e índice por fecha
    store.ts            LOStore: toda modificación de datos pasa por aquí; respaldo
    habits.ts           cuándo toca un hábito, rachas y constancia
    categories.ts       temas e icono/color sugeridos por el título
    nlp.ts              intérprete de frases en español → acción sobre el store
    reminders.ts        qué tareas merecen aviso ahora
  store-hooks.js        enlace con React: re-render cuando cambian los datos
  lifeos-*.jsx          INTERFAZ — pantallas y componentes
  pwa.js                registro del service worker y almacenamiento persistente
  sw.template.js        plantilla del service worker (se completa en el build)
public/                 manifest, iconos y cabeceras HTTP (_headers)
tests/unit/             pruebas de la lógica (Vitest)
tests/e2e/              pruebas en navegador (Playwright)
```

La interfaz importa de `domain/`; `domain/` no importa nada de la interfaz. Una regla de
ESLint impide que el dominio lea el reloj del sistema directamente.

## Datos

Todo se guarda en `localStorage`, en estas claves:

| Clave | Contenido |
|---|---|
| `lifeos.tasks.v2` | tareas (incluye series repetidas y sus excepciones por día) |
| `lifeos.habits.v1` | hábitos y los días en que se cumplieron |
| `lifeos.inbox.v1` | pendientes de la bandeja |
| `lifeos.routines.v1` | rutinas creadas por la persona |
| `lifeos.user` | nombre |
| `lifeos.tweaks` | tema, acento y densidad |

**Las claves y el formato son un contrato.** Los datos de quien ya usa la app pertenecen al
origen `habit-app.tomas-sotz.workers.dev`; cambiar el dominio o el formato sin migración
equivale a borrarle los datos. La prueba `tests/e2e/actualizacion.spec.ts` carga la versión
anterior real, crea datos con ella y exige que la versión actual los lea idénticos.

### Tareas repetidas

Una serie se guarda una sola vez, con `recur`. Sus días son *virtuales*: se calculan al mirar
una fecha y su id es `<id de la serie>@<fecha>`. Solo cuando un día concreto cambia (se
completa, se edita, se borra) se guarda un registro propio para ese día, con `_from` apuntando
a la serie. Un día borrado deja una lápida (`_deleted`) para que no reaparezca.

### Lectura con caché

Leer la lista completa y normalizarla en cada consulta hacía la Agenda más lenta cuanto más se
usaba la app. Ahora la lista se interpreta una vez por valor guardado y se indexa por fecha.
Los registros que entrega el store están congelados: nada puede corromper la caché por
accidente, y cada escritura parte de una copia nueva.

## Sin conexión

El service worker se genera en el build con la lista de archivos del sitio y un nombre de
caché derivado de su contenido.

- **La página** se pide siempre primero a la red: con conexión se recibe la versión más
  reciente. La copia guardada solo responde si la red falla o tarda más de 4 segundos.
- **Los archivos de `/assets/`** llevan un hash en el nombre y no cambian nunca: se sirven
  desde la caché.
- Al publicar una versión nueva, el worker nuevo toma el control, borra las cachés antiguas y
  la app ofrece recargar.

Esta estrategia evita servir versiones viejas a quien tiene conexión, que fue el problema de
un primer intento con caché agresiva.

## Seguridad

Las cabeceras se definen en `public/_headers` y Cloudflare las aplica a cada respuesta:

- `Content-Security-Policy` sin scripts en línea, sin `eval` y sin orígenes externos.
- `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
- Solo se publica `dist/`: código fuente, pruebas y documentación no son accesibles.

Las pruebas de `tests/e2e/arranque.spec.ts` comprueban cabeceras y que los archivos internos
responden 404.

## Límites conocidos

- Sin sincronización: cada navegador tiene sus propios datos.
- Los avisos de tareas solo se emiten mientras la app está abierta o recién en segundo plano;
  avisar con la app cerrada exigiría un servidor de notificaciones.
- El planner por frases tiene una gramática limitada.
- `localStorage` no es transaccional entre pestañas: dos pestañas escribiendo a la vez pueden
  pisarse.
