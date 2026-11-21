<script>
  import { pct } from "../nucleo/formato.js";
  import Medidor from "./Medidor.svelte";

  // Una fila de las capas de nubes: nombre, barra y porcentaje
  let { etiqueta, valor, color } = $props();
</script>

<div class="capa">
  <span>{etiqueta}</span>
  <Medidor {valor} {color} />
  <span class="valor">{pct(valor)}</span>
</div>
