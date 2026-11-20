# Decisiones de diseño

## Público
Principiantes y aficionados sin mucha experiencia.

## Principios
- Solo frontend (PWA), publicada con GitHub Pages (HTTPS necesario para GPS y service worker).
- Un solo usuario; sin comunidad ni subir fotos en esta versión.
- Primero la acción, luego el término técnico. Glosario tocable.
- Textos, reglas y recetas en archivos de datos (`data/`), separados del código, para añadir géneros sin tocar código.
- Honestidad: no prometer lo que el equipo o la previsión no pueden dar.

## Primer arranque
1. Bienvenida (con "Importar copia" si no hay datos).
2. Perfil corto, una pregunta por pantalla, con "Saltar" y editable siempre:
   - Móvil o cámara
   - Si cámara: marca (Canon, Nikon, Sony, No lo sé) y objetivos
   - Trípode: sí / a veces / no
   - Experiencia: Empiezo / Me defiendo / Controlo bastante
   - Lugar: GPS o a mano
3. Tutorial de 4 pantallas sobre la rueda de modos (Auto, P, Av/Tv, M), con "Saltar" y repetible desde Ajustes. Para móvil, tutorial distinto (tocar para exponer, brillo, modo noche).

## Uso diario
- **Hoy** (principal): lugar activo, semáforo GRANDE con veredicto y porqué, cuándo salir, brújula (flecha y palabra), botón "Ver receta", tira de 3 días.
  - Pestañas por género: Atardecer y Luna (siempre visibles). Cada pestaña lleva su semáforo.
  - Pestaña por defecto según la hora: hasta 30 min después de la puesta, Atardecer; después, Luna. Si el usuario toca otra pestaña, se respeta.
- **Receta**: pasos en orden (modo, apertura, compensación, ISO, enfoque, truco), términos tocables, aviso RAW/JPEG y aviso de seguridad.
- **Lugares**: GPS y guardados, con ajuste en minutos de la puesta real (monte, edificios).
- **Glosario** y **Ajustes** (editar perfil, repetir tutorial, exportar/importar copia, instalar en pantalla de inicio).
- Barra inferior: Hoy, Lugares, Glosario, Ajustes.

## Estados a diseñar
Sin conexión (última previsión con su hora), sin GPS (elegir a mano), cargando (esqueleto), primera vez sin previsión.

## Riesgos y respuestas
- Pérdida de datos: `navigator.storage.persist()`, exportar/importar JSON, recordatorio de copia, instalar la app.
- Vocabulario: chips tocables, glosario, nivel del perfil.
- Sin cobertura: service worker, previsión guardada, astronomía offline.
- Demasiado a la vez: versión 1 acotada.

## Versiones
- **v1**: perfil, tutorial, Hoy (Atardecer y Luna), receta, lugares, glosario, exportar/importar.
- **v2**: urbana, alineaciones sol/luna con lugares, segundo punto meteorológico hacia la puesta.
- **v3**: flores e insectos, diario local, "Mi foto salió...", calendario .ics, eventos astronómicos.

## Hecho en las páginas de prueba
Fuentes de datos (SunCalc en el dispositivo, Open-Meteo, ubicación del navegador con nombre de ciudad) y estructura de `data/` (ver [`datos.md`](datos.md)).

## Pendiente
Hecho: perfil de equipo y recetas (`data/perfil.json`, `data/recetas/`).

Pendiente: tutorial de la rueda de modos, exportar/importar copia, glosario como página, lugares guardados, caché sin conexión (service worker), diseño visual definitivo (daltonismo, modo oscuro).
