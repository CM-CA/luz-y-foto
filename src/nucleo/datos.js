/*
 * Datos de Ollada: validación de los archivos de data/.
 *
 * La validación existe para que un error al editar un JSON (un número fuera de sitio, un texto
 * que falta, un género mal escrito) se detecte con un mensaje claro y no con un fallo extraño.
 * Se usa al compilar (npm run validar y vite build) y en las pruebas. Los datos van incluidos en la compilación
 * (src/datos-incluidos.js), así que aquí ya no hay carga con fetch como en la versión actual.
 *
 * Cada parte de los datos se valida en su archivo de src/nucleo/validacion/ (géneros, perfil, recetas, lecciones, dibujos); aquí solo se
 * juntan, en este orden, y se reexportan las listas que usan las pruebas.
 */
import { esObjeto } from "./validacion/base.js";
import { validarGeneros, MOTORES, EVENTOS, CAMPOS, NIVELES_LLUVIA, FASES } from "./validacion/generos.js";
import { validarPerfil } from "./validacion/perfil.js";
import { validarRecetas } from "./validacion/recetas.js";
import { validarLecciones, PALABRAS_MAX_LECCION } from "./validacion/lecciones.js";
import { validarDibujos } from "./validacion/dibujos.js";

// Devuelve una lista de errores en español (vacía si todo está bien)
function validar(config) {
  const errores = [];
  if (!esObjeto(config)) return ["No hay datos que validar"];
  if (!validarGeneros(config, errores)) return errores;
  validarPerfil(config.perfil, errores);
  validarRecetas(config, errores);
  validarLecciones(config, errores);
  validarDibujos(config, errores);
  return errores;
}

export { validar, MOTORES, EVENTOS, CAMPOS, NIVELES_LLUVIA, FASES, PALABRAS_MAX_LECCION };
