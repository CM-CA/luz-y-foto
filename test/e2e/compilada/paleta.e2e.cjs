// La paleta y las fuentes de «La luz de ahora»: los pares de colores que se leen juntos cumplen el contraste mínimo
// (4,5:1 para texto; 3:1 para el símbolo ámbar sobre el fondo), en claro y en oscuro, y las dos fuentes (Young Serif y
// Figtree) están en la compilación, pesan poco y se cargan.
//
// Ejecutar: node test/e2e/compilada/paleta.e2e.cjs   (antes: npm run build -- --base=/luz-y-foto/beta/)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

// [texto o símbolo, fondo, contraste mínimo]
const PARES = [
  ["--texto", "--fondo", 4.5], ["--texto", "--tarjeta", 4.5],
  ["--suave", "--fondo", 4.5], ["--suave", "--tarjeta", 4.5],
  ["--verde", "--verde-fondo", 4.5], ["--ambar", "--ambar-fondo", 4.5], ["--rojo", "--rojo-fondo", 4.5],
  ["--texto", "--verde-fondo", 4.5], ["--texto", "--ambar-fondo", 4.5], ["--texto", "--rojo-fondo", 4.5],
  ["--suave", "--gris-fondo", 4.5],
  ["--ambar-simbolo", "--fondo", 3]
];
const NUEVAS = ["--ambar-simbolo", "--oro", "--sol", "--violeta", "--azul-hora", "--gris-fondo", "--display", "--cuerpo"];

ejecutar("paleta", async ({ b, base }) => {
  for (const esquema of ["light", "dark"]) {
    titulo("paleta " + (esquema === "light" ? "clara" : "oscura") + ": contrastes");
    const { ctx, p } = await nuevaPagina(b, { colorScheme: esquema, permisos: false });
    await p.goto(base);
    const r = await p.evaluate(({ pares, nuevas }) => {
      const color = (n) => {
        const sonda = document.createElement("i"); sonda.style.color = "var(" + n + ")"; document.body.appendChild(sonda);
        const c = getComputedStyle(sonda).color; sonda.remove();
        return c.match(/[\d.]+/g).slice(0, 3).map(Number);
      };
      const luminancia = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const contraste = (a, c) => { const [x, y] = [luminancia(a), luminancia(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      const raiz = getComputedStyle(document.documentElement);
      return {
        contrastes: pares.map(([a, c, min]) => [a, c, min, contraste(color(a), color(c))]),
        definidas: nuevas.map((n) => [n, raiz.getPropertyValue(n).trim() !== ""])
      };
    }, { pares: PARES, nuevas: NUEVAS });
    for (const [n, definida] of r.definidas) ok(definida, esquema + " " + n + " está definida");
    for (const [a, c, min, valor] of r.contrastes) ok(valor >= min, esquema + " " + a + " sobre " + c + ": " + valor.toFixed(2) + " (mínimo " + min + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("las dos fuentes se cargan y se usan");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false });
    await p.goto(base + "#/hoy");
    const f = await p.evaluate(async () => {
      const serif = await document.fonts.load('37px "Young Serif"');
      const cuerpo = await document.fonts.load("17px Figtree");
      await document.fonts.ready;
      return {
        serif: serif.length, cuerpo: cuerpo.length,
        cargadas: [...document.fonts].filter((x) => x.status === "loaded").map((x) => x.family),
        familiaCuerpo: getComputedStyle(document.body).fontFamily
      };
    });
    ok(f.serif === 1 && f.cuerpo === 1, "Young Serif y Figtree se encuentran (" + f.serif + ", " + f.cuerpo + ")");
    ok(f.cargadas.length === 2, "las dos están cargadas: " + f.cargadas.join(", "));
    ok(/^"?Figtree/.test(f.familiaCuerpo), "el cuerpo usa Figtree: " + f.familiaCuerpo);
    await ctx.close();
  }

  titulo("las fuentes pesan poco");
  const woff2 = fs.readdirSync(path.join(dist, "assets")).filter((x) => x.endsWith(".woff2"));
  const total = woff2.reduce((s, x) => s + fs.statSync(path.join(dist, "assets", x)).size, 0);
  ok(woff2.length === 2, "hay exactamente dos .woff2 en dist/assets: " + woff2.join(", "));
  ok(total < 50000, "juntas pesan " + total + " bytes (menos de 50 000)");
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
