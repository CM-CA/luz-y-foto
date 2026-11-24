// Un plato visto desde tres ángulos: desde arriba (1), una pizza vista de frente, para los platos planos; a unos 45° (2), un cuenco en perspectiva,
// un buen punto de partida; y de lado (3), una hamburguesa de perfil, para los platos altos. Es un esquema, no una foto de comida.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 3, lineas: 6 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 108, fh = 82;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const f = (n) => +n.toFixed(1);
    // Cada plato se dibuja en las coordenadas del marco (0..108 de ancho, 0..82 de alto); `X` y `Y` lo colocan en la página
    const pizza = (X, Y) => {
      const cortes = [0, 1, 2, 3, 4, 5].map((k) => `M${X(54)} ${Y(41)}L${f(X(54) + 22 * Math.cos((k * Math.PI) / 3))} ${f(Y(41) + 22 * Math.sin((k * Math.PI) / 3))}`).join("");
      const adornos = [[46, 34], [62, 36], [50, 50], [64, 48], [40, 44]].map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="3" fill="${TINTA}" opacity=".55"/>`).join("");
      return `<circle cx="${X(54)}" cy="${Y(41)}" r="30" fill="${SUAVE}" opacity=".25" stroke="${TINTA}" stroke-width="2.5"/>
    <circle cx="${X(54)}" cy="${Y(41)}" r="22" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="${cortes}" stroke="${TINTA}" stroke-width="1.5" opacity=".6" fill="none"/>
    ${adornos}`;
    };
    const cuenco = (X, Y) => `<ellipse cx="${X(54)}" cy="${Y(56)}" rx="38" ry="15" fill="${SUAVE}" opacity=".25" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(34)} ${Y(40)}Q${X(34)} ${Y(64)} ${X(54)} ${Y(64)}Q${X(74)} ${Y(64)} ${X(74)} ${Y(40)}Z" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="${X(54)}" cy="${Y(40)}" rx="20" ry="7" fill="${SUAVE}" opacity=".7" stroke="${TINTA}" stroke-width="2.5"/>
    <ellipse cx="${X(54)}" cy="${Y(39)}" rx="12" ry="4" fill="${TINTA}" opacity=".35"/>`;
    const hamburguesa = (X, Y) => `<ellipse cx="${X(54)}" cy="${Y(66)}" rx="38" ry="5" fill="${SUAVE}" opacity=".25" stroke="${TINTA}" stroke-width="2.5"/>
    <rect x="${X(30)}" y="${Y(57)}" width="48" height="9" rx="4" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="2.5"/>
    <rect x="${X(28)}" y="${Y(49)}" width="52" height="8" rx="4" fill="${TINTA}" opacity=".55" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${X(30)} ${Y(49)}C${X(30)} ${Y(22)} ${X(78)} ${Y(22)} ${X(78)} ${Y(49)}Z" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${X(46)}" cy="${Y(36)}" r="1.4" fill="${TINTA}" opacity=".6"/><circle cx="${X(54)}" cy="${Y(33)}" r="1.4" fill="${TINTA}" opacity=".6"/><circle cx="${X(62)}" cy="${Y(37)}" r="1.4" fill="${TINTA}" opacity=".6"/>`;
    const escena = (fx, id, plato) => `<defs><clipPath id="dib-comida-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-comida-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    ${plato((x) => fx + x, (y) => fy + y)}
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 12, 114, n, 10)}${texto(fx + 30, 120, 700, 16, TINTA, rotulo)}${texto(fx + 4, 148, 600, 15, SUAVE, l1)}${texto(fx + 4, 168, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", pizza)}
  ${escena(125, "b", cuenco)}
  ${escena(242, "c", hamburguesa)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(125, 2, rotulos[1], lineas[2], lineas[3])}
  ${columna(242, 3, rotulos[2], lineas[4], lineas[5])}`);
  }
};
