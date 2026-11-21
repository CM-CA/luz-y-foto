<script>
  // El semáforo: nivel (verde, ambar, rojo o ninguno), título, nota corta y explicación
  let { nivel, titulo, nota, texto } = $props();

  const SIMBOLO = { verde: "●", ambar: "▲", rojo: "■", ninguno: "○" };
</script>

<div class="veredicto {nivel}">
  <div class="titulo">{SIMBOLO[nivel]} {titulo}</div>
  <div class="nota">{nota}</div>
  <p>{texto}</p>
</div>
