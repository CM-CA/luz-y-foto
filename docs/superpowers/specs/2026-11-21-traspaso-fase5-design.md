# Traspaso a la raíz (fase 5): diseño

Aprobado por la persona el 2026-11-21. Parte de [`migracion-svelte.md`](../../migracion-svelte.md) (fase 5), que ya fijaba qué hacer; esta nota recoge cómo.

## Intención
Que la web pública (`https://cm-ca.github.io/luz-y-foto/`) sea la versión nueva (Svelte), publicada desde `master` con un workflow simple, y que nada de lo que la persona ya tiene instalado o guardado se quede roto.

## Objetivos
- La raíz sirve la compilación (`--base=/luz-y-foto/`), validada y probada en Actions antes de publicar.
- Vuelta atrás en minutos: `master` al commit `8d83511` (último `master` con el workflow de transición, que publica la web antigua en la raíz y la nueva en `/beta/`).
- La app instalada desde `/beta/` se arregla sola.
- Las pruebas de navegador miden la misma ruta que se publica.

## No objetivos
- Funciones nuevas (fase 6).
- Mantener publicadas las páginas de `prueba/` (prototipos que la app ya sustituye).
- Tocar las claves de `localStorage`: el origen es el mismo, así que el perfil y el lugar guardados se conservan.

## Antiobjetivos (sería un fracaso aunque «funcione»)
- Dejar la raíz sin publicar o publicando la web antigua por un push a la rama vieja.
- Dejar una app instalada en `/beta/` sirviendo su caché para siempre.
- Retirar la red de seguridad (`js/`, pruebas de paridad) antes de ver la web nueva funcionando en el móvil.

## Enfoques considerados
1. **Fusionar y cambiar el workflow en un solo paso, sin más.** Lo más corto, pero deja instalaciones de `/beta/` congeladas y las pruebas midiendo una ruta que ya no existe.
2. **(Elegido) Rama `traspaso` con PR: workflow nuevo + pruebas a la ruta real + aviso fuera + redirección de `/beta/`.** El PR ejecuta todas las pruebas con el workflow nuevo antes de publicar nada; la fusión es lo que publica.
3. **Mantener `/beta/` como copia permanente de la versión nueva.** Dos URLs que mantener sin ningún beneficio una vez que la raíz es la nueva.

## Diseño
- **Workflow** (`.github/workflows/static.yml`, mismo nombre de archivo): dos trabajos. `construir`: `npm ci`, `npm run validar`, `npm test`, Playwright, `npm run test:navegador`, `npm run build` (base de producción `/luz-y-foto/`), copia de la redirección de `/beta/` dentro de `dist/beta/`, y subida del artefacto de Pages. `publicar`: solo en `push` a `master` y si `construir` salió bien; ya no hay `always()`. En `pull_request` a `master` solo se construye y se prueba.
- **Rutas de las pruebas**: todo pasa de `/luz-y-foto/beta/` a `/luz-y-foto/` (script de pruebas, servidor, ayudas y e2e).
- **Aviso de vista previa**: sale de `App.svelte`, de los estilos y de la prueba de ruta base, que comprueba que ya no aparece en la raíz.
- **Redirección de `/beta/`**: `transicion-beta/index.html` (redirige a la raíz conservando el hash) y `transicion-beta/sw.js`, un service worker que se activa al instante, borra las cachés, se da de baja y recarga las pestañas abiertas en la raíz. Se publica en `/beta/` desde el workflow. Prueba: se instala la compilación bajo una ruta `/beta/` simulada, se «publica» la redirección y se comprueba que la app instalada se arregla.
- **Rama vieja**: `migracion-svelte` conserva el workflow de transición; un push a ella volvería a publicar la web antigua. No se vuelve a subir y se propone borrarla al terminar.
- **Documentación**: `migracion-svelte.md` (fase 5 hecha, vuelta atrás con el commit), `README.md`, comentarios de `vite.config.mjs`.
- **Orden**: PR con integración continua en verde → fusión (publica) → la persona comprueba la web en el móvil → solo entonces se retiran `js/`, `lib/`, `prueba/` y las pruebas que comparaban con la web antigua.

## Decisiones que tomé yo (la persona puede cambiarlas)
- Vuelta atrás por número de commit y no por etiqueta: GitHub no deja subir etiquetas desde esta sesión (403). El documento de migración ya admitía el número de commit.
- La redirección de `/beta/` lleva service worker propio, no solo una página.
- Las páginas de `prueba/` dejan de publicarse en cuanto la raíz es solo la compilación.

## Lo que queda al implementador
Redacción exacta de los comentarios del workflow y de la página de redirección; cómo simular la instalación antigua en la prueba (se puede reutilizar la mecánica de `sin-conexion.e2e.cjs`).
