# Inglés: cómo se llaman las cosas

Los términos que se repiten en `data/en/` y en `src/idioma/en.js`, para que se llamen siempre igual. Es inglés de Estados Unidos en la ortografía («color», «gray»), y los términos son los que usa quien aprende fotografía, no una traducción palabra por palabra.

| Español | Inglés |
|---|---|
| hora dorada | golden hour |
| hora azul | blue hour |
| regla de los tercios | rule of thirds |
| apertura | aperture (se escribe «f/» y el número con punto: f/2.8) |
| velocidad de obturación («tiempo» en los dibujos y las recetas) | shutter speed («shutter» donde no cabe más) |
| ISO | ISO |
| paso de luz | stop of light («stop») |
| compensación de exposición | exposure compensation (EV) |
| trípode | tripod |
| balance de blancos | white balance |
| contraluz | backlight |
| siluetas | silhouettes |
| luz dura, luz suave | hard light, soft light |
| fuente de luz (pequeña, grande) | light source (small, large) |
| semáforo (verde, ámbar, rojo) | traffic light (green, amber, red) |
| parasol | lens hood |
| filtro UV | UV filter |
| enfoque continuo | continuous focus (AF-C, AI Servo) |
| líneas guía | leading lines |
| charco de luz (dibujo de la lección urbana) | pool of light |
| ráfaga | burst |
| histograma | histogram |
| verticales convergentes | converging verticals |
| punto de fuga | vanishing point |
| distancia focal | focal length (gran angular: wide angle; tele: telephoto) |
| filtro ND (densidad neutra) | ND (neutral density) filter |
| enfoque simple | single focus (AF-S, One Shot) |
| modos de medición (evaluativa, ponderada al centro, puntual, parcial) | metering modes (evaluative, center-weighted, spot, partial) |
| modos de enfoque | focus modes |
| factor de recorte | crop factor |
| encuadre | framing |
| gran angular | wide angle (ultra-wide para el 0,5x) |
| tele corto | short telephoto |
| disparador remoto | remote release |
| enfoque manual | manual focus |
| disparador automático / temporizador | timer («2-second timer») |
| bloqueo AE/AF | AE/AF Lock |
| zoom digital | digital zoom |
| plano (primer plano, plano medio, fondo) | layer (foreground, middle ground, background) |
| modo Av, Tv, M | Av, Tv (A and S on Nikon and Sony), M |
| «Hoy», «Aprender» | Today, Learn |
| «Amanecer», «Atardecer», «Noche» | Sunrise, Sunset, Night |
| «Con el móvil» (título de receta o de bloque) | With your phone |
| «Con el móvil» (respuesta del perfil) | A phone |

## Decisiones de estilo

- Se habla de tú a tú como en español: «you», frases cortas, sin jerga.
- Las comillas «…» pasan a “…”; los puntos suspensivos son «…».
- Los números llevan punto decimal (f/2.8, 0.5x); en español, coma (f/2,8, 0,5x). Las cifras con decimales que calcula la app (`num()` en `src/nucleo/explicacion.js`) también cambian según el idioma.
- Lo que está escrito con el nombre de otro texto (por ejemplo «Toca para enfocar y exponer» dentro de otra lección) se escribe con el título inglés de esa lección: “Tap to focus and expose”.
- Un texto de un dibujo tiene que caber en su sitio a 320 px: `test/e2e/compilada/dibujos.e2e.cjs` lo comprueba. Por eso hay etiquetas más cortas que su frase en español («soft background», «Tap the dark part»).
- Los enlaces al glosario `[[id|texto]]` conservan el `id` en español y cambian el texto visible: `[[apertura|aperture]]`.
- El nombre de la app («Ollada») y el manifest no se traducen.
