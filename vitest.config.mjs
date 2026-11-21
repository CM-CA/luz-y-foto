// Pruebas de la lógica con Vitest. Solo se ejecutan las de test/nucleo/ y test/paridad/;
// las de test/*.test.cjs son las de la versión actual (js/) y se ejecutan con node.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/nucleo/**/*.test.js", "test/paridad/**/*.test.js"],
    globalSetup: ["test/vitest-global.mjs"]
  }
});
