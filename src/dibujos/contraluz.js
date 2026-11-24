// La misma persona con el sol detrás, dos veces: medida para ella (1), se ve bien pero el cielo se queda en blanco, sin color; medida para el cielo
// (2), el cielo conserva su color y la persona es una silueta oscura. Los colores de las escenas son los mismos en claro y oscuro (son fotos); el
// marco y los textos usan los del tema. Es un esquema, no una foto.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // `silueta`: cielo de atardecer con color y la persona en negro; si no, el cielo quemado (casi blanco) y la persona con su color
    const escena = (fx, id, silueta) => {
      const c = silueta
        ? { cielo1: "#4a3470", cielo2: "#f08a4b", suelo: "#2b2030", cuerpo: "#08080c", cabeza: "#08080c", sol: "#ffe6a8", halo: "#ffd08a", haloOp: 0.45 }
        : { cielo1: "#fffdf4", cielo2: "#ffffff", suelo: "#c9c1ac", cuerpo: "#5d4c47", cabeza: "#c99a7a", sol: "#ffffff", halo: "#ffe9b0", haloOp: 0.85 };
      return `<defs><linearGradient id="dib-contraluz-cielo-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cielo1}"/><stop offset="1" stop-color="${c.cielo2}"/></linearGradient><clipPath id="dib-contraluz-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-contraluz-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#dib-contraluz-cielo-${id})"/>
    <rect x="${fx}" y="${fy + 84}" width="${fw}" height="${fh - 84}" fill="${c.suelo}"/>
    <circle cx="${fx + 108}" cy="${fy + 52}" r="24" fill="${c.halo}" opacity="${c.haloOp}"/>
    <circle cx="${fx + 108}" cy="${fy + 52}" r="12" fill="${c.sol}"/>
    <path d="M${fx + 34} ${fy + 104}Q${fx + 34} ${fy + 66} ${fx + 62} ${fy + 66}Q${fx + 90} ${fy + 66} ${fx + 90} ${fy + 104}Z" fill="${c.cuerpo}"/>
    <circle cx="${fx + 62}" cy="${fy + 46}" r="14" fill="${c.cabeza}"/>
    ${silueta ? "" : `<path d="M${fx + 48} ${fy + 42}Q${fx + 50} ${fy + 30} ${fx + 62} ${fy + 30}Q${fx + 74} ${fy + 30} ${fx + 76} ${fy + 42}Q${fx + 70} ${fy + 36} ${fx + 62} ${fy + 36}Q${fx + 54} ${fy + 36} ${fx + 48} ${fy + 42}Z" fill="#3a2b27"/>`}
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
