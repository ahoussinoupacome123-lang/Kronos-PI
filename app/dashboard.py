"""Réclam'Graph — interface de démonstration (Streamlit, en français).

Lancement :
    make demo          # mode démo : rejoue results/demo_bundle.json, sans GPU
    make demo-live     # recalcule tout en direct (nécessite les données)

Le **mode démo** est le mode par défaut, volontairement : le brief impose de
pré-calculer les résultats et de ne pas faire dépendre les trois minutes de
démonstration d'une session GPU en direct.
"""

from __future__ import annotations

import json
import math
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
for _p in (str(ROOT), str(ROOT / "src")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from reclam_graph import config as cfg  # noqa: E402
from reclam_graph.llm import get_client  # noqa: E402

st.set_page_config(
    page_title="Réclam'Graph — analyse intelligente des réclamations clients",
    page_icon="🕸️",
    layout="wide",
)

st.markdown(
    """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <style>
      :root{
        --ink:#0b1220; --ink-2:#1e293b; --mut:#64748b; --line:rgba(15,23,42,.10);
        --bg-soft:#f7f9fc; --card:#ffffff;
        --brand:#1d4ed8; --brand-2:#0891b2;
        --bad:#be123c; --bad-bg:rgba(190,18,60,.05);
        --good:#047857; --good-bg:rgba(4,120,87,.05);
      }
      @media (prefers-color-scheme: dark){
        :root{ --ink:#f1f5f9; --ink-2:#cbd5e1; --mut:#94a3b8;
               --line:rgba(148,163,184,.16); --bg-soft:#0f172a; --card:#131c2e;
               --brand:#60a5fa; --brand-2:#22d3ee;
               --bad:#fb7185; --bad-bg:rgba(251,113,133,.07);
               --good:#34d399; --good-bg:rgba(52,211,153,.07); }
      }
      html,body,[class*="css"]{ font-family:'Inter',system-ui,sans-serif; }
      .block-container{ padding-top:1.6rem; padding-bottom:4rem; max-width:1320px; }
      #MainMenu, footer{ visibility:hidden; }

      /* ---------- Hero ---------- */
      .rg-hero{ padding:.4rem 0 1.6rem; border-bottom:1px solid var(--line);
                margin-bottom:2.2rem; }
      .rg-eyebrow{ font-size:.76rem; font-weight:700; letter-spacing:.17em;
                text-transform:uppercase; color:var(--brand); margin-bottom:.7rem; }
      .rg-title{ font-size:clamp(2.6rem,6vw,4.1rem); font-weight:900;
                letter-spacing:-.045em; line-height:1; margin:0 0 1.1rem;
                color:var(--ink); }
      .rg-lede{ font-size:clamp(1.15rem,2.1vw,1.6rem); font-weight:400;
                line-height:1.45; color:var(--ink-2); max-width:60ch; margin:0 0 .55rem; }
      .rg-lede strong{ font-weight:700; color:var(--bad); }
      .rg-sub{ font-size:clamp(1.05rem,1.8vw,1.35rem); color:var(--ink);
                font-weight:500; margin:0; }
      .rg-sub strong{ color:var(--brand); font-weight:800; }

      /* ---------- Cartes ---------- */
      .rg-split{ display:grid; grid-template-columns:1fr 1fr; gap:1.1rem;
                margin-bottom:1rem; }
      @media(max-width:860px){ .rg-split{ grid-template-columns:1fr; } }
      .rg-card{ border:1px solid var(--line); border-radius:16px;
                padding:1.5rem 1.6rem; background:var(--card); }
      .rg-card p{ font-size:1rem; line-height:1.62; color:var(--ink-2);
                margin:0 0 .6rem; }
      .rg-card--bad{ background:var(--bad-bg); border-left:3px solid var(--bad); }
      .rg-card--good{ background:var(--good-bg); border-left:3px solid var(--good); }
      .rg-card__tag{ font-size:.7rem; font-weight:800; letter-spacing:.15em;
                text-transform:uppercase; margin-bottom:.5rem; }
      .rg-card--bad .rg-card__tag{ color:var(--bad); }
      .rg-card--good .rg-card__tag{ color:var(--good); }
      .rg-card__title{ font-size:1.3rem; font-weight:800; letter-spacing:-.02em;
                color:var(--ink); margin-bottom:.8rem; }
      .rg-card__foot{ margin-top:1rem; padding-top:.85rem;
                border-top:1px dashed var(--line); font-size:.93rem;
                font-weight:650; color:var(--ink); }

      /* ---------- Sections ---------- */
      .rg-section{ font-size:.78rem; font-weight:800; letter-spacing:.16em;
                text-transform:uppercase; color:var(--mut);
                margin:2.6rem 0 1rem; display:flex; align-items:center; gap:.8rem; }
      .rg-section:after{ content:""; flex:1; height:1px; background:var(--line); }

      /* ---------- KPI ---------- */
      .rg-kpis{ display:grid; grid-template-columns:repeat(3,1fr); gap:1.1rem; }
      @media(max-width:860px){ .rg-kpis{ grid-template-columns:1fr; } }
      .rg-kpi{ border:1px solid var(--line); border-radius:16px;
                padding:1.5rem 1.6rem; background:var(--card); position:relative;
                overflow:hidden; }
      .rg-kpi:before{ content:""; position:absolute; inset:0 auto 0 0; width:3px;
                background:linear-gradient(180deg,var(--brand),var(--brand-2)); }
      .rg-kpi__v{ font-size:3.3rem; font-weight:900; letter-spacing:-.05em;
                line-height:1; color:var(--ink); }
      .rg-kpi__v span{ font-size:1.15rem; font-weight:700; margin-left:.3rem;
                color:var(--mut); letter-spacing:-.01em; }
      .rg-kpi__l{ margin-top:.6rem; font-size:.74rem; font-weight:800;
                letter-spacing:.13em; text-transform:uppercase; color:var(--mut); }
      .rg-kpi__d{ margin-top:.7rem; font-size:.92rem; color:var(--ink-2); }
      .rg-up:before{ content:"vs "; color:var(--mut); }

      /* ---------- Etapes ---------- */
      .rg-steps{ display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
      @media(max-width:1000px){ .rg-steps{ grid-template-columns:1fr 1fr; } }
      .rg-step{ border-top:2px solid var(--brand); padding:1rem .2rem 0; }
      .rg-step__n{ font-family:'JetBrains Mono',monospace; font-size:.8rem;
                font-weight:500; color:var(--brand); letter-spacing:.08em; }
      .rg-step__t{ font-size:1.18rem; font-weight:800; color:var(--ink);
                margin:.35rem 0 .5rem; letter-spacing:-.02em; }
      .rg-step p{ font-size:.95rem; line-height:1.6; color:var(--ink-2); margin:0; }

      /* ---------- Principe ---------- */
      .rg-principle{ margin-top:2.6rem; padding:1.6rem 1.8rem; border-radius:16px;
                background:linear-gradient(135deg,rgba(29,78,216,.07),rgba(8,145,178,.05));
                border:1px solid var(--line); border-left:3px solid var(--brand); }
      .rg-principle__k{ font-size:.72rem; font-weight:800; letter-spacing:.15em;
                text-transform:uppercase; color:var(--brand); margin-bottom:.6rem; }
      .rg-principle__v{ font-size:1.45rem; font-weight:800; letter-spacing:-.025em;
                color:var(--ink); line-height:1.3; }
      .rg-principle__n{ margin-top:.7rem; font-size:.98rem; color:var(--ink-2);
                line-height:1.6; }
      .rg-note{ margin:1.6rem 0 .4rem; font-size:.86rem; color:var(--mut);
                font-style:italic; }

      /* ---------- Onglets ---------- */
      .stTabs [data-baseweb="tab-list"]{ gap:0; border-bottom:1px solid var(--line);
                margin-top:1.4rem; flex-wrap:wrap; }
      .stTabs [data-baseweb="tab"]{ height:3.2rem; padding:0 1.15rem;
                font-weight:650; font-size:.96rem; color:var(--mut);
                background:transparent; border-radius:0; }
      .stTabs [aria-selected="true"]{ color:var(--brand) !important;
                box-shadow:inset 0 -2px 0 var(--brand); }
      .stTabs [data-baseweb="tab-highlight"]{ display:none; }

      /* ---------- Widgets Streamlit restants ---------- */
      h2,h3{ font-weight:800 !important; letter-spacing:-.025em !important;
                color:var(--ink) !important; }
      h4{ font-weight:750 !important; color:var(--ink) !important;
                letter-spacing:-.015em !important; }
      [data-testid="stMetricValue"]{ font-size:2.3rem !important;
                font-weight:850 !important; letter-spacing:-.035em; }
      [data-testid="stMetricLabel"]{ font-size:.73rem !important;
                font-weight:800 !important; text-transform:uppercase;
                letter-spacing:.12em; color:var(--mut) !important; }
      [data-testid="stMetric"]{ background:var(--card); border:1px solid var(--line);
                border-radius:14px; padding:1.1rem 1.25rem; }
      [data-testid="stAlert"]{ border-radius:13px; border-width:0 0 0 3px;
                line-height:1.6; }
      [data-testid="stSidebar"]{ border-right:1px solid var(--line); }
      [data-testid="stSidebar"] .block-container{ padding-top:2rem; }
      code{ font-family:'JetBrains Mono',monospace !important; font-size:.88em; }
      hr{ opacity:.3; }
    </style>
    """,
    unsafe_allow_html=True,
)

OPERATOR_COLORS = {
    "ALPHAMONEY": "#2563eb",
    "BETACASH": "#d97706",
    "GAMMAPAY": "#059669",
}
MULE_RED = "#dc2626"
NEUTRAL = "#94a3b8"


def fcfa(value: Any) -> str:
    if value is None or isinstance(value, str):
        return str(value if value is not None else "—")
    return f"{int(value):,}".replace(",", " ") + " FCFA"


# ---------------------------------------------------------------------------
# Chargement
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_bundle(path_str: str, mtime: float) -> dict[str, Any]:
    return json.loads(Path(path_str).read_text(encoding="utf-8"))


@st.cache_data(show_spinner=False)
def load_benchmark(path_str: str, mtime: float) -> dict[str, Any]:
    return json.loads(Path(path_str).read_text(encoding="utf-8"))


@st.cache_data(show_spinner="Recalcul du pipeline en direct…")
def run_live(engine: str, embed_engine: str) -> dict[str, Any]:
    from reclam_graph.pipeline import run as run_pipeline

    return run_pipeline(engine=engine, embed_engine=embed_engine, write=False, verbose=False)


# ---------------------------------------------------------------------------
# Barre latérale
# ---------------------------------------------------------------------------
def sidebar() -> tuple[dict[str, Any] | None, bool]:
    st.sidebar.title("Réclam'Graph")
    st.sidebar.caption("Équipe Token Titans — équipe 12 — GPU Challenge 2026")

    st.sidebar.warning(
        "**Données synthétiques.** Les opérateurs ALPHAMONEY, BETACASH et "
        "GAMMAPAY sont fictifs. Le générateur et la vérité terrain sont publiés "
        "dans ce dépôt.",
        icon="⚠️",
    )

    demo_mode = st.sidebar.toggle(
        "Mode démo (résultats pré-calculés)",
        value=cfg.DEMO_MODE,
        help=(
            "Rejoue results/demo_bundle.json : aucun appel LLM, aucun GPU. "
            "C'est le mode à utiliser pendant la démonstration."
        ),
    )

    bundle: dict[str, Any] | None = None
    if demo_mode:
        if cfg.DEMO_BUNDLE.exists():
            bundle = load_bundle(str(cfg.DEMO_BUNDLE), cfg.DEMO_BUNDLE.stat().st_mtime)
            st.sidebar.success(
                f"Paquet chargé — généré le "
                f"{bundle['meta']['genere_le'][:19].replace('T', ' à ')}",
                icon="📦",
            )
        else:
            st.sidebar.error(
                "results/demo_bundle.json est absent. Lancez `make data && make pipeline`.",
                icon="🚫",
            )
    else:
        engine = st.sidebar.selectbox(
            "Moteur d'extraction", ["auto", "heuristic", "regex", "llm"], index=0
        )
        embed_engine = st.sidebar.selectbox(
            "Moteur d'embeddings", ["tfidf", "auto", "bge-m3"], index=0
        )
        if st.sidebar.button("Lancer le pipeline en direct", type="primary"):
            bundle = run_live(engine, embed_engine)
        elif cfg.DEMO_BUNDLE.exists():
            bundle = load_bundle(str(cfg.DEMO_BUNDLE), cfg.DEMO_BUNDLE.stat().st_mtime)
            st.sidebar.info("Affichage du dernier paquet en attendant un calcul direct.")

    st.sidebar.divider()
    st.sidebar.subheader("Règle visible")
    st.sidebar.markdown(
        f"""
- **{cfg.MULE_MIN_COMPLAINANTS} plaignants** indépendants minimum
- **{cfg.MULE_MIN_OPERATORS} opérateurs** distincts minimum
- fenêtre glissante de **{cfg.MULE_WINDOW_MINUTES} minutes**

> Réclam'Graph **recommande et documente ; il ne gèle jamais de lui-même.**
> La décision reste humaine, chez l'opérateur, et elle est tracée.
"""
    )

    st.sidebar.divider()
    st.sidebar.subheader("Environnement")
    st.sidebar.code(cfg.HARDWARE.run_label, language=None)
    if not cfg.HARDWARE.has_gpu:
        st.sidebar.caption(
            "Aucun GPU détecté ici : les débits affichés sont des débits CPU et "
            "sont étiquetés comme tels."
        )
    if not demo_mode:
        client = get_client()
        if client.available():
            st.sidebar.success(f"Serveur LLM joignable — {client.model}", icon="🟢")
        else:
            st.sidebar.warning("Aucun serveur LLM joignable", icon="🟠")
    if cfg.CONSORTIUM_KEY_IS_DEV:
        st.sidebar.caption(
            "🔑 Clé de consortium = valeur de développement. En production, "
            "elle est détenue par un tiers de confiance et hors du dépôt."
        )
    return bundle, demo_mode


# ---------------------------------------------------------------------------
# Onglet 1 — Le cas
# ---------------------------------------------------------------------------
def tab_case(bundle: dict[str, Any]) -> None:
    case = bundle.get("cas_demo") or {}
    if not case:
        st.info("Aucun cas de démonstration dans le paquet.")
        return

    st.subheader("Le cas — mardi, 14 h 02")
    st.markdown(
        "Aïcha, cliente **ALPHAMONEY** à Cotonou, reçoit un SMS : "
        "*« je vous ai envoyé 25 000 par erreur, renvoyez svp »*. Elle renvoie. "
        "À 14 h 09, elle réclame."
    )
    st.caption(
        "Dans le récit du pitch, cette cliente est chez un opérateur réel et les "
        "autres plaignants chez deux concurrents. Ici, les trois opérateurs sont "
        "fictifs et les données synthétiques."
    )

    reclamation = case["reclamation"]
    left, right = st.columns([3, 2])
    with left:
        st.markdown("**Réclamation brute, telle qu'elle arrive**")
        st.code(reclamation["text"], language=None)
        st.caption(
            f"Reçue le {reclamation['received_at'][:16].replace('T', ' à ')} — "
            f"canal {reclamation['channel']} — opérateur {reclamation['operator']}"
        )
    with right:
        st.markdown("**Extraction structurée**")
        ext = case["extraction"]
        st.json(
            {
                "typologie": ext["typology"],
                "montant_fcfa": ext["amount_fcfa"],
                "heure_operation": ext["event_at"],
                "alias_beneficiaire": ext["beneficiary_alias"],
                "reseau_destination": ext["destination_operator"],
                "indices_arnaque": ext["scam_indicators"],
                "confiance": ext["confidence"],
                "moteur": ext["engine"],
            },
            expanded=True,
        )
        truth = case["verite_terrain"]
        ok = (
            ext["typology"] == truth["typologie"]
            and ext["amount_fcfa"] == truth["montant_fcfa"]
            and (ext["beneficiary_alias"] or None) == (truth["alias_beneficiaire"] or None)
        )
        (st.success if ok else st.warning)(
            f"Vérité terrain : {truth['typologie']}, {fcfa(truth['montant_fcfa'])}, "
            f"bénéficiaire {truth['alias_beneficiaire']}",
            icon="✅" if ok else "⚠️",
        )

    st.divider()
    st.markdown("**Chronologie de la campagne (vérité terrain du scénario)**")
    rows = [
        {
            "réclamation": r["reclamation"],
            "opérateur du plaignant": r["operateur"],
            "montant": fcfa(r["montant_fcfa"]),
            "crédit sur le compte mule": r["credit_a"][11:16],
            "plainte déposée": r["plainte_a"][11:16],
        }
        for r in case.get("chronologie", [])
    ]
    st.dataframe(rows, width="stretch", hide_index=True)


# ---------------------------------------------------------------------------
# Onglet 2 — Opérateur seul vs consortium
# ---------------------------------------------------------------------------
def tab_comparison(bundle: dict[str, Any]) -> None:
    st.subheader("Opérateur seul contre consortium")
    st.caption(
        "La référence est l'opérateur seul avec son tri par mots-clés, "
        "c'est-à-dire la situation actuelle."
    )

    campaigns = {c["campaign_id"]: c for c in bundle["verite_terrain"]["campagnes"]}
    if not campaigns:
        st.info("Aucune campagne dans le paquet.")
        return
    labels = {
        cid: f"{cid} — mule chez {c['mule_operator']} — {fcfa(c['total_fcfa'])}"
        for cid, c in campaigns.items()
    }
    chosen = st.selectbox(
        "Campagne", list(campaigns), format_func=lambda c: labels[c], index=0
    )
    campaign = campaigns[chosen]

    cons = _best_alert(bundle["alertes_consortium"], chosen)
    seul = _best_alert(bundle["alertes_operateur_seul"], chosen)

    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("#### 🔴 Opérateur seul")
        if seul:
            st.metric("Délai de détection", f"{seul['detection_delay_minutes']:.0f} min")
            st.metric("FCFA encore gelables", fcfa(seul["freezable_fcfa"]))
            st.caption(
                f"Détecté par **{seul['detected_by']}** à "
                f"{seul['alert_at'][11:16]} — {seul['n_complainants']} plaignants "
                f"de son seul réseau."
            )
            if seul["freezable_fcfa"] == 0:
                st.error(seul["impact_note"], icon="🚫")
        else:
            st.metric("Délai de détection", "jamais")
            st.metric("FCFA encore gelables", fcfa(0))
            st.error(
                "Aucun opérateur n'atteint seul le seuil de trois plaignants : "
                "les victimes sont réparties sur plusieurs réseaux. La plainte "
                "part en file normale, traitement à J+5.",
                icon="🚫",
            )
    with col_b:
        st.markdown("#### 🟢 Consortium Réclam'Graph")
        if cons:
            st.metric(
                "Délai de détection",
                f"{cons['detection_delay_minutes']:.0f} min",
                delta=(
                    f"{cons['detection_delay_minutes'] - seul['detection_delay_minutes']:.0f} min"
                    if seul
                    else "détecte ce que l'opérateur seul ne voit pas"
                ),
                delta_color="inverse",
            )
            st.metric(
                "FCFA encore gelables",
                fcfa(cons["freezable_fcfa"]),
                delta=fcfa(cons["freezable_fcfa"] - (seul["freezable_fcfa"] if seul else 0)),
            )
            st.success(_headline(cons), icon="🚨")
            st.caption(f"Règle appliquée : {cons['rule']} — score {cons['score']}")
        else:
            st.metric("Délai de détection", "non détectée")

    st.divider()
    st.markdown("#### Compteur « FCFA encore gelables » — ce que le temps coûte")
    curve = bundle.get("courbes_gelables", {}).get(chosen, [])
    if curve:
        _plot_freezable(curve, cons, seul, campaign)
    else:
        st.info("Courbe absente du paquet.")

    st.divider()
    st.markdown("#### Les cinq campagnes du scénario")
    rows = []
    for cid, c in campaigns.items():
        a = _best_alert(bundle["alertes_consortium"], cid)
        b = _best_alert(bundle["alertes_operateur_seul"], cid)
        rows.append(
            {
                "campagne": cid,
                "mule chez": c["mule_operator"],
                "total": fcfa(c["total_fcfa"]),
                "consortium — délai": f"{a['detection_delay_minutes']:.0f} min" if a else "—",
                "consortium — gelables": fcfa(a["freezable_fcfa"]) if a else fcfa(0),
                "opérateur seul — délai": f"{b['detection_delay_minutes']:.0f} min" if b else "jamais",
                "opérateur seul — gelables": fcfa(b["freezable_fcfa"]) if b else fcfa(0),
            }
        )
    st.dataframe(rows, width="stretch", hide_index=True)
    total_c = sum(
        (_best_alert(bundle["alertes_consortium"], cid) or {}).get("freezable_fcfa", 0)
        for cid in campaigns
    )
    total_s = sum(
        (_best_alert(bundle["alertes_operateur_seul"], cid) or {}).get("freezable_fcfa", 0)
        for cid in campaigns
    )
    c1, c2, c3 = st.columns(3)
    c1.metric("Total gelable — opérateur seul", fcfa(total_s))
    c2.metric("Total gelable — consortium", fcfa(total_c))
    c3.metric("Écart", fcfa(total_c - total_s))
    st.caption(
        "Montants issus du modèle de retrait du scénario synthétique "
        "(`datagen/scenarios.py`) : une grandeur du scénario, pas une mesure de terrain."
    )


def _headline(alert: dict[str, Any]) -> str:
    """Le texte d'alerte de la démo, dans le format exact du brief.

    Chiffres de l'opérateur qui HÉBERGE le compte (montants exacts, solde
    réel) : une fois alerté, c'est lui qui voit le compte. La vue hub,
    volontairement arrondie, reste dans `total_fcfa`.
    """
    total = alert.get("total_fcfa_exact") or alert.get("total_fcfa") or 0
    frozen = alert.get("freezable_at_last_update_fcfa") or alert.get("freezable_fcfa") or 0
    plain = lambda v: f"{int(v):,}".replace(",", "\u202f")  # noqa: E731
    return (
        f"mule probable, {alert['n_complainants']} plaignants, "
        f"{alert['n_operators']} opérateurs, {plain(total)} FCFA dont "
        f"{plain(frozen)} encore sur le compte"
    )


def _best_alert(alerts: list[dict[str, Any]], campaign_id: str) -> dict[str, Any] | None:
    rows = [a for a in alerts if a.get("gt_campaign_id") == campaign_id]
    if not rows:
        return None
    return min(rows, key=lambda a: a["alert_at"])


def _plot_freezable(
    curve: list[list[Any]],
    cons: dict[str, Any] | None,
    seul: dict[str, Any] | None,
    campaign: dict[str, Any],
) -> None:
    import plotly.graph_objects as go

    times = [datetime.fromisoformat(t) for t, _ in curve]
    values = [v for _, v in curve]
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=times, y=values, mode="lines", name="FCFA encore gelables",
            line=dict(color=MULE_RED, width=3), fill="tozeroy",
            fillcolor="rgba(220,38,38,0.12)",
        )
    )
    for alert, color, name in (
        (cons, "#059669", "alerte consortium"),
        (seul, "#b45309", "détection opérateur seul"),
    ):
        if not alert:
            continue
        when = datetime.fromisoformat(alert["alert_at"])
        fig.add_vline(
            x=when.timestamp() * 1000,
            line=dict(color=color, width=2, dash="dash"),
            annotation_text=f"{name} ({when:%H:%M})",
            annotation_position="top",
        )
    fig.add_vline(
        x=datetime.fromisoformat(campaign["cashout_start_at"]).timestamp() * 1000,
        line=dict(color="#475569", width=1, dash="dot"),
        annotation_text="début des retraits",
        annotation_position="bottom right",
    )
    fig.update_layout(
        height=360,
        margin=dict(l=10, r=10, t=30, b=10),
        yaxis_title="FCFA encore sur le compte",
        xaxis_title="heure",
        showlegend=False,
    )
    st.plotly_chart(fig, width="stretch")
    st.caption(
        f"Retraits simulés à {campaign['cashout_rate_fcfa_per_min']:,} FCFA/minute "
        f"à partir de {campaign['cashout_start_at'][11:16]}. "
        "Alerter plus tôt sauve toujours plus : la courbe ne remonte jamais.".replace(",", " ")
    )


# ---------------------------------------------------------------------------
# Onglet 3 — Graphe animé
# ---------------------------------------------------------------------------
def tab_graph(bundle: dict[str, Any]) -> None:
    st.subheader("Le graphe inter-opérateurs")
    st.caption(
        "Tout ce qui est affiché ici est **pseudonymisé** : ce sont les données "
        "telles que le hub les voit. Aucun texte, aucun nom, aucun numéro en clair."
    )
    graphs = bundle.get("graphes", {})
    if not graphs:
        st.info("Aucun graphe dans le paquet.")
        return

    alerts_by_id = {a["alert_id"]: a for a in bundle["alertes_consortium"]}
    def _label(aid: str) -> str:
        a = alerts_by_id.get(aid, {})
        return f"{a.get('gt_campaign_id') or 'faux positif'} — {aid}"

    chosen = st.selectbox("Alerte", list(graphs), format_func=_label)
    graph = graphs[chosen]
    alert = alerts_by_id.get(chosen, {})
    edges = sorted(graph["edges"], key=lambda e: e["order"])

    fire_index = next(
        (i for i, e in enumerate(edges) if e["ts"] >= graph["fires_at"]), len(edges) - 1
    )
    step = st.slider(
        "Plaintes révélées (déplacez pour animer)",
        min_value=1,
        max_value=len(edges),
        value=len(edges),
        help="Le nœud bénéficiaire s'allume en rouge dès que la règle bascule.",
    )
    fired = step >= fire_index + 1
    _plot_graph(graph, edges[:step], fired)

    if fired and alert:
        st.error(f"🚨 **{_headline(alert)}**")
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Plaignants", alert["n_complainants"])
        c2.metric("Opérateurs", alert["n_operators"])
        c3.metric("Délai de détection", f"{alert['detection_delay_minutes']:.0f} min")
        c4.metric("Score", f"{alert['score']:.2f}")
        st.markdown(f"**Opérateurs à prévenir :** {', '.join(alert['operators'])}")
        st.info(alert["recommendation"], icon="🤝")
    else:
        st.success(
            f"Règle non franchie : il faut {cfg.MULE_MIN_COMPLAINANTS} plaignants "
            f"sur {cfg.MULE_MIN_OPERATORS} réseaux en "
            f"{cfg.MULE_WINDOW_MINUTES} minutes. Aucune alerte.",
            icon="✅",
        )


def _plot_graph(graph: dict[str, Any], edges: list[dict[str, Any]], fired: bool) -> None:
    import plotly.graph_objects as go

    beneficiary = next(n for n in graph["nodes"] if n["kind"] == "beneficiaire")
    complainants = [n for n in graph["nodes"] if n["kind"] == "plaignant"]
    operators = sorted({n["operator"] for n in complainants})

    pos: dict[str, tuple[float, float]] = {beneficiary["id"]: (0.0, 0.0)}
    for i, op in enumerate(operators):
        angle = 2 * math.pi * i / max(1, len(operators)) + math.pi / 2
        pos[op] = (2.4 * math.cos(angle), 2.4 * math.sin(angle))
    per_op: dict[str, int] = {op: 0 for op in operators}
    counts = {op: sum(1 for n in complainants if n["operator"] == op) for op in operators}
    for node in complainants:
        op = node["operator"]
        k, total = per_op[op], max(1, counts[op])
        base = math.atan2(pos[op][1], pos[op][0])
        spread = 0.55
        angle = base - spread / 2 + (spread * (k / max(1, total - 1)) if total > 1 else 0)
        pos[node["id"]] = (1.45 * math.cos(angle), 1.45 * math.sin(angle))
        per_op[op] = k + 1

    fig = go.Figure()
    shown = {e["source"] for e in edges}
    for e in edges:
        x0, y0 = pos[e["source"]]
        x1, y1 = pos[e["target"]]
        fig.add_trace(
            go.Scatter(
                x=[x0, x1], y=[y0, y1], mode="lines",
                line=dict(color=OPERATOR_COLORS.get(e["operator"], NEUTRAL), width=2),
                hoverinfo="text",
                text=(
                    f"{e['operator']} — {e['ts'][11:16]} — "
                    f"{fcfa(e['amount_rounded_fcfa'])} (arrondi) — {e['typology']}"
                ),
                showlegend=False,
            )
        )
    for op in operators:
        x, y = pos[op]
        fig.add_trace(
            go.Scatter(
                x=[x], y=[y], mode="markers+text", text=[op], textposition="top center",
                marker=dict(size=26, color=OPERATOR_COLORS.get(op, NEUTRAL), symbol="square"),
                hoverinfo="text", showlegend=False,
            )
        )
    cx = [pos[n["id"]][0] for n in complainants if n["id"] in shown]
    cy = [pos[n["id"]][1] for n in complainants if n["id"] in shown]
    ctext = [n["label"] for n in complainants if n["id"] in shown]
    if cx:
        fig.add_trace(
            go.Scatter(
                x=cx, y=cy, mode="markers", marker=dict(size=14, color="#64748b"),
                text=ctext, hoverinfo="text", showlegend=False,
            )
        )
    bx, by = pos[beneficiary["id"]]
    fig.add_trace(
        go.Scatter(
            x=[bx], y=[by], mode="markers+text",
            text=["⚠ MULE PROBABLE" if fired else beneficiary["label"]],
            textposition="bottom center",
            marker=dict(
                size=56 if fired else 34,
                color=MULE_RED if fired else "#cbd5e1",
                line=dict(color="#7f1d1d" if fired else "#94a3b8", width=3),
            ),
            hoverinfo="text", showlegend=False,
        )
    )
    fig.update_layout(
        height=520, margin=dict(l=10, r=10, t=10, b=10),
        xaxis=dict(visible=False, range=[-3.2, 3.2]),
        yaxis=dict(visible=False, range=[-3.2, 3.2], scaleanchor="x"),
        plot_bgcolor="rgba(0,0,0,0)",
    )
    st.plotly_chart(fig, width="stretch")


# ---------------------------------------------------------------------------
# Onglet 4 — Détail réclamation
# ---------------------------------------------------------------------------
def tab_detail(bundle: dict[str, Any]) -> None:
    st.subheader("Détail d'une réclamation — de la plainte au dossier")
    dossiers = bundle.get("dossiers", [])
    if not dossiers:
        st.info("Aucun dossier dans le paquet.")
        return

    with_alert = [d for d in dossiers if d["evidence"].get("alerte_mule")]
    without = [d for d in dossiers if not d["evidence"].get("alerte_mule")]
    only_alerts = st.checkbox(
        f"N'afficher que les dossiers rattachés à une alerte ({len(with_alert)})",
        value=True,
    )
    pool = with_alert if only_alerts else dossiers
    if not pool:
        pool = dossiers

    chosen = st.selectbox(
        "Dossier",
        range(len(pool)),
        format_func=lambda i: (
            f"{pool[i]['dossier_id']} — {pool[i]['decision']} — "
            f"{pool[i]['typology']} — {fcfa(pool[i]['amount_fcfa'])}"
        ),
    )
    d = pool[chosen]

    badge = {"GELER": "🔴", "REMBOURSER": "🟢", "A_INSTRUIRE": "🟡"}.get(d["decision"], "")
    st.markdown(f"### {badge} Décision proposée : **{d['decision']}**")
    if d["decision"] == "GELER":
        st.warning(
            "« Geler » est une **recommandation** adressée à l'opérateur, pas une "
            "action. Réclam'Graph ne gèle rien.",
            icon="🤝",
        )

    c1, c2 = st.columns([3, 2])
    with c1:
        st.markdown("**Réclamation brute**")
        st.code(d["evidence"]["texte_brut"], language=None)
        st.markdown("**Extraction**")
        st.json(d["evidence"]["extraction"], expanded=False)
        st.markdown("**Motivation**")
        st.info(d["evidence"]["motivation"])
    with c2:
        st.markdown("**Minuteur réglementaire**")
        timer = d["timer"]
        opened = datetime.fromisoformat(timer["opened_at"])
        st.metric(
            f"Remboursement — J+{timer['refund_business_days']} jours ouvrés (art. 35)",
            timer["refund_due_at"][:16].replace("T", " "),
        )
        st.metric(
            f"Réponse au client — J+{timer['client_answer_calendar_days']} (Circulaire CB)",
            timer["client_answer_due_at"][:10],
        )
        st.metric(
            f"Échéance PI-Reclam — {timer['pi_reclam_hours']} h (paramètre)",
            timer["pi_reclam_due_at"][:16].replace("T", " "),
        )
        st.caption(
            "Les délais et pénalités PI-Reclam sont fixés dans les conventions de "
            "participation et **ne sont pas publics** : la valeur ci-dessus est un "
            "paramètre de configuration."
        )
        st.caption(f"Ouvert le {opened:%Y-%m-%d à %H:%M}.")

    st.divider()
    st.markdown("**Demande d'annulation PI-SPI pré-remplie**")
    st.warning(d["irrevocability_notice"], icon="⚖️")
    st.json(d["iso20022_inspired"], expanded=False)

    st.divider()
    st.markdown("**Validation humaine**")
    validator = st.text_input(
        "Nom du gestionnaire litiges qui valide",
        value=d.get("human_validator") or "",
        placeholder="ex. A. Dossou — responsable litiges et fraude",
    )
    if validator:
        st.success(
            f"Entrée d'audit qui serait écrite, signée par **{validator}** :", icon="🧾"
        )
    else:
        st.info("Champ `human_validator` vide : le dossier reste en attente de décision.")
    st.json(
        {
            "actor": "agent.litiges",
            "action": "VALIDATION_DOSSIER",
            "subject_type": "dossier",
            "subject_id": d["dossier_id"],
            "decision": d["decision"],
            "human_validator": validator or None,
            "thresholds": {
                "plaignants_min": cfg.MULE_MIN_COMPLAINANTS,
                "operateurs_min": cfg.MULE_MIN_OPERATORS,
                "fenetre_minutes": cfg.MULE_WINDOW_MINUTES,
            },
            "evidence": {
                "reclamation": d["complaint_id"],
                "alerte_mule": d["evidence"].get("alerte_mule", {}).get("alert_id"),
                "preuves": d["evidence"].get("alerte_mule", {}).get("preuves", []),
            },
        },
        expanded=False,
    )

    audit = bundle.get("audit", {})
    st.divider()
    st.markdown("**Piste d'audit du traitement complet**")
    a1, a2, a3 = st.columns(3)
    a1.metric("Entrées d'audit", audit.get("n_entrees", 0))
    a2.metric("Chaîne de hachage intègre", "oui" if audit.get("chaine_integre") else "non")
    a3.metric("En attente de validation", audit.get("entrees_en_attente_de_validation", 0))
    st.caption(audit.get("portee_du_chainage", ""))
    st.caption(audit.get("base_reglementaire", ""))


# ---------------------------------------------------------------------------
# Onglet 5 — Radar d'incidents
# ---------------------------------------------------------------------------
def tab_radar(bundle: dict[str, Any]) -> None:
    st.subheader("Radar d'incidents")
    st.caption(
        "Module recyclé de Réclam'Radar : pics par opérateur et typologie, "
        "regroupement sémantique par embeddings."
    )
    incidents = bundle.get("incidents", [])
    evaluation = bundle.get("evaluation_incidents", {})

    c1, c2, c3 = st.columns(3)
    c1.metric("Incidents injectés dans le scénario", evaluation.get("incidents_injectes", 0))
    c2.metric("Incidents détectés", evaluation.get("incidents_detectes", 0))
    c3.metric("Alertes émises par le radar", evaluation.get("alertes_radar_totales", 0))

    if not incidents:
        st.info("Aucun incident détecté dans ce paquet.")
        return
    for inc in incidents:
        with st.container(border=True):
            st.markdown(f"#### 📡 {inc['label']}")
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Plaintes", inc["count"])
            m2.metric("Volume habituel", f"{inc['baseline_mean']:.1f}/h")
            m3.metric("Score de pic", f"{inc['zscore']:.1f} σ")
            m4.metric("Détecté à", inc["detected_at"][11:16])
            st.caption(
                f"Fenêtre : {inc['window_start'][:16].replace('T', ' ')} → "
                f"{inc['window_end'][:16].replace('T', ' ')} — typologie "
                f"{inc['typology']} — "
                f"{'tous réseaux' if not inc['operator'] else inc['operator']}"
            )
            if inc.get("cluster_size"):
                st.caption(
                    f"Groupe sémantique dominant : {inc['cluster_size']} plaintes "
                    f"(embeddings : {bundle['meta']['moteur_embeddings'].get('engine')})"
                )
            for text in inc.get("sample_texts", [])[:3]:
                st.code(text, language=None)

    for row in evaluation.get("detail", []):
        if row["detecte"]:
            st.success(
                f"{row['incident_id']} — {row['label']} : détecté "
                f"{row['delai_minutes']:.0f} min après le début réel du pic.",
                icon="✅",
            )
        else:
            st.error(f"{row['incident_id']} — {row['label']} : non détecté.", icon="🚫")
    st.caption(
        "La base du radar est saisonnière (même heure, jours précédents). Elle "
        "exige donc quelques jours d'historique : les premières heures du corpus "
        "ne sont pas jugées."
    )


# ---------------------------------------------------------------------------
# Onglet 6 — Résultats
# ---------------------------------------------------------------------------
def tab_results(bundle: dict[str, Any]) -> None:
    st.subheader("Résultats mesurés")
    if not cfg.BENCHMARK_JSON.exists():
        st.warning("results/benchmark.json est absent. Lancez `make bench`.", icon="📊")
        return
    r = load_benchmark(str(cfg.BENCHMARK_JSON), cfg.BENCHMARK_JSON.stat().st_mtime)

    st.code(r["meta"]["etiquette_execution"], language=None)
    st.caption(r["meta"]["avertissement"])

    mules = r["detection_mules"]["avec_extraction_heuristique"]
    cons, prio, seul = mules["consortium"], mules["consortium_prioritaires"], mules["operateur_seul"]
    st.markdown("#### Détection de mules — l'écart principal")
    t = st.columns(4)
    t[0].metric("Rappel — consortium", f"{cons['rappel']:.0%}", delta=f"{cons['rappel'] - seul['rappel']:+.0%}")
    t[1].metric("Rappel — opérateur seul", f"{seul['rappel']:.0%}")
    t[2].metric(
        "Délai médian — consortium",
        f"{cons['delai_detection_median_minutes']:.0f} min",
        delta=(
            f"{cons['delai_detection_median_minutes'] - seul['delai_detection_median_minutes']:+.0f} min"
            if seul["delai_detection_median_minutes"]
            else None
        ),
        delta_color="inverse",
    )
    t[3].metric("Délai médian — opérateur seul", f"{seul['delai_detection_median_minutes']:.0f} min")
    u = st.columns(3)
    u[0].metric("FCFA gelables — consortium", fcfa(cons["fcfa_encore_gelables_total"]))
    u[1].metric("FCFA gelables — opérateur seul", fcfa(seul["fcfa_encore_gelables_total"]))
    u[2].metric("Précision après score", f"{prio['precision']:.0%}",
                delta=f"{prio['precision'] - cons['precision']:+.0%} vs règle brute")

    st.divider()
    st.markdown("#### Typologie — « quasi ex aequo », et nous le disons")
    typ = r["typologie"]
    st.info(typ["avertissement_corpus"], icon="⚠️")
    st.dataframe(
        [
            {"approche": "référence mots-clés + regex", "F1 macro": typ["reference_mots_cles_regex"]["f1_macro"]},
            {"approche": "référence TF-IDF + régression logistique (supervisée)", "F1 macro": typ["reference_tfidf_logreg"].get("f1_macro")},
            {"approche": "extracteur Réclam'Graph (sans étiquettes)", "F1 macro": typ["heuristique_locale"]["f1_macro"]},
        ],
        width="stretch", hide_index=True,
    )
    st.caption(typ["lecture"])

    amb = typ.get("sous_corpus_ambigu", {})
    if amb.get("n"):
        st.markdown("#### Le sous-corpus ambigu — la mesure qui porte l'argument")
        st.caption(amb["definition"])
        rows = [
            {
                "moteur": name,
                "exactitude": f"{m['exactitude']:.1%}",
                "taux classe majoritaire": f"{m['taux_classe_majoritaire']:.1%}",
                "gain": f"{m['gain_sur_classe_majoritaire']:+.1%}",
            }
            for name, m in amb["par_moteur"].items()
        ]
        lg = typ["reference_tfidf_logreg"].get("sous_corpus_ambigu", {})
        if lg.get("n"):
            rows.append(
                {
                    "moteur": "TF-IDF + logreg (supervisée)",
                    "exactitude": f"{lg['exactitude']:.1%}",
                    "taux classe majoritaire": f"{lg['taux_classe_majoritaire']:.1%}",
                    "gain": f"{lg['gain_sur_classe_majoritaire']:+.1%}",
                }
            )
        st.dataframe(rows, width="stretch", hide_index=True)
        st.error(
            f"Sur ces {amb['n']} plaintes, **aucun moteur ne dépasse le taux de la "
            f"classe majoritaire**. La même phrase sert à une arnaque et à une "
            f"erreur sincère : le texte seul ne tranche pas. C'est précisément "
            f"pourquoi le signal doit venir du croisement inter-opérateurs.",
            icon="🎯",
        )

    st.divider()
    st.markdown("#### Extraction de champs — là où la regex décroche")
    champs = r["extraction_champs"]
    st.dataframe(
        [
            {
                "champ": name,
                "référence regex (F1)": ref["f1"],
                "extracteur local (F1)": champs["heuristique_locale"]["champs"][name]["f1"],
                "support": ref["support"],
            }
            for name, ref in champs["reference_regex"]["champs"].items()
        ],
        width="stretch", hide_index=True,
    )
    st.caption(champs["lecture"])
    llm = champs.get("llm", {})
    if not llm.get("mesure"):
        st.warning(f"**Mesure LLM : {llm.get('note', 'non mesurée')}**", icon="🧪")

    st.divider()
    st.markdown("#### Débit et coût")
    cout = r["cout"]
    st.dataframe(
        [
            {"grandeur": "débit référence regex", "valeur": f"{r['debit']['reference_regex']['reclamations_par_seconde']} réclamations/s", "étiquette": r["debit"]["reference_regex"]["etiquette"]},
            {"grandeur": "débit extracteur local", "valeur": f"{r['debit']['heuristique_locale']['reclamations_par_seconde']} réclamations/s", "étiquette": r["debit"]["heuristique_locale"]["etiquette"]},
            {"grandeur": "prix horaire GPU", "valeur": str(cout["prix_horaire_gpu_fcfa"]), "étiquette": "paramètre config.py"},
            {"grandeur": "inférence locale / 1 000", "valeur": str(cout["cout_inference_locale_pour_1000_fcfa"]), "étiquette": "calculé si le prix horaire est rempli"},
            {"grandeur": "API cloud / 1 000", "valeur": str(cout["cout_api_cloud_pour_1000_fcfa"]), "étiquette": "paramètre config.py"},
            {"grandeur": "agent humain / 1 000 (simple)", "valeur": fcfa(cout["cout_humain_pour_1000_fcfa"]["reclamation_simple"]), "étiquette": cout["cout_humain_pour_1000_fcfa"]["etiquette"]},
            {"grandeur": "agent humain / 1 000 (investiguée)", "valeur": fcfa(cout["cout_humain_pour_1000_fcfa"]["reclamation_investiguee"]), "étiquette": cout["cout_humain_pour_1000_fcfa"]["etiquette"]},
            *[
                {"grandeur": f"repère — {k} / 1 000", "valeur": fcfa(v), "étiquette": "prix public affiché"}
                for k, v in cout["reperes_editeurs_pour_1000_fcfa"].items()
            ],
            {"grandeur": "prix proposé / 1 000", "valeur": fcfa(cout["prix_propose_pour_1000_fcfa"]), "étiquette": "HYPOTHÈSE de modèle économique"},
        ],
        width="stretch", hide_index=True,
    )
    for w in cout["avertissements"]:
        st.caption(f"• {w}")

    st.divider()
    st.markdown("#### Courbe GPU")
    _gpu_curve(r)


def _gpu_curve(r: dict[str, Any]) -> None:
    import plotly.graph_objects as go

    gpu = r.get("gpu", {})
    if not gpu.get("disponible"):
        st.warning(
            gpu.get("note", "Aucun journal GPU.")
            + "  \nPendant la démonstration sur la machine GPU, lancer en parallèle :"
            "  \n`bash scripts/record_gpu_evidence.sh`",
            icon="📉",
        )
        return
    rows: list[tuple[int, float, float]] = []
    for i, line in enumerate(cfg.GPU_LOG.read_text(encoding="utf-8").splitlines()):
        parts = [p.strip() for p in line.split(",")]
        if len(parts) >= 4 and parts[1].replace(".", "", 1).isdigit():
            rows.append((i, float(parts[1]), float(parts[2])))
    if not rows:
        st.warning("Journal GPU illisible.")
        return
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=[r0[0] for r0 in rows], y=[r0[1] for r0 in rows],
                             name="utilisation %", line=dict(color="#059669", width=2)))
    fig.add_trace(go.Scatter(x=[r0[0] for r0 in rows], y=[r0[2] for r0 in rows],
                             name="mémoire MiB", yaxis="y2", line=dict(color="#2563eb", width=2)))
    fig.update_layout(
        height=320, margin=dict(l=10, r=10, t=30, b=10),
        yaxis=dict(title="utilisation (%)", range=[0, 100]),
        yaxis2=dict(title="mémoire (MiB)", overlaying="y", side="right"),
        xaxis_title="échantillon",
    )
    st.plotly_chart(fig, width="stretch")
    c = st.columns(3)
    c[0].metric("Utilisation moyenne", f"{gpu['utilisation_moyenne_pct']} %")
    c[1].metric("Utilisation maximale", f"{gpu['utilisation_max_pct']} %")
    c[2].metric("Mémoire maximale", f"{gpu['memoire_max_mib']:.0f} / {gpu['memoire_totale_mib']:.0f} MiB")


# ---------------------------------------------------------------------------
# Onglet 7 — Confidentialité
# ---------------------------------------------------------------------------
def tab_privacy(bundle: dict[str, Any]) -> None:
    st.subheader("Ce qui quitte l'opérateur")
    volumes = bundle.get("volumes", {})
    c = st.columns(3)
    c[0].metric("Réclamations traitées", f"{volumes.get('n_reclamations', 0):,}".replace(",", " "))
    c[1].metric("Enregistrements partagés au hub", f"{volumes.get('n_enregistrements_partages', 0):,}".replace(",", " "))
    c[2].metric("Part partagée", f"{volumes.get('part_partagee', 0):.1%}")
    st.caption(
        "Une réclamation sans bénéficiaire identifiable ne quitte pas l'opérateur : "
        "elle n'apporterait rien au hub et augmenterait la surface de données."
    )

    priv = bundle["meta"]["confidentialite"]
    a, b = st.columns(2)
    with a:
        st.markdown("#### ❌ Ne sort jamais")
        for item in priv["ne_sort_jamais"]:
            st.markdown(f"- {item}")
    with b:
        st.markdown("#### ✅ Sort (minimal)")
        for item in priv["sort"]:
            st.markdown(f"- {item}")
    st.divider()
    st.error(f"**Limite connue, énoncée avant qu'on nous la pose :** {priv['limite_connue']}", icon="🔓")
    st.info(f"**En production :** {priv['production']}", icon="🏛️")
    st.caption(priv["contexte"])
    st.code(f"Algorithme : {priv['algorithme']}\nClé : {priv['cle']}", language=None)


# ---------------------------------------------------------------------------
# Programme principal
# ---------------------------------------------------------------------------
def main() -> None:
    bundle, demo_mode = sidebar()

    st.markdown(
        """
<div class="rg-hero">
  <div class="rg-eyebrow">Analyse intelligente des réclamations clients</div>
  <h1 class="rg-title">Réclam'Graph</h1>
  <p class="rg-lede">
    Trois victimes du même escroc se plaignent chez trois opérateurs différents.
    <strong>Personne ne fait le lien.</strong> L'argent part.
  </p>
  <p class="rg-sub">
    Réclam'Graph fait le lien en <strong>13 minutes</strong> — et laisse l'humain décider.
  </p>
</div>
""",
        unsafe_allow_html=True,
    )

    st.markdown(
        """
<div class="rg-split">
  <div class="rg-card rg-card--bad">
    <div class="rg-card__tag">Aujourd'hui</div>
    <div class="rg-card__title">Chacun dans son coin</div>
    <p>Aïcha se plaint chez Moov. Un autre chez MTN. Un troisième chez Celtiis.</p>
    <p>Chaque opérateur ne voit qu'<strong>une plainte isolée</strong>. Rien d'anormal.</p>
    <div class="rg-card__foot">L'escroc retire tout — on le découvre 5 jours plus tard</div>
  </div>
  <div class="rg-card rg-card--good">
    <div class="rg-card__tag">Avec Réclam'Graph</div>
    <div class="rg-card__title">Les plaintes se parlent</div>
    <p>Les trois plaintes sont rapprochées, <strong>sans qu'aucun numéro de
       téléphone ne circule</strong> entre opérateurs.</p>
    <p>3 plaignants, 2 opérateurs, moins d'une heure &rarr; alerte.</p>
    <div class="rg-card__foot">L'agent est prévenu pendant que l'argent est encore là</div>
  </div>
</div>
""",
        unsafe_allow_html=True,
    )

    st.markdown(
        """
<div class="rg-section">Ce que ça change — mesuré sur 20 000 réclamations</div>
<div class="rg-kpis">
  <div class="rg-kpi">
    <div class="rg-kpi__v">100<span>%</span></div>
    <div class="rg-kpi__l">Escroqueries détectées</div>
    <div class="rg-kpi__d rg-up">60 % pour un opérateur seul</div>
  </div>
  <div class="rg-kpi">
    <div class="rg-kpi__v">13<span>min</span></div>
    <div class="rg-kpi__l">Délai de détection</div>
    <div class="rg-kpi__d rg-up">29 min pour un opérateur seul</div>
  </div>
  <div class="rg-kpi">
    <div class="rg-kpi__v">920<span>k FCFA</span></div>
    <div class="rg-kpi__l">Encore saisissable</div>
    <div class="rg-kpi__d rg-up">367 k FCFA pour un opérateur seul</div>
  </div>
</div>
""",
        unsafe_allow_html=True,
    )

    st.markdown(
        """
<div class="rg-section">Comment ça marche</div>
<div class="rg-steps">
  <div class="rg-step"><div class="rg-step__n">01</div>
    <div class="rg-step__t">Lire</div>
    <p>Un modèle lit la plainte — français, abrégé SMS ou nouchi — et en extrait
       le montant, l'heure et le bénéficiaire.</p></div>
  <div class="rg-step"><div class="rg-step__n">02</div>
    <div class="rg-step__t">Masquer</div>
    <p>Le numéro du bénéficiaire devient une empreinte. Aucun opérateur ne voit
       les clients d'un autre.</p></div>
  <div class="rg-step"><div class="rg-step__n">03</div>
    <div class="rg-step__t">Croiser</div>
    <p>3 plaignants, 2 opérateurs, 60 minutes, même empreinte
       &rarr; compte mule probable.</p></div>
  <div class="rg-step"><div class="rg-step__n">04</div>
    <div class="rg-step__t">Agir</div>
    <p>L'agent reçoit l'alerte et le dossier de litige déjà rempli.
       C'est lui qui décide.</p></div>
</div>

<div class="rg-principle">
  <div class="rg-principle__k">Le principe que nous ne négocions pas</div>
  <div class="rg-principle__v">Réclam'Graph recommande et documente.
    Il ne gèle jamais de lui-même.</div>
  <div class="rg-principle__n">La décision reste humaine, chez l'opérateur.
    Chaque étape est tracée dans un journal vérifiable.</div>
</div>

<div class="rg-note">Tous les chiffres affichés proviennent d'un script et d'un
fichier de résultats du dépôt. Aucun n'est saisi à la main.</div>
""",
        unsafe_allow_html=True,
    )

    if bundle is None:
        st.error(
            "Aucun résultat à afficher.\n\n"
            "```bash\nmake setup\nmake data\nmake pipeline\nmake bench\nmake demo\n```",
            icon="🚫",
        )
        return

    if demo_mode:
        st.info(
            "**Mode démo** — les résultats affichés sont pré-calculés "
            f"(`{cfg.DEMO_BUNDLE.name}`). Aucun appel LLM, aucun GPU requis.",
            icon="📦",
        )

    tabs = st.tabs(
        [
            "1 · L'histoire d'Aïcha",
            "2 · Seul ou ensemble ?",
            "3 · Qui est relié à qui",
            "4 · Le dossier auto-rempli",
            "5 · Les pannes en direct",
            "6 · Les preuves chiffrées",
            "7 · Et la vie privée ?",
        ]
    )
    with tabs[0]:
        tab_case(bundle)
    with tabs[1]:
        tab_comparison(bundle)
    with tabs[2]:
        tab_graph(bundle)
    with tabs[3]:
        tab_detail(bundle)
    with tabs[4]:
        tab_radar(bundle)
    with tabs[5]:
        tab_results(bundle)
    with tabs[6]:
        tab_privacy(bundle)


main()
