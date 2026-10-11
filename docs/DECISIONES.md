# Decisiones

Decisiones de producto y de ingeniería que conviene no volver a discutir sin un motivo nuevo.

## Producto

- **Local primero, sin cuentas.** Los datos viven en el dispositivo. Es la promesa central y
  también el límite: no hay sincronización. Sincronizar exigiría servidor, cuentas y una
  revisión de seguridad; se trata como un proyecto aparte, no como una mejora incremental.
- **Tres preguntas por pantalla.** Cada pantalla debe ayudar a responder al menos una: ¿qué
  tengo que hacer hoy?, ¿qué hábito estoy sosteniendo?, ¿cómo voy? Lo que no ayuda, sobra.
- **Sin gamificación ruidosa.** Nada de puntos, niveles ni rankings. El progreso se muestra
  de forma sobria.
- **Un solo acento.** El rojo de marca manda; el color extra solo aparece cuando significa
  algo (prioridad, tema, color propio de una tarea).
- **Iconos = emojis del sistema.** Se leen al instante y cada plataforma los dibuja bien.
- **Teléfono y escritorio por igual.** Una columna en teléfono; barra lateral y tablero en
  pantallas anchas. Mismo código.
- **El planner por frases es honesto.** Es un intérprete de reglas: no debe decir que hizo
  algo que no hizo ni presentarse como un modelo de lenguaje.
- **La bandeja es la lista de recordatorios.** Pendientes sin formulario, separados de las
  tareas con hora; se potencia la bandeja existente en vez de crear otra cosa.
- **Español neutro, de tú.**

## Ingeniería

- **Gratis primero.** GitHub y el plan gratuito de Cloudflare. Cualquier servicio con costo
  o con riesgo de cobro se decide antes, no después.
- **Sitio estático.** Sin backend mientras el producto no lo necesite.
- **Lógica separada de la interfaz** y con pruebas que no necesitan navegador.
- **Los datos existentes son intocables.** Todo cambio de formato lleva migración y prueba de
  actualización desde la versión anterior real.
- **Service worker con "red primero" para la página.** Un intento anterior con caché agresiva
  dejó a gente viendo versiones viejas; por eso la página se pide siempre a la red y la caché
  es solo el respaldo sin conexión.
- **Verificar lo publicado.** Un despliegue no está terminado hasta comprobar la versión
  servida (ver [DESPLIEGUE.md](DESPLIEGUE.md)).
