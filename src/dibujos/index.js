// Los dibujos de las lecciones: DIBUJOS[id] = { ancho, alto, claves, pintar(textos) }. `ancho` y `alto` son lo que mide el dibujo en pantalla
// (y su viewBox, así la página le reserva el sitio antes de pintarlo); `claves` dice qué textos pide de data/<idioma>/dibujos.json
// (un número = una lista de ese largo; null = un texto solo); `pintar(textos)` devuelve el SVG como texto.
import deporte from "./deporte.js";
import exposicion from "./exposicion.js";
import modos from "./modos.js";
import noche from "./noche.js";
import paisaje from "./paisaje.js";
import parasol from "./parasol.js";
import toca from "./toca.js";
import zoom from "./zoom.js";

export const DIBUJOS = { modos, exposicion, parasol, toca, noche, zoom, paisaje, deporte };
