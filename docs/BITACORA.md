# Bitácora

Registro fechado de los cambios importantes: qué se hizo, por qué, qué se verificó y qué queda.
Cada sesión de trabajo relevante añade una entrada arriba.

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
