// Pantalla actual, según la parte de la dirección tras «#» (por ejemplo, «#/hoy»).
// Se usa «#» porque funciona en GitHub Pages sin configurar nada más.
const leer = () => (location.hash.replace(/^#\/?/, "").split("?")[0] || "hoy");

export const ruta = $state({ actual: leer() });

window.addEventListener("hashchange", () => { ruta.actual = leer(); });
