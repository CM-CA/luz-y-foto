// Lo que da y lo que cuesta cada ajuste: tres columnas (apertura, tiempo, ISO), cada una con su valor bajo y su valor alto y un icono.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

// El icono de cada casilla: por columna, el de arriba y el de abajo
const ICONOS = [["abierta", "cerrada"], ["quieto", "estela"], ["limpia", "grano"]];
// Puntos del grano (posiciones fijas dentro de un cuadrado de 36 × 36)
const GRANO = [[5, 6], [14, 4], [27, 7], [31, 15], [9, 17], [20, 13], [33, 28], [24, 24], [6, 29], [15, 31], [28, 33], [18, 22], [11, 10], [3, 22]];

const icono = (tipo, cx, cy) => {
  if (tipo === "abierta" || tipo === "cerrada") { // el diafragma visto de frente: un agujero grande o uno pequeño
    return `<circle cx="${cx}" cy="${cy}" r="18" fill="${TINTA}"/><circle cx="${cx}" cy="${cy}" r="${tipo === "abierta" ? 12 : 4.5}" fill="${FONDO}"/>`;
  }
  if (tipo === "quieto") return `<circle cx="${cx + 10}" cy="${cy}" r="8" fill="${TINTA}"/>`; // un punto nítido
  if (tipo === "estela") { // el mismo punto arrastrado: una estela que se difumina hacia atrás
    return `<defs><linearGradient id="dib-exposicion-estela" x1="0" x2="1"><stop offset="0" stop-color="${TINTA}" stop-opacity="0"/><stop offset="1" stop-color="${TINTA}" stop-opacity=".85"/></linearGradient></defs><rect x="${cx - 30}" y="${cy - 8}" width="48" height="16" rx="8" fill="url(#dib-exposicion-estela)"/><circle cx="${cx + 10}" cy="${cy}" r="8" fill="${TINTA}"/>`;
  }
  const x = cx - 18, y = cy - 18, cuadro = `<rect x="${x}" y="${y}" width="36" height="36" rx="6" fill="${SUAVE}" opacity=".3"/>`; // el sensor: liso o con grano
  return tipo === "limpia" ? cuadro : cuadro + GRANO.map(([dx, dy], i) => `<circle cx="${x + dx}" cy="${y + dy}" r="${i % 3 === 0 ? 2.4 : 1.8}" fill="${TINTA}"/>`).join("");
};

export default {
  ancho: 358, alto: 258,
  // Los valores y los efectos van por columna: apertura (arriba, abajo), tiempo (arriba, abajo), ISO (arriba, abajo)
  claves: { titulos: 3, valores: 6, efectos: 6 },
  pintar({ titulos, valores, efectos }) {
    const cx = (c) => 62 + c * 117, y0 = [44, 156]; // el centro de cada columna y dónde empieza cada fila
    return envolver(358, 258, [
      ...titulos.map((t, i) => texto(cx(i), 26, 800, 20, TINTA, t, "middle")),
      `<line x1="12" y1="${y0[1] - 13}" x2="346" y2="${y0[1] - 13}" stroke="${SUAVE}" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round" opacity=".7"/>`,
      ...ICONOS.map((filas, i) => filas.map((tipo, r) => `${icono(tipo, cx(i), y0[r] + 22)}
  ${texto(cx(i), y0[r] + 66, 800, 21, TINTA, valores[i * 2 + r], "middle")}
  ${texto(cx(i), y0[r] + 86, 600, 16, SUAVE, efectos[i * 2 + r], "middle")}`).join("\n  "))
    ].join("\n  "));
  }
};
