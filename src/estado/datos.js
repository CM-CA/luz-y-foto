// Los datos de data/ (incluidos al compilar y ya validados) y el semáforo configurado con ellos.
import { datosIncluidos } from "../datos-incluidos.js";
import { crear } from "../nucleo/semaforo.js";

export const config = datosIncluidos();
export const S = crear(config);
