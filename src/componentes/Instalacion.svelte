<script>
  import { instalacion, instalar, diagnosticar, comoApp } from "../estado/instalacion.svelte.js";
  import { version } from "../estado/version.svelte.js";

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
  <summary>Instalar la app y uso sin conexión</summary>

  {#if instalacion.instalada || comoApp()}
    <p>Ya estás usando la app instalada.</p>
  {:else if instalacion.evento}
    <p>Tu navegador permite instalarla ahora.</p>
    <button type="button" data-accion="instalar" onclick={instalar}>Instalar la app</button>
  {:else}
    <p>Si tu navegador no te ofrece instalarla, búscalo en su menú (⋮ o ≡): «Instalar aplicación», «Añadir a pantalla de inicio» o «Añadir página a» y luego «Pantalla de inicio». Con la app instalada y guardada en el dispositivo, abre sin conexión y enseña la última previsión.</p>
  {/if}

  <h4>Estado de esta instalación</h4>
  {#if informe}
    <ul class="informe" data-testid="informe-instalacion">
      {#each informe as l}
        <li data-estado={l.estado}><span class="marca" aria-hidden="true">{l.marca}</span> {l.texto}</li>
      {/each}
    </ul>
  {:else}
    <p>Comprobando…</p>
  {/if}
</details>
