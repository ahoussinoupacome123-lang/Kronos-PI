# Réclam'Graph — GPU Challenge 2026, équipe Token Titans (équipe 12)
# Toutes les cibles supposent un environnement virtuel dans .venv

PY      ?= .venv/bin/python
PIP     ?= .venv/bin/pip
STREAM  ?= .venv/bin/streamlit
export PYTHONPATH := src

.DEFAULT_GOAL := help
.PHONY: help setup setup-gpu env data pipeline pipeline-llm bench bench-llm demo demo-live \
        test lint serve-llm serve-ollama gpu-log all clean clean-results

help: ## Affiche cette aide
	@echo "Réclam'Graph — cibles disponibles :"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Parcours complet depuis zéro :"
	@echo "  make setup && make data && make pipeline && make bench && make demo"

setup: ## Crée .venv et installe les dépendances CPU
	python3 -m venv .venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "✓ environnement prêt. Pensez à : cp .env.example .env"

setup-gpu: ## Installe en plus les extras GPU (vLLM, torch, bge-m3) — machine GPU uniquement
	$(PIP) install -r requirements.txt -r requirements-gpu.txt

env: ## Affiche l'environnement détecté (matériel, modèle recommandé, serveur LLM)
	@$(PY) -c "import json; from reclam_graph import config as c; print(json.dumps(c.summary(), indent=2, ensure_ascii=False))"
	@$(PY) -c "from reclam_graph.llm import get_client; c=get_client(); print('LLM joignable :', c.available()); print(c.status)"

data: ## Génère les 20 000 réclamations synthétiques et la vérité terrain
	$(PY) -m reclam_graph.datagen.generator

pipeline: ## Exécute le pipeline complet (extraction auto, embeddings TF-IDF)
	$(PY) -m reclam_graph.pipeline --embed-engine tfidf

pipeline-llm: ## Pipeline avec extraction LLM obligatoire (nécessite make serve-llm)
	$(PY) -m reclam_graph.pipeline --engine llm --embed-engine auto

bench: ## Banc de mesure référence contre solution -> results/benchmark.{json,md}
	$(PY) -m bench.benchmark

bench-llm: ## Banc avec mesure LLM sur échantillon (nécessite make serve-llm)
	$(PY) -m bench.benchmark --with-llm

demo: ## Lance l'interface en MODE DÉMO (résultats pré-calculés, sans GPU)
	RECLAM_DEMO_MODE=1 $(STREAM) run app/dashboard.py

demo-live: ## Lance l'interface en mode calcul direct
	RECLAM_DEMO_MODE=0 $(STREAM) run app/dashboard.py

test: ## Lance la suite de tests
	$(PY) -m pytest tests -q

lint: ## Vérifie que tout compile
	$(PY) -m compileall -q src app bench tests && echo "✓ tout compile"

serve-llm: ## Sert Qwen2.5 avec vLLM (machine GPU ; choisit le modèle selon la VRAM)
	bash scripts/serve_llm.sh

serve-ollama: ## Variante Ollama (CPU ou GPU), même API OpenAI
	@echo "ollama serve puis : ollama pull qwen2.5:7b-instruct"
	@echo "export LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=qwen2.5:7b-instruct"

gpu-log: ## Enregistre la preuve d'utilisation GPU -> results/gpu_log.txt
	bash scripts/record_gpu_evidence.sh

all: data pipeline bench test ## Chaîne complète hors interface
	@echo "✓ données, pipeline, banc de mesure et tests terminés"

clean-results: ## Supprime les sorties calculées
	rm -f results/*.json results/*.md results/*.jsonl results/gpu_log.txt

clean: clean-results ## Supprime aussi les données générées et les caches
	rm -f data/complaints.jsonl data/extractions.jsonl data/shared_records.jsonl \
	      data/ground_truth.json data/alias_directory.json
	find . -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null || true
