// Sin conexión (o con el servicio de previsión caído) la app enseña la última previsión guardada, con un aviso claro,
// y se actualiza sola cuando vuelve la conexión. Solo existe en la versión compilada.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/prevision-guardada.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, PONTE, simulada, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const A = "**/api.open-meteo.com/**";
const sinRed = (r) => r.abort("internetdisconnected");
const caido = (r) => r.fulfill({ status: 500, headers: { "access-control-allow-origin": "*" }, body: "caído" });
const texto = (p, sel) => p.locator(sel).innerText();
const aviso = "[data-testid=aviso-sin-conexion]";
const guardadaEnAlmacen = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("luz-y-foto:prevision")));
// Deja una previsión ya guardada en el dispositivo, como si se hubiera recibido en `cuando` (antes de abrir la página)
const conGuardada = (p, { cuando, lat = VIGO.latitude, lon = VIGO.longitude, datos = simulada() }) =>
  p.addInitScript((r) => { if (!localStorage.getItem("luz-y-foto:prevision")) localStorage.setItem("luz-y-foto:prevision", JSON.stringify(r)); }, { lat, lon, datos, guardadaEn: Date.parse(cuando) });

ejecutar("prevision-guardada", async ({ b, base }) => {
  titulo("con conexión: se pide, se enseña y se guarda para la próxima vez");
  let { ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR });
  await p.goto(base); await p.waitForSelector(".veredicto");
  const veredictoOnline = await texto(p, ".veredicto");
  ok(await p.locator(aviso).count() === 0, "sin aviso");
  ok(/^Previsión de las \d\d:\d\d · Europe\/Madrid$/.test(await texto(p, "#estado")), "estado: " + await texto(p, "#estado"));
  const g = await guardadaEnAlmacen(p);
  ok(g && Math.abs(g.lat - VIGO.latitude) < 1e-6 && typeof g.guardadaEn === "number" && g.datos.timezone === "Europe/Madrid" && Array.isArray(g.datos.hourly.time), "queda guardada: lugar " + (g && g.lat) + ", " + (g && g.datos && g.datos.hourly.time.length) + " horas");

  titulo("sin conexión: abre con la previsión guardada y lo avisa");
  await p.route(A, sinRed);
  const llamadas = p.llamadas.forecast;
  await p.reload(); await p.waitForSelector(aviso);
  ok(await p.locator(".veredicto").isVisible(), "se ve el veredicto de siempre");
  ok(await texto(p, ".veredicto") === veredictoOnline, "y es el mismo que con conexión");
  ok(await p.locator("[data-tab]").count() === 3 && await p.locator(".dias button").count() >= 2, "con sus pestañas y días");
  const a = await texto(p, aviso);
  ok(/No he podido actualizar la previsión/.test(a) && /hoy a las 1[45]:\d\d/.test(a) && /hace (un momento|\d+ min)/.test(a) && /puede haber cambiado/.test(a), "aviso: " + a.replace(/\n/g, " "));
  ok(/^Previsión guardada hoy a las \d\d:\d\d · Europe\/Madrid$/.test(await texto(p, "#estado")), "estado: " + await texto(p, "#estado"));
  ok(await p.locator(aviso + " button").innerText() === "Reintentar", "con botón Reintentar");
  ok(p.llamadas.forecast === llamadas, "no se llegó a servidor");

  titulo("reintentar sin conexión: sigue igual y el panel no desaparece");
  await p.click("[data-tab=luna]");
  await p.click(aviso + " button");
  await p.waitForFunction((sel) => document.querySelector(sel + " button").innerText === "Reintentar", aviso);
  ok(await p.locator(aviso).isVisible() && await p.locator(".veredicto").isVisible(), "aviso y veredicto siguen visibles");
  ok(await p.locator("[data-tab=luna][aria-selected=true]").count() === 1, "la pestaña elegida se mantiene");

  titulo("vuelve la conexión: «Reintentar» pone la previsión nueva y quita el aviso");
  await p.unroute(A, sinRed);
  await p.click(aviso + " button");
  await p.waitForSelector(aviso, { state: "detached" });
  ok(/^Previsión de las \d\d:\d\d/.test(await texto(p, "#estado")), "estado: " + await texto(p, "#estado"));
  ok(p.llamadas.forecast > llamadas, "se pidió de nuevo");
  ok(await p.locator("[data-tab=luna][aria-selected=true]").count() === 1, "se queda en la pestaña elegida");
  ok(p.errores.every((e) => /net::ERR_INTERNET_DISCONNECTED/.test(e)), "solo los errores de red de cuando no había: " + p.errores.join(";"));
  await ctx.close();

  titulo("la conexión vuelve sola: la app se actualiza sin tocar nada");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await conGuardada(p, { cuando: "2026-11-19T11:30:00+01:00" });
  await p.route(A, sinRed);
  await p.goto(base); await p.waitForSelector(aviso);
  ok(/hoy a las 11:30/.test(await texto(p, aviso)) && /hace 3 h/.test(await texto(p, aviso)), "usa la previsión guardada a las 11:30: " + (await texto(p, aviso)).replace(/\n/g, " "));
  await p.unroute(A, sinRed);
  await p.evaluate(() => window.dispatchEvent(new Event("online")));
  await p.waitForSelector(aviso, { state: "detached" });
  ok(true, "al volver la conexión («online») el aviso desaparece solo");
  await p.route(A, sinRed);
  await p.reload(); await p.waitForSelector(aviso);
  await p.unroute(A, sinRed);
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.waitForSelector(aviso, { state: "detached" });
  ok(true, "y al volver a la app («visibilitychange») también");
  await ctx.close();

  titulo("un guardado de ayer lo dice con claridad");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await conGuardada(p, { cuando: "2026-11-18T20:10:00+01:00" });
  await p.route(A, sinRed);
  await p.goto(base); await p.waitForSelector(aviso);
  ok(/ayer a las 20:10/.test(await texto(p, aviso)) && /hace 18 h/.test(await texto(p, aviso)), "aviso: " + (await texto(p, aviso)).replace(/\n/g, " "));
  await ctx.close();

  titulo("el servicio de previsión caído (HTTP 500) se trata igual que no tener red");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await conGuardada(p, { cuando: "2026-11-19T14:00:00+01:00" });
  await p.route(A, caido);
  await p.goto(base); await p.waitForSelector(aviso);
  ok(await p.locator(".veredicto").isVisible(), "enseña la guardada");
  await ctx.close();

  titulo("sin nada guardado: se explica el fallo y no se enseña nada inventado");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await p.route(A, caido);
  await p.goto(base); await p.waitForFunction(() => /No se han podido cargar/.test(document.getElementById("estado").innerText));
  ok(/HTTP 500/.test(await texto(p, "#estado")) && /Comprueba la conexión/.test(await texto(p, "#estado")), "estado: " + await texto(p, "#estado"));
  ok(await p.locator(aviso).count() === 0 && await p.locator(".veredicto").count() === 0, "ni aviso ni veredicto");
  await ctx.close();

  titulo("guardada de otro lugar, demasiado vieja o rota: no se usa");
  const casos = [
    ["de otro lugar", { cuando: "2026-11-19T14:00:00+01:00", lat: PONTE.latitude, lon: PONTE.longitude }],
    ["de hace más de 2 días", { cuando: "2026-11-17T10:00:00+01:00" }],
    ["sin horas", { cuando: "2026-11-19T14:00:00+01:00", datos: { timezone: "Europe/Madrid" } }]
  ];
  for (const [nombre, caso] of casos) {
    ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
    await conGuardada(p, caso);
    await p.route(A, sinRed);
    await p.goto(base); await p.waitForFunction(() => /No se han podido cargar/.test(document.getElementById("estado").innerText));
    ok(await p.locator(aviso).count() === 0 && await p.locator(".veredicto").count() === 0, nombre + ": no se enseña");
    ok(p.errores.every((e) => /net::ERR_INTERNET_DISCONNECTED/.test(e)), nombre + ": sin errores propios: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("una consulta lenta no pisa a otra más reciente (cambio de lugar mientras carga)");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  let soltar; const liberada = new Promise((r) => { soltar = r; });
  let n = 0;
  await p.route(A, async (r) => {
    if (++n > 1) return r.fallback();
    await liberada; // la primera (Vigo) tarda; cuando llegue, trae una zona horaria distinta para reconocerla
    const d = simulada(); d.timezone = "Atlantic/Azores";
    r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(d) });
  });
  await p.goto(base); await p.waitForSelector("#cambiar");
  await p.click("#cambiar"); await p.fill("#ciudad", "Vigo"); await p.click("#buscar button[type=submit]");
  await p.waitForSelector("#resultados li");
  await p.click("#resultados li >> nth=1"); // el otro Vigo: otro lugar, otra consulta
  await p.waitForSelector(".veredicto");
  ok(/Europe\/Madrid/.test(await texto(p, "#estado")), "se ve la previsión del lugar nuevo: " + await texto(p, "#estado"));
  soltar(); await p.waitForTimeout(400);
  ok(/Europe\/Madrid/.test(await texto(p, "#estado")) && !/Azores/.test(await texto(p, "#estado")), "la respuesta lenta del lugar anterior se descarta: " + await texto(p, "#estado"));
  await ctx.close();
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
