// Qué cielo se pinta en la cabecera: depende de la pestaña (atardecer o luna) y del semáforo del día elegido.
import assert from "node:assert/strict";
import { it } from "vitest";
import { elegirCielo, indiceFaseLuna, CIELOS } from "../../src/nucleo/cielo.js";

const TARDE = "puntos-ventana", NOCHE = "mejor-hora-nocturna";

it("hay seis cielos", () => {
  assert.deepEqual(CIELOS, ["tarde", "tarde-cubierta", "noche", "noche-cubierta", "amanecer", "amanecer-cubierta"]);
});

it("amanecer: despejado salvo con semáforo rojo", () => {
  assert.equal(elegirCielo({ motor: TARDE, evento: "amanecer", nivel: "verde" }), "amanecer");
  assert.equal(elegirCielo({ motor: TARDE, evento: "amanecer", nivel: "ambar" }), "amanecer");
  assert.equal(elegirCielo({ motor: TARDE, evento: "amanecer", nivel: "ninguno" }), "amanecer");
  assert.equal(elegirCielo({ motor: TARDE, evento: "amanecer", nivel: "rojo" }), "amanecer-cubierta");
});

it("el atardecer sigue con cielo de tarde", () => {
  assert.equal(elegirCielo({ motor: TARDE, evento: "puesta", nivel: "verde" }), "tarde");
  assert.equal(elegirCielo({ motor: TARDE, nivel: "rojo" }), "tarde-cubierta");
});

it("manda la pestaña, no la hora, también en amanecer", () => {
  assert.equal(elegirCielo({ motor: TARDE, evento: "amanecer", nivel: "verde", hora: 20 }), "amanecer");
  assert.equal(elegirCielo({ motor: TARDE, evento: "amanecer", nivel: "verde", hora: 3 }), "amanecer");
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

it("la fase de la luna (0 a 1) se reparte en 16 imágenes: 0 nueva, 4 cuarto creciente, 8 llena, 12 cuarto menguante", () => {
  assert.equal(indiceFaseLuna(0), 0);
  assert.equal(indiceFaseLuna(0.25), 4);
  assert.equal(indiceFaseLuna(0.5), 8);
  assert.equal(indiceFaseLuna(0.75), 12);
});

it("la fase de la luna: el redondeo cambia de imagen a mitad de camino y da la vuelta al final del ciclo", () => {
  assert.equal(indiceFaseLuna(0.03), 0);
  assert.equal(indiceFaseLuna(0.04), 1);
  assert.equal(indiceFaseLuna(0.99), 0);
  assert.equal(indiceFaseLuna(1), 0);
});

it("la fase de la luna: fuera de [0, 1) se lleva al ciclo; lo que no es un número finito da luna nueva", () => {
  assert.equal(indiceFaseLuna(-0.25), 12);
  assert.equal(indiceFaseLuna(1.25), 4);
  for (const raro of [NaN, undefined, null, Infinity, -Infinity, "0.5"]) assert.equal(indiceFaseLuna(raro), 0, String(raro));
});
