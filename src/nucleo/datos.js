/*
 * Datos de luz-y-foto: validación de los archivos de data/.
 *
 * La validación existe para que un error al editar un JSON (un número fuera de sitio, un texto
 * que falta, un género mal escrito) se detecte con un mensaje claro y no con un fallo extraño.
 * Se usa al compilar (npm run validar y vite build) y en las pruebas. Los datos van incluidos en la compilación
 * (src/datos-incluidos.js), así que aquí ya no hay carga con fetch como en la versión actual.
 */
const MOTORES = ["puntos-ventana", "mejor-hora-nocturna"];
const EVENTOS = ["puesta", "amanecer"];
const CAMPOS = ["bajas", "medias", "altas", "total"];
const NIVELES_LLUVIA = ["sin", "llovizna", "moderada", "fuerte"];
const FASES = ["nueva", "creciente", "cuarto-creciente", "gibosa-creciente", "llena",
  "gibosa-menguante", "cuarto-menguante", "menguante"];
const CONDICIONES = ["desde", "menosDe", "hasta", "masDe"];

/* ---------- Validación ---------- */

const esNumero = (x) => typeof x === "number" && Number.isFinite(x);
const esTexto = (x) => typeof x === "string" && x.trim().length > 0;
const esObjeto = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

function validarTramos(lista, donde, errores, exigirPuntos, max) {
  if (!Array.isArray(lista) || !lista.length) { errores.push(donde + ": debe ser una lista con al menos un tramo"); return; }
  lista.forEach((t, i) => {
    const aqui = donde + "[" + i + "]";
    if (!esObjeto(t)) { errores.push(aqui + ": debe ser un objeto"); return; }
    CONDICIONES.forEach((c) => { if (c in t && !esNumero(t[c])) errores.push(aqui + "." + c + ": debe ser un número"); });
    if (exigirPuntos) {
      if (!esNumero(t.puntos)) errores.push(aqui + ".puntos: falta o no es un número");
      else if (t.puntos < 0 || (max !== undefined && t.puntos > max)) errores.push(aqui + ".puntos: debe estar entre 0 y " + max);
    } else if (!esTexto(t.texto)) {
      errores.push(aqui + ".texto: falta el texto");
    }
  });
  const ultimo = lista[lista.length - 1];
  if (esObjeto(ultimo) && CONDICIONES.some((c) => c in ultimo)) {
    errores.push(donde + ": el último tramo debe ser el «resto» (sin condiciones) para que siempre haya respuesta");
  }
}

function validarComun(c, errores) {
  if (!esObjeto(c)) { errores.push("comun.json: falta o no es un objeto"); return; }
  const l = c.lluvia || {};
  ["sinLluviaMm", "lloviznaMm", "fuerteMm", "tormentaCodigo"].forEach((k) => {
    if (!esNumero(l[k])) errores.push("comun.lluvia." + k + ": falta o no es un número");
  });
  if (esNumero(l.sinLluviaMm) && esNumero(l.lloviznaMm) && esNumero(l.fuerteMm) &&
      !(l.sinLluviaMm < l.lloviznaMm && l.lloviznaMm < l.fuerteMm)) {
    errores.push("comun.lluvia: los umbrales deben ir de menor a mayor (sin lluvia < llovizna < fuerte)");
  }
  if (!esNumero(c.nieblaKm)) errores.push("comun.nieblaKm: falta o no es un número");
  const n = c.niveles || {};
  if (!esNumero(n.verdeDesde) || !esNumero(n.ambarDesde)) errores.push("comun.niveles: faltan verdeDesde y ambarDesde");
  else if (!(n.ambarDesde < n.verdeDesde && n.verdeDesde <= 100 && n.ambarDesde >= 0)) {
    errores.push("comun.niveles: ambarDesde debe ser menor que verdeDesde, y ambos entre 0 y 100");
  }
  ["tormenta", "llovizna"].forEach((k) => { if (!esTexto((c.avisos || {})[k])) errores.push("comun.avisos." + k + ": falta el texto"); });
  ["tormenta", "sin", "llovizna", "moderada", "fuerte"].forEach((k) => {
    if (!esTexto((c.frasesLluvia || {})[k])) errores.push("comun.frasesLluvia." + k + ": falta el texto");
  });
}

function validarComunesGenero(g, d, errores) {
  if (!esTexto(g.nombre)) errores.push(d + ".nombre: falta el nombre");
  if (!MOTORES.includes(g.motor)) errores.push(d + ".motor: «" + g.motor + "» no existe (usa " + MOTORES.join(" o ") + ")");
  if (!esTexto(g.avisoNiebla)) errores.push(d + ".avisoNiebla: falta el texto");
  const e = g.etiquetasDia || {};
  ["hoy", "manana", "otro"].forEach((k) => { if (!esTexto(e[k])) errores.push(d + ".etiquetasDia." + k + ": falta el texto"); });
}

function validarPuntosVentana(g, d, errores) {
  if (!EVENTOS.includes(g.evento)) errores.push(d + ".evento: «" + g.evento + "» no existe (usa " + EVENTOS.join(" o ") + ")");
  if (!esTexto(g.eventoNombre)) errores.push(d + ".eventoNombre: falta el texto");
  const v = g.ventana || {};
  if (!esNumero(v.antesMin) || !esNumero(v.despuesMin) || v.antesMin < 0 || v.despuesMin < 0) {
    errores.push(d + ".ventana: faltan antesMin y despuesMin (minutos, no negativos)");
  }
  ["textoEvento", "textoBrujula"].forEach((k) => { if (!esTexto(g[k])) errores.push(d + "." + k + ": falta el texto"); });
  ["verde", "ambar", "rojo"].forEach((k) => {
    if (!esTexto((g.niveles || {})[k])) errores.push(d + ".niveles." + k + ": falta el texto");
  });
  ["verde", "ambar", "rojo", "tormenta"].forEach((k) => {
    if (!esTexto((g.resumenes || {})[k])) errores.push(d + ".resumenes." + k + ": falta el texto");
  });

  if (!Array.isArray(g.factores) || !g.factores.length) { errores.push(d + ".factores: debe ser una lista con al menos un factor"); return; }
  const ids = new Set();
  let suma = 0;
  g.factores.forEach((f, i) => {
    const a = d + ".factores[" + i + "]";
    if (!esTexto(f.id)) errores.push(a + ".id: falta"); else if (ids.has(f.id)) errores.push(a + ".id: «" + f.id + "» repetido"); else ids.add(f.id);
    if (!esTexto(f.etiqueta)) errores.push(a + ".etiqueta: falta el texto");
    if (!esNumero(f.max) || f.max <= 0) errores.push(a + ".max: debe ser un número positivo"); else suma += f.max;
    if (f.tipo === "lluvia") {
      if (!esTexto(f.momento)) errores.push(a + ".momento: falta el texto");
      NIVELES_LLUVIA.forEach((n) => {
        const p = (f.puntos || {})[n];
        if (!esNumero(p) || p < 0 || p > f.max) errores.push(a + ".puntos." + n + ": debe ser un número entre 0 y " + f.max);
      });
    } else {
      if (!Array.isArray(f.campos) || !f.campos.length || f.campos.some((c) => !CAMPOS.includes(c))) {
        errores.push(a + ".campos: lista con valores de " + CAMPOS.join(", "));
      } else if (f.campos.length > 1 && f.combinar !== "maximo") {
        errores.push(a + ".combinar: con varios campos hay que indicar «maximo»");
      }
      if (!["media", "maximo"].includes(f.agregado)) errores.push(a + ".agregado: usa «media» o «maximo»");
      validarTramos(f.tramos, a + ".tramos", errores, true, f.max);
      validarTramos(f.frases, a + ".frases", errores, false);
    }
  });
  if (suma !== 100) errores.push(d + ".factores: los máximos deben sumar 100 (ahora suman " + suma + ")");

  (g.vetos || []).forEach((v, i) => {
    const a = d + ".vetos[" + i + "]";
    if (!ids.has(v.factor)) errores.push(a + ".factor: «" + v.factor + "» no es un factor de este género");
    if (!esTexto(v.motivo)) errores.push(a + ".motivo: falta el texto");
    if (v.factor === "lluvia" ? !NIVELES_LLUVIA.includes(v.nivel) : !esNumero(v.masDe)) {
      errores.push(a + ": el veto de lluvia lleva «nivel» y los demás «masDe»");
    }
  });
  if (!NIVELES_LLUVIA.includes(g.ambarSiLluviaDesde)) errores.push(d + ".ambarSiLluviaDesde: usa " + NIVELES_LLUVIA.join(", "));

  // Opcional: con niebla, un factor de nubes da sus puntos máximos y no veta (la niebla como ventaja)
  if (g.nieblaVentaja !== undefined) {
    const n = g.nieblaVentaja || {};
    if (!g.factores.some((f) => f.id === n.factor && f.tipo !== "lluvia")) errores.push(d + ".nieblaVentaja.factor: «" + n.factor + "» no es un factor de nubes de este género");
    if (!esTexto(n.frase)) errores.push(d + ".nieblaVentaja.frase: falta el texto");
  }
}

function validarNocturno(g, d, errores) {
  const l = g.luna || {};
  if (!esNumero(l.alturaMinGrados) || l.alturaMinGrados < 0 || l.alturaMinGrados > 90) errores.push(d + ".luna.alturaMinGrados: número entre 0 y 90");
  if (!esNumero(l.solMaxGrados) || l.solMaxGrados > 0) errores.push(d + ".luna.solMaxGrados: número menor o igual que 0");
  if (!esNumero(l.fraccionMinima) || l.fraccionMinima < 0 || l.fraccionMinima >= 1) errores.push(d + ".luna.fraccionMinima: número entre 0 y 1");
  const n = g.nubes || {};
  if (!CAMPOS.includes(n.campo)) errores.push(d + ".nubes.campo: usa " + CAMPOS.join(", "));
  if (!esNumero(n.verdeMenosDe) || !esNumero(n.ambarHasta) || !(n.verdeMenosDe <= n.ambarHasta)) {
    errores.push(d + ".nubes: verdeMenosDe debe ser un número menor o igual que ambarHasta");
  }
  const ll = g.lluvia || {};
  if (!esTexto(ll.momento)) errores.push(d + ".lluvia.momento: falta el texto");
  if (!NIVELES_LLUVIA.includes(ll.vetoDesde)) errores.push(d + ".lluvia.vetoDesde: usa " + NIVELES_LLUVIA.join(", "));
  if (!NIVELES_LLUVIA.includes(ll.ambarSiLluviaDesde)) errores.push(d + ".lluvia.ambarSiLluviaDesde: usa " + NIVELES_LLUVIA.join(", "));
  ["verde", "ambar", "rojo", "ninguno", "yaPaso"].forEach((k) => { if (!esTexto((g.niveles || {})[k])) errores.push(d + ".niveles." + k + ": falta el texto"); });
  ["verde", "ambar", "rojo"].forEach((k) => { if (!esTexto((g.resumenes || {})[k])) errores.push(d + ".resumenes." + k + ": falta el texto"); });
  ["lunaNueva", "sinLunaAlta", "yaPaso", "lluviaFuerte"].forEach((k) => { if (!esTexto((g.motivos || {})[k])) errores.push(d + ".motivos." + k + ": falta el texto"); });
  validarTramos(g.frasesNubes, d + ".frasesNubes", errores, false);
  FASES.forEach((f) => {
    const x = (g.fases || {})[f];
    if (!x || !esTexto(x.nombre) || !esTexto(x.consejo)) errores.push(d + ".fases." + f + ": faltan el nombre y el consejo");
  });
  if (!(g.etiquetasDia || {}).ahora) errores.push(d + ".etiquetasDia.ahora: falta el texto");
  // La brújula del panel: la frase, las tres formas de decir la altura y las cuatro de decir a qué momento apunta
  const b = g.brujula || {};
  ["texto", "altura", "alturaUnPuno", "alturaBaja"].forEach((k) => { if (!esTexto(b[k])) errores.push(d + ".brujula." + k + ": falta el texto"); });
  ["ahora", "mejor", "anochecer", "sale"].forEach((k) => { if (!esTexto((b.momentos || {})[k])) errores.push(d + ".brujula.momentos." + k + ": falta el texto"); });
}

const NIVELES_USUARIO = ["empiezo", "defiendo", "controlo"];
const MARCAS_MODO = ["Av", "Tv"];
const reTermino = /\[\[([a-z0-9-]+)\|[^\]]+\]\]/g;
const terminosEn = (t) => { const r = []; let m; reTermino.lastIndex = 0; while ((m = reTermino.exec(t))) r.push(m[1]); return r; };

function validarPerfil(p, errores) {
  if (!esObjeto(p)) { errores.push("perfil.json: falta o no es un objeto"); return; }
  ["titulo", "texto", "empezar", "saltar"].forEach((k) => { if (!esTexto((p.bienvenida || {})[k])) errores.push("perfil.bienvenida." + k + ": falta el texto"); });
  if (!Array.isArray(p.preguntas) || !p.preguntas.length) { errores.push("perfil.preguntas: debe ser una lista"); return; }
  const ids = new Set();
  p.preguntas.forEach((q, i) => {
    const a = "perfil.preguntas[" + i + "]";
    if (!esTexto(q.id)) errores.push(a + ".id: falta"); else ids.add(q.id);
    if (!esTexto(q.titulo)) errores.push(a + ".titulo: falta el texto");
    if (!Array.isArray(q.opciones) || q.opciones.length < 2) errores.push(a + ".opciones: debe haber al menos dos");
    else q.opciones.forEach((o, j) => {
      if (!esTexto(o.id) || !esTexto(o.texto)) errores.push(a + ".opciones[" + j + "]: faltan id y texto");
      if (o && typeof o === "object" && "resumen" in o && !esTexto(o.resumen)) errores.push(a + ".opciones[" + j + "].resumen: si está, debe ser un texto");
    });
  });
  const d = p.porDefecto || {};
  p.preguntas.forEach((q) => {
    if (!(q.id in d)) { errores.push("perfil.porDefecto." + q.id + ": falta el valor por defecto"); return; }
    const validos = (q.opciones || []).map((o) => o.id);
    const val = q.multiple ? d[q.id] : [d[q.id]];
    if (!Array.isArray(val) || val.some((x) => !validos.includes(x))) errores.push("perfil.porDefecto." + q.id + ": debe ser una opción de la pregunta");
  });
  NIVELES_USUARIO.forEach((n) => { if (!((ids.has("nivel") && p.preguntas.find((q) => q.id === "nivel").opciones || []).some((o) => o.id === n))) errores.push("perfil: la pregunta «nivel» debe tener la opción «" + n + "»"); });
  const marcas = p.marcas || {};
  const ids_marca = ((p.preguntas.find((q) => q.id === "marca") || {}).opciones || []).map((o) => o.id);
  ids_marca.forEach((m) => MARCAS_MODO.forEach((k) => { if (!esTexto((marcas[m] || {})[k])) errores.push("perfil.marcas." + m + "." + k + ": falta el nombre del modo"); }));
  if (!marcas.desconocida) errores.push("perfil.marcas.desconocida: falta (se usa cuando no se sabe la marca)");
}

function validarRecetas(config, errores) {
  const r = config.recetas || {};
  const c = r.comun;
  if (!esObjeto(c)) { errores.push("recetas/comun.json: falta o no es un objeto"); return; }
  const avisos = c.avisos || {};
  const gl = config.glosario || {};
  Object.keys(gl).forEach((k) => { if (!esTexto(gl[k].termino) || !esTexto(gl[k].texto)) errores.push("glosario." + k + ": faltan «termino» y «texto»"); });
  const revisar = (texto, donde) => {
    const abiertos = (texto.match(/\[\[/g) || []).length;
    if (abiertos !== terminosEn(texto).length) errores.push(donde + ": hay un término del glosario mal escrito (debe ser [[id|texto]])");
    terminosEn(texto).forEach((t) => { if (!gl[t]) errores.push(donde + ": cita el término «" + t + "», que no está en glosario.json"); });
  };
  Object.keys(avisos).forEach((k) => { if (!esTexto(avisos[k])) errores.push("recetas/comun.avisos." + k + ": falta el texto"); else revisar(avisos[k], "recetas/comun.avisos." + k); });
  (c.soloCamara || []).forEach((k) => { if (!esTexto(avisos[k])) errores.push("recetas/comun.soloCamara: «" + k + "» no es un aviso de recetas/comun.json"); });
  ["pregunta", "si", "no"].forEach((k) => { if (!esTexto((c.tripodeHoy || {})[k])) errores.push("recetas/comun.tripodeHoy." + k + ": falta el texto"); });
  ["pasos", "nota", "avisos", "segunSemaforo"].forEach((k) => { if (!esTexto((c.titulos || {})[k])) errores.push("recetas/comun.titulos." + k + ": falta el texto"); });

  ((config.indice || {}).orden || []).forEach((id) => {
    const g = r[id];
    const d = "recetas/" + id;
    if (!esObjeto(g)) { errores.push(d + ".json: el género «" + id + "» no tiene receta en data/recetas/"); return; }
    (g.avisos || []).forEach((a) => { if (!esTexto(avisos[a])) errores.push(d + ".avisos: «" + a + "» no existe en recetas/comun.json"); });
    ["verde", "ambar", "rojo"].forEach((k) => { if (!esTexto((g.segunSemaforo || {})[k])) errores.push(d + ".segunSemaforo." + k + ": falta el texto"); });
    if (!Array.isArray(g.variantes) || !g.variantes.length) { errores.push(d + ".variantes: debe haber al menos una"); return; }
    const ultima = g.variantes[g.variantes.length - 1];
    g.variantes.forEach((v, i) => {
      const a = d + ".variantes[" + i + "]";
      if (!esTexto(v.id)) errores.push(a + ".id: falta");
      if (!esTexto(v.titulo)) errores.push(a + ".titulo: falta el texto");
      if (!esObjeto(v.si)) errores.push(a + ".si: falta (condiciones sobre el perfil)");
      if (!Array.isArray(v.pasos) || !v.pasos.length) { errores.push(a + ".pasos: debe haber al menos uno"); return; }
      v.pasos.forEach((p, j) => {
        if (!esTexto(p.titulo)) errores.push(a + ".pasos[" + j + "].titulo: falta el texto");
        NIVELES_USUARIO.forEach((n) => {
          if (!esTexto(p[n])) errores.push(a + ".pasos[" + j + "]." + n + ": falta el texto para este nivel");
          else revisar(p[n], a + ".pasos[" + j + "]." + n);
        });
      });
      if (v.nota !== undefined) { if (!esTexto(v.nota)) errores.push(a + ".nota: debe ser un texto"); else revisar(v.nota, a + ".nota"); }
    });
    // Las variantes se prueban en orden: la última debe valer para una cámara o un móvil cualquiera
    if (esObjeto(ultima) && esObjeto(ultima.si) && ultima.si.equipo !== "camara") {
      errores.push(d + ".variantes: la última debe ser la general de cámara (si: {equipo: camara}) para que siempre haya receta");
    }
    if (!g.variantes.some((v) => esObjeto(v.si) && v.si.equipo === "movil" && Object.keys(v.si).length === 1)) {
      errores.push(d + ".variantes: falta una variante para móvil (si: {equipo: movil})");
    }
  });
}

// Devuelve una lista de errores en español (vacía si todo está bien)
function validar(config) {
  const errores = [];
  if (!esObjeto(config)) return ["No hay datos que validar"];
  validarComun(config.comun, errores);

  const idx = config.indice || {};
  if (!Array.isArray(idx.orden) || !idx.orden.length) {
    errores.push("generos.json: «orden» debe ser una lista con al menos un género");
    return errores;
  }
  idx.orden.forEach((id) => { if (!esObjeto((config.generos || {})[id])) errores.push("generos.json: el género «" + id + "» no tiene archivo en data/generos/"); });
  if (!idx.orden.includes(idx.porDefecto)) errores.push("generos.json: «porDefecto» debe ser uno de los géneros de «orden»");
  if (!esNumero(idx.nocheDespuesPuestaMin) || idx.nocheDespuesPuestaMin < 0) errores.push("generos.json: «nocheDespuesPuestaMin» debe ser un número de minutos (desde cuándo se considera de noche)");
  if (!idx.orden.includes(idx.porDefectoDeNoche)) errores.push("generos.json: «porDefectoDeNoche» debe ser uno de los géneros de «orden»");

  idx.orden.forEach((id) => {
    const g = (config.generos || {})[id];
    if (!esObjeto(g)) return;
    const d = "generos/" + id;
    if (g.id !== id) errores.push(d + ".id: debe ser «" + id + "» (como el nombre del archivo)");
    validarComunesGenero(g, d, errores);
    if (g.motor === "puntos-ventana") validarPuntosVentana(g, d, errores);
    if (g.motor === "mejor-hora-nocturna") validarNocturno(g, d, errores);
  });
  validarPerfil(config.perfil, errores);
  validarRecetas(config, errores);
  return errores;
}

export { validar, MOTORES, EVENTOS, CAMPOS, NIVELES_LLUVIA, FASES };
