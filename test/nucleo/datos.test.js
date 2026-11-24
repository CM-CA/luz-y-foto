// Pruebas de la carga y validación de data/. Se ejecutan con: npm test (o npx vitest run).
// Mismas comprobaciones que test/datos.test.cjs, pero sobre la lógica nueva (src/).
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco as cargarDatos } from "../../scripts/datos-de-disco.mjs";
import * as Datos from "../../src/nucleo/datos.js";
import { datosIncluidos, IDIOMAS_DE_DATOS } from "../../src/datos-incluidos.js";
import { DIBUJOS } from "../../src/dibujos/index.js";

const prueba = it;
const copia = (x) => JSON.parse(JSON.stringify(x));
const errores = (mut) => { const c = copia(cargarDatos()); mut(c); return Datos.validar(c); };
const contiene = (lista, trozo) => lista.some((e) => e.includes(trozo));

prueba("los datos reales de data/ son válidos", () => {
  assert.deepEqual(Datos.validar(cargarDatos()), []);
});

prueba("los tres géneros actuales existen y usan motores conocidos", () => {
  const c = cargarDatos();
  assert.deepEqual(c.indice.orden, ["amanecer", "atardecer", "luna"]);
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
  assert.ok(contiene(errores((c) => { c.indice.porDefecto = "noexiste"; }), "«porDefecto»"));
  assert.ok(contiene(errores((c) => { c.generos.luna.id = "otra"; }), "debe ser «luna»"));
});

prueba("validar: franjas de la pestaña por defecto", () => {
  assert.ok(contiene(errores((c) => { c.indice.porDefectoDeAmanecer = "noexiste"; }), "porDefectoDeAmanecer"));
  assert.ok(contiene(errores((c) => { c.indice.amanecerAntesMin = -1; }), "amanecerAntesMin"));
  assert.ok(contiene(errores((c) => { c.indice.amanecerDespuesMin = "x"; }), "amanecerDespuesMin"));
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

prueba("datos incluidos: un idioma sin carpeta en data/ se ve con los datos del español", () => {
  assert.deepEqual(datosIncluidos("klingon"), cargarDatos());
  assert.ok(IDIOMAS_DE_DATOS.includes("es"));
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


/* ---------- Las lecciones (Aprender) ---------- */

const LECCION = "la-rueda-de-modos";
const palabrasDe = (n) => Array.from({ length: n }, (_, i) => "palabra" + i).join(" ");
const bloquesDe = (c) => c.lecciones.porId[LECCION].bloques;

prueba("lecciones: los datos reales son válidos y están en la carga", () => {
  const c = cargarDatos();
  assert.deepEqual(Datos.validar(c), []);
  assert.ok(c.lecciones.indice.grupos[0].lecciones.includes(LECCION));
  assert.deepEqual(datosIncluidos().lecciones, c.lecciones);
});

prueba("lecciones: falta el índice", () => {
  assert.ok(contiene(errores((c) => { delete c.lecciones; }), "lecciones.json"));
});

prueba("lecciones: una del índice sin archivo", () => {
  assert.ok(contiene(errores((c) => { c.lecciones.indice.grupos[0].lecciones.push("fantasma"); }), "fantasma"));
});

prueba("lecciones: bloque desconocido, sin texto o dibujo sin alt", () => {
  assert.ok(contiene(errores((c) => { bloquesDe(c).push({ tipo: "video" }); }), "«video»"));
  assert.ok(contiene(errores((c) => { bloquesDe(c).push({ tipo: "parrafo" }); }), ".texto"));
  assert.ok(contiene(errores((c) => { bloquesDe(c).push({ tipo: "dibujo", id: "modos", pie: "Un pie" }); }), ".alt"));
  assert.ok(contiene(errores((c) => { bloquesDe(c).push({ tipo: "lista", items: [] }); }), ".items"));
});

prueba("lecciones: términos del glosario", () => {
  const poner = (texto) => (c) => { bloquesDe(c).push({ tipo: "parrafo", texto }); };
  assert.ok(contiene(errores(poner("Mira [[no-existe|algo]]")), "«no-existe»"));
  assert.ok(contiene(errores(poner("Mira [[apertura]]")), "mal escrito"));
  assert.deepEqual(errores(poner("Mira la [[apertura|apertura]]")), []);
});

prueba("lecciones: límites de palabras, minutos y público", () => {
  assert.ok(contiene(errores((c) => { bloquesDe(c).push({ tipo: "parrafo", texto: palabrasDe(451) }); }), "palabras"));
  // El alt y el pie de un dibujo no cuentan para el límite
  assert.ok(!contiene(errores((c) => { bloquesDe(c).push({ tipo: "dibujo", id: "x", alt: palabrasDe(500), pie: palabrasDe(100) }); }), "palabras"));
  assert.ok(contiene(errores((c) => { c.lecciones.porId[LECCION].minutos = 0; }), "minutos"));
  assert.ok(contiene(errores((c) => { c.lecciones.porId[LECCION].minutos = 30; }), "minutos"));
  assert.ok(contiene(errores((c) => { c.lecciones.porId[LECCION].para = "tablet"; }), ".para"));
  assert.ok(contiene(errores((c) => { c.lecciones.indice.etiquetas.noExiste = ""; }), "etiquetas.noExiste"));
});

prueba("lecciones: la primera lección enseña la regla corta y los nombres según la marca", () => {
  const l = cargarDatos().lecciones.porId[LECCION];
  const idea = l.bloques.find((b) => b.tipo === "idea");
  assert.ok(idea && /\bAv\b/.test(idea.texto) && /\bTv\b/.test(idea.texto) && /\bM\b/.test(idea.texto), "la idea clave nombra Av, Tv y M");
  assert.ok(l.bloques.some((b) => b.tipo === "pruebalo"), "tiene un «Pruébalo hoy»");
  assert.ok(JSON.stringify(l.bloques).includes("Nikon"), "dice cómo se llaman los modos en Nikon y Sony");
});

prueba("lecciones: cada dibujo citado existe en src/dibujos/ y tiene sus textos", () => {
  const c = cargarDatos();
  const citados = Object.values(c.lecciones.porId).flatMap((l) => l.bloques.filter((b) => b.tipo === "dibujo").map((b) => b.id));
  assert.ok(citados.length > 0, "alguna lección cita un dibujo");
  citados.forEach((id) => {
    assert.ok(DIBUJOS[id], "falta el dibujo «" + id + "» en src/dibujos/");
    assert.ok(c.dibujos[id], "faltan sus textos en data/es/dibujos.json");
  });
  const primero = c.lecciones.porId["la-rueda-de-modos"].bloques[0];
  assert.equal(primero.tipo, "dibujo");
  assert.equal(primero.id, "modos");
  assert.equal(primero.alt, "Lo que eliges tú en cada modo: en Auto, nada; en P, el ISO; en Tv, el tiempo y el ISO; en Av, la apertura y el ISO; en M, los tres.");
  assert.equal(primero.pie, "Cuadro lleno: lo eliges tú. Vacío: lo elige la cámara.");
});

prueba("dibujos: se validan los textos de cada dibujo y que la lección cite un dibujo que existe", () => {
  assert.ok(contiene(errores((c) => { delete c.dibujos; }), "dibujos.json: falta"));
  assert.ok(contiene(errores((c) => { delete c.dibujos.zoom; }), "dibujos.json.zoom: faltan los textos"));
  assert.ok(contiene(errores((c) => { delete c.dibujos.modos.filas; }), "dibujos.json.modos.filas: debe ser una lista de 3"));
  assert.ok(contiene(errores((c) => { c.dibujos.modos.modos.pop(); }), "dibujos.json.modos.modos: debe ser una lista de 5"));
  assert.ok(contiene(errores((c) => { c.dibujos.modos.extra = "x"; }), "dibujos.json.modos.extra: este dibujo no usa esa clave"));
  assert.ok(contiene(errores((c) => { c.dibujos.parasol.sin = "  "; }), "dibujos.json.parasol.sin: falta el texto"));
  assert.ok(contiene(errores((c) => { c.dibujos.paisaje.lineas[1] = ""; }), "dibujos.json.paisaje.lineas[1]: falta el texto"));
  assert.ok(contiene(errores((c) => { c.dibujos.inventado = {}; }), "«inventado» no es un dibujo que exista"));
  assert.ok(contiene(errores((c) => { c.lecciones.porId["la-rueda-de-modos"].bloques[0].id = "inventado"; }), "el dibujo «inventado» no existe"));
});

// El texto que ve quien lee una lección (sin las marcas de los términos), para buscar en él
const textoDeLeccion = (l) => l.bloques.flatMap((b) => b.items || [b.texto]).filter(Boolean).join(" ").replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, "$1");
const dibujosDe = (l) => l.bloques.filter((b) => b.tipo === "dibujo").map((b) => b.id);

prueba("lecciones: «Lo básico» trae las tres de cámara, en orden", () => {
  const g = cargarDatos().lecciones.indice.grupos.find((x) => x.id === "basico");
  assert.deepEqual(g.lecciones, ["la-rueda-de-modos", "el-manual-de-verdad", "como-usar-el-histograma", "parasol-y-filtro-uv"]);
});

prueba("lecciones: los grupos van en orden y «Para el móvil» va aparte, después de «Lo básico»", () => {
  const grupos = cargarDatos().lecciones.indice.grupos;
  assert.deepEqual(grupos.map((g) => g.id), ["basico", "movil", "composicion", "luz", "tecnica", "tipos"]);
  assert.equal(grupos[1].titulo, "Para el móvil");
  assert.ok(grupos[1].lecciones.includes("toca-para-enfocar-y-exponer"));
  // Las lecciones de cada grupo son del equipo del grupo: ninguna de móvil entre las de cámara y al revés
  const porId = cargarDatos().lecciones.porId;
  grupos[0].lecciones.forEach((id) => assert.equal(porId[id].para, "camara", id));
  grupos[1].lecciones.forEach((id) => assert.equal(porId[id].para, "movil", id));
});

prueba("lecciones: toca para enfocar y exponer", () => {
  const l = cargarDatos().lecciones.porId["toca-para-enfocar-y-exponer"];
  assert.equal(l.titulo, "Toca para enfocar y exponer");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  assert.equal(l.para, "movil");
  const texto = textoDeLeccion(l);
  [/toca/i, /brillo/i, /bloque/i, /según tu móvil/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["toca"]);
});

prueba("lecciones: el manual de verdad", () => {
  const l = cargarDatos().lecciones.porId["el-manual-de-verdad"];
  assert.equal(l.titulo, "El manual de verdad");
  assert.equal(l.minutos, 3);
  assert.equal(l.para, "camara");
  const texto = textoDeLeccion(l);
  ["f/5.6", "ISO 400", "1 s", "trípode", "paso"].forEach((t) => assert.ok(texto.includes(t), "no menciona «" + t + "»"));
  // El ejemplo vale para cualquier cámara: ni un modelo, ni una distancia focal concreta
  ["Canon EOS", "600D", "55 mm", "8°"].forEach((t) => assert.ok(!texto.includes(t), "el ejemplo no debe llevar «" + t + "»"));
  assert.ok(/un ejemplo, no una receta/i.test(texto), "dice que son ajustes de ejemplo, no una receta");
  assert.deepEqual(dibujosDe(l), ["exposicion"]);
});

prueba("lecciones: luz baja y modo noche", () => {
  const datos = cargarDatos();
  const grupo = datos.lecciones.indice.grupos.find((g) => g.id === "movil").lecciones;
  assert.equal(grupo.indexOf("luz-baja-y-modo-noche"), 1, "va la segunda del grupo «Para el móvil»");
  const l = datos.lecciones.porId["luz-baja-y-modo-noche"];
  assert.equal(l.titulo, "Luz baja y modo noche");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  assert.equal(l.para, "movil");
  const texto = textoDeLeccion(l);
  [/modo noche/i, /quiet/i, /apoy/i, /luna/i, /según tu móvil/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["noche"]);
});

prueba("lecciones: zoom y lentes", () => {
  const datos = cargarDatos();
  assert.deepEqual(datos.lecciones.indice.grupos.find((g) => g.id === "movil").lecciones, ["toca-para-enfocar-y-exponer", "luz-baja-y-modo-noche", "zoom-y-lentes"]);
  const l = datos.lecciones.porId["zoom-y-lentes"];
  assert.equal(l.titulo, "Zoom y lentes: cuál usar");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  assert.equal(l.para, "movil");
  const texto = textoDeLeccion(l);
  [/0,5x/, /zoom digital/i, /recorta/i, /según tu móvil/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["zoom"]);
});

prueba("lecciones: el grupo «Tipos de fotografía» va el último y sus lecciones son para todos", () => {
  const datos = cargarDatos();
  const g = datos.lecciones.indice.grupos.find((x) => x.id === "tipos");
  assert.ok(g, "falta el grupo tipos");
  assert.equal(g.titulo, "Tipos de fotografía");
  assert.deepEqual(g.lecciones, ["fotografia-de-paisaje", "fotografia-deportiva", "fotografia-urbana", "fotografia-nocturna", "fotografia-de-retrato", "fotografia-de-arquitectura", "fotografia-macro", "astrofotografia", "fauna-y-aves", "fotografia-de-mascotas", "fotografia-de-viajes", "fotografia-de-comida", "familia-y-ninos"]);
  g.lecciones.forEach((id) => assert.equal(datos.lecciones.porId[id].para, "todos", id));
});

prueba("lecciones: fotografía de paisaje", () => {
  const l = cargarDatos().lecciones.porId["fotografia-de-paisaje"];
  assert.equal(l.titulo, "Fotografía de paisaje");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/primer plano/i, /plano medio/i, /tercio/i, /f\/11/, /trípode/i, /cuadrícula/i, /0,5x/, /ISO/, /mediodía/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["paisaje"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto), "no ata la lección a una marca de cámara");
  assert.ok(/según tu móvil|en muchos móviles|en los ajustes de la cámara/.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: fotografía deportiva", () => {
  const l = cargarDatos().lecciones.porId["fotografia-deportiva"];
  assert.equal(l.titulo, "Fotografía deportiva");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/1\/500/, /1\/1000/, /enfoque continuo/i, /ráfaga/i, /Tv/, /iPhone/, /pellizc/i, /ISO/, /apertura/i, /anticíp/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["deporte"]);
  assert.ok(!/modo deportes?/i.test(texto), "«modo Deportes» solo lo dice una fuente");
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto) || /AF-C|Servo/.test(texto), "las marcas solo salen para nombrar el enfoque continuo");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: fotografía urbana", () => {
  const l = cargarDatos().lecciones.porId["fotografia-urbana"];
  assert.equal(l.titulo, "Fotografía urbana");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/líneas guía/i, /marco/i, /charco de luz/i, /1\/200/, /f\/5,6/, /f\/8/, /ISO/, /hora dorada/i, /permiso/i, /niños/i, /borr/i, /pellizc/i, /esper/i, /hora azul/i, /compensación/i, /1\/100/, /estelas/i, /filtro UV/i, /brillo/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["urbana", "luces"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto), "no ata la lección a una marca de cámara");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(/asesoramiento legal/i.test(texto) && /cambian de un país a otro/i.test(texto), "avisa de que la ley cambia y de que no es asesoramiento legal");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: cómo usar el histograma", () => {
  const l = cargarDatos().lecciones.porId["como-usar-el-histograma"];
  assert.equal(l.titulo, "Cómo usar el histograma");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  assert.equal(l.para, "camara");
  const texto = textoDeLeccion(l);
  [/Info/, /Display/, /manual de tu cámara/i, /vista en directo/i, /sombras/i, /luces/i, /izquierda/i, /derecha/i, /oscura/i, /clara/i, /borde/i, /quemadas/i, /negro/i, /no hay una forma correcta/i, /compensación/i, /tiempo más corto/i, /apertura más cerrada/i, /ISO más bajo/, /contrario/i, /otra foto/i, /pantalla/i, /histograma/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["histograma"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto), "no ata la lección a una marca de cámara");
  assert.ok(!/blinkies|zebra|aviso de altas luces/i.test(texto), "los avisos de altas luces solo tienen una fuente");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras: " + texto.split(/\s+/).length);
});

prueba("lecciones: fotografía nocturna", () => {
  const l = cargarDatos().lecciones.porId["fotografia-nocturna"];
  assert.equal(l.titulo, "Fotografía nocturna");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/trípode/i, /temporizador/i, /disparador remoto/i, /ISO bajo/, /f\/8/, /f\/11/, /estrellas/i, /segundos/i, /estela/i, /enfoque manual/i, /autoenfoque/i, /amplía/i, /prueba/i, /ISO alto/, /duplicarse/i, /histograma/i, /brillo/i, /Luz baja y modo noche/, /Cómo usar el histograma/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["nocturna"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto), "no ata la lección a una marca de cámara");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(!/batería|vista nocturna/i.test(texto), "lo que tiene una sola fuente se queda fuera (batería, vista nocturna)");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras: " + texto.split(/\s+/).length);
});

prueba("lecciones: fotografía de retrato", () => {
  const l = cargarDatos().lecciones.porId["fotografia-de-retrato"];
  assert.equal(l.titulo, "Fotografía de retrato");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/ventana/i, /sombra/i, /nublado/i, /hora dorada/i, /sol fuerte/i, /enfoca el ojo/i, /apertura/i, /f\/2,8/, /borroso/i, /lejos del fondo|aleja a la persona del fondo/i, /gran angular/i, /nariz/i, /85 mm/, /zoom/i, /altura de (sus|los) ojos/i, /habla/i, /modo retrato/i, /programa/i, /pelo/i, /2x o 3x/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["retrato"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto), "no ata la lección a una marca de cámara");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(!/ráfaga/i.test(texto), "la ráfaga en retrato solo tiene una fuente");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras: " + texto.split(/\s+/).length);
});

prueba("lecciones: fotografía de arquitectura", () => {
  const l = cargarDatos().lecciones.porId["fotografia-de-arquitectura"];
  assert.equal(l.titulo, "Fotografía de arquitectura");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/verticales convergentes/i, /a nivel/i, /cuadrícula/i, /aléjate/i, /margen/i, /recortar/i, /simetría/i, /patrones/i, /detalles/i, /reflejos/i, /persona o un coche/i, /punto de vista/i, /hora dorada/i, /hora azul/i, /nublado/i, /f\/8/, /trípode/i, /gran angular/i, /0,5x/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["arquitectura"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS)\b/.test(texto), "no ata la lección a una marca de cámara");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(!/tilt|descentrable|ISO bajo/i.test(texto), "lo que tiene una sola fuente se queda fuera (objetivo descentrable, ISO bajo)");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras: " + texto.split(/\s+/).length);
});

prueba("lecciones: el grupo «Composición» va entre el móvil y los tipos y sus lecciones son para todos", () => {
  const datos = cargarDatos();
  const g = datos.lecciones.indice.grupos.find((x) => x.id === "composicion");
  assert.ok(g, "falta el grupo composicion");
  assert.equal(g.titulo, "Composición");
  assert.deepEqual(g.lecciones, ["lo-basico-de-la-composicion", "el-encuadre", "lineas-y-puntos-de-fuga"]);
  g.lecciones.forEach((id) => assert.equal(datos.lecciones.porId[id].para, "todos", id));
});

prueba("lecciones: lo básico de la composición", () => {
  const l = cargarDatos().lecciones.porId["lo-basico-de-la-composicion"];
  assert.equal(l.titulo, "Lo básico de la composición");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/sujeto/i, /tercios/i, /cuadrícula/i, /horizonte/i, /cruce/i, /ojos/i, /espacio libre/i, /fondo sencillo/i, /simétric/i, /centrad/i, /a propósito/i, /no una ley/i, /agáchate|cambia de altura/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["composicion"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: el encuadre", () => {
  const l = cargarDatos().lecciones.porId["el-encuadre"];
  assert.equal(l.titulo, "El encuadre");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/acércate/i, /zoom/i, /bordes/i, /articulaciones/i, /muñecas/i, /rodillas/i, /vertical/i, /horizontal/i, /por delante/i, /marco natural/i, /puerta/i, /ventana/i, /arco/i, /margen/i, /recortar/i, /Zoom y lentes/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["encuadre"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: líneas y puntos de fuga", () => {
  const l = cargarDatos().lecciones.porId["lineas-y-puntos-de-fuga"];
  assert.equal(l.titulo, "Líneas y puntos de fuga");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/punto de fuga/i, /líneas guía/i, /carreteras/i, /vías/i, /primer plano/i, /centro/i, /tercio/i, /flechas/i, /gran angular/i, /baja la cámara/i, /cuadrícula/i, /0,5x/, /Fotografía de arquitectura/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["fuga"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: el grupo «La luz» va entre Composición y los tipos y sus lecciones son para todos", () => {
  const datos = cargarDatos();
  const g = datos.lecciones.indice.grupos.find((x) => x.id === "luz");
  assert.ok(g, "falta el grupo luz");
  assert.equal(g.titulo, "La luz");
  assert.deepEqual(g.lecciones, ["luz-dura-y-luz-suave", "contraluz-y-siluetas", "balance-de-blancos"]);
  g.lecciones.forEach((id) => assert.equal(datos.lecciones.porId[id].para, "todos", id));
});

prueba("lecciones: luz dura y luz suave", () => {
  const l = cargarDatos().lecciones.porId["luz-dura-y-luz-suave"];
  assert.equal(l.titulo, "Luz dura y luz suave");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/sombra/i, /borde/i, /tamaño de la fuente/i, /distancia/i, /mediodía/i, /nublado/i, /ventana/i, /cortina/i, /pared blanca/i, /flash/i, /retrato/i, /blanco y negro/i, /piel/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["luzdura"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: contraluz y siluetas", () => {
  const l = cargarDatos().lecciones.porId["contraluz-y-siluetas"];
  assert.equal(l.titulo, "Contraluz y siluetas");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/mucho más oscuro/i, /medición/i, /compensación/i, /reflector/i, /flash/i, /parasol/i, /silueta/i, /cielo/i, /forma clara/i, /atardecer/i, /sol bajo/i, /baja el brillo/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["contraluz"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: balance de blancos", () => {
  const l = cargarDatos().lecciones.porId["balance-de-blancos"];
  assert.equal(l.titulo, "Balance de blancos");
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  [/bombilla/i, /sombra/i, /naranja/i, /azul/i, /automático/i, /preajustes/i, /luz de día/i, /nublado/i, /Kelvin/, /luces mezcladas/i, /RAW/, /JPEG/, /modo Pro/i, /volver a automático/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), ["blancos"]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(/en muchos móviles|según tu móvil/i.test(texto), "dice dónde cambia de un móvil a otro");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras");
});

prueba("lecciones: el grupo «Técnica» va entre La luz y los tipos", () => {
  const datos = cargarDatos();
  const g = datos.lecciones.indice.grupos.find((x) => x.id === "tecnica");
  assert.ok(g, "falta el grupo tecnica");
  assert.equal(g.titulo, "Técnica");
  assert.deepEqual(g.lecciones, ["raw-y-jpeg", "modos-de-medicion", "modos-de-enfoque", "larga-exposicion-y-filtros", "distancias-focales"]);
  assert.equal(datos.lecciones.porId["raw-y-jpeg"].para, "todos");
  assert.equal(datos.lecciones.porId["modos-de-medicion"].para, "camara");
  assert.equal(datos.lecciones.porId["modos-de-enfoque"].para, "camara");
  assert.equal(datos.lecciones.porId["larga-exposicion-y-filtros"].para, "camara");
  assert.equal(datos.lecciones.porId["distancias-focales"].para, "todos");
});

const comunes = (l, titulo, dibujo, extra = []) => {
  assert.equal(l.titulo, titulo);
  assert.ok(l.minutos >= 2 && l.minutos <= 3);
  const texto = textoDeLeccion(l);
  assert.ok(l.bloques.some((b) => b.tipo === "idea") && l.bloques.some((b) => b.tipo === "pruebalo"), "lleva idea clave y «pruébalo hoy»");
  assert.deepEqual(dibujosDe(l), [dibujo]);
  assert.ok(!/\b(Canon|Nikon|Sony|EOS|iPhone|Samsung|Lightroom)\b/.test(texto), "no ata la lección a una marca");
  assert.ok(texto.split(/\s+/).length <= 450, "pasa de 450 palabras: " + texto.split(/\s+/).length);
  return texto;
};

prueba("lecciones: RAW y JPEG", () => {
  const texto = comunes(cargarDatos().lecciones.porId["raw-y-jpeg"], "RAW y JPEG", "rawjpeg");
  [/sensor/i, /comprim/i, /negativo digital/i, /programa de edición/i, /plano/i, /balance de blancos/i, /bandas/i, /luz difícil/i, /tarjeta/i, /ráfagas/i, /RAW\+JPEG/, /en muchos móviles/i, /modo Pro/i, /app aparte/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
});

prueba("lecciones: modos de medición", () => {
  const texto = comunes(cargarDatos().lecciones.porId["modos-de-medicion"], "Modos de medición", "medicion");
  [/gris medio/i, /evaluativa/i, /ponderada al centro/i, /puntual/i, /parcial/i, /punto de enfoque/i, /contraluz/i, /bloqueo AE\/AF/i, /nieve/i, /compensación/i, /Toca para enfocar y exponer/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
});

prueba("lecciones: modos de enfoque", () => {
  const texto = comunes(cargarDatos().lecciones.porId["modos-de-enfoque"], "Modos de enfoque", "enfoque");
  [/simple/i, /AF-S/, /continuo/i, /AF-C/, /AI Servo/, /automático/i, /a medias/i, /un punto/i, /zona/i, /seguimiento/i, /ojos/i, /AF-ON/, /Toca para enfocar y exponer/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
});

prueba("lecciones: larga exposición y filtros", () => {
  const texto = comunes(cargarDatos().lecciones.porId["larga-exposicion-y-filtros"], "Larga exposición y filtros", "largaexp");
  [/trípode/i, /temporizador/i, /ISO/, /apertura/i, /modo manual/i, /Bulb/, /30 segundos/i, /filtro ND/i, /pasos/i, /1\/8 s/, /8 s/, /sedoso/i, /estelas/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
});

prueba("lecciones: distancias focales", () => {
  const texto = comunes(cargarDatos().lecciones.porId["distancias-focales"], "Distancias focales", "focales");
  [/milímetros/i, /gran angular/i, /24 mm/, /50 mm/, /85 mm/, /200 mm/, /dónde te pones/i, /fondo/i, /zoom/i, /formato completo/i, /factor de recorte/i, /en muchos móviles/i, /Zoom y lentes/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
});

prueba("lecciones: paisaje, deportiva y retrato remiten a las distancias focales", () => {
  const l = cargarDatos().lecciones.porId;
  ["fotografia-de-paisaje", "fotografia-deportiva", "fotografia-de-retrato"].forEach((id) => assert.ok(/Distancias focales/.test(textoDeLeccion(l[id])), id + " no enlaza «Distancias focales»"));
});

prueba("lecciones: fotografía macro", () => {
  const texto = comunes(cargarDatos().lecciones.porId["fotografia-macro"], "Fotografía macro", "macro");
  [/macro/i, /1:1/, /1:2/, /franja/i, /apertura/i, /luz/i, /enfoque manual/i, /amplía/i, /aleja/i, /trípode/i, /temporizador/i, /insecto/i, /brisa/i, /nublado/i, /distancia mínima de enfoque/i, /filtros de aproximación/i, /tubos de extensión/i, /en muchos móviles/i, /modo macro/i, /sombra/i].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/tubo|hielo|nevera|frío|f\/22|difracción|zoom digital/i.test(texto.replace(/tubos de extensión/gi, "")), "lo que tiene una sola fuente se queda fuera (enfriar insectos, difracción, zoom digital)");
});

prueba("lecciones: astrofotografía", () => {
  const texto = comunes(cargarDatos().lecciones.porId["astrofotografia"], "Astrofotografía", "astro");
  [/lejos de las luces/i, /despejad/i, /luna nueva/i, /trípode/i, /temporizador|disparador remoto/i, /gran angular/i, /f\/2,8/, /ISO/, /1600/, /6400/, /segundos/i, /rayitas/i, /enfoque manual/i, /amplía/i, /estrella brillante/i, /RAW/, /balance de blancos/i, /luz roja/i, /en muchos móviles/i, /modo noche/i, /Luz baja y modo noche/, /RAW y JPEG/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/regla de los 500|regla de los 600|NPF|dos segundos|ojos se adaptan|adaptación/i.test(texto), "lo que tiene una sola fuente o no coincide se queda fuera (regla de los 500, temporizador de 2 s, adaptación de la vista)");
});

prueba("lecciones: fauna y aves", () => {
  const texto = comunes(cargarDatos().lecciones.porId["fauna-y-aves"], "Fauna y aves", "fauna");
  [/teleobjetivo/i, /distancia/i, /despacio/i, /bruscos/i, /nido/i, /1\/1000 s/, /apertura/i, /enfoque continuo/i, /ráfaga/i, /ojo/i, /amanecer/i, /atardecer/i, /hora dorada/i, /altura de sus ojos/i, /fondo/i, /en muchos móviles/i, /espera/i, /Distancias focales/, /Fotografía deportiva/, /Toca para enfocar y exponer/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/comedero|cebo|alimentar|ISO automático|parque/i.test(texto), "lo que tiene una sola fuente o no coincide se queda fuera (comederos, cebos, ISO automático, parques)");
});

prueba("lecciones: fotografía de mascotas", () => {
  const texto = comunes(cargarDatos().lecciones.porId["fotografia-de-mascotas"], "Fotografía de mascotas", "mascotas");
  [/altura/i, /ojos/i, /nublado/i, /primera y última hora/i, /flash directo/i, /oscuro/i, /1\/500 s/, /ráfaga/i, /juguete/i, /premio/i, /ruido/i, /paciencia/i, /acostumbr/i, /fondo/i, /apertura/i, /en muchos móviles/i, /Luz dura y luz suave/, /Toca para enfocar y exponer/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/ventana|modo retrato|estrés|pelo blanco|sesiones cortas/i.test(texto), "lo que tiene una sola fuente se queda fuera (luz de ventana, modo retrato, señales de estrés, sesiones cortas)");
});

prueba("lecciones: fauna y aves remite a las distancias focales y a la deportiva; astrofotografía, a la nocturna", () => {
  const l = cargarDatos().lecciones.porId;
  assert.ok(/Fotografía deportiva/.test(textoDeLeccion(l["fauna-y-aves"])) && /Distancias focales/.test(textoDeLeccion(l["fauna-y-aves"])));
  assert.ok(/Fotografía nocturna/.test(textoDeLeccion(l["astrofotografia"])), "astrofotografía no enlaza «Fotografía nocturna»");
});

prueba("lecciones: fotografía de viajes", () => {
  const texto = comunes(cargarDatos().lecciones.porId["fotografia-de-viajes"], "Fotografía de viajes", "viajes");
  [/hora dorada/i, /menos gente/i, /sin tanta gente/i, /mediodía/i, /punto de vista/i, /sitio alto/i, /detalle/i, /una persona/i, /tamaño/i, /pregunta antes/i, /saludar/i, /costumbres/i, /en muchos móviles/i, /Luz dura y luz suave/, /Zoom y lentes/, /Toca para enfocar y exponer/, /Fotografía urbana/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/vendedor|dron|serie de fotos|propina|textura|la vida/i.test(texto), "lo que tiene una sola fuente se queda fuera (comprar a quien fotografías, drones, series de fotos, texturas, cómo es la vida allí)");
});

prueba("lecciones: fotografía de comida", () => {
  const texto = comunes(cargarDatos().lecciones.porId["fotografia-de-comida"], "Fotografía de comida", "comida");
  [/luz natural/i, /ventana/i, /de lado/i, /sombras duras/i, /nublado/i, /cartón/i, /desde arriba/i, /pizza/i, /45°/, /hamburguesa/i, /tarta/i, /enseguida/i, /fondo sencillo/i, /trípode/i, /apaga el flash/i, /bombillas/i, /balance de blancos/i, /en muchos móviles/i, /Toca para enfocar y exponer/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/pide mesa|mesa junto a la ventana|limpia el plato|f\/1,8|1\/100/i.test(texto), "lo que tiene una sola fuente o no coincide se queda fuera (mesa junto a la ventana, limpiar el plato, cifras de apertura y tiempo)");
});

prueba("lecciones: familia y niños", () => {
  const texto = comunes(cargarDatos().lecciones.porId["familia-y-ninos"], "Familia y niños", "familia");
  [/altura de sus ojos/i, /Fotografía de mascotas/, /patata/i, /jugar/i, /luz natural/i, /nublado/i, /sombra/i, /ventana/i, /1\/250 s/, /Fotografía deportiva/, /ISO/, /enfoque continuo/i, /Modos de enfoque/, /apertura/i, /detalles/i, /manos/i, /divertido/i, /guarda la cámara/i, /en muchos móviles/i, /Toca para enfocar y exponer/].forEach((r) => assert.ok(r.test(texto), "no menciona " + r));
  assert.ok(!/ráfaga|1\/200|permiso de los padres|hambre|sueño|contraluz/i.test(texto), "lo que tiene una sola fuente o no coincide se queda fuera (ráfaga, 1/200 s, permiso de los padres, hambre y sueño, contraluz)");
});

prueba("lecciones: comida y familia remiten a otras lecciones; viajes, a la urbana y a la luz", () => {
  const l = cargarDatos().lecciones.porId;
  assert.ok(/Toca para enfocar y exponer/.test(textoDeLeccion(l["fotografia-de-comida"])) && /balance de blancos/i.test(textoDeLeccion(l["fotografia-de-comida"])));
  assert.ok(/Fotografía de mascotas/.test(textoDeLeccion(l["familia-y-ninos"])) && /Fotografía deportiva/.test(textoDeLeccion(l["familia-y-ninos"])) && /Modos de enfoque/.test(textoDeLeccion(l["familia-y-ninos"])));
  assert.ok(/Fotografía urbana/.test(textoDeLeccion(l["fotografia-de-viajes"])) && /Luz dura y luz suave/.test(textoDeLeccion(l["fotografia-de-viajes"])));
});

prueba("glosario: macro", () => {
  const g = cargarDatos().glosario["macro"];
  assert.ok(g && /Macro/.test(g.termino) && /tamaño real|1:1/.test(g.texto) && /cerca/.test(g.texto), "macro: de cerca y a tamaño real (1:1)");
});

prueba("glosario: distancia focal, filtro ND y enfoque simple", () => {
  const g = cargarDatos().glosario;
  assert.ok(g["distancia-focal"] && /Distancia focal/.test(g["distancia-focal"].termino) && /milímetros/.test(g["distancia-focal"].texto) && /gran angular/.test(g["distancia-focal"].texto), "distancia focal: milímetros y gran angular");
  assert.ok(g["filtro-nd"] && /Filtro ND/.test(g["filtro-nd"].termino) && /menos luz/.test(g["filtro-nd"].texto) && /tiempos largos/.test(g["filtro-nd"].texto), "filtro ND: menos luz y tiempos largos");
  assert.ok(g["enfoque-simple"] && /Enfoque simple/.test(g["enfoque-simple"].termino) && /AF-S/.test(g["enfoque-simple"].termino) && /a medias/.test(g["enfoque-simple"].texto), "enfoque simple: AF-S y disparador a medias");
});

prueba("glosario: balance de blancos", () => {
  const g = cargarDatos().glosario["balance-de-blancos"];
  assert.ok(g && /Balance de blancos/.test(g.termino) && /blanco/.test(g.texto) && /bombilla/.test(g.texto), "falta el término o no habla de blanco y de bombilla");
});

prueba("glosario: punto de fuga", () => {
  const g = cargarDatos().glosario["punto-de-fuga"];
  assert.ok(g && /Punto de fuga/.test(g.termino) && /paralelas/.test(g.texto) && /profundidad/.test(g.texto), "falta el término o no dice que son líneas paralelas ni que da profundidad");
});

prueba("glosario: histograma y verticales convergentes", () => {
  const g = cargarDatos().glosario;
  assert.ok(g["histograma"] && /Histograma/.test(g["histograma"].termino) && /izquierda/.test(g["histograma"].texto) && /derecha/.test(g["histograma"].texto), "histograma: izquierda y derecha");
  assert.ok(g["verticales-convergentes"] && /Verticales convergentes/.test(g["verticales-convergentes"].termino) && /a nivel/.test(g["verticales-convergentes"].texto), "verticales convergentes: se evitan con la cámara a nivel");
});

prueba("glosario: líneas guía", () => {
  const g = cargarDatos().glosario["lineas-guia"];
  assert.ok(g && /guía/i.test(g.termino) && /mirada/.test(g.texto), "falta el término o no dice que llevan la mirada");
});

prueba("glosario: enfoque continuo y ráfaga", () => {
  const g = cargarDatos().glosario;
  assert.ok(g["enfoque-continuo"] && /AF-C/.test(g["enfoque-continuo"].texto) && /Servo/.test(g["enfoque-continuo"].texto), "enfoque continuo: nombres de las marcas");
  assert.ok(g["rafaga"] && /seguidas/.test(g["rafaga"].texto), "ráfaga: varias fotos seguidas");
});

prueba("glosario: la hora dorada es la de después del amanecer y la de antes de la puesta", () => {
  const t = cargarDatos().glosario["hora-dorada"].texto;
  assert.ok(/salida|amanecer/i.test(t) && /puesta/i.test(t), "solo habla de un extremo del día: " + t);
});

prueba("glosario: regla de los tercios", () => {
  const t = cargarDatos().glosario["regla-de-tercios"];
  assert.ok(t && /tercios/i.test(t.termino) && /centro/.test(t.texto), "falta el término o no explica el centro");
});

prueba("lecciones: parasol y filtro UV", () => {
  const l = cargarDatos().lecciones.porId["parasol-y-filtro-uv"];
  assert.equal(l.titulo, "Parasol y filtro UV");
  assert.equal(l.minutos, 2);
  assert.equal(l.para, "camara");
  const texto = textoDeLeccion(l);
  assert.ok(/parasol/i.test(texto) && texto.includes("UV"), "habla del parasol y del filtro UV");
  assert.deepEqual(dibujosDe(l), ["parasol"]);
});

prueba("glosario: los términos de las lecciones nuevas existen", () => {
  const g = cargarDatos().glosario;
  ["paso-de-luz", "parasol", "filtro-uv"].forEach((id) => {
    assert.ok(g[id] && g[id].termino && g[id].texto, "falta el término «" + id + "»");
  });
});

prueba("recetas: la lección de una variante tiene que existir", () => {
  let e = errores((c) => { c.recetas.luna.variantes[0].leccion = "no-existe"; });
  assert.ok(contiene(e, "leccion") && contiene(e, "no-existe"), e.join("\n"));
  e = errores((c) => { c.recetas.luna.variantes[0].leccion = 3; });
  assert.ok(contiene(e, "leccion"), e.join("\n"));
  const c = cargarDatos();
  let con = 0;
  Object.values(c.recetas).forEach((g) => (g.variantes || []).forEach((v) => {
    if (v.leccion === undefined) return;
    con++;
    assert.ok(c.lecciones.porId[v.leccion], "la variante «" + v.id + "» enlaza a «" + v.leccion + "», que no existe");
  }));
  assert.ok(con >= 7, "enlazan las variantes de cámara (" + con + ")");
  assert.equal(c.recetas.luna.variantes.find((v) => v.id === "camara-tele-tripode").leccion, "el-manual-de-verdad");
  [["amanecer", "toca-para-enfocar-y-exponer"], ["atardecer", "toca-para-enfocar-y-exponer"], ["luna", "luz-baja-y-modo-noche"]].forEach(([g, id]) =>
    assert.equal(c.recetas[g].variantes.find((v) => v.id === "movil").leccion, id, "la de móvil de " + g));
});
