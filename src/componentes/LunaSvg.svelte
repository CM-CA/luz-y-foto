<script>
  // Fase de la luna (0 a 1). En el hemisferio sur (`sur`) la parte iluminada queda del lado contrario.
  let { fase, sur = false } = $props();

  const r = 34;
  const c = $derived(Math.cos(2 * Math.PI * fase));
  const rx = $derived((r * Math.abs(c)).toFixed(2));
  const luz = $derived(`M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${c > 0 ? 0 : 1} 0 ${-r} Z`);
  const izquierda = $derived((fase < 0.5) === !!sur);
</script>

<svg width="72" height="72" viewBox="-36 -36 72 72" role="img" aria-label="Fase de la luna">
  <circle {r} fill="var(--luna-sombra)" stroke="var(--borde)" />
  <path d={luz} fill="var(--luna-luz)" transform={izquierda ? "scale(-1,1)" : ""} />
</svg>
