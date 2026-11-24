// La misma escena encuadrada dos veces: de lejos (1: sobra espacio y un poste se cuela por el borde) y de cerca (2: la persona llena la foto
// y no hay nada más). Un rectángulo discontinuo en la primera marca lo que enseña la segunda. Es un esquema, no una foto real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const f = (n) => +n.toFixed(1);
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // La escena se dibuja en coordenadas locales (u, v) de la foto de lejos y se lleva a cada marco con la escala `s` y el origen (ox, oy)
    // `estorbos`: el poste y la rama, que solo están en la foto de lejos (la de cerca los deja fuera del marco)
    const escena = (fx, id, s, ox, oy, estorbos) => {
      const X = (u) => f(ox + u * s), Y = (v) => f(oy + v * s);
      return `<defs><clipPath id="dib-encuadre-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-encuadre-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${Y(74)}" width="${fw}" height="${f(fy + fh - oy - 74 * s)}" fill="${SUAVE}" opacity=".3"/>
    ${estorbos ? `<rect x="${X(124)}" y="${Y(0)}" width="${f(7 * s)}" height="${f(fh * s)}" fill="${SUAVE}" opacity=".6" stroke="${TINTA}" stroke-width="2"/>
    <path d="M${X(0)} ${Y(12)}Q${X(18)} ${Y(14)} ${X(26)} ${Y(4)}M${X(12)} ${Y(13)}Q${X(16)} ${Y(22)} ${X(24)} ${Y(24)}" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round"/>` : ""}
    <circle cx="${X(55)}" cy="${Y(42)}" r="${f(5 * s)}" fill="${SUAVE}" opacity=".6" stroke="${TINTA}" stroke-width="3"/>
    <path d="M${X(47)} ${Y(53)}Q${X(55)} ${Y(49)} ${X(63)} ${Y(53)}L${X(61)} ${Y(78)}H${X(49)}Z" fill="${SUAVE}" opacity=".6" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const s2 = fw / 72;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", 1, 8, fy, true)}
  <rect x="${8 + 19}" y="${fy + 32}" width="72" height="50" rx="3" fill="none" stroke="${TINTA}" stroke-width="2" stroke-dasharray="4 4" opacity=".8"/>
  ${escena(200, "b", s2, 200 - 19 * s2, fy - 32 * s2, false)}
  <path d="M164 62H192M185 55L193 62L185 69" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
