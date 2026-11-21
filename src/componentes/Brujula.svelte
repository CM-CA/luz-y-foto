<script>
  import { orientacion, hayBrujula, encender, apagar, montar, desmontar } from "../estado/orientacion.svelte.js";
  import { puntoCardinal } from "../nucleo/astro.js";
  import { unida } from "../nucleo/formato.js";
  import Flecha from "./Flecha.svelte";

  // La brújula de un panel: la flecha y, al lado, lo que escribe el panel (en `children`: la dirección, la altura…). El dibujo es
  // un apoyo: todo lo que dice está también en el texto. Debajo, el botón de la brújula del móvil: encendida, la flecha gira
  // con el móvil (cuando apunta hacia arriba, el móvil mira al objetivo). Sin sensor o sin permiso queda la flecha fija.
  let { az, children } = $props();

  const disponible = hayBrujula();
  const encendida = $derived(orientacion.estado === "pidiendo" || orientacion.estado === "activa");
  const viva = $derived(orientacion.estado === "activa" && orientacion.rumbo !== null);
  const mirando = $derived(viva ? { palabra: unida(puntoCardinal(orientacion.rumbo)), grados: Math.round(orientacion.rumbo) % 360 } : null);

  $effect(() => {
    montar();
    // Con la página escondida se deja de escuchar el sensor
    const alCambiarVisibilidad = () => { if (document.visibilityState === "hidden") apagar(); };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => { document.removeEventListener("visibilitychange", alCambiarVisibilidad); desmontar(); };
  });
</script>

<div class="brujula-bloque">
  <div class="brujula">
    <Flecha {az} rumbo={viva ? orientacion.rumbo : null} />
    <div class="brujula-texto">{@render children?.()}</div>
  </div>
  {#if disponible}
    <div class="brujula-viva">
      <button type="button" id="brujulaMovil" class="enlace" onclick={() => (encendida ? apagar() : encender())}>{encendida ? "Dejar de usar la brújula del móvil" : "Usar la brújula del móvil"}</button>
      {#if orientacion.estado === "pidiendo"}
        <p>Buscando la brújula del móvil…</p>
      {:else if mirando}
        <p>Estás mirando al <strong>{mirando.palabra}</strong> ({mirando.grados}°).</p>
        <p class="nota">Cuando la flecha apunte hacia arriba, estás mirando hacia allí. La brújula del móvil puede desviarse 10–20°: gira el móvil en un ocho para calibrarla.</p>
      {:else if orientacion.estado === "sinPermiso"}
        <p>Sin permiso para la brújula. Puedes darlo en los ajustes del navegador.</p>
      {:else if orientacion.estado === "sinSensor"}
        <p>Este dispositivo no da la brújula.</p>
      {/if}
    </div>
  {/if}
</div>
