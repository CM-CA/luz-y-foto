/*
 * Valida la carpeta data/ con las reglas de src/nucleo/datos.js.
 *
 *   npm run validar                  valida data/
 *   DATOS_DIR=ruta npm run validar   valida otra carpeta (lo usan las pruebas)
 *
 * Termina con código 1 y la lista de errores si algo está mal. La compilación (vite build)
 * llama a esta misma función, así que un JSON mal editado no llega a publicarse.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validar } from "../src/nucleo/datos.js";
import { cargarDeDisco, CARPETA_DATOS as CARPETA_POR_DEFECTO } from "./datos-de-disco.mjs";

// DATOS_DIR permite validar otra carpeta (lo usan las pruebas); por defecto, data/
export const CARPETA_DATOS = process.env.DATOS_DIR ? path.resolve(process.env.DATOS_DIR) : CARPETA_POR_DEFECTO;

// Devuelve la lista de errores (vacía si todo está bien). Si un archivo no se puede leer, es un error más.
export function erroresDeDatos(carpeta = CARPETA_DATOS) {
  try {
    return validar(cargarDeDisco(carpeta));
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
