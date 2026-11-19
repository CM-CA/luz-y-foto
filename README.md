# luz-y-foto

Webapp (PWA) solo frontend para ayudar a principiantes a hacer mejores fotos: te dice **si merece la pena salir hoy**, cuándo, hacia dónde mirar y qué ajustes usar según tu equipo.

- Sin servidor, sin cuentas: todo se guarda en el dispositivo.
- Sol y luna se calculan en el móvil (funciona sin conexión).
- Meteorología con Open-Meteo (sin clave).

Estado: fase de diseño. Las decisiones están en [`docs/`](docs/).

## Páginas de prueba

Se abren desde GitHub Pages (`cm-ca.github.io/luz-y-foto/prueba/...`):

- [`prueba/open-meteo.html`](prueba/open-meteo.html): previsión de Open-Meteo y semáforo del atardecer.
- [`prueba/hoy.html`](prueba/hoy.html): **pantalla «Hoy»** con pestañas Atardecer y Luna, semáforo grande y los tres próximos días.
- [`prueba/sol-luna.html`](prueba/sol-luna.html): sol y luna calculados en el dispositivo (sin conexión), con dirección de la puesta, fases y consejo de la luna.

## Estructura

- `js/astro.js`: cálculos de sol y luna (usa SunCalc).
- `data/`: umbrales, puntos, textos y consejos, separados del código (ver [`docs/datos.md`](docs/datos.md)).
- `js/datos.js`: carga y validación de `data/`.
- `js/lugar.js`: ubicación del dispositivo, nombre de la ciudad y búsqueda por nombre.
- `js/semaforo.js`: reglas del semáforo (atardecer y luna).
- `lib/suncalc.js`: [SunCalc](https://github.com/mourner/suncalc) 2.1.4, incluida con su licencia.
- `test/`: pruebas. Se ejecutan con `TZ=Europe/Madrid node test/astro.test.cjs` `TZ=Europe/Madrid node test/semaforo.test.cjs`, `node test/datos.test.cjs` y `node test/lugar.test.cjs`.
