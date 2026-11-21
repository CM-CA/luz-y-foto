// Pruebas de la carga y validación de data/. Se ejecutan con: npm test (o npx vitest run).
// Mismas comprobaciones que test/datos.test.cjs, pero sobre la lógica nueva (src/).
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco as cargarDatos } from "../../scripts/datos-de-disco.mjs";
import * as Datos from "../../src/nucleo/datos.js";
import { datosIncluidos } from "../../src/datos-incluidos.js";

const prueba = it;
const copia = (x) => JSON.parse(JSON.stringify(x));
const errores = (mut) => { const c = copia(cargarDatos()); mut(c); return Datos.validar(c); };
const contiene = (lista, trozo) => lista.some((e) => e.includes(trozo));

prueba("los datos reales de data/ son válidos", () => {
  assert.deepEqual(Datos.validar(cargarDatos()), []);
});

prueba("los dos géneros actuales existen y usan motores conocidos", () => {
  const c = cargarDatos();
  assert.deepEqual(c.indice.orden, ["atardecer", "luna"]);
  c.indice.orden.forEach((id) => assert.ok(Datos.MOTORES.includes(c.generos[id].motor)));
});

prueba("validar: detecta máximos que no suman 100", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.factores[0].max = 45; }), "deben sumar 100"));
});

prueba("validar: exige el tramo final «resto» en tramos y frases", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.factores[1].tramos.pop(); }), "último tramo debe ser el «resto»"));
  assert.ok(contiene(errores((c) => { c.generos.luna.frasesNubes.pop(); }), "último tramo debe ser el «resto»"));
});

prueba("validar: puntos fuera de rango y números mal escritos", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.factores[0].tramos[0].puntos = 99; }), "entre 0 y 40"));
  assert.ok(contiene(errores((c) => { c.generos.atardecer.factores[0].tramos[0].menosDe = "veinte"; }), "debe ser un número"));
});

prueba("validar: umbrales de lluvia desordenados", () => {
  assert.ok(contiene(errores((c) => { c.comun.lluvia.lloviznaMm = 9; }), "de menor a mayor"));
});

prueba("validar: umbrales del semáforo incoherentes", () => {
  assert.ok(contiene(errores((c) => { c.comun.niveles.ambarDesde = 80; }), "ambarDesde debe ser menor"));
});

prueba("validar: motor y evento desconocidos", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.motor = "puntos"; }), "«puntos» no existe"));
  assert.ok(contiene(errores((c) => { c.generos.atardecer.evento = "mediodia"; }), "«mediodia» no existe"));
});

prueba("validar: textos que faltan o están vacíos", () => {
  assert.ok(contiene(errores((c) => { c.generos.luna.fases.llena.consejo = ""; }), "fases.llena"));
  assert.ok(contiene(errores((c) => { delete c.generos.atardecer.resumenes.tormenta; }), "resumenes.tormenta"));
  assert.ok(contiene(errores((c) => { c.comun.avisos.tormenta = "  "; }), "comun.avisos.tormenta"));
});

// La brújula de la luna: la frase, las tres formas de decir la altura y las cuatro de decir a qué momento apunta
const CLAVES_BRUJULA_LUNA = ["texto", "altura", "alturaUnPuno", "alturaBaja", "momentos.ahora", "momentos.mejor", "momentos.anochecer", "momentos.sale"];

prueba("la luna trae los ocho textos de su brújula, con los huecos que usa el panel", () => {
  const b = cargarDatos().generos.luna.brujula;
  assert.ok(b, "falta luna.brujula");
  CLAVES_BRUJULA_LUNA.forEach((clave) => { const t = clave.split(".").reduce((x, k) => (x || {})[k], b); assert.ok(typeof t === "string" && t.trim(), "falta " + clave); });
  assert.match(b.texto, /\{direccion\}.*\{grados\}/);
  assert.match(b.altura, /\{altura\}.*\{punos\}/);
  assert.match(b.alturaUnPuno, /\{altura\}/);
  ["ahora", "mejor", "anochecer", "sale"].forEach((k) => assert.match(b.momentos[k], /\{hora\}/, "momentos." + k));
});

prueba("validar: cada texto de la brújula de la luna es obligatorio", () => {
  CLAVES_BRUJULA_LUNA.forEach((clave) => {
    const e = errores((c) => { const [a, b] = clave.split("."); if (b) c.generos.luna.brujula[a][b] = ""; else c.generos.luna.brujula[a] = ""; });
    assert.ok(contiene(e, "luna.brujula." + clave + ": falta el texto"), clave + " → " + e.join(" | "));
  });
  const sin = errores((c) => { delete c.generos.luna.brujula; });
  CLAVES_BRUJULA_LUNA.forEach((clave) => assert.ok(contiene(sin, "luna.brujula." + clave + ": falta el texto"), "sin brujula, falta aviso de " + clave));
});

prueba("validar: género listado sin archivo, o por defecto desconocido", () => {
  assert.ok(contiene(errores((c) => { c.indice.orden.push("surf"); }), "«surf» no tiene archivo"));
  assert.ok(contiene(errores((c) => { c.indice.porDefecto = "amanecer"; }), "«porDefecto»"));
  assert.ok(contiene(errores((c) => { c.generos.luna.id = "otra"; }), "debe ser «luna»"));
});

prueba("validar: vetos que apuntan a un factor inexistente", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.vetos[1].factor = "viento"; }), "«viento» no es un factor"));
});

prueba("validar: nieblaVentaja con un factor que no existe o sin frase", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.nieblaVentaja = { factor: "viento", frase: "x" }; }), "nieblaVentaja"));
  assert.ok(contiene(errores((c) => { c.generos.atardecer.nieblaVentaja = { factor: "bajas" }; }), "nieblaVentaja"));
  assert.ok(contiene(errores((c) => { c.generos.atardecer.nieblaVentaja = { factor: "lluvia", frase: "x" }; }), "nieblaVentaja"));
  assert.deepEqual(errores((c) => { c.generos.atardecer.nieblaVentaja = { factor: "bajas", frase: "x" }; }), []);
});

prueba("validar: un campo de nubes que no existe", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.factores[0].campos = ["muy-altas"]; }), "campos"));
});

prueba("validar: los mensajes dicen dónde está el error", () => {
  const e = errores((c) => { c.generos.luna.nubes.verdeMenosDe = 90; });
  assert.ok(e.some((m) => m.startsWith("generos/luna.nubes")), e.join(" | "));
});

// En la versión actual estas dos pruebas comprobaban Datos.cargar() (fetch al abrir la página).
// Ahora los datos van incluidos en la compilación: se comprueba que son los mismos que los del disco.
prueba("datos incluidos: lo que lleva la compilación es lo mismo que hay en data/", () => {
  assert.deepEqual(datosIncluidos(), cargarDatos());
});

prueba("datos incluidos: cumplen la validación", () => {
  assert.deepEqual(Datos.validar(datosIncluidos()), []);
});

prueba("validar: un género sin receta, o sin variante de móvil", () => {
  assert.ok(contiene(errores((c) => { delete c.recetas.luna; }), "«luna» no tiene receta"));
  assert.ok(contiene(errores((c) => { c.recetas.atardecer.variantes = c.recetas.atardecer.variantes.slice(1); }), "falta una variante para móvil"));
});

prueba("validar: la última variante debe ser la general de cámara", () => {
  assert.ok(contiene(errores((c) => { c.recetas.luna.variantes.reverse(); }), "la última debe ser la general de cámara"));
});

prueba("validar: cada paso necesita texto para los tres niveles", () => {
  assert.ok(contiene(errores((c) => { delete c.recetas.atardecer.variantes[0].pasos[0].defiendo; }), "variantes[0].pasos[0].defiendo"));
});

prueba("validar: el «resumen» de una opción del perfil es opcional, pero si está debe ser un texto", () => {
  assert.deepEqual(errores((c) => { delete c.perfil.preguntas[4].opciones[0].resumen; }), []);
  assert.ok(contiene(errores((c) => { c.perfil.preguntas[4].opciones[0].resumen = ""; }), "opciones[0].resumen: si está, debe ser un texto"));
  assert.ok(contiene(errores((c) => { c.perfil.preguntas[4].opciones[1].resumen = 7; }), "opciones[1].resumen"));
});

prueba("validar: un término de glosario que no existe", () => {
  const e = errores((c) => { c.recetas.atardecer.variantes[0].pasos[0].empiezo = "Mira [[bokeh|el bokeh]]"; });
  assert.ok(contiene(e, "«bokeh», que no está en glosario.json"), e.join(" | "));
});

prueba("validar: un término del glosario mal escrito", () => {
  const e = errores((c) => { c.recetas.luna.variantes[0].pasos[0].empiezo = "Mira [[iso|el ISO)"; });
  assert.ok(contiene(e, "mal escrito"), e.join(" | "));
});

prueba("validar: aviso que no existe y marca sin nombres de modo", () => {
  assert.ok(contiene(errores((c) => { c.recetas.luna.avisos.push("rayos"); }), "«rayos» no existe"));
  assert.ok(contiene(errores((c) => { delete c.perfil.marcas.canon.Tv; }), "perfil.marcas.canon.Tv"));
});

prueba("validar: valor por defecto del perfil fuera de las opciones", () => {
  assert.ok(contiene(errores((c) => { c.perfil.porDefecto.nivel = "experto"; }), "perfil.porDefecto.nivel"));
});

