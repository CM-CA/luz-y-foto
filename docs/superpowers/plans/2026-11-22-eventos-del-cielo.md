# Eventos del cielo y planetas: plan de implementación

> **Para quien ejecute el plan:** SUB-SKILL OBLIGATORIA: usar superpowers:executing-plans (en línea, con una revisión final de toda la rama) o superpowers:subagent-driven-development, según haya elegido la persona. Los pasos llevan casillas (`- [ ]`) para seguirlos.

**Meta:** que Hoy avise de los próximos encuentros de la luna con Venus, Marte, Júpiter o Saturno (y de dos planetas entre sí) que se vean desde el lugar elegido, con el rato en que se ven, hacia dónde mirar y qué dice la previsión de nubes; y que la pestaña Noche diga qué planetas se ven esa noche.

**Arquitectura:** tres módulos puros nuevos o ampliados en `src/nucleo/` (`planetas.js`: posición de los cuatro planetas; `eventos-cielo.js`: ventanas, encuentros y planetas de la noche; `semaforo.js`: veredicto de nubes para un rato cualquiera, con las reglas de Noche) y un archivo de datos nuevo, `data/cielo.json`, que valida `src/nucleo/datos.js`. `dias.js` los junta en `prepararVista`, y dos componentes pintan el resultado: una tarjeta sobre las pestañas y un bloque de planetas dentro de Noche.

**Pila:** Svelte 5 + Vite, SunCalc 2.1.4 (la luna y el sol, ya incluidos), Vitest (`test/nucleo/`), Playwright (`test/e2e/compilada/`). Única dependencia nueva, **solo de pruebas**: `astronomy-engine` 2.1.19 (efeméride independiente para contrastar los planetas).

**Diseño:** `docs/superpowers/specs/2026-11-22-eventos-del-cielo-design.md` (aprobado por la persona el 2026-11-22).

## Restricciones globales

- Siempre `export TZ=Europe/Madrid` antes de probar. Se trabaja en la rama `eventos-cielo`; no se fusiona en `master` sin que la persona lo ordene (fusionar publica la web).
- Evento = la luna a menos de **10°** de Venus, Marte, Júpiter o Saturno, o dos planetas a menos de **2°**; solo cuenta si hay un rato (la **ventana**) con los dos astros a más de **2°** sobre el horizonte y el sol a más de **3°** bajo él. Mira **30 días** adelante y muestra como mucho **5** eventos. Un solo evento por paso (la tarde con menor separación).
- Sin dependencias nuevas en la app compilada; sin servidor ni conexión; sin avisos en el móvil; sin cuarta pestaña. Mercurio, Urano, Neptuno, estrellas, constelaciones, eclipses y lluvias de estrellas quedan fuera.
- Cifras y textos en `data/cielo.json`; el cálculo, en `src/nucleo/`. `npm run validar` debe comprobar el archivo nuevo.
- Amanecer, Atardecer y Noche no cambian de comportamiento: los tests existentes de `semaforo`, `pantalla` y las pruebas de navegador deben seguir pasando tal cual (salvo lo que ledgere el ejecutor).
- Si no hay eventos, no hay tarjeta; si no se ve ningún planeta, no hay bloque en Noche. Nunca avisar de algo que no se ve.
- Textos en castellano, sin tecnicismos, mayúscula solo al inicio de frase. Los textos de `cielo.json` son una propuesta que la persona revisa en la PR.
- Los commits terminan con las líneas de atribución que pide el sistema (`Co-Authored-By` y `Claude-Session`).

## Lo que el diseño dejaba al constructor y este plan fija

- **Mejor momento** de un rato: el de menor separación entre los dos astros. **Mejor tarde** de un paso: la de menor separación en su mejor momento. La tarjeta muestra siempre la ventana entera y qué la acaba (un astro que baja, con su hora de puesta, o el amanecer).
- **Cruce con la previsión:** las reglas de nubes y lluvia del género de Noche (`data/generos/luna.json`), señaladas en `cielo.json` con `reglasDeTiempo`; los textos del veredicto, propios de `cielo.json`. Un evento sin ninguna hora de previsión en su ventana dice «Sin previsión todavía».
- **Paso de tiempo:** 2 minutos (`pasoMin`); solo se calculan los planetas cuando el sol está bajo.
- **Dónde mira la flecha:** al punto medio entre los dos astros; la altura es la de ese punto.
- **Tarjeta** encima de las pestañas, en cualquier pestaña; «Ver los próximos» es un `<details>`.
- Hallazgo con el caso real: el 13 de septiembre de 2026 (Venus a 8,5°, ventana 21:03–21:21) cumple, pero el 14 es la mejor tarde del paso (3,5°, ventana 21:01–21:38), así que la tarjeta enseñará el 14. Es lo que dice el diseño; la persona decide en la revisión si quiere mencionar también la otra tarde.

## Revisión: lo que el diseño implica y ninguna prueba ejercita sola

Cada línea tiene su prueba en la tarea que se indica.

1. **Hemisferio sur y lugares extremos:** Santiago de Chile coincide con la efeméride; a 70° N en junio (nunca anochece) no hay eventos ni errores; a 78° N en diciembre (noche polar, ventanas de más de 12 h) no falla; los polos no dan `NaN`. Tareas 1 y 3.
2. **Ventana solo en parte dentro de la previsión, o del todo fuera:** se valora con las horas que haya; sin ninguna, «Sin previsión todavía», nunca un verde inventado. Tarea 4.
3. **Un evento que ya está ocurriendo y uno que acabó hace un momento:** el primero se muestra como «Ahora», el segundo no. Tarea 3.
4. **Cambio de hora de octubre y medianoche del lugar:** el orden y los días son correctos; el día de un evento es el del lugar, no el del dispositivo. Tareas 3 y 4.
5. **Noche sin luna (o con luna nueva):** el bloque de planetas se ve igual, porque no depende de la luna. Tarea 5.

---

### Task 1: posición de los planetas (`planetas.js`)

**Archivos:**
- Crear: `src/nucleo/planetas.js`
- Probar: `test/nucleo/planetas.test.js`
- Modificar: `package.json` y `package-lock.json` (`npm install --save-exact --save-dev astronomy-engine@2.1.19`)

**Interfaces:**
- Produce: `PLANETAS = ["venus", "marte", "jupiter", "saturno"]`; `posicionPlaneta(id, fecha, lat, lon) → { az, alt }` (`fecha` es `Date` o ms; `az` en grados de 0 a 360 desde el norte, `alt` en grados sobre el horizonte **con refracción**, como `posicionLuna` de `rumbo.js`); `separacion(a, b) → grados`, distancia angular entre dos `{ az, alt }`.
- Un `id` desconocido lanza un `Error` que lo nombra. `lat` se limita a ±89,9° para no devolver `NaN` en los polos.

- [ ] **Paso 1: pruebas que fallan.** `test/nucleo/planetas.test.js`, con TZ fija y las horas dadas con su desfase:
  - `planetas: Venus en la foto de Vigo` — `posicionPlaneta("venus", Date.parse("2026-09-13T21:28:37+02:00"), 42.2406, -8.7207)` da `alt` 4,1 ± 0,3 y `az` 242,8 ± 0,5.
  - `planetas: separación luna–Venus de la foto` — con `posicionLuna` (de `rumbo.js`) en ese mismo instante, `separacion(luna, venus)` da 8,4 ± 0,3.
  - `planetas: coinciden con una efeméride independiente` — para los cuatro planetas, en unas 20 combinaciones de fecha (entre 2026 y 2030) y lugar (Vigo, Santiago de Chile, Reikiavik, Sídney), con `astronomy-engine` (`Equator(cuerpo, fecha, observer, true, true)` y `Horizon(fecha, observer, ra, dec, "normal")`), `separacion` entre las dos posiciones es menor que 0,5° siempre que la efeméride dé `altitude > -2`.
  - `planetas: los polos no dan NaN` — latitudes 90 y −90: `az` y `alt` finitos.
  - `planetas: id desconocido` — `posicionPlaneta("mercurio", …)` lanza un error que contiene «mercurio».
- [ ] **Paso 2:** `npx vitest run test/nucleo/planetas.test.js`. Esperado: FALLA por no existir el módulo.
- [ ] **Paso 3: implementar** `src/nucleo/planetas.js` con los elementos keplerianos aproximados de JPL para 1800–2050 (tabla 1 de https://ssd.jpl.nasa.gov/planets/approx_pos.html: los seis elementos y sus tasas por siglo, de los cuatro planetas y del baricentro Tierra–Luna; cítese la fuente en la cabecera del módulo). Algoritmo: T = siglos desde J2000; M = L − ϖ; resolver Kepler; posición heliocéntrica en el plano de la órbita y giro a la eclíptica con ω, I y Ω; geocéntrica = planeta − baricentro; a longitud y latitud eclípticas; precesión sumando 1,3969713°·T a la longitud; ecuatoriales con la oblicuidad de la fecha (23,43929° − 0,0130042°·T); ángulo horario con el tiempo sidéreo de Greenwich (280,46061837 + 360,98564736629·(JD − 2451545)); a altura y acimut; refracción `0,0002967 / tan(h + 0,00312536 / (h + 0,08901179))` (h en radianes). Sin luz-tiempo, aberración ni nutación: el error queda muy por debajo de 0,5°.
- [ ] **Paso 4:** repetir el comando del paso 2. Esperado: todo pasa. Si falla la efeméride en un solo planeta, es una errata en sus elementos: corregirla contra la tabla de JPL (nunca ensanchar la tolerancia).
- [ ] **Paso 5: commit** `feat: posición de Venus, Marte, Júpiter y Saturno (planetas.js) contrastada con una efeméride`.

---

### Task 2: `data/cielo.json`, su validación y su carga

**Archivos:**
- Crear: `data/cielo.json`
- Modificar: `src/nucleo/datos.js` (`validarCielo`, llamada desde `validar`), `src/datos-incluidos.js`, `scripts/datos-de-disco.mjs` (los dos devuelven también `cielo`)
- Probar: `test/nucleo/datos.test.js`

**Interfaces:**
- Produce: `config.cielo` (forma de abajo), también en `datosIncluidos()` y `cargarDeDisco()`. `validar(config)` exige que exista y comprueba:
  - números: `dias` mayor que 0 y como mucho 90 (admite decimales); `maxEventos` entero de 1 a 20; `cercaLunaGrados` y `cercaPlanetasGrados` entre 0 y 30; `alturaMinGrados` entre 0 y 20; `solMaxGrados` entre −18 y 0; `pasoMin` de 1 a 10; `mismoPasoHoras` de 1 a 120; `altura.bajaMenosDe` menor que `altura.altaDesde`;
  - `reglasDeTiempo` es un género existente con motor `mejor-hora-nocturna`;
  - `cuerpos` tiene `luna` y todos los de `PLANETAS` (importados de `planetas.js`), cada uno con `nombre` y `enFrase`;
  - cada texto existe y contiene sus huecos: `titulo` {a} {b}; `ventana` {dia} {inicio} {fin}; `cuando.otro` {dia}; `acaba.baja` {cuerpo} {hora}; `acaba.bajaSinHora` {cuerpo}; `donde` {direccion} {grados} {altura} {alt}; `separacion.pegadas` y `.unPuno` {grados}; `planetas.frase` {planeta} {direccion} {altura} {cuando}; `planetas.direccion` {direccion}; `planetas.cuando.hasta` {hora}, `.desde` {hora}, `.entre` {inicio} {fin}.

La forma de `data/cielo.json` (los números son los del diseño; los textos, propuesta):

```json
{
  "dias": 30, "maxEventos": 5, "cercaLunaGrados": 10, "cercaPlanetasGrados": 2,
  "alturaMinGrados": 2, "solMaxGrados": -3, "pasoMin": 2, "mismoPasoHoras": 36,
  "reglasDeTiempo": "luna",
  "cuerpos": { "luna": { "nombre": "Luna", "enFrase": "la luna" }, "venus": { "nombre": "Venus", "enFrase": "Venus" },
    "marte": { "nombre": "Marte", "enFrase": "Marte" }, "jupiter": { "nombre": "Júpiter", "enFrase": "Júpiter" },
    "saturno": { "nombre": "Saturno", "enFrase": "Saturno" } },
  "etiqueta": "Próximo evento del cielo",
  "titulo": "{a} y {b}, muy cerca",
  "cuando": { "ahora": "Ahora", "hoy": "Hoy", "manana": "Mañana", "otro": "{dia}" },
  "ventana": "{dia}: se ve de {inicio} a {fin}.",
  "acaba": { "baja": "Después, {cuerpo} baja casi hasta el horizonte (se pone a las {hora}).",
    "bajaSinHora": "Después, {cuerpo} baja casi hasta el horizonte.", "amanecer": "Después, el cielo se aclara con el amanecer." },
  "altura": { "bajaMenosDe": 10, "altaDesde": 40, "baja": "a poca altura", "media": "a media altura", "alta": "a mucha altura" },
  "donde": "Hacia el {direccion} ({grados}°), {altura} ({alt}°).",
  "separacion": { "pegadas": "Casi pegadas: {grados}° entre una y otra.", "unPuno": "A un puño una de otra ({grados}°)." },
  "veredicto": { "verde": "Cielo despejado en ese rato.", "ambar": "Nubes a ratos: puede abrir algún hueco.",
    "rojo": "Cielo muy cubierto en ese rato.", "sinPrevision": "Sin previsión todavía." },
  "avisoNiebla": "Poca visibilidad (niebla): se verá borroso.",
  "proximos": "Ver los próximos",
  "planetas": { "titulo": "Planetas esta noche", "frase": "{planeta}, {direccion}, {altura}, {cuando}.", "direccion": "al {direccion}",
    "cuando": { "toda": "toda la noche", "hasta": "hasta las {hora}", "desde": "desde las {hora} hasta que amanezca", "entre": "de {inicio} a {fin}" } }
}
```

- [ ] **Paso 1: pruebas que fallan.** En `datos.test.js` (con el `errores(mut)` de siempre):
  - `cielo: los datos reales son válidos y hay cielo en la carga` — `Datos.validar(cargarDatos())` es `[]` y `cargarDatos().cielo.dias === 30`; `datosIncluidos().cielo` es igual al del disco.
  - `validar: falta cielo.json` — `delete c.cielo` → contiene «cielo.json».
  - `validar: números fuera de rango` — `c.cielo.dias = 0`, `c.cielo.solMaxGrados = 5`, `c.cielo.altura.bajaMenosDe = 50` → cada uno da un error con su nombre (`cielo.dias`, `cielo.solMaxGrados`, `cielo.altura`).
  - `validar: reglasDeTiempo apunta a un género nocturno` — `"atardecer"` y `"inexistente"` dan error con «reglasDeTiempo».
  - `validar: un texto sin su hueco o un planeta sin nombre` — `c.cielo.ventana = "se ve"` → error con «cielo.ventana» y «{fin}»; `delete c.cielo.cuerpos.saturno` → error con «saturno».
- [ ] **Paso 2:** `npx vitest run test/nucleo/datos.test.js`. Esperado: FALLAN las cinco (la primera, por no haber `cielo`).
- [ ] **Paso 3: implementar** `data/cielo.json` (la forma de arriba), `validarCielo(c, config, errores)` en `datos.js` con el estilo de los demás (mensajes «cielo.dias: …»), la línea en `validar`, y `cielo: leer("cielo.json")` en los dos cargadores.
- [ ] **Paso 4:** repetir el paso 2 y `npm run validar`. Esperado: todo pasa y «datos válidos».
- [ ] **Paso 5: commit** `feat: data/cielo.json con las cifras y los textos de los eventos del cielo, validado y cargado`.

---

### Task 3: encuentros y planetas de la noche (`eventos-cielo.js`)

**Archivos:**
- Crear: `src/nucleo/eventos-cielo.js`
- Probar: `test/nucleo/eventos-cielo.test.js`

**Interfaces:**
- Consume: `posicionPlaneta`, `separacion`, `PLANETAS` (Tarea 1); `posicionLuna` (`rumbo.js`); `alturas(fecha, lat, lon)` (`astro.js`, trae la altura del sol); `config.cielo` como `cfg` (Tarea 2).
- Produce `buscarEventos({ desde, lat, lon, cfg }) → Evento[]` (`desde` en ms; ordenados por `ventana.inicio`; solo los que aún no han acabado: `ventana.fin > desde`):
  `Evento = { cuerpos: [id, id], ventana: { inicio, fin }, acaba: { por: "amanecer" | id, sePone: ms | null }, mejor: { t, separacion, az, alt } }`. Los ids son `"luna"` (siempre el primero) o los de `PLANETAS` (en su orden). `acaba.por` es un id si ese astro baja de `alturaMinGrados`; `sePone` es el primer minuto en que ese astro baja de 0°, buscado hasta 3 h después (`null` si no llega, y siempre `null` con `"amanecer"`). `mejor.az` y `mejor.alt` son los del punto medio de los dos astros.
- Produce `planetasDeLaNoche({ inicio, fin, desde, lat, lon, cfg }) → Visible[]` (ms; mira de `max(inicio, desde)` a `fin`; ordenados por `inicio`; un planeta que no se ve no aparece):
  `Visible = { id, inicio, fin, alAnochecer, hastaElAmanecer, az, alt }`. La ventana es el primer rato con el planeta a más de `alturaMinGrados` y el sol a menos de `solMaxGrados`; `alAnochecer` es que empieza en el primer instante oscuro del rango; `hastaElAmanecer`, que acaba por la claridad (o porque se acaba el rango); `az` y `alt` son los del punto más alto de la ventana.

Algoritmo de `buscarEventos` (lo que las firmas no dicen): recorrer de `desde − 12 h` a `desde + dias·24 h + 6 h` (para cerrar la última ventana) cada `pasoMin` minutos; con el sol por encima de `solMaxGrados` no se calcula nada más; si no, posiciones de la luna y de los cuatro planetas una sola vez por instante, y para cada uno de los 10 pares una **ventana abierta** mientras los dos astros pasen de `alturaMinGrados`. Al cerrarse, se guarda el instante de menor separación; vale como evento si esa separación es menor que `cercaLunaGrados` (par con la luna) o `cercaPlanetasGrados`. Las ventanas del mismo par separadas por menos de `mismoPasoHoras` son un solo paso: queda la de menor separación.

- [ ] **Paso 1: pruebas que fallan** (todas con `cfg = cargarDatos().cielo`, Vigo `42.2406, −8.7207`, horas con su desfase):
  - `eventos: la tarde de la foto, 13 de septiembre de 2026` — `desde` `2026-09-13T00:00+02:00` con `{ ...cfg, dias: 1 }`: el evento `["luna","venus"]` tiene `ventana.inicio` entre 21:01 y 21:05, `ventana.fin` entre 21:19 y 21:23, `mejor.separacion` entre 8,2 y 8,9, `acaba.por === "luna"` y `acaba.sePone` entre 21:33 y 21:39 (la luna se pone a las 21:36).
  - `eventos: dos tardes seguidas son un solo paso` — `desde` `2026-09-10T00:00+02:00`, `dias: 7`: exactamente un evento `["luna","venus"]`, con `mejor.separacion` entre 3,2 y 3,8 y `ventana.inicio` entre 20:59 y 21:03 del 14 de septiembre.
  - `eventos: Venus y Júpiter en junio de 2026` — `desde` `2026-06-05T00:00+02:00`, `dias: 10`: un solo evento `["venus","jupiter"]`, con `mejor.separacion` menor que 1,8 y mayor que 1,2, ventana del 9 al 10 de junio de unas 22:28 a las 00:26 (± 4 min) (son tres tardes por debajo de 2°: un paso).
  - `eventos: lo que se avisa se ve` — para Vigo desde `2026-11-19T15:00+01:00`, Santiago de Chile (`−33.45, −70.66`) desde `2026-10-01T00:00-03:00` y Reikiavik (`64.15, −21.9`) desde `2026-10-15T00:00+00:00`, con `dias: 30`: en `ventana.inicio + 3 min`, en `mejor.t` y en `ventana.fin − 3 min` de cada evento, con efeméride independiente (SunCalc para el sol y la luna, `astronomy-engine` para los planetas) el sol está a menos de −2,6°, los dos astros a más de 1,4° y su separación es menor que el umbral + 0,6°. Además, ningún evento tiene `ventana.fin <= desde`.
  - `eventos: uno en curso se avisa y uno acabado no` — con `{ ...cfg, dias: 0.5 }` y `desde` `2026-09-13T21:10+02:00` aparece el de la foto con `ventana.inicio < desde < ventana.fin`; con `desde` `2026-09-13T21:30+02:00` no aparece.
  - `eventos: donde nunca anochece, nada y sin errores` — `70, 25`, `desde` `2026-06-21T00:00Z`, `dias: 30` → `[]`.
  - `eventos: la noche polar no rompe nada` — `78, 15.6`, `desde` `2026-12-20T00:00Z`, `dias: 30`: no lanza; todo número es finito; `ventana.inicio < mejor.t < ventana.fin`; salen ordenados.
  - `eventos: el cambio de hora de octubre` — Vigo, `desde` `2026-10-15T00:00+02:00`, `dias: 30`: ordenados por `ventana.inicio` y sin dos eventos del mismo par con el mismo inicio.
  - `eventos: 30 días se calculan sin colgar la pantalla` — `buscarEventos` de 30 días en Vigo tarda menos de 3 s.
  - `planetas de la noche: la del 13 de septiembre` — `inicio` `2026-09-13T20:00+02:00`, `fin` `2026-09-14T08:30+02:00`, `desde = inicio`: salen `venus` (`inicio` 21:01–21:07, `fin` 21:37–21:43, `alAnochecer` verdadero, `hastaElAmanecer` falso), `saturno` (`inicio` 21:53–21:59, `alAnochecer` falso, `hastaElAmanecer` verdadero), `marte` (`inicio` 03:17–03:23) y `jupiter` (`inicio` 05:25–05:31), por ese orden, todos con `az` y `alt` finitos.
  - `planetas de la noche: con la noche empezada` — mismos datos con `desde` `2026-09-14T04:00+02:00`: `marte` con `alAnochecer` verdadero (ya se ve) y sin `venus`.
- [ ] **Paso 2:** `npx vitest run test/nucleo/eventos-cielo.test.js`. Esperado: FALLA por no existir el módulo.
- [ ] **Paso 3: implementar** `buscarEventos` y `planetasDeLaNoche` en `src/nucleo/eventos-cielo.js`, con las firmas y el algoritmo de arriba (módulo puro, sin pantalla).
- [ ] **Paso 4:** repetir el paso 2. Esperado: todo pasa. Si la prueba «lo que se avisa se ve» falla, es un fallo del módulo, no de la tolerancia.
- [ ] **Paso 5: commit** `feat: encuentros de la luna y los planetas y planetas de cada noche (eventos-cielo.js)`.

---

### Task 4: veredicto de nubes para un rato y la lista de eventos de Hoy

**Archivos:**
- Modificar: `src/nucleo/semaforo.js` (`puntuarNocturno` y la interfaz común), `src/nucleo/dias.js` (`eventosDelCielo`, `prepararVista`), `test/e2e/ayudas.cjs` (helper `previsionDesplazada`)
- Probar: `test/nucleo/semaforo.test.js`, `test/nucleo/pantalla.test.js`

**Interfaces:**
- Consume: `buscarEventos` (Tarea 3), `config.cielo` (Tarea 2), `fechaLugar` (`dias.js`).
- Produce `S.evaluarRato(id, prev, { desde, hasta }) → null | { nivel: "verde"|"ambar"|"rojo", nubes, lluvia, tormenta, niebla }`. Usa las horas de la previsión que se solapan con `[desde, hasta]` (`x.t < hasta && x.t + HORA > desde`); `null` si no hay ninguna. Aplica las reglas de nubes y lluvia del género `id` (motor nocturno) exactamente como `puntuarNocturno`: para ello se extrae de `puntuarNocturno` a una función interna `valorarHoras(g, horas)` el cálculo del nivel (veto por lluvia, mejor hora, umbrales de nubes, tope ámbar por lluvia y tormenta, niebla con `comun.nieblaKm`); `puntuarNocturno` la usa y su resultado no cambia.
- Produce `eventosDelCielo({ config, S, prev, lat, lon, ahora }) → Array<Evento & { fecha, enCurso, tiempo }>` en `dias.js`: los primeros `cielo.maxEventos` de `buscarEventos({ desde: ahora, … })`; `fecha` es `fechaLugar(ventana.inicio, prev)` (el día del lugar); `enCurso` es `ventana.inicio <= ahora`; `tiempo` es `S.evaluarRato(cielo.reglasDeTiempo, prev, ventana)` (`null` = sin previsión).
- `prepararVista` devuelve además `eventosCielo` (la lista anterior).
- Produce en `ayudas.cjs`: `previsionDesplazada(primerDia)` → la previsión simulada con todas las fechas de `hourly.time`, `daily.time`, `sunrise` y `sunset` corridas los mismos días enteros para que su primer día sea `primerDia` (por ejemplo `"2026-09-11"`), sin tocar las horas.

- [ ] **Paso 1: pruebas que fallan.** En `semaforo.test.js` (con la previsión simulada, `prev = S.prepararPrevision(datos)`; `evaluarRato("luna", prev, …)`):
  - `evaluarRato: noche despejada es verde` — un rato de una hora la noche del 20 al 21 de noviembre → `nivel === "verde"`.
  - `evaluarRato: cielo cubierto es rojo y nubes intermedias, ámbar` — con todas las `cloud_cover` y `cloud_cover_low` del rato a 95 → `"rojo"`; a 45 → `"ambar"`.
  - `evaluarRato: lluvia fuerte veta` — `precipitation` 10 en el rato → `"rojo"`.
  - `evaluarRato: niebla y tormenta` — `visibility` 2000 → `niebla === true`; `weather_code` 95 → `tormenta === true` y nivel no verde.
  - `evaluarRato: sin previsión o solo en parte` — un rato de diciembre → `null`; un rato que empieza una hora antes de la primera hora de la previsión y acaba dentro → no `null`.
  - Las pruebas que ya existen de `puntuarNocturno` siguen pasando sin tocarlas.
  En `pantalla.test.js`, con `datos = previsionDesplazada("2026-09-11")` leída desde `ayudas.cjs` con `createRequire`, `ahora = 2026-09-13T15:00+02:00`, Vigo:
  - `eventos del cielo: la lista de Hoy` — `prepararVista(...).eventosCielo` tiene como mucho `cielo.maxEventos` elementos, todos con `fecha`, `enCurso === false` el de `["luna","venus"]`, cuya `fecha` es `"2026-09-14"` y cuyo `tiempo.nivel` es uno de los tres.
  - `eventos del cielo: sin previsión todavía` — con la misma previsión recortada a las horas anteriores al 14 de septiembre (se filtran todos los arrays de `hourly` por su `time`), el evento `["luna","venus"]` (ventana del 14) tiene `tiempo === null`.
  - `eventos del cielo: el día es el del lugar` — con `prev` copiado y `desfaseMs = 6 h`, la `fecha` del evento `["luna","venus"]` (su ventana empieza a las 19:01 UTC del 14) es `"2026-09-15"`.
- [ ] **Paso 2:** `npx vitest run test/nucleo/semaforo.test.js test/nucleo/pantalla.test.js`. Esperado: FALLAN solo las nuevas.
- [ ] **Paso 3: implementar** `valorarHoras` + `evaluarRato` en `semaforo.js`, `eventosDelCielo` y el campo de `prepararVista` en `dias.js`, y `previsionDesplazada` en `ayudas.cjs` (exportada con las demás).
- [ ] **Paso 4:** repetir el paso 2 y `npm test`. Esperado: todo pasa.
- [ ] **Paso 5: commit** `feat: veredicto de nubes para cualquier rato y lista de eventos del cielo en la vista de Hoy`.

---

### Task 5: la tarjeta y el bloque de planetas en pantalla

**Archivos:**
- Crear: `src/componentes/TarjetaCielo.svelte`, `src/componentes/PlanetasNoche.svelte`, `test/e2e/compilada/cielo.e2e.cjs`
- Modificar: `src/estado/hoy.svelte.js` (campo `eventosCielo`, que `mostrar()` rellena con `v.eventosCielo`), `src/pantallas/Hoy.svelte` (la tarjeta entre `Asistente` y `Pestanas`), `src/componentes/PanelNocturno.svelte` (el bloque, después de la lista «Sale / Se pone»), `src/estilos.css`

**Interfaces:**
- Consume: `hoy.eventosCielo` (Tarea 4), `config.cielo`, `planetasDeLaNoche` (Tarea 3), `Flecha`, `Plantilla`, `puntoCardinal`, `unida`, `hm`, `punos`.
- `TarjetaCielo` no recibe nada: lee `hoy`. Se ve solo con `hoy.vistaLista` y al menos un evento. Es una `<section class="cielo" aria-label={cielo.etiqueta}>` con el primer evento (título, línea de la ventana, qué la acaba, dirección y altura con la `Flecha` del punto medio, separación y veredicto con su símbolo de `SIMBOLO`; el color nunca es lo único que dice el nivel) y, si hay más, `<details class="cielo-proximos"><summary>{cielo.proximos}</summary>` con una lista `<ol>` de los demás en una línea cada uno (día, par, ventana y símbolo del veredicto). El día se escribe «Hoy», «Mañana», «Ahora» (si `enCurso`) o el día de la semana y el número («Domingo 13»), con `cielo.cuando`. Textos: el título con `nombre` de cada cuerpo; `donde` con `unida(puntoCardinal(mejor.az))`, los grados redondeados y la palabra de `cielo.altura` según `mejor.alt` (menos de `bajaMenosDe`: `baja`; desde `altaDesde`: `alta`; si no, `media`); `separacion.pegadas` si `punos(mejor.separacion) === 0` y `unPuno` si no; `acaba.amanecer` si `acaba.por === "amanecer"`, y si no `acaba.baja` (con `enFrase` del astro y la hora de `sePone`) o `acaba.bajaSinHora` si `sePone` es `null`. Sin `tiempo`, el veredicto dice `cielo.veredicto.sinPrevision`; con `tiempo.niebla`, añade `cielo.avisoNiebla`, con `tiempo.tormenta` el aviso de tormenta de `comun.avisos` y con `S.nivelLluvia(tiempo.lluvia) === "llovizna"` el de llovizna. Solo la brújula de la pestaña usa la brújula viva del móvil: aquí la flecha es fija.
- `PlanetasNoche` recibe `{ item }` (la noche): `<section class="planetas-noche">` con `<h3>` (`cielo.planetas.titulo`) y una frase por planeta visible (`cielo.planetas.frase`), con `desde` el reloj del dispositivo (`reloj` de `PanelNocturno`) y la palabra de `cuando` que toque (`toda` si `alAnochecer` y `hastaElAmanecer`; `hasta` si solo lo primero; `desde` si solo lo segundo; `entre` si ninguno). Sin planetas visibles no pinta nada. La altura usa `cielo.altura` (`punos` no hace falta).

- [ ] **Paso 1: pruebas que fallan.** `test/e2e/compilada/cielo.e2e.cjs` (copiar la cabecera, el chequeo de `dist/` y `ejecutar` de `brujula.e2e.cjs`; reloj `2026-09-13T15:00:00+02:00` con la previsión servida por `p.route` desde `previsionDesplazada("2026-09-11")`; Vigo por GPS):
  - `tarjeta: aparece con el evento de Luna y Venus` — existe `.cielo`; abriendo `.cielo-proximos` (si hay), el texto de toda la sección contiene «Luna y Venus, muy cerca» y casa con `/se ve de 2[01]:\d\d a (2[0-3]|0\d):\d\d/`; hay un veredicto de los cuatro posibles de `cielo.json`; hay una flecha (`svg` con «Dirección» en su `aria-label`).
  - `tarjeta: como mucho cinco y los demás se abren` — contando el principal, nunca más de 5 eventos; `.cielo-proximos` empieza cerrado y se abre al pulsar su `summary`.
  - `tarjeta: en cualquier pestaña` — con `[data-tab=amanecer]`, `[data-tab=atardecer]` y `[data-tab=luna]`, hay una sola `.cielo`.
  - `tarjeta: no desborda a 320 px` — ancho 320, con la fuente ancha de `brujula.e2e.cjs`: `document.documentElement.scrollWidth <= innerWidth` y ningún descendiente de `.cielo` pasa su borde derecho; lo mismo a 360 px y a 390 px.
  - `tarjeta: sin eventos no hay tarjeta` — lugar guardado a 70° N (`{ lat: 70, lon: 25, nombre: "Norte", origen: "busqueda" }`), reloj `2026-06-21T15:00:00+02:00`, previsión de `previsionDesplazada("2026-06-19")`: no existe `.cielo` y no hay errores de consola.
  - `noche: los planetas de esta noche` — en `[data-tab=luna]` existe `.planetas-noche` y su texto casa con `/Venus, al [^,]+, a poca altura, hasta las 21:[34]\d\./` y contiene «Saturno»; sin errores de consola.
  - `noche: sin luna, los planetas se ven igual` — reloj `2026-11-09T15:00:00+01:00` (luna nueva el 9 de noviembre de 2026) y previsión de `previsionDesplazada("2026-11-08")`: en `[data-tab=luna]` hay un `#panel .veredicto.ninguno` y un `.planetas-noche` cuyo texto contiene «Saturno».
- [ ] **Paso 2:** `npm run build` y `node test/e2e/compilada/cielo.e2e.cjs`. Esperado: FALLAN todas (aún no hay tarjeta ni bloque).
- [ ] **Paso 3: implementar** el estado, los dos componentes, su sitio en `Hoy.svelte` y `PanelNocturno.svelte` y los estilos (`.cielo`, `.cielo-proximos`, `.planetas-noche`) solo con las variables de color que ya existen, para que el modo oscuro y la paleta no cambien. Compacta: la tarjeta cabe en unos 4 renglones a 390 px.
- [ ] **Paso 4:** `npm run build` y `node test/e2e/compilada/cielo.e2e.cjs`. Esperado: todo pasa.
- [ ] **Paso 5: comprobar a ojo** con `test/e2e/capturas.cjs` (o Playwright a mano) la tarjeta abierta y cerrada y el bloque de Noche, a 320 y 390 px, en claro y en oscuro, y mirar las imágenes: nada cortado, el símbolo del veredicto legible, la tarjeta no domina la pantalla.
- [ ] **Paso 6:** `bash test/ejecutar-todo.sh`. Esperado: todo pasa. Si una prueba existente depende de lo que hay antes de las pestañas (posiciones, altura del cuerpo), se corrige la prueba y se ledgera como `Ruling:`; si el fallo es de desbordamiento o de contraste, se corrige la pantalla.
- [ ] **Paso 7: commit** `feat: tarjeta del próximo evento del cielo en Hoy y planetas de la noche en Noche`.

---

### Task 6: documentación

**Archivos:**
- Modificar: `docs/datos.md`, `docs/diseno.md`, `README.md` (solo si lista las funciones de la app)

**Interfaces:**
- Consume: la forma final de `data/cielo.json` y de la pantalla.

- [ ] **Paso 1:** en `docs/datos.md`, una fila nueva en la tabla de archivos y una sección «Los eventos del cielo (`cielo.json`)»: qué es cada número (con la regla de las ventanas y del paso), qué significan `reglasDeTiempo` y los huecos `{…}` de cada texto, y que los planetas salen de elementos orbitales aproximados de JPL (1800–2050, error de unas décimas de grado). En `docs/diseno.md`, una sección «La tarjeta del cielo y los planetas de la noche» (dónde va, por qué encima de las pestañas, por qué no hay tarjeta sin eventos, qué muestra la lista) y, en «Pendiente», lo que queda fuera: eclipses y lluvias de estrellas, Mercurio, la receta «luna con planeta» (con los ajustes de la foto de septiembre: manual, 55 mm, f/5.6, ISO 400, 1 s, trípode) y la capa de enseñanza. En `README.md`, una línea si hay lista de funciones.
- [ ] **Paso 2:** comprobar que lo escrito coincide con el código (los nombres de campos, los números de `cielo.json`): `grep` de cada nombre citado. Esperado: sin discrepancias.
- [ ] **Paso 3:** `npm test`. Esperado: todo pasa (la documentación no rompe nada, pero es la última comprobación de la rama).
- [ ] **Paso 4: commit** `docs: los eventos del cielo y los planetas (datos, diseño y pendientes)`.
