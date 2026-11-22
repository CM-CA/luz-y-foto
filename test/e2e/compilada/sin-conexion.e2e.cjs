// La versión COMPILADA abre sin red tras la primera carga y se actualiza solo cuando la persona lo pide.
// Se sirve una COPIA de dist/ para poder «publicar» una versión nueva en mitad de la prueba.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/sin-conexion.e2e.cjs
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "sw.js"))) {
  console.log("FALLA: no hay dist/sw.js. Compila antes con: npm run build");
  process.exit(1);
}
const copia = fs.mkdtempSync(path.join(os.tmpdir(), "luz-pwa-"));
fs.cpSync(dist, copia, { recursive: true });

const PREFIJO = "/luz-y-foto/";
// Con un lugar ya guardado (como en el uso normal) la app pide la previsión nada más abrir
const conServiceWorker = { permisos: false, serviceWorkers: "allow", lugar: { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" } };
const tituloDe = (p) => p.title();

// Espera a que el service worker controle la página (tras la primera carga lo hace al activarse)
const controlada = (p) => p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
const cachesDe = (p) => p.evaluate(async () => {
  const salida = {};
  for (const k of await caches.keys()) salida[k] = (await (await caches.open(k)).keys()).map((q) => new URL(q.url).pathname);
  return salida;
});

ejecutar("sin-conexion", async ({ b, base }) => {
  const { construirServiceWorker } = await import("../../../scripts/pwa.mjs");
  const { ctx, p } = await nuevaPagina(b, conServiceWorker);
  p.on("dialog", (d) => d.dismiss());

  titulo("primera carga: se instala el service worker y guarda toda la app");
  await p.goto(base); await p.waitForSelector("[data-tab]");
  await controlada(p);
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return { alcance: new URL(r.scope).pathname, activo: !!r.active }; });
  ok(reg.alcance === PREFIJO && reg.activo, "registrado solo en la carpeta de la app: " + reg.alcance);
  const swTexto = fs.readFileSync(path.join(copia, "sw.js"), "utf8");
  const lista = JSON.parse(swTexto.match(/const ARCHIVOS = (\[[\s\S]*?\]);/)[1]);
  const guardado = await cachesDe(p);
  const nombres = Object.keys(guardado);
  ok(nombres.length === 1 && /^luz-y-foto-[0-9a-f]{12}$/.test(nombres[0]), "una caché con la versión: " + nombres.join(", "));
  const esperadas = lista.map((a) => PREFIJO + a).sort();
  ok(JSON.stringify(guardado[nombres[0]].slice().sort()) === JSON.stringify(esperadas), "guarda todos los archivos de la app (" + esperadas.length + ")");
  ok(lista.includes("index.html") && lista.includes("manifest.webmanifest") && lista.some((a) => /^assets\/index-.*\.js$/.test(a)) && lista.some((a) => /^icon-512\.png$/.test(a)), "incluye la página, el JS, el manifiesto y los iconos");
  ok(!lista.includes("sw.js"), "no se guarda a sí mismo");
  ok(await p.locator("[data-testid=aviso-version]").count() === 0, "en la primera instalación no hay aviso de versión nueva");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));

  titulo("el navegador lo considera instalable");
  const cdp = await ctx.newCDPSession(p);
  const instalable = await cdp.send("Page.getInstallabilityErrors");
  ok(instalable.installabilityErrors.length === 0, "sin impedimentos para instalarla: " + JSON.stringify(instalable.installabilityErrors));

  titulo("sin red: la app abre desde la caché");
  const llamadasAntes = p.llamadas.forecast;
  await ctx.setOffline(true);
  const sinRed = (r) => r.abort("internetdisconnected");
  await p.route("**/api.open-meteo.com/**", sinRed);
  await p.reload(); await p.waitForSelector("[data-tab]");
  ok(await tituloDe(p) === "Luz y foto", "carga la página sin red: «" + await tituloDe(p) + "»");
  const pestanas = (await p.locator("[data-tab]").allInnerTexts()).join(",");
  ok(pestanas === "Amanecer,Atardecer,Noche", "con sus pestañas: " + pestanas);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector("main")).maxWidth) === "760px", "con sus estilos");
  await p.goto(base + "#/nada");
  ok(/No encuentro esa pantalla/.test(await p.locator("main").innerText()), "las rutas internas también funcionan");
  await p.goto(base + "index.html?x=1#/hoy"); await p.waitForSelector("[data-tab]");
  ok(true, "y también abriendo index.html o con «?…»");
  const hijos = await p.evaluate(async () => (await Promise.all(["manifest.webmanifest", "icon-192.png"].map((a) => fetch(a).then((r) => r.status, () => "fallo")))).join(","));
  ok(hijos === "200,200", "manifiesto e iconos también salen de la caché: " + hijos);
  await ctx.setOffline(false);
  await p.unroute("**/api.open-meteo.com/**", sinRed); // solo este: el simulado de siempre sigue debajo

  titulo("con red otra vez: la previsión sigue yendo a Internet (el service worker no la toca)");
  await p.reload(); await p.waitForSelector(".veredicto", { timeout: 10000 }).catch(() => {});
  ok(p.llamadas.forecast > llamadasAntes, "se pide la previsión: " + p.llamadas.forecast + " llamadas");
  ok(p.errores.every((e) => /net::ERR_INTERNET_DISCONNECTED/.test(e)), "solo los errores de red de cuando no había: " + p.errores.join(";"));
  p.errores.length = 0;

  titulo("se publica una versión nueva: avisa, pero no cambia sola");
  // «Publicar»: cambia la página y regenera el service worker, como haría una compilación nueva
  const html = path.join(copia, "index.html");
  fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace("<title>Luz y foto</title>", "<title>Luz y foto (versión 2)</title>"));
  const nueva = construirServiceWorker(copia);
  fs.writeFileSync(path.join(copia, "sw.js"), nueva.texto);
  await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
  await p.waitForSelector("[data-testid=aviso-version]", { timeout: 10000 });
  ok(/Hay una versión nueva/.test(await p.locator("[data-testid=aviso-version]").innerText()), "aparece el aviso: " + (await p.locator("[data-testid=aviso-version]").innerText()).replace(/\n/g, " "));
  ok(await tituloDe(p) === "Luz y foto", "la página sigue siendo la antigua mientras no se pulse");
  ok(Object.keys(await cachesDe(p)).length === 2, "la versión nueva está guardada aparte: " + Object.keys(await cachesDe(p)).join(", "));
  await p.reload(); await p.waitForSelector("[data-tab]");
  ok(await tituloDe(p) === "Luz y foto", "recargar la página tampoco la actualiza");
  await p.waitForSelector("[data-testid=aviso-version]", { timeout: 10000 });
  ok(true, "y el aviso sigue ahí tras recargar");
  const visible = await p.locator("[data-testid=aviso-version]").boundingBox();
  const vista = p.viewportSize();
  ok(visible && visible.x >= 0 && visible.x + visible.width <= vista.width && visible.y + visible.height <= vista.height, "el aviso cabe en pantalla");
  // Al final de la página, el aviso fijo no tapa el último texto (queda sitio de sobra bajo el pie)
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const tapa = await p.evaluate(() => document.querySelector(".pie").getBoundingClientRect().bottom - document.querySelector("[data-testid=aviso-version]").getBoundingClientRect().top);
  ok(tapa <= 0, "al final de la página el aviso no tapa el pie (" + Math.round(tapa) + " px de solape)");

  titulo("«Actualizar»: pasa a la versión nueva y limpia la anterior");
  await Promise.all([p.waitForEvent("load"), p.click("[data-accion=actualizar]")]);
  await p.waitForSelector("[data-tab]");
  await controlada(p);
  ok(await tituloDe(p) === "Luz y foto (versión 2)", "ahora es la versión nueva: «" + await tituloDe(p) + "»");
  ok(await p.locator("[data-testid=aviso-version]").count() === 0, "el aviso desaparece");
  const finales = Object.keys(await cachesDe(p));
  ok(finales.length === 1 && finales[0] === "luz-y-foto-" + nueva.version, "solo queda la caché nueva: " + finales.join(", "));
  await ctx.setOffline(true);
  await p.reload(); await p.waitForSelector("[data-tab]");
  ok(await tituloDe(p) === "Luz y foto (versión 2)", "y la versión nueva también abre sin red");
  await ctx.close();

  titulo("en inglés (teléfono en en-US): sin red abre desde la caché con sus textos en inglés, y avisa de la versión nueva en inglés");
  {
    const { ctx: ctxEn, p: pEn } = await nuevaPagina(b, Object.assign({ locale: "en-US" }, conServiceWorker));
    pEn.on("dialog", (d) => d.dismiss());
    await pEn.goto(base); await pEn.waitForSelector(".veredicto");
    await controlada(pEn);
    ok(await pEn.evaluate(() => document.documentElement.lang) === "en", "<html lang> = en");
    await ctxEn.setOffline(true);
    const sinRedEn = (r) => r.abort("internetdisconnected");
    await pEn.route("**/api.open-meteo.com/**", sinRedEn);
    await pEn.reload(); await pEn.waitForSelector("[data-tab]");
    ok((await pEn.locator("[data-tab]").allInnerTexts()).join(",") === "Sunrise,Sunset,Night", "sin red, con sus pestañas en inglés");
    await pEn.waitForSelector("[data-testid=aviso-sin-conexion]");
    ok(/I couldn't update the forecast\./.test(await pEn.locator("[data-testid=aviso-sin-conexion]").innerText()), "con la previsión guardada y el aviso en inglés: «" + (await pEn.locator("[data-testid=aviso-sin-conexion]").innerText()).replace(/\n/g, " ") + "»");
    await pEn.goto(base + "#/nada");
    ok(/I can't find that screen/.test(await pEn.locator("main").innerText()), "las rutas internas también funcionan: «I can't find that screen»");
    await ctxEn.setOffline(false);
    await pEn.unroute("**/api.open-meteo.com/**", sinRedEn);
    // «Publicar» otra versión (la 3)
    fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace("<title>Luz y foto (versión 2)</title>", "<title>Luz y foto (versión 3)</title>"));
    fs.writeFileSync(path.join(copia, "sw.js"), construirServiceWorker(copia).texto);
    await pEn.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    await pEn.waitForSelector("[data-testid=aviso-version]", { timeout: 10000 });
    ok(/There is a new version of Luz y foto\./.test(await pEn.locator("[data-testid=aviso-version]").innerText()), "aviso de versión nueva en inglés: «" + (await pEn.locator("[data-testid=aviso-version]").innerText()).replace(/\n/g, " ") + "»");
    ok(/^Update$/.test((await pEn.locator("[data-accion=actualizar]").innerText()).trim()), "con el botón «Update»");
    ok(!/[¿¡áéíóúñ]/.test(await pEn.locator("[data-testid=aviso-version]").innerText()), "sin español en el aviso");
    await ctxEn.close();
  }

  fs.rmSync(copia, { recursive: true, force: true });
}, { carpeta: copia, prefijo: PREFIJO, cacheControl: "max-age=600" }); // max-age=600: lo mismo que manda GitHub Pages
