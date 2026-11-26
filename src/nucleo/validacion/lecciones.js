/*
 * Validación de las lecciones de Aprender: el índice (lecciones.json: grupos y etiquetas) y cada lección (bloques, términos, dibujos citados
 * y el tope de palabras).
 */
import { DIBUJOS } from "../../dibujos/index.js";
import { esNumero, esTexto, esObjeto } from "./base.js";
import { revisarTerminos, contarPalabras } from "./terminos.js";

const PARA_LECCION = ["camara", "movil", "todos"];
const BLOQUES_LECCION = ["subtitulo", "parrafo", "lista", "idea", "dibujo", "simulador", "pruebalo"];

// Los simuladores que sabe dibujar la app (src/componentes/Simulador.svelte) y los textos que cada uno necesita
export const SIMULADORES = ["exposicion"];
const LUCES_SIMULADOR = ["sol", "nublado", "interior"];
const RESULTADOS_SIMULADOR = ["muyOscura", "oscura", "bien", "clara", "muyClara"];
const CON_PASOS_SIMULADOR = ["muyOscura", "muyClara"]; // dicen cuántos pasos de luz: llevan el hueco {n}
const TRES_NIVELES_SIMULADOR = ["fondo", "movimiento", "grano"];

// Una lección se lee en 2 o 3 minutos: si pasa de aquí, se parte en dos
export const PALABRAS_MAX_LECCION = 450;

function validarLeccion(l, id, glosario, errores) {
  const d = "lecciones/" + id;
  if (l.id !== id) errores.push(d + ".id: debe ser «" + id + "» (como el nombre del archivo)");
  ["titulo", "resumen"].forEach((k) => { if (!esTexto(l[k])) errores.push(d + "." + k + ": falta el texto"); });
  if (!esNumero(l.minutos) || l.minutos < 1 || l.minutos > 10) errores.push(d + ".minutos: debe ser un número de 1 a 10");
  if (!PARA_LECCION.includes(l.para)) errores.push(d + ".para: debe ser uno de " + PARA_LECCION.join(", "));
  if (!Array.isArray(l.bloques) || !l.bloques.length) { errores.push(d + ".bloques: debe haber al menos uno"); return; }
  let palabras = 0;
  const texto = (t, donde) => {
    if (!esTexto(t)) { errores.push(donde + ": falta el texto"); return; }
    revisarTerminos(t, donde, glosario, errores);
    palabras += contarPalabras(t);
  };
  l.bloques.forEach((b, i) => {
    const a = d + ".bloques[" + i + "]";
    if (!esObjeto(b) || !BLOQUES_LECCION.includes(b.tipo)) {
      errores.push(a + ".tipo: el tipo «" + (esObjeto(b) ? b.tipo : b) + "» no existe (valen " + BLOQUES_LECCION.join(", ") + ")");
      return;
    }
    if (b.tipo === "lista") {
      if (!Array.isArray(b.items) || !b.items.length) errores.push(a + ".items: debe haber al menos un elemento");
      else b.items.forEach((t, j) => texto(t, a + ".items[" + j + "]"));
    } else if (b.tipo === "dibujo") {
      if (!/^[a-z0-9-]+$/.test(b.id || "")) errores.push(a + ".id: falta (solo letras minúsculas, números y guiones)");
      else if (!DIBUJOS[b.id]) errores.push(a + ".id: el dibujo «" + b.id + "» no existe (hay " + Object.keys(DIBUJOS).join(", ") + ")");
      ["alt", "pie"].forEach((k) => { if (!esTexto(b[k])) errores.push(a + "." + k + ": falta el texto"); });
    } else if (b.tipo === "simulador") {
      validarSimulador(b, a, errores);
    } else {
      texto(b.texto, a + ".texto");
    }
  });
  if (palabras > PALABRAS_MAX_LECCION) errores.push(d + ": tiene " + palabras + " palabras y el máximo es " + PALABRAS_MAX_LECCION + " (si pasa, se parte en dos lecciones)");
}

// Un bloque «simulador»: el id del simulador, la alternativa y el pie, y todos los textos de sus controles y de su lectura
function validarSimulador(b, a, errores) {
  if (!SIMULADORES.includes(b.id)) errores.push(a + ".id: el simulador «" + b.id + "» no existe (hay " + SIMULADORES.join(", ") + ")");
  ["alt", "pie"].forEach((k) => { if (!esTexto(b[k])) errores.push(a + "." + k + ": falta el texto"); });
  const t = esObjeto(b.textos) ? b.textos : {};
  if (!esObjeto(b.textos)) errores.push(a + ".textos: faltan los textos del simulador");
  const t_ = a + ".textos";
  ["luz", "apertura", "tiempo", "iso", "reiniciar"].forEach((k) => { if (!esTexto(t[k])) errores.push(t_ + "." + k + ": falta el texto"); });
  LUCES_SIMULADOR.forEach((k) => { if (!esTexto((t.luces || {})[k])) errores.push(t_ + ".luces." + k + ": falta el texto"); });
  RESULTADOS_SIMULADOR.forEach((k) => {
    const r = (t.resultado || {})[k];
    if (!esTexto(r)) errores.push(t_ + ".resultado." + k + ": falta el texto");
    else if (CON_PASOS_SIMULADOR.includes(k) && !r.includes("{n}")) errores.push(t_ + ".resultado." + k + ": debe llevar el hueco {n}");
  });
  TRES_NIVELES_SIMULADOR.forEach((k) => {
    const v = t[k];
    if (!Array.isArray(v) || v.length !== 3) { errores.push(t_ + "." + k + ": deben ser 3 textos (de menos a más)"); return; }
    v.forEach((x, j) => { if (!esTexto(x)) errores.push(t_ + "." + k + "[" + j + "]: falta el texto"); });
  });
}

export function validarLecciones(config, errores) {
  const L = config.lecciones;
  if (!esObjeto(L) || !esObjeto(L.indice)) { errores.push("lecciones.json: falta o no es un objeto"); return; }
  const ix = L.indice;
  ["titulo", "subtitulo"].forEach((k) => { if (!esTexto(ix[k])) errores.push("lecciones.json." + k + ": falta el texto"); });
  const et = ix.etiquetas || {};
  ["ideaClave", "pruebalo", "volver", "noExiste", "aprendePorQue"].forEach((k) => { if (!esTexto(et[k])) errores.push("lecciones.json.etiquetas." + k + ": falta el texto"); });
  if (!esTexto(et.minutos) || !et.minutos.includes("{n}")) errores.push("lecciones.json.etiquetas.minutos: falta el texto (debe llevar el hueco {n})");
  PARA_LECCION.forEach((k) => { if (!esTexto((et.para || {})[k])) errores.push("lecciones.json.etiquetas.para." + k + ": falta el texto"); });
  if (!Array.isArray(ix.grupos) || !ix.grupos.length) { errores.push("lecciones.json.grupos: debe haber al menos un grupo"); return; }
  const vistas = new Set();
  ix.grupos.forEach((g, i) => {
    const a = "lecciones.json.grupos[" + i + "]";
    if (!esObjeto(g)) { errores.push(a + ": debe ser un objeto"); return; }
    ["id", "titulo", "subtitulo"].forEach((k) => { if (!esTexto(g[k])) errores.push(a + "." + k + ": falta el texto"); });
    if (!Array.isArray(g.lecciones) || !g.lecciones.length) { errores.push(a + ".lecciones: debe haber al menos una"); return; }
    g.lecciones.forEach((id) => {
      if (vistas.has(id)) errores.push(a + ".lecciones: «" + id + "» está repetida");
      vistas.add(id);
      const l = (L.porId || {})[id];
      if (!esObjeto(l)) { errores.push(a + ".lecciones: la lección «" + id + "» no tiene archivo en data/lecciones/"); return; }
      validarLeccion(l, id, config.glosario || {}, errores);
    });
  });
}
