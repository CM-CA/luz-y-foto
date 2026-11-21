/*
 * La brújula de la luna y del móvil. Son funciones puras: no saben nada de la pantalla ni del sensor; los componentes pintan
 * lo que sale de aquí.
 *
 *   - posicionLuna: dónde está la luna en un instante (azimut desde el norte y altura sobre el horizonte).
 *   - momentoDeLaLuna: a qué momento de la noche apunta la flecha (ahora, la mejor hora, el anochecer o la salida).
 *   - punos: la altura en puños a brazo extendido (1 puño ≈ 10°).
 *   - giro: cuánto hay que girar desde el rumbo del móvil hasta el objetivo.
 *   - rumboDe: hacia dónde mira la cámara trasera del móvil según un evento de orientación.
 */
import * as SunCalc from "suncalc";

const MINUTO = 60000;
const RAD = Math.PI / 180;

const esNumero = (x) => typeof x === "number" && Number.isFinite(x);
const entre0y360 = (grados) => { const r = grados % 360; return r < 0 ? r + 360 : r; }; // un valor ya en [0, 360) no se toca

/**
 * @param {Date | number} fecha  instante (Date o ms)
 * @returns {{ az: number, alt: number }}  az: grados de 0 a 360 (0 = norte); alt: grados sobre el horizonte
 */
export function posicionLuna(fecha, lat, lon) {
  const p = SunCalc.getMoonPosition(fecha instanceof Date ? fecha : new Date(fecha), lat, lon);
  return { az: p.azimuth, alt: p.altitude };
}

/**
 * A qué momento de la noche apunta la flecha de la luna. Por orden:
 *   1. «ahora»: la noche está en curso y la luna está sobre el horizonte ahora.
 *   2. «mejor»: hay una mejor hora (la del semáforo).
 *   3. «anochecer» / «sale»: la primera lectura (de minuto en minuto) con la luna sobre el horizonte; si ya estaba arriba
 *      al anochecer es «anochecer», y si sale más tarde, «sale».
 *   4. null: la luna no está sobre el horizonte en toda la noche.
 * @param {{ inicio: number, fin: number, ahora: number, mejorHora: number | null, lat: number, lon: number }} noche
 *   inicio: puesta de sol; fin: amanecer siguiente; ahora y mejorHora en ms
 * @returns {null | { tipo: "ahora" | "mejor" | "anochecer" | "sale", t: number, az: number, alt: number }}
 */
export function momentoDeLaLuna({ inicio, fin, ahora, mejorHora, lat, lon }) {
  const en = (t, tipo) => ({ tipo, t, ...posicionLuna(t, lat, lon) });
  const enCurso = inicio <= ahora && ahora < fin;

  if (enCurso) {
    const m = en(ahora, "ahora");
    if (m.alt > 0) return m;
  }
  if (esNumero(mejorHora)) return en(mejorHora, "mejor");

  for (let t = enCurso ? ahora : inicio; t < fin; t += MINUTO) {
    const m = en(t, t === inicio ? "anochecer" : "sale");
    if (m.alt > 0) return m;
  }
  return null;
}

/** La altura en puños de 10° (a brazo extendido), sin bajar de 0. */
export function punos(alt) {
  return Math.max(0, Math.round(alt / 10));
}

/** Cuánto hay que girar (en grados, de 0 a 360) desde el rumbo del móvil hasta el objetivo. */
export function giro(az, rumbo) {
  return entre0y360(az - rumbo);
}

/**
 * Hacia dónde mira la cámara trasera del móvil, de 0 a 360 (0 = norte), según un evento de orientación del dispositivo.
 *   - iPhone: `webkitCompassHeading` ya es el rumbo.
 *   - Android (y otros): solo vale una lectura absoluta (`absolute`, con el norte magnético); el rumbo es la dirección que
 *     sale por la parte de atrás del móvil proyectada en el horizonte (fórmula del W3C con alpha, beta y gamma). Con el móvil
 *     casi plano esa dirección apunta al suelo, y se usa hacia donde mira la parte de arriba del móvil.
 * @returns {number | null} null si el evento no trae una lectura válida (el escritorio dispara uno con todo a null)
 */
export function rumboDe(evento) {
  if (!evento || typeof evento !== "object") return null;
  if (esNumero(evento.webkitCompassHeading)) return entre0y360(evento.webkitCompassHeading);
  if (evento.absolute !== true || !esNumero(evento.alpha)) return null;

  const z = evento.alpha * RAD, x = (esNumero(evento.beta) ? evento.beta : 0) * RAD, y = (esNumero(evento.gamma) ? evento.gamma : 0) * RAD;
  const vx = -Math.cos(z) * Math.sin(y) - Math.sin(z) * Math.sin(x) * Math.cos(y);
  const vy = -Math.sin(z) * Math.sin(y) + Math.cos(z) * Math.sin(x) * Math.cos(y);
  if (Math.hypot(vx, vy) < 0.05) return entre0y360(360 - evento.alpha);
  return entre0y360(Math.atan2(vx, vy) / RAD);
}
