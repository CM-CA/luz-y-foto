// Un objetivo visto de lado, sin y con parasol. La luz de lado (a rayas, desde arriba) llega al cristal sin parasol y se corta con él;
// la luz de frente (línea llena, gris) entra en los dos.
import { envolver, raya, texto, SUAVE, TINTA } from "./util.js";

const punta = (x, y, ux, uy, color) => { // punta de flecha con la punta en (x, y), mirando hacia (ux, uy)
  const bx = x - ux * 10, by = y - uy * 10, nx = -uy * 5.5, ny = ux * 5.5;
  return `<path d="M${x} ${y}L${(bx + nx).toFixed(1)} ${(by + ny).toFixed(1)}L${(bx - nx).toFixed(1)} ${(by - ny).toFixed(1)}z" fill="${color}"/>`;
};
const LADO = { fin: [98, 106], paso: [160, 36] }; // la luz de lado va de `paso` (arriba a la derecha) al borde del cristal
const u = (() => { const dx = LADO.fin[0] - LADO.paso[0], dy = LADO.fin[1] - LADO.paso[1], n = Math.hypot(dx, dy); return [dx / n, dy / n]; })();

const panel = (x0, titulo, conParasol, lineas) => {
  const X = (x) => x0 + x;
  const cuerpo = `${texto(X(85), 26, 800, 19, TINTA, titulo, "middle")}
  <rect x="${X(0)}" y="92" width="18" height="76" rx="5" fill="${SUAVE}" opacity=".35"/>
  <rect x="${X(18)}" y="100" width="78" height="60" rx="6" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  <path d="M${X(96)} 104V156" stroke="${TINTA}" stroke-width="5" stroke-linecap="round"/>
  <path d="M${X(166)} 130H${X(108)}" stroke="${SUAVE}" stroke-width="2.5" stroke-linecap="round"/>${punta(X(104), 130, -1, 0, SUAVE)}`;
  const parasolSvg = conParasol ? `<path d="M${X(96)} 100L${X(140)} 80M${X(96)} 160L${X(140)} 180" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round"/>` : "";
  // Sin parasol, la luz de lado llega al cristal y se cuela (con un destello dentro); con parasol, se para en su borde
  const corte = conParasol ? [110, 93] : LADO.fin;
  const lado = `<path d="M${X(LADO.paso[0])} ${LADO.paso[1]}L${X(corte[0])} ${corte[1]}" stroke="${TINTA}" stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="round"/>`
    + (conParasol
      ? `<path d="M${X(corte[0]) - u[1] * 7} ${corte[1] + u[0] * 7}L${X(corte[0]) + u[1] * 7} ${corte[1] - u[0] * 7}" stroke="${TINTA}" stroke-width="3.5" stroke-linecap="round"/>`
      : punta(X(corte[0]), corte[1], u[0], u[1], TINTA)
        + `<path d="M${X(82)} 118h12M${X(88)} 112v12M${X(83.5)} 113.5l9 9M${X(92.5)} 113.5l-9 9" stroke="${TINTA}" stroke-width="2" stroke-linecap="round"/>`);
  return `${cuerpo}\n  ${parasolSvg}\n  ${lado}\n  ${lineas.map((l, i) => texto(X(85), 200 + i * 19, 600, 16, SUAVE, l, "middle")).join("\n  ")}`;
};

export default {
  ancho: 358, alto: 232,
  claves: { sin: null, con: null, lineasSin: 2, lineasCon: 2 },
  pintar({ sin, con, lineasSin, lineasCon }) {
    return envolver(358, 232, `${panel(4, sin, false, lineasSin)}\n  ${panel(184, con, true, lineasCon)}\n  ${raya(179, 14, 179, 222)}`);
  }
};
