/*
 * Valida la carpeta data/ con las mismas reglas que usa la web (js/datos.js).
 *
 *   npm run validar                  valida data/
 *   DATOS_DIR=ruta npm run validar   valida otra carpeta (lo usan las pruebas)
 *
 * Termina con código 1 y la lista de errores si algo está mal. La compilación (vite build)
 * llama a esta misma función, así que un JSON mal editado no llega a publicarse.
 */
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const aqui = path.dirname(fileURLToPath(import.meta.url));

// DATOS_DIR permite validar otra carpeta (lo usan las pruebas); por defecto, data/
export const CARPETA_DATOS = process.env.DATOS_DIR ? path.resolve(process.env.DATOS_DIR) : path.join(aqui, "..", "data");

// Devuelve la lista de errores (vacía si todo está bien). Si un archivo no se puede leer, es un error más.
export function erroresDeDatos(carpeta = CARPETA_DATOS) {
  const { cargarDatos } = require("../test/datos-de-disco.cjs");
  const Datos = require("../js/datos.js");
  try {
    return Datos.validar(cargarDatos(carpeta));
  } catch (e) {
    return ["No se pudieron leer los datos de " + carpeta + ": " + e.message];
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errores = erroresDeDatos();
  if (errores.length) {
    console.error("Hay " + errores.length + " error(es) en los datos:\n - " + errores.join("\n - "));
    process.exit(1);
  }
  console.log("Datos correctos.");
}
