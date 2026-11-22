<script>
  import { S } from "../estado/datos.js";
  import { hoy, generoActual, listaActual, indiceActual, elegirDia } from "../estado/hoy.svelte.js";
  import { etiquetaDia, evaluarDia, numeroDia } from "../nucleo/dias.js";
  import { SIMBOLO } from "../nucleo/niveles.js";
  import { t } from "../idioma/index.js";

  const g = $derived(generoActual());

  // Cada botón lleva el semáforo de su día: un símbolo con el color del nivel (verde ●, ámbar ▲, rojo ■, sin datos ○).
  // El color va en el texto del símbolo, no en el fondo, porque hay navegadores que oscurecen los fondos por su cuenta.
  const dias = $derived(g && hoy.listas ? listaActual().map((x) => {
    const r = evaluarDia({ S, g, prev: hoy.prev, item: x, lat: hoy.lat, lon: hoy.lon, ahora: hoy.ahora });
    return { etiqueta: etiquetaDia(g, x, hoy.prev, hoy.ahora), numero: numeroDia(x), nivel: r ? r.nivel : "ninguno", titulo: r ? r.titulo : t("dias.sinPrevision") };
  }) : []);
</script>

<div class="dias" id="dias" role="group" aria-label={t("dias.etiqueta")}>
  {#each dias as d, i}
    <button type="button" data-i={i} data-nivel={d.nivel} aria-pressed={i === indiceActual()} onclick={() => elegirDia(i)}>
      <span class="cima">
        <span class="marca" aria-hidden="true">{SIMBOLO[d.nivel]}</span>
        <span class="num" aria-hidden="true">{d.numero}</span>
      </span>
      <span class="etq">{d.etiqueta}</span>
      <span class="solo-lector">: {d.titulo}</span>
    </button>
  {/each}
</div>
