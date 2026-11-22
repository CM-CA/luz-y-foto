# Buscador en una línea, sugerencias y número del día Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El selector de lugar cabe en una línea con iconos, sugiere ciudades mientras se escribe y cada botón de día muestra su número.

**Architecture:** El formulario `#buscar` pasa a contener el botón de ubicación. Un módulo puro (`src/nucleo/sugerencias.js`) con espera, cancelación y descarte de respuestas tardías lo conecta `hoy.svelte.js` con la lista `#resultados` que ya existe. El número del día sale de `fecha` de cada elemento de la lista.

**Tech Stack:** Svelte 5, Vite, Vitest (`npx vitest run`), Playwright (`node test/e2e/compilada/*.e2e.cjs` tras `npm run build`).

**Spec:** [`docs/superpowers/specs/2026-11-22-buscador-y-dias-design.md`](../specs/2026-11-22-buscador-y-dias-design.md)

## Global Constraints

- Ids que no cambian: `#gps`, `#ciudad`, `#buscar`, `#resultados`, `#msgLugar`, `#dias`; el botón de buscar sigue siendo `#buscar button[type=submit]`.
- Mínimo de sugerencias: 3 letras (`MINIMO_LETRAS = 3`); espera: 400 ms (`ESPERA_MS = 400`).
- Botones de icono de al menos 44 × 44 px; nombres accesibles exactos «Usar mi ubicación» y «Buscar».
- 320 px de ancho sin desbordes; claro y oscuro; sin dependencias de ejecución nuevas.
- El símbolo del semáforo de cada día (● ▲ ■ ○) y su `✓` de elegido se quedan; el número es solo visual (`aria-hidden`).
- El español de la app no cambia, salvo el mensaje inicial del selector: «Escribe tu ciudad o usa tu ubicación.»
- No se une a `master` sin orden expresa de la persona.

## Review Focus

- Una sugerencia que llega tarde no pisa el resultado de una búsqueda explícita (Intro o lupa justo después de escribir).
- Elegir un lugar o cerrar el selector con una petición en vuelo: la respuesta tardía no reabre ni rellena la lista.
- Sin conexión o con el servicio caído mientras se escribe: ningún aviso de error ni excepción sin atrapar; la búsqueda explícita sigue avisando como hoy.
- Teclado y lector de pantalla: Intro en el campo sigue buscando, los botones de icono tienen nombre y el orden de foco es campo, ubicación, lupa.
- 320 px: la fila del buscador y el botón de día con «Miércoles» y número de dos cifras caben sin salirse.

---

### Task 1: Buscador en una línea

**Files:**
- Modify: `src/componentes/SelectorLugar.svelte`, `src/estilos.css` (reglas `.selector`), `src/estado/hoy.svelte.js` (mensaje inicial)
- Create: `test/e2e/compilada/buscador.e2e.cjs`

**Interfaces:**
- Consumes: `usarGps(silencioso)`, `buscar(texto)`, `hoy.mensajeLugar`, `hoy.resultados`, `elegirResultado(i)` de `src/estado/hoy.svelte.js`.
- Produces: el `<form id="buscar">` contiene `#ciudad`, `button#gps[type=button]` y `button[type=submit]`; `abrirSelector("")` muestra `MENSAJE_INICIAL`. La Task 2 añade pruebas al mismo `buscador.e2e.cjs`.

- [ ] **Step 1: Write the failing e2e test** en `test/e2e/compilada/buscador.e2e.cjs` (mismo arranque que `seleccion.e2e.cjs`: `ejecutar`, `nuevaPagina`, perfil de móvil y lugar Vigo). Para cada ancho de `[320, 360, 390]`: abrir `#/hoy`, pulsar `#cambiar` y comprobar, con `getBoundingClientRect`, que (a) `#ciudad`, `#gps` y `#buscar button[type=submit]` están en la misma fila (diferencia de `top` ≤ 2 px) y dentro de `#buscar`; (b) los dos botones miden ≥ 44 × 44 px y el campo ≥ 44 px de alto; (c) `document.documentElement.scrollWidth <= clientWidth`; (d) `p.getByRole("button", { name: "Usar mi ubicación" })` y `getByRole("button", { name: "Buscar" })` existen una vez cada uno; (e) el texto de `#msgLugar` es «Escribe tu ciudad o usa tu ubicación.».
- [ ] **Step 2: Run it to see it fail**

Run: `npm run build --silent && node test/e2e/compilada/buscador.e2e.cjs`
Expected: líneas `FALLA` por la fila (el botón de ubicación está fuera del formulario), por los nombres y por el mensaje; sale con código 1.

- [ ] **Step 3: Implement** en `SelectorLugar.svelte`: mover `#gps` dentro del `<form id="buscar">`, entre el campo y el botón de buscar, con `type="button"`, `class="icono principal"`, `aria-label="Usar mi ubicación"`, `title` igual, y un SVG inline `aria-hidden="true"` (círculo con cuatro marcas, trazo `currentColor`, 22 px); el botón de buscar pasa a `class="icono"`, `aria-label="Buscar"`, `title="Buscar"` con SVG de lupa. En `estilos.css`: `.selector form` sigue en fila con `align-items: stretch`, `.selector input { min-height: 44px }` y `.selector button.icono { flex: none; width: 44px; min-height: 44px; padding: 0; display: grid; place-items: center }`. En `hoy.svelte.js`: `const MENSAJE_INICIAL = "Escribe tu ciudad o usa tu ubicación."` y `alternarSelector` abre con él.
- [ ] **Step 4: Run it to see it pass**

Run: `npm run build --silent && node test/e2e/compilada/buscador.e2e.cjs`
Expected: todas las líneas `ok`.

- [ ] **Step 5: Run the suite and look at it.** `bash test/ejecutar-todo.sh` debe seguir en verde (el selector lo usan `brujula`, `prevision-guardada` y `comportamiento/lugar`). Capturar el selector abierto a 320 y 390 px en claro y oscuro con `scratchpad/capturas-carlos.cjs` y mirar que se vea bien.
- [ ] **Step 6: Commit**

```bash
git add src test
git commit -m "feat: el buscador de lugar cabe en una línea, con iconos de ubicación y de búsqueda"
```

---

### Task 2: Sugerencias al escribir

**Files:**
- Create: `src/nucleo/sugerencias.js`, `test/nucleo/sugerencias.test.js`, `test/nucleo/http.test.js`
- Modify: `src/proveedores/http.js`, `src/proveedores/geocodificacion.js`, `src/estado/hoy.svelte.js`, `src/componentes/SelectorLugar.svelte`, `test/e2e/compilada/buscador.e2e.cjs`

**Interfaces:**
- Consumes: de la Task 1, el formulario y `#resultados`; `buscarCiudad(texto)` de `geocodificacion.js`.
- Produces:
  - `pedirJson(url: string, ms?: number, senal?: AbortSignal): Promise<any>`: si `senal` se aborta, aborta el `fetch` y la promesa se rechaza.
  - `buscarCiudad(texto: string, senal?: AbortSignal): Promise<Resultado[]>`.
  - `MINIMO_LETRAS = 3`, `ESPERA_MS = 400` y `crearSugeridor({ buscar, alVaciar, alRecibir, espera?, minimo? })` en `src/nucleo/sugerencias.js`, que devuelve `{ escribir(texto: string): void, cancelar(): void }`. `buscar(q: string, senal: AbortSignal): Promise<any[]>`; `alVaciar()` se llama al escribir menos de `minimo` letras; `alRecibir(resultados: any[], q: string)` solo con la respuesta de la última búsqueda lanzada. Los fallos de `buscar` no llegan a nadie. Usa `setTimeout` y `clearTimeout` globales (se prueban con `vi.useFakeTimers()`).
  - `escribirCiudad(texto: string): void` exportada de `hoy.svelte.js`.

- [ ] **Step 1: Write the failing unit tests** en `test/nucleo/sugerencias.test.js` (Vitest, `vi.useFakeTimers()`, `buscar` es un `vi.fn` que devuelve promesas controladas). Una prueba por frase:
  - «no busca con menos de 3 letras y vacía la lista»: `escribir("Vi")`, avanzar 1000 ms → `buscar` 0 veces, `alVaciar` 1 vez.
  - «cuenta las letras sin los espacios de los lados»: `escribir("  Vi ")` → `buscar` 0 veces; `escribir(" Vig ")` y avanzar 400 → `buscar` 1 vez con `"Vig"`.
  - «espera 400 ms desde la última tecla y busca una sola vez»: `escribir("Vig")`, avanzar 300, `escribir("Vigo")`, avanzar 399 → 0 llamadas; avanzar 1 → 1 llamada con `"Vigo"`.
  - «entrega los resultados de la última búsqueda»: la respuesta llega → `alRecibir` con esos resultados y `"Vigo"`.
  - «descarta la respuesta de una búsqueda anterior»: lanzar `"Vigo"`, luego `"Lugo"`; resolver primero la de `"Lugo"` y después la de `"Vigo"` → `alRecibir` una vez, con `"Lugo"`.
  - «aborta la petición en vuelo al escribir otra cosa»: tras lanzar `"Vigo"`, `escribir("Vigo ")` y avanzar 400 → la `senal` de la primera llamada tiene `aborted === true`.
  - «cancelar() descarta lo pendiente y lo que viene en camino»: un temporizador pendiente no llega a buscar; una respuesta en vuelo no llama a `alRecibir`; la `senal` queda abortada.
  - «un fallo de la búsqueda no avisa a nadie»: `buscar` rechaza → `alRecibir` y `alVaciar` sin llamadas nuevas y sin rechazos sin atrapar.

  Y `test/nucleo/http.test.js`: con `globalThis.fetch` sustituido por una función que espera a su `signal`, «abortar la señal externa aborta la petición» (la promesa de `pedirJson(url, 8000, control.signal)` se rechaza tras `control.abort()`) y «una señal ya abortada rechaza sin pedir nada».
- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/nucleo/sugerencias.test.js test/nucleo/http.test.js`
Expected: FAIL, el módulo `sugerencias.js` no existe y `pedirJson` ignora la señal.

- [ ] **Step 3: Implement** `src/proveedores/http.js` (enlazar la señal externa con el `AbortController` interno y quitar el oyente al terminar) y `src/proveedores/geocodificacion.js` (`buscarCiudad(texto, senal)` la pasa a `pedirJson`). `src/nucleo/sugerencias.js` guarda un contador de búsquedas, el temporizador y el `AbortController` vigentes; `cancelar` invalida todo; no hay estado fuera del cierre.
- [ ] **Step 4: Run them to see them pass**

Run: `npx vitest run test/nucleo/sugerencias.test.js test/nucleo/http.test.js`
Expected: PASS, todas las pruebas nuevas.

- [ ] **Step 5: Write the failing e2e checks** (mismo archivo `buscador.e2e.cjs`, reloj falso de `nuevaPagina`, `p.clock.runFor`): (a) escribir «Vigo» con `pressSequentially` y avanzar 450 ms → aparecen 2 `#resultados li` y `p.llamadas.geocoding === 1`; (b) escribir «Vi» y avanzar 450 ms → no hay `li` y `geocoding === 0`; (c) escribir «Vigo» y pulsar Intro sin avanzar el reloj → aparecen los 2 resultados (búsqueda inmediata) y, tras avanzar 450 ms, `geocoding` sigue en 1; (d) tras (a), borrar hasta quedar «Vi» → la lista queda vacía; (e) elegir `#resultados li >> nth=0` cierra el selector y el nombre del lugar de la cabecera empieza por «Vigo»; (f) con la ruta de geocodificación abortada (`p.route(..., r => r.abort())`), escribir «Vigo» y avanzar 450 ms → `#msgLugar` sigue siendo el mensaje inicial y `p.errores` está vacío; después Intro muestra «No he podido buscar. Comprueba la conexión e inténtalo de nuevo.».
- [ ] **Step 6: Run it to see it fail**

Run: `npm run build --silent && node test/e2e/compilada/buscador.e2e.cjs`
Expected: `FALLA` en (a), (c), (d) y (f).

- [ ] **Step 7: Implement** en `hoy.svelte.js`: `const sugeridor = crearSugeridor({ buscar: buscarCiudad, alVaciar: () => { hoy.resultados = []; hoy.mensajeLugar = MENSAJE_INICIAL; }, alRecibir: (r) => { hoy.resultados = r; hoy.mensajeLugar = r.length ? "Elige tu lugar:" : MENSAJE_INICIAL; } })`; exportar `escribirCiudad(texto)`; `buscar`, `elegirResultado` y `cerrarSelector` llaman antes a `sugeridor.cancelar()`. En `SelectorLugar.svelte`, `oninput={(ev) => escribirCiudad(ev.currentTarget.value)}` en el campo (conservando `bind:value`).
- [ ] **Step 8: Run it to see it pass, then the whole suite**

Run: `npm run build --silent && node test/e2e/compilada/buscador.e2e.cjs && bash test/ejecutar-todo.sh`
Expected: todo `ok` y la suite completa en verde.

- [ ] **Step 9: Commit**

```bash
git add src test
git commit -m "feat: sugerencias de ciudades mientras se escribe (3 letras, 0,4 s de espera, sin avisos de error)"
```

---

### Task 3: Número del día en los botones de día

**Files:**
- Modify: `src/nucleo/dias.js`, `src/componentes/Dias.svelte`, `src/estilos.css` (reglas `.dias`), `test/nucleo/pantalla.test.js`, `test/e2e/compilada/maquetacion.e2e.cjs`, `test/e2e/compilada/seleccion.e2e.cjs`

**Interfaces:**
- Consumes: la lista de días de `listaDe` (cada elemento lleva `fecha: "AAAA-MM-DD"`).
- Produces: `numeroDia(x: { fecha: string }): number` en `src/nucleo/dias.js`; cada `#dias button` lleva `<span class="num" aria-hidden="true">N</span>` junto a `.marca`.

- [ ] **Step 1: Write the failing tests.** En `pantalla.test.js`: «numeroDia da el día del mes sin cero a la izquierda», con `numeroDia({ fecha: "2026-11-22" }) === 22` y `numeroDia({ fecha: "2026-12-01" }) === 1`; y «cada día de la lista lleva su número», comparando `listaDe(g, prev, ahora).map(numeroDia)` con los días del mes de las etiquetas «Hoy», «Mañana» y «Sábado» de la prueba existente. En `seleccion.e2e.cjs`: cada `#dias button` tiene un `.num` cuyo texto es un entero entre 1 y 31 y cuyos números van en orden (con el cambio de mes, el siguiente es menor). En `maquetacion.e2e.cjs`, dentro de la comprobación de los botones de día, poner además `.num` = «28» en el último botón y exigir que `.marca` y `.num` quedan dentro de su botón y en la misma fila (diferencia de `top` ≤ 4 px) a todos los anchos.
- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/nucleo/pantalla.test.js && npm run build --silent && node test/e2e/compilada/seleccion.e2e.cjs`
Expected: FAIL, `numeroDia` no existe y no hay `.num`.

- [ ] **Step 3: Implement** `numeroDia` en `dias.js` (`Number(x.fecha.slice(8, 10))`); en `Dias.svelte`, el mapa de días añade `numero: numeroDia(x)` y el botón envuelve `.marca` y `<span class="num" aria-hidden="true">{d.numero}</span>` en un `<span class="cima">`; en `estilos.css`, `.dias .cima { display: flex; align-items: center; justify-content: center; gap: 6px }` y `.dias .num { font-size: 20px; font-weight: 700; line-height: 1; color: var(--texto) }`.
- [ ] **Step 4: Run them to see them pass, then the whole suite**

Run: `npx vitest run && npm run build --silent && node test/e2e/compilada/seleccion.e2e.cjs && node test/e2e/compilada/maquetacion.e2e.cjs && bash test/ejecutar-todo.sh`
Expected: todo `ok` y la suite en verde.

- [ ] **Step 5: Look at it.** Capturar la pantalla Hoy a 320 y 390 px, en claro y oscuro, con los tres días y con el último en «Miércoles»; si el número y el símbolo se ven apretados, ajustar solo `gap` y tamaños.
- [ ] **Step 6: Commit**

```bash
git add src test
git commit -m "feat: cada botón de día muestra su número, junto al semáforo"
```

---

### Task 4: Documentación

**Files:**
- Modify: `docs/diseno.md`, `README.md` (solo si habla del selector o de los botones de día)

**Interfaces:**
- Consumes: lo hecho en las Tasks 1 a 3.
- Produces: la documentación describe el selector en una línea, las sugerencias (3 letras, 0,4 s, cancelación, fallos en silencio, texto parcial enviado al servicio de búsqueda de Open-Meteo) y el número del día.

- [ ] **Step 1: Update** `docs/diseno.md` en las líneas que hablan del lugar y de la tira de días (líneas 20 y 59 aprox.): selector con campo, ubicación y lupa en una fila; sugerencias; número del día junto al símbolo. Comprobar con `grep -rn "Usar mi ubicación\|botón de ubicación" README.md docs` que no quede ninguna frase que describa el selector de antes.
- [ ] **Step 2: Run the whole suite**

Run: `bash test/ejecutar-todo.sh`
Expected: todo en verde.

- [ ] **Step 3: Commit**

```bash
git add docs README.md
git commit -m "docs: el selector en una línea, las sugerencias y el número del día"
```
