/*
 * Recetas: elige la variante que corresponde al equipo del usuario y devuelve los pasos con el
 * nivel de explicación que le toca. El contenido está en data/recetas/ y data/glosario.json.
 *
 * Marcas en los textos:
 *   {Av}, {Tv}      nombre del modo según la marca (Canon: Av/Tv; Nikon y Sony: A/S)
 *   [[id|texto]]    término del glosario, tocable en la pantalla
 *
 * Cada variante puede llevar `leccion`: el id de la lección de data/lecciones/ que explica por qué esos ajustes.
 * Cada variante lleva `si`: condiciones sobre el perfil. Se prueban en orden y gana la primera que
 * se cumple. Un valor de texto debe coincidir; si el campo del perfil es una lista (objetivos),
 * basta con que la contenga.
 */
const TERMINO = /\[\[([a-z0-9-]+)\|([^\]]*)\]\]/g;

function cumple(si, perfil) {
  return Object.keys(si).every((k) => {
    const v = perfil[k];
    return Array.isArray(v) ? v.includes(si[k]) : v === si[k];
  });
}

// Trocea un texto en {texto} y {id, etiqueta}, para que la pantalla no tenga que interpretar HTML
function partes(texto) {
  const salida = [];
  let desde = 0, m;
  TERMINO.lastIndex = 0;
  while ((m = TERMINO.exec(texto))) {
    if (m.index > desde) salida.push({ texto: texto.slice(desde, m.index) });
    salida.push({ id: m[1], etiqueta: m[2] });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) salida.push({ texto: texto.slice(desde) });
  return salida;
}

function terminosDe(texto) {
  const ids = [];
  let m;
  TERMINO.lastIndex = 0;
  while ((m = TERMINO.exec(texto))) ids.push(m[1]);
  return ids;
}

// config: datos cargados; perfil: ya «efectivo» (con el trípode de hoy resuelto);
// semaforo: "verde" | "ambar" | "rojo" | otro valor (sin consejo). Devuelve null si no hay receta.
function construir(config, generoId, perfil, semaforo) {
  const receta = config.recetas[generoId];
  if (!receta) return null;
  const variante = receta.variantes.find((v) => cumple(v.si, perfil));
  if (!variante) return null;

  const modos = config.perfil.marcas[perfil.marca] || config.perfil.marcas.desconocida;
  const poner = (t) => t.replace(/\{(Av|Tv)\}/g, (_, k) => modos[k]);
  const comun = config.recetas.comun;
  const soloCamara = comun.soloCamara || [];

  return {
    id: variante.id,
    titulo: variante.titulo,
    pasos: variante.pasos.map((p) => ({ titulo: p.titulo, texto: poner(p[perfil.nivel] || p.empiezo) })),
    nota: variante.nota ? poner(variante.nota) : null,
    leccion: variante.leccion || null, // la lección a la que enlaza la receta («Aprende por qué estos ajustes»)
    avisos: (receta.avisos || [])
      .filter((id) => perfil.equipo === "camara" || !soloCamara.includes(id))
      .map((id) => poner(comun.avisos[id])),
    segunSemaforo: (receta.segunSemaforo && receta.segunSemaforo[semaforo]) ? poner(receta.segunSemaforo[semaforo]) : null
  };
}

export { cumple, partes, terminosDe, construir };
