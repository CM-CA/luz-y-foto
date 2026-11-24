// Una cascada dos veces: con un tiempo corto (1) el agua se congela en gotas y rayas cortas; con un tiempo largo y la cámara en un trípode (2) cae como
// un velo liso y las rocas siguen nítidas. Es un esquema, no una foto.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const f = (n) => +n.toFixed(1);
    // la caída: x de 52 a 98 del marco y de y 30 a 80; `sedosa` la pinta como un velo liso, si no, como rayas cortas y gotas sueltas
    const agua = (fx, sedosa) => {
      if (sedosa) return `<rect x="${fx + 52}" y="${fy + 28}" width="46" height="54" fill="url(#dib-largaexp-velo)"/>${[60, 70, 80, 90].map((u) => `<path d="M${fx + u} ${fy + 30}V${fy + 80}" stroke="${TINTA}" stroke-width="1.5" opacity=".18"/>`).join("")}`;
      const rayas = Array.from({ length: 12 }, (_, i) => { const x = fx + 54 + (i % 6) * 8 + (i > 5 ? 4 : 0), y = fy + 32 + ((i * 17) % 38); return `<path d="M${f(x)} ${f(y)}v${6 + (i % 3) * 3}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`; }).join("");
      const gotas = Array.from({ length: 8 }, (_, i) => `<circle cx="${f(fx + 56 + ((i * 29) % 40))}" cy="${f(fy + 38 + ((i * 23) % 40))}" r="1.8" fill="${TINTA}" opacity=".7"/>`).join("");
      return rayas + gotas;
    };
    const tripode = (fx) => `<path d="M${fx + 24} ${fy + 66}V${fy + 58}M${fx + 24} ${fy + 66}L${fx + 16} ${fy + 84}M${fx + 24} ${fy + 66}L${fx + 24} ${fy + 84}M${fx + 24} ${fy + 66}L${fx + 32} ${fy + 84}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none"/><rect x="${fx + 17}" y="${fy + 48}" width="14" height="10" rx="2" fill="${SUAVE}" opacity=".6" stroke="${TINTA}" stroke-width="2.5"/>`;
    const escena = (fx, id, sedosa) => `<defs><clipPath id="dib-largaexp-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-largaexp-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx + 40}" y="${fy}" width="70" height="30" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
    ${agua(fx, sedosa)}
    <path d="M${fx} ${fy + fh}V${fy + 84}Q${fx + 20} ${fy + 78} ${fx + 40} ${fy + 86}Q${fx + 75} ${fy + 76} ${fx + 108} ${fy + 86}Q${fx + 132} ${fy + 80} ${fx + fw} ${fy + 88}V${fy + fh}Z" fill="${SUAVE}" opacity=".6" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
    ${sedosa ? tripode(fx) : ""}
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `<defs><linearGradient id="dib-largaexp-velo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SUAVE}" stop-opacity=".7"/><stop offset="1" stop-color="${SUAVE}" stop-opacity=".25"/></linearGradient></defs>
  ${escena(8, "a", false)}
  ${escena(200, "b", true)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
