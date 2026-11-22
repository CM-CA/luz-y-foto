# Decisiones de diseño

## Público
Principiantes y aficionados sin mucha experiencia.

## Principios
- Solo frontend (PWA), publicada con GitHub Pages (HTTPS necesario para GPS y service worker).
- Un solo usuario; sin comunidad ni subir fotos en esta versión.
- Primero la acción, luego el término técnico. Glosario tocable.
- Textos, reglas y recetas en archivos de datos (`data/`), separados del código, para añadir géneros sin tocar código.
- Honestidad: no prometer lo que el equipo o la previsión no pueden dar.

## Diseño visual: «La luz de ahora» (hecho el 2026-11-21)
Propuesta y decisiones en [`superpowers/specs/2026-11-21-la-luz-de-ahora-design.md`](superpowers/specs/2026-11-21-la-luz-de-ahora-design.md); el plan con lo que se hizo en cada paso, en [`superpowers/plans/2026-11-21-la-luz-de-ahora.md`](superpowers/plans/2026-11-21-la-luz-de-ahora.md). Idea: la cabecera es un cielo que cambia con el momento y con la previsión; debajo todo queda tranquilo y el semáforo es lo que más se ve.

- **Cielo** (cabecera de 262 px): seis imágenes WebP (amanecer, amanecer cubierto, tarde, tarde cubierta, noche, noche cubierta). Manda la pestaña: un género de «puntos en una ventana» tiene cielo de amanecer si su `evento` es `amanecer` y de tarde en cualquier otro caso; la luna, cielo de noche (sin previsión, manda la hora del dispositivo). Después manda el semáforo del día elegido (rojo = cubierto). En Noche lleva además la luna de esa noche con su **fase real** (16 imágenes; al revés en el hemisferio sur; apagada si la noche está cubierta). `src/nucleo/cielo.js` decide cuál; `scripts/generar-cielos.mjs` las dibuja.
- **Tipografía**: Young Serif solo para el nombre de la app y los títulos de pantalla (Aprender y cada lección); Figtree (variable) para todo lo demás, incluidos los títulos de sección (negrita) y el veredicto, que va en MAYÚSCULAS y negrita y baja de tamaño con el ancho para que «PROMETEDOR» quepa a 320 px (Carlos, 22-11-2026: la serif en los títulos de Hoy «chirriaba»; una sola familia en el contenido lo arregla). Las dos van dentro de la app (`src/fuentes/`, con su licencia) y en la caché del service worker.
- **Paleta** (claro / oscuro; los nombres están en `src/estilos.css`): fondo `#f3eff4` / `#0f1626`, tarjeta `#ffffff` / `#18213a`, texto `#1f2740` / `#ecebf5`; verde `#1b7a47` / `#78d9a3`, ámbar `#8f5a00` (símbolo `#b06b00`) / `#f5c867`, rojo `#a9362f` / `#f7a199`, gris `#59607f` / `#a8afcb`. Para la franja de luz: oro, sol, violeta y azul de la hora azul. Los pares de colores de texto y fondo cumplen 4,5:1 (lo comprueba `paleta.e2e.cjs`); los símbolos, 3:1.
- **Cuatro detalles**: el cielo reacciona a la previsión; «La luz de hoy» (franja de la hora dorada a la hora azul, con la puesta y un «●» donde estás ahora); el medidor de puntos, solo en Atardecer (la luna no puntúa); y la luna de la cabecera con su fase real.
- **Lugar y equipo sin tarjeta propia**: el lugar es una pastilla en la cabecera (abre el selector debajo: el campo de texto, la mira de ubicación y la lupa en una sola fila, también a 320 px, con botones de icono de al menos 44 px y nombre para los lectores de pantalla, y la lista de lugares debajo); el equipo vive en la receta (el resumen debajo del título y «Editar mi equipo» dentro) o, sin configurar, en una invitación con un único botón.
- **Restricción del modo oscuro forzado** (hay navegadores de móvil, como el que se probó en Android, que oscurecen las webs por su cuenta aplastando fondos, bordes, degradados y SVG en línea): **ninguna información depende de un fondo, un borde, un degradado o un dibujo en SVG**. Los símbolos del semáforo (●▲■○) y la ✓ son texto con el color del nivel; las barras (capas de nubes, medidor de puntos) y la franja de luz son bloques «█» de texto cuyo color es el del texto; el cielo y las fases de la luna son imágenes (no se oscurecen). Los fondos y los bordes son solo adorno. Además, `color-scheme: light dark` avisa al navegador de que la web ya tiene tema oscuro.
- **Peso**: fuentes e imágenes suman menos de 440 000 bytes (eran 160 000 antes de los dibujos de las lecciones; cada dibujo suma de 33 000 a 40 000 bytes entre sus dos versiones) y todas van en la caché del service worker (lo comprueba `pwa.e2e.cjs`).
- **Iconos y colores de la app**: fondo `#1f2740`, sol `#ee7d2f`, horizonte `#7f9be0`; `theme-color` y `background_color` del manifiesto, `#f3eff4` (claro) y `#0f1626` (oscuro).

## La brújula (Amanecer, Atardecer y Noche)
Un solo componente (`src/componentes/Brujula.svelte`) en las tres pestañas: una flecha, la dirección en palabras y grados («Mira hacia el sur (174°).») y, en Noche, la altura («47° sobre el horizonte, unos 5 puños con el brazo estirado»; 1 puño ≈ 10°) y a qué momento apunta: la luna **de ahora** si la noche elegida está en curso y la luna está en el cielo; si no, la de la **mejor hora** (con la hora escrita); si no, la del **anochecer**; si no, donde **sale**. En Atardecer apunta al azimut de la puesta del día elegido y en Amanecer al de la salida del sol («Al amanecer, mira hacia el sureste (118°).»). La lógica está en `src/nucleo/rumbo.js` (con SunCalc) y los textos en `data/generos/luna.json` (`brujula`). «Ahora» usa el reloj del dispositivo y se refresca cada minuto. Todo lo que dice el dibujo está también en el texto.

**La brújula del móvil** (botón «Usar la brújula del móvil», opcional; sin ella queda la flecha fija): el dial gira −rumbo y la flecha queda hacia arriba cuando el móvil mira al objetivo. Cómo se saca el rumbo (`rumboDe` en `src/nucleo/rumbo.js`, estado en `src/estado/orientacion.svelte.js`):
- **iPhone (Safari):** `DeviceOrientationEvent.requestPermission()` solo se puede llamar desde un toque (el botón); da `webkitCompassHeading` en `deviceorientation`.
- **Android (Chrome):** evento `deviceorientationabsolute` (`absolute: true`); el rumbo es hacia donde mira la **cámara trasera** compensando la inclinación (fórmula del W3C con `alpha`, `beta` y `gamma`). Los Chrome recientes también tienen `requestPermission`: si existe se pide; si se concede se escucha el mismo evento.
- **Por qué el móvil «de pie»:** el rumbo es el de la cámara trasera, que es como se apunta al cielo para encontrar la luna o el sol. Con el móvil plano sobre la mesa se usa el rumbo de la parte de arriba del móvil.
- **Sin lecturas:** un ordenador dispara un evento con todo a `null`: no cuenta. A los 2 s sin ninguna lectura válida: «Este dispositivo no da la brújula.» y se deja de escuchar.
- **Ahorro:** solo se escucha mientras hay una brújula encendida en pantalla (se apaga al esconder la página, al salir de Hoy, al cambiar de lugar y con el botón). Cambiar de día o de pestaña no la apaga; cambiar de lugar sí (se pide otra previsión y el panel desaparece mientras tanto). Un cambio de menos de 1° es ruido y no repinta.
- **Precisión:** los sensores de móvil se desvían 10–20° con imanes, fundas metálicas o sin calibrar; la pantalla lo avisa («gira el móvil en un ocho para calibrarla»). Por eso la brújula orienta, no mide.
- **Lo que hay que comprobar a mano** (no se puede en la nube: el sensor real es de cada móvil): en **Android**, que al pulsar el botón aparezca «Estás mirando al…» y la flecha gire al girar el móvil de pie, y que al esconder la pantalla y volver esté apagada; en **iPhone**, que el primer toque pida permiso, que al darlo funcione y que, si se niega, salga el mensaje y se pueda volver a intentar (en Ajustes → Safari → Movimiento y orientación); que el norte coincida con la brújula del sistema (con 10–20° de margen).

## Aprender (hecho el 2026-11-22)
Propuesta y decisiones en [`superpowers/specs/2026-11-22-aprender-design.md`](superpowers/specs/2026-11-22-aprender-design.md); el plan, en [`superpowers/plans/2026-11-22-aprender.md`](superpowers/plans/2026-11-22-aprender.md). Idea: la app no solo dice si hay luz, también enseña. Las lecciones son textos cortos (2 o 3 minutos, 450 palabras como máximo) con un dibujo, y tienen pantalla propia, fuera de Hoy.

- **Dónde vive**: en la barra inferior, «Hoy | Aprender» (`src/componentes/NavInferior.svelte`, en todas las pantallas; Aprender sigue activo dentro de una lección). Las direcciones son `#/aprender` (la lista, agrupada) y `#/aprender/<id>` (una lección); `src/nucleo/rutas.js` decide qué pantalla es cada una y una lección que no existe lo dice y ofrece volver. Al entrar en una lista o una lección, la ventana vuelve arriba y el foco va al título. `arrancar()` de Hoy solo actúa la primera vez, así que volver a Hoy no pide la previsión otra vez ni cambia la pestaña, el día o el lugar.
- **Las lecciones son datos** (`data/lecciones.json` y `data/lecciones/<id>.json`, ver [`datos.md`](datos.md)): una lista de bloques (subtítulo, párrafo, lista, idea clave, dibujo y «Pruébalo hoy») que `src/pantallas/Leccion.svelte` pinta sin saber de qué trata cada lección. Los textos admiten los términos tocables del glosario.
- **Las tres primeras, para cámara**: La rueda de modos, El manual de verdad (con un ejemplo de la luna creciente con Venus, sin atarlo a una cámara concreta) y Parasol y filtro UV. Las afirmaciones técnicas de El manual de verdad y de Parasol y filtro UV se comprobaron con al menos dos fuentes fiables; la lista está en [`superpowers/specs/2026-11-22-aprender-fuentes.md`](superpowers/specs/2026-11-22-aprender-fuentes.md), no en la app.
- **Las de móvil, aparte** (grupo «Para el móvil», decisión del 2026-11-22; propuesta y plan en [`superpowers/specs/2026-11-22-aprender-movil-design.md`](superpowers/specs/2026-11-22-aprender-movil-design.md) y [`superpowers/plans/2026-11-22-aprender-movil.md`](superpowers/plans/2026-11-22-aprender-movil.md)): Toca para enfocar y exponer, Luz baja y modo noche, y Zoom y lentes: cuál usar. Los móviles se parecen pero no son iguales, así que los textos dicen «según tu móvil» o «en muchos móviles» cuando la función cambia de un modelo a otro, y no dan números de ningún modelo concreto. Las fuentes de cada afirmación están en el mismo documento de fuentes, con lo que se dejó fuera por tener una sola (que las otras lentes son peores que la principal, y que conviene evitar el zoom con poca luz).
- **Tipos de fotografía** (grupo `tipos`, después de «Para el móvil»; decisión del 2026-11-22 a partir de una captura de la persona; propuesta y plan en [`superpowers/specs/2026-11-22-aprender-tipos-design.md`](superpowers/specs/2026-11-22-aprender-tipos-design.md) y [`superpowers/plans/2026-11-22-aprender-tipos.md`](superpowers/plans/2026-11-22-aprender-tipos.md)): Fotografía de paisaje y Fotografía deportiva. Son lecciones «Para todos» (cámara y móvil en la misma, con un apartado corto para el móvil), no repiten las de «Lo básico» y las citan por su nombre. Cada tipo nuevo es un archivo más en `data/lecciones/` y su id en la lista del grupo; las cifras se dan como ejemplo («f/11 o f/16», «1/500 s o más rápido»). Las fuentes, en el mismo documento de fuentes; lo que se dejó fuera por tener una sola (el modo «Deportes», el hiperfocal, el panorámico con tiempo lento) está anotado allí.
- **Los dibujos son imágenes WebP, no SVG en la página**, por lo mismo que los cielos: el navegador de algunos móviles oscurece por su cuenta los SVG incrustados pero no las imágenes. Cada dibujo tiene dos versiones, clara y oscura (`<picture>` con `prefers-color-scheme`), con el fondo de la tarjeta, y se dibujan en `scripts/dibujos-lecciones.mjs`; `node scripts/generar-dibujos.mjs` escribe las imágenes y `src/imagenes/dibujos.json` (lo que mide cada una en pantalla). La letra de la app se incrusta al generarlas. Todo lo que dice un dibujo también está en su texto alternativo y en su pie.
- **La receta enlaza a su lección**: cada variante de cámara lleva `leccion` y la receta muestra, tras los pasos, «Aprende por qué estos ajustes» con el título y los minutos de la lección (la luna en modo M lleva a El manual de verdad; las demás, a La rueda de modos). Las de móvil enlazan a las suyas: atardecer y amanecer, a «Toca para enfocar y exponer»; la luna, a «Luz baja y modo noche». Cada variante enlaza a una sola lección; «Zoom y lentes» se llega desde Aprender.

## Primer arranque
1. Bienvenida (con "Importar copia" si no hay datos).
2. Perfil corto, una pregunta por pantalla, con "Saltar" y editable siempre:
   - Móvil o cámara
   - Si cámara: marca (Canon, Nikon, Sony, No lo sé) y objetivos
   - Trípode: sí / a veces / no
   - Experiencia: Principiante / Medio / Experto (antes: Empiezo / Me defiendo / Controlo bastante)
   - Lugar: GPS o a mano
3. Tutorial de 4 pantallas sobre la rueda de modos (Auto, P, Av/Tv, M), con "Saltar" y repetible desde Ajustes. Para móvil, tutorial distinto (tocar para exponer, brillo, modo noche). La rueda de modos ya se enseña en la lección «La rueda de modos» de Aprender; este tutorial del primer arranque sigue pendiente.

## Uso diario
- **Hoy** (principal): lugar activo, semáforo GRANDE con veredicto y porqué, cuándo salir, brújula (flecha y palabra), botón "Ver receta", tira de 3 días (cada botón lleva el número del día del mes junto al símbolo del semáforo, que se queda: la forma ayuda a quien no distingue colores; una noche lleva el número de la tarde en que empieza).
  - **Sugerencias al escribir el lugar**: desde 3 letras y 0,4 s después de la última tecla, la lista de lugares se rellena sola (`src/nucleo/sugerencias.js`); cada tecla nueva cancela la petición anterior y se descarta lo que llega tarde, y Intro o la lupa buscan al momento. Si la sugerencia falla (sin conexión, servicio caído) no se avisa; la búsqueda con Intro o con la lupa sí. El texto escrito, aunque sea parcial, viaja al servicio de búsqueda de Open-Meteo (el mismo que ya recibe el texto completo al buscar); no se envía nada más.
  - Pestañas por género: **Amanecer – Atardecer – Noche** (siempre visibles, en una sola fila también a 320 px, con al menos 6 px de aire a cada lado de la palabra y 10 px entre la pastilla elegida y la palabra de al lado, también con una letra ancha de reserva). Cada pestaña lleva su semáforo. «Noche» es solo el nombre que se ve: el género sigue llamándose `luna` por dentro.
  - Pestaña por defecto según la hora, con tres franjas (los números están en `data/generos.json`): **Noche** desde 30 min después de la puesta hasta 120 min antes del amanecer; **Amanecer** desde 120 min antes hasta 60 min después de la salida del sol; el resto del día, **Atardecer**. Si el usuario toca otra pestaña, se respeta.
  - Amanecer: su semáforo, su brújula hacia la salida del sol, su receta, tres días y dos cielos. Por la tarde el primer día es «Mañana». **La niebla es una ventaja**: con poca visibilidad el factor de nubes bajas da sus puntos y su veto no se aplica, y la pantalla lo cuenta con un aviso; la lluvia y las tormentas siguen vetando.
- **Receta**: pasos en orden (modo, apertura, compensación, ISO, enfoque, truco), términos tocables, aviso RAW/JPEG y aviso de seguridad.
- **Lugares**: GPS y guardados, con ajuste en minutos de la puesta real (monte, edificios).
- **Glosario** y **Ajustes** (editar perfil, repetir tutorial, exportar/importar copia, instalar en pantalla de inicio).
- Barra inferior: **Hoy y Aprender** (hecho). Lugares, Glosario y Ajustes entrarán cuando existan sus pantallas.

## Estados a diseñar
Sin conexión (última previsión con su hora: hecho), sin GPS (elegir a mano), cargando (esqueleto), primera vez sin previsión.

## Riesgos y respuestas
- Pérdida de datos: `navigator.storage.persist()`, exportar/importar JSON, recordatorio de copia, instalar la app.
- Vocabulario: chips tocables, glosario, nivel del perfil.
- Sin cobertura: service worker, previsión guardada, astronomía offline.
- Demasiado a la vez: versión 1 acotada.

## Versiones
- **v1**: perfil, tutorial, Hoy (hoy con tres pestañas: Amanecer, Atardecer y Noche), receta, lugares, glosario, exportar/importar.
- **v2**: urbana, alineaciones sol/luna con lugares, segundo punto meteorológico hacia la puesta.
- **v3**: flores e insectos, diario local, "Mi foto salió...", calendario .ics, eventos astronómicos.

## Hecho en las páginas de prueba
Fuentes de datos (SunCalc en el dispositivo, Open-Meteo, ubicación del navegador con nombre de ciudad) y estructura de `data/` (ver [`datos.md`](datos.md)).

## Pendiente
Hecho: perfil de equipo y recetas (`data/perfil.json`, `data/recetas/`).

Hecho (2026-11-21, con el rediseño): lo de ser responsive que se anotó el 2026-11-20. Las pruebas de maquetación de la versión compilada recorren 320, 360 y 390 px, en claro y oscuro, con la letra del sistema y con una ancha; las tablas largas se reordenan en tarjetas y las barras llevan el color también como texto.

Hecho (fase 4 de la migración): manifiesto e iconos, service worker con la app en caché, aviso «hay una versión nueva» y última previsión guardada sin conexión (ver [`migracion-svelte.md`](migracion-svelte.md)).

Hecho: diseño visual definitivo «La luz de ahora» (ver arriba; falta probarlo en el móvil real y en la tablet).

Hecho (2026-11-22): la pantalla Aprender con tres lecciones para cámara, tres para móvil, aparte, en el grupo «Para el móvil», y dos de tipos de fotografía (paisaje y deportiva); el tutorial de la rueda de modos queda cubierto por la lección «La rueda de modos» (ver «Aprender»).

Pendiente de Aprender: más tipos de fotografía (urbana, retrato, macro… según se decida), una lección sobre distancias focales (que las de paisaje y deportiva enlazarán) y un simulador de exposición.

Pendiente: exportar/importar copia, glosario como página, lugares guardados, daltonismo (hoy el semáforo ya no depende solo del color: lleva símbolo y palabra, pero falta probarlo con un simulador).
