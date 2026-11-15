"""Gabarits de texte des réclamations synthétiques.

Objectif : produire du texte *réaliste et sale*, parce que c'est précisément
là que l'extraction LLM gagne contre la regex (section 11 du brief) :
abréviations SMS, fautes de frappe, montants écrits « 25mil » ou « 25.000F »,
français local mélangé, mots nouchi et fon.

Avertissement : injecter du lexique nouchi/fon dans le bruit ne veut PAS dire
que le système « comprend le fon » — le brief interdit de le prétendre. C'est
du bruit lexical, et c'est tout.
"""

from __future__ import annotations

# --------------------------------------------------------------------------
# Formats de montants : le coeur du test regex vs LLM
# --------------------------------------------------------------------------
AMOUNT_FORMATS = (
    "{n}",  # 25000
    "{n} FCFA",
    "{n}F",
    "{n} f cfa",
    "{group}",  # 25 000
    "{group} FCFA",
    "{dotted}",  # 25.000
    "{dotted}F",
    "{dotted} frs",
    "{k}k",  # 25k
    "{k} mil",  # 25 mil
    "{k}mil",  # 25mil
    "{k} milles",
    "{k}000",
    "{words}",  # vingt cinq mille
)

UNITS = {
    0: "zero", 1: "un", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq",
    6: "six", 7: "sept", 8: "huit", 9: "neuf", 10: "dix", 11: "onze",
    12: "douze", 13: "treize", 14: "quatorze", 15: "quinze", 16: "seize",
    17: "dix sept", 18: "dix huit", 19: "dix neuf", 20: "vingt",
    30: "trente", 40: "quarante", 50: "cinquante", 60: "soixante",
    70: "soixante dix", 80: "quatre vingt", 90: "quatre vingt dix",
    100: "cent", 200: "deux cent", 500: "cinq cent",
}


def amount_in_words(thousands: int) -> str:
    """« 25 » -> « vingt cinq mille ».

    Orthographe volontairement relâchée (pas de traits d'union, pas de « et »),
    comme dans un SMS — mais la forme reste celle qu'un francophone écrit :
    « soixante quinze », jamais « soixante dix cinq ».
    """
    if thousands in UNITS:
        return f"{UNITS[thousands]} mille"
    if thousands < 100:
        tens = (thousands // 10) * 10
        ones = thousands % 10
        # 70-79 et 90-99 se disent soixante/quatre vingt + 10..19
        if tens in (70, 90):
            return f"{UNITS[tens - 10]} {UNITS[10 + ones]} mille"
        if tens in UNITS and ones in UNITS:
            return f"{UNITS[tens]} {UNITS[ones]} mille"
    hundreds = (thousands // 100) * 100
    rest = thousands % 100
    if hundreds in UNITS:
        return f"{UNITS[hundreds]} {amount_in_words(rest)}" if rest else f"{UNITS[hundreds]} mille"
    return f"{thousands} mille"


# --------------------------------------------------------------------------
# Bruit lexical
# --------------------------------------------------------------------------
SMS_ABBREV = {
    "vous": "vs",
    "s'il vous plaît": "svp",
    "s'il vous plait": "svp",
    "beaucoup": "bcp",
    "aujourd'hui": "ajd",
    "pourquoi": "pk",
    "quelque": "qq",
    "problème": "pb",
    "message": "msg",
    "numéro": "num",
    "transaction": "transac",
    "argent": "l'argent",
    "monsieur": "mr",
    "bonjour": "bjr",
    "merci": "mci",
    "est-ce que": "eske",
    "rien": "rien du tt",
    "maintenant": "mtn",
}

NOUCHI = (
    "y'a pas drap",
    "c'est chaud",
    "dèh",
    "pardon dêh",
    "on dit quoi",
    "ça joue pas",
    "mon frère",
    "y'a problème",
    "enjaillé",
    "gbê est mieux que drap",
    "faut pas me gaou",
    "zamou",
)

FON_WORDS = (
    "kudo",  # merci
    "mi kplon",
    "a do ganji",
    "nukun",
    "azo",
    "e nyo a",
    "hwe",
    "doyi",
    "mawu",
)

GREETINGS = (
    "Bonjour", "Bjr", "Bonsoir", "Slt", "Salut", "Bonjour monsieur",
    "Bjr madame", "svp bonjour", "Bonjour l'equipe", "",
)

CLOSINGS = (
    "merci", "mci davance", "svp aidez moi", "je compte sur vous",
    "repondez moi svp", "c'est urgent", "aidez moi vite svp",
    "j'attends votre retour", "merci de regler ca", "",
)

# --------------------------------------------------------------------------
# Gabarits par typologie
# --------------------------------------------------------------------------
# {A}=montant formaté, {AL}=alias bénéficiaire, {MS}=msisdn bénéficiaire,
# {HH}=heure, {OP}=réseau de destination, {REF}=référence transaction
TEMPLATES: dict[str, tuple[str, ...]] = {
    # --- l'arnaque « erreur de dépôt » : le texte le plus important du projet
    "ARNAQUE_ERREUR_DEPOT": (
        "{G} jai recu un sms qui dit je vous ai envoye {A} par erreur renvoyez svp, "
        "jai renvoye a {AL} et mtn il repond plus. {C}",
        "{G} une personne ma ecrit kelle sest trompe de numero et ma demande de "
        "renvoyer {A}. jai envoye vers {AL} ({MS}) a {HH} et apres silence total. {C}",
        "{G} on ma appele en disant ke {A} est parti chez moi par erreur, "
        "jai eu pitie jai renvoye sur {AL}. mtn je comprends ke cest une arnaque. {C}",
        "{G} jai ete trompe. le monsieur a dit cest sa paye kil a envoye par erreur, "
        "jai remis {A} au {MS} reseau {OP}. il a bloque mon numero apres. {C}",
        "{G} sms recu: 'bonjour cest une erreur jai envoye {A} renvoie moi stp'. "
        "jai renvoye a {AL}. maintenant le numero est injoignable, cest une arnaque dêh. {C}",
        "{G} jai envoye {A} a {AL} parce kon ma dit kil y avait une erreur de depot "
        "sur mon compte. apres verification je navais rien recu du tout. {C}",
        "{G} arnaque erreur de depot. ils mont fait renvoyer {A} vers {MS}. "
        "le compte est sur {OP}. bloquez le vite avant kil retire. {C}",
        "{G} jai recu un faux message de depot de {A}, jai renvoye a {AL} a {HH}, "
        "et le vrai depot nexistait pas. je porte plainte. {C}",
    ),
    # --- l'erreur sincère : doit produire un remboursement, pas une alerte
    "ERREUR_DESTINATAIRE_SINCERE": (
        "{G} je me suis trompe de numero, jai envoye {A} a {AL} au lieu de ma soeur. "
        "pouvez vous annuler svp. {C}",
        "{G} erreur de ma part, {A} parti sur {MS} ({OP}) a {HH} au lieu du bon numero. "
        "merci dannuler la transaction. {C}",
        "{G} jai tape un chiffre de trop, {A} est alle chez {AL}. "
        "je voudrais recuperer mon argent svp. {C}",
        "{G} mauvais destinataire. montant {A}, reference {REF}, heure {HH}. "
        "le beneficiaire {AL} nest pas la bonne personne. {C}",
        "{G} jai envoye {A} a un mauvais numero {MS} par inattention, "
        "la personne dit kelle veut bien rembourser mais elle ne sait pas comment. {C}",
        "{G} transfert de {A} vers {AL} fait par erreur ce matin a {HH}. "
        "cetait pour un autre numero. merci de faire le necessaire. {C}",
        "{G} svp jai fait une erreur de destinataire sur {A}, le beneficiaire est {AL} "
        "sur le reseau {OP}. comment on annule? {C}",
    ),
    "OTP_PHISHING": (
        "{G} quelquun sest fait passer pour votre service client et ma demande mon code, "
        "apres jai vu {A} parti de mon compte a {HH}. {C}",
        "{G} on ma appele en disant kon allait debloquer mon compte, jai donne le code recu "
        "par sms et {A} a disparu. {C}",
        "{G} jai donne mon otp a un faux agent, resultat {A} retire sans mon accord. "
        "reference {REF}. {C}",
        "{G} piratage de mon compte. ils ont utilise mon code de verification et sorti {A}. "
        "je nai autorise aucune operation. {C}",
    ),
    "TRANSACTION_ECHOUEE_DEBITEE": (
        "{G} transaction echouee mais jai ete debite de {A}. reference {REF} a {HH}. "
        "le beneficiaire na rien recu. {C}",
        "{G} jai envoye {A} ca a affiche echec mais largent est sorti de mon solde. {C}",
        "{G} double debit de {A} pour une seule operation {REF}. "
        "remboursez moi la difference svp. {C}",
        "{G} paiement marchand refuse mais {A} preleve. jai la capture decran. {C}",
        "{G} jai fait un retrait de {A} la machine na rien donne et mon compte est debite. {C}",
    ),
    "RETARD_TIMEOUT": (
        "{G} mon transfert de {A} vers {OP} est bloque depuis {HH}, "
        "ca affiche en cours de traitement. {C}",
        "{G} depuis ce matin impossible denvoyer vers {OP}, ca echoue tout le temps. "
        "jai essaye {A} trois fois. {C}",
        "{G} transaction {REF} de {A} en attente depuis plus dune heure. "
        "le beneficiaire na rien recu, mon solde est debite. {C}",
        "{G} probleme sur le reseau? mes envois vers {OP} tombent en timeout. "
        "montant concerne {A}. {C}",
        "{G} interoperabilite en panne on dirait, {A} ni arrive ni rembourse. "
        "ca fait des heures. {C}",
    ),
    "FRAIS_CONTESTES": (
        "{G} on ma preleve des frais sur un transfert de {A} alors ke cetait annonce gratuit. {C}",
        "{G} je conteste les frais appliques a loperation {REF}, montant {A}. {C}",
        "{G} pourquoi des frais sur {A} alors ke je suis en dessous du plafond gratuit? {C}",
        "{G} les frais ont change sans information. jai paye plus cher pour {A}. {C}",
    ),
    "AGENT_DISTRIBUTEUR": (
        "{G} lagent du kiosque a pris une commission en plus sur mon depot de {A}. {C}",
        "{G} jai depose {A} chez un agent, il na jamais credite mon compte. "
        "il dit ke cest le reseau. {C}",
        "{G} lagent a fait le retrait de {A} sur mon compte sans me donner largent. {C}",
        "{G} le distributeur refuse de me rembourser {A} apres une operation ratee. {C}",
    ),
    "CHANGEMENT_NUMERO": (
        "{G} jai change de numero et mon ancien compte avec {A} dessus est inaccessible. {C}",
        "{G} mon numero a ete reattribue a quelquun dautre, il y avait {A} sur le compte. {C}",
        "{G} comment recuperer mon solde de {A} apres changement de numero? {C}",
    ),
    "AUTRE": (
        "{G} je narrive pas a ouvrir lapplication depuis la mise a jour. {C}",
        "{G} mon compte est bloque sans explication, jai {A} dessus. {C}",
        "{G} je voudrais comprendre les plafonds de retrait svp. {C}",
        "{G} jai perdu ma carte sim, comment securiser mon compte? {C}",
        "{G} le code pin ne marche plus, jai essaye plusieurs fois. {C}",
        "{G} je veux fermer mon compte et recuperer le solde. {C}",
        "{G} votre agence etait fermee hier alors ke cetait un jour ouvre. {C}",
    ),
}

#: Indicateurs d'arnaque que l'extracteur doit savoir repérer.
SCAM_INDICATOR_PHRASES = {
    "recit_erreur_depot": (
        "par erreur", "erreur de depot", "sest trompe", "trompe de numero",
        "faux message de depot", "erreur de ma part",
    ),
    "demande_de_renvoi": ("renvoyez", "renvoie moi", "renvoyer", "remis", "remettre"),
    "pression_urgence": ("urgent", "vite", "tout de suite", "mtn", "maintenant"),
    "injoignable_apres": (
        "repond plus", "injoignable", "bloque mon numero", "silence total",
        "a bloque", "plus joignable",
    ),
    "usurpation_service_client": (
        "service client", "faux agent", "se faire passer", "sest fait passer",
    ),
    "demande_de_code": ("mon code", "otp", "code recu", "code de verification"),
}
