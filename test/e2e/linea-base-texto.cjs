/*
 * Genera test/e2e/fixtures/texto-es.json: el texto visible del español, pantalla por pantalla, con la app compilada.
 * Se hizo con el código anterior a los idiomas (master tras poner el título del veredicto en mayúsculas); la prueba compilada/texto-es.e2e.cjs
 * exige que el español siga idéntico. Para regenerarla con los idiomas ya dentro habría que hacerlo desde una copia sin ellos, o se perdería la comparación.
 * Solo se vuelve a ejecutar si se cambia a propósito un texto del español.
 *
 * Ejecutar: node test/e2e/linea-base-texto.cjs   (antes: npm run build)
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { ejecutar } = require("./ayudas.cjs");
const { recorrer } = require("./recorrido-texto.cjs");

ejecutar("linea-base-texto", async ({ b, base }) => {
  const salida = await recorrer({ b, base });
  const destino = path.join(__dirname, "fixtures", "texto-es.json");
  fs.writeFileSync(destino, JSON.stringify(salida, null, 1) + "\n");
  console.log("ok    " + Object.keys(salida).length + " pantallas guardadas en " + path.relative(process.cwd(), destino));
});
