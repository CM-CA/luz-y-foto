// La regla de los tercios en una sola foto: una persona con la cabeza en un cruce de la cuadrícula (1), el horizonte sobre una de las líneas
// horizontales y no en el medio (2) y espacio libre al otro lado de la persona (3). Es un esquema, no una foto real.
import { envolver, raya, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { filas: 3, lineas: 2 },
  pintar({ filas, lineas }) {
    const fx = 8, fy = 10, fw = 190, fh = 130;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const fila = (n, y, rotulo) => `${marca(220, y, n)}${texto(238, y + 6, 700, 16, TINTA, rotulo)}`;
    const f = (n) => +n.toFixed(1);
    const t1 = fx + fw / 3, t2 = fx + (2 * fw) / 3, h1 = fy + fh / 3, h2 = fy + (2 * fh) / 3;
    const cruces = [[t1, h1], [t2, h1], [t1, h2], [t2, h2]].map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="${SUAVE}" opacity=".8"/>`).join("");
    return envolver(358, 208, `<defs><clipPath id="dib-composicion-marco"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-composicion-marco)">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${f(h2)}" width="${fw}" height="${f(fy + fh - h2)}" fill="${SUAVE}" opacity=".35"/>
    ${raya(f(t1), fy, f(t1), fy + fh)}${raya(f(t2), fy, f(t2), fy + fh)}${raya(fx, f(h1), fx + fw, f(h1))}${raya(fx, f(h2), fx + fw, f(h2))}
    ${cruces}
    <circle cx="${f(t1)}" cy="${f(h1)}" r="9" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <path d="M${f(t1 - 14)} ${f(h1 + 12)}Q${f(t1)} ${f(h1 + 8)} ${f(t1 + 14)} ${f(h1 + 12)}L${f(t1 + 11)} ${f(h2 + 22)}H${f(t1 - 11)}Z" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marca(f(t1 + 24), f(h1 - 6), 1, 9)}${marca(f(t2 + 28), f(h2 + 14), 2, 9)}${marca(f(t2 + 16), f(h1 + 4), 3, 9)}
  ${fila(1, 44, filas[0])}${fila(2, 78, filas[1])}${fila(3, 112, filas[2])}
  ${texto(179, 168, 600, 17, SUAVE, lineas[0], "middle")}
  ${texto(179, 190, 600, 17, SUAVE, lineas[1], "middle")}`);
  }
};
