<script>
  import { hoy, generoActual, itemActual, resultadoActual } from "../estado/hoy.svelte.js";
  import { elegirCielo, indiceFaseLuna } from "../nucleo/cielo.js";
  import { lunaDe } from "../nucleo/dias.js";
  import { CIELOS, LUNAS } from "../imagenes/cielos.js";
  import Lugar from "./Lugar.svelte";

  // El cielo depende de la pestaña y del semáforo del día elegido. Mientras no hay previsión se decide por la hora del dispositivo.
  // Los cielos de noche llevan la luna de la noche elegida, con su fase real (si esa noche no tiene datos, no hay luna).
  const cielo = $derived(elegirCielo({
    motor: generoActual()?.motor ?? null,
    evento: generoActual()?.evento ?? null,
    nivel: resultadoActual()?.nivel ?? null,
    hora: new Date(hoy.ahora || Date.now()).getHours()
  }));
  const item = $derived(itemActual());
  const luna = $derived(cielo.startsWith("noche") && item && generoActual()?.motor === "mejor-hora-nocturna" ? LUNAS[indiceFaseLuna(lunaDe(item, hoy.lat, hoy.lon).fase)] : null);
</script>

<header class="cabecera" data-cielo={cielo}>
  <img class="cielo" src={CIELOS[cielo]} alt="" width="780" height="524" fetchpriority="high">
  {#if luna}<img class="luna-cielo" class:sur={hoy.lat < 0} src={luna} alt="" width="64" height="64">{/if}
  <div class="fila">
    <div class="rotulo">
      <h1>Luz y foto</h1>
      <p id="estado" role="status" aria-live="polite">{hoy.estado}</p>
    </div>
    <Lugar />
  </div>
</header>
