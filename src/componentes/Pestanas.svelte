<script>
  import { config } from "../estado/datos.js";
  import { hoy, elegirPestana } from "../estado/hoy.svelte.js";
</script>

<div class="pestanas" id="tabs" role="tablist" aria-label="Qué fotografiar">
  {#each config.indice.orden as id}
    <button role="tab" id="tab-{id}" aria-selected={hoy.pestana === id} data-tab={id} onclick={() => elegirPestana(id)}>{config.generos[id].nombre}</button>
  {/each}
</div>
