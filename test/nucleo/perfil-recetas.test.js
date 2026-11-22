// Pruebas del perfil de equipo y de las recetas. Se ejecutan con: npm test (o npx vitest run).
// Mismas comprobaciones que test/perfil-recetas.test.cjs, pero sobre la lógica nueva (src/).
import assert from "node:assert/strict";
import { it } from "vitest";
import { cargarDeDisco as cargarDatos } from "../../scripts/datos-de-disco.mjs";
import * as Perfil from "../../src/nucleo/perfil.js";
import * as Recetas from "../../src/nucleo/recetas.js";

const prueba = it;
const cfg = cargarDatos();
const def = cfg.perfil;
const almacenFalso = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, m }; };
const camara = (extra) => {
  let p = Perfil.nuevo(def);
  p = Perfil.responder(def, p, "equipo", "camara");
  Object.keys(extra || {}).forEach((k) => { p = Perfil.responder(def, p, k, extra[k]); });
  return p;
};
const receta = (genero, perfil, tripodeHoy, semaforo) => Recetas.construir(cfg, genero, Perfil.efectivo(perfil, tripodeHoy), semaforo);

/* ---------- Perfil ---------- */

prueba("perfil nuevo: valores por defecto y sin configurar", () => {
  const p = Perfil.nuevo(def);
  assert.equal(p.equipo, "movil");
  assert.equal(p.nivel, "empiezo");
  assert.equal(Perfil.estaConfigurado(p), false);
});

prueba("preguntas: con móvil no se pregunta marca ni objetivos; con cámara sí", () => {
  const ids = (p) => Perfil.preguntasVisibles(def, p).map((q) => q.id);
  assert.deepEqual(ids(Perfil.nuevo(def)), ["equipo", "tripode", "nivel"]);
  assert.deepEqual(ids(camara()), ["equipo", "marca", "objetivos", "tripode", "nivel"]);
});

prueba("cambiar de cámara a móvil borra marca y objetivos", () => {
  let p = camara({ marca: "nikon", objetivos: ["tele"] });
  p = Perfil.responder(def, p, "equipo", "movil");
  assert.equal(p.marca, "desconocida");
  assert.deepEqual(p.objetivos, []);
  assert.ok(!p.respondidas.includes("marca"));
});

prueba("normalizar: ignora valores inválidos y mantiene los buenos", () => {
  const p = Perfil.normalizar(def, { equipo: "camara", marca: "pentax", objetivos: ["tele", "raro"], tripode: "aveces", nivel: 7, respondidas: ["equipo", "zzz"] });
  assert.equal(p.equipo, "camara");
  assert.equal(p.marca, "desconocida");
  assert.deepEqual(p.objetivos, ["tele"]);
  assert.equal(p.tripode, "aveces");
  assert.equal(p.nivel, "empiezo");
  assert.deepEqual(p.respondidas, ["equipo"]);
});

prueba("guardar y cargar: ida y vuelta; si falla el almacén o está roto, perfil nuevo", () => {
  const a = almacenFalso();
  const p = camara({ marca: "sony", nivel: "controlo" });
  assert.equal(Perfil.guardar(p, a), true);
  assert.deepEqual(Perfil.cargar(def, a), p);
  a.m[Perfil.CLAVE] = "{roto";
  assert.deepEqual(Perfil.cargar(def, a), Perfil.nuevo(def));
  assert.equal(Perfil.guardar(p, { setItem() { throw new Error("bloqueado"); } }), false);
  assert.deepEqual(Perfil.cargar(def, { getItem() { throw new Error("bloqueado"); } }), Perfil.nuevo(def));
});

prueba("trípode «a veces» depende del interruptor de hoy", () => {
  const p = camara({ tripode: "aveces" });
  assert.equal(Perfil.efectivo(p, "si").tripode, "si");
  assert.equal(Perfil.efectivo(p, "no").tripode, "no");
  assert.equal(Perfil.efectivo(p, undefined).tripode, "no");
  assert.equal(Perfil.efectivo(camara({ tripode: "si" }), "no").tripode, "si");
});

prueba("existe(): falso hasta que se guarda; resumen con los textos elegidos", () => {
  const a = almacenFalso();
  assert.equal(Perfil.existe(a), false);
  Perfil.guardar(Perfil.nuevo(def), a);
  assert.equal(Perfil.existe(a), true);
  assert.equal(Perfil.resumen(def, Perfil.nuevo(def)), "", "sin responder no hay resumen");
  const p = camara({ marca: "canon", objetivos: ["kit", "tele"], tripode: "aveces", nivel: "defiendo" });
  assert.equal(Perfil.resumen(def, p), "Con una cámara · Canon · El de kit (18-55 o parecido), Un teleobjetivo (200 mm o más) · A veces · Nivel medio");
  assert.equal(Perfil.existe({ getItem() { throw new Error("x"); } }), false);
});

prueba("niveles: Principiante, Medio y Experto (los ids no cambian: los perfiles guardados siguen valiendo)", () => {
  const q = def.preguntas.find((x) => x.id === "nivel");
  assert.deepEqual(q.opciones.map((o) => [o.id, o.texto]), [["empiezo", "Principiante"], ["defiendo", "Medio"], ["controlo", "Experto"]]);
  // en la línea de «Mi equipo» el nivel lleva la palabra «Nivel», para que se entienda fuera de la pregunta
  assert.equal(Perfil.resumen(def, camara({ nivel: "controlo" })), "Con una cámara · Nivel experto");
  assert.equal(Perfil.resumen(def, camara({ nivel: "empiezo" })), "Con una cámara · Nivel principiante");
});

/* ---------- Recetas ---------- */

prueba("sin configurar (móvil por defecto): receta de móvil con textos de «Principiante»", () => {
  const r = receta("atardecer", Perfil.nuevo(def));
  assert.equal(r.id, "movil");
  assert.match(r.pasos[0].texto, /^Toca en la pantalla/);
  assert.equal(r.avisos.length, 2, "móvil: sin aviso de formato RAW/JPEG");
});

prueba("atardecer con cámara: con trípode f/11 e ISO 100; sin trípode f/8 e ISO automático", () => {
  const con = receta("atardecer", camara({ tripode: "si", nivel: "controlo" }));
  const sin = receta("atardecer", camara({ tripode: "no", nivel: "controlo" }));
  assert.equal(con.id, "camara-tripode");
  assert.ok(con.pasos.some((p) => p.texto === "f/11") && con.pasos.some((p) => p.texto === "ISO 100"));
  assert.equal(sin.id, "camara-sin-tripode");
  assert.ok(sin.pasos.some((p) => p.texto === "f/8") && sin.pasos.some((p) => /ISO auto/.test(p.texto)));
  assert.match(sin.nota, /1,6/);
});

prueba("los tres niveles escriben el mismo paso con distinta explicación", () => {
  const t = (nivel) => receta("atardecer", camara({ tripode: "si", marca: "canon", nivel })).pasos[1].texto;
  assert.match(t("empiezo"), /^Sube el número f/);
  assert.match(t("defiendo"), /^f\/11:/);
  assert.equal(t("controlo"), "f/11");
});

prueba("nombre del modo según la marca", () => {
  const modo = (marca) => receta("atardecer", camara({ tripode: "si", marca, nivel: "controlo" })).pasos[0].texto;
  assert.equal(modo("canon"), "Av");
  assert.equal(modo("nikon"), "A");
  assert.equal(modo("sony"), "A");
  assert.match(modo("desconocida"), /^Av \(en Nikon y Sony se llama A\)/);
  const tv = receta("luna", camara({ marca: "nikon", objetivos: ["tele"], tripode: "no", nivel: "controlo" })).pasos[0].texto;
  assert.equal(tv, "S");
});

prueba("luna: tele + trípode = manual; tele sin trípode = Tv; sin tele = Av y consejo de paisaje", () => {
  const a = receta("luna", camara({ objetivos: ["tele"], tripode: "si", nivel: "controlo" }));
  assert.equal(a.id, "camara-tele-tripode");
  assert.deepEqual(a.pasos.map((p) => p.texto), ["M", "f/8", "ISO 100", "1/250–1/500", "MF con zoom en pantalla", "Disparador a 2 s"]);
  assert.equal(receta("luna", camara({ objetivos: ["tele"], tripode: "no" })).id, "camara-con-tele");
  const k = receta("luna", camara({ objetivos: ["kit"], tripode: "si" }));
  assert.equal(k.id, "camara-sin-tele");
  assert.match(k.nota, /paisaje/);
});

prueba("luna con móvil: nota de que sin tele saldrá pequeña", () => {
  const r = receta("luna", Perfil.nuevo(def));
  assert.equal(r.id, "movil");
  assert.match(r.nota, /pequeña/);
});

prueba("el consejo según el semáforo y los avisos de seguridad aparecen", () => {
  const r = receta("atardecer", camara({ tripode: "si" }), undefined, "ambar");
  assert.match(r.segunSemaforo, /plan B/);
  assert.match(r.avisos.join(" "), /visor/);
  assert.match(r.avisos.join(" "), /JPEG/);
  assert.equal(receta("atardecer", camara()).segunSemaforo, null);
  assert.ok(!receta("luna", camara({ objetivos: ["tele"] })).avisos.join(" ").includes("visor"), "la luna no lleva el aviso del sol");
});

prueba("partes(): separa texto y términos del glosario", () => {
  assert.deepEqual(Recetas.partes("Pon el [[iso|ISO]] en 100."), [{ texto: "Pon el " }, { id: "iso", etiqueta: "ISO" }, { texto: " en 100." }]);
  assert.deepEqual(Recetas.partes("Sin términos"), [{ texto: "Sin términos" }]);
  assert.deepEqual(Recetas.terminosDe("[[a|A]] y [[b-c|B]]"), ["a", "b-c"]);
});

prueba("todas las combinaciones de perfil dan receta sin llaves {} ni corchetes sin resolver", () => {
  let n = 0;
  for (const equipo of ["movil", "camara"])
    for (const marca of ["canon", "nikon", "sony", "desconocida"])
      for (const objetivos of [[], ["kit"], ["tele"], ["tele", "angular"]])
        for (const tripode of ["si", "aveces", "no"])
          for (const nivel of ["empiezo", "defiendo", "controlo"])
            for (const g of ["atardecer", "luna"])
              for (const hoy of ["si", "no"]) {
                const p = { equipo, marca, objetivos, tripode, nivel, respondidas: ["equipo"] };
                const r = receta(g, p, hoy, "verde");
                assert.ok(r && r.pasos.length >= 3, JSON.stringify(p) + " " + g);
                const todo = r.pasos.map((x) => x.texto).concat(r.nota || [], r.avisos).join(" ");
                assert.ok(!/[{}]/.test(todo), "llave sin resolver: " + todo);
                assert.ok(!/\[\[(?![a-z0-9-]+\|[^\]]+\]\])/.test(todo), "término mal escrito: " + todo);
                n++;
              }
  assert.ok(n > 1000);
});

prueba("recetas: la de cámara enlaza a su lección (la luna en manual, al manual de verdad) y la de móvil a ninguna", () => {
  ["amanecer", "atardecer"].forEach((g) => ["si", "no"].forEach((t) => assert.equal(receta(g, camara({ tripode: t })).leccion, "la-rueda-de-modos", g + " con trípode " + t)));
  assert.equal(receta("luna", camara({ objetivos: ["tele"], tripode: "no" })).leccion, "la-rueda-de-modos", "luna con tele sin trípode");
  assert.equal(receta("luna", camara({ objetivos: ["kit"], tripode: "si" })).leccion, "la-rueda-de-modos", "luna sin tele");
  assert.equal(receta("luna", camara({ objetivos: ["tele"], tripode: "si" })).leccion, "el-manual-de-verdad", "luna con tele y trípode (modo M)");
  ["amanecer", "atardecer", "luna"].forEach((g) => assert.equal(receta(g, Perfil.nuevo(def)).leccion, null, g + " con móvil"));
});
