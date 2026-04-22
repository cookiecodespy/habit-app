# Boss Mode

App web minimalista, mobile-first, pensada para Tomas. Sirve como sistema diario con recordatorios, TODOs, hábitos con racha y premios.

## Qué incluye
- Recordatorios que se convierten en TODOs del día
- TODOs con checkbox y puntos
- Hábitos con racha actual y mejor racha
- Premios canjeables con puntos
- Categorías base: Universidad, Trabajo, OpenClaw, Skills y Salud
- Persistencia local con `localStorage`
- PWA básica: manifest + service worker

## Cómo abrir local
Como es un sitio estático, puedes abrir `index.html` o servirlo con un server simple:

```bash
cd /home/tomas/habit-app
python3 -m http.server 4173
```

Luego abrir `http://localhost:4173`

## Deploy recomendado
### Opción recomendada: Cloudflare Pages
1. Subir esta carpeta a un repo GitHub privado o público.
2. Conectar el repo a Cloudflare Pages.
3. Framework preset: None.
4. Build command: vacío.
5. Output directory: `/`
6. Proteger acceso con Cloudflare Access si quieres que sea solo para ti.

## GitHub Pages
También funciona en GitHub Pages, pero no es ideal si quieres acceso privado.

## Próximas mejoras sugeridas
- Vista semanal
- Modo dejar de fumar con contador de días y ahorro estimado
- Recordatorios por hora
- Exportar/importar datos
- Sincronización futura
