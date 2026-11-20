// La versión COMPILADA (dist/) debe funcionar publicada bajo /luz-y-foto/beta/, como en GitHub Pages:
// todos sus archivos se cargan desde esa ruta, lee los datos incluidos y no se sale de la pantalla.
//
// Antes: npm run build -- --base=/luz-y-foto/beta/
// Ejecutar: node test/e2e/compilada/ruta-base.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

ejecutar("compilada", async ({ b, base }) => {
  titulo("carga bajo /luz-y-foto/beta/ sin errores ni archivos que falten");
  const { ctx, p } = await nuevaPagina(b, { permisos: false });
  const respuestas = [];
  p.on("response", (r) => { if (r.url().startsWith(base)) respuestas.push([r.status(), r.url().slice(base.length)]); });
  await p.goto(base); await p.waitForSelector("[data-testid=aviso-beta]");
  ok(respuestas.length >= 3 && respuestas.every(([estado]) => estado === 200), "todos los archivos responden 200: " + respuestas.map((r) => r.join(" ")).join(", "));
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));

  titulo("lee los datos incluidos en la compilación");
  const pestanas = await p.locator("[data-tab]").allInnerTexts();
  ok(pestanas.join(",") === "Atardecer,Luna", "pestañas desde data/generos.json: " + pestanas.join(", "));

  titulo("enlace a la versión actual");
  const href = await p.locator("[data-testid=aviso-beta] a").getAttribute("href");
  ok(new URL(href, base).pathname === "/luz-y-foto/prueba/hoy.html", "apunta a la versión actual: " + href);

  titulo("ruta desconocida");
  await p.goto(base + "#/nada");
  ok(/No encuentro esa pantalla/.test(await p.locator("main").innerText()), "avisa en lugar de quedarse en blanco");
  await ctx.close();

  for (const ancho of [320, 360, 390]) {
    titulo("sin desbordamiento horizontal a " + ancho + " px (claro y oscuro)");
    for (const esquema of ["light", "dark"]) {
      const { ctx: c, p: q } = await nuevaPagina(b, { permisos: false, viewport: { width: ancho, height: 800 }, colorScheme: esquema });
      await q.goto(base); await q.waitForSelector("[data-testid=aviso-beta]");
      const desborda = await q.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      ok(!desborda, ancho + " px, " + esquema);
      await c.close();
    }
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
