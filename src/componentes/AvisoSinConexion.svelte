<script>
  import { hoy, reintentar } from "../estado/hoy.svelte.js";
</script>

{#if hoy.sinConexion}
  <div class="aviso-sin-conexion" role="status" data-testid="aviso-sin-conexion">
    <p><strong>No he podido actualizar la previsión.</strong> Te enseño la que guardé {hoy.sinConexion.cuando} ({hoy.sinConexion.hace}); puede haber cambiado.</p>
    <button type="button" data-accion="reintentar" onclick={reintentar} disabled={hoy.consultando}>
      {hoy.consultando ? "Reintentando…" : "Reintentar"}
    </button>
  </div>
{/if}
