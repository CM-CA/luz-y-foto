<script>
  import { trozosDePlantilla } from "../nucleo/formato.js";

  // Texto de data/ con huecos {así}: se rellenan con `valores`, y los de `negrita` van en negrita
  let { texto, valores, negrita = [] } = $props();
</script>

{#each trozosDePlantilla(texto, valores, negrita) as t}{#if t.negrita}<strong>{t.texto}</strong>{:else}{t.texto}{/if}{/each}
