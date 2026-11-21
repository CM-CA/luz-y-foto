<script>
  import { hoy, alternarSelector } from "../estado/hoy.svelte.js";
</script>

<!-- La pastilla del lugar, sobre el cielo. Al pulsarla se abre el selector (SelectorLugar), justo debajo de la cabecera. -->
<button type="button" id="cambiar" class="lugar" aria-expanded={hoy.selectorAbierto} aria-controls="selector" onclick={alternarSelector}><span id="nombreLugar">{hoy.nombreLugar}</span><span class="solo-lector"> (cambiar lugar)</span><span class="flecha" aria-hidden="true">▾</span></button>
