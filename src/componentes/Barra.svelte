<script>
  import { pct } from "../nucleo/formato.js";

  // Barra horizontal con el porcentaje de una capa de nubes.
  //
  // El relleno lleva el color como fondo y TAMBIÉN como texto (bloques «█» recortados al ancho de la barra). Los
  // navegadores que oscurecen las webs por su cuenta (probado en el de un móvil Android) aplastan los fondos casi
  // hasta el negro, pero respetan el color del texto: así la barra se ve en cualquier caso. Donde no oscurecen nada,
  // los dos colores coinciden y no se nota. La barra es solo visual (aria-hidden): el valor está en el texto de al lado.
  let { etiqueta, valor, color } = $props();

  const bloques = "█".repeat(120);
</script>

<div class="capa">
  <span>{etiqueta}</span>
  <div class="barra" aria-hidden="true"><span style:width="{Math.round(valor)}%" style:background={color} style:color={color}>{bloques}</span></div>
  <span class="valor">{pct(valor)}</span>
</div>
