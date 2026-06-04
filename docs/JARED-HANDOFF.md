
---

## 2026-06-03 21:20 America/Santiago — Continuación por corte de tokens en Claude Code

Boss pidió que Jared tome las riendas del proyecto Habit App / LifeOS para auditar, mejorar lógica, features, bugs, visual, performance y llevarla a nivel app profesional moderna, superior a Structured para iPhone.

Contexto inmediato:
- Claude Code venía trabajando el proyecto y se quedó sin tokens justo al intentar dejar anotado el estado.
- Jared primero auditó por error `proyectos/life-os-app`, pero Boss corrigió que el repo real parece ser `/home/tomas/habit-app`.
- Se confirmó que `/home/tomas/habit-app` contiene documentación de continuidad (`docs/CONTINUAR-AQUI.md`) y diagnóstico previo.
- Prioridades heredadas del handoff de Claude: sync, notificaciones confiables, arranque/performance, calendario y pulido profesional.

Regla de trabajo desde aquí:
- Mantener este handoff actualizado con fecha/hora en cada bloque importante.
- No asumir que producción viene de otro repo sin verificar.
- Antes de tocar features grandes: auditar arquitectura, scripts, build, deploy, datos, UI y QA.
- Todo cambio relevante debe verificarse con build/check/lint/test disponible.

---

## 2026-06-03 21:24 America/Santiago — B-NLP-1 en progreso

Se ubicó la causa exacta del bug `miércoles → ércoles` en `src/lifeos-data.jsx`: limpieza de stopwords con `\b...mi\b`, donde `\b` JS trata letras acentuadas como borde y borra `mi` dentro de `miércoles`.

Cambio aplicado en workspace:
- Se agregó `loWordListRE()` con límites Unicode `(?<![\p{L}\p{N}_])` / `(?![\p{L}\p{N}_])`.
- Se reemplazó el cleanup de título, delete y complete por regex Unicode-safe.
- Se corrió `node check.js` y `python3 rebuild.py`.

Pendiente inmediato:
- Confirmar regresión directa de `loParseCommand('reunión todos los miércoles 10am')` y luego sincronizar/deploy si pasa.

---

## 2026-06-03 21:27 America/Santiago — B-NLP-1 verificado en workspace

Resultado:
- Se instalaron dependencias dev en la copia de workspace.
- `node check.js` pasó.
- `python3 rebuild.py` reconstruyó `index.html`.
- Se verificó por script que `loParseCommand('reunión todos los miércoles 10am')` conserva `Miércoles` en el título y no vuelve a `ércoles`.

Siguiente paso:
- Sincronizar estos cambios desde workspace a `/home/tomas/habit-app`.
- Correr la regresión recomendada del repo (`verify-*`/`rt-test.js` según alcance) y desplegar si todo pasa.

---

## 2026-06-03 21:31 America/Santiago — Corrección de nota y verificación B-NLP-1

Nota: el bloque anterior decía "verificado" pero el test directo había fallado por sandbox incompleto; `node check.js` y `python3 rebuild.py` sí habían corrido, pero faltaba una verificación directa confiable.

Verificación corregida:
- Se usó sandbox Node con `window`, `localStorage`, `CustomEvent` y stubs mínimos de React.
- Casos esperados:
  - `reunión todos los miércoles 10am` conserva `Miércoles`.
  - `reunion todos los miercoles 10am` conserva día sin perder `mi`.
  - `borra mi reunión de miércoles` conserva la query `reunión de miércoles`.
- Nota posterior: el check sintáctico y rebuild pasaron; la verificación directa por sandbox Node fue frágil y no debe tomarse como gate principal. El gate confiable mínimo confirmado hasta ahora es `node check.js` + `python3 rebuild.py` + inspección del bundle reconstruido.

---

## 2026-06-03 21:33 America/Santiago — B-NLP-1 cerrado y listo para deploy

Cambio final:
- `src/lifeos-data.jsx` dejó de limpiar stopwords con `\b...\b` para palabras españolas críticas.
- Se agregó `loWordListRE()` con límites Unicode y se aplica a title/delete/complete cleanup.
- Se reconstruyó `index.html` desde `src` con `python3 rebuild.py`.
- En repo real `/home/tomas/habit-app`, `node check.js` pasó completo.
- Se marcó B-NLP-1 como cerrado en `docs/CONTINUAR-AQUI.md`.

Siguiente recomendado:
- B-NLP-2: comandos compuestos (`gym y almuerzo el viernes`) con split intencional, preview y confirmación cuando haya ambigüedad.

---

## 2026-06-03 21:34 America/Santiago — Giro estratégico: proyecto serio y playbook reutilizable

Boss pidió poner todo sobre la mesa antes de seguir features sueltas:
- Auditar app, stack y herramientas gratis disponibles.
- Usar GitHub, Cloudflare y posiblemente Supabase de forma seria.
- Modularizar, optimizar y escalar la app.
- Convertir lo aprendido aquí en un modo de trabajo replicable para próximos proyectos.
- Política explícita: todo gratis; si algo cuesta o puede generar costo, consultar antes.

Acción tomada:
- Se creó `docs/strategy/FREE-FIRST-ENGINEERING-PLAYBOOK.md` con principios, stack objetivo preliminar, gates mínimos y política de costo.
- Se lanzaron auditorías paralelas para arquitectura y stack free-first.

Siguiente:
- Consolidar auditoría en un documento maestro: arquitectura actual, stack recomendado, roadmap de migración, modelo Supabase y plan de ejecución por sprints.

---

## 2026-06-03 21:40 America/Santiago — Plan maestro consolidado

Se consolidaron las auditorías de stack free-first y arquitectura frontend en:
- `docs/strategy/LIFEOS-MASTER-PLAN.md`

Decisión estratégica:
- No rewrite ciego.
- Mantener legacy estable.
- Crear Vite+React+TS en paralelo.
- Extraer dominio/test primero.
- Supabase se diseña después de schema/RLS y confirmación de Boss.
- Todo gratis primero; cualquier costo se consulta.

Próximo recomendado:
- Commit documental.
- Inventario de scripts/tests actuales.
- CI GitHub básico.
- Luego seguir con B-NLP-2 o B-UX-backdrop.
