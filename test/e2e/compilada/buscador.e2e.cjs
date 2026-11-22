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

  // ---- Sugerencias al escribir. El reloj se congela con el selector abierto: no corre solo y se adelanta con runFor,
  // así «escribir Vigo» es una sola ráfaga de teclas por muy lenta que sea la máquina.
  const congelar = async (p) => { const t = await p.evaluate(() => Date.now()); await p.clock.pauseAt(t + 50); };
  const escribir = (p, texto) => p.locator("#ciudad").pressSequentially(texto);
  const filas = (p) => p.locator("#resultados li").count();
  const sugerencias = async (esquema) => {
    const { ctx, p } = await abrirSelector(b, base, 360, esquema);
    await congelar(p);
    return { ctx, p };
  };

  titulo("sugerencias: «Vigo» tecleado de seguido da una sola búsqueda, 0,4 s después");
  {
    const { ctx, p } = await sugerencias();
    await escribir(p, "Vigo");
    ok(await filas(p) === 0 && p.llamadas.geocoding === 0, "antes de que pasen 0,4 s no se ha buscado nada");
    await p.clock.runFor(450);
    await p.waitForSelector("#resultados li");
    ok(await filas(p) === 2, "aparecen las 2 sugerencias");
    ok(p.llamadas.geocoding === 1, "una sola petición (" + p.llamadas.geocoding + ")");
    ok((await p.locator("#msgLugar").textContent()).trim() === "Elige tu lugar:", "el mensaje pasa a «Elige tu lugar:»");

    await p.keyboard.press("Backspace"); await p.keyboard.press("Backspace");
    await p.waitForFunction(() => document.querySelectorAll("#resultados li").length === 0);
    ok(true, "al dejar «Vi» la lista se vacía al momento");
    ok((await p.locator("#msgLugar").textContent()).trim() === MENSAJE_INICIAL, "y vuelve el mensaje inicial");
    await ctx.close();
  }

  titulo("sugerencias: con menos de 3 letras no se busca");
  {
    const { ctx, p } = await sugerencias();
    await escribir(p, "Vi");
    await p.clock.runFor(1000);
    ok(await filas(p) === 0 && p.llamadas.geocoding === 0, "«Vi» no lanza ninguna petición");
    await ctx.close();
  }

  titulo("sugerencias: Intro busca al momento y cancela la espera");
  {
    const { ctx, p } = await sugerencias();
    await escribir(p, "Vigo"); await p.keyboard.press("Enter");
    await p.waitForSelector("#resultados li");
    ok(await filas(p) === 2 && p.llamadas.geocoding === 1, "Intro muestra los 2 resultados sin esperar (" + p.llamadas.geocoding + " petición)");
    await p.clock.runFor(450);
    await p.waitForTimeout(150);
    ok(p.llamadas.geocoding === 1, "pasada la espera no hay una segunda petición (" + p.llamadas.geocoding + ")");
    await ctx.close();
  }

  titulo("sugerencias: elegir una sugerencia cambia el lugar y cierra el selector");
  {
    const { ctx, p } = await sugerencias();
    await escribir(p, "Vigo"); await p.clock.runFor(450);
    await p.waitForSelector("#resultados li");
    await p.click("#resultados li >> nth=0");
    await p.waitForSelector("#selector", { state: "hidden" });
    ok((await p.locator("#cambiar").textContent()).includes("España"), "la cabecera lleva el lugar elegido («" + (await p.locator("#cambiar").textContent()).trim() + "»)");
    await ctx.close();
  }

  titulo("sugerencias: una respuesta tardía no pisa la búsqueda explícita");
  {
    const { ctx, p } = await sugerencias();
    let peticiones = 0, soltar;
    const retenida = new Promise((r) => { soltar = r; });
    const cors = { "access-control-allow-origin": "*" };
    await p.route("**/geocoding-api.open-meteo.com/**", async (r) => {
      const n = ++peticiones;
      try {
        if (n === 1) { await retenida; return r.fulfill({ contentType: "application/json", headers: cors, body: JSON.stringify({ results: [{ name: "Viejo", latitude: 1, longitude: 1, country: "Nada" }] }) }); }
        r.fulfill({ contentType: "application/json", headers: cors, body: JSON.stringify({ results: [
          { name: "Vigo", latitude: 42.23282, longitude: -8.72264, country: "España", admin1: "Galicia", admin2: "Pontevedra" },
          { name: "Vigo", latitude: 38.0, longitude: -121.0, country: "Estados Unidos", admin1: "California" }] }) });
      } catch (e) { /* la página canceló la petición retenida: es lo que se busca */ }
    });
    await escribir(p, "Vigo"); await p.clock.runFor(450);          // sale la sugerencia y se queda retenida
    await p.keyboard.press("Enter");                                 // búsqueda explícita
    await p.waitForSelector("#resultados li");
    soltar(); await p.waitForTimeout(250);                           // llega la vieja
    const nombres = await p.locator("#resultados li").evaluateAll((l) => l.map((x) => x.querySelector("button").firstChild.textContent));
    ok(peticiones === 2 && nombres.length === 2 && nombres.every((n) => n === "Vigo"), "la lista sigue siendo la de la búsqueda explícita (" + nombres.join(", ") + ")");
    await ctx.close();
  }

  titulo("sugerencias: una respuesta que llega con el selector ya cerrado no rellena la lista");
  {
    const { ctx, p } = await sugerencias();
    let soltar;
    const retenida = new Promise((r) => { soltar = r; });
    const cors = { "access-control-allow-origin": "*" };
    await p.route("**/geocoding-api.open-meteo.com/**", async (r) => {
      try { await retenida; r.fulfill({ contentType: "application/json", headers: cors, body: JSON.stringify({ results: [{ name: "Viejo", latitude: 1, longitude: 1, country: "Nada" }] }) }); } catch (e) { /* cancelada por la página */ }
    });
    await escribir(p, "Vigo"); await p.clock.runFor(450);           // sale la sugerencia y se queda retenida
    await p.click("#cambiar");                                       // se cierra el selector
    await p.waitForSelector("#selector", { state: "hidden" });
    soltar(); await p.waitForTimeout(250);                           // llega la respuesta, ya sin selector
    ok(await filas(p) === 0, "con el selector cerrado la respuesta tardía no deja filas en la lista");
    await p.click("#cambiar"); await p.waitForSelector("#selector:not([hidden])");
    ok(await filas(p) === 0 && (await p.locator("#msgLugar").textContent()).trim() === MENSAJE_INICIAL, "al reabrirlo está limpio, con el mensaje inicial");
    await ctx.close();
  }

  titulo("sugerencias: si falla la red mientras se escribe, ni aviso ni excepción; la búsqueda explícita sí avisa");
  {
    const { ctx, p } = await sugerencias();
    const excepciones = [];
    p.on("pageerror", (e) => excepciones.push(e.message));
    await p.route("**/geocoding-api.open-meteo.com/**", (r) => r.abort());
    await escribir(p, "Vigo"); await p.clock.runFor(450); await p.waitForTimeout(250);
    ok((await p.locator("#msgLugar").textContent()).trim() === MENSAJE_INICIAL && await filas(p) === 0, "sin aviso mientras se escribe");
    ok(excepciones.length === 0, "sin excepciones sin atrapar (" + excepciones.join("; ") + ")");
    await p.keyboard.press("Enter");
    await p.waitForFunction(() => document.querySelector("#msgLugar").textContent.includes("No he podido buscar"));
    ok(true, "Intro sí avisa: «No he podido buscar. Comprueba la conexión e inténtalo de nuevo.»");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
