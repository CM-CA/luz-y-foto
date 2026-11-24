// Una carretera recta que se junta a lo lejos, dos veces: con el punto de fuga en el centro (1, va bien con escenas simétricas) y en un cruce de
// la cuadrícula de tercios (2, más dinámico). Una persona al fondo está en el punto de fuga: las líneas la señalan. Es un esquema, no una foto real.
import { envolver, raya, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104, hor = fy + fh / 3;
    const f = (n) => +n.toFixed(1);
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // `px` es la x del punto de fuga dentro del marco; `izq` y `der` son las x de los bordes de la carretera abajo, también dentro del marco
    const escena = (fx, id, px, izq, der) => {
      const vx = fx + px, ix = fx + izq, dx = fx + der, bajo = fy + fh;
      const t1 = fx + fw / 3, t2 = fx + (2 * fw) / 3, h2 = fy + (2 * fh) / 3;
      // Los travesaños de la vía: rayas que cruzan la carretera y se van juntando hacia el punto de fuga
      const travesanos = [0.16, 0.3, 0.5, 0.76].map((t) => `<path d="M${f(vx + (ix - vx) * t)} ${f(hor + (bajo - hor) * t)}H${f(vx + (dx - vx) * t)}" stroke="${TINTA}" stroke-width="2" opacity=".55"/>`).join("");
      return `<defs><clipPath id="dib-fuga-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-fuga-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${f(hor)}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".3"/>
    ${raya(f(t1), fy, f(t1), bajo)}${raya(f(t2), fy, f(t2), bajo)}${raya(fx, f(fy + fh / 3), fx + fw, f(fy + fh / 3))}${raya(fx, f(h2), fx + fw, f(h2))}
    <polygon points="${f(vx)},${f(hor)} ${f(dx)},${bajo} ${f(ix)},${bajo}" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    ${travesanos}
    <circle cx="${f(vx)}" cy="${f(hor - 12)}" r="3.4" fill="${SUAVE}" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${f(vx)} ${f(hor - 8.5)}V${f(hor - 1)}" stroke="${TINTA}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", 75, 8, 142)}
  ${escena(200, "b", 50, -14, 108)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
