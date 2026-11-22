// Dos formas de hacer zoom: los botones (0,5x, 1x, 3x), que en muchos móviles cambian de lente, y los dedos, que recortan una parte de la foto
// y la amplían (zoom digital). Los números de los botones son un ejemplo, no los de ningún móvil en concreto.
import { envolver, raya, texto, SUAVE, TINTA } from "./util.js";

const panel = (x0, titulo, icono, lineas) => `${texto(x0 + 85, 26, 800, 19, TINTA, titulo, "middle")}
  ${icono}
  ${lineas.map((l, i) => texto(x0 + 85, 177 + i * 20, 600, 17, SUAVE, l, "middle")).join("\n  ")}`;

export default {
  ancho: 358, alto: 232,
  claves: { titulos: 2, botones: 3, lineasBotones: 2, lineasDedos: 2 },
  pintar({ titulos, botones, lineasBotones, lineasDedos }) {
    const lente = (cx, etiqueta) => `<circle cx="${cx}" cy="86" r="21" fill="none" stroke="${TINTA}" stroke-width="3.5"/><circle cx="${cx}" cy="86" r="8" fill="${TINTA}"/>
  ${texto(cx, 134, 800, 19, TINTA, etiqueta, "middle")}`;
    const lentes = lente(4 + 27, botones[0]) + lente(4 + 85, botones[1]) + lente(4 + 143, botones[2]);
    // Una foto y, dentro, la parte que se recorta; las líneas discontinuas llevan sus esquinas a las de la foto entera (se agranda)
    const fx = 184 + 35, fy = 50, fa = 100, fh = 72, ix = fx + 30, iy = fy + 20, ia = 40, ih = 30;
    const esquina = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${SUAVE}" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>`;
    const dedos = esquina(ix, iy, fx, fy) + esquina(ix + ia, iy, fx + fa, fy) + esquina(ix, iy + ih, fx, fy + fh) + esquina(ix + ia, iy + ih, fx + fa, fy + fh)
      + `\n  <rect x="${fx}" y="${fy}" width="${fa}" height="${fh}" rx="8" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  <rect x="${ix}" y="${iy}" width="${ia}" height="${ih}" rx="4" fill="${SUAVE}" fill-opacity=".3" stroke="${TINTA}" stroke-width="2.5"/>`;
    return envolver(358, 232, `${panel(4, titulos[0], lentes, lineasBotones)}\n  ${panel(184, titulos[1], dedos, lineasDedos)}\n  ${raya(179, 14, 179, 222)}`);
  }
};
