# 🚀 INSTRUCCIONES DE DEPLOY — Life OS
# Para OpenClaw / Cloudflare Pages
# Tomás — 28/4/2026

═══════════════════════════════════════════════════
 ARCHIVOS A SUBIR AL REPO: cookiecodespy/habit-app
═══════════════════════════════════════════════════

REEMPLAZAR estos archivos en la raíz del repo:

  ┌─────────────────────────────────────────────┐
  │  index.html          ← (era Life OS.html)   │
  │  lo-data.js          ← datos + localStorage │
  │  lo-screens-1.jsx    ← Hoy + Captura        │
  │  lo-screens-2.jsx    ← Calendario + Tareas  │
  │  lo-screens-3.jsx    ← Recordatorios+Focus  │
  │  lo-screens-4.jsx    ← Hábitos+Vida+Más     │
  │  lo-ai.js            ← Integración Gemma 4  │
  └─────────────────────────────────────────────┘

BORRAR del repo (ya no se usan):
  - app.js
  - styles.css

═══════════════════════════════════════════════════
 COMANDOS GIT (copiar y pegar exacto)
═══════════════════════════════════════════════════

git clone https://github.com/cookiecodespy/habit-app.git
cd habit-app

# Copiá los 7 archivos del ZIP a esta carpeta
# (reemplazando index.html si ya existe)

git rm app.js styles.css
git add index.html lo-data.js lo-screens-1.jsx lo-screens-2.jsx lo-screens-3.jsx lo-screens-4.jsx lo-ai.js
git commit -m "feat: Life OS — rediseño Apple glassmorphism + voz real + Gemma 4"
git push origin main

═══════════════════════════════════════════════════
 CLOUDFLARE PAGES / WORKERS
═══════════════════════════════════════════════════

La app es 100% estática (HTML + JS puro, sin build step).
Cloudflare la sirve tal cual — no necesita npm install ni webpack.

Si usás Cloudflare Pages:
  - Build command: (vacío / ninguno)
  - Output directory: /  (raíz del repo)
  - Root: /

═══════════════════════════════════════════════════
 ACTIVAR GEMMA 4 (desde tu desktop)
═══════════════════════════════════════════════════

1. Abrí una terminal y ejecutá:
   OLLAMA_ORIGINS=* ollama serve

2. En la app: Más → IA Local 🤖
3. URL: http://localhost:11434
4. Modelo: gemma4:latest  (ya lo tenés instalado ✓)
5. Tocá "Probar conexión" → debería detectarlo automático
6. Guardá → la IA empieza a:
   - Clasificar capturas automáticamente
   - Generar insight diario en pantalla Hoy
   - Sugerir prioridades de tareas

NOTA: La conexión a localhost solo funciona cuando abrís
la app desde tu mismo desktop (localhost o 127.0.0.1).
Desde el celular necesitarías exponer Ollama en la red
local con: OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve
y usar la IP de tu PC (ej: http://192.168.1.x:11434)

═══════════════════════════════════════════════════
 DATOS
═══════════════════════════════════════════════════

Todo se guarda en localStorage del navegador.
No hay backend — los datos son solo tuyos, en tu dispositivo.
