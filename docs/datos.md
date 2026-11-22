# Datos: cómo editar umbrales y textos, y cómo añadir un género

Todo lo que cambia a menudo (umbrales, puntos, textos, consejos) está en la carpeta [`data/`](../data/), separado del código. Se edita con cualquier editor de texto y no hace falta programar.

## Un idioma, una carpeta

Cada idioma de la app tiene su carpeta con **los mismos archivos**: `data/es/` (español, la referencia) y, uno por idioma, los demás (`data/en/`…). Los nombres de archivo de las tablas de abajo son los de `data/es/`; en otro idioma son los mismos.

- Lo que se traduce es **la prosa**: nombres, frases, consejos, pasos de las recetas, términos del glosario y lecciones. Todo lo demás —ids, umbrales, puntos, minutos, condiciones («solo para móvil»), enlaces a lecciones, el orden— tiene que ser **idéntico** en todos los idiomas, para que el semáforo y las recetas se comporten igual en todos.
- `npm run validar` comprueba cada carpeta de `data/` con las mismas reglas que `es`, y la prueba `test/nucleo/paridad.test.js` compara cada idioma con `es`: misma forma (claves y largo de las listas) y mismos valores salvo los de prosa. La lista de rutas que cuentan como prosa está en `test/nucleo/claves-de-prosa.js` (`CLAVES_DE_PROSA`): si añades un campo de texto nuevo, añade ahí su ruta.
- Todo idioma de `IDIOMAS` (`src/nucleo/idioma.js`) necesita su carpeta: `npm run validar` y la compilación se detienen si falta. (Si aun así faltara, la app usaría la de `es`.)

## Qué hay en cada archivo

| Archivo | Para qué sirve |
|---|---|
| `data/es/generos.json` | Qué pestañas hay y en qué orden, y cuál se abre por defecto según la hora (tres franjas: amanecer, día y noche) |
| `data/es/comun.json` | Lo que comparten todos los géneros: umbrales de lluvia y niebla, cortes del semáforo, avisos de tormenta y llovizna |
| `data/es/generos/atardecer.json`, `amanecer.json` | Reglas y textos del atardecer y del amanecer (el mismo motor, con otro evento del sol) |
| `data/es/generos/luna.json` | Reglas y textos de la luna (la pestaña se llama «Noche»; el `id` sigue siendo `luna`), y el nombre y consejo de cada fase |
| `data/es/perfil.json` | Las preguntas del perfil de equipo (móvil o cámara, marca, objetivos, trípode, nivel), sus valores por defecto y cómo se llaman los modos Av y Tv en cada marca. Cada opción tiene `id` y `texto`; si hace falta un texto distinto para la línea «Mi equipo» y para la receta (por ejemplo «Nivel medio» en vez de «Medio»), se pone en `resumen` |
| `data/es/glosario.json` | Los términos que se pueden tocar en las recetas (apertura, ISO, RAW…) |
| `data/es/recetas/comun.json` | Lo común a todas las recetas: títulos, pregunta «¿llevas el trípode hoy?» y los avisos fijos |
| `data/es/recetas/atardecer.json`, `amanecer.json`, `luna.json` | Las recetas de cada género, una variante por tipo de equipo |
| `data/es/lecciones.json` | La pantalla Aprender: su título, las etiquetas («3 min», «Para cámara», «Idea clave»…) y los grupos de lecciones, en orden |
| `data/es/lecciones/<id>.json` | Una lección: título, resumen, minutos, para quién es y sus bloques (ver «Las lecciones») |

## Recetas y perfil

Cada receta tiene una lista de **variantes**. Se prueban en orden y gana la primera cuya condición `si` se cumple con el perfil del usuario:

```json
{ "id": "camara-tele-tripode", "titulo": "Con teleobjetivo y trípode",
  "si": { "equipo": "camara", "objetivos": "tele", "tripode": "si" },
  "pasos": [ ... ] }
```

- `si` compara con las respuestas del perfil. Con una lista (como `objetivos`), basta con que la contenga.
- La **primera** variante debe poder darse para el móvil (`"si": {"equipo": "movil"}`) y la **última** es la general de cámara (`"si": {"equipo": "camara"}`), para que siempre haya receta.
- Cada **paso** tiene un `titulo` y un texto para cada nivel: `empiezo` (la acción, sin jerga), `defiendo` (con una frase de explicación) y `controlo` (solo el ajuste).
- En los textos, `{Av}` y `{Tv}` se cambian por el nombre del modo de la marca (Canon: Av y Tv; Nikon y Sony: A y S). `[[iso|ISO]]` crea un término tocable que enseña la definición de `glosario.json`.
- `avisos` lista los avisos fijos que se muestran (sus textos están en `recetas/comun.json`). Los que figuran en `soloCamara` no se enseñan a quien usa el móvil.
- `segunSemaforo` es el consejo de «verde», «ámbar» y «rojo».
- Con trípode «a veces», la pantalla ofrece un interruptor «¿Llevas el trípode hoy?».
- `leccion` (opcional) es el id de una lección de `data/es/lecciones/`: la receta enseña, tras los pasos, «Aprende por qué estos ajustes» con un enlace a ella. Lo llevan las variantes de cámara y las de móvil (una lección por variante); la validación avisa si el id no está en `data/es/lecciones.json`.

Para añadir una pregunta o una variante basta con editar estos archivos; para añadir una receta a un género nuevo, crea `data/es/recetas/<id>.json` con el mismo id del género. La validación avisa si falta algo, si un término no existe en el glosario o si un texto está mal escrito.

## Las lecciones

La pantalla Aprender sale de `data/es/lecciones.json` (el título, las etiquetas y los `grupos` —hoy `basico` (cámara), `movil` («Para el móvil») y `tipos` («Tipos de fotografía», lecciones «Para todos»)—, cada uno con su `id`, `titulo`, `subtitulo` y la lista de ids de sus `lecciones`, en el orden en que se ven) y de un archivo por lección, `data/es/lecciones/<id>.json`, que repite ese `id`:

```json
{ "id": "la-rueda-de-modos", "titulo": "La rueda de modos", "resumen": "Qué modo usar y cuándo, sin liarte.",
  "minutos": 3, "para": "camara",
  "bloques": [
    { "tipo": "dibujo", "id": "modos", "alt": "…", "pie": "…" },
    { "tipo": "idea", "texto": "Av si te importa el fondo…" },
    { "tipo": "parrafo", "texto": "La [[apertura|apertura]] …" } ] }
```

- `minutos` va de 1 a 10 y `para` es `camara`, `movil` o `todos`.
- Los **bloques** son `subtitulo`, `parrafo` y `idea` (con `texto`), `lista` (con `items`), `pruebalo` (con `texto`: la práctica de «Pruébalo hoy») y `dibujo` (con `id`, `alt` y `pie`). Se pintan en el orden en que están.
- En los textos, `[[id|texto]]` crea un término tocable del glosario, como en las recetas.
- **Una lección no pasa de 450 palabras** (se cuentan los textos y los elementos de las listas, no el `alt` ni el `pie` de un dibujo): si se pasa, se parte en dos. La validación lo avisa, igual que un tipo de bloque que no existe, un texto que falta o un término que no está en el glosario.
- **Añadir una lección**: crea `data/es/lecciones/<id>.json` y pon su id en la lista `lecciones` de un grupo de `data/es/lecciones.json`. **Añadir un grupo**: otro elemento de `grupos`.
- **Un dibujo** es una función de sus textos que devuelve un SVG (`src/dibujos/<id>.js`, registrada en `src/dibujos/index.js` con su `ancho`, su `alto` y las `claves` de texto que pide). Sus textos están en `data/<idioma>/dibujos.json` (`{ id: { clave: texto o lista de líneas } }`): las frases de varias líneas van ya partidas, porque el SVG no parte el texto solo. Los colores no van escritos en el dibujo: salen de las variables `--dibujo-fondo`, `--dibujo-tinta` y `--dibujo-suave` de `src/estilos.css`, así que el mismo dibujo vale para el tema claro y el oscuro. La validación comprueba que cada dibujo citado en una lección exista y que su entrada de `dibujos.json` tenga exactamente las claves que pide, con el largo de lista que pide; `test/nucleo/dibujos.test.js` comprueba que se pinten con todos sus textos y `test/e2e/compilada/dibujos.e2e.cjs` que, en cada idioma y tema, ningún texto se salga del dibujo a 320 px.

## Cosas que se pueden cambiar sin tocar código

- **Un umbral**: por ejemplo, en `atardecer.json`, el veto de nubes bajas (`"masDe": 88`) o los tramos de puntos de cada factor.
- **Un texto**: títulos del semáforo, resúmenes, avisos, frases de cada factor, consejos de cada fase de la luna.
- **La lluvia**: `comun.json` define qué es llovizna, lluvia moderada y fuerte (en mm/h) para todos los géneros.
- **Los cortes del semáforo**: `comun.json` → `niveles` (verde desde 70, ámbar desde 40).

El texto de «Cómo se calcula» de la página se genera desde estos mismos datos, así que se actualiza solo.

## Cómo se leen los tramos

Un factor reparte puntos con una lista de **tramos**, que se prueban en orden y gana el primero que cumple:

```json
"tramos": [
  { "menosDe": 20, "puntos": 40 },
  { "menosDe": 40, "puntos": 28 },
  { "puntos": 4 }
]
```

Las condiciones posibles son `desde` (mayor o igual), `menosDe` (menor), `hasta` (menor o igual) y `masDe` (mayor); se pueden combinar (`"desde": 20, "hasta": 70`). El **último tramo no lleva condiciones** («el resto») para que siempre haya respuesta. Las `frases` funcionan igual.

## Los dos motores

El código solo conoce dos formas de calcular. Cada género elige una con `"motor"`:

- **`puntos-ventana`**: suma puntos de varios factores (nubes bajas, nubes medias y altas, lluvia…) sobre las horas alrededor de un evento del sol. Lo usan el atardecer y el amanecer (cambia el `evento`: `puesta` o `amanecer`).
- **`mejor-hora-nocturna`**: busca las horas de la noche con la luna alta y valora la de menos nubes. Lo usa la luna.

### La brújula de la luna

El panel de la luna lleva una brújula con la dirección y la altura de la luna. Sus textos están en `luna.brujula` y son todos obligatorios:

- `texto`: la frase de la dirección, con `{direccion}` y `{grados}`.
- `altura`, `alturaUnPuno` y `alturaBaja`: cómo se dice la altura (con `{altura}` y `{punos}`; un puño son unos 10° con el brazo estirado; `alturaBaja` se usa cuando la luna está casi en el horizonte).
- `momentos.ahora`, `momentos.mejor`, `momentos.anochecer` y `momentos.sale`: a qué momento apunta la flecha (con `{hora}`): la luna de ahora, la de la mejor hora de la noche, la del anochecer (si ya estaba en el cielo) o la de su salida.

## Las franjas de la pestaña por defecto

Al abrir la app se elige sola la pestaña que toca a esa hora. Los números están en `data/es/generos.json`:

| Campo | Qué es |
|---|---|
| `porDefecto` | La pestaña de todo el día (hoy, `atardecer`) |
| `porDefectoDeNoche` | La pestaña de la noche (`luna`) |
| `nocheDespuesPuestaMin` | Minutos después de la puesta en que empieza la noche (30) |
| `porDefectoDeAmanecer` | La pestaña de primera hora (`amanecer`) |
| `amanecerAntesMin` | Minutos antes de la salida del sol en que empieza el amanecer (120); también es cuándo termina la noche |
| `amanecerDespuesMin` | Minutos después de la salida del sol en que termina el amanecer (60) |

Manda la noche si se cumple; si no, el amanecer de cualquiera de los días de la previsión; si no, `porDefecto`. Los tres `porDefecto…` deben estar en `orden`, y los minutos ser números (0 o más): lo comprueba `npm run validar`. Si la persona toca otra pestaña, se respeta.

## La niebla como ventaja (`nieblaVentaja`)

Para un amanecer (y cualquier género que lo quiera), la niebla no es mala noticia: la luz suave y la ría con niebla dan fotos muy bonitas. Un género de `puntos-ventana` puede declararlo con un bloque opcional:

```json
"nieblaVentaja": {
  "factor": "bajas",
  "frase": "Niebla o bruma baja: no verás salir el sol, pero la luz suave y la niebla pueden dar fotos muy bonitas."
}
```

- `factor`: el `id` del factor que se «perdona» (en `amanecer.json`, las nubes bajas). No puede ser el de la lluvia.
- `frase`: lo que se dice en lugar de la frase normal de ese factor.
- **Qué hace**: cuando la visibilidad baja de `nieblaKm` (en `data/es/comun.json`, 5 km), ese factor da todos sus puntos y su veto no se aplica. «Cómo se calcula» lo explica con una línea.
- **Qué no hace**: la lluvia y las tormentas siguen vetando (con niebla y lluvia fuerte el semáforo sigue en rojo), y los demás factores puntúan igual. El aviso «Poca visibilidad (niebla)…» (`avisoNiebla`) se muestra siempre que hay niebla.
- Sin `nieblaVentaja` (el atardecer) no cambia nada.

## Añadir un género

**Si encaja en un motor existente, solo hace falta añadir datos.** El amanecer ya está hecho así: míralo como ejemplo real en [`data/es/generos/amanecer.json`](../data/es/generos/amanecer.json) y [`data/es/recetas/amanecer.json`](../data/es/recetas/amanecer.json). Para otro, por ejemplo una «primera luz» (`primera-luz`, que es el que usa la prueba):

1. Copia `data/es/generos/amanecer.json` a `data/es/generos/primera-luz.json`.
2. Cambia `"id"`, `"nombre"`, `"eventoNombre"` y los textos que nombren el amanecer (`textoEvento`, `textoBrujula`, `avisoNiebla`, `nieblaVentaja.frase`, el motivo del veto de lluvia). Si miras el atardecer, `"evento": "puesta"`.
3. Añade el `id` a la lista `orden` de `data/es/generos.json` y una receta en `data/es/recetas/` (cópiala de `amanecer.json`).

La pestaña aparece con su semáforo, su brújula y su explicación. Hay una prueba automática que lo comprueba (`test/e2e/compilada/genero-nuevo.e2e.cjs`).

**Si necesita otra forma de calcular** (por ejemplo, flores o insectos, que dependen del viento y la temperatura y no de un evento del sol), hay que añadir un motor nuevo en `src/nucleo/semaforo.js` y su panel en `src/componentes/`. Los datos no pueden sustituir eso.

## Qué pasa si te equivocas al editar

Al compilar se **validan** los datos (`src/nucleo/datos.js`) y, si hay un error, se dice con la ruta exacta y no se genera nada (`npm run validar` lo hace sin compilar):

> Hay un error en los datos: generos/luna.nubes: verdeMenosDe debe ser un número menor o igual que ambarHasta

Algunas comprobaciones: los máximos de puntos de un género deben sumar 100, el último tramo debe ser «el resto», los umbrales de lluvia deben ir de menor a mayor, y todos los textos obligatorios deben existir. Para comprobarlo sin abrir la página:

```
node test/datos.test.cjs
```

## Un detalle técnico

La página pide los archivos de `data/` revalidándolos con el servidor, así que un cambio publicado se ve al recargar sin tener que vaciar la caché.
