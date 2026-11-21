<script>
  // Brújula con una flecha que apunta al azimut indicado (grados desde el norte)
  let { az } = $props();
</script>

<svg width="64" height="64" viewBox="-32 -32 64 64" role="img" aria-label="Dirección: {Math.round(az)} grados desde el norte">
  <circle r="29" fill="none" stroke="var(--borde)" stroke-width="2" />
  <text y="-19" text-anchor="middle" font-size="9" fill="var(--suave)">N</text>
  <g transform="rotate({az.toFixed(1)})"><path d="M0 -22 L7 6 L0 1 L-7 6 Z" fill="var(--ambar)" /></g>
</svg>
