# «La luz de ahora» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a la pantalla «Hoy» el aspecto aprobado de «La luz de ahora» (cabecera de cielo en imagen, paleta cálida, Young Serif + Figtree, veredicto en bloque, franja «La luz de hoy», luna con su fase real), sin cambiar la lógica ni perder ninguna prueba de comportamiento.

**Architecture:** Se cambian los estilos y los componentes de Svelte en su sitio, pieza a pieza (un commit por tarea, publicado en `/beta/`). La elección del cielo, de la fase de luna y de la franja de luz son funciones puras en `src/nucleo/` con pruebas de Vitest; las imágenes (cielos y fases) son WebP generadas por un script con Playwright y guardadas en el repositorio; el resto se prueba en el navegador con las pruebas «compiladas».

**Tech Stack:** Svelte 5 (runas), Vite 8, Vitest 5, Playwright 1.63 (pruebas y generación de imágenes). Sin dependencias nuevas: las dos fuentes (WOFF2) se copian al repositorio.

**Spec:** `docs/superpowers/specs/2026-11-21-la-luz-de-ahora-design.md` (aprobado). Medidas exactas (tamaños, radios, rellenos): las reglas `.cielo`, `.pestanas`, `.dia`, `.veredicto`, `.franja`, `.horas`, `.brujula`, `.receta`, `.luna` de `docs/superpowers/specs/la-luz-de-ahora-maqueta.html` (solo se lee su CSS; allí las fuentes no cargan). Imagen de la propuesta: `docs/img/la-luz-de-ahora-propuesta.jpg`.

## Global Constraints

- Paleta (claro / oscuro), con los nombres de variable que ya existen más los nuevos: `--fondo #f3eff4 / #0f1626`, `--tarjeta #ffffff / #18213a`, `--texto #1f2740 / #ecebf5`, `--suave #59607f / #a8afcb`, `--borde #d8d1df / #2c3658`, `--verde #1b7a47 / #78d9a3`, `--verde-fondo #ddf1e5 / #173a2b`, `--ambar #8f5a00 / #f5c867`, `--ambar-fondo #fbe9c0 / #3a2f17`, `--rojo #a9362f / #f7a199`, `--rojo-fondo #f8dcd8 / #40201f`, `--gris` = `--suave`; nuevos: `--ambar-simbolo #b06b00 / #f5c867`, `--oro #f4b94f / #f4b94f`, `--sol #ee7d2f / #f08a3a`, `--violeta #6d5aa6 / #9985d8`, `--azul-hora #3f5fa8 / #7f9be0`, `--gris-fondo #e9e4ee / #232c47`. Las variables `--barra-*` y `--luna-*` no cambian (ya cumplen 4,5:1 sobre el fondo y la tarjeta nuevos).
- Tipografía: **Young Serif** (título, veredicto, `h3`, fase de la luna) y **Figtree** variable (resto), WOFF2 latino alojados en `src/fuentes/`, `font-display: swap`. Cuerpo 17 px, interlineado 1,5; veredicto 37 px; líneas de menos de 80 caracteres; etiquetas en minúsculas (sin `text-transform: uppercase`).
- Contraste mínimo: 4,5:1 para texto; 3:1 para el símbolo ámbar sobre el fondo. Objetivos táctiles de al menos 44 px de alto.
- **Ninguna información depende de un fondo, un borde, un degradado o un SVG incrustado** (el navegador del móvil de la persona los oscurece por su cuenta): símbolos ●▲■○ y ✓ son texto con el color del nivel; barras y franja son bloques «█» de texto; cielo y fases de luna son imágenes WebP. Un degradado o un fondo solo puede ser adorno.
- Se conservan los `id` y atributos que usan las pruebas: `#cambiar`, `#nombreLugar`, `#selector`, `#msgLugar`, `#gps`, `#buscar`, `#ciudad`, `#resultados`, `#estado`, `#asistente`, `#resumenEquipo`, `#editarEquipo`, `[data-accion=equipo]`, `#tabs`, `[data-tab]`, `#dias`, `.dias button[data-i][data-nivel][aria-pressed]`, `.marca`, `.etq`, `#panel`, `.veredicto`, `.veredicto .titulo`, `#receta`, `.subtitulo` (cuando no hay franja), `.capas .barra span`, `[data-testid=aviso-beta]`, `[data-testid=aviso-version]`, `[data-testid=aviso-sin-conexion]`.
- Cielo: imágenes de 780 × 524 mostradas a 262 px de alto (`object-fit: cover; object-position: center bottom`); las pestañas solapan el cielo 27 px cuando van justo después de la cabecera. Sin animaciones.
- Peso añadido (fuentes + cielos + lunas) ≈ 125 KB; todo va en la caché sin conexión (el plugin `scripts/pwa.mjs` ya guarda todo `dist/`).
- Textos en español, frases en minúsculas salvo la primera palabra; sin cambiar textos de `data/`.
- **Cierre de cada tarea:** `npm run test:logica` en verde, `npm run build -- --base=/luz-y-foto/beta/` y las pruebas compiladas indicadas, `git commit` (con las líneas de atribución de la sesión), `git push origin migracion-svelte`, `git update-ref refs/remotes/origin/migracion-svelte HEAD`, y esperar con `gh run list --branch migracion-svelte --limit 1 --json status,conclusion` a `completed` + `success`. Tras las tareas 2, 4, 6 y 8 se avisa a la persona para que lo mire en el móvil.
- Solo se toca `/beta/`; la raíz (versión antigua) no se toca hasta la Fase 5.

## Review Focus

1. **Sin previsión** (primera visita sin red, previsión rota): la cabecera debe pintarse igualmente, con su cielo por defecto, el mensaje de `#estado` y sin errores en consola. → Tarea 2.
2. **Nombre de lugar muy largo** («Santiago de Compostela, A Coruña, Galicia») con una letra ancha a 320 px: la pastilla y el título no se pisan ni se salen de la pantalla. → Tarea 2.
3. **Franja con datos raros**: hora dorada o hora azul que faltan (latitudes altas), `ahora` antes o después de la franja, día que no es hoy, puesta en los extremos: no falla y la franja se oculta o no lleva marcador. → Tarea 5.
4. **Fase de luna en los bordes** (0, casi 1, exactamente 0,5, valores fuera de rango) y hemisferio sur: el índice siempre está entre 0 y 15 y la imagen se voltea al sur. → Tarea 6.
5. **Sin conexión**: tras la primera carga, cielos, lunas y fuentes salen de la caché (la imagen de cabecera carga con la red cortada). → Tarea 2 (cielo) y Tarea 8 (presupuesto de peso).

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/fuentes/*.woff2`, `LEEME.md` | las dos fuentes y su origen y licencia |
| `src/imagenes/cielo-*.webp`, `luna-00…15.webp` | imágenes generadas (se guardan en el repo) |
| `src/imagenes/cielos.js` | único sitio que importa las imágenes: `CIELOS`, `LUNAS` |
| `src/nucleo/cielo.js` | funciones puras: `elegirCielo`, `indiceFaseLuna` |
| `src/nucleo/franja.js` | funciones puras: `franja`, `tituloDeLaLuz` |
| `scripts/generar-cielos.mjs`, `scripts/escenas-cielo.mjs` | dibujan y exportan las imágenes |
| `src/componentes/Cabecera.svelte`, `SelectorLugar.svelte`, `Medidor.svelte`, `LuzDeHoy.svelte` | componentes nuevos |
| `Lugar`, `Pestanas`, `Dias`, `Veredicto`, `Barra`, `Flecha`, `PanelPuntos`, `PanelNocturno`, `Receta`, `Hoy`, `App` | se modifican; `Equipo` y `LunaSvg` se borran |

---

### Task 1: Fuentes y paleta

**Files:**
- Create: `src/fuentes/young-serif-latin-400-normal.woff2`, `src/fuentes/figtree-latin-wght-normal.woff2`, `src/fuentes/LEEME.md`
- Modify: `src/estilos.css` (`@font-face`, variables, `body`, `h1`, `h3`), `scripts/servir-dist.mjs` y `test/e2e/ayudas.cjs` (tabla `TIPOS`: `.woff2` → `font/woff2`, `.webp` → `image/webp`)
- Test: `test/e2e/compilada/paleta.e2e.cjs` (nuevo)

**Interfaces:**
- Produces: las variables CSS de Global Constraints (`--ambar-simbolo`, `--oro`, `--sol`, `--violeta`, `--azul-hora` nuevas; `--display: "Young Serif", Georgia, serif` y `--cuerpo: "Figtree", system-ui, sans-serif`).

- [ ] **Step 1: Escribir la prueba que falla.** `paleta.e2e.cjs` (patrón de `seleccion.e2e.cjs`, `ejecutar` con `{ carpeta: dist, prefijo: "/luz-y-foto/beta/" }`). Para `light` y `dark`, lee con `getComputedStyle` las variables y comprueba estos contrastes mínimos (función de luminancia WCAG como en `maquetacion.e2e.cjs`): `--texto/--fondo`, `--texto/--tarjeta`, `--suave/--fondo`, `--suave/--tarjeta`, `--verde/--verde-fondo`, `--ambar/--ambar-fondo`, `--rojo/--rojo-fondo`, `--suave/--gris-fondo` ≥ 4,5; `--texto` sobre cada `*-fondo` ≥ 4,5; `--ambar-simbolo/--fondo` ≥ 3. Además: `await document.fonts.load('37px "Young Serif"')` y `('17px Figtree')` devuelven una cara cada una y `[...document.fonts].filter(f => f.status === "loaded").length === 2`; `getComputedStyle(document.body).fontFamily` empieza por `Figtree`; en `dist/assets/` hay exactamente dos `.woff2` que suman menos de 50 000 bytes.
- [ ] **Step 2: Ejecutar y comprobar que falla.** `npm run build -- --base=/luz-y-foto/beta/ && node test/e2e/compilada/paleta.e2e.cjs` → FALLA (variables y fuentes ausentes).
- [ ] **Step 3: Copiar las fuentes.** `npm pack @fontsource/young-serif@5.3.0 @fontsource-variable/figtree@5.3.0` en un directorio temporal, extraer `files/young-serif-latin-400-normal.woff2` y `files/figtree-latin-wght-normal.woff2` a `src/fuentes/`; `LEEME.md`: origen, versión 5.3.0, licencia OFL 1.1, subconjunto latino.
- [ ] **Step 4: Escribir el CSS.** `@font-face` de las dos fuentes (`font-display: swap`; Figtree con `font-weight: 300 900`); sustituir los valores de las variables existentes por los de Global Constraints (claro y bajo `prefers-color-scheme: dark`) y añadir las nuevas; `body { font: 17px/1.5 var(--cuerpo) }`; `h1, h3 { font-family: var(--display); font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--texto) }`, `h3` a 21 px y `margin: 26px 0 12px`. Actualizar el comentario de cabecera del archivo (ya no es «paridad»). Añadir los dos tipos a las dos tablas `TIPOS`.
- [ ] **Step 5: Ejecutar** `paleta`, `maquetacion` y `seleccion` → todo `ok`. Si `maquetacion` protesta por el contraste de `--barra-*`, ajustar solo ese color lo mínimo.
- [ ] **Step 6: Cierre de la tarea** (commit «Rediseño 1/8: fuentes y paleta», junto con el plan, el estado «aprobado» de la spec y la maqueta HTML).

---

### Task 2: Cabecera con cielo, título, lugar y estado

**Files:**
- Create: `src/nucleo/cielo.js`, `src/imagenes/cielos.js`, `src/imagenes/cielo-{tarde,tarde-cubierta,noche,noche-cubierta}.webp`, `scripts/escenas-cielo.mjs`, `scripts/generar-cielos.mjs`, `src/componentes/Cabecera.svelte`, `src/componentes/SelectorLugar.svelte`
- Modify: `src/componentes/Lugar.svelte` (solo la pastilla), `src/estado/hoy.svelte.js`, `src/pantallas/Hoy.svelte`, `src/App.svelte`, `src/estilos.css`
- Move/Delete: `src/pruebas/escenas.js` → `scripts/escenas-cielo.mjs`; `src/pruebas/*.webp` se sustituyen por las de `src/imagenes/` (la página `#/prueba-cielo` se borra en la Tarea 8)
- Test: `test/nucleo/cielo.test.js`, `test/e2e/compilada/cabecera.e2e.cjs` (nuevos)

**Interfaces:**
- Produces:
  - `elegirCielo({ motor, nivel, hora }): "tarde" | "tarde-cubierta" | "noche" | "noche-cubierta"` — `motor` es el del género elegido (`"puntos-ventana"` → tarde, `"mejor-hora-nocturna"` → noche; `null` o desconocido → por `hora` local 0–23: noche si `hora >= 20 || hora < 7`, tarde si no o si `hora` es `null`); `nivel === "rojo"` → `-cubierta`, cualquier otro valor (incluido `ninguno`, `ambar`, `null`, desconocido) → despejado. Exporta también `CIELOS = ["tarde", "tarde-cubierta", "noche", "noche-cubierta"]`.
  - `CIELOS` de `src/imagenes/cielos.js`: objeto `{ [id]: urlDeLaImagen }`.
  - `resultadoActual(): object | null` en `hoy.svelte.js`: el resultado de `evaluarDia` del día elegido (null si no hay previsión).
  - `Cabecera`: `<header class="cabecera" data-cielo={id}>` con `<img class="cielo" alt="" width="780" height="524">`, `<h1>Luz y foto</h1>`, `<p id="estado" role="status" aria-live="polite">{hoy.estado}</p>` y la pastilla de lugar. `Lugar` pasa a ser `<button id="cambiar" class="lugar" aria-expanded aria-controls="selector"><span id="nombreLugar">{hoy.nombreLugar}</span> ▾</button>` (sin icono); el `<section id="selector">` con sus controles pasa a `SelectorLugar` sin cambiar ids.
- Consumes: `generoActual`, `listaActual`, `indiceActual`, `hoy` (de `hoy.svelte.js`); `evaluarDia` (de `dias.js`).

- [ ] **Step 1: Prueba de Vitest que falla.** `test/nucleo/cielo.test.js` con estas aserciones sobre `elegirCielo`: `("puntos-ventana","verde")`, `("puntos-ventana","ambar")` y `("puntos-ventana","ninguno")` → `"tarde"`; `("puntos-ventana","rojo")` → `"tarde-cubierta"`; `("mejor-hora-nocturna","verde")` → `"noche"`; `("mejor-hora-nocturna","rojo")` → `"noche-cubierta"`; `{ motor: null, nivel: null, hora: 3 }` → `"noche"`; `hora: 12` → `"tarde"`; `hora: 20` → `"noche"`; `hora: 7` → `"tarde"`; `hora: null` → `"tarde"`; `nivel: "x"` y `motor: "x"` no fallan (despejado, por hora). Ejecutar `npx vitest run test/nucleo/cielo.test.js` → FALLA (no existe).
- [ ] **Step 2: Implementar `elegirCielo`** en `src/nucleo/cielo.js` hasta que pase.
- [ ] **Step 3: Escribir `cabecera.e2e.cjs` (falla).** Casos, todos con `nuevaPagina` y la previsión simulada:
  - **A, el cielo sigue a la pantalla:** `header.cabecera` existe, mide 262 px de alto a 390 px, la imagen tiene `naturalWidth === 780`, `h1` dice «Luz y foto», `#estado` casa con `/^Previsión de las \d\d:\d\d/`, `#nombreLugar` dice «Vigo, Galicia». Para cada botón de `#dias` en Atardecer y en Luna: `data-cielo` es `tarde`/`noche` según la pestaña y termina en `-cubierta` si y solo si el `data-nivel` del día elegido es `rojo`; y el nombre del archivo de `img.cielo` contiene ese `data-cielo`.
  - **B, sin previsión (Review Focus 1):** con `**/api.open-meteo.com/**` abortada y sin previsión guardada: hay `header.cabecera` con `img.cielo` cargada, `#estado` casa con `/No se han podido cargar/`, y `p.errores` está vacío.
  - **C, lugar largo (Review Focus 2):** lugar guardado «Santiago de Compostela, A Coruña, Galicia (comarca de Santiago)», anchos 320, 360 y 390, con y sin la letra ancha de `maquetacion.e2e.cjs`: la página no desborda, la pastilla queda dentro de la cabecera y su caja no se solapa con la del `h1`.
  - **D, el selector:** al pulsar `#cambiar`, `#selector` se ve y está debajo de la cabecera, y las pestañas ya no la solapan (`tabs.top >= selector.bottom`); al cerrarlo, las pestañas solapan la cabecera 27 px (±1). (Esta parte pasa en la Tarea 3; aquí solo se comprueba el selector.)
  - **E, sin conexión (Review Focus 5):** con `serviceWorkers: "allow"` y el patrón de `sin-conexion.e2e.cjs`: tras la primera carga y con la red cortada, al recargar `img.cielo` tiene `naturalWidth === 780`.
- [ ] **Step 4: Generar los cuatro cielos.** `scripts/escenas-cielo.mjs` exporta `ESCENAS` (SVG de 390 × 262): `tarde` y `tarde-cubierta` son las de `src/pruebas/escenas.js` (`tarde` y `cubierto`); `noche` es la misma pero **sin la luna ni su halo** (la luna se superpone en la Tarea 6); `noche-cubierta` es la noche con nubes oscuras superpuestas, sin estrellas, y la misma costa. `scripts/generar-cielos.mjs` (patrón de `generar-iconos.mjs`) dibuja cada escena a 780 × 524 y escribe `src/imagenes/cielo-<id>.webp` con el codificador de Chromium (`canvas.toBlob(…, "image/webp", 0.8)`), de modo que solo hace falta Playwright. Ejecutarlo; cada archivo debe pesar menos de 12 000 bytes. Mirar los cuatro PNG con la herramienta de lectura de imágenes y compararlos con `docs/img/la-luz-de-ahora-propuesta.jpg` (mismo tono y horizonte).
- [ ] **Step 5: `src/imagenes/cielos.js`** exporta `CIELOS` importando los cuatro WebP (Vite los copia a `dist/assets/` con su nombre base).
- [ ] **Step 6: Implementar `resultadoActual()`** en `hoy.svelte.js` (importa `evaluarDia`, usa `generoActual`, `listaActual`, `indiceActual`, `S`).
- [ ] **Step 7: Implementar `Cabecera`, `Lugar`, `SelectorLugar`.** `data-cielo = elegirCielo({ motor: generoActual()?.motor ?? null, nivel: resultadoActual()?.nivel ?? null, hora: new Date(hoy.ahora || Date.now()).getHours() })`. La pastilla y el bloque del título van en una fila con `flex-wrap`; el título admite varias líneas y la pastilla tiene `max-width: 55%` y el texto se parte en dos líneas si hace falta (radio 18 px). CSS de `.cabecera`, `.cielo`, `.marca`, `.lugar` según la maqueta (título 27 px Young Serif, estado 14 px, pastilla con fondo `rgba(18, 16, 48, .38)` y texto blanco; el texto lleva sombra para leerse aunque el fondo se oscurezca).
- [ ] **Step 8: Recomponer `Hoy.svelte` y `App.svelte`.** Orden en `Hoy`: `Cabecera`, `SelectorLugar`, `Asistente`, `Pestanas`, `Dias`, `AvisoSinConexion`, `Panel`, `Reglas`, `Instalacion`, pie. Se borran el `h1` «Hoy», el párrafo `.intro` y el `<p id="estado">` suelto. `Equipo` sigue donde estaba hasta la Tarea 7 (ponerlo justo después de `Asistente`, con márgenes laterales de 16 px). `main` pierde su relleno lateral para que el cielo ocupe todo el ancho (máximo 760 px, centrado); el contenido de debajo lleva `padding: 0 16px`; la ruta «No encuentro esa pantalla» conserva su relleno; el `aviso-beta` va como franja de ancho completo encima del cielo.
- [ ] **Step 9: Ejecutar** `npx vitest run`, `npm run build -- --base=/luz-y-foto/beta/`, y `cabecera`, `maquetacion`, `seleccion`, `pwa`, `sin-conexion`, `prevision-guardada`, `instalacion`, y los de `test/e2e/comportamiento/` contra la compilada (`npm run test:navegador` los pasa todos) → todo `ok`.
- [ ] **Step 10: Cierre de la tarea** («Rediseño 2/8: cabecera con cielo»). Avisar a la persona.

---

### Task 3: Pestañas y días

**Files:**
- Modify: `src/estilos.css` (`.pestanas`, `.dias`, `.dia*`), `test/e2e/compilada/maquetacion.e2e.cjs`, `test/e2e/compilada/cabecera.e2e.cjs` (caso D completo)

**Interfaces:**
- Consumes: variables de la Tarea 1; el marcado de `Pestanas.svelte` y `Dias.svelte` no cambia (sin iconos en las pestañas).

- [ ] **Step 1: Actualizar las pruebas (fallan).** En `maquetacion.e2e.cjs`: el mapa de variables de los símbolos pasa a `{ verde: "--verde", ambar: "--ambar-simbolo", rojo: "--rojo", ninguno: "--gris" }`; dentro del bucle por caso añadir: «pestañas»: las dos están dentro de la pantalla, miden al menos 44 px de alto y `#tabs` solapa `header.cabecera` entre 26 y 28 px cuando sigue a la cabecera. En `cabecera.e2e.cjs`, el caso D con la comprobación del solapamiento al cerrar el selector.
- [ ] **Step 2: Ejecutar** → FALLA (símbolo ámbar y solape).
- [ ] **Step 3: Estilos.** `.pestanas`: tarjeta `--tarjeta` con `border-radius: 22px`, relleno 5 px, sombra `0 8px 22px rgba(30, 24, 64, .2)`, `position: relative; z-index: 3`, margen lateral 16 px; `margin-top: -27px` solo cuando va justo tras la cabecera (`header.cabecera + .pestanas`, o `.cuerpo > .pestanas:first-child` según el marcado de la Tarea 2); botones sin borde, radio 17 px, `font: 700 18px/1.2`, el elegido con fondo `--texto` y texto `--fondo` (conserva el `::before` «✓ »). `.dias`/`.dia`: según la maqueta (radio 16, borde 2 px `--borde`, fondo `--tarjeta`, símbolo 23 px, etiqueta en píldora; el elegido con borde `--texto`, etiqueta invertida y en negrita, ✓ delante del símbolo); el símbolo ámbar usa `--ambar-simbolo`.
- [ ] **Step 4: Ejecutar** `maquetacion`, `seleccion`, `cabecera` → `ok`.
- [ ] **Step 5: Cierre de la tarea** («Rediseño 3/8: pestañas y días»).

---

### Task 4: Veredicto en bloque y medidor de puntos

**Files:**
- Create: `src/componentes/Medidor.svelte`, `test/e2e/compilada/veredicto.e2e.cjs`
- Modify: `src/componentes/Barra.svelte`, `Veredicto.svelte`, `PanelPuntos.svelte`, `src/estilos.css`, `test/e2e/compilada/maquetacion.e2e.cjs`

**Interfaces:**
- Produces: `Medidor` con props `{ valor: number, color: string }` (valor 0–100, se redondea y se acota); pinta `<div class="barra" aria-hidden="true"><span style:width style:background style:color>{"█".repeat(120)}</span></div>` (la misma técnica que ya usa `Barra`). `Veredicto` gana la prop opcional `puntos` (número o `null`): si es un número finito, se pinta un `Medidor` con `color="currentColor"` bajo la nota. `Barra` pasa a usar `Medidor` sin cambiar su aspecto ni sus clases.
- Consumes: `r.total` de `evaluarDia` en `PanelPuntos`.

- [ ] **Step 1: Prueba que falla.** `veredicto.e2e.cjs`: en Atardecer hay exactamente un `.veredicto .barra`; su relleno tiene el mismo color de texto y de fondo y su ancho en % es igual (±1) al número de «NN de 100 puntos» de `.veredicto .nota`; su texto cubre toda la barra (como la prueba de `.barra span` de `maquetacion`); en Luna no hay `.veredicto .barra`; `.veredicto .titulo` empieza por uno de ●▲■○; el `.veredicto` no tiene `border-width` mayor que 0 (la información va en el texto). En `maquetacion.e2e.cjs` cambiar `.barra span` por `.capas .barra span` en la prueba de las barras de nubes.
- [ ] **Step 2: Ejecutar** → FALLA.
- [ ] **Step 3: Implementar `Medidor` y usarlo** en `Barra` y `Veredicto`; `PanelPuntos` pasa `puntos={r.total}`; `PanelNocturno` no.
- [ ] **Step 4: Estilos del veredicto** según la maqueta: sin borde, radio 26, relleno 20, `.titulo` en `--display` 37 px con el símbolo a 27 px en `--cuerpo`, `.nota` en negrita 16,5 px, `.medidor` de 10 px de alto con pista `rgba(31, 39, 64, .12)` (en oscuro `rgba(255, 255, 255, .14)`), párrafo en `--texto`. Revisar con la letra ancha a 320 px que «Posible entre nubes» parte la línea sin salirse.
- [ ] **Step 5: Ejecutar** `veredicto`, `maquetacion`, `seleccion`, `perfil` → `ok`.
- [ ] **Step 6: Cierre de la tarea** («Rediseño 4/8: veredicto y medidor»). Avisar a la persona.

---

### Task 5: «La luz de hoy» y brújula

**Files:**
- Create: `src/nucleo/franja.js`, `src/componentes/LuzDeHoy.svelte`, `test/nucleo/franja.test.js`, `test/e2e/compilada/luz-de-hoy.e2e.cjs`
- Modify: `src/componentes/PanelPuntos.svelte`, `Flecha.svelte`, `src/estilos.css`

**Interfaces:**
- Produces:
  - `BLOQUES = 48`.
  - `franja({ dorada, puesta, azul, ahora, esHoy }): null | { bloques: { tramo: "dia" | "noche", mezcla: number }[], puesta: number, ahora: number | null }` — tiempos en ms. Devuelve `null` si falta alguno de `dorada`, `puesta`, `azul`, no son números finitos, o no se cumple `dorada < puesta < azul`. `bloques` tiene `BLOQUES` elementos; el bloque `i` representa el instante `dorada + ((i + 0.5) / BLOQUES) * (azul - dorada)`; es `"dia"` si ese instante es ≤ `puesta` (con `mezcla` 0–100 creciente de `dorada` a `puesta`: oro → sol) y `"noche"` si no (`mezcla` 0–100 creciente de `puesta` a `azul`: violeta → azul de la hora azul). `puesta` es `(puesta - dorada) / (azul - dorada)`. `ahora` es `(ahora - dorada) / (azul - dorada)` solo si `esHoy` y `dorada <= ahora <= azul`; si no, `null`.
  - `tituloDeLaLuz(fecha, hoy, manana): string` (fechas `"AAAA-MM-DD"`) → `"La luz de hoy"`, `"La luz de mañana"` o `"La luz del " + díaDeLaSemana` en minúsculas (`es-ES`).
  - `LuzDeHoy`: props `{ item, sol }` (el elemento de la lista y el objeto `sol` de `Astro.calcularDia`). Pinta `<h3>` con el título, una fila `aria-hidden` de 48 `<span>` con el texto «█» coloreado con `color-mix(in srgb, var(--sol) {mezcla}%, var(--oro))` (tramo día) o `color-mix(in srgb, var(--azul-hora) {mezcla}%, var(--violeta))` (tramo noche), el marcador «●» (texto, `position: absolute; left: {ahora*100}%`) y debajo tres `<div><b>HH:MM</b>Etiqueta</div>`: «Hora dorada» (`sol.horaDorada`), «Puesta» (`item.evento`), «Hora azul» (`sol.finHoraAzul`), con `hm()` (que ya pinta «—» si falta). Ojo con los tipos: `item.evento` son milisegundos y `sol.horaDorada`/`sol.finHoraAzul` son `Date` o `null` (pasar `.getTime()` a `franja`, con cuidado de que `null` siga siendo `null`).
- Consumes: `fechaLugar` de `dias.js`; `hm` de `formato.js`.

- [ ] **Step 1: Pruebas de Vitest que fallan** (`franja.test.js`), con dorada 17:27, puesta 18:10, azul 18:40 del mismo día (instantes con `Date.parse("2026-11-19T17:27:00+01:00")`): `franja(...).puesta` ≈ 43/73 (`assert.ok(Math.abs(x - 43/73) < 1e-9)`); 48 bloques; el primero es `{ tramo: "dia" }` con `mezcla` < 5 y el último `{ tramo: "noche" }` con `mezcla` > 95; el cambio de tramo ocurre en el primer bloque cuyo centro supera la puesta (índice 29); `mezcla` crece dentro de cada tramo; con `ahora` 18:05 y `esHoy: true`, `ahora ≈ 38/73`; con `esHoy: false` → `ahora: null`; `ahora` 17:00 y 19:00 → `null`; `ahora` justo en dorada → 0 y en azul → 1. **Review Focus 3:** `dorada: null`, `azul: undefined`, `puesta: NaN`, `puesta <= dorada`, `azul <= puesta` → `franja` devuelve `null`. `tituloDeLaLuz("2026-11-21","2026-11-21","2026-11-22")` → «La luz de hoy»; `("2026-11-22", …)` → «La luz de mañana»; `("2026-11-23", …)` → «La luz del lunes»; `("2026-11-28", …)` → «La luz del sábado». Ejecutar → FALLA.
- [ ] **Step 2: Implementar `franja.js`** hasta que pase.
- [ ] **Step 3: Prueba de navegador que falla** (`luz-de-hoy.e2e.cjs`, fecha por defecto 2026-11-19 15:00): en Atardecer, primer día: `h3` «La luz de hoy», 48 `.franja span` cuyo texto es «█» con color distinto de transparente y sin fondo (`background-color` transparente: la información va en el texto), el texto de cada bloque cubre su caja (sin huecos, también con la letra ancha), tres horas `HH:MM` crecientes con las etiquetas esperadas, y no hay `.ahora` (aún no es la hora). Segundo día: «La luz de mañana» y sin marcador; tercero: «La luz del sábado». Segunda página con `fecha` = la hora de la puesta leída en la primera: hay exactamente un `.ahora` cuyo texto es «●». En Luna no hay `.franja`. `.subtitulo` sigue existiendo solo si `g.evento !== "puesta"`.
- [ ] **Step 4: Implementar `LuzDeHoy`** y colocarlo en `PanelPuntos` (justo después del `Veredicto` y de `Avisos`, antes de la receta) cuando `g.evento === "puesta"` y `franja(...)` no es `null`; en cualquier otro caso se mantiene el `.subtitulo` con `g.textoEvento`. Estilos según la maqueta (`.franja` 14 px de alto, bloques con `flex: 1 1 0; min-width: 0; overflow: hidden; font-size: 18px; line-height: 14px`; `.horas` con tres columnas, la central centrada y la última a la derecha).
- [ ] **Step 5: Brújula.** Restyle de `Flecha.svelte` (62 px, círculo de 3 px con `--borde`, marca N, flecha `--ambar-simbolo`) y de `.brujula` según la maqueta; el texto sigue siendo `g.textoBrujula`.
- [ ] **Step 6: Ejecutar** `npx vitest run`, `luz-de-hoy`, `maquetacion`, `genero-nuevo` → `ok`.
- [ ] **Step 7: Cierre de la tarea** («Rediseño 5/8: la luz de hoy y brújula»).

---

### Task 6: Luna con su fase real

**Files:**
- Create: `src/imagenes/luna-00.webp … luna-15.webp`, `test/e2e/compilada/luna.e2e.cjs`
- Modify: `src/nucleo/cielo.js`, `src/nucleo/dias.js`, `src/imagenes/cielos.js`, `scripts/generar-cielos.mjs`, `src/componentes/Cabecera.svelte`, `PanelNocturno.svelte`, `src/estilos.css`, `test/nucleo/cielo.test.js`, `test/nucleo/pantalla.test.js`
- Delete: `src/componentes/LunaSvg.svelte`

**Interfaces:**
- Produces:
  - `indiceFaseLuna(fase: number): number` en `cielo.js` — `Math.round(fase * 16) % 16` tras llevar `fase` al intervalo [0, 1) (`((fase % 1) + 1) % 1`); cualquier valor no finito → `0`. 0 = nueva, 4 = cuarto creciente, 8 = llena, 12 = cuarto menguante. (Basta `fase`: la luna crece cuando `fase < 0.5`, así que `creciente` no hace falta.)
  - `LUNAS: string[]` (16 URLs, índice = fase) en `src/imagenes/cielos.js`, con `import.meta.glob("./luna-*.webp", { eager: true, import: "default" })` ordenado por nombre.
  - `lunaDe(item, lat, lon)` en `dias.js` → `Astro.calcularDia(new Date(item.fecha + "T12:00:00"), lat, lon).luna` (sustituye la expresión repetida en `evaluarDia` y `PanelNocturno`).
  - En `Cabecera`: si el cielo es `noche*`, `<img class="luna-cielo" alt="" src={LUNAS[indiceFaseLuna(lunaDe(item, hoy.lat, hoy.lon).fase)]}>` colocada donde la maqueta dibuja la luna (centro al 75 % del ancho y al 44 % del alto del cielo, 64 px), con `filter: drop-shadow(0 0 18px rgba(246, 239, 210, .5))`, `transform: scaleX(-1)` si `hoy.lat < 0` y `opacity: .4` si el cielo es `noche-cubierta`.

- [ ] **Step 1: Pruebas de Vitest que fallan.** `indiceFaseLuna`: `0` → 0; `0.25` → 4; `0.5` → 8; `0.75` → 12; `0.99` → 0; `1` → 0; `0.03` → 0; `0.04` → 1; `-0.25` → 12; `1.25` → 4; `NaN`, `undefined` e `Infinity` → 0. `lunaDe(item, 42.2328, -8.7226).fase` es igual a `Astro.calcularDia(...).luna.fase` (en `pantalla.test.js`). Ejecutar → FALLA.
- [ ] **Step 2: Implementar** `indiceFaseLuna` y `lunaDe`; usar `lunaDe` en `evaluarDia` y `PanelNocturno`; `npx vitest run` → pasa (incluida la paridad).
- [ ] **Step 3: Prueba de navegador que falla** (`luna.e2e.cjs`): en la pestaña Luna hay `.luna-cielo` con nombre de archivo `luna-NN` y `NN` entre 5 y 8 (el 19 de noviembre de 2026 la luna es gibosa creciente); el `src` de `.luna-cab img` es igual al de `.luna-cielo`; en Atardecer no hay `.luna-cielo`; con un lugar en el hemisferio sur (`lat -33.45`) el `transform` calculado de `.luna-cielo` es una matriz con `a = -1`; con una previsión con todas las nubes al 100 % y 3 mm/h (copia de `simulada()` con `cloud_cover*` a 100 y `precipitation` a 3, servida con `p.route`) el cielo de Luna es `noche-cubierta` y `opacity` < 1. **Review Focus 4** queda cubierto por este paso y el 1. Ejecutar → FALLA.
- [ ] **Step 4: Generar las 16 imágenes.** Ampliar `generar-cielos.mjs`: dibuja cada fase a 132 × 132 px (fondo transparente): disco `#2a3556`, parte iluminada `#f4eed8` con el terminador elíptico como en `LunaSvg.svelte` (`fase = i / 16`, hemisferio norte, sin inclinación), tres cráteres `#e0d9bd` al 70–80 % de opacidad recortados a la parte iluminada; WebP con alfa (calidad 0,8); cada archivo < 4 000 bytes. Comprobar visualmente una hoja de contacto de las 16.
- [ ] **Step 5: Implementar** `LUNAS`, la luna de `Cabecera` y la de `PanelNocturno` (imagen de 66 px con `alt=""`, el nombre y el porcentaje van en el texto); borrar `LunaSvg.svelte`; restyle de `.luna-cab` (nombre de la fase en Young Serif 22 px) y de `dl` según la maqueta.
- [ ] **Step 6: Ejecutar** `luna`, `cabecera`, `maquetacion`, `perfil` y `npx vitest run` → `ok`.
- [ ] **Step 7: Cierre de la tarea** («Rediseño 6/8: luna con su fase real»). Avisar a la persona.

---

### Task 7: Equipo y receta (se disuelven las tarjetas)

**Files:**
- Modify: `src/componentes/Receta.svelte`, `src/pantallas/Hoy.svelte`, `src/estilos.css`, `test/e2e/compilada/seleccion.e2e.cjs` (solo si cambia algún selector)
- Delete: `src/componentes/Equipo.svelte`
- Test: `test/e2e/comportamiento/perfil.e2e.cjs` (se mantiene tal cual: es la prueba de que no se pierde nada), `test/e2e/compilada/equipo.e2e.cjs` (nuevo)

**Interfaces:**
- Produces (marcado de `Receta`, sin cambiar sus props `{ g, nivel }`):
  - **Equipo configurado:** `<details class="receta" id="receta">` cuyo `<summary>` contiene, en este orden, `Ver receta · {receta.titulo}`, `<small id="resumenEquipo">{resumenEquipo()}</small>` y `<small class="nivel-receta">Explicada para {nivel}</small>`; dentro del cuerpo, antes de los pasos, `<button type="button" id="editarEquipo" class="enlace">Editar mi equipo</button>` (llama a `abrirAsistente(false)`).
  - **Sin equipo (`sinPerfil`):** `<section class="invitacion"><p><strong id="resumenEquipo">Sin configurar</strong> · Cuéntame tu equipo para ver la receta de esta salida.</p><button type="button" id="editarEquipo" data-accion="equipo" class="principal">Configurar mi equipo</button></section>`; no hay `#receta`.
- Consumes: `resumenEquipo`, `abrirAsistente` de `hoy.svelte.js`.

- [ ] **Step 1: Prueba nueva que falla** (`equipo.e2e.cjs`): sin equipo configurado, a 320, 360 y 390 px: no existe `.equipo` ni `Equipo` como tarjeta (`document.querySelector(".equipo")` es `null`); `#resumenEquipo` dice exactamente «Sin configurar» y está visible; `[data-accion=equipo]` es exactamente uno y es `#editarEquipo`; con el perfil de `maquetacion.e2e.cjs`: `#resumenEquipo` está dentro de `#receta summary`, y `#editarEquipo` está dentro de `#receta` y abre `#asistente`; la altura de `#panel` desde su borde superior hasta el principio de la receta no incluye ninguna tarjeta «Lugar» (no existe `.lugar` fuera de la cabecera). Ejecutar → FALLA (la tarjeta `.equipo` existe).
- [ ] **Step 2: Implementar** el marcado de `Receta` de arriba; quitar `Equipo` de `Hoy.svelte` y borrar el archivo y sus estilos (`.equipo`, `.lugar .etq`); la invitación y la receta heredan el estilo de la maqueta (`.receta`: borde 2 px `--texto`, radio 20, relleno `14px 16px`; la invitación con borde discontinuo `--suave`). El `Asistente` queda en el flujo con márgenes laterales de 16 px.
- [ ] **Step 3: Ejecutar** `equipo`, `perfil` (contra la compilada, con `npm run test:navegador`), `seleccion`, `maquetacion` → `ok`. Si una prueba antigua falla solo porque el selector cambió de sitio y no por comportamiento, actualizar ese selector y decirlo en el commit.
- [ ] **Step 4: Cierre de la tarea** («Rediseño 7/8: el equipo vive en la receta»).

---

### Task 8: Limpieza, iconos y repaso final

**Files:**
- Delete: `src/pantallas/PruebaCielo.svelte`, `src/pruebas/` (carpeta entera)
- Modify: `src/App.svelte` (quitar la ruta `prueba-cielo` y su import), `scripts/generar-iconos.mjs`, `public/favicon.svg`, `public/icon-*.png`, `public/apple-touch-icon.png`, `public/manifest.webmanifest`, `index.html`, `test/e2e/compilada/pwa.e2e.cjs`, `docs/diseno.md`, `docs/migracion-svelte.md`, `README.md`

- [ ] **Step 1: Borrar** la página y los archivos de prueba del cielo y la ruta; comprobar con `grep -rn "prueba-cielo\|PruebaCielo\|src/pruebas" src scripts test docs` que no queda nada (salvo la mención histórica en docs, que se reescribe).
- [ ] **Step 2: Iconos y colores.** En `generar-iconos.mjs`: `FONDO = "#1f2740"`, `SOL = "#ee7d2f"`, línea `#7f9be0`; el mismo cambio de colores en `public/favicon.svg`; ejecutar el script. `index.html`: `theme-color` `#f3eff4` (claro) y `#0f1626` (oscuro); `manifest.webmanifest`: `background_color` y `theme_color` `#f3eff4`.
- [ ] **Step 3: Presupuesto de peso (Review Focus 5).** En `pwa.e2e.cjs` añadir: la suma de los `.woff2` y `.webp` de `dist/` es menor de 160 000 bytes y todos están en la lista de `dist/sw.js` (la prueba lee `ARCHIVOS` del texto del service worker). Ejecutarla: pasa.
- [ ] **Step 4: Repaso visual.** Script temporal (en el directorio de trabajo temporal, no en el repositorio) que, con la app compilada servida y la previsión simulada, guarda capturas a 320, 360 y 390 px, claro y oscuro, de Atardecer (día verde), Atardecer con un día rojo (previsión con nubes al 100 %), Luna, con el selector de lugar abierto, con el asistente abierto, con `aviso-version` y con `aviso-sin-conexion`. Mirarlas todas con la herramienta de lectura de imágenes, compararlas con `docs/img/la-luz-de-ahora-propuesta.jpg` y corregir lo que desentone (los dos avisos y el panel de instalación heredan la paleta; revisar su contraste y que el aviso fijo no tape el contenido importante).
- [ ] **Step 5: Documentación.** `docs/diseno.md`: sustituir la descripción visual por «La luz de ahora» (paleta, fuentes, cielo, restricciones del modo oscuro forzado); `docs/migracion-svelte.md`: marcar el rediseño como hecho en la fecha y dejar pendientes solo la Fase 5 y la Fase 6; `README.md`: una línea sobre cómo regenerar iconos y cielos (`node scripts/generar-iconos.mjs`, `node scripts/generar-cielos.mjs`).
- [ ] **Step 6: Suite completa.** `npm run test:todo` → «Todo correcto».
- [ ] **Step 7: Cierre de la tarea** («Rediseño 8/8: limpieza, iconos y documentación»). Enviar a la persona una captura de Atardecer y otra de Luna a 390 px y pedirle que mire `/beta/` en el móvil (con «Actualizar» si sale el aviso de versión) y en la tablet.
