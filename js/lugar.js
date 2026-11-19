/*
 * Lugar para luz-y-foto: ubicación del dispositivo, nombre de la ciudad y búsqueda por nombre.
 *
 * - Ubicación: la que da el navegador (GPS o red). Se queda en el dispositivo.
 * - Nombre de la ciudad: OpenStreetMap (Nominatim) con las coordenadas redondeadas (~100 m).
 * - Búsqueda por nombre: geocodificación de Open-Meteo (sin clave).
 * - El último lugar se guarda en el propio dispositivo (localStorage).
 * Las funciones puras (parsers, distancia) se prueban en Node.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Lugar = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CLAVE = "luz-y-foto:lugar";

  /* ---------- Funciones puras ---------- */

  const redondear = (n, d) => Number(n.toFixed(d));

  function coordenadas(lat, lon) {
    return lat.toFixed(2) + ", " + lon.toFixed(2);
  }

  function urlNombre(lat, lon) {
    const p = new URLSearchParams({
      format: "jsonv2", zoom: "10", addressdetails: "1", "accept-language": "es",
      lat: String(redondear(lat, 3)), lon: String(redondear(lon, 3))
    });
    return "https://nominatim.openstreetmap.org/reverse?" + p;
  }

  function urlBusqueda(texto) {
    const p = new URLSearchParams({ name: texto, count: "6", language: "es", format: "json" });
    return "https://geocoding-api.open-meteo.com/v1/search?" + p;
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

  // Distancia aproximada entre dos puntos en kilómetros
  function distanciaKm(a, b) {
    const rad = Math.PI / 180, R = 6371;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* ---------- Con el navegador ---------- */

  function posicionGps(opciones) {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return reject({ codigo: "no-disponible" });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        (e) => reject({ codigo: e.code === 1 ? "denegado" : e.code === 3 ? "tiempo" : "no-disponible" }),
        Object.assign({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }, opciones)
      );
    });
  }

  async function pedirJson(url, ms) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ms || 8000);
    try {
      const r = await fetch(url, { signal: control.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally {
      clearTimeout(reloj);
    }
  }

  // Devuelve el nombre o null si no se ha podido averiguar (la app sigue funcionando)
  async function nombreDeLugar(lat, lon) {
    try { return nombreDesdeRespuesta(await pedirJson(urlNombre(lat, lon))); }
    catch (e) { return null; }
  }

  async function buscarCiudad(texto) {
    return resultadosDesdeRespuesta(await pedirJson(urlBusqueda(texto)));
  }

  function guardar(lugar) {
    try { localStorage.setItem(CLAVE, JSON.stringify(lugar)); } catch (e) { /* sin almacenamiento: no pasa nada */ }
  }

  function cargar() {
    try {
      const l = JSON.parse(localStorage.getItem(CLAVE));
      return l && typeof l.lat === "number" && typeof l.lon === "number" ? l : null;
    } catch (e) { return null; }
  }

  return {
    coordenadas, urlNombre, urlBusqueda, nombreDesdeRespuesta, resultadosDesdeRespuesta, distanciaKm,
    posicionGps, nombreDeLugar, buscarCiudad, guardar, cargar
  };
});
