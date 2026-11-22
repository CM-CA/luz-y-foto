/*
 * Petición de JSON con límite de tiempo, común a los proveedores. Lanza un error si la respuesta no es correcta.
 * `senal` (opcional) es una AbortSignal de quien llama: al abortarla se cancela la petición (por ejemplo, cuando ya no hace falta
 * la respuesta porque se ha escrito otra cosa). Si llega ya abortada, no se pide nada.
 */
async function pedirJson(url, ms, senal) {
  if (senal && senal.aborted) throw new DOMException("Petición cancelada", "AbortError");
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ms || 8000);
  const cancelar = () => control.abort();
  if (senal) senal.addEventListener("abort", cancelar, { once: true });
  try {
    const r = await fetch(url, { signal: control.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(reloj);
    if (senal) senal.removeEventListener("abort", cancelar);
  }
}

export { pedirJson };
