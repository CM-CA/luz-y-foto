// La misma calle de noche, dos veces: la prueba rápida (ISO alto y tiempo corto: con grano, el coche es un punto de luz) y la foto final
// (ISO bajo y tiempo largo: limpia, y el coche deja una estela). Una flecha lleva de una a otra. Es un esquema, no una calle real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // El grano de la prueba: puntos repartidos siempre igual (no al azar) para que el dibujo no cambie de una vez a otra
    const grano = (fx) => Array.from({ length: 46 }, (_, i) => `<circle cx="${fx + 6 + ((i * 47) % 138)}" cy="${fy + 6 + ((i * 29 + i * i) % 92)}" r="1.1" fill="${TINTA}" opacity=".5"/>`).join("");
    // Edificios con ventanas encendidas y una calle abajo; `final` pinta la estela del coche y `!final` el grano y un punto de luz
    const escena = (fx, id, final) => `<defs><clipPath id="dib-nocturna-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-nocturna-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx + 10}" y="${fy + 34}" width="24" height="46" fill="${SUAVE}" opacity=".5"/>
    <rect x="${fx + 38}" y="${fy + 20}" width="28" height="60" fill="${SUAVE}" opacity=".5"/>
    <rect x="${fx + 70}" y="${fy + 40}" width="22" height="40" fill="${SUAVE}" opacity=".5"/>
    <rect x="${fx + 108}" y="${fy + 26}" width="28" height="54" fill="${SUAVE}" opacity=".5"/>
    <rect x="${fx + 16}" y="${fy + 42}" width="5" height="5" fill="${TINTA}" opacity=".85"/><rect x="${fx + 24}" y="${fy + 56}" width="5" height="5" fill="${TINTA}" opacity=".85"/>
    <rect x="${fx + 46}" y="${fy + 30}" width="5" height="5" fill="${TINTA}" opacity=".85"/><rect x="${fx + 55}" y="${fy + 48}" width="5" height="5" fill="${TINTA}" opacity=".85"/><rect x="${fx + 46}" y="${fy + 64}" width="5" height="5" fill="${TINTA}" opacity=".85"/>
    <rect x="${fx + 77}" y="${fy + 52}" width="5" height="5" fill="${TINTA}" opacity=".85"/>
    <rect x="${fx + 114}" y="${fy + 36}" width="5" height="5" fill="${TINTA}" opacity=".85"/><rect x="${fx + 124}" y="${fy + 56}" width="5" height="5" fill="${TINTA}" opacity=".85"/>
    <rect x="${fx}" y="${fy + 80}" width="${fw}" height="${fh - 80}" fill="${SUAVE}" opacity=".3"/>
    ${final
      ? `<path d="M${fx + 8} ${fy + 94} Q${fx + 70} ${fy + 84} ${fx + 142} ${fy + 88}" fill="none" stroke="${TINTA}" stroke-width="4" stroke-linecap="round" opacity=".9"/><path d="M${fx + 8} ${fy + 99} Q${fx + 70} ${fy + 90} ${fx + 142} ${fy + 94}" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`
      : `${grano(fx)}<circle cx="${fx + 104}" cy="${fy + 90}" r="3.5" fill="${TINTA}"/>`}
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", false)}
  ${escena(200, "b", true)}
  <path d="M164 62H192M185 55L193 62L185 69" fill="none" stroke="${TINTA}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
