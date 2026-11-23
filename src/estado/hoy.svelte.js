/*
 * Estado de la pantalla Hoy y lo que se puede hacer con él: lugar, previsión, pestaña y día elegidos,
 * perfil de equipo y asistente. Los componentes leen `hoy` y llaman a estas funciones; no hablan
 * directamente con los proveedores ni con localStorage.
 *
 * Cada parte vive en su archivo de src/estado/hoy/ (el estado, la previsión, el lugar y el equipo); aquí se reexportan para que los
 * componentes sigan importando de un solo sitio, y está el arranque, que las junta.
 */
import { config } from "./datos.js";
import * as Perfil from "../nucleo/perfil.js";
import * as Lugar from "../nucleo/lugar.js";
import { t } from "../idioma/index.js";
import { hoy } from "./hoy/estado.svelte.js";
import { escucharConexion } from "./hoy/prevision.svelte.js";
import { fijarLugar, refrescarGps, usarGps } from "./hoy/lugar.svelte.js";
import { abrirAsistente } from "./hoy/equipo.svelte.js";

export { hoy, generoActual, listaActual, indiceActual, itemActual, resultadoActual, elegirPestana, elegirDia } from "./hoy/estado.svelte.js";
export { reintentar } from "./hoy/prevision.svelte.js";
export { escribirCiudad, alternarSelector, usarGps, buscar, elegirResultado } from "./hoy/lugar.svelte.js";
export { resumenEquipo, abrirAsistente, elegirOpcion, accionAsistente, elegirTripode } from "./hoy/equipo.svelte.js";

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
