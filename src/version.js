// La versión de esta compilación, para el aviso legal. Los valores los pone Vite al compilar (`define` en vite.config.mjs, con los datos de
// scripts/version.mjs). Sin ellos (las pruebas, otro empaquetador) queda la versión 0.0.0 sin commit ni fecha.
import { resumenVersion } from "./nucleo/version.js";

/* global __OLLADA_VERSION__, __OLLADA_COMMIT__, __OLLADA_FECHA__ */
export const version = resumenVersion(typeof __OLLADA_VERSION__ === "undefined" ? {} : {
  version: __OLLADA_VERSION__, commit: __OLLADA_COMMIT__, fecha: __OLLADA_FECHA__
});
