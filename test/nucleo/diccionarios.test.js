// Los diccionarios de la interfaz (es y en) y la función t(): mismas claves, mismos huecos, nada vacío, el inglés sin letras españolas,
// y cada clave que usa el código existe (y cada clave que existe se usa). Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { it, afterEach } from "vitest";
import es from "../../src/idioma/es.js";
import en from "../../src/idioma/en.js";
import { t, crudo, traducirLista, fijarIdioma } from "../../src/idioma/index.js";

const RAIZ = path.resolve(import.meta.dirname, "../..");
afterEach(() => fijarIdioma("es", ["es-ES"]));

const huecos = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
// Un objeto que devuelve «7» para cualquier valor que se le pida, y apunta cuáles se piden
const valoresDeEjemplo = () => { const pedidos = new Set(); return { pedidos, valores: new Proxy({}, { get: (_, k) => { if (typeof k === "string") pedidos.add(k); return "7"; } }) }; };
const clases = (d) => Object.entries(d).map(([k, v]) => [k, typeof v === "function" ? "funcion" : Array.isArray(v) ? "lista" : typeof v]);

it("es y en tienen exactamente las mismas claves, del mismo tipo", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(es).sort(), "claves distintas");
  assert.deepEqual(clases(en).sort(), clases(es).sort(), "el tipo de alguna entrada no coincide");
});

it("ninguna entrada está vacía y las de lista tienen los mismos elementos en los dos idiomas", () => {
  for (const [nombre, d] of [["es", es], ["en", en]]) {
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === "string") assert.ok(v.trim() !== "", nombre + "." + k + " está vacía");
      else if (Array.isArray(v)) assert.ok(v.length > 0 && v.every((x) => typeof x === "string" && x.trim() !== ""), nombre + "." + k + " tiene huecos vacíos");
      else assert.equal(typeof v, "function", nombre + "." + k + " no es texto, lista ni función");
    }
  }
  for (const [k, v] of Object.entries(es)) if (Array.isArray(v)) assert.equal(en[k].length, v.length, k + ": distinto número de elementos");
  assert.equal(es.cardinales.length, 16);
});

it("los huecos {x} de cada texto son los mismos en español e inglés", () => {
  for (const [k, v] of Object.entries(es)) if (typeof v === "string") assert.deepEqual(huecos(en[k]), huecos(v), k + ": huecos distintos");
});

it("las entradas de función devuelven texto con los mismos valores en los dos idiomas", () => {
  for (const [k, v] of Object.entries(es)) {
    if (typeof v !== "function") continue;
    const a = valoresDeEjemplo(), b = valoresDeEjemplo();
    const ta = v(a.valores), tb = en[k](b.valores);
    for (const [txt, nombre] of [[ta, "es"], [tb, "en"]]) {
      assert.equal(typeof txt, "string", nombre + "." + k + " no devuelve texto");
      assert.ok(txt.trim() !== "" && !/undefined|NaN|\[object/.test(txt), nombre + "." + k + " devuelve «" + txt + "»");
    }
    assert.deepEqual([...b.pedidos].sort(), [...a.pedidos].sort(), k + ": usa valores distintos en es y en");
  }
});

it("el inglés no lleva ¿, ¡, ñ ni letras con tilde", () => {
  const mal = [];
  const mira = (k, s) => { if (/[¿¡ñÑáéíóúüÁÉÍÓÚÜ]/.test(s)) mal.push(k + ": «" + s + "»"); };
  for (const [k, v] of Object.entries(en)) {
    if (typeof v === "string") mira(k, v);
    else if (Array.isArray(v)) v.forEach((x) => mira(k, x));
    else mira(k, v(valoresDeEjemplo().valores));
  }
  assert.deepEqual(mal, []);
});

it("las claves que usa el código existen, y cada clave del diccionario se usa", () => {
  const archivos = [];
  const recorrer = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) recorrer(p);
    else if (/\.(js|svelte)$/.test(e.name) && !/src\/idioma\/(es|en)\.js$/.test(p.replaceAll("\\", "/"))) archivos.push(p);
  });
  recorrer(path.join(RAIZ, "src"));
  const codigo = archivos.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  // Toda cadena «grupo.nombre» cuyo grupo es de un diccionario (también las de los mapas y las de t(cond ? "a.b" : "a.c")) y toda t("…")
  const grupos = [...new Set(Object.keys(es).filter((k) => k.includes(".")).map((k) => k.split(".")[0]))];
  const literales = [...codigo.matchAll(new RegExp('"((?:' + grupos.join("|") + ')\\.[A-Za-z]+)"', "g"))].map((m) => m[1]);
  const llamadas = [...codigo.matchAll(/\b(?:t|crudo|traducirLista)\(\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(llamadas.length > 50, "se esperaban muchas llamadas a t(): " + llamadas.length);
  const faltan = [...new Set([...literales, ...llamadas])].filter((k) => !(k in es));
  assert.deepEqual(faltan, [], "claves que usa el código y no existen en es.js");
  const sinUso = Object.keys(es).filter((k) => !codigo.includes('"' + k + '"'));
  assert.deepEqual(sinUso, [], "claves de es.js que no usa nada");
});

it("t(): rellena huecos, llama a las funciones, cambia con el idioma y no se rompe con claves o valores que faltan", () => {
  fijarIdioma("es", ["es-ES"]);
  assert.equal(t("asistente.pregunta", { n: 2, total: 5 }), "Pregunta 2 de 5");
  assert.equal(crudo("asistente.pregunta"), "Pregunta {n} de {total}");
  assert.equal(t("asistente.pregunta", { n: 2 }), "Pregunta 2 de —", "un valor que falta se ve como «—», no como undefined");
  assert.equal(t("esta.clave.no.existe"), "esta.clave.no.existe");
  assert.equal(traducirLista("cardinales")[0], "norte");
  assert.equal(traducirLista("no.existe").length, 0);
  fijarIdioma("en", ["en-US"]);
  assert.equal(t("asistente.pregunta", { n: 2, total: 5 }), "Question 2 of 5");
  assert.equal(traducirLista("cardinales")[0], "north");
  assert.equal(t("luz.del", { dia: "Monday" }), "Monday's light");
  fijarIdioma("es", ["es-ES"]);
  assert.equal(t("luz.del", { dia: "Lunes" }), "La luz del lunes");
});
