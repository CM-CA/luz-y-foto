# Eventos del cielo: diseño

Rehecho el 2026-11-22. La primera versión (ventanas de visibilidad, veredicto de nubes, planetas de cada noche en Noche y una tarjeta sobre las pestañas) se descartó: la persona dijo que era innecesario. Lo que pide es un **calendario**: «si hay un eclipse de luna, una lluvia de estrellas o qué día estará más cerca Venus, o cualquier planeta, de la luna». La persona vio una maqueta de esta versión y dijo «me gusta».

## Intención
Que quien abre la app sepa **qué días hay algo en el cielo que merece una foto**. El caso real: una foto del 13 de septiembre de 2026 (Canon EOS 600D, 55 mm, f/5.6, ISO 400, 1 s) con una luna creciente fina y Venus a unos 8°, ocho minutos antes de que la luna se pusiera. La persona vive en una ciudad con mucha luz: la luna y los planetas brillantes le sirven; las estrellas y las constelaciones, no.

## Objetivos
- Una sección **«Próximos eventos del cielo»** al final de Hoy, con los de los próximos **90 días**: cinco filas y el resto tras «Ver todos».
- Tres tipos de evento, y solo esos:
  1. **Luna con un planeta** (Venus, Marte, Júpiter o Saturno): el día en que están más cerca, a cuántos grados, a qué parte de la noche y hacia dónde mirar.
  2. **Eclipse de luna** que se vea desde el lugar: día, hora del máximo y qué se verá.
  3. **Lluvia de estrellas**: la noche del máximo, cuánto estorba la luna y cuántas se ven en cielo oscuro.
- Todo se calcula en el dispositivo, sin conexión y sin catálogos grandes.

## No objetivos (decisión cerrada)
La persona acordó que tras esto no se añade más información a Hoy, para no saturar. Quedan fuera: Mercurio, Urano y Neptuno, los eclipses de sol, los encuentros de un planeta con otro, estrellas, constelaciones y la Vía Láctea, las ventanas horarias («se ve de 21:03 a 21:21»), el veredicto de nubes, cualquier bloque en Noche o tarjeta sobre las pestañas, y los avisos en el móvil. La capa de enseñanza (lecciones, glosario) va en su propio menú, no en Hoy.

## Antiobjetivos
- Avisar de un encuentro que no se ve (de día, o con la luna o el planeta bajo el horizonte).
- Dar una hora o una posición con más precisión de la que tienen: sirve para saber cuándo y dónde mirar.
- Una sección vacía.
- Que Amanecer, Atardecer o Noche cambien de comportamiento.

## Restricciones
- Sin servidor y sin conexión; sin dependencias nuevas en la app compilada (la luna y el sol ya vienen de `suncalc` 2.1.4).
- Cifras, textos y tablas en `data/cielo.json`, validado por `src/nucleo/datos.js` (`npm run validar`); el cálculo, en `src/nucleo/`.
- Debe verse bien desde 320 px, en claro y en oscuro, con los colores y símbolos que ya existen.

## Cómo se ve
Debajo del panel de la pestaña, encima de «Cómo se calcula», igual en las tres pestañas. Un título («Próximos eventos del cielo»), una línea («Calculados para tu ubicación, sin conexión.») y una tarjeta con una fila por evento: a la izquierda el día (día de la semana, número y mes; «13–14» en una lluvia), y a la derecha un icono pequeño (luna con planeta, estrella fugaz, eclipse), el título en negrita y una o dos líneas. Las lluvias llevan una etiqueta con el símbolo del semáforo: ● verde (luna fina, buena noche) o ▲ ámbar (la luna estorba). Debajo, una línea «Después: …» con lo que no cabe y un botón «Ver todos» que despliega esas filas. Con cinco eventos o menos no hay «Después» ni botón.

```
  lun   ☾ Luna y Júpiter, muy cerca
  30    A 1,7° una de otra. Antes del amanecer, hacia el suroeste.
  nov
  ─────────────────────────────────────────
  dom   ✦ Lluvia de estrellas: Gemínidas
 13–14  ● Luna fina: buena noche
  dic   Máximo la noche del 13 al 14. La luna se pone a las 22:06.
        Hasta 150 por hora en cielo oscuro; con la luz de la ciudad, bastantes menos.
```

## Reglas (decididas)
**Luna con planeta.** Hay encuentro si la luna está a menos de **10°** del planeta (unos 10° son un puño con el brazo estirado) en algún instante con **los dos a más de 2° sobre el horizonte y el sol a más de 3° bajo él**. Los encuentros del mismo planeta con menos de 36 h entre sí son un solo paso: se muestra el instante de menor separación, y su día (el del lugar) es el de la fila. La fila dice: la separación, la parte de la noche («Al anochecer», «Por la noche», «De madrugada» o «Antes del amanecer», según el sol baje o suba y esté por encima o por debajo de −12°), hacia dónde («hacia el suroeste»; «bajo hacia…» si está a menos de 10° de altura) y «Luna muy fina.» si está iluminada menos del 15 %.

**Eclipse de luna.** Una tabla en `data/cielo.json` con el instante del máximo y el tipo (penumbral, parcial o total) de los de 2026 a 2030, sacada de una efeméride y contrastada con la lista de la NASA. Se muestra si la luna está a más de 2° sobre el horizonte en el máximo. Los penumbrales dicen que «apenas se nota».

**Lluvia de estrellas.** Una tabla con las ocho o nueve de siempre (nombre, noche del máximo, meteoros por hora en cielo oscuro). La luna esa noche, a medianoche del lugar: menos del 35 % iluminada es «Luna fina: buena noche» (verde); hasta el 75 %, «Luna a medias: se verán menos» (ámbar); más, «Luna casi llena: se verán pocas» (ámbar). Si la luna se pone o sale esa noche antes de las 06:00, la fila lo dice («La luna se pone a las 22:06»). Se deja de mostrar a las 09:00 del lugar del día en que acaba la noche.

**La lista.** Los tres tipos juntos, por día; solo lo que aún no ha pasado; 90 días. Sin eventos no hay sección.

## Comprobación con casos reales
Vigo (42,2406; −8,7207). La foto: el 13 de septiembre de 2026 cumple (Venus a 8,5°, a las 21:21), pero el paso lo gana el 14 (3,5°): la fila saldría ese día. Desde el 22 de noviembre de 2026, los seis primeros encuentros son Júpiter el 30 de noviembre (1,7°), Marte el 1 de diciembre (5,8°), Venus el 5 (6,9°), Saturno el 18 (6,6°), Júpiter el 27 (4,4°) y Marte el 28 (6,5°). Las Gemínidas de 2026 tienen luna del 20 % y se va a las 22:06; las Úrsidas, luna casi llena; el próximo eclipse es penumbral, el 21 de febrero de 2027, y desde Vigo se ve (con la luna a 51°).

## Lo que queda al constructor
- Los textos exactos (la maqueta los fijó; pueden ajustarse sin cambiar su tono) y las fechas de las lluvias contra el calendario de la IMO.
- Comprobar los planetas contra una efeméride independiente (`astronomy-engine`, solo como dependencia de pruebas, tolerancia de medio grado).
- El recorrido por el tiempo: debe ser rápido en un móvil (primero grueso, luego fino solo donde hay encuentros).
- Latitudes extremas y hemisferio sur: no deben fallar.
- Pruebas (Vitest y navegador, también a 320 px) y la actualización de `docs/datos.md` y `docs/diseno.md`.
