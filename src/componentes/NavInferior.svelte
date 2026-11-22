<script>
  import { ruta } from "../estado/ruta.svelte.js";
  import { config } from "../estado/datos.js";
  import { analizarRuta } from "../nucleo/rutas.js";
  import { t } from "../idioma/index.js";

  // La barra de abajo, en todas las pantallas: Hoy y Aprender (que sigue activo dentro de una lección).
  const pantalla = $derived(analizarRuta(ruta.actual).pantalla);
</script>

<nav class="nav-inferior" aria-label={t("nav.secciones")}>
  <a href="#/hoy" aria-current={pantalla === "hoy" ? "page" : undefined}>
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>
    <span>{t("nav.hoy")}</span>
  </a>
  <a href="#/aprender" aria-current={pantalla === "aprender" || pantalla === "leccion" ? "page" : undefined}>
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.6c3-1.2 6-1.1 9 .9 3-2 6-2.1 9-.9v13c-3-1.2-6-1.1-9 .9-3-2-6-2.1-9-.9z"/><path d="M12 6.5v13"/></svg>
    <span>{config.lecciones.indice.titulo}</span>
  </a>
</nav>
