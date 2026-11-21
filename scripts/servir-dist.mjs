// Sirve la carpeta compilada (dist/) bajo una ruta, como hace GitHub Pages, para probarla en el navegador.
//
//   node scripts/servir-dist.mjs [--puerto=4173] [--base=/luz-y-foto/beta/] [--carpeta=dist]
//
// Escribe en la salida «LISTO http://127.0.0.1:PUERTO/BASE» cuando está en marcha. Con --puerto=0 elige uno libre.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argumento = (nombre, defecto) => (process.argv.find((a) => a.startsWith("--" + nombre + "=")) || "").split("=")[1] ?? defecto;
const puerto = Number(argumento("puerto", "4173"));
const base = argumento("base", "/luz-y-foto/beta/").replace(/\/?$/, "/");
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", argumento("carpeta", "dist"));

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json"
};

const servidor = http.createServer((q, r) => {
  const ruta = decodeURIComponent(new URL(q.url, "http://x").pathname);
  if (!ruta.startsWith(base)) { r.writeHead(404); return r.end("fuera de la ruta base"); }
  let f = path.join(dist, ruta.slice(base.length));
  if (!f.startsWith(dist)) { r.writeHead(403); return r.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); return r.end("no encontrado"); }
    r.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream", "cache-control": "no-cache" });
    r.end(d);
  });
});

servidor.listen(puerto, "127.0.0.1", () => console.log("LISTO http://127.0.0.1:" + servidor.address().port + base));
