// Comportamiento de la ubicación y de la pantalla Hoy. Debe pasar igual en cualquier versión de la app.
// Ejecutar: node test/e2e/comportamiento/lugar.e2e.cjs
"use strict";
const { VIGO, PONTE, simulada, nuevaPagina: nuevo, ok, titulo, ejecutar } = require("../ayudas.cjs");

const nombre = (p) => p.locator("#nombreLugar").innerText();
const guardado = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("luz-y-foto:lugar")));

ejecutar("lugar", async ({ b, hoy }) => {
  titulo("A: primera visita con permiso de ubicación");
  let { ctx, p } = await nuevo(b, { permisos: true, geo: VIGO });
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.waitForFunction(() => document.getElementById("nombreLugar").innerText === "Vigo, Galicia");
  ok(await nombre(p) === "Vigo, Galicia", "muestra la ciudad: " + await nombre(p));
  ok(await p.locator("#selector").isHidden(), "el selector está oculto");
  ok(p.llamadas.forecast >= 1, "carga la previsión");
  const g = await guardado(p);
  ok(g && g.origen === "gps" && g.nombre === "Vigo, Galicia", "guarda el lugar: " + JSON.stringify(g));
  ok(await p.locator("input#lat, input#lon").count() === 0, "ya no hay campos de latitud y longitud");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("B: permiso denegado -> buscar ciudad");
  ({ ctx, p } = await nuevo(b, { permisos: false }));
  await p.goto(hoy);
  await p.waitForSelector("#selector:not([hidden])");
  ok(/permiso/.test(await p.locator("#msgLugar").innerText()), "explica que falta permiso: " + await p.locator("#msgLugar").innerText());
  await p.fill("#ciudad", "Vigo"); await p.click("#buscar button[type=submit]");
  await p.waitForSelector("#resultados li");
  ok(await p.locator("#resultados li").count() === 2, "muestra 2 resultados");
  await p.click("#resultados li >> nth=0");
  await p.waitForSelector(".veredicto");
  ok(await nombre(p) === "Vigo, Galicia, España", "pone el nombre elegido: " + await nombre(p));
  ok(await p.locator("#selector").isHidden(), "se cierra el selector");
  ok((await guardado(p)).origen === "busqueda", "guarda como búsqueda");
  ok(p.llamadas.nominatim === 0, "no pide el nombre a Nominatim si ya lo tiene");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  const almacenado = await guardado(p);
  await ctx.close();

  titulo("C: vuelve con el lugar guardado y sin permiso");
  ({ ctx, p } = await nuevo(b, { permisos: false, lugar: almacenado }));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  ok(await nombre(p) === "Vigo, Galicia, España", "usa el lugar guardado");
  ok(await p.locator("#selector").isHidden(), "no molesta con el selector");
  await ctx.close();

  titulo("D: búsqueda sin resultados");
  ({ ctx, p } = await nuevo(b, { permisos: false }));
  await p.goto(hoy); await p.waitForSelector("#selector:not([hidden])");
  await p.fill("#ciudad", "zzzz"); await p.click("#buscar button[type=submit]");
  await p.waitForFunction(() => /No he encontrado/.test(document.getElementById("msgLugar").innerText));
  ok(true, "avisa de que no encuentra: " + await p.locator("#msgLugar").innerText());
  await p.fill("#ciudad", "a"); await p.click("#buscar button[type=submit]");
  ok(/al menos dos/.test(await p.locator("#msgLugar").innerText()), "pide al menos dos letras");
  await ctx.close();

  titulo("E: Nominatim caído");
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: VIGO, nominatim: "error" }));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.waitForFunction(() => /42\.23/.test(document.getElementById("nombreLugar").innerText));
  ok(await nombre(p) === "42.23, -8.72", "usa las coordenadas como respaldo: " + await nombre(p));
  ok(await p.locator(".veredicto").count() === 1, "la previsión se ve igualmente");
  await ctx.close();

  titulo("F: lugar guardado por GPS y te has movido a otra ciudad");
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: PONTE, lugar: { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "gps" } }));
  await p.goto(hoy);
  await p.waitForFunction(() => document.getElementById("nombreLugar").innerText === "Pontevedra, Galicia");
  ok(true, "cambia solo a: " + await nombre(p));
  await ctx.close();

  titulo("G: lugar elegido a mano no lo pisa el GPS");
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: PONTE, lugar: { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia, España", origen: "busqueda" } }));
  await p.goto(hoy); await p.waitForSelector(".veredicto"); await p.waitForTimeout(500);
  ok(await nombre(p) === "Vigo, Galicia, España", "se mantiene: " + await nombre(p));
  await ctx.close();

  titulo("H: botón Cambiar abre y cierra; usar mi ubicación desde el selector");
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: VIGO, lugar: { lat: PONTE.latitude, lon: PONTE.longitude, nombre: "Pontevedra, Galicia", origen: "busqueda" } }));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.click("#cambiar"); ok(await p.locator("#selector").isVisible(), "Cambiar abre");
  await p.click("#gps");
  await p.waitForFunction(() => document.getElementById("nombreLugar").innerText === "Vigo, Galicia");
  ok(await p.locator("#selector").isHidden(), "al usar la ubicación se cierra y pone " + await nombre(p));
  await p.click("#cambiar"); await p.click("#cambiar"); ok(await p.locator("#selector").isHidden(), "Cambiar cierra");
  await ctx.close();

  titulo("M: lluvia fuerte toda la noche en la pestaña Noche (antes salía «nubes NaN»)");
  ({ ctx, p } = await nuevo(b, { permisos: true, geo: VIGO }));
  await p.route("**/api.open-meteo.com/**", (r) => {
    const j = simulada(); j.hourly.precipitation = j.hourly.precipitation.map(() => 6);
    r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(j) });
  });
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.click("[data-tab=luna]"); await p.click('#dias button[data-i="1"]');
  const tl = await p.locator("#panel").innerText();
  ok(!/NaN/.test(tl), "no aparece NaN");
  ok(/lluvia fuerte/i.test(tl), "explica la lluvia fuerte: " + (await p.locator(".veredicto").innerText()).replace(/\n+/g, " / "));
  await ctx.close();
});
