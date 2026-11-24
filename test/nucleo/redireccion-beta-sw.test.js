// El service worker de baja de /beta/ (transicion/beta/sw.js): qué hace al instalarse y al activarse.
// Que el navegador lo encuentre y lo active, con una app vieja instalada de verdad, se prueba en test/e2e/compilada/redireccion-beta.e2e.cjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { it } from "vitest";

const TEXTO = fs.readFileSync(new URL("../../transicion/beta/sw.js", import.meta.url), "utf8");
const RAIZ = "https://x.test/ollada/";
const SCOPE = RAIZ + "beta/";

// Un «navegador» mínimo: cachés con las direcciones que guardan, ventanas controladas y un registro de lo que va pasando
function montar({ caches: contenido, ventanas = [], navegarFalla = false }) {
  const guardadas = new Map(Object.entries(contenido));
  const sucesos = [];
  const oyentes = {};
  const self = {
    registration: { scope: SCOPE, unregister: async () => { sucesos.push("baja"); } },
    skipWaiting: () => { sucesos.push("skipWaiting"); return Promise.resolve(); },
    clients: { matchAll: async () => ventanas.map((url) => ({
      url,
      navigate: async (destino) => { sucesos.push("navegar " + destino); if (navegarFalla) throw new TypeError("sin permiso"); },
    })) },
    addEventListener: (nombre, f) => { oyentes[nombre] = f; },
  };
  const caches = {
    keys: async () => [...guardadas.keys()],
    open: async (nombre) => ({ keys: async () => guardadas.get(nombre).map((url) => ({ url })) }),
    delete: async (nombre) => { sucesos.push("borrar " + nombre); return guardadas.delete(nombre); },
  };
  vm.runInNewContext(TEXTO, { self, caches, URL });
  const activar = async () => {
    let espera;
    oyentes.activate({ waitUntil: (p) => { espera = p; } });
    await espera;
  };
  return { oyentes, sucesos, guardadas, activar };
}

it("al instalarse pide activarse en el acto", () => {
  const { oyentes, sucesos } = montar({ caches: {} });
  oyentes.install({});
  assert.deepEqual(sucesos, ["skipWaiting"]);
});

it("al activarse borra las cachés de la vista previa y deja las de la raíz y las ajenas", async () => {
  const { sucesos, guardadas, activar } = montar({
    caches: {
      "luz-y-foto-vieja": [SCOPE, SCOPE + "index.html", SCOPE + "assets/app-1.js"], // la de la app instalada desde /beta/
      "luz-y-foto-nueva": [RAIZ, RAIZ + "index.html", RAIZ + "assets/app-2.js"], // la de la app de la raíz, misma familia de nombres
      "otra-cosa": ["https://x.test/otra-app/index.html"],
    },
  });
  await activar();
  assert.deepEqual([...guardadas.keys()].sort(), ["luz-y-foto-nueva", "otra-cosa"]);
  assert.deepEqual(sucesos.filter((s) => s.startsWith("borrar")), ["borrar luz-y-foto-vieja"]);
});

it("lleva cada ventana abierta a la raíz con su misma ruta y después se da de baja", async () => {
  const { sucesos, activar } = montar({
    caches: { "luz-y-foto-vieja": [SCOPE + "index.html"] },
    ventanas: [SCOPE + "#/hoy", SCOPE + "#/luna", SCOPE],
  });
  await activar();
  assert.deepEqual(sucesos, [
    "borrar luz-y-foto-vieja",
    "navegar " + RAIZ + "#/hoy",
    "navegar " + RAIZ + "#/luna",
    "navegar " + RAIZ,
    "baja",
  ]);
});

it("si una ventana no se puede llevar a la raíz, igualmente se da de baja y las demás ventanas se llevan", async () => {
  const { sucesos, activar } = montar({ caches: {}, ventanas: [SCOPE + "#/hoy", SCOPE + "#/luna"], navegarFalla: true });
  await activar();
  assert.deepEqual(sucesos, ["navegar " + RAIZ + "#/hoy", "navegar " + RAIZ + "#/luna", "baja"]);
});
