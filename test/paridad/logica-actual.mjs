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

// La lógica de la pantalla también vive dentro de hoy.html: se extraen las funciones tal cual están
const funciones = ["nochesDe", "listaDe", "fechaLugar", "etiquetaDia", "pestanaPorDefecto"].map((n) => {
  const t = html.match(new RegExp("function " + n + "\\([^)]*\\) \\{[\\s\\S]*?\\n\\}"));
  if (!t) throw new Error("No encuentro " + n + " en prueba/hoy.html");
  return t[0];
});
const constantes = ["hm", "pct", "unida", "mayus"].map((n) => {
  const t = html.match(new RegExp("^const " + n + " = .*;$", "m"));
  if (!t) throw new Error("No encuentro " + n + " en prueba/hoy.html");
  return t[0];
});
const fabricaPantalla = new Function("Semaforo", "config", "HORA",
  constantes.join("\n") + "\n" + funciones.join("\n") + "\nreturn { nochesDe, listaDe, fechaLugar, etiquetaDia, pestanaPorDefecto, hm, pct, unida, mayus };");
const base = fabricaPantalla(Semaforo, { indice: {} }, 3600000);
// En hoy.html pestanaPorDefecto lee config.indice de una variable global: aquí se le pasa
export const pantalla = { ...base, pestanaPorDefecto: (indice, prev, ahora) => fabricaPantalla(Semaforo, { indice }, 3600000).pestanaPorDefecto(prev, ahora) };

// Los datos tal y como los entrega Datos.cargar() de la web actual (con «fetch» leyendo del disco)
export const datosCargados = () => Datos.cargar("", async (ruta) => {
  const f = path.join(RAIZ, "data", ruta);
  return { ok: fs.existsSync(f), status: fs.existsSync(f) ? 200 : 404, json: async () => JSON.parse(fs.readFileSync(f, "utf8")) };
});

export const logica = { Astro, Semaforo, Datos, Perfil, Recetas, Lugar, urlPrevision, datosCargados, pantalla };
