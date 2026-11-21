// Plugin de Vite que escribe el service worker (dist/sw.js) al compilar.
//
// Parte de la plantilla src/service-worker.js y le pone dos cosas:
//   - la lista de archivos de dist/ que debe guardar en caché (todos menos el propio sw.js), y
//   - una versión, que es una huella de esos archivos: si cambia cualquiera, cambia el sw.js,
//     el navegador lo detecta y la app avisa de que hay una versión nueva.
// Se hizo a mano en vez de con vite-plugin-pwa: la plantilla son 50 líneas que se leen enteras y no depende de Workbox.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const plantilla = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "service-worker.js");

function archivosDe(carpeta, relativa = "") {
  return fs.readdirSync(path.join(carpeta, relativa), { withFileTypes: true }).flatMap((e) => {
    const ruta = path.posix.join(relativa, e.name);
    return e.isDirectory() ? archivosDe(carpeta, ruta) : [ruta];
  });
}

// Devuelve el texto del service worker para los archivos de `carpeta`
export function construirServiceWorker(carpeta) {
  const archivos = archivosDe(carpeta).filter((a) => a !== "sw.js" && !a.endsWith(".map")).sort();
  const huella = crypto.createHash("sha256");
  archivos.forEach((a) => huella.update(a).update("\0").update(fs.readFileSync(path.join(carpeta, a))).update("\0"));
  const version = huella.digest("hex").slice(0, 12);
  const texto = fs.readFileSync(plantilla, "utf8");
  // Cada marcador debe aparecer exactamente una vez (si no, algo de la plantilla se ha roto o se sustituiría un comentario)
  for (const marcador of ["__VERSION__", "__ARCHIVOS__"])
    if (texto.split(marcador).length !== 2) throw new Error("En la plantilla del service worker, " + marcador + " debe aparecer exactamente una vez");
  return { version, archivos, texto: texto.replace('"__VERSION__"', JSON.stringify(version)).replace("__ARCHIVOS__", JSON.stringify(archivos, null, 2)) };
}

export function servicioSinConexion() {
  return {
    name: "service-worker",
    apply: "build",
    // writeBundle: ya están en dist/ los archivos compilados y los de public/
    writeBundle(opciones) {
      const carpeta = opciones.dir;
      const { version, archivos, texto } = construirServiceWorker(carpeta);
      fs.writeFileSync(path.join(carpeta, "sw.js"), texto);
      this.info("service worker: versión " + version + ", " + archivos.length + " archivos en caché");
    }
  };
}
