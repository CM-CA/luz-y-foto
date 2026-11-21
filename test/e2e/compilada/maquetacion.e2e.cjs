// Maquetación de la versión compilada: nada se sale de la pantalla ni de su tarjeta en móvil, y las barras de
// nubes se distinguen bien de su fondo, en modo claro y oscuro.
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

  titulo("las barras de nubes se distinguen de su fondo (contraste mínimo 3:1, como pide la accesibilidad para gráficos)");
  for (const esquema of ["light", "dark"]) {
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 390, height: 800 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const contrastes = await p.evaluate(() => {
      const variable = (n) => {
        const sonda = document.createElement("i"); sonda.style.color = "var(" + n + ")"; document.body.appendChild(sonda);
        const [r, g, b] = getComputedStyle(sonda).color.match(/[\d.]+/g).map(Number); sonda.remove();
        return [r, g, b];
      };
      const luminancia = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const contraste = (a, c) => { const [x, y] = [luminancia(a), luminancia(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      return ["--barra-baja", "--barra-media", "--barra-alta"].map((n) => [n, contraste(variable(n), variable("--fondo")), contraste(variable(n), variable("--tarjeta"))]);
    });
    for (const [nombre, sobreFondo, sobreTarjeta] of contrastes) {
      ok(sobreFondo >= 3 && sobreTarjeta >= 3, esquema + " " + nombre + ": " + sobreFondo.toFixed(2) + " sobre el fondo de la barra, " + sobreTarjeta.toFixed(2) + " sobre la tarjeta");
    }
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
