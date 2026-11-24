// Los dibujos de las lecciones: DIBUJOS[id] = { ancho, alto, claves, pintar(textos) }. `ancho` y `alto` son lo que mide el dibujo en pantalla
// (y su viewBox, así la página le reserva el sitio antes de pintarlo); `claves` dice qué textos pide de data/<idioma>/dibujos.json
// (un número = una lista de ese largo; null = un texto solo); `pintar(textos)` devuelve el SVG como texto.
import arquitectura from "./arquitectura.js";
import blancos from "./blancos.js";
import contraluz from "./contraluz.js";
import composicion from "./composicion.js";
import deporte from "./deporte.js";
import encuadre from "./encuadre.js";
import enfoque from "./enfoque.js";
import exposicion from "./exposicion.js";
import focales from "./focales.js";
import fuga from "./fuga.js";
import histograma from "./histograma.js";
import largaexp from "./largaexp.js";
import luces from "./luces.js";
import luzdura from "./luzdura.js";
import medicion from "./medicion.js";
import modos from "./modos.js";
import noche from "./noche.js";
import nocturna from "./nocturna.js";
import paisaje from "./paisaje.js";
import parasol from "./parasol.js";
import rawjpeg from "./rawjpeg.js";
import retrato from "./retrato.js";
import toca from "./toca.js";
import urbana from "./urbana.js";
import zoom from "./zoom.js";

export const DIBUJOS = { modos, exposicion, parasol, toca, noche, zoom, paisaje, deporte, urbana, luces, nocturna, retrato, arquitectura, histograma, composicion, encuadre, fuga, luzdura, contraluz, blancos, rawjpeg, medicion, enfoque, largaexp, focales };
