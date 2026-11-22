"""Le générateur synthétique et sa vérité terrain."""

from __future__ import annotations

from datetime import datetime

from reclam_graph import config as cfg
from reclam_graph.datagen import scenarios as sc
from reclam_graph.datagen.templates import amount_in_words

from .conftest import needs_data


def test_les_cinq_campagnes_sont_specifiees():
    assert len(sc.CAMPAIGN_SPECS) == cfg.N_MULE_CAMPAIGNS == 5
    ids = [c["campaign_id"] for c in sc.CAMPAIGN_SPECS]
    assert len(set(ids)) == 5


def test_chaque_campagne_touche_au_moins_deux_reseaux():
    """Sinon elle serait détectable par un opérateur seul, et ne prouverait rien."""
    for spec in sc.CAMPAIGN_SPECS:
        operateurs = {v[0] for v in spec["victims"]}
        assert len(operateurs) >= cfg.MULE_MIN_OPERATORS
        assert len(spec["victims"]) >= cfg.MULE_MIN_COMPLAINANTS


def test_la_campagne_de_demo_porte_les_chiffres_du_pitch():
    cmp01 = next(c for c in sc.CAMPAIGN_SPECS if c.get("narrative"))
    assert cmp01["campaign_id"] == "CMP-01"
    assert len(cmp01["victims"]) == 7
    assert sum(v[1] for v in cmp01["victims"]) == 162_000
    assert len({v[0] for v in cmp01["victims"]}) == 3


def test_le_modele_de_retrait_est_decroissant():
    valeurs = [
        sc.freezable_fcfa(162_000, 162_000, m, 2_000) for m in range(0, 120, 10)
    ]
    assert valeurs == sorted(valeurs, reverse=True)
    assert sc.freezable_fcfa(162_000, 162_000, 22, 2_000) == 118_000


def test_on_ne_retire_pas_plus_que_ce_qui_est_arrive():
    assert sc.withdrawn_fcfa(60, 10_000, 50_000) == 50_000


def test_les_montants_en_lettres_sont_du_francais():
    assert amount_in_words(25) == "vingt cinq mille"
    assert amount_in_words(75) == "soixante quinze mille"
    assert amount_in_words(95) == "quatre vingt quinze mille"


# --------------------------------------------------------------------------
# Sur le jeu produit
# --------------------------------------------------------------------------
@needs_data
def test_le_volume_et_la_duree_sont_ceux_annonces(complaints, ground_truth):
    assert len(complaints) == cfg.N_COMPLAINTS == 20_000
    assert ground_truth["n_days"] == cfg.N_DAYS == 7
    assert set(ground_truth["operators"]) == set(cfg.OPERATORS)
    assert len(cfg.OPERATORS) == 3


@needs_data
def test_le_jeu_est_annonce_comme_synthetique(ground_truth):
    assert ground_truth["synthetic"] is True
    assert "synthétiques" in ground_truth["warning"]
    assert "fictifs" in ground_truth["warning"]


@needs_data
def test_les_scenarios_demandes_sont_tous_presents(ground_truth):
    assert len(ground_truth["campaigns"]) == 5
    assert len(ground_truth["incidents"]) == cfg.N_INCIDENTS == 1
    assert len(ground_truth["decoys"]) == 2
    assert ground_truth["isolated_scams"]["n"] > 0


@needs_data
def test_l_alias_de_chaque_mule_n_est_designe_que_par_ses_victimes(
    complaints, ground_truth
):
    """Invariant : une collision d'alias fausserait tous les chiffres."""
    for campaign in ground_truth["campaigns"]:
        alias = campaign["mule_alias"].lower()
        designant = {
            c.complaint_id
            for c in complaints
            if (c.gt_beneficiary_alias or "").lower() == alias
        }
        attendu = {v["complaint_id"] for v in campaign["victims"]}
        assert designant == attendu, f"{campaign['campaign_id']} : grappe polluée"


@needs_data
def test_chaque_plainte_de_campagne_est_joignable(complaints, ground_truth, directory):
    """Alias cité en clair, ou numéro résoluble via l'annuaire PI-SPI."""
    from reclam_graph.pseudonymize import resolve_beneficiary

    for campaign in ground_truth["campaigns"]:
        for v in campaign["victims"]:
            c = next(x for x in complaints if x.complaint_id == v["complaint_id"])
            resolu = resolve_beneficiary(
                c.gt_beneficiary_alias, c.gt_beneficiary_msisdn, directory
            )
            assert resolu == campaign["mule_alias"].lower()


@needs_data
def test_le_generateur_est_deterministe(tmp_path, ground_truth):
    """Même graine, mêmes données : le jury doit pouvoir rejouer la démo."""
    from reclam_graph.datagen.generator import generate_dataset

    rejoue = generate_dataset(
        n_complaints=2_000,
        seed=cfg.SEED,
        out_complaints=tmp_path / "c.jsonl",
        out_ground_truth=tmp_path / "gt.json",
        out_directory=tmp_path / "dir.json",
    )
    encore = generate_dataset(
        n_complaints=2_000,
        seed=cfg.SEED,
        out_complaints=tmp_path / "c2.jsonl",
        out_ground_truth=tmp_path / "gt2.json",
        out_directory=tmp_path / "dir2.json",
    )
    assert (tmp_path / "c.jsonl").read_text() == (tmp_path / "c2.jsonl").read_text()
    assert rejoue["counts_per_typology"] == encore["counts_per_typology"]


@needs_data
def test_le_pic_d_incident_depasse_nettement_le_volume_habituel(complaints, ground_truth):
    inc = ground_truth["incidents"][0]
    debut = datetime.fromisoformat(inc["window_start"])
    fin = datetime.fromisoformat(inc["window_end"])
    pendant = sum(
        1
        for c in complaints
        if c.gt_typology.value == inc["typology"] and debut <= c.received_at <= fin
    )
    heures = (fin - debut).total_seconds() / 3600
    total = sum(1 for c in complaints if c.gt_typology.value == inc["typology"])
    moyenne_horaire = total / (cfg.N_DAYS * 24)
    assert pendant / heures > 3 * moyenne_horaire


@needs_data
def test_du_texte_ambigu_est_present_dans_les_deux_classes(complaints):
    """Sans ambiguïté, toute F1 de classification sur ce corpus est un artefact."""
    ambigus = [c for c in complaints if c.gt_text_is_ambiguous]
    assert len(ambigus) > 100
    classes = {c.gt_typology for c in ambigus}
    assert len(classes) >= 2
