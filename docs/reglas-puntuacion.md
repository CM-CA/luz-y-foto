# Reglas de puntuación: por qué son así

**Los valores actuales (umbrales, puntos y textos) están en [`data/`](../data/)** y se explican en [`datos.md`](datos.md). Este documento recoge el razonamiento, no los números, para que no haya dos sitios que mantener. La pantalla Hoy tiene un apartado «Cómo se calcula» generado desde los mismos datos.

Código: [`src/nucleo/semaforo.js`](../src/nucleo/semaforo.js) (los motores) y [`src/nucleo/astro.js`](../src/nucleo/astro.js) (sol y luna).

Datos de Open-Meteo por hora: nubes bajas, medias, altas y totales; lluvia en mm/h, probabilidad de lluvia, código de tiempo y visibilidad. Sol y luna se calculan en el dispositivo (SunCalc).

## Qué se mira

- **Atardecer**: las horas de alrededor de la puesta (1 h antes a 30 min después). Se suman puntos de las nubes bajas (el sol tiene que verse), las nubes medias y altas (son las que se tiñen) y la lluvia.
- **Luna**: las horas de la noche con la luna alta y el sol bajo el horizonte. Se valora la hora con menos nubes, porque un fotógrafo puede esperar un hueco. La fase no baja la nota; cambia el consejo (llena = plana; cuartos = relieve).

## Decisiones tomadas y por qué

Una llamada real a Open-Meteo para Vigo (18-nov-2026) mostró que las reglas iniciales daban rojo casi siempre:

- La **probabilidad de lluvia** superaba el 50 % casi todos los días del otoño, así que dejó de ser un veto. Ahora se usa la **cantidad** (mm/h) y el código de tiempo.
- Las **nubes bajas** rondaban el 70 % con frecuencia (Open-Meteo las calcula incluyendo la niebla): el veto se subió a un valor más alto.
- La **visibilidad** casi siempre superaba los 15 km: ya no reparte puntos, solo avisa de niebla.
- **Llovizna y tormenta eléctrica**: con ellas sí se puede salir; con lluvia fuerte, no. La tormenta nunca es verde y lleva un aviso de seguridad (cubierto, lejos de zonas altas, sin trípode metálico a la intemperie).
- Una noche **sin luna alta** o con luna casi nueva no tiene semáforo: se explica por qué en vez de dar una nota que no significa nada.

## Límites conocidos

- La previsión no ve el horizonte: nunca decir «seguro».
- Los umbrales son un punto de partida: calibrar con un diario de salidas.
- Mejora v2: consultar un segundo punto a 30-50 km en dirección a la puesta.
