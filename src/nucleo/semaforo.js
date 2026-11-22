/*
 * Motores del semáforo de luz-y-foto.
 *
 * Los umbrales, los puntos y los textos NO están aquí: se leen de data/ (ver docs/datos.md).
 * Aquí solo están los dos motores de cálculo:
 *   - "puntos-ventana": suma puntos de varios factores sobre las horas alrededor de un evento
 *     del sol (la puesta, el amanecer...). Es el del atardecer.
 *   - "mejor-hora-nocturna": busca las horas de la noche con la luna alta y valora la mejor. Es el de la luna.
 * Un género nuevo que encaje en uno de los dos se añade solo con datos.
 *
 * Módulo ES: funciona en el navegador y en Node.
 */
import * as Astro from "./astro.js";
import { idioma, t } from "../idioma/index.js";

const MIN = 60000;
const HORA = 3600000;
const ORDEN_LLUVIA = { sin: 0, llovizna: 1, moderada: 2, fuerte: 3 };

/* ---------- Previsión ---------- */

// Convierte las horas del lugar ("2026-11-18T18:00") en instantes reales (milisegundos).
function prepararPrevision(datos) {
  const desfase = (datos.utc_offset_seconds || 0) * 1000;
  const instante = (s) => Date.parse(s + ":00Z") - desfase;
  const h = datos.hourly;
  const num = (v) => (v === null || v === undefined ? null : v);

  const horas = h.time.map((s, i) => ({
    t: instante(s),
    bajas: num(h.cloud_cover_low[i]),
    medias: num(h.cloud_cover_mid[i]),
    altas: num(h.cloud_cover_high[i]),
    total: num(h.cloud_cover[i]),
    lluvia: num(h.precipitation && h.precipitation[i]) ?? 0,
    prob: num(h.precipitation_probability && h.precipitation_probability[i]) ?? 0,
    vis: (num(h.visibility && h.visibility[i]) ?? 99000) / 1000,
    codigo: num(h.weather_code && h.weather_code[i]) ?? 0
  })).filter((x) => x.total !== null && x.bajas !== null);

  const dias = datos.daily.time.map((fecha, i) => ({
    fecha,
    amanecer: instante(datos.daily.sunrise[i]),
    puesta: instante(datos.daily.sunset[i])
  }));

  return { horas, dias, desfaseMs: desfase };
}

/* ---------- Utilidades ---------- */

const media = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / xs.length;
const maximo = (xs, f) => Math.max(...xs.map(f));
const minimo = (xs, f) => Math.min(...xs.map(f));
const plantilla = (texto, valores) => texto.replace(/\{(\w+)\}/g, (_, k) => (k in valores ? valores[k] : "—"));
// Un número dicho en palabras: coma decimal en español, punto en inglés
const num = (n) => (idioma === "es" ? String(n).replace(".", ",") : String(n));
// El nombre de cada nivel de lluvia (los identificadores de data/ no son para leerlos)
const CLAVES_LLUVIA = { sin: "lluvia.sin", llovizna: "lluvia.llovizna", moderada: "lluvia.moderada", fuerte: "lluvia.fuerte" };
const nombreLluvia = (id) => (CLAVES_LLUVIA[id] ? t(CLAVES_LLUVIA[id]) : id);

// Un tramo cumple si cumple todas sus condiciones (las que tenga): desde (>=), menosDe (<), hasta (<=), masDe (>)
function cumple(t, v) {
  return (t.desde === undefined || v >= t.desde) && (t.menosDe === undefined || v < t.menosDe) &&
    (t.hasta === undefined || v <= t.hasta) && (t.masDe === undefined || v > t.masDe);
}
const tramoDe = (tramos, v) => tramos.find((t) => cumple(t, v));

function describirTramo(tr, unidad) {
  const u = unidad || t("formato.unidadPct");
  const v = { desde: num(tr.desde), hasta: num(tr.hasta), masDe: num(tr.masDe), menosDe: num(tr.menosDe), u };
  if (tr.desde !== undefined && tr.hasta !== undefined) return t("tramo.desdeHasta", v);
  if (tr.desde !== undefined && tr.menosDe !== undefined) return t("tramo.desdeMenosDe", v);
  if (tr.masDe !== undefined && tr.hasta !== undefined) return t("tramo.masDeHasta", v);
  if (tr.menosDe !== undefined) return t("tramo.menosDe", v);
  if (tr.hasta !== undefined) return t("tramo.hasta", v);
  if (tr.masDe !== undefined) return t("tramo.masDe", v);
  if (tr.desde !== undefined) return t("tramo.desde", v);
  return t("tramo.resto");
}

/* ---------- Motores ---------- */

function crear(config) {
  const comun = config.comun;
  const L = comun.lluvia;

  const nivelLluvia = (mm) => mm <= L.sinLluviaMm ? "sin" : mm <= L.lloviznaMm ? "llovizna" : mm <= L.fuerteMm ? "moderada" : "fuerte";
  const lluviaDesde = (mm, minimoNivel) => ORDEN_LLUVIA[nivelLluvia(mm)] >= ORDEN_LLUVIA[minimoNivel];
  const hayTormenta = (xs) => xs.some((x) => x.codigo >= L.tormentaCodigo);
  const nivelPorPuntos = (total) => total >= comun.niveles.verdeDesde ? "verde" : total >= comun.niveles.ambarDesde ? "ambar" : "rojo";

  function fraseLluvia(mm, tormenta, momento) {
    if (tormenta) return comun.frasesLluvia.tormenta;
    return plantilla(comun.frasesLluvia[nivelLluvia(mm)], { momento });
  }

  const genero = (id) => {
    const g = config.generos[id];
    if (!g) throw new Error("No existe el género «" + id + "»");
    return g;
  };

  /* ----- puntos-ventana ----- */

  // Horas desde `antesMin` antes hasta `despuesMin` después del evento
  function ventanaPuntos(g, prev, dia) {
    const ev = dia[g.evento];
    const desde = ev - g.ventana.antesMin * MIN, hasta = ev + g.ventana.despuesMin * MIN;
    return prev.horas.filter((x) => x.t + HORA > desde && x.t <= hasta);
  }

  function puntuarVentana(g, prev, { dia }) {
    const v = ventanaPuntos(g, prev, dia);
    if (!v.length) return null;

    const agregar = (campo, modo) => (modo === "maximo" ? maximo(v, (x) => x[campo]) : media(v, (x) => x[campo]));
    const lluviaMm = maximo(v, (x) => x.lluvia);
    const tormenta = hayTormenta(v);
    const vis = minimo(v, (x) => x.vis);
    const valores = {};
    // Con niebla (poca visibilidad), un género puede pedir que un factor de nubes dé sus puntos máximos y no vete: la niebla es una
    // ventaja (el sol no se verá, pero la bruma puede dar buenas fotos). La lluvia y la tormenta siguen igual.
    const ventaja = vis < comun.nieblaKm && g.nieblaVentaja ? g.nieblaVentaja : null;

    const factores = g.factores.map((f) => {
      if (f.tipo === "lluvia") {
        const nivel = nivelLluvia(lluviaMm);
        valores[f.id] = lluviaMm;
        return { id: f.id, etiqueta: f.etiqueta, valor: lluviaMm, nivel, puntos: f.puntos[nivel], max: f.max,
          frase: fraseLluvia(lluviaMm, tormenta, f.momento) };
      }
      const porCampo = f.campos.map((c) => agregar(c, f.agregado));
      const valor = f.combinar === "maximo" ? Math.max(...porCampo) : porCampo[0];
      valores[f.id] = valor;
      if (ventaja && f.id === ventaja.factor) return { id: f.id, etiqueta: f.etiqueta, valor, puntos: f.max, max: f.max, frase: ventaja.frase };
      return { id: f.id, etiqueta: f.etiqueta, valor, puntos: tramoDe(f.tramos, valor).puntos, max: f.max,
        frase: tramoDe(f.frases, valor).texto };
    });

    const total = factores.reduce((a, f) => a + f.puntos, 0);
    let nivel = nivelPorPuntos(total);
    let motivoVeto = null;
    const avisos = [];

    if (tormenta) {
      nivel = "ambar";
      avisos.push(comun.avisos.tormenta);
    } else {
      const veto = (g.vetos || []).find((x) => x.factor === "lluvia"
        ? lluviaDesde(lluviaMm, x.nivel) : !(ventaja && x.factor === ventaja.factor) && valores[x.factor] > x.masDe);
      if (veto) { nivel = "rojo"; motivoVeto = veto.motivo; }
      else if (nivel === "verde" && lluviaDesde(lluviaMm, g.ambarSiLluviaDesde)) nivel = "ambar";
    }

    if (!tormenta && nivelLluvia(lluviaMm) === "llovizna") avisos.push(comun.avisos.llovizna);
    if (vis < comun.nieblaKm) avisos.push(g.avisoNiebla);

    return {
      genero: g.id, motor: g.motor, horas: v, factores, valores,
      capas: { bajas: media(v, (x) => x.bajas), medias: media(v, (x) => x.medias), altas: media(v, (x) => x.altas) },
      lluvia: lluviaMm, prob: maximo(v, (x) => x.prob), vis, tormenta,
      total, nivel, titulo: g.niveles[nivel], motivoVeto, avisos,
      resumen: motivoVeto || (tormenta ? g.resumenes.tormenta : g.resumenes[nivel])
    };
  }

  /* ----- mejor-hora-nocturna ----- */

  /*
   * Horas de la noche (de `inicio` a `fin`) con la luna alta y el sol bajo el horizonte.
   * Cada hora se valora por su punto medio. `desde` (opcional) descarta lo que ya ha pasado.
   */
  function ventanaNocturna(g, prev, { inicio, fin, lat, lon, desde }) {
    return prev.horas.filter((x) => {
      const medio = x.t + HORA / 2;
      if (medio < inicio || medio > fin) return false;
      if (desde !== undefined && x.t + HORA <= desde) return false;
      const a = Astro.alturas(new Date(medio), lat, lon);
      return a.luna >= g.luna.alturaMinGrados && a.sol < g.luna.solMaxGrados;
    });
  }

  // `fraccion`: parte iluminada de la luna esa noche (0 a 1)
  function puntuarNocturno(g, prev, ctx) {
    const { fraccion, desde } = ctx;
    const v = ventanaNocturna(g, prev, ctx);
    const base = { genero: g.id, motor: g.motor, horas: v, avisos: [] };
    const ninguno = (motivo, extra) => Object.assign(base, { nivel: "ninguno", motivo, resumen: motivo,
      titulo: g.niveles[extra && extra.yaPaso ? "yaPaso" : "ninguno"] }, extra);

    if (fraccion < g.luna.fraccionMinima) return ninguno(g.motivos.lunaNueva);
    if (!v.length) {
      // Si ya han pasado todas las horas útiles, se dice así en vez de dar a entender que no hubo luna
      const entera = desde !== undefined && ventanaNocturna(g, prev, Object.assign({}, ctx, { desde: undefined })).length > 0;
      return ninguno(entera ? g.motivos.yaPaso : g.motivos.sinLunaAlta, { yaPaso: entera });
    }

    const tormenta = hayTormenta(v);
    const utiles = v.filter((x) => !lluviaDesde(x.lluvia, g.lluvia.vetoDesde));
    if (!utiles.length) {
      return Object.assign(base, { nivel: "rojo", titulo: g.niveles.rojo, motivo: g.motivos.lluviaFuerte,
        resumen: g.motivos.lluviaFuerte, lluvia: maximo(v, (x) => x.lluvia), tormenta, sinUtiles: true });
    }

    // La mejor hora es la de menos nubes (a igualdad, la de menos lluvia)
    const campo = g.nubes.campo;
    const mejor = utiles.reduce((a, b) => (b[campo] < a[campo] || (b[campo] === a[campo] && b.lluvia < a.lluvia)) ? b : a);

    let nivel = mejor[campo] < g.nubes.verdeMenosDe ? "verde" : mejor[campo] <= g.nubes.ambarHasta ? "ambar" : "rojo";
    if (nivel === "verde" && lluviaDesde(mejor.lluvia, g.lluvia.ambarSiLluviaDesde)) nivel = "ambar";

    const avisos = [];
    if (tormenta) {
      nivel = nivel === "rojo" ? "rojo" : "ambar";
      avisos.push(comun.avisos.tormenta);
    } else if (nivelLluvia(mejor.lluvia) === "llovizna") {
      avisos.push(comun.avisos.llovizna);
    }
    if (mejor.vis < comun.nieblaKm) avisos.push(g.avisoNiebla);

    return Object.assign(base, {
      mejorHora: mejor.t, nubes: mejor[campo], mediaNubes: media(v, (x) => x[campo]),
      lluvia: mejor.lluvia, tormenta, nivel, avisos,
      titulo: g.niveles[nivel], resumen: g.resumenes[nivel],
      fraseNubes: tramoDe(g.frasesNubes, mejor[campo]).texto,
      fraseLluvia: fraseLluvia(mejor.lluvia, tormenta, g.lluvia.momento),
      primera: v[0].t, ultima: v[v.length - 1].t + HORA
    });
  }

  /* ----- Interfaz común ----- */

  const MOTORES = {
    "puntos-ventana": { puntuar: puntuarVentana, ventana: (g, prev, ctx) => ventanaPuntos(g, prev, ctx.dia) },
    "mejor-hora-nocturna": { puntuar: puntuarNocturno, ventana: ventanaNocturna }
  };

  // ctx para "puntos-ventana": { dia }. ctx para "mejor-hora-nocturna": { inicio, fin, lat, lon, fraccion, desde? }
  function evaluar(id, prev, ctx) {
    const g = genero(id);
    return MOTORES[g.motor].puntuar(g, prev, ctx);
  }
  function ventana(id, prev, ctx) {
    const g = genero(id);
    return MOTORES[g.motor].ventana(g, prev, ctx);
  }

  /* ----- Explicación en palabras, generada desde los mismos datos ----- */

  function explicar(id) {
    const g = genero(id);
    const L2 = comun.lluvia;
    const lineas = [];
    const nivelesLluvia = t("exp.nivelesLluvia", { sin: num(L2.sinLluviaMm), llovizna: num(L2.lloviznaMm), moderada: num(L2.fuerteMm) });

    if (g.motor === "puntos-ventana") {
      lineas.push(t("exp.ventana", { antes: g.ventana.antesMin, despues: g.ventana.despuesMin, evento: g.eventoNombre }));
      g.factores.forEach((f) => {
        if (f.tipo === "lluvia") {
          lineas.push(t("exp.factorLluvia", { etiqueta: f.etiqueta, max: f.max, puntos: Object.keys(f.puntos).map((n) => nombreLluvia(n) + " " + f.puntos[n]).join(", "), niveles: nivelesLluvia }));
        } else {
          // Tramos "menos de 20, menos de 40..." se cuentan como "de 20 a 40": así se lee como una escala
          let previo = null;
          const trozos = f.tramos.map((tr) => {
            const soloMenosDe = tr.menosDe !== undefined && Object.keys(tr).every((k) => k === "menosDe" || k === "puntos");
            const cond = soloMenosDe && previo !== null ? t("tramo.desdeHasta", { desde: num(previo), hasta: num(tr.menosDe), u: t("formato.unidadPct") }) : describirTramo(tr);
            previo = soloMenosDe ? tr.menosDe : null;
            return t("exp.tramoDa", { cond, puntos: tr.puntos });
          });
          lineas.push(t("exp.factorTramos", { etiqueta: f.etiqueta, max: f.max, tramos: trozos.join("; ") }));
        }
      });
      lineas.push(t("exp.semaforoPuntos", { verdeDesde: comun.niveles.verdeDesde, ambarDesde: comun.niveles.ambarDesde, ambarHasta: comun.niveles.verdeDesde - 1,
        verde: g.niveles.verde, ambar: g.niveles.ambar, rojo: g.niveles.rojo }));
      (g.vetos || []).forEach((v) => {
        const cond = v.factor === "lluvia" ? t("exp.vetoLluvia", { nivel: nombreLluvia(v.nivel) })
          : t("exp.vetoFactor", { etiqueta: g.factores.find((f) => f.id === v.factor).etiqueta.toLowerCase(), masDe: num(v.masDe) });
        lineas.push(t("exp.rojoDirecto", { cond }));
      });
      if (g.nieblaVentaja) {
        const f = g.factores.find((x) => x.id === g.nieblaVentaja.factor);
        lineas.push(t("exp.niebla", { km: num(comun.nieblaKm), etiqueta: f.etiqueta, max: f.max }));
      }
      lineas.push(t("exp.lluviaAmbar", { nivel: nombreLluvia(g.ambarSiLluviaDesde) }));
    } else {
      const n = g.nubes;
      lineas.push(t("exp.nocheLuna", { luna: g.luna.alturaMinGrados, sol: g.luna.solMaxGrados }));
      lineas.push(t("exp.nocheNubes", { nivel: nombreLluvia(g.lluvia.vetoDesde), esFuerte: g.lluvia.vetoDesde === "fuerte", verdeMenosDe: n.verdeMenosDe, ambarHasta: n.ambarHasta,
        verde: g.niveles.verde, ambar: g.niveles.ambar, rojo: g.niveles.rojo }));
      lineas.push(t("exp.lluviaAmbar", { nivel: nombreLluvia(g.lluvia.ambarSiLluviaDesde) }));
      lineas.push(t("exp.nocheFase", { pct: Math.round(g.luna.fraccionMinima * 100) }));
    }
    return lineas;
  }

  return { evaluar, ventana, explicar, prepararPrevision, nivelLluvia, genero };
}

export { crear, prepararPrevision, describirTramo, plantilla };
