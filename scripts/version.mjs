/*
 * Los datos de la versión que se ven en el aviso legal: la de package.json y, si el proyecto está en un repositorio de git, el commit y la fecha
 * (día) del último cambio. Los usa vite.config.mjs al compilar (define). Sin git, o en una copia del proyecto sin su propio .git, el commit y la
 * fecha quedan vacíos: git no sube a carpetas de fuera (GIT_CEILING_DIRECTORIES), así una copia nunca toma el commit de otro repositorio.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function git(raiz, args) {
  try {
    const env = { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(raiz)) };
    return execFileSync("git", args, { cwd: raiz, env, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).trim();
  } catch (e) {
    return "";
  }
}

export function datosDeVersion(raiz) {
  const version = JSON.parse(fs.readFileSync(path.join(raiz, "package.json"), "utf8")).version;
  return {
    version,
    commit: git(raiz, ["rev-parse", "--short=7", "HEAD"]),
    fecha: git(raiz, ["log", "-1", "--format=%cs"])
  };
}
