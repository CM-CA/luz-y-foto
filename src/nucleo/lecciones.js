// Lo que la pantalla Aprender lee de los datos (config.lecciones = { indice, porId }).

// La lista agrupada, con lo que se ve de cada lección en su fila.
export function listaDeLecciones(config) {
  const { indice, porId } = config.lecciones;
  return indice.grupos.map((g) => ({
    id: g.id, titulo: g.titulo, subtitulo: g.subtitulo,
    lecciones: g.lecciones.map((id) => {
      const l = porId[id];
      return { id, titulo: l.titulo, resumen: l.resumen, minutos: l.minutos, para: l.para };
    })
  }));
}

// Una lección completa, o null si no existe. Solo cuentan las lecciones propias de `porId`: «constructor» o «__proto__» no son lecciones.
export function leccionPorId(config, id) {
  const { porId } = config.lecciones;
  return typeof id === "string" && Object.hasOwn(porId, id) ? porId[id] : null;
}

// «3 min» y «Para cámara», con los textos de lecciones.json
export const etiquetaMinutos = (config, n) => config.lecciones.indice.etiquetas.minutos.replace("{n}", n);
export const etiquetaPara = (config, para) => config.lecciones.indice.etiquetas.para[para];
