<script>
  // Brújula con una flecha que apunta al azimut indicado (grados desde el norte). La dirección también se dice con palabras
  // en el texto de al lado: el dibujo es un apoyo (un navegador que oscurece los SVG por su cuenta no esconde nada).
  // Con `rumbo` (hacia dónde mira el móvil) todo el dial gira al revés, y la flecha queda hacia arriba cuando el móvil mira al
  // objetivo. Sin `rumbo`, el dibujo es el de siempre. No hay transiciones: al pasar de 359° a 1° daría la vuelta entera.
  let { az, rumbo = null } = $props();
  const vivo = $derived(rumbo !== null);
</script>

{#snippet dial()}
  <circle r="29" fill="none" stroke="var(--borde)" stroke-width="3" />
  <text y="-18" text-anchor="middle" font-size="10" font-weight="800" fill="var(--suave)">N</text>
  <g transform="rotate({az.toFixed(1)})">
    <path d="M0 25 L7 6 L0 10 L-7 6 Z" fill="var(--suave)" opacity=".45" />
    <path d="M0 -24 L9 5 L0 -1 L-9 5 Z" fill="var(--ambar-simbolo)" />
  </g>
{/snippet}

<svg width="62" height="62" viewBox="-32 -32 64 64" role={vivo ? undefined : "img"} aria-label={vivo ? undefined : "Dirección: " + Math.round(az) + " grados desde el norte"} aria-hidden={vivo ? "true" : undefined}>
  {#if vivo}
    <g transform="rotate({(-rumbo).toFixed(1)})">{@render dial()}</g>
  {:else}
    {@render dial()}
  {/if}
</svg>
