<script>
  import { hoy, alternarSelector, usarGps, buscar, elegirResultado } from "../estado/hoy.svelte.js";

  let texto = $state("");
</script>

<div class="lugar">
  <div><span class="etq">Lugar</span><strong id="nombreLugar">{hoy.nombreLugar}</strong></div>
  <button type="button" id="cambiar" aria-expanded={hoy.selectorAbierto} aria-controls="selector" onclick={alternarSelector}>Cambiar</button>
</div>
<section class="selector" id="selector" hidden={!hoy.selectorAbierto}>
  <p id="msgLugar" role="status" aria-live="polite">{hoy.mensajeLugar}</p>
  <button type="button" class="principal" id="gps" onclick={() => usarGps(false)}>Usar mi ubicación</button>
  <form id="buscar" role="search" onsubmit={(ev) => { ev.preventDefault(); buscar(texto); }}>
    <input id="ciudad" type="search" placeholder="Ciudad o pueblo" aria-label="Buscar ciudad o pueblo" autocomplete="off" bind:value={texto}>
    <button type="submit">Buscar</button>
  </form>
  <ul id="resultados">
    {#each hoy.resultados as x, i}
      <li><button type="button" data-i={i} onclick={() => elegirResultado(i)}>{x.nombre}<small>{x.detalle}</small></button></li>
    {/each}
  </ul>
</section>
