#!/usr/bin/env bash
# Enregistre la preuve d'utilisation du GPU pendant un traitement.
#
# À lancer DANS UN SECOND TERMINAL, en parallèle du pipeline ou du banc de
# mesure, sur la machine GPU :
#
#     bash scripts/record_gpu_evidence.sh            # jusqu'à Ctrl-C
#     INTERVAL=0.5 DURATION=180 bash scripts/record_gpu_evidence.sh
#
# Produit results/gpu_log.txt au format CSV, lu par bench/benchmark.py et
# affiché par l'onglet « Résultats » de l'interface.
#
# S'il n'y a pas de GPU, le script le dit et sort en erreur : il ne fabrique
# jamais de fausses mesures.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${OUT:-$ROOT/results/gpu_log.txt}"
INTERVAL="${INTERVAL:-1}"
DURATION="${DURATION:-0}"   # 0 = sans limite

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "ERREUR : nvidia-smi est introuvable — aucun GPU sur cette machine." >&2
  echo "Aucun journal n'est écrit : on ne fabrique pas de mesures GPU." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

{
  echo "# Réclam'Graph — preuve d'utilisation GPU"
  echo "# machine : $(hostname)"
  echo "# debut   : $(date -Iseconds)"
  echo "# pilote  : $(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -1)"
  echo "# gpu     : $(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
  echo "# colonnes : horodatage,utilisation_pct,memoire_utilisee_mib,memoire_totale_mib,temperature_c,puissance_w"
} > "$OUT"

echo "Enregistrement dans $OUT (intervalle ${INTERVAL}s). Ctrl-C pour arrêter."

START=$(date +%s)
trap 'echo; echo "Arrêté. $(grep -vc "^#" "$OUT") échantillons dans $OUT"; exit 0' INT TERM

while true; do
  nvidia-smi \
    --query-gpu=timestamp,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw \
    --format=csv,noheader,nounits >> "$OUT"
  if [ "$DURATION" -gt 0 ] && [ $(( $(date +%s) - START )) -ge "$DURATION" ]; then
    echo "Durée de ${DURATION}s atteinte. $(grep -vc '^#' "$OUT") échantillons."
    break
  fi
  sleep "$INTERVAL"
done
