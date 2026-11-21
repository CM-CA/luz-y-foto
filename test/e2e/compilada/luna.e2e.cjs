// La luna con su fase real: en la pestaña Noche, el cielo de la cabecera lleva la luna de esa noche (una de 16 imágenes) y el
// panel la repite junto al nombre de la fase. En el hemisferio sur se ven al revés, y con la noche cubierta (semáforo rojo)
// la luna de la cabecera se apaga. En Atardecer no hay luna en el cielo.
//
// Ejecutar: node test/e2e/compilada/luna.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, simulada, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const SANTIAGO_DE_CHILE = { lat: -33.45, lon: -70.66, nombre: "Santiago de Chile", origen: "busqueda" };
// El nombre del archivo lleva el número de fase (00 a 15) y el código que le pone Vite (8 caracteres)
const FASE = /\/luna-(\d\d)-[A-Za-z0-9_-]{8}\.webp$/;
const faseDe = (src) => { const m = FASE.exec(src || ""); return m ? Number(m[1]) : null; };

// Lo que se ve de las lunas: la del cielo y la del panel
const leer = (p) => p.evaluate(() => {
  const cab = document.querySelector("header.cabecera").getBoundingClientRect();
  const cielo = document.querySelector("img.luna-cielo"), panel = document.querySelector(".luna-cab img");
  const medir = (img) => {
    if (!img) return null;
    const r = img.getBoundingClientRect(), e = getComputedStyle(img);
    return { src: img.getAttribute("src"), alt: img.getAttribute("alt"), ancho: r.width, alto: r.height, transform: e.transform, opacidad: Number(e.opacity), filtro: e.filter,
      cx: (r.left + r.width / 2 - cab.left) / cab.width, cy: (r.top + r.height / 2 - cab.top) / cab.height, cargada: img.complete && img.naturalWidth > 0 };
  };
  const nombre = document.querySelector(".luna-nombre");
  return {
    cielo: medir(cielo), panel: medir(panel), cielos: document.querySelectorAll("img.luna-cielo").length,
    dataCielo: document.querySelector("header.cabecera").dataset.cielo,
    nombre: nombre ? { texto: nombre.textContent.trim(), tamano: getComputedStyle(nombre).fontSize, familia: getComputedStyle(nombre).fontFamily } : null,
    detalle: document.querySelector(".luna-cab p") ? document.querySelector(".luna-cab p").textContent.replace(/\s+/g, " ").trim() : null
  };
});

const matriz = (t) => { const m = /^matrix\(([^)]+)\)$/.exec(t || ""); return m ? m[1].split(",").map(Number) : null; };

ejecutar("luna", async ({ b, base }) => {
  titulo("A: pestaña Noche en Vigo (19 de noviembre de 2026): la luna de esa noche en el cielo y en el panel");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    ok((await leer(p)).cielos === 0, "en Atardecer no hay luna en el cielo");
    await p.click("[data-tab=luna]");
    await p.waitForSelector(".luna-cab img");
    await p.waitForFunction(() => [...document.querySelectorAll("img.luna-cielo, .luna-cab img")].every((i) => i.complete)); // las imágenes pueden tardar bajo carga
    const r = await leer(p);
    ok(r.cielos === 1 && r.cielo, "en Noche hay una luna en el cielo (" + r.cielos + ")");
    const fase = r.cielo && faseDe(r.cielo.src);
    ok(fase !== null && fase >= 5 && fase <= 8, "es una luna gibosa creciente (imagen " + fase + " de 16; archivo " + (r.cielo && r.cielo.src) + ")");
    ok(r.panel && r.cielo && r.panel.src === r.cielo.src, "el panel enseña la misma luna que el cielo (" + (r.panel && r.panel.src) + ")");
    ok(r.cielo.cargada && r.panel.cargada, "las dos imágenes cargan");
    ok(r.cielo.alt === "" && r.panel.alt === "", "las dos son decorativas (alt vacío): el nombre y el porcentaje van en el texto");
    ok(Math.round(r.cielo.ancho) === 64 && Math.round(r.cielo.alto) === 64, "la del cielo mide 64 × 64 px (" + r.cielo.ancho + " × " + r.cielo.alto + ")");
    ok(Math.abs(r.cielo.cx - 0.75) < 0.01 && Math.abs(r.cielo.cy - 0.33) < 0.01, "y está al 75 % del ancho y al 33 % del alto del cielo (" + (r.cielo.cx * 100).toFixed(1) + " %, " + (r.cielo.cy * 100).toFixed(1) + " %)");
    ok(/drop-shadow/.test(r.cielo.filtro), "con un halo: " + r.cielo.filtro);
    ok(r.cielo.transform === "none" && r.panel.transform === "none", "en el hemisferio norte no se voltea");
    ok(r.dataCielo === "noche-cubierta" && r.cielo.opacidad < 1, "la primera noche es roja (nubes y lluvia): cielo cubierto y la luna apagada (" + r.dataCielo + ", opacidad " + r.cielo.opacidad + ")");
    ok(Math.round(r.panel.ancho) === 66 && Math.round(r.panel.alto) === 66, "la del panel mide 66 × 66 px (" + r.panel.ancho + " × " + r.panel.alto + ")");
    ok(r.nombre && r.nombre.tamano === "22px" && /Young Serif/.test(r.nombre.familia), "el nombre de la fase va en Young Serif de 22 px (" + JSON.stringify(r.nombre) + ")");
    ok(/^\d+ % iluminada, creciendo$/.test(r.detalle.replace(r.nombre.texto, "").trim()), "y debajo, el porcentaje y si crece o mengua: «" + r.detalle + "»");
    // La noche del 20 al 21 está despejada en la previsión de prueba: semáforo verde, cielo de noche y la luna entera
    await p.click("#dias button[data-i='1']");
    const clara = await leer(p);
    ok(await p.locator(".veredicto.verde").count() === 1, "la segunda noche es verde");
    ok(clara.dataCielo === "noche" && clara.cielo.opacidad === 1, "con el cielo despejado la luna se ve entera (" + clara.dataCielo + ", opacidad " + clara.cielo.opacidad + ")");
    const fase2 = faseDe(clara.cielo.src);
    ok(fase2 !== null && fase2 >= fase && fase2 <= fase + 1, "y es la luna de esa noche, un día más creciente (imagen " + fase2 + ")");
    ok(clara.panel.src === clara.cielo.src, "también en el panel");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: en el hemisferio sur la luna se ve al revés, en el cielo y en el panel");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: SANTIAGO_DE_CHILE });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    await p.waitForSelector(".luna-cab img");
    const r = await leer(p);
    const a = matriz(r.cielo && r.cielo.transform), c = matriz(r.panel && r.panel.transform);
    ok(a && a[0] === -1 && a[3] === 1, "la del cielo lleva un volteo horizontal (a = −1): " + (r.cielo && r.cielo.transform));
    ok(c && c[0] === -1 && c[3] === 1, "la del panel también: " + (r.panel && r.panel.transform));
    ok(r.cielo && Math.abs(r.cielo.cx - 0.75) < 0.01 && Math.abs(r.cielo.cy - 0.33) < 0.01, "y sigue en su sitio (" + (r.cielo.cx * 100).toFixed(1) + " %, " + (r.cielo.cy * 100).toFixed(1) + " %)");
    await ctx.close();
  }

  titulo("C: con la noche cubierta y lluvia (semáforo rojo) el cielo es el cubierto y la luna se apaga");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.route("**/api.open-meteo.com/**", (ruta) => {
      const d = simulada();
      for (const k of ["cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high"]) d.hourly[k] = d.hourly[k].map(() => 100);
      d.hourly.precipitation = d.hourly.precipitation.map(() => 3);
      ruta.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(d) });
    });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    await p.waitForSelector(".luna-cab img");
    const r = await leer(p);
    ok(await p.locator(".veredicto.rojo").count() === 1, "el semáforo de esa noche es rojo");
    ok(r.dataCielo === "noche-cubierta", "el cielo es «noche-cubierta» (" + r.dataCielo + ")");
    ok(r.cielo && r.cielo.opacidad < 1 && r.cielo.opacidad > 0, "y la luna está apagada (opacidad " + (r.cielo && r.cielo.opacidad) + ")");
    ok(r.panel && r.panel.opacidad === 1, "la del panel no (opacidad " + (r.panel && r.panel.opacidad) + ")");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
