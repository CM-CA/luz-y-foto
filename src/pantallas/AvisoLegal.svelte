<script>
  import { onMount } from "svelte";
  import { t } from "../idioma/index.js";
  import { version } from "../version.js";
  // Los avisos de licencia de lo que va dentro de la app: los mismos archivos que hay en el repositorio, incluidos al compilar
  import suncalc from "../../licencias/SUNCALC-LICENSE.txt?raw";
  import svelte from "../../licencias/SVELTE-LICENSE.txt?raw";
  import vite from "../../licencias/VITE-LICENSE.txt?raw";
  import figtree from "../fuentes/LICENCIA-figtree.txt?raw";
  import youngSerif from "../fuentes/LICENCIA-young-serif.txt?raw";

  // «Aviso legal»: la versión de la app, de quién es, con qué licencias se publica, el uso y la responsabilidad, la privacidad (qué se guarda y a quién
  // llega algo), lo que lleva dentro (cada cosa con el texto completo de su licencia, que pide conservar el aviso) y los créditos de los datos. Las
  // licencias de lo de dentro son textos legales en inglés y no se traducen. No hay dirección, NIF ni correo del titular: se le escribe por GitHub.
  let titulo = $state();
  onMount(() => { window.scrollTo(0, 0); titulo.focus(); });

  const dentro = [
    { nombre: "SunCalc", licencia: "BSD-2-Clause", uso: t("aviso.suncalc"), texto: suncalc },
    { nombre: "Svelte", licencia: "MIT", uso: t("aviso.svelte"), texto: svelte },
    { nombre: "Vite", licencia: "MIT", uso: t("aviso.vite"), texto: vite },
    { nombre: "Figtree", licencia: "SIL OFL 1.1", uso: t("aviso.figtree"), texto: figtree },
    { nombre: "Young Serif", licencia: "SIL OFL 1.1", uso: t("aviso.youngSerif"), texto: youngSerif }
  ];
</script>

<div class="pagina aviso">
  <a class="volver" href="#/hoy">{t("aviso.volver")}</a>
  <h1 class="apr-titulo" tabindex="-1" bind:this={titulo}>{t("aviso.titulo")}</h1>
  <p class="aviso-numero">{t("aviso.version", { version: version.completa })}</p>

  <h2>{t("aviso.titularTitulo")}</h2>
  <p class="bloque-parrafo">{t("aviso.titular")} <a href="https://github.com/CM-CA/ollada/issues">{t("aviso.incidencia")}</a>.</p>

  <h2>{t("aviso.licenciasTitulo")}</h2>
  <p class="bloque-parrafo">{t("aviso.propia")}</p>
  <ul class="bloque-lista">
    <li>{t("aviso.codigo")} <a href="https://polyformproject.org/licenses/noncommercial/1.0.0">PolyForm Noncommercial 1.0.0</a></li>
    <li>{t("aviso.contenido")} <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a></li>
    <li>{t("aviso.marca")}</li>
  </ul>
  <p class="bloque-parrafo">{t("aviso.comercial")} <a href="https://github.com/CM-CA/ollada/issues">{t("aviso.pedir")}</a>.</p>
  <p class="bloque-parrafo"><a href="https://github.com/CM-CA/ollada">{t("aviso.repo")}</a></p>

  <h2>{t("aviso.usoTitulo")}</h2>
  <p class="bloque-parrafo">{t("aviso.uso1")}</p>
  <p class="bloque-parrafo">{t("aviso.uso2")}</p>

  <h2>{t("aviso.privacidadTitulo")}</h2>
  <p class="bloque-parrafo">{t("aviso.priv1")}</p>
  <p class="bloque-parrafo">{t("aviso.priv2")}</p>
  <p class="bloque-parrafo">{t("aviso.priv3")}</p>
  <p class="bloque-parrafo">{t("aviso.priv4")}</p>
  <ul class="bloque-lista">
    <li>{t("aviso.privOpenMeteo")} <a href="https://open-meteo.com/en/terms">{t("aviso.privCondiciones")}</a></li>
    <li>{t("aviso.privOsm")} <a href="https://operations.osmfoundation.org/policies/nominatim/">{t("aviso.privCondiciones")}</a></li>
    <li>{t("aviso.privGithub")}</li>
  </ul>

  <h2>{t("aviso.dentroTitulo")}</h2>
  <p class="bloque-parrafo">{t("aviso.dentro")}</p>
  {#each dentro as d (d.nombre)}
    <details class="licencia">
      <summary>{d.nombre} <small>{d.licencia} · {d.uso}</small></summary>
      <pre>{d.texto}</pre>
    </details>
  {/each}

  <h2>{t("aviso.datosTitulo")}</h2>
  <ul class="bloque-lista">
    <li>{t("aviso.prevision")} <a href="https://open-meteo.com/">Open-Meteo (CC BY 4.0)</a></li>
    <li>{t("aviso.lugares")} <a href="https://www.openstreetmap.org/copyright">{t("aviso.osm")}</a> (ODbL)</li>
  </ul>
</div>
