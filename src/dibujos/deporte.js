// Dos formas de fotografiar un movimiento (tiempo lento: sale movido; tiempo rápido: se congela) y una ráfaga de cinco fotos con la mejor marcada.
// Los tiempos (1/60 s y 1/1000 s) son un ejemplo de lento y de rápido, no una regla.
import { envolver, raya, texto, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 232,
  claves: { lento: null, rapido: null, pieLento: null, pieRapido: null, lineas: 2 },
  pintar({ lento, rapido, pieLento, pieRapido, lineas }) {
    const rayas = [0, 1, 2].map((i) => `<line x1="${236 + i * 2}" y1="${54 + i * 8}" x2="${252 + i * 2}" y2="${54 + i * 8}" stroke="${SUAVE}" stroke-width="2.5" stroke-linecap="round"/>`).join("");
    const estela = [[56, 0.15], [72, 0.3], [88, 0.5], [104, 0.9]].map(([x, o]) => `<circle cx="${x}" cy="62" r="10" fill="${TINTA}" opacity="${o}"/>`).join("");
    const pie = (cx, y, l) => texto(cx, y, 600, 17, SUAVE, l, "middle");
    const marco = (i) => {
      const x = 55 + i * 52, mejor = i === 2;
      return `<rect x="${x}" y="134" width="40" height="30" rx="5" fill="none" stroke="${mejor ? TINTA : SUAVE}" stroke-width="${mejor ? 3.5 : 2}"/><circle cx="${x + 10 + i * 5}" cy="${154 - i * 3.5}" r="4.5" fill="${TINTA}" opacity="${mejor ? 1 : 0.55}"/>`;
    };
    return envolver(358, 232, `${texto(89, 24, 800, 19, TINTA, lento, "middle")}
  ${texto(269, 24, 800, 19, TINTA, rapido, "middle")}
  ${estela}
  ${rayas}<circle cx="269" cy="62" r="10" fill="${TINTA}"/>
  ${pie(89, 104, pieLento)}${pie(269, 104, pieRapido)}
  ${raya(179, 12, 179, 112)}
  ${raya(14, 122, 344, 122)}
  ${[0, 1, 2, 3, 4].map(marco).join("")}
  ${pie(179, 194, lineas[0])}${pie(179, 216, lineas[1])}`);
  }
};
