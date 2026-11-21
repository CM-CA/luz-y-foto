// Qué cielo se pinta en la cabecera: depende de la pestaña (atardecer o luna) y del semáforo del día elegido.
import assert from "node:assert/strict";
import { it } from "vitest";
import { elegirCielo, CIELOS } from "../../src/nucleo/cielo.js";

const TARDE = "puntos-ventana", NOCHE = "mejor-hora-nocturna";

it("hay cuatro cielos", () => {
  assert.deepEqual(CIELOS, ["tarde", "tarde-cubierta", "noche", "noche-cubierta"]);
});

it("atardecer: despejado salvo con semáforo rojo", () => {
  assert.equal(elegirCielo({ motor: TARDE, nivel: "verde" }), "tarde");
  assert.equal(elegirCielo({ motor: TARDE, nivel: "ambar" }), "tarde");
  assert.equal(elegirCielo({ motor: TARDE, nivel: "ninguno" }), "tarde");
  assert.equal(elegirCielo({ motor: TARDE, nivel: "rojo" }), "tarde-cubierta");
});

it("luna: noche, cubierta solo con semáforo rojo", () => {
  assert.equal(elegirCielo({ motor: NOCHE, nivel: "verde" }), "noche");
  assert.equal(elegirCielo({ motor: NOCHE, nivel: "ambar" }), "noche");
  assert.equal(elegirCielo({ motor: NOCHE, nivel: "rojo" }), "noche-cubierta");
});

it("manda la pestaña, no la hora del reloj", () => {
  assert.equal(elegirCielo({ motor: TARDE, nivel: "verde", hora: 3 }), "tarde");
  assert.equal(elegirCielo({ motor: NOCHE, nivel: "verde", hora: 12 }), "noche");
});

it("sin pestaña todavía (no hay previsión) se decide por la hora del dispositivo", () => {
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: 3 }), "noche");
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: 12 }), "tarde");
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: 20 }), "noche");
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: 19 }), "tarde");
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: 7 }), "tarde");
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: 6 }), "noche");
  assert.equal(elegirCielo({ motor: null, nivel: null, hora: null }), "tarde");
  assert.equal(elegirCielo({ motor: null, nivel: "rojo", hora: 23 }), "noche-cubierta");
});

it("valores raros no fallan: nivel o género desconocidos", () => {
  assert.equal(elegirCielo({ motor: TARDE, nivel: "x" }), "tarde");
  assert.equal(elegirCielo({ motor: "x", nivel: "verde", hora: 2 }), "noche");
  assert.equal(elegirCielo({ motor: "x", nivel: undefined, hora: undefined }), "tarde");
  assert.equal(elegirCielo(), "tarde");
});
