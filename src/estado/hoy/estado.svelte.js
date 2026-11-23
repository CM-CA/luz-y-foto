/*
 * El estado de la pantalla Hoy (`hoy`) y lo más básico que se hace con él: qué pestaña y qué día están elegidos y volver a dibujar el panel.
 * Los demás archivos de esta carpeta (previsión, lugar, equipo) escriben en este mismo objeto.
 */
import { config, S } from "../datos.js";
import { evaluarDia } from "../../nucleo/dias.js";

export const hoy = $state({
  // lugar
  lugar: null, nombreLugar: "", selectorAbierto: false, mensajeLugar: "", resultados: [],
  // previsión
  estado: "", vistaLista: false, pintado: 0, prev: null, lat: 0, lon: 0, ahora: 0, listas: null, pestana: null, indice: 0, pestanaElegida: false,
  // consultando: hay una petición en curso. sinConexion: no se pudo actualizar y se enseña la previsión guardada ({ cuando, hace })
  consultando: false, sinConexion: null,
  // perfil y receta
  perfil: null, asistente: null, tripodeHoy: "no", recetaAbierta: false
});

export const generoActual = () => (hoy.pestana ? config.generos[hoy.pestana] : null);
export const listaActual = () => { const g = generoActual(); return g && hoy.listas ? hoy.listas[g.id] : []; };
export const indiceActual = () => (hoy.indice >= listaActual().length ? 0 : hoy.indice);
export const itemActual = () => listaActual()[indiceActual()];

// El semáforo del día elegido (null si todavía no hay previsión). Lo usa la cabecera para elegir el cielo.
export function resultadoActual() {
  const g = generoActual(), item = itemActual();
  if (!g || !item || !hoy.prev) return null;
  return evaluarDia({ S, g, prev: hoy.prev, item, lat: hoy.lat, lon: hoy.lon, ahora: hoy.ahora });
}

// `vistaLista` dice si el panel se ve; `pintado` sube cada vez que el panel se dibuja de nuevo desde cero
// (cambio de pestaña, de día, de trípode, de equipo o previsión nueva), igual que hacía hoy.html, y
// así se cierran las definiciones del glosario que estuvieran abiertas.
export function repintar() { hoy.vistaLista = true; hoy.pintado++; }

export function elegirPestana(id) {
  if (!hoy.listas) return;
  hoy.pestana = id; hoy.pestanaElegida = true; hoy.indice = 0;
  repintar();
}

export function elegirDia(i) { hoy.indice = i; repintar(); }
