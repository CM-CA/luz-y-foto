# Licencias

Decisión del 2026-11-26. Hasta entonces todo el repositorio llevaba la licencia MIT (desde el primer commit, el 2026-11-18).

## Qué se decidió

| Qué | Licencia |
|---|---|
| El código (`src/`, `scripts/`, `test/`, `public/`…) | PolyForm Noncommercial 1.0.0 (`LICENSE`) |
| Los textos y la documentación (`data/`, `docs/`, `README.md`) | CC BY-NC-SA 4.0 (`LICENSE-CONTENIDO`) |
| El nombre «Ollada» y su icono | Sin licencia (lo dice `LICENSE`) |
| Lo de terceros | La suya: SunCalc, Svelte y Vite en `licencias/`; Figtree y Young Serif en `src/fuentes/` |

El titular del copyright es Camilo Manuel Couselo Alonso. El permiso para un uso comercial se pide abriendo una incidencia en <https://github.com/CM-CA/ollada/issues>: como único titular, puede dar licencias comerciales aparte.

## Por qué

El criterio de la persona que mantiene la app: **que no la copien y se lucren con ella**. Las licencias copyleft (GPL, AGPL, MPL) no lo impiden: obligan a compartir el código modificado, pero dejan vender o poner publicidad. Hace falta una licencia que excluya el uso comercial.

- **PolyForm Noncommercial** está escrita para software y no define «no comercial» en abstracto, pero lo concreta: permite el uso personal (estudio, investigación, proyectos de afición) y el de organizaciones benéficas, centros educativos, instituciones públicas, de investigación, de salud o seguridad pública y de protección ambiental. El titular puede licenciar a otros por separado.
- **CC BY-NC-SA 4.0** para los textos: se pueden compartir y adaptar (por ejemplo, traducir) sin fines comerciales, citando al autor y con la misma licencia. CC BY-NC-ND impediría las traducciones.

Descartadas: MIT, BSD y Apache (permiten vender), GPL, AGPL y MPL (permiten vender), CC BY y CC BY-SA (permiten vender), BSL (pensada para convertirse en abierta con el tiempo) y «todos los derechos reservados» (no deja a nadie reutilizar, ni siquiera para aprender).

## Lo que cuesta y lo que no cubre

- **No es «código abierto»** según la OSI: algunas personas y organizaciones no tocan software con restricción comercial, y habrá menos aportaciones externas.
- **Lo publicado bajo MIT sigue siendo MIT** para quien lo copió antes del cambio (el historial de `master` llega hasta el simulador de exposición, fusionado el 2026-11-26).
- **Una licencia no impide copiar** una app solo frontend, que se descarga entera al abrirla: da base legal para reclamar (por ejemplo, con avisos de retirada en GitHub). Además, la API gratuita de Open-Meteo es solo para uso no comercial, así que una copia comercial tendría que contratar su plan de pago.
- **Las zonas grises** de «no comercial» existen (por ejemplo, un blog personal con publicidad); PolyForm las acota mejor que Creative Commons, pero no desaparecen.
- **Texto escrito con ayuda de IA**: en algunos países, lo generado solo por IA puede no estar protegido por copyright. No cambia la licencia elegida, solo cuánto protege.
- Esto no es asesoramiento legal.

## Qué obligan las dependencias

SunCalc (BSD-2-Clause), Svelte y Vite (MIT) y las dos fuentes (SIL OFL 1.1) piden conservar su aviso. La app los muestra con el texto completo en su pantalla «Aviso legal» (`#/aviso-legal`, `src/pantallas/AvisoLegal.svelte`, que incluye los mismos archivos del repositorio al compilar), a la que se llega con la píldora del final de Hoy y de Aprender. Los datos se citan ahí mismo: Open-Meteo (CC BY 4.0) y «© colaboradores de OpenStreetMap» (ODbL).

Los textos oficiales de PolyForm y de CC BY-NC-SA se copiaron sin cambios de los repositorios `polyformproject/polyform-licenses` (1.0.0) y `spdx/license-list-data`; en cada archivo van precedidos de un aviso breve en español y en inglés.

## El aviso legal de la app

La pantalla «Aviso legal» (`#/aviso-legal`) reúne, en español y en inglés: la versión de la app, quién es el titular, las licencias, el uso y la responsabilidad («tal cual», sin garantías, decide con tu criterio y los avisos oficiales del tiempo), la privacidad, los avisos de lo que va dentro y los créditos de los datos. Es un aviso de buena fe, no asesoramiento legal.

- **Privacidad.** Lo que dice se apoya en lo que la app hace de verdad: no hay cuentas, publicidad ni analítica; el idioma, el perfil, el lugar y la última previsión se guardan solo en el dispositivo (`localStorage`); la previsión y la búsqueda de ciudades van a Open-Meteo (con las coordenadas del lugar y el texto buscado), el nombre del lugar a Nominatim de OpenStreetMap (con coordenadas redondeadas a unos 100 m y el idioma) y la app se sirve desde GitHub Pages. La política de seguridad (`vite.config.mjs`) no deja hablar con nadie más. Si la app cambia de proveedor o guarda algo nuevo, hay que actualizar este apartado (`aviso.priv*` en `src/idioma/`).
- **Contacto.** Solo por GitHub (<https://github.com/CM-CA/ollada/issues>). No hay dirección, NIF ni correo del titular. Si algún día la app diera dinero (publicidad, suscripción, venta), la normativa española de servicios de la sociedad de la información (LSSI) pide datos de contacto del titular y convendría consultarlo con alguien del oficio.
- **Versión.** Sale de `version` en `package.json` (y de `package-lock.json`: las dos tienen que coincidir, lo comprueba `test/nucleo/version.test.js`), más el commit y el día del último cambio, que toma `scripts/version.mjs` de git al compilar. Se ve en la píldora del final de Hoy y de Aprender («v1.0.0 · Aviso legal») y completa en la pantalla («Versión 1.0.0 (a1b2c3d, 2026-11-26)»). Para subir de versión: `npm version minor --no-git-tag-version` (o la que toque) y commit. Sin git (una copia suelta del proyecto) se ve solo el número.
