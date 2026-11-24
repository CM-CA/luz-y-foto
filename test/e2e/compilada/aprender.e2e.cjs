// La pantalla Aprender: la barra de abajo (Hoy | Aprender), la lista de lecciones y cada lección. Se comprueba que la barra no tapa el final de
// Hoy, que se llega a las lecciones y se vuelve (también con el botón «atrás»), que Hoy conserva su estado al volver (sin pedir la previsión otra
// vez), que una lección que no existe lo dice y que todo se ve bien en 320, 360 y 390 px, en claro y oscuro, con letra normal y ancha.
//
// Ejecutar: node test/e2e/compilada/aprender.e2e.cjs   (antes: npm run build)
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
const PERFIL_MOVIL = { equipo: "movil", marca: "desconocida", objetivos: [], tripode: "no", nivel: "empiezo", respondidas: ["equipo", "tripode", "nivel"] };
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";
const INDICE = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "es", "lecciones.json"), "utf8"));
const IDS = INDICE.grupos.flatMap((g) => g.lecciones);
const TOTAL = IDS.length;
// Lo que debe verse de cada lección sale de sus datos: el título y la etiqueta «Para cámara» / «Para móvil» según `para`
const LECCIONES = Object.fromEntries(IDS.map((id) => [id, JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "es", "lecciones", id + ".json"), "utf8"))]));
const TITULOS = Object.fromEntries(IDS.map((id) => [id, LECCIONES[id].titulo]));
const PARA = Object.fromEntries(IDS.map((id) => [id, INDICE.etiquetas.para[LECCIONES[id].para]]));
// Que los datos de ejemplo no se hayan vaciado: estas lecciones tienen que estar, con su título y su etiqueta
const ESPERADAS = { "la-rueda-de-modos": ["La rueda de modos", "Para cámara"], "el-manual-de-verdad": ["El manual de verdad", "Para cámara"], "como-usar-el-histograma": ["Cómo usar el histograma", "Para cámara"], "parasol-y-filtro-uv": ["Parasol y filtro UV", "Para cámara"], "toca-para-enfocar-y-exponer": ["Toca para enfocar y exponer", "Para móvil"], "luz-baja-y-modo-noche": ["Luz baja y modo noche", "Para móvil"], "zoom-y-lentes": ["Zoom y lentes: cuál usar", "Para móvil"], "fotografia-de-paisaje": ["Fotografía de paisaje", "Para todos"], "fotografia-deportiva": ["Fotografía deportiva", "Para todos"], "fotografia-urbana": ["Fotografía urbana", "Para todos"], "fotografia-nocturna": ["Fotografía nocturna", "Para todos"], "fotografia-de-retrato": ["Fotografía de retrato", "Para todos"], "fotografia-de-arquitectura": ["Fotografía de arquitectura", "Para todos"] };

const activo = (p) => p.evaluate(() => [...document.querySelectorAll("nav.nav-inferior a")].filter((a) => a.getAttribute("aria-current") === "page").map((a) => a.textContent.trim()));
const hash = (p) => p.evaluate(() => location.hash);

ejecutar("aprender", async ({ b, base }) => {
  titulo("A: la barra de abajo en Hoy, sin tapar el final de la página");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const enlaces = await p.evaluate(() => [...document.querySelectorAll("nav.nav-inferior a")].map((a) => ({ texto: a.textContent.trim(), href: a.getAttribute("href") })));
    ok(enlaces.length === 2 && enlaces[0].texto === "Hoy" && enlaces[0].href === "#/hoy" && enlaces[1].texto === "Aprender" && enlaces[1].href === "#/aprender", "dos enlaces: Hoy y Aprender (" + JSON.stringify(enlaces) + ")");
    ok((await activo(p)).join() === "Hoy", "Hoy es el activo (" + (await activo(p)) + ")");
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const r = await p.evaluate(() => ({ pie: document.querySelector(".pie").getBoundingClientRect().bottom, barra: document.querySelector("nav.nav-inferior").getBoundingClientRect().top }));
    ok(r.pie <= r.barra + 0.5, "al llegar al final, el pie queda por encima de la barra (" + Math.round(r.pie) + " y " + Math.round(r.barra) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: la lista: se llega desde la barra, con su grupo y la duración de cada lección");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("nav.nav-inferior a[href='#/aprender']");
    await p.waitForSelector("ol.lecciones");
    ok(await hash(p) === "#/aprender", "la dirección es #/aprender (" + await hash(p) + ")");
    const l = await p.evaluate(() => ({
      h1: document.querySelector("h1").textContent.trim(), grupo: (document.querySelector("h3:not(.selector-idioma h3)") || { textContent: "" }).textContent.trim(),
      grupos: [...document.querySelectorAll("h3:not(.selector-idioma h3)")].map((h) => h.textContent.trim()),
      filas: [...document.querySelectorAll("ol.lecciones li a")].map((a) => ({ href: a.getAttribute("href"), t: a.querySelector(".lec-t").textContent.trim(), min: a.querySelector(".lec-min").textContent.trim(), r: a.querySelector(".lec-r").textContent.trim() })),
      foco: document.activeElement && document.activeElement.tagName, scroll: window.scrollY
    }));
    ok(l.h1 === "Aprender", "el título es «Aprender» (" + l.h1 + ")");
    ok(l.grupo === "Lo básico", "el primer grupo es «Lo básico» (" + l.grupo + ")");
    ok(l.grupos.join("|") === INDICE.grupos.map((g) => g.titulo).join("|") && l.grupos[1] === "Para el móvil", "los grupos, aparte y en orden: " + l.grupos.join(" | "));
    ok(l.filas.length === TOTAL, "tantas filas como lecciones del índice (" + l.filas.length + " y " + TOTAL + ")");
    ok(l.filas[0].href === "#/aprender/la-rueda-de-modos" && l.filas[0].t === "La rueda de modos" && l.filas[0].min === "3 min" && l.filas[0].r.length > 0, "la primera fila: " + JSON.stringify(l.filas[0]));
    ok(l.foco === "H1" && l.scroll === 0, "el foco va al título y la ventana está arriba (" + l.foco + ", " + l.scroll + ")");
    ok((await activo(p)).join() === "Aprender", "Aprender pasa a ser el activo (" + (await activo(p)) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("C: una lección: contenido, términos tocables, volver y el botón «atrás»");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("nav.nav-inferior a[href='#/aprender']"); await p.waitForSelector("ol.lecciones");
    await p.click("ol.lecciones li a");
    await p.waitForSelector(".leccion-meta");
    ok(await hash(p) === "#/aprender/la-rueda-de-modos", "la dirección es la de la lección (" + await hash(p) + ")");
    const l = await p.evaluate(() => ({
      h1: document.querySelector("h1").textContent.trim(), meta: document.querySelector(".leccion-meta").textContent.replace(/\s+/g, " ").trim(),
      tipos: [...document.querySelectorAll("[class*='bloque-']")].map((e) => [...e.classList].find((c) => c.startsWith("bloque-"))),
      idea: (document.querySelector(".bloque-idea") || { textContent: "" }).textContent, pruebalo: (document.querySelector(".bloque-pruebalo") || { textContent: "" }).textContent,
      foco: document.activeElement && document.activeElement.tagName, scroll: window.scrollY
    }));
    ok(l.h1 === "La rueda de modos", "el título es «La rueda de modos» (" + l.h1 + ")");
    ok(l.meta === "3 min · Para cámara", "la línea de datos: «" + l.meta + "»");
    ok(l.tipos.includes("bloque-idea") && l.tipos.includes("bloque-parrafo") && l.tipos.includes("bloque-lista") && l.tipos.includes("bloque-subtitulo") && l.tipos.includes("bloque-pruebalo"), "un elemento por tipo de bloque (" + l.tipos.join(",") + ")");
    ok(/Av/.test(l.idea) && /Tv/.test(l.idea), "el bloque idea nombra Av y Tv");
    ok(/Pruébalo hoy/.test(l.pruebalo), "el bloque de práctica lleva «Pruébalo hoy»");
    ok(l.foco === "H1" && l.scroll === 0, "el foco va al título y la ventana está arriba (" + l.foco + ", " + l.scroll + ")");
    ok((await activo(p)).join() === "Aprender", "dentro de una lección, Aprender sigue activo (" + (await activo(p)) + ")");

    const termino = p.locator(".cuerpo button.termino, .pagina button.termino").first();
    await termino.click();
    const abierto = await p.evaluate(() => { const d = document.querySelector(".def"); return d ? d.textContent.trim() : null; });
    ok(abierto && abierto.length > 20, "tocar un término abre su definición: «" + (abierto || "").slice(0, 50) + "…»");
    await termino.click();
    ok(await p.locator(".def").count() === 0, "tocarlo otra vez la cierra");

    // El botón «atrás» del navegador: de la lección a la lista y de la lista a Hoy
    await p.goBack(); await p.waitForSelector("ol.lecciones");
    ok(await hash(p) === "#/aprender", "«atrás» desde la lección vuelve a la lista (" + await hash(p) + ")");
    await p.goBack(); await p.waitForSelector(".veredicto");
    ok(await hash(p) === "#/hoy", "y «atrás» otra vez vuelve a Hoy (" + await hash(p) + ")");
    // Y el enlace «← Aprender» de la lección lleva a la lista
    await p.goForward(); await p.goForward(); await p.waitForSelector(".leccion-meta");
    await p.click("a.volver"); await p.waitForSelector("ol.lecciones");
    ok(await hash(p) === "#/aprender", "«← Aprender» vuelve a la lista (" + await hash(p) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("D: Hoy conserva su estado al volver de Aprender (y no pide la previsión otra vez)");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    ok(await p.getAttribute("[data-tab=luna]", "aria-selected") === "true", "la pestaña «Noche» está elegida");
    const antes = p.llamadas.forecast;
    ok(antes === 1, "hasta aquí, una sola petición de la previsión (" + antes + ")");
    await p.click("nav.nav-inferior a[href='#/aprender']"); await p.waitForSelector("ol.lecciones");
    await p.click("nav.nav-inferior a[href='#/hoy']"); await p.waitForSelector(".veredicto");
    ok(await p.getAttribute("[data-tab=luna]", "aria-selected") === "true", "al volver, la pestaña sigue siendo «Noche»");
    ok(p.llamadas.forecast === 1, "y la previsión no se ha vuelto a pedir (" + p.llamadas.forecast + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("E: una lección que no existe lo dice y ofrece volver");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/aprender/no-existe");
    await p.waitForSelector("text=No encuentro esa lección");
    const enlace = await p.evaluate(() => { const a = document.querySelector(".pagina a[href='#/aprender']"); return a ? a.textContent.trim() : null; });
    ok(enlace, "hay un enlace a Aprender (" + enlace + ")");
    await p.click(".pagina a[href='#/aprender']");
    await p.waitForSelector("ol.lecciones");
    ok(await hash(p) === "#/aprender", "y lleva a la lista (" + await hash(p) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("G: el dibujo de la lección se pinta en la página, tiene texto alternativo y toma los colores del tema");
  for (const [esquema, tema, tinta, fondo] of [["light", "claro", "rgb(31, 39, 64)", "rgb(255, 255, 255)"], ["dark", "oscuro", "rgb(236, 235, 245)", "rgb(24, 33, 58)"]]) {
    const { ctx, p } = await nuevaPagina(b, { colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/aprender/la-rueda-de-modos"); await p.waitForSelector("figure.dibujo svg");
    const d = await p.evaluate(() => {
      const f = document.querySelector("figure.dibujo"), s = f.querySelector("svg"), caja = s.getBoundingClientRect();
      return { imagenes: f.querySelectorAll("img").length, nombre: f.querySelector("[role=img]").getAttribute("aria-label"), textos: s.querySelectorAll("text").length,
        tinta: getComputedStyle(s.querySelector("text")).fill, fondo: getComputedStyle(s.querySelector("rect")).fill, pie: f.querySelector("figcaption").textContent.trim(),
        ancho: caja.width, alto: caja.height, viewBox: s.getAttribute("viewBox") };
    });
    ok(d.imagenes === 0 && d.textos >= 8, tema + ": es un SVG con texto en la página, no una imagen (" + d.textos + " textos)");
    ok(d.nombre.length > 20, tema + ": su nombre accesible es el texto alternativo («" + d.nombre.slice(0, 40) + "…»)");
    ok(d.tinta === tinta && d.fondo === fondo, tema + ": tinta " + d.tinta + " y fondo " + d.fondo + " del tema");
    ok(d.pie === "Cuadro lleno: lo eliges tú. Vacío: lo elige la cámara.", tema + ": con su pie");
    ok(d.ancho > 200 && d.viewBox === "0 0 358 196" && Math.abs(d.alto / d.ancho - 196 / 358) < 0.01, tema + ": se ve con un tamaño razonable y sus proporciones (" + Math.round(d.ancho) + " × " + Math.round(d.alto) + " px)");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("H: sin conexión, la lección y su dibujo se abren desde la caché (el dibujo va dentro de la app)");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false, serviceWorkers: "allow", perfil: PERFIL, lugar: LUGAR });
    await p.goto(base); await p.waitForSelector("[data-tab]");
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    await ctx.setOffline(true);
    await p.route("**/api.open-meteo.com/**", (r) => r.abort("internetdisconnected"));
    await p.goto(base + "#/aprender/la-rueda-de-modos");
    await p.reload(); await p.waitForSelector("figure.dibujo svg");
    const ancho = await p.evaluate(() => document.querySelector("figure.dibujo svg").getBoundingClientRect().width);
    ok(ancho > 0, "recargando la lección sin red, el dibujo se pinta (" + Math.round(ancho) + " px)");
    ok(await p.locator("h1.apr-titulo").innerText() === "La rueda de modos", "y la lección también");
    await ctx.close();
  }

  titulo("H2: sin conexión, con móvil: el enlace de la receta abre su lección y su dibujo");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false, serviceWorkers: "allow", perfil: PERFIL_MOVIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
    await ctx.setOffline(true);
    await p.route("**/api.open-meteo.com/**", (r) => r.abort("internetdisconnected"));
    for (const [pestana, id] of [["atardecer", "toca-para-enfocar-y-exponer"], ["luna", "luz-baja-y-modo-noche"]]) {
      await p.goto(base + "#/hoy"); await p.reload(); await p.waitForSelector("[data-tab=" + pestana + "]");
      await p.click("[data-tab=" + pestana + "]");
      if (pestana === "luna") await p.click("#dias button[data-i='0']");
      await p.waitForSelector("#receta");
      if (await p.locator("#receta").getAttribute("open") === null) await p.click("#receta summary");
      await p.click("#receta a.aprende-por-que"); await p.waitForSelector("figure.dibujo svg");
      const ancho = await p.evaluate(() => document.querySelector("figure.dibujo svg").getBoundingClientRect().width);
      ok(await hash(p) === "#/aprender/" + id && ancho > 0, "sin red, desde la receta de " + pestana + " se abre «" + id + "» con su dibujo (" + ancho + " px)");
    }
    const propios = p.errores.filter((e) => !/ERR_INTERNET_DISCONNECTED/.test(e)); // la previsión cortada a propósito da ese aviso
    ok(propios.length === 0, "sin más errores: " + propios.join(";"));
    await ctx.close();
  }

  titulo("I: las lecciones: cada una se abre desde la lista, con su título y su dibujo, sin desbordar a 320 px");
  {
    ok(Object.keys(ESPERADAS).every((id) => IDS.includes(id) && TITULOS[id] === ESPERADAS[id][0] && PARA[id] === ESPERADAS[id][1]), "el índice trae las lecciones esperadas, con su título y para quién son (" + IDS.join(", ") + ")");
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 320, height: 800 }, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/aprender"); await p.waitForSelector("ol.lecciones");
    const filas = await p.evaluate(() => [...document.querySelectorAll("ol.lecciones li a")].map((a) => a.querySelector(".lec-t").textContent.trim()));
    ok(JSON.stringify(filas) === JSON.stringify(IDS.map((id) => TITULOS[id])), "la lista las muestra en orden: " + filas.join(" | "));
    for (const id of IDS) {
      await p.goto(base + "#/aprender"); await p.waitForSelector("ol.lecciones");
      await p.click("ol.lecciones li a[href='#/aprender/" + id + "']");
      await p.waitForSelector(".leccion-meta"); await p.waitForSelector("figure.dibujo svg");
      const r = await p.evaluate(() => ({
        h1: document.querySelector("h1").textContent.trim(), ancho: document.querySelector("figure.dibujo svg").getBoundingClientRect().width,
        alt: document.querySelector("figure.dibujo [role=img]").getAttribute("aria-label"), pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        meta: document.querySelector(".leccion-meta").textContent.trim()
      }));
      ok(r.h1 === TITULOS[id], id + ": el título es «" + r.h1 + "»");
      ok(r.ancho > 0 && r.alt.length > 20, id + ": su dibujo carga y tiene texto alternativo");
      ok(r.pagina <= 0, id + ": no desborda a 320 px");
      ok(r.meta.endsWith(" · " + PARA[id]), id + ": «" + r.meta + "» (debe acabar en «" + PARA[id] + "»)");
      // Cada término tocable de la lección abre su definición (y tocarlo otra vez la cierra)
      const nTerminos = await p.locator("button.termino").count();
      let abren = 0;
      for (let i = 0; i < nTerminos; i++) {
        const t = p.locator("button.termino").nth(i);
        await t.click();
        const def = await p.evaluate(() => { const d = document.querySelector(".def"); return d ? d.textContent.trim() : ""; });
        if (def.length > 20) abren++;
        await t.click();
      }
      ok(abren === nTerminos, id + ": sus " + nTerminos + " términos abren su definición (" + abren + ")");
    }
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("J: la receta enlaza a su lección («Aprende por qué estos ajustes»)");
  {
    // La receta abierta de la pestaña que se pide, con el enlace que lleva (o null si no hay)
    const enlaceDe = async (p, pestana) => {
      await p.click("[data-tab=" + pestana + "]");
      if (pestana === "luna") await p.click("#dias button[data-i='0']");
      await p.waitForSelector("#receta, .invitacion");
      if (await p.locator("#receta").count() && !(await p.locator("#receta").getAttribute("open") !== null)) await p.click("#receta summary");
      return p.evaluate(() => { const a = document.querySelector("#receta a.aprende-por-que"); return a ? { href: a.getAttribute("href"), texto: a.textContent.replace(/\s+/g, " ").trim() } : null; });
    };
    {
      const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      const a = await enlaceDe(p, "atardecer");
      ok(a && a.href === "#/aprender/la-rueda-de-modos" && a.texto.includes("Aprende por qué estos ajustes") && a.texto.includes("La rueda de modos · 3 min"), "Atardecer con cámara: el enlace a La rueda de modos (" + JSON.stringify(a) + ")");
      const orden = await p.evaluate(() => { const l = document.querySelector("#receta a.aprende-por-que"), ol = document.querySelector("#receta ol"); return !!(ol.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING); });
      ok(orden, "va después de los pasos");
      const luna = await enlaceDe(p, "luna");
      ok(luna && luna.href === "#/aprender/la-rueda-de-modos", "Noche con trípode «a veces» (hoy sin él): también la rueda de modos (" + JSON.stringify(luna) + ")");
      await p.click("[data-tripode=si]");
      const manual = await p.evaluate(() => { const a = document.querySelector("#receta a.aprende-por-que"); return a ? a.getAttribute("href") : null; });
      ok(manual === "#/aprender/el-manual-de-verdad", "al decir que hoy sí llevas trípode, la receta pasa a modo M y el enlace a El manual de verdad (" + manual + ")");
      await p.click("#receta a.aprende-por-que");
      await p.waitForSelector(".leccion-meta");
      ok(await hash(p) === "#/aprender/el-manual-de-verdad" && await p.locator("h1").innerText() === "El manual de verdad", "al pulsarlo se abre esa lección (" + await hash(p) + ")");
      ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
      await ctx.close();
    }
    {
      const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      await enlaceDe(p, "amanecer");
      await p.click("#receta a.aprende-por-que"); await p.waitForSelector(".leccion-meta");
      ok(await hash(p) === "#/aprender/la-rueda-de-modos" && await p.locator("h1").innerText() === "La rueda de modos", "el enlace de la receta abre la lección");
      await ctx.close();
    }
    {
      const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL_MOVIL, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      const DESTINO = { amanecer: ["toca-para-enfocar-y-exponer", "Toca para enfocar y exponer"], atardecer: ["toca-para-enfocar-y-exponer", "Toca para enfocar y exponer"], luna: ["luz-baja-y-modo-noche", "Luz baja y modo noche"] };
      for (const pestana of ["amanecer", "atardecer", "luna"]) {
        const a = await enlaceDe(p, pestana);
        const [id, titulo] = DESTINO[pestana];
        ok(a && a.href === "#/aprender/" + id && a.texto.includes("Aprende por qué estos ajustes") && a.texto.includes(titulo + " · 2 min"), "con móvil, en " + pestana + ": el enlace a «" + titulo + "» (" + JSON.stringify(a) + ")");
      }
      await p.click("#receta a.aprende-por-que"); await p.waitForSelector(".leccion-meta");
      ok(await hash(p) === "#/aprender/luz-baja-y-modo-noche" && (await p.locator(".leccion-meta").innerText()).endsWith("Para móvil"), "el enlace de la receta de móvil abre su lección (" + await hash(p) + ")");
      await ctx.close();
    }
    for (const [esquema, ancho] of [["dark", 320], ["light", 320], ["dark", 390]]) {
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      await enlaceDe(p, "atardecer");
      await p.addStyleTag({ content: LETRA_ANCHA });
      const r = await p.evaluate(() => { const a = document.querySelector("#receta a.aprende-por-que").getBoundingClientRect(), borde = document.documentElement.clientWidth; return { derecha: a.right, borde, alto: a.height, pagina: document.documentElement.scrollWidth - borde }; });
      ok(r.derecha <= r.borde + 0.5 && r.pagina <= 0 && r.alto >= 44, esquema + ", " + ancho + " px, letra ancha: el enlace cabe (" + Math.round(r.derecha) + " de " + r.borde + ", alto " + Math.round(r.alto) + ")");
      await ctx.close();
    }
  }

  titulo("F: medidas: 320, 360 y 390 px, claro y oscuro, letra normal y ancha");
  for (const esquema of ["light", "dark"]) {
    for (const [nombreLetra, css] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
      for (const ancho of [320, 360, 390]) {
        for (const destino of ["#/hoy", "#/aprender", ...IDS.map((id) => "#/aprender/" + id)]) {
          const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
          await p.goto(base + destino);
          await p.waitForSelector(destino === "#/hoy" ? ".veredicto" : destino === "#/aprender" ? "ol.lecciones" : ".leccion-meta");
          if (css) await p.addStyleTag({ content: css });
          const r = await p.evaluate(() => {
            const borde = document.documentElement.clientWidth, main = document.querySelector("main");
            const fuera = [...main.querySelectorAll("*")].filter((e) => { const x = e.getBoundingClientRect(); return x.width > 0 && x.right > borde + 0.5; }).length;
            return {
              pagina: document.documentElement.scrollWidth - borde, fuera,
              barra: [...document.querySelectorAll("nav.nav-inferior a")].map((a) => a.getBoundingClientRect().height)
            };
          });
          ok(r.pagina <= 0 && r.fuera === 0 && r.barra.length === 2 && r.barra.every((h) => h >= 44),
            esquema + ", " + nombreLetra + ", " + ancho + " px, " + destino + (r.pagina > 0 ? " (desborda " + r.pagina + ")" : "") + (r.fuera ? " (" + r.fuera + " elementos se salen)" : "") + (r.barra.every((h) => h >= 44) ? "" : " (barra baja: " + r.barra + ")"));
          ok(p.errores.length === 0, "  sin errores: " + p.errores.join(";"));
          await ctx.close();
        }
      }
    }
  }
}, undefined);
