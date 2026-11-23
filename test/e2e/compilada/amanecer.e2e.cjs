// Amanecer y la pestaña Noche: tres pestañas en una fila (Amanecer, Atardecer, Noche), la pestaña que se abre sola según la hora,
// los días de Amanecer («Mañana» por la tarde), su panel con la brújula hacia la salida del sol, su cielo (despejado y cubierto)
// y la niebla como ventaja con su aviso (la lluvia fuerte sigue en rojo).
//
// Ejecutar: node test/e2e/compilada/amanecer.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, previsionConCambios, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const A = "**/api.open-meteo.com/**";
const archivoDe = (id) => new RegExp("/cielo-" + id + "-[A-Za-z0-9_-]{8}\\.webp$");

const DESPEJADO = { cloud_cover_low: 10, cloud_cover_mid: 40, cloud_cover_high: 40, precipitation: 0, precipitation_probability: 10, visibility: 25000, weather_code: 3 };

// Abre #/hoy con el reloj en `fecha` y, si se pide, con otra previsión. La última ruta registrada es la que manda.
async function abrir(b, base, { fecha, datos, ancho = 390 } = {}) {
  const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, fecha, viewport: { width: ancho, height: 900 } });
  if (datos) await p.route(A, (r) => r.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(datos) }));
  await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
  return { ctx, p };
}
const seleccionada = (p) => p.locator('.pestanas button[aria-selected="true"]').getAttribute("data-tab");

ejecutar("amanecer", async ({ b, base }) => {
  titulo("A: tres pestañas, en este orden y en una sola fila (también a 320 px, sin letras cortadas)");
  for (const ancho of [320, 390]) {
    const { ctx, p } = await abrir(b, base, { ancho });
    ok((await p.locator(".pestanas button").allInnerTexts()).map((t) => t.replace("✓", "").trim()).join(",") === "Amanecer,Atardecer,Noche", "textos de las pestañas, " + ancho + " px: " + (await p.locator(".pestanas button").allInnerTexts()).join(", "));
    ok((await p.locator(".pestanas button").evaluateAll((bs) => bs.map((x) => x.dataset.tab))).join(",") === "amanecer,atardecer,luna", "identificadores: amanecer, atardecer, luna");
    for (const id of ["amanecer", "atardecer", "luna"]) {
      await p.click("[data-tab=" + id + "]");
      const m = await p.evaluate(() => {
        const bs = [...document.querySelectorAll(".pestanas button")].map((x) => ({ top: Math.round(x.getBoundingClientRect().top), alto: Math.round(x.getBoundingClientRect().height), cortado: x.scrollWidth > x.clientWidth }));
        return { tops: [...new Set(bs.map((x) => x.top))], altos: [...new Set(bs.map((x) => x.alto))], cortados: bs.filter((x) => x.cortado).length };
      });
      ok(m.tops.length === 1, ancho + " px, con «" + id + "» elegida: las tres pestañas están en una fila (tops " + m.tops.join(",") + ")");
      ok(m.altos.length === 1 && m.altos[0] < 60, ancho + " px, con «" + id + "» elegida: ningún texto salta de línea (altos " + m.altos.join(",") + ")");
      ok(m.cortados === 0, ancho + " px, con «" + id + "» elegida: ningún texto cortado (" + m.cortados + ")");
    }
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: la pestaña que se abre sola según la hora (el 19 de noviembre sale el sol a las 08:30 y se pone a las 18:10)");
  for (const [hora, esperada] of [["06:29", "luna"], ["06:30", "amanecer"], ["09:29", "amanecer"], ["12:00", "atardecer"], ["18:39", "atardecer"], ["18:40", "luna"], ["21:00", "luna"]]) {
    const { ctx, p } = await abrir(b, base, { fecha: "2026-11-19T" + hora + ":00+01:00" });
    const id = await seleccionada(p);
    ok(id === esperada, "a las " + hora + " se abre «" + esperada + "» (salió «" + id + "»)");
    await ctx.close();
  }
  {
    const { ctx, p } = await abrir(b, base, { fecha: "2026-11-19T06:45:00+01:00" });
    await p.click("[data-tab=atardecer]");
    ok(await seleccionada(p) === "atardecer", "la pestaña que elige la persona se respeta (a las 06:45 abre Amanecer, y pasa a Atardecer al tocarla)");
    await ctx.close();
  }

  titulo("C: los días de Amanecer: por la tarde el primero es «Mañana»; con el sol saliendo, «Hoy»");
  {
    const { ctx, p } = await abrir(b, base);
    await p.click("[data-tab=amanecer]");
    const primero = await p.locator("#dias button").first().innerText();
    ok(/Mañana/.test(primero) && !/Hoy/.test(primero), "a las 15:00 el primer día es «Mañana»: " + primero.replace(/\n/g, " "));
    ok(await p.locator("#dias button").count() >= 2, "hay al menos dos días");
    await ctx.close();
  }
  {
    const { ctx, p } = await abrir(b, base, { fecha: "2026-11-20T09:00:00+01:00" });
    ok(await seleccionada(p) === "amanecer", "a las 09:00 se abre Amanecer");
    const primero = await p.locator("#dias button").first().innerText();
    ok(/Hoy/.test(primero), "a las 09:00 el primer día es «Hoy»: " + primero.replace(/\n/g, " "));
    await ctx.close();
  }

  titulo("D: el panel de Amanecer: hora, semáforo, brújula hacia la salida del sol y receta; sin «La luz de hoy»");
  {
    const { ctx, p } = await abrir(b, base);
    await p.click("[data-tab=amanecer]");
    const sub = await p.locator(".subtitulo").innerText();
    ok(/Amanecer a las \d\d:\d\d/.test(sub), "el panel dice: " + sub);
    ok(await p.locator(".veredicto .titulo").count() === 1, "muestra su semáforo: " + await p.locator(".veredicto .titulo").innerText());
    const brujula = (await p.locator(".brujula").innerText()).replace(/\n/g, " ");
    const grados = Number((/\((\d+)°\)/.exec(brujula) || [])[1]);
    ok(/Al amanecer, mira hacia el/.test(brujula) && grados >= 90 && grados <= 150, "brújula hacia la salida del sol (sureste, 90° a 150°): " + brujula);
    ok(await p.locator("#receta").count() === 1, "tiene receta");
    ok(await p.locator(".luz-de-hoy").count() === 0 && await p.locator(".franja").count() === 0, "sin «La luz de hoy»: la franja es de la puesta de sol");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("E: el cielo de Amanecer: despejado, cubierto con semáforo rojo, y Atardecer sigue con el de tarde");
  {
    const { ctx, p } = await abrir(b, base, { datos: previsionConCambios({ ...DESPEJADO }) });
    await p.click("[data-tab=amanecer]");
    ok(await p.locator("header.cabecera").getAttribute("data-cielo") === "amanecer", "con el cielo despejado: «amanecer»");
    ok(archivoDe("amanecer").test(await p.locator("header.cabecera img.cielo").getAttribute("src")), "la imagen es la de amanecer: " + await p.locator("header.cabecera img.cielo").getAttribute("src"));
    await p.click("[data-tab=atardecer]");
    ok(await p.locator("header.cabecera").getAttribute("data-cielo") === "tarde", "Atardecer sigue con «tarde»");
    await ctx.close();
  }
  {
    const { ctx, p } = await abrir(b, base, { datos: previsionConCambios({ ...DESPEJADO, cloud_cover_low: 95 }) });
    await p.click("[data-tab=amanecer]");
    ok(await p.locator(".veredicto.rojo").count() === 1, "con el cielo bajo cerrado el semáforo es rojo");
    ok(await p.locator("header.cabecera").getAttribute("data-cielo") === "amanecer-cubierta", "y el cielo es «amanecer-cubierta»");
    ok(archivoDe("amanecer-cubierta").test(await p.locator("header.cabecera img.cielo").getAttribute("src")), "la imagen es la de amanecer cubierto");
    await ctx.close();
  }

  titulo("F: la niebla es una ventaja con aviso; la lluvia fuerte sigue en rojo");
  {
    const { ctx, p } = await abrir(b, base, { datos: previsionConCambios({ ...DESPEJADO, cloud_cover_low: 95, visibility: 2000 }) });
    await p.click("[data-tab=amanecer]");
    ok(await p.locator(".veredicto.rojo").count() === 0, "con niebla y el cielo bajo cerrado el semáforo no es rojo");
    ok(/Poca visibilidad \(niebla\)/.test(await p.locator(".avisos").innerText()), "con su aviso: " + (await p.locator(".avisos").innerText()).replace(/\n/g, " "));
    ok(/40 \/ 40/.test(await p.locator("table").first().innerText()), "«Nubes bajas» da sus 40 puntos");
    await ctx.close();
  }
  {
    const { ctx, p } = await abrir(b, base, { datos: previsionConCambios({ ...DESPEJADO, cloud_cover_low: 95, visibility: 2000, precipitation: 10, precipitation_probability: 100 }) });
    await p.click("[data-tab=amanecer]");
    ok(await p.locator(".veredicto.rojo").count() === 1, "con niebla y lluvia fuerte el semáforo sigue en rojo");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/ollada/" });
