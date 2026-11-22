"""Hub de corrélation inter-opérateurs (bloc 5).

Le hub ne voit que des `SharedRecord` : opérateur, horodatage, typologie,
alias haché, plaignant haché, montant arrondi. Il construit un graphe
(plaignants, bénéficiaires, opérateurs) et applique la règle suivante, qui
est **visible dans la démo et non négociable** :

    au moins 3 plaignants indépendants,
    sur au moins 2 réseaux distincts,
    dans une fenêtre glissante de 60 minutes
    -> alerte « mule probable »

Réclam'Graph **recommande et documente ; il ne gèle jamais de lui-même**. La
décision reste humaine, chez l'opérateur, et elle est tracée dans l'audit.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Iterable, Sequence

import networkx as nx

from . import config as cfg
from .schemas import TRANSFER_TYPOLOGIES, MuleAlert, SharedRecord, Typology

#: Au-delà de cette durée après la première alerte, on considère que la
#: campagne est close et on n'agrège plus de nouvelles plaintes dedans.
CONSOLIDATION_HOURS = 6


# ---------------------------------------------------------------------------
# Graphe
# ---------------------------------------------------------------------------
def build_graph(records: Sequence[SharedRecord]) -> nx.MultiGraph:
    """Graphe tripartite plaignants / bénéficiaires / opérateurs.

    Utilisé par l'UI pour l'animation, et par le score pour mesurer la
    diversité des réseaux autour d'un bénéficiaire.
    """
    g = nx.MultiGraph()
    for r in records:
        g.add_node(r.alias_hmac, kind="beneficiaire", label=f"mule?{r.alias_hmac[:6]}")
        g.add_node(r.complainant_hmac, kind="plaignant", operator=r.operator)
        g.add_node(r.operator, kind="operateur")
        g.add_edge(
            r.complainant_hmac,
            r.alias_hmac,
            key=r.record_id,
            kind="plainte",
            ts=r.ts,
            typology=r.typology.value,
            amount=r.amount_rounded_fcfa,
            operator=r.operator,
        )
        g.add_edge(r.complainant_hmac, r.operator, key=f"{r.record_id}-op", kind="client")
    return g


# ---------------------------------------------------------------------------
# Score
# ---------------------------------------------------------------------------
def score_cluster(records: Sequence[SharedRecord]) -> tuple[float, dict[str, float]]:
    """Score 0..1 de vraisemblance « compte mule ».

    La règle 3/2/60 décide du *déclenchement* ; le score sert à **classer** les
    alertes et à séparer une campagne d'arnaque d'une grappe légitime (un
    facturier très sollicité reçoit lui aussi des erreurs sincères de
    plusieurs réseaux dans l'heure). Les deux leurres du jeu synthétique
    existent précisément pour que ce score soit évalué honnêtement.
    """
    n_compl = len({r.complainant_hmac for r in records})
    n_ops = len({r.operator for r in records})
    n_scam = sum(1 for r in records if r.typology == Typology.ARNAQUE_ERREUR_DEPOT)
    share_scam = n_scam / len(records) if records else 0.0
    span_min = max(
        1.0, (max(r.ts for r in records) - min(r.ts for r in records)).total_seconds() / 60.0
    )
    rate = len(records) / span_min  # plaintes par minute : une campagne est rapide

    features = {
        # saturation douce : 3 plaignants -> 0.50, 6 -> 0.75, 9 -> 0.83
        "plaignants": min(1.0, n_compl / (n_compl + 3.0) * 2.0),
        "operateurs": min(1.0, (n_ops - 1) / 2.0),
        "typologie_arnaque": share_scam,
        "intensite": min(1.0, rate / 0.2),
    }
    # Pondération : le score doit mesurer ce que la RÈGLE NE MESURE PAS.
    # La règle garantit déjà au moins 3 plaignants et 2 opérateurs ; ces deux
    # grandeurs sont donc quasi constantes d'une alerte à l'autre et ne
    # discriminent rien. Les surpondérer a produit un vrai défaut : une grappe
    # légitime (facturier très sollicité, 3 plaignants, 3 réseaux, aucune
    # arnaque) atteignait 0,525 et passait prioritaire. Le poids va donc à ce
    # qui distingue réellement une campagne : la typologie d'arnaque et la
    # vitesse d'arrivée des plaintes (une campagne est brutale, les erreurs
    # d'un facturier arrivent au compte-gouttes).
    #
    # Contrainte à assumer : le hub ne reçoit PAS les indices d'arnaque
    # extraits du texte — ils ne quittent pas l'opérateur. La typologie est
    # donc le seul signal de fraude disponible côté hub, et c'est voulu.
    weights = {
        "plaignants": 0.15,
        "operateurs": 0.10,
        "typologie_arnaque": 0.50,
        "intensite": 0.25,
    }
    score = sum(features[k] * weights[k] for k in weights)
    return round(min(1.0, score), 4), {k: round(v, 4) for k, v in features.items()}


#: Au-dessus de ce score, l'alerte est présentée comme prioritaire. En
#: dessous, elle reste affichée mais signalée « à qualifier » — jamais
#: supprimée en silence : c'est l'opérateur qui tranche.
SCORE_PRIORITY_THRESHOLD = 0.50


# ---------------------------------------------------------------------------
# Règle à fenêtre glissante
# ---------------------------------------------------------------------------
@dataclass
class RuleConfig:
    min_complainants: int = cfg.MULE_MIN_COMPLAINANTS
    min_operators: int = cfg.MULE_MIN_OPERATORS
    window_minutes: int = cfg.MULE_WINDOW_MINUTES
    #: Si vrai, seules les typologies « transfert parti vers un tiers »
    #: alimentent la règle (les frais contestés ne désignent personne).
    transfer_typologies_only: bool = True
    #: Nom de l'approche, pour la traçabilité des résultats.
    label: str = "consortium"

    def describe(self) -> str:
        return (
            f"{self.min_complainants} plaignants distincts, "
            f"{self.min_operators} opérateur(s) distinct(s), "
            f"fenêtre de {self.window_minutes} min"
        )


def _eligible(records: Iterable[SharedRecord], rule: RuleConfig) -> list[SharedRecord]:
    rows = [
        r
        for r in records
        if not rule.transfer_typologies_only or r.typology in TRANSFER_TYPOLOGIES
    ]
    return sorted(rows, key=lambda r: r.ts)


def detect_mule_alerts(
    records: Sequence[SharedRecord],
    rule: RuleConfig | None = None,
) -> list[MuleAlert]:
    """Applique la règle à fenêtre glissante, alias par alias.

    Pour chaque alias, on parcourt les plaintes dans l'ordre du temps ; à
    chaque nouvelle plainte on regarde les `window_minutes` écoulées. Dès que
    les deux seuils sont franchis, l'alerte est émise à **l'horodatage de la
    plainte qui a fait basculer la règle** — c'est ce point qui donne le
    « délai de détection » de la section 5.
    """
    rule = rule or RuleConfig()
    window = timedelta(minutes=rule.window_minutes)
    by_alias: dict[str, list[SharedRecord]] = defaultdict(list)
    for r in _eligible(records, rule):
        by_alias[r.alias_hmac].append(r)

    alerts: list[MuleAlert] = []
    for alias, rows in by_alias.items():
        fired_at: datetime | None = None
        fired_window: list[SharedRecord] = []
        for i, row in enumerate(rows):
            win = [x for x in rows[: i + 1] if row.ts - x.ts <= window]
            if (
                len({x.complainant_hmac for x in win}) >= rule.min_complainants
                and len({x.operator for x in win}) >= rule.min_operators
            ):
                fired_at = row.ts
                fired_window = win
                break
        if fired_at is None:
            continue

        # Consolidation : tout ce qui concerne cet alias autour de l'alerte.
        horizon = fired_at + timedelta(hours=CONSOLIDATION_HOURS)
        cluster = [x for x in rows if fired_at - window <= x.ts <= horizon]
        first_at = min(x.ts for x in cluster)
        last_at = max(x.ts for x in cluster)
        score, features = score_cluster(cluster)
        operators = sorted({x.operator for x in cluster})

        alerts.append(
            MuleAlert(
                alert_id=f"ALERT-{rule.label}-{alias[:10]}",
                alias_hmac=alias,
                alert_at=fired_at,
                first_complaint_at=first_at,
                detection_delay_minutes=round(
                    (fired_at - first_at).total_seconds() / 60.0, 2
                ),
                n_complainants=len({x.complainant_hmac for x in cluster}),
                n_operators=len(operators),
                operators=operators,
                total_fcfa=sum(x.amount_rounded_fcfa for x in cluster),
                freezable_fcfa=0,  # rempli par attach_impact()
                score=score,
                rule=rule.describe(),
                evidence_record_ids=[x.record_id for x in cluster],
                evidence_complaint_refs=[x.local_complaint_ref for x in cluster],
                detected_by=rule.label,
                n_complainants_at_alert=len({x.complainant_hmac for x in fired_window}),
                n_operators_at_alert=len({x.operator for x in fired_window}),
                total_fcfa_at_alert=sum(x.amount_rounded_fcfa for x in fired_window),
                last_update_at=last_at,
                score_features=features,
                is_priority=score >= SCORE_PRIORITY_THRESHOLD,
            )
        )
    alerts.sort(key=lambda a: a.alert_at)
    return alerts


# ---------------------------------------------------------------------------
# Référence : l'opérateur seul
# ---------------------------------------------------------------------------
def detect_baseline_alerts(
    records: Sequence[SharedRecord],
    rule: RuleConfig | None = None,
) -> list[MuleAlert]:
    """La situation actuelle : chaque opérateur ne voit que ses propres plaintes.

    Même seuil de plaignants, mais un seul réseau par définition. C'est la
    « référence » que le jury demande : l'opérateur seul avec son tri par
    mots-clés. On n'invente pas une référence faible — on lui donne la même
    règle de corrélation, simplement privée des autres opérateurs.
    """
    rule = rule or RuleConfig(min_operators=1, label="operateur-seul")
    out: list[MuleAlert] = []
    by_operator: dict[str, list[SharedRecord]] = defaultdict(list)
    for r in records:
        by_operator[r.operator].append(r)
    for operator, rows in by_operator.items():
        for alert in detect_mule_alerts(rows, rule):
            alert.alert_id = f"ALERT-{operator}-{alert.alias_hmac[:10]}"
            alert.detected_by = f"operateur-seul:{operator}"
            out.append(alert)
    out.sort(key=lambda a: a.alert_at)
    return out


# ---------------------------------------------------------------------------
# Impact : FCFA encore gelables
# ---------------------------------------------------------------------------
@dataclass
class CashoutModel:
    """Modèle de retrait d'une mule, issu de la vérité terrain synthétique.

    Ce modèle n'est **pas** une mesure du monde réel : c'est le scénario
    simulé qui permet de chiffrer « combien il restait à geler quand l'alerte
    est tombée ». À étiqueter comme tel partout où le chiffre est montré.
    """

    campaign_id: str
    mule_operator: str
    total_fcfa: int
    cashout_start_at: datetime
    rate_fcfa_per_min: float
    credits: list[tuple[datetime, int]] = field(default_factory=list)

    def credits_received_by(self, t: datetime) -> int:
        return sum(a for ts, a in self.credits if ts <= t)

    def withdrawn_by(self, t: datetime) -> int:
        if t <= self.cashout_start_at:
            return 0
        minutes = (t - self.cashout_start_at).total_seconds() / 60.0
        return int(min(self.credits_received_by(t), self.rate_fcfa_per_min * minutes))

    def freezable_at(self, t: datetime) -> int:
        """FCFA sauvés si le compte est suspendu à l'instant `t`.

        = total de la campagne - ce qui est déjà sorti. Décroît avec le temps,
        donc une alerte plus précoce sauve toujours plus.
        """
        return max(0, self.total_fcfa - self.withdrawn_by(t))

    def balance_curve(self, step_minutes: int = 2) -> list[tuple[str, int]]:
        """Courbe « FCFA encore gelables » pour le compteur de la démo."""
        start = min(ts for ts, _ in self.credits) if self.credits else self.cashout_start_at
        end = self.cashout_start_at + timedelta(
            minutes=max(1.0, self.total_fcfa / max(1.0, self.rate_fcfa_per_min)) + 10
        )
        out: list[tuple[str, int]] = []
        t = start
        while t <= end:
            out.append((t.isoformat(), self.freezable_at(t)))
            t += timedelta(minutes=step_minutes)
        return out


def cashout_models_from_ground_truth(ground_truth: dict[str, Any]) -> dict[str, CashoutModel]:
    """Construit un modèle de retrait par campagne à partir de la vérité terrain."""
    models: dict[str, CashoutModel] = {}
    for c in ground_truth.get("campaigns", []):
        models[c["campaign_id"]] = CashoutModel(
            campaign_id=c["campaign_id"],
            mule_operator=c["mule_operator"],
            total_fcfa=c["total_fcfa"],
            cashout_start_at=datetime.fromisoformat(c["cashout_start_at"]),
            rate_fcfa_per_min=float(c["cashout_rate_fcfa_per_min"]),
            credits=[
                (datetime.fromisoformat(v["credit_at"]), v["amount_fcfa"])
                for v in c["victims"]
            ],
        )
    return models


def map_alerts_to_campaigns(
    alerts: Sequence[MuleAlert], ground_truth: dict[str, Any]
) -> dict[str, str | None]:
    """Rattache chaque alerte à une campagne de la vérité terrain (ou à rien).

    Le rattachement se fait par les références de plaintes citées en preuve :
    une alerte est vraie si la majorité de ses preuves appartient à une même
    campagne. Une alerte sans campagne est un faux positif.
    """
    ref_to_campaign: dict[str, str] = {}
    for c in ground_truth.get("campaigns", []):
        for v in c["victims"]:
            ref_to_campaign[v["complaint_id"]] = c["campaign_id"]

    out: dict[str, str | None] = {}
    for a in alerts:
        votes: dict[str, int] = defaultdict(int)
        for ref in a.evidence_complaint_refs:
            cid = ref_to_campaign.get(ref)
            if cid:
                votes[cid] += 1
        out[a.alert_id] = max(votes, key=votes.get) if votes else None
    return out


def attach_impact(
    alerts: Sequence[MuleAlert],
    ground_truth: dict[str, Any],
    *,
    require_same_operator_to_act: bool = False,
) -> list[MuleAlert]:
    """Calcule les FCFA encore gelables au moment de chaque alerte.

    `require_same_operator_to_act=True` modélise la référence : un opérateur
    seul qui repère le motif ne peut pas suspendre un compte hébergé chez un
    concurrent. Il doit le lui demander à la main — c'est le traitement à J+5
    du scénario de démo. Dans ce cas, le montant gelable est nul.
    """
    models = cashout_models_from_ground_truth(ground_truth)
    mapping = map_alerts_to_campaigns(alerts, ground_truth)
    for a in alerts:
        campaign_id = mapping.get(a.alert_id)
        a.gt_campaign_id = campaign_id
        if not campaign_id:
            a.freezable_fcfa = 0
            a.freezable_at_last_update_fcfa = 0
            a.impact_note = "aucune campagne rattachée (faux positif de la règle)"
            continue
        model = models[campaign_id]
        can_act = True
        if require_same_operator_to_act:
            detecting = a.detected_by.split(":")[-1]
            can_act = detecting == model.mule_operator
        if not can_act:
            a.freezable_fcfa = 0
            a.freezable_at_last_update_fcfa = 0
            a.impact_note = (
                f"motif repéré, mais le compte mule est hébergé chez "
                f"{model.mule_operator} : l'opérateur qui détecte ne peut pas "
                f"suspendre le compte d'un concurrent (demande manuelle, J+5)."
            )
            continue
        a.total_fcfa_exact = model.total_fcfa
        a.freezable_fcfa = model.freezable_at(a.alert_at)
        a.freezable_at_last_update_fcfa = model.freezable_at(
            a.last_update_at or a.alert_at
        )
        a.impact_note = (
            "FCFA sauvés si le compte est suspendu à l'instant de l'alerte "
            "(modèle de retrait du scénario synthétique)."
        )
    return list(alerts)
