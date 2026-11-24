// El mismo monumento a dos horas del día: temprano (1), con el sol bajo, la luz suave, una sombra larga y tenue y una sola persona, y a mediodía (2),
// con el sol alto, la luz dura, una sombra corta y oscura y más gente. Es un esquema, no un monumento real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104, suelo = fy + 78;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // Una persona pequeña: cabeza y cuerpo, de pie sobre el suelo en (x, y)
    const persona = (x, y) => `<circle cx="${x}" cy="${y - 8}" r="3" fill="${SUAVE}" opacity=".85" stroke="${TINTA}" stroke-width="1.5"/><rect x="${x - 3}" y="${y - 4}" width="6" height="10" rx="2" fill="${SUAVE}" opacity=".85" stroke="${TINTA}" stroke-width="1.5"/>`;
    const escena = (fx, id, temprano) => {
      const sol = temprano ? [fx + 24, fy + 58] : [fx + 122, fy + 24];
      const sombra = temprano
        ? `<polygon points="${fx + 68},${suelo} ${fx + 96},${suelo} ${fx + 144},${suelo + 10} ${fx + 116},${suelo + 10}" fill="${TINTA}" opacity=".14"/>`
        : `<polygon points="${fx + 68},${suelo} ${fx + 96},${suelo} ${fx + 90},${suelo + 6} ${fx + 62},${suelo + 6}" fill="${TINTA}" opacity=".5"/>`;
      const gente = temprano
        ? persona(fx + 38, suelo + 16)
        : [[14, 14], [32, 20], [50, 14], [108, 14], [124, 20], [138, 14]].map(([dx, dy]) => persona(fx + dx, suelo + dy)).join("");
      return `<defs><clipPath id="dib-viajes-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-viajes-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx}" y="${suelo}" width="${fw}" height="${fy + fh - suelo}" fill="${SUAVE}" opacity=".3"/>
    <circle cx="${sol[0]}" cy="${sol[1]}" r="9" fill="${SUAVE}" opacity=".6" stroke="${TINTA}" stroke-width="2.5"/>
    ${sombra}
    <polygon points="${fx + 68},${suelo} ${fx + 68},${fy + 40} ${fx + 72},${fy + 40} ${fx + 82},${fy + 8} ${fx + 92},${fy + 40} ${fx + 96},${fy + 40} ${fx + 96},${suelo}" fill="${SUAVE}" opacity=".5" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${fx + 82}" cy="${fy + 54}" r="6" fill="${FONDO}" stroke="${TINTA}" stroke-width="2"/>
    <rect x="${fx + 78}" y="${suelo - 12}" width="8" height="12" fill="${TINTA}" opacity=".55"/>
    ${gente}
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
