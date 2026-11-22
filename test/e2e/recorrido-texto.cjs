/*
 * Recorre la app en un idioma y devuelve el texto visible de cada pantalla: { nombre: texto }.
 * Lo usan la línea base del español (linea-base-texto.cjs y compilada/texto-es.e2e.cjs) y la prueba del inglés.
 *
 * Las partes que cambian de una compilación a otra (el nombre con hash del archivo de la app, el nombre de la caché) se sustituyen
 * por un marcador, y el selector de idioma se deja fuera: la línea base mide los textos que ya existían.
 */
"use strict";
const { nuevaPagina } = require("./ayudas.cjs");

const MOVIL = { equipo: "movil", marca: "desconocida", objetivos: [], tripode: "no", nivel: "empiezo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const CAMARA = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };

// Las barras y la franja son hileras de «█» (una por línea o seguidas): se dejan en un solo «█»
const normalizar = (t) => t.replace(/index-[\w-]+\.js/g, "index-HASH.js").replace(/luz-y-foto-[\w.-]+/g, "luz-y-foto-CACHE").replace(/(?:█\s*)+/g, "█\n");

async function texto(p) {
  await p.waitForTimeout(250);
  return normalizar(await p.evaluate(() => {
    const el = document.querySelector(".selector-idioma"), antes = el ? el.style.display : "";
    if (el) el.style.display = "none";
    const t = document.body.innerText;
    if (el) el.style.display = antes;
    return t;
  }));
}

async function recorrer({ b, base, locale = "es-ES", viewport }) {
  const salida = {};
  const ab = async (opciones) => {
    const { ctx, p } = await nuevaPagina(b, Object.assign({ locale, viewport }, opciones));
    return { ctx, p };
  };

  // Hoy: cada pestaña con cada perfil, con receta, «Cómo se calcula» e instalador abiertos, y un segundo día
  for (const [nombrePerfil, perfil] of [["movil", MOVIL], ["camara", CAMARA]]) {
    const { ctx, p } = await ab({ perfil, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    for (const g of ["amanecer", "atardecer", "luna"]) {
      await p.click("[data-tab=" + g + "]");
      for (const s of ["#receta summary", "#reglas summary", "#instalar summary"]) if (await p.locator(s).count()) { const d = p.locator(s.replace(" summary", "")); if (!(await d.getAttribute("open") !== null)) await p.click(s); }
      await p.waitForTimeout(400);
      salida["hoy/" + nombrePerfil + "/" + g] = await texto(p);
      if (await p.locator("#dias button[data-i='1']").count()) { await p.click("#dias button[data-i='1']"); salida["hoy/" + nombrePerfil + "/" + g + "/dia2"] = await texto(p); }
      const termino = p.locator("#receta .termino").first();
      if (await termino.count()) { await termino.click(); salida["hoy/" + nombrePerfil + "/" + g + "/termino"] = await texto(p); }
    }
    await ctx.close();
  }

  // Asistente: bienvenida y cada pregunta (se elige la primera opción de cada una)
  {
    const { ctx, p } = await ab({ lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector("#asistente:not([hidden])");
    salida["asistente/bienvenida"] = await texto(p);
    await p.click("[data-asis=empezar]");
    for (let i = 0; i < 10; i++) {
      if (await p.locator("#asistente[hidden]").count()) break;
      salida["asistente/pregunta" + (i + 1)] = await texto(p);
      const multiple = await p.locator("[data-asis=siguiente]").count();
      await p.click(i === 0 ? "[data-op=camara]" : "[data-op]"); // la primera pregunta se contesta «con una cámara», que abre todas las demás
      if (multiple) await p.click("[data-asis=siguiente]");
    }
    await ctx.close();
  }

  // Selector de lugar con sugerencias
  {
    const { ctx, p } = await ab({ perfil: MOVIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("#cambiar"); await p.waitForSelector("#selector:not([hidden])");
    salida["selector/abierto"] = await texto(p);
    await p.fill("#ciudad", "Vigo"); await p.keyboard.press("Enter"); await p.waitForSelector("#resultados li");
    salida["selector/resultados"] = await texto(p);
    await p.fill("#ciudad", "Qwerty"); await p.keyboard.press("Enter"); await p.waitForFunction(() => document.querySelector("#resultados li") === null);
    salida["selector/sin-resultados"] = await texto(p);
    await ctx.close();
  }

  // Sin conexión, con la previsión guardada
  {
    const { ctx, p } = await ab({ perfil: MOVIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.route("**/api.open-meteo.com/**", (r) => r.abort());
    await p.reload(); await p.waitForSelector("[data-testid=aviso-sin-conexion]");
    salida["sin-conexion"] = await texto(p);
    await ctx.close();
  }

  // Aprender y cada lección (con su primer término del glosario abierto)
  {
    const { ctx, p } = await ab({ perfil: MOVIL, lugar: LUGAR });
    await p.goto(base + "#/aprender"); await p.waitForSelector("ol.lecciones a");
    salida["aprender"] = await texto(p);
    const ids = await p.$$eval("ol.lecciones a", (as) => as.map((a) => a.getAttribute("href").replace("#/aprender/", "")));
    for (const id of ids) {
      await p.goto(base + "#/aprender/" + id); await p.waitForSelector(".bloque-parrafo, .bloque-lista");
      salida["leccion/" + id] = await texto(p);
      const t = p.locator(".termino").first();
      if (await t.count()) { await t.click(); salida["leccion/" + id + "/termino"] = await texto(p); }
    }
    await ctx.close();
  }
  return salida;
}

module.exports = { recorrer, MOVIL, CAMARA, LUGAR };
