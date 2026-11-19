# luz-y-foto

Webapp (PWA) solo frontend para ayudar a principiantes a hacer mejores fotos: te dice **si merece la pena salir hoy**, cuándo, hacia dónde mirar y qué ajustes usar según tu equipo.

- Sin servidor, sin cuentas: todo se guarda en el dispositivo.
- Sol y luna se calculan en el móvil (funciona sin conexión).
- Meteorología con Open-Meteo (sin clave).

Estado: fase de diseño. Las decisiones están en [`docs/`](docs/).

## Páginas de prueba

Se abren desde GitHub Pages (`cm-ca.github.io/luz-y-foto/prueba/...`):

- [`prueba/open-meteo.html`](prueba/open-meteo.html): previsión de Open-Meteo y semáforo del atardecer.
- [`prueba/sol-luna.html`](prueba/sol-luna.html): sol y luna calculados en el dispositivo (sin conexión), con dirección de la puesta, fases y consejo de la luna.

## Estructura

- `js/astro.js`: cálculos de sol y luna (usa SunCalc).
- `lib/suncalc.js`: [SunCalc](https://github.com/mourner/suncalc) 2.1.4, incluida con su licencia.
- `test/astro.test.cjs`: pruebas. Se ejecutan con `TZ=Europe/Madrid node test/astro.test.cjs`.
