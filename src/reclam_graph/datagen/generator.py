"""Générateur de réclamations synthétiques (bloc 1).

Produit `data/complaints.jsonl` (20 000 réclamations sur 7 jours simulés,
3 opérateurs fictifs) et `data/ground_truth.json`.

Le générateur est déterministe : même graine, même jeu de données. Le brief
exige que le générateur et la vérité terrain soient publiés — c'est la
réponse à « vos données sont synthétiques ».

Si un serveur LLM est disponible, `--llm-paraphrase` peut en plus faire
reformuler une fraction des textes par Qwen2.5 (bloc 1 sur GPU). Sans
serveur, les gabarits suffisent et le fichier le signale.
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from faker import Faker

from .. import config as cfg
from ..schemas import Channel, Complaint, Typology
from . import scenarios as sc
from . import templates as tpl

# --------------------------------------------------------------------------
# Noms locaux (Bénin / UEMOA) pour que les textes soient crédibles
# --------------------------------------------------------------------------
FIRST_NAMES = (
    "Aïcha", "Koffi", "Mawuli", "Chabi", "Rachelle", "Ibrahim", "Fatou",
    "Serge", "Adjoa", "Zinsou", "Bernadette", "Moussa", "Sylvie", "Rachidi",
    "Grâce", "Olivier", "Nadège", "Yacoubou", "Prudence", "Komlan",
    "Félicité", "Abdoul", "Christelle", "Gildas", "Mariam", "Emmanuel",
    "Blandine", "Souleymane", "Vivien", "Sèdjro", "Hortense", "Alassane",
)
LAST_NAMES = (
    "Dossou", "Hounkpatin", "Adjovi", "Agbodjan", "Santos", "Gbedo",
    "Tidjani", "Kponou", "Zinsou", "Aholou", "Sossou", "Djossou", "Ahouandjinou",
    "Bio", "Tchibozo", "Houngbedji", "Lokossou", "Amoussou", "Degbey",
    "Koukpaki", "Soglo", "Quenum", "Assogba", "Dagba", "Nouatin", "Gnonlonfoun",
)

OPERATOR_PREFIX = {"ALPHAMONEY": "96", "BETACASH": "97", "GAMMAPAY": "61"}

#: Courbe d'activité horaire (0h..23h). Sert aussi à rendre le pic d'incident
#: détectable par le radar : sans courbe de base, tout pic est trivial.
HOUR_WEIGHTS = (
    0.4, 0.2, 0.15, 0.15, 0.2, 0.5, 1.2, 2.5, 4.5, 6.0,
    7.0, 7.5, 6.5, 5.5, 6.0, 6.5, 7.0, 7.5, 6.5, 5.0,
    3.5, 2.2, 1.3, 0.7,
)

CHANNEL_WEIGHTS = (
    (Channel.SMS, 0.30),
    (Channel.APP, 0.28),
    (Channel.CALL_CENTER, 0.26),
    (Channel.AGENCE, 0.11),
    (Channel.VOICE_NOTE, 0.05),
)


# --------------------------------------------------------------------------
# Mise en forme des montants et du bruit
# --------------------------------------------------------------------------
def format_amount(amount: int, rng: random.Random) -> str:
    """Écrit un montant comme un vrai client l'écrit : « 25mil », « 25.000F »…"""
    thousands = amount // 1000
    exact_thousands = amount % 1000 == 0
    candidates = [
        f for f in tpl.AMOUNT_FORMATS
        if exact_thousands or ("{k}" not in f and "{words}" not in f)
    ]
    fmt = rng.choice(candidates)
    return fmt.format(
        n=str(amount),
        group=f"{amount:,}".replace(",", " "),
        dotted=f"{amount:,}".replace(",", "."),
        k=str(thousands),
        words=tpl.amount_in_words(thousands),
    )


#: Jetons qu'il ne faut JAMAIS corrompre : alias PI-SPI, numéro, référence.
#: Dans la vraie vie le client les copie-colle depuis le reçu de la
#: transaction ; et surtout, c'est sur l'alias que le hub joint les plaintes
#: entre opérateurs. Les bruiter reviendrait à casser la jointure au lieu de
#: tester l'extraction.
def _is_identifier_token(tok: str) -> bool:
    return (
        "@" in tok
        or tok.startswith("+")
        or tok.upper().startswith("TX")
        or sum(ch.isdigit() for ch in tok) >= 6
    )


def apply_typos(text: str, rng: random.Random, rate: float) -> str:
    """Fautes de frappe : inversion, suppression, doublement de caractères.

    Les identifiants (alias, MSISDN, référence) sont préservés.
    """
    return " ".join(
        tok if _is_identifier_token(tok) else _typo_token(tok, rng, rate)
        for tok in text.split(" ")
    )


def _typo_token(text: str, rng: random.Random, rate: float) -> str:
    chars = list(text)
    i = 0
    while i < len(chars) - 1:
        if chars[i].isalpha() and rng.random() < rate:
            move = rng.random()
            if move < 0.4 and chars[i + 1].isalpha():
                chars[i], chars[i + 1] = chars[i + 1], chars[i]
                i += 1
            elif move < 0.75:
                chars[i] = ""
            else:
                chars[i] = chars[i] * 2
        i += 1
    return "".join(chars)


def apply_sms_style(text: str, rng: random.Random) -> str:
    for full, short in tpl.SMS_ABBREV.items():
        if full in text and rng.random() < 0.55:
            text = text.replace(full, short)
    return text


def add_local_flavour(text: str, rng: random.Random) -> str:
    """Ajoute du lexique nouchi / fon. Bruit lexical, pas compréhension."""
    if rng.random() < 0.18:
        text = f"{text} {rng.choice(tpl.NOUCHI)}"
    if rng.random() < 0.07:
        text = f"{text} {rng.choice(tpl.FON_WORDS)}"
    if rng.random() < 0.12:
        text = " ".join(
            tok if _is_identifier_token(tok) else tok.upper() for tok in text.split(" ")
        )
    return text


def noisify(text: str, rng: random.Random) -> str:
    text = apply_sms_style(text, rng)
    text = apply_typos(text, rng, rate=rng.choice([0.0, 0.0, 0.01, 0.025, 0.05, 0.08]))
    text = add_local_flavour(text, rng)
    return " ".join(text.split())


def detect_indicators(text: str) -> list[str]:
    """Indicateurs d'arnaque réellement présents dans le texte final.

    Calculés sur le texte *après* bruitage : la vérité terrain doit décrire ce
    que le texte contient vraiment, sinon la F1 d'extraction est fausse.
    """
    low = text.lower()
    found = []
    for name, phrases in tpl.SCAM_INDICATOR_PHRASES.items():
        if any(p in low for p in phrases):
            found.append(name)
    return found


# --------------------------------------------------------------------------
# Population synthétique
# --------------------------------------------------------------------------
class Population:
    def __init__(self, rng: random.Random, fake: Faker) -> None:
        self.rng = rng
        self.fake = fake
        self._used_msisdn: set[str] = set()
        self.customers: dict[str, list[dict[str, str]]] = {
            op: [self._make_customer(op) for _ in range(2600)] for op in cfg.OPERATORS
        }

    def _msisdn(self, operator: str) -> str:
        prefix = OPERATOR_PREFIX[operator]
        while True:
            num = f"+229{prefix}{self.rng.randint(0, 999999):06d}"
            if num not in self._used_msisdn:
                self._used_msisdn.add(num)
                return num

    def _make_customer(self, operator: str) -> dict[str, str]:
        first = self.rng.choice(FIRST_NAMES)
        last = self.rng.choice(LAST_NAMES)
        return {
            "name": f"{first} {last}",
            "msisdn": self._msisdn(operator),
            "operator": operator,
            "alias": f"{_slug(first)}.{_slug(last)}@{operator.lower()}",
        }

    def pick(self, operator: str) -> dict[str, str]:
        return self.rng.choice(self.customers[operator])

    def pick_named(self, operator: str, first: str, last: str) -> dict[str, str]:
        """Victime nommée (cas narratif de la démo)."""
        return {
            "name": f"{first} {last}",
            "msisdn": self._msisdn(operator),
            "operator": operator,
            "alias": f"{_slug(first)}.{_slug(last)}@{operator.lower()}",
        }


def _slug(s: str) -> str:
    table = str.maketrans("àâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ", "aaaeeeeiioouuucAAAEEEEIIOOUUUC")
    return s.translate(table).lower().replace(" ", "").replace("'", "")


def _weighted(rng: random.Random, pairs: tuple) -> Any:
    total = sum(w for _, w in pairs)
    r = rng.random() * total
    acc = 0.0
    for value, w in pairs:
        acc += w
        if r <= acc:
            return value
    return pairs[-1][0]


# --------------------------------------------------------------------------
# Rendu d'une réclamation
# --------------------------------------------------------------------------
def render_text(
    typology: str,
    rng: random.Random,
    amount: int | None,
    alias: str | None,
    msisdn: str | None,
    event_at: datetime | None,
    dest_operator: str | None,
) -> str:
    template = rng.choice(tpl.TEMPLATES[typology])
    text = template.format(
        G=rng.choice(tpl.GREETINGS),
        C=rng.choice(tpl.CLOSINGS),
        A=format_amount(amount, rng) if amount else "le montant",
        AL=alias or "un autre numero",
        MS=msisdn or "+22900000000",
        HH=event_at.strftime("%Hh%M") if event_at else "ce matin",
        OP=dest_operator or rng.choice(cfg.OPERATORS).title(),
        REF=f"TX{rng.randint(10**9, 10**10 - 1)}",
    )
    return noisify(text, rng)


def _mk_complaint(
    cid: str,
    operator: str,
    received_at: datetime,
    customer: dict[str, str],
    typology: Typology,
    text: str,
    rng: random.Random,
    *,
    amount: int | None = None,
    beneficiary_alias: str | None = None,
    beneficiary_msisdn: str | None = None,
    dest_operator: str | None = None,
    event_at: datetime | None = None,
    campaign_id: str | None = None,
    incident_id: str | None = None,
    decoy_id: str | None = None,
    is_mule_victim: bool = False,
) -> Complaint:
    c = Complaint(
        complaint_id=cid,
        operator=operator,
        channel=_weighted(rng, CHANNEL_WEIGHTS),
        received_at=received_at,
        complainant_msisdn=customer["msisdn"],
        complainant_name=customer["name"],
        text=text,
        gt_typology=typology,
        gt_amount_fcfa=amount,
        gt_beneficiary_alias=beneficiary_alias,
        gt_beneficiary_msisdn=beneficiary_msisdn,
        gt_destination_operator=dest_operator,
        gt_event_at=event_at,
        gt_campaign_id=campaign_id,
        gt_incident_id=incident_id,
        gt_is_mule_victim=is_mule_victim,
        gt_scam_indicators=detect_indicators(text),
    )
    # `decoy_id` voyage dans la vérité terrain agrégée, pas dans le schéma
    # de réclamation : on le rattache via un attribut privé.
    object.__setattr__(c, "_decoy_id", decoy_id)
    return c


# --------------------------------------------------------------------------
# Génération
# --------------------------------------------------------------------------
def generate_dataset(
    n_complaints: int = cfg.N_COMPLAINTS,
    seed: int = cfg.SEED,
    out_complaints: Path = cfg.COMPLAINTS_FILE,
    out_ground_truth: Path = cfg.GROUND_TRUTH_FILE,
    out_directory: Path = cfg.ALIAS_DIRECTORY_FILE,
) -> dict[str, Any]:
    rng = random.Random(seed)
    fake = Faker("fr_FR")
    Faker.seed(seed)

    sim_start = datetime.fromisoformat(cfg.SIM_START)
    pop = Population(rng, fake)

    complaints: list[Complaint] = []
    counter = 0

    # Annuaire d'alias PI-SPI : numéro -> alias. PI-SPI utilise un alias pour
    # masquer le numéro ; c'est donc l'infrastructure elle-même qui permet à
    # l'opérateur de résoudre un numéro cité dans une plainte vers l'alias
    # canonique, AVANT de le hacher. Sans cette résolution, deux plaintes
    # visant la même mule (l'une citant l'alias, l'autre le numéro) ne se
    # joindraient pas au hub.
    directory: dict[str, str] = {}

    def next_id() -> str:
        nonlocal counter
        counter += 1
        return f"RC-{counter:06d}"

    def at(day_offset: int, hhmm: str) -> datetime:
        h, m = (int(x) for x in hhmm.split(":"))
        return sim_start + timedelta(days=day_offset, hours=h, minutes=m)

    # ---------------- 1) Les 5 campagnes d'arnaque « erreur de dépôt » ------
    campaigns_gt: list[dict[str, Any]] = []
    for spec in sc.CAMPAIGN_SPECS:
        mule_op = spec["mule_operator"]
        mule_alias = spec["mule_alias"]
        mule_msisdn = pop._msisdn(mule_op)
        directory[mule_msisdn] = mule_alias
        victims_gt: list[dict[str, Any]] = []
        total = 0
        for idx, (victim_op, amount, credit_hhmm, complaint_hhmm) in enumerate(spec["victims"]):
            if spec.get("narrative") and idx == 0:
                customer = pop.pick_named(victim_op, "Aïcha", "Kougbo")
            else:
                customer = pop.pick(victim_op)
            event_at = at(spec["day_offset"], credit_hhmm)
            received_at = at(spec["day_offset"], complaint_hhmm)
            text = render_text(
                "ARNAQUE_ERREUR_DEPOT", rng, amount, mule_alias, mule_msisdn,
                event_at, mule_op.title(),
            )
            cid = next_id()
            complaints.append(
                _mk_complaint(
                    cid, victim_op, received_at, customer,
                    Typology.ARNAQUE_ERREUR_DEPOT, text, rng,
                    amount=amount, beneficiary_alias=mule_alias,
                    beneficiary_msisdn=mule_msisdn, dest_operator=mule_op,
                    event_at=event_at, campaign_id=spec["campaign_id"],
                    is_mule_victim=True,
                )
            )
            total += amount
            victims_gt.append(
                {
                    "complaint_id": cid,
                    "operator": victim_op,
                    "amount_fcfa": amount,
                    "credit_at": event_at.isoformat(),
                    "complaint_at": received_at.isoformat(),
                    "complainant_msisdn": customer["msisdn"],
                    "complainant_name": customer["name"],
                }
            )
        campaigns_gt.append(
            {
                "campaign_id": spec["campaign_id"],
                "label": spec["label"],
                "mule_operator": mule_op,
                "mule_alias": mule_alias,
                "mule_msisdn": mule_msisdn,
                "total_fcfa": total,
                "n_victims": len(victims_gt),
                "operators": sorted({v["operator"] for v in victims_gt}),
                "first_credit_at": victims_gt[0]["credit_at"],
                "first_complaint_at": victims_gt[0]["complaint_at"],
                "last_complaint_at": victims_gt[-1]["complaint_at"],
                "cashout_start_at": at(spec["day_offset"], spec["cashout_start"]).isoformat(),
                "cashout_rate_fcfa_per_min": spec["cashout_rate_fcfa_per_min"],
                "narrative_demo_case": bool(spec.get("narrative")),
                "victims": victims_gt,
            }
        )

    # ---------------- 2) L'incident PI-SPI (vague de timeouts) --------------
    inc = sc.INCIDENT_SPEC
    win_start = at(inc["day_offset"], inc["window_start"])
    win_end = at(inc["day_offset"], inc["window_end"])
    span_min = int((win_end - win_start).total_seconds() // 60)
    incident_ids: list[str] = []
    for _ in range(inc["n_complaints"]):
        op = rng.choice(inc["operators"])
        customer = pop.pick(op)
        received_at = win_start + timedelta(minutes=rng.randint(0, span_min))
        dest = rng.choice([o for o in cfg.OPERATORS if o != op])
        amount = rng.choice([5_000, 10_000, 15_000, 20_000, 25_000, 2_500, 7_500])
        event_at = received_at - timedelta(minutes=rng.randint(5, 90))
        text = render_text("RETARD_TIMEOUT", rng, amount, None, None, event_at, dest.title())
        cid = next_id()
        incident_ids.append(cid)
        complaints.append(
            _mk_complaint(
                cid, op, received_at, customer, Typology.RETARD_TIMEOUT, text, rng,
                amount=amount, dest_operator=dest, event_at=event_at,
                incident_id=inc["incident_id"],
            )
        )
    incident_gt = {
        "incident_id": inc["incident_id"],
        "label": inc["label"],
        "typology": inc["typology"],
        "window_start": win_start.isoformat(),
        "window_end": win_end.isoformat(),
        "operators": inc["operators"],
        "n_complaints": len(incident_ids),
        "complaint_ids": incident_ids,
    }

    # ---------------- 3) Les leurres (futurs faux positifs de la règle) -----
    decoys_gt: list[dict[str, Any]] = []
    for d in sc.DECOY_SPECS:
        ids: list[str] = []
        for victim_op, amount, hhmm in d["complainants"]:
            customer = pop.pick(victim_op)
            received_at = at(d["day_offset"], hhmm)
            event_at = received_at - timedelta(minutes=rng.randint(4, 40))
            text = render_text(
                "ERREUR_DESTINATAIRE_SINCERE", rng, amount, d["alias"], None,
                event_at, d["host_operator"].title(),
            )
            cid = next_id()
            ids.append(cid)
            complaints.append(
                _mk_complaint(
                    cid, victim_op, received_at, customer,
                    Typology.ERREUR_DESTINATAIRE_SINCERE, text, rng,
                    amount=amount, beneficiary_alias=d["alias"],
                    dest_operator=d["host_operator"], event_at=event_at,
                    decoy_id=d["decoy_id"],
                )
            )
        decoys_gt.append(
            {
                "decoy_id": d["decoy_id"],
                "label": d["label"],
                "alias": d["alias"],
                "host_operator": d["host_operator"],
                "n_complainants": len(ids),
                "operators": sorted({c[0] for c in d["complainants"]}),
                "complaint_ids": ids,
                "is_fraud": False,
                "note": (
                    "Grappe légitime : la règle 3/2/60 se déclenche alors qu'il n'y a "
                    "aucune fraude. Sert à mesurer une vraie précision."
                ),
            }
        )

    # ---------------- 4) Le bruit de fond ----------------------------------
    remaining = n_complaints - len(complaints)
    if remaining < 0:
        raise ValueError(
            f"n_complaints={n_complaints} est inférieur aux scénarios injectés "
            f"({len(complaints)})."
        )
    mix = list(cfg.NOISE_MIX.items())
    hour_pairs = tuple((h, w) for h, w in enumerate(HOUR_WEIGHTS))
    op_pairs = tuple(zip(cfg.OPERATORS, cfg.OPERATOR_SHARE))

    # Pool d'alias « destinataires » assez large pour que les erreurs
    # sincères ne se regroupent pas par accident au-delà du seuil.
    alias_pool = [pop.pick(rng.choice(cfg.OPERATORS)) for _ in range(5200)]
    for target in alias_pool:
        directory[target["msisdn"]] = target["alias"]

    for _ in range(remaining):
        typology_name = _weighted(rng, tuple(mix))
        op = _weighted(rng, op_pairs)
        customer = pop.pick(op)
        day = rng.randint(0, cfg.N_DAYS - 1)
        hour = _weighted(rng, hour_pairs)
        received_at = (
            sim_start
            + timedelta(days=day, hours=hour, minutes=rng.randint(0, 59), seconds=rng.randint(0, 59))
        )
        amount: int | None = None
        if typology_name != "AUTRE" or rng.random() < 0.4:
            base = rng.choice([500, 1_000, 2_500, 5_000, 10_000, 15_000, 20_000, 25_000,
                               30_000, 50_000, 75_000, 100_000])
            amount = base if rng.random() < 0.75 else base + rng.choice([250, 500, 750, 1_250])
        alias = None
        ben_msisdn = None
        dest = None
        event_at = received_at - timedelta(minutes=rng.randint(3, 240))
        if typology_name in ("ERREUR_DESTINATAIRE_SINCERE",):
            target = rng.choice(alias_pool)
            alias = target["alias"]
            ben_msisdn = target["msisdn"]
            dest = target["operator"]
        elif typology_name in ("TRANSACTION_ECHOUEE_DEBITEE", "RETARD_TIMEOUT"):
            dest = rng.choice(cfg.OPERATORS)
        typology = Typology(typology_name)
        text = render_text(
            typology_name, rng, amount, alias, ben_msisdn, event_at,
            dest.title() if dest else None,
        )
        complaints.append(
            _mk_complaint(
                next_id(), op, received_at, customer, typology, text, rng,
                amount=amount, beneficiary_alias=alias, beneficiary_msisdn=ben_msisdn,
                dest_operator=dest, event_at=event_at,
            )
        )

    complaints.sort(key=lambda c: c.received_at)

    # ---------------- 5) Écriture ------------------------------------------
    out_complaints.parent.mkdir(parents=True, exist_ok=True)
    with out_complaints.open("w", encoding="utf-8") as fh:
        for c in complaints:
            fh.write(c.model_dump_json() + "\n")

    per_typology: dict[str, int] = {}
    per_operator: dict[str, int] = {}
    for c in complaints:
        per_typology[c.gt_typology.value] = per_typology.get(c.gt_typology.value, 0) + 1
        per_operator[c.operator] = per_operator.get(c.operator, 0) + 1

    ground_truth = {
        "generated_at": datetime.now().astimezone().isoformat(),
        "synthetic": True,
        "warning": (
            "Toutes ces données sont synthétiques. Les opérateurs ALPHAMONEY, "
            "BETACASH et GAMMAPAY sont fictifs. Aucun chiffre de ce fichier ne "
            "décrit un opérateur réel."
        ),
        "seed": seed,
        "n_complaints": len(complaints),
        "n_days": cfg.N_DAYS,
        "sim_start": sim_start.isoformat(),
        "sim_end": (sim_start + timedelta(days=cfg.N_DAYS)).isoformat(),
        "operators": list(cfg.OPERATORS),
        "text_source": "gabarits + bruitage déterministe (aucun LLM requis)",
        "counts_per_typology": dict(sorted(per_typology.items())),
        "counts_per_operator": dict(sorted(per_operator.items())),
        "mule_rule_used_by_hub": {
            "min_complainants": cfg.MULE_MIN_COMPLAINANTS,
            "min_operators": cfg.MULE_MIN_OPERATORS,
            "window_minutes": cfg.MULE_WINDOW_MINUTES,
        },
        "campaigns": campaigns_gt,
        "incidents": [incident_gt],
        "decoys": decoys_gt,
    }
    out_ground_truth.write_text(
        json.dumps(ground_truth, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    out_directory.write_text(
        json.dumps(
            {
                "_note": (
                    "Annuaire d'alias PI-SPI simulé (numéro -> alias). Permet à "
                    "l'opérateur de résoudre un numéro cité dans une plainte vers "
                    "l'alias canonique avant hachage. Synthétique."
                ),
                "msisdn_to_alias": dict(sorted(directory.items())),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    ground_truth["alias_directory_size"] = len(directory)
    return ground_truth


def main() -> None:
    ap = argparse.ArgumentParser(description="Génère le jeu de réclamations synthétiques.")
    ap.add_argument("-n", "--n-complaints", type=int, default=cfg.N_COMPLAINTS)
    ap.add_argument("--seed", type=int, default=cfg.SEED)
    args = ap.parse_args()
    gt = generate_dataset(n_complaints=args.n_complaints, seed=args.seed)
    print(f"✓ {gt['n_complaints']} réclamations synthétiques → {cfg.COMPLAINTS_FILE}")
    print(f"✓ vérité terrain → {cfg.GROUND_TRUTH_FILE}")
    print(f"  campagnes mules : {len(gt['campaigns'])}")
    for c in gt["campaigns"]:
        print(
            f"    - {c['campaign_id']} : {c['n_victims']} victimes, "
            f"{len(c['operators'])} opérateurs, {c['total_fcfa']:,} FCFA, "
            f"mule chez {c['mule_operator']}".replace(",", " ")
        )
    print(f"  incidents : {len(gt['incidents'])} ({gt['incidents'][0]['n_complaints']} plaintes)")
    print(f"  leurres (faux positifs attendus de la règle brute) : {len(gt['decoys'])}")
    print("  répartition par typologie :")
    for k, v in gt["counts_per_typology"].items():
        print(f"    {k:32s} {v:6d}")


if __name__ == "__main__":
    main()
