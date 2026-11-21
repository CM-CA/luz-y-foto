// El equipo ya no es una tarjeta aparte: vive en la receta. Con el equipo configurado, la receta (un desplegable) lleva su resumen y,
// dentro, el botón para editarlo; sin configurar, en su lugar hay una invitación con un único botón. El lugar vive en la cabecera
// (ya no hay tarjeta «Lugar»), y el asistente del equipo queda en el flujo con 16 px de margen a cada lado.
//
// Ejecutar: node test/e2e/compilada/equipo.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const SIN_CONFIGURAR = { equipo: "movil", respondidas: [] };
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";

ejecutar("equipo", async ({ b, base }) => {
  for (const [nombreLetra, css] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
    for (const ancho of [320, 360, 390]) {
      titulo("A: sin equipo configurado — " + nombreLetra + ", " + ancho + " px");
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, perfil: SIN_CONFIGURAR, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
      if (css) await p.addStyleTag({ content: css });
      const r = await p.evaluate(() => {
        const panel = document.querySelector("#panel").getBoundingClientRect(), inv = document.querySelector(".invitacion");
        const boton = document.querySelector("#editarEquipo"), resumen = document.querySelector("#resumenEquipo");
        const caja = (e) => { const x = e.getBoundingClientRect(); return { izq: x.left, der: x.right, alto: x.height }; };
        return {
          tarjeta: document.querySelectorAll(".equipo").length,
          resumen: resumen ? resumen.textContent.trim() : null, resumenVisible: !!resumen && resumen.getClientRects().length > 0,
          acciones: [...document.querySelectorAll("[data-accion=equipo]")].map((e) => e.id),
          botones: document.querySelectorAll("#editarEquipo").length, boton: boton ? { texto: boton.textContent.trim(), ...caja(boton) } : null,
          invitacion: inv ? { ...caja(inv), texto: inv.textContent.replace(/\s+/g, " ").trim(), dentro: inv.closest("#panel") !== null } : null,
          panel: { izq: panel.left, der: panel.right }, receta: document.querySelectorAll("#receta").length,
          pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          lugaresFueraDeLaCabecera: [...document.querySelectorAll(".lugar")].filter((e) => !e.closest("header.cabecera")).length
        };
      });
      ok(r.tarjeta === 0, "no existe la tarjeta .equipo (" + r.tarjeta + ")");
      ok(r.resumen === "Sin configurar" && r.resumenVisible, "#resumenEquipo dice «Sin configurar» y se ve («" + r.resumen + "»)");
      ok(r.acciones.length === 1 && r.acciones[0] === "editarEquipo" && r.botones === 1, "hay un solo [data-accion=equipo] y es #editarEquipo (" + r.acciones.join(",") + ")");
      ok(r.boton && r.boton.texto === "Configurar mi equipo" && r.boton.alto >= 44, "el botón dice «Configurar mi equipo» y se pulsa bien (" + (r.boton && r.boton.alto) + " px)");
      ok(r.invitacion && r.invitacion.dentro && /Cuéntame tu equipo para ver la receta de esta salida/.test(r.invitacion.texto), "invitación dentro del panel: «" + (r.invitacion && r.invitacion.texto) + "»");
      ok(r.invitacion && r.invitacion.izq >= r.panel.izq - 0.5 && r.invitacion.der <= r.panel.der + 0.5 && r.pagina <= 0, "cabe en la tarjeta y la página no desborda (" + r.pagina + ")");
      ok(r.receta === 0, "no hay receta");
      ok(r.lugaresFueraDeLaCabecera === 0, "no hay tarjeta «Lugar»: el lugar solo está en la cabecera (" + r.lugaresFueraDeLaCabecera + ")");

      // El asistente queda en el flujo, con 16 px de margen a cada lado
      await p.click("#editarEquipo");
      const a = await p.evaluate(() => { const x = document.querySelector("#asistente").getBoundingClientRect(); return { izq: x.left, der: x.right, ancho: document.documentElement.clientWidth, visible: x.height > 0 }; });
      ok(a.visible && Math.abs(a.izq - 16) <= 1 && Math.abs(a.ancho - a.der - 16) <= 1, "el asistente se abre con 16 px de margen a cada lado (" + a.izq.toFixed(1) + " y " + (a.ancho - a.der).toFixed(1) + ")");
      ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
      await ctx.close();
    }
  }

  titulo("B: con el equipo configurado el resumen y el botón viven en la receta");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const r = await p.evaluate(() => ({
      tarjeta: document.querySelectorAll(".equipo").length, invitacion: document.querySelectorAll(".invitacion").length,
      resumenEnResumen: !!document.querySelector("#receta summary #resumenEquipo"),
      resumen: document.querySelector("#resumenEquipo") ? document.querySelector("#resumenEquipo").textContent.trim() : null,
      visible: document.querySelector("#resumenEquipo") ? document.querySelector("#resumenEquipo").getClientRects().length > 0 : false,
      nivel: document.querySelector("#receta summary .nivel-receta") ? document.querySelector("#receta summary .nivel-receta").textContent.trim() : null,
      botonEnReceta: !!document.querySelector("#receta #editarEquipo"), botonEnResumen: !!document.querySelector("#receta summary #editarEquipo"),
      acciones: document.querySelectorAll("[data-accion=equipo]").length,
      abierta: document.querySelector("#receta").open, alto: document.querySelector("#receta summary").getBoundingClientRect().height
    }));
    ok(r.tarjeta === 0 && r.invitacion === 0, "sin tarjeta de equipo ni invitación");
    ok(r.resumenEnResumen && r.visible, "#resumenEquipo está dentro del resumen de la receta y se ve");
    ok(r.resumen === "Con una cámara · Canon · Un teleobjetivo (200 mm o más) · A veces · Nivel medio", "dice el equipo: «" + r.resumen + "»");
    ok(r.nivel === "Explicada para nivel medio", "y debajo, para qué nivel está explicada (" + r.nivel + ")");
    ok(r.botonEnReceta && !r.botonEnResumen, "#editarEquipo está dentro de la receta, no del resumen (pulsar el resumen abre y cierra)");
    ok(r.acciones === 0, "con el equipo configurado no hay [data-accion=equipo]");
    ok(r.alto >= 44, "el resumen se pulsa bien (" + r.alto + " px)");
    ok(!r.abierta, "la receta empieza cerrada");

    await p.click("#receta summary");
    ok(await p.locator("#editarEquipo").isVisible(), "al abrirla se ve «Editar mi equipo»");
    const antes = await p.evaluate(() => { const b = document.querySelector("#editarEquipo").getBoundingClientRect(), p = document.querySelector("#receta ol").getBoundingClientRect(); return b.bottom <= p.top; });
    ok(antes, "y está antes de los pasos de la receta");
    await p.click("#editarEquipo");
    ok(await p.locator("#asistente").isVisible(), "pulsarlo abre el asistente");
    ok(/Pregunta 1 de 5/.test(await p.locator("#asistente .paso").innerText()), "en la primera pregunta: " + await p.locator("#asistente .paso").innerText());
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
