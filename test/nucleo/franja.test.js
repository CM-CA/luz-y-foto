// «La luz de hoy»: la franja de bloques entre el inicio de la hora dorada y el final de la hora azul, con la puesta
// de sol y (si el día es hoy y estamos dentro) la hora de ahora; y el título que lleva según el día.
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { BLOQUES, franja, tituloDeLaLuz } from "../../src/nucleo/franja.js";

const t = (hhmm) => Date.parse("2026-11-19T" + hhmm + ":00+01:00");
const DORADA = t("17:27"), PUESTA = t("18:10"), AZUL = t("18:40");
const casi = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + " ≠ " + b);
const base = { dorada: DORADA, puesta: PUESTA, azul: AZUL, ahora: t("15:00"), esHoy: true };

describe("franja", () => {
  it("tiene 48 bloques y sitúa la puesta entre la dorada y la azul (43 de 73 minutos)", () => {
    const f = franja(base);
    assert.equal(BLOQUES, 48);
    assert.equal(f.bloques.length, 48);
    casi(f.puesta, 43 / 73);
  });

  it("empieza de día, termina de noche, y los extremos están casi en su color de partida y de llegada", () => {
    const { bloques } = franja(base);
    assert.equal(bloques[0].tramo, "dia");
    assert.ok(bloques[0].mezcla < 5, "primer bloque: " + bloques[0].mezcla);
    assert.equal(bloques[47].tramo, "noche");
    assert.ok(bloques[47].mezcla > 95, "último bloque: " + bloques[47].mezcla);
  });

  it("el tramo cambia en el primer bloque cuyo centro supera la puesta (el 28: su centro está al 59,4 %, la puesta al 58,9 %)", () => {
    const { bloques } = franja(base);
    const centro = (i) => ((i + 0.5) / BLOQUES) * (AZUL - DORADA) + DORADA;
    const primeroDeNoche = bloques.findIndex((b) => b.tramo === "noche");
    assert.equal(primeroDeNoche, 28);
    assert.ok(centro(primeroDeNoche) > PUESTA && centro(primeroDeNoche - 1) <= PUESTA);
    assert.ok(bloques.slice(0, primeroDeNoche).every((b) => b.tramo === "dia"));
    assert.ok(bloques.slice(primeroDeNoche).every((b) => b.tramo === "noche"));
  });

  it("la mezcla crece dentro de cada tramo y se mantiene entre 0 y 100", () => {
    const { bloques } = franja(base);
    for (const tramo of ["dia", "noche"]) {
      const m = bloques.filter((b) => b.tramo === tramo).map((b) => b.mezcla);
      assert.ok(m.length > 1);
      assert.ok(m.every((v, i) => v >= 0 && v <= 100 && (i === 0 || v > m[i - 1])), tramo + ": " + m.join(" "));
    }
  });

  describe("ahora", () => {
    it("dentro de la franja y siendo hoy: su posición, de 0 a 1 (18:05 → 38 de 73 minutos)", () => {
      casi(franja({ ...base, ahora: t("18:05") }).ahora, 38 / 73);
    });
    it("no siendo hoy: null", () => {
      assert.equal(franja({ ...base, ahora: t("18:05"), esHoy: false }).ahora, null);
    });
    it("antes de la hora dorada o después de la azul: null", () => {
      assert.equal(franja({ ...base, ahora: t("17:00") }).ahora, null);
      assert.equal(franja({ ...base, ahora: t("19:00") }).ahora, null);
    });
    it("justo al empezar la dorada: 0; justo al acabar la azul: 1", () => {
      assert.equal(franja({ ...base, ahora: DORADA }).ahora, 0);
      assert.equal(franja({ ...base, ahora: AZUL }).ahora, 1);
    });
    it("sin hora de ahora (null, undefined, NaN): null, pero la franja se pinta", () => {
      for (const ahora of [null, undefined, NaN]) {
        const f = franja({ ...base, ahora });
        assert.ok(f && f.bloques.length === 48);
        assert.equal(f.ahora, null);
      }
    });
  });

  describe("sin datos fiables no hay franja (null)", () => {
    const casos = {
      "falta la dorada (null)": { dorada: null },
      "falta la azul (undefined)": { azul: undefined },
      "la puesta no es un número (NaN)": { puesta: NaN },
      "la puesta es infinita": { puesta: Infinity },
      "la puesta es anterior a la dorada": { puesta: DORADA - 60000 },
      "la puesta coincide con la dorada": { puesta: DORADA },
      "la azul es anterior a la puesta": { azul: PUESTA - 60000 },
      "la azul coincide con la puesta": { azul: PUESTA },
      "la dorada es un texto": { dorada: "17:27" }
    };
    for (const [nombre, cambio] of Object.entries(casos)) {
      it(nombre, () => assert.equal(franja({ ...base, ...cambio }), null));
    }
  });
});

describe("tituloDeLaLuz", () => {
  const hoy = "2026-11-21", manana = "2026-11-22";
  it("hoy, mañana y el resto de días por su nombre", () => {
    assert.equal(tituloDeLaLuz("2026-11-21", hoy, manana), "La luz de hoy");
    assert.equal(tituloDeLaLuz("2026-11-22", hoy, manana), "La luz de mañana");
    assert.equal(tituloDeLaLuz("2026-11-23", hoy, manana), "La luz del lunes");
    assert.equal(tituloDeLaLuz("2026-11-25", hoy, manana), "La luz del miércoles");
    assert.equal(tituloDeLaLuz("2026-11-28", hoy, manana), "La luz del sábado");
  });
});
