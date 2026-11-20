// Pruebas de la carga y validación de data/. Se ejecutan con: node test/datos.test.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Datos = require("../js/datos.js");
const { cargarDatos } = require("./datos-de-disco.cjs");

let fallos = 0;
const prueba = (nombre, fn) => {
  Promise.resolve().then(fn).then(() => console.log("ok   ", nombre))
    .catch((e) => { fallos++; console.log("FALLA", nombre, "->", e.message); });
};
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

prueba("validar: género listado sin archivo, o por defecto desconocido", () => {
  assert.ok(contiene(errores((c) => { c.indice.orden.push("surf"); }), "«surf» no tiene archivo"));
  assert.ok(contiene(errores((c) => { c.indice.porDefecto = "amanecer"; }), "«porDefecto»"));
  assert.ok(contiene(errores((c) => { c.generos.luna.id = "otra"; }), "debe ser «luna»"));
});

prueba("validar: vetos que apuntan a un factor inexistente", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.vetos[1].factor = "viento"; }), "«viento» no es un factor"));
});

prueba("validar: un campo de nubes que no existe", () => {
  assert.ok(contiene(errores((c) => { c.generos.atardecer.factores[0].campos = ["muy-altas"]; }), "campos"));
});

prueba("validar: los mensajes dicen dónde está el error", () => {
  const e = errores((c) => { c.generos.luna.nubes.verdeMenosDe = 90; });
  assert.ok(e.some((m) => m.startsWith("generos/luna.nubes")), e.join(" | "));
});

prueba("cargar: lee todos los archivos y da lo mismo que el disco", async () => {
  const base = path.join(__dirname, "..", "data") + "/";
  const buscar = async (url) => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(url, "utf8")) });
  const c = await Datos.cargar(base, buscar);
  assert.deepEqual(c, cargarDatos());
});

prueba("cargar: si falta un archivo dice cuál", async () => {
  const buscar = async (url) => url.endsWith("generos/luna.json")
    ? { ok: false, status: 404 }
    : { ok: true, json: async () => JSON.parse(fs.readFileSync(url, "utf8")) };
  await assert.rejects(Datos.cargar(path.join(__dirname, "..", "data") + "/", buscar), /generos\/luna\.json.*404/);
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

setTimeout(() => {
  console.log(fallos ? "\n" + fallos + " prueba(s) con fallo" : "\nTodo correcto");
  process.exit(fallos ? 1 : 0);
}, 300);
