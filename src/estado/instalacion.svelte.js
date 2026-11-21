/*
 * Instalar la app en la pantalla de inicio y diagnóstico de por qué (no) se puede.
 *
 * Cada navegador decide por su cuenta cuándo ofrecer instalar una app web y no explica por qué no lo hace.
 * Aquí se recoge lo que sí se puede saber (si el navegador ha ofrecido instalarla, si ya está instalada) y,
 * al abrir el panel, se comprueba cada requisito en el propio dispositivo: manifiesto, iconos, conexión segura
 * y service worker, con el motivo del fallo si lo hay. Así «no me deja instalarla» se puede resolver mirando el panel.
 */
import { version } from "./version.svelte.js";

export const instalacion = $state({
  evento: null,     // el aviso «se puede instalar» que da el navegador (si lo da); se usa para el botón
  instalada: false  // se ha instalado en esta sesión
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

const marca = { si: "✓", no: "✗", info: "•" };
const linea = (estado, texto) => ({ marca: marca[estado], estado, texto });

// Hash que el compilador pone en el nombre del archivo de la app que se está ejecutando (cambia con cada versión del código)
export function archivoDeLaApp() {
  const s = [...document.querySelectorAll("script[src]")].map((x) => x.src).find((u) => /\/assets\/index-[^/]+\.js/.test(u));
  return s ? decodeURIComponent(s.split("/").pop()) : "";
}

async function pedir(url) {
  const r = await fetch(url, { cache: "no-store" });
  return { r, tipo: (r.headers.get("content-type") || "").split(";")[0] || "sin tipo" };
}

// Comprueba los requisitos para instalar la app y devuelve las líneas del informe
export async function diagnosticar() {
  const l = [];
  l.push(linea("info", "App cargada: " + (archivoDeLaApp() || "no se pudo saber")));

  const seguro = location.protocol === "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  l.push(linea(seguro ? "si" : "no", seguro ? "Conexión segura (https)" : "La página no usa https: no se puede instalar"));

  // Manifiesto
  const enlace = document.querySelector("link[rel=manifest]");
  let manifiesto = null;
  if (!enlace) l.push(linea("no", "La página no enlaza el manifiesto"));
  else {
    try {
      const { r, tipo } = await pedir(enlace.href);
      if (!r.ok) l.push(linea("no", "Manifiesto: el servidor respondió " + r.status));
      else {
        manifiesto = await r.json();
        l.push(linea("si", "Manifiesto leído (" + tipo + "): «" + manifiesto.name + "», se abre como «" + manifiesto.display + "»"));
      }
    } catch (e) { l.push(linea("no", "Manifiesto: no se pudo leer (" + e.message + ")")); }
  }

  // Iconos: el navegador exige uno de 192 y otro de 512 que se puedan descargar
  if (manifiesto) {
    const raiz = enlace.href;
    for (const px of [192, 512]) {
      const icono = (manifiesto.icons || []).find((i) => i.type === "image/png" && i.sizes === px + "x" + px && (i.purpose || "any").includes("any"));
      if (!icono) { l.push(linea("no", "El manifiesto no tiene icono de " + px + " px")); continue; }
      try {
        const { r, tipo } = await pedir(new URL(icono.src, raiz).href);
        l.push(linea(r.ok && /^image\//.test(tipo) ? "si" : "no", "Icono de " + px + " px: " + (r.ok ? "se descarga (" + tipo + ")" : "el servidor respondió " + r.status)));
      } catch (e) { l.push(linea("no", "Icono de " + px + " px: no se pudo descargar (" + e.message + ")")); }
    }
    const inicio = new URL(manifiesto.start_url, raiz).pathname, ambito = new URL(manifiesto.scope || ".", raiz).pathname;
    l.push(linea(inicio.startsWith(ambito) && location.pathname.startsWith(ambito) ? "si" : "no", "Dirección de inicio dentro del ámbito de la app (" + ambito + ")"));
  }

  // Service worker
  const sw = version.sw;
  const textos = {
    "sin-soporte": ["no", "Este navegador no admite service workers: no habrá uso sin conexión"],
    "sin-comprobar": ["info", "El service worker todavía no se ha registrado"],
    registrando: ["info", "Registrando el service worker…"],
    instalando: ["info", "Instalando el service worker (guardando la app en el dispositivo)…"],
    listo: ["si", "Uso sin conexión listo" + (sw.version ? " · versión " + sw.version : "")],
    error: ["no", "El service worker falló: " + (sw.detalle || "sin detalles")]
  };
  const [estado, texto] = textos[sw.estado] || ["info", sw.estado];
  l.push(linea(estado, texto));
  if (sw.estado === "listo") {
    const controla = "serviceWorker" in navigator && !!navigator.serviceWorker.controller;
    l.push(linea(controla ? "si" : "info", controla ? "Esta página la gestiona el service worker" : "Esta página aún no la gestiona el service worker (se activa al recargar)"));
    try { const claves = (await caches.keys()).filter((k) => k.startsWith("luz-y-foto-")); l.push(linea(claves.length ? "si" : "no", "Guardado en el dispositivo: " + (claves.length ? claves.join(", ") : "nada"))); } catch (e) { l.push(linea("no", "No se pudo mirar lo guardado (" + e.message + ")")); }
  }

  l.push(linea("info", comoApp() ? "Estás usando la app instalada" : "Estás en el navegador (no como app instalada)"));
  l.push(linea("info", instalacion.evento ? "El navegador permite instalarla ahora: usa el botón de arriba" : instalacion.instalada ? "Instalada" : "El navegador no ha ofrecido instalarla (todavía)"));
  return l;
}
