<script>
  import { hoy, reintentar } from "../estado/hoy.svelte.js";
  import { t } from "../idioma/index.js";
</script>

{#if hoy.sinConexion}
  <div class="aviso-sin-conexion" role="status" data-testid="aviso-sin-conexion">
    <p><strong>{t("sinConexion.titulo")}</strong> {t("sinConexion.resto", { cuando: hoy.sinConexion.cuando, hace: hoy.sinConexion.hace })}</p>
    <button type="button" data-accion="reintentar" onclick={reintentar} disabled={hoy.consultando}>
      {hoy.consultando ? t("sinConexion.reintentando") : t("sinConexion.reintentar")}
    </button>
  </div>
{/if}
