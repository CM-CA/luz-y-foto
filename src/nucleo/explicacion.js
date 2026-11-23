/*
 * «Cómo se calcula» en palabras: las reglas de cada género escritas en lenguaje normal, generadas desde los mismos datos que el cálculo
 * (los umbrales, los puntos y los textos están en data/), así que al cambiar un umbral cambia también la explicación.
 */
import { idioma, t } from "../idioma/index.js";

// Un número dicho en palabras: coma decimal en español, punto en inglés
const num = (n) => (idioma === "es" ? String(n).replace(".", ",") : String(n));

// El nombre de cada nivel de lluvia (los identificadores de data/ no son para leerlos)
const CLAVES_LLUVIA = { sin: "lluvia.sin", llovizna: "lluvia.llovizna", moderada: "lluvia.moderada", fuerte: "lluvia.fuerte" };
const nombreLluvia = (id) => (CLAVES_LLUVIA[id] ? t(CLAVES_LLUVIA[id]) : id);

export function describirTramo(tr, unidad) {
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

// Las reglas de un género, una línea cada una. `comun` es comun.json y `g` el género (generos/<id>.json)
export function explicarGenero(comun, g) {
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
