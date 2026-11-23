/*
 * Validación de dibujos.json: los textos de cada dibujo de las lecciones (src/dibujos/) con las claves y el número de líneas que pide cada uno.
 */
import { DIBUJOS } from "../../dibujos/index.js";
import { esTexto, esObjeto } from "./base.js";

// Los textos de los dibujos de las lecciones (dibujos.json): cada dibujo pide unas claves (src/dibujos/), un texto o una lista de líneas
export function validarDibujos(config, errores) {
  const D = config.dibujos;
  if (!esObjeto(D)) { errores.push("dibujos.json: falta o no es un objeto"); return; }
  Object.keys(D).forEach((id) => { if (!DIBUJOS[id]) errores.push("dibujos.json: «" + id + "» no es un dibujo que exista (hay " + Object.keys(DIBUJOS).join(", ") + ")"); });
  Object.entries(DIBUJOS).forEach(([id, dibujo]) => {
    const t = D[id], a = "dibujos.json." + id;
    if (!esObjeto(t)) { errores.push(a + ": faltan los textos del dibujo"); return; }
    Object.keys(t).forEach((k) => { if (!(k in dibujo.claves)) errores.push(a + "." + k + ": este dibujo no usa esa clave (usa " + Object.keys(dibujo.claves).join(", ") + ")"); });
    Object.entries(dibujo.claves).forEach(([k, n]) => {
      const v = t[k];
      if (n === null) { if (!esTexto(v)) errores.push(a + "." + k + ": falta el texto"); return; }
      if (!Array.isArray(v) || v.length !== n) errores.push(a + "." + k + ": debe ser una lista de " + n + " textos");
      else v.forEach((x, i) => { if (!esTexto(x)) errores.push(a + "." + k + "[" + i + "]: falta el texto"); });
    });
  });
}
