/*
 * Service worker de la app (plantilla). Al compilar, scripts/pwa.mjs rellena la versión y la lista de archivos
 * (las dos constantes de abajo) y lo escribe como dist/sw.js. No es un módulo de la app: lo carga el navegador por su cuenta.
 *
 * Qué hace:
 *  - Al instalarse guarda en caché TODOS los archivos de la app (página, JS, CSS, imágenes, iconos). Con eso abre sin red.
 *  - Sirve esos archivos desde la caché (así la página y sus archivos siempre son de la misma versión).
 *  - NO toca las peticiones a otros sitios (previsión, nombre del lugar…): esas las gestiona la propia app.
 *  - Una versión nueva se instala en segundo plano y ESPERA: no sustituye a la actual hasta que la persona
 *    pulsa «Actualizar» en el aviso de la app (mensaje «saltar-espera»). Así nunca cambia la app a medio uso
 *    ni queda una mezcla de archivos viejos y nuevos.
 */
"use strict";

const VERSION = "__VERSION__";
const ARCHIVOS = __ARCHIVOS__; // relativos a este archivo
const PREFIJO = "luz-y-foto-";
const CACHE = PREFIJO + VERSION;
const PAGINA = new URL("index.html", self.location).href;

self.addEventListener("install", (evento) => {
  // cache: "reload" evita copiar de la caché del navegador una versión vieja de un archivo
  evento.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARCHIVOS.map((a) => new Request(a, { cache: "reload" }))))
      // Si falta o falla un archivo, la instalación se descarta entera y no se deja una caché vacía
      .catch((e) => caches.delete(CACHE).then(() => { throw e; }))
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    // Fuera las cachés de versiones anteriores
    const claves = await caches.keys();
    await Promise.all(claves.filter((k) => k.startsWith(PREFIJO) && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (evento) => {
  const tipo = evento.data && evento.data.tipo;
  if (tipo === "saltar-espera") self.skipWaiting();
  // La app pregunta qué versión es (para enseñarla en «Instalar la app y uso sin conexión»)
  if (tipo === "version" && evento.ports && evento.ports[0]) evento.ports[0].postMessage(VERSION);
});

self.addEventListener("fetch", (evento) => {
  const q = evento.request;
  if (q.method !== "GET" || new URL(q.url).origin !== self.location.origin) return;
  evento.respondWith(responder(q));
});

async function responder(q) {
  const cache = await caches.open(CACHE);
  // Cualquier dirección de la app (con o sin «index.html», con o sin «?…») abre la misma página
  const guardada = await cache.match(q.mode === "navigate" ? PAGINA : q);
  if (guardada) return guardada;
  return fetch(q); // algo que no es de la app: tal cual (si no hay red, falla como siempre)
}
