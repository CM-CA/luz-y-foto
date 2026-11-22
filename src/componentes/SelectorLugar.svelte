<script>
  import { hoy, usarGps, buscar, escribirCiudad, elegirResultado } from "../estado/hoy.svelte.js";

  let texto = $state("");
</script>

<section class="selector" id="selector" hidden={!hoy.selectorAbierto}>
  <p id="msgLugar" role="status" aria-live="polite">{hoy.mensajeLugar}</p>
  <form id="buscar" role="search" onsubmit={(ev) => { ev.preventDefault(); buscar(texto); }}>
    <input id="ciudad" type="search" placeholder="Ciudad o pueblo" aria-label="Buscar ciudad o pueblo" autocomplete="off" bind:value={texto} oninput={(ev) => escribirCiudad(ev.currentTarget.value)}>
    <button type="button" class="icono principal" id="gps" aria-label="Usar mi ubicación" title="Usar mi ubicación" onclick={() => usarGps(false)}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    </button>
    <button type="submit" class="icono" aria-label="Buscar" title="Buscar">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>
      </svg>
    </button>
  </form>
  <ul id="resultados">
    {#each hoy.resultados as x, i}
      <li><button type="button" data-i={i} onclick={() => elegirResultado(i)}>{x.nombre}<small>{x.detalle}</small></button></li>
    {/each}
  </ul>
</section>
