/*
 * La brújula del móvil. Solo se escucha el sensor mientras hay una brújula en pantalla y la persona la ha encendido: ni antes ni
 * después. `orientacion.estado` dice en qué punto está:
 *   - "apagada": no se escucha nada.
 *   - "pidiendo": se pidió permiso (iPhone) o se espera la primera lectura (como mucho 2 segundos).
 *   - "activa": hay lecturas; `orientacion.rumbo` es hacia dónde mira la cámara trasera, de 0 a 360.
 *   - "sinPermiso": el iPhone no dio permiso (o falló al pedirlo).
 *   - "sinSensor": no llegó ninguna lectura válida en 2 segundos (un ordenador, por ejemplo).
 * El panel de Hoy se vuelve a pintar entero al cambiar de día o de pestaña: por eso la brújula no se apaga al desmontarse un
 * componente, sino cuando no queda ninguno montado (`montar` y `desmontar` cuentan los que hay).
 */
import { rumboDe, giro } from "../nucleo/rumbo.js";

const ESPERA_MS = 2000;

export const orientacion = $state({ estado: "apagada", rumbo: null });

let escuchando = null;   // el tipo de evento que se escucha, o null
let temporizador = null; // la espera de la primera lectura
let intento = 0;         // cada encendido o apagado lo cambia: una respuesta tardía de un intento viejo no vale
let montadas = 0;

/** El navegador tiene eventos de orientación (un ordenador también, aunque no dé lecturas). */
export const hayBrujula = () => typeof window !== "undefined" && "DeviceOrientationEvent" in window;

function alLeer(evento) {
  const rumbo = rumboDe(evento);
  if (rumbo === null) return; // una lectura vacía no cuenta
  if (orientacion.estado === "pidiendo") { clearTimeout(temporizador); orientacion.estado = "activa"; }
  // Un cambio de menos de 1° es ruido del sensor
  if (orientacion.rumbo === null || Math.min(giro(rumbo, orientacion.rumbo), 360 - giro(rumbo, orientacion.rumbo)) >= 1) orientacion.rumbo = rumbo;
}

function dejarDeEscuchar() {
  clearTimeout(temporizador);
  temporizador = null;
  if (escuchando) window.removeEventListener(escuchando, alLeer);
  escuchando = null;
}

/** Enciende la brújula. Hay que llamarla desde un toque: el iPhone solo deja pedir el permiso así. */
export async function encender() {
  if (orientacion.estado === "pidiendo" || orientacion.estado === "activa") return;
  const mio = ++intento;
  orientacion.estado = "pidiendo";
  orientacion.rumbo = null;

  // El iPhone (y los Chrome recientes) piden permiso con un toque; otros navegadores no tienen esa función y escuchan sin más
  if (typeof (window.DeviceOrientationEvent && window.DeviceOrientationEvent.requestPermission) === "function") {
    let respuesta;
    try { respuesta = await window.DeviceOrientationEvent.requestPermission(); } catch { respuesta = "error"; }
    if (mio !== intento) return; // mientras se pedía, se apagó
    if (respuesta !== "granted") { orientacion.estado = "sinPermiso"; return; }
  }
  // Con rumbo absoluto (Android) se escucha ese evento; el iPhone no lo tiene y da `webkitCompassHeading` en `deviceorientation`
  const tipo = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";

  escuchando = tipo;
  window.addEventListener(tipo, alLeer);
  temporizador = setTimeout(() => {
    if (mio !== intento || orientacion.estado !== "pidiendo") return;
    dejarDeEscuchar();
    orientacion.estado = "sinSensor";
  }, ESPERA_MS);
}

/** Apaga la brújula: deja de escuchar y vuelve la flecha fija. */
export function apagar() {
  intento++;
  dejarDeEscuchar();
  orientacion.estado = "apagada";
  orientacion.rumbo = null;
}

/** Un componente con brújula se monta o se desmonta. Al desmontarse el último se apaga, pero se espera a que termine el
 *  repintado: si otro ocupa su lugar en ese mismo repintado (cambio de día o de pestaña), la brújula sigue encendida. */
export function montar() { montadas++; }
export function desmontar() {
  montadas--;
  queueMicrotask(() => { if (montadas <= 0) apagar(); });
}
