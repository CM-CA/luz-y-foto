# Aprender: la capa de enseñanza (diseño)

Propuesto el 2026-11-22. La persona aprobó el formato («lecciones de texto corto con dibujos», simulador de exposición quizá después) y las tres primeras lecciones. La pantalla, tal y como se describe aquí, **aún no la ha visto ni aprobado**.

## Intención
La app tiene que enseñar fotografía, no solo decir si hay luz: más original y más accesible que PhotoPills. Quien la abre debe entender **cómo usar el modo manual, cuándo usarlo de verdad y si le compensa más Av o Tv** (no siempre hay tiempo de configurar el manual), y saber para qué sirven cosas como el parasol o el filtro UV. La enseñanza es mixta: la receta del día enseña con el caso real y enlaza a una lección teórica completa.

## Objetivos
- Un apartado **«Aprender»** con su propia pantalla, fuera de Hoy, con lecciones de 2 o 3 minutos de lectura.
- Tres lecciones, para cámara: **La rueda de modos**, **El manual de verdad** y **Parasol y filtro UV**.
- Desde la receta, un enlace «Aprende por qué» a la lección que explica sus ajustes.
- Las lecciones agrupadas (empieza con «Lo básico») para que después entren grupos nuevos, como los manuales por tipo de foto (paisaje, urbana, deportes…) que la persona quiere decidir a continuación.
- Funciona sin conexión, como el resto de la app.

## No objetivos
Simulador de exposición (más adelante, como un tipo de bloque nuevo); tutorial de primera vez con «Saltar» y repetible desde Ajustes; seguimiento de lecciones leídas, preguntas o logros; glosario como página; lecciones para móvil (tocar para exponer, brillo, modo noche: otra tanda); manuales de enfoque, técnicas y composición; los eventos del cielo (descartados).

## Antiobjetivos
- Un muro de texto: si una lección pasa de unas 450 palabras, se parte.
- Tecnicismos sin explicar o presentados antes que la acción.
- Afirmar algo que no es cierto o que depende de la cámara sin decirlo (Av en Canon es A en Nikon y Sony).
- Que Hoy cambie de comportamiento o de aspecto, más allá de la barra inferior.

## Restricciones
- Solo frontend (PWA) y sin dependencias nuevas en la app compilada.
- Textos en archivos de datos (`data/`), no en el código, validados con `npm run validar`.
- Primero la acción, luego el término técnico; los términos del glosario, tocables (ya existe `ConTerminos`).
- Debe verse bien desde 320 px, en claro y en oscuro, con los colores que ya existen. Ninguna información depende solo de un dibujo, un borde o un color (regla del modo oscuro forzado): todo lo que dice un dibujo, lo dice también el texto, y los dibujos son imágenes con su texto alternativo.
- Las imágenes entran en la caché del service worker (hay que revisar el límite de peso que hoy comprueba `pwa.e2e.cjs`).

## Formas de hacerlo
**Dónde viven las lecciones.**
1. *Datos: un archivo JSON por lección y un índice con grupos, pintados por un componente genérico (recomendada).* Encaja con el principio de la app (textos fuera del código), se valida, y añadir una lección o un grupo no toca código. Coste: un lenguaje de bloques que mantener.
2. *Un componente Svelte por lección.* Libertad total e interactividad fácil, pero los textos acaban dentro del código, sin validar.
3. *Markdown compilado.* Cómodo de escribir, pero exige una dependencia nueva.

**Cómo se llega.**
1. *Barra inferior con «Hoy» y «Aprender» (recomendada).* Es el patrón que ya estaba diseñado (Hoy, Lugares, Glosario, Ajustes) y crece sin rehacerse. Coste: una barra fija en pantalla.
2. *Un enlace en la cabecera.* Menos intrusivo, pero a 320 px no cabe junto al lugar.
3. *Una tarjeta al final de Hoy.* Descartada: la persona quiere Aprender fuera de Hoy.

## Cómo se ve
```
 ┌────────────────────────────────────┐
 │  Aprender                          │
 │  Lecciones cortas, de 2 o 3 minutos│
 │                                    │
 │  Lo básico (con cámara)            │
 │  ┌──────────────────────────────┐  │
 │  │ La rueda de modos       3 min│  │
 │  │ Qué modo usar y cuándo.      │  │
 │  ├──────────────────────────────┤  │
 │  │ El manual de verdad     3 min│  │
 │  │ Apertura, tiempo e ISO.      │  │
 │  ├──────────────────────────────┤  │
 │  │ Parasol y filtro UV     2 min│  │
 │  │ Si compensan o no.           │  │
 │  └──────────────────────────────┘  │
 ├────────────────────────────────────┤
 │      Hoy              Aprender     │
 └────────────────────────────────────┘
```
Una lección: botón «← Aprender», título, «3 min · Para cámara», el dibujo, una **idea clave** destacada, párrafos y listas cortas con términos tocables, y al final una caja **«Pruébalo hoy»** con un ejercicio de una o dos líneas. La barra inferior sigue visible y marca dónde estás. Las direcciones son `#/aprender` y `#/aprender/<lección>` (el botón «atrás» del móvil funciona).

## Las tres primeras lecciones (qué cuenta cada una)
Los textos los escribe el constructor siguiendo estas ideas; la persona los revisa en la PR y comprueba los datos de su foto.
1. **La rueda de modos.** Qué eliges tú y qué elige la cámara en Auto, P, Av/A, Tv/S y M. Regla corta: *Av si te importa el fondo, Tv si te importa el movimiento, M cuando la luz no cambia y hay tiempo*. Cuándo el automático es suficiente (no hay tiempo, luz que cambia rápido). Por dónde empezar: Av. Nombres según marca.
2. **El manual de verdad.** Apertura, tiempo e ISO, qué hace cada uno y **qué precio tiene** (fondo y nitidez, movimiento y trepidación, grano). Qué es «un paso» de luz. Caso real: la luna creciente con Venus (Canon EOS 600D, 55 mm, f/5.6, ISO 400, 1 s, con trípode): leer cada ajuste y qué cambiar si sale oscura o clara.
3. **Parasol y filtro UV.** Qué hace el parasol (menos reflejos y velo con el sol bajo, protege de golpes) y cuándo no sirve; por qué un filtro UV hoy es sobre todo protección y por qué, de noche, con la luna o un planeta, puede dar reflejos fantasma. Cuándo merece la pena cada uno y cuándo no.

## Decidido (mis llamadas, para que las corrijas)
- Lecciones como datos: `data/lecciones.json` (índice con grupos) y `data/lecciones/<id>.json` (título, resumen, minutos, a quién va, y una lista de bloques: párrafo, idea clave, lista, dibujo, «pruébalo hoy»). El validador comprueba que los términos del glosario y los dibujos existen y que cada bloque es de un tipo conocido.
- Los dibujos son imágenes WebP (como los cielos), con texto alternativo y generadas por un guion (`scripts/`), no SVG en línea.
- La receta lleva un campo opcional `leccion` (en cada variante) y muestra «Aprende por qué».
- La lección «La rueda de modos» sustituye al tutorial de cuatro pantallas que estaba pendiente: se puede releer siempre. Si más adelante se quiere que salga la primera vez, es un añadido pequeño.
- Las tres primeras son para cámara; el móvil tendrá sus lecciones en otra tanda.

## Lo que queda al constructor
- El lenguaje exacto de bloques y el componente que los pinta; cómo se lee la ruta con dos tramos (`ruta.svelte.js` hoy solo entiende una pantalla).
- Los textos y los dibujos, con los datos comprobados contra fuentes fiables; el peso nuevo y su límite en `pwa.e2e.cjs`.
- Barra inferior: altura, áreas seguras del iPhone y que no tape el contenido de Hoy ni el aviso de versión. El nombre de clase `.barra` ya lo usan las barras de datos (`Barra.svelte`): usar otro. La pestaña activa se marca con negrita y una línea, no solo con el color.
- Pruebas: validador de lecciones; navegación Hoy → Aprender → lección → atrás; el enlace de la receta abre su lección; sin desbordes a 320, 360 y 390 px en claro y oscuro (también con letra ancha); un término del glosario se abre dentro de una lección; el service worker guarda lecciones e imágenes y funciona sin conexión.
- Actualizar `docs/diseno.md` (Aprender, barra inferior, el tutorial de la rueda de modos ya cubierto) y `docs/datos.md`.
