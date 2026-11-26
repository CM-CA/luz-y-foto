// El aviso legal: una píldora al final de Hoy y de Aprender («v1.0.0 · Aviso legal», con la versión de la app) lleva a una pantalla con el titular, las
// licencias, el uso y la responsabilidad, la privacidad y los datos, el texto completo de la licencia de lo que va dentro (SunCalc, Svelte, Vite y las dos
// fuentes) y los créditos de los datos. Cabe en 320, 360 y 390 px, en claro y oscuro, y existe en inglés.
//
// Ejecutar: node test/e2e/compilada/aviso-legal.e2e.cjs   (antes: npm run build)
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, LUGAR, nuevaPagina, ok, titulo, ejecutar } = require("../ayudas.cjs");

const dist = path.join(RAIZ, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.log("FALLA: no hay dist/. Compila antes con: npm run build");
  process.exit(1);
}

const VERSION = JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8")).version;
const EN_GIT = fs.existsSync(path.join(RAIZ, ".git"));
const PERFIL = { equipo: "camara", marca: "canon", objetivos: ["tele"], tripode: "aveces", nivel: "defiendo", respondidas: ["equipo", "marca", "objetivos", "tripode", "nivel"] };
const LETRA_ANCHA = "* { font-family: 'DejaVu Sans', sans-serif !important; }";
const hash = (p) => p.evaluate(() => location.hash);
const enlaces = (p) => p.evaluate(() => [...document.querySelectorAll(".aviso a")].map((a) => a.textContent.trim() + " → " + a.getAttribute("href")));
const encabezados = (p) => p.evaluate(() => [...document.querySelectorAll(".aviso h2")].map((h) => h.textContent.trim()));
const resumenes = (p) => p.evaluate(() => [...document.querySelectorAll("details.licencia summary")].map((s) => s.firstChild.textContent.trim()));
const textoDe = (p, nombre) => p.evaluate((nombre) => {
  const d = [...document.querySelectorAll("details.licencia")].find((x) => x.querySelector("summary").firstChild.textContent.trim() === nombre);
  d.open = true; return d.querySelector("pre").textContent;
}, nombre);
// «Versión 1.0.0» y, compilando dentro de git, «(commit, fecha)» (con la versión en inglés se llama «Version»)
const lineaVersion = (palabra) => new RegExp("^" + palabra + " " + VERSION.replace(/\./g, "\\.") + (EN_GIT ? " \\([0-9a-f]{7}, \\d{4}-\\d{2}-\\d{2}\\)" : "( \\([0-9a-f]{7}, \\d{4}-\\d{2}-\\d{2}\\))?") + "$");

ejecutar("aviso-legal", async ({ b, base }) => {
  titulo("A: la píldora con la versión, al final de Hoy y de Aprender, lleva a la pantalla; se vuelve a Hoy");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    const a = await p.evaluate(() => { const e = document.querySelector(".pildora-aviso a"); return e ? [e.textContent.trim(), e.getAttribute("href"), Math.round(e.getBoundingClientRect().height)] : null; });
    ok(a && a[0] === "v" + VERSION + " · Aviso legal" && a[1] === "#/aviso-legal", "Hoy acaba con la píldora «v" + VERSION + " · Aviso legal» (" + JSON.stringify(a) + ")");
    ok(a && a[2] >= 44, "la píldora se toca bien (" + (a && a[2]) + " px de alto)");
    ok(await p.locator(".pildora-aviso").count() === 1, "solo hay una píldora");
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const r = await p.evaluate(() => ({ pildora: document.querySelector(".pildora-aviso a").getBoundingClientRect().bottom, barra: document.querySelector("nav.nav-inferior").getBoundingClientRect().top }));
    ok(r.pildora <= r.barra + 0.5, "al llegar al final, la píldora queda por encima de la barra (" + Math.round(r.pildora) + " y " + Math.round(r.barra) + ")");
    await p.click(".pildora-aviso a");
    await p.waitForSelector(".aviso");
    ok(await hash(p) === "#/aviso-legal", "la dirección es #/aviso-legal (" + await hash(p) + ")");
    const h = await p.evaluate(() => ({ h1: document.querySelector("h1").textContent.trim(), foco: document.activeElement === document.querySelector("h1") }));
    ok(h.h1 === "Aviso legal" && h.foco, "el título es «Aviso legal» y tiene el foco (" + JSON.stringify(h) + ")");
    const activo = await p.evaluate(() => [...document.querySelectorAll("nav.nav-inferior a")].filter((x) => x.getAttribute("aria-current") === "page").length);
    ok(activo === 0, "ninguna pestaña de la barra queda marcada (" + activo + ")");
    ok(await p.locator(".pildora-aviso").count() === 0, "dentro del aviso no hay otra píldora");
    ok(await p.locator(".volver").getAttribute("href") === "#/hoy", "el enlace de volver lleva a Hoy");
    await p.click(".volver");
    await p.waitForSelector(".veredicto");
    ok(await hash(p) === "#/hoy", "se vuelve a Hoy (" + await hash(p) + ")");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/aprender"); await p.waitForSelector("ol.lecciones a");
    ok(await p.locator(".pildora-aviso a").textContent() === "v" + VERSION + " · Aviso legal", "Aprender acaba con la misma píldora");
    ok(await p.locator(".pildora-aviso a").getAttribute("href") === "#/aviso-legal", "apunta a #/aviso-legal");
    await p.click(".pildora-aviso a"); await p.waitForSelector(".aviso");
    ok(await hash(p) === "#/aviso-legal", "lleva a #/aviso-legal");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("B: titular, licencias, uso y responsabilidad, privacidad, avisos de terceros, créditos y versión");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR });
    await p.goto(base + "#/aviso-legal"); await p.waitForSelector(".aviso");
    const texto = await p.evaluate(() => document.querySelector(".aviso").innerText);
    const hs = await encabezados(p);
    ok(hs.join("|") === "Quién está detrás|Licencias|Uso y responsabilidad|Privacidad y datos|Lo que lleva dentro|Datos y créditos", "los apartados, en orden (" + hs.join("|") + ")");
    const version = await p.locator(".aviso-numero").textContent();
    ok(lineaVersion("Versión").test(version.trim()), "la versión se ve en la pantalla (" + version.trim() + ")");
    const pos = await p.evaluate(() => {
      const h1 = document.querySelector("h1").getBoundingClientRect(), v = document.querySelector(".aviso-numero"), c = v.getBoundingClientRect(), h2 = document.querySelector(".aviso h2").getBoundingClientRect();
      return { posicion: getComputedStyle(v).position, entre: c.top >= h1.bottom - 1 && c.bottom <= h2.top + 1 };
    });
    ok(pos.posicion === "static" && pos.entre, "la versión va en el texto, justo después del título (no es el aviso fijo de «versión nueva») (" + JSON.stringify(pos) + ")");
    ok(texto.includes("Camilo Manuel Couselo Alonso") && /proyecto personal y gratuito/.test(texto), "dice quién es el titular");
    ok(texto.includes("© 2026 Camilo Manuel Couselo Alonso") && /sin fines comerciales/i.test(texto) && /uso comercial/i.test(texto), "dice que es sin fines comerciales y qué hacer para un uso comercial");
    ok(/El nombre «Ollada» y su icono no están licenciados/.test(texto), "dice que el nombre y el icono no están licenciados");
    ok(/tal cual, sin garantías/.test(texto) && /avisos oficiales/.test(texto) && /no responde de las decisiones/.test(texto), "uso y responsabilidad: tal cual, avisos oficiales y sin responsabilidad por las decisiones");
    ok(/no tiene cuentas, publicidad ni analítica/.test(texto) && /el autor no recibe ningún dato tuyo/.test(texto), "privacidad: sin cuentas, publicidad ni analítica; el autor no recibe datos");
    ok(/solo en tu dispositivo/.test(texto) && /idioma, tu perfil, el lugar y la última previsión/.test(texto), "privacidad: qué se guarda en el dispositivo");
    ok(/ubicación \(GPS\)/.test(texto) && /permiso/.test(texto), "privacidad: el GPS, con permiso");
    ok(/Open-Meteo \(previsión y búsqueda de ciudades\)/.test(texto) && /OpenStreetMap \(nombre del lugar\)/.test(texto) && /GitHub Pages/.test(texto) && /dirección IP/.test(texto), "privacidad: quién recibe qué (Open-Meteo, OpenStreetMap, GitHub Pages)");
    const e = await enlaces(p);
    const quiere = [
      "PolyForm Noncommercial 1.0.0 → https://polyformproject.org/licenses/noncommercial/1.0.0",
      "CC BY-NC-SA 4.0 → https://creativecommons.org/licenses/by-nc-sa/4.0/",
      "abre una incidencia en GitHub → https://github.com/CM-CA/ollada/issues",
      "pídelo abriendo una incidencia en GitHub → https://github.com/CM-CA/ollada/issues",
      "Código fuente y licencias completas → https://github.com/CM-CA/ollada",
      "Condiciones y privacidad → https://open-meteo.com/en/terms",
      "Condiciones y privacidad → https://operations.osmfoundation.org/policies/nominatim/",
      "Open-Meteo (CC BY 4.0) → https://open-meteo.com/",
      "© colaboradores de OpenStreetMap → https://www.openstreetmap.org/copyright"
    ];
    quiere.forEach((q) => ok(e.includes(q), "enlace: " + q + (e.includes(q) ? "" : " (hay: " + e.join(" | ") + ")")));
    ok((await resumenes(p)).join("|") === "SunCalc|Svelte|Vite|Figtree|Young Serif", "los cinco avisos de terceros, en orden (" + (await resumenes(p)) + ")");
    ok(await p.locator("details.licencia[open]").count() === 0, "empiezan cerrados");
    const suncalc = await textoDe(p, "SunCalc");
    ok(/Volodymyr Agafonkin/.test(suncalc) && /Redistribution and use in source and binary forms/.test(suncalc), "SunCalc: su aviso y su licencia completos");
    const svelte = await textoDe(p, "Svelte");
    ok(/Svelte Contributors/.test(svelte) && /Permission is hereby granted/.test(svelte), "Svelte: su aviso y su licencia completos");
    const vite = await textoDe(p, "Vite");
    ok(/VoidZero Inc\. and Vite contributors/.test(vite) && /Permission is hereby granted/.test(vite), "Vite: su aviso y su licencia completos");
    for (const f of ["Figtree", "Young Serif"]) {
      const t = await textoDe(p, f);
      ok(/SIL OPEN FONT LICENSE Version 1\.1/.test(t) && /Copyright/.test(t), f + ": su aviso y la licencia OFL");
    }
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }

  titulo("C: cabe en 320, 360 y 390 px, en claro y oscuro y con letra ancha, con todos los textos abiertos");
  for (const ancho of [320, 360, 390]) {
    for (const esquema of ["light", "dark"]) {
      const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, viewport: { width: ancho, height: 800 }, colorScheme: esquema });
      await p.goto(base + "#/aviso-legal"); await p.waitForSelector(".aviso");
      await p.addStyleTag({ content: LETRA_ANCHA });
      await p.evaluate(() => document.querySelectorAll("details.licencia").forEach((d) => { d.open = true; }));
      const r = await p.evaluate(() => {
        const fuera = [...document.querySelectorAll(".aviso *")].filter((e) => { const c = e.getBoundingClientRect(); return c.width > 0 && (c.right > innerWidth + 0.5 || c.left < -0.5); }).map((e) => e.tagName + "." + e.className);
        return { desborde: document.documentElement.scrollWidth > innerWidth + 1, fuera };
      });
      ok(!r.desborde && r.fuera.length === 0, ancho + " px " + esquema + ": no se sale de la pantalla (" + JSON.stringify(r) + ")");
      ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
      await ctx.close();
    }
  }
  for (const ancho of [320, 390]) {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, viewport: { width: ancho, height: 800 } });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    await p.addStyleTag({ content: LETRA_ANCHA });
    const r = await p.evaluate(() => { const c = document.querySelector(".pildora-aviso a").getBoundingClientRect(); return { dentro: c.left >= -0.5 && c.right <= innerWidth + 0.5, alto: Math.round(c.height), desborde: document.documentElement.scrollWidth > innerWidth + 1 }; });
    ok(r.dentro && r.alto >= 44 && !r.desborde, ancho + " px con letra ancha: la píldora cabe y se toca bien (" + JSON.stringify(r) + ")");
    await ctx.close();
  }

  titulo("D: en inglés");
  {
    const { ctx, p } = await nuevaPagina(b, { perfil: PERFIL, lugar: LUGAR, locale: "en-US" });
    await p.goto(base + "#/hoy"); await p.waitForSelector(".veredicto");
    ok(await p.locator(".pildora-aviso a").textContent() === "v" + VERSION + " · Legal notice", "la píldora dice «v" + VERSION + " · Legal notice»");
    await p.click(".pildora-aviso a"); await p.waitForSelector(".aviso");
    const texto = await p.evaluate(() => document.querySelector(".aviso").innerText);
    ok(await p.evaluate(() => document.querySelector("h1").textContent.trim()) === "Legal notice", "título en inglés");
    const hs = await encabezados(p);
    ok(hs.join("|") === "Who is behind it|Licenses|Use and liability|Privacy and data|What is inside|Data and credits", "los apartados en inglés (" + hs.join("|") + ")");
    ok(lineaVersion("Version").test((await p.locator(".aviso-numero").textContent()).trim()), "la versión en inglés (" + (await p.locator(".aviso-numero").textContent()).trim() + ")");
    ok(texto.includes("© 2026 Camilo Manuel Couselo Alonso") && /noncommercial/i.test(texto) && /commercial use/i.test(texto), "titular y uso no comercial en inglés");
    ok(/as is, without warranties/.test(texto) && /official weather warnings/.test(texto), "uso y responsabilidad en inglés");
    ok(/no accounts, ads or analytics/.test(texto) && /receives no data about you/.test(texto) && /GitHub Pages/.test(texto), "privacidad en inglés");
    const e = await enlaces(p);
    ok(e.some((x) => x.startsWith("© OpenStreetMap contributors → https://www.openstreetmap.org/copyright")), "crédito de OpenStreetMap en inglés (" + e.filter((x) => /openstreetmap/.test(x)) + ")");
    ok(!/[áéíóúñ¿¡]/i.test(texto.replace(/Camilo Manuel Couselo Alonso/, "").split("What is inside")[0]), "ni una palabra en español en la parte propia");
    ok(p.errores.length === 0, "sin errores: " + p.errores.join(";"));
    await ctx.close();
  }
});
