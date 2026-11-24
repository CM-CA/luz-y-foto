// El español de la app no cambia: el texto visible de cada pantalla (Hoy con cada pestaña y perfil, el asistente, el selector de
// lugar, sin conexión, Aprender y cada lección) es idéntico, palabra por palabra, al de test/e2e/fixtures/texto-es.json, que se
// hizo con la app anterior a los idiomas. Si se cambia un texto del español a propósito, se vuelve a generar con
// `node test/e2e/linea-base-texto.cjs`.
//
// Ejecutar: node test/e2e/compilada/texto-es.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, ok, titulo, ejecutar } = require("../ayudas.cjs");
const { recorrer } = require("../recorrido-texto.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

// La primera diferencia, con un poco de contexto
function diferencia(a, b) {
  const x = a.split(/\s+/), y = b.split(/\s+/);
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  const trozo = (v) => v.slice(Math.max(0, i - 4), i + 6).join(" ");
  return "palabra " + (i + 1) + ": antes «" + trozo(x) + "», ahora «" + trozo(y) + "»";
}

ejecutar("texto-es", async ({ b, base }) => {
  const esperado = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "fixtures", "texto-es.json"), "utf8"));
  titulo("el texto visible del español, pantalla por pantalla");
  const actual = await recorrer({ b, base, locale: "es-ES" });
  const nombres = [...new Set([...Object.keys(esperado), ...Object.keys(actual)])];
  for (const n of nombres) {
    if (!(n in actual)) { ok(false, n + ": falta esa pantalla en el recorrido"); continue; }
    if (!(n in esperado)) { ok(false, n + ": pantalla nueva que no está en la línea base"); continue; }
    ok(actual[n] === esperado[n], n + (actual[n] === esperado[n] ? "" : ": " + diferencia(esperado[n], actual[n])));
  }
}, { carpeta: dist, prefijo: "/ollada/" });
