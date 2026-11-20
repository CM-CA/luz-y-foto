// Pruebas del módulo de sol y luna. Se ejecutan con: npm test (o npx vitest run).
// Mismas comprobaciones que test/astro.test.cjs, pero sobre la lógica nueva (src/).
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco as cargarDatos } from "../../scripts/datos-de-disco.mjs";
import * as Astro from "../../src/nucleo/astro.js";

const LAT = 42.2406, LON = -8.7207; // Vigo
const hhmm = (d) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
const mediodia = (iso) => new Date(iso + "T12:00:00"); // hora local del sistema

const prueba = it;

// Horas de Open-Meteo para Vigo (respuesta real del 18-nov-2026), con 1 minuto de tolerancia
const OPEN_METEO = {
  "2026-11-18": { amanecer: "08:28", puesta: "18:10" },
  "2026-11-19": { amanecer: "08:30", puesta: "18:09" },
  "2026-11-20": { amanecer: "08:31", puesta: "18:09" }
};
const aMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

for (const [dia, esperado] of Object.entries(OPEN_METEO)) {
  prueba("amanecer y puesta " + dia + " coinciden con Open-Meteo (±1 min)", () => {
    const { sol } = Astro.calcularDia(mediodia(dia), LAT, LON);
    assert.ok(Math.abs(aMin(hhmm(sol.amanecer)) - aMin(esperado.amanecer)) <= 1, "amanecer " + hhmm(sol.amanecer));
    assert.ok(Math.abs(aMin(hhmm(sol.puesta)) - aMin(esperado.puesta)) <= 1, "puesta " + hhmm(sol.puesta));
  });
}

prueba("la puesta de noviembre en Vigo cae hacia el oeste-suroeste", () => {
  const { sol } = Astro.calcularDia(mediodia("2026-11-18"), LAT, LON);
  assert.ok(sol.azPuesta > 235 && sol.azPuesta < 250, "azimut " + sol.azPuesta.toFixed(1));
  assert.equal(sol.palabraPuesta, "oeste-suroeste");
});

prueba("el amanecer cae hacia el este-sureste", () => {
  const { sol } = Astro.calcularDia(mediodia("2026-11-18"), LAT, LON);
  assert.ok(sol.azAmanecer > 110 && sol.azAmanecer < 125, "azimut " + sol.azAmanecer.toFixed(1));
});

prueba("orden de la tarde: hora dorada < puesta < fin de hora azul", () => {
  const { sol } = Astro.calcularDia(mediodia("2026-11-18"), LAT, LON);
  assert.ok(sol.horaDorada < sol.puesta && sol.puesta < sol.finHoraAzul);
});

prueba("la hora dorada empieza antes de la puesta y la hora azul dura menos de una hora", () => {
  const { sol } = Astro.calcularDia(mediodia("2026-11-18"), LAT, LON);
  const antes = (sol.puesta - sol.horaDorada) / 60000;
  const azul = (sol.finHoraAzul - sol.puesta) / 60000;
  assert.ok(antes > 30 && antes < 90, "dorada " + antes.toFixed(0) + " min");
  assert.ok(azul > 20 && azul < 60, "azul " + azul.toFixed(0) + " min");
});

prueba("identificadores de fase", () => {
  assert.equal(Astro.idFase(0.0), "nueva");
  assert.equal(Astro.idFase(0.99), "nueva");
  assert.equal(Astro.idFase(0.10), "creciente");
  assert.equal(Astro.idFase(0.25), "cuarto-creciente");
  assert.equal(Astro.idFase(0.40), "gibosa-creciente");
  assert.equal(Astro.idFase(0.50), "llena");
  assert.equal(Astro.idFase(0.60), "gibosa-menguante");
  assert.equal(Astro.idFase(0.75), "cuarto-menguante");
  assert.equal(Astro.idFase(0.90), "menguante");
});

prueba("puntos cardinales", () => {
  assert.equal(Astro.puntoCardinal(0), "norte");
  assert.equal(Astro.puntoCardinal(359), "norte");
  assert.equal(Astro.puntoCardinal(90), "este");
  assert.equal(Astro.puntoCardinal(180), "sur");
  assert.equal(Astro.puntoCardinal(270), "oeste");
  assert.equal(Astro.puntoCardinal(-90), "oeste");
});

prueba("la luna crece del día 18 al 24 y llega a llena hacia el 24", () => {
  const f = (d) => Astro.calcularDia(mediodia(d), LAT, LON).luna;
  const a = f("2026-11-18"), b = f("2026-11-21"), c = f("2026-11-24");
  assert.ok(a.fraccion < b.fraccion && b.fraccion < c.fraccion, [a, b, c].map((x) => x.fraccion.toFixed(2)).join(" < "));
  assert.ok(a.creciente && c.fraccion > 0.95, "fracción el 24: " + c.fraccion.toFixed(2));
});

prueba("la luna sale por el este y se pone por el oeste", () => {
  const l = Astro.calcularDia(mediodia("2026-11-18"), LAT, LON).luna;
  assert.ok(l.sale, "debería salir el día 18");
  assert.ok(l.azSale > 45 && l.azSale < 135, "azimut salida " + l.azSale.toFixed(0));
  assert.ok(l.seSitua, "debería ponerse");
  assert.ok(l.azSeSitua > 225 && l.azSeSitua < 315, "azimut puesta " + l.azSeSitua.toFixed(0));
});

prueba("si la luna se pone de madrugada, se avisa de que es al día siguiente", () => {
  const l = Astro.calcularDia(mediodia("2026-11-18"), LAT, LON).luna;
  assert.equal(l.seSituaAlDiaSiguiente, true);
  assert.ok(l.seSitua > l.sale);
});

prueba("todos los días de noviembre tienen una fase que existe en los datos", () => {
  const luna = cargarDatos().generos.luna;
  for (let i = 0; i < 30; i++) {
    const d = new Date(2026, 10, 1 + i, 12);
    const l = Astro.calcularDia(d, LAT, LON).luna;
    assert.ok(luna.fases[l.faseId], "día " + (1 + i) + ": fase " + l.faseId);
  }
});

