// Los dibujos de las lecciones, como SVG. `node scripts/generar-dibujos.mjs` los convierte en las imágenes de src/imagenes/
// (dibujo-<id>-claro.webp y dibujo-<id>-oscuro.webp). Cada dibujo se pinta con la paleta del tema: { tarjeta, texto, suave },
// los mismos colores de --tarjeta, --texto y --suave de src/estilos.css. El fondo es el de la tarjeta, así que la imagen se funde con ella.
// `ancho` y `alto` son los de la imagen, el doble de los de pantalla para que se vea nítida en un móvil.
//
// Son imágenes y no SVG dentro de la página porque el navegador de algunos móviles oscurece por su cuenta los SVG
// incrustados (se probó) pero no las imágenes.
export const PALETAS = {
  claro: { tarjeta: "#ffffff", texto: "#1f2740", suave: "#59607f" },
  oscuro: { tarjeta: "#18213a", texto: "#ecebf5", suave: "#a8afcb" }
};

const TIPO = "font-family=\"Figtree, sans-serif\"";

// Qué eliges tú en cada modo: cuadro lleno = lo eliges tú; discontinuo = lo elige la cámara. La columna Av va con borde.
const MODOS = ["Auto", "P", "Tv", "Av", "M"];
const FILAS = [["Apertura", [0, 0, 0, 1, 1]], ["Tiempo", [0, 0, 1, 0, 1]], ["ISO", [0, 1, 1, 1, 1]]];
const COLUMNA_AV = MODOS.indexOf("Av");

const modos = ({ tarjeta, texto, suave }) => {
  const x = (i) => 96 + i * 58, y = (r) => 80 + r * 48;
  const celda = (i, r, lleno) => lleno
    ? `<rect x="${x(i) - 14}" y="${y(r) - 14}" width="28" height="28" rx="6" fill="${texto}"/><path d="M${x(i) - 6} ${y(r)}l4.5 4.5 8-9" fill="none" stroke="${tarjeta}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<rect x="${x(i) - 13}" y="${y(r) - 13}" width="26" height="26" rx="6" fill="none" stroke="${suave}" stroke-width="2" stroke-dasharray="3 3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 358 196" width="716" height="392">
  <rect width="358" height="196" fill="${tarjeta}"/>
  ${MODOS.map((m, i) => `<text x="${x(i)}" y="30" text-anchor="middle" ${TIPO} font-weight="800" font-size="20" fill="${texto}">${m}</text>`).join("\n  ")}
  ${FILAS.map(([nombre, v], r) => `<text x="2" y="${y(r) + 6}" ${TIPO} font-weight="600" font-size="17" fill="${suave}">${nombre}</text>\n  ` + v.map((lleno, i) => celda(i, r, lleno)).join("")).join("\n  ")}
  <rect x="${x(COLUMNA_AV) - 28}" y="44" width="56" height="150" rx="14" fill="none" stroke="${texto}" stroke-width="2.5"/>
</svg>`;
};

export const DIBUJOS_SVG = {
  modos: { ancho: 716, alto: 392, svg: modos }
};
