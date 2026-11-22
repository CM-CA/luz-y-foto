// Pruebas de la petición de JSON común a los proveedores: el límite de tiempo y la señal para cancelarla desde fuera.
// Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import { it, vi, afterEach } from "vitest";
import { pedirJson } from "../../src/proveedores/http.js";

afterEach(() => { vi.unstubAllGlobals(); });

it("abortar la señal externa aborta la petición", async () => {
  let senalDelFetch;
  vi.stubGlobal("fetch", (url, { signal }) => {
    senalDelFetch = signal;
    return new Promise((_, rechazar) => signal.addEventListener("abort", () => rechazar(new DOMException("abortada", "AbortError"))));
  });
  const control = new AbortController();
  const promesa = pedirJson("https://ejemplo.test/a", 8000, control.signal);
  control.abort();
  await assert.rejects(promesa);
  assert.equal(senalDelFetch.aborted, true);
});

it("una señal ya abortada rechaza sin pedir nada", async () => {
  const falso = vi.fn();
  vi.stubGlobal("fetch", falso);
  const control = new AbortController();
  control.abort();
  await assert.rejects(pedirJson("https://ejemplo.test/a", 8000, control.signal));
  assert.equal(falso.mock.calls.length, 0);
});

it("sin señal externa devuelve el JSON como siempre", async () => {
  vi.stubGlobal("fetch", async () => ({ ok: true, json: async () => ({ dato: 1 }) }));
  assert.deepEqual(await pedirJson("https://ejemplo.test/a"), { dato: 1 });
});

it("una respuesta con error HTTP lanza", async () => {
  vi.stubGlobal("fetch", async () => ({ ok: false, status: 500, json: async () => ({}) }));
  await assert.rejects(pedirJson("https://ejemplo.test/a"), /HTTP 500/);
});
