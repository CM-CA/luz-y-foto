// Los archivos de data/ se incluyen en la compilación (no se piden al abrir la página).
// Devuelve {comun, indice, generos, perfil, glosario, recetas, lecciones}; lecciones es {indice, porId}.
const archivos = import.meta.glob("../data/**/*.json", { eager: true, import: "default" });

function leer(ruta) {
  const clave = "../data/" + ruta;
  if (!(clave in archivos)) throw new Error("Falta el archivo data/" + ruta);
  return archivos[clave];
}

export function datosIncluidos() {
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
