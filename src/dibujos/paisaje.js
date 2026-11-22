// Un paisaje dentro de la cuadrícula de tercios: el horizonte sobre la línea de abajo y tres planos numerados (1 primer plano, 2 plano medio, 3 fondo).
// Es un esquema, no un paisaje real: rocas delante, árboles en medio y montañas al fondo.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { planos: 3, lineas: 2 },
  pintar({ planos, lineas }) {
    const fx = 8, fy = 10, fw = 190, fh = 130;
    const X = (u) => +(fx + fw * u).toFixed(1), Y = (v) => +(fy + fh * v).toFixed(1);
    const puntos = (lista) => lista.map(([u, v]) => `${X(u)},${Y(v)}`).join(" ");
    const pino = (u) => `<polygon points="${puntos([[u - 0.075, 0.82], [u, 0.52], [u + 0.075, 0.82]])}" fill="${TINTA}" opacity=".8"/>`;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const fila = (n, y, rotulo) => `${marca(220, y, n)}${texto(238, y + 6, 700, 17, TINTA, rotulo)}`;
    return envolver(358, 208, `<defs><clipPath id="dib-paisaje-marco"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-paisaje-marco)">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh * 2 / 3}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${Y(2 / 3)}" width="${fw}" height="${fh / 3}" fill="${SUAVE}" opacity=".24"/>
    <circle cx="${X(2 / 3)}" cy="${Y(1 / 3)}" r="9" fill="${SUAVE}" opacity=".7"/>
    <polygon points="${puntos([[0, 2 / 3], [0.2, 0.46], [0.38, 0.62], [0.58, 0.4], [0.8, 0.62], [0.9, 0.5], [1, 0.64], [1, 2 / 3]])}" fill="${SUAVE}" opacity=".55"/>
    ${pino(0.47)}${pino(0.58)}
    <path d="M${X(0.02)} ${Y(1)} Q${X(0.05)} ${Y(0.8)} ${X(0.19)} ${Y(0.78)} Q${X(0.33)} ${Y(0.8)} ${X(0.36)} ${Y(1)} Z M${X(0.28)} ${Y(1)} Q${X(0.32)} ${Y(0.88)} ${X(0.44)} ${Y(0.87)} Q${X(0.53)} ${Y(0.9)} ${X(0.56)} ${Y(1)} Z" fill="${TINTA}"/>
    <line x1="${X(1 / 3)}" y1="${fy}" x2="${X(1 / 3)}" y2="${fy + fh}" stroke="${SUAVE}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line x1="${X(2 / 3)}" y1="${fy}" x2="${X(2 / 3)}" y2="${fy + fh}" stroke="${SUAVE}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line x1="${fx}" y1="${Y(1 / 3)}" x2="${fx + fw}" y2="${Y(1 / 3)}" stroke="${SUAVE}" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line x1="${fx}" y1="${Y(2 / 3)}" x2="${fx + fw}" y2="${Y(2 / 3)}" stroke="${TINTA}" stroke-width="3"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marca(X(0.15), Y(0.9), 1, 9)}${marca(X(0.525), Y(0.74), 2, 9)}${marca(X(0.2), Y(0.58), 3, 9)}
  ${fila(1, 44, planos[0])}${fila(2, 78, planos[1])}${fila(3, 112, planos[2])}
  ${texto(179, 168, 600, 17, SUAVE, lineas[0], "middle")}
  ${texto(179, 190, 600, 17, SUAVE, lineas[1], "middle")}`);
  }
};
