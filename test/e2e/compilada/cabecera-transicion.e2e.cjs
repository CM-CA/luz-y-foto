// Cuando cambia el momento del día (la pestaña) o el semáforo del día elegido, el cielo de la cabecera no salta: el anterior (con su
// luna) se queda encima y se funde, ~0,9 s, descubriendo el nuevo. El título y el lugar quedan siempre por encima. Quien pide menos
// movimiento (prefers-reduced-motion) ve el cambio al instante. Si no cambia el cielo, no hay animación.
//
// Ejecutar: node test/e2e/compilada/cabecera-transicion.e2e.cjs   (antes: npm run build)
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

const escena = (p) => p.evaluate(() => {
  const h = document.querySelector("header.cabecera"), ant = h.querySelector(".escena-anterior"), cielo = h.querySelector("img.cielo");
  const z = (e) => parseInt(getComputedStyle(e).zIndex, 10) || 0;
  return {
    cielo: h.dataset.cielo, src: cielo.getAttribute("src"), lunas: h.querySelectorAll(":scope > .luna-cielo").length,
    anterior: ant ? { cielo: ant.dataset.cielo, src: ant.querySelector("img.fondo").getAttribute("src"), luna: !!ant.querySelector(".luna-anterior"), opacidad: Number(getComputedStyle(ant).opacity), z: z(ant) } : null,
    zFila: z(h.querySelector(".fila")), zCielo: z(cielo)
  };
});

ejecutar("cabecera-transicion", async ({ b, base }) => {
  titulo("de Atardecer a Noche: el cielo de tarde se funde y la luna aparece al descubrirse la noche");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    const antes = await escena(p);
    ok(antes.anterior === null, "en reposo no hay cielo anterior encima");
    await p.click("[data-tab=luna]");
    const a = await escena(p);
    ok(a.cielo.startsWith("noche"), "el cielo nuevo es el de noche: " + a.cielo);
    ok(a.anterior !== null && a.anterior.cielo === antes.cielo && a.anterior.src === antes.src, "el cielo de antes («" + antes.cielo + "») se queda encima mientras dura el cambio");
    ok(a.src !== antes.src, "y debajo ya está la imagen del cielo nuevo");
    ok(a.anterior && a.anterior.z > a.zCielo && a.zFila > a.anterior.z, "el cielo anterior está por encima del nuevo y por debajo del título y del lugar (z " + (a.anterior && a.anterior.z) + ", cielo " + a.zCielo + ", título " + a.zFila + ")");
    ok(a.lunas === 1, "la luna de la noche ya está en su sitio, tapada por el cielo que se va (" + a.lunas + ")");
    await p.waitForTimeout(450);
    const m = await escena(p);
    ok(m.anterior !== null && m.anterior.opacidad > 0 && m.anterior.opacidad < 1, "a mitad del cambio el cielo anterior es medio transparente (opacidad " + (m.anterior && m.anterior.opacidad.toFixed(2)) + ")");
    await p.waitForSelector(".escena-anterior", { state: "detached", timeout: 4000 });
    ok(true, "al acabar, el cielo anterior desaparece del todo");
    const fin = await escena(p);
    ok(fin.anterior === null && fin.src === a.src, "y queda solo el cielo nuevo");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));

    await p.click("[data-tab=luna]");
    ok((await escena(p)).anterior === null, "volver a pulsar la misma pestaña no anima nada");

    await p.click("[data-tab=atardecer]");
    const v = await escena(p);
    ok(v.anterior && v.anterior.luna && v.lunas === 0, "de Noche a Atardecer la luna se va con el cielo de noche (en el anterior: " + (v.anterior && v.anterior.luna) + ", en el nuevo: " + v.lunas + ")");
    await ctx.close();
  }

  titulo("cambiar de día sin cambiar de cielo no anima; cambiarlo de verde a rojo (cubierto) sí");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    await p.waitForSelector(".escena-anterior", { state: "detached", timeout: 4000 }).catch(() => {});
    const niveles = await p.$$eval("#dias button", (bs) => bs.map((x) => x.dataset.nivel));
    const i = niveles.findIndex((n, k) => k > 0 && (n === "rojo") !== (niveles[0] === "rojo"));
    ok(i > 0, "hay un día con semáforo distinto en cuanto a cubierto (" + niveles.join(", ") + ")");
    if (i > 0) {
      await p.click("#dias button[data-i='" + i + "']");
      ok((await escena(p)).anterior !== null, "al pasar a un día cubierto (rojo) el cielo se funde");
      await p.waitForSelector(".escena-anterior", { state: "detached", timeout: 4000 });
      await p.click("#dias button[data-i='" + i + "']");
      ok((await escena(p)).anterior === null, "pulsar el mismo día otra vez no anima");
    }
    await ctx.close();
  }

  titulo("quien pide menos movimiento ve el cambio al instante");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, reducedMotion: "reduce" });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    const antes = await escena(p);
    await p.click("[data-tab=luna]");
    const a = await escena(p);
    ok(a.anterior === null && a.src !== antes.src && a.cielo.startsWith("noche"), "el cielo cambia sin cielo anterior encima");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
