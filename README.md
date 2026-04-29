# Tomas Flow

Rediseño 2026.4.27: cockpit mobile-first con captura rápida, plan del día, filtros de tareas y mejor visual para foco/hábitos.

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
## Continuidad de cambios

Antes de cerrar cualquier cambio, dejar una nota en `docs/session/YYYY-MM-DD-HHMM.md`. Ver `CHANGELOG-RULE.md`.

## OpenClaw polish pass (20260429-104703)

Se agregó una capa segura de utilidad diaria en `lo-polish.js` sin romper las pantallas existentes:

- **Centro útil flotante** con resumen de hábitos, tareas de hoy y gastos.
- **Gastos del mes / hoy / todo** con filtros rápidos.
- **Agregar y borrar gastos manuales** guardados en `localStorage` (`lo_expenses_v2`).
- **Inferencia de gastos existentes** desde datos/capturas que ya tenga la app.
- **Refresh manual** que dispara `lo:refresh` para sincronizar pantallas.
- **Exportar backup JSON** desde el navegador.
- **Service worker corregido** para cachear los archivos reales actuales (`lo-*.js/jsx`, `lo-polish.js`) en vez de archivos viejos como `app.js`/`styles.css`.

Backup previo: `.openclaw-polish-backup-20260429-104703`.
