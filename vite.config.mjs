import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { erroresDeDatos } from "./scripts/validar-datos.mjs";
import { servicioSinConexion } from "./scripts/pwa.mjs";
import { datosDeVersion } from "./scripts/version.mjs";

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

// Política de seguridad de contenido (CSP) de la web publicada: solo se ejecuta código de la propia app y solo se habla con los tres
// servicios que usa (previsión y búsqueda de lugares de Open-Meteo, nombre del lugar de OpenStreetMap). Así, si algún día se colara
// texto ajeno en una página, el navegador se negaría a ejecutarlo y a mandar nada fuera.
// GitHub Pages no deja poner cabeceras, por eso va en una etiqueta <meta> que se añade al compilar (en desarrollo no se pone: el
// servidor de Vite necesita scripts en línea y conexiones propias). Los estilos en línea se permiten porque Svelte y los dibujos SVG
// los usan; lo que importa es que los scripts sean solo los de la app. Lo comprueba test/e2e/compilada/seguridad.e2e.cjs.
const POLITICA_DE_SEGURIDAD = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com https://nominatim.openstreetmap.org",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'"
].join("; ");

function politicaDeSeguridad() {
  return {
    name: "politica-de-seguridad",
    apply: "build",
    transformIndexHtml() {
      return [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: POLITICA_DE_SEGURIDAD }, injectTo: "head-prepend" }];
    }
  };
}

// La web se publica en https://cm-ca.github.io/ollada/ y se compila con esa ruta (`vite build`, sin opciones).
// Para ensayar otra ruta: `vite build --base=/otra/ruta/`.
// La versión (de package.json) y el commit y la fecha del último cambio se meten en la app para que se vean en el aviso legal (src/version.js).
const version = datosDeVersion(import.meta.dirname);

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/ollada/" : "/",
  define: {
    __OLLADA_VERSION__: JSON.stringify(version.version),
    __OLLADA_COMMIT__: JSON.stringify(version.commit),
    __OLLADA_FECHA__: JSON.stringify(version.fecha)
  },
  plugins: [svelte(), validarDatos(), politicaDeSeguridad(), servicioSinConexion()],
  // assetsInlineLimit: 0 -> las imágenes pequeñas (las lunas, algún cielo) no se meten dentro del JS en base64:
  // cada una es un archivo de dist/ y el service worker la guarda por separado.
  build: { target: "es2022", assetsInlineLimit: 0 }
}));
