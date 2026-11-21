<script>
  import { config } from "../estado/datos.js";
  import { partes } from "../nucleo/recetas.js";

  // Texto con términos del glosario tocables. Al tocar uno se abre su definición justo debajo, dentro
  // del mismo párrafo o elemento de lista; tocarlo otra vez la cierra, y tocar otro cambia de definición.
  let { texto } = $props();

  let abierto = $state(null);
  const definicion = $derived(abierto && config.glosario[abierto]);

  const alternar = (id) => { abierto = abierto === id ? null : id; };
</script>

{#each partes(texto) as p}{#if p.id}<button type="button" class="termino" data-t={p.id} onclick={() => alternar(p.id)}>{p.etiqueta}</button>{:else}{p.texto}{/if}{/each}{#if definicion}<span class="def" data-id={abierto} role="note"><strong>{definicion.termino}.</strong> {definicion.texto}</span>{/if}
