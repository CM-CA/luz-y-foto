<script>
  let { lista } = $props();
</script>

{#if lista.length}
  <div class="avisos">
    {#each lista as aviso}
      <p>⚠ {aviso}</p>
    {/each}
  </div>
{/if}
