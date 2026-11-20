<script>
  import { ruta } from "./estado/ruta.svelte.js";
  import Hoy from "./pantallas/Hoy.svelte";

  // Dirección de la versión actual (la web de la raíz), para poder compararlas en la vista previa
  const versionActual = import.meta.env.BASE_URL + "../prueba/hoy.html";
</script>

<main>
  <p class="aviso" data-testid="aviso-beta">
    Vista previa de la nueva versión, en construcción.
    <a href={versionActual}>Ir a la versión actual</a>
  </p>

  {#if ruta.actual === "hoy"}
    <Hoy />
  {:else}
    <h1>No encuentro esa pantalla</h1>
    <p><a href="#/hoy">Volver a Hoy</a></p>
  {/if}
</main>

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    padding: 1rem 1rem 3rem;
  }

  .aviso {
    margin: 0 0 1rem;
    padding: 0.6rem 0.8rem;
    background: var(--aviso-fondo);
    border: 1px solid var(--aviso-borde);
    border-radius: 0.5rem;
    font-size: 0.9rem;
  }
</style>
