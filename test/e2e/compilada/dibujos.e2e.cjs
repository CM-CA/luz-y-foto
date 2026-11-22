// Los dibujos de las lecciones (SVG con texto dentro de la página): en cada idioma de data/ y en cada tema, a 320 px, el dibujo se ve, ningún
// texto se sale de su viewBox ni pisa a otro, y su nombre accesible es el texto alternativo de su bloque.
//
// Ejecutar: node test/e2e/compilada/dibujos.e2e.cjs   (antes: npm run build)
// Con E2E_CAPTURAS=carpeta guarda una captura de cada dibujo (idioma, lección y tema) para mirarlas.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

if (!fs.existsSync(path.join(RAIZ, "dist", "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const leer = (...ruta) => JSON.parse(fs.readFileSync(path.join(RAIZ, "data", ...ruta), "utf8"));
const IDIOMAS = fs.readdirSync(path.join(RAIZ, "data"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const LOCALE = { es: "es-ES", en: "en-US" };
const CAPTURAS = process.env.E2E_CAPTURAS ? path.resolve(process.env.E2E_CAPTURAS) : null;
if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });

// Los dibujos de las lecciones de un idioma, en orden: [id de la lección, bloque del dibujo, posición del dibujo dentro de la lección (0, 1…)]
const conDibujo = (idioma) => leer(idioma, "lecciones.json").grupos.flatMap((g) => g.lecciones).flatMap((id) => leer(idioma, "lecciones", id + ".json").bloques.filter((b) => b.tipo === "dibujo").map((b, k) => [id, b, k]));

ejecutar("dibujos", async ({ b, base }) => {
  for (const idioma of IDIOMAS) {
    for (const [esquema, tema] of [["light", "claro"], ["dark", "oscuro"]]) {
      titulo(idioma + ", tema " + tema + ": cada dibujo se ve, sus textos caben y su nombre accesible es su texto alternativo (320 px)");
      const { ctx, p } = await nuevaPagina(b, { locale: LOCALE[idioma] || idioma, colorScheme: esquema, viewport: { width: 320, height: 800 }, lugar: LUGAR });
      const lecciones = conDibujo(idioma);
      ok(lecciones.length === 10, idioma + ": diez dibujos en las lecciones (" + lecciones.length + ")");
      for (const [id, bloque, k] of lecciones) {
        const nombreDibujo = id + (k ? " (dibujo " + (k + 1) + ")" : "");
        await p.goto(base + "#/aprender/" + id); await p.waitForSelector("figure.dibujo svg");
        await p.evaluate(() => document.fonts.ready);
        const r = await p.evaluate((k) => {
          const figura = document.querySelectorAll("figure.dibujo")[k], svg = figura.querySelector("svg"), caja = svg.getBoundingClientRect();
          const [, , vw, vh] = svg.getAttribute("viewBox").split(" ").map(Number);
          const textos = [...svg.querySelectorAll("text")].map((t) => { const c = t.getBBox(); return { texto: t.textContent, x: c.x, y: c.y, w: c.width, h: c.height }; });
          const fuera = textos.filter((t) => t.x < 0 || t.y < 0 || t.x + t.w > vw || t.y + t.h > vh).map((t) => "«" + t.texto + "» (" + Math.round(t.x) + ".." + Math.round(t.x + t.w) + " de " + vw + ")");
          // Dos textos se pisan si sus cajas se cruzan más de 1 unidad en horizontal y más de 4 en vertical (la caja de un texto incluye el aire
          // de la letra, y dos líneas seguidas se rozan unas unidades sin que se toquen los trazos)
          const pisan = [];
          for (let i = 0; i < textos.length; i++) for (let j = i + 1; j < textos.length; j++) {
            const a = textos[i], c = textos[j];
            if (Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x) > 1 && Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y) > 4) pisan.push("«" + a.texto + "» con «" + c.texto + "»");
          }
          return { fuente: document.fonts.check("700 17px Figtree"), letra: getComputedStyle(svg.querySelector("text")).fontFamily, nombre: figura.querySelector("[role=img]").getAttribute("aria-label"),
            ancho: caja.width, derecha: caja.right, pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, n: textos.length, fuera, pisan };
        }, k);
        ok(r.ancho > 100 && r.derecha <= 320 && r.pagina <= 0, nombreDibujo + ": se ve y cabe en 320 px (" + Math.round(r.ancho) + " px de ancho, la página no desborda)");
        ok(r.fuente && /Figtree/.test(r.letra), nombreDibujo + ": con la letra de la app (" + r.letra + ")");
        ok(r.n >= 4 && r.fuera.length === 0, nombreDibujo + ": ningún texto se sale del dibujo (" + r.n + " textos" + (r.fuera.length ? "; fuera: " + r.fuera.join(", ") : "") + ")");
        ok(r.pisan.length === 0, nombreDibujo + ": ningún texto pisa a otro" + (r.pisan.length ? " (" + r.pisan.join("; ") + ")" : ""));
        ok(r.nombre === bloque.alt, nombreDibujo + ": su nombre accesible es el texto alternativo del bloque");
        if (CAPTURAS) await p.locator("figure.dibujo").nth(k).screenshot({ path: path.join(CAPTURAS, "dibujo-" + idioma + "-" + id + (k ? "-" + (k + 1) : "") + "-" + tema + ".png") });
      }
      ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
      await ctx.close();
    }
  }
});
