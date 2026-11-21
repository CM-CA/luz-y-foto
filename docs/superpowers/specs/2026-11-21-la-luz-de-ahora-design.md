# Diseño visual «La luz de ahora»

Estado: **aprobado** (2026-11-21, «Adelante»), con las dos decisiones abiertas resueltas como se proponían: el ámbar usa el cielo despejado y las tarjetas Lugar y Mi equipo pasan a la pastilla de la cabecera y a la tarjeta de la receta.
Propuesta que se aprobó con la imagen: [`docs/img/la-luz-de-ahora-propuesta.jpg`](../../img/la-luz-de-ahora-propuesta.jpg).

## Para qué

La app funciona bien pero se ve **fría** (fondos grises, bordes finos, todo igual de importante). Lo que se quiere:
un aspecto cálido, **simple y visualmente impecable**, donde lo primero que se vea al abrir sea el cielo de ese momento
y el **semáforo**, que es la respuesta a «¿merece la pena salir?». Quien lo usa es un fotógrafo principiante, casi siempre
desde el móvil, a menudo en la calle y con poca luz.

## Qué se aprobó (y qué no es mío)

Aprobado por la persona: la propuesta de la imagen (cabecera de cielo, pestañas superpuestas, días con semáforo, veredicto en
bloque, «La luz de hoy», brújula, tarjeta de receta; versión clara y oscura) **más cuatro extras**:

1. El cielo de la cabecera **reacciona a la previsión** (despejado / cubierto) y al momento (tarde / noche).
2. «La luz de hoy»: franja con la hora dorada, la puesta y la hora azul.
3. El medidor de puntos, **solo en Atardecer** (la Luna no puntúa).
4. La luna de la cabecera con **la fase real** de esa noche.

Ya decidido antes y que este diseño respeta: botones de día en una fila con su semáforo; niveles Principiante/Medio/Experto;
la receta solo se ve con el equipo configurado y dice para qué nivel está explicada.

El cielo se entrega como **imagen** (WebP), no como dibujo dentro de la página: se probó en el móvil de la persona
(`#/prueba-cielo`) y el navegador oscurece por su cuenta los dibujos incrustados pero no las imágenes. Eligió esa opción.

## Objetivos, no objetivos y lo que sería un fallo

**Objetivos**
- Cabecera con cielo, tipografía con personalidad y paleta cálida, en claro y oscuro.
- El semáforo manda: veredicto grande, con símbolo y palabras (nunca solo color).
- Que se vea igual de bien en el navegador de móvil que oscurece colores a la fuerza, con la letra ancha de Actions y a 320 px.
- Que siga funcionando sin conexión (fuentes e imágenes en la caché del service worker).

**No objetivos**
- No cambia la lógica ni los textos del semáforo, las recetas o los datos de `data/`.
- No se rediseñan Lugares, Glosario ni Ajustes (Fase 6): heredarán la paleta y las fuentes, nada más.
- Sin animaciones, sin parallax, sin sol que se mueva por la escena. El cielo es una imagen fija.

**Fallos aunque «funcione»**
- Que un dato importante dependa de un fondo, un borde, un degradado o un dibujo: en el móvil de la persona eso se aplasta.
- Que haya que rehacer las pruebas de comportamiento (ubicación, equipo, recetas): los `id` y `data-*` que usan se conservan.
- Que pese tanto que abrir sin conexión o con mala cobertura se note.

## Restricciones que vienen de lo ya probado

- **Marcas en texto**: ●▲■○ y ✓ son texto con el color del nivel; las barras se hacen con «█» (como las de las nubes). Un fondo, un borde
  o un degradado **no puede llevar información**. Por eso la franja de «La luz de hoy» y el medidor de puntos **no** son degradados CSS:
  son filas de bloques «█» de texto, cada uno de su color.
- **Ilustración solo en imagen**: cielos y fases de la luna son WebP. Nada de SVG incrustado para eso.
- **Tema propio**: se mantiene `color-scheme` y la paleta oscura propia (el navegador no tiene que oscurecer nada).
- Los iconos de pestaña y de lugar de la propuesta eran SVG: se sustituyen por glifos de texto o se quitan.

## Enfoques considerados

| | Qué es | Pros | Contras |
|---|---|---|---|
| **A. Cambiar los estilos en su sitio, pieza a pieza** (propuesto) | Un commit por pieza (paleta, cabecera, pestañas…), cada uno publicado en `/beta/` | Se ve el avance en el móvil tras cada paso; las pruebas de comportamiento no se tocan; fácil de revertir | La app queda unas horas mezclando estilo viejo y nuevo en `/beta/` (ya es una vista previa) |
| B. Dos temas a la vez | `?diseno=nuevo` para comparar antiguo y nuevo | Comparar lado a lado | Doble CSS que luego hay que borrar; no aporta, el antiguo ya está en la raíz |
| C. Reescribir la pantalla desde cero | Componentes nuevos | Código más limpio | Hay que reponer a mano cada comportamiento ya probado; riesgo alto de regresiones |

**Elegido: A.** (Lo elijo yo; si prefieres otro, dilo.)

## El diseño

### Paleta (valores de la propuesta; los contrastes están calculados, no estimados)

| | Claro | Oscuro |
|---|---|---|
| Fondo | `#f3eff4` | `#0f1626` |
| Tarjeta | `#ffffff` | `#18213a` |
| Texto | `#1f2740` | `#ecebf5` |
| Texto suave | `#59607f` | `#a8afcb` |
| Borde | `#d8d1df` | `#2c3658` |
| Verde / bloque | `#1b7a47` / `#ddf1e5` | `#78d9a3` / `#173a2b` |
| Ámbar / bloque / símbolo | `#8f5a00` / `#fbe9c0` / `#b06b00` | `#f5c867` / `#3a2f17` |
| Rojo / bloque | `#a9362f` / `#f8dcd8` | `#f7a199` / `#40201f` |
| Sol, oro, hora azul | `#ee7d2f`, `#f4b94f`, `#3f5fa8` | `#f08a3a`, `#f4b94f`, `#7f9be0` |

Contraste (WCAG): texto sobre fondo 13,0 (claro) y 15,3 (oscuro); texto suave sobre fondo 5,4 y 8,3; palabra del veredicto sobre su bloque
4,5 (verde), 4,8 (ámbar), 5,0 (rojo) en claro, y 7,3 a 8,3 en oscuro; texto sobre cada bloque, 11,4 a 12,5 en claro y 10,6 a 12,3 en oscuro.
El símbolo ámbar sobre el fondo claro da 3,7 (vale para un gráfico, mínimo 3) y siempre va con su palabra al lado.

### Tipografía
**Young Serif** (títulos, veredicto, «La luz de hoy», fase de la luna) y **Figtree** variable (todo lo demás), alojadas en el proyecto con
`@fontsource` (27 KB y 20 KB en WOFF2, solo el subconjunto latino, que cubre el español), `font-display: swap`, y guardadas en la caché del service worker.
Letra del cuerpo 17 px, interlineado 1,5; veredicto 37 px; líneas de menos de 80 caracteres. Sin mayúsculas en etiquetas.

### Estructura de la pantalla «Hoy»
```
┌──────────────────────────────┐
│  CIELO (imagen, 262 px)      │   Luz y foto            [ Vigo, Galicia ]
│  Previsión de las 17:05      │
│       islas · velero / luna  │
├─ ┌────────────────────────┐ ─┤   pestañas Atardecer | Luna, solapadas 27 px
│  │ ✓ Atardecer │   Luna   │  │   sobre el cielo
│  └────────────────────────┘  │
│  [✓ ● Hoy] [▲ Mañana] [■ Lun]│   tres días en una fila, cada uno con su semáforo
│  ┌──────────────────────────┐│
│  │ ● Prometedor             ││   veredicto en bloque tintado (palabra grande + símbolo)
│  │ 82 de 100 puntos ███░░░  ││   medidor de puntos: solo Atardecer
│  │ Buena combinación de …   ││
│  └──────────────────────────┘│
│  La luz de hoy               │   solo Atardecer
│  ████████████●▓▓▓▓▓▓▓▓       │   hora dorada → puesta → hora azul; ● = ahora
│  17:27   18:10   18:40       │
│  (brújula) Mira hacia el …   │
│  [ Receta para tu cámara ▾ ] │   con el resumen del equipo y «Editar»
└──────────────────────────────┘
```
En **Luna**: no hay medidor ni franja; en su lugar un bloque con la fase (imagen, nombre, % iluminada, creciente o menguante) y la salida
y puesta de la luna, como en la tercera pantalla de la propuesta. Las pestañas y los días son iguales.

### El cielo (extras 1 y 4)
Cuatro imágenes WebP de 780 × 524 (5 a 10 KB cada una; las tres de `src/pruebas/` ya existen, falta la de **noche cubierta**):
`tarde`, `tarde-cubierta`, `noche`, `noche-cubierta`. Se elige con una función pura y probada (`src/nucleo/cielo.js`):
- Pestaña **Atardecer** → tarde; pestaña **Luna** → noche. Manda la pestaña, no la hora del reloj.
- Nivel del día elegido: verde o ámbar o sin datos → despejado; **rojo → cubierto**.
- En las noches, la **luna de la cabecera** es una de 16 imágenes de fase (unos 2 KB cada una, orientación del hemisferio norte, sin inclinación por la latitud), elegida con la fase real de ese día (`fase` y `creciente` de `astro.js`).
El nombre de la imagen no lleva información que el texto no tenga: la cabecera lleva `alt=""` y el estado se dice en el veredicto.

### «La luz de hoy» (extra 2)
Solo en Atardecer. Título «La luz de hoy», «de mañana» o «del lunes» según el día elegido. Una fila de unos 48 bloques «█» interpolando
oro → naranja (puesta) → violeta → azul; sus extremos son el inicio de la hora dorada y el fin de la hora azul, y la puesta cae en su proporción real.
El «●» de ahora solo aparece si el día elegido es hoy y la hora está dentro de la franja. Debajo, las tres horas con su nombre. Los datos ya existen en el panel actual.

### Medidor de puntos (extra 3)
Misma técnica de «█» que las barras de nubes (texto con el color del nivel, recortado al ancho de la barra). Solo en Atardecer.

### Lugar y equipo (cambio visible, como en la propuesta)
Las dos tarjetas de arriba («Lugar» y «Mi equipo») desaparecen como tarjetas: el **lugar** pasa a ser la pastilla de la cabecera
(al pulsarla se abre el selector de siempre, justo debajo) y el **equipo** pasa a la tarjeta de la receta (su subtítulo es el resumen,
con «Editar»; sin equipo configurado sigue la invitación «Cuéntame tu equipo…»). Se conservan `#cambiar`, `#nombreLugar`, `#selector`,
`#editarEquipo`, `#resumenEquipo` y `[data-accion=equipo]`.

### Aviso de versión y de sin conexión, panel de instalación
Heredan la paleta. `theme-color` y `background_color` pasan a los colores de fondo nuevos, y los iconos se regeneran con la paleta
(el mismo sol sobre el horizonte, en `#1f2740` y `#ee7d2f`) con `scripts/generar-iconos.mjs`.

## Cómo se construye (cada paso, un commit, publicado en `/beta/`)

1. Fuentes y paleta (variables CSS) en claro y oscuro. Sin cambiar la estructura.
2. Cabecera con cielo, título, pastilla de lugar y «Previsión de las…». `cielo.js` con pruebas.
3. Pestañas solapadas y días.
4. Veredicto en bloque y medidor de puntos.
5. «La luz de hoy» y brújula.
6. Luna: bloque de fase, 16 imágenes de fase y luna de la cabecera.
7. Lugar y equipo (la reestructura de arriba) y la invitación.
8. Limpieza: borrar `#/prueba-cielo` y `src/pruebas/`, iconos y `theme-color`, repaso en móvil y tablet.

Pruebas: `maquetacion` y `seleccion` se actualizan a propósito (misma comprobación de «nada se sale» a 320–800 px, claro y oscuro, letra normal y ancha);
nuevas para `cielo.js`, la elección de fase de luna y las posiciones y colores de la franja; las de comportamiento se mantienen. Peso añadido:
unos 125 KB (fuentes 47, cielos ≈ 30, lunas ≈ 32, el resto es CSS), todo en la caché sin conexión.

## Lo que queda a criterio de quien construye
Radios, sombras y espaciados exactos (los de la propuesta son el punto de partida); el pulido de los glifos de texto que sustituyen a los iconos;
cuántos bloques «█» caben en 320 px; la imagen de la noche cubierta, que se dibuja con el mismo estilo que las otras tres.

## Dos cosas que decide la persona
1. **Cielo del ámbar.** Propuesta: ámbar usa el cielo despejado (solo el rojo es «cubierto»), porque el matiz ya lo da el bloque ámbar y el símbolo.
   Alternativa: dibujar un cielo intermedio con nubes sueltas para el ámbar (dos imágenes más).
2. **Las tarjetas Lugar y Mi equipo desaparecen** (pasan a la pastilla y a la receta). Es lo que enseña la propuesta; confirma que lo quieres así.
