// El mismo cielo estrellado sobre una colina dos veces: con un tiempo corto las estrellas salen como puntos (1) y con un tiempo largo, como
// rayitas (2). Es un esquema, no un cielo real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const estrellas = [[26, 24], [56, 14], [84, 32], [110, 18], [126, 44], [42, 50], [98, 56], [18, 62]];
    // `rayas`: cada estrella es una rayita corta en vez de un punto
    const escena = (fx, id, rayas) => {
      const cielo = estrellas.map(([dx, dy]) => {
        const x = fx + dx, y = fy + dy;
        return rayas
          ? `<path d="M${x} ${y}l12 5" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`
          : `<circle cx="${x + 6}" cy="${y + 2.5}" r="2.3" fill="${TINTA}"/>`;
      }).join("");
      return `<defs><clipPath id="dib-astro-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-astro-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    ${cielo}
    <path d="M${fx} ${fy + 84}Q${fx + 38} ${fy + 66} ${fx + 78} ${fy + 84}T${fx + fw} ${fy + 78}V${fy + fh}H${fx}Z" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", false)}
  ${escena(200, "b", true)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
