// Un pájaro posado en una rama, visto de lado: la cámara está a la altura de su ojo (2), un cuadrado de enfoque marca el ojo (1) y detrás,
// lejos, el fondo sale limpio y borroso (3). Es un esquema, no un pájaro real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { filas: 3, lineas: 2 },
  pintar({ filas, lineas }) {
    const fx = 8, fy = 10, fw = 190, fh = 130;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const fila = (n, y, rotulo) => `${marca(220, y, n)}${texto(238, y + 6, 700, 16, TINTA, rotulo)}`;
    const X = (x) => fx + x, Y = (y) => fy + y;
    return envolver(358, 208, `<defs>
    <clipPath id="dib-fauna-marco"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath>
    <filter id="dib-fauna-borroso" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <g clip-path="url(#dib-fauna-marco)">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <g filter="url(#dib-fauna-borroso)" fill="${SUAVE}" opacity=".6"><circle cx="${X(150)}" cy="${Y(26)}" r="16"/><circle cx="${X(172)}" cy="${Y(54)}" r="11"/><circle cx="${X(128)}" cy="${Y(34)}" r="10"/></g>
    <path d="M${X(66)} ${Y(104)}H${X(186)}M${X(150)} ${Y(104)}L${X(166)} ${Y(92)}" stroke="${TINTA}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M${X(116)} ${Y(92)}V${Y(103)}M${X(128)} ${Y(92)}V${Y(103)}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <polygon points="${X(136)},${Y(76)} ${X(164)},${Y(90)} ${X(156)},${Y(70)}" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="${X(120)}" cy="${Y(80)}" rx="22" ry="14" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <circle cx="${X(100)}" cy="${Y(66)}" r="11" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <polygon points="${X(90)},${Y(64)} ${X(80)},${Y(68)} ${X(90)},${Y(72)}" fill="${TINTA}" stroke="${TINTA}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${X(97)}" cy="${Y(64)}" r="2.4" fill="${TINTA}"/>
    <rect x="${X(88)}" y="${Y(56)}" width="18" height="18" rx="2" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
    <rect x="${X(8)}" y="${Y(56)}" width="22" height="16" rx="3" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="2.5"/>
    <circle cx="${X(19)}" cy="${Y(64)}" r="4.5" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(34)} ${Y(64)}H${X(84)}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marca(X(97), Y(40), 1, 9)}${marca(X(58), Y(88), 2, 9)}${marca(X(162), Y(46), 3, 9)}
  ${fila(1, 44, filas[0])}${fila(2, 78, filas[1])}${fila(3, 112, filas[2])}
  ${texto(179, 168, 600, 17, SUAVE, lineas[0], "middle")}
  ${texto(179, 190, 600, 17, SUAVE, lineas[1], "middle")}`);
  }
};
