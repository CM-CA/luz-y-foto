/*
 * Petición de JSON con límite de tiempo, común a los proveedores. Lanza un error si la respuesta no es correcta.
 */
async function pedirJson(url, ms) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ms || 8000);
  try {
    const r = await fetch(url, { signal: control.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(reloj);
  }
}

export { pedirJson };
