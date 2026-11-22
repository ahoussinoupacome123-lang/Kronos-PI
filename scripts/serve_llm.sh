#!/usr/bin/env bash
# Sert Qwen2.5 avec vLLM derrière une API compatible OpenAI.
#
# Le modèle est choisi d'après la VRAM détectée (section 0 du brief) :
#   >= 12 Go : Qwen2.5-7B-Instruct-AWQ   (T4 : fp16/half, le T4 n'a pas bf16)
#   <  12 Go : Qwen2.5-3B-Instruct       (débit)
#
# Surcharges : LLM_MODEL, PORT, MAX_LEN, GPU_UTIL.

set -euo pipefail

PORT="${PORT:-8000}"
MAX_LEN="${MAX_LEN:-4096}"
GPU_UTIL="${GPU_UTIL:-0.90}"

if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "Aucun GPU détecté. Deux options :" >&2
  echo "  1) Ollama (CPU) : ollama serve && ollama pull qwen2.5:7b-instruct" >&2
  echo "     puis export LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=qwen2.5:7b-instruct" >&2
  echo "  2) Rester en mode démo : make demo (résultats pré-calculés)" >&2
  exit 1
fi

VRAM_MIB="$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1)"
VRAM_GB=$(( VRAM_MIB / 1024 ))
GPU_NAME="$(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
echo "GPU : $GPU_NAME (${VRAM_GB} Go)"

if [ -z "${LLM_MODEL:-}" ]; then
  if [ "$VRAM_GB" -ge 12 ]; then
    LLM_MODEL="Qwen/Qwen2.5-7B-Instruct-AWQ"
    QUANT=(--quantization awq)
  else
    LLM_MODEL="Qwen/Qwen2.5-3B-Instruct"
    QUANT=()
  fi
else
  case "$LLM_MODEL" in
    *AWQ*|*awq*) QUANT=(--quantization awq) ;;
    *) QUANT=() ;;
  esac
fi

# Le T4 (compute capability 7.5) ne supporte pas bf16 : on force fp16.
DTYPE="${DTYPE:-half}"

echo "Modèle : $LLM_MODEL  |  dtype : $DTYPE  |  port : $PORT"
echo "Ensuite, dans l'autre terminal :"
echo "  export LLM_BASE_URL=http://localhost:${PORT}/v1 LLM_MODEL=${LLM_MODEL}"
echo "  make pipeline-llm && make bench-llm"
echo ""

exec .venv/bin/python -m vllm.entrypoints.openai.api_server \
  --model "$LLM_MODEL" \
  "${QUANT[@]}" \
  --dtype "$DTYPE" \
  --max-model-len "$MAX_LEN" \
  --gpu-memory-utilization "$GPU_UTIL" \
  --port "$PORT" \
  --disable-log-requests
