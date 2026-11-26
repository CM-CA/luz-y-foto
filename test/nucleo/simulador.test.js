// El simulador de exposición: la cuenta de pasos de luz y lo que cambia en la foto con cada ajuste. Se ejecuta con: npx vitest run test/nucleo/simulador.test.js
import assert from "node:assert/strict";
import { it } from "vitest";
import {
  APERTURAS, TIEMPOS, ISOS, LUCES, INICIO, pasos, veredicto, factorDeLuz, desenfoqueFondo, desenfoqueMovimiento, intensidadGrano,
  nivelFondo, nivelMovimiento, nivelGrano, etiquetaApertura, etiquetaTiempo
} from "../../src/nucleo/simulador.js";

const prueba = it;
const con = (cambios) => ({ ...INICIO, ...cambios });

prueba("simulador: las escalas son las de pasos enteros de luz, de siete valores cada una", () => {
  assert.deepEqual(APERTURAS, [2, 2.8, 4, 5.6, 8, 11, 16]);
  assert.deepEqual(TIEMPOS, [1000, 500, 250, 125, 60, 30, 15]);
  assert.deepEqual(ISOS, [100, 200, 400, 800, 1600, 3200, 6400]);
  assert.deepEqual(Object.keys(LUCES), ["sol", "nublado", "interior"]);
});

prueba("simulador: con el sol, f/16, 1/125 s e ISO 100 la exposición es la justa (la regla de f/16)", () => {
  assert.equal(pasos(con({ luz: "sol", apertura: 6, tiempo: 3, iso: 0 })), 0);
});

prueba("simulador: el punto de partida está bien expuesto y cada ajuste mueve un paso de luz", () => {
  assert.equal(pasos(INICIO), 0);
  assert.equal(pasos(con({ apertura: INICIO.apertura - 1 })), 1, "abrir un paso la apertura: un paso de luz más");
  assert.equal(pasos(con({ apertura: INICIO.apertura + 1 })), -1, "cerrarla: uno menos");
  assert.equal(pasos(con({ tiempo: INICIO.tiempo + 1 })), 1, "alargar el tiempo a la mitad de velocidad: uno más");
  assert.equal(pasos(con({ tiempo: INICIO.tiempo - 1 })), -1, "acortarlo: uno menos");
  assert.equal(pasos(con({ iso: INICIO.iso + 1 })), 1, "doblar el ISO: uno más");
});

prueba("simulador: un paso de un ajuste se compensa con un paso contrario de otro", () => {
  assert.equal(pasos(con({ apertura: INICIO.apertura - 1, tiempo: INICIO.tiempo - 1 })), 0);
  assert.equal(pasos(con({ iso: INICIO.iso + 2, tiempo: INICIO.tiempo - 2 })), 0);
});

prueba("simulador: la luz de la escena cambia lo que hace falta (nublado, dos pasos menos que el sol; interior, muchos menos)", () => {
  assert.equal(pasos(con({ luz: "nublado" })), -2);
  assert.ok(pasos(con({ luz: "interior" })) < pasos(con({ luz: "nublado" })));
  // Con luz de interior hay una combinación razonable: f/2, 1/60 s e ISO 400
  assert.equal(pasos({ luz: "interior", apertura: 0, tiempo: 4, iso: 2 }), 0);
});

prueba("simulador: el veredicto en cinco niveles", () => {
  assert.deepEqual([-5, -2, -1, 0, 1, 2, 5].map(veredicto), ["muyOscura", "muyOscura", "oscura", "bien", "clara", "muyClara", "muyClara"]);
});

prueba("simulador: el factor de claridad sube con los pasos, vale 1 en la exposición justa y se queda en un tope", () => {
  assert.equal(factorDeLuz(0), 1);
  assert.ok(factorDeLuz(1) > 1 && factorDeLuz(-1) < 1);
  for (let p = -4; p < 4; p++) assert.ok(factorDeLuz(p + 1) > factorDeLuz(p), "sube en " + p);
  assert.equal(factorDeLuz(-9), factorDeLuz(-4));
  assert.equal(factorDeLuz(9), factorDeLuz(4));
  assert.ok(factorDeLuz(-4) > 0 && factorDeLuz(-4) < 0.25, "con cuatro pasos de menos queda muy oscura");
  assert.ok(factorDeLuz(4) > 3, "con cuatro pasos de más queda quemada");
});

prueba("simulador: apertura abierta, fondo más borroso; tiempo largo, más movimiento; ISO alto, más grano", () => {
  for (let i = 0; i < APERTURAS.length - 1; i++) assert.ok(desenfoqueFondo(i) > desenfoqueFondo(i + 1), "fondo en " + i);
  for (let j = 0; j < TIEMPOS.length - 1; j++) assert.ok(desenfoqueMovimiento(j + 1) > desenfoqueMovimiento(j), "movimiento en " + j);
  assert.equal(intensidadGrano(0), 0);
  for (let k = 0; k < ISOS.length - 1; k++) assert.ok(intensidadGrano(k + 1) > intensidadGrano(k), "grano en " + k);
  assert.ok(intensidadGrano(ISOS.length - 1) <= 0.6);
  assert.ok(desenfoqueFondo(APERTURAS.length - 1) < 1.2, "con f/16 el fondo casi no se desenfoca");
  assert.ok(desenfoqueMovimiento(0) < 1, "con 1/1000 s no hay estela");
});

prueba("simulador: los niveles de cada efecto son 0, 1 o 2 y solo suben a un lado", () => {
  assert.deepEqual(APERTURAS.map((_, i) => nivelFondo(i)), [0, 0, 1, 1, 2, 2, 2]);
  assert.deepEqual(TIEMPOS.map((_, j) => nivelMovimiento(j)), [0, 0, 0, 1, 1, 2, 2]);
  assert.deepEqual(ISOS.map((_, k) => nivelGrano(k)), [0, 0, 1, 1, 1, 2, 2]);
});

prueba("simulador: las etiquetas de la apertura y del tiempo, con el separador decimal del idioma", () => {
  assert.equal(etiquetaApertura(1, ","), "f/2,8");
  assert.equal(etiquetaApertura(1, "."), "f/2.8");
  assert.equal(etiquetaApertura(0, ","), "f/2");
  assert.equal(etiquetaTiempo(1), "1/500 s");
  assert.equal(etiquetaTiempo(6), "1/15 s");
});
