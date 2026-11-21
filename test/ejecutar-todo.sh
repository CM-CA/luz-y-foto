#!/usr/bin/env bash
# Ejecuta todas las pruebas del proyecto y termina con error si alguna falla.
#
#   bash test/ejecutar-todo.sh            lógica + navegador (web actual y versión compilada)
#   bash test/ejecutar-todo.sh rapido     solo la lógica (sin navegador)
#   bash test/ejecutar-todo.sh compilada  solo la versión compilada en el navegador (es lo que pasa en Actions)
#
# Si hay node_modules (se instalan con `npm ci`), también pasa las pruebas de la lógica nueva (Vitest), valida
# los datos al compilar, compila la app con la ruta de producción (/luz-y-foto/), la sirve y le pasa
# las mismas pruebas de comportamiento que a la web actual (salvo `perfil`, que cambió a propósito), más las propias de la versión compilada
# (maquetación en móvil, género nuevo solo con datos, ruta base).
#
# Para probar otra versión de la app en el navegador (por ejemplo, la compilada con Svelte):
#   E2E_BASE_URL=http://localhost:4173/luz-y-foto/ E2E_HOY_URL=http://localhost:4173/luz-y-foto/#/hoy bash test/ejecutar-todo.sh
# En ese caso solo se ejecuta la carpeta `comportamiento`, que es la que debe pasar en cualquier versión.
set -u
cd "$(dirname "$0")/.."
export TZ=Europe/Madrid
fallos=0

correr() {
  local nombre="$1"; shift
  if salida=$("$@" 2>&1); then echo "  ok     $nombre"; else echo "  FALLA  $nombre"; echo "$salida" | grep -v '^ok' | sed 's/^/         /'; fallos=$((fallos+1)); fi
}

modo="${1:-todo}"

if [ "$modo" != "compilada" ]; then
  echo "Lógica"
  for t in astro semaforo datos lugar perfil-recetas; do correr "$t" node "test/$t.test.cjs"; done
  if [ -d node_modules ]; then
    echo "Lógica nueva (Vitest: pruebas y paridad con la lógica actual)"
    correr "vitest" npx vitest run
    correr "validar-datos" node test/validar-datos.test.cjs
  fi
fi

if [ "$modo" != "rapido" ]; then
  if [ "$modo" != "compilada" ]; then
    echo "Navegador: comportamiento (versión actual)"
    for f in test/e2e/comportamiento/*.e2e.cjs; do
      nombre="$(basename "$f" .e2e.cjs)"
      # El perfil y las recetas cambiaron a propósito en la versión compilada (niveles Principiante/Medio/Experto, receta solo
      # con el equipo configurado): la web actual ya no se mide con esa prueba, solo la compilada
      [ "$nombre" = "perfil" ] && continue
      correr "$nombre" node "$f"
    done
  fi
  if [ -z "${E2E_BASE_URL:-}" ]; then
    if [ "$modo" != "compilada" ]; then
      echo "Navegador: mecánica de la versión actual"
      for f in test/e2e/version-actual/*.e2e.cjs; do correr "$(basename "$f" .e2e.cjs)" node "$f"; done
    fi
    if [ -d node_modules ]; then
      echo "Navegador: versión compilada (Svelte)"
      correr "compilar" npm run --silent build
      for f in test/e2e/compilada/*.e2e.cjs; do correr "$(basename "$f" .e2e.cjs)" node "$f"; done
      echo "Navegador: comportamiento (versión compilada)"
      registro=$(mktemp)
      node scripts/servir-dist.mjs --puerto=0 --base=/luz-y-foto/ > "$registro" 2>&1 &
      servidor=$!
      for _ in $(seq 1 50); do grep -q '^LISTO' "$registro" && break; sleep 0.1; done
      direccion=$(sed -n 's/^LISTO //p' "$registro")
      if [ -z "$direccion" ]; then echo "  FALLA  servidor"; cat "$registro"; fallos=$((fallos+1)); fi
      if [ -n "$direccion" ]; then
        for f in test/e2e/comportamiento/*.e2e.cjs; do
          correr "$(basename "$f" .e2e.cjs)" env E2E_BASE_URL="$direccion" E2E_HOY_URL="${direccion}#/hoy" node "$f"
        done
      fi
      kill "$servidor" 2>/dev/null; rm -f "$registro"
    fi
  fi
fi

echo
if [ "$fallos" -eq 0 ]; then echo "Todo correcto"; else echo "$fallos prueba(s) con fallos"; exit 1; fi
