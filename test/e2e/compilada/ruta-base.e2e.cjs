// La versión COMPILADA (dist/) debe funcionar publicada bajo /ollada/, como en GitHub Pages:
// todos sus archivos se cargan desde esa ruta, lee los datos incluidos y no se sale de la pantalla.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/ruta-base.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

ejecutar("compilada", async ({ b, base }) => {
  titulo("carga bajo /ollada/ sin errores ni archivos que falten");
  const { ctx, p } = await nuevaPagina(b, { permisos: false });
  const respuestas = [];
  p.on("response", (r) => { if (r.url().startsWith(base)) respuestas.push([r.status(), r.url().slice(base.length)]); });
  await p.goto(base); await p.waitForSelector("[data-tab]");
  ok(respuestas.length >= 3 && respuestas.every(([estado]) => estado === 200), "todos los archivos responden 200: " + respuestas.map((r) => r.join(" ")).join(", "));
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));

  titulo("lee los datos incluidos en la compilación");
  const pestanas = await p.locator("[data-tab]").allInnerTexts();
  ok(pestanas.join(",") === "Amanecer,Atardecer,Noche", "pestañas desde data/es/generos.json: " + pestanas.join(", "));

  titulo("sin aviso de vista previa");
  ok(await p.locator("[data-testid=aviso-beta]").count() === 0, "la raíz no lleva el aviso de vista previa");

  titulo("ruta desconocida");
  await p.goto(base + "#/nada");
  ok(/No encuentro esa pantalla/.test(await p.locator("main").innerText()), "avisa en lugar de quedarse en blanco");
  await ctx.close();

  for (const ancho of [320, 360, 390]) {
    titulo("sin desbordamiento horizontal a " + ancho + " px (claro y oscuro)");
    for (const esquema of ["light", "dark"]) {
      const { ctx: c, p: q } = await nuevaPagina(b, { permisos: false, viewport: { width: ancho, height: 800 }, colorScheme: esquema });
      await q.goto(base); await q.waitForSelector("[data-tab]");
      const desborda = await q.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      ok(!desborda, ancho + " px, " + esquema);
      await c.close();
    }
  }
}, { carpeta: dist, prefijo: "/ollada/" });
