// Genera las imágenes de la cabecera (src/imagenes/cielo-*.webp) a partir de los dibujos de scripts/escenas-cielo.mjs.
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
import { ESCENAS } from "./escenas-cielo.mjs";

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
} finally { await navegador.close(); }
