# Idiomas: español e inglés (diseño)

Aprobado en la práctica el 22-11-2026 («termina la traducción para fusionar todo»); la persona preguntó si la app podría traducirse al idioma del teléfono, eligió **español e inglés** y la **opción B para los dibujos** (abajo), y fijó la regla: «si está en español que se muestre en español y si es otro idioma, en inglés».

## Intención
Hoy la app solo existe en español. Quien la abra con el teléfono en otro idioma debe poder usarla y aprender con ella igual que quien la lee en español, sin restos de español por ninguna pantalla.

## Objetivos
- Toda la app visible en español y en inglés: pantallas Hoy y Aprender, recetas, lecciones, glosario, perfil de equipo, avisos, mensajes de estado y de error, instalación, fechas, horas y números.
- El idioma sale solo del teléfono, y un selector permite cambiarlo (para revisar el inglés sin tocar el teléfono).
- El español **no cambia** ni en una palabra.
- Los dos idiomas viajan dentro de la app: funciona sin conexión en ambos.
- Los dibujos de las lecciones pasan de imágenes WebP a dibujos de texto y líneas (opción B): pesan una décima parte y se traducen con el resto.
- Añadir un tercer idioma más adelante debe ser añadir archivos, no reescribir código.

## No objetivos
Más idiomas ahora. Traducir lo que no ve el usuario: mensajes de los validadores, pruebas, documentación y lista de fuentes (siguen en español). El nombre y la descripción que se ven al instalar la app (el manifiesto es único; sigue en español). Idiomas de derecha a izquierda. Traducir los nombres de lugares: llegan de los servicios de búsqueda, que se piden en el idioma elegido.

## Antiobjetivos
- Una pantalla en inglés con una frase en español, aunque sea una: cuenta como fallo.
- Que el inglés y el español se desincronicen (un umbral cambiado en uno, una lección en una versión y no en la otra).
- Que cambie algo del español o de la apariencia de los dibujos al preparar el terreno.
- Una dependencia nueva de ejecución (hoy solo hay `suncalc`): nada de librerías de traducción.
- Que la app deje de abrir sin conexión o de caber en 320 px.

## Restricciones
- App solo de cliente (GitHub Pages), Svelte 5 y Vite.
- Las reglas de las lecciones valen en cada idioma: 450 palabras como máximo, términos `[[id|texto]]` que existan en el glosario *de ese idioma*, y todo lo que dice un dibujo lo dice también el texto. La traducción no añade afirmaciones técnicas, así que la lista de fuentes no cambia.
- El peso de imágenes y fuentes lo mide `pwa.e2e.cjs`; los datos y el código van dentro del JavaScript.
- Rama `idiomas`. No se une a `master` (que publica la web) sin orden expresa de la persona.

## Formas de hacerlo

**Dibujos** (la persona eligió B). Hoy son 16 WebP (8 dibujos × claro y oscuro), 278 KB, con las palabras dentro de la imagen.
- A. Una imagen por idioma: +278 KB por idioma y el doble de trabajo en cada dibujo nuevo.
- **B. Dibujar con texto y líneas dentro de la página (elegida):** unos 24 KB por idioma para los ocho; un solo dibujo sirve para claro y oscuro (colores de la hoja de estilos); el texto se puede seleccionar y lo leen los lectores de pantalla; un idioma nuevo cuesta unos 3 KB por dibujo.
- C. Quitar las palabras de los dibujos y listarlas debajo: lo más fácil, pero los dibujos explican menos.

**Dónde viven los textos de los datos.**
- **Una copia completa por idioma (`data/es/`, `data/en/`) con una prueba de paridad (elegida):** cada archivo se lee como hoy y encaja con el cargador y los validadores actuales.
- Los dos idiomas en cada campo (`{es, en}`): no se pueden desincronizar, pero cada archivo se duplica, cuesta leerlos y añadir un idioma toca todos.
- Separar números y estructura de los textos: lo más limpio, pero obliga a rehacer el modelo de datos.

**Cambio de idioma en caliente o recargando.** Se guarda la elección y se **recarga la página** (elegida). Hacerlo reactivo obliga a tocar los doce archivos que importan `config` y `S` para un gesto que casi nadie repite.

**Librería de traducción o módulo propio.** Propio: dos diccionarios y una función `t`. Una librería añadiría peso y una dependencia para dos idiomas.

## Diseño

### Idioma
- Pura, en `src/nucleo/idioma.js`:
  - `elegirIdioma(idiomasDelTelefono: string[], eleccion: "auto" | "es" | "en"): "es" | "en"`.
  - `localeDeFormato(idioma: "es" | "en", idiomasDelTelefono: string[]): string`: `"es-ES"` para el español; para el inglés, la primera variante inglesa de la lista del teléfono (`en-US`, `en-AU`…) o, si no hay, `"en-GB"` (horas de 24 h y día antes del mes).
- Regla con `"auto"`: se recorre `navigator.languages` en orden y decide el primero que sea español (`es`) o inglés (`en`); si hay idiomas pero ninguno de los dos, **inglés**; si la lista está vacía, español. *Pendiente de la persona: qué hacen el gallego, el catalán y el euskera (ver al final); si se aprueba la propuesta, cuentan como español en este recorrido.*
- La elección (`auto`, `es`, `en`) se guarda en el navegador, con las mismas protecciones que `perfil.js` (el almacén puede no existir). Al arrancar se fija el idioma de la página: `<html lang>`, `<title>` y la descripción.
- Selector: un componente `SelectorIdioma.svelte` al final de las pantallas Hoy y Aprender, con tres opciones: «Automático», «Español», «English». Los nombres de los idiomas van siempre en su propio idioma y el título es «Idioma / Language», para que quien llegue a la pantalla equivocada lo encuentre. Elegir guarda y recarga.

### Textos de la interfaz
- `src/idioma/es.js` y `src/idioma/en.js`: diccionarios planos, clave → texto, o clave → función cuando la frase lleva valores o gramática propia. `t(clave, ...valores)` los lee según el idioma de arranque.
- Todo el texto de los componentes (unas 900 palabras) y las unas cien frases del código pasan a `t`. El español queda palabra por palabra como está.
- Las frases que se montan en código con gramática española se reescriben por idioma, no se traducen al pie de la letra: «La luz de hoy / de mañana / del lunes» (`franja.js`), «hoy / ayer / el 3 de noviembre» (`previsionGuardada.js`), los días de `dias.js`, `formato.js` y las líneas de «cómo se calcula» de `semaforo.js`. El separador decimal sigue el idioma («0,5» / «0.5»), y las cinco llamadas fijas a `"es-ES"` usan `localeDeFormato`.
- Los textos del instalador nombran los menús reales de cada sistema en inglés («Share», «Add to Home Screen»). Las abreviaturas (puntos cardinales, unidades) se revisan una a una.
- Los mensajes de error de los validadores y de las pruebas siguen en español.

### Datos
- `data/` pasa a `data/es/` (con `git mv`, para conservar el historial) y se crea `data/en/` con el mismo árbol. `datosIncluidos(idioma)` devuelve la configuración de un idioma; `estado/datos.js` toma el del arranque. La validación (`validar`, `validarLecciones`, `revisarTerminos`, `npm run validar`) corre sobre cada idioma.
- **Prueba de paridad** entre cada par de archivos: misma forma (claves y longitudes de listas) y *todo valor es idéntico salvo los de las claves de prosa*, que se enumeran a propósito (`titulo`, `texto`, `resumen`, `etiqueta`, `empiezo`, `defiendo`, `controlo`, `alt`, `pie`, los textos del semáforo, los `items`…). Una clave nueva que no esté en la lista y difiera falla la prueba: obliga a decidir si es prosa. Así números, umbrales, ids, condiciones (`si`) y referencias (`leccion`, `avisos`) no se desincronizan.
- Los ids siguen en español (`hora-dorada`) porque son internos; solo cambia el texto visible. En la primera tarea del inglés se fija una tabla de términos (hora dorada = *golden hour*, hora azul = *blue hour*, regla de los tercios = *rule of thirds*…) y se guarda en `docs/datos.md`.
- Inglés neutro, sin modismos: es el idioma de todos los que no usan español. Unidades métricas como ahora. Los nombres de modos de cámara de cada marca no se tocan.

### Dibujos
- El código de los dibujos (`scripts/dibujos-lecciones.mjs`) pasa a `src/` para ejecutarse en el navegador. Cada dibujo es una función de sus textos que devuelve el SVG; los colores salen de variables de la hoja de estilos (las paletas claro `#ffffff / #1f2740 / #59607f` y oscuro `#18213a / #ecebf5 / #a8afcb` pasan a ser variables de cada tema).
- Los textos de cada dibujo viven en `data/<idioma>/dibujos.json` (`{ id: { clave: texto | [líneas] } }`), con paridad de claves entre idiomas. Las frases de varias líneas llegan ya partidas en líneas, porque el SVG no parte texto solo.
- `Leccion.svelte` pinta el SVG dentro de la página, con `role="img"` y el `alt` del bloque como nombre; el `pie` sigue como pie de figura en HTML. Cada dibujo conserva su `viewBox` y sus medidas para reservar sitio antes de pintar.
- La letra es Figtree variable (300–900), que la app ya carga.
- Se eliminan los 16 WebP, `dibujos.json` de medidas, `scripts/generar-dibujos.mjs`, `scripts/svg-a-webp.mjs` y el cargador de imágenes (`src/imagenes/dibujos.js`). Playwright se queda para las pruebas.
- La prueba que hoy exige las dos imágenes de cada dibujo pasa a exigir su función y sus textos en cada idioma; `npm run validar` también revisa `dibujos.json` de cada idioma.
- Los dibujos en español quedan igual que hoy a simple vista; se comprueba por capturas.

## Qué se comprueba
- Elección de idioma: `es-ES`→es, `en-US`→en, `fr-FR`→en, `[fr-FR, es-ES]`→es, lista vacía→es, elección guardada manda sobre el teléfono.
- Paridad de diccionarios (mismas claves) y de datos (regla de arriba), más las reglas de lecciones y términos en cada idioma.
- Línea base antes de tocar nada: el texto visible de Hoy, Aprender, cada lección y cada receta en español se captura y, al final, se compara palabra por palabra.
- E2E con Playwright en contextos `es-ES`, `en-US` y `fr-FR` y con el selector: en inglés, el texto visible de la app (excluidos los nombres de lugar que devuelven los servicios) no contiene palabras vacías españolas, `¿`, `¡` ni letras con tilde.
- Dibujos: en cada idioma y tema, a 320 px, ningún `<text>` se sale del `viewBox`, y se miran las capturas.
- Sin conexión en los dos idiomas. Las pruebas actuales siguen pasando en español (el navegador de pruebas se fija en `es-ES`).
- El presupuesto de `pwa.e2e.cjs` (hoy 440 000 bytes y al menos 38 archivos) se ajusta al peso nuevo, sin los 16 WebP, con holgura para los tres dibujos que vienen.
- Documentación al día: `README.md`, `docs/diseno.md` y `docs/datos.md` (dónde van los textos, cómo se añade un idioma, y que cada lección nueva se escribe en los dos).

## Decisiones mías (la persona puede cambiarlas)
- Con varios idiomas en el teléfono cuenta el primero que la app tenga (así `[fr, es]` sale en español); la regla literal («otro idioma → inglés») solo decide cuando no hay ninguno de los dos.
- El inglés se formatea con la variante del teléfono (`en-US`: 3:45 PM) o `en-GB` si no hay ninguna (24 h).
- Cambiar de idioma recarga la página.
- El selector tiene tres opciones, no dos, para poder volver a «lo del teléfono».
- Inglés neutro; la tabla de términos se fija antes de traducir las lecciones.
- Hacerlo antes de las lecciones de nocturna, retrato y arquitectónica: cuanto más texto exista, más hay que mover. Cada lección nueva se escribirá en los dos idiomas.

## Lo que queda para quien construya
El reparto exacto de claves del diccionario, la lista de claves de prosa de la prueba de paridad, el sitio del selector dentro de las dos pantallas, el nuevo tope de peso y cómo se parten en líneas los textos de cada dibujo.

## Orden de trabajo propuesto
1. Línea base del español y módulo de idioma con su selector (sin cambios visibles).
2. Diccionarios y `t()` en componentes y código, con el español idéntico.
3. `data/` a `data/es/` y cargador por idioma.
4. Dibujos como SVG con los textos en español, iguales a los de hoy.
5. Inglés: diccionario, datos y textos de los dibujos.
6. Pruebas en inglés, ajuste del peso y documentación.

## Decidido sin respuesta expresa (la persona puede cambiarlo)
**Gallego, catalán y euskera.** La persona no contestó a la pregunta; se sigue la propuesta: cuentan como español en el recorrido de `navigator.languages` (`gl`, `ca`, `eu`), porque quien los usa lee español. Con la regla literal esos teléfonos verían inglés; cambiarlo es quitar esos tres códigos de `ESPANOL_DE_HECHO` en `src/nucleo/idioma.js`. El selector permite elegir el otro idioma en cualquier caso.
