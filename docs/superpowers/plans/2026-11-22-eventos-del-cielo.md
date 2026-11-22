# Eventos del cielo: plan de implementación

> **Para quien ejecute el plan:** SUB-SKILL OBLIGATORIA: usar superpowers:executing-plans (en línea, con una revisión final de toda la rama) o superpowers:subagent-driven-development, según haya elegido la persona. Los pasos llevan casillas (`- [ ]`) para seguirlos.

**Meta:** una sección «Próximos eventos del cielo» al final de Hoy con los próximos 90 días: el día en que cada planeta (Venus, Marte, Júpiter, Saturno) está más cerca de la luna, los eclipses de luna que se ven desde el lugar y las lluvias de estrellas con lo que la luna las estorba.

**Arquitectura:** `planetas.js` (posición de los cuatro planetas), `eventos-cielo.js` (los tres buscadores y la lista, puros), `eventos-cielo-texto.js` (los textos de cada fila, puros) y un archivo de datos nuevo, `data/cielo.json`, con cifras, tablas y textos, validado por `src/nucleo/datos.js`. `prepararVista` devuelve la lista y un componente la pinta bajo el panel.

**Pila:** Svelte 5 + Vite, SunCalc 2.1.4 (luna y sol, ya incluidos), Vitest (`test/nucleo/`), Playwright (`test/e2e/compilada/`). Única dependencia nueva, **solo de pruebas**: `astronomy-engine` 2.1.19 (efeméride independiente).

**Diseño:** `docs/superpowers/specs/2026-11-22-eventos-del-cielo-design.md` (aprobado por la persona el 2026-11-22 tras ver la maqueta).

## Restricciones globales

- Siempre `export TZ=Europe/Madrid` antes de probar. Se trabaja en la rama `eventos-cielo`; no se fusiona en `master` sin que la persona lo ordene (fusionar publica la web).
- Tres tipos de evento y solo esos. **Encuentro** = la luna a menos de **10°** de un planeta en algún instante con los dos a más de **2°** sobre el horizonte y el sol a más de **3°** bajo él. Horizonte de **90** días; **5** filas visibles y el resto tras «Ver todos». Un solo encuentro por paso (mismo planeta con menos de **36 h** entre sí): el de menor separación.
- Sin dependencias nuevas en la app; sin servidor ni conexión. Cifras, tablas y textos en `data/cielo.json`; el cálculo, en `src/nucleo/`. `npm run validar` debe comprobar el archivo nuevo.
- Fuera, y no se añade: Mercurio, Urano, Neptuno, eclipses de sol, encuentros entre planetas, estrellas, constelaciones, ventanas horarias, veredicto de nubes, bloques en Noche, tarjeta sobre las pestañas y avisos en el móvil.
- Sin eventos no hay sección. Amanecer, Atardecer y Noche no cambian: los tests existentes deben seguir pasando.
- Textos en castellano, sin tecnicismos, mayúscula solo al inicio de frase; los de `cielo.json` los revisa la persona en la PR. Los commits terminan con las líneas de atribución que pide el sistema (`Co-Authored-By` y `Claude-Session`).

## Revisión: lo que el diseño implica y ninguna prueba ejercita sola

Cada línea tiene su prueba en la tarea que se indica.

1. **Hemisferio sur y lugares extremos:** Santiago de Chile coincide con la efeméride; donde nunca anochece (70° N en junio) no hay encuentros ni errores; en la noche polar (78° N en diciembre) no falla; los polos no dan `NaN`. Tareas 1 y 3.
2. **Lo que ya pasó o está pasando:** un encuentro o eclipse cuyo instante ya pasó no sale; una lluvia sigue saliendo hasta las 09:00 del día en que acaba su noche. Tarea 3.
3. **Tablas que se acaban o noches que cruzan el año:** pasado 2030 no hay eclipses y no es un error; una lluvia cuya noche cruza de 31 de diciembre a 1 de enero da bien sus dos fechas. Tarea 3.
4. **Pocos eventos:** con cinco o menos no hay «Después» ni «Ver todos». Tarea 5.
5. **Textos que cambian según el dato:** coma decimal («1,7°»), «bajo» solo por debajo de 10° de altura, «Luna muy fina» solo por debajo del 15 %, y la lluvia sin frase de luna cuando esta no se pone ni sale esa noche. Tarea 4.

---

### Task 1: posición de los planetas (`planetas.js`)

**Archivos:**
- Crear: `src/nucleo/planetas.js`
- Probar: `test/nucleo/planetas.test.js`
- Modificar: `package.json` y `package-lock.json` (`npm install --save-exact --save-dev astronomy-engine@2.1.19`)

**Interfaces:**
- Produce: `PLANETAS = ["venus", "marte", "jupiter", "saturno"]`; `posicionPlaneta(id, fecha, lat, lon) → { az, alt }` (`fecha` es `Date` o ms; `az` de 0 a 360 desde el norte; `alt` en grados sobre el horizonte **con refracción**, como `posicionLuna` de `rumbo.js`); `separacion(a, b) → grados`, distancia angular entre dos `{ az, alt }`.
- Un `id` desconocido lanza un `Error` que lo nombra. `lat` se limita a ±89,9°. En el término de refracción, una altura negativa se toma como 0 (como hace SunCalc).

- [ ] **Paso 1: pruebas que fallan.** `test/nucleo/planetas.test.js`, con las horas dadas con su desfase:
  - `planetas: Venus en la foto de Vigo` — `posicionPlaneta("venus", Date.parse("2026-09-13T21:28:37+02:00"), 42.2406, -8.7207)` da `alt` 4,1 ± 0,3 y `az` 242,8 ± 0,5.
  - `planetas: separación luna–Venus de la foto` — con `posicionLuna` (de `rumbo.js`) en ese instante, `separacion(luna, venus)` da 8,4 ± 0,3.
  - `planetas: coinciden con una efeméride independiente` — los cuatro planetas, en unas 20 combinaciones de fecha (2026 a 2030) y lugar (Vigo, Santiago de Chile, Reikiavik, Sídney), contra `astronomy-engine` (`Equator(cuerpo, fecha, observer, true, true)` y `Horizon(fecha, observer, ra, dec, "normal")`): `separacion` entre las dos posiciones menor que 0,5° siempre que la efeméride dé `altitude > -2`.
  - `planetas: los polos no dan NaN` — latitudes 90 y −90: `az` y `alt` finitos.
  - `planetas: id desconocido` — `posicionPlaneta("mercurio", …)` lanza un error que contiene «mercurio».
- [ ] **Paso 2:** `npx vitest run test/nucleo/planetas.test.js`. Esperado: FALLA por no existir el módulo.
- [ ] **Paso 3: implementar** con los elementos keplerianos aproximados de JPL para 1800–2050 (tabla 1 de https://ssd.jpl.nasa.gov/planets/approx_pos.html: Venus, Marte, Júpiter, Saturno y el baricentro Tierra–Luna, con sus tasas por siglo; la fuente va citada en la cabecera del módulo). Sigue el procedimiento de esa página hasta la posición geocéntrica (planeta menos baricentro), suma la precesión a la longitud, pasa a ecuatoriales con la oblicuidad de la fecha y al horizonte con el tiempo sidéreo de Greenwich, y aplica la misma refracción que SunCalc. Sin luz-tiempo, aberración ni nutación.
- [ ] **Paso 4:** repetir el paso 2. Esperado: todo pasa. Si falla la efeméride en un solo planeta, es una errata en sus elementos: corregirla contra la tabla de JPL (nunca ensanchar la tolerancia).
- [ ] **Paso 5: commit** `feat: posición de Venus, Marte, Júpiter y Saturno (planetas.js) contrastada con una efeméride`.

---

### Task 2: `data/cielo.json`, su validación y su carga

**Archivos:**
- Crear: `data/cielo.json`
- Modificar: `src/nucleo/datos.js` (`validarCielo`, llamada desde `validar`), `src/datos-incluidos.js` y `scripts/datos-de-disco.mjs` (los dos devuelven también `cielo`)
- Probar: `test/nucleo/datos.test.js`

**Interfaces:**
- Produce `config.cielo`, también en `datosIncluidos()` y `cargarDeDisco()`, con esta forma (cifras y tablas fijadas por el diseño; textos, la propuesta de la maqueta):
  - números: `dias` 90, `filasVisibles` 5, `cercaGrados` 10, `alturaMinGrados` 2, `solMaxGrados` −3, `pasoMin` 3, `mismoPasoHoras` 36, `lunaFinaMenosDe` 0.15, `finDeLluviaHora` 9;
  - `cuerpos`: `venus`, `marte`, `jupiter`, `saturno`, cada uno `{ "nombre": "Venus" | "Marte" | "Júpiter" | "Saturno" }`;
  - `momentos`: `anochecer` «Al anochecer», `noche` «Por la noche», `madrugada` «De madrugada», `amanecer` «Antes del amanecer»;
  - `planeta`: `titulo` «Luna y {planeta}, muy cerca», `detalle` «A {grados}° una de otra. {momento}, {donde}.», `donde` «hacia el {direccion}», `dondeBajo` «bajo hacia el {direccion}», `lunaFina` « Luna muy fina.»;
  - `eclipses`: `[ { "maximo": "2026-08-28T04:12:00Z", "tipo": "parcial" }, … ]` con los doce de 2026 a 2030 (sacados de `astronomy-engine`: `SearchLunarEclipse` y `NextLunarEclipse`, y contrastados con la tabla de la NASA https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html; el de 2026-03-03 y los otros no visibles desde Europa también van, porque la visibilidad se calcula);
  - `eclipse`: `titulo` «Eclipse {tipo} de luna», `detalle` «Máximo a las {hora}, hacia el {direccion}. {nota}», `tipos`: `penumbral` `{ "nombre": "penumbral", "nota": "Apenas se nota." }`, `parcial` `{ "nombre": "parcial", "nota": "La luna se oscurece en parte." }`, `total` `{ "nombre": "total", "nota": "La luna se vuelve rojiza." }`;
  - `lluvias`: `{ "id", "nombre", "mes", "noche", "porHora" }` con `noche` el día en que empieza la noche del máximo (el máximo es esa noche y la siguiente madrugada): `cuadrantidas` «Cuadrántidas» 1/3/80, `liridas` «Líridas» 4/22/18, `eta-acuaridas` «Eta Acuáridas» 5/5/50, `perseidas` «Perseidas» 8/12/100, `orionidas` «Oriónidas» 10/21/20, `leonidas` «Leónidas» 11/17/15, `geminidas` «Gemínidas» 12/13/150, `ursidas` «Úrsidas» 12/21/10 (contrastadas con el calendario de la IMO; la PR dice cuáles se movieron);
  - `lluvia`: `titulo` «Lluvia de estrellas: {nombre}», `detalle` «Máximo la noche del {del} al {al}. {luna}Hasta {porHora} por hora en cielo oscuro; con la luz de la ciudad, bastantes menos.», `lunaSePone` «La luna se pone a las {hora}. », `lunaSale` «La luna sale a las {hora}. »;
  - `lunaEnLaNoche`: tramos (como `frasesNubes`) `{ "menosDe": 0.35, "nivel": "verde", "texto": "Luna fina: buena noche" }`, `{ "menosDe": 0.75, "nivel": "ambar", "texto": "Luna a medias: se verán menos" }`, `{ "nivel": "ambar", "texto": "Luna casi llena: se verán pocas" }`;
  - sección: `etiqueta` «Próximos eventos del cielo», `subtitulo` «Calculados para tu ubicación, sin conexión.», `despues` «Después: {lista}.», `todos` «Ver todos», `corto`: `planeta` «Luna y {planeta}», `eclipse` «un eclipse {tipo} de luna», `lluvia` «las {nombre}».
- `validar(config)` exige que exista y comprueba: cada número en un rango razonable (el constructor fija los rangos; `dias` entre 1 y 365, `solMaxGrados` entre −18 y 0 y `pasoMin` entre 1 y 10 son los que prueban los tests); `cuerpos` con exactamente los de `PLANETAS` y un `nombre` cada uno; cada eclipse con `maximo` ISO válido y `tipo` conocido; cada lluvia con `mes` de 1 a 12, `noche` entre 1 y el último día de ese mes (febrero, 29) y `porHora` positivo; los tramos de `lunaEnLaNoche` con `validarTramos` (sin puntos), `nivel` `verde`, `ambar` o `rojo` y el «resto» al final; y que cada texto exista y lleve todos sus huecos `{…}` (los de la lista de arriba).

- [ ] **Paso 1: pruebas que fallan.** En `datos.test.js` (con el `errores(mut)` de siempre):
  - `cielo: los datos reales son válidos y están en la carga` — `Datos.validar(cargarDatos())` es `[]`; `cargarDatos().cielo.dias === 90`; `datosIncluidos().cielo` es igual al del disco.
  - `validar: falta cielo.json` — `delete c.cielo` → contiene «cielo.json».
  - `validar: números fuera de rango` — `c.cielo.dias = 0`, `solMaxGrados = 5`, `pasoMin = 60` → un error con el nombre de cada uno.
  - `validar: tablas mal escritas` — un eclipse con `tipo: "anular"`, una lluvia con `mes: 11, noche: 31`, una sin `porHora`, y `lunaEnLaNoche` sin el tramo final → cada caso da un error que nombra el campo.
  - `validar: un texto sin su hueco o un planeta sin nombre` — `c.cielo.planeta.detalle = "A {grados}°."` → error con «cielo.planeta.detalle» y «{momento}»; `delete c.cielo.cuerpos.saturno` → error con «saturno».
- [ ] **Paso 2:** `npx vitest run test/nucleo/datos.test.js`. Esperado: FALLAN las cinco.
- [ ] **Paso 3: implementar** `data/cielo.json`, `validarCielo(c, errores)` con el estilo de los demás (mensajes «cielo.dias: …») y su llamada en `validar`, y `cielo: leer("cielo.json")` en los dos cargadores.
- [ ] **Paso 4:** repetir el paso 2 y `npm run validar`. Esperado: todo pasa y los datos son válidos.
- [ ] **Paso 5: commit** `feat: data/cielo.json con los planetas, los eclipses y las lluvias de estrellas, validado y cargado`.

---

### Task 3: buscadores y lista (`eventos-cielo.js`)

**Archivos:**
- Crear: `src/nucleo/eventos-cielo.js`
- Modificar: `src/nucleo/dias.js` (`prepararVista` devuelve `eventosCielo`)
- Probar: `test/nucleo/eventos-cielo.test.js`, `test/nucleo/pantalla.test.js`

**Interfaces:**
- Consume: `posicionPlaneta`, `separacion`, `PLANETAS` (Tarea 1); `posicionLuna` (`rumbo.js`); `alturas(fecha, lat, lon)` (`astro.js`, trae la altura del sol); SunCalc para la fracción iluminada; `config.cielo` como `cfg` (Tarea 2).
- Produce, con `desde` y `hasta` en ms, `desfaseMs` el del lugar (el de `prev.desfaseMs`) y `fecha` el día del lugar (`"YYYY-MM-DD"`, de `t + desfaseMs`):
  - `buscarEncuentros({ desde, hasta, lat, lon, desfaseMs, cfg }) → Evento[]` con `{ tipo: "planeta", fecha, t, planeta, separacion, momento, az, alt, lunaFraccion }`; `t` es el instante de menor separación del paso; `az` y `alt` son los del planeta en `t`; `momento` es una clave de `cfg.momentos`: «anochecer» si el sol baja y está por encima de −12°, «noche» si baja y está por debajo, «amanecer» si sube y está por encima de −12°, «madrugada» si sube y está por debajo (el sol «baja» si diez minutos después está más bajo).
  - `buscarEclipses(mismos parámetros) → Evento[]` con `{ tipo: "eclipse", fecha, t, clase, az, alt }`: los de `cfg.eclipses` con `maximo` en el rango y la luna a más de `alturaMinGrados` en el máximo; `az` y `alt` son los de la luna.
  - `buscarLluvias(mismos parámetros) → Evento[]` con `{ tipo: "lluvia", fecha, t, id, nombre, porHora, del, al, luna: { fraccion, nivel, texto }, lunaMomento: null | { tipo: "sePone" | "sale", t }, fin }`: `del` es `cfg.lluvias[i].noche` como fecha del año que toque y `al` el día siguiente (`fecha === del`); `t` es la medianoche del lugar de esa noche; `fin` son las `finDeLluviaHora` del lugar de `al`. `luna` sale de `lunaEnLaNoche` según la fracción iluminada en `t`; `lunaMomento` es el primer cruce del horizonte de la luna entre las 19:00 del lugar de `del` y las 06:00 de `al` (se pone si estaba sobre el horizonte a las 21:00, sale si no), o `null`.
  - `proximosEventos({ ahora, lat, lon, desfaseMs, cfg }) → Evento[]`: los tres buscadores de `ahora` a `ahora + dias·24 h`, sin los que ya pasaron (`t > ahora`; en las lluvias, `fin > ahora`), ordenados por `fecha` y luego por `t`.
- `prepararVista({ … })` devuelve además `eventosCielo = proximosEventos({ ahora, lat, lon, desfaseMs: prev.desfaseMs, cfg: config.cielo })`.

Algoritmo de `buscarEncuentros` (lo que las firmas no dicen): primero un recorrido **grueso**, cada hora y sin condiciones de visibilidad, con la separación luna–planeta de los cuatro planetas; los tramos con separación menor que `cercaGrados + 2` se amplían dos horas por cada lado; en cada uno, un recorrido **fino** cada `pasoMin` minutos que guarda el instante de menor separación entre los instantes visibles (sol por debajo de `solMaxGrados`, los dos por encima de `alturaMinGrados`). Vale si esa separación es menor que `cercaGrados`. Los encuentros del mismo planeta separados por menos de `mismoPasoHoras` son un solo paso: el de menor separación. Así no se calculan los planetas cada pocos minutos durante 90 días.

- [ ] **Paso 1: pruebas que fallan** (todas con `cfg = cargarDatos().cielo`; Vigo `42.2406, −8.7207` con `desfaseMs` de 3 600 000; horas con su desfase):
  - `encuentros: la tarde de la foto` — `desde` `2026-09-13T00:00+02:00`, `hasta` `2026-09-14T00:00+02:00`: un encuentro con `planeta: "venus"`, `separacion` entre 8,2 y 8,9, `momento: "anochecer"`, `t` entre 21:15 y 21:25.
  - `encuentros: dos tardes seguidas son un solo paso` — del `2026-09-10` al `2026-09-17`: un solo `venus`, con `separacion` entre 3,2 y 3,8 y `fecha === "2026-09-14"`.
  - `encuentros: lo que enseña la maqueta` — desde `2026-11-22T00:00+01:00`, 60 días: los seis primeros son, por `fecha`: júpiter `2026-11-30` (1,7), marte `2026-12-01` (5,8), venus `2026-12-05` (6,9), saturno `2026-12-18` (6,6), júpiter `2026-12-27` (4,4), marte `2026-12-28` (6,5), cada `separacion` ± 0,5; con `momento` «amanecer», «madrugada», «madrugada», «madrugada», «noche» y «amanecer».
  - `encuentros: lo que se avisa se ve` — Vigo desde `2026-11-19T15:00+01:00`, Santiago de Chile (`−33.45, −70.66`, `desfaseMs` −3 h) desde `2026-10-01T00:00-03:00` y Reikiavik (`64.15, −21.9`, `desfaseMs` 0) desde `2026-10-15T00:00Z`, 90 días: en `t` de cada encuentro, con efeméride independiente (SunCalc para el sol y la luna, `astronomy-engine` para los planetas), el sol está a menos de −2,6°, los dos astros a más de 1,4° y la separación es menor que 10,6°.
  - `encuentros: donde no anochece, nada; la noche polar no rompe nada` — `70, 25` desde `2026-06-21T00:00Z` (30 días): `[]`; `78, 15.6` desde `2026-12-20T00:00Z` (30 días): no lanza y todo número es finito.
  - `encuentros: 90 días se calculan sin colgar la pantalla` — `buscarEncuentros` de 90 días en Vigo tarda menos de 2 s.
  - `eclipses: el de febrero de 2027 se ve desde Vigo y el de julio no` — de `2027-01-01` a `2028-01-01` solo sale `clase: "penumbral"` con `fecha === "2027-02-21"` y `alt` cerca de 51; de `2026-08-01` a `2026-09-30`, uno `parcial`. Pasado 2030 (`2035-01-01` a `2036-01-01`) devuelve `[]` sin error.
  - `lluvias: Gemínidas, Úrsidas y Cuadrántidas de 2026–2027` — de `2026-12-01` a `2027-01-10`, por ese orden: Gemínidas con `del === "2026-12-13"`, `luna.nivel === "verde"` y `lunaMomento` `{ tipo: "sePone" }` con `t` entre 22:03 y 22:09 de esa noche; Úrsidas con `luna.nivel === "ambar"`, `luna.texto` «Luna casi llena: se verán pocas» y `lunaMomento === null`; Cuadrántidas con `del === "2027-01-03"` y `luna.nivel === "verde"`.
  - `lluvias: una noche que cruza el año` — con una copia de `cfg` a la que se añade la lluvia válida `{ id: "prueba", nombre: "Prueba", mes: 12, noche: 31, porHora: 10 }`, buscando de `2026-12-25` a `2027-01-05`: `del === "2026-12-31"` y `al === "2027-01-01"`.
  - `lista: lo que ya pasó no sale` — con `ahora` `2026-12-14T08:00+01:00` salen las Gemínidas; con `2026-12-14T10:00+01:00` ya no. Un encuentro cuyo `t` es anterior a `ahora` no sale.
  - `lista: ordenada y sin sección vacía` — con `ahora` `2026-11-22T00:00+01:00` la lista está ordenada por `fecha` y luego `t` y tiene eventos de los tres tipos; con `cfg` copiada con `eclipses: []` y `lluvias: []` y `70, 25` en junio, devuelve `[]`.
  En `pantalla.test.js`: `prepararVista(...).eventosCielo` es un arreglo con `tipo` y `fecha` en todos sus elementos y los datos simulados de siempre.
- [ ] **Paso 2:** `npx vitest run test/nucleo/eventos-cielo.test.js test/nucleo/pantalla.test.js`. Esperado: FALLAN las nuevas.
- [ ] **Paso 3: implementar** los cuatro exports de `src/nucleo/eventos-cielo.js` y el campo de `prepararVista`.
- [ ] **Paso 4:** repetir el paso 2 y `npm test`. Esperado: todo pasa. Si «lo que se avisa se ve» falla, es un fallo del módulo, no de la tolerancia.
- [ ] **Paso 5: commit** `feat: encuentros de la luna con los planetas, eclipses de luna y lluvias de estrellas (eventos-cielo.js)`.

---

### Task 4: los textos de cada fila (`eventos-cielo-texto.js`)

**Archivos:**
- Crear: `src/nucleo/eventos-cielo-texto.js`
- Probar: `test/nucleo/eventos-cielo-texto.test.js`

**Interfaces:**
- Consume: los `Evento` de la Tarea 3, `config.cielo`, `puntoCardinal` (`astro.js`), `unida` y `hm` (`formato.js`), `plantilla` (`semaforo.js`).
- Produce `describirEvento(ev, cfg) → { icono: "luna" | "lluvia" | "eclipse", dia: { semana, numero, mes }, titulo, detalle, etiqueta: null | { nivel, texto }, corto }`: `dia` sale de `ev.fecha` (semana y mes abreviados en castellano, «lun», «dic»; en una lluvia `numero` es «13–14», de `del` y `al`); `corto` es la frase de `cfg.corto` más « ({número} {mes})» («Luna y Júpiter (27 dic)»); los grados con una decimal y coma; la dirección con `unida(puntoCardinal(az))`; «bajo» (`dondeBajo`) si `alt` es menor que 10°; `lunaFina` solo si `lunaFraccion` es menor que `lunaFinaMenosDe`; en la lluvia, `{luna}` es `lunaSePone`, `lunaSale` o nada según `lunaMomento`, y `{al}` es el día con su mes («14 de diciembre»); `etiqueta` solo en las lluvias (de `ev.luna`).
- Produce `frasesDespues(eventos, cfg) → string`: «Después: …» con los `corto` unidos con comas y « y » antes del último.

- [ ] **Paso 1: pruebas que fallan** (TZ Madrid; eventos escritos a mano con los datos reales):
  - `texto: encuentro con Júpiter` — `{ tipo: "planeta", planeta: "jupiter", fecha: "2026-11-30", separacion: 1.74, momento: "amanecer", az: 221, alt: 54, lunaFraccion: 0.61 }` → `titulo` «Luna y Júpiter, muy cerca», `detalle` «A 1,7° una de otra. Antes del amanecer, hacia el suroeste.», `dia` `{ semana: "lun", numero: "30", mes: "nov" }`, `etiqueta` `null`, `icono` «luna».
  - `texto: encuentro bajo con luna muy fina` — Venus, `separacion: 6.9`, `momento: "madrugada"`, `az: 108`, `alt: 4`, `lunaFraccion: 0.14` → `detalle` «A 6,9° una de otra. De madrugada, bajo hacia el este‑sureste. Luna muy fina.» (con el guion de `unida`); con `lunaFraccion: 0.15` no lleva «Luna muy fina».
  - `texto: eclipse penumbral` — `{ tipo: "eclipse", clase: "penumbral", fecha: "2027-02-21", t: Date.parse("2027-02-21T00:12:00+01:00"), az: 141, alt: 51 }` → `titulo` «Eclipse penumbral de luna», `detalle` que empieza por «Máximo a las 00:12, hacia el sureste.» y acaba en «Apenas se nota.», `icono` «eclipse».
  - `texto: lluvia con y sin frase de luna` — las Gemínidas de la Tarea 3 (`del: "2026-12-13"`, `al: "2026-12-14"`, `porHora: 150`, `luna` `{ nivel: "verde", texto: "Luna fina: buena noche" }`, `lunaMomento` `{ tipo: "sePone", t: 22:06 }`) → `titulo` «Lluvia de estrellas: Gemínidas», `dia.numero` «13–14», `etiqueta` `{ nivel: "verde", texto: "Luna fina: buena noche" }` y `detalle` «Máximo la noche del 13 al 14 de diciembre. La luna se pone a las 22:06. Hasta 150 por hora en cielo oscuro; con la luz de la ciudad, bastantes menos.»; con `lunaMomento: null`, el mismo `detalle` sin la frase de la luna.
  - `texto: «Después»` — tres eventos (Júpiter 27 dic, Marte 28 dic y un eclipse penumbral del 21 feb) → «Después: Luna y Júpiter (27 dic), Luna y Marte (28 dic) y un eclipse penumbral de luna (21 feb).»; con un solo evento, «Después: Luna y Júpiter (27 dic).»
- [ ] **Paso 2:** `npx vitest run test/nucleo/eventos-cielo-texto.test.js`. Esperado: FALLA por no existir el módulo.
- [ ] **Paso 3: implementar** `describirEvento` y `frasesDespues` leyendo todos los textos de `cfg`, nunca escritos en el código.
- [ ] **Paso 4:** repetir el paso 2. Esperado: todo pasa.
- [ ] **Paso 5: commit** `feat: textos de las filas de eventos del cielo (eventos-cielo-texto.js)`.

---

### Task 5: la sección en pantalla y la documentación

**Archivos:**
- Crear: `src/componentes/EventosCielo.svelte`, `test/e2e/compilada/cielo.e2e.cjs`
- Modificar: `src/estado/hoy.svelte.js` (campo `eventosCielo`, que `mostrar()` rellena con `v.eventosCielo`), `src/pantallas/Hoy.svelte` (después de `<Panel />`, antes de `<Reglas />`), `src/estilos.css`, `docs/datos.md`, `docs/diseno.md`, `README.md` (solo si lista las funciones de la app)

**Interfaces:**
- Consume: `hoy.eventosCielo`, `config.cielo`, `describirEvento` y `frasesDespues` (Tarea 4), `SIMBOLO` de `niveles.js`.
- `EventosCielo` no recibe nada: lee `hoy`; no pinta nada sin `hoy.vistaLista` o sin eventos. Estructura: `<section class="eventos-cielo" aria-label={cielo.etiqueta}>` con `<h3>`, `<p class="subtitulo">` y `<ol>` con una `<li data-tipo data-fecha>` por evento: `.ev-dia` (semana, `<b>` el número —con la clase `rango` si tiene más de dos caracteres—, mes), y `.ev-texto` con `.ev-titulo` (icono SVG inline de 20 px en `<i class="ev-ico" aria-hidden="true">` y el título), `.ev-etq` con su nivel y el símbolo de `SIMBOLO` si hay etiqueta (el color nunca es lo único que dice el nivel) y `.ev-det`. Se ven las `filasVisibles` primeras; si hay más, `<p class="ev-despues">` con `frasesDespues` de las demás y un `<button class="enlace">` con `cielo.todos` que las despliega como filas y esconde la línea. Los iconos son una luna con un punto (planeta), una línea diagonal con un punto y rayas (lluvia) y dos círculos solapados (eclipse).
- Estilos (de la maqueta aprobada; solo variables de color que ya existen):

```css
.eventos-cielo ol { list-style: none; margin: 0; padding: 0 16px; background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 16px; }
.eventos-cielo li { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: 14px; padding: 16px 0; }
.eventos-cielo li + li { border-top: 1px solid var(--borde); }
.ev-dia { display: flex; flex-direction: column; align-items: center; justify-content: center; align-self: start; padding: 7px 0 8px; border-radius: 14px; background: var(--fondo); font: 600 13px/1.2 var(--cuerpo); color: var(--suave); }
.ev-dia b { font: 400 26px/1.1 var(--display); color: var(--texto); }
.ev-dia b.rango { font-size: 19px; line-height: 1.5; }
.ev-texto p { margin: 0; }
.ev-titulo { display: flex; align-items: center; gap: 8px; font: 700 17px/1.25 var(--cuerpo); }
.ev-ico { display: inline-flex; flex: none; color: var(--suave); }
.ev-etq { display: inline-block; margin-top: 6px; padding: 3px 10px; border-radius: 999px; font: 700 14px/1.3 var(--cuerpo); }
.ev-etq.verde { color: var(--verde); background: var(--verde-fondo); }
.ev-etq.ambar { color: var(--ambar); background: var(--ambar-fondo); }
.ev-det { margin-top: 6px !important; color: var(--suave); font-size: 15px; line-height: 1.4; }
.ev-despues { margin: 12px 4px 0; color: var(--suave); font-size: 15px; line-height: 1.4; }
.eventos-cielo .enlace { margin-top: 4px; min-height: 44px; padding: 9px 4px; }
```

- [ ] **Paso 1: pruebas que fallan.** `test/e2e/compilada/cielo.e2e.cjs` (copiar la cabecera, el chequeo de `dist/` y `ejecutar` de `brujula.e2e.cjs`; reloj y previsión simulados de siempre, o sea el 19 de noviembre de 2026 a las 15:00, Vigo por GPS):
  - `eventos: la sección, con cinco filas y el resto tras «Ver todos»` — existe `.eventos-cielo` con 5 `li`, un `.ev-despues` que empieza por «Después:» y un botón «Ver todos»; al pulsarlo hay más de 5 `li` y desaparecen la línea y el botón.
  - `eventos: ordenados y con lo que toca` — los `data-fecha` de los `li` están en orden; hay una lluvia (las Gemínidas, con «Luna fina: buena noche» y «La luna se pone a las 22:0») y un encuentro cuyo título casa con `/^Luna y (Venus|Marte|Júpiter|Saturno), muy cerca$/`.
  - `eventos: en las tres pestañas` — con `[data-tab=amanecer]`, `[data-tab=atardecer]` y `[data-tab=luna]` hay una sola sección y sus filas no cambian.
  - `eventos: no desborda a 320, 360 ni 390 px` — con la fuente ancha de `brujula.e2e.cjs`, `document.documentElement.scrollWidth <= innerWidth` y ningún descendiente de `.eventos-cielo` pasa su borde derecho.
  - `eventos: en oscuro y sin errores` — con `colorScheme: "dark"` la sección existe y el color del texto de `.ev-det` contrasta al menos 4,5 : 1 con el de `.eventos-cielo ol`; ninguna prueba tiene errores de consola.
- [ ] **Paso 2:** `npm run build` y `node test/e2e/compilada/cielo.e2e.cjs`. Esperado: FALLAN todas (aún no hay sección).
- [ ] **Paso 3: implementar** el estado, el componente, su sitio en `Hoy.svelte` y los estilos.
- [ ] **Paso 4:** `npm run build` y `node test/e2e/compilada/cielo.e2e.cjs`. Esperado: todo pasa.
- [ ] **Paso 5: comprobar a ojo** con `test/e2e/capturas.cjs` (o Playwright a mano) la sección cerrada y abierta a 320 y 390 px, en claro y en oscuro, y mirar las imágenes: nada cortado, igual que la maqueta aprobada.
- [ ] **Paso 6:** `bash test/ejecutar-todo.sh`. Esperado: todo pasa. Si una prueba existente depende de lo que hay tras el panel (alturas, posiciones), se corrige la prueba y se anota en el registro como `Ruling:`; un desbordamiento o un fallo de contraste se corrige en la pantalla.
- [ ] **Paso 7: documentar.** En `docs/datos.md`, una fila nueva en la tabla de archivos y una sección «Los eventos del cielo (`cielo.json`)»: qué es cada número y cada tabla, cómo se añade un eclipse o una lluvia, qué significan los huecos `{…}` de cada texto, de dónde salen los planetas (elementos orbitales aproximados de JPL, 1800–2050) y que la tabla de eclipses llega hasta 2030 y hay que ampliarla. En `docs/diseno.md`, una sección «Próximos eventos del cielo» (dónde va, por qué solo tres tipos y por qué no se añade más a Hoy) y, en «Pendiente», la receta «luna con planeta» (con los ajustes de la foto de septiembre: manual, 55 mm, f/5.6, ISO 400, 1 s, trípode) y la capa de enseñanza. En `README.md`, una línea si hay lista de funciones.
- [ ] **Paso 8:** con `grep`, comprobar que cada nombre de campo citado en los documentos existe en `data/cielo.json` o en el código; y `npm test`. Esperado: sin discrepancias y todo pasa.
- [ ] **Paso 9: commit** `feat: sección «Próximos eventos del cielo» en Hoy y su documentación`.

---
