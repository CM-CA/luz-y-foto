import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { erroresDeDatos } from "./scripts/validar-datos.mjs";
import { servicioSinConexion } from "./scripts/pwa.mjs";

// Si los datos de data/ tienen un error, la compilación se detiene y lo explica:
// así un JSON mal editado no llega nunca a publicarse.
function validarDatos() {
  let compilando = false;
  return {
    name: "validar-datos",
    configResolved(config) { compilando = config.command === "build"; },
    buildStart() {
      const errores = erroresDeDatos();
      if (!errores.length) return;
      const mensaje = "Hay un error en los datos (data/):\n - " + errores.join("\n - ");
      if (compilando) this.error(mensaje); else this.warn(mensaje);
    }
  };
}

// La web se publica en https://cm-ca.github.io/luz-y-foto/. La vista previa va en /luz-y-foto/beta/
// y se indica al compilar: `vite build --base=/luz-y-foto/beta/`.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/luz-y-foto/" : "/",
  plugins: [svelte(), validarDatos(), servicioSinConexion()],
  build: { target: "es2022" }
}));
