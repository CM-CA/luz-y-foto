# luz-y-foto

Webapp (PWA) solo frontend para ayudar a principiantes a hacer mejores fotos: te dice **si merece la pena salir hoy**, cuándo, hacia dónde mirar y qué ajustes usar según tu equipo.

- Sin servidor, sin cuentas: todo se guarda en el dispositivo.
- Sol y luna se calculan en el móvil (funciona sin conexión).
- Se puede instalar en la pantalla de inicio, abre sin conexión y, si no puede actualizar la previsión, enseña la última guardada (avisando de la hora).
- Meteorología con Open-Meteo (sin clave).
- Aprender: lecciones cortas con dibujos (la rueda de modos, el manual de verdad, parasol y filtro UV), a las que enlazan las recetas.

Estado: la web publicada en [cm-ca.github.io/luz-y-foto](https://cm-ca.github.io/luz-y-foto/) es una app Svelte + Vite (PWA). Antes era una web de páginas sueltas; el paso a la app (traspaso del 2026-11-21) y la retirada de la web antigua están contados en [`docs/migracion-svelte.md`](docs/migracion-svelte.md), y `/beta/` y las direcciones viejas llevan a la app. Las decisiones están en [`docs/`](docs/).

## Desarrollo

Hace falta Node 22.12 o superior.

```
npm ci              instala las dependencias (versiones exactas del package-lock.json)
npm run dev         servidor de desarrollo con recarga
npm run validar     comprueba los archivos de data/ (con las mismas reglas que la compilación)
npm test            pruebas de lógica (Vitest) y validación de los datos: rápidas, sin navegador
npm run test:logica solo las de la lógica (Vitest)
npm run test:vigilar Vitest en modo vigilancia mientras se programa
npm run test:navegador  la app compilada en el navegador (necesita el navegador de Playwright: npx playwright install chromium)
npm run test:todo   lógica + navegador
npm run build       compila en dist/ (valida data/ antes; si hay un error, no genera nada) y escribe dist/sw.js (el service worker)
node scripts/generar-iconos.mjs   vuelve a generar los iconos de public/ (solo si cambia el dibujo o los colores)
node scripts/generar-cielos.mjs   vuelve a generar los cielos de la cabecera y las 16 fases de la luna de src/imagenes/ (solo si cambia algún dibujo de scripts/escenas-cielo.mjs)
node scripts/generar-dibujos.mjs  vuelve a generar los dibujos de las lecciones de src/imagenes/ (solo si cambia algún dibujo de scripts/dibujos-lecciones.mjs)
```

## Estructura

- `src/`: la app (Svelte 5 + Vite). `src/nucleo/` es la lógica sin pantalla (sol y luna, semáforo, datos, perfil, recetas, lugar, días de la pantalla Hoy); `src/proveedores/`, lo que habla con fuera (Open-Meteo, Nominatim, geocodificación, GPS); `src/pantallas/`, `src/componentes/` y `src/estado/`, las pantallas Hoy y Aprender; `src/imagenes/`, los cielos de la cabecera, las fases de la luna y los dibujos de las lecciones.
- `data/`: umbrales, puntos, textos y consejos, separados del código (ver [`docs/datos.md`](docs/datos.md)).
- `index.html`, `public/`, `vite.config.mjs`: la página de entrada, los iconos y el manifiesto, y la configuración de la compilación.
- `scripts/`: validar `data/` (lo usan `npm run validar` y la compilación), generar iconos y cielos, y servir `dist/` para las pruebas.
- `transicion/`: lo que se publica junto a la app y no es de ella: el 404 que lleva a la app desde las direcciones viejas y la redirección de `/beta/` (ver [`docs/migracion-svelte.md`](docs/migracion-svelte.md)).
- `licencias/`: la licencia de [SunCalc](https://github.com/mourner/suncalc), la librería que calcula sol y luna (la app usa el paquete `suncalc` 2.1.4).
- `test/`: pruebas. Todas se lanzan con `bash test/ejecutar-todo.sh` (o `npm run test:todo`); con `rapido` solo la lógica. `test/nucleo/` (Vitest) prueba la lógica y `test/e2e/` la app compilada en el navegador.
