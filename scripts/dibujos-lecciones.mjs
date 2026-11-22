// Los dibujos de las lecciones, como SVG. `node scripts/generar-dibujos.mjs` los convierte en las imágenes de src/imagenes/
// (dibujo-<id>-claro.webp y dibujo-<id>-oscuro.webp). Cada dibujo se pinta con la paleta del tema: { tarjeta, texto, suave },
// los mismos colores de --tarjeta, --texto y --suave de src/estilos.css. El fondo es el de la tarjeta, así que la imagen se funde con ella.
// `ancho` y `alto` son los de la imagen, el doble de los de pantalla para que se vea nítida en un móvil.
//
// Son imágenes y no SVG dentro de la página porque el navegador de algunos móviles oscurece por su cuenta los SVG
// incrustados (se probó) pero no las imágenes.
export const PALETAS = {
  claro: { tarjeta: "#ffffff", texto: "#1f2740", suave: "#59607f" },
  oscuro: { tarjeta: "#18213a", texto: "#ecebf5", suave: "#a8afcb" }
};

const TIPO = "font-family=\"Figtree, sans-serif\"";

// Qué eliges tú en cada modo: cuadro lleno = lo eliges tú; discontinuo = lo elige la cámara. La columna Av va con borde.
const MODOS = ["Auto", "P", "Tv", "Av", "M"];
const FILAS = [["Apertura", [0, 0, 0, 1, 1]], ["Tiempo", [0, 0, 1, 0, 1]], ["ISO", [0, 1, 1, 1, 1]]];
const COLUMNA_AV = MODOS.indexOf("Av");

const modos = ({ tarjeta, texto, suave }) => {
  const x = (i) => 96 + i * 58, y = (r) => 80 + r * 48;
  const celda = (i, r, lleno) => lleno
    ? `<rect x="${x(i) - 14}" y="${y(r) - 14}" width="28" height="28" rx="6" fill="${texto}"/><path d="M${x(i) - 6} ${y(r)}l4.5 4.5 8-9" fill="none" stroke="${tarjeta}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<rect x="${x(i) - 13}" y="${y(r) - 13}" width="26" height="26" rx="6" fill="none" stroke="${suave}" stroke-width="2" stroke-dasharray="3 3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 358 196" width="716" height="392">
  <rect width="358" height="196" fill="${tarjeta}"/>
  ${MODOS.map((m, i) => `<text x="${x(i)}" y="30" text-anchor="middle" ${TIPO} font-weight="800" font-size="20" fill="${texto}">${m}</text>`).join("\n  ")}
  ${FILAS.map(([nombre, v], r) => `<text x="2" y="${y(r) + 6}" ${TIPO} font-weight="600" font-size="17" fill="${suave}">${nombre}</text>\n  ` + v.map((lleno, i) => celda(i, r, lleno)).join("")).join("\n  ")}
  <rect x="${x(COLUMNA_AV) - 28}" y="44" width="56" height="150" rx="14" fill="none" stroke="${texto}" stroke-width="2.5"/>
</svg>`;
};

// Lo que da y lo que cuesta cada ajuste: tres columnas (apertura, tiempo, ISO), cada una con su valor bajo y su valor alto y un icono.
const COLUMNAS = [
  { titulo: "Apertura", filas: [["f/2,8", "fondo borroso", "abierta"], ["f/11", "todo nítido", "cerrada"]] },
  { titulo: "Tiempo", filas: [["1/500 s", "congela", "quieto"], ["1 s", "todo se mueve", "estela"]] },
  { titulo: "ISO", filas: [["100", "limpia", "limpia"], ["3200", "con grano", "grano"]] }
];
// Puntos del grano (posiciones fijas dentro de un cuadrado de 36 × 36)
const GRANO = [[5, 6], [14, 4], [27, 7], [31, 15], [9, 17], [20, 13], [33, 28], [24, 24], [6, 29], [15, 31], [28, 33], [18, 22], [11, 10], [3, 22]];

const icono = (tipo, cx, cy, { tarjeta, texto, suave }) => {
  if (tipo === "abierta" || tipo === "cerrada") { // el diafragma visto de frente: un agujero grande o uno pequeño
    return `<circle cx="${cx}" cy="${cy}" r="18" fill="${texto}"/><circle cx="${cx}" cy="${cy}" r="${tipo === "abierta" ? 12 : 4.5}" fill="${tarjeta}"/>`;
  }
  if (tipo === "quieto") return `<circle cx="${cx + 10}" cy="${cy}" r="8" fill="${texto}"/>`; // un punto nítido
  if (tipo === "estela") { // el mismo punto arrastrado: una estela que se difumina hacia atrás
    return `<defs><linearGradient id="estela" x1="0" x2="1"><stop offset="0" stop-color="${texto}" stop-opacity="0"/><stop offset="1" stop-color="${texto}" stop-opacity=".85"/></linearGradient></defs><rect x="${cx - 30}" y="${cy - 8}" width="48" height="16" rx="8" fill="url(#estela)"/><circle cx="${cx + 10}" cy="${cy}" r="8" fill="${texto}"/>`;
  }
  const x = cx - 18, y = cy - 18, cuadro = `<rect x="${x}" y="${y}" width="36" height="36" rx="6" fill="${suave}" opacity=".3"/>`; // el sensor: liso o con grano
  return tipo === "limpia" ? cuadro : cuadro + GRANO.map(([dx, dy], i) => `<circle cx="${x + dx}" cy="${y + dy}" r="${i % 3 === 0 ? 2.4 : 1.8}" fill="${texto}"/>`).join("");
};

const exposicion = (paleta) => {
  const { tarjeta, texto, suave } = paleta;
  const cx = (c) => 62 + c * 117, y0 = [44, 156]; // el centro de cada columna y dónde empieza cada fila
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 358 258" width="716" height="516">
  <rect width="358" height="258" fill="${tarjeta}"/>
  ${COLUMNAS.map((c, i) => `<text x="${cx(i)}" y="26" text-anchor="middle" ${TIPO} font-weight="800" font-size="20" fill="${texto}">${c.titulo}</text>`).join("\n  ")}
  <line x1="12" y1="${y0[1] - 13}" x2="346" y2="${y0[1] - 13}" stroke="${suave}" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round" opacity=".7"/>
  ${COLUMNAS.map((c, i) => c.filas.map(([valor, efecto, tipo], r) => `${icono(tipo, cx(i), y0[r] + 22, paleta)}
  <text x="${cx(i)}" y="${y0[r] + 66}" text-anchor="middle" ${TIPO} font-weight="800" font-size="21" fill="${texto}">${valor}</text>
  <text x="${cx(i)}" y="${y0[r] + 86}" text-anchor="middle" ${TIPO} font-weight="600" font-size="16" fill="${suave}">${efecto}</text>`).join("\n  ")).join("\n  ")}
</svg>`;
};

// Un objetivo visto de lado, sin y con parasol. La luz de lado (a rayas, desde arriba) llega al cristal sin parasol y se corta con él;
// la luz de frente (línea llena, gris) entra en los dos.
const parasol = ({ tarjeta, texto, suave }) => {
  const punta = (x, y, ux, uy, color) => { // punta de flecha con la punta en (x, y), mirando hacia (ux, uy)
    const bx = x - ux * 10, by = y - uy * 10, nx = -uy * 5.5, ny = ux * 5.5;
    return `<path d="M${x} ${y}L${(bx + nx).toFixed(1)} ${(by + ny).toFixed(1)}L${(bx - nx).toFixed(1)} ${(by - ny).toFixed(1)}z" fill="${color}"/>`;
  };
  const LADO = { fin: [98, 106], paso: [160, 36] }; // la luz de lado va de `paso` (arriba a la derecha) al borde del cristal
  const u = (() => { const dx = LADO.fin[0] - LADO.paso[0], dy = LADO.fin[1] - LADO.paso[1], n = Math.hypot(dx, dy); return [dx / n, dy / n]; })();
  const panel = (x0, titulo, conParasol, lineas) => {
    const X = (x) => x0 + x;
    const cuerpo = `<text x="${X(85)}" y="26" text-anchor="middle" ${TIPO} font-weight="800" font-size="19" fill="${texto}">${titulo}</text>
  <rect x="${X(0)}" y="92" width="18" height="76" rx="5" fill="${suave}" opacity=".35"/>
  <rect x="${X(18)}" y="100" width="78" height="60" rx="6" fill="none" stroke="${texto}" stroke-width="2.5"/>
  <path d="M${X(96)} 104V156" stroke="${texto}" stroke-width="5" stroke-linecap="round"/>
  <path d="M${X(166)} 130H${X(108)}" stroke="${suave}" stroke-width="2.5" stroke-linecap="round"/>${punta(X(104), 130, -1, 0, suave)}`;
    const parasolSvg = conParasol ? `<path d="M${X(96)} 100L${X(140)} 80M${X(96)} 160L${X(140)} 180" fill="none" stroke="${texto}" stroke-width="2.5" stroke-linecap="round"/>` : "";
    // Sin parasol, la luz de lado llega al cristal y se cuela (con un destello dentro); con parasol, se para en su borde
    const corte = conParasol ? [110, 93] : LADO.fin;
    const lado = `<path d="M${X(LADO.paso[0])} ${LADO.paso[1]}L${X(corte[0])} ${corte[1]}" stroke="${texto}" stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="round"/>`
      + (conParasol
        ? `<path d="M${X(corte[0]) - u[1] * 7} ${corte[1] + u[0] * 7}L${X(corte[0]) + u[1] * 7} ${corte[1] - u[0] * 7}" stroke="${texto}" stroke-width="3.5" stroke-linecap="round"/>`
        : punta(X(corte[0]), corte[1], u[0], u[1], texto)
          + `<path d="M${X(82)} 118h12M${X(88)} 112v12M${X(83.5)} 113.5l9 9M${X(92.5)} 113.5l-9 9" stroke="${texto}" stroke-width="2" stroke-linecap="round"/>`);
    return `${cuerpo}\n  ${parasolSvg}\n  ${lado}\n  ${lineas.map((l, i) => `<text x="${X(85)}" y="${200 + i * 19}" text-anchor="middle" ${TIPO} font-weight="600" font-size="16" fill="${suave}">${l}</text>`).join("\n  ")}`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 358 232" width="716" height="464">
  <rect width="358" height="232" fill="${tarjeta}"/>
  ${panel(4, "Sin parasol", false, ["la luz de lado", "llega al cristal"])}
  ${panel(184, "Con parasol", true, ["la luz de lado", "se corta antes"])}
  <line x1="179" y1="14" x2="179" y2="222" stroke="${suave}" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round" opacity=".7"/>
</svg>`;
};

// Dos fotos del mismo atardecer, según dónde se toque en el móvil: tocando lo claro (el cielo) el cielo conserva el color y el suelo queda oscuro;
// tocando lo oscuro (el suelo) se ve el suelo y el cielo sale casi blanco. Los colores de las escenas son los mismos en claro y oscuro
// (son fotos); el marco, el marcador del toque y los textos usan la paleta del tema.
const toca = ({ tarjeta, texto, suave }) => {
  const escena = (x0, id, titulo, lineas, c) => {
    const x = x0 + 15, y = 40, an = 140, al = 108;
    const marcador = (mx, my, lado) => `<rect x="${mx}" y="${my}" width="${lado}" height="${lado}" rx="3" fill="none" stroke="#1f2740" stroke-width="4.5"/><rect x="${mx}" y="${my}" width="${lado}" height="${lado}" rx="3" fill="none" stroke="#ffffff" stroke-width="2.5"/>`;
    return `<text x="${x0 + 85}" y="24" text-anchor="middle" ${TIPO} font-weight="800" font-size="19" fill="${texto}">${titulo}</text>
  <defs><linearGradient id="cielo-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cielo[0]}"/><stop offset="1" stop-color="${c.cielo[1]}"/></linearGradient><clipPath id="marco-${id}"><rect x="${x}" y="${y}" width="${an}" height="${al}" rx="14"/></clipPath></defs>
  <g clip-path="url(#marco-${id})">
    <rect x="${x}" y="${y}" width="${an}" height="${al}" fill="url(#cielo-${id})"/>
    <circle cx="${x + 100}" cy="${y + 56}" r="${c.sol[0]}" fill="${c.sol[1]}"/>
    <rect x="${x}" y="${y + 70}" width="${an}" height="${al - 70}" fill="${c.suelo}"/>
    <path d="M${x + 8} ${y + 70}l9-22 9 22zM${x + 26} ${y + 70}l7-16 7 16zM${x + 50} ${y + 70}l10-26 10 26z" fill="${c.sombra}"/>
  </g>
  <rect x="${x}" y="${y}" width="${an}" height="${al}" rx="14" fill="none" stroke="${texto}" stroke-width="2.5"/>
  ${marcador(...c.toque)}
  ${lineas.map((l, i) => `<text x="${x0 + 85}" y="${177 + i * 20}" text-anchor="middle" ${TIPO} font-weight="600" font-size="17" fill="${suave}">${l}</text>`).join("\n  ")}`;
  };
  // Tocando lo claro: cielo con color, suelo oscuro. Tocando lo oscuro: suelo claro y con detalle, cielo casi blanco.
  const A = { cielo: ["#e8743c", "#ffc27a"], sol: [11, "#fff1c2"], suelo: "#262a42", sombra: "#181b2e", toque: [4 + 15 + 44, 40 + 8, 34] };
  const B = { cielo: ["#fdf2dd", "#fffaf0"], sol: [13, "#ffffff"], suelo: "#7d819c", sombra: "#4b4f69", toque: [184 + 15 + 52, 40 + 74, 32] };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 358 232" width="716" height="464">
  <rect width="358" height="232" fill="${tarjeta}"/>
  ${escena(4, "a", "Tocas lo claro", ["el cielo conserva", "el color"], A)}
  ${escena(184, "b", "Tocas lo oscuro", ["se ve el suelo,", "el cielo casi blanco"], B)}
  <line x1="179" y1="14" x2="179" y2="222" stroke="${suave}" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round" opacity=".7"/>
</svg>`;
};

export const DIBUJOS_SVG = {
  modos: { ancho: 716, alto: 392, svg: modos },
  exposicion: { ancho: 716, alto: 516, svg: exposicion },
  parasol: { ancho: 716, alto: 464, svg: parasol },
  toca: { ancho: 716, alto: 464, svg: toca }
};
