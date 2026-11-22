// Lo que comparten los dibujos de las lecciones. Cada dibujo es una función de sus textos que devuelve un SVG como texto, para pintarlo
// dentro de la página (src/componentes/Dibujo.svelte). Los colores no van escritos: salen de las variables --dibujo-fondo, --dibujo-tinta
// y --dibujo-suave de src/estilos.css, que valen lo del tema claro o lo del oscuro, así que un solo dibujo sirve para los dos.
export const FONDO = "var(--dibujo-fondo)";
export const TINTA = "var(--dibujo-tinta)";
export const SUAVE = "var(--dibujo-suave)";

// Los textos de data/<idioma>/dibujos.json llegan tal cual: se escapan para que un & o un < no rompan el SVG
export const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Un texto del dibujo, con la letra de la app (Figtree): posición, peso, tamaño, color y, si hace falta, el ancla
export const texto = (x, y, peso, tam, color, contenido, ancla) =>
  `<text x="${x}" y="${y}"${ancla ? ` text-anchor="${ancla}"` : ""} font-family="Figtree, sans-serif" font-weight="${peso}" font-size="${tam}" fill="${color}">${esc(contenido)}</text>`;

// Una raya discontinua, de las que separan las partes de un dibujo
export const raya = (x1, y1, x2, y2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${SUAVE}" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round" opacity=".7"/>`;

// El svg entero: el fondo (el de la tarjeta, para que se funda con ella) y el cuerpo. Mide lo mismo en pantalla que su viewBox.
export const envolver = (ancho, alto, cuerpo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}">\n  <rect width="${ancho}" height="${alto}" fill="${FONDO}"/>\n  ${cuerpo}\n</svg>`;
