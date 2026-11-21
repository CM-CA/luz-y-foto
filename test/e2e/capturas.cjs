// Genera las capturas de referencia de la pantalla Hoy (atardecer con la receta abierta)
// a 320, 360 y 390 px de ancho, en modo claro y oscuro, con todo simulado y el reloj fijo.
//
// Sirven para comprobar que la versión nueva se ve igual (fase 3 de la migración) y para revisar
// el responsive. Las de `referencia/` se hicieron con la web ANTES de migrar y reflejan sus
// defectos conocidos (por ejemplo, la tabla de horas se sale de la tarjeta en móvil).
//
// Uso: node test/e2e/capturas.cjs [carpeta-de-salida]    (por defecto, test/e2e/referencia)
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { nuevaPagina, ejecutar, ok, titulo } = require("./ayudas.cjs");

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };
const REFERENCIA = path.join(__dirname, "referencia");

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

module.exports = { capturar, REFERENCIA };

if (require.main === module) {
  const salida = path.resolve(process.argv[2] || REFERENCIA);
  ejecutar("capturas", ({ b, hoy }) => capturar(b, hoy, salida));
}
