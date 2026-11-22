<script>
  import { instalacion, instalar, diagnosticar, comoApp } from "../estado/instalacion.svelte.js";
  import { version } from "../estado/version.svelte.js";
  import { t } from "../idioma/index.js";

  let abierto = $state(false);
  let informe = $state(null);
  let pedido = 0; // si se pide un informe nuevo mientras se prepara otro, solo vale el último

  // Con el panel abierto, el informe se rehace cuando cambia algo que cuenta (el service worker termina de instalarse, el navegador ofrece instalar…)
  $effect(() => {
    version.sw.estado; version.sw.version; version.sw.detalle; instalacion.evento; instalacion.instalada;
    if (!abierto) return;
    const mio = ++pedido;
    diagnosticar().then((l) => { if (mio === pedido) informe = l; });
  });
</script>

<details class="instalar" id="instalar" ontoggle={(e) => { abierto = e.currentTarget.open; }}>
  <summary>{t("instalacion.titulo")}</summary>

  {#if instalacion.instalada || comoApp()}
    <p>{t("instalacion.yaInstalada")}</p>
  {:else if instalacion.evento}
    <p>{t("instalacion.permite")}</p>
    <button type="button" data-accion="instalar" onclick={instalar}>{t("instalacion.instalar")}</button>
  {:else}
    <p>{t("instalacion.manual")}</p>
  {/if}

  <h4>{t("instalacion.estado")}</h4>
  {#if informe}
    <ul class="informe" data-testid="informe-instalacion">
      {#each informe as l}
        <li data-estado={l.estado}><span class="marca" aria-hidden="true">{l.marca}</span> {l.texto}</li>
      {/each}
    </ul>
  {:else}
    <p>{t("instalacion.comprobando")}</p>
  {/if}
</details>
