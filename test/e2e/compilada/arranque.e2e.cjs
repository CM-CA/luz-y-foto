// Arranque de la app instalada. Al abrirla desde su icono, el sistema enseña una pantalla con el color de fondo y el icono del manifiesto
// (eso no lo controla la web ni dura más de lo que tarda la app en pintarse). Para que no se vea un icono azul oscuro pegado sobre un fondo
// lila y se corte en seco, el manifiesto usa el azul noche del icono como fondo de arranque, y la app continúa con una pantalla propia de ese
// mismo azul. Esa pantalla EMPIEZA con el icono entero, centrado y del mismo tamaño que el de la pantalla del sistema (medido en un móvil:
// el dibujo mide 156 px de ancho y está en el centro), para que el paso de una a otra no se note; y a partir de ahí el ojo parpadea, el visor
// se ajusta como un autoenfoque, el icono sube y sale el nombre. Unos 2,5 s en total, y se funde con la pantalla Hoy.
//
// - Solo sale si la app se abre desde su icono (modo «standalone» o «fullscreen»): en el navegador no hay ni rastro.
// - Con «reducir movimiento» no sale nunca.
// - Es solo CSS (la política de seguridad no permite scripts en línea y así no depende de que la app cargue): no puede quedarse puesta.
//
// El navegador de pruebas no puede simular el modo app, así que lo propio de ese modo se comprueba sobre una copia de dist/ en la que la
// condición se cumple siempre; que la condición está de verdad en los estilos publicados, con una comprobación aparte.
//
// Antes: npm run build
// Ejecutar: node test/e2e/compilada/arranque.e2e.cjs
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { RAIZ, LUGAR, servir, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}
const AZUL = "#1f2740"; // el fondo del icono
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const ESTILOS = fs.readdirSync(path.join(dist, "assets")).filter((f) => f.endsWith(".css"));
const CONDICION = /\(display-mode:\s*(standalone|fullscreen)\)/g;

// Copia de dist/ en la que «abierta como app» se cumple siempre
const copia = fs.mkdtempSync(path.join(os.tmpdir(), "luz-arranque-"));
fs.cpSync(dist, copia, { recursive: true });
for (const f of ESTILOS) {
  const ruta = path.join(copia, "assets", f);
  fs.writeFileSync(ruta, fs.readFileSync(ruta, "utf8").replace(CONDICION, "(min-width:0px)"));
}

ejecutar("arranque", async ({ b, base }) => {
  titulo("el fondo de arranque del manifiesto es el azul del icono (así el icono se funde con él)");
  let { ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR });
  await p.goto(base); await p.waitForSelector(".veredicto");
  const m = await p.evaluate(() => fetch("manifest.webmanifest").then((r) => r.json()));
  ok(m.background_color === AZUL, "background_color del manifiesto: " + m.background_color);
  const hex = (v) => "#" + v.slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join("");
  const pixel = (archivo, x, y) => p.evaluate(async ([a, x, y]) => {
    const im = await createImageBitmap(await (await fetch(a)).blob());
    const c = new OffscreenCanvas(im.width, im.height); const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    return Array.from(g.getImageData(x, y, 1, 1).data);
  }, [archivo, x, y]);
  ok(hex(await pixel("icon-512.png", 256, 30)) === AZUL, "el fondo del icono es ese azul: " + hex(await pixel("icon-512.png", 256, 30)));
  ok(hex(await pixel("icon-maskable-512.png", 10, 10)) === AZUL, "y el del icono adaptable también");
  ok(m.theme_color === "#f3eff4", "la barra del sistema sigue con el color de la app: " + m.theme_color);

  titulo("en el navegador no hay pantalla de arranque: la app se ve y se usa desde el primer momento");
  ok(await p.locator("#arranque").count() === 1, "la pantalla de arranque está en la página");
  ok(await p.locator("#arranque").evaluate((e) => getComputedStyle(e).display) === "none", "pero oculta (no ocupa ni tapa nada)");
  ok(await p.locator(".veredicto").isVisible(), "se ve la pantalla Hoy");
  const css = ESTILOS.map((f) => fs.readFileSync(path.join(dist, "assets", f), "utf8")).join("\n");
  ok(/@media\s*\(display-mode:\s*standalone\)\s*,\s*\(display-mode:\s*fullscreen\)/.test(css), "solo se muestra con «display-mode: standalone» o «fullscreen» (app abierta desde su icono)");
  await ctx.close();

  titulo("abierta como app: pantalla azul con el visor, el ojo y el nombre, unos 2,5 s, y se funde con la app");
  const abierta = await servir({ carpeta: copia, prefijo: "/ollada/" });
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await p.addInitScript(() => {
    window.__violaciones = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__violaciones.push(e.violatedDirective + " → " + e.blockedURI));
  });
  await p.goto(abierta.base, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#arranque");
  const a = p.locator("#arranque");
  const estilo = await a.evaluate((e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { display: c.display, position: c.position, fondo: c.backgroundColor, x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }; });
  ok(estilo.display !== "none" && estilo.position === "fixed", "se muestra, fija sobre la página: " + estilo.display + " / " + estilo.position);
  ok(estilo.x === 0 && estilo.y === 0 && estilo.w === estilo.vw && estilo.h === estilo.vh, "ocupa toda la pantalla: " + estilo.w + "×" + estilo.h);
  ok(estilo.fondo === "rgb(31, 39, 64)", "del azul del icono: " + estilo.fondo);
  ok(await a.getAttribute("aria-hidden") === "true", "oculta a los lectores de pantalla (es solo adorno)");
  ok(await p.locator("#arranque svg").count() === 1 && /Ollada/.test(await p.locator("#arranque .nombre").textContent()), "lleva el dibujo (visor y ojo) y el nombre «Ollada»");
  const animaciones = await a.evaluate((e) => e.getAnimations({ subtree: true }).map((x) => x.animationName));
  ok(["parpadeo", "enfoque", "asciende", "sube", "arranque-fuera"].every((n) => animaciones.includes(n)), "se animan el parpadeo del ojo, el autoenfoque del visor, la subida del icono, el nombre y el fundido final: " + animaciones.join(", "));
  const fin = await a.evaluate((e) => Math.max(...e.getAnimations({ subtree: true }).map((x) => x.effect.getComputedTiming().endTime)));
  ok(fin >= 2300 && fin <= 2700, "termina a los " + fin + " ms (unos 2,5 s)");
  ok(await p.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).closest("#arranque") !== null), "mientras dura, está por encima de la app");

  await dormir(fin + 400);
  const despues = await a.evaluate((e) => { const c = getComputedStyle(e); return { visibilidad: c.visibility, opacidad: c.opacity }; });
  ok(despues.visibilidad === "hidden" && despues.opacidad === "0", "al terminar se funde y desaparece: " + despues.visibilidad + " / " + despues.opacidad);
  ok(await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, 300); return e !== null && e.closest("#arranque") === null; }), "y ya no tapa ni bloquea nada de la app");
  ok(await p.locator(".veredicto").isVisible(), "debajo está la pantalla Hoy");
  const violaciones = await p.evaluate(() => window.__violaciones);
  ok(violaciones.length === 0, "sin infracciones de la política de seguridad: " + violaciones.join(" ; "));
  ok(p.errores.length === 0, "sin errores en la consola: " + p.errores.join(" ; "));
  await ctx.close();

  titulo("fotogramas: empieza igual que la pantalla del sistema (icono entero, centrado, del mismo tamaño) y sigue desde ahí");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR }));
  await p.goto(abierta.base, { waitUntil: "domcontentloaded" }); await p.waitForSelector("#arranque");
  const en = (ms) => p.evaluate((ms) => { document.getElementById("arranque").getAnimations({ subtree: true }).forEach((x) => { x.pause(); x.currentTime = ms; }); }, ms);
  const medir = () => p.evaluate(() => {
    const caja = (s) => document.querySelector(s).getBoundingClientRect(), estilo = (s) => getComputedStyle(document.querySelector(s));
    const svg = caja("#arranque svg"), nombre = caja("#arranque .nombre");
    return {
      vw: innerWidth, vh: innerHeight,
      svg: { cx: svg.x + svg.width / 2, cy: svg.y + svg.height / 2, w: svg.width, bottom: svg.bottom },
      nombre: { top: nombre.top, bottom: nombre.bottom, cx: nombre.x + nombre.width / 2, opacidad: Number(estilo("#arranque .nombre").opacity) },
      ojoY: new DOMMatrix(estilo("#arranque .parpadeo").transform).d, marcoEscala: new DOMMatrix(estilo("#arranque .marco").transform).a,
      opacidades: ["#arranque .ojo", "#arranque .iris", "#arranque .brillo", "#arranque .marco"].map((x) => Number(estilo(x).opacity))
    };
  });
  await en(0); let f = await medir();
  ok(Math.abs(f.svg.w - 171) <= 1, "el dibujo mide lo mismo que el de la pantalla del sistema (171 px de lado, 156 px de dibujo): " + f.svg.w);
  ok(Math.abs(f.svg.cx - f.vw / 2) <= 1 && Math.abs(f.svg.cy - f.vh / 2) <= 1, "y está en el centro de la pantalla: " + f.svg.cx + ", " + f.svg.cy + " (pantalla " + f.vw + "×" + f.vh + ")");
  ok(f.opacidades.every((o) => o === 1) && Math.abs(f.ojoY - 1) < 0.01 && Math.abs(f.marcoEscala - 1) < 0.01, "el visor, el ojo, el iris y el brillo están enteros desde el primer fotograma, sin dibujarse de cero");
  ok(f.nombre.opacidad === 0, "todavía sin el nombre");
  await en(450); f = await medir();
  ok(f.ojoY < 0.2, "a los 0,45 s el ojo parpadea (cerrado casi del todo): " + f.ojoY.toFixed(2));
  await en(925); f = await medir();
  ok(f.marcoEscala < 0.95, "a los 0,9 s el visor se ajusta como un autoenfoque: " + f.marcoEscala.toFixed(2));
  await en(2000); f = await medir();
  ok(f.svg.cy < f.vh / 2 - 15, "a los 2 s el icono ha subido para dejar sitio al nombre: " + f.svg.cy + " < " + f.vh / 2);
  ok(f.nombre.opacidad === 1 && f.nombre.top >= f.svg.bottom - 12 && f.nombre.bottom <= f.vh && Math.abs(f.nombre.cx - f.vw / 2) <= 1, "el nombre está debajo, centrado y dentro de la pantalla");
  await ctx.close();

  titulo("con «reducir movimiento» no hay pantalla de arranque ni siquiera como app");
  ({ ctx, p } = await nuevaPagina(b, { permisos: false, lugar: LUGAR, reducedMotion: "reduce" }));
  await p.goto(abierta.base); await p.waitForSelector(".veredicto");
  ok(await p.locator("#arranque").evaluate((e) => getComputedStyle(e).display) === "none", "oculta");
  await ctx.close();
  abierta.cerrar();
}, { carpeta: dist, prefijo: "/ollada/" });

process.on("exit", () => fs.rmSync(copia, { recursive: true, force: true }));
