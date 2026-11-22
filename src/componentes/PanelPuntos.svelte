<script>
  import { S } from "../estado/datos.js";
  import { hoy } from "../estado/hoy.svelte.js";
  import * as Astro from "../nucleo/astro.js";
  import { evaluarDia, fechaLugar } from "../nucleo/dias.js";
  import { hm, pct, unida } from "../nucleo/formato.js";
  import { franja } from "../nucleo/franja.js";
  import { t } from "../idioma/index.js";
  import Veredicto from "./Veredicto.svelte";
  import Avisos from "./Avisos.svelte";
  import Receta from "./Receta.svelte";
  import Brujula from "./Brujula.svelte";
  import LuzDeHoy from "./LuzDeHoy.svelte";
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
  // «La luz de hoy» (la franja de la hora dorada a la hora azul) solo tiene sentido en un género con puesta de sol y cuando
  // se conocen las tres horas; en cualquier otro caso queda la línea de texto de siempre.
  const ms = (d) => d ? d.getTime() : null;
  const luz = $derived(g.evento === "puesta"
    ? franja({ dorada: ms(sol.horaDorada), puesta: item.evento, azul: ms(sol.finHoraAzul), ahora: hoy.ahora, esHoy: item.fecha === fechaLugar(hoy.ahora, hoy.prev) })
    : null);
</script>

{#if !r}
  <p>{t("puntos.sinPrevision")}</p>
{:else}
  {#if !luz}<p class="subtitulo"><Plantilla texto={g.textoEvento} valores={{ hora: hm(item.evento), dorada: horaSol(sol.horaDorada), finAzul: horaSol(sol.finHoraAzul) }} negrita={["hora"]} /></p>{/if}
  <Veredicto nivel={r.nivel} titulo={r.titulo} nota={t("puntos.nota", { total: r.total })} puntos={r.total} texto={r.resumen} />
  <Avisos lista={r.avisos} />
  {#if luz}<LuzDeHoy {item} {sol} {luz} />{/if}
  <Brujula {az}>
    <p><Plantilla texto={g.textoBrujula} valores={{ direccion: unida(palabra), grados: Math.round(az) }} negrita={["direccion"]} /></p>
  </Brujula>
  <Receta {g} nivel={r.nivel} />

  <h3>{t("panel.quePesa")}</h3>
  <table>
    <thead><tr><th>{t("puntos.factor")}</th><th>{t("puntos.queSignifica")}</th><th class="num">{t("puntos.puntos")}</th></tr></thead>
    <tbody>
      {#each r.factores as f}
        <tr><td>{f.etiqueta} ({f.nivel ? f.valor.toFixed(1) + " " + t("tabla.mmh") : pct(f.valor)})</td><td>{f.frase}</td><td class="num">{f.puntos} / {f.max}</td></tr>
      {/each}
      <tr class="total"><td colspan="2">{t("puntos.total")}</td><td class="num">{r.total} / 100</td></tr>
    </tbody>
  </table>

  <h3>{t("puntos.capasNubes")}</h3>
  <div class="capas">
    <Barra etiqueta={t("tabla.bajas")} valor={r.capas.bajas} color="var(--barra-baja)" />
    <Barra etiqueta={t("tabla.medias")} valor={r.capas.medias} color="var(--barra-media)" />
    <Barra etiqueta={t("tabla.altas")} valor={r.capas.altas} color="var(--barra-alta)" />
  </div>

  <h3>{t("puntos.horasAnalizadas")}</h3>
  <table class="horas">
    <thead><tr><th>{t("tabla.hora")}</th><th class="num">{t("tabla.bajas")}</th><th class="num">{t("tabla.medias")}</th><th class="num">{t("tabla.altas")}</th><th class="num">{t("tabla.mmh")}</th><th class="num">{t("tabla.prob")}</th><th class="num">{t("tabla.visib")}</th></tr></thead>
    <tbody>
      {#each r.horas as x}
        <tr>
          <td>{hm(x.t)}</td>
          <td class="num" data-label={t("tabla.bajas")}>{pct(x.bajas)}</td>
          <td class="num" data-label={t("tabla.medias")}>{pct(x.medias)}</td>
          <td class="num" data-label={t("tabla.altas")}>{pct(x.altas)}</td>
          <td class="num" data-label={t("tabla.mmh")}>{x.lluvia.toFixed(1)}</td>
          <td class="num" data-label={t("tabla.prob")}>{pct(x.prob)}</td>
          <td class="num" data-label={t("tabla.visib")}>{x.vis.toFixed(0)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
