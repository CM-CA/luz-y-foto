<script>
  import { onMount } from "svelte";
  import { hoy, arrancar } from "../estado/hoy.svelte.js";
  import Cabecera from "../componentes/Cabecera.svelte";
  import SelectorLugar from "../componentes/SelectorLugar.svelte";
  import Asistente from "../componentes/Asistente.svelte";
  import Pestanas from "../componentes/Pestanas.svelte";
  import Dias from "../componentes/Dias.svelte";
  import Panel from "../componentes/Panel.svelte";
  import Reglas from "../componentes/Reglas.svelte";
  import Instalacion from "../componentes/Instalacion.svelte";
  import SelectorIdioma from "../componentes/SelectorIdioma.svelte";
  import PildoraAviso from "../componentes/PildoraAviso.svelte";
  import { crudo } from "../idioma/index.js";
  import { trozosDePlantilla } from "../nucleo/formato.js";
  import AvisoSinConexion from "../componentes/AvisoSinConexion.svelte";

  onMount(() => { arrancar(); });
</script>

<Cabecera />

<div class="cuerpo">
  <SelectorLugar />
  <Asistente />

  <Pestanas />
  <Dias />
  <AvisoSinConexion />
  <Panel />

  <Reglas />
  <Instalacion />
  <SelectorIdioma />

  <p class="pie">{#each trozosDePlantilla(crudo("hoy.pie"), { enlace: "Open-Meteo" }, ["enlace"]) as tr}{#if tr.negrita}<a href="https://open-meteo.com/">{tr.texto}</a>{:else}{tr.texto}{/if}{/each}</p>
  <PildoraAviso />
</div>
