# Eventos del cielo y planetas: diseño

Propuesto el 2026-11-22 en conversación con la persona, que aceptó las decisiones de abajo (incluido subir el umbral de «cerca» a 10°). Este documento espera su visto bueno antes de escribir el plan y tocar código.

## Intención
Que quien abre la app sepa **cuándo ocurre un evento del cielo que merece la foto** y cuándo y hacia dónde mirar. El caso real que lo motiva es una foto de la persona del 13 de septiembre de 2026 (Canon EOS 600D, 55 mm, f/5.6, ISO 400, 1 s): una luna creciente fina a ras de horizonte con Venus a unos 8° de ella, de las Cíes de silueta, hecha a las 21:28, ocho minutos antes de que la luna se pusiera. Un evento así dura menos de una hora y se acaba solo: hay que saberlo antes.

La persona vive en una ciudad con mucha luz: las estrellas y las constelaciones no le sirven. La luna y los planetas brillantes sí. Por eso se descartaron las constelaciones.

## Objetivos
- Avisar de los **próximos encuentros** de la luna con un planeta brillante (Venus, Marte, Júpiter, Saturno) y entre dos planetas, que se vean desde el lugar elegido: día, hora, dirección, altura y cuánto se acercan.
- Decir **hasta cuándo se ve** (en el caso real, «hasta las 21:36, cuando se pone la luna») y qué lo acaba.
- Cruzarlo con la previsión de nubes cuando el evento cae dentro de ella.
- En la pestaña Noche, una línea con **los planetas de esa noche**: cuáles se ven, hacia dónde y a qué altura.
- Todo se calcula en el dispositivo, sin conexión y sin catálogos grandes.

## No objetivos
- Estrellas, constelaciones o la Vía Láctea.
- Lluvias de estrellas, eclipses y otros eventos de calendario (necesitarían una tabla de fechas aparte; quedan para después).
- Mercurio, Urano y Neptuno.
- Avisos en el móvil con la app cerrada: es una web sin servidor, solo muestra los eventos al abrirla.
- La receta de cámara de «luna con planeta» y su lección (es de la capa de enseñanza; los ajustes de la foto real, arriba, son su semilla).
- Medir la contaminación lumínica del lugar.

## Antiobjetivos (sería un fracaso aunque «funcione»)
- Avisar de un evento que no se ve desde el lugar (con la luna o el planeta bajo el horizonte, o a plena luz).
- Dar una hora o una posición con más precisión de la que tienen: el cálculo sirve para saber dónde mirar, no para apuntar un telescopio.
- Una tarjeta vacía o permanente: si no hay eventos, no se muestra nada.
- Que Amanecer, Atardecer o Noche se comporten distinto de como lo hacen hoy.

## Restricciones
- Sin servidor y sin conexión; sin dependencias nuevas en la app compilada (la luna y el sol ya vienen de `suncalc` 2.1.4).
- Las cifras y los textos van en `data/`, como el resto (`docs/datos.md`); el cálculo, en `src/nucleo/`. `npm run validar` debe comprobar el archivo nuevo.
- Una cuarta pestaña no cabría en la fila a 320 px: no se añade pestaña.

## Enfoques considerados
1. **Solo los planetas de cada noche**: una línea en Noche. Es lo más sencillo, pero no dice cuándo hay un evento que merezca la foto.
2. **Solo eventos**: la tarjeta de avisos, sin la línea de planetas.
3. **Las dos, con un solo motor** (elegida por la persona, empezando por los eventos): los eventos son lo que pidió; la línea de planetas cuesta poco porque comparte el cálculo.

## Cómo funciona (decisiones tomadas)
**Qué es un evento.** La luna a **menos de 10°** de Venus, Marte, Júpiter o Saturno (unos 10° son un puño con el brazo estirado; la foto real estaba a unos 8°, con el umbral de 5° que se propuso primero no se habría avisado), o dos planetas a menos de 2°. Solo cuenta si hay un rato en que **los dos astros están a más de 2° sobre el horizonte y el sol a más de 3° bajo él**. Ese rato es la **ventana**. Si la luna está a menos de 10° de un planeta en dos tardes seguidas, es un solo paso: se muestra la tarde con la ventana mejor.

**Qué se ve.** En Hoy, encima del panel y **en cualquier pestaña** (esos momentos caen en el crepúsculo, no solo en Noche), una tarjeta con el próximo evento. Si no hay ninguno a la vista, no hay tarjeta. Boceto:

```
Luna y Venus, muy juntas
Domingo 13 · se ve de 21:05 a 21:36 (la luna se pone a las 21:36)
Hacia el oeste-suroeste, baja (4°) · a un puño una de otra (8°)
[flecha de la brújula, como en Noche]
Cielo despejado en ese rato
```

Debajo, «Ver los próximos» despliega los siguientes (hasta 5). Mira **30 días** adelante; la previsión de nubes llega a unos 4 días, y más allá la tarjeta dice «sin previsión todavía». El veredicto de nubes usa los mismos niveles (verde, ámbar, rojo) y las mismas palabras que el resto de la app.

**La línea de Noche.** Los planetas brillantes que se ven esa noche (más de 2° sobre el horizonte con el cielo oscuro), con su dirección, su altura y hasta cuándo, con la misma forma de frase que la brújula («Venus, al oeste-suroeste, bajo, hasta las 21:50»). Si no se ve ninguno, no hay línea.

**Cálculo.**
- La luna: `suncalc` ya la da con paralaje y refracción; no se corrige nada más.
- Los planetas: posiciones aproximadas a partir de los elementos orbitales de la NASA para 1800–2050 (error de unas décimas de grado, mucho menos que el ancho de un dedo), con la refracción del horizonte. Es un módulo puro nuevo, `src/nucleo/planetas.js`, sin pantalla.
- Los eventos: otro módulo puro, `src/nucleo/eventos-cielo.js`, que recorre los 30 días en pasos pequeños solo en los rangos en que el sol está bajo.
- Las cifras (10°, 2°, 3°, 30 días, 5 eventos) y los textos, en un archivo de datos nuevo, `data/cielo.json`, que valida `src/nucleo/datos.js`.
- La pantalla: un componente nuevo para la tarjeta y una línea en `PanelNocturno.svelte`.

**Comprobación con la foto real.** El cálculo de Venus se probó a mano con la hora de la foto y reproduce lo medido en ella (Vigo, 13 de septiembre de 2026, 21:28:37 hora de verano):

| | Cálculo | Medido en la foto |
|---|---|---|
| Luna: altura / azimut | 0,9° / 250,6° | ≈ 1° |
| Venus: altura / azimut | 4,1° / 242,8° | ≈ 4° |
| Separación | 8,4° (7,8° en horizontal, 3,2° en vertical) | 8,4° (7,8° y 3,0°) |
| La luna se pone | 21:36 | — |

(La foto se midió con el ángulo de visión de 55 mm en un sensor APS-C; es una medida aproximada. El sol estaba 7,7° bajo el horizonte.) Ese caso, con esos números, es una **prueba** del plan.

## Lo que queda al constructor
- El criterio del «mejor momento» dentro de la ventana, siempre que muestre la ventana entera y diga qué la acaba.
- Cómo se cruza con la previsión: reutilizar las reglas de nubes, lluvia y visibilidad de Noche o un archivo propio.
- Comprobar los planetas contra una efeméride independiente (por ejemplo, el paquete `astronomy-engine` solo como dependencia de pruebas, con tolerancia de medio grado) en una veintena de fechas, no solo contra la foto.
- El paso de tiempo del recorrido, el diseño visual de la tarjeta y de su lista, y los textos exactos (en castellano, sin tecnicismos).
- Qué pasa en el hemisferio sur y en latitudes extremas: no deben fallar.
- Las pruebas del plan: lógica con Vitest y navegador (la tarjeta aparece, se cierra bien y no desborda a 320 px; sin eventos no hay tarjeta), y la actualización de `docs/datos.md` y `docs/diseno.md`.
