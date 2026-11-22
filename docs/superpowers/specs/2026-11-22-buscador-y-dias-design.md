# Buscador en una línea, sugerencias al escribir y número del día (diseño)

Aprobado el 2026-11-22 en la conversación. Carlos (una persona que probó la app) mandó sus impresiones por WhatsApp; la persona me las enseñó, di mi opinión de cada una y contestó «Realiza esos cambios». Se hacen tres: el buscador, las sugerencias y los números del día. La de los títulos queda aparcada hasta que Carlos diga cuáles le chirrían.

## Intención
Que cambiar de lugar sea rápido en el móvil: menos filas, un icono claro para la ubicación y ciudades que aparecen mientras se escribe. Y que los botones de día digan a qué fecha corresponden.

## Objetivos
- **Buscador en una línea** en el móvil: campo de texto, icono de ubicación y lupa, a 320 px de ancho incluido. Los botones llevan nombre accesible («Usar mi ubicación», «Buscar») y miden al menos 44 × 44 px.
- **Sugerencias al escribir**: desde 3 letras, 0,4 s después de la última tecla, la lista de lugares de siempre se rellena sola. Elegir una sugerencia funciona igual que elegir un resultado. Intro y la lupa siguen buscando al momento.
- **Número del día** en cada botón de día («Hoy 22», «Mañana 23», «Sábado 24»), junto al símbolo del semáforo, que se queda.

## No objetivos
Los títulos (Carlos aún no ha dicho cuáles; mayúsculas o etiquetas pequeñas se probarán después). Un `<select>` o `<datalist>` nativo. Un combobox ARIA completo con flechas de teclado. Cambiar el proveedor de búsqueda. Traducciones (van en la rama `idiomas`).

## Antiobjetivos
- Que una sugerencia tardía pise el resultado de una búsqueda explícita, o reabra la lista después de elegir un lugar o cerrar el selector.
- Un aviso de error mientras se escribe (sin conexión, o el servicio falla): las sugerencias fallan en silencio; la búsqueda explícita sigue avisando como hoy.
- Disparar una petición por tecla: sin espera ni cancelación se pasaría de los límites gratuitos del servicio.
- Perder el semáforo de cada día: el símbolo (● ▲ ■ ○) se queda, porque la forma ayuda a quien no distingue colores.

## Restricciones
- Sin dependencias de ejecución nuevas. Los ids `#gps`, `#ciudad`, `#buscar`, `#resultados`, `#msgLugar` y `#dias` no cambian, y el español de la app tampoco, salvo el mensaje inicial del selector.
- 320 px de ancho, modo claro y oscuro, sin conexión (las sugerencias son lo único que necesita red, como la búsqueda de hoy).
- El servicio de búsqueda es el de Open-Meteo (gratis: menos de 600 llamadas por minuto y 10 000 al día). El texto parcial que se escribe viaja a ese servicio, igual que hoy el texto completo; se anota en la documentación.

## Formas de hacerlo
Una sola para cada cambio, por pequeño:
- **Buscador**: el formulario pasa a contener el botón de ubicación (hoy fuera de él). Dos botones de icono SVG, sin texto visible.
- **Sugerencias**: un módulo puro y probable con reloj falso (`crearSugeridor`) que espera, cancela la petición anterior y descarta lo que llega tarde; el estado (`hoy.svelte.js`) lo conecta con la lista que ya existe. Una pieza aparte con tres letras de mínimo y 400 ms evita que la lógica quede enterrada en el componente.
- **Número del día**: se saca de la fecha del propio día de la lista (`x.fecha`), sin tocar los datos.

## Decisiones mías (la persona puede cambiarlas)
- Mínimo de 3 letras y espera de 400 ms.
- Al abrir el selector se lee «Escribe tu ciudad o usa tu ubicación.», porque un icono solo es menos claro para un principiante.
- Icono de ubicación = una mira (círculo con cuatro marcas); búsqueda = lupa. El de ubicación conserva el estilo de botón principal.
- El número va a la derecha del símbolo, en la fila de arriba del botón, y es solo visual: el nombre del día ya lo lee el lector de pantalla.
- Si no hay sugerencias, no se dice nada mientras se escribe; el aviso «No he encontrado ese lugar» queda para la búsqueda explícita.
