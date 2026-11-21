# Migración a Svelte + Vite (sigue siendo una PWA)

La migración se hizo en la rama `migracion-svelte` (ya incorporada a `master`). Desde el traspaso (fase 5, 2026-11-21) `master` publica la versión nueva en la raíz de la web; ver la fase 5 para la vuelta atrás y lo que queda.

## Decisión y alcance

- **Svelte 5 + Vite**, en JavaScript, sin SvelteKit (no hay servidor ni hace falta). Enrutado sencillo por «hash» (`#/hoy`, `#/lugares`…), que funciona en GitHub Pages sin trucos.
- **Sigue siendo una PWA**: instalable y con caché sin conexión (`vite-plugin-pwa`).
- **No cambia**: la carpeta `data/` y su forma de editarse, la lógica de cálculo, los textos, el aspecto, las claves de `localStorage` (`luz-y-foto:lugar`, `luz-y-foto:perfil`) y el hecho de que no hay servidor.
- **Qué se gana**: pantallas como componentes en lugar de HTML construido con texto, estado compartido entre pantallas, pruebas en el repositorio y publicación automática.
- **Fuera de alcance hasta el traspaso**: funciones nuevas. Primero igualar lo que hay, después mejorar.

## Reglas de trabajo

1. `master` no se toca. Un fallo urgente de la web actual se corrige en `master` y se trae a la rama (`git merge master`).
2. **Paridad antes que mejoras.** Cada fase termina con todas las pruebas en verde y se puede parar ahí sin dejar nada a medias.
3. **Las pruebas de `test/e2e/comportamiento/` no se modifican** durante la migración: si pasan sin tocarlas, la nueva pantalla se comporta igual. Las de `test/e2e/version-actual/` comprueban la mecánica de la web actual (datos pedidos al abrir la página, caché de scripts antiguos, errores de validación en pantalla) y se sustituyen por equivalentes en la compilación.
5. Todas las pruebas se ejecutan con `bash test/ejecutar-todo.sh` (con `rapido`, solo la lógica).
4. Un commit por paso, con un mensaje que diga qué cambia.

## Organización final

```
luz-y-foto/
  data/              igual que ahora (se valida al compilar)
  src/
    nucleo/          lógica pura: astro, semaforo, datos, perfil, recetas
    proveedores/     previsión (Open-Meteo) y nombre del lugar (Nominatim, geocodificación),
                     cada uno en un solo módulo para poder cambiar de proveedor
    estado/          lugar, perfil, previsión y «ahora», compartidos entre pantallas
    componentes/     Semaforo, Receta, Asistente, Pestanas, TablaHoras…
    pantallas/       Hoy, Lugares, Glosario, Ajustes
  public/            manifiesto, iconos
  test/              pruebas de la lógica + e2e (navegador)
  docs/
```

Los datos de `data/` se **incluyen al compilar** (no se piden al abrir la página). Así encajan con la caché sin conexión, y un JSON mal editado hace fallar la compilación antes de publicar, no el móvil de un usuario.

## Fases

### Fase 0: red de seguridad (hecha el 2026-11-20)
- Las pruebas de navegador están en el repositorio (`test/e2e/`), con servidor, previsión simulada y reloj fijos, y separadas en `comportamiento/` (ubicación, perfil y recetas; deben pasar en cualquier versión) y `version-actual/` (mecánica de datos de la web actual).
- Capturas de referencia a 320, 360 y 390 px, en claro y oscuro (`test/e2e/referencia/`; se regeneran con `node test/e2e/capturas.cjs`). Reflejan los defectos actuales: en todos los anchos la página desborda en horizontal por la tabla «Horas analizadas».
- Las pruebas se pueden dirigir a otra versión con `E2E_BASE_URL` y `E2E_HOY_URL` (se usará en la fase 3).
- Punto de vuelta atrás: el commit `5fb6eb2` de `master` (la web actual con su workflow de publicación). La etiqueta `v-vanilla-1` no se pudo subir desde la sesión de trabajo (GitHub rechazó crear etiquetas); si se quiere, se crea a mano en GitHub (Releases → Draft a new release → nueva etiqueta sobre `5fb6eb2`).
- **Listo cuando**: las pruebas de navegador pasan contra la web actual y están en el repositorio. ✔

### Fase 1: esqueleto y publicación (hecha el 2026-11-20)
- Proyecto Vite 8 + Svelte 5 con `package.json` y versiones exactas (`package-lock.json`; Node 22).
- Comandos: `npm run dev`, `build`, `preview`, `validar` (datos), `test` (lógica) y `test:todo` (lógica + navegador).
- `data/` se incluye al compilar (`import.meta.glob`) y se valida con las mismas reglas que la web actual (`scripts/validar-datos.mjs` reutiliza `js/datos.js`): un JSON mal editado hace fallar `validar` y `build`, y no se genera nada que publicar.
- Flujo de GitHub Actions (`.github/workflows/static.yml`): trabajo `nueva` (instala, valida, pasa las pruebas de lógica y compila con la ruta `/luz-y-foto/beta/`) y trabajo `publicar` (monta la web actual de `master` —`prueba/`, `js/`, `lib/` y `data/`— + `/beta/` y lo despliega). Si `nueva` falla, se publica solo `master` y la ejecución sale en rojo. (Flujo de transición: lo sustituyó el del traspaso, ver fase 5.)
- Pruebas nuevas: `test/validar-datos.test.cjs` (datos reales correctos; un error en los datos se explica y detiene `validar` y `build`) y `test/e2e/compilada/ruta-base.e2e.cjs` (la versión compilada se sirve bajo `/luz-y-foto/beta/`: todos los archivos responden 200, lee los datos incluidos, ruta desconocida avisada, sin desbordamiento horizontal a 320, 360 y 390 px).
- La prueba «un género añadido solo con datos aparece como pestaña» y las pruebas de navegador en Actions se hicieron en la fase 3 (ver más abajo).
- **Listo cuando**: una pantalla mínima se compila y se ve a través de la ruta base de GitHub Pages. ✔ (comprobado en local con la ruta `/luz-y-foto/beta/`; falta verlo publicado, ver más abajo)

### Fase 2: lógica a módulos modernos (hecha el 2026-11-20)
- **Dónde está ahora**: `src/nucleo/` (`astro`, `semaforo`, `datos`, `perfil`, `recetas`, `lugar`) y `src/proveedores/` (`open-meteo`, `nominatim`, `geocodificacion`, `gps`, y `http` para la petición con límite de tiempo). Los seis módulos del núcleo se pasaron de forma mecánica (misma lógica, solo cambia el envoltorio UMD por `import`/`export`). Los módulos actuales de `js/` siguen intactos y publicados hasta el traspaso.
- **Prueba de paridad** (`test/paridad/`): `generar-referencia.mjs` ejecutó la lógica **actual** (`js/`) con miles de casos y guardó el resultado en `referencia/` (516 KB, determinista: dos generaciones dan lo mismo). Son: sol y luna en seis lugares (incluidos los polares) y 129 fechas (con los cambios de hora); 120 previsiones inventadas con situaciones límite (lluvia justo en los umbrales, niebla, tormenta, huecos), 3.480 evaluaciones del semáforo, más seis variantes de los datos; 432 perfiles de equipo con todas sus recetas y 235 textos del glosario; 1.896 modificaciones de `data/` para la validación; y los proveedores con red y GPS simulados. `paridad.test.js` ejecuta lo mismo con la lógica **nueva** y exige resultados idénticos, incluidos los mensajes de error. Se comprobó que detecta el fallo cambiando a propósito un detalle en cada módulo (11 de 11 detectados).
- **Las mismas pruebas**: las 92 pruebas de `test/*.test.cjs` están en `test/nucleo/*.test.js` (Vitest) con las mismas comprobaciones, sobre `src/`. Las `.cjs` siguen ejecutándose contra `js/` hasta el traspaso.
- **Cambios a propósito (ninguno altera un resultado)**:
  - `Datos.cargar()` (pedir los JSON con `fetch` al abrir la página) no existe en `src/`: los datos van incluidos al compilar. Sus dos pruebas se sustituyen por «los datos incluidos son los del disco y pasan la validación».
  - SunCalc pasa a ser la dependencia `suncalc@2.1.4` (la misma versión; su `suncalc.cjs` es idéntico byte a byte a `lib/suncalc.js`).
  - `Lugar` se reparte: núcleo (coordenadas, distancia, último lugar guardado), proveedores (Nominatim, geocodificación) y GPS. `guardar`/`cargar` aceptan un almacén opcional (como ya hacía `Perfil`) para poder probarlos.
  - `urlPrevision` sale de `prueba/hoy.html` a `src/proveedores/open-meteo.js` (la paridad compara la URL exacta).
  - `npm run validar` y la compilación validan con `src/nucleo/datos.js` en vez de `js/datos.js`. Para que Node lea `src/` como módulos sin tocar el resto del proyecto, `src/package.json` declara `"type": "module"` (en el traspaso se pasa a la raíz).
- **Qué no se movió**: la lógica de la pantalla que vive dentro de `hoy.html` (`nochesDe`, `listaDe`, `etiquetaDia`, `pestanaPorDefecto`, `fechaLugar`, y el ensamblado de la previsión). Va en la fase 3, junto con los componentes.
- **Mientras haya dos copias de la lógica**: un arreglo de lógica urgente en `master` hay que repetirlo en `src/nucleo/`. La referencia de paridad es la de la lógica de antes del arreglo; cuando un cambio de comportamiento sea intencionado, se regenera con `TZ=Europe/Madrid node test/paridad/generar-referencia.mjs` (solo posible mientras exista `js/`) y se explica en el commit. Después del traspaso, `referencia/` queda como prueba de regresión congelada.
- **Listo cuando**: todas las pruebas de lógica pasan y la paridad es exacta. ✔

### Fase 3: pantalla Hoy en componentes (hecha el 2026-11-21)
Primero la paridad (que se vea y se comporte igual) y solo después el responsive, cada paso en su commit.

1. **La lógica de la pantalla sale de `hoy.html`** (`src/nucleo/dias.js` y `formato.js`; la petición de la previsión, a `src/proveedores/open-meteo.js`). La paridad (`test/paridad/`) ejecuta el código que había dentro de `hoy.html` y el nuevo con las mismas previsiones y exige resultados idénticos.
2. **Componentes con los mismos ids, atributos, textos y CSS** que `hoy.html` (`src/componentes/`, estado en `src/estado/hoy.svelte.js`; el CSS es el de `hoy.html` tal cual). Las pruebas `test/e2e/comportamiento/` (ubicación, equipo y recetas) **pasan sin haberlas tocado**, contra la web actual y contra la compilada.
3. **Pruebas de navegador sobre la versión compilada, también en Actions** (`npm run test:navegador`, con `playwright@1.63.0` fijado): el comportamiento de siempre, `ruta-base` y «un género añadido solo con datos aparece como pestaña» (compila una copia del proyecto con ese género). Para ver la paridad visual se capturó la web actual y la compilada en el mismo entorno (seis capturas: 320, 360 y 390 px, claro y oscuro) y se compararon píxel a píxel: **0,014 % distinto** (el suavizado de una letra); cambiar un relleno en 1 px ya hacía fallar la prueba. Con eso se cerró la paridad (commit `ab38260`).
4. **Responsive: la tabla «Horas analizadas»** (7 columnas, se salía de la tarjeta en todos los móviles): a 480 px o menos cada hora pasa a ser un bloque con los datos debajo (de tres en tres; de dos en dos en la tabla de la luna) y con su nombre. La prueba de capturas frente a la web actual se retira (a partir de aquí el aspecto cambia a propósito) y la sustituye `test/e2e/compilada/maquetacion.e2e.cjs`: con el panel y la receta abiertos, en Atardecer y Luna, a 320, 360, 390, 480, 600 y 800 px, claro y oscuro, **con la letra del sistema y con una letra ancha (DejaVu Sans)**, nada se sale de la pantalla ni de su tarjeta. La letra ancha se añadió porque Actions, que usa esa letra por defecto, destapó que la tabla de la luna se salía 9 px a 320 px con una letra más ancha que la del ordenador donde se desarrolló (y los móviles reales tienen letras distintas, así que el arreglo no depende de la letra).
5. **Responsive: barras de nubes**. El problema no era solo el tono: el navegador de un móvil Android, en modo oscuro, oscurece por su cuenta la versión clara (comprobado con los colores reales de una captura) y aplasta los **fondos** casi hasta el negro, sin importar el color elegido; el texto, en cambio, sí lo respeta. Se probaron siete maneras de dibujar la barra en ese móvil (`#/prueba-barras`, ya retirada: fondo, `progress`, sombra interior, SVG, texto, degradado y borde) y se eligió la de **texto**: el relleno lleva el color como fondo y también como texto (bloques «█» recortados al ancho de la barra), de modo que se ve igual de bien donde no hay oscurecimiento forzado. Además, colores nuevos más vivos y distintos entre sí (contraste con el fondo de la barra: 4,9 a 5,4 en claro y 7,4 a 8,0 en oscuro; antes 1,9 a 4,0 en claro), y `<meta color-scheme>` + `color-scheme` en el CSS para declarar el tema oscuro propio (con la preferencia oscura del navegador evita que lo oscurezca; con la clara, no). La prueba de maquetación comprueba el contraste, que el texto y el fondo de cada barra coinciden y que el texto cubre la barra más larga posible.

6. **Lo elegido se ve** (pestaña, día y «¿Llevas el trípode hoy?»). Antes un día elegido solo se distinguía por un borde algo más grueso y negrita, y el navegador de un móvil oscurece justo bordes y fondos, así que no se veía cuál estaba elegido. Ahora lleva el color invertido, negrita y una ✓ (texto, con texto alternativo vacío para los lectores de pantalla), de modo que no depende solo del color. `test/e2e/compilada/seleccion.e2e.cjs` lo comprueba en Atardecer y Luna, en claro y oscuro.

7. **Botones de día en una fila y con semáforo** (a petición expresa, saltándose la regla «sin funciones nuevas hasta el traspaso»: es un cambio pequeño y visible que el uso en el móvil pidió). Los tres botones (Ahora/Hoy/Mañana o Hoy/Mañana/día de la semana) caben siempre en una fila, en Atardecer y en Luna, y cada uno lleva el semáforo de su día: un símbolo con el color del nivel (● verde, ▲ ámbar, ■ rojo, ○ sin datos; los mismos que el semáforo grande) sobre el nombre del día. El color va en el **texto** del símbolo (no en el fondo) por lo mismo que las barras: el navegador del móvil oscurece los fondos. El día elegido lleva su nombre con el color invertido y en negrita, y una ✓ junto al símbolo (que conserva su color). Los nombres de la luna pasan de «Esta noche / Mañana noche / {día} noche» a «Hoy / Mañana / {día}» (`data/generos/luna.json`; la referencia de `test/paridad/` se regeneró). El nivel de cada día sale de `evaluarDia` (`src/nucleo/dias.js`), la misma función que usa el panel grande, así que los dos no pueden discrepar. `maquetacion.e2e.cjs` comprueba, a 320–800 px, en claro y oscuro y con letra ancha, que los botones están en una sola fila con el nombre más largo posible («Miércoles») elegido, y que el color de cada símbolo es el de su nivel; `seleccion.e2e.cjs` se adaptó a la nueva estructura.

8. **Niveles y receta con equipo** (otro cambio pedido, también fuera del plan). Los niveles se llaman **Principiante / Medio / Experto** (`data/perfil.json`; los ids `empiezo`, `defiendo`, `controlo` no cambian para no perder los perfiles guardados en `localStorage`). La línea «Mi equipo» y la receta dicen «Nivel medio…» gracias a un campo opcional `resumen` en las opciones (validado en los dos validadores; `js/perfil.js` se tocó solo para eso, para que la paridad siga exacta). **Sin el equipo configurado no se muestra la receta**: en su lugar hay una invitación breve con un botón para configurarlo (antes salía una receta de móvil con un aviso), y con equipo, bajo el título dice «Explicada para nivel …». Como esto cambia comportamiento que la web actual no tiene, `test/e2e/comportamiento/perfil.e2e.cjs` se actualizó (primera excepción a la regla de no tocar esas pruebas) y **ya solo se ejecuta contra la versión compilada**; la web actual conserva el resto. Se regeneraron las referencias de paridad de `datos` y `perfil-recetas`.

**Diferencias con `hoy.html` (todas a propósito)**
- El panel vacío se oculta con el atributo `hidden` en lugar de `:empty`; sin `<meta name="color-scheme">`; el aviso de «vista previa» solo salía si la app se publicaba en `/beta/` (se quitó en el traspaso).
- En el asistente, al marcar una opción de una pregunta con varias respuestas el foco se queda en el botón (antes la pantalla se redibujaba y se perdía).
- Se conserva a propósito un comportamiento antiguo: al cambiar de pestaña, de día, de trípode o de equipo se cierran las definiciones del glosario abiertas. (Otro, «tras un fallo al recargar se sigue viendo la previsión anterior con el aviso de error arriba», pasó a ser el aviso de «previsión guardada» de la fase 4.)

**Cómo probarlo**
- `npm run test:navegador` (compila, sirve `dist/` con `scripts/servir-dist.mjs` y pasa todas las pruebas de navegador de la versión compilada); `npm run test:todo` añade lógica y la web actual.
- Para ver las capturas: `node test/e2e/capturas.cjs <carpeta>` con `E2E_BASE_URL` y `E2E_HOY_URL` apuntando a la versión compilada (las de `test/e2e/referencia/` son las de la web anterior, con sus defectos).

- **Listo cuando**: las pruebas de navegador pasan sin tocarlas y las capturas coinciden con las de referencia. ✔ (la paridad visual se midió antes del responsive; falta ver `/beta/` en el móvil real)

### Fase 4: PWA y uso sin conexión (hecha el 2026-11-21)
Tres pasos, cada uno en su commit y con su prueba de navegador sobre la versión compilada.

1. **Manifiesto e iconos** (`public/manifest.webmanifest`). Todas las rutas son relativas (`start_url: "./"`, `scope: "./"`, iconos junto al manifiesto), así que valen igual bajo `/luz-y-foto/beta/` y, tras el traspaso, bajo `/luz-y-foto/`. Iconos de 192 y 512 px, uno «maskable» de 512 (con margen, porque el móvil lo recorta a su forma) y el de iOS de 180 px, generados con `node scripts/generar-iconos.mjs` a partir del dibujo de `public/favicon.svg` (los PNG están en el repositorio: hay que volver a generarlos solo si cambia el dibujo o los colores; con el diseño nuevo habrá que hacerlo). `theme-color` claro y oscuro en `index.html`. `pwa.e2e.cjs` comprueba el enlace bajo la ruta base, el manifiesto y que cada icono existe y mide de verdad lo que dice.
2. **Service worker hecho a mano en vez de `vite-plugin-pwa`.** La plantilla (`src/service-worker.js`, 50 líneas que se leen enteras) la completa un plugin de Vite (`scripts/pwa.mjs`) al compilar: le pone la lista de **todos** los archivos de `dist/` y una huella de su contenido como versión, y escribe `dist/sw.js`. Así no hay Workbox ni nada que aprender para tocarlo, y cualquier cambio en cualquier archivo cambia la versión.
   - Al instalarse guarda toda la app en una caché con la versión; la sirve desde ahí (la página y sus archivos son siempre de la misma versión) y cualquier dirección de la app abre `index.html`. **No toca las peticiones a otros sitios** (previsión, nombre del lugar): las gestiona la app. Solo se registra en la versión compilada, y su alcance es la carpeta de la app: en `/beta/` no afecta a la web actual de la raíz.
   - **Actualización explícita**: la versión nueva se instala en segundo plano y **espera**; no cambia la app a mitad de uso. La app (`src/estado/version.svelte.js`, `AvisoVersion.svelte`) enseña «Hay una versión nueva de Luz y foto · Actualizar» y solo al pulsar se le dice al nuevo que tome el relevo, se recarga la página una vez y se borran las cachés viejas. Se busca una versión nueva al volver a la app y cada hora. Recargar la página no actualiza (el aviso sigue ahí), que es lo que evita el problema de la caché antigua que ya tuvimos.
   - `sin-conexion.e2e.cjs` (sirve una copia de `dist/` y «publica» una versión nueva a mitad de la prueba): primera carga e instalación (se guarda todo y nada más que lo que hay), instalable según el navegador (`Page.getInstallabilityErrors` vacío), abrir sin red (con `index.html`, con `?…`, rutas internas, manifiesto e iconos), la previsión sigue yendo a Internet, el aviso aparece sin cambiar la página, recargar no actualiza, «Actualizar» cambia de versión, deja solo la caché nueva y la nueva también abre sin red. `service-worker.test.js` prueba la lista y la versión (cambia con cualquier archivo, aunque conserve el nombre). Se comprobó rompiendo a propósito el service worker (activarse solo; no guardar el manifiesto).
3. **Última previsión guardada** (`src/nucleo/previsionGuardada.js`). Cada previsión recibida se guarda en el dispositivo (`luz-y-foto:prevision`, unos pocos kilobytes: 5,9 KB en la previsión de prueba). Si no se puede pedir una nueva (sin red, servicio caído o una respuesta ilegible), se enseña la guardada **solo si es del mismo lugar** (a menos de 2 km: el GPS no repite el punto exacto) **y de hace menos de 48 h** (la petición cubre de ayer a dentro de 4 días; pasadas dos, no cubriría lo que hay que enseñar), con un aviso fijo bajo el estado: «No he podido actualizar la previsión. Te enseño la que guardé hoy a las 14:32 (hace 3 h); puede haber cambiado.» y un botón **Reintentar**. La previsión se interpreta con la hora de ahora, no la de entonces, así que «Ahora» y «Hoy» son los de verdad. Reintenta sola al volver la conexión (`online`) y al volver a la app; al reintentar, lo que se ve se queda (pestaña, día) y, si falla otra vez, no se redibuja. Sin previsión guardada que sirva, el mensaje de error es el de siempre. Además, **una respuesta lenta de un lugar anterior ya no pisa a la de un lugar nuevo** (una carrera que ya existía y que los reintentos habrían hecho más probable). `prevision-guardada.e2e.cjs` cubre: guardado tras recibir, aviso, misma previsión que con conexión, reintento con y sin red, reintento al volver la conexión y la app, guardada de ayer / de hace 3 h, servicio caído (HTTP 500), sin nada guardado, guardada de otro lugar / demasiado vieja / rota, y la carrera (comprobado quitando la protección). `prevision-guardada.test.js` prueba lo mismo sin navegador (lugar, edad, datos rotos, almacén que falla, «hoy / ayer / el 17 de noviembre»).
4. **Panel «Instalar la app y uso sin conexión»** (añadido el mismo día, tras probar en el móvil: Samsung Internet, Chrome y Brave no ofrecían instalar y no había manera de saber por qué). Al final de «Hoy», un panel plegable con (a) el botón **Instalar la app** cuando el navegador lo permite (`beforeinstallprompt`, `src/estado/instalacion.svelte.js`) o, si no, instrucciones del menú, y (b) un **informe de esta instalación** que se calcula en el propio dispositivo al abrirlo y se rehace solo si algo cambia: qué archivo de la app se está ejecutando (`index-XXXX.js`, cambia con cada versión del código), conexión segura, manifiesto (se descarga y se lee), iconos de 192 y 512 px (se descargan), dirección de inicio dentro del ámbito, estado del service worker con **su versión** (la pregunta al service worker, que contesta con la huella de `dist/`) y **el motivo si falló** (registro bloqueado, instalación descartada por un archivo que no se pudo bajar…), si la página la gestiona, qué hay guardado y si el navegador ha ofrecido instalar. El service worker ahora borra su caché si la instalación falla (antes dejaba una vacía). `instalacion.e2e.cjs` lo prueba: todo en orden, el botón, `appinstalled`, service workers bloqueados y un archivo que falta en el servidor.
- **Lo que faltaba decidir**: resuelto con el rediseño (ver más abajo): los avisos heredan la paleta nueva, y `theme-color`, `background_color` del manifiesto y los iconos la llevan.
- **Listo cuando**: la app abre sin red tras la primera carga y se actualiza sola. ✔ en el navegador de pruebas (Chromium). Falta verlo en el móvil real: instalarla, abrirla en modo avión y, cuando haya una versión nueva, pulsar «Actualizar».

### Rediseño «La luz de ahora» (hecho el 2026-11-21)
Entre la fase 4 y el traspaso se rehízo el aspecto de la versión nueva (solo en `/beta/`; la web actual de la raíz no cambia). Propuesta aprobada: [`superpowers/specs/2026-11-21-la-luz-de-ahora-design.md`](superpowers/specs/2026-11-21-la-luz-de-ahora-design.md); plan: [`superpowers/plans/2026-11-21-la-luz-de-ahora.md`](superpowers/plans/2026-11-21-la-luz-de-ahora.md); resumen del diseño resultante en [`diseno.md`](diseno.md). Ocho pasos, cada uno en su commit, con su prueba de navegador y publicado en `/beta/` antes de pasar al siguiente:

1. Fuentes (Young Serif y Figtree) y paleta nueva.
2. Cabecera con cielo en imagen (cuatro cielos según pestaña y semáforo), título, hora de la previsión y lugar en una pastilla.
3. Pestañas que montan sobre el cielo y botones de día.
4. Veredicto grande y medidor de puntos (solo Atardecer).
5. «La luz de hoy» (franja de la hora dorada a la azul) y brújula.
6. Luna con su fase real (16 imágenes) en la cabecera y en el panel.
7. El equipo vive en la receta; el lugar, en la cabecera (se disuelven las dos tarjetas).
8. Limpieza (fuera la página de prueba del cielo), iconos y colores de la app, presupuesto de peso y repaso visual a 320, 360 y 390 px en claro y oscuro.

Queda por hacer: verlo en el móvil real (modo avión, aviso «Actualizar») y en la tablet.

### Fase 5: traspaso a `master` (hecha el 2026-11-21)

Diseño aprobado: [`superpowers/specs/2026-11-21-traspaso-fase5-design.md`](superpowers/specs/2026-11-21-traspaso-fase5-design.md); plan: [`superpowers/plans/2026-11-21-traspaso-fase5.md`](superpowers/plans/2026-11-21-traspaso-fase5.md).

Punto de partida: las PR #5 y #6 de `migracion-svelte` ya estaban en `master` (el código nuevo), pero el workflow seguía siendo el de transición, así que la raíz publicaba la web antigua y la nueva solo estaba en `/beta/`. El traspaso se hizo con la rama `traspaso` y una PR, en este orden:

1. Las pruebas de navegador pasan a medir la ruta de producción (`/luz-y-foto/`) y se quita de la app el aviso de «vista previa».
2. `transicion/`, lo que se publica en lugar de `/beta/`: una redirección a la raíz que conserva la ruta (`#/hoy`), un service worker de baja que arregla la app instalada desde `/beta/` (borra solo su caché, lleva las ventanas abiertas a la raíz y se da de baja; la caché de la app de la raíz tiene el mismo estilo de nombre y no se toca) y un `404.html` que lleva a la app desde cualquier dirección vieja, como `/prueba/hoy.html`.
3. `.github/workflows/static.yml` nuevo, con dos trabajos: `construir` (datos, pruebas de lógica y de navegador, compilar y añadir `transicion/`) y `publicar` (solo en un push a `master` y solo si `construir` salió bien; ya no hay `always()`). Una PR solo construye y prueba, nunca publica.
4. La fusión de la PR es lo que publica la versión nueva en la raíz. El origen de Pages ya estaba en **GitHub Actions** desde el 2026-11-20.

**Vuelta atrás**: devolver `master` al commit `8d83511`, el último con el workflow de transición (web antigua en la raíz y la nueva en `/beta/`). Se usa el número de commit porque GitHub no dejó subir la etiqueta `v-vanilla-final` desde la sesión (403). Ese workflow compila `/beta/` desde la rama `migracion-svelte`: mientras la rama exista, la vuelta atrás también recupera `/beta/`; sin ella solo recupera la web antigua en la raíz. La rama **no debe subirse de nuevo**: su workflow viejo publicaría la web antigua en la raíz. La versión anterior a la migración sigue siendo `5fb6eb2`.

Queda: comprobar la web publicada en el móvil y, solo entonces, retirar `js/`, `lib/`, `prueba/` y las pruebas que comparaban con la web antigua (`test/paridad/`, las de `test/*.test.cjs`).

### Tras la fase 5: Amanecer y la pestaña Noche (2026-11-21)
La primera función nueva de la fase 6 es **Amanecer**: pestañas Amanecer – Atardecer – Noche (la luna se ve como «Noche»; su `id` sigue siendo `luna`), con semáforo, brújula hacia la salida del sol, receta, tres días y dos cielos nuevos, la niebla como ventaja con su aviso y una pestaña por defecto con tres franjas según la hora. Diseño: [`superpowers/specs/2026-11-21-amanecer-design.md`](superpowers/specs/2026-11-21-amanecer-design.md); plan: [`superpowers/plans/2026-11-21-amanecer.md`](superpowers/plans/2026-11-21-amanecer.md); los datos están descritos en [`datos.md`](datos.md).

Para la retirada de la web antigua: la **paridad** (`test/paridad/`) ya no compara la pestaña por defecto (la web antigua solo conocía dos franjas) ni los datos que ella no conoce (`nieblaVentaja`, el género amanecer, `porDefectoDeAmanecer` y las franjas del amanecer).

### Fase 6: pantallas nuevas
Lugares, Glosario, Ajustes (editar equipo, copia de seguridad, enlace de donación) y tutorial de la rueda de modos.

## Riesgos y cómo cubrirlos

| Riesgo | Cómo se cubre |
|---|---|
| Romper lo que ya funciona | Rama aparte, `master` intacta, pruebas de navegador sin cambios y capturas de referencia |
| Perder las pruebas de navegador (hoy están fuera del repositorio) | Fase 0, antes de nada |
| La caché sin conexión sirve una versión vieja | Actualización explícita (fase 4) y una prueba que lo comprueba |
| Rutas rotas en GitHub Pages (la web vive en `/luz-y-foto/`) | Ruta base configurada y probada con la vista previa del propio Vite |
| Que se pierdan el perfil y el lugar de quien ya usa la app | No se cambian las claves de `localStorage`; el origen es el mismo |
| Dependencias que cambian o se rompen | `package-lock.json`, versiones fijas, actualizar por separado y no durante una fase |
| Datos mal editados | Validación al compilar: si falla, no se publica |
| Que el flujo de Actions no se pueda subir desde aquí (puede faltar permiso para escribir en `.github/workflows`) | Se detecta en la fase 1; si ocurre, se pega el archivo desde la web de GitHub |
| Una rama a medias impide publicar `master` | Durante la migración, `publicar` se ejecutaba aunque `nueva` fallara (salía sin `/beta/` y con aviso). Desde el traspaso, `publicar` solo corre si `construir` (con todas las pruebas) sale bien, y una PR nunca publica |
| Cambiar de proveedor de previsión o de nombres de lugar (monetización, límites) | Cada uno en un solo módulo de `proveedores/` |
| Añadir funciones a mitad de camino | Regla: nada nuevo hasta la fase 5 (hecha); las funciones nuevas son la fase 6 |

## Cómo se publica

Desde el traspaso, GitHub Pages publica la compilación de `master` en **`https://cm-ca.github.io/luz-y-foto/`** con `.github/workflows/static.yml` (ver la fase 5). Una PR a `master` ejecuta el mismo flujo hasta compilar, pero no publica. Para publicar a mano: Actions → «Publicar sitio» → Run workflow, sobre `master`.

### Cómo se veía la vista previa (hasta el traspaso)
Mientras duró la migración, la web nueva se publicaba en `/luz-y-foto/beta/` y la antigua seguía en la raíz. Pages solo admite una publicación a la vez, así que el flujo de transición montaba las dos partes juntas: las carpetas de la web antigua de `master` (`prueba/`, `js/`, `lib/`, `data/`) y, en `/beta/`, la compilación de `migracion-svelte`. Hizo falta permitir `migracion-svelte` en Settings → Environments → github-pages → Deployment branches; ya no hace falta, basta con `master`. `/beta/` ahora redirige a la raíz (carpeta `transicion/`).
