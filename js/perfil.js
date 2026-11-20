/*
 * Perfil de equipo: respuestas del usuario (móvil/cámara, marca, objetivos, trípode, nivel).
 * Las preguntas, opciones y valores por defecto están en data/perfil.json; aquí solo hay lógica.
 *
 * Si el usuario se salta las preguntas se usan los valores por defecto, y `respondidas` queda
 * vacío: así la pantalla sabe que el perfil aún no está configurado y puede invitarle a hacerlo.
 * Un perfil es un objeto simple y todas las funciones devuelven copias (no modifican el original).
 */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Perfil = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CLAVE = "luz-y-foto:perfil";

  // localStorage puede no existir o lanzar errores (modo privado, datos bloqueados)
  function almacenPorDefecto() {
    try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; }
  }

  const copiaValor = (v) => (Array.isArray(v) ? v.slice() : v);
  const pregunta = (def, id) => def.preguntas.find((q) => q.id === id);
  const idsDe = (q) => q.opciones.map((o) => o.id);

  function nuevo(def) {
    const p = { respondidas: [] };
    def.preguntas.forEach((q) => { p[q.id] = copiaValor(def.porDefecto[q.id]); });
    return p;
  }

  // Una pregunta con «solo» únicamente se hace si el perfil cumple esas condiciones
  function preguntasVisibles(def, perfil) {
    return def.preguntas.filter((q) => Object.keys(q.solo || {}).every((k) => perfil[k] === q.solo[k]));
  }

  function valido(q, valor) {
    return q.multiple ? Array.isArray(valor) && valor.every((v) => idsDe(q).includes(v)) : idsDe(q).includes(valor);
  }

  // Anota una respuesta y devuelve un perfil nuevo. Si se cambia de cámara a móvil,
  // se olvidan la marca y los objetivos, que ya no tienen sentido.
  function responder(def, perfil, id, valor) {
    const q = pregunta(def, id);
    if (!q) throw new Error("Pregunta desconocida: " + id);
    if (!valido(q, valor)) throw new Error("Respuesta no válida para " + id + ": " + valor);
    const p = Object.assign({}, perfil, { [id]: copiaValor(valor) });
    p.respondidas = perfil.respondidas.includes(id) ? perfil.respondidas.slice() : perfil.respondidas.concat(id);
    const ocultas = def.preguntas.filter((x) => !preguntasVisibles(def, p).includes(x));
    ocultas.forEach((x) => {
      p[x.id] = copiaValor(def.porDefecto[x.id]);
      p.respondidas = p.respondidas.filter((r) => r !== x.id);
    });
    return p;
  }

  const estaConfigurado = (perfil) => perfil.respondidas.length > 0;

  // Reconstruye un perfil desde algo guardado, descartando lo que ya no sea válido
  function normalizar(def, crudo) {
    const p = nuevo(def);
    if (!crudo || typeof crudo !== "object") return p;
    def.preguntas.forEach((q) => {
      const v = crudo[q.id];
      if (q.multiple) { if (Array.isArray(v)) p[q.id] = v.filter((x) => idsDe(q).includes(x)); }
      else if (idsDe(q).includes(v)) p[q.id] = v;
    });
    if (Array.isArray(crudo.respondidas)) p.respondidas = crudo.respondidas.filter((id) => pregunta(def, id));
    return p;
  }

  function cargar(def, almacen) {
    try {
      const a = almacen || almacenPorDefecto();
      const texto = a && a.getItem(CLAVE);
      return normalizar(def, texto ? JSON.parse(texto) : null);
    } catch (e) { return nuevo(def); }
  }

  function guardar(perfil, almacen) {
    try {
      const a = almacen || almacenPorDefecto();
      if (!a) return false;
      a.setItem(CLAVE, JSON.stringify(perfil));
      return true;
    } catch (e) { return false; }
  }

  // ¿Hay algo guardado? Sirve para mostrar la bienvenida solo la primera vez
  function existe(almacen) {
    try {
      const a = almacen || almacenPorDefecto();
      return !!a && a.getItem(CLAVE) !== null && a.getItem(CLAVE) !== undefined;
    } catch (e) { return false; }
  }

  // Perfil «de hoy»: con trípode «a veces», manda el interruptor de la pantalla ("si" o "no")
  function efectivo(perfil, tripodeHoy) {
    const p = Object.assign({}, perfil);
    if (p.tripode === "aveces") p.tripode = tripodeHoy === "si" ? "si" : "no";
    return p;
  }

  // Línea con las respuestas dadas, para la pantalla principal. Vacía si no se ha respondido nada.
  function resumen(def, perfil) {
    return preguntasVisibles(def, perfil).filter((q) => perfil.respondidas.includes(q.id)).map((q) => {
      const valores = q.multiple ? perfil[q.id] : [perfil[q.id]];
      return q.opciones.filter((o) => valores.includes(o.id)).map((o) => o.texto).join(", ");
    }).filter(Boolean).join(" · ");
  }

  return { CLAVE, nuevo, preguntasVisibles, responder, estaConfigurado, normalizar, cargar, guardar, existe, efectivo, resumen };
});
