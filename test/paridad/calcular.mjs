/*
 * Prueba de paridad: casos deterministas que se ejecutan con una «lógica» (la actual de js/ o la
 * nueva de src/) y devuelven resultados como datos simples.
 *
 *   node test/paridad/generar-referencia.mjs   guarda lo que da la lógica ACTUAL (js/) en referencia/
 *   test/paridad/paridad.test.js               comprueba que la lógica NUEVA (src/) da exactamente lo mismo
 *
 * Los casos no dependen de la hora ni del azar (el «azar» es un generador con semilla), pero sí de la
 * zona horaria: hay que ejecutarlo con TZ=Europe/Madrid.
 *
 * Las referencias se generaron con la lógica de js/ el 2026-11-20 y no se vuelven a generar salvo que
 * se decida cambiar un comportamiento a propósito (y entonces se dice en el commit).
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cargarDeDisco } from "../../scripts/datos-de-disco.mjs";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(aqui, "..", "..");
const HORA = 3600000;

/* ---------- Utilidades ---------- */

// Forma «canónica»: claves ordenadas, fechas en ISO, sin valores undefined. Así dos resultados
// iguales dan el mismo texto aunque las propiedades se hayan creado en otro orden.
function ordenar(x) {
  if (x instanceof Date) return Number.isNaN(x.getTime()) ? null : x.toISOString();
  if (Array.isArray(x)) return x.map(ordenar);
  if (x && typeof x === "object") {
    const o = {};
    Object.keys(x).sort().forEach((k) => { const v = ordenar(x[k]); if (v !== undefined) o[k] = v; });
    return o;
  }
  return typeof x === "number" && !Number.isFinite(x) ? null : x;
}
export const plano = (x) => JSON.parse(JSON.stringify(ordenar(x)) ?? "null");
const hash = (x) => createHash("sha256").update(JSON.stringify(ordenar(x)) ?? "undefined").digest("hex").slice(0, 16);

// Si una función falla, el mensaje del fallo también forma parte del resultado que se compara
function intentar(f) {
  try { return f(); } catch (e) { return { EXCEPCION: String(e && e.message) }; }
}
async function intentarAsync(f) {
  try { return await f(); } catch (e) { return { RECHAZADA: e && e.message !== undefined && !e.codigo ? String(e.message) : e }; }
}

// Generador de números con semilla (mulberry32)
function azarCon(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// De una lista de valores ordenados, solo dónde cambia el resultado: [[desde, resultado], ...]
function tramos(valores, f) {
  const salida = [];
  let anterior;
  valores.forEach((v, i) => {
    const r = f(v);
    if (i === 0 || r !== anterior) salida.push([v, r]);
    anterior = r;
  });
  return salida;
}
const paso = (desde, hasta, p) => { const xs = []; for (let i = 0; desde + i * p <= hasta + 1e-9; i++) xs.push(Number((desde + i * p).toFixed(6))); return xs; };

export const datosReales = () => cargarDeDisco();

/* ---------- Sol y luna ---------- */

const LUGARES = {
  vigo: [42.2406, -8.7207], madrid: [40.4168, -3.7038], tromso: [69.6492, 18.9553],
  quito: [-0.1807, -78.4678], sidney: [-33.8688, 151.2093], ushuaia: [-54.8019, -68.303]
};
const isoDia = (ms) => new Date(ms).toISOString().slice(0, 10);

function fechasDeAstro() {
  const s = new Set();
  for (let i = 0; i < 365; i += 3) s.add(isoDia(Date.UTC(2026, 0, 1) + i * 864e5));
  ["2026-03-20", "2026-03-28", "2026-03-29", "2026-03-30", "2026-06-21", "2026-09-23", "2026-10-24",
    "2026-10-25", "2026-10-26", "2026-12-21", "2026-12-31", "2027-01-01"].forEach((f) => s.add(f));
  return [...s].sort();
}

function astro({ Astro }) {
  const dias = fechasDeAstro();
  const salida = { version: Astro.version, vigo: {}, dias: {}, alturas: {} };
  Object.entries(LUGARES).forEach(([nombre, [lat, lon]]) => {
    const dia = (d) => intentar(() => Astro.calcularDia(new Date(d + "T12:00:00"), lat, lon));
    if (nombre === "vigo") dias.forEach((d) => { salida.vigo[d] = dia(d); });
    else salida.dias[nombre] = dias.map((d) => hash(dia(d)));
    salida.alturas[nombre] = dias.filter((_, i) => i % 5 === 0).map((d) =>
      [0, 6, 12, 18, 22].map((h) => hash(Astro.alturas(new Date(d + "T" + String(h).padStart(2, "0") + ":00:00"), lat, lon))));
  });
  salida.puntoCardinal = tramos(paso(-720, 720, 0.25), (g) => Astro.puntoCardinal(g));
  salida.idFase = tramos(paso(0, 1, 0.0005).concat([0.0299, 0.0301, 0.2199, 0.2201, 0.2799, 0.2801, 0.4699, 0.4701, 0.5299, 0.5301, 0.7199, 0.7201, 0.7799, 0.7801, 0.9699, 0.9701]).sort((a, b) => a - b), (f) => Astro.idFase(f));
  return plano(salida);
}

/* ---------- Semáforo ---------- */

// Lugares para las previsiones inventadas: [nombre, lat, lon, desfase en segundos]
const LUGARES_PREVISION = [
  ["vigo", 42.2406, -8.7207, 3600], ["madrid", 40.4168, -3.7038, 3600], ["tromso", 69.6492, 18.9553, 3600],
  ["quito", -0.1807, -78.4678, -18000], ["sidney", -33.8688, 151.2093, 39600], ["ushuaia", -54.8019, -68.303, -10800]
];

function hhmm(min) {
  const m = Math.max(0, Math.min(1439, Math.round(min)));
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}

// Respuesta con la forma de la de Open-Meteo, pero inventada y repetible. Repite situaciones límite:
// lluvia justo en los umbrales, niebla, tormenta, huecos (null) y campos que faltan.
export function previsionInventada(semilla, comun) {
  const azar = azarCon(semilla * 2654435761 + 7);
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));
  const elige = (xs) => xs[Math.floor(azar() * xs.length)];
  const limitar = (x) => Math.max(0, Math.min(100, x));
  const aprox = (x) => limitar(azar() < 0.7 ? Math.round(x / 5) * 5 : Math.round(x));
  const [nombre, lat, lon, desfase] = LUGARES_PREVISION[semilla % LUGARES_PREVISION.length];
  const ll = comun.lluvia;
  const lluvias = [0, ll.sinLluviaMm, ll.sinLluviaMm + 0.01, ll.lloviznaMm - 0.01, ll.lloviznaMm, ll.lloviznaMm + 0.01, ll.fuerteMm, ll.fuerteMm + 0.01];
  const nieblaM = comun.nieblaKm * 1000;
  const visibilidades = [100, 800, nieblaM - 1, nieblaM, nieblaM + 1, 5000, 10000, 24000, 30000];
  const sinCampo = { precipitation_probability: azar() < 0.08, weather_code: azar() < 0.08, visibility: azar() < 0.08, precipitation: azar() < 0.04 };
  const hueco = (v, p) => (azar() < p ? null : v);
  const inicio = Date.UTC(2026, 0, 1) + entre(0, 330) * 864e5;
  const dias = 5;

  const h = { time: [], cloud_cover: [], cloud_cover_low: [], cloud_cover_mid: [], cloud_cover_high: [], precipitation_probability: [], precipitation: [], visibility: [], weather_code: [] };
  for (let d = 0; d < dias; d++) {
    const regimen = entre(0, 5); // 0 despejado, 1 variable, 2 cubierto, 3 lluvia, 4 tormenta, 5 niebla
    for (let hora = 0; hora < 24; hora++) {
      const t = new Date(inicio + (d * 24 + hora) * HORA).toISOString().slice(0, 16);
      let b, m, a, lluvia = 0, prob = entre(0, 30), vis = elige(visibilidades.slice(5)), cod = elige([0, 1, 2, 3]);
      if (regimen === 0) { b = aprox(entre(0, 15)); m = aprox(entre(0, 15)); a = aprox(entre(0, 30)); }
      else if (regimen === 1) { b = aprox(entre(0, 100)); m = aprox(entre(0, 100)); a = aprox(entre(0, 100)); }
      else if (regimen === 2) { b = aprox(entre(60, 100)); m = aprox(entre(60, 100)); a = aprox(entre(40, 100)); cod = 3; }
      else if (regimen === 3) { b = aprox(entre(70, 100)); m = aprox(entre(70, 100)); a = aprox(entre(50, 100)); lluvia = elige(lluvias); prob = entre(40, 100); cod = elige([51, 61, 63, 65, 80]); }
      else if (regimen === 4) { b = aprox(entre(50, 100)); m = aprox(entre(50, 100)); a = aprox(entre(50, 100)); lluvia = elige(lluvias); prob = entre(50, 100); cod = elige([95, 96, 99, comun.lluvia.tormentaCodigo]); }
      else { b = aprox(entre(30, 100)); m = aprox(entre(0, 60)); a = aprox(entre(0, 60)); vis = elige(visibilidades.slice(0, 5)); cod = 45; }
      const total = limitar(Math.round((b + m + a) / 3 + entre(-15, 25)));
      h.time.push(t);
      h.cloud_cover.push(hueco(total, 0.01));
      h.cloud_cover_low.push(hueco(b, 0.02));
      h.cloud_cover_mid.push(m);
      h.cloud_cover_high.push(a);
      h.precipitation_probability.push(hueco(prob, 0.02));
      h.precipitation.push(hueco(lluvia, 0.02));
      h.visibility.push(hueco(vis, 0.02));
      h.weather_code.push(hueco(cod, 0.02));
    }
  }
  Object.keys(sinCampo).forEach((k) => { if (sinCampo[k]) delete h[k]; });

  const daily = { time: [], sunrise: [], sunset: [] };
  const amplitud = Math.min(1, Math.abs(lat) / 45) * (lat < 0 ? -1 : 1);
  for (let d = 0; d < dias; d++) {
    const f = new Date(inicio + d * 864e5);
    const doy = Math.floor((f.getTime() - Date.UTC(f.getUTCFullYear(), 0, 0)) / 864e5);
    const largo = Math.round(720 + 270 * amplitud * Math.sin(2 * Math.PI * (doy - 80) / 365));
    const mediodia = (((720 - lon * 4 + desfase / 60) % 1440) + 1440) % 1440;
    const dia = isoDia(f.getTime());
    daily.time.push(dia);
    daily.sunrise.push(dia + "T" + hhmm(mediodia - largo / 2));
    daily.sunset.push(dia + "T" + hhmm(mediodia + largo / 2));
  }
  return { datos: { timezone: nombre, utc_offset_seconds: desfase, hourly: h, daily }, lat, lon };
}

// Todo lo que se puede pedir al semáforo con una previsión, en orden fijo
function evaluaciones(S, prev, lat, lon) {
  const salida = [];
  prev.dias.forEach((dia) => salida.push(intentar(() => ({ e: S.evaluar("atardecer", prev, { dia }), v: S.ventana("atardecer", prev, { dia }) }))));
  for (let i = 0; i < prev.dias.length - 1; i++) {
    const inicio = prev.dias[i].puesta, fin = prev.dias[i + 1].amanecer;
    [0.02, 0.35, 0.8].forEach((fraccion) => [undefined, inicio + 4 * HORA].forEach((desde) => {
      salida.push(intentar(() => ({
        e: S.evaluar("luna", prev, { inicio, fin, lat, lon, fraccion, desde }),
        v: S.ventana("luna", prev, { inicio, fin, lat, lon, desde })
      })));
    }));
  }
  return salida;
}

const VARIANTES_DE_DATOS = {
  "luna-veto-moderada": (c) => { c.generos.luna.lluvia.vetoDesde = "moderada"; },
  "luna-veto-llovizna": (c) => { c.generos.luna.lluvia.vetoDesde = "llovizna"; c.generos.luna.lluvia.ambarSiLluviaDesde = "sin"; },
  "atardecer-ambar-con-llovizna": (c) => { c.generos.atardecer.ambarSiLluviaDesde = "llovizna"; },
  "atardecer-sin-vetos": (c) => { c.generos.atardecer.vetos = []; },
  "umbrales-de-lluvia": (c) => { Object.assign(c.comun.lluvia, { sinLluviaMm: 0.2, lloviznaMm: 1, fuerteMm: 3 }); },
  "niveles-del-semaforo": (c) => { Object.assign(c.comun.niveles, { verdeDesde: 90, ambarDesde: 40 }); }
};

function semaforo({ Semaforo }) {
  const config = datosReales();
  const S = Semaforo.crear(config);
  const [latV, lonV] = LUGARES.vigo;
  const salida = { fixture: {}, explicar: {}, sinteticas: [], variantes: {}, auxiliares: {} };

  // Una previsión real (guardada) con todos los resultados completos, para poder leerlos
  const real = JSON.parse(fs.readFileSync(path.join(RAIZ, "test", "e2e", "fixtures", "open-meteo-simulada.json"), "utf8"));
  const prev = S.prepararPrevision(real);
  salida.fixture.previsionPreparada = { dias: prev.dias, desfaseMs: prev.desfaseMs, horas: prev.horas.length, primeraHora: prev.horas[0], ultimaHora: prev.horas[prev.horas.length - 1] };
  salida.fixture.atardecer = prev.dias.map((dia) => ({ e: S.evaluar("atardecer", prev, { dia }), v: S.ventana("atardecer", prev, { dia }).length }));
  salida.fixture.luna = [];
  for (let i = 0; i < prev.dias.length - 1; i++) {
    const inicio = prev.dias[i].puesta, fin = prev.dias[i + 1].amanecer;
    salida.fixture.luna.push(S.evaluar("luna", prev, { inicio, fin, lat: latV, lon: lonV, fraccion: 0.6 }));
  }

  config.indice.orden.forEach((id) => { salida.explicar[id] = S.explicar(id); });
  salida.explicar.generoInexistente = intentar(() => S.explicar("nada"));
  salida.explicar.evaluarInexistente = intentar(() => S.evaluar("nada", prev, {}));

  const MM = paso(0, 12, 0.05);
  salida.auxiliares.nivelLluvia = tramos(MM, (mm) => S.nivelLluvia(mm));
  salida.auxiliares.describirTramo = [
    { desde: 20, hasta: 40 }, { desde: 20, menosDe: 40 }, { masDe: 20, hasta: 40 }, { menosDe: 20 }, { hasta: 20 }, { masDe: 20 }, { desde: 20 }, {}, { desde: 0.5, menosDe: 2.5 }
  ].map((t) => [Semaforo.describirTramo(t), Semaforo.describirTramo(t, " mm")]);
  salida.auxiliares.plantilla = [
    Semaforo.plantilla("Hoy es {dia}", { dia: "lunes" }), Semaforo.plantilla("{a} y {b}", { a: 1 }), Semaforo.plantilla("sin marcas", {}), Semaforo.plantilla("{x}{x}", { x: "ab" })
  ];

  // Muchas previsiones inventadas (una huella por cada una)
  for (let semilla = 1; semilla <= 120; semilla++) {
    const { datos, lat, lon } = previsionInventada(semilla, config.comun);
    const p = intentar(() => S.prepararPrevision(datos));
    salida.sinteticas.push(p.EXCEPCION ? ["prev", hash(p)] : [hash({ dias: p.dias, horas: p.horas, desfaseMs: p.desfaseMs }), ...evaluaciones(S, p, lat, lon).map(hash)]);
  }

  // Los mismos cálculos con otros datos (umbrales, vetos…), para que se prueben las demás ramas
  Object.entries(VARIANTES_DE_DATOS).forEach(([nombre, cambiar]) => {
    const c = structuredClone(config);
    cambiar(c);
    const Sv = Semaforo.crear(c);
    salida.variantes[nombre] = { explicar: config.indice.orden.map((id) => hash(Sv.explicar(id))), previsiones: [] };
    for (let semilla = 1; semilla <= 24; semilla++) {
      const { datos, lat, lon } = previsionInventada(semilla, c.comun);
      salida.variantes[nombre].previsiones.push(hash(evaluaciones(Sv, Sv.prepararPrevision(datos), lat, lon)));
    }
  });
  return plano(salida);
}

/* ---------- Validación de datos ---------- */

function* recorrer(x, ruta = []) {
  if (ruta.length) yield ruta;
  if (x && typeof x === "object") for (const k of Object.keys(x)) yield* recorrer(x[k], ruta.concat(k));
}

function mutar(config, ruta, tipo) {
  const c = structuredClone(config);
  const padre = ruta.slice(0, -1).reduce((o, k) => o[k], c);
  const k = ruta[ruta.length - 1];
  const valor = padre[k];
  if (tipo === "quitar") { if (Array.isArray(padre)) padre[k] = null; else delete padre[k]; }
  else if (tipo === "malo") padre[k] = typeof valor === "string" ? 123 : "no-valido";
  else if (tipo === "vacio") padre[k] = typeof valor === "string" ? "" : typeof valor === "number" ? -1 : Array.isArray(valor) ? [] : valor && typeof valor === "object" ? {} : null;
  return c;
}

function datos({ Datos, datosCargados }) {
  const config = datosReales();
  const salida = {
    reales: Datos.validar(config),
    constantes: { MOTORES: Datos.MOTORES, EVENTOS: Datos.EVENTOS, CAMPOS: Datos.CAMPOS, NIVELES_LLUVIA: Datos.NIVELES_LLUVIA, FASES: Datos.FASES },
    casosEscritos: {},
    mutaciones: {}
  };
  return Promise.resolve(datosCargados()).then((cargado) => {
    salida.cargadoIgualQueDeDisco = hash(cargado) === hash(config);
    [null, undefined, 5, "texto", [], {}, { comun: {} }, { comun: {}, indice: { orden: [] } }].forEach((x, i) => {
      salida.casosEscritos["entrada-" + i] = intentar(() => Datos.validar(x));
    });
    const ejemplos = {
      "umbral-de-nubes-fuera-de-orden": (c) => { c.generos.luna.nubes.verdeMenosDe = 90; },
      "motor-desconocido": (c) => { c.generos.luna.motor = "nada"; },
      "puntos-que-no-suman-100": (c) => { c.generos.atardecer.factores[0].max = 7; },
      "termino-de-glosario-que-no-existe": (c) => { c.recetas.comun.avisos[Object.keys(c.recetas.comun.avisos)[0]] = "Mira [[no-existe|esto]]"; },
      "genero-sin-receta": (c) => { delete c.recetas.luna; },
      "perfil-sin-nivel": (c) => { c.perfil.preguntas = c.perfil.preguntas.filter((q) => q.id !== "nivel"); }
    };
    Object.entries(ejemplos).forEach(([nombre, cambiar]) => { const c = structuredClone(config); cambiar(c); salida.casosEscritos[nombre] = intentar(() => Datos.validar(c)); });

    // Datos que la versión actual (js/) no conoce y que, por tanto, no valida: no se comparan sus mutaciones
    const NUEVOS = ["generos.luna.brujula"];
    for (const ruta of recorrer(config)) {
      if (NUEVOS.some((n) => ruta.join(".") === n || ruta.join(".").startsWith(n + "."))) continue;
      ["quitar", "malo", "vacio"].forEach((tipo) => {
        const errores = intentar(() => Datos.validar(mutar(config, ruta, tipo)));
        salida.mutaciones[ruta.join(".") + "#" + tipo] = Array.isArray(errores) ? errores.length + ":" + hash(errores) : "EXC:" + hash(errores);
      });
    }
    return plano(salida);
  });
}

/* ---------- Perfil y recetas ---------- */

const subconjuntos = (q) => { const ids = q.opciones.map((o) => o.id); return [[]].concat(ids.map((i) => [i]), [ids]); };
function producto(listas) { return listas.reduce((acc, l) => acc.flatMap((a) => l.map((x) => a.concat([x]))), [[]]); }

function perfilRecetas({ Perfil, Recetas }) {
  const config = datosReales();
  const def = config.perfil;
  const generos = config.indice.orden;
  const SEMAFOROS = ["verde", "ambar", "rojo", "ninguno", undefined];
  const salida = { clave: Perfil.CLAVE, combinaciones: [], ejemplos: {}, a_mano: {}, almacen: {}, textos: [] };

  const construirPerfil = (valores) => {
    let p = Perfil.nuevo(def);
    def.preguntas.forEach((q, i) => {
      if (Perfil.preguntasVisibles(def, p).includes(q)) p = Perfil.responder(def, p, q.id, valores[i]);
    });
    return p;
  };
  const todo = (p) => {
    const salidaP = { perfil: p, resumen: Perfil.resumen(def, p), configurado: Perfil.estaConfigurado(p), visibles: Perfil.preguntasVisibles(def, p).map((q) => q.id), efectivos: {}, recetas: {} };
    ["si", "no"].forEach((t) => {
      const ef = Perfil.efectivo(p, t);
      salidaP.efectivos[t] = ef;
      generos.forEach((g) => SEMAFOROS.forEach((s) => { salidaP.recetas[t + "/" + g + "/" + s] = intentar(() => Recetas.construir(config, g, ef, s)); }));
    });
    return salidaP;
  };

  const combos = producto(def.preguntas.map(subconjuntosOUnica)).map(construirPerfil);
  function subconjuntosOUnica(q) { return q.multiple ? subconjuntos(q) : q.opciones.map((o) => o.id); }
  combos.forEach((p, i) => {
    const r = todo(p);
    salida.combinaciones.push(hash(r));
    if (i % 90 === 0 || i === combos.length - 1) salida.ejemplos[i] = r;
  });

  // Situaciones escritas a mano
  const nuevo = Perfil.nuevo(def);
  salida.a_mano.nuevo = nuevo;
  salida.a_mano.soloNivel = todo(Perfil.responder(def, nuevo, "nivel", "controlo"));
  const camara = ["equipo=camara", "marca=nikon", "objetivos=tele,angular", "tripode=aveces", "nivel=defiendo"].reduce((p, x) => {
    const [id, v] = x.split("=");
    return Perfil.responder(def, p, id, id === "objetivos" ? v.split(",") : v);
  }, nuevo);
  salida.a_mano.camaraCompleta = todo(camara);
  salida.a_mano.deCamaraAMovil = todo(Perfil.responder(def, camara, "equipo", "movil"));
  salida.a_mano.respuestaInvalida = intentar(() => Perfil.responder(def, nuevo, "nivel", "experto"));
  salida.a_mano.preguntaDesconocida = intentar(() => Perfil.responder(def, nuevo, "color", "rojo"));
  salida.a_mano.multipleInvalida = intentar(() => Perfil.responder(def, camara, "objetivos", ["tele", "zoom"]));
  salida.a_mano.original = { nuevo, camara, copiaIntacta: JSON.stringify(camara) === JSON.stringify(Perfil.responder(def, camara, "nivel", "defiendo")) };
  salida.a_mano.efectivo = ["aveces", "si", "no"].map((t) => ["si", "no", undefined, "x"].map((h) => Perfil.efectivo(Object.assign({}, camara, { tripode: t }), h).tripode));
  salida.a_mano.normalizar = [null, undefined, 5, "x", {}, { equipo: "camara", marca: "zzz", objetivos: ["tele", "zzz"], tripode: "si", nivel: "controlo", respondidas: ["equipo", "zzz"] },
    { objetivos: "tele", respondidas: "equipo" }, camara].map((x) => Perfil.normalizar(def, x));
  salida.a_mano.recetaMarcaDesconocida = Recetas.construir(config, generos[0], Object.assign({}, Perfil.efectivo(camara, "si"), { marca: "zzz", nivel: "zzz" }), "verde");
  salida.a_mano.recetaGeneroDesconocido = Recetas.construir(config, "nada", Perfil.efectivo(camara, "si"), "verde");

  // Almacén de prueba (en memoria) y almacenes que fallan
  const memoria = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, m }; };
  const roto = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  const a1 = memoria();
  salida.almacen.existeVacio = Perfil.existe(a1);
  salida.almacen.cargarVacio = Perfil.cargar(def, a1);
  salida.almacen.guardar = Perfil.guardar(camara, a1);
  salida.almacen.guardado = a1.m.get(Perfil.CLAVE);
  salida.almacen.existeLleno = Perfil.existe(a1);
  salida.almacen.cargarLleno = Perfil.cargar(def, a1);
  const a2 = memoria(); a2.setItem(Perfil.CLAVE, "esto no es json");
  salida.almacen.cargarBasura = Perfil.cargar(def, a2);
  salida.almacen.rotoCargar = Perfil.cargar(def, roto);
  salida.almacen.rotoGuardar = Perfil.guardar(camara, roto);
  salida.almacen.rotoExiste = Perfil.existe(roto);

  // Recetas: trocear todos los textos de los datos
  const textos = [];
  const buscar = (x) => { if (typeof x === "string") textos.push(x); else if (x && typeof x === "object") Object.keys(x).forEach((k) => buscar(x[k])); };
  buscar(config.recetas); buscar(config.glosario);
  textos.push("", "sin marcas", "[[a|b]]", "antes [[a|b]] y [[c-d|e f]] después", "[[mal|]]", "[[Mayus|x]]", "[[a|b]][[c|d]]", "{Av} y {Tv}");
  salida.textos = textos.map((t) => hash({ partes: Recetas.partes(t), terminos: Recetas.terminosDe(t) }));
  salida.a_mano.partes = ["antes [[a|b]] y [[c-d|e f]] después", "[[a|b]][[c|d]]", "sin marcas", ""].map((t) => Recetas.partes(t));
  salida.a_mano.cumple = [
    [{ equipo: "camara" }, { equipo: "camara" }], [{ equipo: "camara" }, { equipo: "movil" }], [{ objetivos: "tele" }, { objetivos: ["kit", "tele"] }],
    [{ objetivos: "tele" }, { objetivos: [] }], [{}, { equipo: "movil" }], [{ equipo: "camara", tripode: "si" }, { equipo: "camara", tripode: "no" }]
  ].map(([si, p]) => Recetas.cumple(si, p));
  return plano(salida);
}

/* ---------- Lugar, proveedores y previsión (URL) ---------- */

const RESPUESTAS_NOMINATIM = [
  { address: { city: "Vigo", county: "Pontevedra", state: "Galicia", country: "España" } },
  { address: { town: "Baiona", state: "Galicia" } }, { address: { village: "Cangas", state: "Galicia" } },
  { address: { municipality: "Nigrán" } }, { address: { hamlet: "Aldea", region: "Región" } },
  { address: { suburb: "Barrio", state: "Barrio" } }, { address: { county: "Condado" } },
  { address: { city: "Madrid", state: "Madrid" } }, { address: { country: "España" } },
  { error: "Unable to geocode" }, null, undefined, {}, 5, "texto", { address: null }, { address: {} }
];
const RESPUESTAS_BUSQUEDA = [
  { results: [
    { name: "Vigo", latitude: 42.23282, longitude: -8.72264, country: "España", admin1: "Galicia", admin2: "Pontevedra" },
    { name: "Vigo", latitude: 42.23282, longitude: -8.72264, country: "España", admin1: "Galicia", admin2: "Pontevedra" },
    { name: "Vigo", latitude: 38.0, longitude: -121.0, country: "Estados Unidos", admin1: "California" },
    { name: "Madrid", latitude: 40.4, longitude: -3.7, country: "España", admin1: "Madrid", admin2: "Madrid" },
    { name: "SinCoordenadas", country: "España" }, { latitude: 1, longitude: 2 }, { name: "Texto", latitude: "1", longitude: "2" },
    { name: "Solo", latitude: 1, longitude: 2 }
  ] },
  { generationtime_ms: 1 }, { results: [] }, { results: null }, null, undefined, {}
];

async function lugar({ Lugar, urlPrevision }) {
  const salida = { urls: {}, nombres: {}, busqueda: {}, distancias: [], coordenadas: [], almacen: {}, red: {}, gps: {}, urlPrevision: [] };
  [[42.2406, -8.7207], [0, 0], [-33.8688, 151.2093], [42.23282, -8.72264], [89.999, -179.999], [1 / 3, 2 / 3]].forEach(([lat, lon]) => {
    salida.coordenadas.push(Lugar.coordenadas(lat, lon));
    salida.urls["nombre " + lat + "," + lon] = Lugar.urlNombre(lat, lon);
    salida.urlPrevision.push(urlPrevision(lat, lon));
  });
  ["vigo", "San Sebastián", "a&b=c", "  espacio  ", "ñandú", ""].forEach((t) => { salida.urls["busqueda " + t] = Lugar.urlBusqueda(t); });
  salida.nombres = RESPUESTAS_NOMINATIM.map((r) => Lugar.nombreDesdeRespuesta(r));
  salida.busqueda = RESPUESTAS_BUSQUEDA.map((r) => Lugar.resultadosDesdeRespuesta(r));
  const pares = [[[42.24, -8.72], [40.42, -3.7]], [[0, 0], [0, 0]], [[0, 0], [0, 180]], [[90, 0], [-90, 0]], [[42.24, -8.72], [42.43, -8.65]]];
  salida.distancias = pares.map(([a, b]) => Lugar.distanciaKm({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] }));

  // Almacén: localStorage global de mentira
  const m = new Map();
  const falso = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } };
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const poner = (v) => Object.defineProperty(globalThis, "localStorage", { value: v, configurable: true, writable: true });
  try {
    poner(falso);
    salida.almacen.vacio = Lugar.cargar();
    Lugar.guardar({ lat: 42.2406, lon: -8.7207, nombre: "Vigo, Galicia" });
    salida.almacen.guardado = [...m.entries()];
    salida.almacen.cargado = Lugar.cargar();
    m.set("luz-y-foto:lugar", JSON.stringify({ lat: "x", lon: 2 })); salida.almacen.latTexto = Lugar.cargar();
    m.set("luz-y-foto:lugar", "no es json"); salida.almacen.basura = Lugar.cargar();
    m.set("luz-y-foto:lugar", "null"); salida.almacen.nulo = Lugar.cargar();
    poner({ getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } });
    salida.almacen.rotoCargar = Lugar.cargar();
    salida.almacen.rotoGuardar = intentar(() => Lugar.guardar({ lat: 1, lon: 2 })) === undefined;
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original); else delete globalThis.localStorage;
  }

  // Red de mentira
  const fetchOriginal = globalThis.fetch;
  const llamadas = [];
  const simular = (respuestas) => { globalThis.fetch = async (url, opciones) => {
    llamadas.push({ url: String(url), conSenal: !!(opciones && opciones.signal), opciones: Object.keys(opciones || {}) });
    const r = respuestas.shift();
    if (r instanceof Error) throw r;
    return { ok: r.ok, status: r.status, json: async () => { if (r.jsonRoto) throw new SyntaxError("json roto"); return r.json; } };
  }; };
  try {
    simular([{ ok: true, status: 200, json: RESPUESTAS_NOMINATIM[0] }, { ok: false, status: 500 }, new Error("sin red"), { ok: true, status: 200, jsonRoto: true }, { ok: true, status: 200, json: { address: { country: "x" } } }]);
    salida.red.nombre = [];
    for (let i = 0; i < 5; i++) salida.red.nombre.push(await Lugar.nombreDeLugar(42.2406, -8.7207));
    simular([{ ok: true, status: 200, json: RESPUESTAS_BUSQUEDA[0] }, { ok: false, status: 429 }, new Error("sin red"), { ok: true, status: 200, json: { generationtime_ms: 1 } }]);
    salida.red.buscar = [];
    for (let i = 0; i < 4; i++) salida.red.buscar.push(await intentarAsync(() => Lugar.buscarCiudad("vigo")));
    salida.red.llamadas = llamadas;
  } finally { globalThis.fetch = fetchOriginal; }

  // GPS de mentira
  const navOriginal = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const conNavigator = async (nav, f) => {
    Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });
    try { return await f(); } finally { if (navOriginal) Object.defineProperty(globalThis, "navigator", navOriginal); else delete globalThis.navigator; }
  };
  const gps = (resultado, vistas) => ({ geolocation: { getCurrentPosition: (ok, fallo, opciones) => { vistas.push(opciones); if (resultado.coords) ok(resultado); else fallo(resultado); } } });
  const pedir = async (resultado, opciones) => { const vistas = []; const r = await conNavigator(gps(resultado, vistas), () => intentarAsync(() => Lugar.posicionGps(opciones))); return { r, opciones: vistas }; };
  salida.gps.ok = await pedir({ coords: { latitude: 42.2, longitude: -8.7 } });
  salida.gps.opcionesPropias = await pedir({ coords: { latitude: 1, longitude: 2 } }, { timeout: 5, enableHighAccuracy: true });
  salida.gps.denegado = await pedir({ code: 1 });
  salida.gps.tiempo = await pedir({ code: 3 });
  salida.gps.noDisponible = await pedir({ code: 2 });
  salida.gps.otroCodigo = await pedir({ code: 99 });
  salida.gps.sinGeolocalizacion = await conNavigator({}, () => intentarAsync(() => Lugar.posicionGps()));
  salida.gps.sinNavigator = await conNavigator(undefined, () => intentarAsync(() => Lugar.posicionGps()));
  return plano(salida);
}

/* ---------- Lógica de la pantalla (días, noches, pestaña por defecto, formato) ---------- */

function pantalla({ Semaforo, pantalla: P }) {
  const config = datosReales();
  const S = Semaforo.crear(config);
  const real = JSON.parse(fs.readFileSync(path.join(RAIZ, "test", "e2e", "fixtures", "open-meteo-simulada.json"), "utf8"));
  const generos = config.indice.orden;
  const INDICES = [config.indice, { ...config.indice, nocheDespuesPuestaMin: 0 }, { ...config.indice, nocheDespuesPuestaMin: 240 }];
  const salida = { formato: {}, fixture: {}, previsiones: [] };

  salida.formato.hm = [null, undefined, 0, 1e12, 1763560800000, Date.UTC(2026, 5, 1, 23, 59), NaN].map((x) => P.hm(x));
  salida.formato.pct = [0, 0.5, 1.5, 49.49, 49.5, 100, -0.4, 33.333, NaN].map((x) => P.pct(x));
  salida.formato.unida = ["", null, undefined, "nor-noreste", "a-b-c", "sin guiones"].map((x) => P.unida(x));
  salida.formato.mayus = ["", "lunes", "ñandú", "Ya", "x"].map((x) => P.mayus(x));

  const vista = (prev, ahora) => {
    const r = { ahora, fechaLugar: P.fechaLugar(ahora, prev), noches: P.nochesDe(prev, ahora), pestanas: INDICES.map((i) => P.pestanaPorDefecto(i, prev, ahora)), generos: {} };
    generos.forEach((id) => {
      const g = config.generos[id];
      const lista = P.listaDe(g, prev, ahora);
      r.generos[id] = { lista, etiquetas: lista.map((x) => intentar(() => P.etiquetaDia(g, x, prev, ahora))) };
    });
    return r;
  };
  const instantes = (prev) => prev.dias.flatMap((d) => [
    d.amanecer - HORA, d.amanecer, d.amanecer + 60000, d.puesta - 2 * HORA, d.puesta, d.puesta + 30 * 60000,
    d.puesta + config.indice.nocheDespuesPuestaMin * 60000 - 1, d.puesta + config.indice.nocheDespuesPuestaMin * 60000, d.puesta + config.indice.nocheDespuesPuestaMin * 60000 + 1
  ]);

  const prevReal = S.prepararPrevision(real);
  salida.fixture = vista(prevReal, Date.parse("2026-11-19T15:00:00+01:00"));
  salida.fixtureMuchasHoras = instantes(prevReal).map((a) => hash(vista(prevReal, a)));
  for (let semilla = 1; semilla <= 60; semilla++) {
    const { datos } = previsionInventada(semilla, config.comun);
    const prev = S.prepararPrevision(datos);
    salida.previsiones.push(instantes(prev).map((a) => hash(intentar(() => vista(prev, a)))));
  }
  return plano(salida);
}

/* ---------- Todo junto ---------- */

export const AREAS = { astro, semaforo, datos, "perfil-recetas": perfilRecetas, lugar, pantalla };

export async function calcularArea(nombre, logica) {
  return plano(await AREAS[nombre](logica));
}

// Escribe un JSON con una línea por cada clave de los dos primeros niveles (para que git muestre diferencias legibles)
export function serializar(x, nivel = 2, sangria = "") {
  if (nivel === 0 || x === null || typeof x !== "object" || Array.isArray(x)) return JSON.stringify(x);
  const dentro = sangria + " ";
  return "{\n" + Object.keys(x).map((k) => dentro + JSON.stringify(k) + ": " + serializar(x[k], nivel - 1, dentro)).join(",\n") + "\n" + sangria + "}";
}
