// La brújula de Atardecer y de Luna: una flecha con la dirección en palabras y en grados. En Luna, además, la altura (en grados y en
// puños) y a qué momento apunta: la luna de ahora, la de la mejor hora de la noche, la del anochecer o la de su salida. La brújula
// del móvil (un botón que la enciende; la flecha gira con el móvil) se prueba con lecturas del sensor simuladas: Android
// (`deviceorientationabsolute`), iPhone (`webkitCompassHeading` y permiso), permiso denegado, un ordenador que no da lecturas,
// que se deja de escuchar al apagarla, al esconder la página y al salir de la pantalla, y que se ve bien en todos los anchos.
//
// Ejecutar: node test/e2e/compilada/brujula.e2e.cjs   (antes: npm run build)
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


// ---- El sensor simulado ----
// Cuenta las escuchas de los eventos de orientación (para ver que no queda ninguna colgada) y deja elegir qué contesta el permiso del iPhone.
const SENSOR = () => {
  const lista = [];
  const es = (t) => t === "deviceorientation" || t === "deviceorientationabsolute";
  const alta = EventTarget.prototype.addEventListener, baja = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (t, f, ...r) { if (this === window && es(t) && !lista.some((x) => x[0] === t && x[1] === f)) lista.push([t, f]); return alta.call(this, t, f, ...r); };
  EventTarget.prototype.removeEventListener = function (t, f, ...r) { if (this === window && es(t)) { const i = lista.findIndex((x) => x[0] === t && x[1] === f); if (i >= 0) lista.splice(i, 1); } return baja.call(this, t, f, ...r); };
  window.__escuchas = () => lista.length;
  // Safari del iPhone: pide permiso con un toque y no tiene el rumbo absoluto. Chrome de Android: según la versión, no pide permiso
  // (sin la función) o lo pide y lo concede (`chrome: true`). El Chromium de las pruebas trae la función y contesta "denied": se sustituye.
  const pide = async () => { if (window.__permiso === "error") throw new Error("no"); return window.__permiso || "granted"; };
  if (window.__iphone) { DeviceOrientationEvent.requestPermission = pide; try { delete window.ondeviceorientationabsolute; delete Window.prototype.ondeviceorientationabsolute; } catch (e) {} }
  else if (window.__chrome) DeviceOrientationEvent.requestPermission = pide;
  else delete DeviceOrientationEvent.requestPermission;
};
const conSensor = async (p, { iphone = false, chrome = false, permiso = "granted" } = {}) => {
  await p.addInitScript(({ iphone, chrome, permiso }) => { window.__iphone = iphone; window.__chrome = chrome; window.__permiso = permiso; }, { iphone, chrome, permiso });
  await p.addInitScript(SENSOR);
};
// Una lectura: Android (rumbo de la cámara trasera con el móvil de pie: alpha = 360 − rumbo) o iPhone (webkitCompassHeading)
const android = (p, rumbo) => p.evaluate((r) => { const e = new Event("deviceorientationabsolute"); Object.assign(e, { absolute: true, alpha: (360 - r) % 360, beta: 90, gamma: 0 }); window.dispatchEvent(e); }, rumbo);
const iphone = (p, rumbo) => p.evaluate((r) => { const e = new Event("deviceorientation"); Object.assign(e, { webkitCompassHeading: r, alpha: 0, beta: 90, gamma: 0 }); window.dispatchEvent(e); }, rumbo);
const vacia = (p, tipo = "deviceorientationabsolute") => p.evaluate((t) => { const e = new Event(t); Object.assign(e, { absolute: true, alpha: null, beta: null, gamma: null }); window.dispatchEvent(e); }, tipo);
const escuchas = (p) => p.evaluate(() => window.__escuchas());
const viva = (p) => p.evaluate(() => {
  const b = document.querySelector("#panel .brujula-bloque"), boton = b && b.querySelector("#brujulaMovil"), svg = b && b.querySelector(".brujula svg");
  // El dial es el grupo que envuelve a otro (solo con la brújula del móvil encendida); sin ella, el único grupo es el de la flecha
  const fuera = svg && [...svg.children].find((c) => c.tagName === "g" && c.querySelector(":scope > g")), dentro = fuera && fuera.querySelector(":scope > g");
  const giro = (g) => { const m = g && /rotate\(([-\d.]+)\)/.exec(g.getAttribute("transform") || ""); return m ? Number(m[1]) : null; };
  return {
    boton: boton ? boton.textContent.trim() : null, botonAlto: boton ? boton.getBoundingClientRect().height : 0,
    lineas: b ? [...b.querySelectorAll(".brujula-viva p")].map((x) => x.textContent.replace(/\s+/g, " ").trim()) : [],
    ocultoAlLector: svg ? svg.getAttribute("aria-hidden") === "true" && !svg.hasAttribute("role") : null,
    etiqueta: svg ? svg.getAttribute("aria-label") : null, dial: giro(fuera), flecha: giro(dentro && dentro.getAttribute("transform") ? dentro : null),
    transicion: fuera ? getComputedStyle(fuera).transitionDuration : null
  };
});

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

  // Prepara una página de Luna a las 21:00 (la noche del 19 en curso) con el sensor simulado
  const luna21 = async (opciones, { ancho = 390, esquema = "light" } = {}) => {
    const { ctx, p } = await nuevaPagina(b, { fecha: A_LAS_21, viewport: { width: ancho, height: 900 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
    await conSensor(p, opciones);
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]"); await p.click("#dias button[data-i='0']");
    await p.waitForSelector("#panel .brujula-bloque");
    return { ctx, p };
  };

  titulo("F: Android: el botón enciende la brújula del móvil y la flecha gira con el móvil (Luna y Atardecer)");
  {
    const { ctx, p } = await luna21();
    let v = await viva(p);
    ok(v.boton === "Usar la brújula del móvil" && v.botonAlto >= 44, "el botón dice «" + v.boton + "» y se pulsa bien (" + v.botonAlto + " px)");
    ok(v.lineas.length === 0 && v.ocultoAlLector === false && v.dial === null, "apagada: sin textos vivos, el dibujo conserva su etiqueta y no gira");
    ok(await escuchas(p) === 0, "y no se escucha el sensor (" + await escuchas(p) + ")");
    const objetivo = direccion((await leer(p)).lineas[0]).grados;

    await p.click("#brujulaMovil");
    ok(/Buscando la brújula del móvil/.test((await viva(p)).lineas.join(" ")), "al pulsar, mientras llega la primera lectura: «" + (await viva(p)).lineas.join(" ") + "»");
    ok(await escuchas(p) === 1, "se escucha una vez (" + await escuchas(p) + ")");
    await android(p, 90);
    v = await viva(p);
    ok(v.lineas[0] === "Estás mirando al este (90°).", "con el móvil mirando al este: «" + v.lineas[0] + "»");
    ok(/ocho/.test(v.lineas[1] || "") || /ocho/.test(v.lineas[2] || ""), "y avisa de que el móvil puede desviarse: «" + v.lineas.slice(1).join(" ") + "»");
    ok(v.boton === "Dejar de usar la brújula del móvil", "el botón ofrece apagarla: «" + v.boton + "»");
    ok(v.ocultoAlLector === true && v.etiqueta === null, "el dibujo vivo se esconde al lector de pantalla (el texto lo dice todo)");
    ok(Math.abs(v.dial - -90) < 0.06 && Math.abs(v.flecha - objetivo) <= 0.5, "el dial gira −90° y la flecha queda en " + objetivo + "° (" + v.dial + " y " + v.flecha + ") → apunta a " + (objetivo - 90) + "° respecto al móvil");
    ok(v.transicion === "0s", "sin transición en el dial (así no da la vuelta entera al cruzar el norte): " + v.transicion);
    await android(p, 0);
    v = await viva(p);
    ok(v.lineas[0] === "Estás mirando al norte (0°)." && Math.abs(v.dial) < 0.06, "con el móvil al norte: «" + v.lineas[0] + "», dial " + v.dial);
    await android(p, 359); await android(p, 1);
    v = await viva(p);
    ok(v.lineas[0] === "Estás mirando al norte (1°)." && Math.abs(v.dial - -1) < 0.06, "de 359° a 1° el dial pasa a −1°, sin vuelta (" + v.dial + ")");
    await android(p, 1.4);
    ok((await viva(p)).lineas[0] === "Estás mirando al norte (1°).", "un cambio de menos de 1° no mueve nada");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await conSensor(p);
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=atardecer]");
    ok((await viva(p)).boton === "Usar la brújula del móvil", "Atardecer tiene el mismo botón");
    const objetivo = direccion((await leer(p)).lineas[0]).grados;
    await p.click("#brujulaMovil"); await android(p, objetivo);
    const v = await viva(p);
    ok(v.lineas[0] === "Estás mirando al " + puntoCardinal(objetivo).replace(/-/g, "\u2011") + " (" + objetivo + "°)." && Math.abs(v.dial - -objetivo) < 0.06 && Math.abs(v.flecha - objetivo) <= 0.5, "mirando hacia donde se pone el sol: «" + v.lineas[0] + "», dial " + v.dial + " y flecha " + v.flecha + " → la flecha queda hacia arriba");
    await ctx.close();
  }

  titulo("G: iPhone: pide permiso con el toque y usa webkitCompassHeading");
  {
    const { ctx, p } = await luna21({ iphone: true, permiso: "granted" });
    await p.click("#brujulaMovil");
    await iphone(p, 200);
    const v = await viva(p);
    ok(v.lineas[0] === "Estás mirando al " + puntoCardinal(200).replace(/-/g, "\u2011") + " (200°).", "con el permiso concedido: «" + v.lineas[0] + "»");
    ok(Math.abs(v.dial - -200) < 0.06, "el dial gira −200° (" + v.dial + ")");
    ok(await escuchas(p) === 1, "una sola escucha (" + await escuchas(p) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("G2: un Chrome reciente de Android pide permiso y da el rumbo absoluto: se escucha ese evento, no el del iPhone");
  {
    const { ctx, p } = await luna21({ chrome: true, permiso: "granted" });
    await p.click("#brujulaMovil");
    await android(p, 250);
    const v = await viva(p);
    ok(v.lineas[0] === "Estás mirando al " + puntoCardinal(250).replace(/-/g, "\u2011") + " (250°).", "con el permiso concedido: «" + v.lineas[0] + "»");
    ok(Math.abs(v.dial - -250) < 0.06 && await escuchas(p) === 1, "el dial gira −250° (" + v.dial + ") y hay una sola escucha");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("H: permiso denegado (o error al pedirlo): mensaje claro, sin escuchar, y se puede volver a intentar");
  for (const permiso of ["denied", "error"]) {
    const { ctx, p } = await luna21({ iphone: true, permiso });
    await p.click("#brujulaMovil");
    await p.waitForFunction(() => /Sin permiso/.test(document.querySelector("#panel .brujula-viva").textContent));
    const v = await viva(p);
    ok(v.lineas.join(" ") === "Sin permiso para la brújula. Puedes darlo en los ajustes del navegador.", "«" + v.lineas.join(" ") + "» (" + permiso + ")");
    ok(v.boton === "Usar la brújula del móvil" && await escuchas(p) === 0 && v.dial === null, "el botón vuelve a ofrecerla, no se escucha nada y el dibujo no gira");
    await p.evaluate(() => { window.__permiso = "granted"; });
    await p.click("#brujulaMovil"); await iphone(p, 90);
    ok((await viva(p)).lineas[0] === "Estás mirando al este (90°).", "y al volver a intentarlo con permiso funciona");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("I: un dispositivo sin brújula (un ordenador dispara una lectura vacía): a los 2 segundos lo dice y deja de escuchar");
  {
    const { ctx, p } = await luna21();
    await p.click("#brujulaMovil");
    await vacia(p);
    ok(/Buscando/.test((await viva(p)).lineas.join(" ")) && await escuchas(p) === 1, "una lectura vacía no cuenta: sigue buscando");
    await p.clock.runFor(2100);
    const v = await viva(p);
    ok(v.lineas.join(" ") === "Este dispositivo no da la brújula." && v.boton === "Usar la brújula del móvil" && await escuchas(p) === 0, "«" + v.lineas.join(" ") + "», sin escuchas (" + await escuchas(p) + ")");
    ok(v.dial === null && v.ocultoAlLector === false, "la flecha fija sigue como antes");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("J: encendida, aguanta cambiar de pestaña y de día; se apaga al esconder la página y al salir de la pantalla");
  {
    const { ctx, p } = await luna21();
    await p.click("#brujulaMovil"); await android(p, 120);
    ok((await viva(p)).lineas[0] === "Estás mirando al " + puntoCardinal(120).replace(/-/g, "\u2011") + " (120°)." && await escuchas(p) === 1, "encendida, una escucha");
    await p.click("#dias button[data-i='1']"); await p.waitForSelector("#panel .brujula-bloque");
    let v = await viva(p);
    ok(v.boton === "Dejar de usar la brújula del móvil" && v.lineas[0].startsWith("Estás mirando") && await escuchas(p) === 1, "al cambiar de noche sigue encendida y con una sola escucha (" + await escuchas(p) + ")");
    const objetivo = direccion((await leer(p)).lineas[0]).grados;
    ok(Math.abs(v.flecha - objetivo) <= 0.5 && Math.abs(v.dial - -120) < 0.06, "y la flecha apunta al objetivo de esa noche (" + v.flecha + " y " + objetivo + ")");
    await p.click("[data-tab=atardecer]"); await p.waitForSelector("#panel .brujula-bloque");
    v = await viva(p);
    ok(v.boton === "Dejar de usar la brújula del móvil" && await escuchas(p) === 1 && Math.abs(v.dial - -120) < 0.06, "al cambiar a Atardecer sigue encendida, con una escucha y el mismo rumbo");
    await p.click("[data-tab=luna]"); await p.waitForSelector("#panel .brujula-bloque");
    ok(await escuchas(p) === 1, "y al volver, igual (" + await escuchas(p) + ")");
    await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    v = await viva(p);
    ok(await escuchas(p) === 0 && v.boton === "Usar la brújula del móvil" && v.dial === null, "al esconder la página se apaga y no queda ninguna escucha");
    await p.evaluate(() => { delete document.visibilityState; document.dispatchEvent(new Event("visibilitychange")); });
    await p.click("#brujulaMovil"); await android(p, 45);
    ok(await escuchas(p) === 1 && (await viva(p)).lineas[0].startsWith("Estás mirando"), "al volver se enciende otra vez con el botón");
    await p.evaluate(() => { location.hash = "#/otra"; });
    await p.waitForSelector("text=No encuentro esa pantalla");
    ok(await escuchas(p) === 0, "al salir de la pantalla no queda ninguna escucha (" + await escuchas(p) + ")");
    await p.evaluate(() => { location.hash = "#/hoy"; });
    await p.waitForSelector("#panel .brujula-bloque");
    ok((await viva(p)).boton === "Usar la brújula del móvil" && await escuchas(p) === 0, "y al volver a Hoy está apagada");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("J2: cambiar de lugar la apaga (la previsión del lugar nuevo se pide de cero y el panel desaparece mientras tanto): sin escuchas colgadas ni errores");
  {
    const { ctx, p } = await luna21();
    await p.click("#brujulaMovil"); await android(p, 120);
    ok(await escuchas(p) === 1, "encendida, una escucha");
    await p.click("#cambiar"); await p.fill("#ciudad", "Vigo"); await p.press("#ciudad", "Enter");
    await p.click("#resultados button[data-i='0']");
    await p.waitForSelector("#panel .brujula-bloque");
    const v = await viva(p);
    ok(v.boton === "Usar la brújula del móvil" && v.dial === null && v.lineas.length === 0 && await escuchas(p) === 0, "con el lugar nuevo está apagada, con la flecha fija y sin escuchas (" + await escuchas(p) + ")");
    await p.click("#brujulaMovil"); await android(p, 300);
    ok((await viva(p)).lineas[0].startsWith("Estás mirando") && await escuchas(p) === 1, "y se puede volver a encender");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("K: «Dejar de usar…» la apaga y vuelve la flecha fija");
  {
    const { ctx, p } = await luna21();
    await p.click("#brujulaMovil"); await android(p, 200);
    await p.click("#brujulaMovil");
    const v = await viva(p);
    ok(v.boton === "Usar la brújula del móvil" && await escuchas(p) === 0 && v.lineas.length === 0, "apagada: sin escuchas ni textos vivos");
    ok(v.dial === null && v.ocultoAlLector === false && /Dirección: \d+ grados desde el norte/.test(v.etiqueta), "el dibujo vuelve a ser el fijo, con su etiqueta: «" + v.etiqueta + "»");
    await ctx.close();
  }

  titulo("L: medidas con la brújula del móvil encendida: 320, 360 y 390 px, claro y oscuro, letra normal y ancha");
  for (const esquema of ["light", "dark"]) {
    for (const [nombreLetra, css] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
      for (const ancho of [320, 360, 390]) {
        const { ctx, p } = await luna21({}, { ancho, esquema });
        if (css) await p.addStyleTag({ content: css });
        await p.click("#brujulaMovil"); await android(p, 200);
        const r = await p.evaluate(() => {
          const panel = document.querySelector("#panel").getBoundingClientRect(), bloque = document.querySelector("#panel .brujula-bloque").getBoundingClientRect();
          const filas = [...document.querySelectorAll("#panel .brujula-viva p, #panel .brujula-viva button")].map((x) => x.getBoundingClientRect());
          const fijas = document.querySelector("#panel .brujula").getBoundingClientRect(), botonAlto = document.querySelector("#brujulaMovil").getBoundingClientRect().height;
          return {
            pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, dentro: bloque.left >= panel.left - 0.5 && bloque.right <= panel.right + 0.5,
            dentroFilas: filas.every((x) => x.left >= bloque.left - 0.5 && x.right <= bloque.right + 0.5), separadas: filas.every((x, i) => i === 0 || x.top >= filas[i - 1].bottom - 0.5),
            debajo: filas.every((x) => x.top >= fijas.bottom - 0.5), botonAlto
          };
        });
        ok(r.pagina <= 0 && r.dentro && r.dentroFilas && r.separadas && r.debajo && r.botonAlto >= 44,
          esquema + ", " + nombreLetra + ", " + ancho + " px" + (r.pagina > 0 ? " (desborda " + r.pagina + ")" : "") + (r.dentro && r.dentroFilas ? "" : " (se sale de la tarjeta)") + (r.separadas ? "" : " (las filas se pisan)") + (r.debajo ? "" : " (pisa la brújula fija)") + (r.botonAlto >= 44 ? "" : " (el botón mide " + r.botonAlto + " px)"));
        ok(p.errores.length === 0, "  sin errores: " + p.errores.join(";"));
        await ctx.close();
      }
    }
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
