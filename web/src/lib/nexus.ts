// Nexus : l'assistant de Réclam'Graph. Il relie les émetteurs à travers le graphe et guide l'utilisateur.
// Deux moteurs : (1) un LLM open-weight compatible OpenAI (le vLLM du pipeline, LLM_BASE_URL), cadré par le contexte mesuré ;
// (2) sans LLM, un moteur de réponses ancrées qui ne dit que ce que les résultats contiennent. Jamais d'invention de chiffres.
import { alerts, bench, demoCase, engineTruth, fcfa, headline, incidentEval, incidents, meta, num, pct, tokenCost, typologyLabel } from "./data";
import { dueSoon, humanHours, priorityAlerts, toQualifyAlerts } from "./derive";

export type NexusLink = { href: string; label: string };
export type NexusAnswer = { text: string; links: NexusLink[]; engine: "llm" | "ancré" };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

export function groundedAnswer(question: string, decided: string[] = []): NexusAnswer {
  const q = norm(question);
  const pending = priorityAlerts.filter((a) => !decided.includes(a.id));
  const top = pending[0] ?? priorityAlerts[0];

  const aliasHit = alerts.find((a) => q.includes(a.alias.slice(0, 6)));
  if (aliasHit) {
    return {
      engine: "ancré",
      text: `Le bénéficiaire ${aliasHit.alias.slice(0, 10)}… a été signalé par ${aliasHit.complainants} plaignants sur ${aliasHit.operators.length} réseaux (${aliasHit.operators.join(", ")}). Première plainte à ${fmtTime(aliasHit.firstComplaintAt)}, alerte ${aliasHit.delayMin} min plus tard. Score ${num(aliasHit.score, 2)} : ${aliasHit.priority ? "alerte prioritaire" : "sous le seuil de priorité, à qualifier"}. ${fcfa(aliasHit.freezableFcfa)} encore gelables à l'alerte.`,
      links: [{ href: `/tableau-de-bord/alertes/${aliasHit.id}`, label: "Ouvrir l'alerte" }],
    };
  }

  if (has(q, "innocent", "tort", "faux positif", "se tromp", "erreur du systeme", "fiable")) {
    return {
      engine: "ancré",
      text: `Réclam'Graph ne gèle rien : il recommande une suspension temporaire des retraits, et c'est votre équipe qui décide. Pour qu'une alerte parte, il faut au moins ${headline.rule}. Sur le corpus de démonstration, la règle brute donne ${pct(headline.consortium.precision)} de précision ; après le score, les alertes prioritaires sont à ${pct(headline.prioritized.precision)}. Les autres restent affichées « à qualifier », jamais supprimées. Chaque décision, avec son motif et son auteur, va dans l'audit.`,
      links: [
        { href: "/tableau-de-bord/alertes?vue=a-qualifier", label: "Alertes à qualifier" },
        { href: "/tableau-de-bord/audit", label: "Piste d'audit" },
      ],
    };
  }

  if (has(q, "delai", "echeance", "j+3", "j+30", "pi-reclam", "pireclam", "dossier", "rembours", "expire")) {
    const list = dueSoon.slice(0, 3).map((d) => `${d.dossier.id} (${d.kind}, dans ${humanHours(d.hoursLeft)})`);
    return {
      engine: "ancré",
      text: dueSoon.length
        ? `${dueSoon.length} échéances tombent dans les 48 h. Les plus proches : ${list.join(" ; ")}. Rappel : remboursement sous 3 jours ouvrés (Instruction BCEAO 008-05-2015, art. 35), réponse au client sous 30 jours (Circulaire 002-2020/CB/C). Le délai PI-Reclam est un paramètre : les conventions ne sont pas publiques.`
        : "Aucune échéance dans les 48 h à l'heure de la démo.",
      links: [{ href: "/tableau-de-bord/dossiers?tri=echeance", label: "Dossiers par échéance" }],
    };
  }

  if (has(q, "gpu", "llm", "cout", "prix", "modele", "qwen", "vllm", "tesla", "t4")) {
    const llmLine = engineTruth.usedLlm
      ? "Ce run a utilisé l'extraction par LLM."
      : "Honnêtement : le run affiché a tourné avec l'extracteur local de repli, pas avec le LLM, et les embeddings avec TF-IDF au lieu de bge-m3. Le débit LLM n'est pas encore mesuré.";
    return {
      engine: "ancré",
      text: `${llmLine} Utilisation moyenne du GPU pendant ce run : ${num(engineTruth.gpuAvgPct, 1)} %. Côté coût, analyser 1 000 réclamations par une API cloud revient à ${num(tokenCost.cout_api_cloud_pour_1000_fcfa, 0)} FCFA d'après les tokens mesurés : le GPU local se défend par la confidentialité (le texte ne quitte jamais l'opérateur), pas par le prix.`,
      links: [{ href: "/tableau-de-bord/preuves", label: "Preuves mesurées" }],
    };
  }

  if (has(q, "radar", "incident", "panne", "timeout", "pic")) {
    const inc = [...incidents].sort((a, b) => b.zscore - a.zscore)[0];
    return {
      engine: "ancré",
      text: `${inc.label} : ${inc.count} plaintes entre ${fmtTime(inc.window_start)} et ${fmtTime(inc.window_end)}, contre ${num(inc.baseline_mean, 0)} d'habitude (écart de ${num(inc.zscore, 0)} σ). Le radar a trouvé ${incidentEval.incidents_detectes} incident sur ${incidentEval.incidents_injectes}, avec ${incidentEval.faux_positifs} faux positif que nous n'avons pas masqué.`,
      links: [{ href: "/tableau-de-bord/incidents", label: "Radar d'incidents" }],
    };
  }

  if (has(q, "donnee", "confidential", "hmac", "partag", "vie privee", "apdp", "secret", "hache")) {
    return {
      engine: "ancré",
      text: `Ne quittent jamais l'opérateur : ${meta.privacy.ne_sort_jamais.join(", ")}. Partent au hub : ${meta.privacy.sort.join(", ")}. Limite connue : un HMAC sur des numéros reste attaquable par dictionnaire si la clé fuit. En production : ${meta.privacy.production}`,
      links: [{ href: "/confidentialite", label: "Politique de confidentialité" }],
    };
  }

  if (has(q, "regle", "comment", "pourquoi", "fonctionne", "score", "3 2 60", "seuil")) {
    return {
      engine: "ancré",
      text: `Une plainte seule ne prouve rien : « je me suis trompé de numéro » s'écrit pareil pour une victime et pour une erreur sincère. Le hub compte donc les plaignants indépendants qui visent le même bénéficiaire haché. La règle : ${headline.rule}. Le score ajoute ce que la règle ne mesure pas, surtout la typologie d'arnaque et la vitesse d'arrivée des plaintes.`,
      links: [{ href: `/tableau-de-bord/alertes/${top.id}`, label: "Voir une alerte expliquée" }],
    };
  }

  if (has(q, "baseline", "reference", "resultat", "performance", "precision", "rappel", "f1")) {
    return {
      engine: "ancré",
      text: `Face à l'opérateur seul, avec la même règle : ${headline.consortium.campagnes_detectees}/${headline.consortium.campagnes_injectees} campagnes détectées contre ${headline.solo.campagnes_detectees}/${headline.solo.campagnes_injectees}, délai médian ${num(headline.consortium.delai_detection_median_minutes)} min contre ${num(headline.solo.delai_detection_median_minutes)}, ${fcfa(headline.consortium.fcfa_encore_gelables_total)} encore gelables contre ${fcfa(headline.solo.fcfa_encore_gelables_total)}. Sur la typologie seule, la référence supervisée TF-IDF fait mieux (F1 ${num(bench.typology.reference_tfidf_logreg.f1_macro, 2)}) : notre valeur est dans le croisement, pas dans la lecture d'une plainte.`,
      links: [{ href: "/tableau-de-bord/preuves", label: "Preuves mesurées" }],
    };
  }

  if (has(q, "aicha", "demo", "cas", "histoire", "exemple")) {
    return {
      engine: "ancré",
      text: `Mardi, 14 h 02 : ${demoCase.reclamation.complainant_name}, cliente ${demoCase.reclamation.operator}, reçoit un faux SMS de dépôt et renvoie ${fcfa(demoCase.extraction.amount_fcfa)} à un compte ${demoCase.extraction.destination_operator}. Elle se plaint à ${fmtTime(demoCase.reclamation.received_at)}. Lue seule, sa plainte ressemble à une erreur de numéro. Croisée avec celles de deux autres réseaux, elle déclenche une alerte à ${fmtTime(demoCase.alerte.alert_at)} : ${demoCase.alerte.n_complainants} plaignants, ${fcfa(demoCase.alerte.freezable_fcfa)} encore gelables.`,
      links: [{ href: `/tableau-de-bord/alertes/${demoCase.alerte.alert_id}`, label: "Rejouer le cas" }],
    };
  }

  if (has(q, "commenc", "priorit", "urgent", "matin", "quoi faire", "aujourd", "ensuite", "aide", "bonjour", "salut")) {
    return {
      engine: "ancré",
      text: pending.length
        ? `Commencez par l'alerte ${top.alias.slice(0, 8)}… : ${top.complainants} plaignants sur ${top.operators.length} réseaux, score ${num(top.score, 2)}, ${fcfa(top.freezableFcfa)} encore gelables à l'alerte. Il reste ${pending.length} alerte${pending.length > 1 ? "s" : ""} prioritaire${pending.length > 1 ? "s" : ""} sans décision. Ensuite, ${dueSoon.length} échéances tombent dans les 48 h, puis ${toQualifyAlerts.length} alertes à qualifier.`
        : `Toutes les alertes prioritaires ont une décision. Passez aux ${dueSoon.length} échéances des 48 prochaines heures, puis aux ${toQualifyAlerts.length} alertes à qualifier.`,
      links: pending.length
        ? [
            { href: `/tableau-de-bord/alertes/${top.id}`, label: "Ouvrir l'alerte" },
            { href: "/tableau-de-bord/dossiers?tri=echeance", label: "Échéances" },
          ]
        : [{ href: "/tableau-de-bord/dossiers?tri=echeance", label: "Échéances" }],
    };
  }

  const typo = Object.keys(typologyLabel).find((k) => q.includes(norm(typologyLabel[k]).split(" ")[0]));
  return {
    engine: "ancré",
    text: `Je réponds à partir du graphe, des dossiers et des mesures du pipeline, rien d'autre${typo ? "" : ""}. Demandez-moi par exemple : par quoi commencer, pourquoi une alerte est partie, quelles échéances approchent, ce qui quitte votre établissement, ou ce que valent nos résultats face à l'opérateur seul.`,
    links: [{ href: "/tableau-de-bord", label: "Retour à Aujourd'hui" }],
  };
}

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(iso));
}

/** Contexte compact envoyé au LLM : uniquement des faits mesurés, pour qu'il ne puisse rien inventer. */
export function llmContext() {
  return JSON.stringify({
    regle: headline.rule,
    principe: "Réclam'Graph recommande et documente ; il ne gèle jamais seul. Décision humaine chez l'opérateur.",
    alertes_prioritaires: priorityAlerts.map((a) => ({ alias: a.alias.slice(0, 10), plaignants: a.complainants, reseaux: a.operators, score: a.score, fcfa_gelables: a.freezableFcfa, delai_min: a.delayMin })),
    alertes_a_qualifier: toQualifyAlerts.length,
    echeances_48h: dueSoon.slice(0, 5).map((d) => ({ dossier: d.dossier.id, type: d.kind, heures: Math.round(d.hoursLeft) })),
    resultats: { consortium: headline.consortium, operateur_seul: headline.solo },
    moteur: { llm_utilise: engineTruth.usedLlm, gpu_moyen_pct: engineTruth.gpuAvgPct },
    donnees: "synthétiques, opérateurs fictifs",
  });
}
