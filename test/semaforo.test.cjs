// Pruebas del semáforo. Se ejecutan con: TZ=Europe/Madrid node test/semaforo.test.cjs
const assert = require("node:assert/strict");
const Astro = require("../js/astro.js");
const S = require("../js/semaforo.js");

const LAT = 42.2406, LON = -8.7207; // Vigo
let fallos = 0;
const prueba = (nombre, fn) => {
  try { fn(); console.log("ok   ", nombre); }
  catch (e) { fallos++; console.log("FALLA", nombre, "->", e.message); }
};

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
  return { p, r: S.puntuarAtardecer(p, p.dias[1]) }; // día 2 de la respuesta
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

prueba("atardecer: la ventana son las horas de 17 a 18 más la de las 18 (1 h antes a 30 min después)", () => {
  const p = S.prepararPrevision(respuesta("2026-11-18", 3, {}));
  const horas = S.ventanaAtardecer(p, p.dias[1]).map((x) => new Date(x.t + 3600000).toISOString().slice(11, 13));
  assert.deepEqual(horas, ["17", "18"]);
});

prueba("atardecer: con el caso real del 19 de noviembre (llovizna y cielo bajo) no hay veto", () => {
  // Valores reales de Open-Meteo para Vigo, 19-nov 17:00 y 18:00 (bajas 72/71, medias 45/49, altas 0/0)
  const datos = respuesta("2026-11-18", 3, {}, (iso) => {
    if (iso === "2026-11-19T17:00") return { bajas: 72, medias: 45, altas: 0, lluvia: 0.2, prob: 95 };
    if (iso === "2026-11-19T18:00") return { bajas: 71, medias: 49, altas: 0, lluvia: 0.2, prob: 93 };
    return {};
  });
  const r = S.puntuarAtardecer(S.prepararPrevision(datos), S.prepararPrevision(datos).dias[1]);
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
  return S.puntuarLuna(p, inicio, fin, LAT, LON, fraccion);
};

prueba("luna: la noche del 18 de noviembre hay ventana de luna alta (de 19:00 a 00:00 aprox.)", () => {
  const { p, inicio, fin } = nocheDel(respuesta("2026-11-17", 4, {}), 1);
  const h = S.ventanaLuna(p, inicio, fin, LAT, LON).map((x) => new Date(x.t + 3600000).getUTCHours());
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
    const r = S.puntuarLuna(p, p.dias[i].puesta, p.dias[i + 1].amanecer, LAT, LON, 0.3);
    if (r.nivel === "ninguno") sinLuna.push(p.dias[i].fecha);
  }
  assert.ok(sinLuna.length >= 1, "ninguna noche sin luna entre el 8 y el 12 de diciembre");
  console.log("       noches sin luna alta:", sinLuna.join(", "));
});

prueba("luna: las horas que ya pasaron se descartan", () => {
  const datos = respuesta("2026-11-17", 4, { total: 10 });
  const { p, inicio, fin } = nocheDel(datos, 1);
  const sinFiltro = S.ventanaLuna(p, inicio, fin, LAT, LON).length;
  const desde = Date.parse("2026-11-18T22:30:00Z"); // 23:30 locales
  const con = S.ventanaLuna(p, inicio, fin, LAT, LON, desde).length;
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
  const r = S.puntuarLuna(p, inicio, fin, LAT, LON, 0.62, tarde);
  assert.equal(r.nivel, "ninguno");
  assert.equal(r.yaPaso, true);
  assert.match(r.motivo, /Ya no quedan/);
});

console.log(fallos ? "\n" + fallos + " prueba(s) con fallo" : "\nTodo correcto");
process.exit(fallos ? 1 : 0);
