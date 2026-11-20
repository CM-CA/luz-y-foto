# Migración a Svelte + Vite (sigue siendo una PWA)

Rama de trabajo: `migracion-svelte`. La rama `master` sigue publicando la web actual hasta el traspaso (fase 5).

## Decisión y alcance

- **Svelte 5 + Vite**, en JavaScript, sin SvelteKit (no hay servidor ni hace falta). Enrutado sencillo por «hash» (`#/hoy`, `#/lugares`…), que funciona en GitHub Pages sin trucos.
- **Sigue siendo una PWA**: instalable y con caché sin conexión (`vite-plugin-pwa`).
- **No cambia**: la carpeta `data/` y su forma de editarse, la lógica de cálculo, los textos, el aspecto, las claves de `localStorage` (`luz-y-foto:lugar`, `luz-y-foto:perfil`) y el hecho de que no hay servidor.
- **Qué se gana**: pantallas como componentes en lugar de HTML construido con texto, estado compartido entre pantallas, pruebas en el repositorio y publicación automática.
- **Fuera de alcance hasta el traspaso**: funciones nuevas. Primero igualar lo que hay, después mejorar.

## Reglas de trabajo

1. `master` no se toca. Un fallo urgente de la web actual se corrige en `master` y se trae a la rama (`git merge master`).
2. **Paridad antes que mejoras.** Cada fase termina con todas las pruebas en verde y se puede parar ahí sin dejar nada a medias.
3. **Las pruebas de navegador no se modifican** durante la migración: si pasan sin tocarlas, la nueva pantalla se comporta igual.
4. Un commit por paso, con un mensaje que diga qué cambia.

## Organización final

```
luz-y-foto/
  data/              igual que ahora (se valida al compilar)
  src/
    nucleo/          lógica pura: astro, semaforo, datos, perfil, recetas
    proveedores/     previsión (Open-Meteo) y nombre del lugar (Nominatim, geocodificación),
                     cada uno en un solo módulo para poder cambiar de proveedor
    estado/          lugar, perfil, previsión y «ahora», compartidos entre pantallas
    componentes/     Semaforo, Receta, Asistente, Pestanas, TablaHoras…
    pantallas/       Hoy, Lugares, Glosario, Ajustes
  public/            manifiesto, iconos
  test/              pruebas de la lógica + e2e (navegador)
  docs/
```

Los datos de `data/` se **incluyen al compilar** (no se piden al abrir la página). Así encajan con la caché sin conexión, y un JSON mal editado hace fallar la compilación antes de publicar, no el móvil de un usuario.

## Fases

### Fase 0: red de seguridad
- Traer al repositorio (`test/e2e/`) las pruebas de navegador que hoy están fuera de él: ubicación, asistente de perfil y recetas.
- Guardar capturas de referencia de la pantalla actual a 320, 360 y 390 px (sirven también para el responsive).
- Etiquetar `master` como `v-vanilla-1`: punto de vuelta atrás.
- **Listo cuando**: las pruebas de navegador pasan contra la web actual y están en el repositorio.

### Fase 1: esqueleto y publicación
- Proyecto Vite + Svelte con `package.json` y versiones fijadas (`package-lock.json`).
- Comandos: `dev`, `build`, `test` y `validar` (datos).
- Flujo de GitHub Actions que instala, pasa las pruebas, valida los datos y compila.
- Decidir cómo ver la rama en el móvil antes de publicarla (ver «Pendiente de decidir»).
- **Listo cuando**: una pantalla mínima se compila y se ve a través de la ruta base de GitHub Pages.

### Fase 2: lógica a módulos modernos
- Pasar `astro`, `semaforo`, `datos`, `perfil`, `recetas` y `lugar` a `src/` con `import`/`export`; separar los proveedores externos.
- Las mismas pruebas, con las mismas comprobaciones (se ejecutan con Vitest, que viene con Vite).
- Prueba de paridad: se guardan los resultados de la lógica actual para muchas fechas y lugares, y la nueva debe dar exactamente lo mismo.
- **Listo cuando**: todas las pruebas de lógica pasan y la paridad es exacta.

### Fase 3: pantalla Hoy en componentes
- Componentes con los **mismos identificadores y atributos** que usa hoy el HTML (para que las pruebas de navegador pasen sin cambios) y el mismo CSS.
- Después, y solo después de comprobar la paridad, el **responsive** (tabla «Horas analizadas», colores en modo oscuro).
- **Listo cuando**: las pruebas de navegador pasan sin tocarlas y las capturas coinciden con las de referencia.

### Fase 4: PWA y uso sin conexión
- Manifiesto, iconos y service worker con caché de la aplicación y los datos.
- Estrategia de actualización explícita: aviso «hay una versión nueva» (evita el problema de la caché antigua que ya tuvimos).
- Comportamiento sin conexión: se muestra el último dato guardado y se avisa.
- **Listo cuando**: la app abre sin red tras la primera carga y se actualiza sola.

### Fase 5: traspaso a `master`
1. Traer lo último de `master` a la rama y repasar la lista de comprobación.
2. Etiquetar `master` como `v-vanilla-final`.
3. Unir `migracion-svelte` en `master` (conserva todo el historial).
4. En GitHub, Settings → Pages, cambiar el origen a **GitHub Actions** (lo haces tú una vez).
5. Comprobar la web publicada en el móvil.
6. **Vuelta atrás**: volver a la etiqueta `v-vanilla-final` y devolver el origen de Pages a «master». Son unos minutos.

### Fase 6: pantallas nuevas
Lugares, Glosario, Ajustes (editar equipo, copia de seguridad, enlace de donación) y tutorial de la rueda de modos.

## Riesgos y cómo cubrirlos

| Riesgo | Cómo se cubre |
|---|---|
| Romper lo que ya funciona | Rama aparte, `master` intacta, pruebas de navegador sin cambios y capturas de referencia |
| Perder las pruebas de navegador (hoy están fuera del repositorio) | Fase 0, antes de nada |
| La caché sin conexión sirve una versión vieja | Actualización explícita (fase 4) y una prueba que lo comprueba |
| Rutas rotas en GitHub Pages (la web vive en `/luz-y-foto/`) | Ruta base configurada y probada con la vista previa del propio Vite |
| Que se pierdan el perfil y el lugar de quien ya usa la app | No se cambian las claves de `localStorage`; el origen es el mismo |
| Dependencias que cambian o se rompen | `package-lock.json`, versiones fijas, actualizar por separado y no durante una fase |
| Datos mal editados | Validación al compilar: si falla, no se publica |
| Que el flujo de Actions no se pueda subir desde aquí (puede faltar permiso para escribir en `.github/workflows`) | Se detecta en la fase 1; si ocurre, se pega el archivo desde la web de GitHub |
| Cambiar de proveedor de previsión o de nombres de lugar (monetización, límites) | Cada uno en un solo módulo de `proveedores/` |
| Añadir funciones a mitad de camino | Regla: nada nuevo hasta la fase 5 |

## Pendiente de decidir (fase 1)

**Cómo ver la rama en el móvil sin tocar la web publicada.** GitHub Pages solo publica un origen a la vez. Opciones:
1. Que el flujo de Actions publique la compilación de la rama en una carpeta `/beta/` de `master` (la web de la raíz no cambia; se borra en el traspaso).
2. Un repositorio aparte, solo para la vista previa.
3. Mirar capturas y pruebas hasta el traspaso.

Recomendación: la opción 1.
