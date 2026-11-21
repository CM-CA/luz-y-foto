// Al pasar la versión nueva a la raíz, /beta/ deja de existir como app. La carpeta transicion/ publica en su lugar una redirección:
//   - una app que ya estaba instalada desde /beta/ (con su service worker y su caché) se arregla sola y acaba en la raíz,
//   - una visita nueva a /beta/ llega a la raíz con su misma ruta (#/hoy),
//   - una dirección vieja (por ejemplo /prueba/hoy.html) lleva a la app en lugar de a una página de error.
//
// Se compila aquí mismo una copia «vieja» con la ruta /luz-y-foto/beta/ (la app tal como estaba publicada en /beta/).
// Ejecutar: node test/e2e/compilada/redireccion-beta.e2e.cjs
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const transicion = path.join(RAIZ, "transicion");
const faltan = ["beta/index.html", "beta/sw.js", "404.html"].filter((a) => !fs.existsSync(path.join(transicion, a)));
if (faltan.length) {
  console.log("FALLA: faltan archivos de transicion/: " + faltan.join(", "));
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "luz-redireccion-"));
const viejo = path.join(tmp, "viejo");
const sitio = path.join(tmp, "sitio");
const compilacion = spawnSync("npx", ["vite", "build", "--base=/luz-y-foto/beta/", "--outDir", viejo, "--emptyOutDir"], { cwd: RAIZ, encoding: "utf8" });
if (compilacion.status !== 0) {
  console.log("FALLA: no compila la versión vieja con la ruta /luz-y-foto/beta/:\n" + (compilacion.stderr || compilacion.stdout));
  process.exit(1);
}

const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };

// Un sitio como el publicado: una raíz de mentira (solo para saber que se llegó a ella), el 404.html y lo que haya en /beta/
const montar = (carpetaBeta) => {
  fs.rmSync(sitio, { recursive: true, force: true });
  fs.mkdirSync(sitio, { recursive: true });
  fs.writeFileSync(path.join(sitio, "index.html"), "<!doctype html><meta charset=\"utf-8\"><title>raíz</title><p>raíz</p>");
  fs.copyFileSync(path.join(transicion, "404.html"), path.join(sitio, "404.html"));
  fs.cpSync(carpetaBeta, path.join(sitio, "beta"), { recursive: true });
};
// «Publicar» la redirección en /beta/, con el servidor ya en marcha
const publicarRedireccion = () => {
  fs.rmSync(path.join(sitio, "beta"), { recursive: true, force: true });
  fs.cpSync(path.join(transicion, "beta"), path.join(sitio, "beta"), { recursive: true });
};

montar(viejo);
ejecutar("redireccion-beta", async ({ b, base }) => {
  titulo("A: una app instalada desde /beta/ se arregla sola cuando se publica la redirección");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false, serviceWorkers: "allow", perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "beta/#/hoy"); await p.waitForSelector("[data-tab]");
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    const guardado = () => ({ perfil: localStorage.getItem("luz-y-foto:perfil"), lugar: localStorage.getItem("luz-y-foto:lugar") });
    const antes = await p.evaluate(guardado);
    ok(!!antes.perfil && !!antes.lugar, "la app vieja está instalada y tiene guardados su perfil y su lugar");
    ok((await p.evaluate(() => caches.keys())).length === 1, "y con su caché");
    // La app de la raíz (la versión nueva) guarda su caché en el mismo sitio y con el mismo estilo de nombre: no debe perderla
    await p.evaluate(async (raiz) => { await (await caches.open("luz-y-foto-de-la-raiz")).put(raiz + "index.html", new Response("raíz")); }, base);

    // La app busca una versión nueva al volver a ella y cada hora: aquí encuentra la redirección en lugar de la app
    publicarRedireccion();
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    // El navegador activa el service worker nuevo cuando puede: en el acto, cuando se cierra la app o en la próxima visita a /beta/
    // (el viejo puede seguir con trabajo pendiente y no hay manera de saberlo desde fuera). La prueba hace lo último, como la persona
    // que cierra la app y la vuelve a abrir.
    await p.waitForLoadState("networkidle");
    await p.goto("about:blank");
    await p.close();
    const q = await ctx.newPage();
    await q.goto(base + "beta/#/hoy", { waitUntil: "commit" });
    await q.waitForURL(base + "#/hoy", { timeout: 15000 });
    ok(await q.title() === "raíz", "al volver a abrir /beta/ la persona acaba en la raíz, con la misma ruta (#/hoy)");

    // La baja y el borrado de la caché terminan un instante después de la redirección: se espera (hasta 15 s) a que acaben
    const estado = () => q.evaluate(async (alcance) => ({
      registros: (await navigator.serviceWorker.getRegistrations()).filter((r) => r.scope === alcance).length,
      caches: (await caches.keys()).sort(),
    }), base + "beta/");
    let e = await estado();
    for (let i = 0; i < 75 && (e.registros || e.caches.length > 1); i++) { await q.waitForTimeout(200); e = await estado(); }
    ok(e.registros === 0, "el service worker viejo se ha dado de baja");
    ok(e.caches.length === 1 && e.caches[0] === "luz-y-foto-de-la-raiz", "se ha borrado la caché de la vista previa y sigue la de la raíz");
    ok(await q.evaluate(async () => !!(await (await caches.open("luz-y-foto-de-la-raiz")).match(location.origin + "/luz-y-foto/index.html"))), "con su contenido");
    const despues = await q.evaluate(guardado);
    ok(despues.perfil === antes.perfil && despues.lugar === antes.lugar, "el perfil y el lugar guardados siguen ahí (mismo origen)");
    await ctx.close();
  }

  titulo("B: una visita nueva a /beta/ llega a la raíz con su misma ruta");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false });
    await p.goto(base + "beta/#/hoy");
    await p.waitForURL(base + "#/hoy", { timeout: 10000 });
    ok(await p.title() === "raíz", "de /beta/#/hoy a /#/hoy");
    await ctx.close();
  }

  titulo("C: una dirección vieja lleva a la app en lugar de a un error");
  {
    const html404 = fs.readFileSync(path.join(transicion, "404.html"), "utf8");
    ok(/Esta página ya no existe/.test(html404) && /href="\/luz-y-foto\/"/.test(html404), "el 404.html lo dice y tiene un enlace a la app para quien no tenga JavaScript");
    const { ctx, p } = await nuevaPagina(b, { permisos: false });
    // GitHub Pages contesta un 404 con el cuerpo de 404.html en la propia dirección que falta
    await p.route("**/luz-y-foto/prueba/hoy.html", (r) => r.fulfill({ status: 404, contentType: "text/html; charset=utf-8", body: html404 }));
    await p.goto(base + "prueba/hoy.html");
    await p.waitForURL(base, { timeout: 10000 });
    ok(await p.title() === "raíz", "de /prueba/hoy.html a la raíz");
    await ctx.close();
  }
}, { carpeta: sitio, prefijo: "/luz-y-foto/" });
