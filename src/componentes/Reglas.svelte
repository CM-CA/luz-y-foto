<script>
  import { config, S } from "../estado/datos.js";
</script>

<!-- La explicación sale de los mismos datos que usa el semáforo, así que no puede quedar desfasada -->
<details class="reglas" id="reglas">
  <summary>Cómo se calcula</summary>
  {#each config.indice.orden as id}
    <h4>{config.generos[id].nombre}</h4>
    <ul>
      {#each S.explicar(id) as linea}
        <li>{linea}</li>
      {/each}
    </ul>
  {/each}
  <p>Con tormenta eléctrica el semáforo nunca es verde y lleva un aviso de seguridad. Los umbrales y los textos están en la carpeta <code>data/</code> del proyecto y son un punto de partida: hay que calibrarlos con salidas reales.</p>
</details>
