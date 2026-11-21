// Pruebas del semáforo. Se ejecutan con: npm test (o npx vitest run).
// Mismas comprobaciones que test/semaforo.test.cjs, pero sobre la lógica nueva (src/).
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco as cargarDatos } from "../../scripts/datos-de-disco.mjs";
import * as Astro from "../../src/nucleo/astro.js";
import * as Semaforo from "../../src/nucleo/semaforo.js";
import * as Datos from "../../src/nucleo/datos.js";

// El semáforo se prueba con los datos reales de data/, así que si se cambia un umbral aquí se nota
const S = Semaforo.crear(cargarDatos());
const ventanaAtardecer = (p, dia) => S.ventana("atardecer", p, { dia });
const ventanaLuna = (p, inicio, fin, lat, lon, desde) => S.ventana("luna", p, { inicio, fin, lat, lon, desde });
const puntuarAtardecer = (p, dia) => S.evaluar("atardecer", p, { dia });
const puntuarLuna = (p, inicio, fin, lat, lon, fraccion, desde) => S.evaluar("luna", p, { inicio, fin, lat, lon, fraccion, desde });

const LAT = 42.2406, LON = -8.7207; // Vigo
const prueba = it;

// Construye una respuesta con la misma forma que la de Open-Meteo (horas locales, UTC+1 en noviembre).
// `base` da los valores por defecto y `cambios(horaLocalISO)` devuelve cambios para una hora concreta.
function respuesta(diaInicial, dias, base, cambios) {
  const tiempo = [], campos = ["cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
    "precipitation_probability", "precipitation", "visibility", "weather_code"];
  const h = Object.fromEntries(campos.map((c) => [c, []]));
  const d0 = new Date(diaInicial + "T00:00:00Z");
  for (let i = 0; i < dias * 24; i++) {
    const iso = new Date(d0.getTime() + i * 3600000).toISOString().slice(0, 16);
    tiempo.push(iso);
    const v = { total: 50, bajas: 10, medias: 40, altas: 40, prob: 20, lluvia: 0, vis: 25000, codigo: 3, ...base, ...(cambios ? cambios(iso) : {}) };
    h.cloud_cover.push(v.total); h.cloud_cover_low.push(v.bajas); h.cloud_cover_mid.push(v.medias);
    h.cloud_cover_high.push(v.altas); h.precipitation_probability.push(v.prob);
    h.precipitation.push(v.lluvia); h.visibility.push(v.vis); h.weather_code.push(v.codigo);
  }
  const hhmm = (d) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  const daily = { time: [], sunrise: [], sunset: [] };
  for (let i = 0; i < dias; i++) {
    const f = new Date(d0.getTime() + i * 86400000);
    const dia = f.toISOString().slice(0, 10);
    const t = Astro.calcularDia(new Date(dia + "T12:00:00"), LAT, LON).sol;
    daily.time.push(dia);
    daily.sunrise.push(dia + "T" + hhmm(t.amanecer));
    daily.sunset.push(dia + "T" + hhmm(t.puesta));
  }
  return { utc_offset_seconds: 3600, hourly: { time: tiempo, ...h }, daily };
}

const ATARDECER = (datos) => {
  const p = S.prepararPrevision(datos);
  return { p, r: puntuarAtardecer(p, p.dias[1]) }; // día 2 de la respuesta
};
const horaDe = (iso) => Number(iso.slice(11, 13));
const esDia = (iso, n) => iso.slice(0, 10) === ["2026-11-17", "2026-11-18", "2026-11-19"][n];

/* ---------- Conversión de horas ---------- */

prueba("las horas del lugar se convierten a instantes reales", () => {
  const p = S.prepararPrevision(respuesta("2026-11-18", 2, {}));
  assert.equal(new Date(p.horas[0].t).toISOString(), "2026-11-17T23:00:00.000Z"); // 00:00 local = 23:00 UTC
  const puesta = new Date(p.dias[0].puesta);
  assert.equal(puesta.toISOString().slice(11, 16), "17:10"); // 18:10 local
});

/* ---------- Atardecer ---------- */

prueba("atardecer: nubes altas moderadas, aire limpio y sin lluvia da verde", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, lluvia: 0 }));
  assert.equal(r.nivel, "verde");
  assert.ok(r.total >= 70, "puntos " + r.total);
});

prueba("atardecer: cielo bajo cerrado es rojo con motivo", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 95, medias: 40, altas: 50 }));
  assert.equal(r.nivel, "rojo");
  assert.match(r.motivoVeto, /cielo bajo/);
});

prueba("atardecer: lluvia fuerte es rojo; llovizna no lo es", () => {
  const fuerte = ATARDECER(respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, lluvia: 4 })).r;
  assert.equal(fuerte.nivel, "rojo");
  const lloviznando = ATARDECER(respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, lluvia: 0.3, prob: 100 })).r;
  assert.notEqual(lloviznando.nivel, "rojo");
  assert.ok(lloviznando.avisos.some((a) => /llovizna/.test(a)));
});

prueba("atardecer: la probabilidad de lluvia sola ya no veta", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 30, medias: 30, altas: 50, lluvia: 0, prob: 100 }));
  assert.notEqual(r.nivel, "rojo");
});

prueba("atardecer: lluvia moderada limita a ámbar", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, lluvia: 1.5 }));
  assert.equal(r.nivel, "ambar");
});

prueba("atardecer: tormenta eléctrica es ámbar con aviso de seguridad", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, codigo: 95 }));
  assert.equal(r.nivel, "ambar");
  assert.ok(r.avisos.some((a) => /tormenta eléctrica/.test(a)));
});

prueba("atardecer: niebla avisa", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, vis: 2000 }));
  assert.ok(r.avisos.some((a) => /niebla/.test(a)));
});

/* ---------- Niebla como ventaja (nieblaVentaja) ---------- */

// Un motor sobre una copia de los datos reales en la que el atardecer pide la niebla como ventaja del factor de nubes bajas.
// Así se prueba el motor por sí solo, sin depender del género Amanecer.
const FRASE_NIEBLA = "Niebla baja: no verás salir el sol, pero puede dar buenas fotos.";
const configNiebla = structuredClone(cargarDatos());
configNiebla.generos.atardecer.nieblaVentaja = { factor: "bajas", frase: FRASE_NIEBLA };
const SN = Semaforo.crear(configNiebla);
const conNiebla = (cambios) => { const p = SN.prepararPrevision(respuesta("2026-11-18", 3, { medias: 30, altas: 50, ...cambios })); return SN.evaluar("atardecer", p, { dia: p.dias[1] }); };
const factorBajas = (r) => r.factores.find((f) => f.id === "bajas");

prueba("niebla ventaja: con niebla el factor de nubes bajas da su máximo y no veta", () => {
  const r = conNiebla({ bajas: 95, vis: 2000 });
  assert.equal(factorBajas(r).puntos, 40);
  assert.equal(factorBajas(r).frase, FRASE_NIEBLA);
  assert.notEqual(r.nivel, "rojo");
  assert.equal(r.motivoVeto, null);
  assert.ok(r.avisos.includes(configNiebla.generos.atardecer.avisoNiebla));
});

prueba("niebla ventaja: sin niebla el mismo cielo cerrado sigue vetando", () => {
  assert.equal(conNiebla({ bajas: 95, vis: 25000 }).nivel, "rojo");
});

prueba("niebla ventaja: la lluvia fuerte con niebla sigue vetando", () => {
  const r = conNiebla({ bajas: 95, vis: 2000, lluvia: 10 });
  assert.equal(r.nivel, "rojo");
  assert.match(r.motivoVeto, /lluvia fuerte/);
});

prueba("niebla ventaja: la tormenta con niebla sigue en ámbar con su aviso", () => {
  const r = conNiebla({ vis: 2000, codigo: 95 });
  assert.equal(r.nivel, "ambar");
  assert.ok(r.avisos.includes(configNiebla.comun.avisos.tormenta));
});

prueba("el atardecer real no cambia con niebla", () => {
  const { r } = ATARDECER(respuesta("2026-11-18", 3, { bajas: 95, medias: 30, altas: 50, vis: 2000 }));
  assert.equal(r.nivel, "rojo");
  assert.equal(factorBajas(r).puntos, 4);
});

prueba("explicar: un género con nieblaVentaja lo cuenta", () => {
  const con = SN.explicar("atardecer").filter((l) => /niebla/.test(l));
  assert.equal(con.length, 1, con.join(" | "));
  assert.match(con[0], /Nubes bajas/);
  assert.match(con[0], /40/);
  assert.equal(S.explicar("atardecer").filter((l) => /niebla/.test(l)).length, 0);
});

prueba("atardecer: la ventana son las horas de 17 a 18 más la de las 18 (1 h antes a 30 min después)", () => {
  const p = S.prepararPrevision(respuesta("2026-11-18", 3, {}));
  const horas = ventanaAtardecer(p, p.dias[1]).map((x) => new Date(x.t + 3600000).toISOString().slice(11, 13));
  assert.deepEqual(horas, ["17", "18"]);
});

prueba("atardecer: con el caso real del 19 de noviembre (llovizna y cielo bajo) no hay veto", () => {
  // Valores reales de Open-Meteo para Vigo, 19-nov 17:00 y 18:00 (bajas 72/71, medias 45/49, altas 0/0)
  const datos = respuesta("2026-11-18", 3, {}, (iso) => {
    if (iso === "2026-11-19T17:00") return { bajas: 72, medias: 45, altas: 0, lluvia: 0.2, prob: 95 };
    if (iso === "2026-11-19T18:00") return { bajas: 71, medias: 49, altas: 0, lluvia: 0.2, prob: 93 };
    return {};
  });
  const r = puntuarAtardecer(S.prepararPrevision(datos), S.prepararPrevision(datos).dias[1]);
  assert.equal(r.motivoVeto, null);
  assert.ok(["ambar", "rojo"].includes(r.nivel));
});

/* ---------- Luna ---------- */

// Noche del 18 de noviembre: de la puesta del 18 al amanecer del 19
function nocheDel(datos, i) {
  const p = S.prepararPrevision(datos);
  return { p, inicio: p.dias[i].puesta, fin: p.dias[i + 1].amanecer };
}
const LUNA = (datos, fraccion = 0.62, i = 1) => {
  const { p, inicio, fin } = nocheDel(datos, i);
  return puntuarLuna(p, inicio, fin, LAT, LON, fraccion);
};

prueba("luna: la noche del 18 de noviembre hay ventana de luna alta (de 19:00 a 00:00 aprox.)", () => {
  const { p, inicio, fin } = nocheDel(respuesta("2026-11-17", 4, {}), 1);
  const h = ventanaLuna(p, inicio, fin, LAT, LON).map((x) => new Date(x.t + 3600000).getUTCHours());
  assert.ok(h.length >= 4 && h.length <= 8, "horas: " + h.join(","));
  assert.ok(h.includes(21), "debería incluir las 21:00");
});

prueba("luna: cielo despejado es verde", () => {
  const r = LUNA(respuesta("2026-11-17", 4, { total: 10 }));
  assert.equal(r.nivel, "verde");
  assert.equal(r.nubes, 10);
});

prueba("luna: nubes intermedias es ámbar y cielo cubierto es rojo", () => {
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 45 })).nivel, "ambar");
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 90 })).nivel, "rojo");
});

prueba("luna: el umbral es 30 % verde, 60 % ámbar", () => {
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 29 })).nivel, "verde");
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 30 })).nivel, "ambar");
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 60 })).nivel, "ambar");
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 61 })).nivel, "rojo");
});

prueba("luna: elige como mejor hora la de menos nubes", () => {
  const datos = respuesta("2026-11-17", 4, { total: 80 }, (iso) => iso === "2026-11-18T22:00" ? { total: 5 } : {});
  const r = LUNA(datos);
  assert.equal(r.nivel, "verde");
  assert.equal(new Date(r.mejorHora + 3600000).getUTCHours(), 22);
});

prueba("luna: lluvia fuerte todo el rato es rojo; llovizna no", () => {
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 10, lluvia: 5 })).nivel, "rojo");
  const llov = LUNA(respuesta("2026-11-17", 4, { total: 10, lluvia: 0.3 }));
  assert.equal(llov.nivel, "verde");
  assert.ok(llov.avisos.some((a) => /llovizna/.test(a)));
});

prueba("luna: una hora de lluvia fuerte no cuenta como mejor hora", () => {
  const datos = respuesta("2026-11-17", 4, { total: 70 }, (iso) => iso === "2026-11-18T22:00" ? { total: 0, lluvia: 6 } : {});
  const r = LUNA(datos);
  assert.notEqual(new Date(r.mejorHora + 3600000).getUTCHours(), 22);
});

prueba("luna: lluvia moderada limita a ámbar", () => {
  assert.equal(LUNA(respuesta("2026-11-17", 4, { total: 10, lluvia: 1.5 })).nivel, "ambar");
});

prueba("luna: tormenta eléctrica nunca es verde y lleva aviso", () => {
  const r = LUNA(respuesta("2026-11-17", 4, { total: 10, codigo: 96 }));
  assert.equal(r.nivel, "ambar");
  assert.ok(r.avisos.some((a) => /tormenta eléctrica/.test(a)));
});

prueba("luna: luna nueva no tiene semáforo", () => {
  const r = LUNA(respuesta("2026-11-17", 4, { total: 10 }), 0.01);
  assert.equal(r.nivel, "ninguno");
  assert.match(r.motivo, /nueva/);
});

prueba("luna: existe alguna noche sin luna alta y entonces no hay semáforo", () => {
  const datos = respuesta("2026-12-08", 5, { total: 10 });
  const p = S.prepararPrevision(datos);
  const sinLuna = [];
  for (let i = 0; i < 4; i++) {
    const r = puntuarLuna(p, p.dias[i].puesta, p.dias[i + 1].amanecer, LAT, LON, 0.3);
    if (r.nivel === "ninguno") sinLuna.push(p.dias[i].fecha);
  }
  assert.ok(sinLuna.length >= 1, "ninguna noche sin luna entre el 8 y el 12 de diciembre");
  console.log("       noches sin luna alta:", sinLuna.join(", "));
});

prueba("luna: las horas que ya pasaron se descartan", () => {
  const datos = respuesta("2026-11-17", 4, { total: 10 });
  const { p, inicio, fin } = nocheDel(datos, 1);
  const sinFiltro = ventanaLuna(p, inicio, fin, LAT, LON).length;
  const desde = Date.parse("2026-11-18T22:30:00Z"); // 23:30 locales
  const con = ventanaLuna(p, inicio, fin, LAT, LON, desde).length;
  assert.ok(con < sinFiltro && con >= 1, sinFiltro + " -> " + con);
});

prueba("luna: nunca devuelve un nivel fuera de los permitidos", () => {
  for (let n = 0; n <= 100; n += 10) {
    const r = LUNA(respuesta("2026-11-17", 4, { total: n }));
    assert.ok(["verde", "ambar", "rojo", "ninguno"].includes(r.nivel), "nubes " + n + " -> " + r.nivel);
  }
});

prueba("luna: si ya pasó toda la luna alta de la noche en curso se dice que ya pasó", () => {
  const datos = respuesta("2026-11-17", 4, { total: 10 });
  const { p, inicio, fin } = nocheDel(datos, 1);
  const tarde = Date.parse("2026-11-19T01:30:00Z"); // 02:30 locales del día 19, luna ya baja
  const r = puntuarLuna(p, inicio, fin, LAT, LON, 0.62, tarde);
  assert.equal(r.nivel, "ninguno");
  assert.equal(r.yaPaso, true);
  assert.match(r.motivo, /Ya no quedan/);
});

/* ---------- Los datos mandan ---------- */

const copia = (x) => JSON.parse(JSON.stringify(x));

prueba("datos: cambiar un umbral en data/ cambia el resultado (sin tocar código)", () => {
  const cfg = cargarDatos();
  const datos = respuesta("2026-11-17", 4, { total: 45 });
  const antes = Semaforo.crear(cfg);
  const p = antes.prepararPrevision(datos);
  const ev = (S2) => S2.evaluar("luna", p, { inicio: p.dias[1].puesta, fin: p.dias[2].amanecer, lat: LAT, lon: LON, fraccion: 0.62 });
  assert.equal(ev(antes).nivel, "ambar");           // 45 % está entre 30 y 60
  cfg.generos.luna.nubes.verdeMenosDe = 50;         // más permisivo
  assert.equal(ev(Semaforo.crear(cfg)).nivel, "verde");
  cfg.generos.luna.nubes.ambarHasta = 40; cfg.generos.luna.nubes.verdeMenosDe = 30;
  assert.equal(ev(Semaforo.crear(cfg)).nivel, "rojo"); // más estricto
});

prueba("datos: cambiar los puntos del atardecer cambia la nota", () => {
  const cfg = cargarDatos();
  const datos = respuesta("2026-11-18", 3, { bajas: 10, medias: 30, altas: 50, lluvia: 0 });
  const nota = (c) => { const S2 = Semaforo.crear(c); const p = S2.prepararPrevision(datos); return S2.evaluar("atardecer", p, { dia: p.dias[1] }).total; };
  const antes = nota(cfg);
  cfg.generos.atardecer.factores[0].tramos[0].puntos = 30; // bajas < 20 %: de 40 a 30 puntos
  assert.equal(nota(cfg), antes - 10);
});

prueba("datos: la explicación en palabras sale de los mismos datos", () => {
  const cfg = cargarDatos();
  const texto = Semaforo.crear(cfg).explicar("atardecer").join(" ");
  assert.match(texto, /Nubes bajas \(hasta 40 puntos\): menos de 20 % da 40/);
  assert.match(texto, /de 20 a 40 % da 28/);
  assert.match(texto, /por encima de 88 %/);
  cfg.generos.atardecer.vetos[1].masDe = 95;
  assert.match(Semaforo.crear(cfg).explicar("atardecer").join(" "), /por encima de 95 %/);
  assert.match(Semaforo.crear(cfg).explicar("luna").join(" "), /menos de 30 % es verde/);
});

prueba("datos: un género NUEVO (amanecer) se añade solo con datos", () => {
  const cfg = cargarDatos();
  const amanecer = copia(cfg.generos.atardecer);
  Object.assign(amanecer, {
    id: "amanecer", nombre: "Amanecer", evento: "amanecer", eventoNombre: "el amanecer",
    textoEvento: "Amanecer a las {hora}", textoBrujula: "Al amanecer, mira hacia el {direccion} ({grados}°).",
    avisoNiebla: "Hay niebla al amanecer."
  });
  amanecer.vetos[0].motivo = "Se espera lluvia fuerte al amanecer.";
  cfg.generos.amanecer = amanecer;
  cfg.indice.orden.push("amanecer");
  cfg.recetas.amanecer = copia(cfg.recetas.atardecer); // cada género necesita también su receta
  assert.deepEqual(Datos.validar(cfg), [], "el género nuevo debería ser válido");

  const S2 = Semaforo.crear(cfg);
  const p = S2.prepararPrevision(respuesta("2026-11-17", 4, { bajas: 10, medias: 30, altas: 50 }));
  const horas = S2.ventana("amanecer", p, { dia: p.dias[1] }).map((x) => new Date(x.t + 3600000).getUTCHours());
  assert.deepEqual(horas, [7, 8], "ventana alrededor del amanecer (08:28 local)");
  const r = S2.evaluar("amanecer", p, { dia: p.dias[1] });
  assert.equal(r.genero, "amanecer");
  assert.equal(r.nivel, "verde");
  assert.equal(r.titulo, "Prometedor");
});

prueba("tramos: descripción en palabras", () => {
  assert.equal(Semaforo.describirTramo({ menosDe: 20 }), "menos de 20 %");
  assert.equal(Semaforo.describirTramo({ desde: 20, hasta: 70 }), "de 20 a 70 %");
  assert.equal(Semaforo.describirTramo({ desde: 10, menosDe: 20 }), "de 10 % a menos de 20 %");
  assert.equal(Semaforo.describirTramo({ masDe: 70, hasta: 85 }), "más de 70 % y hasta 85 %");
  assert.equal(Semaforo.describirTramo({}), "el resto");
});

prueba("género inexistente da un error claro", () => {
  assert.throws(() => S.evaluar("surf", {}, {}), /No existe el género «surf»/);
});

