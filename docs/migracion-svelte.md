# Migración a Svelte + Vite (sigue siendo una PWA)

Rama de trabajo: `migracion-svelte`. La rama `master` sigue publicando la web actual hasta el traspaso (fase 5).

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
- Flujo de GitHub Actions (`.github/workflows/static.yml`): trabajo `nueva` (instala, valida, pasa las pruebas de lógica y compila con la ruta `/luz-y-foto/beta/`) y trabajo `publicar` (monta la web actual de `master` —`prueba/`, `js/`, `lib/` y `data/`— + `/beta/` y lo despliega). Si `nueva` falla, se publica solo `master` y la ejecución sale en rojo.
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

**Diferencias con `hoy.html` (todas a propósito)**
- El panel vacío se oculta con el atributo `hidden` en lugar de `:empty`; sin `<meta name="color-scheme">`; el aviso de «vista previa» solo sale si la app se publica en `/beta/`.
- En el asistente, al marcar una opción de una pregunta con varias respuestas el foco se queda en el botón (antes la pantalla se redibujaba y se perdía).
- Se conservan a propósito dos comportamientos antiguos: tras un fallo al recargar, cambiar de pestaña o de día muestra la previsión anterior (con el aviso de error arriba), y al cambiar de pestaña, de día, de trípode o de equipo se cierran las definiciones del glosario abiertas.

**Cómo probarlo**
- `npm run test:navegador` (compila, sirve `dist/` con `scripts/servir-dist.mjs` y pasa todas las pruebas de navegador de la versión compilada); `npm run test:todo` añade lógica y la web actual.
- Para ver las capturas: `node test/e2e/capturas.cjs <carpeta>` con `E2E_BASE_URL` y `E2E_HOY_URL` apuntando a la versión compilada (las de `test/e2e/referencia/` son las de la web anterior, con sus defectos).

- **Listo cuando**: las pruebas de navegador pasan sin tocarlas y las capturas coinciden con las de referencia. ✔ (la paridad visual se midió antes del responsive; falta ver `/beta/` en el móvil real)

### Fase 4: PWA y uso sin conexión
- Manifiesto, iconos y service worker con caché de la aplicación y los datos.
- Estrategia de actualización explícita: aviso «hay una versión nueva» (evita el problema de la caché antigua que ya tuvimos).
- Comportamiento sin conexión: se muestra el último dato guardado y se avisa.
- **Listo cuando**: la app abre sin red tras la primera carga y se actualiza sola.

### Fase 5: traspaso a `master`
1. Traer lo último de `master` a la rama y repasar la lista de comprobación.
2. Anotar el commit de `master` en ese momento como `v-vanilla-final` (etiqueta creada a mano en GitHub, o simplemente el número del commit).
3. Unir `migracion-svelte` en `master` (conserva todo el historial).
4. Sustituir el workflow actual (`static.yml`, que publica los archivos tal cual) por el de compilación. El origen de Pages ya está en **GitHub Actions** desde el 2026-11-20, así que no hay nada que cambiar en los ajustes.
5. Comprobar la web publicada en el móvil.
6. **Vuelta atrás**: devolver `master` al commit `v-vanilla-final` (o a `5fb6eb2` para la versión anterior a la migración); el workflow estático de esa etiqueta vuelve a publicar la web anterior. Son unos minutos.

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
| Una rama a medias impide publicar `master` | `publicar` se ejecuta aunque `nueva` falle (solo sale sin `/beta/` y con aviso) |
| Cambiar de proveedor de previsión o de nombres de lugar (monetización, límites) | Cada uno en un solo módulo de `proveedores/` |
| Añadir funciones a mitad de camino | Regla: nada nuevo hasta la fase 5 |

## Cómo ver la rama en el móvil

La web nueva se publica en **`https://cm-ca.github.io/luz-y-foto/beta/`** y la actual sigue en `https://cm-ca.github.io/luz-y-foto/` (ver `.github/workflows/static.yml`). Pages solo admite una publicación a la vez, así que el flujo monta las dos partes juntas: las carpetas de la web actual de `master` (`prueba/`, `js/`, `lib/`, `data/`; el código de la versión nueva que ya esté en `master` no se publica en la raíz) y, en `/beta/`, la compilación de `migracion-svelte`. `/beta/` desaparece en el traspaso.

Ajustes que hacen falta una sola vez en GitHub:
- **Settings → Environments → github-pages → Deployment branches and tags**: permitir también `migracion-svelte` (si solo permite `master`, la publicación desde la rama se rechaza).
- El archivo del flujo tiene que ser el mismo en `master` y en `migracion-svelte`. Si no, un push a `master` ejecuta la versión vieja del flujo y publica solo la raíz, y `/beta/` desaparece hasta la siguiente publicación desde la rama. Para publicar a mano: Actions → «Publicar sitio (master + beta)» → Run workflow.
