#!/usr/bin/env bash
# Ejecuta todas las pruebas del proyecto y termina con error si alguna falla.
#
#   bash test/ejecutar-todo.sh            lógica + navegador
#   bash test/ejecutar-todo.sh rapido     solo la lógica (sin navegador)
#
# Si hay node_modules (se instalan con `npm ci`), también pasa las pruebas de la lógica nueva (Vitest), valida
# los datos al compilar, compila la app nueva con la ruta de la vista previa (/luz-y-foto/beta/) y prueba la versión compilada.
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

echo "Lógica"
for t in astro semaforo datos lugar perfil-recetas; do correr "$t" node "test/$t.test.cjs"; done
if [ -d node_modules ]; then
  echo "Lógica nueva (Vitest: pruebas y paridad con la lógica actual)"
  correr "vitest" npx vitest run
  correr "validar-datos" node test/validar-datos.test.cjs
fi

if [ "${1:-}" != "rapido" ]; then
  echo "Navegador: comportamiento"
  for f in test/e2e/comportamiento/*.e2e.cjs; do correr "$(basename "$f" .e2e.cjs)" node "$f"; done
  if [ -z "${E2E_BASE_URL:-}" ]; then
    echo "Navegador: mecánica de la versión actual"
    for f in test/e2e/version-actual/*.e2e.cjs; do correr "$(basename "$f" .e2e.cjs)" node "$f"; done
    if [ -d node_modules ]; then
      echo "Navegador: versión compilada (Svelte)"
      correr "compilar" npm run --silent build -- --base=/luz-y-foto/beta/
      for f in test/e2e/compilada/*.e2e.cjs; do correr "$(basename "$f" .e2e.cjs)" node "$f"; done
    fi
  fi
fi

echo
if [ "$fallos" -eq 0 ]; then echo "Todo correcto"; else echo "$fallos prueba(s) con fallos"; exit 1; fi
