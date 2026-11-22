// La compilación y `npm run validar` deben detenerse si los datos de data/ tienen un error.
// Es la versión de «compilación» de la prueba de navegador «un archivo de datos con un error
// se explica en vez de romper», que solo tenía sentido cuando los datos se pedían al abrir la web.
"use strict";
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const RAIZ = path.join(__dirname, "..");
let fallos = 0;
function prueba(nombre, f) {
  try { f(); console.log("ok   " + nombre); } catch (e) { fallos++; console.log("FALLA " + nombre + "\n      " + e.message); }
}

const copia = fs.mkdtempSync(path.join(os.tmpdir(), "datos-"));
fs.cpSync(path.join(RAIZ, "data"), copia, { recursive: true });
const luna = path.join(copia, "es", "generos", "luna.json");
const datosLuna = JSON.parse(fs.readFileSync(luna, "utf8"));
datosLuna.nubes.verdeMenosDe = 90; // error: debe ser menor o igual que ambarHasta
fs.writeFileSync(luna, JSON.stringify(datosLuna));

const correr = (args, datos) => spawnSync(process.execPath, args, { cwd: RAIZ, env: { ...process.env, DATOS_DIR: datos }, encoding: "utf8" });

prueba("npm run validar acepta los datos reales", () => {
  const r = correr(["scripts/validar-datos.mjs"], path.join(RAIZ, "data"));
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Datos correctos/);
});

prueba("npm run validar rechaza un error y dice dónde está", () => {
  const r = correr(["scripts/validar-datos.mjs"], copia);
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /generos\/luna\.nubes/);
});

prueba("npm run validar rechaza un idioma de la app sin carpeta de datos (si no, la app mostraría esa lengua en español sin avisar)", () => {
  const sinIngles = fs.mkdtempSync(path.join(os.tmpdir(), "datos-sin-en-"));
  fs.cpSync(path.join(RAIZ, "data"), sinIngles, { recursive: true });
  fs.rmSync(path.join(sinIngles, "en"), { recursive: true, force: true });
  const r = correr(["scripts/validar-datos.mjs"], sinIngles);
  fs.rmSync(sinIngles, { recursive: true, force: true });
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /Falta la carpeta data\/en\//);
});

prueba("la compilación (vite build) se detiene con un error en los datos", () => {
  const salida = path.join(copia, "salida");
  const r = correr(["node_modules/vite/bin/vite.js", "build", "--outDir", salida, "--emptyOutDir"], copia);
  assert.notStrictEqual(r.status, 0, "la compilación no debería terminar bien");
  assert.match(r.stdout + r.stderr, /Hay un error en los datos/);
  assert.match(r.stdout + r.stderr, /generos\/luna\.nubes/);
  assert.ok(!fs.existsSync(path.join(salida, "index.html")), "no debe generar la web");
});

fs.rmSync(copia, { recursive: true, force: true });
console.log(fallos ? "\n" + fallos + " fallo(s)" : "\nTodo correcto");
process.exit(fallos ? 1 : 0);
