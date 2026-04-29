# Life OS — Deploy package

## Archivos incluidos
- index.html (app principal — copia de Life OS.html)
- lo-data.js
- lo-screens-1.jsx
- lo-screens-2.jsx
- lo-screens-3.jsx
- lo-screens-4.jsx

## Cómo subir al repo habit-app

```bash
# Cloná el repo
git clone https://github.com/cookiecodespy/habit-app.git
cd habit-app

# Copiá todos los archivos de esta carpeta al repo
cp deploy/* .

# Commiteá y pusheá
git add -A
git commit -m "feat: rediseño completo con estilo Apple glassmorphism"
git push origin main
```

## Para Cloudflare Pages / Workers
Deployá index.html como página estática junto con los .js y .jsx adjuntos.
