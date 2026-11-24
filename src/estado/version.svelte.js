/*
 * Registro del service worker y aviso de «hay una versión nueva».
 *
 * El navegador baja en segundo plano el service worker nuevo cuando la app lo ha cambiado; queda «esperando» y
 * no sustituye al actual por su cuenta. Aquí se detecta ese caso y se enseña el aviso; solo cuando la persona
 * pulsa «Actualizar» se le dice al nuevo que tome el relevo y se recarga la página (una sola vez).
 * Si el navegador no admite service workers o el registro falla, la app funciona igual, solo que sin uso sin conexión
 * (no se cuenta en pantalla: no hay nada que la persona pueda hacer).
 */
export const version = $state({ nueva: false, actualizando: false });

let esperando = null;      // el service worker nuevo, a la espera de que se pulse «Actualizar»
let recargando = false;

export function registrarServiceWorker(base = import.meta.env.BASE_URL) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);

  const avisarSiHayNuevo = (reg) => {
    // Solo es una actualización si la página la controla el service worker ACTIVO de este mismo registro y hay otro esperando.
    // Si no controla ninguno es la primera instalación; y si controla el de otra web del mismo dominio (el del blog, en la raíz,
    // alcance «/») también lo es: el de la app aún no está activo y no hay nada que actualizar.
    const controla = navigator.serviceWorker.controller;
    if (reg.waiting && reg.active && controla && controla.scriptURL === reg.active.scriptURL) { esperando = reg.waiting; version.nueva = true; }
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // También salta en la primera instalación (el service worker toma el control): solo se recarga si se pidió actualizar
    if (!version.actualizando || recargando) return;
    recargando = true;
    location.reload();
  });

  return navigator.serviceWorker.register(base + "sw.js", { scope: base }).then((reg) => {
    if (!reg) return null; // algunos navegadores con los service workers bloqueados no fallan: no devuelven nada
    avisarSiHayNuevo(reg);
    reg.addEventListener("updatefound", () => {
      const nuevo = reg.installing;
      if (nuevo) nuevo.addEventListener("statechange", () => { if (nuevo.state === "installed") avisarSiHayNuevo(reg); });
    });
    // Se busca una versión nueva al volver a la app (el móvil la deja abierta días) y cada hora
    const buscar = () => { reg.update().catch(() => {}); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") buscar(); });
    setInterval(buscar, 60 * 60 * 1000);
    return reg;
  }).catch(() => null);
}

export function actualizar() {
  if (!esperando) return;
  version.actualizando = true;
  esperando.postMessage({ tipo: "saltar-espera" });
}
