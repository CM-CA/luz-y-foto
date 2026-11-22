<script>
  import { config } from "../estado/datos.js";
  import { hoy, elegirPestana } from "../estado/hoy.svelte.js";
  import { t } from "../idioma/index.js";
</script>

<div class="pestanas" class:solapa={!hoy.selectorAbierto && !hoy.asistente} id="tabs" role="tablist" aria-label={t("pestanas.etiqueta")}>
  {#each config.indice.orden as id}
    <button role="tab" id="tab-{id}" aria-selected={hoy.pestana === id} data-tab={id} onclick={() => elegirPestana(id)}>{config.generos[id].nombre}</button>
  {/each}
</div>
