// Qué eliges tú en cada modo: cuadro lleno = lo eliges tú; discontinuo = lo elige la cámara. La columna Av va con borde.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

// Por fila (apertura, tiempo, ISO) y por modo (Auto, P, Tv, Av, M): 1 = lo eliges tú
const ELIGES = [[0, 0, 0, 1, 1], [0, 0, 1, 0, 1], [0, 1, 1, 1, 1]];
const COLUMNA_AV = 3;

export default {
  ancho: 358, alto: 196,
  claves: { modos: 5, filas: 3 },
  pintar({ modos, filas }) {
    const x = (i) => 96 + i * 58, y = (r) => 80 + r * 48;
    const celda = (i, r, lleno) => lleno
      ? `<rect x="${x(i) - 14}" y="${y(r) - 14}" width="28" height="28" rx="6" fill="${TINTA}"/><path d="M${x(i) - 6} ${y(r)}l4.5 4.5 8-9" fill="none" stroke="${FONDO}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<rect x="${x(i) - 13}" y="${y(r) - 13}" width="26" height="26" rx="6" fill="none" stroke="${SUAVE}" stroke-width="2" stroke-dasharray="3 3"/>`;
    return envolver(358, 196, [
      ...modos.map((m, i) => texto(x(i), 30, 800, 20, TINTA, m, "middle")),
      ...filas.map((nombre, r) => texto(2, y(r) + 6, 600, 17, SUAVE, nombre) + "\n  " + ELIGES[r].map((lleno, i) => celda(i, r, lleno)).join("")),
      `<rect x="${x(COLUMNA_AV) - 28}" y="44" width="56" height="150" rx="14" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`
    ].join("\n  "));
  }
};
