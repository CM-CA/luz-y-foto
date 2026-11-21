<script>
  import { hoy, generoActual, listaActual, indiceActual } from "../estado/hoy.svelte.js";
  import PanelPuntos from "./PanelPuntos.svelte";
  import PanelNocturno from "./PanelNocturno.svelte";

  // Cada motor de cálculo tiene su panel: sirve para cualquier género que use ese motor
  const PANELES = { "puntos-ventana": PanelPuntos, "mejor-hora-nocturna": PanelNocturno };

  const g = $derived(generoActual());
  const lista = $derived(listaActual());
</script>

<section class="panel" id="panel" role="tabpanel" aria-live="polite" hidden={!hoy.vistaLista}>
  {#if hoy.vistaLista && g}
    {#key hoy.pintado}
      {#if lista.length}
        {@const Contenido = PANELES[g.motor]}
        <Contenido {g} item={lista[indiceActual()]} />
      {:else}
        <p>No hay previsión disponible para estos días.</p>
      {/if}
    {/key}
  {/if}
</section>
