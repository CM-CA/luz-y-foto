// Dos fotos de la misma calle de noche con una farola: en la primera, muy clara, la luz se quema (una mancha blanca sin detalle); en la segunda,
// con el brillo más bajo, se ve la farola y el detalle de su luz, y lo oscuro se queda oscuro. Los colores de las escenas son los mismos en claro y
// oscuro (son fotos); el marco y los textos usan los del tema.
import { envolver, raya, texto, SUAVE, TINTA } from "./util.js";

const escena = (x0, id, titulo, lineas, quemada) => {
  const x = x0 + 15, y = 40, an = 140, al = 108;
  const fx = x + 92, fy = y + 38; // la farola
  const ventanas = [[12, 62], [26, 62], [12, 76], [40, 76], [104, 66], [118, 66], [104, 80], [26, 90]].map(([u, v]) => `<rect x="${x + u}" y="${y + v}" width="8" height="8" fill="#ffd27a" opacity="${quemada ? 0.95 : 0.8}"/>`).join("");
  const luz = quemada
    ? `<circle cx="${fx}" cy="${fy}" r="38" fill="#ffffff" opacity=".35"/><circle cx="${fx}" cy="${fy}" r="26" fill="#ffffff"/>`
    : `<circle cx="${fx}" cy="${fy}" r="14" fill="#ffd9a0" opacity=".3"/><circle cx="${fx}" cy="${fy}" r="6" fill="#fff4d6"/>`;
  return `${texto(x0 + 85, 24, 800, 19, TINTA, titulo, "middle")}
  <defs><linearGradient id="dib-luces-cielo-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${quemada ? "#2a3156" : "#0c1020"}"/><stop offset="1" stop-color="${quemada ? "#3a4170" : "#161b34"}"/></linearGradient><clipPath id="dib-luces-marco-${id}"><rect x="${x}" y="${y}" width="${an}" height="${al}" rx="14"/></clipPath></defs>
  <g clip-path="url(#dib-luces-marco-${id})">
    <rect x="${x}" y="${y}" width="${an}" height="${al}" fill="url(#dib-luces-cielo-${id})"/>
    <path d="M${x} ${y + 100}V${y + 58}H${x + 52}V${y + 70}H${x + 78}V${y + 52}H${x + an}V${y + 100}Z" fill="${quemada ? "#14172b" : "#080a14"}"/>
    <rect x="${x}" y="${y + 90}" width="${an}" height="${al - 90}" fill="${quemada ? "#1d2140" : "#0c0f1d"}"/>
    ${ventanas}
    <path d="M${fx} ${fy}V${y + 98}" stroke="${quemada ? "#0b0d1a" : "#04050b"}" stroke-width="3.5"/>
    ${luz}
  </g>
  <rect x="${x}" y="${y}" width="${an}" height="${al}" rx="14" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${lineas.map((l, i) => texto(x0 + 85, 177 + i * 20, 600, 17, SUAVE, l, "middle")).join("\n  ")}`;
};

export default {
  ancho: 358, alto: 232,
  claves: { claro: null, lineasClaro: 2, oscuro: null, lineasOscuro: 2 },
  pintar({ claro, lineasClaro, oscuro, lineasOscuro }) {
    return envolver(358, 232, `${escena(4, "a", claro, lineasClaro, true)}\n  ${escena(184, "b", oscuro, lineasOscuro, false)}\n  ${raya(179, 14, 179, 222)}`);
  }
};
