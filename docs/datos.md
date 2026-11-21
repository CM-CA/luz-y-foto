# Datos: cómo editar umbrales y textos, y cómo añadir un género

Todo lo que cambia a menudo (umbrales, puntos, textos, consejos) está en la carpeta [`data/`](../data/), separado del código. Se edita con cualquier editor de texto y no hace falta programar.

## Qué hay en cada archivo

| Archivo | Para qué sirve |
|---|---|
| `data/generos.json` | Qué pestañas hay y en qué orden, y cuál se abre por defecto según la hora (tres franjas: amanecer, día y noche) |
| `data/comun.json` | Lo que comparten todos los géneros: umbrales de lluvia y niebla, cortes del semáforo, avisos de tormenta y llovizna |
| `data/generos/atardecer.json`, `amanecer.json` | Reglas y textos del atardecer y del amanecer (el mismo motor, con otro evento del sol) |
| `data/generos/luna.json` | Reglas y textos de la luna (la pestaña se llama «Noche»; el `id` sigue siendo `luna`), y el nombre y consejo de cada fase |
| `data/perfil.json` | Las preguntas del perfil de equipo (móvil o cámara, marca, objetivos, trípode, nivel), sus valores por defecto y cómo se llaman los modos Av y Tv en cada marca. Cada opción tiene `id` y `texto`; si hace falta un texto distinto para la línea «Mi equipo» y para la receta (por ejemplo «Nivel medio» en vez de «Medio»), se pone en `resumen` |
| `data/glosario.json` | Los términos que se pueden tocar en las recetas (apertura, ISO, RAW…) |
| `data/recetas/comun.json` | Lo común a todas las recetas: títulos, pregunta «¿llevas el trípode hoy?» y los avisos fijos |
| `data/recetas/atardecer.json`, `amanecer.json`, `luna.json` | Las recetas de cada género, una variante por tipo de equipo |

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

Para añadir una pregunta o una variante basta con editar estos archivos; para añadir una receta a un género nuevo, crea `data/recetas/<id>.json` con el mismo id del género. La validación avisa si falta algo, si un término no existe en el glosario o si un texto está mal escrito.

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

Al abrir la app se elige sola la pestaña que toca a esa hora. Los números están en `data/generos.json`:

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
- **Qué hace**: cuando la visibilidad baja de `nieblaKm` (en `data/comun.json`, 5 km), ese factor da todos sus puntos y su veto no se aplica. «Cómo se calcula» lo explica con una línea.
- **Qué no hace**: la lluvia y las tormentas siguen vetando (con niebla y lluvia fuerte el semáforo sigue en rojo), y los demás factores puntúan igual. El aviso «Poca visibilidad (niebla)…» (`avisoNiebla`) se muestra siempre que hay niebla.
- Sin `nieblaVentaja` (el atardecer) no cambia nada.

## Añadir un género

**Si encaja en un motor existente, solo hace falta añadir datos.** El amanecer ya está hecho así: míralo como ejemplo real en [`data/generos/amanecer.json`](../data/generos/amanecer.json) y [`data/recetas/amanecer.json`](../data/recetas/amanecer.json). Para otro, por ejemplo una «primera luz» (`primera-luz`, que es el que usa la prueba):

1. Copia `data/generos/amanecer.json` a `data/generos/primera-luz.json`.
2. Cambia `"id"`, `"nombre"`, `"eventoNombre"` y los textos que nombren el amanecer (`textoEvento`, `textoBrujula`, `avisoNiebla`, `nieblaVentaja.frase`, el motivo del veto de lluvia). Si miras el atardecer, `"evento": "puesta"`.
3. Añade el `id` a la lista `orden` de `data/generos.json` y una receta en `data/recetas/` (cópiala de `amanecer.json`).

La pestaña aparece con su semáforo, su brújula y su explicación. Hay una prueba automática que lo comprueba (`test/e2e/compilada/genero-nuevo.e2e.cjs`, y `test/semaforo.test.cjs`, «un género NUEVO», en la web antigua).

**Si necesita otra forma de calcular** (por ejemplo, flores o insectos, que dependen del viento y la temperatura y no de un evento del sol), hay que añadir un motor nuevo en `js/semaforo.js` y su panel en la página. Los datos no pueden sustituir eso.

## Qué pasa si te equivocas al editar

Al cargar, la página **valida** los datos (`js/datos.js`) y, si hay un error, lo dice con la ruta exacta en lugar de romperse (en la versión nueva, `src/nucleo/datos.js` valida al compilar, con las mismas reglas: `npm run validar`):

> Hay un error en los datos: generos/luna.nubes: verdeMenosDe debe ser un número menor o igual que ambarHasta

Algunas comprobaciones: los máximos de puntos de un género deben sumar 100, el último tramo debe ser «el resto», los umbrales de lluvia deben ir de menor a mayor, y todos los textos obligatorios deben existir. Para comprobarlo sin abrir la página:

```
node test/datos.test.cjs
```

## Un detalle técnico

La página pide los archivos de `data/` revalidándolos con el servidor, así que un cambio publicado se ve al recargar sin tener que vaciar la caché.
