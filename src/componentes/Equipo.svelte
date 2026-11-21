<script>
  import { hoy, resumenEquipo, abrirAsistente } from "../estado/hoy.svelte.js";

  // Línea con el equipo del usuario y el botón para cambiarlo
  const resumen = $derived(hoy.perfil ? resumenEquipo() : "…");
</script>

<div class="equipo">
  <div><span class="etq">Mi equipo</span><strong id="resumenEquipo">{hoy.perfil && !resumen ? "Sin configurar" : resumen}</strong></div>
  <button type="button" id="editarEquipo" onclick={() => abrirAsistente(false)}>{hoy.perfil && !resumen ? "Configurar" : "Editar"}</button>
</div>
