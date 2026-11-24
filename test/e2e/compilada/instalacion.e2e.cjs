// Panel «Instalar la app y uso sin conexión»: explica cómo instalarla, ofrece el botón cuando el navegador lo permite y dice si ya está
// instalada. NO enseña datos técnicos (archivos de la app, versiones, cachés, estado del manifiesto o del service worker): eso no es para
// quien usa la app y, además, da pistas sobre cómo está montada. Tampoco se contradice: «Ya estás usando la app instalada» solo sale
// cuando de verdad se abrió desde su icono; si se acaba de instalar desde el navegador, dice que ya está instalada y cómo abrirla.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/instalacion.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { RAIZ, LUGAR, servir, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "sw.js"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}
// Lo que no debe verse nunca en el panel: nombres de archivos compilados, nombres de caché, versiones (12 caracteres hexadecimales),
// manifiesto, service worker, caché o direcciones
const TECNICO = /index-[\w-]+\.js|luz-y-foto-|\b[0-9a-f]{12}\b|manifiest|service worker|cach[eé]|https?:\/\/|standalone/i;
const panel = (p) => p.locator("#instalar").innerText();
const sinTecnicismos = async (p) => { const t = await panel(p); return !TECNICO.test(t); };

ejecutar("instalacion", async ({ b, base }) => {
  titulo("con service worker: el panel da las instrucciones y no enseña nada técnico");
  let { ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR, serviceWorkers: "allow" });
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
  ok(await p.locator("#instalar").evaluate((e) => !e.open), "el panel empieza cerrado");
  await p.click("#instalar summary");
  ok(/Si tu navegador no te ofrece instalarla/.test(await panel(p)), "con instrucciones para instalar a mano");
  ok(await p.locator("[data-testid=informe-instalacion]").count() === 0, "no hay informe de instalación");
  ok(await p.locator("#instalar h4").count() === 0 && await p.locator("#instalar ul").count() === 0, "ni título «Estado de esta instalación» ni lista de comprobaciones");
  ok(await sinTecnicismos(p), "ni archivos, ni versiones, ni cachés, ni manifiesto: «" + (await panel(p)).replace(/\n+/g, " | ") + "»");
  ok(!/Ya estás usando la app instalada|Estás en el navegador/.test(await panel(p)), "no dice que se use como app (se está en el navegador)");
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
  ok(/Tu navegador permite instalarla ahora/.test(await panel(p)), "el panel lo dice");
  await p.click("[data-accion=instalar]");
  await p.waitForFunction(() => window.__avisos === 1);
  ok(true, "pulsar el botón le pide al navegador instalar (una vez)");
  await p.waitForFunction(() => /ya está instalada/i.test(document.getElementById("instalar").innerText));
  ok(await p.locator("[data-accion=instalar]").count() === 0, "tras aceptar, el botón desaparece");
  ok(/ya está instalada\. Ábrela desde su icono/.test(await panel(p)), "dice que ya está instalada y cómo abrirla: «" + (await panel(p)).replace(/\n+/g, " | ") + "»");
  ok(!/Ya estás usando la app instalada/.test(await panel(p)), "pero no que se esté usando como app: se sigue en el navegador");
  ok(await sinTecnicismos(p), "sigue sin enseñar nada técnico");
  await ctx.close();

  titulo("si el navegador instala la app por su cuenta («appinstalled»)");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await p.click("#instalar summary");
  ok(/ya está instalada\. Ábrela desde su icono/.test(await panel(p)) && !/Ya estás usando/.test(await panel(p)), "dice que ya está instalada (no que se use como app)");
  await ctx.close();

  titulo("abierta desde su icono (modo «standalone»): dice que ya se usa como app");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await p.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (q) => /display-mode:\s*standalone/.test(q)
      ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } }
      : original(q);
  });
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.click("#instalar summary");
  ok(/Ya estás usando la app instalada\./.test(await panel(p)), "«Ya estás usando la app instalada»");
  ok(await p.locator("[data-accion=instalar]").count() === 0 && await sinTecnicismos(p), "sin botón y sin nada técnico");
  await ctx.close();

  titulo("si el service worker no se puede registrar: la app y el panel siguen igual, sin mensajes técnicos");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR })); // service workers bloqueados
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.click("#instalar summary");
  ok(/Si tu navegador no te ofrece instalarla/.test(await panel(p)), "el panel sigue con sus instrucciones");
  ok(await sinTecnicismos(p) && !/falló|bloquead/i.test(await panel(p)), "no cuenta el fallo ni sus motivos");
  ok(await p.locator(".veredicto").count() === 1, "y la app funciona");
  await ctx.close();

  titulo("si falta un archivo en el servidor: el service worker no se instala, no deja una caché a medias y no se cuenta en pantalla");
  // Una copia de dist/ a la que le falta un icono, que el service worker intenta guardar al instalarse
  const copia = fs.mkdtempSync(path.join(os.tmpdir(), "luz-rota-"));
  fs.cpSync(dist, copia, { recursive: true });
  fs.rmSync(path.join(copia, "icon-512.png"));
  const rota = await servir({ carpeta: copia, prefijo: "/ollada/" });
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR, serviceWorkers: "allow" }));
  await p.goto(rota.base); await p.waitForSelector(".veredicto");
  await p.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !r || (!r.installing && !r.waiting && !r.active); }, null, { timeout: 10000 });
  await p.click("#instalar summary");
  ok(await p.evaluate(() => caches.keys().then((k) => k.length)) === 0, "no queda una caché a medias");
  ok(await sinTecnicismos(p) && !/falló|descartó|404/i.test(await panel(p)), "el panel no enseña el motivo técnico");
  await ctx.close();
  rota.cerrar(); fs.rmSync(copia, { recursive: true, force: true });
}, { carpeta: dist, prefijo: "/ollada/", cacheControl: "max-age=600" });
