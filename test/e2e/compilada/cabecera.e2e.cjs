// La cabecera de «La luz de ahora»: un cielo (imagen) que cambia con la pestaña y con el semáforo del día elegido, el
// título, la hora de la previsión y el lugar en una pastilla. Aguanta no tener previsión, un nombre de lugar larguísimo
// con una letra ancha en 320 px, y se ve también sin conexión.
//
// Ejecutar: node test/e2e/compilada/cabecera.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, previsionConCambios, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LARGO = { ...LUGAR, nombre: "Santiago de Compostela, A Coruña, Galicia (comarca de Santiago)" };
const A = "**/api.open-meteo.com/**";
// Un día despejado de verdad, con buena visibilidad (el 20 de noviembre, el primer amanecer de la lista a las 15:00 del 19)
const DESPEJADO = { cloud_cover_low: 10, cloud_cover_mid: 40, cloud_cover_high: 40, precipitation: 0, precipitation_probability: 10, visibility: 25000, weather_code: 3 };
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
    ok(c.h1.length === 1 && c.h1[0] === "Ollada", "un solo h1, «Ollada»: " + c.h1.join("|"));
    ok(/^Previsión de las \d\d:\d\d/.test(c.estado), "la hora de la previsión: " + c.estado);
    ok(c.lugar === "Vigo, Galicia", "el lugar: " + c.lugar);

    for (const [pestana, base_] of [["amanecer", "amanecer"], ["atardecer", "tarde"], ["luna", "noche"]]) {
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
    ok(c.h1 === "Ollada" && c.lugar === "Vigo, Galicia", "título y lugar siguen ahí");
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
    const separadas = await p.evaluate(() => document.querySelector("#tabs").getBoundingClientRect().top - document.querySelector("#selector").getBoundingClientRect().bottom);
    ok(separadas >= 0, "con el selector abierto las pestañas van debajo de él, sin solaparlo (" + Math.round(separadas) + " px)");
    await p.click("#cambiar");
    ok(await p.isHidden("#selector"), "al pulsarla otra vez se cierra");
    const solape = await p.evaluate(() => document.querySelector("header.cabecera").getBoundingClientRect().bottom - document.querySelector("#tabs").getBoundingClientRect().top);
    ok(solape >= 26 && solape <= 28, "cerrado el selector, las pestañas vuelven a solapar el cielo 27 px (" + solape.toFixed(1) + ")");
    await ctx.close();
  }

  titulo("E: el texto blanco de la cabecera se lee sobre el cielo (contraste de al menos 4,5 : 1 en el 95 % de las letras)");
  // Se mide donde de verdad están las letras: se hace una captura normal y otra con el texto transparente (que conserva la sombra y
  // todo lo que hay debajo); las letras son los píxeles blancos de la primera, y su fondo, el mismo píxel de la segunda.
  const contrasteDe = async (p) => {
    const cajas = await p.evaluate(() => { const cab = document.querySelector("header.cabecera").getBoundingClientRect(); return ["h1", "#estado"].map((q) => { const r = document.querySelector("header.cabecera " + q).getBoundingClientRect(); return { n: q, x: r.left - cab.left, y: r.top - cab.top, w: r.width, h: r.height }; }); });
    const con = (await p.locator("header.cabecera").screenshot()).toString("base64");
    const estilo = await p.addStyleTag({ content: "header.cabecera h1, header.cabecera #estado { color: transparent !important; }" });
    const sin = (await p.locator("header.cabecera").screenshot()).toString("base64");
    await estilo.evaluate((e) => e.remove());
    return p.evaluate(async ({ con, sin, cajas }) => {
      // createImageBitmap decodifica los bytes sin pedir nada: una imagen «data:» la bloquearía la política de seguridad de la app (img-src 'self')
      const abrir = async (b64) => { const img = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))], { type: "image/png" })); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x; };
      const [X, Y] = [await abrir(con), await abrir(sin)];
      const lum = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const salida = {};
      for (const c of cajas) {
        const [x0, y0, w, h] = [Math.floor(c.x), Math.floor(c.y), Math.ceil(c.w), Math.ceil(c.h)];
        const a = X.getImageData(x0, y0, w, h).data, f = Y.getImageData(x0, y0, w, h).data, ls = [];
        for (let i = 0; i < a.length; i += 4) if (a[i] > 245 && a[i + 1] > 245 && a[i + 2] > 245 && (f[i] < 240 || f[i + 1] < 240)) ls.push(0.2126 * lum(f[i]) + 0.7152 * lum(f[i + 1]) + 0.0722 * lum(f[i + 2]));
        ls.sort((m, n) => m - n);
        // El contraste del blanco con el fondo de la letra que está en el percentil 95 de claridad (el 5 % peor queda fuera: estrellas, bordes)
        salida[c.n] = { letras: ls.length, contraste: ls.length ? 1.05 / (ls[Math.min(ls.length - 1, Math.floor(0.95 * ls.length))] + 0.05) : 0 };
      }
      return salida;
    }, { con, sin, cajas });
  };
  for (const ancho of [320, 390]) {
    for (const [nombre, preparar, datos, cielo] of [
      ["Amanecer, día despejado (cielo de amanecer)", async (p) => { await p.waitForSelector(".veredicto"); await p.click("[data-tab=amanecer]"); }, previsionConCambios(DESPEJADO), "amanecer"],
      ["Amanecer, día rojo (cielo de amanecer cubierto)", async (p) => { await p.waitForSelector(".veredicto"); await p.click("[data-tab=amanecer]"); }, previsionConCambios({ ...DESPEJADO, cloud_cover_low: 95 }), "amanecer-cubierta"],
      ["Atardecer, día despejado (cielo de tarde)", async (p) => { await p.waitForSelector(".veredicto"); await p.click("#dias button[data-i='0']"); }],
      ["Atardecer, día rojo (cielo de tarde cubierto)", async (p) => { await p.waitForSelector(".veredicto"); await p.click("#dias button[data-i='1']"); }],
      ["Noche, noche despejada (cielo de noche)", async (p) => { await p.waitForSelector(".veredicto"); await p.click("[data-tab=luna]"); await p.click("#dias button[data-i='1']"); }]
    ]) {
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, perfil: PERFIL, lugar: LUGAR, colorScheme: "light" });
      if (datos) await p.route(A, (r) => r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(datos) }));
      await p.goto(base + "#/hoy"); await preparar(p); await p.waitForTimeout(400);
      if (cielo) ok(await p.locator("header.cabecera").getAttribute("data-cielo") === cielo, nombre + ", " + ancho + " px: el cielo es «" + cielo + "»");
      const c = await contrasteDe(p);
      ok(c.h1.letras > 100 && c["#estado"].letras > 100, nombre + ", " + ancho + " px: se han encontrado las letras (" + c.h1.letras + " y " + c["#estado"].letras + ")");
      ok(c.h1.contraste >= 4.5, nombre + ", " + ancho + " px, título: " + c.h1.contraste.toFixed(2) + " : 1");
      ok(c["#estado"].contraste >= 4.5, nombre + ", " + ancho + " px, hora de la previsión: " + c["#estado"].contraste.toFixed(2) + " : 1");
      await ctx.close();
    }
    // El aviso de error es el texto más largo y baja hacia el horizonte, que es lo más claro del cielo: el caso más difícil
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, permisos: false, lugar: LUGAR, colorScheme: "light" });
    await p.route(A, (r) => r.abort("internetdisconnected"));
    await p.goto(base + "#/hoy");
    await p.waitForFunction(() => /No se han podido cargar/.test(document.querySelector("#estado").textContent));
    await p.waitForTimeout(400);
    const e = await contrasteDe(p);
    ok(e["#estado"].letras > 300, "aviso de error, " + ancho + " px: se han encontrado las letras (" + e["#estado"].letras + ")");
    ok(e["#estado"].contraste >= 4.5, "aviso de error, " + ancho + " px: " + e["#estado"].contraste.toFixed(2) + " : 1");
    await ctx.close();
  }

  titulo("F: sin conexión, el cielo sale de la caché");
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
}, { carpeta: dist, prefijo: "/ollada/" });
