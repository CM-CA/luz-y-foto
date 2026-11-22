/*
 * Proveedor de la búsqueda de ciudades por nombre: geocodificación de Open-Meteo (sin clave).
 * Si se cambia de proveedor, solo hay que tocar este módulo.
 */
import { pedirJson } from "./http.js";
import { idioma } from "../idioma/index.js";

function urlBusqueda(texto) {
  const p = new URLSearchParams({ name: texto, count: "6", language: idioma, format: "json" });
  return "https://geocoding-api.open-meteo.com/v1/search?" + p;
}

// Respuesta de la búsqueda de Open-Meteo -> lista de { nombre, detalle, texto, lat, lon }
function resultadosDesdeRespuesta(json) {
  const vistos = new Set();
  return ((json && json.results) || []).map((r) => {
    const detalle = [r.admin2, r.admin1, r.country].filter((x, i, a) => x && a.indexOf(x) === i && x !== r.name).join(", ");
    return {
      nombre: r.name, detalle,
      texto: detalle ? r.name + ", " + [r.admin1, r.country].filter((x) => x && x !== r.name).join(", ") : r.name,
      lat: r.latitude, lon: r.longitude
    };
  }).filter((x) => {
    if (typeof x.lat !== "number" || typeof x.lon !== "number" || !x.nombre) return false;
    const k = x.nombre + "|" + x.detalle;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

// `senal` (opcional): una AbortSignal para cancelar la búsqueda si ya no hace falta
async function buscarCiudad(texto, senal) {
  return resultadosDesdeRespuesta(await pedirJson(urlBusqueda(texto), undefined, senal));
}

export { urlBusqueda, resultadosDesdeRespuesta, buscarCiudad };
