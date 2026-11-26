<script module>
  // Un número por simulador pintado: los ids de los filtros del dibujo no se pueden repetir en la página
  let siguiente = 0;
</script>

<script>
  import { idioma } from "../idioma/index.js";
  import {
    LUCES, INICIO, pasos, veredicto, factorDeLuz, desenfoqueFondo, desenfoqueMovimiento, intensidadGrano,
    nivelFondo, nivelMovimiento, nivelGrano, etiquetaApertura, etiquetaTiempo, etiquetaIso
  } from "../nucleo/simulador.js";

  // El simulador de exposición de una lección: una escena con tres deslizadores (apertura, tiempo e ISO) y la luz de la escena a elegir.
  // La escena se aclara u oscurece con los pasos de luz que sobran o faltan, el fondo se desenfoca con la apertura, la pelota deja estela
  // con el tiempo y el ISO pone grano. Debajo, una lectura en texto (con un signo, no solo el color) dice lo mismo para quien no ve el dibujo.
  // Los textos salen del bloque (data/<idioma>/lecciones/…); los cálculos, de nucleo/simulador.js.
  let { bloque } = $props();
  const t = $derived(bloque.textos);
  const uid = "sim" + siguiente++;

  let luz = $state(INICIO.luz);
  let apertura = $state(INICIO.apertura);
  let tiempo = $state(INICIO.tiempo);
  let iso = $state(INICIO.iso);

  const p = $derived(pasos({ luz, apertura, tiempo, iso }));
  const clave = $derived(veredicto(p));
  const frase = $derived(t.resultado[clave].replace("{n}", String(Math.abs(p))));
  const signo = $derived(p === 0 ? "✓" : (p > 0 ? "+" : "−") + Math.abs(p));
  const separador = $derived(idioma === "es" ? "," : ".");
  const etiquetas = $derived({
    apertura: etiquetaApertura(apertura, separador), tiempo: etiquetaTiempo(tiempo), iso: etiquetaIso(iso)
  });
  const ajustes = $derived([
    { id: "apertura", valor: apertura, texto: t.apertura, etiqueta: etiquetas.apertura },
    { id: "tiempo", valor: tiempo, texto: t.tiempo, etiqueta: etiquetas.tiempo },
    { id: "iso", valor: iso, texto: t.iso, etiqueta: etiquetas.iso }
  ]);
  const efectos = $derived([
    t.fondo[nivelFondo(apertura)], t.movimiento[nivelMovimiento(tiempo)], t.grano[nivelGrano(iso)]
  ]);

  const factor = $derived(factorDeLuz(p));
  const borrosoFondo = $derived(desenfoqueFondo(apertura));
  const borrosoMovimiento = $derived(desenfoqueMovimiento(tiempo));
  const grano = $derived(intensidadGrano(iso));

  const poner = (id, v) => { if (id === "apertura") apertura = v; else if (id === "tiempo") tiempo = v; else iso = v; };
  function reiniciar() { luz = INICIO.luz; apertura = INICIO.apertura; tiempo = INICIO.tiempo; iso = INICIO.iso; }
  const HAY_CAMBIOS = $derived(luz !== INICIO.luz || apertura !== INICIO.apertura || tiempo !== INICIO.tiempo || iso !== INICIO.iso);
</script>

<div class="simulador">
  <div class="sim-escena" role="img" aria-label={bloque.alt}>
    <svg viewBox="0 0 360 200" aria-hidden="true" focusable="false">
      <defs>
        <filter id="{uid}-brillo" x="0" y="0" width="360" height="200" filterUnits="userSpaceOnUse">
          <feComponentTransfer>
            <feFuncR type="linear" slope={factor} />
            <feFuncG type="linear" slope={factor} />
            <feFuncB type="linear" slope={factor} />
          </feComponentTransfer>
        </filter>
        <filter id="{uid}-fondo" x="0" y="0" width="360" height="200" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation={borrosoFondo} />
        </filter>
        <filter id="{uid}-movimiento" x="0" y="0" width="360" height="200" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="{borrosoMovimiento} 0" />
        </filter>
        <filter id="{uid}-grano" x="0" y="0" width="360" height="200" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <g filter="url(#{uid}-brillo)">
        <g filter="url(#{uid}-fondo)">
          <rect width="360" height="200" fill="#a9d4f0" />
          <rect y="70" width="360" height="70" fill="#d8c9a8" />
          <rect x="14" y="58" width="92" height="82" fill="#d9a66f" />
          <path d="M8 60 L60 30 L112 60 Z" fill="#a4553b" />
          <rect x="26" y="78" width="20" height="24" fill="#34506f" />
          <rect x="74" y="78" width="20" height="24" fill="#34506f" />
          <path d="M36 78v24M26 90h20M84 78v24M74 90h20" stroke="#f1e6cf" stroke-width="2" />
          <rect x="250" y="48" width="96" height="92" fill="#c98f8f" />
          <path d="M244 50 L298 22 L352 50 Z" fill="#7c4a52" />
          <rect x="264" y="70" width="20" height="26" fill="#34506f" />
          <rect x="312" y="70" width="20" height="26" fill="#34506f" />
          <path d="M274 70v26M264 83h20M322 70v26M312 83h20" stroke="#f1e6cf" stroke-width="2" />
          <rect x="140" y="62" width="9" height="62" fill="#6b4a2f" />
          <circle cx="144" cy="52" r="28" fill="#3f8a4a" />
          <circle cx="128" cy="64" r="16" fill="#4c9a56" />
          <circle cx="162" cy="62" r="17" fill="#357a40" />
          <path d="M0 120h360" stroke="#5b4630" stroke-width="3" />
          <path d="M0 108h360" stroke="#5b4630" stroke-width="3" />
          <path d="M5 100v40M20 100v40M35 100v40M50 100v40M65 100v40M80 100v40M95 100v40M110 100v40M125 100v40M140 100v40M155 100v40M170 100v40M185 100v40M200 100v40M215 100v40M230 100v40M245 100v40M260 100v40M275 100v40M290 100v40M305 100v40M320 100v40M335 100v40M350 100v40" stroke="#5b4630" stroke-width="4" />
        </g>
        <rect y="140" width="360" height="60" fill="#6fa05a" />
        <path d="M0 170h360" stroke="#5f8f4c" stroke-width="2" />
        <g filter="url(#{uid}-movimiento)">
          <circle cx="210" cy="164" r="15" fill="#e8553a" />
          <path d="M200 156a12 12 0 0 1 16-4" fill="none" stroke="#ffd9c9" stroke-width="3" stroke-linecap="round" />
        </g>
      </g>
      <rect width="360" height="200" filter="url(#{uid}-grano)" opacity={grano} />
    </svg>
  </div>

  <fieldset class="sim-luz">
    <legend>{t.luz}</legend>
    {#each Object.keys(LUCES) as k}
      <label class="sim-opcion"><input type="radio" name="{uid}-luz" value={k} bind:group={luz} /><span>{t.luces[k]}</span></label>
    {/each}
  </fieldset>

  {#each ajustes as a}
    <div class="sim-ajuste">
      <label for="{uid}-{a.id}">{a.texto}</label>
      <output for="{uid}-{a.id}">{a.etiqueta}</output>
      <input id="{uid}-{a.id}" type="range" min="0" max="6" step="1" value={a.valor} aria-valuetext={a.etiqueta}
        oninput={(e) => poner(a.id, Number(e.currentTarget.value))} />
    </div>
  {/each}

  <div class="sim-lectura sim-{clave}">
    <p class="sim-resultado" aria-live="polite" aria-atomic="true"><span class="sim-signo" aria-hidden="true">{signo}</span> <span class="sim-frase">{frase}</span></p>
    <ul class="sim-efectos">
      {#each efectos as e}<li>{e}</li>{/each}
    </ul>
  </div>

  <button type="button" class="sim-reiniciar" onclick={reiniciar} disabled={!HAY_CAMBIOS}>{t.reiniciar}</button>
</div>
