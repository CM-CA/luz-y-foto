// Los dibujos de las lecciones: cada uno es una función de sus textos (data/<idioma>/dibujos.json) que devuelve un SVG para pintar dentro de la página.
// Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco, carpetaDeIdioma, idiomasDeDatos } from "../../scripts/datos-de-disco.mjs";
import { DIBUJOS } from "../../src/dibujos/index.js";
import { esc } from "../../src/dibujos/util.js";

const prueba = it;
const ES = cargarDeDisco(carpetaDeIdioma("es"));
const idsCitados = (c) => [...new Set(Object.values(c.lecciones.porId).flatMap((l) => l.bloques.filter((b) => b.tipo === "dibujo").map((b) => b.id)))];
const lineas = (v) => (Array.isArray(v) ? v : [v]);

prueba("cada dibujo citado en una lección tiene su función y sus textos", () => {
  const citados = idsCitados(ES);
  assert.equal(citados.length, 8, "las ocho lecciones con dibujo: " + citados.join(", "));
  for (const id of citados) {
    assert.ok(DIBUJOS[id], "falta src/dibujos/ para el dibujo «" + id + "»");
    assert.ok(ES.dibujos && ES.dibujos[id], "faltan los textos de «" + id + "» en data/es/dibujos.json");
  }
  assert.deepEqual(Object.keys(DIBUJOS).sort(), [...citados].sort(), "no hay dibujos sin lección ni lecciones sin dibujo");
});

prueba("pintar devuelve un svg con su viewBox y con todos sus textos", () => {
  for (const [id, d] of Object.entries(DIBUJOS)) {
    const svg = d.pintar(ES.dibujos[id]);
    const m = /^<svg [^>]*viewBox="0 0 (\d+) (\d+)"/.exec(svg);
    assert.ok(m, id + ": empieza por <svg … viewBox>");
    assert.deepEqual([+m[1], +m[2]], [d.ancho, d.alto], id + ": el viewBox mide lo que dice el registro");
    assert.ok(svg.endsWith("</svg>"), id + ": termina en </svg>");
    for (const [clave, valor] of Object.entries(ES.dibujos[id])) {
      for (const linea of lineas(valor)) assert.ok(svg.includes(">" + esc(linea) + "</text>"), id + "." + clave + ": «" + linea + "» no está en el dibujo");
    }
  }
});

prueba("los textos del dibujo tienen la letra de la app y los colores salen de las variables del tema", () => {
  for (const [id, d] of Object.entries(DIBUJOS)) {
    const svg = d.pintar(ES.dibujos[id]);
    const textos = svg.match(/<text\b[^>]*>/g) || [];
    assert.ok(textos.length >= 3, id + ": tiene textos");
    textos.forEach((t) => assert.match(t, /font-family="Figtree, sans-serif"/, id + ": un <text> sin la letra Figtree: " + t));
    // Los colores del tema (claro y oscuro) no van escritos en el dibujo: lo hacen las variables de estilos.css
    for (const hex of ["#ffffff", "#1f2740", "#59607f", "#18213a", "#ecebf5", "#a8afcb"]) {
      assert.ok(!svg.toLowerCase().includes(hex) || id === "toca" && ["#ffffff", "#1f2740"].includes(hex), id + ": el color " + hex + " debe salir de var(--dibujo-…)");
    }
    assert.match(svg, /var\(--dibujo-tinta\)/, id + ": usa la tinta del tema");
  }
});

prueba("un texto con & o < no rompe el dibujo", () => {
  for (const [id, d] of Object.entries(DIBUJOS)) {
    const raro = Object.fromEntries(Object.entries(ES.dibujos[id]).map(([k, v]) => [k, Array.isArray(v) ? v.map((x) => x + " & <b>") : v + " & <b>"]));
    const svg = d.pintar(raro);
    assert.ok(!/<b>/.test(svg) && !/&(?!amp;|lt;|gt;|quot;)/.test(svg), id + ": los textos van escapados");
    assert.ok(svg.includes("&amp; &lt;b&gt;"), id + ": el texto escapado está");
  }
});

prueba("las claves que pide cada dibujo son exactamente las de su dibujos.json, en cada idioma", () => {
  for (const idioma of idiomasDeDatos()) {
    const c = cargarDeDisco(carpetaDeIdioma(idioma));
    for (const [id, d] of Object.entries(DIBUJOS)) {
      const textos = c.dibujos[id];
      assert.deepEqual(Object.keys(textos).sort(), Object.keys(d.claves).sort(), idioma + "/" + id + ": las claves");
      for (const [clave, n] of Object.entries(d.claves)) {
        if (n === null) assert.equal(typeof textos[clave], "string", idioma + "/" + id + "." + clave + ": es un texto");
        else assert.ok(Array.isArray(textos[clave]) && textos[clave].length === n, idioma + "/" + id + "." + clave + ": es una lista de " + n);
      }
    }
  }
});
