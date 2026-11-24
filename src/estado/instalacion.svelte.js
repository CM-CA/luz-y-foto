/*
 * Instalar la app en la pantalla de inicio.
 *
 * Cada navegador decide por su cuenta cuándo ofrecer instalar una app web. Aquí se recoge lo que sí se puede saber (si el navegador
 * ha ofrecido instalarla, si se ha instalado en esta sesión, si se está usando ya como app) para el panel «Instalar la app y uso sin conexión».
 * El panel no enseña datos técnicos (archivos, versiones, cachés, estado del service worker): no son para quien usa la app.
 */
export const instalacion = $state({
  evento: null,     // el aviso «se puede instalar» que da el navegador (si lo da); se usa para el botón
  instalada: false  // se ha instalado en esta sesión (pero esta página sigue abierta en el navegador)
});

let escuchando = false;
export function escucharInstalacion() {
  if (escuchando || typeof window === "undefined") return;
  escuchando = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // se guarda para ofrecerlo con un botón nuestro, en vez del aviso del navegador
    instalacion.evento = e;
  });
  window.addEventListener("appinstalled", () => { instalacion.evento = null; instalacion.instalada = true; });
}

export async function instalar() {
  const e = instalacion.evento;
  if (!e) return;
  instalacion.evento = null; // el navegador solo deja usarlo una vez
  try { await e.prompt(); const r = await e.userChoice; if (r && r.outcome === "accepted") instalacion.instalada = true; } catch (err) { /* cancelado o no permitido: no pasa nada */ }
}

// ¿Se está usando ya como app (abierta desde el icono) y no como página del navegador?
export const comoApp = () => {
  try { return matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true; } catch (e) { return false; }
};
