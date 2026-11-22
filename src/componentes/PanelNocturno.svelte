<script>
  import { S } from "../estado/datos.js";
  import { hoy } from "../estado/hoy.svelte.js";
  import { evaluarDia, lunaDe } from "../nucleo/dias.js";
  import { indiceFaseLuna } from "../nucleo/cielo.js";
  import { LUNAS } from "../imagenes/cielos.js";
  import { hm, pct, unida } from "../nucleo/formato.js";
  import { puntoCardinal } from "../nucleo/astro.js";
  import { t, locale } from "../idioma/index.js";
  import { momentoDeLaLuna, punos } from "../nucleo/rumbo.js";
  import Veredicto from "./Veredicto.svelte";
  import Avisos from "./Avisos.svelte";
  import Brujula from "./Brujula.svelte";
  import Plantilla from "./Plantilla.svelte";
  import Receta from "./Receta.svelte";

  // Género de «mejor hora de la noche» (luna): fase, salida y puesta, y las horas con la luna alta
  let { g, item } = $props();

  const lunaDia = $derived(lunaDe(item, hoy.lat, hoy.lon));
  const fase = $derived(g.fases[lunaDia.faseId]);
  const enCurso = $derived(item.inicio <= hoy.ahora);
  const r = $derived(evaluarDia({ S, g, prev: hoy.prev, item, lat: hoy.lat, lon: hoy.lon, ahora: hoy.ahora }));
  const conHoras = $derived(r.nivel !== "ninguno" && !r.sinUtiles);
  const nota = $derived(conHoras ? t("nocturno.nota", { hora: hm(r.mejorHora), nubes: pct(r.nubes) }) : fase.nombre);
  const fecha = $derived(new Date(item.fecha + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "long" }));

  // La brújula: a qué momento de la noche apunta la flecha (ahora, la mejor hora, el anochecer o la salida de la luna). «Ahora» es el
  // reloj del dispositivo, no la hora de la previsión, y se recalcula cada minuto mientras el panel está en pantalla.
  let reloj = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => { reloj = Date.now(); }, 60000);
    return () => clearInterval(id);
  });
  const momento = $derived(momentoDeLaLuna({ inicio: item.inicio, fin: item.fin, ahora: reloj, mejorHora: conHoras ? r.mejorHora : null, lat: hoy.lat, lon: hoy.lon }));
  const nPunos = $derived(momento ? punos(momento.alt) : 0);
  const textoAltura = $derived(nPunos === 0 ? g.brujula.alturaBaja : nPunos === 1 ? g.brujula.alturaUnPuno : g.brujula.altura);
</script>

<p class="subtitulo">{t(enCurso ? "nocturno.nocheEnCurso" : "nocturno.noche", { fecha })}</p>
<Veredicto nivel={r.nivel} titulo={r.titulo} {nota} texto={r.resumen} />
<Avisos lista={r.avisos} />
{#if momento}
  <Brujula az={momento.az}>
    <p><Plantilla texto={g.brujula.texto} valores={{ direccion: unida(puntoCardinal(momento.az)), grados: Math.round(momento.az) }} negrita={["direccion"]} /></p>
    <p><Plantilla texto={textoAltura} valores={{ altura: Math.round(momento.alt), punos: nPunos }} /></p>
    <p><Plantilla texto={g.brujula.momentos[momento.tipo]} valores={{ hora: hm(momento.t) }} negrita={["hora"]} /></p>
  </Brujula>
{/if}
<Receta {g} nivel={r.nivel} />
<div class="luna-cab">
  <img class:sur={hoy.lat < 0} src={LUNAS[indiceFaseLuna(lunaDia.fase)]} alt="" width="66" height="66">
  <p><span class="luna-nombre">{fase.nombre}</span><span class="luna-detalle">{t(lunaDia.creciente ? "nocturno.iluminadaCreciente" : "nocturno.iluminadaMenguante", { pct: pct(lunaDia.fraccion * 100) })}</span></p>
</div>
<dl class="sale">
  <dt>{t("nocturno.sale")}</dt>
  <dd>{#if lunaDia.sale}{hm(lunaDia.sale.getTime())}<small>{t("nocturno.haciaEl", { direccion: unida(lunaDia.palabraSale) })}</small>{:else}—<small>{t("nocturno.noSale")}</small>{/if}</dd>
  <dt>{t("nocturno.sePone")}</dt>
  <dd>{#if lunaDia.seSitua}{hm(lunaDia.seSitua.getTime())}<small>{t(lunaDia.seSituaAlDiaSiguiente ? "nocturno.madrugadaHaciaEl" : "nocturno.haciaEl", { direccion: unida(lunaDia.palabraSeSitua) })}</small>{:else}—{/if}</dd>
</dl>
<p class="consejo">{fase.consejo}</p>
{#if conHoras}
  <h3>{t("panel.quePesa")}</h3>
  <table>
    <tbody>
      <tr><td>{t("nocturno.nubesMejorHora", { nubes: pct(r.nubes) })}</td><td>{r.fraseNubes}</td></tr>
      <tr><td>{t("nocturno.lluvia", { mm: r.lluvia.toFixed(1) })}</td><td>{r.fraseLluvia}</td></tr>
      <tr><td>{t("nocturno.lunaAlta")}</td><td>{t("nocturno.entreLas", { desde: hm(r.primera), hasta: hm(r.ultima) })}</td></tr>
    </tbody>
  </table>
  <h3>{t("nocturno.horasLunaAlta")}</h3>
  <table class="horas" style="--columnas: 2">
    <thead><tr><th>{t("tabla.hora")}</th><th class="num">{t("tabla.nubes")}</th><th class="num">{t("tabla.mmh")}</th><th class="num">{t("tabla.prob")}</th><th class="num">{t("tabla.visib")}</th></tr></thead>
    <tbody>
      {#each r.horas as x}
        <tr class:mejor={x.t === r.mejorHora}>
          <td>{hm(x.t)}</td>
          <td class="num" data-label={t("tabla.nubes")}>{pct(x.total)}</td>
          <td class="num" data-label={t("tabla.mmh")}>{x.lluvia.toFixed(1)}</td>
          <td class="num" data-label={t("tabla.prob")}>{pct(x.prob)}</td>
          <td class="num" data-label={t("tabla.visib")}>{x.vis.toFixed(0)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
