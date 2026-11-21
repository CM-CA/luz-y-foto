# La brújula del móvil en Luna y Atardecer — diseño

Fecha: 2026-11-21. Estado: aprobado en conversación («me gusta la opción B», y que también esté en Atardecer).

## Intención

Quien se inicia en la fotografía no sabe dónde buscar en el cielo lo que quiere fotografiar. En Atardecer ya hay una
brújula con una flecha fija («Al atardecer, mira hacia el oeste-noroeste (285°)»). La persona pidió lo mismo para la
luna y, además, que use la brújula del teléfono: si el móvil sabe hacia dónde mira, la flecha puede decir «gira un poco
a la derecha» en vez de obligar a orientarse con el norte.

## Objetivos

- Una brújula en Luna, con el mismo aspecto que la de Atardecer: flecha, N y una frase con la dirección y los grados.
- La brújula del móvil, **opcional**: un botón la activa y la flecha gira con el teléfono. Con la flecha hacia arriba,
  se está mirando al objetivo.
- Lo mismo en Atardecer (y en cualquier género de «puntos en una ventana»: hoy atardecer y amanecer): un solo componente.
- Que funcione sin la brújula: la frase con la dirección y los grados lo dice todo, y no depende de ningún sensor.

## No objetivos y antiobjetivos

- No es una brújula de precisión ni realidad aumentada con la cámara: los móviles se desvían 10–20° si no están
  calibrados. La app lo dice una vez, en pequeño, cuando la brújula está activa.
- No hay servidor, ni ajustes nuevos, ni datos nuevos que guardar: la brújula del móvil se activa en cada visita.
- Antiobjetivo: que un móvil sin sensor, un permiso denegado o un ordenador dejen una pantalla rota o un botón que no
  hace nada. Siempre queda la brújula fija de siempre.
- Fuera de alcance: la posición del sol «ahora» en Atardecer (la flecha sigue apuntando a donde se pone el sol ese día),
  y un selector de momento en Luna.

## Enfoques considerados

- **A. Solo flecha fija.** Funciona en cualquier sitio, pero obliga a orientarse con el norte.
- **B. Flecha fija y brújula del móvil opcional (elegida).** La fija funciona siempre; la viva es un añadido.
- **C. Solo brújula viva.** Falla en ordenador, sin permiso y al planificar desde casa.

## Lo que decidió la persona

- Opción B, y que también esté en Atardecer.
- El aspecto es el de la brújula de Atardecer, con coordenadas (dirección y grados).

## Decisiones mías (a corregir si no gustan)

1. **Dónde.** En el panel de Luna, justo debajo de los avisos y antes de la receta, como en Atardecer.
2. **A qué momento apunta la flecha en Luna** (función pura `momentoDeLaLuna`):
   1. Si la noche elegida está en curso y la luna está sobre el horizonte ahora → la luna **de ahora**.
   2. Si no, y esa noche tiene mejor hora (la del semáforo) → la luna **a la mejor hora**, con la hora escrita.
   3. Si no, y la luna ya estaba en el cielo al anochecer → su posición **al anochecer**, con la hora de la puesta de sol.
   4. Si no, y la luna sale durante la noche → el punto por donde **sale**, con la hora.
   5. Si la luna no está sobre el horizonte en toda la noche → no hay brújula (el panel ya dice «no sale este día»).
   En el código, la función se llama `momentoDeLaLuna` y los tipos son `ahora`, `mejor`, `anochecer` y `sale`.
3. **Altura.** En Luna la frase añade la altura sobre el horizonte en grados y en puños a brazo extendido (1 puño ≈ 10°);
   si la luna está casi en el horizonte (menos de 5°, como al salir) dice «casi a ras del horizonte». En Atardecer no hay
   altura: la puesta está en el horizonte.
4. **Reloj.** «Ahora» es el reloj del dispositivo, no la hora de la previsión; se recalcula cada minuto mientras el panel
   está en pantalla.
5. **Textos en `data/`.** La frase de Luna va en `data/generos/luna.json` (`textoBrujula` con `{direccion}`, `{grados}`,
   `{altura}` y `{puños}`; y una línea de momento para «ahora», «mejor hora» y «sale»), validada como la de Atardecer.
   Los textos del botón y de los mensajes de la brújula viva van en el componente.
6. **Botón.** «Usar la brújula del móvil» / «Dejar de usar la brújula del móvil». Solo se muestra si el navegador tiene
   la API de orientación. En iPhone el primer toque pide permiso (`DeviceOrientationEvent.requestPermission`, que solo
   se puede llamar desde un toque). Si llega a darse permiso pero en 2 segundos no llega ninguna lectura (ordenador),
   se dice «Este dispositivo no da la brújula» y queda la fija. Si se deniega: «Sin permiso para la brújula. Puedes
   darlo en los ajustes del navegador.».
7. **Giro.** Con la brújula activa, todo el dial (círculo y N) gira −rumbo y la flecha queda en `az − rumbo`; debajo
   de la frase fija se añade «Estás mirando al <punto cardinal> (<grados>°).». El rumbo es hacia donde mira la **cámara
   trasera** del móvil (se usa con el móvil de pie, apuntando al cielo): en Android `deviceorientationabsolute` con
   compensación de la inclinación; en iPhone `webkitCompassHeading`.
8. **Ahorro y limpieza.** Solo se escucha el sensor mientras hay una brújula activa en pantalla. Se deja de escuchar al
   apagarla, al ocultar la página y al salir de la pantalla de Hoy (o si el panel deja de tener brújula). Cambiar de
   pestaña, de día o de lugar **no** la apaga: el panel se vuelve a pintar entero y la brújula sigue encendida, con una sola
   escucha. Una lectura solo se aplica si el rumbo cambia 1° o más (el resto es ruido del sensor).
   *(Cambio respecto a la primera versión de esta nota, que apagaba la brújula al cambiar de pestaña y limitaba las
   lecturas a una por fotograma: con el panel repintándose, apagarla en cada cambio obligaba a volver a pulsar, y con
   el margen de 1° ya no hace falta limitar por fotograma.)*
9. **Accesibilidad.** Toda la información está en texto. El dibujo es un apoyo (`aria-hidden` el dial vivo; la etiqueta
   del dibujo fijo se mantiene). Los textos de estado de la brújula viva no son `aria-live`: cambiarían diez veces por
   segundo.

## Qué se construye

- `src/nucleo/rumbo.js` (puro): `posicionLuna(fecha, lat, lon)`, `momentoDeLaLuna({ inicio, fin, ahora, mejorHora, lat, lon })`,
  `punos(altura)` (sin ñ en el código), `giro(az, rumbo)`, `rumboDe(evento)`.
- `src/estado/orientacion.svelte.js`: estado de la brújula del móvil (`activa`, `rumbo`, `mensaje`) con `activar()` y `parar()`.
- `src/componentes/Brujula.svelte`: flecha (con el giro opcional), frase y botón; la usan `PanelPuntos` y `PanelNocturno`.
  `Flecha.svelte` gana una propiedad opcional `rumbo`.
- `data/generos/luna.json` y la validación en `src/nucleo/datos.js`.
- Pruebas: unitarias de `rumbo.js` (con SunCalc como referencia) y de la validación; de navegador con lecturas de
  brújula simuladas (Android, iPhone con permiso concedido y denegado, ordenador sin lecturas), con 320/360/390 px,
  claro y oscuro, y comprobando que se deja de escuchar al salir.

## Lo que queda al constructor

- El nombre exacto de los textos nuevos y su redacción final (tono de la app: claro, sin jerga).
- La fórmula de compensación de la inclinación (la del W3C para `alpha`, `beta` y `gamma`).
- La comprobación real con el sensor solo puede hacerla la persona en su móvil; las pruebas automáticas simulan las lecturas.
