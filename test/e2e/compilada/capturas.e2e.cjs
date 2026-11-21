// La versión COMPILADA debe verse igual que la web de antes de migrar: se compila sin el prefijo /beta/ (que
// añade el aviso de vista previa), se hacen las seis capturas de test/e2e/capturas.cjs de las DOS versiones
// (prueba/hoy.html y la compilada) y se comparan píxel a píxel.
//
// Las dos se capturan aquí mismo, con el mismo navegador y las mismas fuentes, así que la prueba da lo mismo en
// cualquier ordenador (las capturas guardadas en test/e2e/referencia/ dependen de las fuentes de quien las hizo).
// Se admite una diferencia mínima (el suavizado de una letra puede variar un píxel según cómo se parta el texto
// en el HTML); cualquier cambio de tamaño, color o posición de verdad la supera con mucho.
//
// Es una prueba de la migración: la fase 5 retira la versión actual y, con ella, esta prueba. El responsive
// (fase 3, al final) cambia a propósito el aspecto en móvil y la sustituye por comprobaciones de maquetación.
//
// Ejecutar: node test/e2e/compilada/capturas.e2e.cjs   (necesita node_modules: npm ci)
"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { RAIZ, servir, ok, titulo, ejecutar } = require("../ayudas.cjs");
const { capturar } = require("../capturas.cjs");

const MAXIMO_DISTINTOS = 0.001; // fracción de píxeles que pueden diferir (0,1 %)

if (!fs.existsSync(path.join(RAIZ, "node_modules", ".bin", "vite"))) {
  console.log("FALLA: no hay node_modules. Instálalo antes con: npm ci");
  process.exit(1);
}

const temporal = fs.mkdtempSync(path.join(os.tmpdir(), "luz-y-foto-"));
const dist = path.join(temporal, "dist"), capturasNuevas = path.join(temporal, "nueva"), capturasActuales = path.join(temporal, "actual");
execFileSync(path.join(RAIZ, "node_modules", ".bin", "vite"), ["build", "--base=/", "--outDir", dist, "--emptyOutDir", "--logLevel=error"], { cwd: RAIZ, stdio: "inherit" });

// Compara dos imágenes PNG con un lienzo del navegador; no hace falta ninguna biblioteca más
async function comparar(pagina, ficheroA, ficheroB) {
  const leer = (f) => fs.readFileSync(f).toString("base64");
  return pagina.evaluate(async ([a, b]) => {
    const cargar = async (base64) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const imagen = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const lienzo = new OffscreenCanvas(imagen.width, imagen.height);
      const c = lienzo.getContext("2d");
      c.drawImage(imagen, 0, 0);
      return { ancho: imagen.width, alto: imagen.height, datos: c.getImageData(0, 0, imagen.width, imagen.height).data };
    };
    const x = await cargar(a), y = await cargar(b);
    if (x.ancho !== y.ancho || x.alto !== y.alto) return { mismoTamano: false, tamanos: `${x.ancho}×${x.alto} frente a ${y.ancho}×${y.alto}` };
    let distintos = 0;
    for (let i = 0; i < x.datos.length; i += 4) {
      if (x.datos[i] !== y.datos[i] || x.datos[i + 1] !== y.datos[i + 1] || x.datos[i + 2] !== y.datos[i + 2]) distintos++;
    }
    return { mismoTamano: true, distintos, total: x.ancho * x.alto, tamanos: `${x.ancho}×${x.alto}` };
  }, [leer(ficheroA), leer(ficheroB)]);
}

ejecutar("capturas-compiladas", async ({ b, base }) => {
  const actual = await servir({ carpeta: RAIZ, prefijo: "/" }); // la web de antes, tal cual está en el repositorio
  try {
    await capturar(b, actual.base + "prueba/hoy.html", capturasActuales);
    await capturar(b, base + "#/hoy", capturasNuevas);
  } finally { actual.cerrar(); }

  titulo("las capturas de la versión nueva coinciden con las de la web actual");
  const pagina = await b.newPage();
  const nombres = fs.readdirSync(capturasActuales).filter((f) => f.endsWith(".png")).sort();
  ok(nombres.length === 6, "hay 6 capturas: " + nombres.length);
  for (const nombre of nombres) {
    const r = await comparar(pagina, path.join(capturasActuales, nombre), path.join(capturasNuevas, nombre));
    if (!r.mismoTamano) { ok(false, nombre + ": distinto tamaño (" + r.tamanos + ")"); continue; }
    const fraccion = r.distintos / r.total;
    ok(fraccion <= MAXIMO_DISTINTOS, nombre + " (" + r.tamanos + "): " + r.distintos + " píxeles distintos (" + (fraccion * 100).toFixed(3) + " %)");
  }
  await pagina.close();
  fs.rmSync(temporal, { recursive: true, force: true });
}, { carpeta: dist, prefijo: "/" });
