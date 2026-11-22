<script>
  import { onMount } from "svelte";
  import { config } from "../estado/datos.js";
  import { leccionPorId, etiquetaMinutos, etiquetaPara } from "../nucleo/lecciones.js";
  import ConTerminos from "../componentes/ConTerminos.svelte";

  // Una lección: sus bloques en orden. Cada tipo de bloque tiene su sitio abajo; los textos admiten términos del glosario tocables.
  let { id } = $props();

  const etiquetas = config.lecciones.indice.etiquetas;
  const leccion = $derived(leccionPorId(config, id));
  let titulo = $state();

  onMount(() => { window.scrollTo(0, 0); titulo.focus(); });
</script>

<div class="pagina">
  <a class="volver" href="#/aprender">{etiquetas.volver}</a>

  {#if !leccion}
    <h1 class="apr-titulo" tabindex="-1" bind:this={titulo}>{etiquetas.noExiste}</h1>
  {:else}
    <h1 class="apr-titulo" tabindex="-1" bind:this={titulo}>{leccion.titulo}</h1>
    <p class="leccion-meta apr-meta">{etiquetaMinutos(config, leccion.minutos)} · {etiquetaPara(config, leccion.para)}</p>

    {#each leccion.bloques as b}
      {#if b.tipo === "subtitulo"}
        <h3 class="bloque-subtitulo"><ConTerminos texto={b.texto} /></h3>
      {:else if b.tipo === "parrafo"}
        <p class="bloque-parrafo"><ConTerminos texto={b.texto} /></p>
      {:else if b.tipo === "lista"}
        <ul class="bloque-lista">
          {#each b.items as item}<li><ConTerminos texto={item} /></li>{/each}
        </ul>
      {:else if b.tipo === "idea"}
        <aside class="idea bloque-idea">
          <span class="rotulo">{etiquetas.ideaClave}</span>
          <p><ConTerminos texto={b.texto} /></p>
        </aside>
      {:else if b.tipo === "pruebalo"}
        <aside class="pruebalo bloque-pruebalo">
          <span class="rotulo">{etiquetas.pruebalo}</span>
          <p><ConTerminos texto={b.texto} /></p>
        </aside>
      {/if}
    {/each}
  {/if}
</div>
