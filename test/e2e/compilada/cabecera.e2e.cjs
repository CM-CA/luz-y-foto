// La cabecera de «La luz de ahora»: un cielo (imagen) que cambia con la pestaña y con el semáforo del día elegido, el
// título, la hora de la previsión y el lugar en una pastilla. Aguanta no tener previsión, un nombre de lugar larguísimo
// con una letra ancha en 320 px, y se ve también sin conexión.
//
// Ejecutar: node test/e2e/compilada/cabecera.e2e.cjs   (antes: npm run build -- --base=/luz-y-foto/beta/)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const LARGO = { ...LUGAR, nombre: "Santiago de Compostela, A Coruña, Galicia (comarca de Santiago)" };
const A = "**/api.open-meteo.com/**";
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";
// El nombre del archivo de la imagen lleva el cielo; el hash de Vite tiene 8 caracteres, y así «tarde» no se confunde con «tarde-cubierta»
const archivoDe = (id) => new RegExp("/cielo-" + id + "-[A-Za-z0-9_-]{8}\\.webp$");

ejecutar("cabecera", async ({ b, base }) => {
  titulo("A: el cielo sigue a la pestaña y al semáforo del día");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const c = await p.evaluate(() => {
      const h = document.querySelector("header.cabecera"), img = h && h.querySelector("img.cielo");
      return {
        alto: h ? h.getBoundingClientRect().height : 0, ancho: img ? img.naturalWidth : 0, altoImg: img ? img.naturalHeight : 0,
        h1: [...document.querySelectorAll("h1")].map((x) => x.textContent.trim()), alt: img ? img.getAttribute("alt") : null,
        estado: document.querySelector("#estado").textContent.trim(), lugar: document.querySelector("#nombreLugar").textContent.trim()
      };
    });
    ok(Math.abs(c.alto - 262) <= 1, "la cabecera mide 262 px de alto a 390 px: " + c.alto);
    ok(c.ancho === 780 && c.altoImg === 524, "la imagen del cielo carga y mide 780 × 524: " + c.ancho + " × " + c.altoImg);
    ok(c.alt === "", "la imagen es decorativa (alt vacío)");
    ok(c.h1.length === 1 && c.h1[0] === "Luz y foto", "un solo h1, «Luz y foto»: " + c.h1.join("|"));
    ok(/^Previsión de las \d\d:\d\d/.test(c.estado), "la hora de la previsión: " + c.estado);
    ok(c.lugar === "Vigo, Galicia", "el lugar: " + c.lugar);

    for (const [pestana, base_] of [["atardecer", "tarde"], ["luna", "noche"]]) {
      await p.click("[data-tab=" + pestana + "]");
      const dias = await p.locator("#dias button").count();
      ok(dias >= 2, pestana + ": hay " + dias + " días");
      for (let i = 0; i < dias; i++) {
        await p.click("#dias button[data-i='" + i + "']");
        const r = await p.evaluate(() => ({
          cielo: document.querySelector("header.cabecera").dataset.cielo,
          nivel: document.querySelector("#dias button[aria-pressed=true]").dataset.nivel,
          src: document.querySelector("header.cabecera img.cielo").getAttribute("src")
        }));
        const esperado = base_ + (r.nivel === "rojo" ? "-cubierta" : "");
        ok(r.cielo === esperado, pestana + ", día " + i + " (semáforo " + r.nivel + "): cielo «" + r.cielo + "» (esperado «" + esperado + "»)");
        ok(archivoDe(esperado).test(r.src), "  y la imagen es la de ese cielo: " + r.src);
      }
    }
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: sin previsión (primera visita sin red) la cabecera se pinta igual");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR });
    await p.route(A, (r) => r.abort("internetdisconnected"));
    await p.goto(base + "#/hoy");
    await p.waitForFunction(() => /No se han podido cargar/.test(document.querySelector("#estado").textContent));
    const c = await p.evaluate(() => {
      const h = document.querySelector("header.cabecera"), img = h && h.querySelector("img.cielo");
      return { hay: !!h, cielo: h && h.dataset.cielo, ancho: img ? img.naturalWidth : 0, h1: document.querySelector("h1").textContent.trim(), lugar: document.querySelector("#nombreLugar").textContent.trim() };
    });
    ok(c.hay && /^(tarde|noche)$/.test(c.cielo), "hay cabecera con un cielo por defecto: " + c.cielo);
    ok(c.ancho === 780, "la imagen carga");
    ok(c.h1 === "Luz y foto" && c.lugar === "Vigo, Galicia", "título y lugar siguen ahí");
    ok(p.errores.every((e) => /net::ERR_INTERNET_DISCONNECTED/.test(e)), "solo los errores de red: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("C: un nombre de lugar larguísimo no desborda ni pisa el título (letra normal y ancha)");
  for (const [nombreLetra, css] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
    for (const ancho of [320, 360, 390]) {
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 800 }, perfil: PERFIL, lugar: LARGO });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      if (css) await p.addStyleTag({ content: css });
      const r = await p.evaluate(() => {
        const cab = document.querySelector("header.cabecera").getBoundingClientRect();
        const pastilla = document.querySelector("#cambiar").getBoundingClientRect();
        const h1 = document.querySelector("header.cabecera h1").getBoundingClientRect();
        const dentro = (x) => x.left >= cab.left - 0.5 && x.right <= cab.right + 0.5 && x.top >= cab.top - 0.5 && x.bottom <= cab.bottom + 0.5;
        const separados = pastilla.left >= h1.right - 0.5 || pastilla.right <= h1.left + 0.5 || pastilla.top >= h1.bottom - 0.5 || pastilla.bottom <= h1.top + 0.5;
        return { pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, pastillaDentro: dentro(pastilla), h1Dentro: dentro(h1), separados };
      });
      ok(r.pagina <= 0 && r.pastillaDentro && r.h1Dentro && r.separados, nombreLetra + ", " + ancho + " px" + (r.pagina > 0 ? " (la página desborda " + r.pagina + " px)" : "") + (r.pastillaDentro ? "" : " (la pastilla se sale de la cabecera)") + (r.h1Dentro ? "" : " (el título se sale)") + (r.separados ? "" : " (pastilla y título se pisan)"));
      ok(p.errores.length === 0, "  sin errores: " + p.errores.join(";"));
      await ctx.close();
    }
  }

  titulo("D: la pastilla abre el selector de lugar debajo de la cabecera");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    ok(await p.getAttribute("#cambiar", "aria-expanded") === "false" && await p.isHidden("#selector"), "cerrado al principio");
    await p.click("#cambiar");
    ok(await p.getAttribute("#cambiar", "aria-expanded") === "true" && await p.isVisible("#selector"), "al pulsarla se abre");
    const caja = await p.evaluate(() => ({ cab: document.querySelector("header.cabecera").getBoundingClientRect().bottom, sel: document.querySelector("#selector").getBoundingClientRect().top }));
    ok(caja.sel >= caja.cab - 1, "el selector queda debajo de la cabecera (" + Math.round(caja.sel) + " ≥ " + Math.round(caja.cab) + ")");
    await p.click("#cambiar");
    ok(await p.isHidden("#selector"), "al pulsarla otra vez se cierra");
    await ctx.close();
  }

  titulo("E: sin conexión, el cielo sale de la caché");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false, serviceWorkers: "allow", lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector("header.cabecera");
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    await ctx.setOffline(true);
    await p.reload(); await p.waitForSelector("header.cabecera");
    await p.waitForFunction(() => document.querySelector("header.cabecera img.cielo").complete);
    const ancho = await p.evaluate(() => document.querySelector("header.cabecera img.cielo").naturalWidth);
    ok(ancho === 780, "la imagen del cielo carga con la red cortada: " + ancho);
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
