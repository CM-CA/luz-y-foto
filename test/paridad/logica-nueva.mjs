// La lógica NUEVA (src/): lo que se comprueba contra las referencias generadas con la lógica actual.
import * as Astro from "../../src/nucleo/astro.js";
import * as Semaforo from "../../src/nucleo/semaforo.js";
import * as Datos from "../../src/nucleo/datos.js";
import * as Perfil from "../../src/nucleo/perfil.js";
import * as Recetas from "../../src/nucleo/recetas.js";
import * as NucleoLugar from "../../src/nucleo/lugar.js";
import * as Nominatim from "../../src/proveedores/nominatim.js";
import * as Geocodificacion from "../../src/proveedores/geocodificacion.js";
import * as Gps from "../../src/proveedores/gps.js";
import { urlPrevision } from "../../src/proveedores/open-meteo.js";
import * as Dias from "../../src/nucleo/dias.js";
import * as Formato from "../../src/nucleo/formato.js";
import { datosIncluidos } from "../../src/datos-incluidos.js";

// En la versión actual todo esto es un solo objeto «Lugar»; aquí está repartido por módulos
const Lugar = { ...NucleoLugar, ...Nominatim, ...Geocodificacion, ...Gps };

// La lógica de la pantalla (en la versión actual está dentro de hoy.html)
const pantalla = { nochesDe: Dias.nochesDe, listaDe: Dias.listaDe, fechaLugar: Dias.fechaLugar, etiquetaDia: Dias.etiquetaDia,
  pestanaPorDefecto: Dias.pestanaPorDefecto, hm: Formato.hm, pct: Formato.pct, unida: Formato.unida, mayus: Formato.mayus };

export const logica = { Astro, Semaforo, Datos, Perfil, Recetas, Lugar, urlPrevision, datosCargados: async () => datosIncluidos(), pantalla };
