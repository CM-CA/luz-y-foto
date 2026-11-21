<script>
  import { SIMBOLO } from "../nucleo/niveles.js";
  import Medidor from "./Medidor.svelte";

  // El semáforo: nivel (verde, ambar, rojo o ninguno), título, nota corta y explicación.
  // `puntos` (de 0 a 100) añade el medidor de puntos; solo lo lleva el atardecer, la luna no puntúa.
  let { nivel, titulo, nota, texto, puntos = null } = $props();
</script>

<div class="veredicto {nivel}">
  <div class="titulo"><i>{SIMBOLO[nivel]}</i> {titulo}</div>
  <div class="nota">{nota}</div>
  {#if Number.isFinite(puntos)}<Medidor valor={puntos} color="currentColor" />{/if}
  <p>{texto}</p>
</div>
