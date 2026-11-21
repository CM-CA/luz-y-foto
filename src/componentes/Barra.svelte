<script>
  import { pct } from "../nucleo/formato.js";

  // Barra horizontal con el porcentaje de una capa de nubes
  let { etiqueta, valor, color } = $props();
</script>

<div class="capa">
  <span>{etiqueta}</span>
  <div class="barra" aria-hidden="true"><span style:width="{Math.round(valor)}%" style:background={color}></span></div>
  <span class="valor">{pct(valor)}</span>
</div>
