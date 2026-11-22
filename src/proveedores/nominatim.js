/*
 * Proveedor del nombre de la ciudad: OpenStreetMap (Nominatim), con las coordenadas redondeadas (~100 m).
 * Si se cambia de proveedor, solo hay que tocar este módulo.
 * Condiciones de uso: como máximo 1 petición por segundo y con identificación; ver docs/migracion-svelte.md.
 */
import { pedirJson } from "./http.js";
import { idioma } from "../idioma/index.js";

const redondear = (n, d) => Number(n.toFixed(d));

function urlNombre(lat, lon) {
  const p = new URLSearchParams({
    format: "jsonv2", zoom: "10", addressdetails: "1", "accept-language": idioma,
    lat: String(redondear(lat, 3)), lon: String(redondear(lon, 3))
  });
  return "https://nominatim.openstreetmap.org/reverse?" + p;
}

// Respuesta de Nominatim -> "Vigo, Galicia" (o null si no hay población)
function nombreDesdeRespuesta(json) {
  const a = json && json.address;
  if (!a) return null;
  const ciudad = a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || a.county;
  if (!ciudad) return null;
  const region = a.state || a.region;
  return region && region !== ciudad ? ciudad + ", " + region : ciudad;
}

// Devuelve el nombre o null si no se ha podido averiguar (la app sigue funcionando)
async function nombreDeLugar(lat, lon) {
  try { return nombreDesdeRespuesta(await pedirJson(urlNombre(lat, lon))); }
  catch (e) { return null; }
}

export { urlNombre, nombreDesdeRespuesta, nombreDeLugar };
