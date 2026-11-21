<script>
  import { ruta } from "./estado/ruta.svelte.js";
  import Hoy from "./pantallas/Hoy.svelte";
  import AvisoVersion from "./componentes/AvisoVersion.svelte";

  // El aviso solo sale en la vista previa (publicada en /beta/), no en la versión definitiva
  const esVistaPrevia = import.meta.env.BASE_URL.endsWith("/beta/");
  // Dirección de la versión actual (la web de la raíz), para poder compararlas en la vista previa
  const versionActual = import.meta.env.BASE_URL + "../prueba/hoy.html";
</script>

<main>
  {#if esVistaPrevia}
    <div class="aviso-beta" data-testid="aviso-beta">
      <p>Vista previa de la nueva versión, en construcción. <a href={versionActual}>Ir a la versión actual</a></p>
    </div>
  {/if}

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
