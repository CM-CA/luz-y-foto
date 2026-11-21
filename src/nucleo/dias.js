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

function fechaLugar(ms, prev) { return new Date(ms + prev.desfaseMs).toISOString().slice(0, 10); }

function etiquetaDia(g, x, prev, ahora) {
  const e = g.etiquetasDia, hoy = fechaLugar(ahora, prev), manana = fechaLugar(ahora + 24 * HORA, prev);
  if (g.motor === "mejor-hora-nocturna" && x.inicio <= ahora && e.ahora) return e.ahora;
  const dia = mayus(new Date(x.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long" }));
  return plantilla(x.fecha === hoy ? e.hoy : x.fecha === manana ? e.manana : e.otro, { dia });
}

// De noche (desde unos minutos después de la puesta hasta el amanecer) se abre la pestaña nocturna; el resto del día, la normal.
// `indice` es config.indice (generos.json).
function pestanaPorDefecto(indice, prev, ahora) {
  const n = nochesDe(prev, ahora)[0];
  const deNoche = n && ahora >= n.inicio + indice.nocheDespuesPuestaMin * 60000 && ahora < n.fin;
  return deNoche ? indice.porDefectoDeNoche : indice.porDefecto;
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
      const fraccion = Astro.calcularDia(new Date(n.fecha + "T12:00:00"), lat, lon).luna.fraccion;
      const r = S.evaluar(g.id, prev, { inicio: n.inicio, fin: n.fin, lat, lon, fraccion, desde: ahora });
      if (r.nivel === "ninguno" && listas[g.id].length > 1) indice = 1;
    }
  }
  return { prev, listas, pestana: pestanaFinal, indice, ahora };
}

export { nochesDe, listaDe, fechaLugar, etiquetaDia, pestanaPorDefecto, prepararVista };
