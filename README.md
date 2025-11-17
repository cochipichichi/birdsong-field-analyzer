# Birdsong Field Analyzer · Neotech Field PWA (versión productiva)

Repositorio listo para subir a GitHub Pages y usar en CELULAR como PWA de terreno.

## Qué hace

- Funciona 100% en el navegador (HTML + JS estático).
- Pide acceso al **micrófono** del dispositivo.
- Analiza en tiempo real:
  - Energía total del sonido.
  - Energía en tres bandas de frecuencia (grave / medio / agudo).
- Genera una **red 3D** donde:
  - Cada nodo es un evento sonoro detectado.
  - Las aristas conectan eventos consecutivos.
- Estima de forma **determinista (sin random)** una especie probable entre:
  - Tenca, Zorzal, Rayadito, Diuca, Loica.
- Guarda un **log de eventos** y permite descargar un **CSV** con:
  - timestamp, firma de bandas, energía, especie sugerida y confianza.

## Archivos clave

- `index.html` → dashboard principal (3 columnas).
- `css/styles.css` → estilo oscuro tipo Neotech, responsivo.
- `js/audio-prod.js` → captura y análisis de audio + especie heurística + CSV.
- `js/network.js` → red 3D con Three.js alimentada por los eventos.
- `js/controls.js` → controles inclusivos: 🏠 🗣️ 🌓 A+ A− 🌐 🧠 🔍.
- `manifest.webmanifest` + `service-worker.js` → PWA básica para uso en terreno.
- `viewer3D/index.html` → visor de modelo 3D extra (opcional).

## Uso en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo: `birdsong-field-analyzer`.
2. Sube todo el contenido de esta carpeta (tal como viene el ZIP).
3. Activa GitHub Pages (branch `main` / carpeta raíz).
4. Abre la URL en tu celular (idealmente por HTTPS).
5. Acepta permisos de micrófono y toca **“Iniciar escucha”**.

## Notas pedagógicas

- Esta versión NO usa BirdNET real. Es:
  - Heurística.
  - Determinista.
  - Clara y explicable a estudiantes (se puede mostrar el código y la lógica).
- Si más adelante quieres conectar un backend BirdNET:
  - Usa el hook `sendSummaryToBackend()` en `js/audio-prod.js`.
  - O reemplaza ese archivo por la versión `audio-birdnet.js` que ya generamos en otro ZIP.

## Recomendaciones de uso en terreno

- Usar con audífonos y micrófono cercano al ambiente de aves.
- Evitar hablar encima del micrófono.
- Hacer registros cortos (~2–5 minutos) y guardar el CSV luego de cada sesión.
- Comparar sesiones de distintos puntos del entorno para observar cambios en firmas de bandas y estimaciones de especie.

