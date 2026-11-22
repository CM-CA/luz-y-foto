// La versión COMPILADA es una app instalable (PWA): manifiesto e iconos correctos bajo /luz-y-foto/.
// (El service worker y el uso sin conexión se prueban en sin-conexion.e2e.cjs.)
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/pwa.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

// Ancho y alto de un PNG, leídos de su cabecera
const medidasPng = (bytes) => ({ ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) });

ejecutar("pwa", async ({ b, base }) => {
  const { ctx, p } = await nuevaPagina(b, { permisos: false });
  await p.goto(base); await p.waitForSelector("[data-tab]");

  titulo("el manifiesto está enlazado y es válido");
  const enlace = await p.locator("link[rel=manifest]").getAttribute("href");
  ok(enlace === "/luz-y-foto/manifest.webmanifest", "enlace bajo la ruta base: " + enlace);
  const respuesta = await ctx.request.get(new URL(enlace, base).href);
  ok(respuesta.status() === 200, "responde 200");
  const m = await respuesta.json();
  ok(m.name === "Luz y foto" && m.short_name === "Luz y foto", "nombre: " + m.name + " / " + m.short_name);
  ok(m.lang === "es" && m.display === "standalone", "idioma «" + m.lang + "» y se abre como app (" + m.display + ")");
  const raiz = new URL(base).pathname;
  ok(new URL(m.start_url, new URL(enlace, base)).pathname === raiz, "start_url vuelve a la app: " + m.start_url);
  ok(new URL(m.scope, new URL(enlace, base)).pathname === raiz, "scope es la carpeta de la app: " + m.scope);
  ok(/^#[0-9a-f]{6}$/i.test(m.theme_color) && /^#[0-9a-f]{6}$/i.test(m.background_color), "colores de barra y de arranque: " + m.theme_color + " / " + m.background_color);
  ok(m.theme_color === "#f3eff4" && m.background_color === "#f3eff4", "los colores son el fondo claro de «La luz de ahora»: " + m.theme_color + " / " + m.background_color);

  titulo("iconos: existen, son PNG del tamaño que dicen y hay uno «maskable»");
  const iconos = m.icons.filter((i) => i.type === "image/png");
  const aporta = (tam, proposito) => iconos.some((i) => i.sizes === tam && i.purpose === proposito);
  ok(aporta("192x192", "any") && aporta("512x512", "any"), "192 y 512 px normales");
  ok(aporta("512x512", "maskable"), "512 px «maskable» (se adapta a la forma que use el móvil)");
  for (const i of iconos) {
    const r = await ctx.request.get(new URL(i.src, new URL(enlace, base)).href);
    const cuerpo = await r.body();
    const { ancho, alto } = medidasPng(cuerpo);
    ok(r.status() === 200 && r.headers()["content-type"] === "image/png" && i.sizes === ancho + "x" + alto, i.src + " (" + i.purpose + "): " + ancho + "×" + alto);
  }

  titulo("icono de la pantalla de inicio de iOS y color de la barra");
  const apple = await p.locator("link[rel=apple-touch-icon]").getAttribute("href");
  const ra = await ctx.request.get(new URL(apple, base).href);
  const medidas = medidasPng(await ra.body());
  ok(ra.status() === 200 && medidas.ancho === 180 && medidas.alto === 180, "apple-touch-icon 180×180: " + apple);
  const colores = await p.locator("meta[name=theme-color]").evaluateAll((e) => e.map((x) => x.media + " " + x.content));
  ok(colores.length === 2 && colores.some((c) => /light/.test(c)) && colores.some((c) => /dark/.test(c)), "theme-color claro y oscuro: " + colores.join(" | "));
  ok(colores.some((c) => /light.* #f3eff4$/.test(c)) && colores.some((c) => /dark.* #0f1626$/.test(c)), "y son los fondos claro (#f3eff4) y oscuro (#0f1626) de la web: " + colores.join(" | "));

  titulo("los iconos llevan la paleta nueva (fondo azul noche, sol naranja)");
  const pixeles = await p.evaluate(async (urls) => {
    const leer = async (url, x, y) => {
      const imagen = new Image();
      await new Promise((resolver, rechazar) => { imagen.onload = resolver; imagen.onerror = rechazar; imagen.src = url; });
      const lienzo = document.createElement("canvas"); lienzo.width = imagen.width; lienzo.height = imagen.height;
      const c = lienzo.getContext("2d"); c.drawImage(imagen, 0, 0);
      return [...c.getImageData(x, y, 1, 1).data];
    };
    // En el de 192 px el dibujo se amplía por 3: el fondo, arriba en el centro; el sol, que asoma sobre el horizonte, en (96, 100)
    return { fondo: await leer(urls.icono, 96, 8), sol: await leer(urls.icono, 96, 100) };
  }, { icono: new URL("icon-192.png", base).href });
  const cerca = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 2);
  ok(cerca(pixeles.fondo.slice(0, 3), [0x1f, 0x27, 0x40]), "icon-192.png: fondo #1f2740 (" + pixeles.fondo.join(",") + ")");
  ok(cerca(pixeles.sol.slice(0, 3), [0xee, 0x7d, 0x2f]), "icon-192.png: sol #ee7d2f (" + pixeles.sol.join(",") + ")");
  const favicon = await (await ctx.request.get(new URL("favicon.svg", base).href)).text();
  ok(/#1f2740/i.test(favicon) && /#ee7d2f/i.test(favicon) && /#7f9be0/i.test(favicon) && !/#1d2b44|#f5a623|#8fb4ff/i.test(favicon), "favicon.svg con los mismos colores");

  titulo("presupuesto de peso: fuentes e imágenes caben en 260 000 bytes y todas están en la lista de archivos del service worker");
  const archivos = [];
  const recorrer = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const ruta = path.join(dir, e.name); if (e.isDirectory()) recorrer(ruta); else if (/\.(woff2|webp)$/.test(e.name)) archivos.push(ruta); } };
  recorrer(dist);
  const total = archivos.reduce((suma, a) => suma + fs.statSync(a).size, 0);
  ok(archivos.length >= 30 && total < 260000, archivos.length + " archivos .woff2 y .webp, " + total + " bytes (límite 260 000)");
  const sw = fs.readFileSync(path.join(dist, "sw.js"), "utf8");
  const lista = JSON.parse(/const ARCHIVOS = (\[[\s\S]*?\]);/.exec(sw)[1]);
  const sinCachear = archivos.map((a) => path.relative(dist, a).split(path.sep).join("/")).filter((a) => !lista.includes(a));
  ok(sinCachear.length === 0, "todos van en la caché del service worker (" + (sinCachear.length ? "faltan: " + sinCachear.join(", ") : lista.length + " archivos en la lista") + ")");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
