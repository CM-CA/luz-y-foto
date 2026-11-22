/*
 * Las sugerencias de ciudades mientras se escribe, sin tocar la pantalla: espera a que se deje de teclear, busca solo con
 * letras suficientes, cancela la petición anterior y descarta las respuestas que llegan tarde. Quien lo usa le da la
 * búsqueda y qué hacer con lo que llega (así se prueba con un reloj falso y sin red).
 *
 *   buscar(q, senal)      -> Promise<resultados>; `senal` es una AbortSignal que se aborta si la respuesta ya no hace falta
 *   alVaciar()            se llama al escribir menos de `minimo` letras (no hay nada que sugerir)
 *   alRecibir(res, q)     solo con la respuesta de la última búsqueda lanzada
 *
 * Los fallos de `buscar` no llegan a nadie: una sugerencia que no sale no es un error para quien está escribiendo
 * (la búsqueda explícita, con Intro o con la lupa, sí avisa).
 */
export const MINIMO_LETRAS = 3;
export const ESPERA_MS = 400;

export function crearSugeridor({ buscar, alVaciar, alRecibir, espera = ESPERA_MS, minimo = MINIMO_LETRAS }) {
  let reloj = null;     // la espera que corre desde la última tecla
  let control = null;   // la petición en vuelo
  let vigente = 0;      // cambia con cada tecla y con cada cancelación: lo que lleve otro número ya no vale

  function anular() {
    vigente++;
    if (reloj !== null) { clearTimeout(reloj); reloj = null; }
    if (control) { control.abort(); control = null; }
  }

  function escribir(texto) {
    anular();
    const q = String(texto).trim();
    if (q.length < minimo) { alVaciar(); return; }
    const mia = vigente;
    reloj = setTimeout(async () => {
      reloj = null;
      const esta = new AbortController();
      control = esta;
      try {
        const resultados = await buscar(q, esta.signal);
        if (mia === vigente) { control = null; alRecibir(resultados, q); }
      } catch (e) { /* cancelada o fallida: sin aviso */ }
    }, espera);
  }

  return { escribir, cancelar: anular };
}
