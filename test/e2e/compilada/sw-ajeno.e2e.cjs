// La primera visita a la app no avisa de «hay una versión nueva» aunque la página ya esté controlada por el service worker
// de OTRA web del mismo dominio.
//
// Pasa de verdad: cm-ca.github.io tiene en su raíz el service worker del blog (alcance «/»), que controla también las
// páginas de /ollada/ hasta que el de la app se activa. Aquí se sirve, junto a la app, un service worker de ese tipo.
// El aviso solo es cierto si el service worker que controla la página es el MISMO registro de la app y hay otro esperando.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/sw-ajeno.e2e.cjs
"use strict";
const { VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const extras = {
  "/otra-web.html": { tipo: "text/html; charset=utf-8", cuerpo: "<!doctype html><title>otra web</title><script>navigator.serviceWorker.register('/sw-otra-web.js', { scope: '/' })</script>" },
  "/sw-otra-web.js": { tipo: "text/javascript; charset=utf-8", cuerpo: "self.addEventListener('install', () => self.skipWaiting()); self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));" }
};
const conServiceWorker = { permisos: false, serviceWorkers: "allow", lugar: { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" } };

ejecutar("sw-ajeno", async ({ b, base }) => {
  const origen = new URL(base).origin;
  const { ctx, p } = await nuevaPagina(b, conServiceWorker);

  titulo("la otra web ya tiene su service worker en la raíz del dominio");
  const otra = await ctx.newPage();
  await otra.goto(origen + "/otra-web.html");
  await otra.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
  ok(true, "registrado con alcance «/» y controlando su página");

  titulo("primera visita a la app, con ese service worker controlando la página");
  await p.addInitScript(() => { window.__controlAlCargar = navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : "ninguno"; });
  await p.goto(base); await p.waitForSelector("[data-tab]");
  const alCargar = await p.evaluate(() => window.__controlAlCargar);
  ok(/\/sw-otra-web\.js$/.test(alCargar), "al cargar, controla la página el service worker de la otra web: " + alCargar);
  await p.waitForFunction(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); }, null, { timeout: 10000 });
  await p.waitForTimeout(500);
  const reg = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return { alcance: new URL(r.scope).pathname, activo: !!r.active, espera: !!r.waiting }; });
  ok(reg.alcance === "/ollada/" && reg.activo && !reg.espera, "el service worker de la app se instala y activa sin dejar nada esperando: " + JSON.stringify(reg));
  ok(await p.locator("[data-testid=aviso-version]").count() === 0, "no sale «hay una versión nueva»: es la primera instalación, no hay nada que actualizar");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
}, { extras });
