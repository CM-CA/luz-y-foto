/*
 * Lee la carpeta data/ del disco con la misma forma que `datosIncluidos()` (src/datos-incluidos.js)
 * (y que Datos.cargar() de la versión actual): {comun, indice, generos, perfil, glosario, recetas, lecciones}, con lecciones = {indice, porId}.
 * La usan `npm run validar`, la compilación y las pruebas.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));

export const CARPETA_DATOS = path.join(aqui, "..", "data");

export function cargarDeDisco(carpeta = CARPETA_DATOS) {
  const leer = (ruta) => JSON.parse(fs.readFileSync(path.join(carpeta, ruta), "utf8"));
  const indice = leer("generos.json");
  const generos = {};
  const recetas = { comun: leer("recetas/comun.json") };
  indice.orden.forEach((id) => {
    generos[id] = leer("generos/" + id + ".json");
    recetas[id] = leer("recetas/" + id + ".json");
  });
  const indiceLecciones = leer("lecciones.json");
  const porId = {};
  (indiceLecciones.grupos || []).forEach((g) => (g.lecciones || []).forEach((id) => { porId[id] = leer("lecciones/" + id + ".json"); }));
  return { comun: leer("comun.json"), indice, generos, perfil: leer("perfil.json"), glosario: leer("glosario.json"), recetas, lecciones: { indice: indiceLecciones, porId } };
}
