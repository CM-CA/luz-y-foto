// Dos modos de enfoque: simple (1), un sujeto quieto con el cuadrado de enfoque fijo sobre él, y continuo (2), un sujeto que corre de izquierda a
// derecha (tres posiciones, cada vez más marcadas) y un cuadrado de enfoque que lo sigue. Es un esquema, no una foto.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // una persona de pie: la cabeza en (cx, cy) y el cuerpo debajo; `op` es lo marcada que sale
    const persona = (cx, cy, op) => `<circle cx="${cx}" cy="${cy}" r="9" fill="${SUAVE}" opacity="${op}" stroke="${TINTA}" stroke-width="2.5"/><path d="M${cx - 13} ${cy + 46}Q${cx - 13} ${cy + 14} ${cx} ${cy + 14}Q${cx + 13} ${cy + 14} ${cx + 13} ${cy + 46}Z" fill="${SUAVE}" opacity="${op}" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>`;
    const cuadro = (cx, cy, dash, op) => `<rect x="${cx - 14}" y="${cy - 14}" width="28" height="28" rx="2" fill="none" stroke="${TINTA}" stroke-width="2.5"${dash ? ' stroke-dasharray="4 4"' : ""} opacity="${op}"/>`;
    const escena = (fx, id, cuerpo) => `<defs><clipPath id="dib-enfoque-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-enfoque-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${fy + 84}" width="${fw}" height="${fh - 84}" fill="${SUAVE}" opacity=".3"/>
    ${cuerpo}
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    const quieto = (fx) => `${persona(fx + 75, fy + 30, 0.55)}${cuadro(fx + 75, fy + 30, false, 1)}`;
    const movil = (fx) => `${persona(fx + 34, fy + 30, 0.18)}${persona(fx + 70, fy + 30, 0.34)}${persona(fx + 112, fy + 30, 0.6)}${cuadro(fx + 34, fy + 30, true, 0.45)}${cuadro(fx + 70, fy + 30, true, 0.65)}${cuadro(fx + 112, fy + 30, false, 1)}<path d="M${fx + 12} ${fy + 94}H${fx + 138}M${fx + 130} ${fy + 88}L${fx + 138} ${fy + 94}L${fx + 130} ${fy + 100}" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>`;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", quieto(8))}
  ${escena(200, "b", movil(200))}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
