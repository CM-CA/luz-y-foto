// Genera los iconos de la app (public/favicon.svg, public/icon-*.png y public/apple-touch-icon.png) a partir de un único dibujo.
//
//   node scripts/generar-iconos.mjs
//
// Hace falta solo cuando cambia el dibujo o los colores. Los archivos resultantes se guardan en el repositorio,
// así que la compilación y Actions no necesitan ejecutarlo. Usa el Chromium de Playwright para dibujar.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const publico = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

// Los colores de la app: azul noche del cielo (fondo), azul de la hora azul (ojo y visor), naranja del sol (iris) y un blanco cálido (destello)
const FONDO = "#1f2740", LINEA = "#7f9be0", SOL = "#ee7d2f", DESTELLO = "#fff7ea";

// El dibujo de «Ollada» (una mirada): un ojo dentro del visor de una cámara, con el iris hecho objetivo (anillo, pupila y destello),
// en un lienzo de 64 × 64 y centrado en (32, 32). A 16 px se siguen distinguiendo las cuatro esquinas, el ojo y el iris naranja.
const esquina = (x, y, dx, dy) =>
  `<path d="M${x} ${y + dy * 10}V${y}H${x + dx * 10}" fill="none" stroke="${LINEA}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
const dibujo = `
  ${esquina(8, 8, 1, 1)}${esquina(56, 8, -1, 1)}${esquina(8, 56, 1, -1)}${esquina(56, 56, -1, -1)}
  <path d="M12 32c6-9 13-13 20-13s14 4 20 13c-6 9-13 13-20 13s-14-4-20-13Z" fill="none" stroke="${LINEA}" stroke-width="2.8" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="8.8" fill="${SOL}"/>
  <circle cx="32" cy="32" r="6.1" fill="none" stroke="${FONDO}" stroke-width="1.3"/>
  <circle cx="32" cy="32" r="3.4" fill="${FONDO}"/>
  <circle cx="29.7" cy="29.7" r="1.25" fill="${DESTELLO}"/>`;

// `escala` achica el dibujo alrededor de su centro: los iconos «maskable» deben dejar un margen,
// porque el sistema los recorta (círculo, gota…) y solo garantiza el círculo central del 80 % del lado, de radio 25,6 en este lienzo:
// con 0,72 la esquina más lejana del visor (a 33,9 del centro) queda en 24,4 más medio trazo, dentro de ese círculo.
const svg = ({ redondeado, escala, medidas = true }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"${medidas ? ' width="64" height="64"' : ""}>
  <rect width="64" height="64" ${redondeado ? 'rx="14" ' : ""}fill="${FONDO}"/>
  ${escala === 1 ? dibujo.trim() : `<g transform="translate(32 32) scale(${escala}) translate(-32 -32)">${dibujo}</g>`}
</svg>`;

const iconos = [
  { archivo: "icon-192.png", lado: 192, redondeado: true, escala: 1 },
  { archivo: "icon-512.png", lado: 512, redondeado: true, escala: 1 },
  { archivo: "icon-maskable-512.png", lado: 512, redondeado: false, escala: 0.72 },
  { archivo: "apple-touch-icon.png", lado: 180, redondeado: false, escala: 0.9 }
];

// El favicon es el mismo dibujo en SVG (con las esquinas redondeadas, sin medidas fijas)
fs.writeFileSync(path.join(publico, "favicon.svg"), svg({ redondeado: true, escala: 1, medidas: false }).trimStart() + "\n");
console.log("escrito public/favicon.svg");

const navegador = await chromium.launch();
try {
  for (const i of iconos) {
    const pagina = await navegador.newPage({ viewport: { width: i.lado, height: i.lado }, deviceScaleFactor: 1 });
    await pagina.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${i.lado}px;height:${i.lado}px}</style>${svg(i)}`);
    const png = await pagina.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: i.lado, height: i.lado } });
    fs.writeFileSync(path.join(publico, i.archivo), png);
    console.log("escrito public/" + i.archivo + " (" + i.lado + " × " + i.lado + ", " + png.length + " bytes)");
    await pagina.close();
  }
} finally { await navegador.close(); }
