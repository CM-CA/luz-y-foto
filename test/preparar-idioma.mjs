// Las pruebas de la lógica se hacen en español, como el navegador de las pruebas (es-ES): Node trae `navigator.languages` en inglés.
// Quien pruebe el inglés llama a `fijarIdioma("en")` y lo deja como estaba al acabar.
import { fijarIdioma } from "../src/idioma/index.js";

fijarIdioma("es", ["es-ES"]);
