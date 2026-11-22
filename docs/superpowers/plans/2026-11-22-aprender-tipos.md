# Aprender: tipos de fotografía: plan de implementación

> **Para quien lo ejecute:** REQUIRED SUB-SKILL: superpowers:executing-plans. Los pasos usan casillas `- [ ]`.

**Meta:** un grupo «Tipos de fotografía» en Aprender con dos lecciones, «Fotografía de paisaje» y «Fotografía deportiva», con dibujos y tres términos nuevos del glosario.

**Arquitectura:** solo datos y dibujos: `data/lecciones.json` (grupo `tipos`), `data/lecciones/<id>.json`, `data/glosario.json`, `scripts/dibujos-lecciones.mjs` y las imágenes que genera `scripts/generar-dibujos.mjs`. Sin código nuevo de pantalla.

**Pila:** JSON, SVG a WebP con Playwright, Vitest, pruebas de navegador (`test/ejecutar-todo.sh`).

**Diseño:** [`../specs/2026-11-22-aprender-tipos-design.md`](../specs/2026-11-22-aprender-tipos-design.md)

## Restricciones globales
- Lecciones de 450 palabras como máximo; `minutos` entre 1 y 10; `para: "todos"`.
- Ids: `fotografia-de-paisaje` y `fotografia-deportiva`; dibujos `paisaje` y `deporte`; grupo `tipos`; términos `regla-de-tercios`, `enfoque-continuo` y `rafaga`.
- Cada dibujo: SVG de 716×464 (viewBox 358×232), letra de al menos 17 en el texto de pie, paleta clara y oscura.
- Cada afirmación técnica con dos fuentes en `docs/superpowers/specs/2026-11-22-aprender-fuentes.md`; sin ellas, se deja fuera.
- `export TZ=Europe/Madrid` antes de las pruebas. No fusionar en `master` sin orden de la persona.

## Revisión: lo que el diseño implica y ninguna prueba ejercita sola
1. **La lista de Aprender con tres grupos** se ve a 320 px, en claro y oscuro, con letra ancha, sin desbordar. Tarea 1.
2. **Las lecciones nuevas sin conexión**: abrirlas y que el dibujo salga de la caché. Tarea 1 (la sección I recorre todas las lecciones; el peso y la caché los comprueba `pwa.e2e.cjs`).
3. **Los términos nuevos se pueden tocar** y abren su definición. Tarea 1 y 2.
4. **Lo de cámara y lo de móvil no se contradicen**: los términos y las cifras son los de las lecciones anteriores. Tarea 2.

---

### Task 1: grupo «Tipos de fotografía» y «Fotografía de paisaje»
**Archivos:** crear `data/lecciones/fotografia-de-paisaje.json`; modificar `data/lecciones.json`, `data/glosario.json` (`regla-de-tercios`), `scripts/dibujos-lecciones.mjs` (`paisaje`), `test/nucleo/datos.test.js`, `test/e2e/compilada/aprender.e2e.cjs` (`ESPERADAS`), `test/e2e/compilada/pwa.e2e.cjs` (440 000 y 36 → 38 archivos como mínimo al acabar la Tarea 2); generar `src/imagenes/dibujo-paisaje-{claro,oscuro}.webp` y `dibujos.json`.
- [ ] Pruebas que fallan (`datos.test.js`): los grupos son `["basico","movil","tipos"]`, el tercero con título «Tipos de fotografía»; «Fotografía de paisaje» tiene `para: "todos"`, 2–3 minutos, un dibujo `paisaje`, una idea y un «Pruébalo hoy», y su texto habla de `/primer plano/`, `/tercio/`, `/f\/11/`, `/trípode/`, `/cuadrícula/` y `/0,5x/`; el glosario tiene `regla-de-tercios`. Ejecutar: FALLA.
- [ ] Datos, dibujo y glosario; `node scripts/generar-dibujos.mjs`; mirar el dibujo en claro y oscuro.
- [ ] `aprender.e2e.cjs`: `ESPERADAS` con la lección; `pwa.e2e.cjs`: límite 440 000.
- [ ] Todo verde (`npx vitest run`, `npm run validar`, `npm run build`, `bash test/ejecutar-todo.sh`); mirar la lista y la lección a 320 y 390 px; confirmar; commit.

### Task 2: «Fotografía deportiva» y documentación
**Archivos:** crear `data/lecciones/fotografia-deportiva.json`; modificar `data/lecciones.json` (añadirla al grupo `tipos`), `data/glosario.json` (`enfoque-continuo`, `rafaga`), `scripts/dibujos-lecciones.mjs` (`deporte`), las pruebas, `docs/diseno.md`, `docs/datos.md`, `README.md`, el documento de fuentes.
- [ ] Pruebas que fallan: el grupo `tipos` lleva las dos lecciones; «Fotografía deportiva» (`para: "todos"`, 2–3 minutos, dibujo `deporte`, idea y «Pruébalo hoy») habla de `/1\/500/`, `/enfoque continuo/i`, `/ráfaga/i`, `/Tv/`, `/iPhone/` y `/pellizc/i`; el glosario tiene `enfoque-continuo` y `rafaga`. FALLA.
- [ ] Datos, dibujo, glosario; generar imágenes; mirar el dibujo.
- [ ] Documentos (diseño, datos, README, fuentes); `ESPERADAS` y mínimo de archivos.
- [ ] Todo verde; mirar a 320 y 390 px; commit.
