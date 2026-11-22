// Pruebas de la elección de idioma (español o inglés) y de su almacenamiento. Se ejecutan con: npm test (o npx vitest run).
import assert from "node:assert/strict";
import { it } from "vitest";
import * as I from "../../src/nucleo/idioma.js";

const prueba = it;

prueba("auto: el teléfono en español muestra español", () => {
  assert.equal(I.elegirIdioma(["es-ES"], "auto"), "es");
  assert.equal(I.elegirIdioma(["es"], "auto"), "es");
  assert.equal(I.elegirIdioma(["es-MX", "en-US"], "auto"), "es");
});

prueba("auto: el teléfono en inglés, o en cualquier otro idioma, muestra inglés", () => {
  assert.equal(I.elegirIdioma(["en-US"], "auto"), "en");
  assert.equal(I.elegirIdioma(["en"], "auto"), "en");
  assert.equal(I.elegirIdioma(["fr-FR"], "auto"), "en");
  assert.equal(I.elegirIdioma(["de-DE", "ja-JP"], "auto"), "en");
});

prueba("auto: con varios idiomas decide el primero que la app tiene", () => {
  assert.equal(I.elegirIdioma(["fr-FR", "es-ES"], "auto"), "es");
  assert.equal(I.elegirIdioma(["fr-FR", "en-GB", "es-ES"], "auto"), "en");
});

prueba("auto: gallego, catalán y euskera cuentan como español (quien los usa lee español)", () => {
  assert.equal(I.elegirIdioma(["gl-ES"], "auto"), "es");
  assert.equal(I.elegirIdioma(["ca"], "auto"), "es");
  assert.equal(I.elegirIdioma(["eu-ES", "en-US"], "auto"), "es");
  assert.deepEqual(I.ESPANOL_DE_HECHO, ["gl", "ca", "eu"]);
});

prueba("auto: sin lista de idiomas (o con valores raros) muestra español", () => {
  assert.equal(I.elegirIdioma([], "auto"), "es");
  assert.equal(I.elegirIdioma(undefined, "auto"), "es");
  assert.equal(I.elegirIdioma(null, "auto"), "es");
  assert.equal(I.elegirIdioma([42, null, ""], "auto"), "es"); // nada que se pueda leer: es como no tener lista
});

prueba("la mayúscula, el guion bajo o el sufijo no importan: «ES_es», «EN-us»", () => {
  assert.equal(I.elegirIdioma(["ES_es"], "auto"), "es");
  assert.equal(I.elegirIdioma(["EN-us"], "auto"), "en");
});

prueba("una elección expresa manda sobre el teléfono", () => {
  assert.equal(I.elegirIdioma(["es-ES"], "en"), "en");
  assert.equal(I.elegirIdioma(["en-GB"], "es"), "es");
  assert.equal(I.elegirIdioma(["fr-FR"], "es"), "es");
});

prueba("una elección que no es «auto», «es» o «en» se trata como «auto»", () => {
  assert.equal(I.elegirIdioma(["es-ES"], "fr"), "es");
  assert.equal(I.elegirIdioma(["en-US"], undefined), "en");
  assert.equal(I.elegirIdioma(["en-US"], 7), "en");
});

prueba("formato: el español siempre es-ES", () => {
  assert.equal(I.localeDeFormato("es", ["es-MX"]), "es-ES");
  assert.equal(I.localeDeFormato("es", []), "es-ES");
});

prueba("formato: el inglés usa la primera variante inglesa del teléfono, o en-GB (24 h)", () => {
  assert.equal(I.localeDeFormato("en", ["fr-FR", "en-AU"]), "en-AU");
  assert.equal(I.localeDeFormato("en", ["en-US"]), "en-US");
  assert.equal(I.localeDeFormato("en", ["fr-FR"]), "en-GB");
  assert.equal(I.localeDeFormato("en", ["en"]), "en-GB");
  assert.equal(I.localeDeFormato("en", undefined), "en-GB");
});

prueba("la elección guardada: se lee, se guarda y un valor raro vale «auto»", () => {
  const casos = {};
  const almacen = { getItem: (k) => (k in casos ? casos[k] : null), setItem: (k, v) => { casos[k] = v; } };
  assert.equal(I.leerEleccion(almacen), "auto");
  assert.equal(I.guardarEleccion("en", almacen), true);
  assert.equal(casos[I.CLAVE_IDIOMA], "en");
  assert.equal(I.leerEleccion(almacen), "en");
  assert.equal(I.guardarEleccion("fr", almacen), false, "no se guarda lo que no es una opción");
  casos[I.CLAVE_IDIOMA] = "fr"; assert.equal(I.leerEleccion(almacen), "auto");
  casos[I.CLAVE_IDIOMA] = "\"en\""; assert.equal(I.leerEleccion(almacen), "auto");
  casos[I.CLAVE_IDIOMA] = ""; assert.equal(I.leerEleccion(almacen), "auto");
});

prueba("sin almacenamiento o con uno que falla: «auto» y guardar devuelve false, sin lanzar", () => {
  const roto = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  assert.equal(I.leerEleccion(roto), "auto");
  assert.equal(I.guardarEleccion("es", roto), false);
  assert.equal(I.leerEleccion(null), "auto");
  assert.equal(I.guardarEleccion("es", null), false);
});
