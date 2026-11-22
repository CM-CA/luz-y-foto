// Una calle en perspectiva dentro de un marco: las líneas de la acera y de las fachadas llevan la mirada al fondo (1 líneas guía),
// una puerta a un lado hace de marco (2) y una persona pequeña cruza un charco de luz (3). Es un esquema, no una calle real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { filas: 3, lineas: 2 },
  pintar({ filas, lineas }) {
    const fx = 8, fy = 10, fw = 190, fh = 130;
    const X = (u) => +(fx + fw * u).toFixed(1), Y = (v) => +(fy + fh * v).toFixed(1);
    const puntos = (lista) => lista.map(([u, v]) => `${X(u)},${Y(v)}`).join(" ");
    const linea = (a, b, ancho = 2.5, opacidad = 0.85) => `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${TINTA}" stroke-width="${ancho}" stroke-linecap="round" opacity="${opacidad}"/>`;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const fila = (n, y, rotulo) => `${marca(220, y, n)}${texto(238, y + 6, 700, 16, TINTA, rotulo)}`;
    return envolver(358, 208, `<defs><clipPath id="dib-urbana-marco"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-urbana-marco)">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <polygon points="${puntos([[0, 0], [0.5, 0.34], [0.5, 0.5], [0, 0.92]])}" fill="${SUAVE}" opacity=".5"/>
    <polygon points="${puntos([[1, 0.05], [0.6, 0.34], [0.6, 0.5], [1, 0.92]])}" fill="${SUAVE}" opacity=".38"/>
    <polygon points="${puntos([[0, 0.92], [0.5, 0.5], [0.6, 0.5], [1, 0.92], [1, 1], [0, 1]])}" fill="${SUAVE}" opacity=".24"/>
    <ellipse cx="${X(0.62)}" cy="${Y(0.79)}" rx="${(fw * 0.17).toFixed(1)}" ry="${(fh * 0.075).toFixed(1)}" fill="${FONDO}"/>
    ${linea([0, 0.92], [0.5, 0.5])}${linea([1, 0.92], [0.6, 0.5])}${linea([0, 0], [0.5, 0.34], 2, 0.6)}${linea([1, 0.05], [0.6, 0.34], 2, 0.6)}
    <polygon points="${puntos([[0.08, 0.294], [0.2, 0.321], [0.2, 0.733], [0.08, 0.829]])}" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${X(0.62)}" cy="${Y(0.66)}" r="4.5" fill="${TINTA}"/>
    <path d="M${X(0.62)} ${Y(0.7)} L${X(0.62)} ${Y(0.79)} M${X(0.585)} ${Y(0.74)} L${X(0.62)} ${Y(0.71)} L${X(0.655)} ${Y(0.74)} M${X(0.62)} ${Y(0.79)} L${X(0.59)} ${Y(0.86)} M${X(0.62)} ${Y(0.79)} L${X(0.65)} ${Y(0.86)}" fill="none" stroke="${TINTA}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marca(X(0.84), Y(0.6), 1, 9)}${marca(X(0.14), Y(0.55), 2, 9)}${marca(X(0.84), Y(0.88), 3, 9)}
  ${fila(1, 44, filas[0])}${fila(2, 78, filas[1])}${fila(3, 112, filas[2])}
  ${texto(179, 168, 600, 17, SUAVE, lineas[0], "middle")}
  ${texto(179, 190, 600, 17, SUAVE, lineas[1], "middle")}`);
  }
};
