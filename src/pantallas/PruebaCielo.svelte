<script>
  // TEMPORAL: página de prueba para ver cuál de dos maneras de dibujar el cielo se ve bien en el móvil.
  // Opción 1: el dibujo (SVG) va dentro de la página. Opción 4: el mismo dibujo, ya convertido en imagen.
  // Se borra en cuanto se elija.
  import { onMount } from "svelte";
  import { ESCENAS } from "../pruebas/escenas.js";
  import tarde from "../pruebas/cielo-tarde.webp";
  import cubierto from "../pruebas/cielo-cubierto.webp";
  import noche from "../pruebas/cielo-noche.webp";

  const imagenes = { tarde, cubierto, noche };
  let tema = $state("");
  onMount(() => { tema = matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro"; });
</script>

<h1>Prueba del cielo</h1>
<p class="intro">Cada cielo está dibujado de dos maneras, una debajo de la otra. Compáralas con la imagen de la propuesta que te envié: ¿se ven con el mismo degradado y los mismos colores, o alguna sale más apagada, más oscura o plana?</p>
<p class="suave">Tu navegador dice que usa el tema {tema || "…"}.</p>

{#each ESCENAS as e}
  <h2>{e.nombre}</h2>
  <p class="etiqueta">Opción 1 · dibujo dentro de la página</p>
  <div class="cielo-prueba">
    {@html e.svg}
    <div class="rotulo"><span class="nombre">Luz y foto</span><span class="lugar-prueba">Vigo, Galicia</span></div>
  </div>
  <p class="etiqueta">Opción 4 · imagen</p>
  <div class="cielo-prueba">
    <img src={imagenes[e.id]} alt="" width="390" height="262">
    <div class="rotulo"><span class="nombre">Luz y foto</span><span class="lugar-prueba">Vigo, Galicia</span></div>
  </div>
{/each}

<style>
  h2 { font-size: 1.15rem; margin: 28px 0 4px; }
  .etiqueta { margin: 10px 0 6px; font-weight: 700; }
  .cielo-prueba { position: relative; height: 262px; border-radius: 22px; overflow: hidden; }
  .cielo-prueba :global(svg), .cielo-prueba img { display: block; width: 100%; height: 100%; }
  .cielo-prueba img { object-fit: cover; object-position: center bottom; }
  .rotulo { position: absolute; left: 20px; right: 16px; top: 22px; display: flex; justify-content: space-between; align-items: flex-start; color: #fff; }
  .nombre { font: 700 1.5rem/1 Georgia, serif; text-shadow: 0 1px 10px rgba(20, 15, 50, .4); }
  .lugar-prueba { font-weight: 700; font-size: .9rem; padding: 8px 12px; border-radius: 999px; background: rgba(18, 16, 48, .38); }
</style>
