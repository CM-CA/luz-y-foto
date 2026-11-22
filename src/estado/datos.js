// Los datos de data/<idioma>/ (incluidos al compilar y ya validados) y el semáforo configurado con ellos.
import { datosIncluidos } from "../datos-incluidos.js";
import { idioma } from "../idioma/index.js";
import { crear } from "../nucleo/semaforo.js";

export const config = datosIncluidos(idioma);
export const S = crear(config);
