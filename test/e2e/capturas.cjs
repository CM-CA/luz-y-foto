// Genera capturas de la pantalla Hoy (atardecer con la receta abierta) a 320, 360 y 390 px de ancho, en modo claro y oscuro,
// con todo simulado y el reloj fijo. Sirven para revisar el responsive a ojo; no se comparan con nada ni se guardan en el repositorio.
//
// Uso: node test/e2e/capturas.cjs [carpeta-de-salida]    (por defecto, test/e2e/capturas/, que git ignora; antes: npm run build)
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { nuevaPagina, ejecutar, ok, titulo } = require("./ayudas.cjs");

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };
const SALIDA = path.join(__dirname, "capturas");

// Hace las seis capturas (320, 360 y 390 px, claro y oscuro) de la pantalla Hoy que hay en `hoy` y las guarda en `salida`
async function capturar(b, hoy, salida) {
  fs.mkdirSync(salida, { recursive: true });
  for (const esquema of ["claro", "oscuro"]) {
    for (const ancho of [320, 360, 390]) {
      titulo(esquema + " " + ancho + " px");
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 800 }, colorScheme: esquema === "claro" ? "light" : "dark", perfil: PERFIL, lugar: LUGAR });
      await p.goto(hoy); await p.waitForSelector(".veredicto");
      await p.click("[data-tab=atardecer]");
      await p.click("#receta summary");
      await p.waitForTimeout(300);
      const fichero = path.join(salida, `hoy-atardecer-${ancho}-${esquema}.png`);
      await p.screenshot({ path: fichero, fullPage: true });
      const desborda = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      ok(fs.existsSync(fichero), path.basename(fichero) + (desborda ? " (la página desborda en horizontal)" : ""));
      await ctx.close();
    }
  }
}

module.exports = { capturar, SALIDA };

if (require.main === module) {
  const salida = path.resolve(process.argv[2] || SALIDA);
  ejecutar("capturas", ({ b, hoy }) => capturar(b, hoy, salida));
}
