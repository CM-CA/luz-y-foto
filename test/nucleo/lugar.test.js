// Pruebas del módulo de lugar. Se ejecutan con: npm test (o npx vitest run).
// Mismas comprobaciones que test/lugar.test.cjs, pero sobre la lógica nueva (src/).
import assert from "node:assert/strict";
import { it } from "vitest";
import * as NucleoLugar from "../../src/nucleo/lugar.js";
import * as Nominatim from "../../src/proveedores/nominatim.js";
import * as Geocodificacion from "../../src/proveedores/geocodificacion.js";
import * as Gps from "../../src/proveedores/gps.js";

// En la versión actual todo es un solo objeto «Lugar»; ahora está repartido: núcleo (coordenadas, distancia,
// último lugar), proveedores (Nominatim, geocodificación) y GPS.
const L = { ...NucleoLugar, ...Nominatim, ...Geocodificacion, ...Gps };

const prueba = it;

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


// El almacenamiento (localStorage) es el mismo para todas las páginas de cm-ca.github.io (el blog, otras apps…): lo guardado no es de fiar.
const almacenCon = (valor) => ({ getItem: () => JSON.stringify(valor) });

prueba("cargar devuelve solo lat, lon, nombre (texto) y un origen conocido: lo demás se descarta", () => {
  const bueno = { lat: 42.23, lon: -8.72, nombre: "Vigo, Galicia", origen: "busqueda" };
  assert.deepEqual(L.cargar(almacenCon({ ...bueno, extra: "<script>x</script>" })), bueno);
  assert.deepEqual(L.cargar(almacenCon({ lat: 1, lon: 2, origen: "gps" })), { lat: 1, lon: 2, origen: "gps" });
});

prueba("cargar descarta coordenadas fuera de rango, que no sean números o un lugar que no es un objeto", () => {
  const malos = [{ lat: 91, lon: 0 }, { lat: -91, lon: 0 }, { lat: 0, lon: 181 }, { lat: 0, lon: -181 }, { lat: "42", lon: -8 }, { lat: 42, lon: null },
    { lat: 42 }, { lat: 1e999, lon: 0 }, null, "texto", 7, []];
  malos.forEach((m) => assert.equal(L.cargar(almacenCon(m)), null, "debía descartarse: " + JSON.stringify(m)));
});

prueba("cargar no deja pasar un nombre que no es texto, uno larguísimo ni un origen desconocido", () => {
  assert.equal(L.cargar(almacenCon({ lat: 1, lon: 2, nombre: { a: 1 } })).nombre, undefined);
  assert.equal(L.cargar(almacenCon({ lat: 1, lon: 2, nombre: ["x"] })).nombre, undefined);
  assert.equal(L.cargar(almacenCon({ lat: 1, lon: 2, nombre: "a".repeat(5000) })).nombre.length, 120);
  assert.equal(L.cargar(almacenCon({ lat: 1, lon: 2, origen: "<img src=x onerror=alert(1)>" })).origen, undefined);
  assert.equal(L.cargar(almacenCon({ lat: 1, lon: 2, origen: { a: 1 } })).origen, undefined);
});
