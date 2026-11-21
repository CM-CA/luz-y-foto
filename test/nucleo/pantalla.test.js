// Pruebas de la lógica de la pantalla Hoy (días y noches, pestaña por defecto, formato) y de la petición de previsión.
// Esta lógica antes estaba dentro de prueba/hoy.html; test/paridad/ comprueba que da lo mismo que allí.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { it } from "vitest";
import { cargarDeDisco } from "../../scripts/datos-de-disco.mjs";
import * as Semaforo from "../../src/nucleo/semaforo.js";
import { hm, pct, unida, mayus, trozosDePlantilla } from "../../src/nucleo/formato.js";
import { nochesDe, listaDe, etiquetaDia, pestanaPorDefecto, prepararVista } from "../../src/nucleo/dias.js";
import { pedirPrevision, urlPrevision } from "../../src/proveedores/open-meteo.js";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const config = cargarDeDisco();
const S = Semaforo.crear(config);
const datos = JSON.parse(fs.readFileSync(path.join(aqui, "..", "e2e", "fixtures", "open-meteo-simulada.json"), "utf8"));
const LAT = 42.2406, LON = -8.7207; // Vigo
const instante = (h) => Date.parse(h + ":00+01:00");
const prev = S.prepararPrevision(datos);
const vista = (h, extra) => prepararVista({ config, S, datos, lat: LAT, lon: LON, ahora: instante(h), pestanaElegida: false, pestana: null, ...extra });

it("formato: horas, porcentajes, guiones y mayúsculas", () => {
  assert.equal(hm(Date.parse("2026-11-19T15:00:00+01:00")), "15:00");
  assert.equal(hm(null), "—");
  assert.equal(pct(49.5), "50 %");
  assert.equal(unida("nor-noreste"), "nor‑noreste");
  assert.equal(unida(null), "");
  assert.equal(mayus("sábado"), "Sábado");
});

it("trozosDePlantilla: da lo mismo que plantilla() y marca la negrita", () => {
  const t = "Atardecer a las {hora} (dorada {dorada}) {falta}";
  const v = { hora: "18:05", dorada: "17:20" };
  const trozos = trozosDePlantilla(t, v, ["hora"]);
  assert.equal(trozos.map((x) => x.texto).join(""), Semaforo.plantilla(t, v));
  assert.deepEqual(trozos.filter((x) => x.negrita).map((x) => x.texto), ["18:05"]);
  assert.equal(trozos[trozos.length - 1].texto, "—", "una clave que falta se pinta como «—»");
  assert.deepEqual(trozosDePlantilla("sin marcas", {}), [{ texto: "sin marcas" }]);
});

it("noches: solo las que aún no han terminado", () => {
  assert.equal(nochesDe(prev, instante("2026-11-19T15:00")).length, 2);
  assert.equal(nochesDe(prev, instante("2026-11-20T09:00")).length, 1, "a las 9 la noche del 19 ya acabó");
});

it("lista de días: atardecer por día (máximo 3) y luna por noche", () => {
  const ahora = instante("2026-11-19T15:00");
  assert.equal(listaDe(config.generos.atardecer, prev, ahora).length, 3);
  assert.equal(listaDe(config.generos.luna, prev, ahora).length, 2);
  // pasada la puesta (más el margen de la ventana) el atardecer de hoy ya no se ofrece
  assert.equal(listaDe(config.generos.atardecer, prev, instante("2026-11-19T21:00")).length, 2);
});

it("etiquetas de los días: Hoy, Mañana, el día de la semana y «ahora» en una noche en curso", () => {
  const ahora = instante("2026-11-19T15:00");
  const g = config.generos.atardecer;
  assert.deepEqual(listaDe(g, prev, ahora).map((x) => etiquetaDia(g, x, prev, ahora)), ["Hoy", "Mañana", "Sábado"]);
  const l = config.generos.luna;
  assert.deepEqual(listaDe(l, prev, ahora).map((x) => etiquetaDia(l, x, prev, ahora)), ["Esta noche", "Mañana noche"]);
  const de3 = instante("2026-11-20T03:00");
  assert.equal(etiquetaDia(l, listaDe(l, prev, de3)[0], prev, de3), l.etiquetasDia.ahora);
});

it("pestaña por defecto: la normal de día y la nocturna de noche", () => {
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-19T15:00")), config.indice.porDefecto);
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-19T23:00")), config.indice.porDefectoDeNoche);
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-20T09:00")), config.indice.porDefecto);
});

it("vista: tras recibir la previsión, atardecer de día y primera noche si es de noche", () => {
  const v = vista("2026-11-19T15:00");
  assert.equal(v.pestana, "atardecer");
  assert.equal(v.indice, 0);
  assert.deepEqual(Object.keys(v.listas), config.indice.orden);
  assert.equal(vista("2026-11-19T23:00").pestana, "luna");
});

it("vista: si el usuario ya eligió pestaña, se respeta", () => {
  assert.equal(vista("2026-11-19T15:00", { pestanaElegida: true, pestana: "luna" }).pestana, "luna");
  assert.equal(vista("2026-11-19T23:00", { pestanaElegida: true, pestana: "atardecer" }).pestana, "atardecer");
});

it("vista: si la noche en curso ya no tiene luna alta se empieza por la siguiente", () => {
  const elegida = { pestanaElegida: true, pestana: "luna" };
  assert.equal(vista("2026-11-19T23:00", elegida).indice, 0, "con la luna alta se queda en esta noche");
  assert.equal(vista("2026-11-20T03:00", elegida).indice, 1, "la luna ya se ha puesto: se pasa a la noche siguiente");
  assert.equal(vista("2026-11-19T15:00", elegida).indice, 0, "la noche aún no ha empezado");
  assert.equal(vista("2026-11-20T03:00", { pestanaElegida: true, pestana: "atardecer" }).indice, 0, "solo cuenta en la pestaña de la luna");
});

it("petición de previsión: usa la URL de Open-Meteo y devuelve el JSON", async () => {
  const antes = globalThis.fetch;
  const pedidas = [];
  globalThis.fetch = async (url) => { pedidas.push(String(url)); return { ok: true, status: 200, json: async () => datos }; };
  try {
    assert.deepEqual(await pedirPrevision(LAT, LON), datos);
    assert.deepEqual(pedidas, [urlPrevision(LAT, LON)]);
  } finally { globalThis.fetch = antes; }
});

it("petición de previsión: un error del servidor se explica con su código", async () => {
  const antes = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  try {
    await assert.rejects(pedirPrevision(LAT, LON), /HTTP 500/);
  } finally { globalThis.fetch = antes; }
});
