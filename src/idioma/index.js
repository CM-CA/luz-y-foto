/*
 * El idioma de esta carga de la página. Se decide una sola vez al importar el módulo (con el idioma del teléfono y la elección
 * guardada) y no cambia hasta recargar: elegir otro idioma en el selector lo guarda y recarga la página.
 * Las pruebas lo fijan a mano con `fijarIdioma`.
 */
import { elegirIdioma, localeDeFormato, leerEleccion } from "../nucleo/idioma.js";

const idiomasDelTelefono = () => {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages && navigator.languages.length) return Array.from(navigator.languages);
  return navigator.language ? [navigator.language] : [];
};

// «es» o «en», y la variante con que se formatean horas y fechas («es-ES», «en-US», «en-GB»…)
export let idioma = elegirIdioma(idiomasDelTelefono(), leerEleccion());
export let locale = localeDeFormato(idioma, idiomasDelTelefono());

// Para las pruebas (y para quien llame antes de pintar nada): fija el idioma y la variante de formato
export function fijarIdioma(id, telefono) {
  idioma = id;
  locale = localeDeFormato(id, telefono || idiomasDelTelefono());
}

// Al arrancar: la página dice en qué idioma está (lectores de pantalla, traductores del navegador)
export function aplicarAPagina() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = idioma;
}
