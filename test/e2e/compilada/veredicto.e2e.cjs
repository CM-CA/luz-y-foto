// El veredicto es un bloque grande con el símbolo y la palabra del semáforo en texto (el borde y el fondo son solo adorno).
// En Atardecer lleva además el medidor de puntos, hecho con bloques «█» de texto como las barras de nubes (así se ve aunque
// el navegador oscurezca los fondos por su cuenta); en Noche no hay medidor, porque la luna no puntúa.
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
// Todas las palabras del semáforo que puede llevar el título (amanecer, atardecer y luna) en cada idioma, para probar la más larga en cada ancho
const IDIOMAS = [{ id: "es", locale: "es-ES" }, { id: "en", locale: "en-US" }];
const titulosDe = (id) => [...new Set(["amanecer", "atardecer", "luna"].flatMap((g) => Object.values(JSON.parse(fs.readFileSync(path.join(RAIZ, "data", id, "generos", g + ".json"), "utf8")).niveles)))];
const LETRA_ANCHA = "'DejaVu Sans', sans-serif";

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

  titulo("Noche: sin medidor, pero con el mismo bloque");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    const r = await p.evaluate(() => ({ barras: document.querySelectorAll(".veredicto .barra").length, titulo: document.querySelector(".veredicto .titulo").textContent.trim() }));
    ok(r.barras === 0, "no hay medidor en Noche (" + r.barras + ")");
    ok(/^[●▲■○] \S/.test(r.titulo), "el título empieza por el símbolo: «" + r.titulo + "»");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  // El título del veredicto va en MAYÚSCULAS (con la letra del cuerpo, que en negrita se lee mejor que la serif) y los títulos de
  // sección con la misma letra; solo el nombre de la app lleva la serif. Con cualquiera de las palabras del semáforo,
  // a 320 px y con una letra ancha, el texto no se sale del bloque (las mayúsculas ensanchan).
  for (const idioma of IDIOMAS) {
  const TITULOS = titulosDe(idioma.id);
  titulo("[" + idioma.id + "] el título del veredicto va en mayúsculas y cabe en el bloque con todas sus palabras (" + TITULOS.length + ")");
  for (const [nombreLetra, letra] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
    for (const ancho of [320, 360, 390, 480]) {
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, perfil: PERFIL, lugar: LUGAR, locale: idioma.locale });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      if (letra) await p.addStyleTag({ content: "* { font-family: " + letra + " !important; }" });
      const r = await p.evaluate((titulos) => {
        const v = document.querySelector(".veredicto"), t = v.querySelector(".titulo"), simbolo = t.querySelector("i").textContent;
        const caja = v.getBoundingClientRect(), relleno = parseFloat(getComputedStyle(v).paddingRight);
        const demasiado = [], partidas = [];
        for (const x of titulos) {
          t.innerHTML = "<i>" + simbolo + "</i> " + x;
          const rg = document.createRange(); rg.selectNodeContents(t);
          const derecha = rg.getBoundingClientRect().right;
          if (derecha > caja.right - relleno + 0.5) demasiado.push(x + " (+" + (derecha - (caja.right - relleno)).toFixed(1) + " px)");
          // una palabra partida por la mitad da más líneas que palabras
          const rt = document.createRange(); rt.selectNodeContents(t.lastChild);
          const lineas = new Set([...rt.getClientRects()].map((q) => Math.round(q.top))).size;
          if (lineas > x.split(" ").length) partidas.push(x + " (" + lineas + " líneas)");
        }
        const e = getComputedStyle(t);
        return { mayusculas: e.textTransform, fuente: e.fontFamily, demasiado, partidas };
      }, TITULOS);
      ok(r.mayusculas === "uppercase", ancho + " px, " + nombreLetra + ": el título va en mayúsculas (" + r.mayusculas + ")");
      ok(r.demasiado.length === 0, ancho + " px, " + nombreLetra + ": ninguna palabra se sale del bloque" + (r.demasiado.length ? " (se salen: " + r.demasiado.join(", ") + ")" : ""));
      ok(r.partidas.length === 0, ancho + " px, " + nombreLetra + ": ninguna palabra se parte por la mitad" + (r.partidas.length ? " (se parten: " + r.partidas.join(", ") + ")" : ""));
      if (!letra && ancho === 390) ok(!/Young Serif/.test(r.fuente), "el título del veredicto usa la letra del cuerpo, no la serif (" + r.fuente + ")");
      await ctx.close();
    }
  }
  }

  titulo("títulos de sección con la letra del cuerpo; el nombre de la app, con la serif");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const r = await p.evaluate(() => ({
      secciones: [...document.querySelectorAll("#panel h3")].map((h) => [h.textContent.trim(), getComputedStyle(h).fontFamily]),
      app: getComputedStyle(document.querySelector("header.cabecera h1")).fontFamily
    }));
    ok(r.secciones.length >= 1, "hay títulos de sección en Hoy (" + r.secciones.map((x) => x[0]).join(", ") + ")");
    ok(r.secciones.every(([, f]) => !/Young Serif/.test(f)), "ninguno usa la serif (" + r.secciones.map((x) => x[1].split(",")[0]).join(", ") + ")");
    ok(/Young Serif/.test(r.app), "el nombre de la app sí (" + r.app.split(",")[0] + ")");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
