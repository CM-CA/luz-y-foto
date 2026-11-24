// Un perro de lado y una cámara, dos veces: con la cámara arriba, apuntando hacia abajo, la foto mira al perro desde lejos (1); con la cámara
// a la altura de su cabeza, la foto se acerca a él (2). Es un esquema, no un perro real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // `alto`: la cámara va arriba y la línea de puntos baja hasta la cabeza del perro; si no, va a su altura y la línea es recta
    const escena = (fx, id, alto) => {
      const cy = alto ? fy + 22 : fy + 66;
      const linea = alto ? `M${fx + 34} ${cy}L${fx + 66} ${fy + 62}` : `M${fx + 34} ${cy}H${fx + 64}`;
      return `<defs><clipPath id="dib-mascotas-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-mascotas-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <path d="M${fx + 6} ${fy + 92}H${fx + 144}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M${fx + 88} ${fy + 84}V${fy + 92}M${fx + 96} ${fy + 84}V${fy + 92}M${fx + 110} ${fy + 84}V${fy + 92}M${fx + 118} ${fy + 84}V${fy + 92}M${fx + 122} ${fy + 70}Q${fx + 134} ${fy + 66} ${fx + 132} ${fy + 54}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <rect x="${fx + 84}" y="${fy + 64}" width="38" height="20" rx="9" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <circle cx="${fx + 78}" cy="${fy + 66}" r="10" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <path d="M${fx + 72} ${fy + 58}L${fx + 68} ${fy + 50}L${fx + 78} ${fy + 56}" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
    <circle cx="${fx + 73}" cy="${fy + 65}" r="2" fill="${TINTA}"/>
    <rect x="${fx + 8}" y="${cy - 8}" width="22" height="16" rx="3" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="2.5"/>
    <circle cx="${fx + 19}" cy="${cy}" r="4.5" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="${linea}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>
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
