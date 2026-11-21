<script>
  import { config } from "../estado/datos.js";
  import { hoy, abrirAsistente, elegirTripode } from "../estado/hoy.svelte.js";
  import * as Perfil from "../nucleo/perfil.js";
  import { construir } from "../nucleo/recetas.js";
  import ConTerminos from "./ConTerminos.svelte";

  // La receta del género elegido, adaptada al equipo y al semáforo de ese día
  let { g, nivel } = $props();

  const T = config.recetas.comun;
  const receta = $derived(construir(config, g.id, Perfil.efectivo(hoy.perfil, hoy.tripodeHoy), nivel));
  const sinPerfil = $derived(!Perfil.estaConfigurado(hoy.perfil));
</script>

{#if receta}
  <details class="receta" id="receta" bind:open={hoy.recetaAbierta}>
    <summary>Ver receta · {receta.titulo}</summary>
    {#if sinPerfil}
      <p class="suave">Estos consejos son para móvil y nivel «Empiezo». <button type="button" class="enlace" data-accion="equipo" onclick={() => abrirAsistente(false)}>Cuéntame tu equipo</button> para afinarlos.</p>
    {/if}
    {#if hoy.perfil.tripode === "aveces"}
      <div class="tripode" role="group" aria-label={T.tripodeHoy.pregunta}>
        <span>{T.tripodeHoy.pregunta}:</span>
        <button type="button" data-tripode="si" aria-pressed={hoy.tripodeHoy === "si"} onclick={() => elegirTripode("si")}>{T.tripodeHoy.si}</button>
        <button type="button" data-tripode="no" aria-pressed={hoy.tripodeHoy !== "si"} onclick={() => elegirTripode("no")}>{T.tripodeHoy.no}</button>
      </div>
    {/if}
    {#if receta.segunSemaforo}
      <p class="consejo"><ConTerminos texto={receta.segunSemaforo} /></p>
    {/if}
    <h3>{T.titulos.pasos}</h3>
    <ol>
      {#each receta.pasos as paso}
        <li><strong>{paso.titulo}.</strong> <ConTerminos texto={paso.texto} /></li>
      {/each}
    </ol>
    {#if receta.nota}
      <p class="consejo"><ConTerminos texto={receta.nota} /></p>
    {/if}
    <h3>{T.titulos.avisos}</h3>
    {#each receta.avisos as aviso}
      <p class="aviso-fijo">⚠ <ConTerminos texto={aviso} /></p>
    {/each}
  </details>
{/if}
