/*
 * Semáforo de atardecer y de luna para luz-y-foto.
 * Reglas explicadas en docs/reglas-puntuacion.md (versión de la página de prueba, a calibrar).
 * Funciona en el navegador (después de js/astro.js) y en Node (para las pruebas).
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica(require("./astro.js"));
  } else {
    raiz.Semaforo = fabrica(raiz.Astro);
  }
})(typeof self !== "undefined" ? self : this, function (Astro) {
  "use strict";

  const HORA = 3600000;

  const REGLAS = {
    vetoBajas: 88,         // % de nubes bajas: por encima, el sol no se ve en el horizonte
    lluviaModerada: 0.5,   // mm/h: hasta aquí es llovizna
    lluviaFuerte: 2.5,     // mm/h: por encima, no se sale
    nieblaKm: 5,           // visibilidad mínima antes de avisar de niebla
    lunaAltaGrados: 10,    // la luna cuenta como "alta" por encima de esta altura
    lunaVerde: 30,         // % de nubes totales
    lunaAmbar: 60,
    lunaNuevaFraccion: 0.03
  };

  const TEXTOS_NIVEL = {
    atardecer: { verde: "Prometedor", ambar: "Posible, pero incierto", rojo: "Poco probable" },
    luna: { verde: "Se verá bien", ambar: "Posible entre nubes", rojo: "Poco probable", ninguno: "Sin luna esta noche" }
  };

  /* ---------- Preparar los datos de Open-Meteo ---------- */

  // Convierte las horas del lugar ("2026-11-18T18:00") en instantes reales (milisegundos).
  function prepararPrevision(datos) {
    const desfase = (datos.utc_offset_seconds || 0) * 1000;
    const instante = (s) => Date.parse(s + ":00Z") - desfase;
    const h = datos.hourly;
    const num = (v) => (v === null || v === undefined ? null : v);

    const horas = h.time.map((s, i) => ({
      t: instante(s),
      bajas: num(h.cloud_cover_low[i]),
      medias: num(h.cloud_cover_mid[i]),
      altas: num(h.cloud_cover_high[i]),
      total: num(h.cloud_cover[i]),
      lluvia: num(h.precipitation && h.precipitation[i]) ?? 0,
      prob: num(h.precipitation_probability && h.precipitation_probability[i]) ?? 0,
      vis: (num(h.visibility && h.visibility[i]) ?? 99000) / 1000,
      codigo: num(h.weather_code && h.weather_code[i]) ?? 0
    })).filter((x) => x.total !== null && x.bajas !== null);

    const dias = datos.daily.time.map((fecha, i) => ({
      fecha,
      amanecer: instante(datos.daily.sunrise[i]),
      puesta: instante(datos.daily.sunset[i])
    }));

    return { horas, dias, desfaseMs: desfase };
  }

  /* ---------- Utilidades ---------- */

  const media = (xs, f) => xs.reduce((a, x) => a + f(x), 0) / xs.length;
  const maximo = (xs, f) => Math.max(...xs.map(f));
  const minimo = (xs, f) => Math.min(...xs.map(f));
  const hayTormenta = (xs) => xs.some((x) => x.codigo >= 95);

  function nivelPorPuntos(total) {
    return total >= 70 ? "verde" : total >= 40 ? "ambar" : "rojo";
  }

  const AVISO_TORMENTA = "Hay tormenta eléctrica en la previsión. Fotografía desde un sitio cubierto (coche, porche o ventana), lejos de zonas altas y sin trípode metálico a la intemperie. Si oyes truenos, recoge.";
  const AVISO_LLOVIZNA = "Puede haber llovizna: lleva algo para proteger la cámara.";
  const AVISO_NIEBLA = "Poca visibilidad (niebla): el atardecer será difícil, pero la ría con niebla puede merecer la pena.";

  /* ---------- Atardecer ---------- */

  // Horas desde 1 h antes hasta 30 min después de la puesta
  function ventanaAtardecer(prev, dia) {
    return prev.horas.filter((x) => x.t + HORA > dia.puesta - HORA && x.t <= dia.puesta + HORA / 2);
  }

  function puntuarAtardecer(prev, dia) {
    const v = ventanaAtardecer(prev, dia);
    if (!v.length) return null;

    const bajas = media(v, (x) => x.bajas);
    const medias = media(v, (x) => x.medias);
    const altas = media(v, (x) => x.altas);
    const cielo = Math.max(medias, altas);
    const lluvia = maximo(v, (x) => x.lluvia);
    const prob = maximo(v, (x) => x.prob);
    const vis = minimo(v, (x) => x.vis);
    const tormenta = hayTormenta(v);

    const pBajas = bajas < 20 ? 40 : bajas < 40 ? 28 : bajas < 60 ? 18 : bajas < 75 ? 10 : 4;
    const pCielo = (cielo >= 20 && cielo <= 70) ? 50
      : ((cielo >= 10 && cielo < 20) || (cielo > 70 && cielo <= 85)) ? 25 : 5;
    const pLluvia = lluvia <= 0.1 ? 10 : lluvia <= REGLAS.lluviaModerada ? 7 : lluvia <= REGLAS.lluviaFuerte ? 2 : 0;
    const total = pBajas + pCielo + pLluvia;

    let nivel = nivelPorPuntos(total);
    let motivoVeto = null;
    const avisos = [];

    if (tormenta) {
      nivel = "ambar";
      avisos.push(AVISO_TORMENTA);
    } else if (lluvia > REGLAS.lluviaFuerte) {
      nivel = "rojo";
      motivoVeto = "Se espera lluvia fuerte a la hora de la puesta.";
    } else if (bajas > REGLAS.vetoBajas) {
      nivel = "rojo";
      motivoVeto = "El cielo bajo está casi cerrado: el sol no se verá en el horizonte.";
    } else if (lluvia > REGLAS.lluviaModerada && nivel === "verde") {
      nivel = "ambar";
    }

    if (!tormenta && lluvia > 0.1 && lluvia <= REGLAS.lluviaModerada) avisos.push(AVISO_LLOVIZNA);
    if (vis < REGLAS.nieblaKm) avisos.push(AVISO_NIEBLA);

    return { horas: v, bajas, medias, altas, cielo, lluvia, prob, vis, tormenta, pBajas, pCielo, pLluvia, total, nivel, motivoVeto, avisos };
  }

  /* ---------- Luna ---------- */

  /*
   * Horas de la noche (de la puesta de un día al amanecer del siguiente) en las que la luna
   * está alta y ya es de noche. Cada hora se valora por su punto medio.
   * `desde` (opcional) descarta lo que ya ha pasado.
   */
  function ventanaLuna(prev, inicio, fin, lat, lon, desde) {
    return prev.horas.filter((x) => {
      const medio = x.t + HORA / 2;
      if (medio < inicio || medio > fin) return false;
      if (desde !== undefined && x.t + HORA <= desde) return false;
      const a = Astro.alturas(new Date(medio), lat, lon);
      return a.luna >= REGLAS.lunaAltaGrados && a.sol < -1;
    });
  }

  /*
   * `fraccion`: parte iluminada de la luna esa noche (0 a 1).
   * Devuelve nivel "ninguno" cuando no hay luna que fotografiar (no sale de noche o es luna nueva).
   */
  function puntuarLuna(prev, inicio, fin, lat, lon, fraccion, desde) {
    const v = ventanaLuna(prev, inicio, fin, lat, lon, desde);

    if (fraccion < REGLAS.lunaNuevaFraccion) {
      return { horas: v, nivel: "ninguno", motivo: "Luna nueva: casi no se ve. Buena noche para estrellas, no para la luna.", avisos: [] };
    }
    if (!v.length) {
      // Si ya han pasado todas las horas útiles, se dice así en vez de dar a entender que no hubo luna
      const entera = desde !== undefined && ventanaLuna(prev, inicio, fin, lat, lon).length > 0;
      return {
        horas: v, nivel: "ninguno", avisos: [], yaPaso: entera,
        motivo: entera ? "Ya no quedan horas de esta noche con la luna alta."
          : "Esta noche la luna no estará alta mientras es de noche."
      };
    }

    const avisos = [];
    const tormenta = hayTormenta(v);
    const utiles = v.filter((x) => x.lluvia <= REGLAS.lluviaFuerte);

    if (!utiles.length) {
      return { horas: v, nivel: "rojo", motivo: "Se espera lluvia fuerte mientras la luna está alta.", avisos, lluvia: maximo(v, (x) => x.lluvia), tormenta };
    }

    // La mejor hora es la de menos nubes (a igualdad, la de menos lluvia)
    const mejor = utiles.reduce((a, b) =>
      (b.total < a.total || (b.total === a.total && b.lluvia < a.lluvia)) ? b : a);

    let nivel = mejor.total < REGLAS.lunaVerde ? "verde" : mejor.total <= REGLAS.lunaAmbar ? "ambar" : "rojo";
    if (nivel === "verde" && mejor.lluvia > REGLAS.lluviaModerada) nivel = "ambar";

    if (tormenta) {
      nivel = nivel === "rojo" ? "rojo" : "ambar";
      avisos.push(AVISO_TORMENTA);
    } else if (mejor.lluvia > 0.1 && mejor.lluvia <= REGLAS.lluviaModerada) {
      avisos.push(AVISO_LLOVIZNA);
    }
    if (mejor.vis < REGLAS.nieblaKm) avisos.push("Poca visibilidad (niebla): la luna se verá borrosa.");

    return {
      horas: v,
      mejorHora: mejor.t,
      nubes: mejor.total,
      mediaNubes: media(v, (x) => x.total),
      lluvia: mejor.lluvia,
      tormenta,
      nivel,
      avisos,
      primera: v[0].t,
      ultima: v[v.length - 1].t + HORA
    };
  }

  /* ---------- Frases en lenguaje llano ---------- */

  function fraseBajas(v) {
    if (v < 20) return "Casi sin nubes bajas: el sol se verá bien en el horizonte.";
    if (v < 40) return "Pocas nubes bajas: el horizonte estará bastante despejado.";
    if (v < 60) return "Nubes bajas a ratos: el sol puede quedar tapado un rato.";
    if (v < 75) return "Muchas nubes bajas: es probable que tapen el sol cerca del horizonte.";
    return "Cielo bajo muy cubierto: poco hueco para ver el sol.";
  }
  function fraseCielo(v) {
    if (v >= 20 && v <= 70) return "Nubes medias o altas en buena cantidad: son las que se tiñen de naranja y rosa.";
    if (v < 20) return "Casi sin nubes altas: el cielo será bonito pero sin mucho color.";
    return "Cielo alto muy cubierto: los colores saldrán apagados.";
  }
  function fraseLluvia(v, tormenta, momento) {
    if (tormenta) return "Tormenta eléctrica prevista.";
    if (v <= 0.1) return "Sin lluvia " + momento + ".";
    if (v <= REGLAS.lluviaModerada) return "Llovizna ligera.";
    if (v <= REGLAS.lluviaFuerte) return "Lluvia moderada.";
    return "Lluvia fuerte.";
  }
  function fraseNubesLuna(v) {
    if (v < REGLAS.lunaVerde) return "Cielo despejado o casi: la luna se verá limpia.";
    if (v <= REGLAS.lunaAmbar) return "Nubes a ratos: tendrás que esperar un hueco entre ellas.";
    return "Cielo cubierto: la luna apenas se dejará ver.";
  }

  function resumenAtardecer(r) {
    if (r.motivoVeto) return r.motivoVeto;
    if (r.tormenta) return "Con tormenta eléctrica se puede salir, pero solo con precaución. La nota depende de lo que dejen ver las nubes.";
    if (r.nivel === "verde") return "Buena combinación de nubes y sin lluvia importante. Merece la pena salir.";
    if (r.nivel === "ambar") return "Hay posibilidades, pero algún factor juega en contra. Si sales, ten un plan B (siluetas, nubes, hora azul).";
    return "Los factores juegan en contra. Mejor un plan B (detalles, reflejos, blanco y negro) o quedarse en casa.";
  }

  function resumenLuna(r) {
    if (r.nivel === "ninguno") return r.motivo;
    if (r.nivel === "rojo" && r.nubes === undefined) return r.motivo;
    if (r.nivel === "verde") return "Cielo despejado cuando la luna está alta. Merece la pena salir.";
    if (r.nivel === "ambar") return "Habrá nubes, pero puede abrir algún hueco. Si sales, ten paciencia y mira las nubes cada poco.";
    return "Cielo muy cubierto: la luna apenas se verá. Mejor otra noche.";
  }

  return {
    REGLAS, TEXTOS_NIVEL,
    prepararPrevision, ventanaAtardecer, puntuarAtardecer, ventanaLuna, puntuarLuna,
    fraseBajas, fraseCielo, fraseLluvia, fraseNubesLuna, resumenAtardecer, resumenLuna
  };
});
