// Pruebas de la última previsión guardada para enseñarla sin conexión. Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import { it } from "vitest";
import * as G from "../../src/nucleo/previsionGuardada.js";

const almacenFalso = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, m }; };
const datos = { timezone: "Europe/Madrid", hourly: { time: ["2026-11-19T00:00"] }, daily: { sunrise: ["2026-11-19T08:10"], sunset: ["2026-11-19T17:55"] } };
const H = 3600000;
const T0 = new Date(2026, 10, 19, 14, 32).getTime(); // 19/11/2026 14:32, hora del dispositivo
const registro = (extra) => ({ lat: 42.2328, lon: -8.7226, guardadaEn: T0, datos, ...extra });

it("guardar y cargar: ida y vuelta para el mismo lugar y poco después", () => {
  const a = almacenFalso();
  assert.equal(G.guardar(registro(), a), true);
  assert.deepEqual(G.cargar(42.2328, -8.7226, T0 + 3 * H, a), registro());
});

it("no sirve para otro lugar, pero sí para un punto de GPS a menos de 2 km", () => {
  const a = almacenFalso(); G.guardar(registro(), a);
  assert.equal(G.cargar(42.4338, -8.6476, T0 + H, a), null, "Pontevedra no es Vigo");
  assert.notEqual(G.cargar(42.2328 + 0.008, -8.7226, T0 + H, a), null, "~900 m: es el mismo sitio");
  assert.equal(G.cargar(42.2328 + 0.03, -8.7226, T0 + H, a), null, "~3,3 km: ya no");
});

it("no sirve si es muy vieja (más de 48 h) ni si es «del futuro» (reloj cambiado)", () => {
  const a = almacenFalso(); G.guardar(registro(), a);
  assert.notEqual(G.cargar(42.2328, -8.7226, T0 + 47 * H, a), null);
  assert.equal(G.cargar(42.2328, -8.7226, T0 + 49 * H, a), null);
  assert.equal(G.cargar(42.2328, -8.7226, T0 - H, a), null);
});

it("lo roto, lo raro y lo que falte se ignora sin romper nada", () => {
  const a = almacenFalso();
  assert.equal(G.cargar(42.2328, -8.7226, T0, a), null, "no hay nada guardado");
  a.m[G.CLAVE] = "{roto"; assert.equal(G.cargar(42.2328, -8.7226, T0, a), null, "JSON roto");
  for (const malo of [null, 7, "x", [], registro({ lat: "42" }), registro({ guardadaEn: NaN }), registro({ datos: null }), registro({ datos: { hourly: {}, daily: {} } }), registro({ datos: { ...datos, daily: { sunrise: [] } } })]) {
    a.m[G.CLAVE] = JSON.stringify(malo);
    assert.equal(G.cargar(42.2328, -8.7226, T0, a), null, JSON.stringify(malo));
  }
  assert.equal(G.cargar(1, 1, T0, { getItem() { throw new Error("bloqueado"); } }), null, "almacén que lanza errores");
  assert.equal(G.guardar(registro(), { setItem() { throw new Error("lleno"); } }), false, "guardar con el almacén lleno devuelve false");
});

it("cuando(): hoy / ayer / otro día, y hace cuánto", () => {
  assert.deepEqual(G.cuando(T0, T0 + 20000), { cuando: "hoy a las 14:32", hace: "hace un momento" });
  assert.deepEqual(G.cuando(T0, T0 + 25 * 60000), { cuando: "hoy a las 14:32", hace: "hace 25 min" });
  assert.deepEqual(G.cuando(T0, T0 + 3 * H + 40 * 60000), { cuando: "hoy a las 14:32", hace: "hace 3 h" });
  assert.deepEqual(G.cuando(T0, T0 + 20 * H), { cuando: "ayer a las 14:32", hace: "hace 20 h" });
  assert.deepEqual(G.cuando(T0, T0 + 24 * H), { cuando: "ayer a las 14:32", hace: "hace 1 día" });
  assert.equal(G.cuando(T0, T0 + 47 * H).cuando, "el 19 de noviembre a las 14:32");
  assert.equal(G.cuando(T0, T0 + 47 * H).hace, "hace 1 día");
  assert.equal(G.cuando(T0, T0 + 50 * H).hace, "hace 2 días");
});
