<script>
  import Flecha from "./Flecha.svelte";

  // La brújula de un panel: la flecha y, al lado, lo que escribe el panel (en `children`: la dirección, la altura…).
  // El dibujo es un apoyo: todo lo que dice está también en el texto.
  let { az, children } = $props();
</script>

<div class="brujula-bloque">
  <div class="brujula">
    <Flecha {az} />
    <div class="brujula-texto">{@render children?.()}</div>
  </div>
</div>
