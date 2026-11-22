// Pruebas de las funciones que leen las lecciones de los datos. Se ejecutan con: npx vitest run test/nucleo/lecciones.test.js
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco as cargarDatos } from "../../scripts/datos-de-disco.mjs";
import { listaDeLecciones, leccionPorId, etiquetaMinutos, etiquetaPara } from "../../src/nucleo/lecciones.js";

const prueba = it;

prueba("lecciones: la lista agrupa y trae lo que se ve en cada fila", () => {
  const lista = listaDeLecciones(cargarDatos());
  assert.equal(lista[0].id, "basico");
  assert.equal(lista[0].titulo, "Lo básico");
  assert.equal(lista[0].subtitulo, "Para quien dispara con cámara.");
  assert.deepEqual(lista[0].lecciones[0], {
    id: "la-rueda-de-modos", titulo: "La rueda de modos", resumen: "Qué modo usar y cuándo, sin liarte.", minutos: 3, para: "camara"
  });
});

prueba("lecciones: leccionPorId da la lección completa o null", () => {
  const c = cargarDatos();
  assert.equal(leccionPorId(c, "la-rueda-de-modos").titulo, "La rueda de modos");
  assert.ok(leccionPorId(c, "la-rueda-de-modos").bloques.length > 0);
  assert.equal(leccionPorId(c, "xyz"), null);
  assert.equal(leccionPorId(c, undefined), null);
  // Los nombres que todo objeto trae de serie no son lecciones
  ["constructor", "__proto__", "toString", "hasOwnProperty"].forEach((id) => assert.equal(leccionPorId(c, id), null, id));
});

prueba("lecciones: las etiquetas de duración y de para quién es", () => {
  const c = cargarDatos();
  assert.equal(etiquetaMinutos(c, 3), "3 min");
  assert.equal(etiquetaPara(c, "camara"), "Para cámara");
  assert.equal(etiquetaPara(c, "todos"), "Para todos");
});
