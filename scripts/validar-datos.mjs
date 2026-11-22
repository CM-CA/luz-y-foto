/*
 * Valida las carpetas de datos (data/es/, data/en/…) con las reglas de src/nucleo/datos.js: cada idioma por separado.
 *
 *   npm run validar                  valida todos los idiomas de data/
 *   DATOS_DIR=ruta npm run validar   valida otra raíz de datos, con una carpeta por idioma (lo usan las pruebas)
 *
 * Termina con código 1 y la lista de errores si algo está mal. La compilación (vite build)
 * llama a esta misma función, así que un JSON mal editado no llega a publicarse.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validar } from "../src/nucleo/datos.js";
import { IDIOMAS } from "../src/nucleo/idioma.js";
import { cargarDeDisco, carpetaDeIdioma, idiomasDeDatos, RAIZ_DATOS as RAIZ_POR_DEFECTO } from "./datos-de-disco.mjs";

// DATOS_DIR permite validar otra raíz (lo usan las pruebas); por defecto, data/
export const RAIZ_DATOS = process.env.DATOS_DIR ? path.resolve(process.env.DATOS_DIR) : RAIZ_POR_DEFECTO;

// Devuelve la lista de errores (vacía si todo está bien), cada uno con el idioma donde está. Si un archivo no se puede leer, es un error más.
export function erroresDeDatos(raiz = RAIZ_DATOS) {
  let idiomas;
  try { idiomas = idiomasDeDatos(raiz); } catch (e) { return ["No se pudo leer la carpeta de datos " + raiz + ": " + e.message]; }
  if (!idiomas.includes("es")) return ["Falta la carpeta data/es/ (el español es el idioma de referencia): " + raiz];
  // Todo idioma que la app ofrece (IDIOMAS) necesita su carpeta: sin ella la app lo mostraría en español sin avisar.
  const errores = IDIOMAS.filter((id) => !idiomas.includes(id)).map((id) => "Falta la carpeta data/" + id + "/ (el idioma «" + id + "» está en IDIOMAS, src/nucleo/idioma.js): " + raiz);
  for (const id of idiomas) {
    try {
      validar(cargarDeDisco(carpetaDeIdioma(id, raiz))).forEach((e) => errores.push("data/" + id + "/: " + e));
    } catch (e) {
      errores.push("No se pudieron leer los datos de " + carpetaDeIdioma(id, raiz) + ": " + e.message);
    }
  }
  return errores;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errores = erroresDeDatos();
  if (errores.length) {
    console.error("Hay " + errores.length + " error(es) en los datos:\n - " + errores.join("\n - "));
    process.exit(1);
  }
  console.log("Datos correctos (" + idiomasDeDatos(RAIZ_DATOS).join(", ") + ").");
}
