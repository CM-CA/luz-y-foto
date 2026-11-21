/*
 * Qué cielo se ve en la cabecera. Es una función pura: no sabe nada de imágenes ni de la pantalla.
 *
 *   - Manda la pestaña: el atardecer (motor «puntos-ventana») tiene cielo de tarde y la luna (motor «mejor-hora-nocturna»)
 *     cielo de noche, sea la hora que sea. Solo si todavía no hay pestaña (no ha llegado la previsión) se decide por
 *     la hora del dispositivo.
 *   - Manda el semáforo del día elegido: el rojo pone el cielo cubierto; el resto (verde, ámbar, sin datos) lo deja despejado.
 */
export const CIELOS = ["tarde", "tarde-cubierta", "noche", "noche-cubierta"];

const MOTOR_NOCTURNO = "mejor-hora-nocturna";
const MOTOR_DE_TARDE = "puntos-ventana";

// De noche, de las 20:00 a las 6:59 del dispositivo
const esDeNoche = (hora) => Number.isFinite(hora) && (hora >= 20 || hora < 7);

/**
 * @param {{ motor?: string | null, nivel?: string | null, hora?: number | null }} [entrada]
 *   motor: el del género elegido; nivel: verde, ambar, rojo o ninguno; hora: hora local del dispositivo, de 0 a 23
 * @returns {"tarde" | "tarde-cubierta" | "noche" | "noche-cubierta"}
 */
export function elegirCielo({ motor = null, nivel = null, hora = null } = {}) {
  const noche = motor === MOTOR_NOCTURNO || (motor !== MOTOR_DE_TARDE && esDeNoche(hora));
  const cubierto = nivel === "rojo";
  return (noche ? "noche" : "tarde") + (cubierto ? "-cubierta" : "");
}
