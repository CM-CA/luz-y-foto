# Aprender para el móvil (diseño)

Aprobado el 2026-11-22 en la conversación («me encajan estas tres y me gusta la idea que las lecciones para móvil vayan aparte»). Continúa [`2026-11-22-aprender-design.md`](2026-11-22-aprender-design.md): mismo formato de lecciones, mismas reglas. Antes, la persona pidió que las lecciones valgan para cualquier cámara, sin atarlas a su equipo.

## Intención
Que quien hace fotos con el móvil entienda lo poco que importa de verdad en un móvil (dónde tocar, cuánta luz, qué lente) con la misma idea que las lecciones de cámara: primero la acción, luego el término, y qué cuesta cada decisión.

## Objetivos
- Tres lecciones nuevas, para móvil, de 2 o 3 minutos con un dibujo cada una:
  1. **Toca para enfocar y exponer**: tocar el sujeto fija enfoque y luz; el deslizador del brillo; bloquear la exposición (un atardecer o amanecer con el cielo sin quemar).
  2. **Luz baja y modo noche**: qué hace el modo noche, por qué pide quedarse quieto unos segundos, cómo apoyar el móvil; la luna (tocar sobre ella y bajar el brillo).
  3. **Zoom y lentes: cuál usar**: los botones 0,5x, 1x, 2x y 3x frente a pellizcar con los dedos (zoom digital), y lo que cuesta.
- Un grupo propio en Aprender, **«Para el móvil»**, aparte de «Lo básico» (que pasa a decir que es para cámara).
- Las recetas de móvil enlazan a su lección con «Aprende por qué estos ajustes», como las de cámara.

## No objetivos
Modo Pro del móvil (ISO y tiempo a mano), RAW en el móvil, fotografía de retrato, edición, apps de terceros; filtrar la lista de Aprender según el equipo del perfil (se ven todas, cada una con su etiqueta «Para cámara» o «Para móvil»); ajustar la pantalla Aprender.

## Antiobjetivos
- Decir como si valiera para todos los móviles algo que cambia entre iPhone y Android, o entre modelos: cuando cambie, el texto lo dice («según tu móvil»).
- Prometer tiempos, calidades o resultados concretos de un modelo.
- Un muro de texto: 450 palabras como máximo por lección.

## Restricciones
Las de [`2026-11-22-aprender-design.md`](2026-11-22-aprender-design.md): textos en `data/`, términos del glosario tocables, dibujos como imágenes WebP con texto alternativo (claro y oscuro), 320 px, sin conexión, todo lo que dice un dibujo lo dice también el texto. Las afirmaciones técnicas se comprueban con al menos dos fuentes y se anotan en [`2026-11-22-aprender-fuentes.md`](2026-11-22-aprender-fuentes.md).

## Formas de hacerlo
Una sola: son datos, igual que las tres primeras (un archivo por lección y un grupo nuevo en `lecciones.json`); no hace falta código nuevo salvo los dibujos y el enlace de las recetas de móvil. El peso de seis imágenes más supera el límite actual de 260 000 bytes: primero se intenta bajar el tamaño de los dibujos; si no basta, se sube el límite con una razón anotada.
