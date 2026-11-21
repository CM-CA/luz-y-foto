// Service worker de baja de la vista previa (/beta/). La versión nueva pasó a la raíz y /beta/ ya no es una app.
// Quien instaló la vista previa tiene un service worker viejo con su caché; cuando el navegador busca una versión nueva
// de este archivo (la app lo hace al volver a ella y cada hora), encuentra este, que pide activarse en el acto (el
// navegador lo hace cuando puede: enseguida, al cerrar la app o en la próxima visita a /beta/). Al activarse borra la
// caché de la vista previa, lleva las ventanas abiertas a la raíz (con su misma ruta) y se da de baja; si no había
// ventanas, la próxima visita a /beta/ ya llega a la redirección de index.html.
//
// Solo se borran las cachés con archivos de /beta/: la app de la raíz guarda la suya con el mismo estilo de nombre
// («luz-y-foto-…») en el mismo sitio, y es la que le da el uso sin conexión.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    const alcance = self.registration.scope;
    for (const nombre of await caches.keys()) {
      const cache = await caches.open(nombre);
      if ((await cache.keys()).some((peticion) => peticion.url.startsWith(alcance))) await caches.delete(nombre);
    }
    const raiz = new URL("../", alcance).href;
    const ventanas = await self.clients.matchAll({ type: "window" });
    await Promise.all(ventanas.map((ventana) => ventana.navigate(raiz + new URL(ventana.url).hash).catch(() => null)));
    await self.registration.unregister();
  })());
});
