<script>
  import { hoy } from "../estado/hoy.svelte.js";
  import { fechaLugar } from "../nucleo/dias.js";
  import { hm } from "../nucleo/formato.js";
  import { tituloDeLaLuz } from "../nucleo/franja.js";

  // «La luz de hoy»: la franja de la hora dorada a la hora azul, con la puesta en el cambio de color y, si es hoy y estamos
  // dentro, un marcador «●» donde estamos ahora. `luz` es lo que devuelve franja() (el que la usa ya sabe que no es null).
  //
  // Como las barras de nubes, los bloques son texto «█» y el color va en el color del texto, no en un fondo: los navegadores
  // que oscurecen las webs por su cuenta aplastan los fondos pero respetan el texto. La franja es solo visual (aria-hidden);
  // lo que cuenta lo dicen las tres horas de debajo, que son texto normal.
  let { item, sol, luz } = $props();

  const titulo = $derived(tituloDeLaLuz(item.fecha, fechaLugar(hoy.ahora, hoy.prev), fechaLugar(hoy.ahora + 24 * 3600000, hoy.prev)));
  const horaSol = (d) => hm(d && d.getTime());
  const color = (b) => b.tramo === "dia"
    ? `color-mix(in srgb, var(--sol) ${Math.round(b.mezcla)}%, var(--oro))`
    : `color-mix(in srgb, var(--azul-hora) ${Math.round(b.mezcla)}%, var(--violeta))`;
</script>

<section class="luz-de-hoy">
  <h3>{titulo}</h3>
  <div class="franja" aria-hidden="true">
    <div class="bloques">{#each luz.bloques as b}<span style:color={color(b)}>█</span>{/each}</div>
    {#if luz.ahora !== null}<i class="ahora" style:left="{luz.ahora * 100}%">●</i>{/if}
  </div>
  <div class="horas">
    <div><b>{horaSol(sol.horaDorada)}</b>Hora dorada</div>
    <div><b>{hm(item.evento)}</b>Puesta</div>
    <div><b>{horaSol(sol.finHoraAzul)}</b>Hora azul</div>
  </div>
</section>
