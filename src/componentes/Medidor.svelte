<script>
  // Barra horizontal con un porcentaje (de 0 a 100): el relleno de las capas de nubes y el medidor de puntos del veredicto.
  //
  // El relleno lleva el color como fondo y TAMBIÉN como texto (bloques «█» recortados al ancho de la barra). Los
  // navegadores que oscurecen las webs por su cuenta (probado en el de un móvil Android) aplastan los fondos casi
  // hasta el negro, pero respetan el color del texto: así la barra se ve en cualquier caso. Donde no oscurecen nada,
  // los dos colores coinciden y no se nota. La barra es solo visual (aria-hidden): el valor está siempre en un texto aparte.
  let { valor, color } = $props();

  const bloques = "█".repeat(120);
  const ancho = $derived(Math.min(100, Math.max(0, Math.round(Number(valor) || 0))));
</script>

<div class="barra" aria-hidden="true"><span style:width="{ancho}%" style:background={color} style:color={color}>{bloques}</span></div>
