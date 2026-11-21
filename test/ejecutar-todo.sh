#!/usr/bin/env bash
# Ejecuta todas las pruebas del proyecto y termina con error si alguna falla.
#
#   bash test/ejecutar-todo.sh            lógica + navegador
#   bash test/ejecutar-todo.sh rapido     solo la lógica (sin navegador)
#   bash test/ejecutar-todo.sh compilada  solo el navegador (es lo que pasa en Actions, además de `rapido`)
#
# Hace falta `npm ci`. La lógica son las pruebas de Vitest (test/nucleo/) y la validación de los datos. El navegador compila la app
# con la ruta de producción (/luz-y-foto/), le pasa las pruebas de test/e2e/compilada/ (maquetación en móvil, género nuevo solo con
# datos, ruta base, sin conexión…) y la sirve para las de test/e2e/comportamiento/ (lugar y perfil).
#
# Para pasar las de comportamiento a otra copia de la app que ya esté sirviéndose:
#   E2E_BASE_URL=http://localhost:4173/luz-y-foto/ E2E_HOY_URL=http://localhost:4173/luz-y-foto/#/hoy bash test/ejecutar-todo.sh
# En ese caso solo se ejecuta la carpeta `comportamiento`.
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
  echo "Lógica (Vitest)"
  correr "vitest" npx vitest run
  correr "validar-datos" node test/validar-datos.test.cjs
fi

if [ "$modo" != "rapido" ]; then
  if [ -z "${E2E_BASE_URL:-}" ]; then
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
  else
    echo "Navegador: comportamiento (en ${E2E_BASE_URL})"
    for f in test/e2e/comportamiento/*.e2e.cjs; do correr "$(basename "$f" .e2e.cjs)" node "$f"; done
  fi
fi

echo
if [ "$fallos" -eq 0 ]; then echo "Todo correcto"; else echo "$fallos prueba(s) con fallos"; exit 1; fi
