// Pruebas del generador del service worker (scripts/pwa.mjs): lista de archivos y versión.
// El comportamiento del service worker en el navegador se prueba en test/e2e/compilada/sin-conexion.e2e.cjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { it } from "vitest";
import { construirServiceWorker } from "../../scripts/pwa.mjs";

function carpetaDePrueba(archivos) {
  const c = fs.mkdtempSync(path.join(os.tmpdir(), "sw-"));
  for (const [nombre, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(c, nombre)), { recursive: true });
    fs.writeFileSync(path.join(c, nombre), contenido);
  }
  return c;
}
const base = { "index.html": "<html>", "assets/app-1.js": "uno", "assets/app-1.css": "css", "icon.png": "png" };

it("la lista incluye todo dist/ en orden, salvo el propio sw.js y los mapas de depuración", () => {
  const c = carpetaDePrueba({ ...base, "sw.js": "viejo", "assets/app-1.js.map": "{}" });
  const { archivos } = construirServiceWorker(c);
  assert.deepEqual(archivos, ["assets/app-1.css", "assets/app-1.js", "icon.png", "index.html"]);
});

it("el texto resultante es JavaScript válido con la lista y la versión puestas", () => {
  const c = carpetaDePrueba(base);
  const { texto, version, archivos } = construirServiceWorker(c);
  assert.match(version, /^[0-9a-f]{12}$/);
  assert.ok(!texto.includes("__VERSION__") && !texto.includes("__ARCHIVOS__"), "no quedan marcadores sin rellenar");
  // Se ejecuta con un «self» falso solo para leer las constantes
  const oyentes = {};
  const contexto = { self: { location: new URL("https://x.test/app/sw.js"), addEventListener: (n, f) => { oyentes[n] = f; } }, caches: {}, URL, Request };
  vm.runInNewContext(texto + "\n;globalThis.__salida = { VERSION, ARCHIVOS, CACHE, PAGINA };", contexto);
  assert.deepEqual(JSON.parse(JSON.stringify(contexto.__salida.ARCHIVOS)), archivos); // JSON: la lista viene de otro contexto de ejecución
  assert.equal(contexto.__salida.VERSION, version);
  assert.equal(contexto.__salida.CACHE, "luz-y-foto-" + version);
  assert.equal(contexto.__salida.PAGINA, "https://x.test/app/index.html", "la página de la app es la que está junto al service worker");
  assert.deepEqual(Object.keys(oyentes).sort(), ["activate", "fetch", "install", "message"]);
});

it("la versión es la misma con el mismo contenido y cambia con cualquier cambio", () => {
  const v = (extra) => construirServiceWorker(carpetaDePrueba({ ...base, ...extra })).version;
  assert.equal(v({}), v({}), "mismo contenido, misma versión (no depende de la carpeta ni de la hora)");
  assert.notEqual(v({}), v({ "icon.png": "otro png" }), "cambia el contenido de un archivo que conserva el nombre");
  assert.notEqual(v({}), v({ "assets/nuevo.js": "x" }), "se añade un archivo");
  const sinIcono = { ...base }; delete sinIcono["icon.png"];
  assert.notEqual(v({}), construirServiceWorker(carpetaDePrueba(sinIcono)).version, "se quita un archivo");
});
