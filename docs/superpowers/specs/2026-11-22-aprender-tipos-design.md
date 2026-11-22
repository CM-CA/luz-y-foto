# Aprender: tipos de fotografía (diseño)

Aprobado el 2026-11-22 en la conversación: la persona mandó una captura de la lista de Aprender con un grupo nuevo, «Tipos de fotografía», y dos entradas, «Fotografía de Paisaje» y «Fotografía Deportiva», y dijo «podríamos seguir así». Continúa [`2026-11-22-aprender-design.md`](2026-11-22-aprender-design.md) y [`2026-11-22-aprender-movil-design.md`](2026-11-22-aprender-movil-design.md): mismo formato de lecciones, mismas reglas.

## Intención
Que quien ya conoce lo básico sepa qué cuidar según lo que fotografía. Cada lección de tipo reúne composición, ajustes y luz de ese tipo de foto, sin repetir las de «Lo básico» (las enlaza con el nombre de sus términos y de sus lecciones).

## Objetivos
- Un grupo nuevo, **«Tipos de fotografía»**, después de «Lo básico» y «Para el móvil».
- Dos lecciones de 3 minutos, **para todos** (cámara y móvil en la misma lección, con un apartado corto para el móvil), cada una con un dibujo:
  1. **Fotografía de paisaje**: tres planos, horizonte en un tercio, cuadrícula, apertura cerrada, trípode, ISO bajo, luz del principio y del final del día.
  2. **Fotografía deportiva**: tiempo rápido (1/500 s o más), apertura abierta y ISO a lo que haga falta, enfoque continuo, ráfaga, anticiparse, zoom; en el móvil, la ráfaga y el zoom por botones.
- Tres términos nuevos en el glosario: regla de los tercios, enfoque continuo y ráfaga.

## No objetivos
Más tipos (urbana, retrato, macro…): se añaden después, uno a uno, con la misma fórmula. La lección de distancias focales (la persona la aplazó hasta elegir tipo; se hará aparte y ambas lecciones la enlazarán). Enlazar estas lecciones desde las recetas de Hoy (cada variante enlaza a una sola lección). Filtrar la lista según el perfil.

## Antiobjetivos
- Dar un ajuste como si fuera una receta única: todo lo numérico dice «por ejemplo» o «o más rápido».
- Decir como si valiera para todos los móviles algo que cambia entre ellos («en muchos móviles», «en el iPhone»).
- Repetir las lecciones de «Lo básico»: se citan y no se explican de nuevo.
- Un muro de texto: 450 palabras como máximo por lección.

## Restricciones
Las de los diseños anteriores: textos en `data/`, términos del glosario tocables, dibujos como imágenes WebP con texto alternativo (claro y oscuro), 320 px, sin conexión, todo lo que dice un dibujo lo dice también el texto, y cada afirmación técnica con dos fuentes fiables (lista en [`2026-11-22-aprender-fuentes.md`](2026-11-22-aprender-fuentes.md)).

## Formas de hacerlo
Una sola: son datos, igual que las lecciones anteriores (un archivo por lección y un grupo nuevo en `lecciones.json`). Dos dibujos nuevos de unos 40 000 bytes cada par: el presupuesto de peso de `pwa.e2e.cjs` (340 000, con 335 812 en uso) sube a 440 000.

## Decisiones mías (la persona puede cambiarlas)
- El título del grupo y de las lecciones va con mayúscula solo al principio («Tipos de fotografía», «Fotografía de paisaje», «Fotografía deportiva»), como las demás; el subtítulo del grupo («tipos de fotos» en la captura) pasa a «Qué cuidar según lo que fotografíes.».
- La tercera entrada de la captura repetía «Toca para enfocar y exponer» y se tomó como un resto de la edición: de momento, dos lecciones.
- Las lecciones valen para cámara y móvil a la vez (`para: todos`, etiqueta «Para todos»).
