// El selector «Idioma / Language» (al final de Hoy y de Aprender) y el idioma con que arranca la app: el del teléfono si no se ha elegido
// nada, lo elegido si se ha elegido; el selector tiene solo Español e English (uno a cada lado, el centro vacío) y marca el idioma que se ve;
// elegir el otro guarda y recarga; tocar el que ya se ve no hace nada; si el navegador no deja guardar, lo dice y no recarga.
//
// Ejecutar: node test/e2e/compilada/selector-idioma.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

if (!fs.existsSync(path.join(RAIZ, "dist", "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}
const CLAVE = "luz-y-foto:idioma";
const lang = (p) => p.evaluate(() => document.documentElement.lang);
const guardado = (p) => p.evaluate((k) => localStorage.getItem(k), CLAVE);
const pulsado = (p) => p.evaluate(() => [...document.querySelectorAll(".selector-idioma button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.idioma));

ejecutar("selector-idioma", async ({ b, base }) => {
  titulo("el selector está al final de Hoy y de Aprender, con dos opciones y el idioma que se ve marcado");
  let { ctx, p } = await nuevaPagina(b, { lugar: LUGAR });
  await p.goto(base); await p.waitForSelector(".veredicto");
  for (const [pantalla, url] of [["Hoy", base + "#/hoy"], ["Aprender", base + "#/aprender"]]) {
    await p.goto(url);
    await p.waitForSelector(".selector-idioma");
    ok(await p.locator(".selector-idioma").count() === 1, pantalla + ": un solo selector");
    ok((await p.locator(".selector-idioma h3").innerText()) === "Idioma / Language", pantalla + ": rótulo «Idioma / Language»");
    ok((await p.locator(".selector-idioma button").evaluateAll((l) => l.map((e) => e.dataset.idioma))).join() === "es,en", pantalla + ": opciones es, en (sin «Automático»)");
    ok((await pulsado(p)).join() === "es", pantalla + ": «Español» marcado (el teléfono está en español)");
    ok(await p.locator(".selector-idioma button[data-idioma=es]").evaluate((e) => getComputedStyle(e, "::before").content.startsWith('"✓')), pantalla + ": lo marcado lleva ✓ (no solo color)");
    const caja = await p.locator(".selector-idioma").boundingBox();
    const antes = await p.locator(pantalla === "Hoy" ? "details.instalar" : "ol.lecciones >> nth=-1").boundingBox();
    ok(caja.x >= 0 && caja.x + caja.width <= 390, pantalla + ": el selector cabe en 390 px");
    ok(caja.y >= antes.y + antes.height, pantalla + ": va después de " + (pantalla === "Hoy" ? "«Instalar la app»" : "la última lección"));
  }
  ok((await lang(p)) === "es", "teléfono en español: <html lang> = es");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("idioma del teléfono sin elegir nada: es-ES→es, en-US→en, fr-FR→en, gl-ES→es");
  for (const [locale, esperado] of [["es-ES", "es"], ["en-US", "en"], ["fr-FR", "en"], ["gl-ES", "es"]]) {
    ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale }));
    await p.goto(base); await p.waitForSelector(".veredicto");
    ok((await lang(p)) === esperado, locale + " → <html lang> = " + esperado + " (sale " + (await lang(p)) + ")");
    ok((await guardado(p)) === null, locale + ": sin elegir no se guarda nada");
    await ctx.close();
  }

  titulo("elegir English: se guarda, se recarga y manda sobre el teléfono");
  ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale: "es-ES" }));
  await p.goto(base); await p.waitForSelector(".veredicto");
  await p.evaluate(() => { window.__antes = true; });
  await Promise.all([p.waitForNavigation(), p.click(".selector-idioma button[data-idioma=en]")]);
  await p.waitForSelector(".veredicto");
  ok(!(await p.evaluate(() => window.__antes)), "la página se recargó");
  ok((await guardado(p)) === "en", "guardado: en");
  ok((await lang(p)) === "en", "<html lang> = en");
  ok((await pulsado(p)).join() === "en", "English marcado tras recargar");
  await p.goto(base + "#/aprender"); await p.waitForSelector(".selector-idioma");
  ok((await pulsado(p)).join() === "en" && (await lang(p)) === "en", "en Aprender sigue en inglés");

  titulo("elegir Español con el teléfono en inglés");
  await ctx.close();
  ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale: "en-US" }));
  await p.addInitScript((k) => { if (!sessionStorage.getItem("__sembrado")) { localStorage.setItem(k, "es"); sessionStorage.setItem("__sembrado", "1"); } }, CLAVE);
  await p.goto(base); await p.waitForSelector(".veredicto");
  ok((await lang(p)) === "es", "elección «es» manda sobre un teléfono en inglés");
  ok((await pulsado(p)).join() === "es", "Español marcado");
  await Promise.all([p.waitForNavigation(), p.click(".selector-idioma button[data-idioma=en]")]);
  await p.waitForSelector(".veredicto");
  ok((await guardado(p)) === "en" && (await lang(p)) === "en" && (await pulsado(p)).join() === "en", "elegir English con «es» guardado: guarda en, recarga en inglés y lo marca");
  await ctx.close();

  titulo("tocar el idioma que ya se ve no guarda ni recarga");
  ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale: "en-US" }));
  await p.goto(base); await p.waitForSelector(".veredicto");
  ok((await pulsado(p)).join() === "en", "teléfono en inglés y nada guardado: English marcado");
  await p.evaluate(() => { window.__marca = true; });
  await p.click(".selector-idioma button[data-idioma=en]");
  await p.waitForTimeout(300);
  ok((await p.evaluate(() => window.__marca === true)) && (await guardado(p)) === null, "no recarga y no guarda nada");
  await ctx.close();

  titulo("una elección guardada rara, o la «auto» de versiones anteriores, se trata como sin elegir: manda el teléfono");
  for (const raro of ["auto", "klingon"]) {   // la última página se queda abierta para la prueba de «no deja guardar»
    ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale: "es-ES" }));
    await p.addInitScript(({ k, v }) => { localStorage.setItem(k, v); }, { k: CLAVE, v: raro });
    await p.goto(base); await p.waitForSelector(".veredicto");
    ok((await lang(p)) === "es" && (await pulsado(p)).join() === "es", "«" + raro + "» guardado: sale en el idioma del teléfono y «Español» marcado");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    if (raro !== "klingon") await ctx.close();
  }

  titulo("si el navegador no deja guardar: lo dice y no recarga");
  await p.evaluate((k) => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (clave, valor) { if (clave === k) throw new Error("sin espacio"); return set.call(this, clave, valor); };
    window.__marca = true;
  }, CLAVE);
  await p.click(".selector-idioma button[data-idioma=en]");
  await p.waitForSelector(".selector-idioma [role=status]");
  ok(/no deja guardar/i.test(await p.locator(".selector-idioma [role=status]").innerText()), "avisa de que no se puede guardar");
  ok(await p.evaluate(() => window.__marca === true), "no recarga");
  ok(p.errores.length === 0, "sin errores al fallar el guardado: " + p.errores.join(";"));
  await ctx.close();
});
