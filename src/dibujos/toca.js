// Dos fotos del mismo atardecer, según dónde se toque en el móvil: tocando lo claro (el cielo) el cielo conserva el color y el suelo queda oscuro;
// tocando lo oscuro (el suelo) se ve el suelo y el cielo sale casi blanco. Los colores de las escenas son los mismos en claro y oscuro
// (son fotos, y el marcador del toque va también con colores fijos, para verse sobre cualquier foto); el marco y los textos usan los del tema.
import { envolver, raya, texto, SUAVE, TINTA } from "./util.js";

const escena = (x0, id, titulo, lineas, c) => {
  const x = x0 + 15, y = 40, an = 140, al = 108;
  const marcador = (mx, my, lado) => `<rect x="${mx}" y="${my}" width="${lado}" height="${lado}" rx="3" fill="none" stroke="#1f2740" stroke-width="4.5"/><rect x="${mx}" y="${my}" width="${lado}" height="${lado}" rx="3" fill="none" stroke="#ffffff" stroke-width="2.5"/>`;
  return `${texto(x0 + 85, 24, 800, 19, TINTA, titulo, "middle")}
  <defs><linearGradient id="dib-toca-cielo-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cielo[0]}"/><stop offset="1" stop-color="${c.cielo[1]}"/></linearGradient><clipPath id="dib-toca-marco-${id}"><rect x="${x}" y="${y}" width="${an}" height="${al}" rx="14"/></clipPath></defs>
  <g clip-path="url(#dib-toca-marco-${id})">
    <rect x="${x}" y="${y}" width="${an}" height="${al}" fill="url(#dib-toca-cielo-${id})"/>
    <circle cx="${x + 100}" cy="${y + 56}" r="${c.sol[0]}" fill="${c.sol[1]}"/>
    <rect x="${x}" y="${y + 70}" width="${an}" height="${al - 70}" fill="${c.suelo}"/>
    <path d="M${x + 8} ${y + 70}l9-22 9 22zM${x + 26} ${y + 70}l7-16 7 16zM${x + 50} ${y + 70}l10-26 10 26z" fill="${c.sombra}"/>
  </g>
  <rect x="${x}" y="${y}" width="${an}" height="${al}" rx="14" fill="none" stroke="${TINTA}" stroke-width="2.5"/>
  ${marcador(...c.toque)}
  ${lineas.map((l, i) => texto(x0 + 85, 177 + i * 20, 600, 17, SUAVE, l, "middle")).join("\n  ")}`;
};

// Tocando lo claro: cielo con color, suelo oscuro. Tocando lo oscuro: suelo claro y con detalle, cielo casi blanco.
const A = { cielo: ["#e8743c", "#ffc27a"], sol: [11, "#fff1c2"], suelo: "#262a42", sombra: "#181b2e", toque: [4 + 15 + 44, 40 + 8, 34] };
const B = { cielo: ["#fdf2dd", "#fffaf0"], sol: [13, "#ffffff"], suelo: "#7d819c", sombra: "#4b4f69", toque: [184 + 15 + 52, 40 + 74, 32] };

export default {
  ancho: 358, alto: 232,
  claves: { tocasClaro: null, lineasClaro: 2, tocasOscuro: null, lineasOscuro: 2 },
  pintar({ tocasClaro, lineasClaro, tocasOscuro, lineasOscuro }) {
    return envolver(358, 232, `${escena(4, "a", tocasClaro, lineasClaro, A)}\n  ${escena(184, "b", tocasOscuro, lineasOscuro, B)}\n  ${raya(179, 14, 179, 222)}`);
  }
};
