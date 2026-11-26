// La versión de la app que se ve en el aviso legal: cómo se escribe (src/nucleo/version.js), de dónde sale al compilar (scripts/version.mjs) y que
// package.json y su lock dicen lo mismo. Se ejecutan con: npx vitest run test/nucleo/version.test.js
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { it } from "vitest";
import { resumenVersion } from "../../src/nucleo/version.js";
import { datosDeVersion } from "../../scripts/version.mjs";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const prueba = it;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

prueba("versión: con versión, commit y fecha se escribe «1.2.3 (a1b2c3d, 2026-11-26)» y la corta lleva una v", () => {
  assert.deepEqual(resumenVersion({ version: "1.2.3", commit: "a1b2c3d", fecha: "2026-11-26" }), { corta: "v1.2.3", completa: "1.2.3 (a1b2c3d, 2026-11-26)" });
});

prueba("versión: lo que falta no se escribe", () => {
  assert.equal(resumenVersion({ version: "1.2.3", commit: "", fecha: "" }).completa, "1.2.3");
  assert.equal(resumenVersion({ version: "1.2.3", commit: "a1b2c3d" }).completa, "1.2.3 (a1b2c3d)");
  assert.equal(resumenVersion({ version: "1.2.3", fecha: "2026-11-26" }).completa, "1.2.3 (2026-11-26)");
});

prueba("versión: un commit o una fecha que no lo parecen se descartan (nada raro llega a la pantalla)", () => {
  assert.equal(resumenVersion({ version: "1.2.3", commit: "<b>x</b>", fecha: "ayer" }).completa, "1.2.3");
  assert.equal(resumenVersion({ version: "1.2.3", commit: "abc", fecha: "2026-13-45x" }).completa, "1.2.3");
});

prueba("versión: una versión que falta o no es de la forma 1.2.3 se ve como 0.0.0; las preliminares se respetan", () => {
  assert.equal(resumenVersion().corta, "v0.0.0");
  assert.equal(resumenVersion({}).completa, "0.0.0");
  assert.equal(resumenVersion({ version: "mucho" }).corta, "v0.0.0");
  assert.equal(resumenVersion({ version: "1.0.0-beta.1" }).corta, "v1.0.0-beta.1");
});

prueba("versión: package.json y su lock dicen la misma versión, con la forma 1.2.3", () => {
  const paquete = JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8"));
  const lock = JSON.parse(fs.readFileSync(path.join(RAIZ, "package-lock.json"), "utf8"));
  assert.match(paquete.version, SEMVER);
  assert.equal(lock.version, paquete.version, "package-lock.json (raíz)");
  assert.equal(lock.packages[""].version, paquete.version, "package-lock.json (paquete raíz)");
});

prueba("versión: scripts/version.mjs lee la versión de package.json y, en este repositorio, el commit y la fecha", () => {
  const paquete = JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8"));
  const d = datosDeVersion(RAIZ);
  assert.equal(d.version, paquete.version);
  if (fs.existsSync(path.join(RAIZ, ".git"))) {
    assert.match(d.commit, /^[0-9a-f]{7,12}$/, "commit corto");
    assert.match(d.fecha, /^\d{4}-\d{2}-\d{2}$/, "fecha del commit");
  }
});

prueba("versión: una copia del proyecto sin git no toma el commit de un repositorio que la contenga", () => {
  const temporal = fs.mkdtempSync(path.join(os.tmpdir(), "ollada-version-"));
  try {
    const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: temporal, stdio: "ignore" });
    git("init", "-q");
    fs.writeFileSync(path.join(temporal, "algo.txt"), "x");
    git("add", "algo.txt");
    git("commit", "-q", "-m", "x");
    const proyecto = path.join(temporal, "proyecto");
    fs.mkdirSync(proyecto);
    fs.writeFileSync(path.join(proyecto, "package.json"), JSON.stringify({ name: "x", version: "3.4.5" }));
    assert.deepEqual(datosDeVersion(proyecto), { version: "3.4.5", commit: "", fecha: "" });
    // Y con git propio sí lo toma
    execFileSync("git", ["init", "-q"], { cwd: proyecto });
    fs.writeFileSync(path.join(proyecto, "a.txt"), "y");
    execFileSync("git", ["add", "a.txt"], { cwd: proyecto });
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "y"], { cwd: proyecto });
    const d = datosDeVersion(proyecto);
    assert.equal(d.version, "3.4.5");
    assert.match(d.commit, /^[0-9a-f]{7,12}$/);
    assert.match(d.fecha, /^\d{4}-\d{2}-\d{2}$/);
  } finally {
    fs.rmSync(temporal, { recursive: true, force: true });
  }
});
