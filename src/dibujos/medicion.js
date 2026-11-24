// La misma escena a contraluz (una persona con el sol detrás) con la zona que mide la cámara marcada: toda la escena en una cuadrícula (1, evaluativa),
// un óvalo grande en el centro (2, ponderada al centro) y un punto pequeño sobre la cara (3, puntual). Es un esquema, no una foto.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 3, lineas: 6 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 108, fh = 82;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const zona = (fx, modo) => {
      if (modo === 0) {
        // evaluativa: una cuadrícula de zonas sobre toda la escena
        const v = [1, 2, 3, 4].map((i) => `<path d="M${fx + (fw / 5) * i} ${fy + 6}V${fy + fh - 6}" stroke="${TINTA}" stroke-width="1.5" opacity=".55"/>`).join("");
        const h = [1, 2].map((i) => `<path d="M${fx + 6} ${fy + (fh / 3) * i}H${fx + fw - 6}" stroke="${TINTA}" stroke-width="1.5" opacity=".55"/>`).join("");
        return `<rect x="${fx + 6}" y="${fy + 6}" width="${fw - 12}" height="${fh - 12}" rx="3" fill="none" stroke="${TINTA}" stroke-width="2" stroke-dasharray="4 4" opacity=".7"/>${v}${h}`;
      }
      if (modo === 1) return `<ellipse cx="${fx + fw / 2}" cy="${fy + fh / 2}" rx="40" ry="28" fill="${TINTA}" opacity=".12"/><ellipse cx="${fx + fw / 2}" cy="${fy + fh / 2}" rx="40" ry="28" fill="none" stroke="${TINTA}" stroke-width="2" stroke-dasharray="4 4" opacity=".7"/><ellipse cx="${fx + fw / 2}" cy="${fy + fh / 2}" rx="22" ry="15" fill="${TINTA}" opacity=".12"/>`;
      return `<circle cx="${fx + 48}" cy="${fy + 33}" r="7" fill="${TINTA}" opacity=".15"/><circle cx="${fx + 48}" cy="${fy + 33}" r="7" fill="none" stroke="${TINTA}" stroke-width="2.5"/><path d="M${fx + 48} ${fy + 22}V${fy + 26}M${fx + 48} ${fy + 40}V${fy + 44}M${fx + 37} ${fy + 33}H${fx + 41}M${fx + 55} ${fy + 33}H${fx + 59}" stroke="${TINTA}" stroke-width="2" stroke-linecap="round"/>`;
    };
    const escena = (fx, id, modo) => `<defs><clipPath id="dib-medicion-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-medicion-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <circle cx="${fx + 84}" cy="${fy + 24}" r="13" fill="${SUAVE}" opacity=".3"/>
    <circle cx="${fx + 84}" cy="${fy + 24}" r="6" fill="${TINTA}" opacity=".35"/>
    <rect x="${fx}" y="${fy + 66}" width="${fw}" height="${fh - 66}" fill="${SUAVE}" opacity=".3"/>
    <path d="M${fx + 30} ${fy + fh}Q${fx + 30} ${fy + 50} ${fx + 48} ${fy + 50}Q${fx + 66} ${fy + 50} ${fx + 66} ${fy + fh}Z" fill="${SUAVE}" opacity=".75" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${fx + 48}" cy="${fy + 33}" r="10" fill="${SUAVE}" opacity=".75" stroke="${TINTA}" stroke-width="2.5"/>
    ${zona(fx, modo)}
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 12, 114, n, 10)}${texto(fx + 30, 120, 700, 16, TINTA, rotulo)}${texto(fx + 4, 148, 600, 15, SUAVE, l1)}${texto(fx + 4, 168, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", 0)}
  ${escena(125, "b", 1)}
  ${escena(242, "c", 2)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(125, 2, rotulos[1], lineas[2], lineas[3])}
  ${columna(242, 3, rotulos[2], lineas[4], lineas[5])}`);
  }
};
