/*
 * Qué días o noches se pueden consultar en cada género, cómo se llaman y qué pestaña se abre primero.
 * Es la lógica de la pantalla «Hoy» que antes estaba dentro de prueba/hoy.html.
 * El tipo de lista depende del motor del género, no del género: un género nuevo que use un motor existente funciona sin tocar esto.
 */
import * as Astro from "./astro.js";
import { plantilla } from "./semaforo.js";
import { mayus } from "./formato.js";

const HORA = 3600000;

// Noches (de la puesta de un día al amanecer del siguiente) que aún no han terminado
function nochesDe(prev, ahora) {
  const noches = [];
  for (let i = 0; i < prev.dias.length - 1; i++) {
    const inicio = prev.dias[i].puesta, fin = prev.dias[i + 1].amanecer;
    if (fin > ahora) noches.push({ fecha: prev.dias[i].fecha, inicio, fin });
  }
  return noches;
}

function listaDe(g, prev, ahora) {
  if (g.motor === "puntos-ventana") {
    return prev.dias.filter((d) => d[g.evento] + g.ventana.despuesMin * 60000 > ahora)
      .map((d) => ({ fecha: d.fecha, evento: d[g.evento], dia: d })).slice(0, 3);
  }
  return nochesDe(prev, ahora).slice(0, 3);
}

// La luna de un día (o de una noche, que lleva la fecha de la tarde en que empieza) en un lugar: fase, fracción iluminada, salida y puesta
function lunaDe(item, lat, lon) {
  return Astro.calcularDia(new Date(item.fecha + "T12:00:00"), lat, lon).luna;
}

/*
 * El resultado del semáforo para un día (atardecer) o una noche (luna) de la lista. Lo usan el panel grande y los
 * botones de día (cada uno lleva su semáforo), para que nunca puedan discrepar. Puede ser null si aún no hay previsión
 * para esa hora (solo en géneros de «puntos en una ventana»).
 *   S: el semáforo creado con la configuración; item: un elemento de `listaDe`; lat, lon, ahora: lugar e instante.
 */
function evaluarDia({ S, g, prev, item, lat, lon, ahora }) {
  if (g.motor === "puntos-ventana") return S.evaluar(g.id, prev, { dia: item.dia });
  const fraccion = lunaDe(item, lat, lon).fraccion;
  const enCurso = item.inicio <= ahora; // una noche en curso se evalúa solo desde ahora
  return S.evaluar(g.id, prev, { inicio: item.inicio, fin: item.fin, lat, lon, fraccion, desde: enCurso ? ahora : undefined });
}

function fechaLugar(ms, prev) { return new Date(ms + prev.desfaseMs).toISOString().slice(0, 10); }

function etiquetaDia(g, x, prev, ahora) {
  const e = g.etiquetasDia, hoy = fechaLugar(ahora, prev), manana = fechaLugar(ahora + 24 * HORA, prev);
  if (g.motor === "mejor-hora-nocturna" && x.inicio <= ahora && e.ahora) return e.ahora;
  const dia = mayus(new Date(x.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long" }));
  return plantilla(x.fecha === hoy ? e.hoy : x.fecha === manana ? e.manana : e.otro, { dia });
}

// La pestaña que se abre sola según la hora, con tres franjas (los minutos están en generos.json):
//   1. Noche: desde `nocheDespuesPuestaMin` después de la puesta hasta `amanecerAntesMin` antes de la salida del sol siguiente.
//      En latitudes de noches cortas esa franja puede quedar vacía: entonces nunca se abre la pestaña nocturna.
//   2. Amanecer: desde `amanecerAntesMin` antes hasta `amanecerDespuesMin` después de la salida del sol.
//   3. El resto del día, la normal (`porDefecto`).
// `indice` es config.indice (generos.json).
function pestanaPorDefecto(indice, prev, ahora) {
  const MIN = 60000;
  const n = nochesDe(prev, ahora)[0];
  const deNoche = n && ahora >= n.inicio + indice.nocheDespuesPuestaMin * MIN && ahora < n.fin - indice.amanecerAntesMin * MIN;
  if (deNoche) return indice.porDefectoDeNoche;
  const deAmanecer = prev.dias.some((d) => ahora >= d.amanecer - indice.amanecerAntesMin * MIN && ahora < d.amanecer + indice.amanecerDespuesMin * MIN);
  return deAmanecer ? indice.porDefectoDeAmanecer : indice.porDefecto;
}

/*
 * Lo que la pantalla necesita justo después de recibir la previsión: la previsión preparada, la lista de días de cada
 * género, la pestaña que se muestra y el día que se abre primero.
 *   datos: respuesta de Open-Meteo; ahora: instante en ms; pestanaElegida: si el usuario ya eligió pestaña (entonces se respeta `pestana`).
 */
function prepararVista({ config, S, datos, lat, lon, ahora, pestanaElegida, pestana }) {
  const prev = S.prepararPrevision(datos);
  const listas = Object.fromEntries(config.indice.orden.map((id) => [id, listaDe(config.generos[id], prev, ahora)]));
  const pestanaFinal = pestanaElegida ? pestana : pestanaPorDefecto(config.indice, prev, ahora);
  let indice = 0;
  // Si la noche en curso ya no tiene luna alta, se empieza por la siguiente
  const g = config.generos[pestanaFinal];
  if (g.motor === "mejor-hora-nocturna") {
    const n = listas[g.id][0];
    if (n && n.inicio <= ahora) {
      const r = evaluarDia({ S, g, prev, item: n, lat, lon, ahora });
      if (r.nivel === "ninguno" && listas[g.id].length > 1) indice = 1;
    }
  }
  return { prev, listas, pestana: pestanaFinal, indice, ahora };
}

export { nochesDe, listaDe, evaluarDia, fechaLugar, etiquetaDia, lunaDe, pestanaPorDefecto, prepararVista };
