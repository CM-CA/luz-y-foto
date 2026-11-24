// La web publicada lleva una política de seguridad de contenido (CSP): solo se ejecuta código de la propia app y solo se habla con los
// tres servicios que usa (previsión y búsqueda de lugares de Open-Meteo, y nombre del lugar de OpenStreetMap). Si algún día se cuela texto
// ajeno en una página (un fallo de inyección), el navegador se niega a ejecutarlo y a mandar nada fuera.
// GitHub Pages no deja poner cabeceras, así que la política va en una etiqueta <meta> que se añade al compilar (vite.config.mjs).
//
// Se comprueba que (1) está y es estricta, (2) la app entera funciona con ella (todas las pantallas, lecciones y los dos idiomas, sin una
// sola infracción) y (3) el navegador bloquea de verdad un script en línea, una petición y una imagen de otro sitio.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/seguridad.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const IDS = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "es", "lecciones.json"), "utf8")).grupos.flatMap((g) => g.lecciones);

ejecutar("seguridad", async ({ b, base }) => {
  titulo("la política está en la página compilada y es estricta");
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/);
  ok(!!meta, "index.html lleva <meta http-equiv=\"Content-Security-Policy\">");
  // Vite escribe las comillas del atributo como entidades (&#39;): el navegador las decodifica, y aquí también
  const texto = (meta ? meta[1] : "").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const politica = Object.fromEntries(texto.split(";").map((s) => s.trim()).filter(Boolean).map((s) => { const [k, ...v] = s.split(/\s+/); return [k, v]; }));
  const es = (directiva, ...valores) => (politica[directiva] || []).slice().sort().join(" ") === valores.slice().sort().join(" ");
  ok(es("default-src", "'self'"), "por defecto, solo lo de la propia app");
  ok(es("script-src", "'self'"), "scripts: solo los de la app (ni en línea ni 'unsafe-eval')");
  ok(es("object-src", "'none'") && es("base-uri", "'self'"), "sin plugins y sin poder cambiar la dirección base");
  ok(es("connect-src", "'self'", "https://api.open-meteo.com", "https://geocoding-api.open-meteo.com", "https://nominatim.openstreetmap.org"), "peticiones: la app y los tres servicios que usa, nada más");
  ok(es("img-src", "'self'") && es("font-src", "'self'") && es("manifest-src", "'self'") && es("worker-src", "'self'"), "imágenes, letras, manifiesto y service worker: solo de la app");
  ok(es("form-action", "'none'"), "ningún formulario manda datos a ninguna parte (el buscador se resuelve dentro de la app)");
  ok(!texto.includes("*") && !/unsafe-eval/.test(texto) && !/script-src[^;]*unsafe-inline/.test(texto), "sin comodines ni permisos peligrosos para scripts");

  titulo("la app entera funciona con esa política: todas las pantallas, en los dos idiomas, sin una infracción");
  const { ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR, serviceWorkers: "allow" });
  await p.addInitScript(() => {
    window.__violaciones = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__violaciones.push(e.violatedDirective + " → " + e.blockedURI));
  });
  const recorrer = async (idioma) => {
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    await p.click("#instalar summary");
    await p.click("nav.nav-inferior a[href='#/aprender']"); await p.waitForSelector("ol.lecciones");
    for (const id of IDS) {
      await p.evaluate((h) => { location.hash = h; }, "#/aprender/" + id);
      await p.waitForSelector(".leccion-meta");
    }
    const dibujos = await p.locator(".dibujo-svg svg").count();
    ok(dibujos >= 0, idioma + ": " + IDS.length + " lecciones recorridas (el último dibujo: " + dibujos + ")");
  };
  await recorrer("es");
  await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
  await Promise.all([p.waitForNavigation(), p.click(".selector-idioma button[data-idioma=en]")]);
  await p.waitForSelector(".veredicto");
  await recorrer("en");
  const violaciones = await p.evaluate(() => window.__violaciones);
  ok(violaciones.length === 0, "ninguna infracción de la política: " + violaciones.join(" ; "));
  ok(p.errores.length === 0, "sin errores en la consola: " + p.errores.join(" ; "));

  titulo("y el navegador bloquea de verdad lo que no es de la app");
  await p.route("https://example.com/**", (r) => r.fulfill({ contentType: "text/plain", headers: { "access-control-allow-origin": "*" }, body: "ok" }));
  const intentos = await p.evaluate(async () => {
    const s = document.createElement("script"); s.textContent = "window.__inyectado = true"; document.head.appendChild(s);
    let red = "permitida"; try { await fetch("https://example.com/"); } catch (e) { red = "bloqueada"; }
    const i = new Image(); i.src = "https://example.com/x.png";
    await new Promise((r) => setTimeout(r, 300));
    return { inyectado: window.__inyectado === true, red, violaciones: window.__violaciones };
  });
  ok(!intentos.inyectado, "un script en línea no se ejecuta");
  ok(intentos.red === "bloqueada", "una petición a otro sitio se bloquea");
  const directivas = intentos.violaciones.map((v) => v.split(" ")[0].replace(/-elem$/, ""));
  ok(["script-src", "connect-src", "img-src"].every((d) => directivas.includes(d)), "el navegador avisa de las tres infracciones: " + intentos.violaciones.join(" ; "));
  await ctx.close();
});
