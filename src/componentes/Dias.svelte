<script>
  import { hoy, generoActual, listaActual, indiceActual, elegirDia } from "../estado/hoy.svelte.js";
  import { etiquetaDia } from "../nucleo/dias.js";

  const g = $derived(generoActual());
</script>

<div class="dias" id="dias" role="group" aria-label="Día">
  {#if g && hoy.listas}
    {#each listaActual() as x, i}
      <button type="button" data-i={i} aria-pressed={i === indiceActual()} onclick={() => elegirDia(i)}>{etiquetaDia(g, x, hoy.prev, hoy.ahora)}</button>
    {/each}
  {/if}
</div>
