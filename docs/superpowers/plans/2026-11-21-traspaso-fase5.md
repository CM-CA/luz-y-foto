# Traspaso a la raíz (fase 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `https://cm-ca.github.io/luz-y-foto/` sirva la versión nueva (compilada con `--base=/luz-y-foto/`) desde `master`, con vuelta atrás al commit `8d83511`, y que `/beta/` y las direcciones viejas no se queden en un callejón.

**Architecture:** Rama `traspaso` con PR a `master`. Las pruebas de navegador pasan a medir la ruta que se publica; el aviso de vista previa desaparece; `transicion/` (redirección de `/beta/` con service worker y `404.html`) se copia dentro de `dist/` en el workflow; el workflow nuevo solo publica desde `master` y solo si todo salió bien. Retirar `js/` y compañía queda **fuera** de este plan (solo tras la comprobación de la persona en el móvil).

**Tech Stack:** GitHub Actions + Pages, Vite 8, Svelte 5, Playwright (e2e en `test/e2e/compilada/`), Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-21-traspaso-fase5-design.md`](../specs/2026-11-21-traspaso-fase5-design.md) (y `docs/migracion-svelte.md`, fase 5).

## Global Constraints

- Ruta base de producción: `/luz-y-foto/` (ya es el valor por defecto de `vite.config.mjs` al compilar). Nada vuelve a escribir `/luz-y-foto/beta/` salvo la prueba de la redirección (Task 2) y los textos que explican la historia.
- Las claves de `localStorage` (`luz-y-foto:lugar`, `luz-y-foto:perfil`, `luz-y-foto:prevision`) no cambian.
- Un push o una pull request **nunca** publica: solo `push` (o ejecución a mano) sobre `master`, y solo si `construir` salió bien. No hay `always()`.
- No se sube nada a la rama `migracion-svelte` (su workflow viejo volvería a publicar la web antigua en la raíz).
- Textos para la persona en español, frases en minúscula (sin mayúsculas de título).
- Commits con las líneas `Co-Authored-By:` y `Claude-Session:` que indica el sistema; PR con su pie.
- Siempre `export TZ=Europe/Madrid` al lanzar las pruebas.

## Review Focus

1. **App ya instalada desde `/beta/`** (service worker viejo + `index.html` en caché): al llegar la redirección debe borrar su caché, darse de baja y dejar la pestaña en la raíz con el mismo `#/ruta`. Test en Task 2.
2. **Perfil y lugar guardados al pasar de `/beta/` a la raíz**: el origen es el mismo, no se pierden. Test en Task 2.
3. **Enlaces viejos** (`/beta/#/hoy`, `/prueba/hoy.html`, favoritos): no terminan en una página de error de GitHub; llevan a la app. Tests en Task 2.
4. **Una pull request o una construcción rota no publican ni dejan la raíz vacía**: `publicar` depende de `construir`, solo corre en `master` y no usa `always()`. Se comprueba leyendo el workflow (Task 3) y con la ejecución real del PR (Task 4: `publicar` omitido).
5. **La app compilada para la raíz funciona bajo `/luz-y-foto/`** (manifiesto, iconos, alcance del service worker, sin aviso beta): todas las pruebas compiladas pasan con la ruta nueva (Task 1).

---

### Task 1: Las pruebas miden la ruta que se publica y el aviso de vista previa desaparece

**Files:**
- Modify: `test/e2e/compilada/*.e2e.cjs` (todas las que tengan `/luz-y-foto/beta/`: `prefijo`, `PREFIJO`, comentarios `Antes: npm run build -- --base=/luz-y-foto/beta/` → `Antes: npm run build`, y los textos de pruebas que citan la ruta)
- Modify: `test/e2e/compilada/ruta-base.e2e.cjs` (el aviso)
- Modify: `test/ejecutar-todo.sh`, `scripts/servir-dist.mjs`, `test/e2e/ayudas.cjs` (solo el comentario de `servir`)
- Modify: `src/App.svelte`, `src/estilos.css` (reglas `.aviso-beta`, bajo el comentario «Aviso de la vista previa»), `vite.config.mjs` (comentario)

**Interfaces:**
- Produces: `npm run build` sin opciones es lo que miden todas las pruebas; `scripts/servir-dist.mjs` sirve por defecto bajo `/luz-y-foto/`.

- [ ] **Step 1: Write the failing test** — en `ruta-base.e2e.cjs`: `prefijo: "/luz-y-foto/"` y título «carga bajo /luz-y-foto/ sin errores»; esperar `[data-tab]` en lugar de `[data-testid=aviso-beta]` (dos sitios); sustituir el bloque «enlace a la versión actual» por `titulo("sin aviso de vista previa")` y `ok(await p.locator("[data-testid=aviso-beta]").count() === 0, "la raíz no lleva el aviso de vista previa")`.
- [ ] **Step 2: Run it against the existing `dist/` (compilado con la ruta beta)** — `export TZ=Europe/Madrid; node test/e2e/compilada/ruta-base.e2e.cjs`. Expected: FALLA («todos los archivos responden 200» o espera de `[data-tab]` agotada), porque `dist/` todavía apunta a `/luz-y-foto/beta/`.
- [ ] **Step 3: Cambiar la ruta en el resto** — mismo cambio de `prefijo`/`PREFIJO`/comentarios/títulos en los demás `test/e2e/compilada/*.e2e.cjs` (`grep -rn "luz-y-foto/beta" test` solo debe quedar vacío al final del paso); en `test/ejecutar-todo.sh`: `npm run --silent build` sin `--base`, `servir-dist.mjs --base=/luz-y-foto/` y los comentarios de cabecera; en `scripts/servir-dist.mjs`: valor por defecto y línea de uso `--base=/luz-y-foto/`; comentario de `servir` en `ayudas.cjs` (ejemplo `/luz-y-foto/`).
- [ ] **Step 4: Quitar el aviso** — `App.svelte` pierde `esVistaPrevia`, `versionActual` y el bloque `{#if esVistaPrevia}…{/if}`; `estilos.css` pierde las tres reglas `.aviso-beta` y su comentario; en `vite.config.mjs` el comentario dice que la web va en `https://cm-ca.github.io/luz-y-foto/` y se compila con el valor por defecto (sin mencionar `/beta/`).
- [ ] **Step 5: Run the suite** — `export TZ=Europe/Madrid; npm run build && npm run test:logica && npm run test:navegador`. Expected: vitest en verde y todas las pruebas de `compilada` y `comportamiento (versión compilada)` en `ok`, `ruta-base` incluida. `grep -rn "aviso-beta\|esVistaPrevia" src test` sin resultados.
- [ ] **Step 6: Commit** — `git add -A && git commit` («Traspaso 1/4: las pruebas miden la ruta de producción y se quita el aviso de vista previa»).

---

### Task 2: Redirección de `/beta/` y de las direcciones viejas

**Files:**
- Create: `transicion/beta/index.html`, `transicion/beta/sw.js`, `transicion/404.html`
- Test: `test/e2e/compilada/redireccion-beta.e2e.cjs` (el script de pruebas lo recoge solo: lanza todo `compilada/*.e2e.cjs`)

**Interfaces:**
- Produces: la carpeta `transicion/` tiene la misma forma que el sitio publicado (`transicion/beta/*` → `<sitio>/beta/*`, `transicion/404.html` → `<sitio>/404.html`); el workflow (Task 3) la copia con `cp -r transicion/. dist/`.
- `transicion/beta/sw.js` — service worker de baja: `install` → `skipWaiting()`; `activate` → `clients.claim()`, borrar **todas** las cachés, navegar cada cliente de ventana a `new URL("../", self.registration.scope).href + <hash del cliente>`, y `self.registration.unregister()`.
- `transicion/beta/index.html` — da de baja cualquier registro de `./` si lo hay y hace `location.replace("../" + location.hash)`; con un enlace visible «Ir a Luz y foto» si no hay JavaScript.
- `transicion/404.html` — `location.replace("/luz-y-foto/")` (ruta absoluta: se sirve desde cualquier profundidad) con el texto «Esta página ya no existe. Te llevo a Luz y foto.» y un enlace a `/luz-y-foto/`.

- [ ] **Step 1: Write the failing test** `redireccion-beta.e2e.cjs` (patrón de `sin-conexion.e2e.cjs`: `ejecutar`, `nuevaPagina(b, {serviceWorkers: "allow", perfil, lugar, permisos: false})`, `servir`). Prepara una carpeta temporal `sitio/` servida bajo `prefijo: "/luz-y-foto/"` con `sitio/index.html` = `<title>raíz</title>` y `sitio/beta/` = compilación vieja: `spawnSync("npx", ["vite", "build", "--base=/luz-y-foto/beta/", "--outDir", <tmp>/viejo, "--emptyOutDir"])` copiada ahí. Tres secciones:
  - **A. «una app instalada desde /beta/ se arregla sola»**: abrir `base + "beta/#/hoy"`, esperar `[data-tab]` y que `navigator.serviceWorker.controller` exista, guardar `localStorage["luz-y-foto:perfil"]`; «publicar» la redirección (borrar `sitio/beta/` y copiar `transicion/beta/` en su lugar); `navigator.serviceWorker.getRegistration().then(r => r.update())`; esperar a que la URL de la pestaña sea `base + "#/hoy"` (título «raíz»). Afirmar: `getRegistration(base + "beta/")` es `undefined`, `caches.keys()` vacío, y `localStorage["luz-y-foto:perfil"]` igual que antes.
  - **B. «una visita nueva a /beta/ llega a la raíz con su ruta»**: contexto nuevo, solo la redirección publicada; `goto(base + "beta/#/hoy")` → URL `base + "#/hoy"`.
  - **C. «una dirección vieja lleva a la app»**: `goto(base + "404.html")` → URL `base`; y el HTML contiene un enlace a `/luz-y-foto/`.
- [ ] **Step 2: Run it to verify it fails** — `export TZ=Europe/Madrid; node test/e2e/compilada/redireccion-beta.e2e.cjs`. Expected: FALLA (no existe `transicion/…`; las tres secciones sin cumplirse).
- [ ] **Step 3: Implement** los tres archivos de `transicion/` con las firmas de **Interfaces** (el orden `claim` → borrar cachés → navegar → `unregister` es lo que hace que `client.navigate()` funcione; ajustar si la prueba A lo desmiente).
- [ ] **Step 4: Run the test** — mismo comando. Expected: todo `ok`, `redireccion-beta: todo correcto`.
- [ ] **Step 5: Run the compiled suite** — `npm run test:navegador`. Expected: todo en `ok` (la prueba nueva incluida; ninguna otra cambia).
- [ ] **Step 6: Commit** («Traspaso 2/4: redirección de /beta/ y de las direcciones viejas»).

---

### Task 3: Workflow de compilar y publicar, y documentación

**Files:**
- Modify: `.github/workflows/static.yml` (mismo nombre de archivo; nombre del workflow «Publicar sitio»)
- Modify: `docs/migracion-svelte.md`, `README.md`

**Interfaces:**
- Consumes: `npm run validar`, `npm test`, `npm run test:navegador`, `npm run build` (base por defecto `/luz-y-foto/`), carpeta `transicion/` (Task 2).
- Produces: el workflow con dos trabajos.
  - `construir` (en `push` y `pull_request` a `master`, y `workflow_dispatch`): checkout, Node 22 con caché de npm, `npm ci`, `npm run validar`, `npm test`, `npx playwright install --with-deps chromium`, `npm run test:navegador`, `npm run build`, `cp -r transicion/. dist/`, y (solo si el evento no es `pull_request`) `actions/upload-pages-artifact@v3` con `path: dist`.
  - `publicar`: `needs: construir`, `if: github.ref == 'refs/heads/master' && github.event_name != 'pull_request'` (sin `always()`), permisos `pages: write` e `id-token: write`, `concurrency: {group: pages, cancel-in-progress: false}`, `environment: {name: github-pages, url: ${{ steps.deployment.outputs.page_url }}}`, pasos `actions/configure-pages@v5` y `actions/deploy-pages@v5`.
  - El comentario de cabecera explica la vuelta atrás: devolver `master` al commit `8d83511`.

- [ ] **Step 1: Write the workflow** con la forma de **Interfaces** (se parte del archivo actual: se conservan las versiones de las acciones y los nombres en español).
- [ ] **Step 2: Verify** — `python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/static.yml')); print(list(d['jobs']), d['jobs']['publicar']['needs'], d['jobs']['publicar']['if'])"`. Expected: `['construir', 'publicar'] construir github.ref == 'refs/heads/master' && github.event_name != 'pull_request'`; `grep -c "always()" .github/workflows/static.yml` → `0`; `ls transicion/beta/sw.js transicion/404.html` existen.
- [ ] **Step 3: Actualizar la documentación** — `docs/migracion-svelte.md`: fase 5 «hecha el 2026-11-21» (traspaso con PR; el commit de vuelta atrás `8d83511`; GitHub no dejó subir la etiqueta desde la sesión), descripción del workflow nuevo y de `transicion/`, y lo que queda (retirar `js/`, `lib/`, `prueba/` y las pruebas de la web antigua tras comprobar en el móvil); la frase de arriba «La rama `master` sigue publicando la web actual…» y la sección «Cómo ver la rama en el móvil» pasan a pasado/historia. `README.md`: el párrafo «Estado» (la web publicada es la nueva; `/beta/` redirige) y la nota de que las páginas de `prueba/` ya no se publican.
- [ ] **Step 4: Run the suite** — `export TZ=Europe/Madrid; npm run test:todo`. Expected: `Todo correcto`.
- [ ] **Step 5: Commit** («Traspaso 3/4: workflow de compilar y publicar, y documentación»).

---

### Task 4: PR, fusión, publicación y comprobación

**Files:** ninguno (operación sobre GitHub). **No** se sube `migracion-svelte`.

**Interfaces:**
- Consumes: la rama `traspaso` con los tres commits.
- Produces: `master` con el traspaso; la raíz publicada es la versión nueva.

- [ ] **Step 1: Subir la rama y abrir la PR** — `git push -u origin traspaso`; `gh api repos/CM-CA/luz-y-foto/pulls -f title='Fase 5: traspaso de la versión nueva a la raíz' -f head=traspaso -f base=master -f body='…'` (el pie de la PR que indica el sistema). Nota: `gh pr …` usa GraphQL y no funciona desde aquí; usar la API REST.
- [ ] **Step 2: Esperar la ejecución de la PR** — `gh run list --branch traspaso --limit 3 --json event,status,conclusion,name`. Expected: `construir` en `success` y `publicar` omitido (`skipped`). Si falla algo, corregir en la rama y repetir; **no** fusionar en rojo.
- [ ] **Step 3: Fusionar** — `gh api -X PUT repos/CM-CA/luz-y-foto/pulls/<n>/merge -f merge_method=merge -f commit_title='…'`; si la API lo rechaza, fusionar en local (`git checkout master && git pull --ff-only && git merge --no-ff traspaso -F <fichero>`), pasar `npm run test:todo` sobre el resultado y `git push origin master`.
- [ ] **Step 4: Esperar la publicación** — `gh run list --branch master --limit 1` hasta `completed success` sobre el commit de la fusión (si solo falla «Fetching artifact metadata failed» en `publicar`, `gh run rerun <id> --failed`).
- [ ] **Step 5: Comprobar la web publicada** con WebFetch: `https://cm-ca.github.io/luz-y-foto/` (es la app: título «Luz y foto», sin «Vista previa»), `…/manifest.webmanifest` (200 y `start_url` relativo), `…/beta/` (texto de la redirección), `…/prueba/hoy.html` (la página «Esta página ya no existe»). Si la raíz no es la nueva: vuelta atrás inmediata (`git revert -m 1 <fusión>` y push) y avisar.
- [ ] **Step 6: Avisar a la persona** de qué comprobar en el móvil: abrir la raíz (perfil y lugar conservados), instalar o reinstalar la app, modo avión, y que la app instalada desde `/beta/` se redirige sola (la ventana instalada puede quedar fuera del alcance de su manifiesto: reinstalarla desde la raíz).
