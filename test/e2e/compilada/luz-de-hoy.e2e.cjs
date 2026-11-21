// «La luz de hoy»: una franja de 48 bloques de texto «█» (del oro de la hora dorada al azul de la hora azul, con la puesta
// en el cambio de color), las tres horas debajo y, solo si el día es hoy y estamos dentro de la franja, un marcador «●».
// Como las barras de nubes, la información va en el color del texto y no en un fondo (hay navegadores de móvil que
// oscurecen los fondos por su cuenta). Debajo, la brújula con la dirección del sol.
//
// Ejecutar: node test/e2e/compilada/luz-de-hoy.e2e.cjs   (antes: npm run build -- --base=/luz-y-foto/beta/)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, VIGO, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build -- --base=/luz-y-foto/beta/");
  process.exit(1);
}

const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LUGAR = { lat: VIGO.latitude, lon: VIGO.longitude, nombre: "Vigo, Galicia", origen: "busqueda" };
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";

// Lo que se ve de la sección en el día elegido
const leerSeccion = (p) => p.evaluate(() => {
  const s = document.querySelector(".luz-de-hoy");
  if (!s) return null;
  const bloques = [...s.querySelectorAll(".franja span")];
  return {
    titulo: s.querySelector("h3").textContent.trim(),
    bloques: bloques.length,
    textos: [...new Set(bloques.map((x) => x.textContent))],
    colores: bloques.map((x) => getComputedStyle(x).color),
    fondos: [...new Set(bloques.map((x) => getComputedStyle(x).backgroundColor))],
    huecos: bloques.filter((x) => { const r = document.createRange(); r.selectNodeContents(x); return r.getBoundingClientRect().width < x.clientWidth - 0.01; }).length,
    horas: [...s.querySelectorAll(".horas div")].map((d) => ({ hora: d.querySelector("b").textContent.trim(), etiqueta: d.textContent.replace(d.querySelector("b").textContent, "").trim() })),
    ahora: [...s.querySelectorAll(".ahora")].map((x) => ({ texto: x.textContent.trim(), izquierda: x.style.left, centro: x.getBoundingClientRect().left + x.getBoundingClientRect().width / 2 })),
    franja: (() => { const r = s.querySelector(".franja").getBoundingClientRect(); return { izquierda: r.left, ancho: r.width, alto: r.height }; })(),
    subtitulos: document.querySelectorAll("#panel .subtitulo").length
  };
});

// Cuántos píxeles de la franja (sin sus extremos redondeados) tienen el color del fondo de la tarjeta, es decir, un hueco
const contarHuecos = async (p) => {
  const png = (await p.locator(".luz-de-hoy .franja").screenshot()).toString("base64");
  return p.evaluate(async (b64) => {
    const imagen = new Image();
    await new Promise((resolver, rechazar) => { imagen.onload = resolver; imagen.onerror = rechazar; imagen.src = "data:image/png;base64," + b64; });
    const lienzo = document.createElement("canvas"); lienzo.width = imagen.width; lienzo.height = imagen.height;
    const c = lienzo.getContext("2d"); c.drawImage(imagen, 0, 0);
    let e = document.querySelector(".luz-de-hoy .franja"), fondo = "rgb(255, 255, 255)";
    while (e) { const col = getComputedStyle(e).backgroundColor; if (col !== "rgba(0, 0, 0, 0)" && col !== "transparent") { fondo = col; break; } e = e.parentElement; }
    const [fr, fg, fb] = fondo.match(/\d+/g).map(Number);
    const datos = c.getImageData(0, 0, lienzo.width, lienzo.height).data;
    // La captura sale redondeada hacia fuera: si la franja empieza en un píxel con decimales, la primera fila no es suya.
    // Se miran solo las filas que caen enteras dentro de la franja.
    const caja = document.querySelector(".luz-de-hoy .franja").getBoundingClientRect();
    const y0 = Math.ceil(caja.top) - Math.floor(caja.top), y1 = Math.floor(caja.bottom) - Math.floor(caja.top);
    // Una costura es un píxel que se sale del rango de color de sus dos vecinos de la izquierda y la derecha (una línea más
    // clara u oscura entre dos bloques, porque los bordes de los bloques caen entre dos píxeles y se mezclan con el fondo).
    // El salto de la puesta no cuenta: ahí el píxel vale lo mismo que uno de sus vecinos.
    let huecos = 0, costuras = 0, total = 0;
    for (let y = y0; y < y1; y++) for (let x = 8; x < lienzo.width - 8; x++) {
      const i = (y * lienzo.width + x) * 4;
      total++;
      if (Math.abs(datos[i] - fr) + Math.abs(datos[i + 1] - fg) + Math.abs(datos[i + 2] - fb) < 40) huecos++;
      let fuera = 0;
      for (let k = 0; k < 3; k++) {
        const izq = datos[i - 4 + k], der = datos[i + 4 + k], v = datos[i + k];
        fuera += Math.max(0, Math.min(izq, der) - v, v - Math.max(izq, der));
      }
      if (fuera > 10) costuras++;
    }
    return { huecos, costuras, total, fondo };
  }, png);
};

ejecutar("luz-de-hoy", async ({ b, base }) => {
  let puesta = null;

  titulo("A: Atardecer, día a día (letra normal, claro)");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const esperados = ["La luz de hoy", "La luz de mañana", "La luz del sábado"];
    for (let i = 0; i < esperados.length; i++) {
      await p.click("#dias button[data-i='" + i + "']");
      const s = await leerSeccion(p);
      ok(s && s.titulo === esperados[i], "día " + i + ": el título es «" + esperados[i] + "» (" + (s && s.titulo) + ")");
      if (!s) continue;
      ok(s.bloques === 48, "  la franja tiene 48 bloques (" + s.bloques + ")");
      ok(s.textos.length === 1 && s.textos[0] === "█", "  todos los bloques son el texto «█» (" + s.textos.join("|") + ")");
      ok(s.colores.every((c) => c !== "rgba(0, 0, 0, 0)" && c !== "transparent"), "  todos los bloques tienen color de texto");
      ok(new Set(s.colores).size > 40, "  y los colores van cambiando a lo largo de la franja (" + new Set(s.colores).size + " distintos)");
      ok(s.fondos.length === 1 && s.fondos[0] === "rgba(0, 0, 0, 0)", "  ningún bloque usa fondo: la información va en el texto (" + s.fondos.join("|") + ")");
      ok(s.huecos === 0, "  el texto de cada bloque cubre su caja (" + s.huecos + " bloques con hueco)");
      ok(Math.abs(s.franja.alto - 14) <= 0.5, "  la franja mide 14 px de alto (" + s.franja.alto + ")");
      const [dorada, puestaHora, azul] = s.horas.map((h) => h.hora);
      ok(s.horas.map((h) => h.etiqueta).join("|") === "Hora dorada|Puesta|Hora azul", "  etiquetas: " + s.horas.map((h) => h.etiqueta).join("|"));
      ok(/^\d\d:\d\d$/.test(dorada) && /^\d\d:\d\d$/.test(puestaHora) && /^\d\d:\d\d$/.test(azul) && dorada < puestaHora && puestaHora < azul, "  horas crecientes: " + s.horas.map((h) => h.hora).join(" < "));
      ok(s.ahora.length === 0, "  no hay marcador de «ahora» (todavía no es la hora, o no es hoy)");
      ok(s.subtitulos === 0, "  la línea de la puesta de sol ya no está duplicada (" + s.subtitulos + ")");
      if (i === 0) puesta = puestaHora;
    }
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: sin huecos ni costuras en la franja, en claro y oscuro, con la letra del sistema y con una ancha, en móvil y en pantalla grande");
  for (const esquema of ["light", "dark"]) {
    for (const [nombreLetra, css] of [["la del sistema", null], ["una letra ancha", LETRA_ANCHA]]) {
     for (const ancho of [320, 390, 760]) {
      const { ctx, p } = await nuevaPagina(b, { viewport: { width: ancho, height: 900 }, colorScheme: esquema, perfil: PERFIL, lugar: LUGAR });
      await p.goto(base + "#/hoy"); await p.waitForSelector(".luz-de-hoy .franja");
      if (css) await p.addStyleTag({ content: css });
      const s = await leerSeccion(p);
      const que = esquema + ", " + nombreLetra + ", " + ancho + " px: ";
      ok(s.huecos === 0, que + "el texto cubre la caja de los 48 bloques (" + s.huecos + " con hueco)");
      const h = await contarHuecos(p);
      ok(h.huecos === 0, que + "ningún píxel de la franja tiene el color del fondo (" + h.huecos + " de " + h.total + "; fondo " + h.fondo + ")");
      ok(h.costuras === 0, que + "sin costuras entre bloques (" + h.costuras + " píxeles fuera del color de sus vecinos)");
      await ctx.close();
     }
    }
  }

  titulo("C: a la hora de la puesta aparece el marcador «●» en su sitio, y solo en el día de hoy");
  {
    ok(/^\d\d:\d\d$/.test(puesta || ""), "hora de la puesta leída en la primera página: " + puesta);
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, fecha: "2026-11-19T" + puesta + ":00+01:00" });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".luz-de-hoy .franja");
    const s = await leerSeccion(p);
    ok(s.ahora.length === 1 && s.ahora[0].texto === "●", "hay exactamente un marcador y es el texto «●» (" + JSON.stringify(s.ahora.map((x) => x.texto)) + ")");
    const [dorada, , azul] = s.horas.map((h) => h.hora);
    const minutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
    const esperada = (minutos(puesta) - minutos(dorada)) / (minutos(azul) - minutos(dorada));
    if (s.ahora.length === 1) {
      const real = (s.ahora[0].centro - s.franja.izquierda) / s.franja.ancho;
      ok(Math.abs(real - esperada) < 0.03, "  está en su sitio: al " + (real * 100).toFixed(1) + " % de la franja (esperado ≈ " + (esperada * 100).toFixed(1) + " %)");
    }
    await p.click("#dias button[data-i='1']");
    const manana = await leerSeccion(p);
    ok(manana.titulo === "La luz de mañana" && manana.ahora.length === 0, "mañana: sin marcador (" + manana.ahora.length + ")");
    await ctx.close();
  }

  titulo("D: en Luna no hay franja ni «La luz de hoy»");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.click("[data-tab=luna]");
    const n = await p.evaluate(() => ({ franjas: document.querySelectorAll(".franja").length, secciones: document.querySelectorAll(".luz-de-hoy").length }));
    ok(n.franjas === 0 && n.secciones === 0, "ni franja ni sección (" + JSON.stringify(n) + ")");
    await ctx.close();
  }

  titulo("E: la brújula, de 62 px, con el texto de la dirección");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".brujula svg");
    const r = await p.evaluate(() => {
      const s = document.querySelector(".brujula svg").getBoundingClientRect(), circulo = document.querySelector(".brujula svg circle");
      const flecha = document.querySelector(".brujula svg g path:last-of-type"); // la punta; la cola va antes
      return {
        ancho: s.width, alto: s.height, texto: document.querySelector(".brujula p").textContent.trim(),
        trazo: circulo.getAttribute("stroke-width"), flecha: flecha.getAttribute("fill"), marcaN: [...document.querySelectorAll(".brujula svg text")].map((t) => t.textContent.trim()),
        etiqueta: document.querySelector(".brujula svg").getAttribute("aria-label")
      };
    });
    ok(Math.round(r.ancho) === 62 && Math.round(r.alto) === 62, "mide 62 × 62 px (" + r.ancho + " × " + r.alto + ")");
    ok(/^Al atardecer, mira hacia el .+ \(\d+°\)\.$/.test(r.texto), "el texto de la dirección: «" + r.texto + "»");
    ok(r.trazo === "3", "el círculo tiene el trazo de 3 px (" + r.trazo + ")");
    ok(r.flecha === "var(--ambar-simbolo)", "la flecha usa el color de símbolo ámbar (" + r.flecha + ")");
    ok(r.marcaN.length === 1 && r.marcaN[0] === "N", "lleva la marca N (" + r.marcaN.join("|") + ")");
    ok(/^Dirección: \d+ grados desde el norte$/.test(r.etiqueta), "y su etiqueta para lectores de pantalla (" + r.etiqueta + ")");
    await ctx.close();
  }
}, { carpeta: dist, prefijo: "/luz-y-foto/beta/" });
