// La versión COMPILADA es una app instalable (PWA): manifiesto e iconos correctos bajo /luz-y-foto/beta/.
// (El service worker y el uso sin conexión se prueban en sin-conexion.e2e.cjs.)
//
// Antes: npm run build -- --base=/luz-y-foto/beta/
// Ejecutar: node test/e2e/compilada/pwa.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

// Ancho y alto de un PNG, leídos de su cabecera
const medidasPng = (bytes) => ({ ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) });

ejecutar("pwa", async ({ b, base }) => {
  const { ctx, p } = await nuevaPagina(b, { permisos: false });
  await p.goto(base); await p.waitForSelector("[data-testid=aviso-beta]");

  titulo("el manifiesto está enlazado y es válido");
  const enlace = await p.locator("link[rel=manifest]").getAttribute("href");
  ok(enlace === "/luz-y-foto/beta/manifest.webmanifest", "enlace bajo la ruta base: " + enlace);
  const respuesta = await ctx.request.get(new URL(enlace, base).href);
  ok(respuesta.status() === 200, "responde 200");
  const m = await respuesta.json();
  ok(m.name === "Luz y foto" && m.short_name === "Luz y foto", "nombre: " + m.name + " / " + m.short_name);
  ok(m.lang === "es" && m.display === "standalone", "idioma «" + m.lang + "» y se abre como app (" + m.display + ")");
  const raiz = new URL(base).pathname;
  ok(new URL(m.start_url, new URL(enlace, base)).pathname === raiz, "start_url vuelve a la app: " + m.start_url);
  ok(new URL(m.scope, new URL(enlace, base)).pathname === raiz, "scope es la carpeta de la app: " + m.scope);
  ok(/^#[0-9a-f]{6}$/i.test(m.theme_color) && /^#[0-9a-f]{6}$/i.test(m.background_color), "colores de barra y de arranque: " + m.theme_color + " / " + m.background_color);

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
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
