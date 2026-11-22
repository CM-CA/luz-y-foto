<script>
  import { config, S } from "../estado/datos.js";
  import { t, crudo } from "../idioma/index.js";
  import { trozosDePlantilla } from "../nucleo/formato.js";
</script>

<!-- La explicación sale de los mismos datos que usa el semáforo, así que no puede quedar desfasada -->
<details class="reglas" id="reglas">
  <summary>{t("reglas.titulo")}</summary>
  {#each config.indice.orden as id}
    <h4>{config.generos[id].nombre}</h4>
    <ul>
      {#each S.explicar(id) as linea}
        <li>{linea}</li>
      {/each}
    </ul>
  {/each}
  <p>{#each trozosDePlantilla(crudo("reglas.pie"), { carpeta: "data/" }, ["carpeta"]) as tr}{#if tr.negrita}<code>{tr.texto}</code>{:else}{tr.texto}{/if}{/each}</p>
</details>
