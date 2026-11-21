<script>
  import { S } from "../estado/datos.js";
  import { hoy } from "../estado/hoy.svelte.js";
  import * as Astro from "../nucleo/astro.js";
  import { evaluarDia } from "../nucleo/dias.js";
  import { hm, pct, unida } from "../nucleo/formato.js";
  import Veredicto from "./Veredicto.svelte";
  import Avisos from "./Avisos.svelte";
  import Receta from "./Receta.svelte";
  import LunaSvg from "./LunaSvg.svelte";

  // Género de «mejor hora de la noche» (luna): fase, salida y puesta, y las horas con la luna alta
  let { g, item } = $props();

  const lunaDia = $derived(Astro.calcularDia(new Date(item.fecha + "T12:00:00"), hoy.lat, hoy.lon).luna);
  const fase = $derived(g.fases[lunaDia.faseId]);
  const enCurso = $derived(item.inicio <= hoy.ahora);
  const r = $derived(evaluarDia({ S, g, prev: hoy.prev, item, lat: hoy.lat, lon: hoy.lon, ahora: hoy.ahora }));
  const conHoras = $derived(r.nivel !== "ninguno" && !r.sinUtiles);
  const nota = $derived(conHoras ? `Mejor hora: ${hm(r.mejorHora)} · nubes ${pct(r.nubes)}` : fase.nombre);
  const fecha = $derived(new Date(item.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" }));
</script>

<p class="subtitulo">{enCurso ? "Noche en curso" : "Noche"} del {fecha}</p>
<Veredicto nivel={r.nivel} titulo={r.titulo} {nota} texto={r.resumen} />
<Avisos lista={r.avisos} />
<Receta {g} nivel={r.nivel} />
<div class="luna-cab">
  <LunaSvg fase={lunaDia.fase} sur={hoy.lat < 0} />
  <p><span class="luna-nombre">{fase.nombre}</span><br>{Math.round(lunaDia.fraccion * 100)} % iluminada, {lunaDia.creciente ? "creciendo" : "menguando"}</p>
</div>
<dl>
  <dt>Sale</dt>
  <dd>{#if lunaDia.sale}{hm(lunaDia.sale.getTime())}<small>hacia el {unida(lunaDia.palabraSale)}</small>{:else}—<small>no sale este día</small>{/if}</dd>
  <dt>Se pone</dt>
  <dd>{#if lunaDia.seSitua}{hm(lunaDia.seSitua.getTime())}<small>{lunaDia.seSituaAlDiaSiguiente ? "ya de madrugada, " : ""}hacia el {unida(lunaDia.palabraSeSitua)}</small>{:else}—{/if}</dd>
</dl>
<p class="consejo">{fase.consejo}</p>
{#if conHoras}
  <h3>Qué pesa en la nota</h3>
  <table>
    <tbody>
      <tr><td>Nubes en la mejor hora ({pct(r.nubes)})</td><td>{r.fraseNubes}</td></tr>
      <tr><td>Lluvia ({r.lluvia.toFixed(1)} mm/h)</td><td>{r.fraseLluvia}</td></tr>
      <tr><td>Luna alta</td><td>Entre las {hm(r.primera)} y las {hm(r.ultima)}</td></tr>
    </tbody>
  </table>
  <h3>Horas con la luna alta</h3>
  <table class="horas" style="--columnas: 2">
    <thead><tr><th>Hora</th><th class="num">Nubes</th><th class="num">mm/h</th><th class="num">Prob.</th><th class="num">Visib. km</th></tr></thead>
    <tbody>
      {#each r.horas as x}
        <tr class:mejor={x.t === r.mejorHora}>
          <td>{hm(x.t)}</td>
          <td class="num" data-label="Nubes">{pct(x.total)}</td>
          <td class="num" data-label="mm/h">{x.lluvia.toFixed(1)}</td>
          <td class="num" data-label="Prob.">{pct(x.prob)}</td>
          <td class="num" data-label="Visib. km">{x.vis.toFixed(0)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
