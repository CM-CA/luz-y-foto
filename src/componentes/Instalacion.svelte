<script>
  import { instalacion, instalar, comoApp } from "../estado/instalacion.svelte.js";
  import { t } from "../idioma/index.js";
</script>

<details class="instalar" id="instalar">
  <summary>{t("instalacion.titulo")}</summary>

  {#if comoApp()}
    <p>{t("instalacion.yaInstalada")}</p>
  {:else if instalacion.instalada}
    <p>{t("instalacion.recien")}</p>
  {:else if instalacion.evento}
    <p>{t("instalacion.permite")}</p>
    <button type="button" data-accion="instalar" onclick={instalar}>{t("instalacion.instalar")}</button>
  {:else}
    <p>{t("instalacion.manual")}</p>
  {/if}
</details>
