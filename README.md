# luz-y-foto

Webapp (PWA) solo frontend para ayudar a principiantes a hacer mejores fotos: te dice **si merece la pena salir hoy**, cuándo, hacia dónde mirar y qué ajustes usar según tu equipo.

- Sin servidor, sin cuentas: todo se guarda en el dispositivo.
- Sol y luna se calculan en el móvil (funciona sin conexión).
- La versión nueva se puede instalar en la pantalla de inicio, abre sin conexión y, si no puede actualizar la previsión, enseña la última guardada (avisando de la hora).
- Meteorología con Open-Meteo (sin clave).

Estado: en migración a Svelte + Vite (rama `migracion-svelte`, plan en [`docs/migracion-svelte.md`](docs/migracion-svelte.md)). La web actual sigue publicada en la raíz; la versión nueva se ve en [`/beta/`](https://cm-ca.github.io/luz-y-foto/beta/). Las decisiones están en [`docs/`](docs/).

## Páginas de prueba

Se abren desde GitHub Pages (`cm-ca.github.io/luz-y-foto/prueba/...`):

- [`prueba/open-meteo.html`](prueba/open-meteo.html): previsión de Open-Meteo y semáforo del atardecer.
- [`prueba/hoy.html`](prueba/hoy.html): **pantalla «Hoy»** con pestañas Atardecer y Luna, semáforo grande y los tres próximos días.
- [`prueba/sol-luna.html`](prueba/sol-luna.html): sol y luna calculados en el dispositivo (sin conexión), con dirección de la puesta, fases y consejo de la luna.

## Desarrollo (versión nueva, Svelte)

Hace falta Node 22.12 o superior.

```
npm ci              instala las dependencias (versiones exactas del package-lock.json)
npm run dev         servidor de desarrollo con recarga
npm run validar     comprueba los archivos de data/ con las mismas reglas que la web
npm test            pruebas de lógica (rápidas, sin navegador), actuales y nuevas
npm run test:logica solo las de la lógica nueva (Vitest, incluida la paridad)
npm run test:vigilar Vitest en modo vigilancia mientras se programa
npm run test:navegador  la versión compilada en el navegador (necesita el navegador de Playwright: npx playwright install chromium)
npm run test:todo   lógica + navegador (web actual y versión compilada)
npm run build       compila en dist/ (valida data/ antes; si hay un error, no genera nada) y escribe dist/sw.js (el service worker)
node scripts/generar-iconos.mjs   vuelve a generar los iconos de public/ (solo si cambia el dibujo o los colores)
```

La web actual (`prueba/`, `js/`) no necesita instalar nada: se abre sirviendo la carpeta.

## Estructura

- `js/astro.js`: cálculos de sol y luna (usa SunCalc).
- `data/`: umbrales, puntos, textos y consejos, separados del código (ver [`docs/datos.md`](docs/datos.md)).
- `js/datos.js`: carga y validación de `data/`.
- `js/lugar.js`: ubicación del dispositivo, nombre de la ciudad y búsqueda por nombre.
- `js/semaforo.js`: reglas del semáforo (atardecer y luna).
- `lib/suncalc.js`: [SunCalc](https://github.com/mourner/suncalc) 2.1.4, incluida con su licencia.
- `src/`, `index.html`, `public/`, `vite.config.mjs`: la versión nueva (Svelte 5 + Vite). `src/nucleo/` (sol, luna, semáforo, datos, perfil, recetas, lugar) y `src/proveedores/` (Open-Meteo, Nominatim, geocodificación, GPS) ya están, y la pantalla Hoy completa está en `src/pantallas/`, `src/componentes/` y `src/estado/` (se ve en `/beta/`).
- `scripts/validar-datos.mjs`: valida `data/` (lo usan `npm run validar` y la compilación).
- `test/`: pruebas. Todas se lanzan con `bash test/ejecutar-todo.sh` (o `npm run test:todo`); con `rapido` solo la lógica. `test/nucleo/` (Vitest) prueba la lógica nueva, `test/paridad/` comprueba que da lo mismo que la actual, y las de navegador están en `test/e2e/`.
