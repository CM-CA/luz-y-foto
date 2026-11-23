/*
 * Los términos del glosario dentro de un texto: [[id|texto]]. Los usan las recetas y las lecciones.
 */

const reTermino = /\[\[([a-z0-9-]+)\|[^\]]+\]\]/g;
const terminosEn = (t) => { const r = []; let m; reTermino.lastIndex = 0; while ((m = reTermino.exec(t))) r.push(m[1]); return r; };

// Los términos [[id|texto]] de un texto: bien escritos y todos en el glosario.
export function revisarTerminos(texto, donde, glosario, errores) {
  const abiertos = (texto.match(/\[\[/g) || []).length;
  if (abiertos !== terminosEn(texto).length) errores.push(donde + ": hay un término del glosario mal escrito (debe ser [[id|texto]])");
  terminosEn(texto).forEach((t) => { if (!glosario[t]) errores.push(donde + ": cita el término «" + t + "», que no está en glosario.json"); });
}

// Palabras de un texto de lección; un término [[id|texto]] cuenta como su texto
export const contarPalabras = (t) => t.replace(/\[\[[a-z0-9-]+\|([^\]]*)\]\]/g, "$1").split(/\s+/).filter(Boolean).length;
