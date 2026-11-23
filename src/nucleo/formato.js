/*
 * Formato de números, horas y textos para la pantalla. Las horas son las del dispositivo y se escriben a la manera del idioma
 * (`locale`: «es-ES», o la variante inglesa del teléfono).
 */
import { locale, t } from "../idioma/index.js";

const hm = (ms) => ms == null ? "—" : new Date(ms).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
const pct = (v) => t("formato.pct", { n: Math.round(v) });
// Guion que no se parte al final de línea («nor-noreste» no queda cortado)
const unida = (p) => (p || "").replace(/-/g, "‑");
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// Rellena los {huecos} de un texto con sus valores; un hueco sin valor sale como «—»
const plantilla = (texto, valores) => texto.replace(/\{(\w+)\}/g, (_, k) => (k in valores ? valores[k] : "—"));

/*
 * Igual que plantilla(), pero devuelve trozos {texto, negrita} en vez de un texto,
 * para pintarlos sin HTML. `negrita` lista las claves que van en negrita.
 */
function trozosDePlantilla(texto, valores, negrita = []) {
  const trozos = [];
  const re = /\{(\w+)\}/g;
  let desde = 0, m;
  while ((m = re.exec(texto))) {
    if (m.index > desde) trozos.push({ texto: texto.slice(desde, m.index) });
    trozos.push({ texto: String(m[1] in valores ? valores[m[1]] : "—"), negrita: negrita.includes(m[1]) });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) trozos.push({ texto: texto.slice(desde) });
  return trozos;
}

export { hm, pct, unida, mayus, plantilla, trozosDePlantilla };
