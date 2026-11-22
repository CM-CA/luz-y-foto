<script>
  import { version, actualizar } from "../estado/version.svelte.js";
  import { t } from "../idioma/index.js";
</script>

{#if version.nueva}
  <div class="aviso-version" role="status" data-testid="aviso-version">
    <p>{t("version.hay")}</p>
    <button type="button" data-accion="actualizar" onclick={actualizar} disabled={version.actualizando}>
      {version.actualizando ? t("version.actualizando") : t("version.actualizar")}
    </button>
  </div>
{/if}
