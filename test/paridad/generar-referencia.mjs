// Guarda en referencia/ lo que da la lógica ACTUAL (js/). Ejecutar con: TZ=Europe/Madrid node test/paridad/generar-referencia.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AREAS, calcularArea, serializar } from "./calcular.mjs";
import { logica } from "./logica-actual.mjs";

if (process.env.TZ !== "Europe/Madrid") { console.error("Hace falta TZ=Europe/Madrid"); process.exit(1); }
const carpeta = path.join(path.dirname(fileURLToPath(import.meta.url)), "referencia");
fs.mkdirSync(carpeta, { recursive: true });
for (const nombre of Object.keys(AREAS)) {
  const texto = serializar(await calcularArea(nombre, logica)) + "\n";
  fs.writeFileSync(path.join(carpeta, nombre + ".json"), texto);
  console.log(nombre.padEnd(16), (texto.length / 1024).toFixed(0).padStart(6), "KB");
}
