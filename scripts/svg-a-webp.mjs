// Dibuja un SVG con el Chromium de Playwright y lo codifica a WebP. Lo usa generar-cielos.mjs.
// Está en su propio archivo porque generar-cielos.mjs arranca un navegador nada más importarse y no se puede importar de él.
export const CALIDAD = 0.8;

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
