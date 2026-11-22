/*
 * Qué idioma muestra la app: español o inglés. Son funciones puras (el navegador y el almacén se pasan de fuera).
 *
 * Con la elección «auto» (la de siempre) se recorre la lista de idiomas del teléfono, en su orden, y decide el primero que la app
 * tiene: español (y, como quien los usa lee español, gallego, catalán y euskera) o inglés. Si hay idiomas pero ninguno es de esos,
 * inglés; si la lista está vacía, español. Una elección expresa («es» o «en», la del selector) manda sobre el teléfono.
 */
export const IDIOMAS = ["es", "en"];
export const ESPANOL_DE_HECHO = ["gl", "ca", "eu"];
export const CLAVE_IDIOMA = "luz-y-foto:idioma";
const ELECCIONES = ["auto", ...IDIOMAS];

// «es-ES», «ES_es» o «es» → «es»; lo que no es un texto → ""
const base = (codigo) => (typeof codigo === "string" ? codigo.trim().toLowerCase().split(/[-_]/)[0] : "");
const lista = (v) => (Array.isArray(v) ? v : []);

/**
 * @param {string[]} idiomasDelTelefono  navigator.languages
 * @param {"auto" | "es" | "en"} eleccion  lo guardado; cualquier otra cosa vale «auto»
 * @returns {"es" | "en"}
 */
export function elegirIdioma(idiomasDelTelefono, eleccion) {
  if (IDIOMAS.includes(eleccion)) return eleccion;
  const codigos = lista(idiomasDelTelefono).map(base).filter(Boolean);
  for (const c of codigos) {
    if (c === "es" || ESPANOL_DE_HECHO.includes(c)) return "es";
    if (c === "en") return "en";
  }
  return codigos.length ? "en" : "es";
}

/**
 * La variante para dar formato a horas, fechas y números: «es-ES» para el español; para el inglés, la primera variante inglesa
 * del teléfono («en-US»: 3:45 PM; «en-AU»…) o, si no hay, «en-GB» (24 horas y el día antes del mes).
 */
export function localeDeFormato(idioma, idiomasDelTelefono) {
  if (idioma !== "en") return "es-ES";
  for (const c of lista(idiomasDelTelefono)) {
    const m = typeof c === "string" && /^en[-_]([A-Za-z]{2})$/.exec(c.trim());
    if (m) return "en-" + m[1].toUpperCase();
  }
  return "en-GB";
}

function almacenPorDefecto() {
  try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; }
}

// La elección guardada («auto», «es» o «en»). Sin almacén, con uno que falla o con un valor raro: «auto».
export function leerEleccion(almacen) {
  try {
    const a = almacen || almacenPorDefecto();
    const v = a ? a.getItem(CLAVE_IDIOMA) : null;
    return ELECCIONES.includes(v) ? v : "auto";
  } catch (e) { return "auto"; }
}

// Devuelve false si no es una opción o no se pudo guardar (sin almacenamiento)
export function guardarEleccion(valor, almacen) {
  if (!ELECCIONES.includes(valor)) return false;
  try {
    const a = almacen || almacenPorDefecto();
    if (!a) return false;
    a.setItem(CLAVE_IDIOMA, valor);
    return true;
  } catch (e) { return false; }
}
