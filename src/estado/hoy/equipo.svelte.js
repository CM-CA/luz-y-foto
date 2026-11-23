/*
 * El perfil de equipo de la pantalla Hoy: el asistente de una pregunta por pantalla, el resumen del equipo y el trípode de hoy.
 */
import * as Perfil from "../../nucleo/perfil.js";
import { config } from "../datos.js";
import { hoy, repintar } from "./estado.svelte.js";

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
