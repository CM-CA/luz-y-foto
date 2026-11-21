# Fuentes

Las dos fuentes de la app, en WOFF2 y solo con el subconjunto latino (cubre el español completo):

| Archivo | Fuente | Uso |
|---|---|---|
| `young-serif-latin-400-normal.woff2` | Young Serif 400 | título, veredicto, `h3`, fase de la luna |
| `figtree-latin-wght-normal.woff2` | Figtree (variable, pesos 300 a 900) | el resto del texto |

Origen: los paquetes `@fontsource/young-serif` y `@fontsource-variable/figtree`, versión 5.3.0 (carpeta `files/`).
Licencia: SIL Open Font License 1.1 (el texto de cada una está en `LICENCIA-*.txt`).

Están copiadas aquí, en vez de instaladas con npm, para que la compilación no dependa de nada más.
