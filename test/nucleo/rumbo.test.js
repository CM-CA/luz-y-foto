// Pruebas del núcleo de la brújula: dónde está la luna, a qué momento apunta la flecha y qué rumbo da el sensor del móvil.
// Se ejecutan con: npx vitest run test/nucleo/rumbo.test.js
import assert from "node:assert/strict";
import { it } from "vitest";
import * as SunCalc from "suncalc";
import { posicionLuna, momentoDeLaLuna, punos, giro, rumboDe } from "../../src/nucleo/rumbo.js";

const prueba = it;
const VIGO = { lat: 42.2328, lon: -8.7226 };
const SANTIAGO = { lat: -33.45, lon: -70.66 };
const ms = (iso) => new Date(iso).getTime();
const cerca = (a, b, tolerancia = 1e-6) => assert.ok(Math.abs(a - b) <= tolerancia, a + " no es " + b);
const referencia = (t, sitio) => { const p = SunCalc.getMoonPosition(new Date(t), sitio.lat, sitio.lon); return { az: p.azimuth, alt: p.altitude }; };

// Noches de Vigo (de la puesta de sol al amanecer siguiente), en ms
const NOCHE_19 = { inicio: 1795108202002, fin: 1795159881079 }; // la luna ya está en el cielo al anochecer
const NOCHE_26 = { inicio: 1795712740204, fin: 1795765171803 }; // la luna sale a las 19:5x
const NOCHE_8 = { inicio: 1794158414495, fin: 1794208668127 };  // no hay luna en toda la noche

prueba("posicionLuna da el azimut y la altura de SunCalc, con un Date o con ms", () => {
  const t = ms("2026-11-19T21:00:00+01:00");
  const r = referencia(t, VIGO);
  const a = posicionLuna(new Date(t), VIGO.lat, VIGO.lon), b = posicionLuna(t, VIGO.lat, VIGO.lon);
  cerca(a.az, r.az); cerca(a.alt, r.alt); cerca(b.az, r.az); cerca(b.alt, r.alt);
});

prueba("momentoDeLaLuna: noche en curso y luna en el cielo → «ahora»", () => {
  const ahora = ms("2026-11-19T21:00:00+01:00");
  const m = momentoDeLaLuna({ ...NOCHE_19, ahora, mejorHora: ms("2026-11-19T22:00:00+01:00"), ...VIGO });
  assert.equal(m.tipo, "ahora"); assert.equal(m.t, ahora);
  const r = referencia(ahora, VIGO); cerca(m.az, r.az); cerca(m.alt, r.alt);
});

prueba("momentoDeLaLuna: noche sin empezar con mejor hora → «mejor»", () => {
  const mejorHora = ms("2026-11-19T22:00:00+01:00");
  const m = momentoDeLaLuna({ ...NOCHE_19, ahora: ms("2026-11-19T15:00:00+01:00"), mejorHora, ...VIGO });
  assert.equal(m.tipo, "mejor"); assert.equal(m.t, mejorHora);
  const r = referencia(mejorHora, VIGO); cerca(m.az, r.az); cerca(m.alt, r.alt);
});

prueba("momentoDeLaLuna: sin mejor hora y con la luna ya en el cielo al anochecer → «anochecer»", () => {
  const m = momentoDeLaLuna({ ...NOCHE_19, ahora: ms("2026-11-19T15:00:00+01:00"), mejorHora: null, ...VIGO });
  assert.equal(m.tipo, "anochecer"); assert.equal(m.t, NOCHE_19.inicio);
  const r = referencia(NOCHE_19.inicio, VIGO); cerca(m.az, r.az); cerca(m.alt, r.alt);
});

prueba("momentoDeLaLuna: una noche que ya pasó no está «en curso»", () => {
  const m = momentoDeLaLuna({ ...NOCHE_19, ahora: NOCHE_19.fin + 3600000, mejorHora: null, ...VIGO });
  assert.equal(m.tipo, "anochecer");
});

prueba("momentoDeLaLuna: noche en curso con la luna por debajo y mejor hora más tarde → «mejor»", () => {
  const mejorHora = ms("2026-11-27T01:00:00+01:00");
  const m = momentoDeLaLuna({ ...NOCHE_26, ahora: ms("2026-11-26T19:00:00+01:00"), mejorHora, ...VIGO });
  assert.equal(m.tipo, "mejor"); assert.equal(m.t, mejorHora);
});

prueba("momentoDeLaLuna: sin mejor hora y la luna sale durante la noche → «sale» en el primer minuto sobre el horizonte", () => {
  const m = momentoDeLaLuna({ ...NOCHE_26, ahora: ms("2026-11-26T19:00:00+01:00"), mejorHora: null, ...VIGO });
  assert.equal(m.tipo, "sale");
  assert.ok(m.alt > 0 && m.alt <= 0.5, "altura al salir: " + m.alt);
  assert.ok(m.t > NOCHE_26.inicio && m.t < NOCHE_26.fin);
  assert.ok(referencia(m.t - 60000, VIGO).alt <= 0, "un minuto antes la luna aún no estaba sobre el horizonte");
});

prueba("momentoDeLaLuna: la luna no está sobre el horizonte en toda la noche → null", () => {
  assert.equal(momentoDeLaLuna({ ...NOCHE_8, ahora: NOCHE_8.inicio - 3600000, mejorHora: null, ...VIGO }), null);
});

prueba("momentoDeLaLuna: hemisferio sur, la luna sale por el este y va al norte", () => {
  const ahora = ms("2026-11-19T21:00:00+01:00");
  const m = momentoDeLaLuna({ inicio: ahora - 3600000, fin: ahora + 36000000, ahora, mejorHora: null, ...SANTIAGO });
  assert.equal(m.tipo, "ahora");
  const r = referencia(ahora, SANTIAGO); cerca(m.az, r.az); cerca(m.alt, r.alt);
  assert.ok(m.az < 90 || m.az > 270, "al norte: " + m.az);
});

prueba("punos redondea la altura en puños de 10°", () => {
  assert.equal(punos(34), 3); assert.equal(punos(35), 4); assert.equal(punos(4), 0); assert.equal(punos(-3), 0); assert.equal(punos(90), 9);
});

prueba("giro: cuánto hay que girar desde el rumbo hasta el objetivo", () => {
  assert.equal(giro(135, 90), 45); assert.equal(giro(10, 350), 20); assert.equal(giro(350, 10), 340); assert.equal(giro(90, 90), 0);
});

prueba("rumboDe: iPhone (webkitCompassHeading)", () => {
  assert.equal(rumboDe({ webkitCompassHeading: 123.4 }), 123.4);
  assert.equal(rumboDe({ webkitCompassHeading: 0 }), 0);
  cerca(rumboDe({ webkitCompassHeading: NaN, absolute: true, alpha: 270, beta: 90, gamma: 0 }), 90);
});

prueba("rumboDe: Android con el móvil de pie (la cámara trasera mira a 360° − alpha)", () => {
  const de = (alpha, beta = 90, gamma = 0) => rumboDe({ absolute: true, alpha, beta, gamma });
  cerca(de(0), 0); cerca(de(90), 270); cerca(de(180), 180); cerca(de(270), 90);
  cerca(de(90, 60), 270);   // inclinado hacia atrás: sigue mirando al mismo sitio
  cerca(de(0, 90, 30), 330); // con el móvil de pie, gamma gira como alpha
});

prueba("rumboDe: móvil plano usa la parte de arriba del móvil", () => {
  cerca(rumboDe({ absolute: true, alpha: 90, beta: 0, gamma: 0 }), 270);
});

prueba("rumboDe: lecturas sin valor no cuentan", () => {
  assert.equal(rumboDe({ absolute: false, alpha: 10, beta: 90, gamma: 0 }), null);
  assert.equal(rumboDe({ absolute: true, alpha: null, beta: null, gamma: null }), null);
  assert.equal(rumboDe(null), null); assert.equal(rumboDe(undefined), null); assert.equal(rumboDe({}), null);
});
