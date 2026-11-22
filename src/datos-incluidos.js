// Los archivos de data/ se incluyen en la compilación (no se piden al abrir la página): una carpeta por idioma, data/es/ y data/en/.
// `datosIncluidos(idioma)` devuelve {comun, indice, generos, perfil, glosario, dibujos, recetas, lecciones} del idioma; lecciones es {indice, porId}.
const archivos = import.meta.glob("../data/*/**/*.json", { eager: true, import: "default" });

// Los idiomas que hay en data/ ("es", "en"…), en orden alfabético
export const IDIOMAS_DE_DATOS = [...new Set(Object.keys(archivos).map((k) => k.split("/")[2]))].sort();

// Si no hay datos del idioma pedido se usan los del español (el de referencia): la app se ve entera, aunque en el idioma de siempre
export function datosIncluidos(idioma = "es") {
  const carpeta = IDIOMAS_DE_DATOS.includes(idioma) ? idioma : "es";
  const leer = (ruta) => {
    const clave = "../data/" + carpeta + "/" + ruta;
    if (!(clave in archivos)) throw new Error("Falta el archivo data/" + carpeta + "/" + ruta);
    return archivos[clave];
  };
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
