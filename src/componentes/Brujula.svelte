<script>
  import { orientacion, hayBrujula, encender, apagar, montar, desmontar } from "../estado/orientacion.svelte.js";
  import { puntoCardinal } from "../nucleo/astro.js";
  import { unida } from "../nucleo/formato.js";
  import { t, crudo } from "../idioma/index.js";
  import Plantilla from "./Plantilla.svelte";
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
      <button type="button" id="brujulaMovil" class="enlace" onclick={() => (encendida ? apagar() : encender())}>{encendida ? t("brujula.dejar") : t("brujula.usar")}</button>
      {#if orientacion.estado === "pidiendo"}
        <p>{t("brujula.buscando")}</p>
      {:else if mirando}
        <p><Plantilla texto={crudo("brujula.mirando")} valores={{ palabra: mirando.palabra, grados: mirando.grados }} negrita={["palabra"]} /></p>
        <p class="nota">{t("brujula.cuandoArriba")}</p>
      {:else if orientacion.estado === "sinPermiso"}
        <p>{t("brujula.sinPermiso")}</p>
      {:else if orientacion.estado === "sinSensor"}
        <p>{t("brujula.sinSensor")}</p>
      {/if}
    </div>
  {/if}
</div>
