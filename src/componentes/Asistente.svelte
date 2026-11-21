<script>
  import { config } from "../estado/datos.js";
  import { hoy, elegirOpcion, accionAsistente } from "../estado/hoy.svelte.js";
  import * as Perfil from "../nucleo/perfil.js";

  // Asistente del equipo: una pregunta por pantalla, con bienvenida la primera vez
  const bienvenida = config.perfil.bienvenida;
  const a = $derived(hoy.asistente);
  const visibles = $derived(Perfil.preguntasVisibles(config.perfil, hoy.perfil));
  const q = $derived(a && a.paso >= 0 ? visibles[a.paso] : null);
  const actual = $derived(q ? (q.multiple ? hoy.perfil[q.id] : [hoy.perfil[q.id]]) : []);
  const marcada = $derived(q ? hoy.perfil.respondidas.includes(q.id) : false);

  let caja = $state();

  // Al abrirse, se lleva a la vista
  $effect(() => { if (a && caja) caja.scrollIntoView({ block: "nearest" }); });

  // El título de cada pantalla recibe el foco, para que un lector de pantalla lo anuncie
  const enfocar = (nodo) => nodo.focus();
</script>

<section class="asistente" id="asistente" aria-live="polite" hidden={!a} bind:this={caja}>
  {#if a && a.paso < 0}
    <h2 tabindex="-1" use:enfocar>{bienvenida.titulo}</h2>
    <p class="ayuda">{bienvenida.texto}</p>
    <div class="acciones">
      <button type="button" class="enlace" data-asis="saltar-todo" onclick={() => accionAsistente("saltar-todo")}>{bienvenida.saltar}</button>
      <button type="button" class="principal" data-asis="empezar" onclick={() => accionAsistente("empezar")}>{bienvenida.empezar}</button>
    </div>
  {:else if a && q}
    {#key a.paso}
      <p class="paso">Pregunta {a.paso + 1} de {visibles.length}</p>
      <h2 tabindex="-1" use:enfocar>{q.titulo}</h2>
      {#if q.ayuda}<p class="ayuda">{q.ayuda}</p>{/if}
      <div class="opciones" role="group" aria-label={q.titulo}>
        {#each q.opciones as o}
          <button type="button" data-op={o.id} aria-pressed={marcada && actual.includes(o.id)} onclick={() => elegirOpcion(o.id)}>{o.texto}</button>
        {/each}
      </div>
      <div class="acciones">
        <button type="button" class="enlace" data-asis="atras" hidden={a.paso === 0 && !a.conBienvenida} onclick={() => accionAsistente("atras")}>← Atrás</button>
        <span class="derecha">
          <button type="button" class="enlace" data-asis="saltar" onclick={() => accionAsistente("saltar")}>Saltar</button>
          {#if q.multiple}<button type="button" class="principal" data-asis="siguiente" onclick={() => accionAsistente("siguiente")}>Siguiente</button>{/if}
        </span>
      </div>
    {/key}
  {/if}
</section>
