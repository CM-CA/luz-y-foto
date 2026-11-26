// Las licencias del repositorio: el código con PolyForm Noncommercial, el contenido con CC BY-NC-SA, el nombre y el icono reservados, y los avisos de lo que
// va dentro de la app. Se ejecutan con: npx vitest run test/nucleo/licencias.test.js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { it } from "vitest";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const leer = (...r) => fs.readFileSync(path.join(RAIZ, ...r), "utf8");
const prueba = it;
const TITULAR = "Camilo Manuel Couselo Alonso";

prueba("licencias: el código lleva PolyForm Noncommercial 1.0.0 completa, con el aviso del titular", () => {
  const l = leer("LICENSE");
  assert.match(l, new RegExp("^Required Notice: Copyright \\(c\\) 2026 " + TITULAR + " \\(https://github.com/CM-CA/ollada\\)$", "m"), "falta la línea «Required Notice:» con el titular");
  assert.match(l, /^# PolyForm Noncommercial License 1\.0\.0$/m);
  ["Acceptance", "Copyright License", "Distribution License", "Notices", "Changes and New Works License", "Patent License", "Noncommercial Purposes", "Personal Uses",
    "Noncommercial Organizations", "Fair Use", "No Other Rights", "Patent Defense", "Violations", "No Liability", "Definitions"
  ].forEach((s) => assert.match(l, new RegExp("^## " + s + "$", "m"), "falta la sección «" + s + "» de la licencia"));
  assert.match(l, /Use\*\* means anything you do with the software requiring one of your licenses\./, "el texto de la licencia termina en sus definiciones");
  assert.ok(!/MIT License/.test(l), "ya no debe quedar la MIT");
});

prueba("licencias: el aviso del principio dice cómo pedir permiso comercial y que el nombre y el icono están reservados", () => {
  const cabecera = leer("LICENSE").split("# PolyForm Noncommercial License 1.0.0")[0];
  assert.match(cabecera, /https:\/\/github\.com\/CM-CA\/ollada\/issues/, "cómo pedir permiso comercial");
  assert.match(cabecera, /Ollada/);
  assert.match(cabecera, /LICENSE-CONTENIDO/, "remite a la licencia del contenido");
  assert.match(cabecera, /trademark|marca/i, "nombre e icono reservados");
});

prueba("licencias: el contenido (data/ y docs/) lleva CC BY-NC-SA 4.0 completa", () => {
  const l = leer("LICENSE-CONTENIDO");
  assert.match(l, new RegExp("Copyright \\(c\\) 2026 " + TITULAR));
  assert.match(l, /Creative Commons Attribution-NonCommercial-ShareAlike 4\.0 International/);
  assert.match(l, /data\//); assert.match(l, /docs\//);
  assert.match(l, /Section 8 – Interpretation\./, "el texto legal llega hasta su final");
  assert.match(l, /Creative Commons may be contacted at creativecommons\.org\./);
});

prueba("licencias: package.json y el lock dicen la misma licencia, ya no MIT", () => {
  const p = JSON.parse(leer("package.json"));
  const lock = JSON.parse(leer("package-lock.json"));
  assert.equal(p.license, "PolyForm-Noncommercial-1.0.0");
  assert.equal(lock.packages[""].license, p.license);
});

prueba("licencias: el README explica las tres licencias y cómo pedir permiso comercial", () => {
  const r = leer("README.md");
  assert.match(r, /^## Licencias?$/m);
  assert.match(r, /PolyForm Noncommercial/);
  assert.match(r, /CC BY-NC-SA 4\.0/);
  assert.match(r, /uso comercial/i);
  assert.match(r, /LICENSE-CONTENIDO/);
  assert.ok(r.includes(TITULAR));
});

prueba("licencias: cada cosa de terceros que va dentro de la app tiene su aviso en el repositorio", () => {
  const avisos = {
    "licencias/SUNCALC-LICENSE.txt": /Volodymyr Agafonkin/,
    "licencias/SVELTE-LICENSE.txt": /Svelte Contributors/,
    "licencias/VITE-LICENSE.txt": /VoidZero Inc\. and Vite contributors/,
    "src/fuentes/LICENCIA-figtree.txt": /SIL OPEN FONT LICENSE Version 1\.1/,
    "src/fuentes/LICENCIA-young-serif.txt": /SIL OPEN FONT LICENSE Version 1\.1/
  };
  for (const [ruta, r] of Object.entries(avisos)) assert.match(leer(...ruta.split("/")), r, ruta);
  // Todo lo que está en `dependencies` (lo que se empaqueta) tiene aviso: hoy, solo SunCalc
  assert.deepEqual(Object.keys(JSON.parse(leer("package.json")).dependencies || {}), ["suncalc"]);
});
