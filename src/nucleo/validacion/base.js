/*
 * Lo que comparten todos los validadores de datos: las tres preguntas «¿es un número?», «¿es un texto con contenido?» y «¿es un objeto?».
 */

export const esNumero = (x) => typeof x === "number" && Number.isFinite(x);
export const esTexto = (x) => typeof x === "string" && x.trim().length > 0;
export const esObjeto = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
