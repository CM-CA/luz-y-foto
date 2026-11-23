// Lo que está elegido (pestaña, día, trípode de hoy) tiene que verse distinto de lo demás, en claro y oscuro, y sin
// depender solo del color: lleva una ✓ (texto), negrita y colores invertidos. En los días, la ✓ va junto al símbolo
// del semáforo y la inversión y la negrita en el nombre del día (el símbolo conserva su color). Un navegador que oscurece las webs por su
// cuenta aplasta fondos y bordes, pero respeta el texto, y hay personas que no distinguen bien los colores.
//
// Ejecutar: node test/e2e/compilada/seleccion.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
// [nombre, botones, atributo de «elegido», ¿se exige negrita?, dónde está la ✓ dentro del botón, qué elemento cambia de fondo y de peso]
const GRUPOS = [
  ["pestañas", "#tabs button", "aria-selected", false, null, null], // las pestañas van siempre en negrita
  ["días", "#dias button", "aria-pressed", true, ".marca", ".etq"],
  ["trípode de hoy", ".tripode button", "aria-pressed", true, null, null]
];

ejecutar("seleccion", async ({ b, base }) => {
  for (const genero of ["atardecer", "luna"]) {
    for (const esquema of ["light", "dark"]) {
      titulo("«" + genero + "», " + esquema + ": lo elegido se distingue de lo demás");
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: 360, height: 800 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      await p.click("[data-tab=" + genero + "]");
      await p.click("#receta summary");
      for (const [nombre, selector, atributo, conNegrita, dentroMarca, dentroFondo] of GRUPOS) {
        const r = await p.evaluate(([sel, attr, dMarca, dFondo]) => {
          const botones = [...document.querySelectorAll(sel)];
          const datos = botones.map((x) => {
            const e = getComputedStyle(dFondo ? x.querySelector(dFondo) : x), marca = getComputedStyle(dMarca ? x.querySelector(dMarca) : x, "::before").content;
            return { elegido: x.getAttribute(attr) === "true", marca: marca !== "none" && marca !== "normal" && marca.includes("✓"), fondo: e.backgroundColor, peso: Number(e.fontWeight) };
          });
          return datos;
        }, [selector, atributo, dentroMarca, dentroFondo]);
        const elegidos = r.filter((x) => x.elegido), otros = r.filter((x) => !x.elegido);
        ok(r.length >= 2 && elegidos.length === 1, nombre + ": hay " + r.length + " botones y exactamente uno elegido");
        if (elegidos.length !== 1) continue;
        const e = elegidos[0];
        ok(e.marca && otros.every((x) => !x.marca), nombre + ": solo el elegido lleva la ✓");
        ok(otros.every((x) => x.fondo !== e.fondo), nombre + ": el fondo del elegido es distinto (" + e.fondo + ")");
        if (conNegrita) ok(otros.every((x) => e.peso > x.peso), nombre + ": el elegido va en negrita (" + e.peso + " frente a " + otros[0].peso + ")");
      }
      const nums = await p.evaluate(() => [...document.querySelectorAll("#dias button")].map((x) => { const n = x.querySelector(".num"); return n ? { texto: n.textContent.trim(), oculto: n.getAttribute("aria-hidden") === "true" } : null; }));
      ok(nums.length >= 2 && nums.every((n) => n && /^\d{1,2}$/.test(n.texto) && +n.texto >= 1 && +n.texto <= 31), "días: cada botón lleva su número del mes (" + nums.map((n) => n && n.texto).join(", ") + ")");
      ok(nums.every((n, i) => n && n.oculto && (i === 0 || +n.texto === +nums[i - 1].texto + 1 || +n.texto === 1)), "días: los números van en orden y son solo visuales (el lector de pantalla ya oye el nombre del día)");
      await ctx.close();
    }
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
