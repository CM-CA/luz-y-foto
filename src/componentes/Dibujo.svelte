<script>
  import { config } from "../estado/datos.js";
  import { DIBUJOS } from "../dibujos/index.js";

  // Un dibujo de una lección, pintado como SVG dentro de la página con los textos del idioma activo (data/<idioma>/dibujos.json). Los colores
  // salen de las variables --dibujo-* de estilos/base.css (un solo dibujo sirve para el tema claro y el oscuro). Para un lector de pantalla es una
  // imagen con el texto alternativo del bloque; todo lo que dice el dibujo está también en ese texto y en el pie.
  let { id, alt } = $props();
  const dibujo = $derived(DIBUJOS[id]);
  const svg = $derived(dibujo ? dibujo.pintar(config.dibujos[id]) : "");
</script>

{#if dibujo}
  <div class="dibujo-svg" role="img" aria-label={alt}>{@html svg}</div>
{/if}
