# Bitácora

Registro fechado de los cambios importantes: qué se hizo, por qué, qué se verificó y qué queda.
Cada sesión de trabajo relevante añade una entrada arriba.

---

## 2026-10-11 — v2.1: lógica sólida e interfaz pulida (pasadas 2 y 3)

**Por qué.** Una auditoría de la v2.0 encontró fallos que las pruebas existentes no cubrían:
algunos corrompían datos, otros hacían que la app dijera cosas que no eran ciertas.

**Fallos corregidos**

- *Series anidadas.* Cambiar "Repetir" en un día de una tarea repetida convertía ese día en
  una segunda serie y dejaba ids con dos fechas que el resto del código leía mal. Ahora un día
  nunca se repite por sí mismo, y los datos que ya quedaron así se leen bien.
- *El planner inventaba.* "hola" creaba una tarea llamada "Hola"; "a las 8 de la noche" se
  agendaba a las 8 de la mañana; "reunión 19h" duraba 19 horas; "el 31 de febrero" caía en
  marzo; "el 15 de enero" en octubre quedaba en el pasado; los títulos perdían palabras
  ("Estudiar para la prueba" → "Estudiar prueba"). Cuando no entendía, respondía con frases de
  relleno que afirmaban haber agendado algo. Intérprete reescrito: lee cada trozo una sola vez
  y, si no entiende, lo dice.
- *Detalle con datos viejos.* Reabrir una tarea repetida ya completada seguía mostrándola como
  completada.
- *Hábitos.* La constancia de un hábito nuevo partía en 3 % aunque se cumpliera todos los
  días (contaba los 30 días anteriores a crearlo).
- *Modo enfoque.* El contador se atrasaba o se detenía con la app en segundo plano, y
  "completar" sobre una tarea ya hecha la reabría.
- *Agenda.* Cambiar de mes con el día 31 elegido dejaba una fecha inexistente.
- *Colores.* El selector ofrecía 12 colores de los que solo 6 eran distintos; un color
  desconocido en datos importados podía dejar la pantalla en blanco.
- *Iconos sugeridos.* "estudiar", "comprar" o "entrenar" nunca recibían su icono.
- *Búsqueda.* Tocar un resultado cerraba la búsqueda sin abrir la tarea.

**Qué cambió**

- *Tareas repetidas de verdad.* El detalle muestra la repetición real y permite elegir días
  de la semana. Cada edición se aplica a "solo este día" o a "toda la serie". Al eliminar se
  elige: este día, este y los siguientes, o toda la serie. "Dejar de repetir" conserva lo ya
  hecho.
- *Deshacer en vez de confirmar.* Eliminar una tarea, un hábito, un pendiente o lo que hizo
  una frase del planner se puede deshacer durante unos segundos. Las preguntas que quedan
  (borrar todo, reemplazar datos) son diálogos propios, no los del navegador.
- *Hoy.* La tira de la semana es navegable: se puede ver y planificar cualquier día. Marcador
  de "ahora", tarea en curso con minutos restantes, y el día cambia solo a medianoche. En el
  teléfono la lista del día sube unos 350 px: hábitos y fechas límite pasaron a ser compactos.
- *Planner.* Se llama "Planner" (ya no "IA"). Nuevo: varios días ("martes y jueves"),
  "15/11", "en 3 días", "por la tarde", "¿qué tengo mañana?", mover a otro día, aviso cuando
  una tarea se cruza con otra.
- *Escritorio.* Las hojas son diálogos centrados; atajos `N` (nueva tarea), `/` (buscar),
  `T` (hoy), `Esc` (cerrar).
- *Accesibilidad.* Nombres para todos los botones de solo icono, foco visible con teclado,
  foco atrapado en diálogos, tarjetas operables con teclado, barras de desplazamiento con
  ratón.
- *Ajustes.* Espacio usado, fecha del último respaldo y aviso si tiene más de un mes. Se
  retiró "Sync entre dispositivos · Pronto": no hay nada en camino (ver DECISIONES).
- *Robustez.* Colecciones dañadas se leen como vacías; horas y duraciones inválidas se
  corrigen al leer; un respaldo de una versión más nueva se rechaza sin tocar nada.

**Cómo se verificó**

- 60 pruebas de lógica (38 nuevas: series, deshacer, planner, hábitos). Los 594 resultados de
  referencia se regeneraron y cada diferencia se revisó: todas son correcciones deliberadas.
- 28 pruebas de navegador por tamaño de pantalla (7 nuevas: navegar días, editar y eliminar
  series, abrir una serie desde la búsqueda, deshacer, planner, enfoque), en teléfono y
  escritorio.
- La prueba de actualización sigue pasando: el formato de los datos guardados no cambió y la
  versión nueva no reescribe nada al arrancar. La única clave nueva es
  `lifeos.lastBackupAt`.

**Qué queda**

- La lista "Todo el mes" tarda en dibujarse con cientos de tareas.
- Arrastrar tareas para moverlas de hora; editar varios pasos a la vez.
- Los avisos siguen necesitando la app abierta.
- Sonido; capturas del README en tema claro.

---

## 2026-10-10 — v2.0: cimientos nuevos (pasada 1 de 3)

**Por qué.** La app funcionaba, pero sobre una base frágil: un único `index.html` generado a
partir de sí mismo, sin módulos, sin verificación automática, y con promesas que no cumplía
(se describía como "offline-first", pero no abría sin conexión ni era instalable).

**Qué cambió**

- *Build.* Los archivos de `src/` pasan a ser módulos ES y el sitio se construye con Vite en
  `dist/`. Desaparece el cargador que descomprimía el código en el navegador: ya no hay
  destello claro, ni texto "Unpacking…", ni un primer dibujo a 980 px de ancho en el teléfono.
- *Sin conexión e instalable.* Service worker propio (red primero para la página, caché para
  los archivos con hash), manifest correcto, iconos enlazados y tipografías servidas desde el
  propio sitio (antes venían de Google Fonts).
  Cuando se publica una versión nueva con la app abierta, aparece un aviso para actualizar.
- *Seguridad.* Cabeceras HTTP con una política de contenido estricta (sin scripts en línea ni
  `eval`); solo se publica `dist/`, por lista blanca.
- *Lógica en TypeScript.* Tareas, repetición, hábitos, respaldo y el intérprete de frases
  viven en `src/domain/`, sin dependencias de la interfaz y con reloj inyectable.
- *Rendimiento.* Lectura con caché e índice por fecha. Con 3.000 tareas y un teléfono lento
  simulado, abrir la Agenda bajó de 1,08 s a 0,2 s y tocar un día de 0,52 s a 0,04 s.
- *Avisos.* Las notificaciones se emiten a través del service worker, que es la única vía que
  aceptan los teléfonos. Siguen necesitando la app abierta.
- *Datos protegidos.* Tras el primer guardado se pide al navegador almacenamiento persistente.
- *Errores.* Una pantalla de recuperación sustituye a la página en blanco si algo falla.
- *Limpieza.* Unas 900 líneas sin uso fuera (pantallas de demostración, variantes, panel de
  diseño heredado). Las notas internas de trabajo salieron del repositorio.

**Fallos corregidos de paso**

- El interruptor "Modo oscuro" de Ajustes no podía apagar el modo oscuro (recibía el evento
  del clic en vez del valor). En el teléfono era la única forma de cambiar de tema.
- Un carácter de control dentro de `lifeos-icons.jsx` hacía que las herramientas de búsqueda
  ignoraran el archivo entero.
- Datos guardados corruptos ya no impiden abrir la app.

**Cómo se verificó**

- 594 resultados de referencia capturados ejecutando la lógica de la versión en producción
  (198 operaciones del store y 396 frases del planner): la versión nueva los reproduce todos.
- Prueba de actualización: la página que estaba en producción crea datos variados y la versión
  nueva, en el mismo origen, los lee idénticos y no reescribe nada al arrancar.
- 21 pruebas de navegador en teléfono y escritorio (arranque, cabeceras, flujos, respaldo,
  sin conexión, aviso de versión nueva, caída del servidor) y 22 pruebas de lógica. La
  integración continua de GitHub las repite en cada cambio, también con el motor de Safari.
- La rama se probó además en una vista previa servida por Cloudflare: mismo build, byte a
  byte, que el generado en local.
- Auditoría independiente de solo lectura antes de publicar: apto, con una observación
  aplicada (ante un error del servidor, la app abre con la copia guardada).

**Qué queda** (pasadas 2 y 3)

- Tareas repetidas en la interfaz: el detalle no muestra la repetición real, no se puede
  editar ni borrar la serie completa y solo se ofrece "entre semana" al crear.
- El planner interpreta mal varias frases comunes y responde con evasivas cuando no entiende.
- "Hoy" no permite ver otros días ni se actualiza solo al pasar la medianoche.
- La lista "Todo el mes" tarda en dibujarse cuando el mes tiene cientos de tareas.
- Identidad visual, sonido y animaciones; accesibilidad; capturas nuevas del README.

---

## Historia anterior (resumen)

- **Abril 2026.** Primera versión como app de hábitos; primeros despliegues en Cloudflare. Un
  service worker con caché agresiva dejó a usuarios viendo versiones viejas y se desactivó.
- **Mayo 2026.** Rediseño hacia planner con línea de tiempo; persistencia local.
- **Junio 2026.** Agenda mensual y semanal, rutinas, fechas límite, temas, hábitos con mapa de
  consistencia, emojis como iconos, precompilación del JSX y primera política de contenido.
- **Septiembre 2026.** Auditoría de fiabilidad: repeticiones, importación con validación y
  vuelta atrás, comandos destructivos del planner, recordatorios; primeras pruebas
  automáticas.
