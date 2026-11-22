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
  assert.deepEqual(g.lecciones, ["la-rueda-de-modos", "el-manual-de-verdad", "parasol-y-filtro-uv"]);
});

prueba("lecciones: los grupos van en orden y «Para el móvil» va aparte, después de «Lo básico»", () => {
  const grupos = cargarDatos().lecciones.indice.grupos;
  assert.deepEqual(grupos.map((g) => g.id), ["basico", "movil", "tipos"]);
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
  assert.deepEqual(g.lecciones, ["fotografia-de-paisaje", "fotografia-deportiva"]);
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
