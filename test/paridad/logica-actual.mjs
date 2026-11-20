// La lógica ACTUAL (js/*.js, la de la web que está publicada). Solo se usa para generar las referencias.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const Astro = require("../../js/astro.js");
export const Semaforo = require("../../js/semaforo.js");
export const Datos = require("../../js/datos.js");
export const Perfil = require("../../js/perfil.js");
export const Recetas = require("../../js/recetas.js");
export const Lugar = require("../../js/lugar.js");

// urlPrevision vive dentro de prueba/hoy.html: se extrae el texto de la función tal cual está
const html = fs.readFileSync(path.join(RAIZ, "prueba", "hoy.html"), "utf8");
const trozo = html.match(/function urlPrevision\(lat, lon\) \{[\s\S]*?\n\}/);
if (!trozo) throw new Error("No encuentro urlPrevision en prueba/hoy.html");
export const urlPrevision = new Function("URLSearchParams", trozo[0] + "\nreturn urlPrevision;")(URLSearchParams);

// Los datos tal y como los entrega Datos.cargar() de la web actual (con «fetch» leyendo del disco)
export const datosCargados = () => Datos.cargar("", async (ruta) => {
  const f = path.join(RAIZ, "data", ruta);
  return { ok: fs.existsSync(f), status: fs.existsSync(f) ? 200 : 404, json: async () => JSON.parse(fs.readFileSync(f, "utf8")) };
});

export const logica = { Astro, Semaforo, Datos, Perfil, Recetas, Lugar, urlPrevision, datosCargados };
