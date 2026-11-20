/*
 * Ubicación del dispositivo: la que da el navegador (GPS o red). Se queda en el dispositivo.
 * Rechaza con { codigo: "denegado" | "tiempo" | "no-disponible" }.
 */
function posicionGps(opciones) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject({ codigo: "no-disponible" });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject({ codigo: e.code === 1 ? "denegado" : e.code === 3 ? "tiempo" : "no-disponible" }),
      Object.assign({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }, opciones)
    );
  });
}

export { posicionGps };
