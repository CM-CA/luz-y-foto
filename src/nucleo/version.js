// Cómo se escribe la versión de la app en el aviso legal. Los datos los pone la compilación (scripts/version.mjs); aquí solo se limpian y se
// juntan, para que nada raro llegue a la pantalla: una versión que no es de la forma 1.2.3 se ve como 0.0.0, y un commit o una fecha que no lo
// parecen se omiten.
const VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const COMMIT = /^[0-9a-f]{7,12}$/;
const FECHA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// { version, commit, fecha } -> { corta: "v1.2.3", completa: "1.2.3 (a1b2c3d, 2026-11-26)" }
export function resumenVersion({ version, commit, fecha } = {}) {
  const v = VERSION.test(version) ? version : "0.0.0";
  const extra = [COMMIT.test(commit) ? commit : "", FECHA.test(fecha) ? fecha : ""].filter(Boolean);
  return { corta: "v" + v, completa: extra.length ? v + " (" + extra.join(", ") + ")" : v };
}
