// El simulador de exposición de Aprender: se mueven los tres deslizadores y la luz de la escena y la lectura dice lo que toca (bien expuesta, oscura,
// quemada, cuántos pasos), con el teclado y con el dedo, sin salirse de la pantalla en 320, 360 y 390 px, en claro y oscuro, y en inglés.
//
// Ejecutar: node test/e2e/compilada/simulador.e2e.cjs   (antes: npm run build)
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
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";
const URL = "#/aprender/simulador-de-exposicion";

const lectura = (p) => p.evaluate(() => ({
  resultado: document.querySelector(".sim-frase").textContent.trim(),
  signo: document.querySelector(".sim-signo").textContent.trim(),
  clase: document.querySelector(".sim-lectura").className,
  efectos: [...document.querySelectorAll(".sim-efectos li")].map((li) => li.textContent.trim()),
  valores: [...document.querySelectorAll(".sim-ajuste output")].map((o) => o.textContent.trim())
}));
// Mueve un deslizador a un valor, como si se arrastrara: cambia su valor y avisa con el evento `input`
const poner = (p, id, v) => p.evaluate(([id, v]) => {
  const e = document.querySelector("input[id$='-" + id + "']");
  e.value = String(v); e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, v]);
const luz = (p, k) => p.check(".sim-opcion input[value=" + k + "]");
const sinDesborde = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

ejecutar("simulador", async ({ b, base }) => {
  titulo("A: al empezar, la exposición es la justa (sol, f/8, 1/500 s, ISO 100)");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + URL); await p.waitForSelector(".simulador");
    const l = await lectura(p);
    ok(l.resultado === "Bien expuesta." && l.signo === "✓" && /sim-bien/.test(l.clase), "empieza bien expuesta (" + JSON.stringify(l) + ")");
    ok(l.valores.join("|") === "f/8|1/500 s|ISO 100", "los tres valores de partida (" + l.valores + ")");
    ok(l.efectos.join("|") === "Todo nítido, fondo incluido.|Movimiento congelado.|Foto limpia.", "lo que pasa con esos ajustes (" + l.efectos + ")");
    ok(await p.locator(".sim-reiniciar").isDisabled(), "con los ajustes de partida, «Volver al inicio» no hace falta");
    const radios = await p.evaluate(() => [...document.querySelectorAll(".sim-opcion input")].map((i) => i.value + ":" + i.checked));
    ok(radios.join() === "sol:true,nublado:false,interior:false", "la luz de partida es el sol (" + radios + ")");
    const accesibles = await p.evaluate(() => ({
      escena: document.querySelector(".sim-escena").getAttribute("role") + ":" + document.querySelector(".sim-escena").getAttribute("aria-label").length,
      viva: document.querySelector(".sim-resultado").getAttribute("aria-live"),
      textos: [...document.querySelectorAll("input[type=range]")].map((i) => i.getAttribute("aria-valuetext") + "/" + document.querySelector("label[for='" + i.id + "']").textContent.trim())
    }));
    ok(/^img:\d{3,}$/.test(accesibles.escena), "la escena es una imagen con su texto alternativo (" + accesibles.escena + ")");
    ok(accesibles.viva === "polite", "la lectura se anuncia sin interrumpir");
    ok(accesibles.textos.join("|") === "f/8/Apertura|1/500 s/Tiempo|ISO 100/ISO", "cada deslizador dice su valor y tiene su etiqueta (" + accesibles.textos + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: cada ajuste mueve los pasos de luz y lo que se ve");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + URL); await p.waitForSelector(".simulador");
    await poner(p, "apertura", 0);
    let l = await lectura(p);
    ok(l.resultado === "Sale quemada: te sobran 4 pasos de luz." && l.signo === "+4" && /sim-muyClara/.test(l.clase), "f/2 al sol: quemada, +4 (" + l.resultado + ")");
    ok(l.efectos[0] === "Fondo muy desenfocado." && l.valores[0] === "f/2", "con f/2 el fondo sale muy desenfocado (" + l.efectos[0] + ")");
    await poner(p, "apertura", 3);
    l = await lectura(p);
    ok(l.resultado === "Sale clara: te sobra 1 paso de luz." && l.signo === "+1" && /sim-clara/.test(l.clase), "f/5.6: un paso de más (" + l.resultado + ")");
    ok(l.valores[0] === "f/5,6", "el decimal va con coma en español (" + l.valores[0] + ")");
    await poner(p, "apertura", 5);
    l = await lectura(p);
    ok(l.resultado === "Sale oscura: te falta 1 paso de luz." && l.signo === "−1" && /sim-oscura/.test(l.clase), "f/11: un paso de menos (" + l.resultado + ")");
    await poner(p, "iso", 1);
    l = await lectura(p);
    ok(l.resultado === "Bien expuesta." && l.valores[2] === "ISO 200", "ISO 200 lo compensa: otra vez bien expuesta (" + l.resultado + ")");
    await poner(p, "tiempo", 6); await poner(p, "iso", 6);
    l = await lectura(p);
    ok(l.efectos[1] === "Mucha estela: lo que se mueve sale movido." && l.efectos[2] === "Mucho grano.", "1/15 s e ISO 6400: estela y grano (" + l.efectos + ")");
    ok(await p.locator(".sim-reiniciar").isEnabled(), "tras mover algo, «Volver al inicio» se puede pulsar");
    await p.click(".sim-reiniciar");
    l = await lectura(p);
    ok(l.resultado === "Bien expuesta." && l.valores.join("|") === "f/8|1/500 s|ISO 100", "«Volver al inicio» deja los ajustes de partida (" + l.valores + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("C: la luz de la escena cambia lo que hace falta, y el reto de «Interior» tiene su solución");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + URL); await p.waitForSelector(".simulador");
    await luz(p, "nublado");
    let l = await lectura(p);
    ok(l.resultado === "Sale muy oscura: te faltan 2 pasos de luz." && l.signo === "−2", "nublado con los ajustes de partida: dos pasos menos que el sol (" + l.resultado + ")");
    await luz(p, "interior");
    l = await lectura(p);
    ok(l.resultado === "Sale muy oscura: te faltan 9 pasos de luz." && l.signo === "−9" && /sim-muyOscura/.test(l.clase), "interior con los ajustes de partida: muy oscura (" + l.resultado + ")");
    await poner(p, "apertura", 0); await poner(p, "tiempo", 2); await poner(p, "iso", 4);
    l = await lectura(p);
    ok(l.resultado === "Bien expuesta." && l.efectos[1] === "Movimiento congelado." && l.valores.join("|") === "f/2|1/250 s|ISO 1600", "el reto: f/2, 1/250 s e ISO 1600 (" + l.valores + " → " + l.resultado + ")");
    ok(l.efectos[0] === "Fondo muy desenfocado." && l.efectos[2] === "Algo de grano.", "lo que se paga: fondo y algo de grano (" + l.efectos + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("D: con el teclado (las flechas mueven un paso) y con el dedo");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + URL); await p.waitForSelector(".simulador");
    await p.focus("input[id$='-apertura']");
    await p.keyboard.press("ArrowLeft");
    let l = await lectura(p);
    ok(l.valores[0] === "f/5,6" && l.signo === "+1", "← abre la apertura un paso (" + l.valores[0] + ", " + l.signo + ")");
    await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight");
    l = await lectura(p);
    ok(l.valores[0] === "f/11" && l.signo === "−1", "→ dos veces la cierra dos pasos (" + l.valores[0] + ", " + l.signo + ")");
    await p.focus("input[id$='-iso']");
    await p.keyboard.press("End");
    l = await lectura(p);
    ok(l.valores[2] === "ISO 6400", "Fin lleva el ISO al máximo (" + l.valores[2] + ")");
    // Las luces se eligen con las flechas (grupo de opciones) y se ve cuál está elegida
    await p.focus(".sim-opcion input[value=sol]");
    await p.keyboard.press("ArrowRight");
    const elegida = await p.evaluate(() => document.querySelector(".sim-opcion input:checked").value);
    ok(elegida === "nublado", "la flecha pasa de «Sol» a «Nublado» (" + elegida + ")");
    // Cada control mide al menos 44 px de alto (se toca con el dedo)
    const medidas = await p.evaluate(() => [...document.querySelectorAll(".sim-opcion span, .sim-ajuste input, .sim-reiniciar")].map((e) => Math.round(e.getBoundingClientRect().height)));
    ok(medidas.every((m) => m >= 44), "los controles miden 44 px o más de alto (" + medidas + ")");
    await ctx.close();
  }

  titulo("E: cabe en 320, 360 y 390 px, en claro y oscuro y con letra ancha, en todos los estados");
  for (const ancho of [320, 360, 390]) {
    for (const esquema of ["light", "dark"]) {
      const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, viewport: { width: ancho, height: 800 }, colorScheme: esquema });
      await p.goto(base + URL); await p.waitForSelector(".simulador");
      await p.addStyleTag({ content: LETRA_ANCHA });
      const estados = [["sol", 4, 1, 0], ["interior", 0, 6, 6], ["nublado", 6, 0, 3]];
      for (const [lz, a, t, i] of estados) {
        await luz(p, lz); await poner(p, "apertura", a); await poner(p, "tiempo", t); await poner(p, "iso", i);
        const r = await p.evaluate(() => {
          const caja = document.querySelector(".bloque-simulador").getBoundingClientRect();
          const fuera = [...document.querySelectorAll(".simulador *")].filter((e) => { const c = e.getBoundingClientRect(); return c.width > 0 && (c.right > innerWidth + 0.5 || c.left < -0.5); }).map((e) => e.className || e.tagName);
          return { ancho: Math.round(caja.width), fuera };
        });
        ok(await sinDesborde(p) && r.fuera.length === 0, ancho + " px " + esquema + " " + lz + ": no se sale de la pantalla (" + JSON.stringify(r) + ")");
      }
      // El texto de la lectura se ve con contraste suficiente (4.5:1) sobre su fondo en los dos temas
      const contraste = await p.evaluate(() => {
        const lum = (rgb) => { const [r, g, bl] = rgb.match(/[\d.]+/g).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
        const medir = (el, fondo) => { const a = lum(getComputedStyle(el).color), c = lum(getComputedStyle(fondo).backgroundColor); const [x, y] = a > c ? [a, c] : [c, a]; return (x + 0.05) / (y + 0.05); };
        const caja = document.querySelector(".sim-lectura");
        return { frase: medir(document.querySelector(".sim-frase"), caja), signo: medir(document.querySelector(".sim-signo"), document.querySelector(".sim-signo")) };
      });
      ok(contraste.frase >= 4.5, ancho + " px " + esquema + ": la frase se lee con contraste (" + contraste.frase.toFixed(1) + ")");
      ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
      await ctx.close();
    }
  }

  titulo("F: con el modo oscuro forzado del navegador la escena y la lectura siguen viéndose");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, colorScheme: "dark" });
    await p.goto(base + URL); await p.waitForSelector(".simulador");
    const caja = await p.evaluate(() => { const c = document.querySelector(".sim-escena svg").getBoundingClientRect(); return [Math.round(c.width), Math.round(c.height)]; });
    ok(caja[0] > 200 && caja[1] > 100, "la escena tiene tamaño (" + caja + ")");
    await ctx.close();
  }

  titulo("G: en inglés, los textos, los decimales y las etiquetas van en inglés");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, locale: "en-US" });
    await p.goto(base + URL); await p.waitForSelector(".simulador");
    let l = await lectura(p);
    ok(l.resultado === "Well exposed." && l.valores.join("|") === "f/8|1/500 s|ISO 100", "empieza «Well exposed.» (" + l.resultado + ")");
    await poner(p, "apertura", 3);
    l = await lectura(p);
    ok(l.valores[0] === "f/5.6" && l.resultado === "Comes out bright: you have 1 stop of light too many.", "f/5.6 con punto y frase en inglés (" + l.valores[0] + ", " + l.resultado + ")");
    await luz(p, "interior");
    l = await lectura(p);
    ok(/^Comes out very dark: you are missing \d+ stops of light\.$/.test(l.resultado), "interior: «very dark» (" + l.resultado + ")");
    const etiquetas = await p.evaluate(() => [...document.querySelectorAll(".sim-luz legend, .sim-luz span, .sim-ajuste label, .sim-reiniciar")].map((e) => e.textContent.trim()));
    ok(etiquetas.join("|") === "Light of the scene|Sun|Cloudy|Indoors|Aperture|Shutter speed|ISO|Back to the start", "etiquetas en inglés (" + etiquetas + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }
});
