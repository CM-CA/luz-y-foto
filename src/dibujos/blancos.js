// La misma taza blanca, tres veces: con luz de bombilla sin corregir toda la escena tira a naranja (1), con el balance de blancos bien puesto la taza
// es blanca (2) y con luz de sombra sin corregir tira a azul (3). Los colores de las escenas son los mismos en claro y oscuro (son fotos); el marco y
// los textos usan los del tema. Es un esquema, no una foto.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 3, lineas: 6 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 108, fh = 82;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const escena = (fx, id, c) => `<defs><clipPath id="dib-blancos-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-blancos-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${c.pared}"/>
    <rect x="${fx}" y="${fy + 56}" width="${fw}" height="${fh - 56}" fill="${c.mesa}"/>
    <ellipse cx="${fx + 52}" cy="${fy + 62}" rx="22" ry="4" fill="#000000" opacity=".22"/>
    <path d="M${fx + 66} ${fy + 36}Q${fx + 80} ${fy + 36} ${fx + 80} ${fy + 47}Q${fx + 80} ${fy + 58} ${fx + 66} ${fy + 58}" fill="none" stroke="${c.taza}" stroke-width="5" stroke-linecap="round"/>
    <path d="M${fx + 34} ${fy + 28}H${fx + 70}V${fy + 48}Q${fx + 70} ${fy + 62} ${fx + 52} ${fy + 62}Q${fx + 34} ${fy + 62} ${fx + 34} ${fy + 48}Z" fill="${c.taza}"/>
    <ellipse cx="${fx + 52}" cy="${fy + 28}" rx="18" ry="4" fill="${c.borde}"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 12, 114, n, 10)}${texto(fx + 30, 120, 700, 17, TINTA, rotulo)}${texto(fx + 4, 148, 600, 15, SUAVE, l1)}${texto(fx + 4, 168, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", { pared: "#e9b87c", mesa: "#b5753a", taza: "#f7cf9a", borde: "#e0a868" })}
  ${escena(125, "b", { pared: "#dcdcd8", mesa: "#9b8b79", taza: "#ffffff", borde: "#e4e4e0" })}
  ${escena(242, "c", { pared: "#a9bfe3", mesa: "#667fa6", taza: "#d6e6ff", borde: "#b4cdf2" })}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(125, 2, rotulos[1], lineas[2], lineas[3])}
  ${columna(242, 3, rotulos[2], lineas[4], lineas[5])}`);
  }
};
