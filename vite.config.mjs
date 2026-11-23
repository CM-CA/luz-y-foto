import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { erroresDeDatos } from "./scripts/validar-datos.mjs";
import { servicioSinConexion } from "./scripts/pwa.mjs";

// Si los datos de data/ (cada idioma) tienen un error, la compilación se detiene y lo explica:
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

// La web se publica en https://cm-ca.github.io/ollada/ y se compila con esa ruta (`vite build`, sin opciones).
// Para ensayar otra ruta: `vite build --base=/otra/ruta/`.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/ollada/" : "/",
  plugins: [svelte(), validarDatos(), servicioSinConexion()],
  // assetsInlineLimit: 0 -> las imágenes pequeñas (las lunas, algún cielo) no se meten dentro del JS en base64:
  // cada una es un archivo de dist/ y el service worker la guarda por separado.
  build: { target: "es2022", assetsInlineLimit: 0 }
}));
