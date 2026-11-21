// Genera los iconos de la app (public/icon-*.png y public/apple-touch-icon.png) a partir del dibujo de public/favicon.svg.
//
//   node scripts/generar-iconos.mjs
//
// Hace falta solo cuando cambia el dibujo o los colores. Los PNG resultantes se guardan en el repositorio,
// así que la compilación y Actions no necesitan ejecutarlo. Usa el Chromium de Playwright para dibujar.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const publico = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

// Los colores de «La luz de ahora»: azul noche del cielo, sol naranja y la línea del horizonte en azul de la hora azul
const FONDO = "#1f2740", SOL = "#ee7d2f", LINEA = "#7f9be0";

// El dibujo (sol que se pone sobre una línea de horizonte) en un lienzo de 64 × 64, centrado en (32, 35.5)
const dibujo = `
  <circle cx="32" cy="38" r="14" fill="${SOL}"/>
  <rect x="8" y="38" width="48" height="18" fill="${FONDO}"/>
  <path d="M8 44h48" stroke="${LINEA}" stroke-width="3" stroke-linecap="round"/>`;

// `escala` achica el dibujo alrededor de su centro: los iconos «maskable» deben dejar un margen,
// porque el sistema los recorta (círculo, gota…) y solo garantiza el 80 % central.
const svg = ({ redondeado, escala }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" ${redondeado ? 'rx="14"' : ""} fill="${FONDO}"/>
  <g transform="translate(32 35.5) scale(${escala}) translate(-32 -35.5)">${dibujo}</g>
</svg>`;

const iconos = [
  { archivo: "icon-192.png", lado: 192, redondeado: true, escala: 1 },
  { archivo: "icon-512.png", lado: 512, redondeado: true, escala: 1 },
  { archivo: "icon-maskable-512.png", lado: 512, redondeado: false, escala: 0.78 },
  { archivo: "apple-touch-icon.png", lado: 180, redondeado: false, escala: 0.9 }
];

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
