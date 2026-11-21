// Maquetación de la versión compilada: nada se sale de la pantalla ni de su tarjeta en móvil, en modo claro y oscuro.
//
// Sustituye a la prueba de capturas frente a la web anterior (que sirvió para demostrar que la migración se veía
// igual, con un 0,014 % de píxeles distintos) en cuanto el responsive empezó a cambiar el aspecto a propósito.
//
// Ejecutar: node test/e2e/compilada/maquetacion.e2e.cjs   (antes: npm run build -- --base=/luz-y-foto/beta/)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };
const ANCHOS = [320, 360, 390, 480, 600, 800];

ejecutar("maquetacion", async ({ b, base }) => {
  for (const genero of ["atardecer", "luna"]) {
    titulo("«" + genero + "»: nada se sale de la pantalla ni de la tarjeta");
    for (const esquema of ["light", "dark"]) {
      for (const ancho of ANCHOS) {
        const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 800 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
        await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
        await p.click("[data-tab=" + genero + "]");
        await p.click("#receta summary");
        await p.click("#reglas summary");
        const r = await p.evaluate(() => {
          const panel = document.querySelector("#panel").getBoundingClientRect();
          const fuera = [...document.querySelectorAll("#panel table, #panel .veredicto, #panel details, #panel .capas, #panel .avisos, #panel .brujula, #panel .luna-cab")]
            .filter((e) => e.getBoundingClientRect().right > panel.right + 0.5).map((e) => e.className || e.tagName);
          return { pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, fuera };
        });
        ok(r.pagina <= 0 && r.fuera.length === 0, ancho + " px, " + esquema + (r.pagina > 0 ? " (la página desborda " + r.pagina + " px)" : "") + (r.fuera.length ? " (fuera de la tarjeta: " + r.fuera.join(", ") + ")" : ""));
        ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
        await ctx.close();
      }
    }
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
