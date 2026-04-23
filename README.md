# Tomas Flow

App web estática, mobile-first y lista para GitHub Pages.

## Incluye
- recordatorios convertidos en TODOs con checkbox
- hábitos con racha diaria
- premios simples canjeables por puntos
- presets para universidad, trabajo, OpenClaw, skills y salud
- persistencia local con `localStorage`
- PWA básica con `manifest.webmanifest` y `service worker`

## Abrir localmente
- Simple: abre `index.html` en el navegador
- Recomendado para probar PWA: `python3 -m http.server 8000` y luego `http://localhost:8000`

## Deploy en GitHub Pages
1. Crea un repo nuevo en GitHub.
2. Sube el contenido de esta carpeta al branch `main`.
3. Ve a **Settings → Pages**.
4. Elige **Deploy from a branch**.
5. Selecciona `main` y `/ (root)`.
6. Guarda y espera la URL publicada.

## Estructura
- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `sw.js`
- `assets/icon.svg`

Los datos se guardan sólo en el navegador del dispositivo usando `localStorage`.
