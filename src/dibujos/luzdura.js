// La misma pelota sobre una mesa con dos luces: una fuente pequeña, como el sol (1), que deja una sombra de borde marcado, y una fuente grande,
// como una ventana o un cielo nublado (2), que deja una sombra borrosa que se funde con la luz. Es un esquema, no una foto.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const f = (n) => +n.toFixed(1);
    // `dura`: un sol pequeño con rayos y una sombra de borde limpio; si no, una ventana grande y una sombra desenfocada y más ancha
    const escena = (fx, id, dura) => {
      const fuente = dura
        ? `<circle cx="${fx + 24}" cy="${fy + 22}" r="8" fill="${TINTA}"/>
    <path d="M${fx + 24} ${fy + 8}V${fy + 5}M${fx + 24} ${fy + 36}V${fy + 39}M${fx + 10} ${fy + 22}H${fx + 7}M${fx + 38} ${fy + 22}H${fx + 41}M${fx + 14} ${fy + 12}L${fx + 12} ${fy + 10}M${fx + 34} ${fy + 12}L${fx + 36} ${fy + 10}M${fx + 14} ${fy + 32}L${fx + 12} ${fy + 34}" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`
        : `<rect x="${fx + 6}" y="${fy + 6}" width="46" height="38" rx="4" fill="${SUAVE}" opacity=".45" stroke="${TINTA}" stroke-width="2.5"/>
    <path d="M${fx + 29} ${fy + 6}V${fy + 44}M${fx + 6} ${fy + 25}H${fx + 52}" stroke="${TINTA}" stroke-width="2" fill="none"/>`;
      const rayos = dura
        ? `<path d="M${fx + 38} ${fy + 32}L${fx + 52} ${fy + 48}M${fx + 44} ${fy + 24}L${fx + 66} ${fy + 44}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>`
        : `<path d="M${fx + 52} ${fy + 14}L${fx + 62} ${fy + 38}M${fx + 52} ${fy + 26}L${fx + 66} ${fy + 44}M${fx + 52} ${fy + 38}L${fx + 72} ${fy + 52}" stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" fill="none" opacity=".6"/>`;
      const sombra = dura
        ? `<ellipse cx="${fx + 100}" cy="${fy + 88}" rx="28" ry="6" fill="${TINTA}" opacity=".6"/>`
        : `<ellipse cx="${fx + 96}" cy="${fy + 88}" rx="34" ry="8" fill="${TINTA}" opacity=".4" filter="url(#dib-luzdura-borroso)"/>`;
      return `<defs><clipPath id="dib-luzdura-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-luzdura-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${fy + 78}" width="${fw}" height="${fh - 78}" fill="${SUAVE}" opacity=".3"/>
    ${fuente}
    ${rayos}
    ${sombra}
    <circle cx="${fx + 82}" cy="${fy + 62}" r="18" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="3"/>
    <path d="M${f(fx + 74)} ${fy + 54}Q${f(fx + 78)} ${fy + 49} ${f(fx + 84)} ${fy + 48}" stroke="${TINTA}" stroke-width="2" stroke-linecap="round" fill="none" opacity=".5"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `<defs><filter id="dib-luzdura-borroso" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="4"/></filter></defs>
  ${escena(8, "a", true)}
  ${escena(200, "b", false)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
