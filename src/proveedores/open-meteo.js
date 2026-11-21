/*
 * Proveedor de la previsión: Open-Meteo (sin clave). Si se cambia de proveedor, solo hay que tocar este módulo.
 * Condiciones: la API gratuita es solo para uso no comercial; ver docs/migracion-svelte.md.
 */

// La petición de la previsión: ayer + 4 días, con las horas del lugar
function urlPrevision(lat, lon) {
  const p = new URLSearchParams({
    latitude: lat, longitude: lon,
    hourly: ["cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "visibility",
      "precipitation_probability", "precipitation", "weather_code"].join(","),
    daily: "sunrise,sunset", timezone: "auto", past_days: 1, forecast_days: 4
  });
  return "https://api.open-meteo.com/v1/forecast?" + p;
}

// Pide la previsión. Sin límite de tiempo y con el mismo mensaje de error que la versión actual («HTTP 500»).
async function pedirPrevision(lat, lon) {
  const resp = await fetch(urlPrevision(lat, lon));
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  return resp.json();
}

export { urlPrevision, pedirPrevision };
