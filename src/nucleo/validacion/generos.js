/*
 * Validación de comun.json, del índice de géneros (generos.json) y de cada género: los dos motores («puntos-ventana», para el atardecer y el
 * amanecer, y «mejor-hora-nocturna», para la luna) con sus factores, vetos, tramos y textos.
 */
import { esNumero, esTexto, esObjeto } from "./base.js";

export const MOTORES = ["puntos-ventana", "mejor-hora-nocturna"];
export const EVENTOS = ["puesta", "amanecer"];
export const CAMPOS = ["bajas", "medias", "altas", "total"];
export const NIVELES_LLUVIA = ["sin", "llovizna", "moderada", "fuerte"];
export const FASES = ["nueva", "creciente", "cuarto-creciente", "gibosa-creciente", "llena",
  "gibosa-menguante", "cuarto-menguante", "menguante"];
const CONDICIONES = ["desde", "menosDe", "hasta", "masDe"];

function validarTramos(lista, donde, errores, exigirPuntos, max) {
  if (!Array.isArray(lista) || !lista.length) { errores.push(donde + ": debe ser una lista con al menos un tramo"); return; }
  lista.forEach((t, i) => {
    const aqui = donde + "[" + i + "]";
    if (!esObjeto(t)) { errores.push(aqui + ": debe ser un objeto"); return; }
    CONDICIONES.forEach((c) => { if (c in t && !esNumero(t[c])) errores.push(aqui + "." + c + ": debe ser un número"); });
    if (exigirPuntos) {
      if (!esNumero(t.puntos)) errores.push(aqui + ".puntos: falta o no es un número");
      else if (t.puntos < 0 || (max !== undefined && t.puntos > max)) errores.push(aqui + ".puntos: debe estar entre 0 y " + max);
    } else if (!esTexto(t.texto)) {
      errores.push(aqui + ".texto: falta el texto");
    }
  });
  const ultimo = lista[lista.length - 1];
  if (esObjeto(ultimo) && CONDICIONES.some((c) => c in ultimo)) {
    errores.push(donde + ": el último tramo debe ser el «resto» (sin condiciones) para que siempre haya respuesta");
  }
}

function validarComun(c, errores) {
  if (!esObjeto(c)) { errores.push("comun.json: falta o no es un objeto"); return; }
  const l = c.lluvia || {};
  ["sinLluviaMm", "lloviznaMm", "fuerteMm", "tormentaCodigo"].forEach((k) => {
    if (!esNumero(l[k])) errores.push("comun.lluvia." + k + ": falta o no es un número");
  });
  if (esNumero(l.sinLluviaMm) && esNumero(l.lloviznaMm) && esNumero(l.fuerteMm) &&
      !(l.sinLluviaMm < l.lloviznaMm && l.lloviznaMm < l.fuerteMm)) {
    errores.push("comun.lluvia: los umbrales deben ir de menor a mayor (sin lluvia < llovizna < fuerte)");
  }
  if (!esNumero(c.nieblaKm)) errores.push("comun.nieblaKm: falta o no es un número");
  const n = c.niveles || {};
  if (!esNumero(n.verdeDesde) || !esNumero(n.ambarDesde)) errores.push("comun.niveles: faltan verdeDesde y ambarDesde");
  else if (!(n.ambarDesde < n.verdeDesde && n.verdeDesde <= 100 && n.ambarDesde >= 0)) {
    errores.push("comun.niveles: ambarDesde debe ser menor que verdeDesde, y ambos entre 0 y 100");
  }
  ["tormenta", "llovizna"].forEach((k) => { if (!esTexto((c.avisos || {})[k])) errores.push("comun.avisos." + k + ": falta el texto"); });
  ["tormenta", "sin", "llovizna", "moderada", "fuerte"].forEach((k) => {
    if (!esTexto((c.frasesLluvia || {})[k])) errores.push("comun.frasesLluvia." + k + ": falta el texto");
  });
}

function validarComunesGenero(g, d, errores) {
  if (!esTexto(g.nombre)) errores.push(d + ".nombre: falta el nombre");
  if (!MOTORES.includes(g.motor)) errores.push(d + ".motor: «" + g.motor + "» no existe (usa " + MOTORES.join(" o ") + ")");
  if (!esTexto(g.avisoNiebla)) errores.push(d + ".avisoNiebla: falta el texto");
  const e = g.etiquetasDia || {};
  ["hoy", "manana", "otro"].forEach((k) => { if (!esTexto(e[k])) errores.push(d + ".etiquetasDia." + k + ": falta el texto"); });
}

function validarPuntosVentana(g, d, errores) {
  if (!EVENTOS.includes(g.evento)) errores.push(d + ".evento: «" + g.evento + "» no existe (usa " + EVENTOS.join(" o ") + ")");
  if (!esTexto(g.eventoNombre)) errores.push(d + ".eventoNombre: falta el texto");
  const v = g.ventana || {};
  if (!esNumero(v.antesMin) || !esNumero(v.despuesMin) || v.antesMin < 0 || v.despuesMin < 0) {
    errores.push(d + ".ventana: faltan antesMin y despuesMin (minutos, no negativos)");
  }
  ["textoEvento", "textoBrujula"].forEach((k) => { if (!esTexto(g[k])) errores.push(d + "." + k + ": falta el texto"); });
  ["verde", "ambar", "rojo"].forEach((k) => {
    if (!esTexto((g.niveles || {})[k])) errores.push(d + ".niveles." + k + ": falta el texto");
  });
  ["verde", "ambar", "rojo", "tormenta"].forEach((k) => {
    if (!esTexto((g.resumenes || {})[k])) errores.push(d + ".resumenes." + k + ": falta el texto");
  });

  if (!Array.isArray(g.factores) || !g.factores.length) { errores.push(d + ".factores: debe ser una lista con al menos un factor"); return; }
  const ids = new Set();
  let suma = 0;
  g.factores.forEach((f, i) => {
    const a = d + ".factores[" + i + "]";
    if (!esTexto(f.id)) errores.push(a + ".id: falta"); else if (ids.has(f.id)) errores.push(a + ".id: «" + f.id + "» repetido"); else ids.add(f.id);
    if (!esTexto(f.etiqueta)) errores.push(a + ".etiqueta: falta el texto");
    if (!esNumero(f.max) || f.max <= 0) errores.push(a + ".max: debe ser un número positivo"); else suma += f.max;
    if (f.tipo === "lluvia") {
      if (!esTexto(f.momento)) errores.push(a + ".momento: falta el texto");
      NIVELES_LLUVIA.forEach((n) => {
        const p = (f.puntos || {})[n];
        if (!esNumero(p) || p < 0 || p > f.max) errores.push(a + ".puntos." + n + ": debe ser un número entre 0 y " + f.max);
      });
    } else {
      if (!Array.isArray(f.campos) || !f.campos.length || f.campos.some((c) => !CAMPOS.includes(c))) {
        errores.push(a + ".campos: lista con valores de " + CAMPOS.join(", "));
      } else if (f.campos.length > 1 && f.combinar !== "maximo") {
        errores.push(a + ".combinar: con varios campos hay que indicar «maximo»");
      }
      if (!["media", "maximo"].includes(f.agregado)) errores.push(a + ".agregado: usa «media» o «maximo»");
      validarTramos(f.tramos, a + ".tramos", errores, true, f.max);
      validarTramos(f.frases, a + ".frases", errores, false);
    }
  });
  if (suma !== 100) errores.push(d + ".factores: los máximos deben sumar 100 (ahora suman " + suma + ")");

  (g.vetos || []).forEach((v, i) => {
    const a = d + ".vetos[" + i + "]";
    if (!ids.has(v.factor)) errores.push(a + ".factor: «" + v.factor + "» no es un factor de este género");
    if (!esTexto(v.motivo)) errores.push(a + ".motivo: falta el texto");
    if (v.factor === "lluvia" ? !NIVELES_LLUVIA.includes(v.nivel) : !esNumero(v.masDe)) {
      errores.push(a + ": el veto de lluvia lleva «nivel» y los demás «masDe»");
    }
  });
  if (!NIVELES_LLUVIA.includes(g.ambarSiLluviaDesde)) errores.push(d + ".ambarSiLluviaDesde: usa " + NIVELES_LLUVIA.join(", "));

  // Opcional: con niebla, un factor de nubes da sus puntos máximos y no veta (la niebla como ventaja)
  if (g.nieblaVentaja !== undefined) {
    const n = g.nieblaVentaja || {};
    if (!g.factores.some((f) => f.id === n.factor && f.tipo !== "lluvia")) errores.push(d + ".nieblaVentaja.factor: «" + n.factor + "» no es un factor de nubes de este género");
    if (!esTexto(n.frase)) errores.push(d + ".nieblaVentaja.frase: falta el texto");
  }
}

function validarNocturno(g, d, errores) {
  const l = g.luna || {};
  if (!esNumero(l.alturaMinGrados) || l.alturaMinGrados < 0 || l.alturaMinGrados > 90) errores.push(d + ".luna.alturaMinGrados: número entre 0 y 90");
  if (!esNumero(l.solMaxGrados) || l.solMaxGrados > 0) errores.push(d + ".luna.solMaxGrados: número menor o igual que 0");
  if (!esNumero(l.fraccionMinima) || l.fraccionMinima < 0 || l.fraccionMinima >= 1) errores.push(d + ".luna.fraccionMinima: número entre 0 y 1");
  const n = g.nubes || {};
  if (!CAMPOS.includes(n.campo)) errores.push(d + ".nubes.campo: usa " + CAMPOS.join(", "));
  if (!esNumero(n.verdeMenosDe) || !esNumero(n.ambarHasta) || !(n.verdeMenosDe <= n.ambarHasta)) {
    errores.push(d + ".nubes: verdeMenosDe debe ser un número menor o igual que ambarHasta");
  }
  const ll = g.lluvia || {};
  if (!esTexto(ll.momento)) errores.push(d + ".lluvia.momento: falta el texto");
  if (!NIVELES_LLUVIA.includes(ll.vetoDesde)) errores.push(d + ".lluvia.vetoDesde: usa " + NIVELES_LLUVIA.join(", "));
  if (!NIVELES_LLUVIA.includes(ll.ambarSiLluviaDesde)) errores.push(d + ".lluvia.ambarSiLluviaDesde: usa " + NIVELES_LLUVIA.join(", "));
  ["verde", "ambar", "rojo", "ninguno", "yaPaso"].forEach((k) => { if (!esTexto((g.niveles || {})[k])) errores.push(d + ".niveles." + k + ": falta el texto"); });
  ["verde", "ambar", "rojo"].forEach((k) => { if (!esTexto((g.resumenes || {})[k])) errores.push(d + ".resumenes." + k + ": falta el texto"); });
  ["lunaNueva", "sinLunaAlta", "yaPaso", "lluviaFuerte"].forEach((k) => { if (!esTexto((g.motivos || {})[k])) errores.push(d + ".motivos." + k + ": falta el texto"); });
  validarTramos(g.frasesNubes, d + ".frasesNubes", errores, false);
  FASES.forEach((f) => {
    const x = (g.fases || {})[f];
    if (!x || !esTexto(x.nombre) || !esTexto(x.consejo)) errores.push(d + ".fases." + f + ": faltan el nombre y el consejo");
  });
  if (!(g.etiquetasDia || {}).ahora) errores.push(d + ".etiquetasDia.ahora: falta el texto");
  // La brújula del panel: la frase, las tres formas de decir la altura y las cuatro de decir a qué momento apunta
  const b = g.brujula || {};
  ["texto", "altura", "alturaUnPuno", "alturaBaja"].forEach((k) => { if (!esTexto(b[k])) errores.push(d + ".brujula." + k + ": falta el texto"); });
  ["ahora", "mejor", "anochecer", "sale"].forEach((k) => { if (!esTexto((b.momentos || {})[k])) errores.push(d + ".brujula.momentos." + k + ": falta el texto"); });
}

// Valida comun.json, el índice generos.json y cada género. Devuelve false si el índice no tiene una lista de géneros: sin ella no hay por dónde seguir.
export function validarGeneros(config, errores) {
  validarComun(config.comun, errores);

  const idx = config.indice || {};
  if (!Array.isArray(idx.orden) || !idx.orden.length) {
    errores.push("generos.json: «orden» debe ser una lista con al menos un género");
    return false;
  }
  idx.orden.forEach((id) => { if (!esObjeto((config.generos || {})[id])) errores.push("generos.json: el género «" + id + "» no tiene archivo en data/generos/"); });
  if (!idx.orden.includes(idx.porDefecto)) errores.push("generos.json: «porDefecto» debe ser uno de los géneros de «orden»");
  if (!esNumero(idx.nocheDespuesPuestaMin) || idx.nocheDespuesPuestaMin < 0) errores.push("generos.json: «nocheDespuesPuestaMin» debe ser un número de minutos (desde cuándo se considera de noche)");
  if (!idx.orden.includes(idx.porDefectoDeNoche)) errores.push("generos.json: «porDefectoDeNoche» debe ser uno de los géneros de «orden»");
  if (!idx.orden.includes(idx.porDefectoDeAmanecer)) errores.push("generos.json: «porDefectoDeAmanecer» debe ser uno de los géneros de «orden»");
  ["amanecerAntesMin", "amanecerDespuesMin"].forEach((k) => {
    if (!esNumero(idx[k]) || idx[k] < 0) errores.push("generos.json: «" + k + "» debe ser un número de minutos (0 o más) respecto a la salida del sol");
  });

  idx.orden.forEach((id) => {
    const g = (config.generos || {})[id];
    if (!esObjeto(g)) return;
    const d = "generos/" + id;
    if (g.id !== id) errores.push(d + ".id: debe ser «" + id + "» (como el nombre del archivo)");
    validarComunesGenero(g, d, errores);
    if (g.motor === "puntos-ventana") validarPuntosVentana(g, d, errores);
    if (g.motor === "mejor-hora-nocturna") validarNocturno(g, d, errores);
  });
  return true;
}
