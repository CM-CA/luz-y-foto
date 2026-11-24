// La misma foto guardada de dos maneras: JPEG (1), un archivo corto y reglas de edición con poco recorrido, y RAW (2), un archivo largo y reglas con
// mucho recorrido. La barra de abajo es el tamaño del archivo y las tres reglas de la derecha son el margen para editar (balance de blancos,
// exposición y sombras). Es un esquema, no una medición.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // `largo`: el RAW (archivo largo y reglas con mucho recorrido); si no, el JPEG
    const escena = (fx, id, largo) => {
      const barra = largo ? 112 : 30, recorrido = largo ? 44 : 14;
      const reglas = [0, 1, 2].map((i) => {
        const y = fy + 24 + i * 15, x0 = fx + 90, pos = x0 + recorrido * (i === 1 ? 0.65 : i === 2 ? 0.3 : 0.5);
        return `<path d="M${x0} ${y}H${x0 + recorrido}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" opacity=".55"/><circle cx="${pos}" cy="${y}" r="4.5" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>`;
      }).join("");
      return `<defs><clipPath id="dib-rawjpeg-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-rawjpeg-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx + 12}" y="${fy + 14}" width="66" height="48" rx="4" fill="${SUAVE}" opacity=".35" stroke="${TINTA}" stroke-width="2.5"/>
    <circle cx="${fx + 26}" cy="${fy + 28}" r="5" fill="${TINTA}" opacity=".8"/>
    <path d="M${fx + 14} ${fy + 60}L${fx + 34} ${fy + 40}L${fx + 48} ${fy + 52}L${fx + 60} ${fy + 38}L${fx + 76} ${fy + 60}Z" fill="${SUAVE}" opacity=".6"/>
    ${reglas}
    <rect x="${fx + 12}" y="${fy + 78}" width="${barra}" height="12" rx="3" fill="${TINTA}" opacity=".75"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", false)}
  ${escena(200, "b", true)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
