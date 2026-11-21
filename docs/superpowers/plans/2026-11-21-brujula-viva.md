# La brújula del móvil en Luna y Atardecer — plan de implementación

> **Para quien ejecute esto:** SUB-SKILL OBLIGATORIA: usar superpowers:executing-plans (en esta sesión) o superpowers:subagent-driven-development. Los pasos llevan casillas (`- [ ]`).

**Objetivo:** una brújula con flecha, grados y altura en la pestaña Luna, y la brújula del móvil (opcional) que la hace girar, en Luna y en Atardecer.

**Arquitectura:** un módulo puro nuevo (`src/nucleo/rumbo.js`) calcula dónde está la luna, a qué momento apunta la flecha y qué rumbo da el sensor; un estado (`orientacion.svelte.js`) escucha el sensor solo mientras hace falta; un componente (`Brujula.svelte`) pinta flecha, texto y botón y lo comparten `PanelPuntos` (Atardecer) y `PanelNocturno` (Luna). Los textos van en `data/generos/luna.json`.

**Tecnología:** Svelte 5 (runes), Vite 8, vitest, Playwright (e2e sobre `dist/`), SunCalc (paquete `suncalc`, como `astro.js`).

**Spec:** `docs/superpowers/specs/2026-11-21-brujula-viva-design.md`

## Restricciones globales

- Todo en español; los textos que ve la persona y que ya viven en `data/` siguen allí (la frase de Luna, como la de Atardecer). Los textos del botón y de los mensajes de la brújula viva van en el componente.
- Sin dependencias nuevas. Sin red: la brújula funciona sin conexión. Solo se toca `/beta/` (la raíz sigue siendo la web antigua).
- La información va en texto: dirección en palabras y grados, altura en grados y puños. El dibujo es un apoyo (un navegador que oscurece SVG por su cuenta no esconde nada).
- 320, 360 y 390 px sin desbordar, claro y oscuro, letra del sistema y letra ancha (`DejaVu Sans`); botón de al menos 44 px de alto; peso total bajo el presupuesto de `pwa.e2e.cjs` (160 000 bytes).
- Sin transiciones CSS en el dial vivo (al pasar de 359° a 1° daría la vuelta entera).
- Siempre `export TZ=Europe/Madrid`. Compilar para probar: `npm run build -- --base=/luz-y-foto/beta/`.
- Los commits terminan con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_017PrdMnF71MdYHZ7c5GiQDs`.
- **Cierre de cada tarea:** compilar → commit → `task-done PLAN N BASE -- bash -c 'npm run test:logica >/dev/null 2>&1 && npm run test:navegador'` → `git push origin migracion-svelte`, `git update-ref refs/remotes/origin/migracion-svelte HEAD` y esperar a `gh run list --branch migracion-svelte --limit 1` = `completed success <SHA corto actual>` → avisar a la persona (una frase). Si falla solo el paso «publicar» con «Fetching artifact metadata failed», relanzar con `gh run rerun <id> --failed`.

## Review Focus (enfoque de revisión)

- La luna no está sobre el horizonte en toda la noche: ni brújula, ni hueco vacío, ni error (prueba unitaria de `momentoDeLaLuna` → `null` y guarda `{#if}` en el panel).
- Lecturas vacías: Chrome de escritorio dispara una vez `deviceorientation` con `alpha`, `beta` y `gamma` a `null`; el iPhone puede rechazar `requestPermission` (rechazo o excepción). Ninguna cuenta como lectura: salen los mensajes y no se rompe nada.
- Brújula activa y la persona cambia de pestaña, de noche, de lugar o esconde la página: sin escuchas colgadas, el objetivo es el nuevo y el estado sigue siendo coherente.
- Hemisferio sur (la luna al norte) y cruce del norte (359° → 1°): textos correctos y el dial no da la vuelta.
- «Ahora» no se queda viejo: el reloj del dispositivo se recalcula cada minuto, y el intervalo se limpia al salir del panel.

---

### Task 1: núcleo puro `rumbo.js`

**Archivos:**
- Crear: `src/nucleo/rumbo.js`, `test/nucleo/rumbo.test.js`
- Modificar: `docs/superpowers/specs/2026-11-21-brujula-viva-design.md` (añadir el caso «al anochecer» y los nombres sin ñ)

**Interfaces:**
- Produce (todas exportadas, importan `* as SunCalc from "suncalc"`):
  - `posicionLuna(fecha: Date | number, lat: number, lon: number): { az: number, alt: number }` — `az` en grados de 0 a 360 (0 = norte), `alt` en grados sobre el horizonte; es `SunCalc.getMoonPosition` con otro nombre de campo.
  - `momentoDeLaLuna({ inicio, fin, ahora, mejorHora, lat, lon }): null | { tipo: "ahora" | "mejor" | "anochecer" | "sale", t: number, az: number, alt: number }` (`inicio`, `fin`, `ahora`, `mejorHora`, `t` en ms; `mejorHora` puede ser `null`).
  - `punos(alt: number): number` — `Math.max(0, Math.round(alt / 10))`.
  - `giro(az: number, rumbo: number): number` — `az − rumbo` llevado a [0, 360).
  - `rumboDe(evento): number | null` — hacia dónde mira la **cámara trasera**, de 0 a 360, o `null` si el evento no trae una lectura válida.

- [ ] **Paso 1: pruebas que fallan** (`test/nucleo/rumbo.test.js`, Vigo `lat 42.2328, lon -8.7226`; la referencia es siempre `SunCalc.getMoonPosition`):
  - `posicionLuna` devuelve `az` y `alt` iguales a los de SunCalc para `2026-11-19T21:00:00+01:00`, y acepta un número (ms) igual que un `Date`.
  - `momentoDeLaLuna` con las noches de Vigo (valores en ms fijos): noche del 19 (`inicio 1795108202002`, `fin 1795159881079`), del 26 (`inicio 1795712740204`, `fin 1795765171803`), del 8 (`inicio 1794158414495`, `fin 1794208668127`):
    - noche del 19, `ahora = 2026-11-19T21:00:00+01:00`, `mejorHora = 2026-11-19T22:00:00+01:00` → `tipo "ahora"`, `t === ahora`, `az`/`alt` de esa hora;
    - noche del 19, `ahora = 2026-11-19T15:00:00+01:00`, misma `mejorHora` → `tipo "mejor"`, `t === mejorHora`;
    - noche del 19, `ahora` a las 15:00, `mejorHora: null` → `tipo "anochecer"`, `t === inicio` (la luna ya estaba en el cielo);
    - noche del 26, `ahora = 2026-11-26T19:00:00+01:00` (en curso, luna aún por debajo), `mejorHora = 2026-11-27T01:00:00+01:00` → `tipo "mejor"`;
    - noche del 26, mismo `ahora`, `mejorHora: null` → `tipo "sale"`, `alt` entre 0 y 0,5, `t` dentro de la noche y la luna a `t − 60 000` ms con `alt <= 0` (el primer minuto con la luna sobre el horizonte);
    - noche del 8, `mejorHora: null`, `ahora` antes de `inicio` → `null`;
    - noche del 19 con `ahora` después de `fin` y `mejorHora: null` → `tipo "anochecer"` (una noche que ya pasó no está «en curso»);
    - Santiago de Chile (`-33.45, -70.66`), noche del 19: el `az` de «ahora» es el de SunCalc (la luna al norte, `az` < 90 o > 270).
  - `punos`: `34 → 3`, `35 → 4`, `4 → 0`, `-3 → 0`, `90 → 9`.
  - `giro`: `giro(135, 90) = 45`, `giro(10, 350) = 20`, `giro(350, 10) = 340`, `giro(90, 90) = 0`.
  - `rumboDe` (con objetos simples): `{ webkitCompassHeading: 123.4 }` → `123.4`; `{ webkitCompassHeading: 0 }` → `0`; `{ webkitCompassHeading: NaN, absolute: true, alpha: 270, beta: 90, gamma: 0 }` → `90`; móvil de pie (`beta: 90`, `gamma: 0`) con `absolute: true`: `alpha` 0 → `0`, 90 → `270`, 180 → `180`, 270 → `90`; con `beta: 60` y `alpha: 90` → `270`; con `alpha: 0`, `beta: 90`, `gamma: 30` → `330`; móvil plano (`beta: 0`, `gamma: 0`, `alpha: 90`) → `270`; `absolute: false` → `null`; `{ absolute: true, alpha: null, beta: null, gamma: null }` → `null`; `null`, `undefined` y `{}` → `null`.
- [ ] **Paso 2:** `npx vitest run test/nucleo/rumbo.test.js` → FALLA (el módulo no existe).
- [ ] **Paso 3: implementar** `src/nucleo/rumbo.js`. `momentoDeLaLuna`: «en curso» es `inicio <= ahora < fin`; orden de decisión: (1) en curso y la luna sobre el horizonte ahora → `ahora`; (2) `mejorHora` finito → `mejor`; (3) buscar de minuto en minuto, desde `max(inicio, ahora si la noche está en curso)` hasta `fin`, la primera lectura con `alt > 0`: si cae en `inicio` (la luna ya estaba arriba) → `anochecer`, si no → `sale`; (4) nada → `null`. `rumboDe`: `webkitCompassHeading` finito manda; si no, solo con `absolute === true` y `alpha` finito se calcula con la fórmula del W3C para `alpha`, `beta`, `gamma` (la dirección que sale por la parte trasera del móvil, proyectada en el horizonte); si esa dirección es casi vertical (móvil plano) se usa `(360 − alpha) % 360`.
- [ ] **Paso 4:** `npx vitest run test/nucleo/rumbo.test.js` → pasa; `npm run test:logica` → pasa.
- [ ] **Paso 5:** documentar en la nota de diseño el caso 3 bis («al anochecer»: la luna ya estaba en el cielo y no hay mejor hora → apunta a su posición al anochecer) y que en el código los nombres van sin ñ (`punos`). Cierre de la tarea («Brújula 1/4: el núcleo del rumbo»).

### Task 2: textos y validación de la luna

**Archivos:**
- Modificar: `data/generos/luna.json`, `src/nucleo/datos.js` (`validarNocturno`), `test/nucleo/datos.test.js`, `docs/datos.md`

**Interfaces:**
- Produce: `luna.brujula` con estas claves de texto (todas obligatorias):
  - `texto`: «Mira hacia el {direccion} ({grados}°).»
  - `altura`: «Altura: {altura}° sobre el horizonte, unos {punos} puños con el brazo estirado.»
  - `alturaUnPuno`: «Altura: {altura}° sobre el horizonte, más o menos un puño con el brazo estirado.»
  - `alturaBaja`: «Altura: casi a ras del horizonte.»
  - `momentos.ahora`: «Ahora, a las {hora}.»
  - `momentos.mejor`: «A las {hora}, la mejor hora de la noche.»
  - `momentos.anochecer`: «Al anochecer, a las {hora}.»
  - `momentos.sale`: «La luna sale a las {hora}.»

- [ ] **Paso 1: pruebas que fallan** (`test/nucleo/datos.test.js`, mismo estilo que las de `textoBrujula` de atardecer): los datos del repositorio validan sin errores; quitar de una copia de los datos de la luna cada una de las 8 claves da un error que la nombra (`luna.brujula.texto: falta el texto`, `luna.brujula.momentos.sale: falta el texto`, …); dejar `brujula` entero fuera da un error por cada clave.
- [ ] **Paso 2:** `npx vitest run test/nucleo/datos.test.js` → FALLA (los datos aún no llevan la sección).
- [ ] **Paso 3:** añadir la sección a `luna.json` con los textos de la interfaz y validarla en `validarNocturno` con el mismo patrón de errores del resto del archivo.
- [ ] **Paso 4:** `npx vitest run` → pasa entero (incluida la paridad). Documentar las claves en `docs/datos.md`. Cierre de la tarea («Brújula 2/4: textos de la luna»).

### Task 3: brújula fija en Luna y Atardecer con un solo componente

**Archivos:**
- Crear: `src/componentes/Brujula.svelte`, `test/e2e/compilada/brujula.e2e.cjs`
- Modificar: `src/componentes/PanelPuntos.svelte`, `src/componentes/PanelNocturno.svelte`, `src/estilos.css`

**Interfaces:**
- Consume: `momentoDeLaLuna`, `posicionLuna`, `punos` (tarea 1); `g.brujula` de la luna (tarea 2); `Flecha.svelte` (`az`).
- Produce: `Brujula.svelte` con `let { az, children } = $props()`: `<div class="brujula-bloque"><div class="brujula"><Flecha {az} /><div class="brujula-texto">{@render children?.()}</div></div></div>`. Conserva `.brujula`, su `svg` y la flecha como hasta ahora (`g path:last-of-type`); varios `<p>` dentro de `.brujula-texto` van con 4 px de separación y sin margen exterior.

- [ ] **Paso 1: prueba de navegador que falla** (`brujula.e2e.cjs`, con `nuevaPagina`, perfil y lugar de Vigo como en `luna.e2e.cjs`; dos relojes: `fecha: "2026-11-19T21:00:00+01:00"` y el de siempre):
  - **A. Atardecer no cambia:** la frase es «Al atardecer, mira hacia el … (N°).», la flecha gira `N` grados (`g` con `rotate(N)`), `.brujula` va entre la franja de «La luz de hoy» y la receta.
  - **B. Luna «ahora»** (reloj a las 21:00, noche del 19 en curso, pestaña Luna): hay `.brujula` justo debajo de `.avisos` o del veredicto y antes de la receta; el texto trae «Mira hacia el <punto cardinal> (N°).», «Altura: A° sobre el horizonte, unos P puños con el brazo estirado.» y «Ahora, a las 21:00.»; `N` y `A` son `Math.round` del azimut y de la altura de SunCalc para esa hora, `P = Math.round(A / 10)`; la palabra es la de `puntoCardinal(N)`; la flecha gira `N` grados.
  - **C. Luna «mejor hora»** (reloj de siempre, 15:00, noche del 19 todavía sin empezar): el texto dice «A las HH:MM, la mejor hora de la noche.» y coincide con la «Mejor hora: HH:MM» de la nota del veredicto cuando la hay.
  - **D. Segunda noche** (botón de día 1): cambian los grados y la hora.
  - **E. El reloj corre:** con el reloj a las 21:00, `p.clock.runFor(61000)` → «Ahora, a las 21:01.» y los grados cambian de acuerdo con SunCalc.
  - **F. Hemisferio sur** (Santiago de Chile): el texto dice la dirección que da `puntoCardinal` y la flecha gira lo que dice el texto.
  - **G. Medidas:** 320, 360 y 390 px, claro y oscuro, letra normal y ancha (`DejaVu Sans`): la página no desborda, `.brujula` cabe en su tarjeta y las líneas no se pisan.
  - **H.** `p.errores` vacío en todos.
- [ ] **Paso 2:** `npm run build -- --base=/luz-y-foto/beta/ && node test/e2e/compilada/brujula.e2e.cjs` → FALLA en B a G (Luna no tiene brújula) y A pasa o falla solo por el módulo nuevo.
- [ ] **Paso 3: implementar** `Brujula.svelte`; en `PanelPuntos` sustituir el bloque `.brujula` por `<Brujula {az}><p><Plantilla … /></p></Brujula>` (misma frase); en `PanelNocturno` calcular `ahora` con el reloj del dispositivo (`$state(Date.now())` que un `setInterval` de 60 s refresca, y se limpia al salir), `momento = momentoDeLaLuna({ inicio: item.inicio, fin: item.fin, ahora, mejorHora: conHoras ? r.mejorHora : null, lat: hoy.lat, lon: hoy.lon })` y, solo si hay `momento`, `<Brujula az={momento.az}>` con tres `<p>`: dirección (`Plantilla`, en negrita la dirección), altura (`altura`, `alturaUnPuno` o `alturaBaja` según `punos(alt)`: 0 → baja, 1 → un puño, más → `altura`) y momento (`g.brujula.momentos[momento.tipo]` con `{hora}` = `hm(momento.t)`). Colocarla entre `Avisos` y `Receta`. Estilos de `.brujula-bloque` y `.brujula-texto` en `estilos.css`.
- [ ] **Paso 4:** compilar y `node test/e2e/compilada/brujula.e2e.cjs` → pasa; `luz-de-hoy`, `veredicto`, `luna`, `maquetacion` y `genero-nuevo` siguen pasando (`npm run test:navegador`).
- [ ] **Paso 5:** revisión visual con capturas (Atardecer y Luna a 320/390 px, claro y oscuro). Cierre de la tarea («Brújula 3/4: la brújula de la luna»).

### Task 4: la brújula del móvil

**Archivos:**
- Crear: `src/estado/orientacion.svelte.js`
- Modificar: `src/componentes/Flecha.svelte`, `src/componentes/Brujula.svelte`, `src/estilos.css`, `test/e2e/compilada/brujula.e2e.cjs`, `docs/diseno.md`

**Interfaces:**
- Consume: `rumboDe`, `giro` (tarea 1), `Brujula.svelte` (tarea 3).
- Produce:
  - `orientacion` (objeto `$state`): `{ estado: "apagada" | "pidiendo" | "activa" | "sinPermiso" | "sinSensor", rumbo: number | null }`.
  - `hayBrujula(): boolean` — `typeof window !== "undefined" && "DeviceOrientationEvent" in window`.
  - `encender(): Promise<void>` — si existe `DeviceOrientationEvent.requestPermission` (iPhone) la llama (solo vale dentro del toque que la origina): `"granted"` → escucha `deviceorientation`; cualquier otra cosa o una excepción → `sinPermiso`. Si no existe, escucha `deviceorientationabsolute` cuando `"ondeviceorientationabsolute" in window` y, si no, `deviceorientation`. Pasa a `activa` con la primera lectura válida (`rumboDe` ≠ `null`); si en 2000 ms no llega ninguna, `sinSensor` y deja de escuchar.
  - `apagar(): void` — quita las escuchas, el temporizador y el rumbo; estado `apagada`.
  - `Flecha.svelte`: propiedad opcional `rumbo` (`null` por defecto): con valor, todo el dial (círculo, N y flecha) va dentro de un `<g transform="rotate(−rumbo)">` y el `svg` pasa a `aria-hidden="true"` sin `role`; sin valor, el marcado es el de siempre.
  - `Brujula.svelte` gana, bajo `.brujula`, la zona viva: botón `#brujulaMovil` («Usar la brújula del móvil» / «Dejar de usar la brújula del móvil», solo si `hayBrujula()`, al menos 44 px de alto) y, según el estado, un `<p class="brujula-viva">`: activa → «Estás mirando al <punto cardinal> (N°).» más «La brújula del móvil puede desviarse 10–20°: gira el móvil en un ocho para calibrarla.»; `sinPermiso` → «Sin permiso para la brújula. Puedes darlo en los ajustes del navegador.»; `sinSensor` → «Este dispositivo no da la brújula.»

- [ ] **Paso 1: pruebas de navegador que fallan** (ampliar `brujula.e2e.cjs`; las lecturas se simulan con `p.evaluate(() => window.dispatchEvent(Object.assign(new Event("deviceorientationabsolute"), { absolute: true, alpha, beta: 90, gamma: 0 })))`, y en iPhone con `p.addInitScript` que define `DeviceOrientationEvent.requestPermission` y eventos `deviceorientation` con `webkitCompassHeading`; un contador de `addEventListener`/`removeEventListener` de esos tipos instalado también con `addInitScript`):
  - **I. Android:** el botón existe en Luna y en Atardecer; al pulsarlo y mandar `alpha: 270` (rumbo 90°) con el objetivo en 135° la flecha gira 45° (`g` interior `rotate(135)` dentro de `rotate(-90)`), el texto dice «Estás mirando al este (90°).», el botón cambia a «Dejar de usar…» y el `svg` es `aria-hidden`; con `alpha: 0` pasa a rumbo 0 y el dial vuelve a `rotate(-0)`/sin giro; un salto de 359° a 1° no deja ninguna transición CSS en el dial (`getComputedStyle(...).transitionDuration === "0s"`).
  - **J. iPhone concedido:** con `requestPermission` → `"granted"`, `webkitCompassHeading: 200` da «Estás mirando al sur-suroeste (200°).».
  - **K. iPhone denegado:** `"denied"` y también una excepción → «Sin permiso para la brújula…», botón otra vez disponible, sin errores en consola.
  - **L. Sin lecturas:** evento vacío (`alpha`, `beta`, `gamma` a `null`) o ninguno; tras `p.clock.runFor(2100)` → «Este dispositivo no da la brújula.» y ya no hay escuchas.
  - **M. Limpieza:** con la brújula activa, cambiar de pestaña (Atardecer ↔ Luna) y de noche/día la mantiene encendida con **una sola** escucha y el mismo rumbo (el objetivo de la flecha es el del día elegido); cambiar de lugar, esconder la página (`visibilitychange`) o salir de la pantalla de Hoy la apaga y deja el recuento de escuchas a 0; volver a pulsar el botón la enciende de nuevo. *(Corregido al implementar: ver el ruling de la nota de diseño, punto 8. En el e2e son las secciones F–L.)*
  - **N. Apagar:** «Dejar de usar…» quita las escuchas y vuelve a la flecha fija.
  - **O. Medidas:** 320/360/390 px, claro y oscuro, letra ancha: la zona viva no desborda ni pisa nada; sin errores.
- [ ] **Paso 2:** compilar y `node test/e2e/compilada/brujula.e2e.cjs` → FALLA en I a O (no hay botón).
- [ ] **Paso 3: implementar** `orientacion.svelte.js` con lo de la interfaz; las lecturas se aplican como mucho una vez por fotograma (`requestAnimationFrame`); `Brujula.svelte` llama a `apagar()` al desmontarse y al ocultarse la página (`visibilitychange`), y `encender()` desde el manejador del botón (sin `await` antes de `requestPermission`); estilos de `.brujula-viva` y del botón (mismo estilo que los botones secundarios de la app).
- [ ] **Paso 4:** compilar y `node test/e2e/compilada/brujula.e2e.cjs` → pasa; después `npm run test:todo` → «Todo correcto».
- [ ] **Paso 5:** documentar en `docs/diseno.md` («La brújula», cómo funciona el rumbo, por qué el móvil de pie, límites de precisión y qué comprobar a mano en un iPhone y en un Android). Cierre de la tarea («Brújula 4/4: la brújula del móvil») y aviso a la persona con lo que debe probar en su móvil.
