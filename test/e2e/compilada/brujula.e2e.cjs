// La brújula de Atardecer y de Luna: una flecha con la dirección en palabras y en grados. En Luna, además, la altura (en grados y en
// puños) y a qué momento apunta: la luna de ahora, la de la mejor hora de la noche, la del anochecer o la de su salida. En esta
// versión del archivo se comprueba la brújula fija; la del móvil (el botón y las lecturas del sensor) se añade más abajo.
//
// Ejecutar: node test/e2e/compilada/brujula.e2e.cjs   (antes: npm run build -- --base=/luz-y-foto/beta/)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const SANTIAGO_DE_CHILE = { lat: -33.45, lon: -70.66, nombre: "Santiago de Chile", origen: "busqueda" };
const A_LAS_21 = "2026-11-19T21:00:00+01:00"; // la noche del 19 ya está en curso y la luna en el cielo
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";
const MOMENTO = /^(Ahora, a las \d\d:\d\d|A las \d\d:\d\d, la mejor hora de la noche|Al anochecer, a las \d\d:\d\d|La luna sale a las \d\d:\d\d)\.$/;

// Lo que se ve de la brújula en el panel
const leer = (p) => p.evaluate(() => {
  const bloque = document.querySelector("#panel .brujula-bloque"), b = bloque && bloque.querySelector(".brujula");
  if (!b) return null;
  const g = b.querySelector("svg g"), giro = g && /rotate\(([-\d.]+)\)/.exec(g.getAttribute("transform") || "");
  return {
    lineas: [...b.querySelectorAll(".brujula-texto p")].map((x) => x.textContent.replace(/\s+/g, " ").trim()),
    giro: giro ? Number(giro[1]) : null,
    nota: (document.querySelector("#panel .veredicto") || { textContent: "" }).textContent.replace(/\s+/g, " ")
  };
});
// Lo que dicen los grados de la primera línea: «Mira hacia el sur-sureste (174°).»
const direccion = (linea) => { const m = /^(?:Al [a-z]+, m|M)ira hacia el (\S+) \((\d+)°\)\.$/.exec(linea || ""); return m ? { palabra: m[1].replace(/\u2011/g, "-"), grados: Number(m[2]) } : null; };

ejecutar("brujula", async ({ b, base }) => {
  const SunCalc = await import("suncalc").then((m) => (m.getMoonPosition ? m : m.default));
  const { puntoCardinal } = await import("../../../src/nucleo/astro.js");
  const luna = (iso, sitio = LUGAR) => { const q = SunCalc.getMoonPosition(new Date(iso), sitio.lat, sitio.lon); return { az: q.azimuth, alt: q.altitude }; };

  titulo("A: Atardecer sigue igual, ahora con el mismo componente");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    const r = await leer(p), d = direccion(r && r.lineas[0]);
    ok(r && r.lineas.length === 1 && d, "una sola línea, «Al atardecer, mira hacia el … (N°).»: " + (r && r.lineas.join(" | ")));
    ok(d && d.palabra === puntoCardinal(d.grados), "la palabra es la de los grados (" + (d && d.palabra) + " = " + (d && puntoCardinal(d.grados)) + ")");
    ok(r && Math.abs(r.giro - d.grados) <= 0.5, "la flecha gira lo que dice el texto (" + (r && r.giro) + " y " + (d && d.grados) + ")");
    const orden = await p.evaluate(() => {
      const bloque = document.querySelector("#panel .brujula-bloque"), antes = document.querySelector("#panel .luz-de-hoy"), despues = document.querySelector("#panel #receta, #panel .invitacion");
      const va = (x, y) => !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { luzAntes: va(antes, bloque), recetaDespues: va(bloque, despues) };
    });
    ok(orden.luzAntes && orden.recetaDespues, "va después de «La luz de hoy» y antes de la receta");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: Luna, noche en curso con la luna en el cielo: apunta a la luna de ahora");
  {
    const { ctx, p } = await nuevaPagina(b, { fecha: A_LAS_21, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]"); await p.click("#dias button[data-i='0']");
    await p.waitForSelector("#panel .brujula-bloque");
    const r = await leer(p), d = direccion(r.lineas[0]), esperada = luna(A_LAS_21);
    ok(r.lineas.length === 3, "tres líneas: dirección, altura y momento (" + r.lineas.length + "): " + r.lineas.join(" | "));
    ok(d && Math.abs(d.grados - Math.round(esperada.az)) <= 1, "los grados son los de SunCalc para las 21:00 (" + (d && d.grados) + " y " + esperada.az.toFixed(1) + ")");
    ok(d && d.palabra === puntoCardinal(d.grados), "la palabra es la de los grados (" + (d && d.palabra) + ")");
    ok(Math.abs(r.giro - d.grados) <= 0.5, "la flecha gira lo que dice el texto (" + r.giro + ")");
    const puños = Math.round(esperada.alt / 10);
    ok(r.lineas[1] === "Altura: " + Math.round(esperada.alt) + "° sobre el horizonte, unos " + puños + " puños con el brazo estirado.", "la altura en grados y en puños: «" + r.lineas[1] + "» (esperada " + esperada.alt.toFixed(1) + "°)");
    ok(r.lineas[2] === "Ahora, a las 21:00.", "el momento: «" + r.lineas[2] + "»");
    const orden = await p.evaluate(() => {
      const bloque = document.querySelector("#panel .brujula-bloque"), veredicto = document.querySelector("#panel .veredicto");
      const receta = document.querySelector("#panel #receta, #panel .invitacion"), lunaCab = document.querySelector("#panel .luna-cab");
      const va = (x, y) => !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { despuesDelVeredicto: va(veredicto, bloque), antesDeLaReceta: va(bloque, receta), antesDeLaLuna: va(bloque, lunaCab) };
    });
    ok(orden.despuesDelVeredicto && orden.antesDeLaReceta && orden.antesDeLaLuna, "va debajo del veredicto y de los avisos, antes de la receta y de la luna");

    // El reloj corre: pasado un minuto, «ahora» es otro
    await p.clock.runFor(61000);
    const despues = await leer(p), d2 = direccion(despues.lineas[0]), esperada2 = luna("2026-11-19T21:01:00+01:00");
    ok(despues.lineas[2] === "Ahora, a las 21:01.", "un minuto después: «" + despues.lineas[2] + "»");
    ok(d2 && Math.abs(d2.grados - Math.round(esperada2.az)) <= 1, "y los grados se recalculan (" + (d2 && d2.grados) + " y " + esperada2.az.toFixed(1) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("C: Luna, noche sin empezar: apunta a la mejor hora, con la hora escrita (y cambia con la noche elegida)");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    const previos = [];
    for (const dia of [0, 1]) {
      await p.click("#dias button[data-i='" + dia + "']");
      await p.waitForSelector("#panel .brujula-bloque");
      const r = await leer(p), d = direccion(r.lineas[0]), hora = /Mejor hora: (\d\d):(\d\d)/.exec(r.nota);
      ok(hora, "la noche " + dia + " tiene mejor hora en la nota del veredicto");
      ok(r.lineas[2] === "A las " + hora[1] + ":" + hora[2] + ", la mejor hora de la noche.", "noche " + dia + ", el momento: «" + r.lineas[2] + "»");
      const dd = Number(hora[1]) < 12 ? 20 + dia : 19 + dia, esperada = luna("2026-11-" + dd + "T" + hora[1] + ":" + hora[2] + ":00+01:00");
      ok(d && Math.abs(d.grados - Math.round(esperada.az)) <= 1, "noche " + dia + ", los grados son los de esa hora (" + (d && d.grados) + " y " + esperada.az.toFixed(1) + ")");
      ok(r.lineas[1].startsWith("Altura: " + Math.round(esperada.alt) + "° sobre el horizonte"), "noche " + dia + ", altura: «" + r.lineas[1] + "» (" + esperada.alt.toFixed(1) + "°)");
      previos.push(r.lineas.join("|"));
    }
    ok(previos[0] !== previos[1], "las dos noches dicen cosas distintas");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("D: hemisferio sur: la luna cae por el norte y el texto sigue a los grados");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: SANTIAGO_DE_CHILE });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]"); await p.click("#dias button[data-i='0']");
    await p.waitForSelector("#panel .brujula-bloque");
    const r = await leer(p), d = direccion(r.lineas[0]);
    ok(d && (d.grados < 90 || d.grados > 270), "la luna está en el lado norte del cielo (" + (d && d.grados) + "°)");
    ok(d && d.palabra === puntoCardinal(d.grados) && Math.abs(r.giro - d.grados) <= 0.5, "palabra y flecha siguen a los grados (" + (d && d.palabra) + ", giro " + r.giro + ")");
    ok(MOMENTO.test(r.lineas[r.lineas.length - 1]), "y el momento tiene una de las cuatro formas: «" + r.lineas[r.lineas.length - 1] + "»");
    await ctx.close();
  }

  titulo("E: medidas: 320, 360 y 390 px, claro y oscuro, letra normal y ancha");
  for (const esquema of ["light", "dark"]) {
    for (const [nombreLetra, css] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
      for (const ancho of [320, 360, 390]) {
        const { ctx, p } = await nuevaPagina(b, { fecha: A_LAS_21, viewport: { width: ancho, height: 900 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
        await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
        await p.click("[data-tab=luna]"); await p.click("#dias button[data-i='0']");
        await p.waitForSelector("#panel .brujula-bloque");
        if (css) await p.addStyleTag({ content: css });
        const r = await p.evaluate(() => {
          const panel = document.querySelector("#panel").getBoundingClientRect(), b = document.querySelector("#panel .brujula").getBoundingClientRect();
          const ps = [...document.querySelectorAll("#panel .brujula-texto p")].map((x) => x.getBoundingClientRect());
          const svg = document.querySelector("#panel .brujula svg").getBoundingClientRect();
          return {
            pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, dentro: b.left >= panel.left - 0.5 && b.right <= panel.right + 0.5,
            separadas: ps.every((x, i) => i === 0 || x.top >= ps[i - 1].bottom - 0.5), svg: [svg.width, svg.height], textoDentro: ps.every((x) => x.left >= b.left - 0.5 && x.right <= b.right + 0.5)
          };
        });
        ok(r.pagina <= 0 && r.dentro && r.separadas && r.textoDentro && r.svg[0] === 62 && r.svg[1] === 62,
          esquema + ", " + nombreLetra + ", " + ancho + " px" + (r.pagina > 0 ? " (desborda " + r.pagina + ")" : "") + (r.dentro ? "" : " (se sale de la tarjeta)") + (r.separadas ? "" : " (las líneas se pisan)") + (r.textoDentro ? "" : " (el texto se sale)"));
        ok(p.errores.length === 0, "  sin errores: " + p.errores.join(";"));
        await ctx.close();
      }
    }
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
