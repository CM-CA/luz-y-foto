// Lo que cambia al estar la app en inglés en la lógica (fechas, horas, números, puntos cardinales, «Cómo se calcula»), y que el
// español queda como estaba al volver. Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import { it, afterEach, vi } from "vitest";
import { fijarIdioma } from "../../src/idioma/index.js";
import * as Astro from "../../src/nucleo/astro.js";
import * as Guardada from "../../src/nucleo/previsionGuardada.js";
import * as Semaforo from "../../src/nucleo/semaforo.js";
import { describirTramo } from "../../src/nucleo/explicacion.js";
import { tituloDeLaLuz } from "../../src/nucleo/franja.js";
import { hm, pct, unida } from "../../src/nucleo/formato.js";
import { urlBusqueda } from "../../src/proveedores/geocodificacion.js";
import { urlNombre } from "../../src/proveedores/nominatim.js";
import { cargarDeDisco } from "../../scripts/datos-de-disco.mjs";

afterEach(() => fijarIdioma("es", ["es-ES"]));

const H = 3600000;
// 14:32 hora de Madrid el 20 de noviembre de 2026 (las pruebas se ejecutan con TZ=Europe/Madrid)
const T0 = new Date(2026, 10, 20, 14, 32).getTime();

it("puntos cardinales en inglés, y con el guion que no se parte", () => {
  fijarIdioma("en", ["en-US"]);
  assert.equal(Astro.puntoCardinal(0), "north");
  assert.equal(Astro.puntoCardinal(22.5), "north-northeast");
  assert.equal(Astro.puntoCardinal(270), "west");
  assert.equal(unida(Astro.puntoCardinal(247.5)), "west‑southwest");
  fijarIdioma("es", ["es-ES"]);
  assert.equal(Astro.puntoCardinal(270), "oeste");
});

it("porcentajes y horas: «50 %» y «14:32» en español; «50%» y la hora de su variante en inglés", () => {
  assert.equal(pct(49.6), "50 %");
  assert.equal(hm(T0), "14:32");
  fijarIdioma("en", ["en-GB"]);
  assert.equal(pct(49.6), "50%");
  assert.equal(hm(T0), "14:32");
  fijarIdioma("en", ["en-US"]);
  assert.match(hm(T0), /^02:32\s?PM$/);
  assert.equal(hm(null), "—");
});

it("previsión guardada: cuándo y hace cuánto, en inglés", () => {
  fijarIdioma("en", ["en-GB"]);
  assert.deepEqual(Guardada.cuando(T0, T0 + 20000), { cuando: "today at 14:32", hace: "just now" });
  assert.deepEqual(Guardada.cuando(T0, T0 + 25 * 60000), { cuando: "today at 14:32", hace: "25 min ago" });
  assert.deepEqual(Guardada.cuando(T0, T0 + 3 * H + 40 * 60000), { cuando: "today at 14:32", hace: "3 h ago" });
  assert.deepEqual(Guardada.cuando(T0, T0 + 24 * H), { cuando: "yesterday at 14:32", hace: "1 day ago" });
  assert.equal(Guardada.cuando(T0, T0 + 47 * H).cuando, "on 20 November at 14:32");
  assert.equal(Guardada.cuando(T0, T0 + 50 * H).hace, "2 days ago");
  fijarIdioma("en", ["en-US"]);
  assert.match(Guardada.cuando(T0, T0 + 47 * H).cuando, /^on November 20 at 02:32\s?PM$/);
});

it("«La luz de…»: hoy, mañana y el día de la semana, en los dos idiomas", () => {
  assert.equal(tituloDeLaLuz("2026-11-20", "2026-11-20", "2026-11-21"), "La luz de hoy");
  assert.equal(tituloDeLaLuz("2026-11-23", "2026-11-20", "2026-11-21"), "La luz del lunes");
  fijarIdioma("en", ["en-US"]);
  assert.equal(tituloDeLaLuz("2026-11-20", "2026-11-20", "2026-11-21"), "Today's light");
  assert.equal(tituloDeLaLuz("2026-11-21", "2026-11-20", "2026-11-21"), "Tomorrow's light");
  assert.equal(tituloDeLaLuz("2026-11-23", "2026-11-20", "2026-11-21"), "Monday's light");
});

it("describirTramo con números en inglés: punto decimal y sin espacio antes del %", () => {
  assert.equal(describirTramo({ desde: 10, menosDe: 20.5 }), "de 10 % a menos de 20,5 %");
  fijarIdioma("en", ["en-US"]);
  assert.equal(describirTramo({ desde: 10, menosDe: 20.5 }), "10% to under 20.5%");
  assert.equal(describirTramo({ menosDe: 20 }), "under 20%");
  assert.equal(describirTramo({ desde: 20, hasta: 70 }), "20 to 70%");
  assert.equal(describirTramo({ masDe: 70, hasta: 85 }), "over 70% and up to 85%");
  assert.equal(describirTramo({ desde: 70 }), "70% or more");
  assert.equal(describirTramo({}), "the rest");
  assert.equal(describirTramo({ menosDe: 0.5 }, " mm/h"), "under 0.5 mm/h");
});

it("«Cómo se calcula» en inglés: todas las líneas salen en inglés, con los niveles de lluvia con nombre", () => {
  const S = Semaforo.crear(cargarDeDisco());
  const es = [...S.explicar("atardecer"), ...S.explicar("luna")];
  fijarIdioma("en", ["en-US"]);
  const en = [...S.explicar("atardecer"), ...S.explicar("luna")];
  assert.equal(en.length, es.length, "mismas líneas en los dos idiomas");
  // Lo que va entre comillas «“…”» son los nombres de los niveles, que salen de data/ y se traducen con ella (Tarea 6)
  for (const l of en) assert.ok(!/[¿¡ñáéíóúü]/i.test(l.replace(/“[^”]*”/g, "")) && l.trim() !== "" && !/undefined|NaN|\{\w+\}/.test(l), "línea rara: «" + l + "»");
  const texto = en.join("\n");
  assert.match(texto, /no rain \(up to [\d.]+ mm\/h\), drizzle \(up to [\d.]+\), moderate \(up to [\d.]+\) and heavy \(over [\d.]+\)/);
  assert.match(texto, /Traffic light: \d+ to 100 points is green/);
  assert.ok(!/\b(sin|llovizna|moderada|fuerte)\b/.test(texto.replace(/“[^”]*”/g, "")), "nombres de nivel de lluvia sin traducir");
  assert.ok(es.join("\n").includes("sin 25") || /sin \d+/.test(es.join("\n")), "el español sigue diciendo «sin N»");
});

it("los proveedores piden los nombres en el idioma de la app", () => {
  assert.match(urlBusqueda("vigo"), /language=es/);
  assert.match(urlNombre(42.2, -8.7), /accept-language=es/);
  fijarIdioma("en", ["en-US"]);
  assert.match(urlBusqueda("vigo"), /language=en/);
  assert.match(urlNombre(42.2, -8.7), /accept-language=en/);
});

it("al cargar: fuera de un navegador es español aunque Node diga en-US; en un navegador manda el idioma del teléfono", async () => {
  const cargar = async (globales) => {
    vi.resetModules();
    for (const [k, v] of Object.entries(globales)) vi.stubGlobal(k, v);
    try { return await import("../../src/idioma/index.js"); } finally { vi.unstubAllGlobals(); }
  };
  const sinNavegador = await cargar({ navigator: { languages: ["en-US"] } });
  assert.equal(sinNavegador.idioma, "es");
  assert.equal(sinNavegador.locale, "es-ES");
  const conNavegador = await cargar({ window: {}, navigator: { languages: ["fr-FR", "en-AU"] } });
  assert.equal(conNavegador.idioma, "en");
  assert.equal(conNavegador.locale, "en-AU");
  vi.resetModules();
});
