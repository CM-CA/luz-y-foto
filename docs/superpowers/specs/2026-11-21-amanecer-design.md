# Amanecer y la pestaña Noche: diseño

Propuesto el 2026-11-21 en conversación con la persona, que aceptó las decisiones de abajo. Este documento espera su visto bueno antes de escribir el plan y tocar código.

## Intención
La app pasa a enseñar fotografía con el caso real del día (frente a PhotoPills, que es una caja de herramientas de pago para quien ya sabe: aquí es gratis, en castellano y explica por qué). El orden acordado es: **1) Amanecer**, 2) la capa de enseñanza (receta que enseña con el caso de hoy y enlaza a lecciones completas: cuándo usar el modo manual y cuándo Av/Tv, parasol, filtro UV; más adelante enfoque, técnicas y reglas de composición) y 3) el Glosario y el resto de la fase 6. Amanecer va primero porque es pequeño y aporta un tercer caso real: la luz cambia deprisa y rara vez hay tiempo, el mejor ejemplo de por qué Av/Tv con compensación suele ganar al manual.

## Objetivos
- Tres pestañas, en el orden del día: **Amanecer, Atardecer, Noche**.
- Amanecer con su semáforo, su brújula hacia la salida del sol, su receta, sus tres días y su cielo.
- La niebla se trata como una ventaja, siempre en forma de aviso.
- La pestaña que se abre sola depende de la hora.

## No objetivos
- La franja «La luz de hoy» del amanecer (es del atardecer; su espejo queda para después).
- Lecciones, manuales y glosario nuevos (es el paso 2).
- Estrellas o Vía Láctea en la pestaña Noche.
- Un cielo propio para la niebla.
- Cambiar las reglas del atardecer o de la luna.

## Antiobjetivos (sería un fracaso aunque «funcione»)
- Semáforo rojo por niebla con un aviso que dice «puede dar buenas fotos».
- Que el Atardecer o la Noche se comporten distinto de como lo hacen hoy.
- Un cielo de amanecer que quite legibilidad al texto blanco de la cabecera.
- Prometer niebla: la previsión no la acierta bien.

## Enfoques considerados
1. **(Elegido) Sobre el motor existente.** `puntos-ventana` ya admite `evento: amanecer` (`src/nucleo/datos.js`), y la hora y la dirección del amanecer ya se calculan. Casi todo es datos y unos pocos cambios de código.
2. Motor propio de amanecer: más control, pero duplica el motor y su validación sin ganar nada.
3. Amanecer como selector dentro de Atardecer: menos visible y rompe la idea de una pestaña por tipo de foto.

## Diseño
- **Pestañas.** `data/generos.json`: `orden` pasa a `["amanecer", "atardecer", "luna"]`. `data/generos/luna.json`: `nombre` pasa a «Noche». El identificador interno sigue siendo `luna` (datos, pruebas y claves no cambian).
- **Género nuevo.** `data/generos/amanecer.json`: copia del atardecer con `evento: amanecer`, ventana de 30 min antes a 60 min después de la salida del sol, y los textos de amanecer. `data/recetas/amanecer.json`: receta propia con la misma estructura (variantes de móvil y cámara, tres niveles de texto), que la persona revisa. Las puntuaciones parten de las del atardecer.
- **Pestaña por defecto.** Tres franjas, con los minutos en `data/generos.json`: Amanecer desde 120 min antes de la salida del sol hasta 60 min después; Atardecer el resto del día hasta 30 min después de la puesta; Noche desde ahí hasta 120 min antes de la salida siguiente. Si no queda franja de noche (latitudes con noches cortas), gana la pestaña de día. Cambia `pestanaPorDefecto` en `src/nucleo/dias.js`. Si la persona ya eligió pestaña, se respeta.
- **Días.** `listaDe` ya descarta los eventos pasados: por la tarde Amanecer enseña el de mañana («Mañana», «Pasado»…).
- **Brújula.** Apunta a la salida del sol (`azAmanecer`, ya calculado); el plan comprueba que el componente lee el evento del género y no solo la puesta.
- **Niebla como ventaja.** Opción de datos del género (`nieblaVentaja`). Con visibilidad por debajo de `comun.nieblaKm` (5 km), el factor «Nubes bajas» da sus puntos máximos, su veto no se aplica y su frase y `avisoNiebla` cuentan las dos caras («no verás el sol, pero la bruma puede dar buenas fotos»). La lluvia y la tormenta siguen igual, incluidos sus vetos. Cambia `puntuarVentana` en `src/nucleo/semaforo.js`.
- **Cielos.** `elegirCielo` pasa a mirar el evento del género (amanecer, puesta o noche) y `CIELOS` suma «amanecer» y «amanecer cubierto». Dibujos en `scripts/escenas-cielo.mjs`, convertidos con `generar-cielos.mjs`. Maqueta enseñada a la persona el 2026-11-21: más fría que la tarde, con el azul oscuro arriba para que el texto blanco se lea. Sin previsión sigue decidiendo la hora del dispositivo, como hoy. Peso: fuentes e imágenes suman hoy 115 216 bytes de 160 000; las dos imágenes nuevas, unos 12 000.
- **Datos.** `npm run validar` exige que el género nuevo tenga receta y textos; `docs/datos.md` pasa el ejemplo de amanecer a «hecho».
- **Pruebas.** Unitarias: el semáforo del amanecer (ventana y veredicto), la niebla (la ventaja y que la lluvia fuerte siga vetando), los bordes de las tres franjas, `elegirCielo`. De navegador: `amanecer.e2e.cjs` nuevo (orden y nombres de las pestañas, la pestaña por defecto a 06:30, 12:00 y 21:00 con reloj falso, «Mañana» por la tarde, la brújula, los dos cielos, la niebla con su aviso); se actualizan los siete e2e que mencionan «Luna» y el de peso (`pwa.e2e.cjs`).
- **Documentación.** `datos.md`, `diseno.md`, `README.md` y `migracion-svelte.md`.
- **Proceso.** Rama `amanecer`, PR con integración continua en verde y, solo si la persona lo ordena, fusión (que publica).

## Decisiones que tomé yo (la persona puede cambiarlas)
- El nombre «Noche» en lugar de «Anochecer»: la pestaña cubre toda la noche y deja sitio para las estrellas.
- Las franjas de 120 y 60 min y la ventana de 30 antes y 60 después.
- Niebla: no resta puntos de nubes bajas y va con aviso (la persona pidió «ventaja, como aviso»; que no reste es mi forma de hacerlo coherente con el semáforo).
- Amanecer sin la franja «La luz de hoy» por ahora.

## Lo que queda al implementador
Los textos exactos de la receta y del aviso de niebla (la persona los revisa), los nombres de los dos cielos, y calibrar las puntuaciones con un diario de salidas más adelante.
