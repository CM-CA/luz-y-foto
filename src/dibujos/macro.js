// Tres flores en fila, vistas de lado, con la cámara a la izquierda. Con la apertura abierta (1) la franja nítida es fina y solo la del medio
// cae dentro; con la apertura cerrada (2) la franja es más ancha y caben las tres. Es un esquema, no un campo real.
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 2, lineas: 4 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 150, fh = 104;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    // `banda`: lo ancho de la franja nítida, centrada en la flor del medio. Las flores dentro de ella van con trazo firme; las de fuera, discontinuas y pálidas.
    const escena = (fx, id, banda) => {
      const flores = [60, 92, 124].map((dx) => {
        const x = fx + dx, nitida = Math.abs(dx - 92) <= banda / 2;
        const trazo = nitida ? `stroke="${TINTA}" stroke-width="2.5"` : `stroke="${TINTA}" stroke-width="2" stroke-dasharray="3 3" opacity=".45"`;
        return `<path d="M${x} ${fy + 94}V${fy + 62}" ${trazo} fill="none" stroke-linecap="round"/>
    <circle cx="${x}" cy="${fy + 52}" r="9" fill="${SUAVE}" fill-opacity="${nitida ? 0.55 : 0.2}" ${trazo}/>
    <circle cx="${x}" cy="${fy + 52}" r="3" fill="${TINTA}" opacity="${nitida ? 1 : 0.35}"/>`;
      }).join("\n    ");
      return `<defs><clipPath id="dib-macro-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-macro-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    <rect x="${fx + 92 - banda / 2}" y="${fy + 14}" width="${banda}" height="76" fill="${SUAVE}" opacity=".3" stroke="${TINTA}" stroke-width="1.5" stroke-dasharray="3 4" stroke-opacity=".6"/>
    ${flores}
    <rect x="${fx + 8}" y="${fy + 40}" width="22" height="16" rx="3" fill="${SUAVE}" opacity=".55" stroke="${TINTA}" stroke-width="2.5"/>
    <circle cx="${fx + 19}" cy="${fy + 48}" r="4.5" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 16, 136, n)}${texto(fx + 34, 142, 700, 17, TINTA, rotulo)}${texto(fx + 4, 164, 600, 15, SUAVE, l1)}${texto(fx + 4, 184, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", 16)}
  ${escena(200, "b", 80)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(200, 2, rotulos[1], lineas[2], lineas[3])}`);
  }
};
