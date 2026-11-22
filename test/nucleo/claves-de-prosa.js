// Qué valores de data/<idioma>/ son prosa (se traducen) y cuáles no (ids, umbrales, condiciones: idénticos en todos los idiomas). Lo usan la prueba de paridad
// (test/nucleo/paridad.test.js) y quien prepare una traducción.
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
export const PROSA = CLAVES_DE_PROSA.map((s) => new RegExp("^" + s + "$"));
export const esProsa = (ruta) => PROSA.some((r) => r.test(ruta));

// Todas las hojas de un objeto: [ruta, valor]. Las posiciones de las listas se escriben `[]`.
export function hojas(v, ruta = "", salida = []) {
  if (Array.isArray(v)) v.forEach((x) => hojas(x, ruta + "[]", salida));
  else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => hojas(x, ruta ? ruta + "." + k : k, salida));
  else salida.push([ruta, v]);
  return salida;
}

