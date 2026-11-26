# Aprender: histograma y composición (tercera tanda, diseño)

Aprobado el 2026-11-24 en la conversación. La persona pidió primero «Falta también como usar el histograma y busca más temas para poder agregar»; se le enseñó una lista de temas posibles y contestó «Puntos de fuga y encuadre?» y después «Fusionar y escribe todo lo que me mostraste, sin olvidar los puntos de fuga y encuadre». Continúa [`2026-11-24-aprender-tipos-2-design.md`](2026-11-24-aprender-tipos-2-design.md): mismo formato, mismas reglas.

## Intención
Que quien ya dispara con soltura sepa leer el histograma para no fiarse de la pantalla, y que tenga un primer grupo de lecciones sobre componer: qué poner en la foto, dónde y cómo usar las líneas.

## Objetivos
- «Cómo usar el histograma» (`como-usar-el-histograma`, 2 min, para cámara) en «Lo básico», con el dibujo `histograma`: cómo verlo, cómo se lee, qué mirar (pegado a un lado, cortado contra un borde, no hay forma correcta), cómo corregirlo y por qué la pantalla engaña. La lección de noche la enlaza.
- Un grupo nuevo, **«Composición»**, entre «Para el móvil» y «Tipos de fotografía», con tres lecciones de 3 minutos, para todos, cada una con un dibujo:
  1. **Lo básico de la composición** (`composicion`): un sujeto claro, fondo sencillo, regla de los tercios y cuadrícula, equilibrio, cambiar de punto de vista, y cuándo saltarse la regla.
  2. **El encuadre** (`encuadre`): acercarse, mirar los bordes, no cortar por las articulaciones, horizontal o vertical, espacio por delante, marcos naturales y margen para recortar.
  3. **Líneas y puntos de fuga** (`fuga`): qué son, dónde buscarlas, dónde poner el punto de fuga (centro o tercio), cómo marcarlas más y no confundirlas con las verticales que se caen.
- Un término nuevo del glosario, **punto de fuga**, con su inglés.

## No objetivos
Los temas de las tandas siguientes (la luz, técnica, más tipos de fotografía) y el simulador de exposición: se hacen después, cada uno en su propia entrega. Enlazar estas lecciones desde las recetas de Hoy. Marcas de cámara.

## Antiobjetivos
- Repetir lo ya dicho: el histograma ya sale en «Fotografía nocturna» (se enlaza por su título), las verticales convergentes en «Fotografía de arquitectura» (se enlaza, y se avisa de que no son lo mismo), el fondo sencillo en «Fotografía de retrato».
- Dar la composición como ley: la regla de los tercios es una guía y se dice cuándo saltársela.
- Decir como si valiera para todos los móviles algo que cambia entre ellos (dónde está el histograma o la cuadrícula).

## Formas de hacerlo
Una sola: son datos, como las anteriores (un archivo por lección en cada idioma, entradas en el grupo, un dibujo por lección en `src/dibujos/`).

## Hoja de ruta de lo que se pidió después («todo lo que me mostraste»)
Cada tanda con su propia rama, su pull request, su suite completa y su publicación:
1. Histograma y Composición (hecha).
2. **La luz**: luz dura y suave, contraluz y siluetas, balance de blancos (hecha: ver «La luz» abajo).
3. **Técnica**: RAW y JPEG, medición y modos de enfoque, larga exposición y filtros, distancias focales (hecha: ver «Técnica» abajo).
4. **Más tipos de fotografía**: macro, astrofotografía, fauna y aves, mascotas (ver «Más tipos, primera parte» abajo), viajes, comida, familia y niños (ver «Más tipos, segunda parte» abajo). Hecha del todo.
5. El **simulador de exposición** (es una función, no una lección: se diseña aparte).

## Decisiones mías (la persona puede cambiarlas)
- Títulos: «Cómo usar el histograma», «Lo básico de la composición», «El encuadre» y «Líneas y puntos de fuga».
- Orden de los grupos: Lo básico, Para el móvil, **Composición**, Tipos de fotografía (Tipos va el último porque seguirá creciendo). Los grupos de la luz y de técnica irán entre Composición y Tipos.
- Orden de las lecciones de Composición: de lo general (el sujeto y los tercios) a lo concreto (el encuadre, las líneas).
- En inglés, el dibujo del histograma rotula «lights» y no «highlights» porque «highlights» pisaba a «shadows» a 320 px; el texto de la lección sí dice «highlights».
- Dejado fuera por tener una sola fuente: los avisos de altas luces (blinkies), que el histograma de la cámara se calcula sobre el JPEG, la composición en Z y la espiral, el bokeh como marco, que varios puntos de fuga recargan, que un tele da un resultado menos dramático y la perspectiva de uno, dos y tres puntos (detalle en el documento de fuentes). Las páginas de Samsung sobre su modo Pro no mencionan el histograma, así que se dice «en algunos móviles» y no «en todos».
- Adorama recomienda fotografiar estructuras altas desde abajo para que converjan; la lección de líneas no lo recomienda (contradice «Fotografía de arquitectura», que tiene cuatro fuentes en contra).

## La luz (segunda tanda de la hoja de ruta, 2026-11-24)
- Grupo nuevo «La luz» («Light»), entre «Composición» y «Tipos de fotografía», con tres lecciones de 3 min para todos: «Luz dura y luz suave» (dibujo `luzdura`: la misma pelota con una fuente pequeña y con una grande), «Contraluz y siluetas» (dibujo `contraluz`: medido para el sujeto frente a medido para el cielo) y «Balance de blancos» (dibujo `blancos`: la misma taza con luz de bombilla, bien puesta y con luz de sombra). Término nuevo del glosario: balance de blancos.
- Los dibujos `contraluz` y `blancos` son fotos (colores fijos, iguales en claro y oscuro, como `toca` y `luces`); `luzdura` usa los colores del tema.
- Decisiones mías: en «Contraluz y siluetas» el sol bajo es «más fuerte y más dramático» y no «más fácil de exponer» (esto último solo lo dice PhotoWorkout); en «Balance de blancos» se quitó «luz que cambia rápido» (solo PetaPixel) y el móvil dice «en el modo Pro o manual, y en algunas apps más sencillas» porque Android Authority dice que el ajuste sale también en apps básicas y la página del modo Pro de Sony no lo lista. Lo que se dejó fuera por tener una sola fuente está en el documento de fuentes.
- El modo Pro y el RAW se nombran sin explicarlos aquí: la lección de RAW y JPEG (tanda de técnica) los desarrollará.

## Técnica (tercera tanda de la hoja de ruta, 2026-11-24)
- Grupo nuevo «Técnica» («Technique»), entre «La luz» y «Tipos de fotografía», con cinco lecciones de 3 min: «RAW y JPEG» (para todos; dibujo `rawjpeg`), «Modos de medición» y «Modos de enfoque» (para cámara; dibujos `medicion` y `enfoque`), «Larga exposición y filtros» (para cámara; dibujo `largaexp`) y «Distancias focales» (para todos; dibujo `focales`). Términos nuevos del glosario: distancia focal, filtro ND y enfoque simple. Las lecciones de paisaje, deportiva y retrato enlazan a «Distancias focales».
- Los cinco dibujos usan los colores del tema.
- Decisiones mías, tras volver a comprobar cada afirmación con las páginas (detalle en el documento de fuentes): el temporizador de «Larga exposición y filtros» no dice «de 2 segundos» (las fuentes dan de 1 a 3 s o no dan cifra); el modo Bulb se nombra sin explicar cómo funciona (solo lo explica una fuente); la fuerza del filtro con luz suave es «de 3 a 6 pasos» porque dos fuentes dan 3 y 5-6; el tele empieza «en unos 70 u 85 mm» porque las fuentes dan una cifra u otra; en «Modos de enfoque» no se dice que la zona amplia sea «un buen punto de partida» (ninguna fuente lo dice). La perspectiva «depende de dónde te pones» la sostienen cuatro fuentes; dos atribuyen la compresión a la focal, y la lección sigue a las cuatro.
- Dejado fuera por tener una sola fuente: que en AF-A convenga empezar por el continuo, que al fijar y recomponer con aperturas muy abiertas se desplaza el plano de enfoque, la regla de 1/focal, la larga exposición con el móvil, que el RAW del móvil no tiene modo noche, los filtros ND con tinte o degradados y el polarizador.

## Más tipos, primera parte (cuarta tanda de la hoja de ruta, 2026-11-24)
- Cuatro lecciones nuevas al final del grupo «Tipos de fotografía» («Types of photography»), todas «Para todos» y de 3 min: «Fotografía macro» (`macro`), «Astrofotografía» (`astro`), «Fauna y aves» (`fauna`) y «Fotografía de mascotas» (`mascotas`). Término nuevo del glosario: macro. La tanda se parte en dos entregas (esta y otra con viajes, comida, familia y niños) para que cada suite y cada comprobación de fuentes sea de tamaño razonable.
- Los cuatro dibujos usan los colores del tema, y su geometría queda toda dentro de su marco (la prueba `aprender.e2e.cjs` falla si algo se sale del ancho de la página).
- Decisiones mías, tras comprobar cada afirmación con las páginas (detalle en el documento de fuentes): la macro no da números de apertura (las fuentes dan de f/8 a f/22 y dos avisan de la difracción) ni dice que los filtros de aproximación y los tubos sean «más baratos» (solo lo dice una); la astrofotografía da «de 10 a 20 s» como orden de magnitud y no explica la regla de los 500 (las fuentes la dan distinta y una la da por anticuada); fauna y aves no habla de comederos ni de cebos (una fuente los recomienda y otra los condena) ni del ISO automático; mascotas no habla de la luz de ventana ni del modo retrato del móvil (una sola fuente).
- Dejado fuera por tener una sola fuente: ver el final de cada sección «Tipos de fotografía: Macro / Astrofotografía / Fauna y aves / Mascotas» del documento de fuentes.

## Más tipos, segunda parte (cuarta tanda de la hoja de ruta, 2026-11-24)
- Tres lecciones nuevas al final del grupo «Tipos de fotografía» («Types of photography»), todas «Para todos» y de 3 min: «Fotografía de viajes» (`viajes`), «Fotografía de comida» (`comida`) y «Familia y niños» (`familia`). No hay términos nuevos del glosario.
- Los tres dibujos usan los colores del tema y su geometría queda dentro del marco. `comida` usa tres marcos pequeños (como `focales`) y `familia` el marco único con tres filas (como `fauna`).
- Decisiones mías, tras comprobar cada afirmación con las páginas (detalle en el documento de fuentes): viajes no habla de comprar a quien fotografías, de drones, de texturas ni de «series de fotos» (una sola fuente o sin acuerdo), y dice «una persona da idea del tamaño» sin añadir lo que enseña de la vida del lugar; comida no recomienda pedir mesa junto a la ventana (una fuente lo dice y otra recomienda un rincón con luz pareja), no da cifras de apertura ni de tiempo, y limita lo de apagar el flash al móvil y a los restaurantes (otras fuentes admiten un flash difuminado); familia da «1/250 s o más» (dos fuentes; una tercera dice 1/200 s y una cuarta no da cifra), no habla de ráfaga ni de contraluz (una sola fuente), y no dice nada de pedir permiso a los padres ni de fondos sencillos (ninguna de las páginas leídas lo trata).
- Dejado fuera por tener una sola fuente: ver el final de cada sección «Tipos de fotografía: Viajes / Comida / Familia y niños» del documento de fuentes.
- Con esta entrega queda hecha la hoja de ruta de las tandas, salvo el simulador de exposición (una función, no una lección), que se diseña aparte.
- El simulador de exposición se hizo el 2026-11-26 como un tipo de bloque nuevo (`simulador`) dentro de una lección propia en «Lo básico»: ver «Séptima tanda» en [`../../diseno.md`](../../diseno.md). Con él, la hoja de ruta queda hecha.
