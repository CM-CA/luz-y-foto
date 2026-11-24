// Tres histogramas, uno al lado del otro: una foto oscura (las barras se pegan a la izquierda y la primera se corta contra el borde), una bien
// repartida (una montaña en el centro que no toca los bordes) y una clara (a la derecha, con la última cortada). Debajo de cada uno, las sombras
// a la izquierda y las luces a la derecha. Es un esquema, no el histograma de una foto real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

// Alturas de las barras (de 0 a 1), de izquierda a derecha. En la oscura y en la clara, la barra del borde llega alta: está cortada.
const OSCURA = [1, 0.92, 0.8, 0.64, 0.48, 0.34, 0.22, 0.14, 0.09, 0.06, 0.04, 0.03, 0.02, 0.01, 0, 0, 0, 0];
const REPARTIDA = [0, 0.05, 0.14, 0.28, 0.42, 0.56, 0.66, 0.7, 0.62, 0.5, 0.42, 0.34, 0.26, 0.17, 0.09, 0.03, 0, 0];
const CLARA = [...OSCURA].reverse();

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 3, ejes: 2, lineas: 6 },
  pintar({ rotulos, ejes, lineas }) {
    const fy = 10, fw = 108, fh = 82, base = fy + fh - 5, tope = fh - 14;
    const f = (n) => +n.toFixed(1);
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const grafico = (fx, id, alturas, cortada) => {
      const ancho = (fw - 8) / alturas.length;
      const barras = alturas.map((a, i) => {
        if (a <= 0) return "";
        const h = a * tope, x = fx + 4 + i * ancho;
        const borde = cortada === "izq" ? i === 0 : cortada === "der" ? i === alturas.length - 1 : false;
        return `<rect x="${f(x)}" y="${f(base - h)}" width="${f(ancho - 1)}" height="${f(h)}" fill="${borde ? TINTA : SUAVE}" opacity="${borde ? 0.95 : 0.6}"/>`;
      }).join("");
      return `<defs><clipPath id="dib-histograma-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-histograma-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    ${barras}
    <path d="M${fx + 4} ${base + 0.5}H${fx + fw - 4}" stroke="${TINTA}" stroke-width="1.5" opacity=".6"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${texto(fx + 2, fy + fh + 18, 600, 13, SUAVE, ejes[0])}${texto(fx + fw - 2, fy + fh + 18, 600, 13, SUAVE, ejes[1], "end")}`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 12, 144, n, 10)}${texto(fx + 30, 150, 700, 17, TINTA, rotulo)}${texto(fx + 4, 172, 600, 15, SUAVE, l1)}${texto(fx + 4, 192, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${grafico(8, "a", OSCURA, "izq")}
  ${grafico(125, "b", REPARTIDA, null)}
  ${grafico(242, "c", CLARA, "der")}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(125, 2, rotulos[1], lineas[2], lineas[3])}
  ${columna(242, 3, rotulos[2], lineas[4], lineas[5])}`);
  }
};
