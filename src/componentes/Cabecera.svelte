<script>
  import { hoy, generoActual, itemActual, resultadoActual } from "../estado/hoy.svelte.js";
  import { elegirCielo, indiceFaseLuna } from "../nucleo/cielo.js";
  import { lunaDe } from "../nucleo/dias.js";
  import { CIELOS, LUNAS } from "../imagenes/cielos.js";
  import { t } from "../idioma/index.js";
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
  const sur = $derived(hoy.lat < 0);

  // Cuando cambia el momento del día (la pestaña) o el semáforo del día elegido, el cielo no salta: el nuevo ya está debajo y
  // el anterior, con su luna, se queda encima como una «escena anterior» que se funde (la CSS lo anima) y se retira al acabar.
  // Así la luna nueva aparece al descubrirse la noche y la vieja se va con su cielo. Con «menos movimiento» no hay nada de esto.
  const DURACION_MS = 900;
  const sinMovimiento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ultima = { cielo, luna, sur };
  let anterior = $state(null);
  let reloj;
  $effect(() => {
    const nueva = { cielo, luna, sur };
    const previa = ultima;
    if (previa.cielo === nueva.cielo && previa.luna === nueva.luna && previa.sur === nueva.sur) return;
    ultima = nueva;
    clearTimeout(reloj);
    if (sinMovimiento()) { anterior = null; return; }
    anterior = previa;
    reloj = setTimeout(() => { anterior = null; }, DURACION_MS);
  });
  $effect(() => () => clearTimeout(reloj));

  // Los otros cielos se piden con calma, ya cargada la pantalla, para que el primer cambio no espere a la imagen (pesan 3-7 KB)
  $effect(() => {
    const id = setTimeout(() => { Object.values(CIELOS).forEach((src) => { new Image().src = src; }); }, 1000);
    return () => clearTimeout(id);
  });
</script>

<header class="cabecera" data-cielo={cielo}>
  <img class="cielo" src={CIELOS[cielo]} alt="" width="780" height="524" fetchpriority="high">
  {#if luna}<img class="luna-cielo" class:sur src={luna} alt="" width="64" height="64">{/if}
  {#if anterior}
    <div class="escena-anterior" data-cielo={anterior.cielo} aria-hidden="true">
      <img class="fondo" src={CIELOS[anterior.cielo]} alt="" width="780" height="524">
      {#if anterior.luna}<img class="luna-anterior" class:sur={anterior.sur} src={anterior.luna} alt="" width="64" height="64">{/if}
    </div>
  {/if}
  <div class="fila">
    <div class="rotulo">
      <h1>{t("app.nombre")}</h1>
      <p id="estado" role="status" aria-live="polite">{hoy.estado}</p>
    </div>
    <Lugar />
  </div>
</header>
