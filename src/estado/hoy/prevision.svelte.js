/*
 * La previsión de la pantalla Hoy: pedirla, ponerla en pantalla, enseñar la guardada cuando no hay red y reintentar al volver la conexión.
 */
import { config, S } from "../datos.js";
import * as Guardada from "../../nucleo/previsionGuardada.js";
import { hm } from "../../nucleo/formato.js";
import { prepararVista } from "../../nucleo/dias.js";
import { pedirPrevision } from "../../proveedores/open-meteo.js";
import { t } from "../../idioma/index.js";
import { hoy, repintar } from "./estado.svelte.js";

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
export async function consultar(lat, lon, { conservarVista = false } = {}) {
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
export function escucharConexion() {
  if (escuchando) return;
  escuchando = true;
  window.addEventListener("online", reintentarSiHaceFalta);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reintentarSiHaceFalta(); });
}
