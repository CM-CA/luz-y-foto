// Genera las imágenes de los dibujos de las lecciones (src/imagenes/dibujo-<id>-claro.webp y -oscuro.webp)
// a partir de los SVG de scripts/dibujos-lecciones.mjs.
//
//   node scripts/generar-dibujos.mjs
//
// Hace falta solo cuando cambia un dibujo. Los WebP se guardan en el repositorio, así que la compilación y Actions no necesitan
// ejecutarlo. Solo usa el Chromium de Playwright. La letra de la app (Figtree) se incrusta en cada SVG para que el texto
// salga igual que en la página: el Chromium de este guion no la tiene instalada.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { DIBUJOS_SVG, PALETAS } from "./dibujos-lecciones.mjs";
import { svgAWebp } from "./svg-a-webp.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const salida = path.join(raiz, "src", "imagenes");
fs.mkdirSync(salida, { recursive: true });

const CALIDAD = 0.85;
const FIGTREE = fs.readFileSync(path.join(raiz, "src", "fuentes", "figtree-latin-wght-normal.woff2")).toString("base64");
const conFuente = (svg) => svg.replace(/<svg[^>]*>/, (apertura) => apertura
  + `<style>@font-face{font-family:"Figtree";font-weight:300 900;src:url(data:font/woff2;base64,${FIGTREE}) format("woff2")}</style>`);

const navegador = await chromium.launch();
const medidas = {}; // lo que mide cada dibujo en pantalla (la mitad de la imagen), para que la página le reserve su sitio antes de cargarla
try {
  const pagina = await navegador.newPage();
  for (const [id, dibujo] of Object.entries(DIBUJOS_SVG)) {
    medidas[id] = { ancho: dibujo.ancho / 2, alto: dibujo.alto / 2 };
    for (const [tema, paleta] of Object.entries(PALETAS)) {
      const bytes = Buffer.from(await svgAWebp(pagina, conFuente(dibujo.svg(paleta)), dibujo.ancho, dibujo.alto, CALIDAD), "base64");
      const archivo = "dibujo-" + id + "-" + tema + ".webp";
      fs.writeFileSync(path.join(salida, archivo), bytes);
      console.log("escrito src/imagenes/" + archivo + " (" + dibujo.ancho + " × " + dibujo.alto + ", " + bytes.length + " bytes)");
    }
  }
  fs.writeFileSync(path.join(salida, "dibujos.json"), JSON.stringify(medidas, null, 2) + "\n");
  console.log("escrito src/imagenes/dibujos.json (medidas en pantalla)");
} finally { await navegador.close(); }
