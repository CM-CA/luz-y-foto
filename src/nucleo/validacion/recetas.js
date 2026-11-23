/*
 * Validación de las recetas (recetas/comun.json y una por género) y del glosario que citan: pasos por nivel, variantes según el perfil,
 * avisos y enlaces a lecciones.
 */
import { esTexto, esObjeto } from "./base.js";
import { NIVELES_USUARIO } from "./perfil.js";
import { revisarTerminos } from "./terminos.js";

export function validarRecetas(config, errores) {
  const r = config.recetas || {};
  const c = r.comun;
  if (!esObjeto(c)) { errores.push("recetas/comun.json: falta o no es un objeto"); return; }
  const avisos = c.avisos || {};
  const gl = config.glosario || {};
  Object.keys(gl).forEach((k) => { if (!esTexto(gl[k].termino) || !esTexto(gl[k].texto)) errores.push("glosario." + k + ": faltan «termino» y «texto»"); });
  const revisar = (texto, donde) => revisarTerminos(texto, donde, gl, errores);
  // Las lecciones a las que puede enlazar una receta: las del índice (su estructura la comprueba validarLecciones)
  const grupos = ((config.lecciones || {}).indice || {}).grupos;
  const leccionesDelIndice = Array.isArray(grupos) ? grupos.flatMap((g) => (esObjeto(g) && Array.isArray(g.lecciones) ? g.lecciones : [])) : [];
  Object.keys(avisos).forEach((k) => { if (!esTexto(avisos[k])) errores.push("recetas/comun.avisos." + k + ": falta el texto"); else revisar(avisos[k], "recetas/comun.avisos." + k); });
  (c.soloCamara || []).forEach((k) => { if (!esTexto(avisos[k])) errores.push("recetas/comun.soloCamara: «" + k + "» no es un aviso de recetas/comun.json"); });
  ["pregunta", "si", "no"].forEach((k) => { if (!esTexto((c.tripodeHoy || {})[k])) errores.push("recetas/comun.tripodeHoy." + k + ": falta el texto"); });
  ["pasos", "nota", "avisos", "segunSemaforo"].forEach((k) => { if (!esTexto((c.titulos || {})[k])) errores.push("recetas/comun.titulos." + k + ": falta el texto"); });

  ((config.indice || {}).orden || []).forEach((id) => {
    const g = r[id];
    const d = "recetas/" + id;
    if (!esObjeto(g)) { errores.push(d + ".json: el género «" + id + "» no tiene receta en data/recetas/"); return; }
    (g.avisos || []).forEach((a) => { if (!esTexto(avisos[a])) errores.push(d + ".avisos: «" + a + "» no existe en recetas/comun.json"); });
    ["verde", "ambar", "rojo"].forEach((k) => { if (!esTexto((g.segunSemaforo || {})[k])) errores.push(d + ".segunSemaforo." + k + ": falta el texto"); });
    if (!Array.isArray(g.variantes) || !g.variantes.length) { errores.push(d + ".variantes: debe haber al menos una"); return; }
    const ultima = g.variantes[g.variantes.length - 1];
    g.variantes.forEach((v, i) => {
      const a = d + ".variantes[" + i + "]";
      if (!esTexto(v.id)) errores.push(a + ".id: falta");
      if (!esTexto(v.titulo)) errores.push(a + ".titulo: falta el texto");
      if (!esObjeto(v.si)) errores.push(a + ".si: falta (condiciones sobre el perfil)");
      if (!Array.isArray(v.pasos) || !v.pasos.length) { errores.push(a + ".pasos: debe haber al menos uno"); return; }
      v.pasos.forEach((p, j) => {
        if (!esTexto(p.titulo)) errores.push(a + ".pasos[" + j + "].titulo: falta el texto");
        NIVELES_USUARIO.forEach((n) => {
          if (!esTexto(p[n])) errores.push(a + ".pasos[" + j + "]." + n + ": falta el texto para este nivel");
          else revisar(p[n], a + ".pasos[" + j + "]." + n);
        });
      });
      if (v.nota !== undefined) { if (!esTexto(v.nota)) errores.push(a + ".nota: debe ser un texto"); else revisar(v.nota, a + ".nota"); }
      if (v.leccion !== undefined && !(esTexto(v.leccion) && leccionesDelIndice.includes(v.leccion))) {
        errores.push(a + ".leccion: «" + v.leccion + "» no es una lección de lecciones.json (la receta enlaza a una lección con su id)");
      }
    });
    // Las variantes se prueban en orden: la última debe valer para una cámara o un móvil cualquiera
    if (esObjeto(ultima) && esObjeto(ultima.si) && ultima.si.equipo !== "camara") {
      errores.push(d + ".variantes: la última debe ser la general de cámara (si: {equipo: camara}) para que siempre haya receta");
    }
    if (!g.variantes.some((v) => esObjeto(v.si) && v.si.equipo === "movil" && Object.keys(v.si).length === 1)) {
      errores.push(d + ".variantes: falta una variante para móvil (si: {equipo: movil})");
    }
  });
}
