<script>
  import { onMount } from "svelte";
  import { hoy, arrancar } from "../estado/hoy.svelte.js";
  import Lugar from "../componentes/Lugar.svelte";
  import Equipo from "../componentes/Equipo.svelte";
  import Asistente from "../componentes/Asistente.svelte";
  import Pestanas from "../componentes/Pestanas.svelte";
  import Dias from "../componentes/Dias.svelte";
  import Panel from "../componentes/Panel.svelte";
  import Reglas from "../componentes/Reglas.svelte";
  import AvisoSinConexion from "../componentes/AvisoSinConexion.svelte";

  onMount(() => { arrancar(); });
</script>

<h1>Hoy</h1>
<p class="intro">¿Merece la pena salir con la cámara? Elige qué quieres fotografiar.</p>

<Lugar />
<Equipo />
<Asistente />
<p id="estado" role="status" aria-live="polite">{hoy.estado}</p>
<AvisoSinConexion />

<Pestanas />
<Dias />
<Panel />

<Reglas />

<p class="pie">Previsión de <a href="https://open-meteo.com/">Open-Meteo</a> (CC BY 4.0); sol y luna calculados en el dispositivo con SunCalc. La previsión no ve el horizonte: nunca es una garantía. Las horas son las de tu dispositivo. Tu lugar se guarda solo en tu dispositivo; para ponerle nombre se consulta OpenStreetMap con unas coordenadas aproximadas.</p>
