<script>
  import { version, actualizar } from "../estado/version.svelte.js";
</script>

{#if version.nueva}
  <div class="aviso-version" role="status" data-testid="aviso-version">
    <p>Hay una versión nueva de Luz y foto.</p>
    <button type="button" data-accion="actualizar" onclick={actualizar} disabled={version.actualizando}>
      {version.actualizando ? "Actualizando…" : "Actualizar"}
    </button>
  </div>
{/if}
