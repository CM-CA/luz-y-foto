<script>
  import { ruta } from "./estado/ruta.svelte.js";
  import Hoy from "./pantallas/Hoy.svelte";
  import AvisoVersion from "./componentes/AvisoVersion.svelte";
</script>

<main>
  <AvisoVersion />

  {#if ruta.actual === "hoy"}
    <Hoy />
  {:else}
    <div class="pagina">
      <h1>No encuentro esa pantalla</h1>
      <p><a href="#/hoy">Volver a Hoy</a></p>
    </div>
  {/if}
</main>
