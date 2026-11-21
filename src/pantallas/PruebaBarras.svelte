<script>
  // PÁGINA TEMPORAL de diagnóstico (se borra en cuanto se elija la técnica): dibuja las mismas barras de nubes de
  // siete maneras, para ver cuál se distingue en navegadores que oscurecen las webs por su cuenta.
  const capas = [["Bajas", 60, "var(--barra-baja)"], ["Medias", 100, "var(--barra-media)"], ["Altas", 30, "var(--barra-alta)"]];
  const tecnicas = [
    ["A", "Color de fondo (la que hay ahora)"], ["B", "Elemento progress"], ["C", "Sombra interior"], ["D", "Dibujo SVG"],
    ["E", "Texto (bloques ■)"], ["F", "Degradado"], ["G", "Borde grueso"]
  ];
  const bloques = "█".repeat(80);
</script>

<h1>Prueba de barras</h1>
<p>Cada bloque dibuja las mismas tres barras (60 %, 100 % y 30 %) de una manera distinta. Haz una captura con el modo oscuro de tu navegador y dime qué letras se ven bien.</p>

{#each tecnicas as [letra, nombre]}
  <h2>{letra}. {nombre}</h2>
  <div class="capas">
    {#each capas as [etiqueta, valor, color]}
      <div class="capa">
        <span>{etiqueta}</span>
        {#if letra === "B"}
          <progress value={valor} max="100" style:accent-color={color}></progress>
        {:else}
          <div class="barra" aria-hidden="true">
            {#if letra === "A"}
              <span style:width="{valor}%" style:background={color}></span>
            {:else if letra === "C"}
              <span style:width="{valor}%" style="box-shadow: inset 0 0 0 20px {color}"></span>
            {:else if letra === "D"}
              <svg width="100%" height="100%" viewBox="0 0 100 10" preserveAspectRatio="none"><rect width={valor} height="10" fill={color} /></svg>
            {:else if letra === "E"}
              <span class="texto" style:width="{valor}%" style:color={color}>{bloques}</span>
            {:else if letra === "F"}
              <span style:width="{valor}%" style="background-image: linear-gradient({color}, {color})"></span>
            {:else}
              <span class="borde" style:width="{valor}%" style:border-top-color={color}></span>
            {/if}
          </div>
        {/if}
        <span class="valor">{valor} %</span>
      </div>
    {/each}
  </div>
{/each}

<p><a href="#/hoy">Volver a Hoy</a></p>

<style>
  progress { width: 100%; height: 14px; }
  svg { display: block; }
  .texto { display: block; overflow: hidden; white-space: nowrap; font-size: 14px; line-height: 12px; letter-spacing: -1px; }
  .borde { display: block; height: 0; border-top: 14px solid; }
</style>
