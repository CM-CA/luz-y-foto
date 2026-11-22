<script>
  import { idioma, t } from "../idioma/index.js";
  import { leerEleccion, guardarEleccion } from "../nucleo/idioma.js";

  // El rótulo va en los dos idiomas a propósito, para que quien no lea el que le sale lo encuentre igual; cada idioma va escrito en su idioma.
  const OPCIONES = [
    { valor: "auto", nombre: t("idioma.automatico") },
    { valor: "es", nombre: "Español" },
    { valor: "en", nombre: "English" }
  ];
  const elegida = leerEleccion();
  let sinGuardar = $state(false);

  // La app decide su idioma una sola vez al cargar: guardar la elección y recargar es lo que lo cambia de verdad
  function elegir(valor) {
    if (valor === elegida) return;
    if (guardarEleccion(valor)) location.reload();
    else sinGuardar = true;
  }
</script>

<section class="selector-idioma" lang={idioma}>
  <h3>Idioma / Language</h3>
  <div class="idiomas">
    {#each OPCIONES as o (o.valor)}
      <button type="button" data-idioma={o.valor} aria-pressed={o.valor === elegida} onclick={() => elegir(o.valor)}>{o.nombre}</button>
    {/each}
  </div>
  {#if sinGuardar}
    <p class="suave" role="status">Este navegador no deja guardar la elección. / This browser can't save your choice.</p>
  {/if}
</section>
