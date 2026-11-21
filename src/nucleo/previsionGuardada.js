/*
 * Última previsión recibida, guardada en el dispositivo para poder enseñarla cuando no hay conexión.
 *
 * Solo se guarda UNA (la del último lugar consultado) y solo vale para ese mismo lugar y mientras no sea muy
 * vieja: la previsión que se pide cubre desde ayer hasta dentro de 4 días, así que pasados dos días ya no
 * cubriría lo que hay que enseñar y es mejor decir que no se pudo cargar que enseñar días ya pasados.
 * El almacén es opcional (por defecto, el localStorage del navegador); sirve para las pruebas.
 */
import { distanciaKm } from "./lugar.js";

const CLAVE = "luz-y-foto:prevision";
const EDAD_MAXIMA_MS = 48 * 3600000;
const RADIO_KM = 2; // el GPS no da dos veces exactamente el mismo punto

const esNumero = (n) => typeof n === "number" && Number.isFinite(n);

// ¿Tiene la forma de una respuesta de previsión que la app sabe leer?
const parecePrevision = (d) => !!d && typeof d === "object" && !!d.hourly && Array.isArray(d.hourly.time) && !!d.daily && Array.isArray(d.daily.sunrise) && Array.isArray(d.daily.sunset);

// ¿Sirve este registro {lat, lon, datos, guardadaEn} para enseñarlo en `lat`, `lon` a la hora `ahora`?
function sirve(registro, lat, lon, ahora) {
  if (!registro || typeof registro !== "object") return false;
  if (!esNumero(registro.lat) || !esNumero(registro.lon) || !esNumero(registro.guardadaEn) || !parecePrevision(registro.datos)) return false;
  const edad = ahora - registro.guardadaEn;
  if (edad < 0 || edad > EDAD_MAXIMA_MS) return false; // del futuro (reloj cambiado) o demasiado vieja
  return distanciaKm(registro, { lat, lon }) <= RADIO_KM;
}

function guardar(registro, almacen) {
  try { (almacen || globalThis.localStorage).setItem(CLAVE, JSON.stringify(registro)); return true; } catch (e) { return false; /* sin espacio o sin almacenamiento */ }
}

// Devuelve el registro guardado si sirve para este lugar y este momento; si no, null
function cargar(lat, lon, ahora, almacen) {
  try {
    const registro = JSON.parse((almacen || globalThis.localStorage).getItem(CLAVE));
    return sirve(registro, lat, lon, ahora) ? registro : null;
  } catch (e) { return null; }
}

const DOS = (n) => String(n).padStart(2, "0");
const medianoche = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

// Cuándo se guardó y hace cuánto, en palabras: { cuando: "hoy a las 14:32", hace: "hace 3 h" }
function cuando(guardadaEn, ahora) {
  const d = new Date(guardadaEn);
  const hora = DOS(d.getHours()) + ":" + DOS(d.getMinutes());
  const dias = Math.round((medianoche(ahora) - medianoche(guardadaEn)) / 86400000);
  const dia = dias <= 0 ? "hoy" : dias === 1 ? "ayer" : "el " + d.getDate() + " de " + d.toLocaleDateString("es-ES", { month: "long" });
  const ms = Math.max(0, ahora - guardadaEn), min = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), dd = Math.floor(ms / 86400000);
  const hace = min < 1 ? "hace un momento" : min < 60 ? "hace " + min + " min" : h < 24 ? "hace " + h + " h" : "hace " + dd + (dd === 1 ? " día" : " días");
  return { cuando: dia + " a las " + hora, hace };
}

export { CLAVE, EDAD_MAXIMA_MS, RADIO_KM, sirve, guardar, cargar, cuando };
