// Genera las imágenes de la cabecera (src/imagenes/cielo-*.webp) y las 16 fases de la luna (src/imagenes/luna-00.webp … luna-15.webp)
// a partir de los dibujos de scripts/escenas-cielo.mjs.
//
//   node scripts/generar-cielos.mjs
//
// Hace falta solo cuando cambia un dibujo. Los WebP resultantes se guardan en el repositorio, así que la compilación
// y Actions no necesitan ejecutarlo. Solo usa el Chromium de Playwright: él dibuja el SVG y lo codifica a WebP.
//
// Los cielos son imágenes y no dibujos dentro de la página porque el navegador de algunos móviles oscurece por su cuenta
// los SVG incrustados (se probó) pero no las imágenes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ESCENAS, lunaSvg } from "./escenas-cielo.mjs";

const salida = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "imagenes");
fs.mkdirSync(salida, { recursive: true });

const ANCHO = 780, ALTO = 524, CALIDAD = 0.8;

// Dibuja un SVG en un lienzo del tamaño dado (con fondo transparente) y lo devuelve codificado en WebP (base64)
export async function svgAWebp(pagina, svg, ancho, alto, calidad = CALIDAD) {
  return pagina.evaluate(async ({ svg, ancho, alto, calidad }) => {
    const imagen = new Image();
    await new Promise((resolver, rechazar) => { imagen.onload = resolver; imagen.onerror = () => rechazar(new Error("no se pudo leer el SVG")); imagen.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const lienzo = document.createElement("canvas"); lienzo.width = ancho; lienzo.height = alto;
    lienzo.getContext("2d").drawImage(imagen, 0, 0, ancho, alto);
    const blob = await new Promise((r) => lienzo.toBlob(r, "image/webp", calidad));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let texto = ""; for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(texto);
  }, { svg, ancho, alto, calidad });
}

const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  for (const [id, svg] of Object.entries(ESCENAS)) {
    const bytes = Buffer.from(await svgAWebp(pagina, svg, ANCHO, ALTO), "base64");
    const archivo = "cielo-" + id + ".webp";
    fs.writeFileSync(path.join(salida, archivo), bytes);
    console.log("escrito src/imagenes/" + archivo + " (" + ANCHO + " × " + ALTO + ", " + bytes.length + " bytes)");
  }

  // Las 16 fases de la luna: 132 × 132 con fondo transparente (WebP con alfa). Cada archivo debe quedarse por debajo de 4 000 bytes.
  let demasiado = 0;
  for (let i = 0; i < 16; i++) {
    const bytes = Buffer.from(await svgAWebp(pagina, lunaSvg(i), 132, 132), "base64");
    const archivo = "luna-" + String(i).padStart(2, "0") + ".webp";
    fs.writeFileSync(path.join(salida, archivo), bytes);
    console.log("escrito src/imagenes/" + archivo + " (132 × 132, " + bytes.length + " bytes)");
    if (bytes.length >= 4000) { demasiado++; console.log("  DEMASIADO GRANDE: debe pesar menos de 4 000 bytes"); }
  }
  if (demasiado) process.exitCode = 1;
} finally { await navegador.close(); }
