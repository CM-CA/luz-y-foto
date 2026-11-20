<script>
  import { datosIncluidos } from "../datos-incluidos.js";

  const datos = datosIncluidos();
  const generos = datos.indice.orden.map((id) => datos.generos[id]);
</script>

<h1>Hoy</h1>
<p class="subtitulo">¿Merece la pena salir con la cámara?</p>

<nav class="pestanas" aria-label="Qué quieres fotografiar">
  {#each generos as genero (genero.id)}
    <button type="button" data-tab={genero.id}>{genero.nombre}</button>
  {/each}
</nav>

<p class="pendiente">
  Aquí irá la pantalla Hoy completa (fase 3 de la migración). Por ahora solo se comprueba que la
  aplicación se compila, se publica en la ruta correcta y lee los datos de <code>data/</code>.
</p>

<style>
  h1 { margin: 0; font-size: 1.6rem; }
  .subtitulo { margin: 0.2rem 0 1rem; color: var(--texto-suave); }

  .pestanas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .pestanas button {
    padding: 0.7rem;
    font: inherit;
    font-weight: 600;
    color: var(--texto);
    background: var(--tarjeta);
    border: 1px solid var(--borde);
    border-radius: 0.6rem;
  }

  .pendiente {
    padding: 0.8rem;
    background: var(--tarjeta);
    border: 1px solid var(--borde);
    border-radius: 0.6rem;
    color: var(--texto-suave);
  }
</style>
