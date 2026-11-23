/*
 * Lugar para Ollada: coordenadas, distancia y el último lugar usado.
 *
 * - El último lugar se guarda en el propio dispositivo (localStorage), con la misma clave que la versión actual.
 * - La ubicación del dispositivo y los nombres de ciudad vienen de src/proveedores/ (gps, Nominatim, geocodificación).
 */

const CLAVE = "luz-y-foto:lugar";

function coordenadas(lat, lon) {
  return lat.toFixed(2) + ", " + lon.toFixed(2);
}

// Distancia aproximada entre dos puntos en kilómetros
function distanciaKm(a, b) {
  const rad = Math.PI / 180, R = 6371;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// `almacen` es opcional (por defecto, el localStorage del navegador); sirve para las pruebas
function guardar(lugar, almacen) {
  try { (almacen || globalThis.localStorage).setItem(CLAVE, JSON.stringify(lugar)); } catch (e) { /* sin almacenamiento: no pasa nada */ }
}

function cargar(almacen) {
  try {
    const l = JSON.parse((almacen || globalThis.localStorage).getItem(CLAVE));
    return l && typeof l.lat === "number" && typeof l.lon === "number" ? l : null;
  } catch (e) { return null; }
}

export { CLAVE, coordenadas, distanciaKm, guardar, cargar };
