<script>
  import { onMount } from "svelte";
  import { config } from "../estado/datos.js";
  import { listaDeLecciones, etiquetaMinutos } from "../nucleo/lecciones.js";
  import SelectorIdioma from "../componentes/SelectorIdioma.svelte";

  // La lista de lecciones, agrupadas, con lo justo para elegir: título, duración y de qué va.
  const indice = config.lecciones.indice;
  const grupos = listaDeLecciones(config);
  let titulo = $state();

  onMount(() => { window.scrollTo(0, 0); titulo.focus(); });
</script>

<div class="pagina">
  <h1 class="apr-titulo" tabindex="-1" bind:this={titulo}>{indice.titulo}</h1>
  <p class="apr-meta">{indice.subtitulo}</p>

  {#each grupos as g (g.id)}
    <h3>{g.titulo}</h3>
    <p class="subtitulo">{g.subtitulo}</p>
    <ol class="lecciones">
      {#each g.lecciones as l (l.id)}
        <li>
          <a href="#/aprender/{l.id}">
            <span class="lec-t">{l.titulo}</span>
            <span class="lec-min">{etiquetaMinutos(config, l.minutos)}</span>
            <span class="lec-r">{l.resumen}</span>
          </a>
        </li>
      {/each}
    </ol>
  {/each}

  <SelectorIdioma />
</div>
