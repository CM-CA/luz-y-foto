/*
 * Lee la carpeta de datos de un idioma (data/es/, data/en/…) del disco con la misma forma que `datosIncluidos(idioma)` (src/datos-incluidos.js):
 * {comun, indice, generos, perfil, glosario, dibujos, recetas, lecciones}, con lecciones = {indice, porId}.
 * La usan `npm run validar`, la compilación y las pruebas.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));

// La raíz de los datos (data/) y la carpeta de cada idioma dentro de ella. El español es el idioma de referencia.
export const RAIZ_DATOS = path.join(aqui, "..", "data");
export const carpetaDeIdioma = (id, raiz = RAIZ_DATOS) => path.join(raiz, id);
export const CARPETA_DATOS = carpetaDeIdioma("es");

// Los idiomas que tienen carpeta en `raiz`, en orden alfabético
export const idiomasDeDatos = (raiz = RAIZ_DATOS) => fs.readdirSync(raiz, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
export const IDIOMAS_DE_DATOS = idiomasDeDatos();

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
  return { comun: leer("comun.json"), indice, generos, perfil: leer("perfil.json"), glosario: leer("glosario.json"), dibujos: leer("dibujos.json"), recetas, lecciones: { indice: indiceLecciones, porId } };
}
