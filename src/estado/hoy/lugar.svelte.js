/*
 * El lugar de la pantalla Hoy: el selector (escribir, buscar, elegir de la lista), la ubicación del móvil (GPS) y guardar el lugar elegido.
 * Elegir un lugar pide su previsión (prevision.svelte.js).
 */
import * as Lugar from "../../nucleo/lugar.js";
import { nombreDeLugar } from "../../proveedores/nominatim.js";
import { buscarCiudad } from "../../proveedores/geocodificacion.js";
import { crearSugeridor } from "../../nucleo/sugerencias.js";
import { posicionGps } from "../../proveedores/gps.js";
import { t } from "../../idioma/index.js";
import { hoy } from "./estado.svelte.js";
import { consultar } from "./prevision.svelte.js";

// Qué se le dice a quien no se pudo ubicar, según el motivo (los textos están en los diccionarios)
const CLAVES_GPS = { denegado: "gps.denegado", "no-disponible": "gps.noDisponible", tiempo: "gps.tiempo" };

let peticion = 0; // para descartar el nombre de un lugar si mientras tanto se eligió otro

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

export async function fijarLugar(lat, lon, nombre, origen) {
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
export async function refrescarGps(guardado) {
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
