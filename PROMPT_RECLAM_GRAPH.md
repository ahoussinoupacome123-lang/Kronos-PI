# BRIEF FOR CLAUDE CODE: build "Réclam'Graph" end to end (GPU Challenge 2026, team Token Titans, team 12)

You are the lead engineer. Build the whole project in this repository, working and demo-ready, exactly as specified below. The specification comes from the team's strategy document; do not add, remove or reinterpret its scope. Read the whole brief before writing code.

## 0. Execution rules (not product scope)
- **Hard deadline:** deliverables due Wednesday 25 Nov 2026 at 12:00 (Africa/Porto-Novo, UTC+1). Technical test for team 12 around 11:20; jury pitch around 16:00 (5 min pitch, 3 min demo, 5 min questions; the jury wants "vos résultats face à votre référence").
- **Work autonomously.** Ask a question only if truly blocked (no GPU at all, no network for pip or Hugging Face). Otherwise decide, log it in one line in `DECISIONS.md`, and continue. Keep a task list and commit often. The repo must be runnable at every checkpoint.
- **Free and open source tools only.** No secrets in the repo.
- **Never announce a throughput, accuracy or cost figure that was not measured.** Every number shown in the UI, README or pitch comes from a script and a results file in this repo. Figures marked "estimation" or "extrapolation" in section 12 are working hypotheses and must be labelled as such wherever shown.
- **Step 0: inspect the environment** (`nvidia-smi`, Python version, RAM, disk, internet). Choose the model by VRAM and record it: T4 (16 GB): Qwen2.5-7B-Instruct AWQ with vLLM (fp16/half, since T4 has no bf16), or Qwen2.5-3B for throughput. If there is no GPU, say "CPU run" in every benchmark output and never present CPU numbers as GPU numbers. All LLM calls go through one OpenAI-compatible client (`LLM_BASE_URL`, `LLM_MODEL`) so vLLM and Ollama are interchangeable.
- **Precompute results and keep a demo mode** that replays cached results when the LLM server is down, so the 3-minute demo can never depend on a live GPU session (the strategy document requires: "pré-calculer les résultats; ne pas dépendre d'une session Colab gratuite en direct").

## 1. Product: Réclam'Graph
Theme (imposed): **Analyse intelligente des réclamations clients**.
One-line pitch: *Analyse intelligente des réclamations clients : croiser les plaintes de plusieurs opérateurs pour démasquer les comptes mules avant le retrait, et transformer chaque plainte légitime en dossier de litige PI-SPI dans les délais.*

Core message: **"Chaque plainte est un capteur. Seule, elle ne dit rien. Croisée entre opérateurs, elle révèle le compte mule avant le retrait, et elle devient d'elle-même un dossier de litige PI-SPI conforme aux délais."**

Choice made by the team: Réclam'Graph = angles C + B + G. One input (the complaint), two outputs: **geler** (probable mule, inter-operator alert) or **rembourser** (genuine error, pre-filled PI-SPI dispute file, timed). Deadline compliance and the audit trail come with it.

Why this idea (for README and pitch): the most frequent complaint ("j'ai envoyé au mauvais numéro") and the most frequent fraud ("je me suis trompé de numéro, renvoyez-moi l'argent") use the same story. A single operator cannot tell the victim of a sincere error from the victim of fraud when the fraudulent beneficiary is a customer of another network. PI-SPI makes the "erreur de dépôt" scam interoperable by construction (victim at Moov, mule at Wave, irrevocable transfer): each operator sees only half the file. PI-Reclam transports complaints between participants but, per public information, is a pipe: nothing public says it analyses and correlates them. That is the place Réclam'Graph takes.

Users: **primary** = the litigation and fraud manager of an EME (electronic money institution) or of a bank participating in PI-SPI (must meet deadlines of 3 business days and 1 month, recover funds, avoid penalties). **Secondary** = contact-centre agents (pre-filled file), the PI-Reclam team or BCEAO (consolidated view of fraud campaigns), aggregators such as Payfonte (merchant disputes).

## 2. How it works, in four steps
1. **Lire:** the raw complaint (SMS, app, call centre, voice note) becomes a structured record: typology, amount, time, beneficiary alias, destination network, scam indicators.
2. **Pseudonymiser:** at each operator, the beneficiary alias is hashed with a consortium key. Only the hash and a few minimal metadata leave the operator.
3. **Croiser:** the hub builds a graph of complainants, beneficiaries and operators. At least **3 independent complainants, on at least 2 networks, within 60 minutes** raises a "mule probable" alert.
4. **Agir:** probable mule: the operators concerned are warned, with the amount still freezable. Genuine error: pre-filled cancellation request, regulatory timer, audit trail.

**Non-negotiable principle:** Réclam'Graph **recommends and documents; it never freezes by itself**. The decision stays human, at the operator. Threshold visible in the demo: 2 distinct operators minimum and 3 independent complainants minimum; human decision at the operator; everything traced in the audit.

## 3. Product features
| Function | What it does | Customer value |
|---|---|---|
| Extracteur de réclamations | Local LLM with guided JSON output; robust to typos, mixed local French, amounts written "25mil" or "25.000F" | End of manual re-typing |
| Radar mules inter-opérateurs | Pseudonymised graph, rules and score, sliding window; list of operators to warn | Funds frozen before withdrawal |
| Radar d'incidents (module of Réclam'Radar, recycled) | Embedding clustering and spike detection: PI-SPI outage, one network's timeouts | Incident spotted before the ticket avalanche |
| Dossier de litige PI-SPI | Pre-filled cancellation request, format inspired by ISO 20022, with the extracted evidence | Less agent time per file |
| Minuteur réglementaire | J+3 business days (art. 35), J+30 (Circulaire CB), PI-Reclam deadline configurable; alerts before expiry | Penalties avoided |
| Piste d'audit | Every decision (alert, recommended freeze, file) traced as JSON with the evidence and the human who validated | Compliance demonstrable to the regulator |

Reused from Réclam'Radar: bge-m3, vLLM, SQLite, Streamlit and the clustering module. The pivot is about what is done with the complaints, not the technical stack.

## 4. Technical architecture (six blocks; the first three run on GPU)
1. **Synthetic generator (GPU):** Qwen2.5-7B-Instruct (AWQ, vLLM, T4) + Faker. About **20,000 complaints over 7 simulated days, 3 fictional operators**, with the ground truth kept.
2. **JSON extraction (GPU):** Qwen2.5-7B or 3B (throughput), vLLM guided decoding: typology, amount, time, alias, network, scam indicators.
3. **Embeddings (GPU):** bge-m3: deduplication, clustering, incident radar (module 1 recycled).
4. **Pseudonymisation:** HMAC-SHA256 of the alias with a consortium key, operator side.
5. **Graph hub:** networkx, rules and score on a sliding window, mule alert.
6. **Outputs + UI:** litigation file, timer, JSON audit, Streamlit with an animated graph.

**Scenarios injected into the data:**
- **5 deposit-error scam campaigns** ("erreur de dépôt"), each toward one mule account, with victims spread over the 3 operators.
- **1 PI-SPI incident** (wave of timeouts) for the incident radar.
- **Sincere beneficiary errors** that must produce a refund file, not an alert.
- **Noise:** typos, SMS abbreviations, nouchi, Fon words, complaints with no link.
- **A simulated cash-out delay per mule**, to compute the FCFA still freezable.

**What leaves the operator:**
| Field | Shared? |
|---|---|
| Complaint text | No |
| Complainant identity and number | No |
| Beneficiary alias | Hashed (HMAC) |
| Operator, timestamp, typology | Yes |
| Amount | Rounded |

State this limit in the README before anyone raises it: an HMAC over phone numbers stays attackable by dictionary if the key leaks. In production: private set intersection (PSI) or a hub run by a trusted third party (BCEAO, PI-Reclam, Alliance Fintech UEMOA). 24% of mobile money providers say they are hindered by cross-border data-transfer rules (GSMA 2026): minimal sharing and local inference are arguments, not constraints.

**Making GPU use measurable:**
- Log `nvidia-smi` (utilisation, memory) and the vLLM metrics (tokens/s, requests/s) during processing; show the live curve in the demo.
- Compute the **direct cost for 1,000 complaints** = hourly GPU price ÷ measured throughput; compare it with the public cloud API tariff of the day and the estimated human cost (270 to 700 FCFA per complaint). The hourly GPU price and API tariff are explicit parameters in `config.py` to fill from their sources; if empty, print "not computed".
- Reference points for the argument: Intercom Fin (0.99 USD, about 590 FCFA per resolution) and Thematic (about 1 USD per comment) cost as much as a local human agent; only local open-weight inference at a few FCFA per complaint makes automation profitable in UEMOA. **Announce no throughput you have not measured.**

## 5. Proof: baseline vs solution (the "référence" the jury asks for)
The reference is **the operator alone with keyword triage**, i.e. the current situation.
| Task | Baseline | Metric | Expectation |
|---|---|---|---|
| Typology | Keywords; TF-IDF + logistic regression | Macro F1 | Almost equal ("quasi ex aequo"); saying so builds credibility |
| Field extraction | Regex (numbers, amounts) | F1 per field | The LLM wins on noisy text |
| Mule detection | Operator alone + keywords | Recall and precision of campaigns; **detection delay** (minutes since the 1st complaint) | The main gap of the demo |
| Impact | Operator alone | **FCFA still freezable** at the moment of the alert | The figure that speaks to the jury |
| Cost | Cloud API; human agent | FCFA per 1,000 complaints | Measured on the demo GPU |

Write `bench/benchmark.py` to produce `results/benchmark.json` and a French `results/benchmark.md` with this table filled from real runs, plus the "opérateur seul" vs "consortium" comparison on the same synthetic data with its known ground truth.

## 6. UI (Streamlit, French)
- A **"opérateur seul" vs "consortium"** view side by side, with the FCFA-freezable counter.
- **Animated graph** (complainants, beneficiaries, operators) where the mule node lights up when the rule fires, with the alert text (example format: "mule probable, 7 plaignants, 3 opérateurs, 162 000 FCFA dont 118 000 encore sur le compte", values coming from the synthetic scenario).
- **Complaint detail:** raw complaint, structured extraction, decision, pre-filled PI-SPI cancellation request, regulatory timer (J+3 / J+30, configurable PI-Reclam deadline), JSON audit entry with the evidence and the human validator field.
- **Incident radar tab:** clusters and spike alert (PI-SPI outage, one network's timeouts).
- **Results tab:** reads `results/benchmark.json` and the GPU log; live GPU curve in the demo.
- **Demo mode:** a toggle that replays precomputed results with no LLM or GPU.

## 7. Demo script to support (3 minutes)
- **0:00 to 0:20, Le cas:** Tuesday 14:02, Aïcha, a Moov customer in Cotonou, receives an SMS: "je vous ai envoyé 25 000 par erreur, renvoyez svp". She sends it back. At 14:09 she complains. Show the raw complaint, full of typos.
- **0:20 to 0:50, Opérateur seul:** the baseline classifies "erreur de transfert", queues it, processing at D+5. The "FCFA gelables" counter drops.
- **0:50 to 1:40, Consortium:** complaints from MTN and Wave customers pointing at the same alias light up on the graph. At 14:21: "mule probable" alert, for example 7 complainants, 3 operators, 162,000 FCFA of which 118,000 still on the account (values of the synthetic scenario).
- **1:40 to 2:15, La vraie erreur:** a legitimate customer gets a pre-filled cancellation request, the J+3 / J+30 timer and the audit trail.
- **2:15 to 3:00, Les chiffres:** table against the baseline: mule recall, median delay, FCFA freezable, extraction F1, complaints per second, cost per 1,000 on T4 versus cloud and human. Live GPU curve.

## 8. Documentation deliverables (French)
- `README.md`: problem in figures, solution, architecture (Mermaid), quick start, results pulled from `results/`, and a **"Hypothèses et limites"** section (section 12 below). Present the generator and the synthetic dataset as published, announce at the top that data is synthetic.
- `PITCH.md`: the 5-minute pitch (section 9), the 3-minute demo script (section 7), and the jury Q&A (section 10).
- `SUBMISSION.md`: short text for the submission form with structure, three commands to run, and the list of measured results.

## 9. Pitch, 5 minutes
1. **Problème (1 min 15):** 2.65 M complaints in one semester; mostly beneficiary errors; social engineering dominates fraud; PI-SPI makes transfers irrevocable; each operator sees only half of the file.
2. **Utilisateur (30 s):** the litigation and fraud manager of an EME, and the PI-Reclam team.
3. **Solution (1 min 30):** one input, two outputs: geler or rembourser.
4. **Pourquoi maintenant (45 s):** the 2 November 2026 rule, 175 institutions connected, regulatory deadlines.
5. **Pourquoi nous (30 s):** alternance at Orabank's DSI, cybersecurity specialty, 100% local stack.
6. **Demande (30 s):** an 8-week pilot with an operator of the forum.

## 10. Jury Q&A, "à ne jamais dire", other risks
| Jury question | Answer (20 s) | Supporting fact |
|---|---|---|
| "Les opérateurs concurrents ne partageront jamais leurs données." | Nothing raw leaves the operator: only a hashed beneficiary identifier and minimal metadata. In production, private set intersection or a hub run by a trusted third party (BCEAO, PI-Reclam, Alliance Fintech UEMOA). | BCEAO already runs a cyber and fraud incident declaration platform for participants |
| "Et si vous gelez un innocent ?" | We freeze nothing: we recommend and document. Threshold of 2 distinct operators and 3 independent complainants minimum; human decision at the operator, traced in the audit. | Rule visible in the demo |
| "La BCEAO le fera elle-même dans PI-Reclam." | PI-Reclam is the pipe; we are the intelligence layer that plugs into it. Integration or acquisition scenario, not eviction. | No public analysis known in PI-Reclam |
| "Vos données sont synthétiques." | Yes, announced up front. Generator and ground truth are published; robustness to noise is measured. Next step: pilot on anonymised real data. | Generator and dataset on GitHub |
| "Ça existe déjà, non ?" | The bricks exist: Proto, PI-Reclam, fraud registers elsewhere. We found no public system that draws the mule signal from the text of customer complaints across issuers in UEMOA. | Benchmark, section 11 below |
| "Quel modèle économique ?" | Flat fee per operator or 5 FCFA per complaint, plus an option to share on recovered funds; 8-week pilot. | Section 12 below |

**À ne jamais dire:** "Nous remplaçons les agents" (economically false against cloud AI prices, politically bad); "Aucune solution n'existe" (false: Proto, PI-Reclam, fraud registers); any throughput, accuracy or cost figure that has not been measured; "Nous comprenons le fon, le wolof, le mina" (published error rates do not allow it).

**Other risks and answers:** legal basis of data sharing (high): consult APDP / BCEAO before any pilot; minimal sharing; third-party hub. Fraudsters changing alias (medium): also cross the underlying number, the withdrawal agent, the amount and the hour. Few complaints because many victims do not complain (medium): each complaint is rare, therefore precious to correlate (only 5 to 10% of digital borrowers contact anyone, CGAP 2018). Demo crash (high): precomputed results, backup video, the organisers' machine.

## 11. Benchmark of what exists (for README and pitch; do not claim uniqueness)
Everything about single-company complaint analysis is already covered, often well, at a price incompatible with UEMOA; the gap is between institutions.
- **VoC / feedback analysis:** Thematic, Chattermill, Enterpret, Medallia, Qualtrics: taxonomies, anomaly detection, alerts. Mono-company, about 1 USD per comment, ignores PI-SPI and local mixed French, connects nothing to a transaction.
- **AI service agents:** Intercom Fin (0.99 USD per resolution), Zendesk AI, Copilot Studio: same price problem, no access to other operators' data, hosting outside the zone.
- **Complaints SupTech:** Proto / BSP (BOB, Philippines), Cambridge SupTech Lab, RBI CMS: intake, routing, statistics. The regulator sees escalated complaints, not the first line in real time; no anti-fraud correlation between institutions.
- **Social listening:** IPA / Citibeats, FSD Kenya: unrepresentative sample, no link to a transaction.
- **Transactional fraud:** operators' internal tools, Feedzai, Featurespace, SAS, BioCatch: single-operator view; using complaints as a signal is unverified, present it as a hypothesis.
- **Regional infrastructure:** BCEAO PI-Reclam: centralised complaint exchange with deadlines and penalties; a pipe with no known public analysis. **The most dangerous potential competitor.**
- **Mutual fraud registers:** RBI central registry, bank consortia elsewhere: nothing public in UEMOA, fed by declarations, not by the text of customer complaints.

Research findings to respect: the LLM brings almost nothing on zero-shot classification (a tuned TF-IDF reaches about 87% accuracy on the CFPB database; so do not build the demo on classification); complaints as an early signal show a real effect in research but at institution level, not transaction level (the step Réclam'Graph takes); extraction on noisy text is where the LLM wins (regexes miss badly formatted amounts and numbers; JSON-guided output recovers them); local-language voice is high risk (per the strategy document: Whisper large-v3 exceeds 97% word error rate in Wolof and reaches 100% in Bambara; Fongbe is only good on read speech with fine-tuned MMS), so in 12 hours voice stays a bonus.

Honesty on novelty: sharing of fraud signals exists elsewhere (national registers, bank consortia), and BCEAO has PI-Reclam and an incident declaration platform. We found no public proof of a system that draws the mule signal from the text of customer complaints between UEMOA issuers. The right wording: **"nouveau dans la zone et par la source du signal", never "inédit au monde".**

## 12. Facts, hypotheses and business model (for README and pitch notes; keep the labels)
**Scale (BCEAO 2024):** 248.7 M e-money accounts (76.9 M active, 30.9%); 11.92 Md transactions in the year (about 33 M per day); 160,415 Md FCFA of value (about 119% of the Union's GDP); about 88% of deposits are withdrawn in cash. P2P: 2.35 Md operations, 42,763 Md FCFA, average 18,220 FCFA. Volume shares: Orange 38.4%, Wave 28.4%, MTN 17.4%, Moov 6.9%, Yas 3%. Benin: 37.5 M accounts, 11.25 M active, 2.55 Md transactions, 12,034 Md FCFA. Issuers: 69 initiatives (52 banks, 14 EME, 2 Treasuries, 1 IMF); 3 EME licences withdrawn.
**Complaints:** 2.65 M complaints received by issuers in the second half of 2021 for 2.97 Md operations, about 0.9 complaint per 1,000 transactions (calculation). Main reasons: beneficiary error on deposit or transfer, change of number, cancellation of a transfer. **Extrapolation (not sourced):** at the same ratio on 2024 volumes, the Union would handle about **10 million complaints per year**. Escalation channel almost empty (SGCB-UMOA handled 25 complaints in 2021; Senegal's OQSF 475 files in 2025). No recent public complaint statistics from telecom regulators.
**Fraud:** 635,435 cases (1.06 Md FCFA) in H1 2021, then 310,274 cases (1.07 Md FCFA) in H2 2021; mostly social engineering (OTP codes, "erreur de dépôt" scam, merchant payment, e-commerce); declared value low (about 3,400 FCFA per case): massive in number, under-declared in value. Reference points: Ghana 24,778 fraud cases in 2025 (+48%), 97% at payment providers; France: manipulation fraud 32% of fraud value in 2024.
**Cost of handling (estimates from job ads):** 250,000 to 400,000 FCFA per month per agent, about **270 FCFA per simple complaint** (50/day) and **700 FCFA per investigated complaint** (20/day). Reference: US level-1 ticket 15.56 USD (MetricNet, 2016).
**Regulatory framework:** Instruction BCEAO n°008-05-2015 (e-money, under revision): art. 18 the issuer answers for its distributors' acts; art. 30 a complaints system committing the issuer to a deadline and traceability; art. 35 refund within **3 business days** at most. Circulaire n°002-2020/CB/C: internal system reviewed at least yearly; client answer within **one month**; free handling; Commission bancaire can be seized, with **60 days** to investigate. Instruction n°001-01-2024 (payment services, in force 1 May 2025): strong authentication, agent registration, full responsibility of the institution for its agents. Commission bancaire 2024: 14 reprimands, 6 warnings, 1 EME licence withdrawal.
**PI-SPI timeline:** 30 Sep 2025 launch (processing within 20 s, ISO 20022, alias to hide the number); **irrevocability** (a confirmed payment cannot be unilaterally cancelled; a cancellation request needs the beneficiary's agreement; refund is at the beneficiary's initiative); PI-Reclam module centralises complaint exchanges, deadlines and penalties set in participation agreements (amounts not public); November 2026: 175 institutions connected, over 4 million transactions, over 300 Md FCFA (BCEAO project lead); 2 Nov 2026: per secondary sources, interoperable e-money must go through PI-SPI, free up to 8,000 FCFA per day then 0.8% excl. tax at most (to verify against the BCEAO communiqué).
**Business model (estimates, present as hypotheses):** who pays: EME and operators (Orange, Wave, MTN, Moov, Yas: 28 of the 69 initiatives): 5 FCFA per analysed complaint, or 3 to 5 M FCFA per month per large operator and per country; banks and IMF in PI-SPI: 0.5 to 1 M FCFA per month; aggregators (Payfonte type): licence plus revenue share; regulator or association (BCEAO, Alliance Fintech UEMOA): hub licence 0.1 to 0.3 M USD per year; option: 5% of recovered funds. Price comparison: Intercom Fin about 590 FCFA per resolution; Thematic about 600 FCFA per comment; human agent 270 to 700 FCFA; Réclam'Graph proposed 5 FCFA per complaint. Average operator gains (hypotheses): about 10 M complaints per year in the Union (extrapolation); an operator at 20% share handles about 2 M; 30% time saved on 2 M complaints at 400 FCFA is about **240 M FCFA per year** (about 400,000 USD); confidence gain (70% of accounts inactive) real but not quantified; avoided PI-SPI penalties and Commission bancaire sanctions.
**Market (UEMOA):** TAM about 2.7 M USD per year (28 operator initiatives × 45,000 USD + 147 other participants × 10,000 USD + regulator licence); SAM about 0.8 M USD (about 40 high-volume institutions × 20,000 USD); SOM over 3 years: 5 to 8 customers, 0.1 to 0.25 M USD ARR. Small market: good to dominate, weak for venture capital. Natural extension: GIMACPAY (CEMAC) and other African instant payment systems. **Go to market:** step 1, 8-week pilot with a forum fintech (Moov Money, or Payfonte for merchant disputes) on anonymised dispute history; step 2, Benin: two operators of one country under Alliance Fintech UEMOA, first consortium and first network effect; step 3, regional: propose to BCEAO a branch on PI-Reclam as an intelligence layer.
**Hypotheses and limits to display (README):** no public UEMOA complaint data after 2021 was found, so the 10 M per year figure is an extrapolation (the 275,195 complaints of H2 2020 against 2.65 M in H2 2021 probably reflect a change of perimeter: do not cite them side by side); PI-SPI deadlines and penalties are not public; the 2 Nov 2026 rules come from secondary sources, to verify on the BCEAO communiqué; the 2024 fraud typologies (identity 90%, social engineering 88%) come from a media outlet, not from the BCEAO report: avoid them in the pitch; agent costs, proposed prices, TAM, SAM, SOM and gains are estimates from job ads and vendor prices; not verified: use of complaints as a signal by Feedzai, Featurespace, SAS, BioCatch or the internal tools of MTN, Orange and Wave, and the data protection framework (APDP Bénin, Togo, ARTCI); GitHub classification benchmarks are weak sources, and ASR word error rates vary strongly between read and spontaneous speech.

## 13. Build order and priorities (from the team's plan)
Priorities, in order: **a** generator + ground truth (about 20,000 complaints, 3 operators, 5 mule campaigns, 1 incident, sincere errors, noise) *indispensable*; **b** JSON extraction (vLLM, guided decoding, regex baseline, F1 per field) *indispensable*; **c** graph + rule (HMAC, networkx, thresholds 3 complainants / 2 operators / 60 min) *indispensable*; **d** baseline-versus-solution table (recall, delay, FCFA freezable, cost per 1,000) *indispensable*; **e** timer + litigation file (J+3, J+30, PI-Reclam, JSON audit) *important*; **f** voice (Whisper / MMS), French only, *only if free time*.
Suggested schedule (Africa/Porto-Novo): **now to 04:30** blocks a and c (the generator runs on GPU while the graph is coded); **04:30 to 05:00** sleep, at least in relays; **06:00 to 06:30** blocks b and d, results table, Streamlit with the "opérateur seul" vs "consortium" view; **06:30 to 7:00** block e, backup video recording (OBS), timed rehearsal (5 + 3 + 5 min); **about 7:20 before 7:30** technical test, then submission of the deliverables through the form; **7:30 to 8:00** two full rehearsals with a teammate playing the jury and asking the section 10 questions.
Roles: **A** data and proof (generator, ground truth, baseline, metrics table, GPU measurements); **B** LLM and extraction (vLLM, guided JSON, litigation file, timer); **C** graph (pseudonymisation, networkx hub, rules and score, recycled incident radar); **D** demo and pitch (Streamlit, animated graph, backup video, pitch script, jury questions). Organise the code so these four tracks can proceed in parallel.

## 14. Suggested repository layout (scaffolding only)
`README.md`, `PITCH.md`, `SUBMISSION.md`, `DECISIONS.md`, `Makefile` (setup, serve-llm, data, pipeline, demo, bench, test), `requirements.txt` (pinned), `.env.example`, `src/reclam_graph/` (`config.py`, `llm.py`, `schemas.py`, `datagen/`, `extract.py`, `embed.py`, `radar.py`, `pseudonymize.py`, `graph_hub.py`, `dossier.py`, `timer.py`, `audit.py`, `pipeline.py`, optional `voice.py`), `app/dashboard.py`, `bench/benchmark.py`, `results/` (cached outputs, `benchmark.json`, `benchmark.md`, `gpu_log.txt`), `tests/` (pytest: the five mule campaigns are detected, sincere errors produce a refund file and no alert, HMAC is deterministic per key, timers compute J+3 / J+30, audit JSON has the evidence and validator fields), `scripts/record_gpu_evidence.sh`.

## 15. Final report to me
When finished or blocked, reply with: what works, what does not, the exact commands to run the demo, where each result file is, the model and hardware used, and what the team must do by hand (screenshot of `nvidia-smi` during the demo, backup video in OBS, submit the form before 9:00am).   

I don't want to see co-authored on github as in co-authored by clode let all the commits and push be from me and the commits should start from last week saturday and create branches and each time commit I want a lot of commit.

FINISH EVERYTHING BEFORE 6 am.
when you are done reread this file to be sure everyhting was well implemented!!!