<script>
  import { config } from "../estado/datos.js";
  import { hoy, abrirAsistente, elegirTripode, resumenEquipo } from "../estado/hoy.svelte.js";
  import * as Perfil from "../nucleo/perfil.js";
  import { construir } from "../nucleo/recetas.js";
  import { leccionPorId, etiquetaMinutos } from "../nucleo/lecciones.js";
  import ConTerminos from "./ConTerminos.svelte";

  // La receta del género elegido, adaptada al equipo y al semáforo de ese día. Lleva el resumen del equipo y el botón para editarlo:
  // el equipo no tiene tarjeta propia. Sin el equipo configurado no se muestra la receta (se invita a configurarlo): una receta
  // de móvil para quien tiene una cámara no sirve.
  let { g, nivel } = $props();

  const T = config.recetas.comun;
  const receta = $derived(construir(config, g.id, Perfil.efectivo(hoy.perfil, hoy.tripodeHoy), nivel));
  // La lección a la que enlaza la receta (solo las de cámara llevan una)
  const leccion = $derived(receta && receta.leccion ? leccionPorId(config, receta.leccion) : null);
  const sinPerfil = $derived(!hoy.perfil || !Perfil.estaConfigurado(hoy.perfil));
  // Para qué nivel está explicada (principiante, medio o experto): el texto de la opción elegida en la pregunta «nivel»
  const nivelDeLaReceta = $derived.by(() => {
    const q = config.perfil.preguntas.find((x) => x.id === "nivel");
    const o = q && q.opciones.find((x) => x.id === hoy.perfil.nivel);
    return o ? (o.resumen || o.texto).toLowerCase() : "";
  });
</script>

{#if sinPerfil}
  <section class="invitacion">
    <p><strong id="resumenEquipo">Sin configurar</strong> · Cuéntame tu equipo para ver la receta de esta salida.</p>
    <button type="button" id="editarEquipo" data-accion="equipo" class="principal" onclick={() => abrirAsistente(false)}>Configurar mi equipo</button>
  </section>
{:else if receta}
  <details class="receta" id="receta" bind:open={hoy.recetaAbierta}>
    <summary>
      <span class="receta-texto">Ver receta · {receta.titulo}<small id="resumenEquipo">{resumenEquipo()}</small>{#if nivelDeLaReceta}<small class="nivel-receta">Explicada para {nivelDeLaReceta}</small>{/if}</span>
    </summary>
    <button type="button" id="editarEquipo" class="enlace" onclick={() => abrirAsistente(false)}>Editar mi equipo</button>
    {#if hoy.perfil.tripode === "aveces"}
      <div class="tripode" role="group" aria-label={T.tripodeHoy.pregunta}>
        <span>{T.tripodeHoy.pregunta}:</span>
        <button type="button" data-tripode="si" aria-pressed={hoy.tripodeHoy === "si"} onclick={() => elegirTripode("si")}>{T.tripodeHoy.si}</button>
        <button type="button" data-tripode="no" aria-pressed={hoy.tripodeHoy !== "si"} onclick={() => elegirTripode("no")}>{T.tripodeHoy.no}</button>
      </div>
    {/if}
    {#if receta.segunSemaforo}
      <p class="consejo"><ConTerminos texto={receta.segunSemaforo} /></p>
    {/if}
    <h3>{T.titulos.pasos}</h3>
    <ol>
      {#each receta.pasos as paso}
        <li><strong>{paso.titulo}.</strong> <ConTerminos texto={paso.texto} /></li>
      {/each}
    </ol>
    {#if leccion}
      <a class="aprende-por-que" href="#/aprender/{leccion.id}">
        <span>
          <span class="apq-t">{config.lecciones.indice.etiquetas.aprendePorQue}</span>
          <span class="apq-s">{leccion.titulo} · <span class="sin-corte">{etiquetaMinutos(config, leccion.minutos)}</span></span>
        </span>
        <span aria-hidden="true">›</span>
      </a>
    {/if}
    {#if receta.nota}
      <p class="consejo"><ConTerminos texto={receta.nota} /></p>
    {/if}
    <h3>{T.titulos.avisos}</h3>
    {#each receta.avisos as aviso}
      <p class="aviso-fijo">⚠ <ConTerminos texto={aviso} /></p>
    {/each}
  </details>
{/if}
