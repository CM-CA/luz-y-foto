// El selector de lugar: campo, ubicación y lupa en una sola fila (a 320 px también), con botones de icono cómodos de pulsar y con
// nombre para los lectores de pantalla; y las sugerencias que aparecen mientras se escribe.
//
// Ejecutar: node test/e2e/compilada/buscador.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "movil", marca: "desconocida", objetivos: [], tripode: "no", nivel: "empiezo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };
const MENSAJE_INICIAL = "Escribe tu ciudad o usa tu ubicación.";

async function abrirSelector(b, base, ancho, esquema) {
  const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 800 }, colorScheme: esquema || "light", perfil: PERFIL, lugar: LUGAR });
  await p.goto(base + "#/hoy"); await p.waitForSelector("#cambiar");
  await p.click("#cambiar"); await p.waitForSelector("#selector:not([hidden])");
  return { ctx, p };
}

ejecutar("buscador", async ({ b, base }) => {
  for (const ancho of [320, 360, 390]) {
    titulo("a " + ancho + " px: campo, ubicación y lupa en una fila");
    const { ctx, p } = await abrirSelector(b, base, ancho);
    const r = await p.evaluate(() => {
      const caja = (s) => { const x = document.querySelector(s).getBoundingClientRect(); return { top: x.top, left: x.left, right: x.right, ancho: x.width, alto: x.height }; };
      const form = caja("#buscar"), campo = caja("#ciudad"), gps = caja("#gps"), lupa = caja("#buscar button[type=submit]");
      const dentro = (c) => c.left >= form.left - 0.5 && c.right <= form.right + 0.5;
      return {
        formulario: !!document.querySelector("#buscar #gps"),
        unaFila: Math.max(campo.top, gps.top, lupa.top) - Math.min(campo.top, gps.top, lupa.top) <= 2,
        dentro: [campo, gps, lupa].every(dentro),
        botones: [gps, lupa].map((c) => [Math.round(c.ancho), Math.round(c.alto)]),
        botonesCómodos: [gps, lupa].every((c) => c.ancho >= 44 && c.alto >= 44),
        campoAlto: Math.round(campo.alto),
        orden: gps.left > campo.left && lupa.left > gps.left,
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        mensaje: document.querySelector("#msgLugar").textContent.trim()
      };
    });
    ok(r.formulario, "el botón de ubicación está dentro del formulario de búsqueda");
    ok(r.unaFila && r.dentro, "campo, ubicación y lupa van en una sola fila, dentro del formulario");
    ok(r.orden, "el orden es campo, ubicación y lupa");
    ok(r.botonesCómodos, "los dos botones miden al menos 44 × 44 px (" + r.botones.map((x) => x.join("×")).join(" y ") + ")");
    ok(r.campoAlto >= 44, "el campo mide al menos 44 px de alto (" + r.campoAlto + ")");
    ok(r.desborde <= 0, "la página no se desborda (" + r.desborde + " px)");
    ok(r.mensaje === MENSAJE_INICIAL, "el mensaje inicial es «" + MENSAJE_INICIAL + "» (" + r.mensaje + ")");
    ok(await p.getByRole("button", { name: "Usar mi ubicación" }).count() === 1, "el botón de ubicación se llama «Usar mi ubicación»");
    ok(await p.getByRole("button", { name: "Buscar", exact: true }).count() === 1, "la lupa se llama «Buscar»");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
