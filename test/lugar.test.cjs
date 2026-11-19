// Pruebas del módulo de lugar. Se ejecutan con: node test/lugar.test.cjs
const assert = require("node:assert/strict");
const L = require("../js/lugar.js");

let fallos = 0;
const prueba = (nombre, fn) => {
  try { fn(); console.log("ok   ", nombre); }
  catch (e) { fallos++; console.log("FALLA", nombre, "->", e.message); }
};

prueba("nombre de ciudad desde Nominatim: ciudad y región", () => {
  const r = { address: { city: "Vigo", county: "Pontevedra", state: "Galicia", country: "España" } };
  assert.equal(L.nombreDesdeRespuesta(r), "Vigo, Galicia");
});

prueba("nombre desde Nominatim: pueblos, aldeas y municipios", () => {
  assert.equal(L.nombreDesdeRespuesta({ address: { town: "Baiona", state: "Galicia" } }), "Baiona, Galicia");
  assert.equal(L.nombreDesdeRespuesta({ address: { village: "Cangas", state: "Galicia" } }), "Cangas, Galicia");
  assert.equal(L.nombreDesdeRespuesta({ address: { municipality: "Nigrán" } }), "Nigrán");
});

prueba("nombre desde Nominatim: sin duplicar cuando ciudad y región coinciden", () => {
  assert.equal(L.nombreDesdeRespuesta({ address: { city: "Madrid", state: "Madrid" } }), "Madrid");
});

prueba("nombre desde Nominatim: sin población o con error devuelve null", () => {
  assert.equal(L.nombreDesdeRespuesta({ address: { country: "España" } }), null);
  assert.equal(L.nombreDesdeRespuesta({ error: "Unable to geocode" }), null);
  assert.equal(L.nombreDesdeRespuesta(null), null);
});

prueba("búsqueda: resultados con nombre, detalle, texto y coordenadas", () => {
  const json = { results: [
    { name: "Vigo", latitude: 42.23282, longitude: -8.72264, country: "España", admin1: "Galicia", admin2: "Pontevedra" },
    { name: "Vigo", latitude: 42.23282, longitude: -8.72264, country: "España", admin1: "Galicia", admin2: "Pontevedra" },
    { name: "Vigo", latitude: 38.0, longitude: -121.0, country: "Estados Unidos", admin1: "California" }
  ] };
  const r = L.resultadosDesdeRespuesta(json);
  assert.equal(r.length, 2, "debería quitar el duplicado");
  assert.equal(r[0].nombre, "Vigo");
  assert.equal(r[0].detalle, "Pontevedra, Galicia, España");
  assert.equal(r[0].texto, "Vigo, Galicia, España");
  assert.equal(r[0].lat, 42.23282);
  assert.equal(r[1].texto, "Vigo, California, Estados Unidos");
});

prueba("búsqueda: sin resultados o respuesta vacía da lista vacía", () => {
  assert.deepEqual(L.resultadosDesdeRespuesta({}), []);
  assert.deepEqual(L.resultadosDesdeRespuesta({ generationtime_ms: 1 }), []);
  assert.deepEqual(L.resultadosDesdeRespuesta(null), []);
});

prueba("búsqueda: descarta resultados sin coordenadas", () => {
  assert.equal(L.resultadosDesdeRespuesta({ results: [{ name: "X" }] }).length, 0);
});

prueba("las direcciones de los servicios están bien formadas y redondean las coordenadas", () => {
  const u = new URL(L.urlNombre(42.2328211, -8.7226444));
  assert.equal(u.host, "nominatim.openstreetmap.org");
  assert.equal(u.searchParams.get("lat"), "42.233");
  assert.equal(u.searchParams.get("lon"), "-8.723");
  assert.equal(u.searchParams.get("accept-language"), "es");
  const b = new URL(L.urlBusqueda("A Coruña"));
  assert.equal(b.host, "geocoding-api.open-meteo.com");
  assert.equal(b.searchParams.get("name"), "A Coruña");
  assert.equal(b.searchParams.get("language"), "es");
});

prueba("distancia: Vigo-Pontevedra unos 25 km, mismo punto 0", () => {
  const vigo = { lat: 42.2328, lon: -8.7226 }, pont = { lat: 42.4338, lon: -8.6476 };
  const d = L.distanciaKm(vigo, pont);
  assert.ok(d > 20 && d < 26, "distancia " + d.toFixed(1));
  assert.equal(L.distanciaKm(vigo, vigo), 0);
});

prueba("sin almacenamiento (Node) cargar devuelve null y guardar no falla", () => {
  assert.equal(L.cargar(), null);
  L.guardar({ lat: 1, lon: 2 });
});

prueba("coordenadas de respaldo legibles", () => {
  assert.equal(L.coordenadas(42.2406, -8.7207), "42.24, -8.72");
});

console.log(fallos ? "\n" + fallos + " prueba(s) con fallo" : "\nTodo correcto");
process.exit(fallos ? 1 : 0);
