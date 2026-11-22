// Paridad de los datos entre idiomas: data/en/ (y las que vengan) tiene exactamente la misma forma que data/es/ (las mismas claves,
// las mismas listas del mismo largo) y todos los valores iguales, salvo los de PROSA, que son lo único que se traduce. Así un umbral, un
// id, una condición («solo para móvil») o una lista de pasos no pueden separarse entre idiomas sin que lo note una prueba.
// Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { it } from "vitest";
import { cargarDeDisco, carpetaDeIdioma, idiomasDeDatos, RAIZ_DATOS } from "../../scripts/datos-de-disco.mjs";

/*
 * Las rutas de los valores que son texto para leer (y por tanto se traducen). Una ruta se escribe con puntos, y `[]` en el lugar de
 * cualquier posición de una lista; `[^.]+` es un id de género, de fase, de lección o de término del glosario. Todo lo demás (ids,
 * umbrales, puntos, minutos, condiciones, nombres de modos de cada marca) debe ser idéntico en todos los idiomas.
 */
export const CLAVES_DE_PROSA = [
  String.raw`comun\.avisos\.[^.]+`, String.raw`comun\.frasesLluvia\.[^.]+`,
  String.raw`generos\.[^.]+\.(nombre|eventoNombre|textoEvento|textoBrujula|avisoNiebla)`,
  String.raw`generos\.[^.]+\.(niveles|resumenes|etiquetasDia|motivos)\.[^.]+`,
  String.raw`generos\.[^.]+\.brujula\.(texto|altura|alturaBaja|alturaUnPuno)`, String.raw`generos\.[^.]+\.brujula\.momentos\.[^.]+`,
  String.raw`generos\.[^.]+\.fases\.[^.]+\.(nombre|consejo)`,
  String.raw`generos\.[^.]+\.factores\[\]\.(etiqueta|momento)`, String.raw`generos\.[^.]+\.factores\[\]\.frases\[\]\.texto`,
  String.raw`generos\.[^.]+\.frasesNubes\[\]\.texto`, String.raw`generos\.[^.]+\.vetos\[\]\.motivo`,
  String.raw`generos\.[^.]+\.nieblaVentaja\.frase`, String.raw`generos\.[^.]+\.lluvia\.momento`,
  String.raw`perfil\.bienvenida\.[^.]+`, String.raw`perfil\.marcas\.desconocida\.(Av|Tv)`, String.raw`perfil\.preguntas\[\]\.(titulo|ayuda)`, String.raw`perfil\.preguntas\[\]\.opciones\[\]\.(texto|resumen)`,
  String.raw`glosario\.[^.]+\.(termino|texto)`, String.raw`dibujos\..+`,
  String.raw`recetas\.comun\.titulos\.[^.]+`, String.raw`recetas\.comun\.tripodeHoy\.(pregunta|si|no)`, String.raw`recetas\.comun\.avisos\.[^.]+`,
  String.raw`recetas\.[^.]+\.segunSemaforo\.[^.]+`, String.raw`recetas\.[^.]+\.variantes\[\]\.(titulo|nota)`, String.raw`recetas\.[^.]+\.variantes\[\]\.pasos\[\]\.(titulo|empiezo|defiendo|controlo)`,
  String.raw`lecciones\.indice\.(titulo|subtitulo)`, String.raw`lecciones\.indice\.etiquetas\..+`, String.raw`lecciones\.indice\.grupos\[\]\.(titulo|subtitulo)`,
  String.raw`lecciones\.porId\.[^.]+\.(titulo|resumen)`, String.raw`lecciones\.porId\.[^.]+\.bloques\[\]\.(texto|alt|pie|items\[\])`
];
const PROSA = CLAVES_DE_PROSA.map((s) => new RegExp("^" + s + "$"));
export const esProsa = (ruta) => PROSA.some((r) => r.test(ruta));

// Todas las hojas de un objeto: [ruta, valor]. Las posiciones de las listas se escriben `[]`.
function hojas(v, ruta = "", salida = []) {
  if (Array.isArray(v)) v.forEach((x) => hojas(x, ruta + "[]", salida));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => hojas(x, ruta ? ruta + "." + k : k, salida));
  else salida.push([ruta, v]);
  return salida;
}

// Lo que separa `otro` de `es`: forma distinta (claves, largo de las listas, tipos) o un valor que no es de prosa y no coincide
export function compararIdiomas(es, otro, donde = "") {
  const dif = [];
  (function ir(a, b, ruta) {
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) return dif.push(ruta + ": una es lista y la otra no");
      if (a.length !== b.length) return dif.push(ruta + ": la lista tiene " + b.length + " elementos y la de es " + a.length);
      return a.forEach((x, i) => ir(x, b[i], ruta + "[]"));
    }
    if (a && typeof a === "object") {
      if (!b || typeof b !== "object") return dif.push(ruta + ": falta el objeto");
      const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
      if (ka.join("|") !== kb.join("|")) return dif.push(ruta + ": claves distintas (es: " + ka.join(",") + "; otro: " + kb.join(",") + ")");
      return ka.forEach((k) => ir(a[k], b[k], ruta ? ruta + "." + k : k));
    }
    if (typeof a !== typeof b) return dif.push(ruta + ": tipo distinto (" + typeof a + " y " + typeof b + ")");
    if (esProsa(ruta)) { if (typeof a === "string" && (b.trim() === "")) dif.push(ruta + ": texto vacío"); return; }
    if (a !== b) dif.push(ruta + ": «" + b + "» no coincide con «" + a + "» de es (no es prosa: debe ser idéntico)");
  })(es, otro, "");
  return dif.map((d) => (donde ? donde + " " : "") + d);
}

const ES = cargarDeDisco(carpetaDeIdioma("es"));

it("la lista de prosa no tiene rutas muertas y no deja frases sin clasificar", () => {
  const rutas = hojas(ES).map(([r]) => r);
  const muertas = PROSA.filter((r) => !rutas.some((x) => r.test(x))).map(String);
  assert.deepEqual(muertas, [], "rutas de prosa que no existen en data/es");
  // Una cadena que no es de prosa es un id, un nombre de campo o un código: no lleva espacios ni signos de frase
  const frases = hojas(ES).filter(([r, v]) => typeof v === "string" && !esProsa(r) && /[\s¿¡?!.,;:«»]/.test(v)).map(([r, v]) => r + " = «" + v + "»");
  assert.deepEqual(frases, [], "textos que parecen frases y no están en CLAVES_DE_PROSA");
});

it("cada idioma de data/ tiene la misma forma que es y solo difiere en la prosa", () => {
  for (const id of idiomasDeDatos().filter((x) => x !== "es")) {
    assert.deepEqual(compararIdiomas(ES, cargarDeDisco(carpetaDeIdioma(id)), "data/" + id + ":"), []);
  }
});

it("la comparación detecta un umbral, un id, una lista o una clave distintos, y deja pasar la prosa", () => {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "paridad-"));
  try {
    fs.cpSync(carpetaDeIdioma("es", RAIZ_DATOS), path.join(raiz, "es"), { recursive: true });
    fs.cpSync(carpetaDeIdioma("es", RAIZ_DATOS), path.join(raiz, "otro"), { recursive: true });
    const cargarOtro = () => cargarDeDisco(carpetaDeIdioma("otro", raiz));
    const dif = (mut) => { const o = cargarOtro(); mut(o); return compararIdiomas(ES, o); };

    assert.deepEqual(compararIdiomas(ES, cargarOtro()), [], "una copia exacta no difiere en nada");
    // La prosa sí puede cambiar
    assert.deepEqual(dif((o) => { o.comun.avisos.tormenta = "Thunderstorm."; o.generos.luna.nombre = "Night"; o.recetas.atardecer.variantes[0].pasos[0].titulo = "Step"; o.lecciones.porId["la-rueda-de-modos"].bloques[1].texto = "x"; o.lecciones.porId["la-rueda-de-modos"].bloques[0].pie = "x"; }), []);
    // Un umbral, un id, un punto, una condición, un enlace a una lección, el nombre de un modo
    assert.match(dif((o) => { o.comun.niveles.verdeDesde = 71; }).join("\n"), /comun\.niveles\.verdeDesde/);
    assert.match(dif((o) => { o.generos.atardecer.factores[0].max = 45; }).join("\n"), /factores\[\]\.max/);
    assert.match(dif((o) => { o.indice.orden = ["atardecer", "amanecer", "luna"]; }).join("\n"), /indice\.orden/);
    assert.match(dif((o) => { o.recetas.atardecer.variantes[0].leccion = "otra"; }).join("\n"), /variantes\[\]\.leccion/);
    assert.match(dif((o) => { o.recetas.atardecer.variantes[0].solo = { equipo: "camara" }; }).join("\n"), /claves distintas/);
    assert.match(dif((o) => { o.perfil.marcas.canon.Av = "Aperture"; }).join("\n"), /perfil\.marcas\.canon\.Av/);
    assert.match(dif((o) => { o.lecciones.porId["la-rueda-de-modos"].minutos = 9; }).join("\n"), /minutos/);
    // Una lista más corta, una clave de menos, un tipo cambiado, un texto vacío
    assert.match(dif((o) => { o.recetas.atardecer.variantes.pop(); }).join("\n"), /la lista tiene/);
    assert.match(dif((o) => { delete o.glosario.apertura; }).join("\n"), /claves distintas/);
    assert.match(dif((o) => { o.comun.lluvia.fuerteMm = "2.5"; }).join("\n"), /tipo distinto/);
    assert.match(dif((o) => { o.comun.avisos.tormenta = "  "; }).join("\n"), /texto vacío/);
  } finally { fs.rmSync(raiz, { recursive: true, force: true }); }
});
