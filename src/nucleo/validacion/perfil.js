/*
 * Validación de perfil.json: la bienvenida, las preguntas con sus opciones, los valores por defecto y los nombres de modo de cada marca.
 */
import { esTexto, esObjeto } from "./base.js";

export const NIVELES_USUARIO = ["empiezo", "defiendo", "controlo"];
export const MARCAS_MODO = ["Av", "Tv"];

export function validarPerfil(p, errores) {
  if (!esObjeto(p)) { errores.push("perfil.json: falta o no es un objeto"); return; }
  ["titulo", "texto", "empezar", "saltar"].forEach((k) => { if (!esTexto((p.bienvenida || {})[k])) errores.push("perfil.bienvenida." + k + ": falta el texto"); });
  if (!Array.isArray(p.preguntas) || !p.preguntas.length) { errores.push("perfil.preguntas: debe ser una lista"); return; }
  const ids = new Set();
  p.preguntas.forEach((q, i) => {
    const a = "perfil.preguntas[" + i + "]";
    if (!esTexto(q.id)) errores.push(a + ".id: falta"); else ids.add(q.id);
    if (!esTexto(q.titulo)) errores.push(a + ".titulo: falta el texto");
    if (!Array.isArray(q.opciones) || q.opciones.length < 2) errores.push(a + ".opciones: debe haber al menos dos");
    else q.opciones.forEach((o, j) => {
      if (!esTexto(o.id) || !esTexto(o.texto)) errores.push(a + ".opciones[" + j + "]: faltan id y texto");
      if (o && typeof o === "object" && "resumen" in o && !esTexto(o.resumen)) errores.push(a + ".opciones[" + j + "].resumen: si está, debe ser un texto");
    });
  });
  const d = p.porDefecto || {};
  p.preguntas.forEach((q) => {
    if (!(q.id in d)) { errores.push("perfil.porDefecto." + q.id + ": falta el valor por defecto"); return; }
    const validos = (q.opciones || []).map((o) => o.id);
    const val = q.multiple ? d[q.id] : [d[q.id]];
    if (!Array.isArray(val) || val.some((x) => !validos.includes(x))) errores.push("perfil.porDefecto." + q.id + ": debe ser una opción de la pregunta");
  });
  NIVELES_USUARIO.forEach((n) => { if (!((ids.has("nivel") && p.preguntas.find((q) => q.id === "nivel").opciones || []).some((o) => o.id === n))) errores.push("perfil: la pregunta «nivel» debe tener la opción «" + n + "»"); });
  const marcas = p.marcas || {};
  const ids_marca = ((p.preguntas.find((q) => q.id === "marca") || {}).opciones || []).map((o) => o.id);
  ids_marca.forEach((m) => MARCAS_MODO.forEach((k) => { if (!esTexto((marcas[m] || {})[k])) errores.push("perfil.marcas." + m + "." + k + ": falta el nombre del modo"); }));
  if (!marcas.desconocida) errores.push("perfil.marcas.desconocida: falta (se usa cuando no se sabe la marca)");
}
