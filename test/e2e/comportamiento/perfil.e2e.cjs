// Comportamiento del perfil de equipo y las recetas. Desde el 2026-11-21 solo se ejecuta contra la versión compilada (Svelte):
// los niveles pasaron a llamarse Principiante / Medio / Experto y la receta solo se muestra con el equipo configurado,
// cambios pedidos a propósito que la web actual (prueba/hoy.html) no tiene.
// Ejecutar: node test/e2e/comportamiento/perfil.e2e.cjs
"use strict";
const { nuevaPagina: nuevo, ok, titulo, ejecutar } = require("../ayudas.cjs");

const txt = (p, sel) => p.locator(sel).innerText();

ejecutar("perfil", async ({ b, hoy }) => {
  titulo("A: primera visita -> bienvenida, cámara Nikon con tele, trípode a veces");
  let { ctx, p } = await nuevo(b);
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  ok(await p.locator("#asistente").isVisible(), "aparece el asistente");
  ok(/ajustar la app/.test(await txt(p, "#asistente h2")), "bienvenida: " + await txt(p, "#asistente h2"));
  ok(await txt(p, "#resumenEquipo") === "Sin configurar", "resumen: Sin configurar");
  await p.click("[data-asis=empezar]");
  ok(/Pregunta 1 de 3/.test(await txt(p, "#asistente .paso")), "con móvil por defecto son 3 preguntas");
  await p.click("[data-op=camara]");
  ok(/Pregunta 2 de 5/.test(await txt(p, "#asistente .paso")), "al elegir cámara pasan a ser 5: " + await txt(p, "#asistente .paso"));
  await p.click("[data-op=nikon]");
  await p.click("[data-op=tele]"); await p.click("[data-op=kit]");
  ok(await p.locator("[data-op=tele][aria-pressed=true]").count() === 1, "multi-selección marca tele");
  await p.click("[data-asis=siguiente]");
  await p.click("[data-op=aveces]");
  const niveles = (await p.locator("#asistente [data-op]").allInnerTexts()).map((s) => s.trim());
  ok(niveles.join("|") === "Principiante|Medio|Experto", "la pregunta del nivel ofrece Principiante, Medio y Experto: " + niveles.join("|"));
  await p.click("[data-op=defiendo]");
  ok(await p.locator("#asistente").isHidden(), "al terminar se cierra el asistente");
  const res = await txt(p, "#resumenEquipo");
  ok(res === "Con una cámara · Nikon · El de kit (18-55 o parecido), Un teleobjetivo (200 mm o más) · A veces · Nivel medio", "resumen: " + res);
  const guardado = await p.evaluate(() => JSON.parse(localStorage.getItem("luz-y-foto:perfil")));
  ok(guardado.equipo === "camara" && guardado.marca === "nikon" && guardado.nivel === "defiendo" && guardado.tripode === "aveces", "guardado: " + JSON.stringify(guardado));

  titulo("receta de atardecer (cámara, trípode «a veces»)");
  await p.click("[data-tab=atardecer]");
  await p.click("#receta summary");
  const rec = await txt(p, "#receta");
  ok(/Con cámara, sin trípode/.test(rec), "variante sin trípode");
  ok(/Explicada para nivel medio/.test(await txt(p, "#receta summary")), "la receta dice para qué nivel está explicada: " + (await txt(p, "#receta summary")).replace(/\n/g, " / "));
  ok(/modos a A:/.test(rec), "el modo usa el nombre de Nikon (A): " + rec.split("\n").find((l) => /rueda/.test(l)));
  ok(await p.locator("#receta [data-tripode]").count() === 2, "interruptor de trípode hoy visible (a veces)");
  await p.click("#receta [data-tripode=si]");
  ok(/Con cámara y trípode/.test(await txt(p, "#receta")), "con trípode hoy cambia la variante");
  ok(await p.locator("#receta").evaluate((e) => e.open), "la receta sigue abierta tras cambiar");
  await p.click("#receta button.termino >> nth=0");
  ok(await p.locator("#receta .def").count() === 1, "toca un término y sale su definición: " + (await txt(p, "#receta .def")).slice(0, 60));
  ok(/visor/.test(await txt(p, "#receta")) && /JPEG/.test(await txt(p, "#receta")), "avisos de visor y JPEG");
  await p.click("[data-tab=luna]");
  ok(await p.locator("#receta").count() === 1, "la pestaña Luna también tiene receta: " + (await txt(p, "#receta summary")));
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("B: segunda visita con perfil guardado -> sin bienvenida");
  ({ ctx, p } = await nuevo(b, { perfil: { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "si", nivel: "controlo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] } }));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  ok(await p.locator("#asistente").isHidden(), "no vuelve a aparecer el asistente");
  await p.click("[data-tab=luna]"); await p.click("#receta summary");
  const l = await txt(p, "#receta");
  ok(/teleobjetivo y trípode/.test(l) && /1\/250–1\/500/.test(l), "luna con tele y trípode, nivel experto");
  ok(/Explicada para nivel experto/.test(await txt(p, "#receta summary")), "la receta de un experto lo dice");
  ok(await p.locator("#receta [data-tripode]").count() === 0, "sin interruptor (trípode: sí)");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("C: saltar todo -> móvil por defecto, invitación a configurar, y editar después");
  ({ ctx, p } = await nuevo(b));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.click("[data-asis=saltar-todo]");
  ok(await p.locator("#asistente").isHidden(), "se cierra");
  ok(await p.evaluate(() => localStorage.getItem("luz-y-foto:perfil")) !== null, "queda guardado (no vuelve la bienvenida)");
  await p.click("[data-tab=atardecer]");
  ok(await p.locator("#receta").count() === 0, "sin el equipo configurado no hay receta");
  ok(/Cuéntame tu equipo/.test(await txt(p, "#panel")), "en su lugar, una invitación a configurarlo");
  await p.click("[data-accion=equipo]");
  ok(await p.locator("#asistente").isVisible(), "el enlace abre el asistente");
  ok(/Pregunta 1 de 3/.test(await txt(p, "#asistente .paso")), "empieza en la primera pregunta (sin bienvenida)");
  await p.click("[data-asis=saltar]"); await p.click("[data-asis=saltar]"); await p.click("[data-asis=saltar]");
  ok(await p.locator("#asistente").isHidden(), "saltando las 3 preguntas se cierra");
  ok(await p.locator("#receta").count() === 0, "saltando las preguntas sigue sin haber receta");
  await p.click("#editarEquipo");
  await p.click("[data-asis=saltar]"); await p.click("[data-asis=atras]");
  ok(/Pregunta 1 de 3/.test(await txt(p, "#asistente .paso")), "atrás vuelve a la anterior");
  await p.click("[data-op=movil]"); await p.click("[data-asis=saltar]"); await p.click("[data-asis=saltar]");
  ok(await p.locator("#asistente").isHidden(), "al contestar y terminar se cierra");
  await p.click("#receta summary");
  ok(/Con el móvil/.test(await txt(p, "#receta summary")) && /Explicada para nivel principiante/.test(await txt(p, "#receta summary")), "contestando una pregunta ya hay receta, con el nivel por defecto: " + (await txt(p, "#receta summary")).replace(/\n/g, " / "));
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();

  titulo("D: un perfil guardado roto o con valores raros no rompe la página");
  ({ ctx, p } = await nuevo(b, { perfil: { equipo: "dron", marca: 7, objetivos: "tele", nivel: null, respondidas: ["equipo"] } }));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.click("[data-tab=atardecer]"); await p.click("#receta summary");
  ok(/Con el móvil/.test(await txt(p, "#receta summary")), "usa los valores por defecto");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
  ({ ctx, p } = await nuevo(b, { perfil: { equipo: "dron", marca: 7, objetivos: "tele", nivel: null, respondidas: "x" } }));
  await p.goto(hoy); await p.waitForSelector(".veredicto");
  await p.click("[data-tab=atardecer]");
  ok(await p.locator("#receta").count() === 0 && await p.locator("[data-accion=equipo]").count() === 1, "si no consta ninguna respuesta, se trata como sin configurar");
  ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
  await ctx.close();
});
