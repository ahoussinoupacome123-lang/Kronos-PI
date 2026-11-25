"""Configuration centrale de Réclam'Graph.

Toute valeur chiffrée affichée quelque part dans ce projet vient soit d'un
fichier de résultats produit par un script de ce dépôt, soit d'un paramètre
explicite de ce module. Les paramètres de coût qui dépendent d'un tarif
extérieur (prix horaire du GPU, tarif API cloud) sont volontairement vides
par défaut : s'ils ne sont pas renseignés, les scripts impriment
« non calculé » plutôt qu'une estimation déguisée en mesure.
"""

from __future__ import annotations

import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

try:  # python-dotenv est optionnel à l'import
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    pass

# --------------------------------------------------------------------------
# Chemins
# --------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
RESULTS_DIR = ROOT / "results"
CACHE_DIR = RESULTS_DIR / "cache"

for _d in (DATA_DIR, RESULTS_DIR, CACHE_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# Fichiers canoniques
COMPLAINTS_FILE = DATA_DIR / "complaints.jsonl"
GROUND_TRUTH_FILE = DATA_DIR / "ground_truth.json"
ALIAS_DIRECTORY_FILE = DATA_DIR / "alias_directory.json"
EXTRACTIONS_FILE = DATA_DIR / "extractions.jsonl"
SHARED_RECORDS_FILE = DATA_DIR / "shared_records.jsonl"
ALERTS_FILE = RESULTS_DIR / "mule_alerts.json"
BASELINE_ALERTS_FILE = RESULTS_DIR / "baseline_alerts.json"
INCIDENTS_FILE = RESULTS_DIR / "incidents.json"
DOSSIERS_FILE = RESULTS_DIR / "dossiers.json"
AUDIT_FILE = RESULTS_DIR / "audit.jsonl"
BENCHMARK_JSON = RESULTS_DIR / "benchmark.json"
BENCHMARK_MD = RESULTS_DIR / "benchmark.md"
GPU_LOG = RESULTS_DIR / "gpu_log.txt"
DEMO_BUNDLE = RESULTS_DIR / "demo_bundle.json"
TOKEN_COST_JSON = RESULTS_DIR / "token_cost.json"

# --------------------------------------------------------------------------
# LLM : un seul client OpenAI-compatible (vLLM ou Ollama interchangeables)
# --------------------------------------------------------------------------
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct-AWQ")
LLM_API_KEY = os.getenv("LLM_API_KEY", "not-needed-for-local")
LLM_TIMEOUT_S = float(os.getenv("LLM_TIMEOUT_S", "120"))
LLM_MAX_CONCURRENCY = int(os.getenv("LLM_MAX_CONCURRENCY", "16"))
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-m3")

# Choix du modèle par VRAM (section 0 du brief). Appliqué par scripts/serve_llm.sh.
MODEL_BY_VRAM_GB = {
    16: "Qwen/Qwen2.5-7B-Instruct-AWQ",  # T4 : AWQ + fp16 (le T4 n'a pas bf16)
    12: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    8: "Qwen/Qwen2.5-3B-Instruct",  # débit
}

# --------------------------------------------------------------------------
# Pseudonymisation (bloc 4)
# --------------------------------------------------------------------------
DEV_CONSORTIUM_KEY = "cle-de-developpement-a-remplacer"
CONSORTIUM_KEY = os.getenv("RECLAM_CONSORTIUM_KEY", DEV_CONSORTIUM_KEY)
CONSORTIUM_KEY_IS_DEV = CONSORTIUM_KEY == DEV_CONSORTIUM_KEY
HMAC_PREFIX_LEN = 16  # longueur de hash partagée (hex) ; suffisante pour joindre
AMOUNT_ROUNDING_FCFA = 5_000  # le montant qui sort de l'opérateur est arrondi

# --------------------------------------------------------------------------
# Règle mule — visible dans la démo, non négociable
# --------------------------------------------------------------------------
MULE_MIN_COMPLAINANTS = int(os.getenv("MULE_MIN_COMPLAINANTS", "3"))
MULE_MIN_OPERATORS = int(os.getenv("MULE_MIN_OPERATORS", "2"))
MULE_WINDOW_MINUTES = int(os.getenv("MULE_WINDOW_MINUTES", "60"))

# Réclam'Graph recommande et documente ; il ne gèle jamais de lui-même.
DECISION_IS_HUMAN = True

# --------------------------------------------------------------------------
# Minuteur réglementaire (bloc 6)
# --------------------------------------------------------------------------
REFUND_BUSINESS_DAYS = 3  # Instruction n°008-05-2015, art. 35
CLIENT_ANSWER_CALENDAR_DAYS = 30  # Circulaire n°002-2020/CB/C
BANKING_COMMISSION_INVESTIGATION_DAYS = 60  # Circulaire n°002-2020/CB/C
PI_RECLAM_DEADLINE_HOURS = int(os.getenv("PI_RECLAM_DEADLINE_HOURS", "48"))
# Délais et pénalités PI-Reclam : fixés dans les conventions de participation,
# non publics. La valeur ci-dessus est un paramètre configurable, pas une mesure.
PI_RECLAM_DEADLINE_IS_PUBLIC = False

# Jours fériés (Bénin) utilisés par le calcul des jours ouvrés. Liste éditable.
PUBLIC_HOLIDAYS = [
    "2026-01-01",
    "2026-01-10",
    "2026-04-06",
    "2026-05-01",
    "2026-08-01",
    "2026-08-15",
    "2026-11-01",
    "2026-12-25",
]

TIMEZONE = "Africa/Porto-Novo"  # UTC+1

# --------------------------------------------------------------------------
# Coûts — paramètres explicites à remplir depuis leurs sources
# --------------------------------------------------------------------------
def _opt_float(name: str) -> float | None:
    raw = os.getenv(name, "").strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


# Tarifs PUBLICS relevés le 25/11/2026. Ce ne sont pas des mesures de notre
# part : ce sont des prix affichés par des fournisseurs, et ils bougent. Toute
# republication doit les relever à nouveau. Sources dans README « Coûts ».
#
# Le FCFA est arrimé à l'euro à parité fixe (1 EUR = 655,957 FCFA, parité
# statutaire UEMOA), mais les deux fournisseurs ci-dessous facturent en dollars :
# le taux USD/XOF flotte donc et constitue la principale fragilité du chiffre.
USD_TO_FCFA = 598.03  # taux moyen de marché XE, 24/11/2026 19:18 UTC
EUR_TO_FCFA = 655.957  # parité fixe, ne bouge pas

# AWS EC2 g4dn.xlarge = 1 × NVIDIA T4 16 Go, exactement la carte visée par le
# brief. Tarif à la demande, Linux, us-east-1. AWS ne publie pas de tarif FCFA.
GPU_T4_HOURLY_PRICE_USD = 0.526
_GPU_HOURLY_DEFAULT = round(GPU_T4_HOURLY_PRICE_USD * USD_TO_FCFA, 2)

# Claude Haiku 5.5, palier ≤ 100 000 tokens : 0,10 $/M en entrée, 0,50 $/M en
# sortie. Sert de point de comparaison « si on appelait une API au lieu
# d'héberger le modèle ». Le coût pour 1 000 réclamations n'est PAS saisi à la
# main : il est dérivé des tokens réellement comptés par `bench/token_cost.py`.
CLOUD_API_INPUT_USD_PER_M = 0.10
CLOUD_API_OUTPUT_USD_PER_M = 0.50
CLOUD_API_MODEL_LABEL = "Claude Haiku 5.5 (palier ≤ 100 k tokens)"

# Les deux paramètres du brief restent surchargeables par l'environnement ; à
# défaut ils valent le tarif public ci-dessus. Mettre `0` dans `.env` pour
# revenir à « non calculé » et ne rien afficher.
GPU_HOURLY_PRICE_FCFA = _opt_float("GPU_HOURLY_PRICE_FCFA")
if GPU_HOURLY_PRICE_FCFA is None:
    GPU_HOURLY_PRICE_FCFA = _GPU_HOURLY_DEFAULT
def _fr(value: float) -> str:
    """Nombre en écriture française (virgule décimale), pour les étiquettes."""
    return f"{value}".replace(".", ",")


GPU_HOURLY_PRICE_LABEL = (
    f"AWS g4dn.xlarge (T4 16 Go) à la demande, {_fr(GPU_T4_HOURLY_PRICE_USD)} USD/h "
    f"× {_fr(USD_TO_FCFA)} FCFA/USD — prix public relevé le 25/11/2026"
)

# Surcharge explicite ; sinon dérivé des tokens mesurés (voir cost_report).
CLOUD_API_PRICE_PER_1K_FCFA = _opt_float("CLOUD_API_PRICE_PER_1K_FCFA")

# Estimations issues d'offres d'emploi (section 12) — à présenter comme estimations.
HUMAN_COST_SIMPLE_FCFA = 270.0
HUMAN_COST_INVESTIGATED_FCFA = 700.0
HUMAN_COST_LABEL = "estimation (offres d'emploi, section 12)"

# Repères de prix publics, pour comparaison (section 4). Étiquetés comme repères.
VENDOR_REFERENCES_FCFA = {
    "Intercom Fin (par résolution)": 590.0,
    "Thematic (par commentaire)": 600.0,
}
PROPOSED_PRICE_PER_COMPLAINT_FCFA = 5.0  # hypothèse de modèle économique

# --------------------------------------------------------------------------
# Générateur synthétique (bloc 1)
# --------------------------------------------------------------------------
N_COMPLAINTS = int(os.getenv("RECLAM_N_COMPLAINTS", "20000"))
N_DAYS = 7
SEED = 20260112

OPERATORS = ("ALPHAMONEY", "BETACASH", "GAMMAPAY")
OPERATOR_SHARE = (0.45, 0.33, 0.22)  # parts de volume synthétiques
# Correspondance narrative pour le pitch uniquement (données synthétiques,
# opérateurs fictifs) : ALPHAMONEY ~ opérateur dominant, BETACASH, GAMMAPAY.

N_MULE_CAMPAIGNS = 5
N_INCIDENTS = 1
#: Arnaques « erreur de dépôt » ISOLÉES : une victime seule, un compte
#: bénéficiaire qui ne reçoit qu'une ou deux plaintes. C'est le cas le plus
#: fréquent dans la réalité (la fraude par ingénierie sociale est massive en
#: nombre), et il est indispensable à deux titres :
#:   1. sans lui, la classe ARNAQUE ne pèse que 0,2 % du corpus et toute F1 de
#:      classification mesurée dessus est instable ;
#:   2. ces plaintes NE DOIVENT PAS déclencher d'alerte mule — elles testent
#:      la précision et doivent produire un dossier de remboursement.
N_ISOLATED_SCAMS = 600
SIM_START = "2026-11-16T00:00:00+01:00"  # lundi

# Part des réclamations par grande famille (somme ~1 hors scénarios injectés)
NOISE_MIX = {
    "ERREUR_DESTINATAIRE_SINCERE": 0.34,
    "TRANSACTION_ECHOUEE_DEBITEE": 0.16,
    "RETARD_TIMEOUT": 0.12,
    "FRAIS_CONTESTES": 0.09,
    "OTP_PHISHING": 0.07,
    "AGENT_DISTRIBUTEUR": 0.07,
    "CHANGEMENT_NUMERO": 0.05,
    "AUTRE": 0.10,
}

# --------------------------------------------------------------------------
# Mode démo
# --------------------------------------------------------------------------
DEMO_MODE = os.getenv("RECLAM_DEMO_MODE", "1") not in ("0", "false", "False", "")


# --------------------------------------------------------------------------
# Matériel : détecté, jamais supposé
# --------------------------------------------------------------------------
@dataclass
class Hardware:
    has_gpu: bool
    gpu_name: str | None
    vram_mb: int | None
    driver: str | None
    raw: str = ""
    labels: list[str] = field(default_factory=list)

    @property
    def run_label(self) -> str:
        """Étiquette à faire figurer dans TOUTE sortie de benchmark."""
        if self.has_gpu:
            return f"GPU run — {self.gpu_name} ({self.vram_mb} MiB)"
        return "CPU run — aucun GPU détecté (ne pas présenter comme des chiffres GPU)"

    def recommended_model(self) -> str:
        if not self.has_gpu or not self.vram_mb:
            return LLM_MODEL
        gb = self.vram_mb // 1024
        for threshold in sorted(MODEL_BY_VRAM_GB, reverse=True):
            if gb >= threshold:
                return MODEL_BY_VRAM_GB[threshold]
        return "Qwen/Qwen2.5-3B-Instruct"


def detect_hardware() -> Hardware:
    """Interroge nvidia-smi. Aucune supposition : s'il n'y a pas de GPU, on le dit."""
    exe = shutil.which("nvidia-smi")
    if not exe:
        return Hardware(False, None, None, None, raw="nvidia-smi introuvable")
    try:
        out = subprocess.run(
            [
                exe,
                "--query-gpu=name,memory.total,driver_version",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=20,
            check=True,
        ).stdout.strip()
    except Exception as exc:  # pragma: no cover
        return Hardware(False, None, None, None, raw=f"nvidia-smi a échoué : {exc}")
    if not out:
        return Hardware(False, None, None, None, raw="nvidia-smi sans sortie")
    name, mem, driver = (p.strip() for p in out.splitlines()[0].split(","))
    return Hardware(True, name, int(float(mem)), driver, raw=out)


HARDWARE = detect_hardware()


def summary() -> dict:
    """Résumé de configuration, repris tel quel dans les fichiers de résultats."""
    return {
        "version": "1.0.0",
        "hardware": {
            "has_gpu": HARDWARE.has_gpu,
            "gpu_name": HARDWARE.gpu_name,
            "vram_mb": HARDWARE.vram_mb,
            "driver": HARDWARE.driver,
            "run_label": HARDWARE.run_label,
            "detection": HARDWARE.raw,
        },
        "llm": {
            "base_url": LLM_BASE_URL,
            "model": LLM_MODEL,
            "recommended_for_hardware": HARDWARE.recommended_model(),
        },
        "embed_model": EMBED_MODEL,
        "mule_rule": {
            "min_complainants": MULE_MIN_COMPLAINANTS,
            "min_operators": MULE_MIN_OPERATORS,
            "window_minutes": MULE_WINDOW_MINUTES,
            "decision": "humaine, chez l'opérateur (Réclam'Graph ne gèle jamais)",
        },
        "deadlines": {
            "remboursement_jours_ouvres": REFUND_BUSINESS_DAYS,
            "reponse_client_jours_calendaires": CLIENT_ANSWER_CALENDAR_DAYS,
            "pi_reclam_heures": PI_RECLAM_DEADLINE_HOURS,
            "pi_reclam_public": PI_RECLAM_DEADLINE_IS_PUBLIC,
        },
        "costs": {
            "gpu_hourly_price_fcfa": GPU_HOURLY_PRICE_FCFA,
            "cloud_api_price_per_1k_fcfa": CLOUD_API_PRICE_PER_1K_FCFA,
            "human_cost_simple_fcfa": HUMAN_COST_SIMPLE_FCFA,
            "human_cost_investigated_fcfa": HUMAN_COST_INVESTIGATED_FCFA,
            "human_cost_label": HUMAN_COST_LABEL,
        },
        "dataset": {
            "n_complaints": N_COMPLAINTS,
            "n_days": N_DAYS,
            "operators": list(OPERATORS),
            "n_mule_campaigns": N_MULE_CAMPAIGNS,
            "n_incidents": N_INCIDENTS,
            "seed": SEED,
            "synthetic": True,
        },
        "pseudonymisation": {
            "algo": "HMAC-SHA256",
            "key_is_dev_default": CONSORTIUM_KEY_IS_DEV,
            "amount_rounding_fcfa": AMOUNT_ROUNDING_FCFA,
        },
        "demo_mode": DEMO_MODE,
    }
