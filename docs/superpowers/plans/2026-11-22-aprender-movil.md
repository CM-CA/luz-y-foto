# Aprender para el móvil: plan de implementación

> **Para quien ejecute el plan:** SUB-SKILL OBLIGATORIA: superpowers:executing-plans (en línea, con revisión final de la rama). Los pasos llevan casillas (`- [ ]`).

**Meta:** tres lecciones para móvil («Toca para enfocar y exponer», «Luz baja y modo noche», «Zoom y lentes: cuál usar») en un grupo «Para el móvil» de Aprender, y el enlace desde las recetas de móvil.

**Arquitectura:** solo datos y dibujos sobre lo que ya hay: `data/lecciones.json` (grupo nuevo `movil`), `data/lecciones/<id>.json`, `scripts/dibujos-lecciones.mjs` (+ `node scripts/generar-dibujos.mjs`), `leccion` en las variantes de móvil de `data/recetas/*.json`, términos nuevos en `data/glosario.json`.

**Diseño:** `docs/superpowers/specs/2026-11-22-aprender-movil-design.md`. Rama `aprender`.

## Restricciones globales
- `export TZ=Europe/Madrid`. No se fusiona en `master` sin la orden de la persona. Commits con las líneas `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` y `Claude-Session: https://claude.ai/code/session_017PrdMnF71MdYHZ7c5GiQDs`.
- Cada lección: `para: "movil"`, 2 o 3 min, **≤ 450 palabras**, bloques `dibujo`, `idea`, texto, `pruebalo`. Sin negritas. Términos del glosario con `[[id|texto]]`. Primero la acción, luego el término.
- Lo que cambie entre iPhone y Android o entre modelos se dice («según tu móvil»); sin tiempos ni resultados prometidos de un modelo.
- Cada afirmación técnica, con al menos dos fuentes, anotadas en `docs/superpowers/specs/2026-11-22-aprender-fuentes.md`; si las fuentes no dicen lo mismo con tanta fuerza, se suaviza la frase.
- Dibujos: WebP claro y oscuro, texto alternativo y pie que dicen todo lo que dice el dibujo; legibles a 320 px (letra ≥ 17 px en el SVG de 716 px).
- Peso: `pwa.e2e.cjs` limita las imágenes y fuentes; primero se bajan tamaño y calidad de los dibujos; si no basta, se sube el límite con un `Ruling:`.
- Las tres lecciones de cámara y Hoy no cambian; los tests existentes pasan.

## Revisión: lo que el diseño implica y ninguna prueba ejercita sola
1. **Una persona de móvil abre Aprender:** ve «Para el móvil» y sus tres lecciones con la etiqueta «Para móvil»; la lista de cámara sigue igual. Tarea 1.
2. **Receta de móvil con lección y sin conexión:** el enlace abre la lección y su dibujo desde la caché. Tarea 3.
3. **Receta de cámara sin cambios:** su enlace sigue siendo el mismo. Tarea 3.

---

### Task 1: «Toca para enfocar y exponer» y el grupo «Para el móvil»
**Archivos:** crear `data/lecciones/toca-para-enfocar-y-exponer.json`; modificar `data/lecciones.json`, `data/glosario.json`, `scripts/dibujos-lecciones.mjs` (dibujo `toca`), `test/nucleo/datos.test.js`, `test/e2e/compilada/pwa.e2e.cjs` si el peso lo exige; generar `src/imagenes/dibujo-toca-{claro,oscuro}.webp` y `dibujos.json`; anotar fuentes.
- [ ] **Paso 1: pruebas que fallan** en `datos.test.js`: el índice tiene dos grupos (`basico` y `movil`, este con titulo «Para el móvil»); la lección existe, `para: "movil"`, 2–3 min, dibujo `toca`, y su texto nombra «tocar», «brillo» y el bloqueo de la exposición, y dice «según tu móvil» (cambia entre móviles).
- [ ] **Paso 2:** `npx vitest run test/nucleo/datos.test.js`. Esperado: FALLAN.
- [ ] **Paso 3: investigar** (≥ 2 fuentes por afirmación: Apple, Google y Samsung en lo que cambie) y escribir la lección, el grupo, los términos nuevos del glosario si hacen falta y el dibujo; `node scripts/generar-dibujos.mjs`.
- [ ] **Paso 4:** `npx vitest run`, `npm run validar`, `npm run build`, `bash test/ejecutar-todo.sh`. Esperado: todo pasa. Mirar la lección y la lista a 320 y 390 px (claro y oscuro).
- [ ] **Paso 5: commit** `feat: lección de móvil Toca para enfocar y exponer, con el grupo Para el móvil`.

### Task 2: «Luz baja y modo noche»
**Archivos:** crear `data/lecciones/luz-baja-y-modo-noche.json`; modificar `data/lecciones.json`, `scripts/dibujos-lecciones.mjs` (dibujo `noche`), `test/nucleo/datos.test.js`; generar imágenes; anotar fuentes.
- [ ] **Paso 1:** prueba que falla: el grupo `movil` incluye la lección después de la primera; `para: "movil"`; el texto nombra «modo noche», «quieto» o «apoy», y la luna; dibujo `noche`.
- [ ] **Paso 2:** `npx vitest run test/nucleo/datos.test.js`. Esperado: FALLA.
- [ ] **Paso 3:** investigar (≥ 2 fuentes) y escribir lección y dibujo; generar.
- [ ] **Paso 4:** igual que el paso 4 de la Tarea 1.
- [ ] **Paso 5: commit** `feat: lección de móvil Luz baja y modo noche`.

### Task 3: «Zoom y lentes: cuál usar», enlaces de las recetas y documentación
**Archivos:** crear `data/lecciones/zoom-y-lentes.json`; modificar `data/lecciones.json`, `scripts/dibujos-lecciones.mjs` (dibujo `zoom`), `data/recetas/{atardecer,amanecer,luna}.json` (la variante `equipo: movil` lleva `leccion`), `test/nucleo/datos.test.js`, `test/nucleo/perfil-recetas.test.js`, `test/e2e/compilada/aprender.e2e.cjs`, `docs/diseno.md`, `docs/datos.md`, `README.md`.
- [ ] **Paso 1: pruebas que fallan:** el grupo `movil` trae las tres, en orden (`toca-para-enfocar-y-exponer`, `luz-baja-y-modo-noche`, `zoom-y-lentes`); la lección `zoom-y-lentes` (`para: "movil"`, dibujo `zoom`) nombra «0,5x», «zoom digital» y dice «según tu móvil»; en `perfil-recetas.test.js`, las variantes de móvil de atardecer y amanecer llevan `leccion: "toca-para-enfocar-y-exponer"` y la de luna `leccion: "luz-baja-y-modo-noche"` (una variante lleva **una** lección: la que más explica sus pasos; la de zoom se encuentra desde Aprender); `aprender.e2e.cjs`: desde la receta de móvil el enlace abre su lección.
- [ ] **Paso 2:** vitest de esos dos archivos. Esperado: FALLAN.
- [ ] **Paso 3:** investigar y escribir la lección y el dibujo; los enlaces; la documentación (sección «Aprender» de `diseno.md`, lecciones de móvil ya hechas y «Pendiente» actualizado, `datos.md` con el grupo `movil`, README); si algún paso de las recetas de móvil dice algo que contradice las fuentes (p. ej. «los botones 2x o 3x usan otra lente»), se corrige con un `Ruling:`.
- [ ] **Paso 4:** `npx vitest run`, `npm run validar`, `npm run build`, `bash test/ejecutar-todo.sh`; mirar la receta de móvil a 320 y 390 px.
- [ ] **Paso 5: commit** `feat: lección de móvil Zoom y lentes, enlaces de las recetas de móvil y documentación`.
