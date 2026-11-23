// La app en inglés: ni una palabra de español en ninguna pantalla (Hoy con cada pestaña y perfil, el asistente, el selector de lugar,
// sin conexión, Aprender y cada lección, con el texto de sus dibujos), la página dice que está en inglés, las horas siguen el formato
// del teléfono (AM/PM con en-US, 24 h con fr-FR) y la elección guardada manda sobre el teléfono.
//
// Ejecutar: node test/e2e/compilada/ingles.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");
const { recorrer } = require("../recorrido-texto.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}
const CLAVE = "luz-y-foto:idioma";
const lang = (p) => p.evaluate(() => document.documentElement.lang);
const descripcion = (p) => p.evaluate(() => document.querySelector('meta[name="description"]').getAttribute("content"));
const pulsado = (p) => p.evaluate(() => [...document.querySelectorAll(".selector-idioma button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.idioma));

// Lo que no es de la app y por tanto no se traduce: el nombre de la app («Ollada», también en el nombre de su caché) y los nombres de lugar que
// devuelven los servicios (Open-Meteo y Nominatim, simulados aquí con nombres españoles).
const AJENO = /Ollada|luz-y-foto-CACHE|Vigo|Galicia|Pontevedra|España|Estados Unidos|California/g;
// Palabras vacías del español (no existen como palabra suelta en inglés), signos de apertura y letras con tilde
const VACIAS = /(?<![\p{L}'’-])(el|la|los|las|de|del|que|para|con|por|una|un|y|o)(?![\p{L}'’-])/giu;
const SIGNOS = /[¿¡áéíóúñü]/i;
const HUECOS = /\{[^}]*\}|\[\[|\]\]|\bundefined\b|\[object|\b(?:app|nav|luz|selector|pestanas|version|sinConexion|idioma|receta|leccion|hoy)\.[a-zA-Z]+\b/;

function restosDeEspanol(texto) {
  const limpio = texto.replace(AJENO, " ");
  const palabras = [...new Set([...limpio.matchAll(VACIAS)].map((m) => m[0].toLowerCase()))];
  const signos = [...new Set([...limpio.matchAll(new RegExp(SIGNOS.source, "gi"))].map((m) => m[0]))];
  const huecos = limpio.match(HUECOS);
  return { palabras, signos, huecos: huecos ? huecos[0] : null };
}
// Un trozo alrededor de la primera palabra o signo que delata el español, para saber dónde mirar
const contexto = (texto, r) => {
  const clave = r.palabras[0] || r.signos[0] || r.huecos;
  const i = texto.toLowerCase().indexOf(String(clave).toLowerCase());
  return "«" + texto.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, " ") + "»";
};

ejecutar("ingles", async ({ b, base }) => {
  titulo("en-US: la página dice que está en inglés (<html lang>, descripción) y el nombre de la app es el de siempre");
  let { ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale: "en-US" });
  await p.goto(base); await p.waitForSelector(".veredicto");
  ok((await lang(p)) === "en", "<html lang> = en");
  ok(/^Tells you whether it's worth going out/.test(await descripcion(p)), "descripción en inglés: «" + (await descripcion(p)).slice(0, 50) + "…»");
  ok((await p.title()) === "Ollada", "título «Ollada» (el nombre no se traduce): «" + (await p.title()) + "»");
  ok((await p.locator("[data-tab]").allInnerTexts()).join() === "Sunrise,Sunset,Night", "pestañas: " + (await p.locator("[data-tab]").allInnerTexts()).join());
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("en-US: ninguna pantalla tiene español (texto visible, con los dibujos de las lecciones)");
  const pantallas = await recorrer({ b, base, locale: "en-US", conDibujos: true });
  const nombres = Object.keys(pantallas);
  ok(nombres.length >= 40, nombres.length + " pantallas recorridas (Hoy con 3 pestañas y 2 perfiles, el asistente, el selector, sin conexión, Aprender y cada lección)");
  for (const n of ["hoy/movil/amanecer", "hoy/camara/atardecer/termino", "asistente/bienvenida", "selector/resultados", "sin-conexion", "aprender", "leccion/la-rueda-de-modos", "leccion/fotografia-deportiva/termino"]) {
    ok(nombres.includes(n), "el recorrido incluye «" + n + "»");
  }
  for (const [n, texto] of Object.entries(pantallas)) {
    const r = restosDeEspanol(texto);
    const limpio = !r.palabras.length && !r.signos.length && !r.huecos;
    ok(limpio, n + (limpio ? "" : ": queda español o un hueco sin rellenar (" + [...r.palabras, ...r.signos, r.huecos].filter(Boolean).join(", ") + ") en " + contexto(texto.replace(AJENO, " "), r)));
  }
  const dibujos = Object.entries(pantallas).filter(([n]) => n.startsWith("leccion/") && !n.endsWith("/termino")).map(([, t]) => t).join("\n");
  ok(/Aperture/.test(dibujos) && /Foreground/.test(dibujos) && /Night mode/.test(dibujos), "el texto de los dibujos (SVG) está en el recorrido y en inglés");
  ok(/Short lessons, 2 or 3 minutes\./.test(pantallas.aprender), "Aprender: «Short lessons, 2 or 3 minutes.»");

  titulo("las horas siguen el formato del teléfono: AM/PM con en-US, 24 h con fr-FR (que también sale en inglés), 24 h con es-ES");
  for (const [locale, esperado, conAmPm] of [["en-US", "en", true], ["fr-FR", "en", false], ["es-ES", "es", false]]) {
    ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale }));
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    const horas = (await p.evaluate(() => document.body.innerText)).match(/\b\d{2}:\d{2}(?: [AP]M)?(?!\d)/g) || [];
    ok((await lang(p)) === esperado, locale + ": <html lang> = " + esperado);
    ok(horas.length >= 5 && horas.every((h) => /[AP]M$/.test(h) === conAmPm), locale + ": " + horas.length + " horas, todas " + (conAmPm ? "con AM/PM" : "de 24 h") + " (" + horas.slice(0, 4).join(", ") + "…)");
    ok(p.errores.length === 0, locale + ": sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("gl-ES se lee en español; fr-FR, en inglés");
  for (const [locale, pestanas] of [["gl-ES", "Amanecer,Atardecer,Noche"], ["fr-FR", "Sunrise,Sunset,Night"]]) {
    ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale }));
    await p.goto(base); await p.waitForSelector(".veredicto");
    ok((await p.locator("[data-tab]").allInnerTexts()).join() === pestanas, locale + ": pestañas " + pestanas);
    await ctx.close();
  }

  titulo("la elección guardada manda sobre el teléfono, y el selector solo tiene Español e English");
  ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale: "es-ES" }));
  await p.addInitScript((k) => { if (!sessionStorage.getItem("__sembrado")) { localStorage.setItem(k, "en"); sessionStorage.setItem("__sembrado", "1"); } }, CLAVE);
  await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
  ok((await lang(p)) === "en" && (await p.locator("[data-tab]").allInnerTexts()).join() === "Sunrise,Sunset,Night", "teléfono en español con «en» guardado: la app sale en inglés");
  ok((await pulsado(p)).join() === "en", "English marcado en el selector");
  ok(/^Idioma \/ Language$/.test(await p.locator(".selector-idioma h3").innerText()), "el rótulo del selector sigue siendo «Idioma / Language»");
  ok((await p.locator(".selector-idioma button").allInnerTexts()).map((t) => t.replace(/^✓\s*/, "").trim()).join("|") === "Español|English", "los botones son «Español» y «English», cada uno en su idioma y sin «Automático»");
  await Promise.all([p.waitForNavigation(), p.click(".selector-idioma button[data-idioma=es]")]);
  await p.waitForSelector(".veredicto");
  ok((await p.evaluate((k) => localStorage.getItem(k), CLAVE)) === "es" && (await lang(p)) === "es", "«Español» guarda es y la app pasa a español");
  ok((await pulsado(p)).join() === "es", "«Español» marcado");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("en inglés los números llevan punto decimal y el español, coma");
  for (const [locale, decimal] of [["en-US", /f\/2\.8/], ["es-ES", /f\/2,8/]]) {
    ({ ctx, p } = await nuevaPagina(b, { lugar: LUGAR, locale }));
    await p.goto(base + "#/aprender/el-manual-de-verdad"); await p.waitForSelector(".bloque-parrafo");
    ok(decimal.test(await p.locator("main").innerText()), locale + ": «f/2" + (locale === "en-US" ? "." : ",") + "8» en la lección del manual");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
