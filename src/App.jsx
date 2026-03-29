import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// ═══════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════

const CATEGORIES = {
  D01: { name: "Signalisation", icon: "🚦", weight: 20 },
  D02: { name: "Priorités", icon: "⚠️", weight: 15 },
  D03: { name: "Vitesse & distances", icon: "🏎️", weight: 10 },
  D04: { name: "Dépassement", icon: "↔️", weight: 8 },
  D05: { name: "Stationnement", icon: "🅿️", weight: 5 },
  D06: { name: "Conduite hivernale", icon: "❄️", weight: 8 },
  D07: { name: "Alcool & fatigue", icon: "🚫", weight: 8 },
  D08: { name: "Véhicules d'urgence", icon: "🚑", weight: 4 },
  D09: { name: "Zones spéciales", icon: "🏫", weight: 6 },
  D10: { name: "Partage route", icon: "🚲", weight: 8 },
  D11: { name: "Mécanique", icon: "🔧", weight: 4 },
  D12: { name: "Responsabilités", icon: "⚖️", weight: 4 },
};

const LEVELS = {
  N1: { name: "Facile", color: "#22c55e", points: 1 },
  N2: { name: "Moyen", color: "#3b82f6", points: 2 },
  N3: { name: "Difficile", color: "#f59e0b", points: 3 },
  N4: { name: "Très difficile", color: "#ef4444", points: 4 },
  N5: { name: "Expert", color: "#a855f7", points: 5 },
};

const STORAGE_KEYS = {
  SRS: "saaq-srs-data",
  SESSIONS: "saaq-sessions",
  STATS: "saaq-stats",
  STREAK: "saaq-streak",
  DIAGNOSTIC: "saaq-diagnostic",
};

// ═══════════════════════════════════════════════════════════
// QUESTION BANK (~70 questions)
// ═══════════════════════════════════════════════════════════

const QUESTIONS = [
  // ── D01 SIGNALISATION ──
  { id:"D01-N1-001", cat:"D01", level:"N1",
    q:"Que signifie un panneau octogonal (8 côtés) rouge avec le mot ARRÊT ?",
    choices:["Ralentir et céder le passage","Immobiliser complètement le véhicule","Arrêt facultatif si aucun véhicule en vue","Réduire la vitesse à 10 km/h"],
    answer:1, ref:"CSR art. 368",
    explain:"Le panneau ARRÊT oblige à immobiliser complètement le véhicule avant la ligne d'arrêt ou avant le passage piéton." },
  { id:"D01-N1-002", cat:"D01", level:"N1",
    q:"Quelle est la signification d'un feu jaune fixe ?",
    choices:["Accélérer pour passer avant le rouge","S'immobiliser si possible de le faire en toute sécurité","Priorité aux piétons seulement","Tourner à gauche rapidement"],
    answer:1, ref:"CSR art. 362",
    explain:"Le feu jaune avertit que le feu passera au rouge. Le conducteur doit s'arrêter s'il peut le faire de façon sécuritaire." },
  { id:"D01-N2-001", cat:"D01", level:"N2",
    q:"Un feu vert clignotant à une intersection signifie :",
    choices:["Même chose qu'un feu vert fixe","Priorité pour effectuer un virage à gauche","Ralentir, le feu va passer au jaune","Voie réservée aux autobus"],
    answer:1, ref:"CSR art. 361",
    explain:"Au Québec, le feu vert clignotant indique une priorité de virage à gauche. Les véhicules en sens inverse ont un feu rouge." },
  { id:"D01-N2-002", cat:"D01", level:"N2",
    q:"Que signifie un panneau losange jaune avec une flèche courbée vers la droite ?",
    choices:["Virage obligatoire à droite","Courbe dangereuse à droite devant","Route glissante","Déviation vers la droite"],
    answer:1, ref:"RSR signalisation avancée",
    explain:"Les panneaux losanges jaunes sont des panneaux de danger. Une flèche courbée indique une courbe prononcée dans la direction indiquée." },
  { id:"D01-N3-001", cat:"D01", level:"N3",
    q:"À une intersection, le feu est rouge mais une flèche verte pointe vers la droite. Que pouvez-vous faire ?",
    choices:["Tourner à droite seulement, après avoir cédé le passage","Aller tout droit ou tourner à droite","Tourner à droite sans arrêter","Attendre le feu vert"],
    answer:0, ref:"CSR art. 365",
    explain:"La flèche verte autorise uniquement le mouvement indiqué (ici droite). Il faut céder le passage aux piétons et véhicules ayant priorité." },
  { id:"D01-N4-001", cat:"D01", level:"N4",
    q:"Vous approchez d'un feu clignotant rouge. Un panneau de CÉDEZ est aussi présent. Que devez-vous faire ?",
    choices:["Respecter le feu clignotant rouge (arrêt complet)","Respecter le panneau cédez seulement","Choisir la règle la plus restrictive","Les deux panneaux s'annulent"],
    answer:0, ref:"CSR art. 363",
    explain:"Le feu clignotant rouge équivaut à un panneau d'arrêt. Il est plus restrictif que le cédez. On doit s'immobiliser complètement, puis céder le passage.",
    trap:"Confusion entre hiérarchie des signaux. Le feu prévaut sur le panneau." },

  // ── D02 PRIORITÉS ──
  { id:"D02-N1-001", cat:"D02", level:"N1",
    q:"À une intersection avec panneaux d'arrêt dans toutes les directions, qui passe en premier ?",
    choices:["Le véhicule arrivé en premier","Le véhicule venant de la droite","Le plus gros véhicule","Celui qui fait signe de passer"],
    answer:0, ref:"CSR art. 369",
    explain:"Aux arrêts multiples, le premier arrivé passe en premier. En cas d'arrivée simultanée, priorité au véhicule de droite." },
  { id:"D02-N2-001", cat:"D02", level:"N2",
    q:"Vous êtes à un arrêt. Un véhicule arrive à votre droite au même moment. Qui a la priorité ?",
    choices:["Vous, car vous étiez déjà arrêté","Le véhicule à votre droite","Celui qui fait signe en premier","Le premier qui s'engage"],
    answer:1, ref:"CSR art. 369",
    explain:"En cas d'arrivée simultanée à une intersection à arrêts multiples, la priorité est au véhicule venant de la droite." },
  { id:"D02-N3-001", cat:"D02", level:"N3",
    q:"Vous voulez tourner à gauche au feu vert. Un véhicule en face va tout droit. Qui a priorité ?",
    choices:["Vous, car vous étiez là en premier","Le véhicule qui va tout droit","Celui qui est dans la voie la plus à gauche","Le premier à s'engager dans l'intersection"],
    answer:1, ref:"CSR art. 370",
    explain:"Le véhicule qui tourne à gauche doit céder le passage aux véhicules en sens inverse qui vont tout droit ou tournent à droite." },
  { id:"D02-N3-002", cat:"D02", level:"N3",
    q:"Vous arrivez à un rond-point. Qui a la priorité ?",
    choices:["Les véhicules qui entrent dans le rond-point","Les véhicules déjà engagés dans le rond-point","Les véhicules venant de la droite","Le premier arrivé"],
    answer:1, ref:"CSR art. 371",
    explain:"Les véhicules circulant déjà dans le rond-point ont priorité sur ceux qui s'y engagent." },
  { id:"D02-N4-001", cat:"D02", level:"N4",
    q:"À une intersection sans panneau ni feu, deux véhicules arrivent en même temps — un sur le boulevard principal, l'autre sur une rue secondaire. Qui a priorité ?",
    choices:["Le véhicule sur le boulevard a toujours priorité","Le véhicule venant de la droite, peu importe la route","Celui qui va tout droit","Aucune règle ne s'applique"],
    answer:1, ref:"CSR art. 369",
    explain:"Sans signalisation, la règle de priorité à droite s'applique, même si un véhicule circule sur une route apparemment plus importante.",
    trap:"Biais d'ancrage sur la « taille » de la route. Le CSR ne reconnaît pas la notion de route principale sans signalisation." },
  { id:"D02-N5-001", cat:"D02", level:"N5",
    q:"Vous êtes à un feu vert et voulez tourner à gauche. Un piéton traverse dans votre direction de virage ET un véhicule d'urgence avec sirène arrive en sens inverse. Que faites-vous ?",
    choices:["Tourner en contournant le piéton pour dégager la voie au véhicule d'urgence","Rester immobile dans l'intersection et attendre","Avancer dans l'intersection puis s'immobiliser pour laisser passer le véhicule d'urgence et le piéton","Reculer pour dégager la voie"],
    answer:2, ref:"CSR art. 370, 406",
    explain:"On avance dans l'intersection au feu vert, puis on s'immobilise pour laisser le piéton finir de traverser ET le véhicule d'urgence passer. On ne recule jamais dans une intersection.",
    trap:"Scénario multi-facteurs : le candidat doit gérer piéton + urgence + feu simultanément. Le piège est de vouloir « aider » l'urgence en ignorant le piéton." },

  // ── D03 VITESSE & DISTANCES ──
  { id:"D03-N1-001", cat:"D03", level:"N1",
    q:"Quelle est la limite de vitesse en agglomération au Québec, sauf indication contraire ?",
    choices:["40 km/h","50 km/h","60 km/h","70 km/h"],
    answer:1, ref:"CSR art. 328",
    explain:"La limite de vitesse par défaut en agglomération est de 50 km/h sauf indication contraire." },
  { id:"D03-N1-002", cat:"D03", level:"N1",
    q:"Quelle est la limite de vitesse sur les autoroutes du Québec, sauf indication contraire ?",
    choices:["90 km/h","100 km/h","110 km/h","120 km/h"],
    answer:1, ref:"CSR art. 329",
    explain:"La limite par défaut sur les autoroutes est de 100 km/h." },
  { id:"D03-N2-001", cat:"D03", level:"N2",
    q:"Quelle est la technique recommandée pour évaluer la distance de suivi sécuritaire ?",
    choices:["Rester à 5 mètres du véhicule devant","Laisser au moins 2 secondes entre vous et le véhicule devant","Garder une longueur de voiture d'écart par 10 km/h","Voir les pneus arrière du véhicule devant"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"La règle des 2 secondes est la méthode recommandée. On choisit un repère fixe et on compte le temps entre le passage du véhicule devant et le nôtre." },
  { id:"D03-N3-001", cat:"D03", level:"N3",
    q:"Vous roulez à 90 km/h sur une route mouillée. Quel ajustement de distance de suivi est recommandé ?",
    choices:["Maintenir les 2 secondes habituelles","Augmenter à 3 secondes minimum","Augmenter à 4 secondes minimum","Réduire la vitesse à 70 km/h et garder 2 secondes"],
    answer:2, ref:"Guide de la route SAAQ",
    explain:"Sur chaussée mouillée, la distance de freinage peut doubler. Il faut augmenter la distance de suivi à au moins 4 secondes." },
  { id:"D03-N4-001", cat:"D03", level:"N4",
    q:"Un panneau indique 70 km/h. La chaussée est glacée, la visibilité réduite par le brouillard. Quelle vitesse est légalement requise ?",
    choices:["70 km/h — c'est la limite affichée","La vitesse que vous jugez sécuritaire selon les conditions","50 km/h par défaut en conditions hivernales","60 km/h — 10 km/h sous la limite"],
    answer:1, ref:"CSR art. 327",
    explain:"Le CSR oblige le conducteur à adapter sa vitesse aux conditions, même si elle est inférieure à la limite. Rouler à la limite sur glace noire peut constituer une infraction.",
    trap:"Le panneau donne la limite MAXIMALE, pas la vitesse obligatoire. Le candidat ancre sur le chiffre affiché." },

  // ── D04 DÉPASSEMENT ──
  { id:"D04-N1-001", cat:"D04", level:"N1",
    q:"De quel côté doit-on effectuer un dépassement ?",
    choices:["Par la droite","Par la gauche","Des deux côtés sur une route à sens unique","Par le côté le plus dégagé"],
    answer:1, ref:"CSR art. 345",
    explain:"Le dépassement se fait par la gauche. Des exceptions existent pour les routes à voies multiples dans le même sens." },
  { id:"D04-N2-001", cat:"D04", level:"N2",
    q:"Vous roulez derrière un véhicule lent sur une route à double ligne jaune continue. Pouvez-vous dépasser ?",
    choices:["Oui, si la voie est libre","Non, le dépassement est interdit sur double ligne continue","Oui, si le véhicule roule à moins de 50 km/h","Oui, mais seulement si l'autre conducteur vous fait signe"],
    answer:1, ref:"CSR art. 344",
    explain:"La double ligne jaune continue interdit le dépassement dans les deux sens." },
  { id:"D04-N3-001", cat:"D04", level:"N3",
    q:"Vous êtes sur une route avec une ligne jaune continue de votre côté et discontinue de l'autre. Pouvez-vous dépasser ?",
    choices:["Oui, la ligne discontinue vous autorise","Non, la ligne continue de votre côté interdit le dépassement","Oui, si la route est dégagée sur 500m","Non, jamais avec une ligne jaune"],
    answer:1, ref:"CSR art. 344",
    explain:"C'est la ligne de votre côté qui détermine votre droit. Ligne continue = dépassement interdit de votre côté." },
  { id:"D04-N4-001", cat:"D04", level:"N4",
    q:"Peut-on dépasser un véhicule immobilisé qui fait monter ou descendre des passagers, sur une route sans terre-plein central ?",
    choices:["Oui, avec prudence à vitesse réduite","Non, jamais","Oui, seulement si c'est un autobus scolaire sans feux clignotants","Dépend de la limite de vitesse"],
    answer:0, ref:"CSR art. 348",
    explain:"On peut dépasser un véhicule immobilisé avec prudence, SAUF un autobus scolaire dont les feux rouges clignotent — dans ce cas l'arrêt est obligatoire.",
    trap:"Le candidat confond autobus scolaire (règle stricte) avec tout véhicule immobilisé (règle souple)." },

  // ── D05 STATIONNEMENT ──
  { id:"D05-N1-001", cat:"D05", level:"N1",
    q:"À quelle distance minimale d'une borne d'incendie est-il interdit de stationner ?",
    choices:["3 mètres","5 mètres","8 mètres","10 mètres"],
    answer:0, ref:"CSR art. 386",
    explain:"Depuis 2018, il est interdit de stationner à moins de 3 mètres d'une borne d'incendie (anciennement 5 mètres)." },
  { id:"D05-N2-001", cat:"D05", level:"N2",
    q:"Vous stationnez en montée le long d'un trottoir. Comment orienter vos roues avant ?",
    choices:["Vers le trottoir (droite)","Vers la rue (gauche)","Droit devant","Cela n'a pas d'importance avec le frein à main"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"En montée, les roues sont tournées vers la rue (gauche). Si le véhicule recule, les roues butent contre le trottoir." },
  { id:"D05-N3-001", cat:"D05", level:"N3",
    q:"Est-il permis de stationner à moins de 5 mètres d'une intersection sans panneau d'arrêt ?",
    choices:["Oui, tant qu'on ne bloque pas la circulation","Non, c'est interdit à moins de 5 mètres de toute intersection","Oui, si la visibilité est bonne","Seulement du côté droit de la route"],
    answer:1, ref:"CSR art. 386",
    explain:"Le stationnement est interdit à moins de 5 mètres d'une intersection, sauf là où la signalisation le permet explicitement." },

  // ── D06 CONDUITE HIVERNALE ──
  { id:"D06-N1-001", cat:"D06", level:"N1",
    q:"Quand les pneus d'hiver sont-ils obligatoires au Québec ?",
    choices:["Du 15 octobre au 15 avril","Du 1er décembre au 15 mars","Du 1er novembre au 1er avril","Du 15 novembre au 15 mars"],
    answer:1, ref:"CSR art. 440.1",
    explain:"Les pneus d'hiver sont obligatoires du 1er décembre au 15 mars inclusivement." },
  { id:"D06-N2-001", cat:"D06", level:"N2",
    q:"Que devez-vous faire si votre véhicule commence à déraper sur la glace ?",
    choices:["Freiner brusquement","Tourner le volant dans le sens contraire du dérapage","Regarder et diriger le volant dans la direction souhaitée, sans freiner brusquement","Accélérer pour reprendre le contrôle"],
    answer:2, ref:"Guide de la route SAAQ",
    explain:"En dérapage, il faut regarder où on veut aller, diriger le volant dans cette direction, relâcher l'accélérateur et éviter de freiner brusquement." },
  { id:"D06-N3-001", cat:"D06", level:"N3",
    q:"Vous roulez et rencontrez de l'aquaplanage. Quelle est la réaction appropriée ?",
    choices:["Freiner doucement pour ralentir","Relâcher l'accélérateur et maintenir le volant droit sans freiner","Tourner le volant pour sortir de la zone d'eau","Accélérer pour traverser la zone rapidement"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"En aquaplanage, les pneus perdent le contact avec la route. Il faut relâcher l'accélérateur, garder le volant droit et attendre que les pneus reprennent le contact." },
  { id:"D06-N4-001", cat:"D06", level:"N4",
    q:"Vous conduisez en hiver avec des pneus d'hiver en bon état. Votre distance de freinage sur glace noire par rapport à la chaussée sèche est approximativement :",
    choices:["2 fois plus longue","3 à 4 fois plus longue","6 à 10 fois plus longue","Identique grâce aux pneus d'hiver"],
    answer:2, ref:"Guide de la route SAAQ",
    explain:"Sur glace noire, même avec des pneus d'hiver, la distance de freinage peut être de 6 à 10 fois plus longue que sur chaussée sèche.",
    trap:"Le candidat surestime l'efficacité des pneus d'hiver. Ils améliorent l'adhérence mais ne l'éliminent pas le risque sur glace." },

  // ── D07 ALCOOL & FATIGUE ──
  { id:"D07-N1-001", cat:"D07", level:"N1",
    q:"Quel est le taux d'alcoolémie maximal permis pour un conducteur titulaire d'un permis probatoire au Québec ?",
    choices:["0,05","0,08","Zéro (0,00)","0,02"],
    answer:2, ref:"CSR art. 202.2",
    explain:"Les titulaires d'un permis d'apprenti ou probatoire doivent avoir un taux d'alcoolémie de zéro." },
  { id:"D07-N2-001", cat:"D07", level:"N2",
    q:"Quel est le taux d'alcoolémie maximal permis pour un conducteur titulaire d'un permis régulier ?",
    choices:["0,05","0,08","0,00","0,10"],
    answer:1, ref:"Code criminel art. 320.14",
    explain:"Le taux maximal est de 0,08 (80 mg/100 ml de sang) pour les titulaires d'un permis régulier. Au-delà, c'est une infraction criminelle." },
  { id:"D07-N3-001", cat:"D07", level:"N3",
    q:"Un conducteur avec un permis régulier a un taux d'alcoolémie entre 0,05 et 0,08. Quelles sont les conséquences selon la loi québécoise ?",
    choices:["Aucune sanction administrative au Québec à ce palier","Suspension administrative immédiate de 24h du permis","Accusation criminelle","Amende de 300$ seulement"],
    answer:0, ref:"Code criminel art. 320.14, CSR",
    explain:"Au Québec, il n'existe aucune sanction administrative entre 0,05 et 0,08 pour un permis régulier. Le Québec est la seule province canadienne sans mesure à ce palier. L'infraction criminelle débute à 0,08. Attention : d'autres provinces (Ontario, C.-B.) imposent des sanctions dès 0,05." },
  { id:"D07-N4-001", cat:"D07", level:"N4",
    q:"Après combien de temps un adulte de poids moyen élimine-t-il environ une consommation standard d'alcool ?",
    choices:["30 minutes","1 heure","1 heure à 1 heure 30 minutes","2 heures 30 minutes"],
    answer:2, ref:"Guide de la route SAAQ",
    explain:"Le corps élimine environ une consommation standard en 1h à 1h30, selon le sexe, le poids et le métabolisme. Aucun truc (café, douche froide) n'accélère l'élimination.",
    trap:"Le candidat peut croire que le métabolisme est plus rapide ou que des remèdes accélèrent l'élimination." },

  // ── D08 VÉHICULES D'URGENCE ──
  { id:"D08-N1-001", cat:"D08", level:"N1",
    q:"Que devez-vous faire lorsqu'un véhicule d'urgence (sirène et gyrophare) approche derrière vous ?",
    choices:["Accélérer pour le laisser passer","Vous ranger le plus à droite possible et vous immobiliser","Continuer à la même vitesse","Freiner immédiatement"],
    answer:1, ref:"CSR art. 406",
    explain:"Il faut se ranger le plus à droite possible et s'immobiliser pour laisser passer le véhicule d'urgence." },
  { id:"D08-N2-001", cat:"D08", level:"N2",
    q:"Vous êtes dans un rond-point et un véhicule d'urgence avec sirène veut y entrer. Que faites-vous ?",
    choices:["Vous arrêtez immédiatement dans le rond-point","Vous sortez du rond-point à la prochaine sortie, puis vous vous rangez","Vous reculez pour le laisser passer","Vous continuez normalement, le véhicule d'urgence doit attendre"],
    answer:1, ref:"CSR art. 406",
    explain:"On ne s'arrête pas dans un rond-point. Il faut en sortir à la prochaine sortie disponible, puis se ranger et s'immobiliser." },
  { id:"D08-N3-001", cat:"D08", level:"N3",
    q:"Vous approchez d'un véhicule d'urgence immobilisé sur l'accotement avec ses gyrophares allumés. Que devez-vous faire ?",
    choices:["Ralentir et changer de voie si possible","Continuer à la même vitesse en gardant votre voie","Vous arrêter derrière le véhicule d'urgence","Accélérer pour dégager rapidement la zone"],
    answer:0, ref:"CSR art. 406.1 (Loi corridor de sécurité)",
    explain:"La loi du corridor de sécurité oblige à ralentir et, si possible, à changer de voie pour s'éloigner du véhicule immobilisé avec gyrophares." },

  // ── D09 ZONES SPÉCIALES ──
  { id:"D09-N1-001", cat:"D09", level:"N1",
    q:"Quelle est la vitesse maximale dans une zone scolaire lorsque les feux clignotants sont activés ?",
    choices:["20 km/h","30 km/h","40 km/h","50 km/h"],
    answer:1, ref:"CSR art. 329, 626",
    explain:"La vitesse maximale est de 30 km/h dans une zone scolaire quand les feux clignotants sont en fonction. Cette limite est établie par règlement municipal (art. 626 CSR) et c'est la norme dans la quasi-totalité des municipalités du Québec." },
  { id:"D09-N2-001", cat:"D09", level:"N2",
    q:"Un autobus scolaire est immobilisé, feux rouges clignotants activés, sur une route sans terre-plein. Que devez-vous faire ?",
    choices:["Ralentir à 10 km/h et passer prudemment","Vous immobiliser à plus de 5 mètres de l'autobus","Dépasser par la gauche si la voie est libre","Klaxonner pour avertir et passer"],
    answer:1, ref:"CSR art. 460",
    explain:"Il faut s'immobiliser à plus de 5 mètres de l'autobus scolaire dont les feux rouges clignotent, peu importe la direction d'où vous venez." },
  { id:"D09-N4-001", cat:"D09", level:"N4",
    q:"Un autobus scolaire est immobilisé avec feux clignotants sur une route AVEC terre-plein central séparant les deux directions. Vous circulez en sens inverse. Devez-vous vous arrêter ?",
    choices:["Oui, dans tous les cas","Non, le terre-plein vous dispense de l'arrêt","Oui, sauf si le terre-plein fait plus de 5 mètres","Non, sauf si des enfants traversent"],
    answer:1, ref:"CSR art. 460",
    explain:"S'il y a un terre-plein physique séparant les directions, les véhicules en sens inverse n'ont pas à s'arrêter.",
    trap:"Le candidat généralise la règle d'arrêt obligatoire sans considérer l'exception du terre-plein." },

  // ── D10 PARTAGE DE LA ROUTE ──
  { id:"D10-N1-001", cat:"D10", level:"N1",
    q:"Quelle distance latérale minimale devez-vous laisser en dépassant un cycliste dans une zone de 50 km/h ?",
    choices:["0,5 mètre","1 mètre","1,5 mètre","2 mètres"],
    answer:1, ref:"CSR art. 341",
    explain:"En zone de 50 km/h ou moins, la distance minimale pour dépasser un cycliste est de 1 mètre. En zone de plus de 50 km/h, c'est 1,5 mètre." },
  { id:"D10-N2-001", cat:"D10", level:"N2",
    q:"Un piéton s'engage dans un passage piéton sans feux. Que devez-vous faire ?",
    choices:["Klaxonner pour l'avertir","Vous immobiliser pour le laisser traverser","Ralentir et contourner le piéton","Continuer si vous étiez là en premier"],
    answer:1, ref:"CSR art. 410",
    explain:"Le conducteur doit s'immobiliser pour permettre au piéton de traverser en toute sécurité au passage piéton." },
  { id:"D10-N3-001", cat:"D10", level:"N3",
    q:"Vous tournez à droite au feu vert. Un cycliste à votre droite va tout droit. Qui a priorité ?",
    choices:["Vous, car le virage à droite est prioritaire","Le cycliste, qui a priorité en allant tout droit","Le premier arrivé à l'intersection","Vous, car le cycliste doit toujours céder"],
    answer:1, ref:"CSR art. 349, 487",
    explain:"Le cycliste allant tout droit a priorité sur le véhicule qui tourne. Attention à l'angle mort à droite." },
  { id:"D10-N4-001", cat:"D10", level:"N4",
    q:"À une intersection avec feu pour piétons affichant une main clignotante (décompte), un piéton est déjà engagé dans le passage. Pouvez-vous avancer ?",
    choices:["Oui, la main clignotante interdit aux PIÉTONS de s'engager, pas aux voitures d'avancer","Non, il faut attendre que le piéton ait complètement traversé","Oui, si le piéton est passé le centre de la route","Non, le feu piéton a priorité sur le feu de circulation"],
    answer:1, ref:"CSR art. 410",
    explain:"Un piéton déjà engagé a toujours priorité. Vous devez attendre qu'il ait terminé sa traversée avant d'avancer.",
    trap:"Le candidat rationalise en distinguant le signal piéton (qui s'adresse aux piétons) de son obligation (qui s'adresse aux conducteurs)." },
  { id:"D10-N5-001", cat:"D10", level:"N5",
    q:"Vous roulez en ville la nuit. Un cycliste sans lumières traverse devant vous hors d'un passage piéton. Vous le heurtez. Qui est responsable ?",
    choices:["Le cycliste uniquement, il était en infraction","Vous uniquement, le conducteur est toujours responsable","Responsabilité partagée, mais vous pourriez être tenu partiellement responsable","Personne, c'est un accident inévitable"],
    answer:2, ref:"CSR art. 3, Loi sur l'assurance automobile",
    explain:"Le cycliste est en infraction (pas de lumières, hors passage). Cependant, le conducteur a un devoir de prudence. La responsabilité est généralement partagée, mais le régime d'assurance automobile du Québec (no-fault) indemnise les victimes sans égard à la faute.",
    trap:"Double piège : 1) Le candidat veut blâmer entièrement le cycliste. 2) Le régime no-fault du Québec complique l'analyse de faute civile." },

  // ── D11 MÉCANIQUE ──
  { id:"D11-N1-001", cat:"D11", level:"N1",
    q:"Quel élément devez-vous vérifier régulièrement pour assurer votre sécurité ?",
    choices:["La couleur de la carrosserie","La pression des pneus","Le numéro de la plaque","La propreté des tapis"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"La pression des pneus affecte directement la tenue de route, la distance de freinage et la consommation. Vérification recommandée mensuellement." },
  { id:"D11-N2-001", cat:"D11", level:"N2",
    q:"Votre témoin lumineux de freins s'allume sur le tableau de bord pendant que vous conduisez. Que devez-vous faire ?",
    choices:["Continuer jusqu'à destination et vérifier ensuite","Vous arrêter dès que possible en lieu sûr et vérifier le niveau de liquide de frein","Accélérer pour tester les freins","Ignorer si les freins semblent fonctionner"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"Un témoin de frein allumé peut indiquer un problème grave (fuite, niveau bas). Il faut s'arrêter de façon sécuritaire et vérifier." },
  { id:"D11-N3-001", cat:"D11", level:"N3",
    q:"En cas de crevaison sur l'autoroute, quelle est la procédure sécuritaire ?",
    choices:["Freiner brusquement et vous arrêter sur la voie","Allumer les feux de détresse, ralentir graduellement et vous diriger vers l'accotement","Accélérer pour atteindre la prochaine sortie","Couper le moteur immédiatement"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"Allumer les feux de détresse, tenir fermement le volant, ralentir graduellement sans freiner brusquement, et se ranger sur l'accotement le plus loin possible de la circulation." },

  // ── D12 RESPONSABILITÉS ──
  { id:"D12-N1-001", cat:"D12", level:"N1",
    q:"Combien de points d'inaptitude entraîne la révocation du permis probatoire ?",
    choices:["4 points","8 points","12 points","15 points"],
    answer:0, ref:"CSR art. 185",
    explain:"Le permis probatoire est révoqué à l'accumulation de 4 points d'inaptitude ou plus." },
  { id:"D12-N2-001", cat:"D12", level:"N2",
    q:"Vous êtes impliqué dans un accident matériel sans blessé. Quelle est votre obligation ?",
    choices:["Remplir un constat amiable et partir","Appeler la police dans tous les cas","Rester sur les lieux et échanger les informations avec l'autre conducteur","Rien, si les dommages semblent mineurs"],
    answer:2, ref:"CSR art. 168",
    explain:"Il faut rester sur les lieux, fournir ses coordonnées et informations d'assurance. Un rapport de police est requis si les dommages semblent importants." },
  { id:"D12-N3-001", cat:"D12", level:"N3",
    q:"Vous êtes titulaire d'un permis d'apprenti conducteur. Quelles sont vos restrictions ?",
    choices:["Conduire seul après 22h","Être accompagné d'une personne titulaire d'un permis régulier depuis au moins 2 ans","Conduire seulement en ville","Aucune restriction particulière"],
    answer:1, ref:"CSR art. 99",
    explain:"L'apprenti conducteur doit être accompagné d'un titulaire de permis depuis au moins 2 ans, assis à côté. Taux d'alcool : zéro." },
  { id:"D12-N4-001", cat:"D12", level:"N4",
    q:"Quelle est la sanction pour un grand excès de vitesse (40 km/h et plus au-dessus de la limite) au Québec ?",
    choices:["Amende doublée seulement","Amende doublée + points d'inaptitude doublés","Amende de 380$ à 1 980$, points d'inaptitude doublés, saisie immédiate possible du véhicule","Retrait du permis automatique de 30 jours"],
    answer:2, ref:"CSR art. 303.2, 516",
    explain:"Un excès de 40+ km/h entraîne des amendes de 380$ à 1 980$, des points d'inaptitude doublés et la saisie possible du véhicule pour 30 jours (en zone de 60 km/h ou moins). Un excès de 50+ km/h est encore plus sévère.",
    trap:"Le candidat sous-estime la sévérité. Les grands excès de vitesse sont traités très sérieusement au Québec." },
  { id:"D12-N5-001", cat:"D12", level:"N5",
    q:"Un conducteur probatoire accumule 3 points d'inaptitude, puis commet une infraction valant 2 points supplémentaires. Que se passe-t-il ?",
    choices:["Il reçoit un avertissement à 4 points","Son permis est révoqué car il dépasse 4 points — il devra reprendre tout le processus (cours, examen)","Il perd son permis 30 jours puis le récupère","Il conserve son permis car la limite est de 8 points"],
    answer:1, ref:"CSR art. 185, 191.1",
    explain:"Avec 5 points (≥4), le permis probatoire est révoqué. Le conducteur doit attendre un délai, reprendre le cours de conduite et repasser les examens théorique et pratique.",
    trap:"Double piège : 1) Le seuil est 4 points, pas 8 (confusion avec permis régulier). 2) La révocation entraîne la reprise COMPLÈTE du processus, pas une simple suspension." },

  // ── QUESTIONS ADDITIONNELLES MULTI-CATÉGORIES ──
  { id:"D01-N5-001", cat:"D01", level:"N5",
    q:"Vous arrivez à une intersection où le feu vient de passer au vert. Un panneau indique « Virage à droite au feu rouge interdit ». Un piéton termine sa traversée. Un cycliste arrive par la piste cyclable à votre droite. Quelle action est correcte ?",
    choices:["Tourner à droite immédiatement — le feu est vert","Attendre le piéton, puis vérifier le cycliste, puis tourner","Le panneau ne s'applique pas au feu vert, tourner après le piéton","Attendre le prochain cycle de feux"],
    answer:1, ref:"CSR art. 349, 410, 487",
    explain:"Le feu vert autorise le mouvement, mais le piéton engagé a priorité absolue, et le cycliste sur la piste a aussi priorité. Il faut attendre les deux avant de tourner.",
    trap:"Le panneau sur le virage au feu rouge est un leurre — il ne concerne pas la situation au feu vert. Le candidat peut s'y accrocher et perdre le focus sur piéton + cycliste." },

  { id:"D06-N5-001", cat:"D06", level:"N5",
    q:"Vous conduisez sur une autoroute en hiver. Visibilité soudainement réduite à moins de 50m (poudrerie). Vos options :",
    choices:["Allumer les feux de détresse et continuer à vitesse réduite","Freiner immédiatement et vous arrêter sur la voie","Allumer les feux de croisement (pas les hautes), réduire fortement la vitesse, et chercher à quitter l'autoroute à la prochaine sortie","Allumer les feux de route pour mieux voir"],
    answer:2, ref:"Guide de la route SAAQ",
    explain:"En poudrerie : feux de croisement (les hautes éblouissent dans la neige), vitesse très réduite, quitter l'autoroute dès que possible. Ne jamais s'arrêter sur la voie.",
    trap:"1) Les feux de route aggravent l'éblouissement dans la neige. 2) S'arrêter sur la voie = risque de carambolage. 3) Les feux de détresse seuls ne suffisent pas." },

  { id:"D05-N4-001", cat:"D05", level:"N4",
    q:"Vous trouvez une place de stationnement en pente descendante sans trottoir. Comment positionner vos roues ?",
    choices:["Tourner les roues vers la droite (vers le fossé/accotement)","Tourner les roues vers la gauche","Les laisser droites avec le frein à main","Tourner les roues vers la droite ET vers la gauche alternativement"],
    answer:0, ref:"Guide de la route SAAQ",
    explain:"En descente SANS trottoir, les roues sont tournées vers la droite (vers l'accotement/fossé) pour que le véhicule se dirige hors de la route s'il roule.",
    trap:"Le candidat applique la règle « montée = vers la rue » sans ajuster pour l'absence de trottoir." },

  { id:"D07-N5-001", cat:"D07", level:"N5",
    q:"Un conducteur probatoire (0,00 obligatoire) souffle dans l'appareil de détection routière. Résultat : « WARN » (entre 0,05 et 0,08). Quelles sont TOUTES les conséquences ?",
    choices:["Suspension 24h seulement, comme un conducteur régulier","Suspension 90 jours + amende + inscription au dossier + possible révocation du permis probatoire","Accusation criminelle immédiate","Avertissement verbal et on le laisse partir"],
    answer:1, ref:"CSR art. 202.2, 202.4",
    explain:"Le conducteur probatoire à tolérance zéro s'expose à : suspension immédiate de 90 jours (vs 24h pour un régulier), amende, inscription au dossier. Si des points s'ajoutent et atteignent 4, révocation du probatoire.",
    trap:"Triple piège : 1) Le candidat applique la règle des conducteurs réguliers (24h). 2) La sanction est beaucoup plus sévère pour probatoire. 3) L'effet cumulatif avec les points d'inaptitude peut entraîner une révocation." },

  { id:"D09-N3-001", cat:"D09", level:"N3",
    q:"Vous traversez une zone de chantier de construction avec panneaux orange. La limite affichée est 50 km/h. Quand pouvez-vous reprendre votre vitesse normale ?",
    choices:["Dès que vous ne voyez plus de travailleurs","Dès que vous passez le panneau de fin de zone de chantier","Après 200 mètres sans activité visible","Dès que la route redevient normale"],
    answer:1, ref:"CSR art. 329.2",
    explain:"La limite de vitesse de chantier reste en vigueur jusqu'au panneau de fin de zone, même si aucun travailleur n'est visible. Les amendes sont doublées en zone de chantier." },

  { id:"D03-N5-001", cat:"D03", level:"N5",
    q:"Vous roulez à 100 km/h sur l'autoroute avec 2 secondes de suivi. Le véhicule devant freine d'urgence. Votre temps de réaction est d'environ 1,5 seconde. Pouvez-vous éviter la collision ?",
    choices:["Oui, il reste 0,5 seconde de marge","Non, il ne reste que 0,5 seconde pour freiner, ce qui est insuffisant à 100 km/h","Oui, si les freins ABS fonctionnent","Impossible à déterminer sans connaître le poids du véhicule"],
    answer:1, ref:"Guide de la route SAAQ, données physiques de freinage",
    explain:"À 100 km/h, la distance de freinage est d'environ 70m sur route sèche. En 0,5s résiduelle, on ne parcourt que ~14m de freinage. Insuffisant. C'est pourquoi 2 secondes est le MINIMUM — 3-4 secondes sont plus sûres sur autoroute.",
    trap:"Le candidat croit que 2 secondes suffisent toujours. Le calcul physique montre le contraire en conditions d'urgence." },

  { id:"D02-N2-002", cat:"D02", level:"N2",
    q:"Vous arrivez à une intersection avec un panneau CÉDEZ LE PASSAGE. Devez-vous vous arrêter ?",
    choices:["Oui, toujours","Non, jamais","Seulement si un véhicule ou un piéton se présente","Seulement aux heures de pointe"],
    answer:2, ref:"CSR art. 371",
    explain:"Le panneau CÉDEZ oblige à ralentir et à céder le passage. L'arrêt complet n'est nécessaire que si un usager se présente." },

  { id:"D04-N5-001", cat:"D04", level:"N5",
    q:"Sur une route à 3 voies dans votre direction, vous êtes dans la voie du centre. Le véhicule à votre droite et celui à votre gauche tentent simultanément de se rabattre dans votre voie. Quelle est la règle ?",
    choices:["Priorité au véhicule de droite","Priorité au véhicule de gauche","Aucun n'a priorité — les deux doivent s'assurer que la voie est libre avant de changer","Vous devez accélérer ou freiner pour dégager la voie"],
    answer:2, ref:"CSR art. 346",
    explain:"Les deux véhicules effectuent un changement de voie. Aucun n'a priorité sur l'autre ni sur vous. C'est celui qui change de voie qui doit s'assurer que la manœuvre est sécuritaire. Vous occupez la voie — vous avez priorité sur les deux.",
    trap:"Le candidat applique la priorité à droite (qui concerne les intersections, pas les changements de voie)." },

  { id:"D11-N4-001", cat:"D11", level:"N4",
    q:"Votre véhicule est équipé de freins ABS. En situation de freinage d'urgence, que devez-vous faire ?",
    choices:["Pomper les freins rapidement","Appuyer fermement et maintenir la pression sans relâcher","Appuyer légèrement pour éviter le blocage","Utiliser le frein à main en complément"],
    answer:1, ref:"Guide de la route SAAQ",
    explain:"Avec l'ABS, il faut appuyer fort et MAINTENIR la pression. L'ABS empêche le blocage des roues automatiquement. Pomper annule l'effet de l'ABS.",
    trap:"Le candidat applique l'ancienne technique (pomper les freins) qui était valide SANS ABS." },
];

// ═══════════════════════════════════════════════════════════
// STORAGE HELPER
// ═══════════════════════════════════════════════════════════

async function storageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function storageSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { console.error("Storage error:", e); }
}

// ═══════════════════════════════════════════════════════════
// SVG INTERSECTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function IntersectionScene({ type = "cross", vehicles = [], signals = [], weather = null }) {
  const W = 280, H = 200;
  const roadW = 44;
  const cx = W / 2, cy = H / 2;

  const roadColor = weather === "snow" ? "#94a3b8" : weather === "rain" ? "#64748b" : "#475569";
  const lineColor = "#fbbf24";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto" style={{background:"#1e293b",borderRadius:8}}>
      {/* Grass/ground */}
      <rect width={W} height={H} fill="#1a3a2a" />

      {/* Roads */}
      {(type === "cross" || type === "t") && <>
        <rect x={0} y={cy - roadW/2} width={W} height={roadW} fill={roadColor} />
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={lineColor} strokeWidth={1} strokeDasharray="8,6" />
      </>}
      {type === "cross" && <>
        <rect x={cx - roadW/2} y={0} width={roadW} height={H} fill={roadColor} />
        <line x1={cx} y1={0} x2={cx} y2={cy - roadW/2} stroke={lineColor} strokeWidth={1} strokeDasharray="8,6" />
        <line x1={cx} y1={cy + roadW/2} x2={cx} y2={H} stroke={lineColor} strokeWidth={1} strokeDasharray="8,6" />
      </>}
      {type === "t" && <>
        <rect x={cx - roadW/2} y={cy - roadW/2} width={roadW} height={H/2 + roadW/2} fill={roadColor} />
        <line x1={cx} y1={cy + roadW/2} x2={cx} y2={H} stroke={lineColor} strokeWidth={1} strokeDasharray="8,6" />
      </>}
      {type === "roundabout" && <>
        <rect x={0} y={cy - roadW/2} width={W} height={roadW} fill={roadColor} />
        <rect x={cx - roadW/2} y={0} width={roadW} height={H} fill={roadColor} />
        <circle cx={cx} cy={cy} r={36} fill={roadColor} />
        <circle cx={cx} cy={cy} r={18} fill="#1a3a2a" />
      </>}

      {/* Intersection box */}
      <rect x={cx - roadW/2} y={cy - roadW/2} width={roadW} height={roadW} fill={roadColor} />

      {/* Weather overlay */}
      {weather === "rain" && Array.from({length:20}).map((_,i) =>
        <line key={i} x1={20+i*13} y1={Math.random()*30} x2={17+i*13} y2={20+Math.random()*30} stroke="#60a5fa" strokeWidth={1} opacity={0.4} />
      )}
      {weather === "snow" && Array.from({length:15}).map((_,i) =>
        <circle key={i} cx={10+i*19} cy={10+Math.random()*180} r={2} fill="white" opacity={0.5} />
      )}

      {/* Vehicles */}
      {vehicles.map((v, i) => (
        <g key={i} transform={`translate(${v.x},${v.y}) rotate(${v.rot || 0})`}>
          <rect x={-7} y={-4} width={14} height={8} rx={2} fill={v.color || "#3b82f6"} />
          {v.label && <text x={0} y={-7} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">{v.label}</text>}
          {v.arrow && <polygon points="8,-3 14,0 8,3" fill={v.color || "#3b82f6"} />}
        </g>
      ))}

      {/* Signals */}
      {signals.map((s, i) => (
        <g key={i}>
          {s.type === "stop" && <>
            <polygon points={`${s.x},${s.y-8} ${s.x+6},${s.y-4} ${s.x+6},${s.y+4} ${s.x},${s.y+8} ${s.x-6},${s.y+4} ${s.x-6},${s.y-4}`} fill="#dc2626" />
            <text x={s.x} y={s.y+2} textAnchor="middle" fontSize={5} fill="white" fontWeight="bold">ARRÊT</text>
          </>}
          {s.type === "light" && <>
            <rect x={s.x-4} y={s.y-10} width={8} height={20} rx={2} fill="#1e1e1e" />
            <circle cx={s.x} cy={s.y-6} r={2.5} fill={s.state === "red" ? "#ef4444" : "#4a4a4a"} />
            <circle cx={s.x} cy={s.y} r={2.5} fill={s.state === "yellow" ? "#fbbf24" : "#4a4a4a"} />
            <circle cx={s.x} cy={s.y+6} r={2.5} fill={s.state === "green" ? "#22c55e" : "#4a4a4a"} />
          </>}
          {s.type === "yield" && <>
            <polygon points={`${s.x},${s.y+7} ${s.x-6},${s.y-5} ${s.x+6},${s.y-5}`} fill="white" stroke="#dc2626" strokeWidth={1.5} />
          </>}
          {s.type === "pedestrian" && <>
            <circle cx={s.x} cy={s.y-2} r={2} fill="white" />
            <line x1={s.x} y1={s.y} x2={s.x} y2={s.y+6} stroke="white" strokeWidth={1.5} />
            <line x1={s.x-3} y1={s.y+3} x2={s.x+3} y2={s.y+3} stroke="white" strokeWidth={1.5} />
            <line x1={s.x} y1={s.y+6} x2={s.x-2} y2={s.y+10} stroke="white" strokeWidth={1.5} />
            <line x1={s.x} y1={s.y+6} x2={s.x+2} y2={s.y+10} stroke="white" strokeWidth={1.5} />
          </>}
        </g>
      ))}
    </svg>
  );
}

// Scene configs for specific questions
const SCENES = {
  "D02-N3-001": { type: "cross",
    vehicles: [{x:100,y:100,rot:0,color:"#3b82f6",label:"Vous",arrow:true},{x:180,y:88,rot:180,color:"#ef4444",label:"→",arrow:true}],
    signals: [{type:"light",x:118,y:72,state:"green"},{type:"light",x:162,y:128,state:"green"}] },
  "D02-N3-002": { type: "roundabout",
    vehicles: [{x:140,y:165,rot:270,color:"#3b82f6",label:"Vous"},{x:110,y:82,rot:90,color:"#22c55e",arrow:true}],
    signals: [{type:"yield",x:130,y:150}] },
  "D02-N5-001": { type: "cross",
    vehicles: [{x:100,y:112,rot:0,color:"#3b82f6",label:"Vous"},{x:190,y:88,rot:180,color:"#ef4444",label:"🚑",arrow:true}],
    signals: [{type:"light",x:118,y:72,state:"green"},{type:"pedestrian",x:160,y:108}] },
  "D10-N3-001": { type: "cross",
    vehicles: [{x:100,y:110,rot:0,color:"#3b82f6",label:"Vous"},{x:150,y:85,rot:270,color:"#22c55e",label:"🚲",arrow:true}],
    signals: [{type:"light",x:118,y:72,state:"green"}] },
};

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(count, filters = {}) {
  let pool = [...QUESTIONS];
  if (filters.cats) pool = pool.filter(q => filters.cats.includes(q.cat));
  if (filters.levels) pool = pool.filter(q => filters.levels.includes(q.level));
  if (filters.exclude) pool = pool.filter(q => !filters.exclude.includes(q.id));
  return shuffle(pool).slice(0, count);
}

function generateExam() {
  // 30 questions calqué sur format SAAQ réel
  const dist = { N1: 6, N2: 8, N3: 8, N4: 5, N5: 3 };
  let exam = [];
  for (const [level, count] of Object.entries(dist)) {
    const avail = QUESTIONS.filter(q => q.level === level);
    exam.push(...shuffle(avail).slice(0, count));
  }
  return shuffle(exam).slice(0, 30);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const today = () => new Date().toISOString().split('T')[0];

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [screen, setScreen] = useState("home");
  const [srsData, setSrsData] = useState({});
  const [sessions, setSessions] = useState([]);
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [diagnosticDone, setDiagnosticDone] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted data
  useEffect(() => {
    (async () => {
      const [srs, sess, str, diag] = await Promise.all([
        storageGet(STORAGE_KEYS.SRS),
        storageGet(STORAGE_KEYS.SESSIONS),
        storageGet(STORAGE_KEYS.STREAK),
        storageGet(STORAGE_KEYS.DIAGNOSTIC),
      ]);
      if (srs) setSrsData(srs);
      if (sess) setSessions(sess);
      if (str) setStreak(str);
      if (diag) { setDiagnosticDone(true); setDiagnosticResult(diag); }
      setLoading(false);
    })();
  }, []);

  // Update streak
  const updateStreak = useCallback(async () => {
    const d = today();
    setStreak(prev => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      let newStreak;
      if (prev.lastDate === d) newStreak = prev;
      else if (prev.lastDate === yesterday) newStreak = { count: prev.count + 1, lastDate: d };
      else newStreak = { count: 1, lastDate: d };
      storageSet(STORAGE_KEYS.STREAK, newStreak);
      return newStreak;
    });
  }, []);

  // Save session result
  const saveSession = useCallback(async (result) => {
    const newSessions = [...sessions, { ...result, date: new Date().toISOString() }];
    setSessions(newSessions);
    await storageSet(STORAGE_KEYS.SESSIONS, newSessions);
    await updateStreak();
  }, [sessions, updateStreak]);

  // Update SRS data
  const updateSRS = useCallback(async (questionId, correct) => {
    setSrsData(prev => {
      const entry = prev[questionId] || { box: 1, lastSeen: null, attempts: 0, correct: 0 };
      const newEntry = {
        ...entry,
        box: correct ? Math.min(entry.box + 1, 4) : 1,
        lastSeen: new Date().toISOString(),
        attempts: entry.attempts + 1,
        correct: entry.correct + (correct ? 1 : 0),
      };
      const newData = { ...prev, [questionId]: newEntry };
      storageSet(STORAGE_KEYS.SRS, newData);
      return newData;
    });
  }, []);

  const saveDiagnostic = useCallback(async (result) => {
    setDiagnosticDone(true);
    setDiagnosticResult(result);
    await storageSet(STORAGE_KEYS.DIAGNOSTIC, result);
  }, []);

  const resetAll = useCallback(async () => {
    for (const key of Object.values(STORAGE_KEYS)) {
      try { localStorage.removeItem(key); } catch {}
    }
    setSrsData({});
    setSessions([]);
    setStreak({ count: 0, lastDate: null });
    setDiagnosticDone(false);
    setDiagnosticResult(null);
    setScreen("home");
  }, []);

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f172a",color:"white",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🚗</div>
        <div style={{fontSize:18,opacity:0.7}}>Chargement...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0f172a",color:"#e2e8f0",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; border: none; font-family: inherit; }
        .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
        .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .btn-primary { background: #0ea5e9; color: white; }
        .btn-primary:hover { background: #0284c7; transform: translateY(-1px); }
        .btn-secondary { background: #334155; color: #e2e8f0; }
        .btn-secondary:hover { background: #475569; }
        .btn-danger { background: #dc2626; color: white; }
        .btn-danger:hover { background: #b91c1c; }
        .btn-success { background: #16a34a; color: white; }
        .btn-success:hover { background: #15803d; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 50px; font-size: 11px; font-weight: 600; }
        .progress-bar { height: 6px; background: #334155; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .confidence-btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; border: 2px solid transparent; transition: all 0.2s; }
        .confidence-btn:hover { transform: scale(1.05); }
        .choice-btn { width: 100%; text-align: left; padding: 14px 18px; border-radius: 10px; background: #1e293b; border: 2px solid #334155; color: #e2e8f0; font-size: 14px; line-height: 1.5; transition: all 0.15s; margin-bottom: 8px; }
        .choice-btn:hover:not(:disabled) { border-color: #0ea5e9; background: #0f2a3d; }
        .choice-btn.correct { border-color: #22c55e; background: #0a2e1a; }
        .choice-btn.incorrect { border-color: #ef4444; background: #2e0a0a; }
        .choice-btn.was-correct { border-color: #22c55e; background: #0a2e1a; opacity: 0.7; }
        .nav-btn { padding: 8px 14px; border-radius: 6px; font-size: 13px; background: transparent; color: #94a3b8; font-weight: 500; }
        .nav-btn:hover { color: white; background: #1e293b; }
        .nav-btn.active { color: #0ea5e9; background: #0c2a3d; }
      `}</style>

      {/* NAVIGATION */}
      <nav style={{background:"#0f172a",borderBottom:"1px solid #1e293b",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:22}}>🚗</span>
          <span style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:16,color:"#0ea5e9"}}>SAAQ</span>
          <span style={{fontSize:12,color:"#64748b",fontWeight:500}}>PREP B++</span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[
            ["home","Accueil"],["diagnostic","Diagnostic"],["practice","Pratique"],
            ["exam","Examen"],["review","Révision"],["dashboard","Stats"]
          ].map(([s,label]) => (
            <button key={s} className={`nav-btn ${screen===s?"active":""}`} onClick={()=>setScreen(s)}>{label}</button>
          ))}
        </div>
        {streak.count > 0 && streak.lastDate && (
          new Date(streak.lastDate).toISOString().split('T')[0] >= new Date(Date.now()-86400000).toISOString().split('T')[0]
        ) && (
          <div style={{fontSize:13,color:"#f59e0b"}}>🔥 {streak.count}j</div>
        )}
      </nav>

      {/* CONTENT */}
      <div style={{maxWidth:720,margin:"0 auto",padding:"20px 16px 40px"}}>
        {screen === "home" && <HomeScreen onNav={setScreen} diagnosticDone={diagnosticDone} diagnosticResult={diagnosticResult} sessions={sessions} srsData={srsData} streak={streak} />}
        {screen === "diagnostic" && <DiagnosticScreen onComplete={saveDiagnostic} onNav={setScreen} done={diagnosticDone} result={diagnosticResult} />}
        {screen === "practice" && <PracticeScreen updateSRS={updateSRS} srsData={srsData} saveSession={saveSession} diagnosticResult={diagnosticResult} />}
        {screen === "exam" && <ExamScreen saveSession={saveSession} updateSRS={updateSRS} onNav={setScreen} />}
        {screen === "review" && <ReviewScreen srsData={srsData} updateSRS={updateSRS} />}
        {screen === "dashboard" && <DashboardScreen sessions={sessions} srsData={srsData} streak={streak} onReset={resetAll} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════

function HomeScreen({ onNav, diagnosticDone, diagnosticResult, sessions, srsData, streak }) {
  const totalQ = QUESTIONS.length;
  const seen = Object.keys(srsData).length;
  const mastered = Object.values(srsData).filter(e => e.box >= 3).length;
  const lastScore = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const examSessions = sessions.filter(s => s.mode === "exam");
  const avgExam = examSessions.length > 0 ? Math.round(examSessions.reduce((a,s) => a + s.score, 0) / examSessions.length) : null;

  const readyForExam = avgExam !== null && avgExam >= 85 && examSessions.length >= 3;

  return (
    <div className="fade-in">
      <div style={{textAlign:"center",marginBottom:32}}>
        <h1 style={{fontFamily:"'Space Mono',monospace",fontSize:28,color:"white",marginBottom:8}}>
          Prépare ton examen<br/><span style={{color:"#0ea5e9"}}>SAAQ</span>
        </h1>
        <p style={{color:"#94a3b8",fontSize:14,maxWidth:480,margin:"0 auto"}}>
          Outil gratuit de préparation à l'examen théorique du permis de conduire classe 5 — Québec.
          Basé sur les sciences cognitives pour maximiser ta rétention.
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        {[
          {label:"Questions vues",val:`${seen}/${totalQ}`,color:"#0ea5e9"},
          {label:"Maîtrisées",val:`${mastered}`,color:"#22c55e"},
          {label:"Sessions",val:`${sessions.length}`,color:"#f59e0b"},
          {label:"Série",val:`${streak.count}j 🔥`,color:"#ef4444"},
        ].map((s,i) => (
          <div key={i} className="card" style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Readiness indicator */}
      {readyForExam ? (
        <div className="card" style={{background:"#052e16",border:"1px solid #16a34a",marginBottom:24,textAlign:"center"}}>
          <div style={{fontSize:24}}>✅</div>
          <div style={{fontWeight:700,color:"#22c55e",marginTop:8}}>Prêt pour l'examen SAAQ</div>
          <div style={{fontSize:12,color:"#86efac",marginTop:4}}>Score moyen ≥85% sur {examSessions.length} simulations</div>
        </div>
      ) : avgExam !== null ? (
        <div className="card" style={{background:"#1c1917",border:"1px solid #f59e0b",marginBottom:24,textAlign:"center"}}>
          <div style={{fontSize:24}}>📊</div>
          <div style={{fontWeight:600,color:"#f59e0b",marginTop:8}}>Score moyen : {avgExam}%</div>
          <div style={{fontSize:12,color:"#fcd34d",marginTop:4}}>Objectif : ≥85% sur 3 simulations d'examen</div>
        </div>
      ) : null}

      {/* Action buttons */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {!diagnosticDone && (
          <button className="btn btn-primary" style={{width:"100%",padding:16,fontSize:16}} onClick={()=>onNav("diagnostic")}>
            🎯 Commencer le diagnostic (5 min)
          </button>
        )}
        <button className="btn btn-primary" style={{width:"100%",padding:16,fontSize:16}} onClick={()=>onNav("practice")}>
          📚 Pratique adaptative
        </button>
        <button className="btn" style={{width:"100%",padding:16,fontSize:16,background:"#7c3aed",color:"white"}} onClick={()=>onNav("exam")}>
          🏁 Simulation d'examen (30 questions / 60 min)
        </button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button className="btn btn-secondary" style={{width:"100%"}} onClick={()=>onNav("review")}>
            🔄 Révision SRS
          </button>
          <button className="btn btn-secondary" style={{width:"100%"}} onClick={()=>onNav("dashboard")}>
            📊 Tableau de bord
          </button>
        </div>
      </div>

      <div style={{marginTop:32,textAlign:"center",fontSize:11,color:"#475569"}}>
        Projet communautaire gratuit — Basé sur le Code de la sécurité routière du Québec<br/>
        Les questions sont fournies à titre de préparation. Consultez le Guide de la route officiel de la SAAQ.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DIAGNOSTIC SCREEN
// ═══════════════════════════════════════════════════════════

function DiagnosticScreen({ onComplete, onNav, done, result }) {
  const [questions] = useState(() => {
    const qs = [];
    const topCats = ["D01","D02","D03","D06","D10"];
    for (const level of ["N1","N2","N3"]) {
      for (const cat of topCats) {
        const available = QUESTIONS.filter(q => q.cat === cat && q.level === level);
        if (available.length > 0) qs.push(shuffle(available)[0]);
      }
    }
    return shuffle(qs).slice(0, 15);
  });
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  if (done && result) {
    return (
      <div className="fade-in">
        <h2 style={{fontSize:22,fontWeight:700,color:"white",marginBottom:16}}>🎯 Résultat du diagnostic</h2>
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontSize:36,fontWeight:700,color: result.score >= 70 ? "#22c55e" : result.score >= 50 ? "#f59e0b" : "#ef4444",textAlign:"center"}}>
            {result.score}%
          </div>
          <div style={{textAlign:"center",color:"#94a3b8",fontSize:13,marginTop:8}}>
            {result.correct}/{result.total} bonnes réponses
          </div>
        </div>
        <div className="card" style={{marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:600,marginBottom:12,color:"#94a3b8"}}>Par catégorie :</h3>
          {Object.entries(result.byCategory).map(([cat, data]) => (
            <div key={cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:14}}>{CATEGORIES[cat]?.icon}</span>
              <span style={{fontSize:12,color:"#94a3b8",minWidth:100}}>{CATEGORIES[cat]?.name}</span>
              <div className="progress-bar" style={{flex:1}}>
                <div className="progress-fill" style={{width:`${data.pct}%`,background: data.pct >= 70 ? "#22c55e" : data.pct >= 50 ? "#f59e0b" : "#ef4444"}} />
              </div>
              <span style={{fontSize:12,fontWeight:600,minWidth:35,textAlign:"right",color: data.pct >= 70 ? "#22c55e" : "#ef4444"}}>{data.pct}%</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={()=>onNav("practice")}>Commencer la pratique</button>
          <button className="btn btn-secondary" style={{flex:1}} onClick={()=>onNav("home")}>Accueil</button>
        </div>
      </div>
    );
  }

  if (idx >= questions.length) {
    const correct = answers.filter(a => a.correct).length;
    const byCategory = {};
    answers.forEach(a => {
      if (!byCategory[a.cat]) byCategory[a.cat] = { correct: 0, total: 0 };
      byCategory[a.cat].total++;
      if (a.correct) byCategory[a.cat].correct++;
    });
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].pct = Math.round(byCategory[cat].correct / byCategory[cat].total * 100);
    }
    const r = { score: Math.round(correct / questions.length * 100), correct, total: questions.length, byCategory };
    setTimeout(() => onComplete(r), 0);
    return null;
  }

  const q = questions[idx];
  const handleAnswer = (choiceIdx) => {
    setSelected(choiceIdx);
    const correct = choiceIdx === q.answer;
    setTimeout(() => {
      setAnswers(prev => [...prev, { id: q.id, cat: q.cat, level: q.level, correct }]);
      setSelected(null);
      setIdx(prev => prev + 1);
    }, 600);
  };

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"white"}}>🎯 Diagnostic</h2>
        <span style={{fontSize:13,color:"#94a3b8"}}>{idx + 1}/{questions.length}</span>
      </div>
      <div className="progress-bar" style={{marginBottom:20}}>
        <div className="progress-fill" style={{width:`${(idx/questions.length)*100}%`,background:"#0ea5e9"}} />
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <span className="badge" style={{background:LEVELS[q.level].color+"22",color:LEVELS[q.level].color}}>{LEVELS[q.level].name}</span>
          <span className="badge" style={{background:"#334155",color:"#94a3b8"}}>{CATEGORIES[q.cat].icon} {CATEGORIES[q.cat].name}</span>
        </div>
        <p style={{fontSize:15,lineHeight:1.6,color:"white"}}>{q.q}</p>
      </div>
      {q.choices.map((c, i) => (
        <button key={i} disabled={selected !== null}
          className={`choice-btn ${selected === i ? (i === q.answer ? "correct" : "incorrect") : selected !== null && i === q.answer ? "was-correct" : ""}`}
          onClick={() => handleAnswer(i)}>
          <span style={{fontWeight:600,marginRight:10,color:"#64748b"}}>{String.fromCharCode(65+i)}</span>{c}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRACTICE SCREEN (Adaptive)
// ═══════════════════════════════════════════════════════════

function PracticeScreen({ updateSRS, srsData, saveSession, diagnosticResult }) {
  const [difficulty, setDifficulty] = useState(() => {
    if (diagnosticResult) {
      if (diagnosticResult.score >= 80) return 3;
      if (diagnosticResult.score >= 50) return 2;
      return 1;
    }
    return 2;
  });
  const [questions, setQuestions] = useState(() => generatePracticeSet(2, srsData));
  const [idx, setIdx] = useState(0);
  const [confidence, setConfidence] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showExplain, setShowExplain] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  function generatePracticeSet(diff, srs) {
    const levelMap = { 1: ["N1","N2"], 2: ["N2","N3"], 3: ["N3","N4"], 4: ["N4","N5"], 5: ["N5"] };
    const clamped = Math.max(1, Math.min(5, Math.round(diff)));
    const levels = levelMap[clamped] || ["N2","N3"];
    // Also include some below and above
    const allLevels = [...new Set([...levels])];
    let pool = QUESTIONS.filter(q => allLevels.some(l => q.level === l));
    // Prioritize unseen or weak SRS
    pool.sort((a, b) => {
      const sa = srs[a.id]; const sb = srs[b.id];
      const wa = sa ? sa.box : 0; const wb = sb ? sb.box : 0;
      return wa - wb;
    });
    return pool.slice(0, 15);
  }

  if (finished) {
    const correct = sessionAnswers.filter(a => a.correct).length;
    const score = Math.round(correct / sessionAnswers.length * 100);
    const overconfident = sessionAnswers.filter(a => a.confidence === 3 && !a.correct).length;
    const underconfident = sessionAnswers.filter(a => a.confidence === 1 && a.correct).length;

    return (
      <div className="fade-in">
        <h2 style={{fontSize:22,fontWeight:700,color:"white",marginBottom:16}}>📚 Résultat de la session</h2>
        <div className="card" style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:48,fontWeight:700,color: score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"}}>
            {score}%
          </div>
          <div style={{color:"#94a3b8",marginTop:8}}>{correct}/{sessionAnswers.length} bonnes réponses</div>
        </div>

        {overconfident > 0 && (
          <div className="card" style={{background:"#2e0a0a",border:"1px solid #ef4444",marginBottom:12}}>
            <div style={{fontSize:13,color:"#fca5a5"}}>
              ⚠️ <strong>Surconfiance détectée :</strong> Tu étais « sûr » sur {overconfident} question(s) que tu as ratée(s). C'est le signal #1 d'échec à l'examen.
            </div>
          </div>
        )}
        {underconfident > 1 && (
          <div className="card" style={{background:"#052e16",border:"1px solid #22c55e",marginBottom:12}}>
            <div style={{fontSize:13,color:"#86efac"}}>
              💡 Tu savais plus que tu ne le croyais ! {underconfident} réponse(s) correcte(s) malgré un doute.
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-primary" style={{flex:1}} onClick={() => {
            setQuestions(generatePracticeSet(difficulty, srsData));
            setIdx(0); setSessionAnswers([]); setFinished(false); setConfidence(null); setSelected(null); setShowExplain(false);
          }}>Nouvelle session</button>
          <button className="btn btn-secondary" style={{flex:1}} onClick={() => window.scrollTo(0,0)}>Revoir les erreurs</button>
        </div>

        {/* Error review */}
        <div style={{marginTop:24}}>
          {sessionAnswers.filter(a=>!a.correct).map((a,i) => {
            const q = QUESTIONS.find(qq=>qq.id===a.id);
            if(!q) return null;
            return (
              <div key={i} className="card" style={{marginBottom:10,borderLeft:`3px solid #ef4444`}}>
                <div style={{fontSize:13,color:"#94a3b8",marginBottom:4}}>{q.id}</div>
                <div style={{fontSize:14,color:"white",marginBottom:8}}>{q.q}</div>
                <div style={{fontSize:13,color:"#22c55e"}}>✅ {q.choices[q.answer]}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:8}}>{q.explain}</div>
                {q.ref && <div style={{fontSize:11,color:"#64748b",marginTop:4}}>📖 {q.ref}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (idx >= questions.length) {
    const correct = sessionAnswers.filter(a => a.correct).length;
    saveSession({ mode: "practice", score: Math.round(correct / sessionAnswers.length * 100), correct, total: sessionAnswers.length, answers: sessionAnswers });
    setFinished(true);
    return null;
  }

  const q = questions[idx];
  const scene = SCENES[q.id];

  const handleAnswer = (choiceIdx) => {
    if (confidence === null) return;
    setSelected(choiceIdx);
    const correct = choiceIdx === q.answer;

    // Adaptive difficulty
    if (correct && confidence === 3) setDifficulty(d => Math.min(5, d + 0.5));
    else if (correct && confidence === 1) setDifficulty(d => Math.min(5, d + 0.25));
    else if (!correct && confidence === 3) setDifficulty(d => Math.max(1, d - 0.5));
    else if (!correct) setDifficulty(d => Math.max(1, d - 0.25));

    updateSRS(q.id, correct);
    setSessionAnswers(prev => [...prev, { id: q.id, cat: q.cat, level: q.level, correct, confidence, chosen: choiceIdx }]);
    setShowExplain(true);
  };

  const nextQuestion = () => {
    setSelected(null); setConfidence(null); setShowExplain(false);
    setIdx(prev => prev + 1);
  };

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"white"}}>📚 Pratique adaptative</h2>
        <span style={{fontSize:13,color:"#94a3b8"}}>{idx + 1}/{questions.length}</span>
      </div>
      <div className="progress-bar" style={{marginBottom:16}}>
        <div className="progress-fill" style={{width:`${(idx/questions.length)*100}%`,background:"#0ea5e9"}} />
      </div>

      {/* Question */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <span className="badge" style={{background:LEVELS[q.level].color+"22",color:LEVELS[q.level].color}}>{LEVELS[q.level].name}</span>
          <span className="badge" style={{background:"#334155",color:"#94a3b8"}}>{CATEGORIES[q.cat].icon} {CATEGORIES[q.cat].name}</span>
        </div>
        <p style={{fontSize:15,lineHeight:1.6,color:"white"}}>{q.q}</p>
        {scene && <div style={{marginTop:12}}><IntersectionScene {...scene} /></div>}
      </div>

      {/* Confidence gauge */}
      {!showExplain && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>Ton niveau de confiance :</div>
          <div style={{display:"flex",gap:8}}>
            {[
              {val:1,label:"🔴 Je devine",bg:"#dc262633",border:"#dc2626"},
              {val:2,label:"🟡 Je pense que",bg:"#f59e0b33",border:"#f59e0b"},
              {val:3,label:"🟢 Je suis sûr",bg:"#22c55e33",border:"#22c55e"},
            ].map(c => (
              <button key={c.val} className="confidence-btn"
                style={{background: confidence === c.val ? c.bg : "transparent", borderColor: confidence === c.val ? c.border : "#334155", color: confidence === c.val ? c.border : "#94a3b8", flex:1, fontSize:12}}
                onClick={() => setConfidence(c.val)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Choices */}
      {q.choices.map((c, i) => (
        <button key={i}
          disabled={selected !== null || confidence === null}
          className={`choice-btn ${selected === i ? (i === q.answer ? "correct" : "incorrect") : showExplain && i === q.answer ? "was-correct" : ""}`}
          style={{opacity: confidence === null && selected === null ? 0.5 : 1}}
          onClick={() => handleAnswer(i)}>
          <span style={{fontWeight:600,marginRight:10,color:"#64748b"}}>{String.fromCharCode(65+i)}</span>{c}
        </button>
      ))}

      {confidence === null && !showExplain && (
        <div style={{textAlign:"center",fontSize:12,color:"#64748b",marginTop:8}}>
          ↑ Indique ton niveau de confiance avant de répondre
        </div>
      )}

      {/* Explanation */}
      {showExplain && (
        <div className="card fade-in" style={{marginTop:16,borderLeft:`3px solid ${selected === q.answer ? "#22c55e" : "#ef4444"}`}}>
          <div style={{fontSize:14,fontWeight:600,color: selected === q.answer ? "#22c55e" : "#ef4444",marginBottom:8}}>
            {selected === q.answer ? "✅ Correct !" : "❌ Incorrect"}
          </div>
          <div style={{fontSize:13,color:"#e2e8f0",lineHeight:1.6}}>{q.explain}</div>
          {q.trap && (
            <div style={{marginTop:10,padding:10,background:"#1e1b2e",borderRadius:8,border:"1px solid #7c3aed44"}}>
              <div style={{fontSize:12,color:"#a78bfa",fontWeight:600}}>🧠 Piège cognitif :</div>
              <div style={{fontSize:12,color:"#c4b5fd",marginTop:4}}>{q.trap}</div>
            </div>
          )}
          {q.ref && <div style={{fontSize:11,color:"#64748b",marginTop:8}}>📖 {q.ref}</div>}
          <button className="btn btn-primary" style={{width:"100%",marginTop:12}} onClick={nextQuestion}>
            Question suivante →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EXAM SCREEN
// ═══════════════════════════════════════════════════════════

function ExamScreen({ saveSession, updateSRS, onNav }) {
  const [started, setStarted] = useState(false);
  const [questions] = useState(() => generateExam());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(3600);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setFinished(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [started, finished]);

  const finishExam = useCallback(() => {
    clearInterval(timerRef.current);
    setFinished(true);
    const results = questions.map((q, i) => {
      const chosen = answers[i];
      const correct = chosen === q.answer;
      if (chosen !== undefined) updateSRS(q.id, correct);
      return { id: q.id, cat: q.cat, level: q.level, correct, chosen };
    });
    const correctCount = results.filter(r => r.correct).length;
    saveSession({
      mode: "exam",
      score: Math.round(correctCount / questions.length * 100),
      correct: correctCount,
      total: questions.length,
      answers: results,
      timeUsed: 3600 - timeLeft,
    });
  }, [answers, questions, timeLeft, saveSession, updateSRS]);

  if (!started) {
    return (
      <div className="fade-in" style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🏁</div>
        <h2 style={{fontSize:24,fontWeight:700,color:"white",marginBottom:12}}>Simulation d'examen SAAQ</h2>
        <div className="card" style={{textAlign:"left",marginBottom:24}}>
          <div style={{fontSize:14,color:"#94a3b8",lineHeight:1.8}}>
            <strong style={{color:"white"}}>Format :</strong> 30 questions à choix multiples<br/>
            <strong style={{color:"white"}}>Durée :</strong> 60 minutes<br/>
            <strong style={{color:"white"}}>Passage :</strong> ≥22 bonnes réponses (73%)<br/>
            <strong style={{color:"white"}}>Maîtrise :</strong> ≥27 bonnes réponses (90%)<br/>
            <strong style={{color:"white"}}>Navigation :</strong> Libre — tu peux revenir sur tes réponses<br/>
            <strong style={{color:"white"}}>Feedback :</strong> À la fin seulement (comme à la SAAQ)
          </div>
        </div>
        <button className="btn" style={{background:"#7c3aed",color:"white",width:"100%",padding:16,fontSize:16}} onClick={() => setStarted(true)}>
          Démarrer l'examen →
        </button>
      </div>
    );
  }

  if (finished) {
    const results = questions.map((q, i) => {
      const chosen = answers[i];
      return { ...q, chosen, correct: chosen === q.answer };
    });
    const correctCount = results.filter(r => r.correct).length;
    const score = Math.round(correctCount / questions.length * 100);
    const passed = correctCount >= 22;

    const byCat = {};
    results.forEach(r => {
      if (!byCat[r.cat]) byCat[r.cat] = { correct: 0, total: 0 };
      byCat[r.cat].total++;
      if (r.correct) byCat[r.cat].correct++;
    });

    return (
      <div className="fade-in">
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:64,marginBottom:8}}>{passed ? "🎉" : "📖"}</div>
          <div style={{fontSize:48,fontWeight:700,color: passed ? "#22c55e" : "#ef4444",fontFamily:"'Space Mono',monospace"}}>
            {correctCount}/30
          </div>
          <div style={{fontSize:22,fontWeight:600,color: passed ? "#22c55e" : "#ef4444",marginTop:4}}>
            {passed ? (score >= 90 ? "MAÎTRISE !" : "RÉUSSI !") : "À RETRAVAILLER"}
          </div>
          <div style={{color:"#94a3b8",marginTop:8,fontSize:13}}>
            Score : {score}% — Temps : {formatTime(3600 - timeLeft)}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card" style={{marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:12}}>Par catégorie</h3>
          {Object.entries(byCat).sort((a,b) => (a[1].correct/a[1].total) - (b[1].correct/b[1].total)).map(([cat, data]) => {
            const pct = Math.round(data.correct / data.total * 100);
            return (
              <div key={cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span>{CATEGORIES[cat]?.icon}</span>
                <span style={{fontSize:12,color:"#94a3b8",minWidth:110}}>{CATEGORIES[cat]?.name}</span>
                <div className="progress-bar" style={{flex:1}}>
                  <div className="progress-fill" style={{width:`${pct}%`,background: pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444"}} />
                </div>
                <span style={{fontSize:12,fontWeight:600,color: pct >= 70 ? "#22c55e" : "#ef4444"}}>{data.correct}/{data.total}</span>
              </div>
            );
          })}
        </div>

        {/* Wrong answers review */}
        <h3 style={{fontSize:16,fontWeight:600,color:"white",marginBottom:12}}>Corrections détaillées</h3>
        {results.filter(r => !r.correct).map((r, i) => (
          <div key={i} className="card" style={{marginBottom:10,borderLeft:"3px solid #ef4444"}}>
            <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>{r.id}</div>
            <div style={{fontSize:14,color:"white",marginBottom:8}}>{r.q}</div>
            {r.chosen !== undefined && (
              <div style={{fontSize:13,color:"#ef4444",marginBottom:4}}>❌ Ta réponse : {r.choices[r.chosen]}</div>
            )}
            <div style={{fontSize:13,color:"#22c55e",marginBottom:8}}>✅ Bonne réponse : {r.choices[r.answer]}</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{r.explain}</div>
            {r.trap && <div style={{fontSize:11,color:"#a78bfa",marginTop:4}}>🧠 {r.trap}</div>}
            {r.ref && <div style={{fontSize:11,color:"#64748b",marginTop:4}}>📖 {r.ref}</div>}
          </div>
        ))}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button className="btn" style={{flex:1,background:"#7c3aed",color:"white"}} onClick={() => {
            setStarted(false); setFinished(false); setIdx(0); setAnswers({}); setFlagged(new Set()); setTimeLeft(3600);
          }}>Nouvel examen</button>
          <button className="btn btn-secondary" style={{flex:1}} onClick={() => onNav("home")}>Accueil</button>
        </div>
      </div>
    );
  }

  // Active exam
  const q = questions[idx];
  const timerColor = timeLeft < 300 ? "#ef4444" : timeLeft < 600 ? "#f59e0b" : "#94a3b8";

  return (
    <div className="fade-in">
      {/* Timer + navigation */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:15,fontWeight:700,color:timerColor,fontFamily:"'Space Mono',monospace"}}>{formatTime(timeLeft)}</span>
        <span style={{fontSize:13,color:"#94a3b8"}}>Q{idx+1}/30</span>
        <button className="btn btn-danger" style={{padding:"6px 14px",fontSize:12}} onClick={finishExam}>Terminer</button>
      </div>

      {/* Question grid */}
      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:16}}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width:28,height:28,borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",
            background: i === idx ? "#0ea5e9" : answers[i] !== undefined ? "#1e3a4a" : flagged.has(i) ? "#7c3aed33" : "#1e293b",
            color: i === idx ? "white" : answers[i] !== undefined ? "#0ea5e9" : "#94a3b8",
            border: flagged.has(i) ? "1px solid #7c3aed" : "1px solid #334155",
          }}>{i+1}</button>
        ))}
      </div>

      {/* Question */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <span className="badge" style={{background:LEVELS[q.level].color+"22",color:LEVELS[q.level].color}}>{LEVELS[q.level].name}</span>
          <span className="badge" style={{background:"#334155",color:"#94a3b8"}}>{CATEGORIES[q.cat].icon} {CATEGORIES[q.cat].name}</span>
        </div>
        <p style={{fontSize:15,lineHeight:1.6,color:"white"}}>{q.q}</p>
        {SCENES[q.id] && <div style={{marginTop:12}}><IntersectionScene {...SCENES[q.id]} /></div>}
      </div>

      {/* Choices */}
      {q.choices.map((c, i) => (
        <button key={i}
          className={`choice-btn ${answers[idx] === i ? "correct" : ""}`}
          style={{borderColor: answers[idx] === i ? "#0ea5e9" : undefined, background: answers[idx] === i ? "#0c2a3d" : undefined}}
          onClick={() => setAnswers(prev => ({...prev, [idx]: i}))}>
          <span style={{fontWeight:600,marginRight:10,color:"#64748b"}}>{String.fromCharCode(65+i)}</span>{c}
        </button>
      ))}

      {/* Flag + Nav */}
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button className="btn btn-secondary" style={{flex:1}} onClick={() => setFlagged(prev => {
          const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
        })}>
          {flagged.has(idx) ? "⭐ Marquée" : "☆ Marquer"}
        </button>
        {idx > 0 && <button className="btn btn-secondary" onClick={() => setIdx(i => i - 1)}>← Préc.</button>}
        {idx < questions.length - 1 && <button className="btn btn-primary" onClick={() => setIdx(i => i + 1)}>Suiv. →</button>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REVIEW SCREEN (SRS)
// ═══════════════════════════════════════════════════════════

function ReviewScreen({ srsData, updateSRS }) {
  const dueQuestions = useMemo(() => {
    const now = Date.now();
    const intervals = { 1: 0, 2: 3*86400000, 3: 7*86400000, 4: 14*86400000 };
    return QUESTIONS.filter(q => {
      const entry = srsData[q.id];
      if (!entry) return false;
      if (entry.box >= 4) {
        const elapsed = now - new Date(entry.lastSeen).getTime();
        return elapsed > intervals[4];
      }
      if (entry.box === 1) return true;
      const elapsed = now - new Date(entry.lastSeen).getTime();
      return elapsed > (intervals[entry.box] || 0);
    });
  }, [srsData]);

  const [idx, setIdx] = useState(0);
  const [confidence, setConfidence] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showExplain, setShowExplain] = useState(false);

  if (dueQuestions.length === 0) {
    const box1 = Object.values(srsData).filter(e => e.box === 1).length;
    const box2 = Object.values(srsData).filter(e => e.box === 2).length;
    const box3 = Object.values(srsData).filter(e => e.box === 3).length;
    const box4 = Object.values(srsData).filter(e => e.box >= 4).length;
    const total = Object.keys(srsData).length;

    return (
      <div className="fade-in" style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>✨</div>
        <h2 style={{fontSize:22,fontWeight:700,color:"white",marginBottom:12}}>Révision à jour !</h2>
        <p style={{color:"#94a3b8",marginBottom:24}}>
          {total === 0 ? "Fais d'abord quelques sessions de pratique pour alimenter la révision." : "Aucune question n'est due pour le moment. Reviens plus tard !"}
        </p>
        {total > 0 && (
          <div className="card" style={{textAlign:"left"}}>
            <h3 style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:12}}>État des boîtes Leitner</h3>
            {[
              {label:"Boîte 1 (quotidien)",count:box1,color:"#ef4444"},
              {label:"Boîte 2 (3 jours)",count:box2,color:"#f59e0b"},
              {label:"Boîte 3 (7 jours)",count:box3,color:"#3b82f6"},
              {label:"Boîte 4 (maîtrisé)",count:box4,color:"#22c55e"},
            ].map((b,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:12,color:"#94a3b8",minWidth:140}}>{b.label}</span>
                <div className="progress-bar" style={{flex:1}}>
                  <div className="progress-fill" style={{width: total > 0 ? `${(b.count/total)*100}%` : '0%',background:b.color}} />
                </div>
                <span style={{fontSize:12,fontWeight:600,color:b.color}}>{b.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (idx >= dueQuestions.length) {
    return (
      <div className="fade-in" style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎯</div>
        <h2 style={{fontSize:22,fontWeight:700,color:"white"}}>Session de révision terminée !</h2>
        <p style={{color:"#94a3b8",marginTop:8}}>{dueQuestions.length} questions révisées</p>
        <button className="btn btn-primary" style={{marginTop:20}} onClick={() => {setIdx(0);setSelected(null);setConfidence(null);setShowExplain(false);}}>
          Recommencer
        </button>
      </div>
    );
  }

  const q = dueQuestions[idx];
  const srsEntry = srsData[q.id];

  const handleAnswer = (choiceIdx) => {
    if (confidence === null) return;
    setSelected(choiceIdx);
    updateSRS(q.id, choiceIdx === q.answer);
    setShowExplain(true);
  };

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"white"}}>🔄 Révision SRS</h2>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {srsEntry && <span className="badge" style={{background:"#334155",color:"#94a3b8"}}>Boîte {srsEntry.box}</span>}
          <span style={{fontSize:13,color:"#94a3b8"}}>{idx+1}/{dueQuestions.length}</span>
        </div>
      </div>
      <div className="progress-bar" style={{marginBottom:16}}>
        <div className="progress-fill" style={{width:`${(idx/dueQuestions.length)*100}%`,background:"#8b5cf6"}} />
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <span className="badge" style={{background:LEVELS[q.level].color+"22",color:LEVELS[q.level].color}}>{LEVELS[q.level].name}</span>
          <span className="badge" style={{background:"#334155",color:"#94a3b8"}}>{CATEGORIES[q.cat].icon} {CATEGORIES[q.cat].name}</span>
        </div>
        <p style={{fontSize:15,lineHeight:1.6,color:"white"}}>{q.q}</p>
      </div>

      {!showExplain && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>Confiance :</div>
          <div style={{display:"flex",gap:8}}>
            {[{val:1,l:"🔴 Devine",b:"#dc2626"},{val:2,l:"🟡 Pense",b:"#f59e0b"},{val:3,l:"🟢 Sûr",b:"#22c55e"}].map(c=>(
              <button key={c.val} className="confidence-btn" style={{flex:1,fontSize:12,background:confidence===c.val?c.b+"33":"transparent",borderColor:confidence===c.val?c.b:"#334155",color:confidence===c.val?c.b:"#94a3b8"}}
                onClick={()=>setConfidence(c.val)}>{c.l}</button>
            ))}
          </div>
        </div>
      )}

      {q.choices.map((c,i) => (
        <button key={i} disabled={selected!==null||confidence===null}
          className={`choice-btn ${selected===i?(i===q.answer?"correct":"incorrect"):showExplain&&i===q.answer?"was-correct":""}`}
          style={{opacity:confidence===null&&!showExplain?0.5:1}}
          onClick={()=>handleAnswer(i)}>
          <span style={{fontWeight:600,marginRight:10,color:"#64748b"}}>{String.fromCharCode(65+i)}</span>{c}
        </button>
      ))}

      {showExplain && (
        <div className="card fade-in" style={{marginTop:16,borderLeft:`3px solid ${selected===q.answer?"#22c55e":"#ef4444"}`}}>
          <div style={{fontSize:14,fontWeight:600,color:selected===q.answer?"#22c55e":"#ef4444",marginBottom:8}}>
            {selected===q.answer?"✅ Correct":"❌ Incorrect"} — {selected!==q.answer?"Retour en Boîte 1":"Boîte "+(Math.min((srsEntry?.box||1)+1,4))}
          </div>
          <div style={{fontSize:13,color:"#e2e8f0",lineHeight:1.6}}>{q.explain}</div>
          {q.ref && <div style={{fontSize:11,color:"#64748b",marginTop:8}}>📖 {q.ref}</div>}
          <button className="btn btn-primary" style={{width:"100%",marginTop:12}} onClick={() => {setSelected(null);setConfidence(null);setShowExplain(false);setIdx(i=>i+1);}}>
            Suivante →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD SCREEN
// ═══════════════════════════════════════════════════════════

function DashboardScreen({ sessions, srsData, streak, onReset }) {
  const [showReset, setShowReset] = useState(false);

  // Score over time
  const scoreData = sessions.map((s, i) => ({
    name: `#${i+1}`,
    score: s.score,
    mode: s.mode === "exam" ? "Examen" : "Pratique",
  }));

  // Category performance
  const catPerf = {};
  sessions.forEach(s => {
    (s.answers || []).forEach(a => {
      if (!catPerf[a.cat]) catPerf[a.cat] = { correct: 0, total: 0 };
      catPerf[a.cat].total++;
      if (a.correct) catPerf[a.cat].correct++;
    });
  });
  const catData = Object.entries(catPerf).map(([cat, data]) => ({
    subject: CATEGORIES[cat]?.name || cat,
    score: data.total > 0 ? Math.round(data.correct / data.total * 100) : 0,
    fullMark: 100,
  }));

  // SRS stats
  const srsStats = { box1: 0, box2: 0, box3: 0, box4: 0 };
  Object.values(srsData).forEach(e => {
    if (e.box <= 1) srsStats.box1++;
    else if (e.box === 2) srsStats.box2++;
    else if (e.box === 3) srsStats.box3++;
    else srsStats.box4++;
  });
  const totalSRS = Object.keys(srsData).length;

  // Weak categories
  const weakCats = Object.entries(catPerf)
    .map(([cat, data]) => ({ cat, pct: Math.round(data.correct / data.total * 100), total: data.total }))
    .filter(c => c.pct < 70 && c.total >= 3)
    .sort((a, b) => a.pct - b.pct);

  // Exam prediction
  const examSessions = sessions.filter(s => s.mode === "exam");
  const lastThreeExams = examSessions.slice(-3);
  const avgExam = lastThreeExams.length > 0 ? Math.round(lastThreeExams.reduce((a,s)=>a+s.score,0)/lastThreeExams.length) : null;

  return (
    <div className="fade-in">
      <h2 style={{fontSize:22,fontWeight:700,color:"white",marginBottom:20}}>📊 Tableau de bord</h2>

      {/* Key metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        <div className="card" style={{textAlign:"center",padding:16}}>
          <div style={{fontSize:28,fontWeight:700,color:"#0ea5e9"}}>{sessions.length}</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Sessions</div>
        </div>
        <div className="card" style={{textAlign:"center",padding:16}}>
          <div style={{fontSize:28,fontWeight:700,color:"#22c55e"}}>{totalSRS}</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Questions vues</div>
        </div>
        <div className="card" style={{textAlign:"center",padding:16}}>
          <div style={{fontSize:28,fontWeight:700,color:"#f59e0b"}}>{srsStats.box4}</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Maîtrisées</div>
        </div>
        <div className="card" style={{textAlign:"center",padding:16}}>
          <div style={{fontSize:28,fontWeight:700,color: avgExam && avgExam >= 73 ? "#22c55e" : "#ef4444"}}>
            {avgExam !== null ? `${avgExam}%` : "—"}
          </div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Moy. examens</div>
        </div>
      </div>

      {/* Exam prediction */}
      {avgExam !== null && (
        <div className="card" style={{marginBottom:16,background: avgExam >= 85 ? "#052e16" : avgExam >= 73 ? "#1c1917" : "#2e0a0a",border: `1px solid ${avgExam >= 85 ? "#22c55e" : avgExam >= 73 ? "#f59e0b" : "#ef4444"}`}}>
          <div style={{fontSize:14,fontWeight:600,color:"white",marginBottom:4}}>
            🎯 Prédiction si examen SAAQ aujourd'hui :
          </div>
          <div style={{fontSize:22,fontWeight:700,color: avgExam >= 85 ? "#22c55e" : avgExam >= 73 ? "#f59e0b" : "#ef4444"}}>
            {avgExam >= 85 ? "RÉUSSITE PROBABLE" : avgExam >= 73 ? "LIMITE — Continue de pratiquer" : "RISQUE D'ÉCHEC — Intensifie la préparation"}
          </div>
          <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>
            Basé sur la moyenne de tes {lastThreeExams.length} dernière(s) simulation(s)
          </div>
        </div>
      )}

      {/* Score progression chart */}
      {scoreData.length > 1 && (
        <div className="card" style={{marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:12}}>Progression des scores</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreData}>
              <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:11}} />
              <YAxis domain={[0,100]} tick={{fill:"#64748b",fontSize:11}} />
              <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0"}} />
              <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} dot={{fill:"#0ea5e9"}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar chart by category */}
      {catData.length > 3 && (
        <div className="card" style={{marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:12}}>Performance par catégorie</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={catData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{fill:"#94a3b8",fontSize:10}} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:"#64748b",fontSize:9}} />
              <Radar name="Score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* SRS Leitner boxes */}
      <div className="card" style={{marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:600,color:"#94a3b8",marginBottom:12}}>Boîtes Leitner (SRS)</h3>
        {[
          {label:"Boîte 1 — À revoir",count:srsStats.box1,color:"#ef4444"},
          {label:"Boîte 2 — En apprentissage",count:srsStats.box2,color:"#f59e0b"},
          {label:"Boîte 3 — Acquis",count:srsStats.box3,color:"#3b82f6"},
          {label:"Boîte 4 — Maîtrisé",count:srsStats.box4,color:"#22c55e"},
        ].map((b,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:12,color:"#94a3b8",minWidth:170}}>{b.label}</span>
            <div className="progress-bar" style={{flex:1}}>
              <div className="progress-fill" style={{width: totalSRS > 0 ? `${(b.count/totalSRS)*100}%` : "0%", background:b.color}} />
            </div>
            <span style={{fontSize:13,fontWeight:600,color:b.color,minWidth:30,textAlign:"right"}}>{b.count}</span>
          </div>
        ))}
      </div>

      {/* Weak categories alert */}
      {weakCats.length > 0 && (
        <div className="card" style={{marginBottom:16,borderLeft:"3px solid #ef4444"}}>
          <h3 style={{fontSize:14,fontWeight:600,color:"#ef4444",marginBottom:8}}>⚠️ Catégories à renforcer (&lt;70%)</h3>
          {weakCats.map((c,i) => (
            <div key={i} style={{fontSize:13,color:"#fca5a5",marginBottom:4}}>
              {CATEGORIES[c.cat]?.icon} {CATEGORIES[c.cat]?.name} : {c.pct}% ({c.total} questions)
            </div>
          ))}
        </div>
      )}

      {/* Reset */}
      <div style={{marginTop:32,textAlign:"center"}}>
        {!showReset ? (
          <button className="btn btn-secondary" style={{fontSize:12}} onClick={() => setShowReset(true)}>
            Réinitialiser toutes les données
          </button>
        ) : (
          <div className="card" style={{border:"1px solid #ef4444"}}>
            <p style={{color:"#fca5a5",fontSize:13,marginBottom:12}}>Cette action supprimera toutes tes sessions, ta progression SRS et ton diagnostic. Irréversible.</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-danger" style={{flex:1}} onClick={onReset}>Confirmer la suppression</button>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowReset(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
