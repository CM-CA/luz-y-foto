/*
 * Cálculos de sol y luna para luz-y-foto.
 * Funciona en el navegador (necesita lib/suncalc.js cargado antes) y en Node (para las pruebas).
 * Todo se calcula en el dispositivo: no necesita conexión.
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) {
    module.exports = fabrica(require("../lib/suncalc.js"));
  } else {
    raiz.Astro = fabrica(raiz.SunCalc);
  }
})(typeof self !== "undefined" ? self : this, function (SunCalc) {
  "use strict";

  const PUNTOS = [
    "norte", "nor-noreste", "noreste", "este-noreste",
    "este", "este-sureste", "sureste", "sur-sureste",
    "sur", "sur-suroeste", "suroeste", "oeste-suroeste",
    "oeste", "oeste-noroeste", "noroeste", "nor-noroeste"
  ];

  // Azimut en grados (0 = norte, 90 = este, 180 = sur, 270 = oeste) -> palabra
  function puntoCardinal(grados) {
    const g = ((grados % 360) + 360) % 360;
    return PUNTOS[Math.round(g / 22.5) % 16];
  }

  // Fase de 0 a 1 (0 nueva, 0.25 cuarto creciente, 0.5 llena, 0.75 cuarto menguante)
  function nombreFase(fase) {
    const cerca = (objetivo) => {
      const d = Math.abs(fase - objetivo);
      return Math.min(d, 1 - d) < 0.03;
    };
    if (cerca(0)) return { clave: "nueva", nombre: "Luna nueva" };
    if (cerca(0.25)) return { clave: "cuarto", nombre: "Cuarto creciente" };
    if (cerca(0.5)) return { clave: "llena", nombre: "Luna llena" };
    if (cerca(0.75)) return { clave: "cuarto", nombre: "Cuarto menguante" };
    if (fase < 0.25) return { clave: "creciente", nombre: "Creciente" };
    if (fase < 0.5) return { clave: "gibosa", nombre: "Gibosa creciente" };
    if (fase < 0.75) return { clave: "gibosa", nombre: "Gibosa menguante" };
    return { clave: "creciente", nombre: "Menguante" };
  }

  const CONSEJOS = {
    nueva: "Casi no se ve. Noche buena para estrellas, no para fotografiar la luna.",
    llena: "Muy brillante y de luz plana, sin relieve. Queda mejor dentro de un paisaje o entre nubes.",
    cuarto: "La luz llega de lado y marca el relieve de los cráteres. Es la fase con más detalle.",
    creciente: "Luz suave con el borde bien marcado. Buena para una luna fina sobre el paisaje.",
    gibosa: "Sombras suaves y mucho brillo. Con teleobjetivo se aprecia relieve en el borde."
  };

  function azimutDe(fecha, lat, lon, tipo) {
    if (!fecha) return null;
    const p = tipo === "luna"
      ? SunCalc.getMoonPosition(fecha, lat, lon)
      : SunCalc.getPosition(fecha, lat, lon);
    return p.azimuth;
  }

  /*
   * Datos de un día. `fecha` debe ser un instante dentro del día civil que se quiere
   * (por ejemplo, las 12:00 locales). El desfase horario se toma del propio dispositivo.
   */
  function calcularDia(fecha, lat, lon) {
    const desfase = -fecha.getTimezoneOffset(); // minutos, positivo al este de UTC
    const t = SunCalc.getTimes(fecha, lat, lon, 0, desfase);

    const sol = {
      amanecer: t.sunrise || null,
      puesta: t.sunset || null,
      horaDorada: t.goldenHour || null,   // empieza la hora dorada de la tarde
      finHoraAzul: t.dusk || null,        // fin del crepúsculo civil
      azAmanecer: azimutDe(t.sunrise, lat, lon, "sol"),
      azPuesta: azimutDe(t.sunset, lat, lon, "sol")
    };
    sol.palabraAmanecer = sol.azAmanecer === null ? null : puntoCardinal(sol.azAmanecer);
    sol.palabraPuesta = sol.azPuesta === null ? null : puntoCardinal(sol.azPuesta);

    // La luna se describe tal y como se ve a la hora de la puesta
    const referencia = t.sunset || fecha;
    const ilum = SunCalc.getMoonIllumination(referencia);
    const f = nombreFase(ilum.phase);

    const hoy = SunCalc.getMoonTimes(fecha, lat, lon, desfase);
    const sigDia = new Date(fecha.getTime() + 86400000);
    const manana = SunCalc.getMoonTimes(sigDia, lat, lon, -sigDia.getTimezoneOffset());

    // La puesta que interesa es la primera posterior a la salida de hoy. Si la luna ya estaba
    // en el cielo al empezar el día, es la primera puesta del día. Ojo: la puesta de madrugada
    // de hoy pertenece a la luna de ayer, y no sirve.
    const candidatas = [hoy.set, manana.set].filter(Boolean).sort((a, b) => a - b);
    const despuesDe = hoy.rise || null;
    const seSitua = candidatas.find((d) => !despuesDe || d > despuesDe) || null;
    const seSituaAlDiaSiguiente = !!seSitua && seSitua.toDateString() !== fecha.toDateString();

    const luna = {
      fraccion: ilum.fraction,
      fase: ilum.phase,
      creciente: ilum.waxing,
      clave: f.clave,
      nombre: f.nombre,
      consejo: CONSEJOS[f.clave],
      sale: hoy.rise || null,
      seSitua,
      seSituaAlDiaSiguiente,
      alturaMaxima: hoy.transit || null,
      siempreVisible: !!hoy.alwaysUp,
      nuncaVisible: !!hoy.alwaysDown,
      azSale: azimutDe(hoy.rise, lat, lon, "luna"),
      azSeSitua: azimutDe(seSitua, lat, lon, "luna")
    };
    luna.palabraSale = luna.azSale === null ? null : puntoCardinal(luna.azSale);
    luna.palabraSeSitua = luna.azSeSitua === null ? null : puntoCardinal(luna.azSeSitua);

    return { sol, luna };
  }

  return { puntoCardinal, nombreFase, calcularDia };
});
