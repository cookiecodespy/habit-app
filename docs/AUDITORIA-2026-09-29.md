# LifeOS: reconstrucción y auditoría del 29 de septiembre de 2026

## Qué versión se está mejorando

La aplicación canónica es https://habit-app.tomas-sotz.workers.dev y su repositorio es
https://github.com/cookiecodespy/habit-app, rama `main`.
Al iniciar esta revisión, el HTML de producción coincidía byte por byte con el de
`5d79255` (SHA-256 `b643cc2bc9192ca02e63a2edf13f7a3992df482fca62c916a165181d66fcd96d`).
El check de GitHub `Workers Builds: habit-app` confirmó la integración con Cloudflare.
La documentación antigua que recomienda Pages es orientativa: el despliegue observado es Workers.

## Cronología reconstruida

| Fecha | Evidencia | Evolución |
|---|---|---|
| 22 abril | `aa9e4aa`, `b4bd1e2`, `b5358e9` | Nace Boss Mode; primeros despliegues; problemas de versiones cacheadas y desactivación del service worker. |
| 23 abril | `e9cc599` | Rediseño hacia Life OS. |
| 28 abril | `65a2ac6`, `83dfb48`, `053ba00` | Importación de diseños ZIP, correcciones para publicar el bundle correcto. La copia externa de abril pertenece a esta etapa. |
| 13 mayo | `66bdc8c` a `a1ae84e` | Planner v3/v4, export de Claude Design, timeline y rediseños de navegación/inbox. |
| 24–26 mayo | `5d76ec0` a `0854721` | Nuevas importaciones ZIP, fecha real, persistencia, fallback del asistente y móvil. |
| 2–4 junio | `f865258`, `c658b40`, `f998efd`, `448a4b8` | Agenda, rutinas, deadlines, subtareas, sidebar y corrección del parser de miércoles. |
| 6–7 junio | `0f3c939`, `9aa6a77`, `2338819`, `5d9f462` | Emojis, precompilación JSX, CSP, pestaña Hábitos y pulido. Babel en navegador ya fue eliminado. |
| 11–12 junio | `5d79255`, fecha de push en GitHub | Últimos cambios remotos previos a esta auditoría; esta versión seguía publicada. |
| 12 agosto | Referencia en sesiones locales de migración | Existe una copia Ubuntu `proyectos/lifeos`, commit reportado `47f212c`, con inicio de criterios MiBarber. No se pudo abrir la partición: requiere autenticación presencial. No se afirma que esos cambios estén incluidos aquí. |
| 29 septiembre | Esta revisión | Continuación desde la versión **verificada en producción**, con correcciones y pruebas reproducibles. |

Se consultaron sesiones locales de Claude y Codex de Omarchy, notas del repositorio,
historial Git, copia externa de abril y la aplicación publicada. Las sesiones originales
de Ubuntu permanecen inaccesibles. No se infiere qué modelo escribió cada línea a partir
de recuerdos o nombres del producto.

## Fallos reproducidos y corregidos

- **Alta — recurrencias:** borrar una ocurrencia no evitaba su regeneración; moverla conservaba la fecha visual anterior y la ocultaba en el destino. Ahora los overrides se muestran por fecha real y las cancelaciones suprimen solo esa ocurrencia. Borrar una serie elimina también sus overrides.
- **Alta — importación:** validación incompleta permitía datos que rompían el render y escrituras parciales. Ahora todas las colecciones se validan antes, se serializan y se restauran las escrituras anteriores si una posterior falla. Si incluso el rollback falla, se informa expresamente; localStorage no ofrece transacciones ni protección frente a cierre abrupto durante escritura.
- **Alta — comandos destructivos:** coincidencias por una sola palabra y títulos idénticos podían elegir una tarea arbitraria. Ahora se exige una coincidencia suficiente y los empates se rechazan.
- **Media — completar/mover por texto:** `completa gym` se interpretaba como creación; repetir completar reabría la tarea; mover incluía el verbo y la hora en la búsqueda. Corregido.
- **Media — fechas:** `esta mañana` se interpretaba como mañana y `el 29` en el propio día 29 saltaba de mes según la hora. Corregido.
- **Media — rutinas:** al cruzar medianoche se conservaba la fecha anterior. Se avanza de fecha y se consideran colisiones del día siguiente y tareas nocturnas del anterior.
- **Media — guardado fallido:** se notificaba un cambio incluso cuando el navegador rechazaba persistirlo; el llamador podía continuar con un mensaje de éxito. Ahora el error se propaga y no se emite actualización exitosa.
- **Media — campos legacy:** no se podía vaciar una nota ni desactivar un recordatorio heredado por los aliases `subtitle`/`alarm`. Corregido.
- **Media — notificaciones:** se ignoraba `reminder`, se incluían tareas all-day y conceder permiso con la app abierta no activaba el intervalo. Se respetan preferencias y cambios de permiso; los avisos siguen requiriendo la app abierta.
- **Media — acceso a rutinas:** el día vacío ocultaba el menú móvil y el escritorio no tenía el flujo. Ambos disponen del menú Añadir y rutinas.
- **Media — menú de voz:** cambiar al asistente dejaba el menú abierto sobre la pantalla. Corregido.
- **Baja — saludo:** el sidebar ahora usa la hora real, igual que la cabecera.
- **Baja — posponer/reinicio:** posponer 30 minutos al final del día ahora cambia la fecha; reiniciar la app incluye las rutinas guardadas.

## Calidad de las comprobaciones

Se añadieron 17 pruebas deterministas de datos y notificaciones. Las 15 pruebas iniciales
del store fallaban contra la versión original. Se incorporó un flujo con Chromium en
390×844 y 1440×900: onboarding, rutinas, menú de voz, creación, recarga, recurrencia y restauración.
Cada ejecución usa contextos aislados y datos sintéticos: no se manipulan datos personales.

También se ejecutaron los verificadores históricos de arranque/CSP, NLP, agenda, all-day,
creación, deadlines, heatmap, rutinas, semana y Sprint 2. Se corrigió el test de agenda que
sembraba tareas fuera del mes al llegar a fin de mes, y el de rutinas que antes toleraba no
abrir la pantalla. Esos dos ahora fallan con código no cero si no cumplen su condición.
`rt-test.js` es diagnóstico legado, contiene selectores obsoletos y no se cuenta como aprobado;
el nuevo `npm run test:browser` es el flujo automatizado mantenido.

Las herramientas de desarrollo ahora tienen package.json y lockfile versionados.
Se fijó `undici` en 7.29.1 por la alerta de npm audit de su dependencia transitiva en Wrangler;
la instalación verificada devuelve 0 vulnerabilidades conocidas. Esto no equivale a una
auditoría de todas las librerías embebidas del bundle ni a una garantía de seguridad.
El build gzip es determinista (mtime=0). Las carpetas de pruebas no se sirven como assets.

## Límites y pendientes reales

1. Contrastar el trabajo Ubuntu de agosto cuando sea accesible; no sobreescribirlo.
2. Persistencia local por navegador: no hay cuentas ni sincronización entre dispositivos.
3. Notificaciones en segundo plano/cerrada no están implementadas. La UI ahora declara el límite.
4. Parser offline con gramática limitada: comandos compuestos, fechas imposibles y expresiones complejas necesitan otra pasada; no presentarlo como un LLM general.
5. Importar no coordina escrituras simultáneas entre pestañas. No es una base transaccional.
6. No se probó Safari/iPhone real, únicamente Chromium con tamaños móvil y escritorio.
7. Revisión realizada por un solo agente; no hubo auditor independiente disponible fuera de Herdr.
8. No se reescribió la arquitectura, no se añadió backend ni servicios de pago, y no se reactivó caché agresiva.

## Retomar

Leer este documento antes que las notas de junio. Ejecutar `npm ci`, `npm test`,
`npm run build`, `npm run test:browser`. Inspeccionar el diff y verificar producción
tras publicar: un push exitoso no es prueba de que el usuario recibe la versión nueva.
