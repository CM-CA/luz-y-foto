<script>
  import { S } from "../estado/datos.js";
  import { hoy } from "../estado/hoy.svelte.js";
  import * as Astro from "../nucleo/astro.js";
  import { evaluarDia } from "../nucleo/dias.js";
  import { hm, pct, unida } from "../nucleo/formato.js";
  import Veredicto from "./Veredicto.svelte";
  import Avisos from "./Avisos.svelte";
  import Receta from "./Receta.svelte";
  import Flecha from "./Flecha.svelte";
  import Barra from "./Barra.svelte";
  import Plantilla from "./Plantilla.svelte";

  // Género de «puntos en una ventana de horas» (atardecer): nota por factores y capas de nubes
  let { g, item } = $props();

  const r = $derived(evaluarDia({ S, g, prev: hoy.prev, item, lat: hoy.lat, lon: hoy.lon, ahora: hoy.ahora }));
  const sol = $derived(Astro.calcularDia(new Date(item.fecha + "T12:00:00"), hoy.lat, hoy.lon).sol);
  const alAmanecer = $derived(g.evento === "amanecer");
  const az = $derived(alAmanecer ? sol.azAmanecer : sol.azPuesta);
  const palabra = $derived(alAmanecer ? sol.palabraAmanecer : sol.palabraPuesta);
  const horaSol = (d) => hm(d && d.getTime());
</script>

{#if !r}
  <p>No hay previsión para esa hora todavía.</p>
{:else}
  <p class="subtitulo"><Plantilla texto={g.textoEvento} valores={{ hora: hm(item.evento), dorada: horaSol(sol.horaDorada), finAzul: horaSol(sol.finHoraAzul) }} negrita={["hora"]} /></p>
  <Veredicto nivel={r.nivel} titulo={r.titulo} nota="{r.total} de 100 puntos" texto={r.resumen} />
  <Avisos lista={r.avisos} />
  <Receta {g} nivel={r.nivel} />
  <div class="brujula">
    <Flecha {az} />
    <p><Plantilla texto={g.textoBrujula} valores={{ direccion: unida(palabra), grados: Math.round(az) }} negrita={["direccion"]} /></p>
  </div>

  <h3>Qué pesa en la nota</h3>
  <table>
    <thead><tr><th>Factor</th><th>Qué significa</th><th class="num">Puntos</th></tr></thead>
    <tbody>
      {#each r.factores as f}
        <tr><td>{f.etiqueta} ({f.nivel ? f.valor.toFixed(1) + " mm/h" : pct(f.valor)})</td><td>{f.frase}</td><td class="num">{f.puntos} / {f.max}</td></tr>
      {/each}
      <tr class="total"><td colspan="2">Total</td><td class="num">{r.total} / 100</td></tr>
    </tbody>
  </table>

  <h3>Capas de nubes</h3>
  <div class="capas">
    <Barra etiqueta="Bajas" valor={r.capas.bajas} color="var(--barra-baja)" />
    <Barra etiqueta="Medias" valor={r.capas.medias} color="var(--barra-media)" />
    <Barra etiqueta="Altas" valor={r.capas.altas} color="var(--barra-alta)" />
  </div>

  <h3>Horas analizadas</h3>
  <table class="horas">
    <thead><tr><th>Hora</th><th class="num">Bajas</th><th class="num">Medias</th><th class="num">Altas</th><th class="num">mm/h</th><th class="num">Prob.</th><th class="num">Visib. km</th></tr></thead>
    <tbody>
      {#each r.horas as x}
        <tr>
          <td>{hm(x.t)}</td>
          <td class="num" data-label="Bajas">{pct(x.bajas)}</td>
          <td class="num" data-label="Medias">{pct(x.medias)}</td>
          <td class="num" data-label="Altas">{pct(x.altas)}</td>
          <td class="num" data-label="mm/h">{x.lluvia.toFixed(1)}</td>
          <td class="num" data-label="Prob.">{pct(x.prob)}</td>
          <td class="num" data-label="Visib. km">{x.vis.toFixed(0)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
