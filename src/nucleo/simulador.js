/*
 * El simulador de exposición: la cuenta de pasos de luz y lo que cambia en la foto con cada ajuste. Todo son números enteros de pasos:
 * cada escala (apertura, tiempo, ISO) tiene siete valores seguidos, cada uno un paso de luz del anterior, y se guarda el índice (0 a 6).
 *
 *  - Apertura: f/2, 2,8, 4, 5,6, 8, 11, 16 (cada una deja pasar la mitad de luz que la anterior).
 *  - Tiempo: 1/1000, 1/500 … 1/15 s (cada uno, el doble de luz que el anterior).
 *  - ISO: 100, 200 … 6400 (cada uno, el doble de sensibilidad).
 *  - La luz de la escena se da en EV a ISO 100: EV = log2(N²/t). Con el sol, f/16 y 1/125 s (la regla de f/16) la exposición es la justa.
 *
 * Los pasos de luz que sobran (+) o faltan (−) salen de comparar la luz que hay con la que dejan entrar los tres ajustes.
 */

export const APERTURAS = [2, 2.8, 4, 5.6, 8, 11, 16];
export const TIEMPOS = [1000, 500, 250, 125, 60, 30, 15]; // el denominador: 1/1000 s, 1/500 s…
export const ISOS = [100, 200, 400, 800, 1600, 3200, 6400];

// El EV de cada luz de escena (a ISO 100). Sol directo y nublado salen de varias fuentes; en interior las fuentes difieren y se usa un valor medio.
export const LUCES = { sol: 15, nublado: 13, interior: 6 };

// El punto de partida: sol, f/8, 1/500 s e ISO 100 (la exposición justa)
export const INICIO = { luz: "sol", apertura: 4, tiempo: 1, iso: 0 };

// Pasos de luz de más (+) o de menos (−) respecto a la exposición justa. Con N = 2^(1 + i/2) y t = 1/2^(10 − j), los tres ajustes dan a ISO 100
// EV = log2(N²/t) = 12 + i − j; cada paso de ISO suma uno y la escena pide su EV. Todo son enteros: no hay redondeos.
export function pasos({ luz, apertura, tiempo, iso }) {
  return LUCES[luz] + iso - (12 + apertura - tiempo);
}

export function veredicto(p) {
  if (p <= -2) return "muyOscura";
  if (p === -1) return "oscura";
  if (p === 0) return "bien";
  if (p === 1) return "clara";
  return "muyClara";
}

// Cuánto se aclara u oscurece la foto con los pasos de luz: una curva suave, con tope a ±4 pasos para que siga viéndose algo
const TOPE_PASOS = 4;
export function factorDeLuz(p) {
  const c = Math.max(-TOPE_PASOS, Math.min(TOPE_PASOS, p));
  return Math.pow(2, c * 0.75);
}

// Lo que se ve de cada ajuste, en píxeles de la escena (viewBox) o en intensidad (0 a 0,6)
export const desenfoqueFondo = (i) => 14 / APERTURAS[i]; // f/2 → 7 px; f/16 → 0,9 px
export const desenfoqueMovimiento = (j) => Math.min(24, 600 / TIEMPOS[j]); // 1/1000 → 0,6 px; 1/15 → 24 px (tope)
export const intensidadGrano = (k) => (k / (ISOS.length - 1)) * 0.6;

// Los niveles con que se elige la frase de lo que pasa: 0, 1 o 2 (de «poco» a «mucho» según el ajuste)
export const nivelFondo = (i) => (i <= 1 ? 0 : i <= 3 ? 1 : 2); // 0: muy desenfocado; 2: nítido
export const nivelMovimiento = (j) => (j <= 2 ? 0 : j <= 4 ? 1 : 2); // 0: congelado; 2: con estela
export const nivelGrano = (k) => (k <= 1 ? 0 : k <= 4 ? 1 : 2); // 0: limpio; 2: con mucho grano

// Las etiquetas de los valores que se muestran junto a cada deslizador
export const etiquetaApertura = (i, separador = ",") => "f/" + String(APERTURAS[i]).replace(".", separador);
export const etiquetaTiempo = (j) => "1/" + TIEMPOS[j] + " s";
export const etiquetaIso = (k) => "ISO " + ISOS[k];
