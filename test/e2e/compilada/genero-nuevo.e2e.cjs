// Un género nuevo (primera-luz, que mira la salida del sol) añadido SOLO con archivos de datos debe aparecer como pestaña, con su
// semáforo, su brújula y su explicación, sin tocar el código. (Amanecer ya es un género real de data/: aquí se añade otro más.) Es la prueba de siempre («J»), pero ahora los datos se
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
indice.orden.push("primera-luz");
escribir("generos.json", indice);
const primeraLuz = leer("generos/atardecer.json");
Object.assign(primeraLuz, {
  id: "primera-luz", nombre: "Primera luz", evento: "amanecer", eventoNombre: "la primera luz",
  textoEvento: "Primera luz a las {hora}", textoBrujula: "A la primera luz, mira hacia el {direccion} ({grados}°).", avisoNiebla: "Niebla a la primera luz."
});
escribir("generos/primera-luz.json", primeraLuz);
escribir("recetas/primera-luz.json", leer("recetas/atardecer.json"));

execFileSync(path.join(proyecto, "node_modules", ".bin", "vite"), ["build", "--base=/", "--outDir", dist, "--emptyOutDir", "--logLevel=error"], { cwd: proyecto, stdio: "inherit" });

ejecutar("genero-nuevo", async ({ b, base }) => {
  titulo("un género nuevo (primera-luz) añadido SOLO con datos aparece como pestaña");
  const { ctx, p } = await nuevaPagina(b, { permisos: true, geo: VIGO });
  await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
  const pestanas = await p.locator(".pestanas button").allInnerTexts();
  ok(pestanas.length === 4, "hay 4 pestañas: " + pestanas.join(", "));
  await p.click("[data-tab=primera-luz]");
  ok(/Primera luz a las \d\d:\d\d/.test(await p.locator(".subtitulo").innerText()), "el panel dice: " + await p.locator(".subtitulo").innerText());
  ok(await p.locator(".franja").count() === 0 && await p.locator(".luz-de-hoy").count() === 0, "sin «La luz de hoy»: la franja es solo del género con puesta de sol");
  ok(await p.locator(".veredicto .titulo").count() === 1, "muestra su semáforo: " + await p.locator(".veredicto .titulo").innerText());
  ok(/A la primera luz, mira hacia el/.test(await p.locator(".brujula").innerText()), "brújula: " + (await p.locator(".brujula").innerText()).replace(/\n/g, " "));
  await p.click("#reglas summary");
  ok(/Primera luz|primera luz/.test(await p.locator("#reglas").innerText()), "la explicación incluye el género nuevo");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
  fs.rmSync(temporal, { recursive: true, force: true });
}, { carpeta: dist, prefijo: "/" });
