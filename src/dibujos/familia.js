// Un niño jugando, visto de lado: la cámara está a la altura de su cabeza (1), la luz natural entra por una ventana (2) y unas rayitas junto al
// niño marcan que se mueve, así que hace falta un tiempo corto (3). Es un esquema, no un niño real.
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
    <clipPath id="dib-familia-marco"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath>
  </defs>
  <g clip-path="url(#dib-familia-marco)">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${X(10)}" y="${Y(12)}" width="40" height="52" rx="3" fill="${SUAVE}" opacity=".3" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(30)} ${Y(12)}V${Y(64)}M${X(10)} ${Y(38)}H${X(50)}" stroke="${TINTA}" stroke-width="2" fill="none"/>
    <path d="M${X(54)} ${Y(24)}L${X(78)} ${Y(46)}M${X(54)} ${Y(38)}L${X(76)} ${Y(56)}M${X(54)} ${Y(52)}L${X(74)} ${Y(66)}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>
    <path d="M${X(60)} ${Y(112)}H${X(150)}" stroke="${TINTA}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M${X(94)} ${Y(101)}L${X(90)} ${Y(112)}M${X(106)} ${Y(101)}L${X(112)} ${Y(112)}M${X(90)} ${Y(86)}L${X(80)} ${Y(94)}M${X(110)} ${Y(84)}L${X(122)} ${Y(72)}" stroke="${TINTA}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <rect x="${X(90)}" y="${Y(79)}" width="20" height="22" rx="6" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <circle cx="${X(100)}" cy="${Y(66)}" r="11" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <path d="M${X(66)} ${Y(88)}H${X(78)}M${X(60)} ${Y(98)}H${X(74)}M${X(68)} ${Y(106)}H${X(80)}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".7"/>
    <rect x="${X(150)}" y="${Y(58)}" width="22" height="16" rx="3" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="2.5"/>
    <circle cx="${X(161)}" cy="${Y(66)}" r="4.5" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(146)} ${Y(66)}H${X(116)}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marca(X(161), Y(42), 1, 9)}${marca(X(30), Y(80), 2, 9)}${marca(X(48), Y(98), 3, 9)}
  ${fila(1, 44, filas[0])}${fila(2, 78, filas[1])}${fila(3, 112, filas[2])}
  ${texto(179, 168, 600, 17, SUAVE, lineas[0], "middle")}
  ${texto(179, 190, 600, 17, SUAVE, lineas[1], "middle")}`);
  }
};
