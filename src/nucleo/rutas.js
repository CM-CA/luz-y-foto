// Qué pantalla pide la dirección. `actual` es el texto tras «#/» (sin consulta; vacío = Hoy), tal como lo da `ruta.actual`.
// Devuelve { pantalla: "hoy" | "aprender" | "leccion" | "desconocida", id }; `id` solo hay en una lección.
const DESCONOCIDA = { pantalla: "desconocida", id: null };

export function analizarRuta(actual) {
  const [primero, id, ...resto] = String(actual || "").replace(/\/$/, "").split("/");
  if (resto.length > 0) return DESCONOCIDA;
  if (id === undefined && (primero === "" || primero === "hoy")) return { pantalla: "hoy", id: null };
  if (primero !== "aprender") return DESCONOCIDA;
  if (id === undefined) return { pantalla: "aprender", id: null };
  return id === "" ? DESCONOCIDA : { pantalla: "leccion", id };
}
