// El veredicto es un bloque grande con el símbolo y la palabra del semáforo en texto (el borde y el fondo son solo adorno).
// En Atardecer lleva además el medidor de puntos, hecho con bloques «█» de texto como las barras de nubes (así se ve aunque
// el navegador oscurezca los fondos por su cuenta); en Luna no hay medidor, porque la luna no puntúa.
//
// Ejecutar: node test/e2e/compilada/veredicto.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };

ejecutar("veredicto", async ({ b, base }) => {
  for (const esquema of ["light", "dark"]) {
    titulo("Atardecer (" + esquema + "): símbolo y palabra en texto, y medidor de puntos");
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 390, height: 900 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const dias = await p.locator("#dias button").count();
    for (let i = 0; i < dias; i++) {
      await p.click("#dias button[data-i='" + i + "']");
      const r = await p.evaluate(() => {
        const v = document.querySelector(".veredicto"), barras = v.querySelectorAll(".barra");
        const relleno = barras[0] && barras[0].querySelector("span");
        const nota = v.querySelector(".nota").textContent, puntos = (nota.match(/(\d+) de 100 puntos/) || [])[1];
        let texto = 0, anchoBarra = 0, mismoColor = false, ancho = null;
        if (relleno) {
          ancho = parseFloat(relleno.getAttribute("style").match(/width:\s*([\d.]+)%/)[1]); // antes de tocar el ancho
          relleno.style.width = "100%"; // la barra más larga posible, para medir si el texto la cubre
          const rango = document.createRange(); rango.selectNodeContents(relleno);
          texto = rango.getBoundingClientRect().width; anchoBarra = relleno.clientWidth;
          relleno.style.width = "";
          const e = getComputedStyle(relleno); mismoColor = e.color === e.backgroundColor;
        }
        return {
          cuantas: barras.length, puntos: puntos === undefined ? null : Number(puntos), ancho, mismoColor, texto, anchoBarra,
          titulo: v.querySelector(".titulo").textContent.trim(), borde: getComputedStyle(v).borderTopWidth, esAria: barras[0] ? barras[0].getAttribute("aria-hidden") : null
        };
      });
      ok(r.cuantas === 1, "día " + i + ": hay un medidor (" + r.cuantas + ")");
      ok(r.puntos !== null && r.ancho !== null && Math.abs(r.ancho - r.puntos) <= 1, "  mide lo mismo que «" + r.puntos + " de 100 puntos» (relleno " + r.ancho + " %)");
      ok(r.mismoColor, "  el relleno lleva el color también como texto");
      ok(r.texto >= r.anchoBarra, "  y el texto cubre la barra entera (" + Math.round(r.texto) + "/" + r.anchoBarra + " px)");
      ok(r.esAria === "true", "  el medidor es solo visual (aria-hidden): los puntos están en el texto");
      ok(/^[●▲■○] \S/.test(r.titulo), "  el título empieza por el símbolo del semáforo: «" + r.titulo + "»");
      ok(r.borde === "0px", "  el bloque no usa un borde para decir nada (" + r.borde + ")");
    }
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("Luna: sin medidor, pero con el mismo bloque");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    const r = await p.evaluate(() => ({ barras: document.querySelectorAll(".veredicto .barra").length, titulo: document.querySelector(".veredicto .titulo").textContent.trim() }));
    ok(r.barras === 0, "no hay medidor en Luna (" + r.barras + ")");
    ok(/^[●▲■○] \S/.test(r.titulo), "el título empieza por el símbolo: «" + r.titulo + "»");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
