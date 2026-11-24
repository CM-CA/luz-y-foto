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

// El almacenamiento (localStorage) es el mismo para todas las páginas de cm-ca.github.io (el blog, otras apps…), así que lo guardado
// no es de fiar: solo se acepta un lugar con coordenadas reales, y de él solo lat, lon, el nombre (texto corto) y un origen conocido.
const ORIGENES = ["gps", "busqueda"];
const NOMBRE_MAXIMO = 120;

function cargar(almacen) {
  try {
    const l = JSON.parse((almacen || globalThis.localStorage).getItem(CLAVE));
    if (!l || typeof l !== "object" || !Number.isFinite(l.lat) || !Number.isFinite(l.lon) || Math.abs(l.lat) > 90 || Math.abs(l.lon) > 180) return null;
    const lugar = { lat: l.lat, lon: l.lon };
    if (typeof l.nombre === "string") lugar.nombre = l.nombre.slice(0, NOMBRE_MAXIMO);
    if (ORIGENES.includes(l.origen)) lugar.origen = l.origen;
    return lugar;
  } catch (e) { return null; }
}

export { CLAVE, coordenadas, distanciaKm, guardar, cargar };
