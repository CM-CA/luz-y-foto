/*
 * El idioma de esta carga de la página. Se decide una sola vez al importar el módulo (con el idioma del teléfono y la elección
 * guardada) y no cambia hasta recargar: elegir otro idioma en el selector lo guarda y recarga la página.
 * Las pruebas lo fijan a mano con `fijarIdioma`.
 */
import { elegirIdioma, localeDeFormato, leerEleccion } from "../nucleo/idioma.js";
import es from "./es.js";
import en from "./en.js";

const idiomasDelTelefono = () => {
  // Fuera de un navegador (las pruebas y los scripts en Node, que también tienen `navigator`, en inglés) no hay idioma del teléfono: español
  if (typeof window === "undefined" || typeof navigator === "undefined") return [];
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

/*
 * Los textos de la interfaz. Una entrada del diccionario es un texto con huecos {nombre}, una función (valores) => texto o una lista.
 * No se llama a t() al cargar un módulo (el idioma puede fijarse después, en las pruebas): solo cuando algo se pinta o se calcula.
 */
const DICCIONARIOS = { es, en };
// Si una clave faltara en inglés se ve en español (una prueba impide que falte); si no existe en ninguno, se ve la clave
const entrada = (clave) => { const e = DICCIONARIOS[idioma][clave]; return e === undefined ? es[clave] : e; };

export function t(clave, valores = {}) {
  const e = entrada(clave);
  if (typeof e === "function") return e(valores);
  if (typeof e !== "string") return clave;
  return e.replace(/\{(\w+)\}/g, (_, k) => (k in valores ? String(valores[k]) : "—"));
}

// El texto sin rellenar, con sus {huecos}: para pintarlos con negrita o con un enlace (componente Plantilla)
export function crudo(clave) {
  const e = entrada(clave);
  return typeof e === "string" ? e : clave;
}

// Una entrada que es una lista de textos (los puntos cardinales)
export function traducirLista(clave) {
  const e = entrada(clave);
  return Array.isArray(e) ? e : [];
}

// Al arrancar: la página dice en qué idioma está (lectores de pantalla, traductores del navegador) y se describe en él.
// El título («Ollada») es el mismo en los dos idiomas y queda como lo trae index.html.
export function aplicarAPagina() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = idioma;
  const descripcion = document.querySelector('meta[name="description"]');
  if (descripcion) descripcion.setAttribute("content", t("app.descripcion"));
}
