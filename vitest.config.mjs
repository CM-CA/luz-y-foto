// Pruebas de la lógica con Vitest: las de test/nucleo/ (la lógica de src/nucleo/).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/nucleo/**/*.test.js"],
    globalSetup: ["test/vitest-global.mjs"]
  }
});
