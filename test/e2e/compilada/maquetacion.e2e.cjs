// Maquetación de la versión compilada: nada se sale de la pantalla ni de su tarjeta en móvil, los botones de día
// caben siempre en una fila (también con el nombre de día más largo y con el día elegido), y las barras de nubes
// se distinguen bien de su fondo, en modo claro y oscuro.
//
// Sustituye a la prueba de capturas frente a la web anterior (que sirvió para demostrar que la migración se veía
// igual, con un 0,014 % de píxeles distintos) en cuanto el responsive empezó a cambiar el aspecto a propósito.
//
// Ejecutar: node test/e2e/compilada/maquetacion.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: 42.2328, lon: -8.7226, nombre: "Vigo, Galicia", origen: "busqueda" };
const ANCHOS = [320, 360, 390, 480, 600, 800];
// Cada móvil usa su letra (Roboto, San Francisco…) y unas son más anchas que otras: se prueba con la del sistema
// y con DejaVu Sans, que es de las más anchas y la que usa por defecto el navegador de Actions. (Si no está
// instalada, el navegador usa otra y la prueba es menos exigente, pero no falla.)
const LETRAS = [["la del sistema", null], ["una letra ancha", "'DejaVu Sans', sans-serif"]];

ejecutar("maquetacion", async ({ b, base }) => {
  // Una página cargada con cada combinación; se miden la página y cada bloque del panel
  const casos = [];
  for (const genero of ["amanecer", "atardecer", "luna"]) for (const [nombreLetra, letra] of LETRAS) for (const esquema of ["light", "dark"]) for (const ancho of ANCHOS) casos.push({ genero, nombreLetra, letra, esquema, ancho });

  let anterior = "";
  for (const { genero, nombreLetra, letra, esquema, ancho } of casos) {
    const grupo = "«" + genero + "», con " + nombreLetra + ": nada se sale de la pantalla ni de la tarjeta";
    if (grupo !== anterior) { titulo(grupo); anterior = grupo; }
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 800 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    if (letra) await p.addStyleTag({ content: "* { font-family: " + letra + " !important; }" });
    await p.click("[data-tab=" + genero + "]");
    await p.click("#receta summary");
    await p.click("#reglas summary");
    const r = await p.evaluate(() => {
      const panel = document.querySelector("#panel").getBoundingClientRect();
      const fuera = [...document.querySelectorAll("#panel table, #panel .veredicto, #panel details, #panel .capas, #panel .avisos, #panel .luz-de-hoy, #panel .brujula, #panel .luna-cab")]
        .filter((e) => e.getBoundingClientRect().right > panel.right + 0.5).map((e) => e.className || e.tagName);
      return { pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, fuera };
    });
    ok(r.pagina <= 0 && r.fuera.length === 0, ancho + " px, " + esquema + (r.pagina > 0 ? " (la página desborda " + r.pagina + " px)" : "") + (r.fuera.length ? " (fuera de la tarjeta: " + r.fuera.join(", ") + ")" : ""));
    // Las pestañas: dentro de la pantalla, cómodas de pulsar (44 px) y montadas 27 px sobre el cielo de la cabecera
    const t = await p.evaluate(() => {
      const cab = document.querySelector("header.cabecera").getBoundingClientRect(), tabs = document.querySelector("#tabs").getBoundingClientRect();
      return { solape: cab.bottom - tabs.top, dentro: tabs.left >= 0 && tabs.right <= document.documentElement.clientWidth + 0.5, altos: [...document.querySelectorAll("#tabs button")].map((x) => x.getBoundingClientRect().height) };
    });
    ok(t.solape >= 26 && t.solape <= 28 && t.dentro && t.altos.length === 3 && t.altos.every((h) => h >= 44), "  pestañas: solapan " + t.solape.toFixed(1) + " px el cielo, dentro de la pantalla: " + t.dentro + ", altos " + t.altos.map((h) => h.toFixed(0)).join("/") + " px");
    // Las pestañas respiran: la palabra (con su ✓ si es la elegida) deja al menos 6 px de aire a cada lado dentro de su botón,
    // ningún botón se sale de la barra y entre la pastilla elegida y la palabra de al lado quedan al menos 10 px.
    const a = await p.evaluate(() => {
      const barra = document.querySelector("#tabs").getBoundingClientRect(), bs = [...document.querySelectorAll("#tabs button")];
      const dato = (x) => {
        const c = x.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(x); const t = rg.getBoundingClientRect();
        const antes = getComputedStyle(x, "::before");
        const marca = antes.content.includes("✓") ? parseFloat(antes.width) + parseFloat(antes.marginRight) : 0;
        return { izq: c.left, der: c.right, textoIzq: t.left - marca, textoDer: t.right, elegido: x.getAttribute("aria-selected") === "true" };
      };
      const d = bs.map(dato), i = d.findIndex((x) => x.elegido);
      return {
        aire: d.map((x) => Math.min(x.textoIzq - x.izq, x.der - x.textoDer)),
        vecinos: [d[i - 1] && d[i].izq - d[i - 1].textoDer, d[i + 1] && d[i + 1].textoIzq - d[i].der].filter((v) => typeof v === "number"),
        dentro: d.every((x) => x.izq >= barra.left - 0.5 && x.der <= barra.right + 0.5)
      };
    });
    ok(a.aire.every((x) => x >= 6) && a.vecinos.every((x) => x >= 10) && a.dentro, "  pestañas: aire dentro de cada botón " + a.aire.map((x) => x.toFixed(1)).join(" / ") + " px (mínimo 6), junto a la elegida " + a.vecinos.map((x) => x.toFixed(1)).join(" y ") + " px (mínimo 10)" + (a.dentro ? "" : ", un botón se sale de la barra"));
    // Los botones de día: una sola fila, con el nombre más largo posible («Miércoles») en el último y ese día elegido
    // (con la ✓ y la negrita, que ensanchan), y sin que nada se salga de su botón. El símbolo lleva el color de su nivel.
    const d = await p.evaluate(async () => {
      const botones = [...document.querySelectorAll("#dias button")];
      const ultimo = botones[botones.length - 1];
      ultimo.click(); await new Promise((r) => setTimeout(r, 60));
      ultimo.querySelector(".etq").textContent = "Miércoles";
      const num = ultimo.querySelector(".num"); if (num) num.textContent = "28";
      const fila = document.querySelector("#dias").getBoundingClientRect();
      const cajas = botones.map((x) => x.getBoundingClientRect());
      const dentro = (hijo, padre) => hijo.left >= padre.left - 0.5 && hijo.right <= padre.right + 0.5;
      const colores = botones.map((x) => {
        const m = x.querySelector(".marca"), sonda = document.createElement("i");
        const variable = { verde: "--verde", ambar: "--ambar-simbolo", rojo: "--rojo", ninguno: "--gris" }[x.dataset.nivel];
        sonda.style.color = "var(" + variable + ")"; document.body.appendChild(sonda);
        const esperado = getComputedStyle(sonda).color; sonda.remove();
        return { nivel: x.dataset.nivel, simbolo: m.textContent.replace("✓", "").trim(), color: getComputedStyle(m).color, esperado };
      });
      return {
        cuantos: botones.length,
        unaFila: Math.max(...cajas.map((c) => c.top)) - Math.min(...cajas.map((c) => c.top)) <= 1,
        dentroDeLaFila: cajas.every((c) => dentro(c, fila)),
        numerosDentro: botones.every((x, i) => { const n = x.querySelector(".num"); return !!n && dentro(n.getBoundingClientRect(), cajas[i]) && dentro(x.querySelector(".marca").getBoundingClientRect(), cajas[i]); }),
        numerosEnFila: botones.every((x) => { const n = x.querySelector(".num"); return !!n && Math.abs(n.getBoundingClientRect().top - x.querySelector(".marca").getBoundingClientRect().top) <= 4; }),
        textoDentro: botones.every((x, i) => dentro(x.querySelector(".etq").getBoundingClientRect(), cajas[i]) && x.scrollWidth <= x.clientWidth + 1),
        colores
      };
    });
    ok(d.cuantos >= 2 && d.unaFila && d.dentroDeLaFila && d.textoDentro, "  días: " + d.cuantos + " botones en una fila, con «Miércoles» elegido" + (d.unaFila ? "" : " (no caben en una fila)") + (d.dentroDeLaFila ? "" : " (se salen de la fila)") + (d.textoDentro ? "" : " (el nombre se sale del botón)"));
    ok(d.numerosDentro && d.numerosEnFila, "  días: el número del día («28» en el último) cabe en su botón y va en la fila del símbolo" + (d.numerosDentro ? "" : " (se sale del botón)") + (d.numerosEnFila ? "" : " (no está en la fila del símbolo)"));
    ok(d.colores.every((c) => c.color === c.esperado && ["●", "▲", "■", "○"].includes(c.simbolo)), "  días: cada símbolo lleva el color de su nivel (" + d.colores.map((c) => c.nivel + " " + c.simbolo).join(", ") + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("las barras de nubes resaltan sobre su fondo (contraste mínimo 4,5:1; la accesibilidad pide 3:1 para gráficos)");
  for (const esquema of ["light", "dark"]) {
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 390, height: 800 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const contrastes = await p.evaluate(() => {
      const variable = (n) => {
        const sonda = document.createElement("i"); sonda.style.color = "var(" + n + ")"; document.body.appendChild(sonda);
        const [r, g, b] = getComputedStyle(sonda).color.match(/[\d.]+/g).map(Number); sonda.remove();
        return [r, g, b];
      };
      const luminancia = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const contraste = (a, c) => { const [x, y] = [luminancia(a), luminancia(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      return ["--barra-baja", "--barra-media", "--barra-alta"].map((n) => [n, contraste(variable(n), variable("--fondo")), contraste(variable(n), variable("--tarjeta"))]);
    });
    for (const [nombre, sobreFondo, sobreTarjeta] of contrastes) {
      ok(sobreFondo >= 4.5 && sobreTarjeta >= 4.5, esquema + " " + nombre + ": " + sobreFondo.toFixed(2) + " sobre el fondo de la barra, " + sobreTarjeta.toFixed(2) + " sobre la tarjeta");
    }
    await ctx.close();
  }

  titulo("las barras llevan el color también como texto (se ven aunque el navegador oscurezca los fondos por su cuenta) y el texto cubre toda la barra");
  for (const [nombreLetra, letra] of LETRAS) {
    const { ctx, p } = await nuevaPagina(b, { viewport: { width: 1200, height: 800 }, perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    if (letra) await p.addStyleTag({ content: "* { font-family: " + letra + " !important; }" });
    await p.click("[data-tab=atardecer]");
    const r = await p.evaluate(() => [...document.querySelectorAll(".capas .barra span")].map((relleno) => {
      relleno.style.width = "100%"; // la barra más larga posible
      const caja = document.createRange(); caja.selectNodeContents(relleno);
      const e = getComputedStyle(relleno);
      return { mismoColor: e.color === e.backgroundColor, texto: caja.getBoundingClientRect().width, barra: relleno.clientWidth };
    }));
    ok(r.length === 3 && r.every((x) => x.mismoColor), nombreLetra + ": las 3 barras tienen el mismo color de texto y de fondo");
    ok(r.every((x) => x.texto >= x.barra), nombreLetra + ": el texto cubre la barra entera (" + r.map((x) => Math.round(x.texto) + "/" + x.barra).join(", ") + " px)");
    await ctx.close();
  }

  titulo("el navegador sabe que la web tiene tema claro y oscuro (así no la oscurece por su cuenta)");
  {
    const { ctx, p } = await nuevaPagina(b, { permisos: false });
    await p.goto(base);
    const meta = await p.evaluate(() => (document.querySelector("meta[name=color-scheme]") || {}).content);
    const css = await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    ok(/light/.test(meta || "") && /dark/.test(meta || ""), "<meta color-scheme>: " + meta);
    ok(/light/.test(css) && /dark/.test(css), "color-scheme en el CSS: " + css);
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/" });
