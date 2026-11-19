# Datos: cómo editar umbrales y textos, y cómo añadir un género

Todo lo que cambia a menudo (umbrales, puntos, textos, consejos) está en la carpeta [`data/`](../data/), separado del código. Se edita con cualquier editor de texto y no hace falta programar.

## Qué hay en cada archivo

| Archivo | Para qué sirve |
|---|---|
| `data/generos.json` | Qué pestañas hay y en qué orden, cuál se abre por defecto y cuál de noche |
| `data/comun.json` | Lo que comparten todos los géneros: umbrales de lluvia y niebla, cortes del semáforo, avisos de tormenta y llovizna |
| `data/generos/atardecer.json` | Reglas y textos del atardecer |
| `data/generos/luna.json` | Reglas y textos de la luna, y el nombre y consejo de cada fase |

La carpeta `recetas/` llegará con el perfil de equipo (cámara, objetivos, trípode), porque las recetas dependen de él.

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

- **`puntos-ventana`**: suma puntos de varios factores (nubes bajas, nubes medias y altas, lluvia…) sobre las horas alrededor de un evento del sol. Lo usa el atardecer.
- **`mejor-hora-nocturna`**: busca las horas de la noche con la luna alta y valora la de menos nubes. Lo usa la luna.

## Añadir un género

**Si encaja en un motor existente, solo hace falta añadir datos.** Ejemplo, un amanecer:

1. Copia `data/generos/atardecer.json` a `data/generos/amanecer.json`.
2. Cambia `"id": "amanecer"`, `"nombre"`, `"evento": "amanecer"`, `"eventoNombre"` y los textos que nombren la puesta (`textoEvento`, `textoBrujula`, `avisoNiebla`, el motivo del veto de lluvia).
3. Añade `"amanecer"` a la lista `orden` de `data/generos.json`.

La pestaña aparece con su semáforo, su brújula y su explicación. Hay una prueba automática que lo comprueba (`test/semaforo.test.cjs`, «un género NUEVO»).

**Si necesita otra forma de calcular** (por ejemplo, flores o insectos, que dependen del viento y la temperatura y no de un evento del sol), hay que añadir un motor nuevo en `js/semaforo.js` y su panel en la página. Los datos no pueden sustituir eso.

## Qué pasa si te equivocas al editar

Al cargar, la página **valida** los datos (`js/datos.js`) y, si hay un error, lo dice con la ruta exacta en lugar de romperse:

> Hay un error en los datos: generos/luna.nubes: verdeMenosDe debe ser un número menor o igual que ambarHasta

Algunas comprobaciones: los máximos de puntos de un género deben sumar 100, el último tramo debe ser «el resto», los umbrales de lluvia deben ir de menor a mayor, y todos los textos obligatorios deben existir. Para comprobarlo sin abrir la página:

```
node test/datos.test.cjs
```

## Un detalle técnico

La página pide los archivos de `data/` revalidándolos con el servidor, así que un cambio publicado se ve al recargar sin tener que vaciar la caché.
