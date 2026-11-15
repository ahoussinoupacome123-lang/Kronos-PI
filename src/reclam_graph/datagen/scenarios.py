"""Scénarios injectés dans le jeu synthétique (section 4 du brief).

Les cinq campagnes d'arnaque « erreur de dépôt » sont **spécifiées
explicitement** et non tirées au hasard : le jury doit pouvoir rejouer la
démo et retrouver les mêmes chiffres, et la vérité terrain doit être
auditable ligne à ligne.

Modèle de retrait (« cash-out ») par mule :
    retire(t) = min( credits_recus(t), taux * (t - debut_retrait) )  si t >= debut_retrait
    gelable(t) = total_credits_campagne - retire(t)

`gelable(t)` est le montant que l'opérateur sauve s'il suspend le compte à
l'instant t : ce qui n'est pas encore sorti, plus tout ce qui arrivera
ensuite. La fonction décroît avec t, donc alerter plus tôt sauve toujours
plus — c'est la métrique « FCFA encore gelables » de la section 5.
"""

from __future__ import annotations

from typing import Any

# Chaque victime : (opérateur du plaignant, montant FCFA, heure du crédit, heure de la plainte)
CAMPAIGN_SPECS: list[dict[str, Any]] = [
    {
        # --- Campagne de la démo (section 7 du brief) : mardi 14:02 ---
        "campaign_id": "CMP-01",
        "label": "Arnaque erreur de dépôt — mule hébergée chez BETACASH",
        "day_offset": 1,  # mardi
        "mule_operator": "BETACASH",
        "mule_alias": "koffi.santos@betacash",
        "narrative": True,  # la victime 1 est Aïcha, cas d'ouverture de la démo
        "cashout_start": "14:40",
        "cashout_rate_fcfa_per_min": 2000,
        "victims": [
            ("ALPHAMONEY", 25_000, "14:02", "14:09"),
            ("BETACASH", 30_000, "14:06", "14:16"),
            ("GAMMAPAY", 18_000, "14:10", "14:21"),
            ("ALPHAMONEY", 22_000, "14:14", "14:33"),
            ("BETACASH", 27_000, "14:19", "14:41"),
            ("ALPHAMONEY", 15_000, "14:25", "14:52"),
            ("GAMMAPAY", 25_000, "14:31", "15:02"),
        ],
    },
    {
        # --- Mule chez l'opérateur qui a le plus de victimes : l'opérateur seul
        #     finit par voir le motif, mais tard.
        "campaign_id": "CMP-02",
        "label": "Arnaque erreur de dépôt — mule hébergée chez ALPHAMONEY",
        "day_offset": 2,
        "mule_operator": "ALPHAMONEY",
        "mule_alias": "rachelle.gbedo@alphamoney",
        "cashout_start": "09:30",
        "cashout_rate_fcfa_per_min": 2500,
        "victims": [
            ("ALPHAMONEY", 20_000, "09:05", "09:12"),
            ("BETACASH", 15_000, "09:08", "09:19"),
            ("ALPHAMONEY", 25_000, "09:12", "09:24"),
            ("GAMMAPAY", 30_000, "09:17", "09:31"),
            ("ALPHAMONEY", 18_000, "09:22", "09:38"),
            ("BETACASH", 22_000, "09:28", "09:45"),
            ("ALPHAMONEY", 12_000, "09:33", "09:52"),
            ("GAMMAPAY", 16_000, "09:40", "09:58"),
            ("BETACASH", 24_000, "09:46", "10:05"),
        ],
    },
    {
        # --- Victimes réparties 2/2/2 : aucun opérateur seul n'atteint 3.
        "campaign_id": "CMP-03",
        "label": "Arnaque erreur de dépôt — victimes réparties 2/2/2",
        "day_offset": 3,
        "mule_operator": "GAMMAPAY",
        "mule_alias": "ibrahim.tidjani@gammapay",
        "cashout_start": "11:50",
        "cashout_rate_fcfa_per_min": 3000,
        "victims": [
            ("ALPHAMONEY", 35_000, "11:10", "11:18"),
            ("BETACASH", 28_000, "11:15", "11:26"),
            ("GAMMAPAY", 20_000, "11:21", "11:33"),
            ("ALPHAMONEY", 24_000, "11:28", "11:47"),
            ("BETACASH", 31_000, "11:35", "11:58"),
            ("GAMMAPAY", 17_000, "11:42", "12:09"),
        ],
    },
    {
        # --- Grosse campagne, retrait precoce : la course contre le cash-out.
        "campaign_id": "CMP-04",
        "label": "Arnaque erreur de dépôt — grosse campagne, retrait précoce",
        "day_offset": 4,
        "mule_operator": "BETACASH",
        "mule_alias": "fatou.diallo@betacash",
        "cashout_start": "16:30",
        "cashout_rate_fcfa_per_min": 4000,
        "victims": [
            ("BETACASH", 18_000, "16:02", "16:10"),
            ("ALPHAMONEY", 22_000, "16:06", "16:17"),
            ("BETACASH", 26_000, "16:11", "16:23"),
            ("GAMMAPAY", 14_000, "16:16", "16:31"),
            ("BETACASH", 30_000, "16:22", "16:39"),
            ("ALPHAMONEY", 19_000, "16:27", "16:46"),
            ("BETACASH", 23_000, "16:33", "16:54"),
            ("GAMMAPAY", 21_000, "16:38", "17:02"),
            ("ALPHAMONEY", 16_000, "16:44", "17:11"),
            ("BETACASH", 27_000, "16:50", "17:19"),
            ("GAMMAPAY", 25_000, "16:56", "17:28"),
        ],
    },
    {
        # --- Plaintes etalees : jamais 3 plaignants du meme reseau en 60 min.
        "campaign_id": "CMP-05",
        "label": "Arnaque erreur de dépôt — plaintes étalées, invisible en solo",
        "day_offset": 6,
        "mule_operator": "ALPHAMONEY",
        "mule_alias": "serge.kponou@alphamoney",
        "cashout_start": "10:35",
        "cashout_rate_fcfa_per_min": 2200,
        "victims": [
            ("ALPHAMONEY", 21_000, "10:04", "10:12"),
            ("BETACASH", 17_000, "10:09", "10:21"),
            ("GAMMAPAY", 29_000, "10:14", "10:27"),
            ("ALPHAMONEY", 23_000, "10:20", "10:44"),
            ("BETACASH", 26_000, "10:26", "10:58"),
            ("GAMMAPAY", 19_000, "10:33", "11:12"),
            ("BETACASH", 31_000, "10:40", "11:26"),
            ("GAMMAPAY", 14_000, "10:47", "11:39"),
        ],
    },
]


# --- Incident PI-SPI : vague de timeouts sur les trois réseaux -------------
INCIDENT_SPEC: dict[str, Any] = {
    "incident_id": "INC-01",
    "label": "Panne d'interopérabilité PI-SPI — vague de timeouts",
    "day_offset": 4,  # vendredi simulé
    "window_start": "13:00",
    "window_end": "16:00",
    "n_complaints": 320,
    "typology": "RETARD_TIMEOUT",
    "operators": ["ALPHAMONEY", "BETACASH", "GAMMAPAY"],
}


# --- Leurres : grappes legitimes qui declenchent la regle brute ------------
# Elles existent pour que la PRECISION mesuree soit une vraie mesure et non
# un 1.00 fabrique. Ce sont des erreurs sinceres vers un alias tres sollicite
# (facturier, marchand) : la regle 3/2/60 se declenche, alors qu'il n'y a
# aucune fraude. C'est exactement pour cela que la decision reste humaine.
DECOY_SPECS: list[dict[str, Any]] = [
    {
        "decoy_id": "DEC-01",
        "label": "Facturier très sollicité — erreurs sincères groupées",
        "alias": "paiement.energie@gammapay",
        "host_operator": "GAMMAPAY",
        "day_offset": 2,
        "complainants": [
            ("ALPHAMONEY", 12_000, "18:04"),
            ("BETACASH", 9_500, "18:19"),
            ("ALPHAMONEY", 15_000, "18:33"),
            ("GAMMAPAY", 7_000, "18:48"),
        ],
    },
    {
        "decoy_id": "DEC-02",
        "label": "Marchand de quartier homonyme — erreurs sincères groupées",
        "alias": "boutique.akpakpa@alphamoney",
        "host_operator": "ALPHAMONEY",
        "day_offset": 5,
        "complainants": [
            ("BETACASH", 6_000, "12:10"),
            ("GAMMAPAY", 11_000, "12:26"),
            ("BETACASH", 8_500, "12:41"),
        ],
    },
]


def withdrawn_fcfa(
    minutes_since_cashout: float,
    rate_fcfa_per_min: float,
    credits_received_fcfa: int,
) -> int:
    """Montant déjà retiré par la mule, borné par ce qu'elle a réellement reçu."""
    if minutes_since_cashout <= 0:
        return 0
    return int(min(credits_received_fcfa, rate_fcfa_per_min * minutes_since_cashout))


def freezable_fcfa(
    total_campaign_fcfa: int,
    credits_received_fcfa: int,
    minutes_since_cashout: float,
    rate_fcfa_per_min: float,
) -> int:
    """FCFA encore gelables si le compte est suspendu à cet instant.

    = total de la campagne - ce qui est déjà sorti. Décroissante dans le
    temps : alerter plus tôt sauve toujours plus.
    """
    out = withdrawn_fcfa(minutes_since_cashout, rate_fcfa_per_min, credits_received_fcfa)
    return max(0, total_campaign_fcfa - out)
