// Los dibujos de las lecciones, en sus dos versiones: DIBUJOS[id] = { claro, oscuro } (la dirección de cada imagen). Es el único sitio que
// los importa: Vite los copia a dist/assets/ con un código en el nombre (dibujo-modos-claro-AbC123xY.webp) y así el service worker
// los guarda para usar sin conexión. Se generan con `node scripts/generar-dibujos.mjs`; el nombre de cada archivo es dibujo-<id>-<tema>.webp.
// dibujos.json (también generado) trae lo que mide cada dibujo en pantalla: la página le reserva el sitio antes de que cargue.
import medidas from "./dibujos.json";

const archivos = import.meta.glob("./dibujo-*.webp", { eager: true, import: "default" });

export const DIBUJOS = {};
for (const [archivo, url] of Object.entries(archivos)) {
  const [, id, tema] = /^\.\/dibujo-([a-z0-9-]+)-(claro|oscuro)\.webp$/.exec(archivo) || [];
  if (id) (DIBUJOS[id] ||= { ...medidas[id] })[tema] = url;
}
