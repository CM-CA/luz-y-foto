// Un retrato de lado: una ventana deja pasar una luz suave sobre la persona (1), un cuadrado de enfoque marca el ojo (2) y detrás, a cierta
// distancia, el fondo sale borroso (3). Es un esquema, no una persona real.
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
    <clipPath id="dib-retrato-marco"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath>
    <filter id="dib-retrato-borroso" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <g clip-path="url(#dib-retrato-marco)">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <g filter="url(#dib-retrato-borroso)" fill="${SUAVE}" opacity=".6"><circle cx="${X(152)}" cy="${Y(32)}" r="18"/><circle cx="${X(174)}" cy="${Y(66)}" r="12"/><circle cx="${X(146)}" cy="${Y(70)}" r="11"/></g>
    <rect x="${X(10)}" y="${Y(14)}" width="34" height="52" rx="3" fill="${SUAVE}" opacity=".45" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(27)} ${Y(14)}V${Y(66)}M${X(10)} ${Y(40)}H${X(44)}" stroke="${TINTA}" stroke-width="2" fill="none"/>
    <path d="M${X(48)} ${Y(24)}L${X(72)} ${Y(50)}M${X(48)} ${Y(42)}L${X(68)} ${Y(60)}M${X(48)} ${Y(60)}L${X(66)} ${Y(70)}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>
    <path d="M${X(60)} ${Y(130)}Q${X(60)} ${Y(92)} ${X(92)} ${Y(92)}Q${X(124)} ${Y(92)} ${X(124)} ${Y(130)}Z" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${X(92)}" cy="${Y(62)}" r="20" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <circle cx="${X(84)}" cy="${Y(58)}" r="2.6" fill="${TINTA}"/>
    <rect x="${X(75)}" y="${Y(49)}" width="18" height="18" rx="2" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(130)} ${Y(114)}H${X(178)}M${X(136)} ${Y(108)}L${X(130)} ${Y(114)}L${X(136)} ${Y(120)}M${X(172)} ${Y(108)}L${X(178)} ${Y(114)}L${X(172)} ${Y(120)}" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marca(X(27), Y(86), 1, 9)}${marca(X(62), Y(30), 2, 9)}${marca(X(162), Y(92), 3, 9)}
  ${fila(1, 44, filas[0])}${fila(2, 78, filas[1])}${fila(3, 112, filas[2])}
  ${texto(179, 168, 600, 17, SUAVE, lineas[0], "middle")}
  ${texto(179, 190, 600, 17, SUAVE, lineas[1], "middle")}`);
  }
};
