// Pruebas de las sugerencias de ciudades mientras se escribe: mínimo de letras, espera desde la última tecla, cancelación
// de la petición anterior y descarte de las respuestas que llegan tarde. Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import { it, vi, beforeEach, afterEach } from "vitest";
import { crearSugeridor, MINIMO_LETRAS, ESPERA_MS } from "../../src/nucleo/sugerencias.js";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

function diferida() {
  let resolver, rechazar;
  const promesa = new Promise((a, b) => { resolver = a; rechazar = b; });
  return { promesa, resolver, rechazar };
}

// Un sugeridor con una búsqueda falsa cuyas respuestas se controlan a mano: llamadas[i] = { q, senal, d }
function montar() {
  const llamadas = [];
  const buscar = vi.fn((q, senal) => { const d = diferida(); llamadas.push({ q, senal, d }); return d.promesa; });
  const alVaciar = vi.fn(), alRecibir = vi.fn();
  const sugeridor = crearSugeridor({ buscar, alVaciar, alRecibir });
  return { sugeridor, buscar, alVaciar, alRecibir, llamadas };
}

it("pide 3 letras y espera 400 ms", () => {
  assert.equal(MINIMO_LETRAS, 3);
  assert.equal(ESPERA_MS, 400);
});

it("no busca con menos de 3 letras y vacía la lista", async () => {
  const { sugeridor, buscar, alVaciar } = montar();
  sugeridor.escribir("Vi");
  await vi.advanceTimersByTimeAsync(1000);
  assert.equal(buscar.mock.calls.length, 0);
  assert.equal(alVaciar.mock.calls.length, 1);
});

it("cuenta las letras sin los espacios de los lados", async () => {
  const { sugeridor, buscar } = montar();
  sugeridor.escribir("  Vi ");
  await vi.advanceTimersByTimeAsync(1000);
  assert.equal(buscar.mock.calls.length, 0);
  sugeridor.escribir(" Vig ");
  await vi.advanceTimersByTimeAsync(400);
  assert.equal(buscar.mock.calls.length, 1);
  assert.equal(buscar.mock.calls[0][0], "Vig");
});

it("espera 400 ms desde la última tecla y busca una sola vez", async () => {
  const { sugeridor, buscar } = montar();
  sugeridor.escribir("Vig");
  await vi.advanceTimersByTimeAsync(300);
  sugeridor.escribir("Vigo");
  await vi.advanceTimersByTimeAsync(399);
  assert.equal(buscar.mock.calls.length, 0);
  await vi.advanceTimersByTimeAsync(1);
  assert.equal(buscar.mock.calls.length, 1);
  assert.equal(buscar.mock.calls[0][0], "Vigo");
});

it("entrega los resultados de la búsqueda con el texto buscado", async () => {
  const { sugeridor, alRecibir, llamadas } = montar();
  sugeridor.escribir("Vigo");
  await vi.advanceTimersByTimeAsync(400);
  llamadas[0].d.resolver([{ nombre: "Vigo" }]);
  await vi.advanceTimersByTimeAsync(0);
  assert.equal(alRecibir.mock.calls.length, 1);
  assert.deepEqual(alRecibir.mock.calls[0], [[{ nombre: "Vigo" }], "Vigo"]);
});

it("descarta la respuesta de una búsqueda anterior", async () => {
  const { sugeridor, alRecibir, llamadas } = montar();
  sugeridor.escribir("Vigo");
  await vi.advanceTimersByTimeAsync(400);
  sugeridor.escribir("Lugo");
  await vi.advanceTimersByTimeAsync(400);
  llamadas[1].d.resolver([{ nombre: "Lugo" }]);
  await vi.advanceTimersByTimeAsync(0);
  llamadas[0].d.resolver([{ nombre: "Vigo" }]); // llega tarde
  await vi.advanceTimersByTimeAsync(0);
  assert.equal(alRecibir.mock.calls.length, 1);
  assert.deepEqual(alRecibir.mock.calls[0], [[{ nombre: "Lugo" }], "Lugo"]);
});

it("aborta la petición en vuelo al escribir otra cosa", async () => {
  const { sugeridor, llamadas } = montar();
  sugeridor.escribir("Vigo");
  await vi.advanceTimersByTimeAsync(400);
  assert.equal(llamadas[0].senal.aborted, false);
  sugeridor.escribir("Vigo ");
  assert.equal(llamadas[0].senal.aborted, true);
  await vi.advanceTimersByTimeAsync(400);
  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[1].senal.aborted, false);
});

it("cancelar() descarta lo pendiente y lo que viene en camino", async () => {
  const { sugeridor, buscar, alRecibir, llamadas } = montar();
  sugeridor.escribir("Vigo");
  sugeridor.cancelar(); // antes de que acabe la espera
  await vi.advanceTimersByTimeAsync(1000);
  assert.equal(buscar.mock.calls.length, 0);
  sugeridor.escribir("Lugo");
  await vi.advanceTimersByTimeAsync(400); // la petición sale
  sugeridor.cancelar();
  assert.equal(llamadas[0].senal.aborted, true);
  llamadas[0].d.resolver([{ nombre: "Lugo" }]);
  await vi.advanceTimersByTimeAsync(0);
  assert.equal(alRecibir.mock.calls.length, 0);
});

it("un fallo de la búsqueda no avisa a nadie", async () => {
  const { sugeridor, alRecibir, alVaciar, llamadas } = montar();
  sugeridor.escribir("Vigo");
  await vi.advanceTimersByTimeAsync(400);
  llamadas[0].d.rechazar(new Error("sin conexión"));
  await vi.advanceTimersByTimeAsync(0);
  assert.equal(alRecibir.mock.calls.length, 0);
  assert.equal(alVaciar.mock.calls.length, 0);
});
