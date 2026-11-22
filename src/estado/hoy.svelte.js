/*
 * Estado de la pantalla Hoy y lo que se puede hacer con él: lugar, previsión, pestaña y día elegidos,
 * perfil de equipo y asistente. Los componentes leen `hoy` y llaman a estas funciones; no hablan
 * directamente con los proveedores ni con localStorage.
 */
import { config, S } from "./datos.js";
import * as Perfil from "../nucleo/perfil.js";
import * as Lugar from "../nucleo/lugar.js";
import * as Guardada from "../nucleo/previsionGuardada.js";
import { hm } from "../nucleo/formato.js";
import { prepararVista, evaluarDia } from "../nucleo/dias.js";
import { pedirPrevision } from "../proveedores/open-meteo.js";
import { nombreDeLugar } from "../proveedores/nominatim.js";
import { buscarCiudad } from "../proveedores/geocodificacion.js";
import { crearSugeridor } from "../nucleo/sugerencias.js";
import { posicionGps } from "../proveedores/gps.js";
import { t } from "../idioma/index.js";

// Qué se le dice a quien no se pudo ubicar, según el motivo (los textos están en los diccionarios)
const CLAVES_GPS = { denegado: "gps.denegado", "no-disponible": "gps.noDisponible", tiempo: "gps.tiempo" };

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

let peticion = 0; // para descartar el nombre de un lugar si mientras tanto se eligió otro

/* ---------- Pestaña y día elegidos ---------- */

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
function repintar() { hoy.vistaLista = true; hoy.pintado++; }

export function elegirPestana(id) {
  if (!hoy.listas) return;
  hoy.pestana = id; hoy.pestanaElegida = true; hoy.indice = 0;
  repintar();
}
export function elegirDia(i) { hoy.indice = i; repintar(); }

/* ---------- Previsión ---------- */

let consulta = 0;      // para descartar la respuesta de una consulta si mientras tanto se pidió otra (otro lugar, reintento)
let ultima = null;     // última previsión recibida en esta sesión: { lat, lon, datos, guardadaEn }
let mostrada = null;   // cuándo se recibió la previsión que se está viendo

// Pone en pantalla una previsión (la recién recibida o la guardada). Lanza un error si los datos no se pueden leer.
function mostrar(datos, lat, lon) {
  const v = prepararVista({ config, S, datos, lat, lon, ahora: Date.now(), pestanaElegida: hoy.pestanaElegida, pestana: hoy.pestana });
  hoy.prev = v.prev; hoy.lat = lat; hoy.lon = lon; hoy.ahora = v.ahora;
  hoy.listas = v.listas; hoy.pestana = v.pestana; hoy.indice = v.indice;
  return v;
}

// `conservarVista`: al reintentar, lo que ya se ve se queda mientras se consulta
async function consultar(lat, lon, { conservarVista = false } = {}) {
  const mia = ++consulta;
  hoy.consultando = true;
  hoy.estado = t("estado.consultando");
  if (!conservarVista) hoy.vistaLista = false;
  try {
    const datos = await pedirPrevision(lat, lon);
    if (mia !== consulta) return; // mientras tanto se pidió otra
    const v = mostrar(datos, lat, lon);
    ultima = { lat, lon, datos, guardadaEn: v.ahora };
    mostrada = v.ahora;
    Guardada.guardar(ultima);
    hoy.sinConexion = null;
    hoy.estado = t("estado.prevision", { hora: hm(v.ahora), zona: datos.timezone });
    hoy.consultando = false;
    repintar();
  } catch (e) {
    if (mia !== consulta) return;
    hoy.consultando = false;
    sinPrevisionNueva(lat, lon, e);
  }
}

// No se pudo pedir la previsión (sin red, servicio caído, respuesta rara): si hay una guardada de este lugar y
// no es muy vieja, se enseña con un aviso; si no, se explica el fallo como siempre.
function sinPrevisionNueva(lat, lon, error) {
  const ahora = Date.now();
  const guardada = ultima && Guardada.sirve(ultima, lat, lon, ahora) ? ultima : Guardada.cargar(lat, lon, ahora);
  try {
    if (!guardada) throw error;
    const yaSeVe = mostrada === guardada.guardadaEn && hoy.lat === lat && hoy.lon === lon && hoy.listas;
    if (!yaSeVe) { mostrar(guardada.datos, lat, lon); mostrada = guardada.guardadaEn; }
    hoy.sinConexion = Guardada.cuando(guardada.guardadaEn, ahora);
    hoy.estado = t("estado.guardada", { cuando: hoy.sinConexion.cuando, zona: guardada.datos.timezone });
    if (!yaSeVe) repintar(); else hoy.vistaLista = true;
  } catch (e) {
    hoy.sinConexion = null;
    hoy.estado = t("estado.error", { motivo: error.message });
  }
}

export function reintentar() { if (hoy.lugar && !hoy.consultando) consultar(hoy.lugar.lat, hoy.lugar.lon, { conservarVista: true }); }

// Al volver la conexión, o al volver a la app, se reintenta solo si se estaba enseñando la previsión guardada
let escuchando = false;
function reintentarSiHaceFalta() { if (hoy.sinConexion) reintentar(); }
function escucharConexion() {
  if (escuchando) return;
  escuchando = true;
  window.addEventListener("online", reintentarSiHaceFalta);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reintentarSiHaceFalta(); });
}

/* ---------- Lugar ---------- */

const mensajeInicial = () => t("selector.mensajeInicial");
// Las sugerencias mientras se escribe llenan la misma lista que la búsqueda con Intro o con la lupa
const sugeridor = crearSugeridor({
  buscar: buscarCiudad,
  alVaciar: () => { hoy.resultados = []; hoy.mensajeLugar = mensajeInicial(); },
  alRecibir: (resultados) => { hoy.resultados = resultados; hoy.mensajeLugar = resultados.length ? t("selector.eligeLugar") : mensajeInicial(); }
});
export function escribirCiudad(texto) { sugeridor.escribir(texto); }

function abrirSelector(mensaje) { hoy.selectorAbierto = true; hoy.mensajeLugar = mensaje || ""; }
function cerrarSelector() { sugeridor.cancelar(); hoy.selectorAbierto = false; hoy.resultados = []; hoy.mensajeLugar = ""; }
export function alternarSelector() { if (hoy.selectorAbierto) cerrarSelector(); else abrirSelector(mensajeInicial()); }

async function fijarLugar(lat, lon, nombre, origen) {
  const mia = ++peticion;
  hoy.lugar = { lat, lon, nombre: nombre || null, origen };
  hoy.nombreLugar = nombre || t("lugar.tuUbicacion");
  consultar(lat, lon);
  if (nombre) { Lugar.guardar($state.snapshot(hoy.lugar)); return; }
  const texto = await nombreDeLugar(lat, lon);
  if (mia !== peticion) return; // mientras tanto se eligió otro lugar
  hoy.lugar.nombre = texto || Lugar.coordenadas(lat, lon);
  hoy.nombreLugar = hoy.lugar.nombre;
  Lugar.guardar($state.snapshot(hoy.lugar));
}

export async function usarGps(silencioso) {
  if (!silencioso) hoy.mensajeLugar = t("lugar.buscando");
  try {
    const p = await posicionGps();
    cerrarSelector();
    fijarLugar(p.lat, p.lon, null, "gps");
  } catch (e) {
    if (!silencioso) {
      if (!hoy.lugar) { hoy.nombreLugar = t("lugar.elige"); hoy.estado = ""; }
      abrirSelector(t(CLAVES_GPS[e.codigo] || CLAVES_GPS["no-disponible"]));
    }
  }
}

// Si ya hay permiso, se comprueba en segundo plano si te has movido de ciudad
async function refrescarGps(guardado) {
  try {
    if (!navigator.permissions) return;
    const permiso = await navigator.permissions.query({ name: "geolocation" });
    if (permiso.state !== "granted") return;
    const p = await posicionGps();
    if (Lugar.distanciaKm(guardado, p) > 5) fijarLugar(p.lat, p.lon, null, "gps");
  } catch (e) { /* sin ubicación: se queda el lugar guardado */ }
}

export async function buscar(texto) {
  sugeridor.cancelar();
  const q = texto.trim();
  if (q.length < 2) { hoy.mensajeLugar = t("selector.minimoLetras"); return; }
  hoy.mensajeLugar = t("selector.buscando"); hoy.resultados = [];
  try {
    hoy.resultados = await buscarCiudad(q);
    if (!hoy.resultados.length) { hoy.mensajeLugar = t("selector.noEncontrado"); return; }
    hoy.mensajeLugar = t("selector.eligeLugar");
  } catch (e) {
    hoy.mensajeLugar = t("selector.errorBusqueda");
  }
}

export function elegirResultado(i) {
  const x = hoy.resultados[i];
  if (!x) return;
  const { lat, lon, texto } = x;
  cerrarSelector();
  fijarLugar(lat, lon, texto, "busqueda");
}

/* ---------- Perfil de equipo: asistente de una pregunta por pantalla ---------- */

export const resumenEquipo = () => (hoy.perfil ? Perfil.resumen(config.perfil, hoy.perfil) : "");

export function abrirAsistente(conBienvenida) {
  hoy.asistente = { paso: conBienvenida ? -1 : 0, conBienvenida: !!conBienvenida };
}

function cerrarAsistente() {
  Perfil.guardar($state.snapshot(hoy.perfil));
  hoy.asistente = null;
  if (hoy.listas) repintar(); // la receta depende del equipo
}

function avanzar() {
  const n = Perfil.preguntasVisibles(config.perfil, hoy.perfil).length;
  if (hoy.asistente.paso + 1 >= n) cerrarAsistente();
  else hoy.asistente.paso++;
}

export function elegirOpcion(id) {
  const def = config.perfil, a = hoy.asistente;
  if (!a) return;
  const q = Perfil.preguntasVisibles(def, hoy.perfil)[a.paso];
  if (q.multiple) {
    const lista = hoy.perfil[q.id].slice(), i = lista.indexOf(id);
    if (i >= 0) lista.splice(i, 1); else lista.push(id);
    hoy.perfil = Perfil.responder(def, hoy.perfil, q.id, lista);
  } else {
    hoy.perfil = Perfil.responder(def, hoy.perfil, q.id, id);
    Perfil.guardar($state.snapshot(hoy.perfil));
    avanzar();
  }
}

export function accionAsistente(que) {
  const a = hoy.asistente;
  if (!a) return;
  if (que === "empezar") a.paso = 0;
  else if (que === "saltar-todo") cerrarAsistente(); // guarda el perfil sin responder: no se vuelve a mostrar la bienvenida
  else if (que === "saltar" || que === "siguiente") avanzar();
  else if (que === "atras") a.paso = a.paso > 0 ? a.paso - 1 : -1;
}

export function elegirTripode(valor) { hoy.tripodeHoy = valor; hoy.recetaAbierta = true; repintar(); }

/* ---------- Arranque ---------- */

// Solo hace algo la primera vez que se llama en la página: al volver a Hoy desde otra pantalla (Aprender) se muestra el estado que ya hay,
// sin pedir la previsión otra vez ni cambiar la pestaña, el día o el lugar.
let arrancado = false;

export async function arrancar() {
  if (arrancado) return;
  arrancado = true;
  escucharConexion();
  const primeraVez = !Perfil.existe();
  hoy.perfil = Perfil.cargar(config.perfil);
  if (primeraVez) abrirAsistente(true);
  const guardado = Lugar.cargar();
  if (guardado) {
    fijarLugar(guardado.lat, guardado.lon, guardado.nombre, guardado.origen);
    if (guardado.origen === "gps") refrescarGps(guardado);
  } else {
    hoy.estado = t("lugar.buscando");
    usarGps(false);
  }
}
