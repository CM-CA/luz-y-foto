# Reglas de puntuación (versión de prueba, a calibrar)

Código: [`js/semaforo.js`](../js/semaforo.js). Página para verlas en acción: [`prueba/hoy.html`](../prueba/hoy.html).

Datos de Open-Meteo por hora: nubes bajas, medias, altas y totales; lluvia en mm/h, probabilidad de lluvia, código de tiempo y visibilidad. Sol y luna se calculan en el dispositivo (SunCalc).

## Cambios respecto a la primera versión (18-nov-2026)

Una llamada real a Open-Meteo para Vigo mostró que las reglas iniciales daban rojo casi siempre:

- La **probabilidad de lluvia** supera el 50 % casi todos los días en otoño, así que dejó de ser un veto. Ahora se usa la **cantidad** (mm/h) y el código de tiempo.
- Las **nubes bajas** rondan el 70 % con frecuencia (incluyen niebla): el veto sube del 60 % al 88 %.
- La **visibilidad** casi siempre supera los 15 km: ya no reparte puntos, solo avisa de niebla.
- Con **llovizna o tormenta eléctrica** sí se puede salir; con lluvia fuerte, no.

## Lluvia (común a las dos pestañas)

| Situación | Cantidad | Efecto |
|---|---|---|
| Sin lluvia | hasta 0,1 mm/h | no resta |
| Llovizna | hasta 0,5 mm/h | casi no resta; aviso de proteger la cámara |
| Lluvia moderada | hasta 2,5 mm/h | resta; el semáforo queda en ámbar como mucho |
| Lluvia fuerte | más de 2,5 mm/h | veto: rojo |
| Tormenta eléctrica | código de tiempo 95 o más | nunca verde (ámbar) y con aviso de seguridad |

Aviso de tormenta: fotografiar desde un sitio cubierto, lejos de zonas altas y sin trípode metálico a la intemperie.

## Atardecer

Se miran las horas desde 1 h antes hasta 30 min después de la puesta y se suman hasta 100 puntos.

| Factor | Rango | Puntos |
|---|---|---|
| Nubes bajas (media) | < 20 % | 40 |
| | 20-40 % | 28 |
| | 40-60 % | 18 |
| | 60-75 % | 10 |
| | > 75 % | 4 |
| Nubes medias y altas (la mayor de las dos) | 20-70 % | 50 |
| | 10-20 % o 70-85 % | 25 |
| | < 10 % o > 85 % | 5 |
| Lluvia (máximo de la ventana) | sin lluvia | 10 |
| | llovizna | 7 |
| | moderada | 2 |
| | fuerte | 0 |

Semáforo: 70-100 verde («Prometedor»); 40-69 ámbar («Posible, pero incierto»); 0-39 rojo («Poco probable»).

Vetos (rojo directo): lluvia fuerte; nubes bajas por encima del 88 %.

Niebla (visibilidad menor de 5 km): aviso «Atardecer: no. Niebla en la ría: puede merecer la pena».

## Luna

Se buscan las horas de la noche (de la puesta al amanecer siguiente) en las que la luna está a más de 10° sobre el horizonte y el sol ya está bajo el horizonte. Si no hay ninguna, o la luna está casi nueva (menos de un 3 % iluminada), no hay semáforo y se explica por qué.

La nota la da la **mejor hora** (la de menos nubes totales, sin contar las de lluvia fuerte):

- menos de 30 %: verde («Se verá bien»)
- de 30 a 60 %: ámbar («Posible entre nubes»)
- más de 60 %: rojo («Poco probable»)

La lluvia moderada limita a ámbar. La fase no baja la nota; cambia el consejo (llena = plana; cuartos = relieve). Si la noche ya está en curso, solo cuentan las horas que quedan.

## Límites conocidos

- La previsión no ve el horizonte: nunca decir «seguro».
- Open-Meteo calcula las nubes bajas incluyendo la niebla.
- Los umbrales son un punto de partida: calibrar con un diario de salidas.
- Mejora v2: consultar un segundo punto a 30-50 km en dirección a la puesta.
