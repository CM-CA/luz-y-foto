/*
 * Ayudas comunes de las pruebas de navegador (e2e): servidor, navegador, página con todo simulado.
 *
 * Todo lo externo está simulado (previsión, nombre de lugar, GPS y reloj), así que las pruebas
 * dan siempre el mismo resultado y no necesitan red.
 *
 * Por defecto sirven la carpeta del repositorio y abren prueba/hoy.html. Para probar otra versión
 * (por ejemplo, la compilada con Svelte) se indican por variables de entorno:
 *   E2E_BASE_URL  servidor ya en marcha (no se levanta el propio)
 *   E2E_HOY_URL   dirección completa de la pantalla Hoy
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const RAIZ = path.join(__dirname, "..", "..");
const VIGO = { latitude: 42.2328, longitude: -8.7226 };
const PONTE = { latitude: 42.4338, longitude: -8.6476 };
const FECHA = "2026-11-19T15:00:00+01:00";

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".md": "text/markdown; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

function playwright() {
  try { return require("playwright"); } catch (e) { return require("/opt/npm-tools/node_modules/playwright"); }
}

// Servidor estático con la carpeta del repositorio. Se usa 127.0.0.1 porque el navegador lo trata
// como contexto seguro, y la ubicación (GPS) solo funciona en contextos seguros.
function servir() {
  if (process.env.E2E_BASE_URL) return Promise.resolve({ base: process.env.E2E_BASE_URL.replace(/\/?$/, "/"), cerrar() {} });
  return new Promise((resolver) => {
    const s = http.createServer((q, r) => {
      const ruta = decodeURIComponent(new URL(q.url, "http://x").pathname);
      let f = path.join(RAIZ, ruta);
      if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      fs.readFile(f, (e, d) => {
        if (e) { r.writeHead(404); return r.end("no encontrado"); }
        r.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream", "cache-control": "no-cache" });
        r.end(d);
      });
    }).listen(0, "127.0.0.1", () => resolver({ base: "http://127.0.0.1:" + s.address().port + "/", cerrar: () => s.close() }));
  });
}

const urlHoy = (base) => process.env.E2E_HOY_URL || base + "prueba/hoy.html";

// Respuesta de Open-Meteo simulada: del 17 al 21 de noviembre de 2026, con nubes reales de Vigo
// y una noche despejada (la del 20 al 21) para que haya un semáforo verde.
const simulada = () => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "open-meteo-simulada.json"), "utf8"));

/*
 * Abre una página con el reloj, el GPS y los servicios externos simulados.
 * Opciones: permisos (GPS concedido, por defecto sí), geo, nominatim ("ok" | "error"),
 *           lugar y perfil (lo que ya hay guardado en el dispositivo), fecha, viewport, colorScheme.
 */
async function nuevaPagina(b, o = {}) {
  const ctx = await b.newContext({
    timezoneId: "Europe/Madrid", locale: "es-ES",
    viewport: o.viewport || { width: 390, height: 900 },
    colorScheme: o.colorScheme || "light",
    permissions: o.permisos === false ? [] : ["geolocation"],
    geolocation: o.geo || VIGO
  });
  const p = await ctx.newPage();
  p.errores = [];
  p.llamadas = { nominatim: 0, geocoding: 0, forecast: 0 };
  p.on("pageerror", (e) => p.errores.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") p.errores.push(m.text()); });
  await p.clock.install({ time: new Date(o.fecha || FECHA) });

  const cors = { "access-control-allow-origin": "*" };
  await p.route("**/api.open-meteo.com/**", (r) => {
    p.llamadas.forecast++;
    r.fulfill({ contentType: "application/json", headers: cors, body: JSON.stringify(simulada()) });
  });
  await p.route("**/nominatim.openstreetmap.org/**", (r) => {
    p.llamadas.nominatim++;
    if (o.nominatim === "error") return r.fulfill({ status: 500, headers: cors, body: "fallo" });
    const lat = Number(new URL(r.request().url()).searchParams.get("lat"));
    const city = lat > 42.3 ? "Pontevedra" : "Vigo";
    r.fulfill({ contentType: "application/json", headers: cors, body: JSON.stringify({ address: { city, county: "Pontevedra", state: "Galicia", country: "España" } }) });
  });
  await p.route("**/geocoding-api.open-meteo.com/**", (r) => {
    p.llamadas.geocoding++;
    const q = new URL(r.request().url()).searchParams.get("name").toLowerCase();
    const body = q.includes("vigo") ? { results: [
      { name: "Vigo", latitude: 42.23282, longitude: -8.72264, country: "España", admin1: "Galicia", admin2: "Pontevedra" },
      { name: "Vigo", latitude: 38.0, longitude: -121.0, country: "Estados Unidos", admin1: "California" }] } : { generationtime_ms: 1 };
    r.fulfill({ contentType: "application/json", headers: cors, body: JSON.stringify(body) });
  });

  const guardados = { "luz-y-foto:lugar": o.lugar, "luz-y-foto:perfil": o.perfil };
  await p.addInitScript((g) => {
    Object.keys(g).forEach((k) => { if (g[k] !== undefined && !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(g[k])); });
  }, guardados);
  return { ctx, p };
}

/* ---------- Informe ---------- */

let fallos = 0;
const ok = (condicion, mensaje) => {
  if (!condicion) { fallos++; console.log("FALLA", mensaje); } else console.log("ok   ", mensaje);
};
const titulo = (t) => console.log("== " + t);

// Ejecuta una prueba completa: levanta servidor y navegador, y sale con código 1 si algo falla
async function ejecutar(nombre, cuerpo) {
  const servidor = await servir();
  const navegador = await playwright().chromium.launch();
  try { await cuerpo({ b: navegador, base: servidor.base, hoy: urlHoy(servidor.base) }); }
  catch (e) { fallos++; console.log("FALLA (excepción en " + nombre + "):", e.message); }
  finally { await navegador.close(); servidor.cerrar(); }
  console.log(fallos ? "\n" + nombre + ": " + fallos + " fallo(s)" : "\n" + nombre + ": todo correcto");
  process.exit(fallos ? 1 : 0);
}

module.exports = { RAIZ, VIGO, PONTE, playwright, servir, urlHoy, simulada, nuevaPagina, ok, titulo, ejecutar };
