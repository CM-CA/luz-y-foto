// Pruebas de cómo se entiende la dirección tras «#». Se ejecutan con: npx vitest run test/nucleo/rutas.test.js
import assert from "node:assert/strict";
import { it } from "vitest";
import { analizarRuta } from "../../src/nucleo/rutas.js";

const prueba = it;

prueba("rutas: Hoy es la pantalla por defecto", () => {
  ["hoy", "", "hoy/"].forEach((t) => assert.deepEqual(analizarRuta(t), { pantalla: "hoy", id: null }, "«" + t + "»"));
});

prueba("rutas: la lista de Aprender", () => {
  ["aprender", "aprender/"].forEach((t) => assert.deepEqual(analizarRuta(t), { pantalla: "aprender", id: null }, "«" + t + "»"));
});

prueba("rutas: una lección", () => {
  assert.deepEqual(analizarRuta("aprender/la-rueda-de-modos"), { pantalla: "leccion", id: "la-rueda-de-modos" });
});

prueba("rutas: la pantalla del aviso legal", () => {
  ["aviso-legal", "aviso-legal/"].forEach((t) => assert.deepEqual(analizarRuta(t), { pantalla: "aviso-legal", id: null }, "«" + t + "»"));
});

prueba("rutas: cualquier otra cosa es una pantalla desconocida", () => {
  ["otra", "aprender/a/b", "leccion/x", "hoy/x", "aprender//", "Aprender", "aviso-legal/x", "Aviso-legal", "licencias"].forEach((t) => assert.deepEqual(analizarRuta(t), { pantalla: "desconocida", id: null }, "«" + t + "»"));
});
