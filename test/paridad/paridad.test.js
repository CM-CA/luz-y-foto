// La lógica nueva (src/) debe dar EXACTAMENTE lo mismo que la actual (js/).
// Las referencias de referencia/ las generó la lógica actual: ver calcular.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { AREAS, calcularArea } from "./calcular.mjs";
import { logica } from "./logica-nueva.mjs";

const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), "referencia");
const leer = (nombre) => JSON.parse(fs.readFileSync(path.join(carpeta, nombre + ".json"), "utf8"));

// Compara por trozos para que el fallo diga qué caso es, en vez de volcar un archivo entero
function comparar(esperado, obtenido, ruta = "") {
  const dif = [];
  if (JSON.stringify(esperado) === JSON.stringify(obtenido)) return dif;
  if (esperado && obtenido && typeof esperado === "object" && typeof obtenido === "object" && Array.isArray(esperado) === Array.isArray(obtenido)) {
    const claves = new Set([...Object.keys(esperado), ...Object.keys(obtenido)]);
    for (const k of claves) dif.push(...comparar(esperado[k], obtenido[k], ruta + "/" + k));
    return dif;
  }
  return [ruta + ": esperado " + JSON.stringify(esperado)?.slice(0, 120) + " y salió " + JSON.stringify(obtenido)?.slice(0, 120)];
}

describe("paridad con la lógica actual (js/)", () => {
  expect(process.env.TZ).toBe("Europe/Madrid");
  for (const nombre of Object.keys(AREAS)) {
    it(nombre, async () => {
      const obtenido = await calcularArea(nombre, logica);
      const dif = comparar(leer(nombre), obtenido);
      expect(dif.slice(0, 15), dif.length + " diferencia(s)").toEqual([]);
    }, 120000);
  }
});
