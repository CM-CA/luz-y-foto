// Pruebas de la lógica de la pantalla Hoy (días y noches, pestaña por defecto, formato) y de la petición de previsión.
// Esta lógica antes estaba dentro de prueba/hoy.html; test/paridad/ comprueba que da lo mismo que allí.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { it } from "vitest";
import { cargarDeDisco } from "../../scripts/datos-de-disco.mjs";
import * as Astro from "../../src/nucleo/astro.js";
import * as Semaforo from "../../src/nucleo/semaforo.js";
import { hm, pct, unida, mayus, trozosDePlantilla } from "../../src/nucleo/formato.js";
import { nochesDe, listaDe, evaluarDia, etiquetaDia, lunaDe, pestanaPorDefecto, prepararVista } from "../../src/nucleo/dias.js";
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
  assert.deepEqual(listaDe(l, prev, ahora).map((x) => etiquetaDia(l, x, prev, ahora)), ["Hoy", "Mañana"]);
  const de3 = instante("2026-11-20T03:00");
  assert.equal(etiquetaDia(l, listaDe(l, prev, de3)[0], prev, de3), l.etiquetasDia.ahora);
});

it("lista de días de amanecer: por la tarde el primero es «Mañana» y a las 09:00 todavía «Hoy»", () => {
  const g = config.generos.amanecer;
  const etiquetas = (h) => { const ahora = instante(h); return listaDe(g, prev, ahora).map((x) => etiquetaDia(g, x, prev, ahora)); };
  assert.deepEqual(etiquetas("2026-11-19T15:00"), ["Mañana", "Sábado"]);
  assert.equal(etiquetas("2026-11-20T09:00")[0], "Hoy", "la ventana sigue abierta hasta 60 min después de la salida del sol");
  assert.equal(etiquetas("2026-11-20T10:00")[0], "Mañana");
});

it("evaluarDia: cada día de la lista da su semáforo, el mismo que el panel grande", () => {
  const ahora = instante("2026-11-19T15:00");
  const NIVELES = ["verde", "ambar", "rojo", "ninguno"];
  for (const id of config.indice.orden) {
    const g = config.generos[id];
    const lista = listaDe(g, prev, ahora);
    assert.ok(lista.length > 0, id + ": hay días");
    for (const item of lista) {
      const r = evaluarDia({ S, g, prev, item, lat: LAT, lon: LON, ahora });
      assert.ok(r && NIVELES.includes(r.nivel), id + " " + item.fecha + ": nivel " + (r && r.nivel));
      assert.ok(r.titulo, id + " " + item.fecha + ": tiene título");
    }
  }
  // Una noche en curso se evalúa solo desde ahora: da lo mismo que pedirlo a mano
  const l = config.generos.luna, deNoche = instante("2026-11-20T03:00"), n = listaDe(l, prev, deNoche)[0];
  assert.ok(n.inicio <= deNoche, "la primera noche está en curso");
  const fraccion = Astro.calcularDia(new Date(n.fecha + "T12:00:00"), LAT, LON).luna.fraccion;
  assert.deepEqual(evaluarDia({ S, g: l, prev, item: n, lat: LAT, lon: LON, ahora: deNoche }),
    S.evaluar(l.id, prev, { inicio: n.inicio, fin: n.fin, lat: LAT, lon: LON, fraccion, desde: deNoche }));
});

it("pestaña por defecto: la normal de día y la nocturna de noche", () => {
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-19T15:00")), config.indice.porDefecto);
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-19T23:00")), config.indice.porDefectoDeNoche);
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-20T09:00")), config.indice.porDefectoDeAmanecer, "a las 09:00 aún es la franja del amanecer");
  assert.equal(pestanaPorDefecto(config.indice, prev, instante("2026-11-20T10:00")), config.indice.porDefecto);
});

it("pestaña por defecto: franjas del día", () => {
  // El 19 de noviembre sale el sol a las 08:30 y se pone a las 18:10 (fixture de Vigo)
  const en = (h) => pestanaPorDefecto(config.indice, prev, instante("2026-11-19T" + h));
  assert.equal(en("06:29"), "luna");
  assert.equal(en("06:30"), "amanecer", "120 min antes de la salida del sol: el límite entra");
  assert.equal(en("09:29"), "amanecer");
  assert.equal(en("10:00"), "atardecer");
  assert.equal(en("18:39"), "atardecer");
  assert.equal(en("18:40"), "luna", "30 min después de la puesta");
});

it("pestaña por defecto: sin franja de noche gana el día", () => {
  // Dos días seguidos con salida a las 02:00 y puesta a las 23:45: la noche dura 2 h 15 min y su franja (de 00:15 a 00:00) queda vacía
  const D = Date.UTC(2026, 5, 21), H = 3600000, M = 60000;
  const dia = (n) => ({ amanecer: D + n * 24 * H + 2 * H, puesta: D + n * 24 * H + 23 * H + 45 * M });
  const corta = { dias: [dia(0), dia(1)] };
  assert.equal(pestanaPorDefecto(config.indice, corta, D + 24 * H + 20 * M), "amanecer", "a las 00:20 del segundo día");
  assert.equal(pestanaPorDefecto(config.indice, corta, D + 23 * H + 50 * M), "atardecer", "a las 23:50 del primero");
});

it("vista: tras recibir la previsión, atardecer de día y primera noche si es de noche", () => {
  const v = vista("2026-11-19T15:00");
  assert.equal(v.pestana, "atardecer");
  assert.equal(v.indice, 0);
  assert.deepEqual(Object.keys(v.listas), config.indice.orden);
  assert.equal(vista("2026-11-19T23:00").pestana, "luna");
});

it("vista: a las 06:45 se abre Amanecer", () => {
  assert.equal(vista("2026-11-19T06:45").pestana, "amanecer");
  assert.equal(vista("2026-11-19T06:45", { pestanaElegida: true, pestana: "luna" }).pestana, "luna", "la pestaña elegida se respeta");
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

it("lunaDe: la luna de ese día en ese lugar, la misma que calcula Astro", () => {
  const item = listaDe(config.generos.luna, prev, instante("2026-11-19T15:00"))[0];
  const esperada = Astro.calcularDia(new Date(item.fecha + "T12:00:00"), 42.2328, -8.7226).luna;
  const luna = lunaDe(item, 42.2328, -8.7226);
  assert.equal(luna.fase, esperada.fase);
  assert.deepEqual(luna, esperada);
  assert.ok(luna.fase > 0 && luna.fase < 1);
});
