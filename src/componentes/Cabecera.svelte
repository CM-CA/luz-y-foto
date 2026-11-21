<script>
  import { hoy, generoActual, resultadoActual } from "../estado/hoy.svelte.js";
  import { elegirCielo } from "../nucleo/cielo.js";
  import { CIELOS } from "../imagenes/cielos.js";
  import Lugar from "./Lugar.svelte";

  // El cielo depende de la pestaña y del semáforo del día elegido. Mientras no hay previsión se decide por la hora del dispositivo.
  const cielo = $derived(elegirCielo({
    motor: generoActual()?.motor ?? null,
    nivel: resultadoActual()?.nivel ?? null,
    hora: new Date(hoy.ahora || Date.now()).getHours()
  }));
</script>

<header class="cabecera" data-cielo={cielo}>
  <img class="cielo" src={CIELOS[cielo]} alt="" width="780" height="524" fetchpriority="high">
  <div class="fila">
    <div class="rotulo">
      <h1>Luz y foto</h1>
      <p id="estado" role="status" aria-live="polite">{hoy.estado}</p>
    </div>
    <Lugar />
  </div>
</header>
