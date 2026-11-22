<script>
  import { ruta } from "./estado/ruta.svelte.js";
  import { analizarRuta } from "./nucleo/rutas.js";
  import Hoy from "./pantallas/Hoy.svelte";
  import Aprender from "./pantallas/Aprender.svelte";
  import Leccion from "./pantallas/Leccion.svelte";
  import AvisoVersion from "./componentes/AvisoVersion.svelte";
  import NavInferior from "./componentes/NavInferior.svelte";

  const pantalla = $derived(analizarRuta(ruta.actual));
</script>

<main>
  <AvisoVersion />

  {#if pantalla.pantalla === "hoy"}
    <Hoy />
  {:else if pantalla.pantalla === "aprender"}
    <Aprender />
  {:else if pantalla.pantalla === "leccion"}
    {#key pantalla.id}<Leccion id={pantalla.id} />{/key}
  {:else}
    <div class="pagina">
      <h1>No encuentro esa pantalla</h1>
      <p><a href="#/hoy">Volver a Hoy</a></p>
    </div>
  {/if}
</main>

<NavInferior />
