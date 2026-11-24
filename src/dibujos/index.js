// Los dibujos de las lecciones: DIBUJOS[id] = { ancho, alto, claves, pintar(textos) }. `ancho` y `alto` son lo que mide el dibujo en pantalla
// (y su viewBox, así la página le reserva el sitio antes de pintarlo); `claves` dice qué textos pide de data/<idioma>/dibujos.json
// (un número = una lista de ese largo; null = un texto solo); `pintar(textos)` devuelve el SVG como texto.
import arquitectura from "./arquitectura.js";
import deporte from "./deporte.js";
import exposicion from "./exposicion.js";
import luces from "./luces.js";
import modos from "./modos.js";
import noche from "./noche.js";
import nocturna from "./nocturna.js";
import paisaje from "./paisaje.js";
import parasol from "./parasol.js";
import retrato from "./retrato.js";
import toca from "./toca.js";
import urbana from "./urbana.js";
import zoom from "./zoom.js";

export const DIBUJOS = { modos, exposicion, parasol, toca, noche, zoom, paisaje, deporte, urbana, luces, nocturna, retrato, arquitectura };
