"""Le pipeline de bout en bout et les sorties qu'il publie."""

from __future__ import annotations

import json

from reclam_graph import config as cfg

from .conftest import needs_data, needs_results


# --------------------------------------------------------------------------
# Confidentialité : ce qui quitte l'opérateur
# --------------------------------------------------------------------------
@needs_data
def test_rien_de_nominatif_ne_quitte_l_operateur(complaints, oracle_records):
    """Le SharedRecord ne doit contenir ni texte, ni nom, ni numéro en clair."""
    textes = {c.text for c in complaints}
    noms = {c.complainant_name for c in complaints}
    numeros = {c.complainant_msisdn for c in complaints}
    for rec in oracle_records[:2000]:
        brut = rec.model_dump_json()
        assert rec.local_complaint_ref  # référence opaque, résolvable chez l'opérateur
        for valeur in (rec.alias_hmac, rec.complainant_hmac):
            assert "@" not in valeur
            assert not valeur.startswith("+")
        assert rec.model_dump().get("text") is None
        for nom in list(noms)[:50]:
            assert nom not in brut
        for num in list(numeros)[:50]:
            assert num not in brut
    # aucun texte de plainte ne se retrouve dans un enregistrement partagé
    partages = " ".join(r.model_dump_json() for r in oracle_records[:500])
    for texte in list(textes)[:50]:
        assert texte not in partages


@needs_data
def test_les_montants_partages_sont_arrondis(oracle_records):
    for rec in oracle_records:
        assert rec.amount_rounded_fcfa % cfg.AMOUNT_ROUNDING_FCFA == 0


@needs_data
def test_une_plainte_sans_beneficiaire_ne_quitte_pas_l_operateur(
    complaints, oracle_records
):
    """Partage minimal : si le hub n'en ferait rien, ça ne sort pas."""
    partages = {r.local_complaint_ref for r in oracle_records}
    sans_beneficiaire = [
        c
        for c in complaints
        if not c.gt_beneficiary_alias and not c.gt_beneficiary_msisdn
    ]
    assert sans_beneficiaire
    for c in sans_beneficiaire:
        assert c.complaint_id not in partages
    assert len(partages) < len(complaints)


# --------------------------------------------------------------------------
# Exécution du pipeline
# --------------------------------------------------------------------------
@needs_data
def test_le_pipeline_tourne_sans_llm_ni_gpu():
    """Exigence de la démo : aucune dépendance à une session GPU en direct."""
    from reclam_graph.pipeline import run

    bundle = run(engine="heuristic", embed_engine="tfidf", limit=4000, write=False,
                 verbose=False)
    assert bundle["volumes"]["n_reclamations"] == 4000
    assert bundle["meta"]["etiquette_execution"]
    assert bundle["audit"]["chaine_integre"] is True
    assert "heuristic-fallback" in bundle["meta"]["moteurs_extraction"]


@needs_data
def test_le_pipeline_etiquette_toujours_le_materiel():
    from reclam_graph.pipeline import run

    bundle = run(engine="regex", embed_engine="tfidf", limit=1500, write=False,
                 verbose=False)
    label = bundle["meta"]["etiquette_execution"]
    assert ("CPU run" in label) == (not cfg.HARDWARE.has_gpu)
    assert bundle["meta"]["donnees"].startswith("SYNTHÉTIQUES")


# --------------------------------------------------------------------------
# Le paquet de démonstration
# --------------------------------------------------------------------------
@needs_results
def test_le_paquet_de_demo_contient_tout_ce_qu_affiche_l_interface(bundle):
    for cle in (
        "meta", "volumes", "alertes_consortium", "alertes_operateur_seul",
        "incidents", "graphes", "courbes_gelables", "cas_demo", "dossiers",
        "audit", "verite_terrain",
    ):
        assert cle in bundle, f"clé manquante : {cle}"


@needs_results
def test_le_cas_de_demo_est_complet(bundle):
    cas = bundle["cas_demo"]
    assert cas["campagne"] == "CMP-01"
    assert cas["reclamation"]["text"]
    assert cas["alerte"] is not None
    assert cas["dossier"]["decision"] == "GELER"
    assert "ne gèle jamais" in cas["dossier_markdown"]
    assert len(cas["chronologie"]) == 7


@needs_results
def test_le_libelle_d_alerte_est_celui_du_pitch(bundle):
    cas = bundle["cas_demo"]
    assert cas["resume_alerte"] == (
        "mule probable, 7 plaignants, 3 opérateurs, 162 000 FCFA "
        "dont 118 000 encore sur le compte"
    )


@needs_results
def test_la_chaine_d_audit_du_paquet_est_integre(bundle):
    from reclam_graph.audit import AuditLog, verify_chain

    assert bundle["audit"]["chaine_integre"] is True
    entrees = AuditLog.load(cfg.AUDIT_FILE)
    assert entrees
    assert verify_chain(entrees)[0] is True


@needs_results
def test_chaque_alerte_tracee_porte_ses_preuves_et_ses_seuils():
    from reclam_graph.audit import AuditLog

    alertes = [
        e for e in AuditLog.load(cfg.AUDIT_FILE)
        if e.action == "ALERTE_MULE_RECOMMANDEE"
    ]
    assert alertes
    for e in alertes:
        assert e.rule
        assert e.thresholds["plaignants_min"] == cfg.MULE_MIN_COMPLAINANTS
        assert e.thresholds["operateurs_min"] == cfg.MULE_MIN_OPERATORS
        assert e.evidence["preuves_reclamations"]
        assert e.human_validator is None  # la décision humaine reste à prendre


@needs_results
def test_le_graphe_de_l_interface_est_pseudonymise(bundle):
    for graphe in bundle["graphes"].values():
        for noeud in graphe["nodes"]:
            if noeud["kind"] != "operateur":
                assert "@" not in noeud["id"]
                assert not noeud["id"].startswith("+")


# --------------------------------------------------------------------------
# Le banc de mesure
# --------------------------------------------------------------------------
@needs_results
def test_le_banc_n_annonce_aucun_chiffre_llm_non_mesure():
    """Règle absolue du brief : jamais de chiffre non mesuré."""
    if not cfg.BENCHMARK_JSON.exists():
        import pytest

        pytest.skip("results/benchmark.json absent — lancer `make bench`")
    r = json.loads(cfg.BENCHMARK_JSON.read_text(encoding="utf-8"))
    llm = r["extraction_champs"]["llm"]
    if not llm.get("mesure"):
        assert "note" in llm and "on mesuré" in llm["note"]
        assert r["debit"]["llm"].get("mesure") == "non mesuré"
    cout = r["cout"]
    if not cfg.GPU_HOURLY_PRICE_FCFA:
        assert cout["cout_inference_locale_pour_1000_fcfa"] == "non calculé"
    if not cfg.HARDWARE.has_gpu:
        assert any("AUCUN GPU" in a for a in cout["avertissements"])


@needs_results
def test_le_banc_etiquette_les_estimations():
    if not cfg.BENCHMARK_JSON.exists():
        import pytest

        pytest.skip("results/benchmark.json absent")
    r = json.loads(cfg.BENCHMARK_JSON.read_text(encoding="utf-8"))
    cout = r["cout"]
    assert "estimation" in cout["cout_humain_pour_1000_fcfa"]["etiquette"]
    assert any("HYPOTHÈSE" in a or "ESTIMATIONS" in a for a in cout["avertissements"])


@needs_results
def test_le_consortium_bat_la_reference_sur_les_trois_metriques_qui_comptent():
    if not cfg.BENCHMARK_JSON.exists():
        import pytest

        pytest.skip("results/benchmark.json absent")
    r = json.loads(cfg.BENCHMARK_JSON.read_text(encoding="utf-8"))
    m = r["detection_mules"]["avec_extraction_heuristique"]
    cons, seul = m["consortium"], m["operateur_seul"]
    assert cons["rappel"] > seul["rappel"]
    assert cons["delai_detection_median_minutes"] < seul["delai_detection_median_minutes"]
    assert cons["fcfa_encore_gelables_total"] > seul["fcfa_encore_gelables_total"]
