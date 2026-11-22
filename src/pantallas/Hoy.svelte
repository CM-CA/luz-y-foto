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

  <p class="pie">Previsión de <a href="https://open-meteo.com/">Open-Meteo</a> (CC BY 4.0); sol y luna calculados en el dispositivo con SunCalc. La previsión no ve el horizonte: nunca es una garantía. Las horas son las de tu dispositivo. Tu lugar se guarda solo en tu dispositivo; para ponerle nombre se consulta OpenStreetMap con unas coordenadas aproximadas.</p>
</div>
