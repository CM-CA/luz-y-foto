# Ollada

Ollada («mirada», en gallego) es el nombre de la app, del repositorio y de la dirección de la web (antes se llamaba «Luz y foto» y estaba en `luz-y-foto`). Por dentro conservan el nombre antiguo las claves de lo guardado en el dispositivo (`luz-y-foto:*`) y el prefijo de la caché, para no perder lo que ya hay guardado.

Webapp (PWA) solo frontend para ayudar a principiantes a hacer mejores fotos: te dice **si merece la pena salir hoy**, cuándo, hacia dónde mirar y qué ajustes usar según tu equipo.

- Sin servidor, sin cuentas: todo se guarda en el dispositivo.
- Sol y luna se calculan en el móvil (funciona sin conexión).
- Se puede instalar en la pantalla de inicio, abre sin conexión y, si no puede actualizar la previsión, enseña la última guardada (avisando de la hora).
- Meteorología con Open-Meteo (sin clave).
- Español e inglés: la app usa el idioma del teléfono (gallego, catalán y euskera se leen como español; cualquier otro idioma, en inglés) y un selector «Idioma / Language», al final de Hoy y de Aprender, deja elegir otro.
- Aprender: lecciones cortas con dibujos, para cámara (la rueda de modos, el manual de verdad, cómo usar el histograma, parasol y filtro UV) para móvil (tocar para enfocar y exponer, luz baja y modo noche, zoom y lentes), de composición (lo básico, el encuadre, líneas y puntos de fuga), de la luz (luz dura y suave, contraluz y siluetas, balance de blancos) y por tipo de fotografía (paisaje, deportiva, urbana, nocturna, retrato y arquitectura); las recetas enlazan a las de cámara y a las de móvil.

Estado: la web publicada en [cm-ca.github.io/ollada](https://cm-ca.github.io/ollada/) es una app Svelte + Vite (PWA). Antes era una web de páginas sueltas; el paso a la app (traspaso del 2026-11-21) y la retirada de la web antigua están contados en [`docs/migracion-svelte.md`](docs/migracion-svelte.md), y `/beta/` y las direcciones viejas llevan a la app. Las decisiones están en [`docs/`](docs/).

## Idiomas

La app está en español (`es`, el idioma de referencia) y en inglés (`en`). El idioma se decide al abrir la página: lo que se eligió en el selector si se eligió algo; si no, el primero de los idiomas del teléfono que la app tiene (`es`, `gl`, `ca` y `eu` → español; `en` → inglés); si el teléfono tiene idiomas pero ninguno es ese, inglés; si no tiene ninguno, español. Elegir otro idioma en el selector lo guarda en el dispositivo (`luz-y-foto:idioma`) y recarga la página. Las horas y las fechas siguen el formato del teléfono (3:45 PM con `en-US`, 15:45 con `fr-FR`); los números llevan coma en español y punto en inglés.

Qué se traduce y dónde:

- **Los textos de la pantalla** (botones, avisos, rótulos): un diccionario por idioma, `src/idioma/es.js` y `src/idioma/en.js`, con las mismas claves (una prueba lo vigila). Se leen con `t("clave", { huecos })`.
- **Los textos de los datos** (frases del semáforo, recetas, glosario, perfil, lecciones y los textos de los dibujos): una carpeta por idioma, `data/es/` y `data/en/`, con los mismos archivos. Solo cambia la prosa; los ids, los umbrales y las condiciones son idénticos (lo vigila `test/nucleo/paridad.test.js`). Ver [`docs/datos.md`](docs/datos.md).
- **Cómo se llaman las cosas en inglés**: [`docs/ingles-terminos.md`](docs/ingles-terminos.md).

Para añadir un idioma (por ejemplo el francés, `fr`) casi todo son archivos:

1. Copia `data/es/` a `data/fr/` y traduce la prosa (qué cuenta como prosa: `test/nucleo/claves-de-prosa.js`). `npm run validar` y `npx vitest run` dicen qué falta; las lecciones deben seguir en 450 palabras o menos y cada dibujo tiene que caber en 320 px (`test/e2e/compilada/dibujos.e2e.cjs` recorre todas las carpetas de `data/`).
2. Copia `src/idioma/es.js` a `src/idioma/fr.js` y traduce los valores sin tocar las claves.
3. Dalo de alta: `IDIOMAS` en `src/nucleo/idioma.js` (y qué códigos del teléfono cuentan como suyos en `elegirIdioma`, y qué formato usa `localeDeFormato`), `DICCIONARIOS` en `src/idioma/index.js` y un botón en `src/componentes/SelectorIdioma.svelte`.
4. Añade su idioma a las pruebas que los listan (`test/e2e/compilada/selector-idioma.e2e.cjs`, `dibujos.e2e.cjs`) y escribe la suya de «ni una palabra de otro idioma», como `test/e2e/compilada/ingles.e2e.cjs`.

## Desarrollo

Hace falta Node 22.12 o superior.

```
npm ci              instala las dependencias (versiones exactas del package-lock.json)
npm run dev         servidor de desarrollo con recarga
npm run validar     comprueba los archivos de data/ de todos los idiomas (con las mismas reglas que la compilación)
npm test            pruebas de lógica (Vitest) y validación de los datos: rápidas, sin navegador
npm run test:logica solo las de la lógica (Vitest)
npm run test:vigilar Vitest en modo vigilancia mientras se programa
npm run test:navegador  la app compilada en el navegador (necesita el navegador de Playwright: npx playwright install chromium)
npm run test:todo   lógica + navegador
npm run build       compila en dist/ (valida data/ antes; si hay un error, no genera nada) y escribe dist/sw.js (el service worker)
node scripts/generar-iconos.mjs   vuelve a generar los iconos de public/ (solo si cambia el dibujo o los colores)
node scripts/generar-cielos.mjs   vuelve a generar los cielos de la cabecera y las 16 fases de la luna de src/imagenes/ (solo si cambia algún dibujo de scripts/escenas-cielo.mjs)
```

## Estructura

- `src/`: la app (Svelte 5 + Vite). `src/nucleo/` es la lógica sin pantalla (sol y luna, semáforo, datos —su validación está repartida en `src/nucleo/validacion/`—, perfil, recetas, lugar, días de la pantalla Hoy); `src/proveedores/`, lo que habla con fuera (Open-Meteo, Nominatim, geocodificación, GPS); `src/pantallas/`, `src/componentes/` y `src/estado/` (el de Hoy está repartido en `src/estado/hoy/`: estado, previsión, lugar y equipo), las pantallas Hoy y Aprender; `src/imagenes/`, los cielos de la cabecera y las fases de la luna; `src/estilos/`, el CSS repartido por partes de la pantalla (`src/estilos.css` las junta en orden); `src/dibujos/`, los dibujos de las lecciones (SVG con texto, pintados dentro de la página).
- `data/<idioma>/`: umbrales, puntos, textos y consejos, separados del código, una carpeta por idioma (`es`, ...; ver [`docs/datos.md`](docs/datos.md)).
- `index.html`, `public/`, `vite.config.mjs`: la página de entrada, los iconos y el manifiesto, y la configuración de la compilación.
- `scripts/`: validar `data/` (lo usan `npm run validar` y la compilación), generar iconos y cielos, y servir `dist/` para las pruebas.
- `transicion/`: lo que se publica junto a la app y no es de ella: el 404 que lleva a la app desde las direcciones viejas y la redirección de `/beta/` (ver [`docs/migracion-svelte.md`](docs/migracion-svelte.md)).
- `licencias/`: la licencia de [SunCalc](https://github.com/mourner/suncalc), la librería que calcula sol y luna (la app usa el paquete `suncalc` 2.1.4).
- `test/`: pruebas. Todas se lanzan con `bash test/ejecutar-todo.sh` (o `npm run test:todo`); con `rapido` solo la lógica. `test/nucleo/` (Vitest) prueba la lógica y `test/e2e/` la app compilada en el navegador.
