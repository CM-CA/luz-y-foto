// El mismo edificio dos veces: con la cámara inclinada hacia arriba las verticales se juntan (1) y con la cámara a nivel son rectas y
// paralelas (2). Las rayas discontinuas alargan las paredes por arriba para que se vea hacia dónde van. Es un esquema, no un edificio real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104, arriba = fy + 28, abajo = fy + 100, tope = fy - 20;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const f = (n) => +n.toFixed(1);
    // `inclinado`: las dos paredes se juntan hacia arriba 12 px por cada lado (y las ventanas con ellas); si no, son rectas y paralelas
    const escena = (fx, id, inclinado) => {
      const estrecha = inclinado ? 12 : 0;
      const resto = (y) => estrecha * (1 - (y - arriba) / (abajo - arriba)), ajuste = inclinado ? 2 : 0;
      const izq = (y) => fx + 42 + resto(y) - ajuste;
      const der = (y) => fx + 108 - resto(y) + ajuste;
      const ventanas = [0, 1, 2, 3].flatMap((r) => {
        const y = fy + 38 + r * 15, ancho = der(y) - izq(y);
        return [0.2, 0.5, 0.8].map((c) => `<rect x="${f(izq(y) + ancho * c - ancho * 0.06)}" y="${f(y)}" width="${f(ancho * 0.12)}" height="8" fill="${TINTA}" opacity=".55"/>`);
      }).join("");
      const alargar = (x, pendiente) => `M${f(x)} ${arriba}L${f(x + pendiente * (arriba - tope))} ${tope}`;
      const pendiente = estrecha / (abajo - arriba);
      return `<defs><clipPath id="dib-arquitectura-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-arquitectura-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <polygon points="${f(izq(arriba))},${arriba} ${f(der(arriba))},${arriba} ${f(der(abajo))},${abajo} ${f(izq(abajo))},${abajo}" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    ${ventanas}
    <path d="${alargar(izq(arriba), pendiente)}${alargar(der(arriba), -pendiente)}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", true)}
  ${escena(200, "b", false)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
