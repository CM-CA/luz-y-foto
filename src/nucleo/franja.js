/*
 * «La luz de hoy»: la franja de colores que va del principio de la hora dorada al final de la hora azul, con la puesta
 * de sol marcada y, si el día es hoy y estamos dentro de la franja, la hora de ahora. Son funciones puras: no saben
 * nada de la pantalla; el componente solo pinta lo que sale de aquí.
 *
 * La franja se divide en BLOQUES iguales. Cada bloque es de día (del oro al color del sol, hasta la puesta) o de noche
 * (del violeta al azul de la hora azul, desde la puesta), según dónde cae su centro. `mezcla` (de 0 a 100) dice cuánto
 * ha avanzado el bloque dentro de su tramo, y el componente la usa para mezclar los dos colores del tramo.
 */
export const BLOQUES = 48;

const esNumero = (x) => typeof x === "number" && Number.isFinite(x);

/**
 * @param {{ dorada: number | null, puesta: number | null, azul: number | null, ahora?: number | null, esHoy?: boolean }} tiempos
 *   instantes en milisegundos: inicio de la hora dorada, puesta de sol, fin de la hora azul y ahora
 * @returns {null | { bloques: { tramo: "dia" | "noche", mezcla: number }[], puesta: number, ahora: number | null }}
 *   `puesta` y `ahora` van de 0 a 1 a lo largo de la franja; `ahora` es null si no es hoy o cae fuera de la franja.
 *   null si falta algún instante o no cumplen dorada < puesta < azul.
 */
export function franja({ dorada, puesta, azul, ahora = null, esHoy = false } = {}) {
  if (![dorada, puesta, azul].every(esNumero) || !(dorada < puesta && puesta < azul)) return null;
  const total = azul - dorada;

  const bloques = Array.from({ length: BLOQUES }, (_, i) => {
    const centro = dorada + ((i + 0.5) / BLOQUES) * total;
    return centro <= puesta
      ? { tramo: "dia", mezcla: ((centro - dorada) / (puesta - dorada)) * 100 }
      : { tramo: "noche", mezcla: ((centro - puesta) / (azul - puesta)) * 100 };
  });

  const dentro = esHoy && esNumero(ahora) && ahora >= dorada && ahora <= azul;
  return { bloques, puesta: (puesta - dorada) / total, ahora: dentro ? (ahora - dorada) / total : null };
}

/**
 * El título de la sección: «La luz de hoy», «La luz de mañana» o «La luz del lunes».
 * @param {string} fecha  día de la tarjeta, «AAAA-MM-DD»
 * @param {string} hoy    hoy en el lugar, «AAAA-MM-DD»
 * @param {string} manana mañana en el lugar, «AAAA-MM-DD»
 */
export function tituloDeLaLuz(fecha, hoy, manana) {
  if (fecha === hoy) return "La luz de hoy";
  if (fecha === manana) return "La luz de mañana";
  return "La luz del " + new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase();
}
