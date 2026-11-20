// Ayuda para las pruebas: lee data/ del disco con la misma forma que Datos.cargar() en el navegador.
const fs = require("node:fs");
const path = require("node:path");

function cargarDatos(carpeta) {
  const base = carpeta || path.join(__dirname, "..", "data");
  const leer = (ruta) => JSON.parse(fs.readFileSync(path.join(base, ruta), "utf8"));
  const indice = leer("generos.json");
  const generos = {};
  indice.orden.forEach((id) => { generos[id] = leer("generos/" + id + ".json"); });
  const recetas = { comun: leer("recetas/comun.json") };
  indice.orden.forEach((id) => { recetas[id] = leer("recetas/" + id + ".json"); });
  return { comun: leer("comun.json"), indice, generos, perfil: leer("perfil.json"), glosario: leer("glosario.json"), recetas };
}

module.exports = { cargarDatos };
