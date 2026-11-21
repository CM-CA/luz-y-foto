// Panel «Instalar la app y uso sin conexión»: dice qué versión se está ejecutando, si el manifiesto, los iconos y el
// service worker están bien (y por qué no, si fallan) y ofrece el botón de instalar cuando el navegador lo permite.
//
// Antes: npm run build -- --base=/luz-y-foto/beta/
// Ejecutar: node test/e2e/compilada/instalacion.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { RAIZ, VIGO, servir, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "sw.js"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const informe = (p) => p.locator("[data-testid=informe-instalacion]").innerText();
const lineas = async (p) => (await informe(p)).split("\n").map((s) => s.replace(/^[✓✗•]\s*/, "").trim()).filter(Boolean);

ejecutar("instalacion", async ({ b, base }) => {
  titulo("con service worker: todo en orden y se ve la versión");
  let { ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR, serviceWorkers: "allow" });
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
  ok(await p.locator("#instalar").evaluate((e) => !e.open), "el panel empieza cerrado");
  await p.click("#instalar summary");
  await p.waitForSelector("[data-testid=informe-instalacion]");
  await p.waitForFunction(() => /Uso sin conexión listo · versión [0-9a-f]{12}/.test(document.querySelector("[data-testid=informe-instalacion]").innerText), null, { timeout: 10000 });
  const t = await informe(p);
  const archivo = await p.evaluate(() => [...document.scripts].map((s) => s.src).find((u) => /\/assets\/index-/.test(u)).split("/").pop());
  ok(t.includes("App cargada: " + archivo), "dice qué archivo de la app se ejecuta: " + archivo);
  ok(/✓ Conexión segura/.test(t), "conexión segura");
  ok(/✓ Manifiesto leído \(.+\): «Luz y foto», se abre como «standalone»/.test(t), "manifiesto: " + t.split("\n").find((s) => /Manifiesto/.test(s)));
  ok(/✓ Icono de 192 px: se descarga \(image\/png\)/.test(t) && /✓ Icono de 512 px: se descarga \(image\/png\)/.test(t), "iconos de 192 y 512 px");
  ok(/✓ Dirección de inicio dentro del ámbito de la app \(\/luz-y-foto\/beta\/\)/.test(t), "inicio dentro del ámbito");
  const versionSw = t.match(/versión ([0-9a-f]{12})/)[1];
  const swTexto = fs.readFileSync(path.join(dist, "sw.js"), "utf8");
  ok(swTexto.includes('"' + versionSw + '"'), "la versión mostrada (" + versionSw + ") es la de dist/sw.js");
  ok(/✓ Esta página la gestiona el service worker/.test(t), "la gestiona el service worker");
  ok(t.includes("Guardado en el dispositivo: luz-y-foto-" + versionSw), "caché guardada: luz-y-foto-" + versionSw);
  ok(/Estás en el navegador/.test(t) && /no ha ofrecido instalarla/.test(t), "navegador y sin oferta de instalar");
  ok(/Si tu navegador no te ofrece instalarla/.test(await p.locator("#instalar").innerText()), "con instrucciones para instalar a mano");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));

  titulo("cuando el navegador ofrece instalar: aparece el botón y funciona");
  const resultado = await p.evaluate(() => {
    const e = new Event("beforeinstallprompt", { cancelable: true });
    e.prompt = () => { window.__avisos = (window.__avisos || 0) + 1; return Promise.resolve(); };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
  ok(resultado === true, "se guarda el aviso (se evita el del navegador) para usarlo con el botón");
  await p.waitForSelector("[data-accion=instalar]");
  ok(await p.locator("#instalar").innerText().then((s) => /Tu navegador permite instalarla ahora/.test(s)), "el panel lo dice");
  await p.waitForFunction(() => /permite instalarla ahora/.test(document.querySelector("[data-testid=informe-instalacion]").innerText));
  ok(true, "y el informe se actualiza solo con el panel abierto");
  await p.click("[data-accion=instalar]");
  await p.waitForFunction(() => window.__avisos === 1);
  ok(true, "pulsar el botón le pide al navegador instalar (una vez)");
  await p.waitForFunction(() => /Ya estás usando la app instalada/.test(document.getElementById("instalar").innerText));
  ok(await p.locator("[data-accion=instalar]").count() === 0, "tras aceptar, el botón desaparece: «Ya estás usando la app instalada»");
  await ctx.close();

  titulo("si el navegador instala la app por su cuenta («appinstalled»)");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await p.click("#instalar summary");
  ok(/Ya estás usando la app instalada/.test(await p.locator("#instalar").innerText()), "lo dice");
  await ctx.close();

  titulo("si el service worker no se puede registrar: se ve el motivo");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR })); // service workers bloqueados
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.click("#instalar summary");
  await p.waitForSelector("[data-testid=informe-instalacion]");
  await p.waitForFunction(() => /El service worker falló: \S+/.test(document.querySelector("[data-testid=informe-instalacion]").innerText), null, { timeout: 10000 });
  const roto = await lineas(p);
  ok(roto.some((s) => /^El service worker falló: .*bloqueados/.test(s)), "dice que falló y por qué: " + roto.find((s) => /falló/.test(s)));
  ok(roto.some((s) => /^Manifiesto leído/.test(s)), "lo demás se sigue comprobando (el manifiesto está bien)");
  await ctx.close();

  titulo("si falta un archivo en el servidor: el panel lo señala y el service worker no se instala");
  // Una copia de dist/ a la que le falta un icono, que el service worker intenta guardar al instalarse
  const copia = fs.mkdtempSync(path.join(os.tmpdir(), "luz-rota-"));
  fs.cpSync(dist, copia, { recursive: true });
  fs.rmSync(path.join(copia, "icon-512.png"));
  const rota = await servir({ carpeta: copia, prefijo: "/luz-y-foto/beta/" });
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR, serviceWorkers: "allow" }));
  await p.goto(rota.base); await p.waitForSelector(".veredicto");
  await p.click("#instalar summary");
  await p.waitForFunction(() => /El service worker falló: El navegador descartó/.test(document.querySelector("[data-testid=informe-instalacion]")?.innerText || ""), null, { timeout: 10000 });
  const faltan = await lineas(p);
  ok(faltan.some((s) => /^Icono de 512 px: el servidor respondió 404/.test(s)), "el icono que falta: " + faltan.find((s) => /512/.test(s)));
  ok(faltan.some((s) => /^El service worker falló: El navegador descartó el service worker/.test(s)), "el service worker no se instaló: " + faltan.find((s) => /falló/.test(s)));
  ok(await p.evaluate(() => caches.keys().then((k) => k.length)) === 0, "y no deja una caché a medias");
  await ctx.close();
  rota.cerrar(); fs.rmSync(copia, { recursive: true, force: true });
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/", cacheControl: "max-age=600" });
