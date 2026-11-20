// Pruebas de cómo la web ACTUAL pide y valida sus datos en el navegador.
//
// No son de comportamiento: dependen de que los archivos de data/ se pidan al abrir la página
// y de que la caché del navegador pueda guardar scripts antiguos. En la versión con Svelte los datos
// se incluyen al compilar, así que estas comprobaciones se sustituyen por otras equivalentes
// (validar datos en la compilación, comprobar que un género nuevo compila).
//
// Ejecutar: node test/e2e/version-actual/datos-en-ejecucion.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const { RAIZ, VIGO, nuevaPagina: nuevo, ok, titulo, ejecutar } = require("../ayudas.cjs");

const leer = (r) => JSON.parse(fs.readFileSync(path.join(RAIZ, "data", r), "utf8"));
const json = (r, o) => r.fulfill({ contentType: "application/json", body: JSON.stringify(o) });

ejecutar("datos-en-ejecucion", async ({ b, base, hoy }) => {
  titulo("I: el navegador conserva un astro.js antiguo (el error que vio el usuario)");
  const viejo = execSync("git show 0588561:js/astro.js", { cwd: RAIZ }).toString();
  let { ctx, p } = await nuevo(b, { permisos: true, geo: VIGO });
  await p.route("**/js/astro.js**", (r) => r.fulfill({ contentType: "application/javascript", body: viejo }));
  await p.goto(hoy); await p.waitForTimeout(800);
  ok(/versión antigua/.test(await p.locator("#panel").innerText()), "explica qué hacer en vez de romperse");
  ok(!p.errores.some((e) => /Uncaught|TypeError/.test(e)), "sin excepciones: " + p.errores.join(";"));
  await ctx.close();

  titulo("J: un género nuevo (amanecer) añadido SOLO con datos aparece como pestaña");
  const idx = leer("generos.json"); idx.orden.push("amanecer");
  const am = leer("generos/atardecer.json");
  Object.assign(am, { id: "amanecer", nombre: "Amanecer", evento: "amanecer", eventoNombre: "el amanecer",
    textoEvento: "Amanecer a las {hora}", textoBrujula: "Al amanecer, mira hacia el {direccion} ({grados}°).", avisoNiebla: "Niebla al amanecer." });
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: VIGO }));
  await p.route("**/data/generos.json*", (r) => json(r, idx));
  await p.route("**/data/generos/amanecer.json*", (r) => json(r, am));
  await p.route("**/data/recetas/amanecer.json*", (r) => json(r, leer("recetas/atardecer.json")));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  ok(await p.locator(".pestanas button").count() === 3, "hay 3 pestañas: " + (await p.locator(".pestanas button").allInnerTexts()).join(", "));
  await p.click("[data-tab=amanecer]");
  ok(/Amanecer a las \d\d:\d\d/.test(await p.locator(".subtitulo").innerText()), "el panel dice: " + await p.locator(".subtitulo").innerText());
  ok(await p.locator(".veredicto .titulo").count() === 1, "muestra su semáforo: " + await p.locator(".veredicto .titulo").innerText());
  ok(/Al amanecer, mira hacia el/.test(await p.locator(".brujula").innerText()), "brújula: " + (await p.locator(".brujula").innerText()).replace(/\n/g, " "));
  await p.click("#reglas summary");
  ok(/Amanecer/.test(await p.locator("#reglas").innerText()), "la explicación incluye el género nuevo");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("K: un archivo de datos con un error se explica en vez de romper");
  const luna = leer("generos/luna.json"); luna.nubes.verdeMenosDe = 90;
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: VIGO }));
  await p.route("**/data/generos/luna.json*", (r) => json(r, luna));
  await p.goto(hoy); await p.waitForTimeout(800);
  const t = await p.locator("#panel").innerText();
  ok(/error en los datos/.test(t) && /generos\/luna\.nubes/.test(t), "dice dónde está el error: " + t.replace(/\n/g, " "));
  ok(!p.errores.some((e) => /Uncaught|TypeError/.test(e)), "sin excepciones");
  await ctx.close();

  titulo("L: un archivo de datos que no existe (404)");
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: VIGO }));
  await p.route("**/data/generos/atardecer.json*", (r) => r.fulfill({ status: 404, body: "no" }));
  await p.goto(hoy); await p.waitForTimeout(800);
  ok(/atardecer\.json.*404/.test(await p.locator("#panel").innerText()), "dice qué archivo falta: " + (await p.locator("#panel").innerText()).replace(/\n/g, " "));
  await ctx.close();

  titulo("N: la página de sol y luna usa los textos de data/");
  ({ ctx, p } = await nuevo(b, { permisos: false }));
  await p.goto(base + "prueba/sol-luna.html"); await p.waitForSelector(".dia");
  const tn = await p.locator(".dia").first().innerText();
  ok(/(Creciente|Gibosa|Cuarto|Luna llena|Menguante|Luna nueva)/.test(tn), "muestra el nombre de la fase");
  ok(/relieve|brillo|estrellas|borde/.test(tn), "muestra el consejo de la fase");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
});
