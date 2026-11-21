// Un género nuevo (amanecer) añadido SOLO con archivos de datos debe aparecer como pestaña, con su semáforo,
// su brújula y su explicación, sin tocar el código. Es la prueba de siempre («J»), pero ahora los datos se
// incluyen al compilar: se copia el proyecto a una carpeta temporal, se añaden los datos y se compila allí.
//
// Ejecutar: node test/e2e/compilada/genero-nuevo.e2e.cjs   (necesita node_modules: npm ci)
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

if (!fs.existsSync(path.join(RAIZ, "node_modules", ".bin", "vite"))) {
  console.log("FALLA: no hay node_modules. Instálalo antes con: npm ci");
  process.exit(1);
}

const temporal = fs.mkdtempSync(path.join(os.tmpdir(), "luz-y-foto-genero-"));
const proyecto = path.join(temporal, "proyecto"), dist = path.join(temporal, "dist");
fs.mkdirSync(proyecto);
for (const nombre of ["src", "data", "scripts", "index.html", "package.json", "svelte.config.mjs", "public", ...fs.readdirSync(RAIZ).filter((f) => /^vite\.config\./.test(f))]) {
  if (fs.existsSync(path.join(RAIZ, nombre))) fs.cpSync(path.join(RAIZ, nombre), path.join(proyecto, nombre), { recursive: true });
}
fs.symlinkSync(path.join(RAIZ, "node_modules"), path.join(proyecto, "node_modules"), "dir");

const leer = (r) => JSON.parse(fs.readFileSync(path.join(proyecto, "data", r), "utf8"));
const escribir = (r, o) => fs.writeFileSync(path.join(proyecto, "data", r), JSON.stringify(o, null, 2));

const indice = leer("generos.json");
indice.orden.push("amanecer");
escribir("generos.json", indice);
const amanecer = leer("generos/atardecer.json");
Object.assign(amanecer, {
  id: "amanecer", nombre: "Amanecer", evento: "amanecer", eventoNombre: "el amanecer",
  textoEvento: "Amanecer a las {hora}", textoBrujula: "Al amanecer, mira hacia el {direccion} ({grados}°).", avisoNiebla: "Niebla al amanecer."
});
escribir("generos/amanecer.json", amanecer);
escribir("recetas/amanecer.json", leer("recetas/atardecer.json"));

execFileSync(path.join(proyecto, "node_modules", ".bin", "vite"), ["build", "--base=/", "--outDir", dist, "--emptyOutDir", "--logLevel=error"], { cwd: proyecto, stdio: "inherit" });

ejecutar("genero-nuevo", async ({ b, base }) => {
  titulo("un género nuevo (amanecer) añadido SOLO con datos aparece como pestaña");
  const { ctx, p } = await nuevaPagina(b, { permisos: true, geo: VIGO });
  await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
  const pestanas = await p.locator(".pestanas button").allInnerTexts();
  ok(pestanas.length === 3, "hay 3 pestañas: " + pestanas.join(", "));
  await p.click("[data-tab=amanecer]");
  ok(/Amanecer a las \d\d:\d\d/.test(await p.locator(".subtitulo").innerText()), "el panel dice: " + await p.locator(".subtitulo").innerText());
  ok(await p.locator(".veredicto .titulo").count() === 1, "muestra su semáforo: " + await p.locator(".veredicto .titulo").innerText());
  ok(/Al amanecer, mira hacia el/.test(await p.locator(".brujula").innerText()), "brújula: " + (await p.locator(".brujula").innerText()).replace(/\n/g, " "));
  await p.click("#reglas summary");
  ok(/Amanecer/.test(await p.locator("#reglas").innerText()), "la explicación incluye el género nuevo");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
  fs.rmSync(temporal, { recursive: true, force: true });
}, { carpeta: dist, prefijo: "/" });
