// Onboarding's editable words, in every language the product speaks.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY THE DATA IS HERE AND THE RULES ARE NEXT DOOR
//
// `onboarding.ts` owns the three layers — STEPS, SCREENS, CONTENT — and the validator that keeps an
// admin on the right side of the line between them. None of that changes when a language is added;
// only the CONTENT does, eight times over. So the tree lives here and the rules stay there, and the
// dependency runs ONE WAY: this file imports `onboarding.ts` and nothing imports back.
//
// EVERY LANGUAGE IS THE SAME REVISION. `version` is the join key between a funnel row and the words
// that produced it, and translations of one editorial revision are one revision — a German who
// completes onboarding and an Italian who does not were answering the same questions. Eight version
// counters would make the funnel eight funnels, each too small to read.
//
// THE PLACEHOLDERS ARE PART OF THE SENTENCE. `{floor}`, `{target}`, `{month}`, `{share}` and
// `{loseTail}` are filled by code; a translation that drops one renders a sentence with its number
// missing, and nothing would say so. `onboarding-content.test.ts` checks every one of them in every
// language, which is the only reason it is safe to have a translator anywhere near these strings.
//
// THE CLAIMS GATE IS NO LONGER ENGLISH-ONLY — `claims.ts` matches `guarantee`, `weight-promise`,
// `lowers-marker` and `detox` in all eight languages — but this surface opts into
// `retired-no-email` alone, still an English pattern, because its own honest answers ("Lose
// weight", "Diabetes") are sentences the wider set cannot read. What protects the seven
// translations is what it was: they are TRANSLATIONS of copy that passed the gate — the English
// is the source, and a sentence is changed there first. A translation that invents a claim of
// its own is a review problem, and the review is the PR.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { t, type Localized } from "./lang.ts";
import type { Lang } from "./types.ts";
import { DEFAULT_ONBOARDING_CONTENT, usableContent, type OnboardingContent } from "./onboarding.ts";

// ── Français ─────────────────────────────────────────────────────────────────────────────────

// ── Français ──────────────────────────────────────────────────────────────────────

const FR: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Commencer",
    signin: "J'ai déjà un compte",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["Quel est ton objectif ?"] } },
      options: {
        lose: { label: "Perdre du poids" },
        maintain: { label: "Garder mon poids" },
        gain: { label: "Prendre du poids" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["Quel est ton sexe ?"] } },
      options: { male: { label: "Homme" }, female: { label: "Femme" }, other: { label: "Autre" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["Ton âge ?"], placeholder: "Ton âge" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Taille"], placeholder: "Taille en cm" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Ton poids"], placeholder: "Poids en kg" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["À quel point tes journées sont-elles actives ?"] } },
      options: {
        none: { label: "0", hint: "Pas de séance" },
        few: { label: "1–2", hint: "Une séance de temps en temps" },
        some: { label: "3–4", hint: "Quelques séances par semaine" },
        many: { label: "5+", hint: "Athlète confirmé" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["Quel poids vises-tu ?"], placeholder: "Poids cible en kg" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["À quel rythme ?"] } },
      options: {
        easy: { label: "Doux" },
        steady: { label: "Régulier" },
        push: { label: "Soutenu" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Déjà compté les calories ?"] } },
      options: {
        never: { label: "Jamais" },
        stopped: { label: "Essayé, arrêté" },
        onoff: { label: "Par intermittence" },
        now: { label: "Je compte en ce moment" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Qu'est-ce qui t'a arrêté ?", "Choisis tout ce qui s'applique"],
          variants: {
            onoff: ["Qu'est-ce qui t'a gêné ?", "Choisis tout ce qui s'applique"],
            now: ["Qu'est-ce qui te faciliterait la tâche ?", "Choisis tout ce qui s'applique"],
          },
        },
      },
      options: {
        too_long: { label: "Ça prenait trop de temps" },
        forgot: { label: "J'oubliais" },
        invisible: { label: "Je ne voyais pas de résultats" },
        no_idea: { label: "Je ne savais pas quoi manger" },
        stressful: { label: "C'était stressant" },
        nobody: { label: "Personne à qui demander" },
        creeping: { label: "Mon poids revenait petit à petit" },
        not_enough: { label: "Dur de manger assez" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Quand est-ce le plus dur de noter ?"],
          variants: { never: ["Quand penses-tu que noter sera le plus dur ?"] },
        },
      },
      options: {
        workdays: { label: "Les jours de travail chargés" },
        eating_out: { label: "Au restaurant" },
        cooking: { label: "Cuisiner pour d'autres" },
        snacks: { label: "Snacks et boissons" },
        evenings: { label: "Soirs et week-ends" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["Tu suis un régime particulier ?"] } },
      options: {
        balanced: { label: "Équilibré" },
        wholefood: { label: "Aliments complets" },
        mediterranean: { label: "Méditerranéen" },
        flexitarian: { label: "Flexitarien" },
        pescatarian: { label: "Pescétarien" },
        vegetarian: { label: "Végétarien" },
        vegan: { label: "Végétalien" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["Des contraintes de santé ?"] } },
      options: {
        kidneys: { label: "Maladie rénale" },
        ldl: { label: "Cholestérol élevé" },
        lowsugar: { label: "Risque de diabète" },
        none: { label: "Rien de tout ça" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["Où manges-tu ?"], placeholder: "Rechercher" } },
      enabled: true,
      options: { other: { label: "Ailleurs" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["Quelle série viser ?"] } },
      options: {
        "7": { label: "7 jours" },
        "14": { label: "14 jours" },
        "30": { label: "30 jours" },
        "50": { label: "50 jours" },
      },
    },
  ],
  building: {
    lines: ["Je construis ton plan personnel"],
    title: "Ton plan quotidien",
    rows: {
      calories: "Calories", protein: "Protéines", carbs: "Glucides",
      fat: "Lipides", diet: "Régime",
    },
    limitCap: { ldl: "graisses saturées ≤ {n}g", kidneys: "sodium ≤ {n}mg" },
    cta: "Montre-moi le plan",
    floorTitle: "On s'arrête à {floor}kcal",
    floorBody: "Le calcul voulait descendre plus bas. Sans suivi médical, on ne fixe pas d'objectif en dessous, donc le tien s'arrête ici. Ton journal le dira aussi.",
  },
  summary: {
    lines: ["Voilà ton plan"],
    kcalLabel: "kcal par jour",
    floorMarker: "plafonné par sécurité · jamais sous {floor}",
    macros: {
      protein: "Protéines", carbs: "Glucides", fat: "Lipides",
      satfat: "Graisses saturées · tu l'as demandé",
    },
    capNote: "Ce rythme demanderait un écart quotidien plus grand qu'on ne peut tenir sans risque, alors tu as la version sûre : {share}% de ce que ton corps brûle en une journée.",
    cta: "Photographie ton premier repas",
  },
  ui: {
    continueLabel: "Continuer",
    saveKept: "Impossible d'enregistrer. Ta réponse est toujours là. Continuer l'envoie à nouveau.",
    idlePlaceholder: "Écrire à Spud…",
    optionContinues: "Sélectionne et continue",
    stepper: { continue: "Continuer", less: "Moins", more: "Plus" },
    units: { years: "ans", yearsCount: { one: "{n} an", other: "{n} ans" } },
  },
  beats: {
    ageWhy: "Ton métabolisme change avec l’âge, on en tient compte",
    echo: { rest: "Au repos : {rest}kcal par jour", days: "Tes journées brûlent {burn}kcal" },
    baseline: { title: "Voici ton point de départ", bmi: "IMC", what: "Indice de masse corporelle" },
    prelim: { title: "Ton plan", burn: "Tu brûles", gap: "{delta} ton rythme", eat: "Tu manges", perDay: "kcal par jour", keepTitle: "Tu brûles environ {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · le plus bas qu'on fixe",
      now: "{weight} · maintenant",
      nowLowest: "{weight} · maintenant · le plus bas qu'on fixe",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Je te propose {weight}, soit environ {pct} % de moins — un bon premier objectif", up: "Je te propose {weight}, soit environ {pct} % de plus — un bon premier objectif" },
  },
  pace: {
    rate: "{rate} par semaine",
    rateSuffix: "par semaine",
    result: "{target} vers {month} · {kcal}kcal par jour",
    echo: "De {from} à {to}.",
  },
  plan: {
    weightTitle: "Ton poids",
    everyDay: "Chaque jour",
    infoTitle: "Tes infos",
    basedOn: "D’après tes réponses",
    changeAnytime: "Tu peux changer ça quand tu veux",
    goal: {
      lose: "Objectif : −{kg} d’ici {month}",
      gain: "Objectif : +{kg} d’ici {month}",
      maintain: "Objectif : rester autour de {kg}",
      maintainRange: "Fourchette : {range}",
    },
    info: {
      startWeight: "Poids de départ", goalWeight: "Poids visé", activity: "Activité",
      target: "Objectif", targetLose: "−{kg} d’ici {month}", targetGain: "+{kg} d’ici {month}",
    },
    satFat: { label: "graisses sat.", asked: "Graisses saturées · ta demande", perDay: "≤ {g} par jour" },
    first: { title: "Ta première étape", step: "Photographie ton prochain repas. eait le compare à {kcal}kcal." },
    loader: { goal: "Ton objectif", lose: "−{kg} d’ici {month}", gain: "+{kg} d’ici {month}" },
    chart: { estimateAria: "Poids estimé : {from} maintenant, {to} vers {month}" },
  },
  signup: { heading: "Sauvegarde ton plan", line: "Ainsi ton plan et ton abonnement te suivent sur un nouveau téléphone, et tes repas sont conservés." },
  referral: {
    ask: "Un ami t'a envoyé un lien ?",
    field: "Lien d'invitation d'un ami",
    unknown: "Ce lien ne correspond à personne. Vérifie-le, ou passe.",
    own: "C'est ton propre lien. Ici, c'est le lien d'un ami.",
    already: "Ce compte a déjà rejoint eait avec le lien d'un ami.",
    paid: "Les liens d'invitation sont pour les nouveaux membres, et ce compte a déjà acheté eait.",
    tryAgain: "Réessayer",
    skip: "Passer",
  },
  health: { title: "Synchroniser avec Santé", body: "Ton poids et ton activité arrivent, tes repas partent vers Santé." },
  liveActivity: { titles: ["Questions", "Ton plan", "Presque fini"], go: "Continuer" },
  firstMeal: {
    ask: "Un repas offert. Une photo, ou tu me racontes ?",
    react: "Pas de souci. Teste-moi d'abord",
    photo: "Prendre une photo",
    tell: "Me raconter ton repas",
    keepGoing: "Continuer",
    correct: "Corriger le repas",
    afterAsk: "Et d'un ! Tu veux ça pour chaque repas ?",
  },
  refusals: {
    invalid: {
      age: "Ça ne ressemble pas à un âge — essaie quelque chose comme 34.",
      height_cm: "En centimètres — quelque chose comme 175.",
      weight_kg: "En kilos — à peu près, ça suffit.",
      target_weight_kg: "Un nombre en kg — comme 70.",
    },
    ambiguousAge: {
      line: "Je veux être sûr d'avoir bien lu — si tu voulais dire l'année {year}, envoie les quatre chiffres.",
      confirm: "J'ai {age} ans",
    },
    direction: {
      gain: "Tu es à {weight}kg et tu demandes à monter jusqu'à {target} — ce n'est pas une hausse par rapport à aujourd'hui. Si ton objectif a changé, on peut le modifier ; sinon, donne-moi un nombre au-dessus de {weight}.",
      lose: "Tu es à {weight}kg et tu demandes à descendre jusqu'à {target} — ce n'est pas une baisse par rapport à aujourd'hui. Si ton objectif a changé, on peut le modifier ; sinon, donne-moi un nombre en dessous de {weight}.",
      switchToLose: "Je veux perdre du poids",
      switchToGain: "Je veux prendre du poids",
      above: "Un nombre au-dessus de {weight}…",
      below: "Un nombre en dessous de {weight}…",
    },
    switched: {
      gain: "Va pour la prise de poids. Où aimerais-tu arriver, en kg ?",
    },
  },
};

// ── Deutsch ───────────────────────────────────────────────────────────────────────

const DE: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Los geht's",
    signin: "Ich habe schon ein Konto",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["Was willst du erreichen?"] } },
      options: {
        lose: { label: "Abnehmen" },
        maintain: { label: "Mein Gewicht halten" },
        gain: { label: "Zunehmen" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["Dein Geschlecht?"] } },
      options: { male: { label: "Männlich" }, female: { label: "Weiblich" }, other: { label: "Divers" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["Dein Alter?"], placeholder: "Dein Alter" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Größe"], placeholder: "Größe in cm" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Dein Gewicht"], placeholder: "Gewicht in kg" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["Wie aktiv sind deine Tage?"] } },
      options: {
        none: { label: "0", hint: "Kein Training" },
        few: { label: "1–2", hint: "Ab und zu ein Workout" },
        some: { label: "3–4", hint: "Ein paar Workouts pro Woche" },
        many: { label: "5+", hint: "Fast täglich Training" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["Welches Gewicht strebst du an?"], placeholder: "Zielgewicht in kg" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["Wie schnell?"] } },
      options: {
        easy: { label: "Sanft" },
        steady: { label: "Stetig" },
        push: { label: "Zügig" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Schon mal Kalorien gezählt?"] } },
      options: {
        never: { label: "Nie" },
        stopped: { label: "Probiert, aufgehört" },
        onoff: { label: "Mal so, mal so" },
        now: { label: "Ich zähle gerade" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Was hat dich gestoppt?", "Wähl alles, was zutrifft"],
          variants: {
            onoff: ["Was kam dazwischen?", "Wähl alles, was zutrifft"],
            now: ["Was würdest du dir leichter wünschen?", "Wähl alles, was zutrifft"],
          },
        },
      },
      options: {
        too_long: { label: "Es dauerte zu lange" },
        forgot: { label: "Ich hab's vergessen" },
        invisible: { label: "Ich hab keine Fortschritte gesehen" },
        no_idea: { label: "Ich wusste nicht, was ich essen soll" },
        stressful: { label: "Es war stressig" },
        nobody: { label: "Niemand zum Fragen" },
        creeping: { label: "Mein Gewicht kam langsam zurück" },
        not_enough: { label: "Schwer, genug zu essen" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Wann fällt das Eintragen am schwersten?"],
          variants: { never: ["Wann wird das Eintragen vermutlich am schwersten?"] },
        },
      },
      options: {
        workdays: { label: "Volle Arbeitstage" },
        eating_out: { label: "Essen gehen" },
        cooking: { label: "Für andere kochen" },
        snacks: { label: "Snacks und Getränke" },
        evenings: { label: "Abende und Wochenenden" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["Folgst du einer Ernährungsweise?"] } },
      options: {
        balanced: { label: "Ausgewogen" },
        wholefood: { label: "Vollwertkost" },
        mediterranean: { label: "Mediterran" },
        flexitarian: { label: "Flexitarisch" },
        pescatarian: { label: "Pescetarisch" },
        vegetarian: { label: "Vegetarisch" },
        vegan: { label: "Vegan" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["Medizinische Einschränkungen?"] } },
      options: {
        kidneys: { label: "Nierenerkrankung" },
        ldl: { label: "Hoher Cholesterinwert" },
        lowsugar: { label: "Diabetesrisiko" },
        none: { label: "Nichts davon" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["Wo isst du?"], placeholder: "Suchen" } },
      enabled: true,
      options: { other: { label: "Woanders" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["Welche Serie peilst du an?"] } },
      options: {
        "7": { label: "7 Tage" },
        "14": { label: "14 Tage" },
        "30": { label: "30 Tage" },
        "50": { label: "50 Tage" },
      },
    },
  ],
  building: {
    lines: ["Dein persönlicher Plan wird erstellt"],
    title: "Dein Tagesplan",
    rows: {
      calories: "Kalorien", protein: "Protein", carbs: "Kohlenhydrate",
      fat: "Fett", diet: "Ernährung",
    },
    limitCap: { ldl: "gesättigte Fettsäuren ≤ {n}g", kidneys: "Natrium ≤ {n}mg" },
    cta: "Zeig mir den Plan",
    floorTitle: "Wir bleiben bei {floor}kcal",
    floorBody: "Die Rechnung wollte tiefer. Ohne ärztliche Begleitung setzen wir keine Ziele darunter, also liegt deins genau hier. In deinem Tagebuch steht das auch.",
  },
  summary: {
    lines: ["Hier ist dein Plan"],
    kcalLabel: "kcal pro Tag",
    floorMarker: "aus Sicherheitsgründen begrenzt · nie unter {floor}",
    macros: {
      protein: "Protein", carbs: "Kohlenhydrate", fat: "Fett",
      satfat: "Gesättigte Fettsäuren · auf deinen Wunsch",
    },
    capNote: "Dieses Tempo bräuchte eine größere Tagesänderung, als sich sicher durchhalten lässt, also bekommst du die sichere Variante: {share}% dessen, was dein Körper am Tag verbrennt.",
    cta: "Fotografier deine erste Mahlzeit",
  },
  ui: {
    continueLabel: "Weiter",
    saveKept: "Das konnte nicht gespeichert werden. Deine Antwort ist noch da. Mit Weiter wird sie erneut gesendet.",
    idlePlaceholder: "Nachricht an Spud…",
    optionContinues: "Wählt aus und fährt fort",
    stepper: { continue: "Weiter", less: "Weniger", more: "Mehr" },
    units: { years: "Jahre", yearsCount: { one: "{n} Jahr", other: "{n} Jahre" } },
  },
  beats: {
    ageWhy: "Dein Stoffwechsel verändert sich mit dem Alter, das rechnen wir ein",
    echo: { rest: "Im Ruhezustand: {rest}kcal am Tag", days: "Deine Tage verbrennen {burn}kcal" },
    baseline: { title: "Das ist dein Ausgangspunkt", bmi: "BMI", what: "Body-Mass-Index" },
    prelim: { title: "Dein Plan", burn: "Du verbrennst", gap: "{delta} dein Tempo", eat: "Du isst", perDay: "kcal am Tag", keepTitle: "Du verbrennst etwa {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · unser Minimum",
      now: "{weight} · jetzt",
      nowLowest: "{weight} · jetzt · unser Minimum",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Ich schlage {weight} vor, etwa {pct}% weniger — ein gutes erstes Ziel", up: "Ich schlage {weight} vor, etwa {pct}% mehr — ein gutes erstes Ziel" },
  },
  pace: {
    rate: "{rate} pro Woche",
    rateSuffix: "pro Woche",
    result: "{target} etwa im {month} · {kcal}kcal am Tag",
    echo: "Von {from} auf {to}.",
  },
  plan: {
    weightTitle: "Dein Gewicht",
    everyDay: "Jeden Tag",
    infoTitle: "Deine Angaben",
    basedOn: "Basierend auf deinen Antworten",
    changeAnytime: "Du kannst das jederzeit ändern",
    goal: {
      lose: "Ziel: −{kg} bis {month}",
      gain: "Ziel: +{kg} bis {month}",
      maintain: "Ziel: bei etwa {kg} bleiben",
      maintainRange: "Bereich: {range}",
    },
    info: {
      startWeight: "Startgewicht", goalWeight: "Zielgewicht", activity: "Aktivität",
      target: "Ziel", targetLose: "−{kg} bis {month}", targetGain: "+{kg} bis {month}",
    },
    satFat: { label: "ges. Fett", asked: "Gesättigte Fette · dein Wunsch", perDay: "≤ {g} am Tag" },
    first: { title: "Dein erster Schritt", step: "Fotografiere deine nächste Mahlzeit. eait prüft sie gegen {kcal}kcal." },
    loader: { goal: "Dein Ziel", lose: "−{kg} bis {month}", gain: "+{kg} bis {month}" },
    chart: { estimateAria: "Geschätztes Gewicht: jetzt {from}, {to} etwa im {month}" },
  },
  signup: { heading: "Sichere deinen Plan", line: "So wandern dein Plan und dein Abo mit auf ein neues Handy, und deine Mahlzeiten bleiben erhalten." },
  referral: {
    ask: "Hat dir ein Freund einen Link geschickt?",
    field: "Einladungslink eines Freundes",
    unknown: "Dieser Link passt zu niemandem. Prüf ihn oder überspring.",
    own: "Das ist dein eigener Link. Hier gehört der Link eines Freundes hin.",
    already: "Dieses Konto ist schon mit dem Link eines Freundes beigetreten.",
    paid: "Einladungslinks sind für neue Mitglieder, und dieses Konto hat eait schon gekauft.",
    tryAgain: "Erneut versuchen",
    skip: "Überspringen",
  },
  health: { title: "Mit Apple Health synchronisieren", body: "Gewicht und Aktivität kommen rein, deine Mahlzeiten gehen raus." },
  liveActivity: { titles: ["Fragen", "Dein Plan", "Fast geschafft"], go: "Weiter" },
  firstMeal: {
    ask: "Eine Mahlzeit geht auf mich. Foto, oder erzählst du's mir?",
    react: "Kein Problem. Probier mich erst aus",
    photo: "Foto machen",
    tell: "Mir erzählen, was du gegessen hast",
    keepGoing: "Weiter",
    correct: "Mahlzeit korrigieren",
    afterAsk: "Das war eine. Willst du das für jede Mahlzeit?",
  },
  refusals: {
    invalid: {
      age: "Das sieht nicht nach einem Alter aus — versuch es mit so etwas wie 34.",
      height_cm: "In Zentimetern — so etwas wie 175.",
      weight_kg: "In Kilogramm — ungefähr reicht.",
      target_weight_kg: "Eine Zahl in kg — zum Beispiel 70.",
    },
    ambiguousAge: {
      line: "Ich will sichergehen, dass ich das richtig lese — wenn du das Jahr {year} meintest, schick alle vier Ziffern.",
      confirm: "Ich bin {age}",
    },
    direction: {
      gain: "Du bist bei {weight}kg und willst auf {target} zunehmen — von hier aus ist das keine Zunahme. Wenn sich das Ziel geändert hat, stellen wir um; sonst gib mir eine Zahl über {weight}.",
      lose: "Du bist bei {weight}kg und willst auf {target} abnehmen — von hier aus ist das keine Abnahme. Wenn sich das Ziel geändert hat, stellen wir um; sonst gib mir eine Zahl unter {weight}.",
      switchToLose: "Auf Abnehmen umstellen",
      switchToGain: "Auf Zunehmen umstellen",
      above: "Eine Zahl über {weight}…",
      below: "Eine Zahl unter {weight}…",
    },
    switched: {
      gain: "Umgestellt — zunehmen also. Wo möchtest du landen, in kg?",
    },
  },
};

// ── Italiano ──────────────────────────────────────────────────────────────────────

const IT: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Inizia",
    signin: "Ho già un account",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["Cosa vuoi ottenere?"] } },
      options: {
        lose: { label: "Perdere peso" },
        maintain: { label: "Mantenere il peso" },
        gain: { label: "Prendere peso" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["Qual è il tuo sesso?"] } },
      options: { male: { label: "Uomo" }, female: { label: "Donna" }, other: { label: "Altro" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["La tua età?"], placeholder: "La tua età" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Altezza"], placeholder: "Altezza in cm" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Il tuo peso"], placeholder: "Peso in kg" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["Quanto sono attive le tue giornate?"] } },
      options: {
        none: { label: "0", hint: "Nessun allenamento" },
        few: { label: "1–2", hint: "Un allenamento ogni tanto" },
        some: { label: "3–4", hint: "Qualche allenamento a settimana" },
        many: { label: "5+", hint: "Quasi tutti i giorni" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["Che peso vuoi raggiungere?"], placeholder: "Peso obiettivo in kg" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["A che ritmo?"] } },
      options: {
        easy: { label: "Dolce" },
        steady: { label: "Costante" },
        push: { label: "Sostenuto" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Hai mai contato le calorie?"] } },
      options: {
        never: { label: "Mai" },
        stopped: { label: "Provato, poi smesso" },
        onoff: { label: "Ogni tanto" },
        now: { label: "Le conto adesso" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Cosa ti ha fermato?", "Scegli tutte quelle che valgono"],
          variants: {
            onoff: ["Cosa si è messo in mezzo?", "Scegli tutte quelle che valgono"],
            now: ["Cosa vorresti più facile?", "Scegli tutte quelle che valgono"],
          },
        },
      },
      options: {
        too_long: { label: "Ci voleva troppo tempo" },
        forgot: { label: "Dimenticavo" },
        invisible: { label: "Non vedevo risultati" },
        no_idea: { label: "Non sapevo cosa mangiare" },
        stressful: { label: "Era stressante" },
        nobody: { label: "Nessuno a cui chiedere" },
        creeping: { label: "Il mio peso tornava su" },
        not_enough: { label: "Difficile mangiare abbastanza" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Quando è più difficile registrare i pasti?"],
          variants: { never: ["Quando pensi che registrare i pasti sarà più difficile?"] },
        },
      },
      options: {
        workdays: { label: "Giornate di lavoro piene" },
        eating_out: { label: "Mangiare fuori" },
        cooking: { label: "Cucinare per altri" },
        snacks: { label: "Snack e bevande" },
        evenings: { label: "Sere e weekend" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["Segui una dieta?"] } },
      options: {
        balanced: { label: "Equilibrata" },
        wholefood: { label: "Cibi poco lavorati" },
        mediterranean: { label: "Mediterranea" },
        flexitarian: { label: "Flexitariana" },
        pescatarian: { label: "Pescetariana" },
        vegetarian: { label: "Vegetariana" },
        vegan: { label: "Vegana" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["Hai condizioni mediche da considerare?"] } },
      options: {
        kidneys: { label: "Malattia renale" },
        ldl: { label: "Colesterolo alto" },
        lowsugar: { label: "Rischio di diabete" },
        none: { label: "Niente di tutto questo" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["Dove mangi?"], placeholder: "Cerca" } },
      enabled: true,
      options: { other: { label: "Altrove" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["Quale serie vuoi raggiungere?"] } },
      options: {
        "7": { label: "7 giorni" },
        "14": { label: "14 giorni" },
        "30": { label: "30 giorni" },
        "50": { label: "50 giorni" },
      },
    },
  ],
  building: {
    lines: ["Sto costruendo il tuo piano personale"],
    title: "Il tuo piano giornaliero",
    rows: {
      calories: "Calorie", protein: "Proteine", carbs: "Carboidrati",
      fat: "Grassi", diet: "Dieta",
    },
    limitCap: { ldl: "grassi saturi ≤ {n}g", kidneys: "sodio ≤ {n}mg" },
    cta: "Mostrami il piano",
    floorTitle: "Ci fermiamo a {floor}kcal",
    floorBody: "Il calcolo voleva scendere ancora. Senza controllo medico non fissiamo obiettivi sotto questa soglia, quindi il tuo resta qui. Lo dirà anche il tuo diario.",
  },
  summary: {
    lines: ["Ecco il tuo piano"],
    kcalLabel: "kcal al giorno",
    floorMarker: "limitato per sicurezza · mai sotto {floor}",
    macros: {
      protein: "Proteine", carbs: "Carboidrati", fat: "Grassi",
      satfat: "Grassi saturi · l'hai chiesto tu",
    },
    capNote: "Quel ritmo chiederebbe una variazione quotidiana più grande di quanto sia sicuro mantenere, quindi il tuo è la versione sicura: {share}% di quello che il tuo corpo brucia in un giorno.",
    cta: "Fotografa il tuo primo pasto",
  },
  ui: {
    continueLabel: "Continua",
    saveKept: "Non è stato possibile salvare. La tua risposta è ancora qui. Con Continua viene inviata di nuovo.",
    idlePlaceholder: "Scrivi a Spud…",
    optionContinues: "Seleziona e continua",
    stepper: { continue: "Continua", less: "Meno", more: "Più" },
    units: { years: "anni", yearsCount: { one: "{n} anno", other: "{n} anni" } },
  },
  beats: {
    ageWhy: "Il tuo metabolismo cambia con l’età, e ne teniamo conto",
    echo: { rest: "A riposo: {rest}kcal al giorno", days: "Le tue giornate bruciano {burn}kcal" },
    baseline: { title: "Ecco il tuo punto di partenza", bmi: "IMC", what: "Indice di massa corporea" },
    prelim: { title: "Il tuo piano", burn: "Tu bruci", gap: "{delta} il tuo ritmo", eat: "Tu mangi", perDay: "kcal al giorno", keepTitle: "Bruci circa {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · il minimo che fissiamo",
      now: "{weight} · ora",
      nowLowest: "{weight} · ora · il minimo che fissiamo",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Ti suggerisco {weight}, circa il {pct}% in meno — un buon primo obiettivo", up: "Ti suggerisco {weight}, circa il {pct}% in più — un buon primo obiettivo" },
  },
  pace: {
    rate: "{rate} a settimana",
    rateSuffix: "a settimana",
    result: "{target} verso {month} · {kcal}kcal al giorno",
    echo: "Da {from} a {to}.",
  },
  plan: {
    weightTitle: "Il tuo peso",
    everyDay: "Ogni giorno",
    infoTitle: "I tuoi dati",
    basedOn: "In base alle tue risposte",
    changeAnytime: "Puoi cambiarlo quando vuoi",
    goal: {
      lose: "Obiettivo: −{kg} entro {month}",
      gain: "Obiettivo: +{kg} entro {month}",
      maintain: "Obiettivo: restare intorno a {kg}",
      maintainRange: "Intervallo: {range}",
    },
    info: {
      startWeight: "Peso di partenza", goalWeight: "Peso obiettivo", activity: "Attività",
      target: "Obiettivo", targetLose: "−{kg} entro {month}", targetGain: "+{kg} entro {month}",
    },
    satFat: { label: "grassi sat.", asked: "Grassi saturi · la tua richiesta", perDay: "≤ {g} al giorno" },
    first: { title: "Il tuo primo passo", step: "Fotografa il tuo prossimo pasto. eait lo confronta con {kcal}kcal." },
    loader: { goal: "Il tuo obiettivo", lose: "−{kg} entro {month}", gain: "+{kg} entro {month}" },
    chart: { estimateAria: "Peso stimato: {from} ora, {to} intorno a {month}" },
  },
  signup: { heading: "Salva il tuo piano", line: "Così il tuo piano e il tuo abbonamento ti seguono su un nuovo telefono, e i tuoi pasti restano salvati." },
  referral: {
    ask: "Un amico ti ha mandato un link?",
    field: "Link d'invito di un amico",
    unknown: "Questo link non corrisponde a nessuno. Controllalo, o salta.",
    own: "È il tuo link. Qui va il link di un amico.",
    already: "Questo account si è già iscritto con il link di un amico.",
    paid: "I link d'invito sono per i nuovi iscritti, e questo account ha già acquistato eait.",
    tryAgain: "Riprova",
    skip: "Salta",
  },
  health: { title: "Sincronizza con Apple Health", body: "Peso e attività in entrata, pasti in uscita." },
  liveActivity: { titles: ["Domande", "Il tuo piano", "Quasi fatto"], go: "Continua" },
  firstMeal: {
    ask: "Un pasto lo offro io. Foto, o me lo racconti?",
    react: "Nessun problema. Prima provami",
    photo: "Scatta una foto",
    tell: "Raccontami cosa hai mangiato",
    keepGoing: "Avanti",
    correct: "Correggi il pasto",
    afterAsk: "Ecco il primo. Lo vuoi per ogni pasto?",
  },
  refusals: {
    invalid: {
      age: "Non sembra un'età — prova con qualcosa tipo 34.",
      height_cm: "In centimetri — qualcosa tipo 175.",
      weight_kg: "In chilogrammi — approssimare va bene.",
      target_weight_kg: "Un numero in kg — tipo 70.",
    },
    ambiguousAge: {
      line: "Voglio essere sicuro di aver letto bene — se intendevi l'anno {year}, mandami tutte e quattro le cifre.",
      confirm: "Ho {age} anni",
    },
    direction: {
      gain: "Sei a {weight}kg e chiedi di salire a {target} — da qui non è un aumento. Se l'obiettivo è cambiato possiamo invertirlo; altrimenti dammi un numero sopra {weight}.",
      lose: "Sei a {weight}kg e chiedi di scendere a {target} — da qui non è un calo. Se l'obiettivo è cambiato possiamo invertirlo; altrimenti dammi un numero sotto {weight}.",
      switchToLose: "Passa a perdere peso",
      switchToGain: "Passa a prendere peso",
      above: "Un numero sopra {weight}…",
      below: "Un numero sotto {weight}…",
    },
    switched: {
      gain: "Fatto, allora prendiamo peso. Dove ti piacerebbe arrivare, in kg?",
    },
  },
};

// ── Español ───────────────────────────────────────────────────────────────────────

const ES: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Empezar",
    signin: "Ya tengo una cuenta",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["¿Para qué estás aquí?"] } },
      options: {
        lose: { label: "Perder peso" },
        maintain: { label: "Mantener mi peso" },
        gain: { label: "Ganar peso" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["¿Cuál es tu sexo?"] } },
      options: { male: { label: "Hombre" }, female: { label: "Mujer" }, other: { label: "Otro" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["¿Tu edad?"], placeholder: "Tu edad" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Altura"], placeholder: "Altura en cm" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Tu peso"], placeholder: "Peso en kg" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["¿Cómo de activos son tus días?"] } },
      options: {
        none: { label: "0", hint: "Sin entrenamientos" },
        few: { label: "1–2", hint: "Algún entrenamiento de vez en cuando" },
        some: { label: "3–4", hint: "Unos entrenamientos a la semana" },
        many: { label: "5+", hint: "Entreno casi a diario" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["¿Cuál es tu peso objetivo?"], placeholder: "Peso objetivo en kg" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["¿A qué ritmo?"] } },
      options: {
        easy: { label: "Suave" },
        steady: { label: "Constante" },
        push: { label: "Rápido" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["¿Has contado calorías antes?"] } },
      options: {
        never: { label: "Nunca" },
        stopped: { label: "Lo intenté, lo dejé" },
        onoff: { label: "A ratos" },
        now: { label: "Las cuento ahora" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["¿Qué te hizo parar?", "Elige todas las que encajen"],
          variants: {
            onoff: ["¿Qué te lo puso difícil?", "Elige todas las que encajen"],
            now: ["¿Qué te gustaría que fuera más fácil?", "Elige todas las que encajen"],
          },
        },
      },
      options: {
        too_long: { label: "Llevaba demasiado tiempo" },
        forgot: { label: "Se me olvidaba" },
        invisible: { label: "No veía resultados" },
        no_idea: { label: "No sabía qué comer" },
        stressful: { label: "Me resultaba estresante" },
        nobody: { label: "Nadie a quien preguntar" },
        creeping: { label: "Mi peso volvía a subir" },
        not_enough: { label: "Me costaba comer suficiente" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["¿Cuándo es más difícil registrar?"],
          variants: { never: ["¿Cuándo crees que registrar será más difícil?"] },
        },
      },
      options: {
        workdays: { label: "Días de trabajo ajetreados" },
        eating_out: { label: "Comer fuera" },
        cooking: { label: "Cocinar para otros" },
        snacks: { label: "Snacks y bebidas" },
        evenings: { label: "Tardes y fines de semana" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["¿Sigues alguna dieta?"] } },
      options: {
        balanced: { label: "Equilibrada" },
        wholefood: { label: "Comida real" },
        mediterranean: { label: "Mediterránea" },
        flexitarian: { label: "Flexitariana" },
        pescatarian: { label: "Pescetariana" },
        vegetarian: { label: "Vegetariana" },
        vegan: { label: "Vegana" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["¿Alguna condición médica?"] } },
      options: {
        kidneys: { label: "Enfermedad renal" },
        ldl: { label: "Colesterol alto" },
        lowsugar: { label: "Riesgo de diabetes" },
        none: { label: "Ninguna de estas" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["¿Dónde comes?"], placeholder: "Buscar" } },
      enabled: true,
      options: { other: { label: "En otro sitio" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["¿Qué racha quieres lograr?"] } },
      options: {
        "7": { label: "7 días" },
        "14": { label: "14 días" },
        "30": { label: "30 días" },
        "50": { label: "50 días" },
      },
    },
  ],
  building: {
    lines: ["Creando tu plan personal"],
    title: "Tu plan diario",
    rows: {
      calories: "Calorías", protein: "Proteína", carbs: "Carbohidratos",
      fat: "Grasas", diet: "Dieta",
    },
    limitCap: { ldl: "grasas saturadas ≤ {n}g", kidneys: "sodio ≤ {n}mg" },
    cta: "Enséñame el plan",
    floorTitle: "Nos quedamos en {floor}kcal",
    floorBody: "El cálculo quería bajar más. Sin supervisión médica no fijamos objetivos por debajo de esto, así que el tuyo se queda aquí. Tu diario también lo dirá.",
  },
  summary: {
    lines: ["Aquí está tu plan"],
    kcalLabel: "kcal al día",
    floorMarker: "limitado por seguridad · nunca por debajo de {floor}",
    macros: {
      protein: "Proteína", carbs: "Carbohidratos", fat: "Grasas",
      satfat: "Grasas saturadas · lo pediste tú",
    },
    capNote: "Ese ritmo pediría un cambio diario mayor del que es seguro sostener, así que el tuyo es la versión segura: {share}% de lo que tu cuerpo quema en un día.",
    cta: "Fotografía tu primera comida",
  },
  ui: {
    continueLabel: "Continuar",
    saveKept: "No se pudo guardar. Tu respuesta sigue aquí. Con Continuar se envía otra vez.",
    idlePlaceholder: "Escribe a Spud…",
    optionContinues: "Selecciona y continúa",
    stepper: { continue: "Continuar", less: "Menos", more: "Más" },
    units: { years: "años", yearsCount: { one: "{n} año", other: "{n} años" } },
  },
  beats: {
    ageWhy: "Tu metabolismo cambia con la edad, y lo tenemos en cuenta",
    echo: { rest: "En reposo: {rest}kcal al día", days: "Tus días queman {burn}kcal" },
    baseline: { title: "Este es tu punto de partida", bmi: "IMC", what: "Índice de masa corporal" },
    prelim: { title: "Tu plan", burn: "Quemas", gap: "{delta} tu ritmo", eat: "Comes", perDay: "kcal al día", keepTitle: "Quemas unas {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · el mínimo que fijamos",
      now: "{weight} · ahora",
      nowLowest: "{weight} · ahora · el mínimo que fijamos",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Te sugiero {weight}, alrededor de un {pct}% menos — una buena primera meta", up: "Te sugiero {weight}, alrededor de un {pct}% más — una buena primera meta" },
  },
  pace: {
    rate: "{rate} a la semana",
    rateSuffix: "a la semana",
    result: "{target} hacia {month} · {kcal}kcal al día",
    echo: "De {from} a {to}.",
  },
  plan: {
    weightTitle: "Tu peso",
    everyDay: "Cada día",
    infoTitle: "Tus datos",
    basedOn: "Según tus respuestas",
    changeAnytime: "Puedes cambiarlo cuando quieras",
    goal: {
      lose: "Objetivo: −{kg} para {month}",
      gain: "Objetivo: +{kg} para {month}",
      maintain: "Objetivo: mantenerte en torno a {kg}",
      maintainRange: "Rango: {range}",
    },
    info: {
      startWeight: "Peso inicial", goalWeight: "Peso objetivo", activity: "Actividad",
      target: "Objetivo", targetLose: "−{kg} para {month}", targetGain: "+{kg} para {month}",
    },
    satFat: { label: "grasa sat.", asked: "Grasas saturadas · lo que pediste", perDay: "≤ {g} al día" },
    first: { title: "Tu primer paso", step: "Fotografía tu próxima comida. eait la compara con {kcal}kcal." },
    loader: { goal: "Tu objetivo", lose: "−{kg} para {month}", gain: "+{kg} para {month}" },
    chart: { estimateAria: "Peso estimado: {from} ahora, {to} hacia {month}" },
  },
  signup: { heading: "Guarda tu plan", line: "Así tu plan y tu suscripción te acompañan a un teléfono nuevo, y tus comidas se conservan." },
  referral: {
    ask: "¿Un amigo te envió un enlace?",
    field: "Enlace de invitación de un amigo",
    unknown: "Ese enlace no coincide con nadie. Revísalo, u omite este paso.",
    own: "Ese es tu propio enlace. Aquí va el enlace de un amigo.",
    already: "Esta cuenta ya se unió con el enlace de un amigo.",
    paid: "Los enlaces de invitación son para miembros nuevos, y esta cuenta ya compró eait.",
    tryAgain: "Reintentar",
    skip: "Omitir",
  },
  health: { title: "Sincronizar con Apple Health", body: "Entran tu peso y tu actividad; salen tus comidas." },
  liveActivity: { titles: ["Preguntas", "Tu plan", "Casi listo"], go: "Continuar" },
  firstMeal: {
    ask: "Una comida la invito yo. ¿Foto, o me lo cuentas?",
    react: "Sin problema. Pruébame primero",
    photo: "Hacer una foto",
    tell: "Contarme qué has comido",
    keepGoing: "Seguir",
    correct: "Corregir la comida",
    afterAsk: "Esa fue una. ¿La quieres para cada comida?",
  },
  refusals: {
    invalid: {
      age: "Eso no parece una edad — prueba con algo como 34.",
      height_cm: "En centímetros — algo como 175.",
      weight_kg: "En kilogramos — aproximado vale.",
      target_weight_kg: "Un número en kg — como 70.",
    },
    ambiguousAge: {
      line: "Quiero estar seguro de haberlo leído bien — si querías decir el año {year}, mándame las cuatro cifras.",
      confirm: "Tengo {age} años",
    },
    direction: {
      gain: "Estás en {weight}kg y pides subir hasta {target} — desde aquí eso no es subir. Si el objetivo ha cambiado, lo cambiamos; si no, dame un número por encima de {weight}.",
      lose: "Estás en {weight}kg y pides bajar hasta {target} — desde aquí eso no es bajar. Si el objetivo ha cambiado, lo cambiamos; si no, dame un número por debajo de {weight}.",
      switchToLose: "Cambiar a perder peso",
      switchToGain: "Cambiar a ganar peso",
      above: "Un número por encima de {weight}…",
      below: "Un número por debajo de {weight}…",
    },
    switched: {
      gain: "Cambiado — ganar, entonces. ¿Dónde te gustaría llegar, en kg?",
    },
  },
};

// ── Tiếng Việt ────────────────────────────────────────────────────────────────────

const VI: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Bắt đầu",
    signin: "Mình đã có tài khoản",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["Bạn đến đây để làm gì?"] } },
      options: {
        lose: { label: "Giảm cân" },
        maintain: { label: "Giữ cân nặng của mình" },
        gain: { label: "Tăng cân" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["Giới tính của bạn là gì?"] } },
      options: { male: { label: "Nam" }, female: { label: "Nữ" }, other: { label: "Khác" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["Tuổi của bạn?"], placeholder: "Tuổi của bạn" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Chiều cao"], placeholder: "Chiều cao (cm)" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Cân nặng của bạn"], placeholder: "Cân nặng (kg)" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["Ngày của bạn vận động thế nào?"] } },
      options: {
        none: { label: "0", hint: "Không tập" },
        few: { label: "1–2", hint: "Thỉnh thoảng tập" },
        some: { label: "3–4", hint: "Vài buổi tập mỗi tuần" },
        many: { label: "5+", hint: "Vận động viên thực thụ" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["Bạn nhắm đến mức cân nào?"], placeholder: "Cân nặng mục tiêu (kg)" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["Nhanh thế nào?"] } },
      options: {
        easy: { label: "Nhẹ nhàng" },
        steady: { label: "Đều đặn" },
        push: { label: "Nhanh" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Bạn đã từng đếm calo chưa?"] } },
      options: {
        never: { label: "Chưa bao giờ" },
        stopped: { label: "Đã thử, rồi bỏ" },
        onoff: { label: "Thỉnh thoảng" },
        now: { label: "Mình đang đếm" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Điều gì khiến bạn dừng lại?", "Chọn tất cả những gì đúng"],
          variants: {
            onoff: ["Điều gì đã cản trở bạn?", "Chọn tất cả những gì đúng"],
            now: ["Bạn muốn điều gì dễ hơn?", "Chọn tất cả những gì đúng"],
          },
        },
      },
      options: {
        too_long: { label: "Mất quá nhiều thời gian" },
        forgot: { label: "Mình hay quên" },
        invisible: { label: "Không thấy có kết quả" },
        no_idea: { label: "Không biết nên ăn gì" },
        stressful: { label: "Cảm thấy căng thẳng" },
        nobody: { label: "Không có ai để hỏi" },
        creeping: { label: "Cân nặng cứ tăng trở lại" },
        not_enough: { label: "Khó ăn đủ" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Khi nào ghi lại bữa ăn khó nhất?"],
          variants: { never: ["Bạn nghĩ khi nào ghi lại bữa ăn sẽ khó nhất?"] },
        },
      },
      options: {
        workdays: { label: "Ngày làm việc bận rộn" },
        eating_out: { label: "Ăn ngoài" },
        cooking: { label: "Nấu cho người khác" },
        snacks: { label: "Ăn vặt và đồ uống" },
        evenings: { label: "Buổi tối và cuối tuần" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["Bạn có theo chế độ ăn nào không?"] } },
      options: {
        balanced: { label: "Cân bằng" },
        wholefood: { label: "Thực phẩm toàn phần" },
        mediterranean: { label: "Địa Trung Hải" },
        flexitarian: { label: "Ăn chay linh hoạt" },
        pescatarian: { label: "Ăn chay có cá" },
        vegetarian: { label: "Ăn chay" },
        vegan: { label: "Thuần chay" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["Bạn có vấn đề sức khỏe nào cần lưu ý không?"] } },
      options: {
        kidneys: { label: "Bệnh thận" },
        ldl: { label: "Cholesterol cao" },
        lowsugar: { label: "Nguy cơ tiểu đường" },
        none: { label: "Không có gì trong số này" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["Bạn ăn ở đâu?"], placeholder: "Tìm kiếm" } },
      enabled: true,
      options: { other: { label: "Nơi khác" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["Bạn muốn đạt chuỗi bao nhiêu ngày?"] } },
      options: {
        "7": { label: "7 ngày" },
        "14": { label: "14 ngày" },
        "30": { label: "30 ngày" },
        "50": { label: "50 ngày" },
      },
    },
  ],
  building: {
    lines: ["Đang lập kế hoạch riêng cho bạn"],
    title: "Kế hoạch mỗi ngày của bạn",
    rows: {
      calories: "Calo", protein: "Đạm", carbs: "Tinh bột",
      fat: "Chất béo", diet: "Chế độ ăn",
    },
    limitCap: { ldl: "chất béo bão hòa ≤ {n}g", kidneys: "natri ≤ {n}mg" },
    cta: "Cho mình xem kế hoạch",
    floorTitle: "Dừng lại ở {floor}kcal",
    floorBody: "Phép tính muốn xuống thấp hơn. Không có bác sĩ theo dõi thì chúng mình không đặt mục tiêu thấp hơn mức này, nên của bạn dừng ở đây. Nhật ký cũng sẽ ghi vậy.",
  },
  summary: {
    lines: ["Kế hoạch của bạn đây"],
    kcalLabel: "kcal mỗi ngày",
    floorMarker: "đã giới hạn vì an toàn · không bao giờ dưới {floor}",
    macros: {
      protein: "Đạm", carbs: "Tinh bột", fat: "Chất béo",
      satfat: "Chất béo bão hòa · bạn đã chọn",
    },
    capNote: "Tốc độ đó cần mức thay đổi mỗi ngày lớn hơn mức an toàn để duy trì, nên bạn nhận bản an toàn: {share}% lượng cơ thể bạn đốt trong một ngày.",
    cta: "Chụp bữa ăn đầu tiên",
  },
  ui: {
    continueLabel: "Tiếp tục",
    saveKept: "Không lưu được. Câu trả lời của bạn vẫn còn đây. Bấm Tiếp tục để gửi lại.",
    idlePlaceholder: "Nhắn cho Spud…",
    optionContinues: "Chọn và tiếp tục",
    stepper: { continue: "Tiếp tục", less: "Bớt", more: "Thêm" },
    units: { years: "tuổi", yearsCount: { other: "{n} tuổi" } },
  },
  beats: {
    ageWhy: "Trao đổi chất thay đổi theo tuổi, nên chúng tôi tính cả điều đó",
    echo: { rest: "Lúc nghỉ: {rest}kcal một ngày", days: "Những ngày của bạn đốt {burn}kcal" },
    baseline: { title: "Đây là điểm xuất phát của bạn", bmi: "BMI", what: "Chỉ số khối cơ thể" },
    prelim: { title: "Kế hoạch của bạn", burn: "Bạn đốt", gap: "{delta} tốc độ của bạn", eat: "Bạn ăn", perDay: "kcal một ngày", keepTitle: "Bạn đốt khoảng {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · mức thấp nhất có thể đặt",
      now: "{weight} · hiện tại",
      nowLowest: "{weight} · hiện tại · mức thấp nhất có thể đặt",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Mình gợi ý {weight}, tức xuống khoảng {pct}% — một mục tiêu đầu tiên hợp lý", up: "Mình gợi ý {weight}, tức lên khoảng {pct}% — một mục tiêu đầu tiên hợp lý" },
  },
  pace: {
    rate: "{rate} một tuần",
    rateSuffix: "một tuần",
    result: "{target} vào khoảng {month} · {kcal}kcal một ngày",
    echo: "Từ {from} đến {to}.",
  },
  plan: {
    weightTitle: "Cân nặng của bạn",
    everyDay: "Mỗi ngày",
    infoTitle: "Thông tin của bạn",
    basedOn: "Dựa trên câu trả lời của bạn",
    changeAnytime: "Bạn có thể đổi bất cứ lúc nào",
    goal: {
      lose: "Mục tiêu: −{kg} trước {month}",
      gain: "Mục tiêu: +{kg} trước {month}",
      maintain: "Mục tiêu: giữ quanh {kg}",
      maintainRange: "Khoảng: {range}",
    },
    info: {
      startWeight: "Cân nặng ban đầu", goalWeight: "Cân nặng mục tiêu", activity: "Mức vận động",
      target: "Mục tiêu", targetLose: "−{kg} trước {month}", targetGain: "+{kg} trước {month}",
    },
    satFat: { label: "chất béo bão hòa", asked: "Chất béo bão hòa · bạn yêu cầu", perDay: "≤ {g} mỗi ngày" },
    first: { title: "Bước đầu tiên của bạn", step: "Chụp ảnh bữa ăn tiếp theo. eait sẽ đối chiếu nó với {kcal}kcal." },
    loader: { goal: "Mục tiêu của bạn", lose: "−{kg} trước {month}", gain: "+{kg} trước {month}" },
    chart: { estimateAria: "Cân nặng ước tính: {from} hiện tại, {to} vào khoảng {month}" },
  },
  signup: { heading: "Lưu gói của bạn", line: "Để gói và đăng ký của bạn đi theo bạn sang điện thoại mới, và các bữa ăn của bạn được giữ lại." },
  referral: {
    ask: "Bạn bè có gửi bạn liên kết không?",
    field: "Liên kết mời của bạn bè",
    unknown: "Liên kết này không khớp với ai. Hãy kiểm tra lại, hoặc bỏ qua.",
    own: "Đây là liên kết của chính bạn. Hãy dán liên kết của bạn bè vào đây.",
    already: "Tài khoản này đã tham gia bằng liên kết của một người bạn.",
    paid: "Liên kết mời dành cho thành viên mới, và tài khoản này đã mua eait.",
    tryAgain: "Thử lại",
    skip: "Bỏ qua",
  },
  health: { title: "Đồng bộ với Apple Health", body: "Nhận cân nặng và vận động, gửi bữa ăn sang Health." },
  liveActivity: { titles: ["Câu hỏi", "Kế hoạch", "Sắp xong"], go: "Tiếp tục" },
  firstMeal: {
    ask: "Một bữa mình mời. Chụp ảnh, hay kể cho mình nghe?",
    react: "Không sao. Cứ thử mình trước",
    photo: "Chụp ảnh",
    tell: "Kể cho mình bạn đã ăn gì",
    keepGoing: "Tiếp tục",
    correct: "Sửa bữa ăn",
    afterAsk: "Vừa rồi là một bữa. Muốn vậy cho mọi bữa không?",
  },
  refusals: {
    invalid: {
      age: "Cái đó trông không giống một số tuổi — thử kiểu như 34 xem.",
      height_cm: "Tính bằng cm — kiểu như 175.",
      weight_kg: "Tính bằng kg — áng chừng là được.",
      target_weight_kg: "Một số tính bằng kg — ví dụ 70.",
    },
    ambiguousAge: {
      line: "Mình muốn chắc là đọc đúng — nếu ý bạn là năm {year}, gửi đủ bốn chữ số nhé.",
      confirm: "Mình {age} tuổi",
    },
    direction: {
      gain: "Bạn đang ở {weight}kg mà lại muốn tăng lên {target} — từ đây thì đó không phải là tăng. Nếu mục tiêu đã đổi, chúng mình đổi theo; còn không thì cho mình một số trên {weight}.",
      lose: "Bạn đang ở {weight}kg mà lại muốn giảm xuống {target} — từ đây thì đó không phải là giảm. Nếu mục tiêu đã đổi, chúng mình đổi theo; còn không thì cho mình một số dưới {weight}.",
      switchToLose: "Chuyển sang giảm cân",
      switchToGain: "Chuyển sang tăng cân",
      above: "Một số trên {weight}…",
      below: "Một số dưới {weight}…",
    },
    switched: {
      gain: "Đã chuyển — vậy là tăng cân. Bạn muốn về mức nào, tính bằng kg?",
    },
  },
};

// ── Bahasa Indonesia ──────────────────────────────────────────────────────────────

const ID: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Mulai",
    signin: "Aku sudah punya akun",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["Kamu ke sini untuk apa?"] } },
      options: {
        lose: { label: "Menurunkan berat badan" },
        maintain: { label: "Jaga berat badan aku" },
        gain: { label: "Menaikkan berat badan" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["Apa jenis kelaminmu?"] } },
      options: { male: { label: "Laki-laki" }, female: { label: "Perempuan" }, other: { label: "Lainnya" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["Umurmu?"], placeholder: "Umurmu" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Tinggi badan"], placeholder: "Tinggi dalam cm" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Berat badanmu"], placeholder: "Berat dalam kg" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["Seberapa aktif harimu?"] } },
      options: {
        none: { label: "0", hint: "Tidak olahraga" },
        few: { label: "1–2", hint: "Olahraga sesekali" },
        some: { label: "3–4", hint: "Beberapa kali olahraga seminggu" },
        many: { label: "5+", hint: "Atlet / latihan serius" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["Berat badan berapa yang kamu tuju?"], placeholder: "Berat target dalam kg" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["Seberapa cepat?"] } },
      options: {
        easy: { label: "Santai" },
        steady: { label: "Stabil" },
        push: { label: "Cepat" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Pernah hitung kalori?"] } },
      options: {
        never: { label: "Belum pernah" },
        stopped: { label: "Pernah, lalu berhenti" },
        onoff: { label: "Kadang-kadang" },
        now: { label: "Aku masih menghitung" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Apa yang membuatmu berhenti?", "Pilih semua yang cocok"],
          variants: {
            onoff: ["Apa yang menghalangimu?", "Pilih semua yang cocok"],
            now: ["Apa yang ingin kamu permudah?", "Pilih semua yang cocok"],
          },
        },
      },
      options: {
        too_long: { label: "Terlalu lama" },
        forgot: { label: "Sering lupa" },
        invisible: { label: "Tidak kelihatan hasilnya" },
        no_idea: { label: "Tidak tahu mau makan apa" },
        stressful: { label: "Terasa stres" },
        nobody: { label: "Tidak ada yang bisa ditanya" },
        creeping: { label: "Beratku naik lagi pelan-pelan" },
        not_enough: { label: "Susah makan cukup" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kapan mencatat paling susah?"],
          variants: { never: ["Menurutmu kapan mencatat akan paling susah?"] },
        },
      },
      options: {
        workdays: { label: "Hari kerja yang sibuk" },
        eating_out: { label: "Makan di luar" },
        cooking: { label: "Masak untuk orang lain" },
        snacks: { label: "Camilan dan minuman" },
        evenings: { label: "Malam dan akhir pekan" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["Apakah kamu menjalani diet?"] } },
      options: {
        balanced: { label: "Seimbang" },
        wholefood: { label: "Makanan utuh" },
        mediterranean: { label: "Mediterania" },
        flexitarian: { label: "Fleksitarian" },
        pescatarian: { label: "Peskatarian" },
        vegetarian: { label: "Vegetarian" },
        vegan: { label: "Vegan" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["Ada batasan medis?"] } },
      options: {
        kidneys: { label: "Penyakit ginjal" },
        ldl: { label: "Kolesterol tinggi" },
        lowsugar: { label: "Risiko diabetes" },
        none: { label: "Tidak ada" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["Kamu makan di mana?"], placeholder: "Cari" } },
      enabled: true,
      options: { other: { label: "Di tempat lain" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["Mau target streak berapa hari?"] } },
      options: {
        "7": { label: "7 hari" },
        "14": { label: "14 hari" },
        "30": { label: "30 hari" },
        "50": { label: "50 hari" },
      },
    },
  ],
  building: {
    lines: ["Menyusun rencana pribadimu"],
    title: "Rencana harianmu",
    rows: {
      calories: "Kalori", protein: "Protein", carbs: "Karbohidrat",
      fat: "Lemak", diet: "Diet",
    },
    limitCap: { ldl: "lemak jenuh ≤ {n}g", kidneys: "natrium ≤ {n}mg" },
    cta: "Tunjukkan rencananya",
    floorTitle: "Kami berhenti di {floor}kcal",
    floorBody: "Hitungannya mengarah lebih rendah lagi. Tanpa pengawasan medis kami tidak menetapkan target di bawah ini, jadi punyamu berhenti di sini. Buku harianmu juga akan menyebutkannya.",
  },
  summary: {
    lines: ["Ini rencanamu"],
    kcalLabel: "kcal per hari",
    floorMarker: "dibatasi demi keamanan · tidak pernah di bawah {floor}",
    macros: {
      protein: "Protein", carbs: "Karbohidrat", fat: "Lemak",
      satfat: "Lemak jenuh · kamu yang minta",
    },
    capNote: "Tempo itu butuh selisih harian yang terlalu besar untuk dijaga dengan aman, jadi rencanamu memakai versi aman: {share}% dari kalori yang dibakar tubuhmu dalam sehari.",
    cta: "Foto makanan pertamamu",
  },
  ui: {
    continueLabel: "Lanjutkan",
    saveKept: "Tidak bisa disimpan. Jawabanmu masih di sini. Lanjutkan akan mengirimnya lagi.",
    idlePlaceholder: "Kirim pesan ke Spud…",
    optionContinues: "Pilih dan lanjutkan",
    stepper: { continue: "Lanjut", less: "Kurangi", more: "Tambah" },
    units: { years: "tahun", yearsCount: { other: "{n} tahun" } },
  },
  beats: {
    ageWhy: "Metabolismemu berubah seiring usia, jadi kami memperhitungkannya",
    echo: { rest: "Saat istirahat: {rest}kcal sehari", days: "Harimu membakar {burn}kcal" },
    baseline: { title: "Ini titik awalmu", bmi: "IMT", what: "Indeks massa tubuh" },
    prelim: { title: "Rencanamu", burn: "Kamu membakar", gap: "{delta} tempomu", eat: "Kamu makan", perDay: "kcal sehari", keepTitle: "Kamu membakar sekitar {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · batas terendah kami",
      now: "{weight} · sekarang",
      nowLowest: "{weight} · sekarang · batas terendah kami",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Kusarankan {weight}, turun sekitar {pct}% — target pertama yang bagus", up: "Kusarankan {weight}, naik sekitar {pct}% — target pertama yang bagus" },
  },
  pace: {
    rate: "{rate} seminggu",
    rateSuffix: "seminggu",
    result: "{target} sekitar {month} · {kcal}kcal sehari",
    echo: "Dari {from} ke {to}.",
  },
  plan: {
    weightTitle: "Berat badanmu",
    everyDay: "Setiap hari",
    infoTitle: "Data dirimu",
    basedOn: "Berdasarkan jawabanmu",
    changeAnytime: "Kamu bisa mengubahnya kapan saja",
    goal: {
      lose: "Target: −{kg} sebelum {month}",
      gain: "Target: +{kg} sebelum {month}",
      maintain: "Target: tetap di sekitar {kg}",
      maintainRange: "Rentang: {range}",
    },
    info: {
      startWeight: "Berat awal", goalWeight: "Berat target", activity: "Aktivitas",
      target: "Target", targetLose: "−{kg} sebelum {month}", targetGain: "+{kg} sebelum {month}",
    },
    satFat: { label: "lemak jenuh", asked: "Lemak jenuh · permintaanmu", perDay: "≤ {g} sehari" },
    first: { title: "Langkah pertamamu", step: "Foto makananmu berikutnya. eait memeriksanya terhadap {kcal}kkal." },
    loader: { goal: "Tujuanmu", lose: "−{kg} sebelum {month}", gain: "+{kg} sebelum {month}" },
    chart: { estimateAria: "Perkiraan berat: {from} sekarang, {to} sekitar {month}" },
  },
  signup: { heading: "Simpan paketmu", line: "Agar paket dan langgananmu mengikutimu ke ponsel baru, dan makananmu tetap tersimpan." },
  referral: {
    ask: "Ada teman yang mengirimimu tautan?",
    field: "Tautan undangan teman",
    unknown: "Tautan itu tidak cocok dengan siapa pun. Periksa lagi, atau lewati.",
    own: "Itu tautanmu sendiri. Tautan teman ditaruh di sini.",
    already: "Akun ini sudah bergabung dengan tautan teman.",
    paid: "Tautan undangan untuk anggota baru, dan akun ini sudah membeli eait.",
    tryAgain: "Coba lagi",
    skip: "Lewati",
  },
  health: { title: "Sinkronkan dengan Apple Health", body: "Berat badan dan aktivitas masuk ke eait, makanan dikirim ke Kesehatan." },
  liveActivity: { titles: ["Pertanyaan", "Rencanamu", "Hampir selesai"], go: "Lanjutkan" },
  firstMeal: {
    ask: "Satu makanan aku yang traktir. Foto, atau ceritakan saja?",
    react: "Tidak apa-apa. Coba aku dulu",
    photo: "Ambil foto",
    tell: "Ceritakan padaku apa yang kamu makan",
    keepGoing: "Lanjut",
    correct: "Koreksi makanan",
    afterAsk: "Itu baru satu. Mau begini untuk setiap makanan?",
  },
  refusals: {
    invalid: {
      age: "Itu tidak kelihatan seperti umur — coba seperti 34.",
      height_cm: "Dalam sentimeter — seperti 175.",
      weight_kg: "Dalam kilogram — kira-kira saja tidak apa-apa.",
      target_weight_kg: "Angka dalam kg — misalnya 70.",
    },
    ambiguousAge: {
      line: "Aku mau pastikan tidak salah baca — kalau maksudmu tahun {year}, kirim keempat angkanya.",
      confirm: "Umurku {age}",
    },
    direction: {
      gain: "Kamu di {weight}kg dan minta naik ke {target} — dari sini itu bukan kenaikan. Kalau tujuannya berubah, kita bisa ganti; kalau tidak, beri aku angka di atas {weight}.",
      lose: "Kamu di {weight}kg dan minta turun ke {target} — dari sini itu bukan penurunan. Kalau tujuannya berubah, kita bisa ganti; kalau tidak, beri aku angka di bawah {weight}.",
      switchToLose: "Ganti ke menurunkan",
      switchToGain: "Ganti ke menaikkan",
      above: "Angka di atas {weight}…",
      below: "Angka di bawah {weight}…",
    },
    switched: {
      gain: "Diganti — jadi menaikkan. Kamu ingin sampai di angka berapa, dalam kg?",
    },
  },
};

// ── Русский ───────────────────────────────────────────────────────────────────────

const RU: OnboardingContent = {
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Начать",
    signin: "У меня уже есть аккаунт",
  },
  screens: [
    {
      id: "goal",
      asks: { goal: { lines: ["Какая у тебя цель?"] } },
      options: {
        lose: { label: "Похудеть" },
        maintain: { label: "Сохранить вес" },
        gain: { label: "Набрать вес" },
      },
    },
    {
      id: "sex",
      asks: { sex: { lines: ["Твой пол?"] } },
      options: { male: { label: "Мужской" }, female: { label: "Женский" }, other: { label: "Другой" } },
    },
    {
      id: "age",
      asks: { birth_year: { lines: ["Твой возраст?"], placeholder: "Твой возраст" } },
    },
    {
      id: "height",
      asks: { height_cm: { lines: ["Рост"], placeholder: "Рост в см" } },
    },
    {
      id: "weight",
      asks: { weight_kg: { lines: ["Твой вес"], placeholder: "Вес в кг" } },
    },
    {
      id: "activity",
      asks: { activity: { lines: ["Насколько активны твои дни?"] } },
      options: {
        none: { label: "0", hint: "Без тренировок" },
        few: { label: "1–2", hint: "Тренировки время от времени" },
        some: { label: "3–4", hint: "Несколько тренировок в неделю" },
        many: { label: "5+", hint: "Почти каждый день" },
      },
    },
    {
      id: "target",
      asks: { target_weight_kg: { lines: ["К какому весу ты хочешь прийти?"], placeholder: "Целевой вес в кг" } },
    },
    {
      id: "pace",
      asks: { pace: { lines: ["В каком темпе?"] } },
      options: {
        easy: { label: "Мягкий" },
        steady: { label: "Ровный" },
        push: { label: "Быстрый" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Доводилось считать калории?"] } },
      options: {
        never: { label: "Ни разу" },
        stopped: { label: "Раньше да, теперь нет" },
        onoff: { label: "С перерывами" },
        now: { label: "Считаю сейчас" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Что тебя остановило?", "Выбери всё, что подходит"],
          variants: {
            onoff: ["Что тебе мешало?", "Выбери всё, что подходит"],
            now: ["Что было бы проще?", "Выбери всё, что подходит"],
          },
        },
      },
      options: {
        too_long: { label: "Это занимало слишком много времени" },
        forgot: { label: "Вылетало из головы" },
        invisible: { label: "Не было видно результата" },
        no_idea: { label: "Было непонятно, что есть" },
        stressful: { label: "Это напрягало" },
        nobody: { label: "Некого было спросить" },
        creeping: { label: "Вес всё время возвращался" },
        not_enough: { label: "Трудно было съедать достаточно" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Когда сложнее всего записывать?"],
          variants: { never: ["Как думаешь, когда записывать будет сложнее всего?"] },
        },
      },
      options: {
        workdays: { label: "Загруженные будни" },
        eating_out: { label: "Еда вне дома" },
        cooking: { label: "Готовка для других" },
        snacks: { label: "Перекусы и напитки" },
        evenings: { label: "Вечера и выходные" },
      },
    },
    {
      id: "diet",
      asks: { diet: { lines: ["Ты придерживаешься какой-то диеты?"] } },
      options: {
        balanced: { label: "Сбалансированная" },
        wholefood: { label: "Цельные продукты" },
        mediterranean: { label: "Средиземноморская" },
        flexitarian: { label: "Флекситарианская" },
        pescatarian: { label: "Пескетарианская" },
        vegetarian: { label: "Вегетарианская" },
        vegan: { label: "Веганская" },
      },
    },
    {
      id: "medical",
      asks: { medical: { lines: ["Есть ли медицинские ограничения?"] } },
      options: {
        kidneys: { label: "Заболевание почек" },
        ldl: { label: "Высокий холестерин" },
        lowsugar: { label: "Риск диабета" },
        none: { label: "Ничего из этого" },
      },
    },
    {
      id: "country",
      asks: { country: { lines: ["Где ты ешь?"], placeholder: "Поиск" } },
      enabled: true,
      options: { other: { label: "Где-то ещё" } },
    },
    {
      id: "streak",
      asks: { streak_goal_days: { lines: ["На какую серию настроимся?"] } },
      options: {
        "7": { label: "7 дн." },
        "14": { label: "14 дн." },
        "30": { label: "30 дн." },
        "50": { label: "50 дн." },
      },
    },
  ],
  building: {
    lines: ["Составляю твой личный план"],
    title: "Твой план на день",
    rows: {
      calories: "Калории", protein: "Белок", carbs: "Углеводы",
      fat: "Жиры", diet: "Диета",
    },
    limitCap: { ldl: "насыщенные жиры ≤ {n}г", kidneys: "натрий ≤ {n}мг" },
    cta: "Показать план",
    floorTitle: "Мы остановились на {floor}ккал",
    floorBody: "Расчёт хотел уйти ниже. Без наблюдения врача мы не ставим цели ниже этой отметки, так что твоя — здесь. В дневнике это тоже будет написано.",
  },
  summary: {
    lines: ["Вот твой план"],
    kcalLabel: "ккал в день",
    floorMarker: "ограничено ради безопасности · никогда ниже {floor}",
    macros: {
      protein: "Белок", carbs: "Углеводы", fat: "Жиры",
      satfat: "Насыщенные жиры · по твоему запросу",
    },
    capNote: "Такой темп потребовал бы большей дневной разницы, чем безопасно выдерживать, так что у тебя безопасный вариант: {share}% от того, что тело сжигает за день.",
    cta: "Сфотографируй первый приём пищи",
  },
  ui: {
    continueLabel: "Продолжить",
    saveKept: "Не удалось сохранить. Твой ответ всё ещё здесь. «Продолжить» отправит его снова.",
    idlePlaceholder: "Написать Spud…",
    optionContinues: "Выбирает и продолжает",
    stepper: { continue: "Продолжить", less: "Меньше", more: "Больше" },
    units: { years: "лет", yearsCount: { one: "{n} год", few: "{n} года", many: "{n} лет", other: "{n} года" } },
  },
  beats: {
    ageWhy: "С возрастом обмен веществ меняется, мы это учитываем",
    echo: { rest: "В покое: {rest}ккал в день", days: "Твои дни сжигают {burn}ккал" },
    baseline: { title: "Вот твоя точка отсчёта", bmi: "ИМТ", what: "Индекс массы тела" },
    prelim: { title: "Твой план", burn: "Ты сжигаешь", gap: "{delta} твой темп", eat: "Ты ешь", perDay: "ккал в день", keepTitle: "Ты сжигаешь около {burn}ккал" },
  },
  target: {
    markers: {
      lowest: "{weight} · минимум, который мы задаём",
      now: "{weight} · сейчас",
      nowLowest: "{weight} · сейчас · минимум, который мы задаём",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Предлагаю {weight} — примерно на {pct}% меньше, хорошая первая цель", up: "Предлагаю {weight} — примерно на {pct}% больше, хорошая первая цель" },
  },
  pace: {
    rate: "{rate} в неделю",
    rateSuffix: "в неделю",
    result: "{target} · ориентир — {month} · {kcal}ккал в день",
    echo: "С {from} до {to}.",
  },
  plan: {
    weightTitle: "Твой вес",
    everyDay: "Каждый день",
    infoTitle: "Твои данные",
    basedOn: "По твоим ответам",
    changeAnytime: "Это можно изменить в любой момент",
    goal: {
      lose: "Цель: −{kg} · ориентир — {month}",
      gain: "Цель: +{kg} · ориентир — {month}",
      maintain: "Цель: держаться около {kg}",
      maintainRange: "Диапазон: {range}",
    },
    info: {
      startWeight: "Начальный вес", goalWeight: "Целевой вес", activity: "Активность",
      target: "Цель", targetLose: "−{kg} · ориентир — {month}", targetGain: "+{kg} · ориентир — {month}",
    },
    satFat: { label: "насыщ. жиры", asked: "Насыщенные жиры · твой запрос", perDay: "≤ {g} в день" },
    first: { title: "Твой первый шаг", step: "Сфотографируй следующий приём пищи. eait сверит его с {kcal}ккал." },
    loader: { goal: "Твоя цель", lose: "−{kg} · ориентир — {month}", gain: "+{kg} · ориентир — {month}" },
    chart: { estimateAria: "Оценка веса: {from} сейчас, {to} — {month}" },
  },
  signup: { heading: "Сохрани свой план", line: "Так твой план и подписка переедут с тобой на новый телефон, а приёмы пищи сохранятся." },
  referral: {
    ask: "Друг прислал тебе ссылку?",
    field: "Ссылка-приглашение от друга",
    unknown: "Эта ссылка ни с кем не совпадает. Проверь её или пропусти.",
    own: "Это твоя собственная ссылка. Сюда — ссылку друга.",
    already: "Этот аккаунт уже присоединился по ссылке друга.",
    paid: "Ссылки-приглашения — для новых участников, а покупка eait на этом аккаунте уже есть.",
    tryAgain: "Попробовать снова",
    skip: "Пропустить",
  },
  health: { title: "Синхронизация с Apple Health", body: "Вес и активность — из «Здоровья», приёмы пищи — в «Здоровье»." },
  liveActivity: { titles: ["Вопросы", "Твой план", "Почти готово"], go: "Продолжить" },
  firstMeal: {
    ask: "Один приём пищи — за мой счёт. Фото или просто расскажешь?",
    react: "Без проблем. Сначала испытай меня",
    photo: "Сделать фото",
    tell: "Рассказать мне, что было на тарелке",
    keepGoing: "Дальше",
    correct: "Исправить",
    afterAsk: "Это был первый. Хочешь так с каждым приёмом пищи?",
  },
  refusals: {
    invalid: {
      age: "На возраст не похоже — попробуй что-то вроде 34.",
      height_cm: "В сантиметрах — что-то вроде 175.",
      weight_kg: "В килограммах — можно примерно.",
      target_weight_kg: "Число в кг — например 70.",
    },
    ambiguousAge: {
      line: "Хочу убедиться, что понял правильно: если речь про {year} год, пришли все четыре цифры.",
      confirm: "Мне {age}",
    },
    direction: {
      gain: "Сейчас у тебя {weight}кг, а цель — {target}: это не набор веса. Если цель поменялась, можем переключить; иначе дай число больше {weight}.",
      lose: "Сейчас у тебя {weight}кг, а цель — {target}: это не снижение веса. Если цель поменялась, можем переключить; иначе дай число меньше {weight}.",
      switchToLose: "Переключить на похудение",
      switchToGain: "Переключить на набор",
      above: "Число больше {weight}…",
      below: "Число меньше {weight}…",
    },
    switched: {
      gain: "Переключил — значит набираем. Куда хочешь прийти, в кг?",
    },
  },
};

const TE: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "ప్రారంభించండి",
    signin: "నాకు ఇప్పటికే ఖాతా ఉంది",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["మీరు ఇక్కడ ఏం చేయాలనుకుంటున్నారు?"] },
      },
      options: {
        lose: { label: "బరువు తగ్గడం" },
        maintain: { label: "బరువు నిలుపుకోవడం" },
        gain: { label: "బరువు పెరగడం" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["మీ లింగం ఏమిటి?"] },
      },
      options: {
        male: { label: "పురుషుడు" },
        female: { label: "స్త్రీ" },
        other: { label: "ఇతర" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["మీ వయసు?"],
          placeholder: "మీ వయసు",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ఎత్తు"],
          placeholder: "ఎత్తు cmలో",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["మీ బరువు"],
          placeholder: "బరువు kgలో",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["మీ రోజులు ఎంత చురుకుగా ఉంటాయి?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "వర్కౌట్‌లు లేవు" },
        few: { label: "1–2", hint: "అప్పుడప్పుడు వర్కౌట్‌లు" },
        some: { label: "3–4", hint: "వారానికి కొన్ని వర్కౌట్‌లు" },
        many: { label: "5+", hint: "అంకితభావం గల అథ్లెట్" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["మీరు ఏ బరువును లక్ష్యంగా పెట్టుకున్నారు?"],
          placeholder: "లక్ష్య బరువు kgలో",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["ఎంత వేగంగా?"] },
      },
      options: {
        easy: { label: "తేలికైన" },
        steady: { label: "స్థిరమైన" },
        push: { label: "చురుకైన" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["ఇంతకు ముందు కేలరీలు లెక్కించారా?"] } },
      options: {
        never: { label: "ఎప్పుడూ లేదు" },
        stopped: { label: "ప్రయత్నించాను, ఆపేశాను" },
        onoff: { label: "అప్పుడప్పుడు" },
        now: { label: "ఇప్పుడు లెక్కిస్తున్నాను" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["ఏది మిమ్మల్ని ఆపింది?", "సరిపోయినవన్నీ ఎంచుకోండి"],
          variants: {
            onoff: ["ఏది అడ్డం వచ్చింది?", "సరిపోయినవన్నీ ఎంచుకోండి"],
            now: ["ఏది సులభంగా ఉండాలనుకుంటున్నారు?", "సరిపోయినవన్నీ ఎంచుకోండి"],
          },
        },
      },
      options: {
        too_long: { label: "చాలా సమయం పట్టేది" },
        forgot: { label: "మర్చిపోయేదాన్ని" },
        invisible: { label: "ఫలితం కనిపించేది కాదు" },
        no_idea: { label: "ఏమి తినాలో తెలియేది కాదు" },
        stressful: { label: "ఒత్తిడిగా అనిపించేది" },
        nobody: { label: "అడిగేందుకు ఎవరూ లేరు" },
        creeping: { label: "నా బరువు మళ్లీ పెరుగుతూనే ఉండేది" },
        not_enough: { label: "సరిపోనంత తినడం కష్టం" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["ఎప్పుడు నమోదు చేయడం కష్టమవుతుంది?"],
          variants: { never: ["ఎప్పుడు నమోదు చేయడం కష్టమవుతుందని అనుకుంటున్నారు?"] },
        },
      },
      options: {
        workdays: { label: "బిజీగా ఉండే పని దినాలు" },
        eating_out: { label: "బయట తినడం" },
        cooking: { label: "ఇతరుల కోసం వంట చేయడం" },
        snacks: { label: "స్నాక్స్ మరియు పానీయాలు" },
        evenings: { label: "సాయంత్రాలు మరియు వారాంతాలు" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["మీరు ఏదైనా డైట్ పాటిస్తారా?"] },
      },
      options: {
        balanced: { label: "సమతుల్య" },
        wholefood: { label: "సంపూర్ణ ఆహారం" },
        mediterranean: { label: "మెడిటరేనియన్" },
        flexitarian: { label: "ఫ్లెక్సిటేరియన్" },
        pescatarian: { label: "పెస్కటేరియన్" },
        vegetarian: { label: "శాకాహారం" },
        vegan: { label: "వీగన్" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["ఏవైనా వైద్యపరమైన పరిమితులు?"] },
      },
      options: {
        kidneys: { label: "కిడ్నీ సమస్య" },
        ldl: { label: "అధిక కొలెస్ట్రాల్" },
        lowsugar: { label: "డయాబెటిస్ ప్రమాదం" },
        none: { label: "వీటిలో ఏదీ కాదు" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["మీరు ఎక్కడ తింటారు?"], placeholder: "వెతకండి" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "మరెక్కడైనా" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["లక్ష్యంగా ఒక స్ట్రీక్‌ను ఎంచుకోండి"] },
      },
      options: {
        "7": { label: "7 రోజులు" },
        "14": { label: "14 రోజులు" },
        "30": { label: "30 రోజులు" },
        "50": { label: "50 రోజులు" },
      },
    },
  ],
  building: {
    lines: ["మీ వ్యక్తిగత ప్లాన్ రూపొందుతోంది"],
    title: "మీ రోజువారీ ప్లాన్",
    rows: { calories: "కేలరీలు", protein: "ప్రోటీన్", carbs: "కార్బ్స్", fat: "కొవ్వు", diet: "డైట్" },
    limitCap: { ldl: "సంతృప్త కొవ్వు ≤ {n} g", kidneys: "సోడియం ≤ {n} mg" },
    cta: "ప్లాన్ చూపించండి",
    floorTitle: "{floor}kcal వద్ద ఆపాము",
    floorBody: "లెక్క ఇంకా తక్కువకు వెళ్లాలనుకుంది. వైద్య పర్యవేక్షణ లేకుండా దీని కంటే తక్కువ లక్ష్యాలను మేము పెట్టము, అందుకే మీది ఇక్కడే ఉంది. మీ డైరీలో కూడా ఇదే చెబుతుంది.",
  },
  summary: {
    lines: ["ఇదే మీ ప్లాన్"],
    kcalLabel: "రోజుకు kcal",
    floorMarker: "భద్రత కోసం పరిమితం · ఎప్పుడూ {floor} కంటే తక్కువ కాదు",
    macros: {
      protein: "ప్రోటీన్",
      carbs: "కార్బ్స్",
      fat: "కొవ్వు",
      satfat: "సంతృప్త కొవ్వు · మీరు అడిగారు",
    },
    capNote: "ఆ వేగానికి సురక్షితంగా కొనసాగించగలిగే దానికంటే పెద్ద రోజువారీ మార్పు అవసరం, అందుకే మీది సురక్షిత వెర్షన్: మీ శరీరం రోజులో ఖర్చు చేసే దానిలో {share}%.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "మీ మొదటి భోజనాన్ని ఫోటో తీయండి",
  },
  ui: {
    continueLabel: "కొనసాగించండి",
    saveKept: "అది సేవ్ కాలేదు. మీ సమాధానం ఇంకా ఇక్కడే ఉంది. \"కొనసాగించండి\" నొక్కితే అది మళ్ళీ పంపబడుతుంది.",
    idlePlaceholder: "Spudకు మెసేజ్ పంపండి…",
    optionContinues: "Selects and continues",
    stepper: { continue: "కొనసాగించండి", less: "తక్కువ", more: "ఎక్కువ" },
    units: { years: "ఏళ్లు", yearsCount: { one: "{n} ఏడాది", other: "{n} ఏళ్లు" } },
  },
  beats: {
    ageWhy: "వయసుతో పాటు మీ జీవక్రియ మారుతుంది, అందుకే దాన్ని లెక్కలోకి తీసుకుంటాం",
    echo: { rest: "విశ్రాంతిలో: రోజుకు {rest}kcal", days: "మీ రోజులు {burn}kcal ఖర్చు చేస్తాయి" },
    baseline: { title: "ఇదే మీ ప్రారంభ స్థాయి", bmi: "BMI", what: "బాడీ మాస్ ఇండెక్స్" },
    prelim: { title: "మీ ప్రణాళిక", burn: "మీరు ఖర్చు చేసేది", gap: "{delta} మీ వేగం", eat: "మీరు తింటారు", perDay: "kcal రోజుకు", keepTitle: "మీరు సుమారు {burn}kcal ఖర్చు చేస్తారు" },
  },
  target: {
    markers: {
      lowest: "{weight} · మేము పెట్టే కనిష్ఠం",
      now: "{weight} · ఇప్పుడు",
      nowLowest: "{weight} · ఇప్పుడు · మేము పెట్టే కనిష్ఠం",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "{weight} సూచిస్తున్నాను, సుమారు {pct}% తక్కువ, మంచి మొదటి లక్ష్యం", up: "{weight} సూచిస్తున్నాను, సుమారు {pct}% ఎక్కువ, మంచి మొదటి లక్ష్యం" },
  },
  pace: {
    rate: "వారానికి {rate}",
    rateSuffix: "వారానికి",
    result: "సుమారు {month} నాటికి {target} · రోజుకు {kcal}kcal",
    echo: "{from} నుండి {to} వరకు.",
  },
  plan: {
    weightTitle: "మీ బరువు",
    everyDay: "ప్రతిరోజూ",
    infoTitle: "మీ సమాచారం",
    basedOn: "మీ సమాధానాల ఆధారంగా",
    changeAnytime: "దీన్ని ఎప్పుడైనా మార్చవచ్చు",
    goal: {
      lose: "లక్ష్యం: −{kg} · {month} నాటికి",
      gain: "లక్ష్యం: +{kg} · {month} నాటికి",
      maintain: "లక్ష్యం: సుమారు {kg} వద్ద ఉండటం",
      maintainRange: "పరిధి: {range}",
    },
    info: {
      startWeight: "మొదటి బరువు", goalWeight: "లక్ష్య బరువు", activity: "కార్యకలాపం",
      target: "లక్ష్యం", targetLose: "−{kg} · {month} నాటికి", targetGain: "+{kg} · {month} నాటికి",
    },
    satFat: { label: "సంతృప్త కొవ్వు", asked: "సంతృప్త కొవ్వు · మీరు అడిగారు", perDay: "రోజుకు ≤ {g}" },
    first: { title: "మీ మొదటి అడుగు", step: "మీ తదుపరి భోజనాన్ని ఫోటో తీయండి. eait దాన్ని {kcal}kcalతో పోలుస్తుంది." },
    loader: { goal: "మీ లక్ష్యం", lose: "−{kg} · {month} నాటికి", gain: "+{kg} · {month} నాటికి" },
    chart: { estimateAria: "అంచనా బరువు: ఇప్పుడు {from}, సుమారు {month} నాటికి {to}" },
  },
  signup: { heading: "మీ ప్లాన్‌ను సేవ్ చేయండి", line: "కాబట్టి మీ ప్లాన్ మరియు మీ సబ్‌స్క్రిప్షన్ కొత్త ఫోన్‌కు మీతో పాటు వస్తాయి మరియు మీ భోజనాలు నిలబడి ఉంటాయి." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "ఆరోగ్యం యాప్‌తో సింక్ చేయండి", body: "బరువు, కార్యకలాపం ఇక్కడికి వస్తాయి. మీ భోజనాలు ఆరోగ్యం యాప్‌కు వెళ్తాయి." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "ఒక భోజనం నా తరఫున. ఫోటోనా, లేక నాకు చెబుతారా?",
    react: "పర్వాలేదు. ముందు నన్ను ప్రయత్నించి చూడండి",
    photo: "ఫోటో తీయండి",
    tell: "మీరు ఏమి తిన్నారో నాకు చెప్పండి",
    keepGoing: "ముందుకు సాగండి",
    correct: "భోజనాన్ని సరిదిద్దండి",
    afterAsk: "అది ఒకటి అయింది. ప్రతి భోజనానికీ ఇలాగే కావాలా?",
  },
  refusals: {
    invalid: {
      age: "అది వయసులా లేదు — 34 లాంటిది ప్రయత్నించండి.",
      height_cm: "సెంటీమీటర్లలో — 175 లాంటిది.",
      weight_kg: "కిలోగ్రాముల్లో — సుమారుగా చెప్పినా సరే.",
      target_weight_kg: "kgలో ఒక సంఖ్య — 70 లాగా.",
    },
    ambiguousAge: {
      line: "నేను సరిగ్గా చదివానో లేదో నిర్ధారించుకోవాలి — మీ ఉద్దేశం {year} సంవత్సరం అయితే, నాలుగు అంకెలూ పంపండి.",
      confirm: "నా వయసు {age}",
    },
    direction: {
      gain: "మీ బరువు ఇప్పుడు {weight} kg, మీరు {target} వరకు పెరగాలని అడిగారు — ఇక్కడి నుండి అది పెరుగుదల కాదు. లక్ష్యం మారితే మనం దాన్ని మార్చవచ్చు; లేదంటే {weight} కంటే ఎక్కువ సంఖ్య ఇవ్వండి.",
      lose: "మీ బరువు ఇప్పుడు {weight} kg, మీరు {target} వరకు తగ్గాలని అడిగారు — ఇక్కడి నుండి అది తగ్గుదల కాదు. లక్ష్యం మారితే మనం దాన్ని మార్చవచ్చు; లేదంటే {weight} కంటే తక్కువ సంఖ్య ఇవ్వండి.",
      switchToLose: "బరువు తగ్గడానికి మార్చండి",
      switchToGain: "బరువు పెరగడానికి మార్చండి",
      above: "{weight} కంటే ఎక్కువ సంఖ్య…",
      below: "{weight} కంటే తక్కువ సంఖ్య…",
    },
    switched: {
      gain: "మార్చాను — అయితే బరువు పెరగడమే. మీరు ఎంత బరువుకు చేరాలనుకుంటున్నారు, kgలో?",
    },
  },
};

const TA: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "தொடங்கு",
    signin: "எனக்கு ஏற்கெனவே கணக்கு உள்ளது",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["நீங்கள் எதற்காக இங்கே வந்தீர்கள்?"] },
      },
      options: {
        lose: { label: "எடையைக் குறை" },
        maintain: { label: "என் எடையைத் தக்கவை" },
        gain: { label: "எடையை அதிகரி" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["உங்கள் பாலினம் என்ன?"] },
      },
      options: {
        male: { label: "ஆண்" },
        female: { label: "பெண்" },
        other: { label: "மற்றவை" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["உங்கள் வயது?"],
          placeholder: "உங்கள் வயது",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["உயரம்"],
          placeholder: "உயரம் cm-இல்",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["உங்கள் எடை"],
          placeholder: "எடை kg-இல்",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["உங்கள் நாட்கள் எவ்வளவு சுறுசுறுப்பானவை?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "உடற்பயிற்சி இல்லை" },
        few: { label: "1–2", hint: "அவ்வப்போது உடற்பயிற்சி" },
        some: { label: "3–4", hint: "வாரத்தில் சில உடற்பயிற்சிகள்" },
        many: { label: "5+", hint: "தீவிர விளையாட்டுப் பயிற்சி" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["எந்த எடையை இலக்காகக் கொள்கிறீர்கள்?"],
          placeholder: "இலக்கு எடை kg-இல்",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["எவ்வளவு வேகமாக?"] },
      },
      options: {
        easy: { label: "மென்மையாக" },
        steady: { label: "நிலையாக" },
        push: { label: "விரைவாக" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["முன்பு கலோரிகளை எண்ணியிருக்கிறீர்களா?"] } },
      options: {
        never: { label: "ஒருபோதும் இல்லை" },
        stopped: { label: "முயற்சித்தேன், நிறுத்திவிட்டேன்" },
        onoff: { label: "அவ்வப்போது" },
        now: { label: "இப்போது எண்ணுகிறேன்" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["உங்களை எது நிறுத்தியது?", "பொருந்துவனவற்றை எல்லாம் தேர்ந்தெடுங்கள்"],
          variants: {
            onoff: ["எது தடையாக இருந்தது?", "பொருந்துவனவற்றை எல்லாம் தேர்ந்தெடுங்கள்"],
            now: ["எது இன்னும் எளிதாக இருக்க வேண்டும்?", "பொருந்துவனவற்றை எல்லாம் தேர்ந்தெடுங்கள்"],
          },
        },
      },
      options: {
        too_long: { label: "அதிக நேரம் எடுத்தது" },
        forgot: { label: "மறந்துவிட்டேன்" },
        invisible: { label: "அது வேலை செய்வது தெரியவில்லை" },
        no_idea: { label: "என்ன சாப்பிடுவதென்று தெரியவில்லை" },
        stressful: { label: "மன அழுத்தமாக இருந்தது" },
        nobody: { label: "கேட்பதற்கு யாருமில்லை" },
        creeping: { label: "என் எடை மீண்டும் ஏறிக்கொண்டே இருந்தது" },
        not_enough: { label: "போதுமான அளவு சாப்பிடுவது கடினம்" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["எப்போது பதிவு செய்வது கடினம்?"],
          variants: { never: ["எப்போது பதிவு செய்வது கடினமாக இருக்கும் என்று எதிர்பார்க்கிறீர்கள்?"] },
        },
      },
      options: {
        workdays: { label: "பிசியான வேலை நாட்கள்" },
        eating_out: { label: "வெளியில் சாப்பிடுவது" },
        cooking: { label: "மற்றவர்களுக்கு சமைப்பது" },
        snacks: { label: "சிற்றுண்டிகளும் பானங்களும்" },
        evenings: { label: "மாலைகளும் வார இறுதிகளும்" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["ஏதாவது உணவுமுறையைப் பின்பற்றுகிறீர்களா?"] },
      },
      options: {
        balanced: { label: "சமச்சீர்" },
        wholefood: { label: "முழு உணவுகள்" },
        mediterranean: { label: "மத்தியதரைக்கடல்" },
        flexitarian: { label: "ஃப்ளெக்ஸிடேரியன்" },
        pescatarian: { label: "பெஸ்கடேரியன்" },
        vegetarian: { label: "சைவம்" },
        vegan: { label: "வீகன்" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["ஏதாவது மருத்துவக் கட்டுப்பாடுகள்?"] },
      },
      options: {
        kidneys: { label: "சிறுநீரகப் பிரச்சினை" },
        ldl: { label: "அதிக கொலஸ்ட்ரால்" },
        lowsugar: { label: "நீரிழிவு அபாயம்" },
        none: { label: "இவற்றில் எதுவும் இல்லை" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["நீங்கள் எங்கே சாப்பிடுகிறீர்கள்?"], placeholder: "தேடு" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "வேறு எங்காவது" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["இலக்காக ஒரு ஸ்ட்ரீக்கைத் தேர்ந்தெடுங்கள்"] },
      },
      options: {
        "7": { label: "7 நாட்கள்" },
        "14": { label: "14 நாட்கள்" },
        "30": { label: "30 நாட்கள்" },
        "50": { label: "50 நாட்கள்" },
      },
    },
  ],
  building: {
    lines: ["உங்கள் தனிப்பட்ட திட்டம் உருவாகிறது"],
    title: "உங்கள் தினசரித் திட்டம்",
    rows: { calories: "கலோரிகள்", protein: "புரதம்", carbs: "கார்ப்ஸ்", fat: "கொழுப்பு", diet: "உணவுமுறை" },
    limitCap: { ldl: "நிறைவுற்ற கொழுப்பு ≤ {n} g", kidneys: "சோடியம் ≤ {n} mg" },
    cta: "திட்டத்தைக் காட்டு",
    floorTitle: "{floor}kcal-இல் நிறுத்தினோம்",
    floorBody: "கணக்கு இதைவிடக் குறைவாகச் செல்ல விரும்பியது. மருத்துவக் கண்காணிப்பு இல்லாமல் இதற்குக் கீழ் இலக்குகளை அமைப்பதில்லை, எனவே உங்களுடையது இங்கே உள்ளது. உங்கள் நாட்குறிப்பிலும் இது குறிப்பிடப்படும்.",
  },
  summary: {
    lines: ["இதோ உங்கள் திட்டம்"],
    kcalLabel: "ஒரு நாளைக்கு kcal",
    floorMarker: "பாதுகாப்புக்காக வரம்பு · எப்போதும் குறைந்தது {floor}",
    macros: {
      protein: "புரதம்",
      carbs: "கார்ப்ஸ்",
      fat: "கொழுப்பு",
      satfat: "நிறைவுற்ற கொழுப்பு · நீங்கள் கேட்டது",
    },
    capNote: "அந்த வேகத்திற்குத் தொடர்ந்து பாதுகாப்பாகத் தக்கவைக்க முடியாத அளவு பெரிய தினசரி மாற்றம் தேவை, எனவே உங்களுடையது பாதுகாப்பான பதிப்பு: உங்கள் உடல் ஒரு நாளில் எரிப்பதில் {share}%.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "உங்கள் முதல் உணவைப் புகைப்படம் எடுங்கள்",
  },
  ui: {
    continueLabel: "தொடர்க",
    saveKept: "அதைச் சேமிக்க முடியவில்லை. உங்கள் பதில் இன்னும் இங்கே உள்ளது. தொடர்க என்பதை அழுத்தினால் மீண்டும் அனுப்பப்படும்.",
    idlePlaceholder: "Spud-க்குச் செய்தி…",
    optionContinues: "Selects and continues",
    stepper: { continue: "தொடர்க", less: "குறைவு", more: "அதிகம்" },
    units: { years: "ஆண்டுகள்", yearsCount: { one: "{n} ஆண்டு", other: "{n} ஆண்டுகள்" } },
  },
  beats: {
    ageWhy: "வயதுடன் உங்கள் வளர்சிதை மாற்றம் மாறுகிறது, அதனால் அதைக் கணக்கில் கொள்கிறோம்",
    echo: { rest: "ஓய்வில்: ஒரு நாளைக்கு {rest}kcal", days: "உங்கள் நாட்கள் {burn}kcal எரிக்கின்றன" },
    baseline: { title: "இதோ உங்கள் தொடக்க நிலை", bmi: "BMI", what: "உடல் நிறை குறியீட்டெண்" },
    prelim: { title: "உங்கள் திட்டம்", burn: "நீங்கள் எரிப்பது", gap: "{delta} உங்கள் வேகம்", eat: "நீங்கள் சாப்பிடுவது", perDay: "kcal ஒரு நாளைக்கு", keepTitle: "நீங்கள் சுமார் {burn}kcal எரிக்கிறீர்கள்" },
  },
  target: {
    markers: {
      lowest: "{weight} · நாங்கள் அமைக்கும் குறைந்தபட்சம்",
      now: "{weight} · இப்போது",
      nowLowest: "{weight} · இப்போது · நாங்கள் அமைக்கும் குறைந்தபட்சம்",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "நான் பரிந்துரைப்பது {weight}, சுமார் {pct}% குறைவு, நல்ல முதல் இலக்கு", up: "நான் பரிந்துரைப்பது {weight}, சுமார் {pct}% அதிகம், நல்ல முதல் இலக்கு" },
  },
  pace: {
    rate: "வாரத்திற்கு {rate}",
    rateSuffix: "வாரத்திற்கு",
    result: "{month} வாக்கில் {target} · ஒரு நாளைக்கு {kcal}kcal",
    echo: "{from} முதல் {to} வரை.",
  },
  plan: {
    weightTitle: "உங்கள் எடை",
    everyDay: "ஒவ்வொரு நாளும்",
    infoTitle: "உங்கள் தகவல்",
    basedOn: "உங்கள் பதில்களின் அடிப்படையில்",
    changeAnytime: "இதை எப்போது வேண்டுமானாலும் மாற்றலாம்",
    goal: {
      lose: "இலக்கு: −{kg} · {month} வரை",
      gain: "இலக்கு: +{kg} · {month} வரை",
      maintain: "இலக்கு: சுமார் {kg} அளவில் இருப்பது",
      maintainRange: "வரம்பு: {range}",
    },
    info: {
      startWeight: "தொடக்க எடை", goalWeight: "இலக்கு எடை", activity: "செயல்பாடு",
      target: "இலக்கு", targetLose: "−{kg} · {month} வரை", targetGain: "+{kg} · {month} வரை",
    },
    satFat: { label: "நிறை. கொழுப்பு", asked: "நிறைவுற்ற கொழுப்பு · நீங்கள் கேட்டது", perDay: "≤ {g} / நாள்" },
    first: { title: "உங்கள் முதல் படி", step: "உங்கள் அடுத்த உணவைப் புகைப்படம் எடுங்கள். eait அதை {kcal}kcal உடன் ஒப்பிடுகிறது." },
    loader: { goal: "உங்கள் இலக்கு", lose: "−{kg} · {month} வரை", gain: "+{kg} · {month} வரை" },
    chart: { estimateAria: "மதிப்பிடப்பட்ட எடை: இப்போது {from}, {month} வாக்கில் {to}" },
  },
  signup: { heading: "உங்கள் பிளானைச் சேமியுங்கள்", line: "அதனால் உங்கள் பிளானும் சந்தாவும் புதிய தொலைபேசியில் உங்களுடன் வரும், உங்கள் உணவுகளும் பாதுகாக்கப்படும்." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "சுகாதாரத்துடன் ஒத்திசை", body: "எடையும் செயல்பாடும் இங்கே வரும். உங்கள் உணவுகள் சுகாதாரத்திற்குச் செல்லும்." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "ஒரு உணவு என் செலவில். புகைப்படமா, அல்லது சொல்கிறீர்களா?",
    react: "பரவாயில்லை. முதலில் என்னை முயன்று பாருங்கள்",
    photo: "புகைப்படம் எடு",
    tell: "என்ன சாப்பிட்டீர்கள் என்று சொல்லுங்கள்",
    keepGoing: "தொடருங்கள்",
    correct: "உணவைச் சரிசெய்",
    afterAsk: "இது ஒன்று. ஒவ்வொரு உணவுக்கும் இப்படி வேண்டுமா?",
  },
  refusals: {
    invalid: {
      age: "அது வயது போலத் தெரியவில்லை — 34 போல ஏதாவது முயலுங்கள்.",
      height_cm: "சென்டிமீட்டரில் — 175 போல.",
      weight_kg: "கிலோகிராமில் — தோராயமாகச் சொன்னாலும் பரவாயில்லை.",
      target_weight_kg: "kg-இல் ஒரு எண் — 70 போல.",
    },
    ambiguousAge: {
      line: "சரியாகப் புரிந்துகொண்டேனா என உறுதிசெய்ய — {year} என்ற ஆண்டைக் குறித்தீர்கள் என்றால், நான்கு இலக்கங்களையும் அனுப்புங்கள்.",
      confirm: "என் வயது {age}",
    },
    direction: {
      gain: "உங்கள் எடை {weight} kg, இலக்காக {target} வரை அதிகரிக்கக் கேட்டீர்கள் — இங்கிருந்து அது அதிகரிப்பு அல்ல. குறிக்கோள் மாறியிருந்தால், அதை மாற்றலாம்; இல்லையெனில் {weight} ஐ விட அதிகமான ஓர் எண்ணைத் தாருங்கள்.",
      lose: "உங்கள் எடை {weight} kg, இலக்காக {target} வரை குறைக்கக் கேட்டீர்கள் — இங்கிருந்து அது குறைப்பு அல்ல. குறிக்கோள் மாறியிருந்தால், அதை மாற்றலாம்; இல்லையெனில் {weight} ஐ விடக் குறைவான ஓர் எண்ணைத் தாருங்கள்.",
      switchToLose: "எடை குறைப்புக்கு மாறு",
      switchToGain: "எடை அதிகரிப்புக்கு மாறு",
      above: "{weight} ஐ விட அதிகமான எண்…",
      below: "{weight} ஐ விடக் குறைவான எண்…",
    },
    switched: {
      gain: "மாற்றப்பட்டது — எடை அதிகரிப்புதான். எந்த எடையை அடைய விரும்புகிறீர்கள், kg-இல்?",
    },
  },
};

const PA: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "ਸ਼ੁਰੂ ਕਰੋ",
    signin: "ਮੇਰਾ ਅਕਾਊਂਟ ਪਹਿਲਾਂ ਤੋਂ ਹੈ",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["ਤੁਸੀਂ ਇੱਥੇ ਕਿਸ ਲਈ ਹੋ?"] },
      },
      options: {
        lose: { label: "ਭਾਰ ਘਟਾਓ" },
        maintain: { label: "ਭਾਰ ਬਣਾਈ ਰੱਖੋ" },
        gain: { label: "ਭਾਰ ਵਧਾਓ" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["ਤੁਹਾਡਾ ਲਿੰਗ ਕੀ ਹੈ?"] },
      },
      options: {
        male: { label: "ਮਰਦ" },
        female: { label: "ਔਰਤ" },
        other: { label: "ਹੋਰ" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["ਤੁਹਾਡੀ ਉਮਰ?"],
          placeholder: "ਤੁਹਾਡੀ ਉਮਰ",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ਕੱਦ"],
          placeholder: "ਕੱਦ cm ਵਿੱਚ",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["ਤੁਹਾਡਾ ਵਜ਼ਨ"],
          placeholder: "ਭਾਰ kg ਵਿੱਚ",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["ਤੁਹਾਡੇ ਦਿਨ ਕਿੰਨੇ ਸਰਗਰਮ ਰਹਿੰਦੇ ਹਨ?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "ਕੋਈ ਵਰਕਆਊਟ ਨਹੀਂ" },
        few: { label: "1–2", hint: "ਕਦੇ-ਕਦਾਈਂ ਵਰਕਆਊਟ" },
        some: { label: "3–4", hint: "ਹਫ਼ਤੇ ਵਿੱਚ ਕੁਝ ਵਰਕਆਊਟ" },
        many: { label: "5+", hint: "ਐਥਲੀਟ ਵਰਗੀ ਰੁਟੀਨ" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["ਤੁਹਾਡਾ ਟੀਚਾ ਭਾਰ ਕੀ ਹੈ?"],
          placeholder: "ਟੀਚਾ ਭਾਰ kg ਵਿੱਚ",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["ਕਿੰਨੀ ਤੇਜ਼ੀ ਨਾਲ?"] },
      },
      options: {
        easy: { label: "ਹਲਕੀ" },
        steady: { label: "ਸਥਿਰ" },
        push: { label: "ਤੇਜ਼" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["ਕੀ ਤੁਸੀਂ ਪਹਿਲਾਂ ਕਦੇ ਕੈਲੋਰੀ ਗਿਣੀਆਂ ਹਨ?"] } },
      options: {
        never: { label: "ਕਦੇ ਨਹੀਂ" },
        stopped: { label: "ਕੋਸ਼ਿਸ਼ ਕੀਤੀ, ਛੱਡ ਦਿੱਤੀ" },
        onoff: { label: "ਕਦੇ ਕਦੇ" },
        now: { label: "ਗਿਣਤੀ ਹੁਣ ਵੀ ਚੱਲ ਰਹੀ ਹੈ" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["ਕਿਸ ਚੀਜ਼ ਨੇ ਤੁਹਾਨੂੰ ਰੋਕਿਆ?", "ਲਾਗੂ ਹੋਣ ਵਾਲੇ ਸਾਰੇ ਚੁਣੋ"],
          variants: {
            onoff: ["ਕੀ ਰੁਕਾਵਟ ਬਣਿਆ?", "ਲਾਗੂ ਹੋਣ ਵਾਲੇ ਸਾਰੇ ਚੁਣੋ"],
            now: ["ਕੀ ਹੋਰ ਆਸਾਨ ਹੋਵੇ?", "ਲਾਗੂ ਹੋਣ ਵਾਲੇ ਸਾਰੇ ਚੁਣੋ"],
          },
        },
      },
      options: {
        too_long: { label: "ਬਹੁਤ ਸਮਾਂ ਲੱਗਦਾ ਸੀ" },
        forgot: { label: "ਭੁੱਲ ਜਾਣਾ ਆਮ ਸੀ" },
        invisible: { label: "ਕੰਮ ਕਰਦਾ ਨਜ਼ਰ ਨਹੀਂ ਆਉਂਦਾ ਸੀ" },
        no_idea: { label: "ਕੀ ਖਾਣਾ, ਪਤਾ ਨਹੀਂ ਸੀ" },
        stressful: { label: "ਤਣਾਅ ਜਿਹਾ ਲੱਗਦਾ ਸੀ" },
        nobody: { label: "ਪੁੱਛਣ ਲਈ ਕੋਈ ਨਹੀਂ ਸੀ" },
        creeping: { label: "ਮੇਰਾ ਵਜ਼ਨ ਮੁੜ ਵੱਧਣ ਲੱਗਦਾ ਸੀ" },
        not_enough: { label: "ਕਾਫ਼ੀ ਖਾਣਾ ਮੁਸ਼ਕਿਲ ਸੀ" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["ਦਰਜ ਕਰਨਾ ਕਦੋਂ ਸਭ ਤੋਂ ਔਖਾ ਹੈ?"],
          variants: { never: ["ਕਦੋਂ ਦਰਜ ਕਰਨਾ ਸਭ ਤੋਂ ਔਖਾ ਹੋਵੇਗਾ?"] },
        },
      },
      options: {
        workdays: { label: "ਰੁੱਝੇ ਕੰਮ ਵਾਲੇ ਦਿਨ" },
        eating_out: { label: "ਬਾਹਰ ਖਾਣਾ" },
        cooking: { label: "ਦੂਜਿਆਂ ਲਈ ਖਾਣਾ ਬਣਾਉਣਾ" },
        snacks: { label: "ਨਾਸ਼ਤੇ ਤੇ ਪੇਅ" },
        evenings: { label: "ਸ਼ਾਮਾਂ ਅਤੇ ਵੀਕੈਂਡ" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["ਤੁਹਾਡੀ ਡਾਇਟ ਕਿਹੋ ਜਿਹੀ ਹੈ?"] },
      },
      options: {
        balanced: { label: "ਸੰਤੁਲਿਤ" },
        wholefood: { label: "ਸਾਬਤ ਭੋਜਨ" },
        mediterranean: { label: "ਮੈਡੀਟੇਰੇਨੀਅਨ" },
        flexitarian: { label: "ਫ਼ਲੈਕਸੀਟੇਰੀਅਨ" },
        pescatarian: { label: "ਪੈਸਕੇਟੇਰੀਅਨ" },
        vegetarian: { label: "ਸ਼ਾਕਾਹਾਰੀ" },
        vegan: { label: "ਵੀਗਨ" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["ਕੋਈ ਮੈਡੀਕਲ ਪਾਬੰਦੀ?"] },
      },
      options: {
        kidneys: { label: "ਗੁਰਦੇ ਦੀ ਬਿਮਾਰੀ" },
        ldl: { label: "ਹਾਈ ਕੋਲੈਸਟ੍ਰੋਲ" },
        lowsugar: { label: "ਡਾਇਬਟੀਜ਼ ਦਾ ਜੋਖਮ" },
        none: { label: "ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਕੋਈ ਨਹੀਂ" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["ਤੁਸੀਂ ਕਿੱਥੇ ਖਾਂਦੇ ਹੋ?"], placeholder: "ਖੋਜੋ" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "ਕਿਤੇ ਹੋਰ" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["ਕਿੰਨੀ ਲੰਬੀ ਸਟ੍ਰੀਕ ਦਾ ਟੀਚਾ ਰੱਖੀਏ?"] },
      },
      options: {
        "7": { label: "7 ਦਿਨ" },
        "14": { label: "14 ਦਿਨ" },
        "30": { label: "30 ਦਿਨ" },
        "50": { label: "50 ਦਿਨ" },
      },
    },
  ],
  building: {
    lines: ["ਤੁਹਾਡਾ ਨਿੱਜੀ ਪਲਾਨ ਬਣ ਰਿਹਾ ਹੈ"],
    title: "ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਪਲਾਨ",
    rows: { calories: "ਕੈਲੋਰੀ", protein: "ਪ੍ਰੋਟੀਨ", carbs: "ਕਾਰਬਸ", fat: "ਫ਼ੈਟ", diet: "ਡਾਇਟ" },
    limitCap: { ldl: "ਸੈਚੁਰੇਟਿਡ ਫ਼ੈਟ ≤ {n} g", kidneys: "ਸੋਡੀਅਮ ≤ {n} mg" },
    cta: "ਮੈਨੂੰ ਪਲਾਨ ਦਿਖਾਓ",
    floorTitle: "{floor}kcal 'ਤੇ ਰੋਕ ਦਿੱਤਾ ਗਿਆ",
    floorBody: "ਹਿਸਾਬ ਇਸ ਤੋਂ ਹੇਠਾਂ ਜਾਣਾ ਚਾਹੁੰਦਾ ਸੀ। ਡਾਕਟਰ ਦੀ ਨਿਗਰਾਨੀ ਤੋਂ ਬਿਨਾਂ ਅਸੀਂ ਇਸ ਤੋਂ ਘੱਟ ਟੀਚੇ ਨਹੀਂ ਰੱਖਦੇ, ਇਸ ਲਈ ਤੁਹਾਡਾ ਟੀਚਾ ਇੱਥੇ ਹੀ ਹੈ। ਤੁਹਾਡੀ ਡਾਇਰੀ ਵਿੱਚ ਵੀ ਇਹੀ ਲਿਖਿਆ ਹੋਵੇਗਾ।",
  },
  summary: {
    lines: ["ਇਹ ਰਿਹਾ ਤੁਹਾਡਾ ਪਲਾਨ"],
    kcalLabel: "kcal ਪ੍ਰਤੀ ਦਿਨ",
    floorMarker: "ਸੁਰੱਖਿਆ ਲਈ ਸੀਮਤ · {floor} ਤੋਂ ਕਦੇ ਘੱਟ ਨਹੀਂ",
    macros: {
      protein: "ਪ੍ਰੋਟੀਨ",
      carbs: "ਕਾਰਬਸ",
      fat: "ਫ਼ੈਟ",
      satfat: "ਸੈਚੁਰੇਟਿਡ ਫ਼ੈਟ · ਤੁਹਾਡੇ ਕਹਿਣ 'ਤੇ",
    },
    capNote: "ਉਸ ਰਫ਼ਤਾਰ ਲਈ ਰੋਜ਼ ਇੰਨਾ ਵੱਡਾ ਬਦਲਾਅ ਚਾਹੀਦਾ ਹੈ ਜਿੰਨਾ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਲੰਬੇ ਸਮੇਂ ਤੱਕ ਨਹੀਂ ਚੱਲ ਸਕਦਾ, ਇਸ ਲਈ ਤੁਹਾਡਾ ਪਲਾਨ ਸੁਰੱਖਿਅਤ ਵਾਲਾ ਹੈ: ਤੁਹਾਡਾ ਸਰੀਰ ਇੱਕ ਦਿਨ ਵਿੱਚ ਜਿੰਨਾ ਖ਼ਰਚ ਕਰਦਾ ਹੈ, ਉਸ ਦਾ {share}%।",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "ਆਪਣੇ ਪਹਿਲੇ ਖਾਣੇ ਦੀ ਫ਼ੋਟੋ ਲਓ",
  },
  ui: {
    continueLabel: "ਜਾਰੀ ਰੱਖੋ",
    saveKept: "ਇਹ ਸੇਵ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਤੁਹਾਡਾ ਜਵਾਬ ਹਾਲੇ ਵੀ ਇੱਥੇ ਹੈ। ਜਾਰੀ ਰੱਖੋ ਦਬਾਉਣ 'ਤੇ ਇਹ ਦੁਬਾਰਾ ਭੇਜਿਆ ਜਾਵੇਗਾ।",
    idlePlaceholder: "Spud ਨੂੰ ਮੈਸੇਜ ਕਰੋ…",
    optionContinues: "Selects and continues",
    stepper: { continue: "ਜਾਰੀ ਰੱਖੋ", less: "ਘੱਟ", more: "ਵੱਧ" },
    units: { years: "ਸਾਲ", yearsCount: { one: "{n} ਸਾਲ", other: "{n} ਸਾਲ" } },
  },
  beats: {
    ageWhy: "ਉਮਰ ਨਾਲ ਤੁਹਾਡਾ ਮੈਟਾਬੋਲਿਜ਼ਮ ਬਦਲਦਾ ਹੈ, ਇਸ ਲਈ ਅਸੀਂ ਇਸ ਨੂੰ ਧਿਆਨ ਵਿੱਚ ਰੱਖਦੇ ਹਾਂ",
    echo: { rest: "ਆਰਾਮ ਦੀ ਹਾਲਤ ਵਿੱਚ: {rest}kcal ਪ੍ਰਤੀ ਦਿਨ", days: "ਤੁਹਾਡੇ ਦਿਨ {burn}kcal ਖ਼ਰਚ ਕਰਦੇ ਹਨ" },
    baseline: { title: "ਇਹ ਰਿਹਾ ਤੁਹਾਡਾ ਸ਼ੁਰੂਆਤੀ ਆਧਾਰ", bmi: "BMI", what: "ਬਾਡੀ ਮਾਸ ਇੰਡੈਕਸ" },
    prelim: { title: "ਤੁਹਾਡੀ ਯੋਜਨਾ", burn: "ਤੁਸੀਂ ਖ਼ਰਚ ਕਰਦੇ ਹੋ", gap: "{delta} ਤੁਹਾਡੀ ਰਫ਼ਤਾਰ", eat: "ਤੁਸੀਂ ਖਾਂਦੇ ਹੋ", perDay: "kcal ਪ੍ਰਤੀ ਦਿਨ", keepTitle: "ਤੁਸੀਂ ਲਗਭਗ {burn}kcal ਖ਼ਰਚ ਕਰਦੇ ਹੋ" },
  },
  target: {
    markers: {
      lowest: "{weight} · ਸਾਡਾ ਘੱਟੋ-ਘੱਟ",
      now: "{weight} · ਹੁਣ",
      nowLowest: "{weight} · ਹੁਣ · ਸਾਡਾ ਘੱਟੋ-ਘੱਟ",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "ਮੇਰਾ ਸੁਝਾਅ ਹੈ {weight}, ਲਗਭਗ {pct}% ਘੱਟ, ਇੱਕ ਚੰਗਾ ਪਹਿਲਾ ਟੀਚਾ", up: "ਮੇਰਾ ਸੁਝਾਅ ਹੈ {weight}, ਲਗਭਗ {pct}% ਵੱਧ, ਇੱਕ ਚੰਗਾ ਪਹਿਲਾ ਟੀਚਾ" },
  },
  pace: {
    rate: "{rate} ਪ੍ਰਤੀ ਹਫ਼ਤਾ",
    rateSuffix: "ਪ੍ਰਤੀ ਹਫ਼ਤਾ",
    result: "{month} ਦੇ ਆਸ-ਪਾਸ {target} · {kcal}kcal ਪ੍ਰਤੀ ਦਿਨ",
    echo: "{from} ਤੋਂ {to} ਤੱਕ।",
  },
  plan: {
    weightTitle: "ਤੁਹਾਡਾ ਭਾਰ",
    everyDay: "ਹਰ ਦਿਨ",
    infoTitle: "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ",
    basedOn: "ਤੁਹਾਡੇ ਜਵਾਬਾਂ ਦੇ ਆਧਾਰ 'ਤੇ",
    changeAnytime: "ਇਸ ਨੂੰ ਕਦੇ ਵੀ ਬਦਲਿਆ ਜਾ ਸਕਦਾ ਹੈ",
    goal: {
      lose: "ਟੀਚਾ: −{kg} · {month} ਤੱਕ",
      gain: "ਟੀਚਾ: +{kg} · {month} ਤੱਕ",
      maintain: "ਟੀਚਾ: ਲਗਭਗ {kg} 'ਤੇ ਬਣੇ ਰਹੋ",
      maintainRange: "ਦਾਇਰਾ: {range}",
    },
    info: {
      startWeight: "ਸ਼ੁਰੂਆਤੀ ਭਾਰ", goalWeight: "ਟੀਚਾ ਭਾਰ", activity: "ਸਰਗਰਮੀ",
      target: "ਟੀਚਾ", targetLose: "−{kg} · {month} ਤੱਕ", targetGain: "+{kg} · {month} ਤੱਕ",
    },
    satFat: { label: "ਸੈਚੁ. ਫ਼ੈਟ", asked: "ਸੈਚੁਰੇਟਿਡ ਫ਼ੈਟ · ਤੁਹਾਡੇ ਕਹਿਣ 'ਤੇ", perDay: "≤ {g} ਪ੍ਰਤੀ ਦਿਨ" },
    first: { title: "ਤੁਹਾਡਾ ਪਹਿਲਾ ਕਦਮ", step: "ਆਪਣੇ ਅਗਲੇ ਖਾਣੇ ਦੀ ਫ਼ੋਟੋ ਲਓ। eait ਇਸਨੂੰ {kcal}kcal ਨਾਲ ਤੁਲਨਾ ਕਰਦਾ ਹੈ।" },
    loader: { goal: "ਤੁਹਾਡਾ ਟੀਚਾ", lose: "−{kg} · {month} ਤੱਕ", gain: "+{kg} · {month} ਤੱਕ" },
    chart: { estimateAria: "ਅੰਦਾਜ਼ਨ ਭਾਰ: ਹੁਣ {from}, {month} ਦੇ ਆਸ-ਪਾਸ {to}" },
  },
  signup: { heading: "ਆਪਣਾ ਪਲਾਨ ਸੇਵ ਕਰੋ", line: "ਤਾਂ ਜੋ ਤੁਹਾਡਾ ਪਲਾਨ ਅਤੇ ਤੁਹਾਡੀ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਨਵੇਂ ਫ਼ੋਨ 'ਤੇ ਤੁਹਾਡੇ ਨਾਲ ਆਵੇ, ਅਤੇ ਤੁਹਾਡੇ ਭੋਜਨ ਸੁਰੱਖਿਅਤ ਰਹਿਣ।" },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "ਸਿਹਤ ਨਾਲ ਸਿੰਕ ਕਰੋ", body: "ਭਾਰ ਅਤੇ ਸਰਗਰਮੀ ਇੱਥੇ ਆਉਂਦੇ ਹਨ। ਤੁਹਾਡੇ ਖਾਣੇ ਸਿਹਤ ਵਿੱਚ ਜਾਂਦੇ ਹਨ।" },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "ਇੱਕ ਖਾਣਾ ਮੇਰੇ ਵੱਲੋਂ। ਫ਼ੋਟੋ, ਜਾਂ ਬੱਸ ਮੈਨੂੰ ਦੱਸਣਾ ਹੈ?",
    react: "ਕੋਈ ਗੱਲ ਨਹੀਂ। ਪਹਿਲਾਂ ਮੈਨੂੰ ਅਜ਼ਮਾ ਕੇ ਦੇਖੋ",
    photo: "ਫ਼ੋਟੋ ਲਓ",
    tell: "ਮੈਨੂੰ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕੀ ਖਾਧਾ",
    keepGoing: "ਅੱਗੇ ਵਧੋ",
    correct: "ਖਾਣਾ ਸੁਧਾਰੋ",
    afterAsk: "ਇਹ ਇੱਕ ਹੋ ਗਿਆ। ਹਰ ਖਾਣੇ ਲਈ ਇਹੀ ਚਾਹੀਦਾ ਹੈ?",
  },
  refusals: {
    invalid: {
      age: "ਇਹ ਉਮਰ ਵਰਗਾ ਨਹੀਂ ਲੱਗਦਾ — ਕੁਝ ਇਸ ਤਰ੍ਹਾਂ ਲਿਖੋ, ਜਿਵੇਂ 34।",
      height_cm: "ਸੈਂਟੀਮੀਟਰ ਵਿੱਚ — ਜਿਵੇਂ 175।",
      weight_kg: "ਕਿਲੋਗ੍ਰਾਮ ਵਿੱਚ — ਅੰਦਾਜ਼ੇ ਨਾਲ ਵੀ ਚੱਲੇਗਾ।",
      target_weight_kg: "kg ਵਿੱਚ ਇੱਕ ਨੰਬਰ — ਜਿਵੇਂ 70।",
    },
    ambiguousAge: {
      line: "ਬੱਸ ਪੱਕਾ ਕਰ ਲਈਏ: ਜੇ ਤੁਹਾਡਾ ਮਤਲਬ ਸਾਲ {year} ਤੋਂ ਸੀ, ਤਾਂ ਚਾਰੇ ਅੰਕ ਭੇਜੋ।",
      confirm: "ਮੇਰੀ ਉਮਰ {age} ਹੈ",
    },
    direction: {
      gain: "ਤੁਹਾਡਾ ਭਾਰ ਹੁਣ {weight} kg ਹੈ ਅਤੇ ਟੀਚਾ {target} ਤੱਕ ਵਧਾਉਣ ਦਾ ਹੈ — ਇੱਥੋਂ ਇਹ ਵਾਧਾ ਨਹੀਂ ਹੈ। ਜੇ ਟੀਚਾ ਬਦਲ ਗਿਆ ਹੈ, ਤਾਂ ਅਸੀਂ ਇਸ ਨੂੰ ਬਦਲ ਸਕਦੇ ਹਾਂ; ਨਹੀਂ ਤਾਂ {weight} ਤੋਂ ਵੱਧ ਕੋਈ ਨੰਬਰ ਦਿਓ।",
      lose: "ਤੁਹਾਡਾ ਭਾਰ ਹੁਣ {weight} kg ਹੈ ਅਤੇ ਟੀਚਾ {target} ਤੱਕ ਘਟਾਉਣ ਦਾ ਹੈ — ਇੱਥੋਂ ਇਹ ਕਮੀ ਨਹੀਂ ਹੈ। ਜੇ ਟੀਚਾ ਬਦਲ ਗਿਆ ਹੈ, ਤਾਂ ਅਸੀਂ ਇਸ ਨੂੰ ਬਦਲ ਸਕਦੇ ਹਾਂ; ਨਹੀਂ ਤਾਂ {weight} ਤੋਂ ਘੱਟ ਕੋਈ ਨੰਬਰ ਦਿਓ।",
      switchToLose: "ਭਾਰ ਘਟਾਉਣ 'ਤੇ ਬਦਲੋ",
      switchToGain: "ਭਾਰ ਵਧਾਉਣ 'ਤੇ ਬਦਲੋ",
      above: "{weight} ਤੋਂ ਵੱਧ ਕੋਈ ਨੰਬਰ…",
      below: "{weight} ਤੋਂ ਘੱਟ ਕੋਈ ਨੰਬਰ…",
    },
    switched: {
      gain: "ਬਦਲ ਦਿੱਤਾ — ਤਾਂ ਭਾਰ ਵਧਾਉਣਾ ਹੈ। ਟੀਚਾ ਕਿੰਨਾ ਰੱਖੀਏ, kg ਵਿੱਚ?",
    },
  },
};

const OR: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "ଆରମ୍ଭ କରନ୍ତୁ",
    signin: "ମୋର ପୂର୍ବରୁ ଆକାଉଣ୍ଟ ଅଛି",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["ଆପଣ ଏଠାରେ କ'ଣ କରିବାକୁ ଚାହାଁନ୍ତି?"] },
      },
      options: {
        lose: { label: "ଓଜନ କମାଇବା" },
        maintain: { label: "ମୋ ଓଜନ ବଜାୟ ରଖିବା" },
        gain: { label: "ଓଜନ ବଢ଼ାଇବା" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["ଆପଣଙ୍କ ଲିଙ୍ଗ କ'ଣ?"] },
      },
      options: {
        male: { label: "ପୁରୁଷ" },
        female: { label: "ମହିଳା" },
        other: { label: "ଅନ୍ୟ" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["ଆପଣଙ୍କ ବୟସ?"],
          placeholder: "ଆପଣଙ୍କ ବୟସ",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ଉଚ୍ଚତା"],
          placeholder: "cm ରେ ଉଚ୍ଚତା",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["ଆପଣଙ୍କ ଓଜନ"],
          placeholder: "kg ରେ ଓଜନ",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["ଆପଣଙ୍କ ଦିନ କେତେ ସକ୍ରିୟ?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "କୌଣସି ୱର୍କଆଉଟ୍ ନାହିଁ" },
        few: { label: "1–2", hint: "ବେଳେବେଳେ ୱର୍କଆଉଟ୍" },
        some: { label: "3–4", hint: "ସପ୍ତାହକୁ କିଛି ୱର୍କଆଉଟ୍" },
        many: { label: "5+", hint: "ନିୟମିତ ଆଥଲିଟ୍" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["ଆପଣ କେଉଁ ଓଜନକୁ ଲକ୍ଷ୍ୟ କରୁଛନ୍ତି?"],
          placeholder: "kg ରେ ଲକ୍ଷ୍ୟ ଓଜନ",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["କେତେ ଦ୍ରୁତ?"] },
      },
      options: {
        easy: { label: "ଧୀରେ" },
        steady: { label: "ସ୍ଥିର" },
        push: { label: "ଦ୍ରୁତ" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["ପୂର୍ବରୁ କ୍ୟାଲୋରୀ ଗଣିଛନ୍ତି କି?"] } },
      options: {
        never: { label: "କେବେ ନାହିଁ" },
        stopped: { label: "ଚେଷ୍ଟା କରିଥିଲି, ଛାଡ଼ିଥିଲି" },
        onoff: { label: "ବେଳେବେଳେ" },
        now: { label: "ବର୍ତ୍ତମାନ ଗଣୁଛି" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["କ'ଣ ଆପଣଙ୍କୁ ଅଟକାଇଥିଲା?", "ଯାହା ମେଳ ଖାଏ ସବୁ ବାଛନ୍ତୁ"],
          variants: {
            onoff: ["କ'ଣ ବାଧା ସୃଷ୍ଟି କରିଥିଲା?", "ଯାହା ମେଳ ଖାଏ ସବୁ ବାଛନ୍ତୁ"],
            now: ["କ'ଣ ସହଜ ହେଲେ ଭଲ ହୋଇଥାନ୍ତା?", "ଯାହା ମେଳ ଖାଏ ସବୁ ବାଛନ୍ତୁ"],
          },
        },
      },
      options: {
        too_long: { label: "ବହୁତ ସମୟ ନେଉଥିଲା" },
        forgot: { label: "ଭୁଲି ଯାଉଥିଲି" },
        invisible: { label: "ଫଳାଫଳ ଦେଖାଯାଉ ନଥିଲା" },
        no_idea: { label: "କ'ଣ ଖାଇବି ଜଣା ନଥିଲା" },
        stressful: { label: "ଚାପଯୁକ୍ତ ଲାଗୁଥିଲା" },
        nobody: { label: "ପଚାରିବାକୁ କେହି ନଥିଲେ" },
        creeping: { label: "ମୋ ଓଜନ ପୁଣି ବଢ଼ି ଚାଲିଥିଲା" },
        not_enough: { label: "ଯଥେଷ୍ଟ ଖାଇବା କଷ୍ଟ ଥିଲା" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["କେବେ ଲିଖିବା ସବୁଠାରୁ କଷ୍ଟ ହୁଏ?"],
          variants: { never: ["କେବେ ଲିଖିବା ସବୁଠାରୁ କଷ୍ଟ ହେବ ବୋଲି ଭାବୁଛନ୍ତି?"] },
        },
      },
      options: {
        workdays: { label: "ବ୍ୟସ୍ତ କାର୍ଯ୍ୟଦିବସ" },
        eating_out: { label: "ବାହାରେ ଖାଇବା" },
        cooking: { label: "ଅନ୍ୟମାନଙ୍କ ପାଇଁ ରାନ୍ଧିବା" },
        snacks: { label: "ଜଳଖିଆ ଓ ପାନୀୟ" },
        evenings: { label: "ସନ୍ଧ୍ୟା ଓ ସପ୍ତାହାନ୍ତ" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["ଆପଣ କୌଣସି ଡାଏଟ୍ ମାନନ୍ତି କି?"] },
      },
      options: {
        balanced: { label: "ସନ୍ତୁଳିତ" },
        wholefood: { label: "ହୋଲ୍-ଫୁଡ୍" },
        mediterranean: { label: "ମେଡିଟେରାନିଆନ୍" },
        flexitarian: { label: "ଫ୍ଲେକ୍ସିଟେରିଆନ୍" },
        pescatarian: { label: "ପେସ୍କାଟେରିଆନ୍" },
        vegetarian: { label: "ଶାକାହାରୀ" },
        vegan: { label: "ଭିଗାନ୍" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["କୌଣସି ଚିକିତ୍ସା ସମ୍ବନ୍ଧୀୟ ସୀମା?"] },
      },
      options: {
        kidneys: { label: "କିଡନୀ ସମସ୍ୟା" },
        ldl: { label: "ଅଧିକ କୋଲେଷ୍ଟେରଲ୍" },
        lowsugar: { label: "ମଧୁମେହ ଆଶଙ୍କା" },
        none: { label: "ଏଥିରୁ କୌଣସିଟି ନୁହେଁ" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["ଆପଣ କେଉଁଠାରେ ଖାଆନ୍ତି?"], placeholder: "ଖୋଜନ୍ତୁ" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "ଅନ୍ୟ କେଉଁଠି" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["ଲକ୍ଷ୍ୟ ପାଇଁ ଏକ ଷ୍ଟ୍ରିକ୍ ବାଛନ୍ତୁ"] },
      },
      options: {
        "7": { label: "7 ଦିନ" },
        "14": { label: "14 ଦିନ" },
        "30": { label: "30 ଦିନ" },
        "50": { label: "50 ଦିନ" },
      },
    },
  ],
  building: {
    lines: ["ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ପ୍ଲାନ୍ ତିଆରି ହେଉଛି"],
    title: "ଆପଣଙ୍କ ଦୈନିକ ପ୍ଲାନ୍",
    rows: { calories: "କ୍ୟାଲୋରୀ", protein: "ପ୍ରୋଟିନ୍", carbs: "କାର୍ବସ୍", fat: "ଫ୍ୟାଟ୍", diet: "ଡାଏଟ୍" },
    limitCap: { ldl: "ସାଚୁରେଟେଡ୍ ଫ୍ୟାଟ୍ ≤ {n} g", kidneys: "ସୋଡିୟମ୍ ≤ {n} mg" },
    cta: "ମୋତେ ପ୍ଲାନ୍ ଦେଖାନ୍ତୁ",
    floorTitle: "ଆମେ {floor}kcal ରେ ରହିଗଲୁ",
    floorBody: "ହିସାବ ଆହୁରି କମ୍ ଯିବାକୁ ଚାହୁଁଥିଲା। ଚିକିତ୍ସକଙ୍କ ତତ୍ତ୍ୱାବଧାନ ବିନା ଆମେ ଏହାଠାରୁ କମ୍ ଲକ୍ଷ୍ୟ ସେଟ୍ କରୁନାହୁଁ, ତେଣୁ ଆପଣଙ୍କର ଏଠାରେ ରହିଲା। ଆପଣଙ୍କ ଡାଏରୀରେ ମଧ୍ୟ ଏହା ଲେଖାଥିବ।",
  },
  summary: {
    lines: ["ଏହା ଆପଣଙ୍କ ପ୍ଲାନ୍"],
    kcalLabel: "kcal ପ୍ରତିଦିନ",
    floorMarker: "ସୁରକ୍ଷା ପାଇଁ ସୀମିତ · {floor} ରୁ କେବେ କମ୍ ନୁହେଁ",
    macros: {
      protein: "ପ୍ରୋଟିନ୍",
      carbs: "କାର୍ବସ୍",
      fat: "ଫ୍ୟାଟ୍",
      satfat: "ସାଚୁରେଟେଡ୍ ଫ୍ୟାଟ୍ · ଆପଣଙ୍କ ଅନୁରୋଧରେ",
    },
    capNote: "ସେହି ଗତି ପାଇଁ ଦୈନିକ ଏତେ ବଡ଼ ପରିବର୍ତ୍ତନ ଦରକାର ଯାହା ସୁରକ୍ଷିତ ଭାବେ ବଜାୟ ରଖିହେବ ନାହିଁ, ତେଣୁ ଆପଣଙ୍କର ସୁରକ୍ଷିତ ସଂସ୍କରଣ: ଆପଣଙ୍କ ଶରୀର ଦିନକରେ ଯାହା ଖର୍ଚ୍ଚ କରେ ତାର {share}%।",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "ଆପଣଙ୍କ ପ୍ରଥମ ଭୋଜନର ଫଟୋ ନିଅନ୍ତୁ",
  },
  ui: {
    continueLabel: "ଜାରି ରଖନ୍ତୁ",
    saveKept: "ଏହା ସେଭ୍ ହୋଇପାରିଲା ନାହିଁ। ଆପଣଙ୍କ ଉତ୍ତର ଏଠାରେ ଅଛି। “ଜାରି ରଖନ୍ତୁ” ଦବାଇଲେ ଏହା ପୁଣି ପଠାହେବ।",
    idlePlaceholder: "Spud କୁ ମେସେଜ୍ କରନ୍ତୁ…",
    optionContinues: "Selects and continues",
    stepper: { continue: "ଜାରି ରଖନ୍ତୁ", less: "କମ୍", more: "ଅଧିକ" },
    units: { years: "ବର୍ଷ", yearsCount: { one: "{n} ବର୍ଷ", other: "{n} ବର୍ଷ" } },
  },
  beats: {
    ageWhy: "ବୟସ ସହ ଆପଣଙ୍କ ମେଟାବୋଲିଜମ୍ ବଦଳେ, ତେଣୁ ଆମେ ତାହା ହିସାବକୁ ନେଉ",
    echo: { rest: "ବିଶ୍ରାମରେ: {rest}kcal ପ୍ରତିଦିନ", days: "ଆପଣଙ୍କ ଦିନ {burn}kcal ଖର୍ଚ୍ଚ କରେ" },
    baseline: { title: "ଏହା ଆପଣଙ୍କ ଆରମ୍ଭିକ ଆଧାର", bmi: "BMI", what: "ବଡି ମାସ୍ ଇଣ୍ଡେକ୍ସ" },
    prelim: { title: "ଆପଣଙ୍କ ଯୋଜନା", burn: "ଆପଣ ଖର୍ଚ୍ଚ କରନ୍ତି", gap: "{delta} ଆପଣଙ୍କ ଗତି", eat: "ଆପଣ ଖାଆନ୍ତି", perDay: "kcal ପ୍ରତିଦିନ", keepTitle: "ଆପଣ ପ୍ରାୟ {burn}kcal ଖର୍ଚ୍ଚ କରନ୍ତି" },
  },
  target: {
    markers: {
      lowest: "{weight} · ଆମର ସର୍ବନିମ୍ନ",
      now: "{weight} · ଏବେ",
      nowLowest: "{weight} · ଏବେ · ଆମର ସର୍ବନିମ୍ନ",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "ମୋ ପରାମର୍ଶ {weight}, ପ୍ରାୟ {pct}% କମ୍, ଏକ ଭଲ ପ୍ରଥମ ଲକ୍ଷ୍ୟ", up: "ମୋ ପରାମର୍ଶ {weight}, ପ୍ରାୟ {pct}% ଅଧିକ, ଏକ ଭଲ ପ୍ରଥମ ଲକ୍ଷ୍ୟ" },
  },
  pace: {
    rate: "{rate} ପ୍ରତି ସପ୍ତାହ",
    rateSuffix: "ପ୍ରତି ସପ୍ତାହ",
    result: "{month} ଆଖପାଖରେ {target} · {kcal}kcal ପ୍ରତିଦିନ",
    echo: "{from} ରୁ {to} ପର୍ଯ୍ୟନ୍ତ।",
  },
  plan: {
    weightTitle: "ଆପଣଙ୍କ ଓଜନ",
    everyDay: "ପ୍ରତିଦିନ",
    infoTitle: "ଆପଣଙ୍କ ତଥ୍ୟ",
    basedOn: "ଆପଣଙ୍କ ଉତ୍ତର ଆଧାରରେ",
    changeAnytime: "ଏହା ଯେକୌଣସି ସମୟରେ ବଦଳାଇପାରିବେ",
    goal: {
      lose: "ଲକ୍ଷ୍ୟ: −{kg} · {month} ସୁଦ୍ଧା",
      gain: "ଲକ୍ଷ୍ୟ: +{kg} · {month} ସୁଦ୍ଧା",
      maintain: "ଲକ୍ଷ୍ୟ: ପ୍ରାୟ {kg} ରେ ରହିବା",
      maintainRange: "ପରିସର: {range}",
    },
    info: {
      startWeight: "ଆରମ୍ଭ ଓଜନ", goalWeight: "ଲକ୍ଷ୍ୟ ଓଜନ", activity: "ସକ୍ରିୟତା",
      target: "ଲକ୍ଷ୍ୟ", targetLose: "−{kg} · {month} ସୁଦ୍ଧା", targetGain: "+{kg} · {month} ସୁଦ୍ଧା",
    },
    satFat: { label: "ସାଚୁ. ଫ୍ୟାଟ୍", asked: "ସାଚୁରେଟେଡ୍ ଫ୍ୟାଟ୍ · ଆପଣଙ୍କ ଅନୁରୋଧରେ", perDay: "ଦିନକୁ ≤ {g}" },
    first: { title: "ଆପଣଙ୍କ ପ୍ରଥମ ପଦକ୍ଷେପ", step: "ଆପଣଙ୍କ ପରବର୍ତ୍ତୀ ଭୋଜନର ଫଟୋ ନିଅନ୍ତୁ। eait ଏହାକୁ {kcal}kcal ସହ ତୁଳନା କରେ।" },
    loader: { goal: "ଆପଣଙ୍କ ଲକ୍ଷ୍ୟ", lose: "−{kg} · {month} ସୁଦ୍ଧା", gain: "+{kg} · {month} ସୁଦ୍ଧା" },
    chart: { estimateAria: "ଆନୁମାନିକ ଓଜନ: ଏବେ {from}, {month} ଆଖପାଖରେ {to}" },
  },
  signup: { heading: "ଆପଣଙ୍କ ପ୍ଲାନ ସାଇତନ୍ତୁ", line: "ଯାହାଦ୍ୱାରା ଆପଣଙ୍କ ପ୍ଲାନ ଏବଂ ସବସ୍କ୍ରିପସନ ନୂଆ ଫୋନ୍‌କୁ ଆପଣଙ୍କ ସହ ଯିବ ଏବଂ ଆପଣଙ୍କ ଖାଦ୍ୟ ସୁରକ୍ଷିତ ରହିବ।" },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "ସ୍ୱାସ୍ଥ୍ୟ ସହ ସିଙ୍କ୍ କରନ୍ତୁ", body: "ଓଜନ ଓ ସକ୍ରିୟତା ଏଠାକୁ ଆସେ। ଆପଣଙ୍କ ଭୋଜନ ସ୍ୱାସ୍ଥ୍ୟକୁ ଯାଏ।" },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "ଗୋଟିଏ ଭୋଜନ ମୋ ତରଫରୁ। ଫଟୋ, ନା କେବଳ ମୋତେ କହିବେ?",
    react: "କିଛି ଅସୁବିଧା ନାହିଁ। ପ୍ରଥମେ ମୋତେ ଚେଷ୍ଟା କରି ଦେଖନ୍ତୁ",
    photo: "ଫଟୋ ନିଅନ୍ତୁ",
    tell: "ଆପଣ କ'ଣ ଖାଇଲେ ମୋତେ କୁହନ୍ତୁ",
    keepGoing: "ଆଗକୁ ବଢ଼ନ୍ତୁ",
    correct: "ଭୋଜନ ସଂଶୋଧନ କରନ୍ତୁ",
    afterAsk: "ଗୋଟିଏ ହେଲା। ପ୍ରତି ଭୋଜନ ପାଇଁ ଏହା ଚାହାଁନ୍ତି କି?",
  },
  refusals: {
    invalid: {
      age: "ଏହା ବୟସ ପରି ଲାଗୁନାହିଁ — 34 ପରି କିଛି ଲେଖନ୍ତୁ।",
      height_cm: "ସେଣ୍ଟିମିଟରରେ — 175 ପରି।",
      weight_kg: "କିଲୋଗ୍ରାମରେ — ଆନୁମାନିକ ହେଲେ ବି ଚଳିବ।",
      target_weight_kg: "kg ରେ ଏକ ସଂଖ୍ୟା — 70 ପରି।",
    },
    ambiguousAge: {
      line: "ମୁଁ ଠିକ୍ ପଢ଼ିଲି କି ନାହିଁ ନିଶ୍ଚିତ ହେବାକୁ ଚାହେଁ — ଯଦି ଆପଣ {year} ମସିହା କହିବାକୁ ଚାହୁଁଥିଲେ, ଚାରିଟି ଅଙ୍କ ପଠାନ୍ତୁ।",
      confirm: "ମୋ ବୟସ {age}",
    },
    direction: {
      gain: "ଏବେ ଆପଣଙ୍କ ଓଜନ {weight} kg ଏବଂ ଲକ୍ଷ୍ୟ {target} — ଏଠାରୁ ଏହା ବୃଦ୍ଧି ନୁହେଁ। ଲକ୍ଷ୍ୟ ବଦଳିଥିଲେ, ଆମେ ତାହା ବଦଳାଇପାରିବା; ନଚେତ୍ {weight} ରୁ ଅଧିକ ଏକ ସଂଖ୍ୟା ଦିଅନ୍ତୁ।",
      lose: "ଏବେ ଆପଣଙ୍କ ଓଜନ {weight} kg ଏବଂ ଲକ୍ଷ୍ୟ {target} — ଏଠାରୁ ଏହା ହ୍ରାସ ନୁହେଁ। ଲକ୍ଷ୍ୟ ବଦଳିଥିଲେ, ଆମେ ତାହା ବଦଳାଇପାରିବା; ନଚେତ୍ {weight} ରୁ କମ୍ ଏକ ସଂଖ୍ୟା ଦିଅନ୍ତୁ।",
      switchToLose: "ଓଜନ କମାଇବାକୁ ବଦଳାନ୍ତୁ",
      switchToGain: "ଓଜନ ବଢ଼ାଇବାକୁ ବଦଳାନ୍ତୁ",
      above: "{weight} ରୁ ଅଧିକ ଏକ ସଂଖ୍ୟା…",
      below: "{weight} ରୁ କମ୍ ଏକ ସଂଖ୍ୟା…",
    },
    switched: {
      gain: "ବଦଳିଗଲା — ତେବେ ଓଜନ ବଢ଼ାଇବା। kg ରେ କେତେ ପର୍ଯ୍ୟନ୍ତ ଯିବାକୁ ଚାହାଁନ୍ତି?",
    },
  },
};

const MR: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "सुरू करा",
    signin: "माझे अकाउंट आधीच आहे",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["तुम्हाला काय साध्य करायचे आहे?"] },
      },
      options: {
        lose: { label: "वजन कमी करा" },
        maintain: { label: "वजन टिकवा" },
        gain: { label: "वजन वाढवा" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["तुमचे लिंग काय आहे?"] },
      },
      options: {
        male: { label: "पुरुष" },
        female: { label: "स्त्री" },
        other: { label: "इतर" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["तुमचे वय?"],
          placeholder: "तुमचे वय",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["उंची"],
          placeholder: "उंची cm मध्ये",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["तुमचे वजन"],
          placeholder: "वजन kg मध्ये",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["तुमचे दिवस किती सक्रिय असतात?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "वर्कआउट नाही" },
        few: { label: "1–2", hint: "कधीमधी वर्कआउट" },
        some: { label: "3–4", hint: "आठवड्यात काही वर्कआउट" },
        many: { label: "5+", hint: "समर्पित ॲथलीट" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["तुमचे ध्येय वजन किती आहे?"],
          placeholder: "ध्येय वजन kg मध्ये",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["किती वेगाने?"] },
      },
      options: {
        easy: { label: "सौम्य" },
        steady: { label: "स्थिर" },
        push: { label: "जलद" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["यापूर्वी कॅलरी मोजल्या आहेत का?"] } },
      options: {
        never: { label: "कधीच नाही" },
        stopped: { label: "प्रयत्न केला, सोडून दिला" },
        onoff: { label: "कधी कधी" },
        now: { label: "आत्ताही मोजत आहे" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["कशामुळे थांबलात?", "लागू असलेले सर्व निवडा"],
          variants: {
            onoff: ["काय अडथळा आला?", "लागू असलेले सर्व निवडा"],
            now: ["काय अजून सोपं हवं?", "लागू असलेले सर्व निवडा"],
          },
        },
      },
      options: {
        too_long: { label: "खूप वेळ लागत होता" },
        forgot: { label: "लक्षात राहत नव्हतं" },
        invisible: { label: "परिणाम दिसत नव्हता" },
        no_idea: { label: "काय जेवावं कळत नव्हतं" },
        stressful: { label: "तणावपूर्ण वाटत होतं" },
        nobody: { label: "विचारायला कोणी नव्हतं" },
        creeping: { label: "वजन पुन्हा हळूहळू वाढत होतं" },
        not_enough: { label: "पुरेसं जेवणं कठीण होतं" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["कधी नोंदवणं सगळ्यात अवघड?"],
          variants: { never: ["नोंदवणं कधी सगळ्यात अवघड जाईल असं वाटतं?"] },
        },
      },
      options: {
        workdays: { label: "व्यस्त कामाचे दिवस" },
        eating_out: { label: "बाहेर जेवणं" },
        cooking: { label: "इतरांसाठी स्वयंपाक" },
        snacks: { label: "स्नॅक्स आणि पेये" },
        evenings: { label: "संध्याकाळ आणि सुट्टीचे दिवस" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["तुम्ही एखादा आहार पाळता का?"] },
      },
      options: {
        balanced: { label: "संतुलित" },
        wholefood: { label: "होल-फूड" },
        mediterranean: { label: "मेडिटेरेनियन" },
        flexitarian: { label: "फ्लेक्सिटेरियन" },
        pescatarian: { label: "पेस्केटेरियन" },
        vegetarian: { label: "शाकाहारी" },
        vegan: { label: "व्हेगन" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["काही वैद्यकीय मर्यादा?"] },
      },
      options: {
        kidneys: { label: "किडनीचा आजार" },
        ldl: { label: "उच्च कोलेस्टेरॉल" },
        lowsugar: { label: "मधुमेहाचा धोका" },
        none: { label: "यापैकी काहीही नाही" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["तुम्ही कुठे जेवता?"], placeholder: "शोधा" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "इतर कुठेतरी" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["कोणत्या स्ट्रीकचे लक्ष्य ठेवायचे ते निवडा"] },
      },
      options: {
        "7": { label: "7 दिवस" },
        "14": { label: "14 दिवस" },
        "30": { label: "30 दिवस" },
        "50": { label: "50 दिवस" },
      },
    },
  ],
  building: {
    lines: ["तुमचा वैयक्तिक प्लॅन तयार होत आहे"],
    title: "तुमचा दैनिक प्लॅन",
    rows: { calories: "कॅलरी", protein: "प्रोटीन", carbs: "कार्ब्स", fat: "फॅट", diet: "आहार" },
    limitCap: { ldl: "सॅच्युरेटेड फॅट ≤ {n} g", kidneys: "सोडियम ≤ {n} mg" },
    cta: "मला प्लॅन दाखवा",
    floorTitle: "आम्ही {floor}kcal वर थांबलो",
    floorBody: "हिशोब यापेक्षा खाली जात होता. वैद्यकीय देखरेखीशिवाय आम्ही यापेक्षा कमी लक्ष्य ठेवत नाही, म्हणून तुमचे लक्ष्य इथेच आहे. तुमच्या डायरीतही असेच लिहिलेले असेल.",
  },
  summary: {
    lines: ["हा आहे तुमचा प्लॅन"],
    kcalLabel: "kcal दिवसाला",
    floorMarker: "सुरक्षेसाठी मर्यादित · कधीही {floor} पेक्षा कमी नाही",
    macros: {
      protein: "प्रोटीन",
      carbs: "कार्ब्स",
      fat: "फॅट",
      satfat: "सॅच्युरेटेड फॅट · तुमच्या सांगण्यानुसार",
    },
    capNote: "त्या वेगासाठी दररोज जितका मोठा बदल लागतो तितका सुरक्षितपणे टिकवता येत नाही, म्हणून तुमचा प्लॅन सुरक्षित आवृत्ती आहे: तुमचे शरीर एका दिवसात जितके खर्च करते त्याच्या {share}%.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "तुमच्या पहिल्या जेवणाचा फोटो काढा",
  },
  ui: {
    continueLabel: "पुढे जा",
    saveKept: "हे सेव्ह करता आले नाही. तुमचे उत्तर अजून इथेच आहे. पुढे जा दाबल्यास ते पुन्हा पाठवले जाईल.",
    idlePlaceholder: "Spud ला मेसेज करा…",
    optionContinues: "Selects and continues",
    stepper: { continue: "पुढे जा", less: "कमी", more: "जास्त" },
    units: { years: "वर्षे", yearsCount: { one: "{n} वर्ष", other: "{n} वर्षे" } },
  },
  beats: {
    ageWhy: "वयानुसार तुमचा मेटाबॉलिझम बदलतो, म्हणून आम्ही तेही लक्षात घेतो",
    echo: { rest: "विश्रांतीत: दिवसाला {rest}kcal", days: "तुमचे दिवस {burn}kcal खर्च करतात" },
    baseline: { title: "हा आहे तुमचा सुरुवातीचा आधार", bmi: "BMI", what: "बॉडी मास इंडेक्स" },
    prelim: { title: "तुमची योजना", burn: "तुम्ही खर्च करता", gap: "{delta} तुमचा वेग", eat: "तुम्ही खाता", perDay: "kcal दिवसाला", keepTitle: "तुम्ही सुमारे {burn}kcal खर्च करता" },
  },
  target: {
    markers: {
      lowest: "{weight} · आमचे किमान",
      now: "{weight} · आता",
      nowLowest: "{weight} · आता · आमचे किमान",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "माझी सूचना: {weight}, सुमारे {pct}% कमी, एक चांगले पहिले ध्येय", up: "माझी सूचना: {weight}, सुमारे {pct}% जास्त, एक चांगले पहिले ध्येय" },
  },
  pace: {
    rate: "{rate} प्रति आठवडा",
    rateSuffix: "प्रति आठवडा",
    result: "{month} च्या सुमारास {target} · दिवसाला {kcal}kcal",
    echo: "{from} पासून {to} पर्यंत.",
  },
  plan: {
    weightTitle: "तुमचे वजन",
    everyDay: "दररोज",
    infoTitle: "तुमची माहिती",
    basedOn: "तुमच्या उत्तरांवर आधारित",
    changeAnytime: "हे तुम्ही कधीही बदलू शकता",
    goal: {
      lose: "ध्येय: −{kg} · {month} पर्यंत",
      gain: "ध्येय: {kg} वाढ · {month} पर्यंत",
      maintain: "ध्येय: सुमारे {kg} वर राहणे",
      maintainRange: "श्रेणी: {range}",
    },
    info: {
      startWeight: "सुरुवातीचे वजन", goalWeight: "ध्येय वजन", activity: "ॲक्टिव्हिटी",
      target: "लक्ष्य", targetLose: "−{kg} · {month} पर्यंत", targetGain: "{kg} वाढ · {month} पर्यंत",
    },
    satFat: { label: "सॅच. फॅट", asked: "सॅच्युरेटेड फॅट · तुम्ही विचारले", perDay: "दिवसाला ≤ {g}" },
    first: { title: "तुमची पहिली पायरी", step: "तुमच्या पुढील जेवणाचा फोटो काढा. eait ते {kcal}kcal शी तपासते." },
    loader: { goal: "तुमचे ध्येय", lose: "−{kg} · {month} पर्यंत", gain: "+{kg} · {month} पर्यंत" },
    chart: { estimateAria: "अंदाजित वजन: आता {from}, {month} च्या सुमारास {to}" },
  },
  signup: { heading: "तुमचा प्लान जतन करा", line: "म्हणजे तुमचा प्लान आणि तुमचं सबस्क्रिप्शन नवीन फोनवर तुमच्यासोबत जाईल आणि तुमचं जेवण जतन केलं जाईल." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "आरोग्य ॲपसोबत सिंक करा", body: "वजन आणि ॲक्टिव्हिटी इथे येतात. तुमची जेवणे आरोग्य ॲपमध्ये जातात." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "एक जेवण माझ्याकडून. फोटो काढाल की फक्त सांगाल?",
    react: "काही हरकत नाही. आधी मला वापरून पाहा",
    photo: "फोटो काढा",
    tell: "तुम्ही काय खाल्ले ते मला सांगा",
    keepGoing: "पुढे चला",
    correct: "जेवण दुरुस्त करा",
    afterAsk: "हे एक झाले. प्रत्येक जेवणासाठी हे हवे आहे का?",
  },
  refusals: {
    invalid: {
      age: "हे वय वाटत नाही — 34 सारखे काहीतरी लिहा.",
      height_cm: "सेंटीमीटरमध्ये — 175 सारखे.",
      weight_kg: "किलोग्रॅममध्ये — अंदाजे चालेल.",
      target_weight_kg: "kg मध्ये एक संख्या — 70 सारखी.",
    },
    ambiguousAge: {
      line: "मी बरोबर वाचले याची खात्री करायची आहे — तुम्हाला वर्ष {year} म्हणायचे असल्यास, चारही अंक पाठवा.",
      confirm: "माझे वय {age} आहे",
    },
    direction: {
      gain: "तुमचे वजन आता {weight} kg आहे आणि लक्ष्य {target} — इथून ही वाढ नाही. ध्येय बदलले असल्यास, आपण ते बदलू शकतो; नाहीतर {weight} पेक्षा जास्त संख्या द्या.",
      lose: "तुमचे वजन आता {weight} kg आहे आणि लक्ष्य {target} — इथून ही घट नाही. ध्येय बदलले असल्यास, आपण ते बदलू शकतो; नाहीतर {weight} पेक्षा कमी संख्या द्या.",
      switchToLose: "वजन कमी करण्यावर बदला",
      switchToGain: "वजन वाढवण्यावर बदला",
      above: "{weight} पेक्षा जास्त संख्या…",
      below: "{weight} पेक्षा कमी संख्या…",
    },
    switched: {
      gain: "बदलले — म्हणजे वजन वाढवायचे. kg मध्ये, किती वजनापर्यंत पोहोचायचे आहे?",
    },
  },
};

const ML: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "തുടങ്ങുക",
    signin: "എനിക്ക് ഇതിനകം ഒരു അക്കൗണ്ട് ഉണ്ട്",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["ഇവിടെ എന്താണ് നിങ്ങളുടെ ലക്ഷ്യം?"] },
      },
      options: {
        lose: { label: "ഭാരം കുറയ്ക്കുക" },
        maintain: { label: "ഭാരം നിലനിർത്തുക" },
        gain: { label: "ഭാരം കൂട്ടുക" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["നിങ്ങളുടെ ലിംഗം ഏതാണ്?"] },
      },
      options: {
        male: { label: "പുരുഷൻ" },
        female: { label: "സ്ത്രീ" },
        other: { label: "മറ്റുള്ളവ" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["നിങ്ങളുടെ പ്രായം?"],
          placeholder: "നിങ്ങളുടെ പ്രായം",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ഉയരം"],
          placeholder: "ഉയരം cm-ൽ",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["നിങ്ങളുടെ ഭാരം"],
          placeholder: "ഭാരം kg-ൽ",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["നിങ്ങളുടെ ദിവസങ്ങൾ എത്രത്തോളം സജീവമാണ്?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "വർക്കൗട്ട് ഇല്ല" },
        few: { label: "1–2", hint: "ഇടയ്ക്കിടെ വർക്കൗട്ട്" },
        some: { label: "3–4", hint: "ആഴ്ചയിൽ കുറച്ച് വർക്കൗട്ടുകൾ" },
        many: { label: "5+", hint: "സമർപ്പിത കായികതാരം" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["ഏത് ഭാരമാണ് ലക്ഷ്യമിടുന്നത്?"],
          placeholder: "ലക്ഷ്യ ഭാരം kg-ൽ",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["എത്ര വേഗത്തിൽ?"] },
      },
      options: {
        easy: { label: "മൃദുവായി" },
        steady: { label: "സ്ഥിരമായി" },
        push: { label: "വേഗത്തിൽ" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["മുമ്പ് കലോറി കണക്കാക്കിയിട്ടുണ്ടോ?"] } },
      options: {
        never: { label: "ഒരിക്കലുമില്ല" },
        stopped: { label: "ശ്രമിച്ചു, പിന്നെ നിർത്തി" },
        onoff: { label: "ഇടയ്ക്കിടെ" },
        now: { label: "ഇപ്പോൾ കണക്കാക്കുന്നു" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["എന്താണ് നിങ്ങളെ നിർത്തിയത്?", "ചേരുന്നവയെല്ലാം തിരഞ്ഞെടുക്കുക"],
          variants: {
            onoff: ["എന്താണ് തടസ്സമായത്?", "ചേരുന്നവയെല്ലാം തിരഞ്ഞെടുക്കുക"],
            now: ["എന്താണ് കൂടുതൽ എളുപ്പമാകേണ്ടത്?", "ചേരുന്നവയെല്ലാം തിരഞ്ഞെടുക്കുക"],
          },
        },
      },
      options: {
        too_long: { label: "ധാരാളം സമയം എടുത്തു" },
        forgot: { label: "മറന്നുപോയി" },
        invisible: { label: "ഇത് പ്രവർത്തിക്കുന്നത് കാണാൻ കഴിഞ്ഞില്ല" },
        no_idea: { label: "എന്ത് കഴിക്കണമെന്ന് അറിയില്ലായിരുന്നു" },
        stressful: { label: "സമ്മർദ്ദമായി തോന്നി" },
        nobody: { label: "ചോദിക്കാൻ ആരുമില്ലായിരുന്നു" },
        creeping: { label: "ഭാരം വീണ്ടും കൂടിത്തുടങ്ങി" },
        not_enough: { label: "മതിയായത്ര കഴിക്കാൻ ബുദ്ധിമുട്ടായിരുന്നു" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["എപ്പോഴാണ് രേഖപ്പെടുത്തൽ ഏറ്റവും ബുദ്ധിമുട്ട്?"],
          variants: { never: ["എപ്പോഴാണ് രേഖപ്പെടുത്തൽ ഏറ്റവും ബുദ്ധിമുട്ടാകുമെന്ന് കരുതുന്നു?"] },
        },
      },
      options: {
        workdays: { label: "തിരക്കുള്ള ജോലിദിവസങ്ങൾ" },
        eating_out: { label: "പുറത്ത് ഭക്ഷണം" },
        cooking: { label: "മറ്റുള്ളവർക്കായി പാചകം" },
        snacks: { label: "ലഘുഭക്ഷണവും പാനീയങ്ങളും" },
        evenings: { label: "വൈകുന്നേരങ്ങളും അവധിദിവസങ്ങളും" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["നിങ്ങൾ ഏതെങ്കിലും ഡയറ്റ് പിന്തുടരുന്നുണ്ടോ?"] },
      },
      options: {
        balanced: { label: "സന്തുലിതം" },
        wholefood: { label: "സംസ്കരിക്കാത്ത ഭക്ഷണം" },
        mediterranean: { label: "മെഡിറ്ററേനിയൻ" },
        flexitarian: { label: "ഫ്ലെക്സിറ്റേറിയൻ" },
        pescatarian: { label: "പെസ്കറ്റേറിയൻ" },
        vegetarian: { label: "സസ്യാഹാരം" },
        vegan: { label: "വീഗൻ" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["എന്തെങ്കിലും ആരോഗ്യപരമായ നിയന്ത്രണങ്ങൾ?"] },
      },
      options: {
        kidneys: { label: "വൃക്കരോഗം" },
        ldl: { label: "ഉയർന്ന കൊളസ്ട്രോൾ" },
        lowsugar: { label: "പ്രമേഹ സാധ്യത" },
        none: { label: "ഇവയൊന്നുമില്ല" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["നിങ്ങൾ എവിടെയാണ് ഭക്ഷണം കഴിക്കുന്നത്?"], placeholder: "തിരയുക" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "മറ്റെവിടെയെങ്കിലും" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["ലക്ഷ്യമിടാൻ ഒരു സ്ട്രീക്ക് തിരഞ്ഞെടുക്കൂ"] },
      },
      options: {
        "7": { label: "7 ദിവസം" },
        "14": { label: "14 ദിവസം" },
        "30": { label: "30 ദിവസം" },
        "50": { label: "50 ദിവസം" },
      },
    },
  ],
  building: {
    lines: ["നിങ്ങളുടെ വ്യക്തിഗത പ്ലാൻ തയ്യാറാക്കുന്നു"],
    title: "നിങ്ങളുടെ ദൈനംദിന പ്ലാൻ",
    rows: { calories: "കലോറി", protein: "പ്രോട്ടീൻ", carbs: "കാർബ്സ്", fat: "കൊഴുപ്പ്", diet: "ഡയറ്റ്" },
    limitCap: { ldl: "പൂരിത കൊഴുപ്പ് ≤ {n} g", kidneys: "സോഡിയം ≤ {n} mg" },
    cta: "പ്ലാൻ കാണിക്കൂ",
    floorTitle: "ഞങ്ങൾ {floor}kcal-ൽ നിർത്തി",
    floorBody: "കണക്ക് ഇതിലും താഴേക്ക് പോകാൻ ആഗ്രഹിച്ചു. മെഡിക്കൽ മേൽനോട്ടമില്ലാതെ ഞങ്ങൾ ഇതിന് താഴെ ലക്ഷ്യം വയ്ക്കില്ല, അതിനാൽ നിങ്ങളുടേത് ഇവിടെയാണ്. നിങ്ങളുടെ ഡയറിയിലും അത് കാണിക്കും.",
  },
  summary: {
    lines: ["ഇതാ നിങ്ങളുടെ പ്ലാൻ"],
    kcalLabel: "kcal / ദിവസം",
    floorMarker: "സുരക്ഷയ്ക്കായി പരിധി · ഒരിക്കലും {floor}ന് താഴെയല്ല",
    macros: {
      protein: "പ്രോട്ടീൻ",
      carbs: "കാർബ്സ്",
      fat: "കൊഴുപ്പ്",
      satfat: "പൂരിത കൊഴുപ്പ് · നിങ്ങൾ ആവശ്യപ്പെട്ടത്",
    },
    capNote: "ആ ഗതിക്ക് സുരക്ഷിതമായി തുടരാവുന്നതിലും വലിയ ദൈനംദിന മാറ്റം വേണം, അതിനാൽ നിങ്ങളുടേത് സുരക്ഷിത പതിപ്പാണ്: നിങ്ങളുടെ ശരീരം ഒരു ദിവസം എരിക്കുന്നതിന്റെ {share}%.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "നിങ്ങളുടെ ആദ്യ ഭക്ഷണത്തിന്റെ ഫോട്ടോ എടുക്കൂ",
  },
  ui: {
    continueLabel: "തുടരുക",
    saveKept: "അത് സംരക്ഷിക്കാനായില്ല. നിങ്ങളുടെ ഉത്തരം ഇപ്പോഴും ഇവിടെയുണ്ട്. തുടരുക അമർത്തിയാൽ അത് വീണ്ടും അയയ്ക്കും.",
    idlePlaceholder: "Spud-ന് സന്ദേശം അയയ്ക്കൂ…",
    optionContinues: "Selects and continues",
    stepper: { continue: "തുടരുക", less: "കുറവ്", more: "കൂടുതൽ" },
    units: { years: "വയസ്സ്", yearsCount: { one: "{n} വയസ്സ്", other: "{n} വയസ്സ്" } },
  },
  beats: {
    ageWhy: "പ്രായത്തിനനുസരിച്ച് നിങ്ങളുടെ മെറ്റബോളിസം മാറുന്നു, അതിനാൽ ഞങ്ങൾ അത് കണക്കിലെടുക്കുന്നു",
    echo: { rest: "വിശ്രമത്തിൽ: ദിവസം {rest}kcal", days: "നിങ്ങളുടെ ദിവസങ്ങൾ {burn}kcal ചെലവഴിക്കുന്നു" },
    baseline: { title: "ഇതാ നിങ്ങളുടെ തുടക്കനില", bmi: "BMI", what: "ബോഡി മാസ് ഇൻഡക്സ്" },
    prelim: { title: "നിങ്ങളുടെ പ്ലാൻ", burn: "നിങ്ങൾ ചെലവഴിക്കുന്നത്", gap: "{delta} നിങ്ങളുടെ ഗതി", eat: "നിങ്ങൾ കഴിക്കുന്നത്", perDay: "kcal ദിവസം", keepTitle: "നിങ്ങൾ ഏകദേശം {burn}kcal ചെലവഴിക്കുന്നു" },
  },
  target: {
    markers: {
      lowest: "{weight} · ഞങ്ങൾ വയ്ക്കുന്ന ഏറ്റവും കുറഞ്ഞത്",
      now: "{weight} · ഇപ്പോൾ",
      nowLowest: "{weight} · ഇപ്പോൾ · ഞങ്ങൾ വയ്ക്കുന്ന ഏറ്റവും കുറഞ്ഞത്",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "ഞാൻ നിർദ്ദേശിക്കുന്നത് {weight}, ഏകദേശം {pct}% കുറവ്, ഒരു നല്ല ആദ്യ ലക്ഷ്യം", up: "ഞാൻ നിർദ്ദേശിക്കുന്നത് {weight}, ഏകദേശം {pct}% കൂടുതൽ, ഒരു നല്ല ആദ്യ ലക്ഷ്യം" },
  },
  pace: {
    rate: "ആഴ്ചയിൽ {rate}",
    rateSuffix: "ആഴ്ചയിൽ",
    result: "{month} ആകുമ്പോഴേക്കും {target} · ദിവസം {kcal}kcal",
    echo: "{from} മുതൽ {to} വരെ.",
  },
  plan: {
    weightTitle: "നിങ്ങളുടെ ഭാരം",
    everyDay: "എല്ലാ ദിവസവും",
    infoTitle: "നിങ്ങളുടെ വിവരങ്ങൾ",
    basedOn: "നിങ്ങളുടെ ഉത്തരങ്ങളെ അടിസ്ഥാനമാക്കി",
    changeAnytime: "ഇത് എപ്പോൾ വേണമെങ്കിലും മാറ്റാം",
    goal: {
      lose: "ലക്ഷ്യം: −{kg} · {month} ആകുമ്പോഴേക്കും",
      gain: "ലക്ഷ്യം: +{kg} · {month} ആകുമ്പോഴേക്കും",
      maintain: "ലക്ഷ്യം: ഏകദേശം {kg} നിലനിർത്തുക",
      maintainRange: "ശ്രേണി: {range}",
    },
    info: {
      startWeight: "തുടക്കത്തിലെ ഭാരം", goalWeight: "ലക്ഷ്യ ഭാരം", activity: "പ്രവർത്തനനില",
      target: "ലക്ഷ്യം", targetLose: "−{kg} · {month} ആകുമ്പോഴേക്കും", targetGain: "+{kg} · {month} ആകുമ്പോഴേക്കും",
    },
    satFat: { label: "പൂരിത കൊഴുപ്പ്", asked: "പൂരിത കൊഴുപ്പ് · നിങ്ങൾ ആവശ്യപ്പെട്ടത്", perDay: "ദിവസം ≤ {g}" },
    first: { title: "നിങ്ങളുടെ ആദ്യ ചുവട്", step: "നിങ്ങളുടെ അടുത്ത ഭക്ഷണത്തിന്റെ ഫോട്ടോ എടുക്കൂ. eait അതിനെ {kcal}kcal-നോട് താരതമ്യം ചെയ്യും." },
    loader: { goal: "നിങ്ങളുടെ ലക്ഷ്യം", lose: "−{kg} · {month} ആകുമ്പോഴേക്കും", gain: "+{kg} · {month} ആകുമ്പോഴേക്കും" },
    chart: { estimateAria: "കണക്കാക്കിയ ഭാരം: ഇപ്പോൾ {from}, {month} ആകുമ്പോഴേക്കും {to}" },
  },
  signup: { heading: "നിങ്ങളുടെ പ്ലാൻ സൂക്ഷിക്കൂ", line: "അതുവഴി നിങ്ങളുടെ പ്ലാനും സബ്സ്ക്രിപ്ഷനും പുതിയ ഫോണിലേക്ക് നിങ്ങളോടൊപ്പം വരും, നിങ്ങളുടെ ഭക്ഷണങ്ങളും സൂക്ഷിക്കപ്പെടും." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "ആരോഗ്യം ആപ്പുമായി സിങ്ക് ചെയ്യുക", body: "ഭാരവും പ്രവർത്തനവും ഇങ്ങോട്ട് വരുന്നു. നിങ്ങളുടെ ഭക്ഷണങ്ങൾ ആരോഗ്യം ആപ്പിലേക്ക് പോകുന്നു." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "ഒരു ഭക്ഷണം എന്റെ വക. ഫോട്ടോ എടുക്കണോ, അതോ എന്നോട് പറഞ്ഞാൽ മതിയോ?",
    react: "പ്രശ്നമില്ല. ആദ്യം എന്നെ ഒന്ന് പരീക്ഷിച്ചുനോക്കൂ",
    photo: "ഫോട്ടോ എടുക്കുക",
    tell: "നിങ്ങൾ എന്ത് കഴിച്ചെന്ന് എന്നോട് പറയൂ",
    keepGoing: "തുടരുക",
    correct: "ഭക്ഷണം തിരുത്തുക",
    afterAsk: "അതൊന്നായി. എല്ലാ ഭക്ഷണത്തിനും ഇങ്ങനെ വേണോ?",
  },
  refusals: {
    invalid: {
      age: "അതൊരു പ്രായമായി തോന്നുന്നില്ല — 34 പോലെ എന്തെങ്കിലും നൽകൂ.",
      height_cm: "സെന്റിമീറ്ററിൽ — 175 പോലെ.",
      weight_kg: "കിലോഗ്രാമിൽ — ഏകദേശം മതി.",
      target_weight_kg: "kg-ൽ ഒരു സംഖ്യ — 70 പോലെ.",
    },
    ambiguousAge: {
      line: "ഞാൻ ശരിയായാണോ വായിച്ചതെന്ന് ഉറപ്പാക്കട്ടെ — വർഷം {year} ആണ് ഉദ്ദേശിച്ചതെങ്കിൽ, നാല് അക്കങ്ങളും അയയ്ക്കൂ.",
      confirm: "എന്റെ പ്രായം {age}",
    },
    direction: {
      gain: "നിങ്ങൾ ഇപ്പോൾ {weight} kg ആണ്, ലക്ഷ്യമായി പറഞ്ഞത് {target} — ഇവിടെ നിന്ന് അത് ഭാരം കൂട്ടലല്ല. ലക്ഷ്യം മാറിയെങ്കിൽ നമുക്ക് അത് മാറ്റാം; അല്ലെങ്കിൽ {weight} എന്നതിന് മുകളിലുള്ള ഒരു സംഖ്യ തരൂ.",
      lose: "നിങ്ങൾ ഇപ്പോൾ {weight} kg ആണ്, ലക്ഷ്യമായി പറഞ്ഞത് {target} — ഇവിടെ നിന്ന് അത് ഭാരം കുറയ്ക്കലല്ല. ലക്ഷ്യം മാറിയെങ്കിൽ നമുക്ക് അത് മാറ്റാം; അല്ലെങ്കിൽ {weight} എന്നതിന് താഴെയുള്ള ഒരു സംഖ്യ തരൂ.",
      switchToLose: "ഭാരം കുറയ്ക്കലിലേക്ക് മാറുക",
      switchToGain: "ഭാരം കൂട്ടലിലേക്ക് മാറുക",
      above: "{weight} എന്നതിന് മുകളിലുള്ള ഒരു സംഖ്യ…",
      below: "{weight} എന്നതിന് താഴെയുള്ള ഒരു സംഖ്യ…",
    },
    switched: {
      gain: "മാറ്റി — ഭാരം കൂട്ടാം. kg-ൽ, എത്രയിൽ എത്താനാണ് ആഗ്രഹം?",
    },
  },
};

const KN: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "ಪ್ರಾರಂಭಿಸಿ",
    signin: "ನನಗೆ ಈಗಾಗಲೇ ಖಾತೆ ಇದೆ",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["ನೀವು ಇಲ್ಲಿ ಏನು ಮಾಡಲು ಬಂದಿದ್ದೀರಿ?"] },
      },
      options: {
        lose: { label: "ತೂಕ ಇಳಿಸಿ" },
        maintain: { label: "ತೂಕ ಕಾಯ್ದುಕೊಳ್ಳಿ" },
        gain: { label: "ತೂಕ ಹೆಚ್ಚಿಸಿ" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["ನಿಮ್ಮ ಲಿಂಗ ಯಾವುದು?"] },
      },
      options: {
        male: { label: "ಪುರುಷ" },
        female: { label: "ಮಹಿಳೆ" },
        other: { label: "ಇತರೆ" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["ನಿಮ್ಮ ವಯಸ್ಸು?"],
          placeholder: "ನಿಮ್ಮ ವಯಸ್ಸು",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ಎತ್ತರ"],
          placeholder: "ಎತ್ತರ cm ನಲ್ಲಿ",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["ನಿಮ್ಮ ತೂಕ"],
          placeholder: "ತೂಕ kg ನಲ್ಲಿ",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["ನಿಮ್ಮ ದಿನಗಳು ಎಷ್ಟು ಸಕ್ರಿಯವಾಗಿರುತ್ತವೆ?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "ವರ್ಕ್‌ಔಟ್ ಇಲ್ಲ" },
        few: { label: "1–2", hint: "ಆಗಾಗ ವರ್ಕ್‌ಔಟ್" },
        some: { label: "3–4", hint: "ವಾರಕ್ಕೆ ಕೆಲವು ವರ್ಕ್‌ಔಟ್‌ಗಳು" },
        many: { label: "5+", hint: "ಸಮರ್ಪಿತ ಕ್ರೀಡಾಪಟು" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["ನೀವು ಯಾವ ತೂಕವನ್ನು ಗುರಿಯಾಗಿಸಿದ್ದೀರಿ?"],
          placeholder: "ಗುರಿ ತೂಕ kg ನಲ್ಲಿ",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["ಎಷ್ಟು ವೇಗವಾಗಿ?"] },
      },
      options: {
        easy: { label: "ಸೌಮ್ಯ" },
        steady: { label: "ಸ್ಥಿರ" },
        push: { label: "ತ್ವರಿತ" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["ಮೊದಲು ಕ್ಯಾಲೊರಿಗಳನ್ನು ಎಣಿಸಿದ್ದೀರಾ?"] } },
      options: {
        never: { label: "ಎಂದಿಗೂ ಇಲ್ಲ" },
        stopped: { label: "ಪ್ರಯತ್ನಿಸಿದೆ, ನಿಲ್ಲಿಸಿದೆ" },
        onoff: { label: "ಆಗಿಂದಾಗಿ" },
        now: { label: "ಈಗ ಎಣಿಸುತ್ತಿದ್ದೇನೆ" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["ನಿಮ್ಮನ್ನು ಏನು ನಿಲ್ಲಿಸಿತು?", "ಹೊಂದುವವುಗಳನ್ನೆಲ್ಲಾ ಆಯ್ಕೆಮಾಡಿ"],
          variants: {
            onoff: ["ಏನು ಅಡ್ಡ ಬಂತು?", "ಹೊಂದುವವುಗಳನ್ನೆಲ್ಲಾ ಆಯ್ಕೆಮಾಡಿ"],
            now: ["ಏನು ಇನ್ನಷ್ಟು ಸುಲಭವಾಗಬೇಕು?", "ಹೊಂದುವವುಗಳನ್ನೆಲ್ಲಾ ಆಯ್ಕೆಮಾಡಿ"],
          },
        },
      },
      options: {
        too_long: { label: "ಬಹಳ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿತ್ತು" },
        forgot: { label: "ಮರೆತುಹೋಗುತ್ತಿದ್ದೆ" },
        invisible: { label: "ಫಲಿತಾಂಶ ಕಂಡುಬರಲಿಲ್ಲ" },
        no_idea: { label: "ಏನು ತಿನ್ನಬೇಕೆಂದು ತಿಳಿದಿರಲಿಲ್ಲ" },
        stressful: { label: "ಒತ್ತಡವಾಗಿ ಅನ್ನಿಸುತ್ತಿತ್ತು" },
        nobody: { label: "ಕೇಳಲು ಯಾರೂ ಇರಲಿಲ್ಲ" },
        creeping: { label: "ನನ್ನ ತೂಕ ಮತ್ತೆ ಏರಿಕೆಯಾಗುತ್ತಿತ್ತು" },
        not_enough: { label: "ಸಾಕಷ್ಟು ತಿನ್ನುವುದು ಕಷ್ಟವಾಗಿತ್ತು" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["ಯಾವಾಗ ದಾಖಲಿಸುವುದು ಅತಿ ಕಷ್ಟ?"],
          variants: { never: ["ಯಾವಾಗ ದಾಖಲಿಸುವುದು ಅತಿ ಕಷ್ಟ ಎಂದು ಭಾವಿಸುತ್ತೀರಿ?"] },
        },
      },
      options: {
        workdays: { label: "ಬಿಝಿ ಕೆಲಸದ ದಿನಗಳು" },
        eating_out: { label: "ಹೊರಗೆ ಊಟ" },
        cooking: { label: "ಇತರರಿಗಾಗಿ ಅಡುಗೆ" },
        snacks: { label: "ತಿಂಡಿಗಳು ಮತ್ತು ಪಾನೀಯಗಳು" },
        evenings: { label: "ಸಂಜೆಗಳು ಮತ್ತು ವಾರಾಂತ್ಯಗಳು" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["ನೀವು ಯಾವುದಾದರೂ ಡಯಟ್ ಅನುಸರಿಸುತ್ತೀರಾ?"] },
      },
      options: {
        balanced: { label: "ಸಮತೋಲಿತ" },
        wholefood: { label: "ಸಂಪೂರ್ಣ ಆಹಾರ" },
        mediterranean: { label: "ಮೆಡಿಟರೇನಿಯನ್" },
        flexitarian: { label: "ಫ್ಲೆಕ್ಸಿಟೇರಿಯನ್" },
        pescatarian: { label: "ಪೆಸ್ಕಟೇರಿಯನ್" },
        vegetarian: { label: "ಸಸ್ಯಾಹಾರಿ" },
        vegan: { label: "ವೀಗನ್" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["ಯಾವುದಾದರೂ ವೈದ್ಯಕೀಯ ನಿರ್ಬಂಧಗಳು?"] },
      },
      options: {
        kidneys: { label: "ಮೂತ್ರಪಿಂಡದ ಸಮಸ್ಯೆ" },
        ldl: { label: "ಅಧಿಕ ಕೊಲೆಸ್ಟ್ರಾಲ್" },
        lowsugar: { label: "ಮಧುಮೇಹದ ಅಪಾಯ" },
        none: { label: "ಇವುಗಳಲ್ಲಿ ಯಾವುದೂ ಇಲ್ಲ" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["ನೀವು ಎಲ್ಲಿ ಊಟ ಮಾಡುತ್ತೀರಿ?"], placeholder: "ಹುಡುಕಿ" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "ಬೇರೆಡೆ" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["ಗುರಿಯಾಗಿ ಒಂದು ಸ್ಟ್ರೀಕ್ ಆಯ್ಕೆಮಾಡಿ"] },
      },
      options: {
        "7": { label: "7 ದಿನಗಳು" },
        "14": { label: "14 ದಿನಗಳು" },
        "30": { label: "30 ದಿನಗಳು" },
        "50": { label: "50 ದಿನಗಳು" },
      },
    },
  ],
  building: {
    lines: ["ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಪ್ಲಾನ್ ರೂಪಿಸಲಾಗುತ್ತಿದೆ"],
    title: "ನಿಮ್ಮ ದೈನಂದಿನ ಪ್ಲಾನ್",
    rows: { calories: "ಕ್ಯಾಲೊರಿ", protein: "ಪ್ರೋಟೀನ್", carbs: "ಕಾರ್ಬ್ಸ್", fat: "ಕೊಬ್ಬು", diet: "ಡಯಟ್" },
    limitCap: { ldl: "ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು ≤ {n} g", kidneys: "ಸೋಡಿಯಂ ≤ {n} mg" },
    cta: "ಪ್ಲಾನ್ ತೋರಿಸಿ",
    floorTitle: "ನಾವು {floor}kcal ನಲ್ಲಿ ನಿಲ್ಲಿಸಿದ್ದೇವೆ",
    floorBody: "ಲೆಕ್ಕಾಚಾರ ಇನ್ನೂ ಕೆಳಗೆ ಹೋಗಲು ಬಯಸಿತ್ತು. ವೈದ್ಯಕೀಯ ಮೇಲ್ವಿಚಾರಣೆಯಿಲ್ಲದೆ ನಾವು ಇದಕ್ಕಿಂತ ಕಡಿಮೆ ಗುರಿಗಳನ್ನು ಹೊಂದಿಸುವುದಿಲ್ಲ, ಹಾಗಾಗಿ ನಿಮ್ಮದು ಇಲ್ಲೇ ಇದೆ. ನಿಮ್ಮ ಡೈರಿಯಲ್ಲೂ ಇದನ್ನೇ ತೋರಿಸಲಾಗುತ್ತದೆ.",
  },
  summary: {
    lines: ["ಇದು ನಿಮ್ಮ ಪ್ಲಾನ್"],
    kcalLabel: "kcal ದಿನಕ್ಕೆ",
    floorMarker: "ಸುರಕ್ಷತೆಗಾಗಿ ಮಿತಿಗೊಳಿಸಲಾಗಿದೆ · ಯಾವಾಗಲೂ ಕನಿಷ್ಠ {floor}",
    macros: {
      protein: "ಪ್ರೋಟೀನ್",
      carbs: "ಕಾರ್ಬ್ಸ್",
      fat: "ಕೊಬ್ಬು",
      satfat: "ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು · ನೀವು ಕೇಳಿದಂತೆ",
    },
    capNote: "ಆ ವೇಗಕ್ಕೆ ಸುರಕ್ಷಿತವಾಗಿ ಮುಂದುವರಿಸಬಹುದಾದದ್ದಕ್ಕಿಂತ ದೊಡ್ಡ ದೈನಂದಿನ ಬದಲಾವಣೆ ಬೇಕು, ಹಾಗಾಗಿ ನಿಮ್ಮದು ಸುರಕ್ಷಿತ ಆವೃತ್ತಿ: ನಿಮ್ಮ ದೇಹ ಒಂದು ದಿನದಲ್ಲಿ ಖರ್ಚು ಮಾಡುವುದರ {share}%.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "ನಿಮ್ಮ ಮೊದಲ ಊಟದ ಫೋಟೋ ತೆಗೆಯಿರಿ",
  },
  ui: {
    continueLabel: "ಮುಂದುವರಿಸಿ",
    saveKept: "ಅದನ್ನು ಉಳಿಸಲಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ಉತ್ತರ ಇನ್ನೂ ಇಲ್ಲೇ ಇದೆ. ಮುಂದುವರಿಸಿ ಒತ್ತಿದರೆ ಅದು ಮತ್ತೆ ಕಳುಹಿಸಲ್ಪಡುತ್ತದೆ.",
    idlePlaceholder: "Spud ಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ…",
    optionContinues: "Selects and continues",
    stepper: { continue: "ಮುಂದುವರಿಸಿ", less: "ಕಡಿಮೆ", more: "ಹೆಚ್ಚು" },
    units: { years: "ವರ್ಷ", yearsCount: { one: "{n} ವರ್ಷ", other: "{n} ವರ್ಷಗಳು" } },
  },
  beats: {
    ageWhy: "ವಯಸ್ಸಿನೊಂದಿಗೆ ನಿಮ್ಮ ಚಯಾಪಚಯ ಬದಲಾಗುತ್ತದೆ, ಹಾಗಾಗಿ ನಾವು ಅದನ್ನು ಲೆಕ್ಕಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತೇವೆ",
    echo: { rest: "ವಿಶ್ರಾಂತಿಯಲ್ಲಿ: ದಿನಕ್ಕೆ {rest}kcal", days: "ನಿಮ್ಮ ದಿನಗಳು {burn}kcal ಖರ್ಚು ಮಾಡುತ್ತವೆ" },
    baseline: { title: "ಇದು ನಿಮ್ಮ ಆರಂಭಿಕ ಸ್ಥಿತಿ", bmi: "BMI", what: "ಬಾಡಿ ಮಾಸ್ ಇಂಡೆಕ್ಸ್" },
    prelim: { title: "ನಿಮ್ಮ ಯೋಜನೆ", burn: "ನೀವು ಖರ್ಚು ಮಾಡುತ್ತೀರಿ", gap: "{delta} ನಿಮ್ಮ ವೇಗ", eat: "ನೀವು ತಿನ್ನುತ್ತೀರಿ", perDay: "kcal ದಿನಕ್ಕೆ", keepTitle: "ನೀವು ಸುಮಾರು {burn}kcal ಖರ್ಚು ಮಾಡುತ್ತೀರಿ" },
  },
  target: {
    markers: {
      lowest: "{weight} · ನಮ್ಮ ಕನಿಷ್ಠ",
      now: "{weight} · ಈಗ",
      nowLowest: "{weight} · ಈಗ · ನಮ್ಮ ಕನಿಷ್ಠ",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "ನನ್ನ ಸಲಹೆ {weight}, ಸುಮಾರು {pct}% ಕಡಿಮೆ, ಉತ್ತಮ ಮೊದಲ ಗುರಿ", up: "ನನ್ನ ಸಲಹೆ {weight}, ಸುಮಾರು {pct}% ಹೆಚ್ಚು, ಉತ್ತಮ ಮೊದಲ ಗುರಿ" },
  },
  pace: {
    rate: "ವಾರಕ್ಕೆ {rate}",
    rateSuffix: "ವಾರಕ್ಕೆ",
    result: "ಸುಮಾರು {month} ವೇಳೆಗೆ {target} · ದಿನಕ್ಕೆ {kcal}kcal",
    echo: "{from} ರಿಂದ {to} ವರೆಗೆ.",
  },
  plan: {
    weightTitle: "ನಿಮ್ಮ ತೂಕ",
    everyDay: "ಪ್ರತಿದಿನ",
    infoTitle: "ನಿಮ್ಮ ಮಾಹಿತಿ",
    basedOn: "ನಿಮ್ಮ ಉತ್ತರಗಳನ್ನು ಆಧರಿಸಿ",
    changeAnytime: "ಇದನ್ನು ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಿಸಬಹುದು",
    goal: {
      lose: "ಗುರಿ: −{kg} · {month} ವೇಳೆಗೆ",
      gain: "ಗುರಿ: +{kg} · {month} ವೇಳೆಗೆ",
      maintain: "ಗುರಿ: ಸುಮಾರು {kg} ಕಾಯ್ದುಕೊಳ್ಳುವುದು",
      maintainRange: "ವ್ಯಾಪ್ತಿ: {range}",
    },
    info: {
      startWeight: "ಆರಂಭಿಕ ತೂಕ", goalWeight: "ಗುರಿ ತೂಕ", activity: "ಚಟುವಟಿಕೆ",
      target: "ಗುರಿ", targetLose: "−{kg} · {month} ವೇಳೆಗೆ", targetGain: "+{kg} · {month} ವೇಳೆಗೆ",
    },
    satFat: { label: "ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು", asked: "ಸ್ಯಾಚುರೇಟೆಡ್ ಕೊಬ್ಬು · ನೀವು ಕೇಳಿದ್ದು", perDay: "ದಿನಕ್ಕೆ ≤ {g}" },
    first: { title: "ನಿಮ್ಮ ಮೊದಲ ಹೆಜ್ಜೆ", step: "ನಿಮ್ಮ ಮುಂದಿನ ಊಟದ ಫೋಟೋ ತೆಗೆಯಿರಿ. eait ಅದನ್ನು {kcal}kcal ವಿರುದ್ಧ ಪರಿಶೀಲಿಸುತ್ತದೆ." },
    loader: { goal: "ನಿಮ್ಮ ಗುರಿ", lose: "−{kg} · {month} ವೇಳೆಗೆ", gain: "+{kg} · {month} ವೇಳೆಗೆ" },
    chart: { estimateAria: "ಅಂದಾಜು ತೂಕ: ಈಗ {from}, ಸುಮಾರು {month} ವೇಳೆಗೆ {to}" },
  },
  signup: { heading: "ನಿಮ್ಮ ಪ್ಲಾನ್ ಉಳಿಸಿ", line: "ಆದ್ದರಿಂದ ನಿಮ್ಮ ಪ್ಲಾನ್ ಮತ್ತು ನಿಮ್ಮ ಚಂದಾದಾರಿಕೆ ಹೊಸ ಫೋನ್‌ಗೆ ನಿಮ್ಮೊಂದಿಗೆ ಬರುತ್ತವೆ ಮತ್ತು ನಿಮ್ಮ ಊಟಗಳು ಉಳಿಸಲ್ಪಡುತ್ತವೆ." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "ಆರೋಗ್ಯ ಆ್ಯಪ್‌ನೊಂದಿಗೆ ಸಿಂಕ್ ಮಾಡಿ", body: "ತೂಕ ಮತ್ತು ಚಟುವಟಿಕೆ ಇಲ್ಲಿಗೆ ಬರುತ್ತವೆ. ನಿಮ್ಮ ಊಟಗಳು ಆರೋಗ್ಯ ಆ್ಯಪ್‌ಗೆ ಹೋಗುತ್ತವೆ." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "ಒಂದು ಊಟ ನನ್ನ ಕಡೆಯಿಂದ. ಫೋಟೋ, ಅಥವಾ ಸುಮ್ಮನೆ ನನಗೆ ಹೇಳುತ್ತೀರಾ?",
    react: "ಪರವಾಗಿಲ್ಲ. ಮೊದಲು ನನ್ನನ್ನು ಪ್ರಯತ್ನಿಸಿ ನೋಡಿ",
    photo: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    tell: "ನೀವು ಏನು ತಿಂದಿರಿ ಎಂದು ಹೇಳಿ",
    keepGoing: "ಮುಂದೆ ಸಾಗಿ",
    correct: "ಊಟ ಸರಿಪಡಿಸಿ",
    afterAsk: "ಅದು ಒಂದು ಆಯಿತು. ಪ್ರತಿ ಊಟಕ್ಕೂ ಇದು ಬೇಕೇ?",
  },
  refusals: {
    invalid: {
      age: "ಇದು ವಯಸ್ಸಿನಂತೆ ಕಾಣುತ್ತಿಲ್ಲ — ಉದಾಹರಣೆಗೆ 34 ಎಂದು ಬರೆಯಿರಿ.",
      height_cm: "ಸೆಂಟಿಮೀಟರ್‌ಗಳಲ್ಲಿ — ಉದಾಹರಣೆಗೆ 175.",
      weight_kg: "ಕಿಲೋಗ್ರಾಂಗಳಲ್ಲಿ — ಅಂದಾಜು ಸಾಕು.",
      target_weight_kg: "kg ನಲ್ಲಿ ಒಂದು ಸಂಖ್ಯೆ — ಉದಾಹರಣೆಗೆ 70.",
    },
    ambiguousAge: {
      line: "ನಾನು ಸರಿಯಾಗಿ ಓದಿದ್ದೇನೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು — ನೀವು {year} ಇಸವಿಯನ್ನು ಉದ್ದೇಶಿಸಿದ್ದರೆ, ನಾಲ್ಕೂ ಅಂಕೆಗಳನ್ನು ಕಳುಹಿಸಿ.",
      confirm: "ನನಗೆ {age} ವರ್ಷ",
    },
    direction: {
      gain: "ನೀವು ಈಗ {weight} kg ಇದ್ದೀರಿ ಮತ್ತು {target} ವರೆಗೆ ತೂಕ ಹೆಚ್ಚಿಸಲು ಕೇಳಿದ್ದೀರಿ — ಇಲ್ಲಿಂದ ಅದು ಹೆಚ್ಚಳವಲ್ಲ. ಗುರಿ ಬದಲಾಗಿದ್ದರೆ, ನಾವು ಅದನ್ನು ಬದಲಿಸಬಹುದು; ಇಲ್ಲದಿದ್ದರೆ {weight} ಮೀರಿದ ಸಂಖ್ಯೆ ಕೊಡಿ.",
      lose: "ನೀವು ಈಗ {weight} kg ಇದ್ದೀರಿ ಮತ್ತು {target} ವರೆಗೆ ತೂಕ ಇಳಿಸಲು ಕೇಳಿದ್ದೀರಿ — ಇಲ್ಲಿಂದ ಅದು ಇಳಿಕೆಯಲ್ಲ. ಗುರಿ ಬದಲಾಗಿದ್ದರೆ, ನಾವು ಅದನ್ನು ಬದಲಿಸಬಹುದು; ಇಲ್ಲದಿದ್ದರೆ {weight} ಕ್ಕಿಂತ ಕಡಿಮೆ ಸಂಖ್ಯೆ ಕೊಡಿ.",
      switchToLose: "ತೂಕ ಇಳಿಸುವುದಕ್ಕೆ ಬದಲಿಸಿ",
      switchToGain: "ತೂಕ ಹೆಚ್ಚಿಸುವುದಕ್ಕೆ ಬದಲಿಸಿ",
      above: "{weight} ಮೀರಿದ ಸಂಖ್ಯೆ…",
      below: "{weight} ಕ್ಕಿಂತ ಕಡಿಮೆ ಸಂಖ್ಯೆ…",
    },
    switched: {
      gain: "ಬದಲಾಯಿಸಲಾಗಿದೆ — ತೂಕ ಹೆಚ್ಚಿಸುವುದು. kg ನಲ್ಲಿ ನೀವು ಎಷ್ಟು ತಲುಪಲು ಬಯಸುತ್ತೀರಿ?",
    },
  },
};

const GU: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "શરૂ કરો",
    signin: "મારું એકાઉન્ટ પહેલેથી છે",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["તમે અહીં શું કરવા માંગો છો?"] },
      },
      options: {
        lose: { label: "વજન ઘટાડો" },
        maintain: { label: "મારું વજન જાળવો" },
        gain: { label: "વજન વધારો" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["તમારું લિંગ શું છે?"] },
      },
      options: {
        male: { label: "પુરુષ" },
        female: { label: "સ્ત્રી" },
        other: { label: "અન્ય" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["તમારી ઉંમર?"],
          placeholder: "તમારી ઉંમર",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ઊંચાઈ"],
          placeholder: "ઊંચાઈ cm માં",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["તમારું વજન"],
          placeholder: "વજન kg માં",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["તમારા દિવસો કેટલા સક્રિય હોય છે?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "કોઈ વર્કઆઉટ નહીં" },
        few: { label: "1–2", hint: "ક્યારેક વર્કઆઉટ" },
        some: { label: "3–4", hint: "અઠવાડિયામાં થોડા વર્કઆઉટ" },
        many: { label: "5+", hint: "સમર્પિત ઍથ્લીટ" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["તમારું લક્ષ્ય વજન શું છે?"],
          placeholder: "લક્ષ્ય વજન kg માં",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["કેટલી ઝડપે?"] },
      },
      options: {
        easy: { label: "હળવી" },
        steady: { label: "સ્થિર" },
        push: { label: "ઝડપી" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["પહેલાં ક્યારેય કેલરી ગણી છે?"] } },
      options: {
        never: { label: "ક્યારેય નહીં" },
        stopped: { label: "ટ્રાય કરી, પછી છોડી દીધી" },
        onoff: { label: "ક્યારેક ક્યારેક" },
        now: { label: "હવે ગણું છું" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["શેનાથી તમે અટક્યા?", "લાગુ પડતું બધું પસંદ કરો"],
          variants: {
            onoff: ["શું અડચણ આવી?", "લાગુ પડતું બધું પસંદ કરો"],
            now: ["શું વધુ સરળ હોવું જોઈએ?", "લાગુ પડતું બધું પસંદ કરો"],
          },
        },
      },
      options: {
        too_long: { label: "બહુ સમય લેતું હતું" },
        forgot: { label: "યાદ નહોતું રહેતું" },
        invisible: { label: "પરિણામ દેખાતું નહોતું" },
        no_idea: { label: "શું ખાવું એ ખ્યાલ નહોતો" },
        stressful: { label: "તણાવભર્યું લાગતું હતું" },
        nobody: { label: "પૂછવા કોઈ નહોતું" },
        creeping: { label: "મારું વજન ફરી વધતું હતું" },
        not_enough: { label: "પૂરતું ખાવું મુશ્કેલ હતું" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["નોંધવું ક્યારે સૌથી અઘરું?"],
          variants: { never: ["નોંધવું ક્યારે સૌથી અઘરું થશે એમ લાગે છે?"] },
        },
      },
      options: {
        workdays: { label: "વ્યસ્ત કામકાજના દિવસો" },
        eating_out: { label: "બહાર જમવું" },
        cooking: { label: "બીજા માટે રસોઈ" },
        snacks: { label: "નાસ્તા અને પીણાં" },
        evenings: { label: "સાંજો અને વીકેન્ડ" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["શું તમે કોઈ ડાયટ અનુસરો છો?"] },
      },
      options: {
        balanced: { label: "સંતુલિત" },
        wholefood: { label: "હોલ-ફૂડ" },
        mediterranean: { label: "મેડિટેરેનિયન" },
        flexitarian: { label: "ફ્લેક્સિટેરિયન" },
        pescatarian: { label: "પેસ્કેટેરિયન" },
        vegetarian: { label: "શાકાહારી" },
        vegan: { label: "વીગન" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["કોઈ તબીબી મર્યાદા?"] },
      },
      options: {
        kidneys: { label: "કિડનીની બીમારી" },
        ldl: { label: "ઊંચું કોલેસ્ટ્રોલ" },
        lowsugar: { label: "ડાયાબિટીસનું જોખમ" },
        none: { label: "આમાંથી કંઈ નહીં" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["તમે ક્યાં જમો છો?"], placeholder: "શોધો" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "બીજે ક્યાંક" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["સ્ટ્રીકનું લક્ષ્ય પસંદ કરો"] },
      },
      options: {
        "7": { label: "7 દિવસ" },
        "14": { label: "14 દિવસ" },
        "30": { label: "30 દિવસ" },
        "50": { label: "50 દિવસ" },
      },
    },
  ],
  building: {
    lines: ["તમારો વ્યક્તિગત પ્લાન બની રહ્યો છે"],
    title: "તમારો રોજનો પ્લાન",
    rows: { calories: "કેલરી", protein: "પ્રોટીન", carbs: "કાર્બ્સ", fat: "ફેટ", diet: "ડાયટ" },
    limitCap: { ldl: "સેચ્યુરેટેડ ફેટ ≤ {n} g", kidneys: "સોડિયમ ≤ {n} mg" },
    cta: "મને પ્લાન બતાવો",
    floorTitle: "{floor}kcal પર અટકાવ્યું",
    floorBody: "ગણતરી આનાથી નીચે જવા માંગતી હતી. તબીબી દેખરેખ વિના અમે આનાથી ઓછું લક્ષ્ય નક્કી કરતા નથી, તેથી તમારું લક્ષ્ય અહીં જ છે. તમારી ડાયરીમાં પણ આ લખેલું હશે.",
  },
  summary: {
    lines: ["આ રહ્યો તમારો પ્લાન"],
    kcalLabel: "kcal પ્રતિ દિવસ",
    floorMarker: "સુરક્ષા માટે મર્યાદિત · ક્યારેય {floor} થી ઓછું નહીં",
    macros: {
      protein: "પ્રોટીન",
      carbs: "કાર્બ્સ",
      fat: "ફેટ",
      satfat: "સેચ્યુરેટેડ ફેટ · તમારા કહેવાથી",
    },
    capNote: "એ ઝડપ માટે રોજ એટલો મોટો ફેરફાર જોઈએ જેટલો સુરક્ષિત રીતે ટકાવી ન શકાય, તેથી તમારો પ્લાન સુરક્ષિત સંસ્કરણ છે: તમારું શરીર એક દિવસમાં જેટલું ખર્ચે છે તેના {share}%.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "તમારા પહેલા ભોજનનો ફોટો લો",
  },
  ui: {
    continueLabel: "ચાલુ રાખો",
    saveKept: "આ સેવ ન થઈ શક્યું. તમારો જવાબ હજી અહીં જ છે. ચાલુ રાખો દબાવતાં તે ફરીથી મોકલાશે.",
    idlePlaceholder: "Spud ને મેસેજ કરો…",
    optionContinues: "Selects and continues",
    stepper: { continue: "ચાલુ રાખો", less: "ઓછું", more: "વધુ" },
    units: { years: "વર્ષ", yearsCount: { one: "{n} વર્ષ", other: "{n} વર્ષ" } },
  },
  beats: {
    ageWhy: "ઉંમર સાથે તમારું મેટાબોલિઝમ બદલાય છે, તેથી અમે તેને ધ્યાનમાં લઈએ છીએ",
    echo: { rest: "આરામની સ્થિતિમાં: {rest}kcal પ્રતિ દિવસ", days: "તમારા દિવસો {burn}kcal ખર્ચે છે" },
    baseline: { title: "આ રહ્યો તમારો શરૂઆતનો આધાર", bmi: "BMI", what: "બોડી માસ ઇન્ડેક્સ" },
    prelim: { title: "તમારી યોજના", burn: "તમે ખર્ચો છો", gap: "{delta} તમારી ઝડપ", eat: "તમે ખાઓ છો", perDay: "kcal પ્રતિ દિવસ", keepTitle: "તમે લગભગ {burn}kcal ખર્ચો છો" },
  },
  target: {
    markers: {
      lowest: "{weight} · અમારું ન્યૂનતમ",
      now: "{weight} · અત્યારે",
      nowLowest: "{weight} · અત્યારે · અમારું ન્યૂનતમ",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "મારું સૂચન {weight} છે, લગભગ {pct}% ઓછું, એક સારું પહેલું ધ્યેય", up: "મારું સૂચન {weight} છે, લગભગ {pct}% વધુ, એક સારું પહેલું ધ્યેય" },
  },
  pace: {
    rate: "{rate} પ્રતિ અઠવાડિયું",
    rateSuffix: "પ્રતિ અઠવાડિયું",
    result: "{month} આસપાસ {target} · {kcal}kcal પ્રતિ દિવસ",
    echo: "{from} થી {to} સુધી.",
  },
  plan: {
    weightTitle: "તમારું વજન",
    everyDay: "દરરોજ",
    infoTitle: "તમારી માહિતી",
    basedOn: "તમારા જવાબોના આધારે",
    changeAnytime: "આ ગમે ત્યારે બદલી શકાય છે",
    goal: {
      lose: "ધ્યેય: −{kg} · {month} સુધીમાં",
      gain: "ધ્યેય: +{kg} · {month} સુધીમાં",
      maintain: "ધ્યેય: લગભગ {kg} પર રહેવું",
      maintainRange: "શ્રેણી: {range}",
    },
    info: {
      startWeight: "શરૂઆતનું વજન", goalWeight: "લક્ષ્ય વજન", activity: "પ્રવૃત્તિ",
      target: "લક્ષ્ય", targetLose: "−{kg} · {month} સુધીમાં", targetGain: "+{kg} · {month} સુધીમાં",
    },
    satFat: { label: "સેચ્યુ. ફેટ", asked: "સેચ્યુરેટેડ ફેટ · તમારી વિનંતી પર", perDay: "≤ {g} પ્રતિ દિવસ" },
    first: { title: "તમારું પહેલું પગલું", step: "તમારા આગલા ભોજનનો ફોટો લો. eait તેને {kcal}kcal સામે તપાસે છે." },
    loader: { goal: "તમારું ધ્યેય", lose: "−{kg} · {month} સુધીમાં", gain: "+{kg} · {month} સુધીમાં" },
    chart: { estimateAria: "અંદાજિત વજન: અત્યારે {from}, {month} આસપાસ {to}" },
  },
  signup: { heading: "તમારો પ્લાન સાચવો", line: "જેથી તમારો પ્લાન અને તમારું સબ્સ્ક્રિપ્શન નવા ફોન પર તમારી સાથે રહે, અને તમારા ભોજન જળવાયેલા રહે." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "હેલ્થ સાથે સિંક કરો", body: "વજન અને પ્રવૃત્તિ અહીં આવે છે. તમારાં ભોજન હેલ્થમાં જાય છે." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "એક ભોજન મારા તરફથી. ફોટો, કે બસ મને કહેશો?",
    react: "કોઈ વાંધો નહીં. પહેલાં મને અજમાવી જુઓ",
    photo: "ફોટો લો",
    tell: "મને કહો કે તમે શું ખાધું",
    keepGoing: "આગળ વધો",
    correct: "ભોજન સુધારો",
    afterAsk: "આ એક થયું. દરેક ભોજન માટે આવું જોઈએ છે?",
  },
  refusals: {
    invalid: {
      age: "આ ઉંમર જેવું લાગતું નથી — 34 જેવું કંઈક લખો.",
      height_cm: "સેન્ટિમીટરમાં — 175 જેવું કંઈક.",
      weight_kg: "કિલોગ્રામમાં — અંદાજે પણ ચાલશે.",
      target_weight_kg: "kg માં એક સંખ્યા — જેમ કે 70.",
    },
    ambiguousAge: {
      line: "ખાતરી કરી લઈએ: જો તમારો મતલબ વર્ષ {year} હતો, તો ચારેય અંક મોકલો.",
      confirm: "મારી ઉંમર {age} છે",
    },
    direction: {
      gain: "અત્યારે તમારું વજન {weight} kg છે અને લક્ષ્ય {target} — અહીંથી તે વધારો નથી. જો ધ્યેય બદલાયું હોય, તો આપણે તેને બદલી શકીએ; નહીં તો {weight} થી વધુ કોઈ સંખ્યા આપો.",
      lose: "અત્યારે તમારું વજન {weight} kg છે અને લક્ષ્ય {target} — અહીંથી તે ઘટાડો નથી. જો ધ્યેય બદલાયું હોય, તો આપણે તેને બદલી શકીએ; નહીં તો {weight} થી ઓછી કોઈ સંખ્યા આપો.",
      switchToLose: "વજન ઘટાડવા પર સ્વિચ કરો",
      switchToGain: "વજન વધારવા પર સ્વિચ કરો",
      above: "{weight} થી વધુ કોઈ સંખ્યા…",
      below: "{weight} થી ઓછી કોઈ સંખ્યા…",
    },
    switched: {
      gain: "બદલી દીધું — તો વજન વધારવાનું છે. લક્ષ્ય કેટલું રાખીએ, kg માં?",
    },
  },
};

const BN: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "শুরু করুন",
    signin: "আমার আগে থেকেই অ্যাকাউন্ট আছে",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["আপনি এখানে কী করতে চান?"] },
      },
      options: {
        lose: { label: "ওজন কমান" },
        maintain: { label: "ওজন ধরে রাখুন" },
        gain: { label: "ওজন বাড়ান" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["আপনার লিঙ্গ কী?"] },
      },
      options: {
        male: { label: "পুরুষ" },
        female: { label: "নারী" },
        other: { label: "অন্যান্য" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["আপনার বয়স?"],
          placeholder: "আপনার বয়স",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["উচ্চতা"],
          placeholder: "উচ্চতা (cm)",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["আপনার ওজন"],
          placeholder: "ওজন (kg)",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["আপনার দিনগুলো কতটা সক্রিয়?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "কোনো ওয়ার্কআউট নয়" },
        few: { label: "1–2", hint: "মাঝে মাঝে ওয়ার্কআউট" },
        some: { label: "3–4", hint: "সপ্তাহে কয়েকটি ওয়ার্কআউট" },
        many: { label: "5+", hint: "পুরোদস্তুর অ্যাথলিট" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["কোন ওজনে পৌঁছাতে চান?"],
          placeholder: "লক্ষ্য ওজন (kg)",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["কত দ্রুত?"] },
      },
      options: {
        easy: { label: "হালকা" },
        steady: { label: "স্থির" },
        push: { label: "দ্রুত" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["আগে কি ক্যালরি গুনেছেন?"] } },
      options: {
        never: { label: "কখনো না" },
        stopped: { label: "চেষ্টা করেছিলাম, ছেড়ে দিয়েছি" },
        onoff: { label: "মাঝে মাঝে" },
        now: { label: "এখন গুনছি" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["কী আপনাকে থামিয়েছিল?", "যা যা মানায় সব বেছে নিন"],
          variants: {
            onoff: ["কী বাধা হয়েছিল?", "যা যা মানায় সব বেছে নিন"],
            now: ["কী সহজ হলে ভালো হতো?", "যা যা মানায় সব বেছে নিন"],
          },
        },
      },
      options: {
        too_long: { label: "বেশি সময় লাগত" },
        forgot: { label: "ভুলে যেতাম" },
        invisible: { label: "ফলাফল দেখা যেত না" },
        no_idea: { label: "কী খাব জানতাম না" },
        stressful: { label: "চাপের লাগত" },
        nobody: { label: "জিজ্ঞেস করার মতো কেউ ছিল না" },
        creeping: { label: "আমার ওজন আবার বেড়ে যেত" },
        not_enough: { label: "যথেষ্ট খাওয়া কঠিন ছিল" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["কখন লিখে রাখা সবচেয়ে কঠিন?"],
          variants: { never: ["কখন লিখে রাখা সবচেয়ে কঠিন হবে বলে মনে করেন?"] },
        },
      },
      options: {
        workdays: { label: "ব্যস্ত কর্মদিবস" },
        eating_out: { label: "বাইরে খাওয়া" },
        cooking: { label: "অন্যদের জন্য রান্না" },
        snacks: { label: "স্ন্যাকস আর পানীয়" },
        evenings: { label: "সন্ধ্যে আর ছুটির দিন" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["আপনি কি কোনো ডায়েট মেনে চলেন?"] },
      },
      options: {
        balanced: { label: "সুষম" },
        wholefood: { label: "অপ্রক্রিয়াজাত খাবার" },
        mediterranean: { label: "ভূমধ্যসাগরীয়" },
        flexitarian: { label: "ফ্লেক্সিটেরিয়ান" },
        pescatarian: { label: "পেসকেটেরিয়ান" },
        vegetarian: { label: "নিরামিষ" },
        vegan: { label: "ভিগান" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["কোনো চিকিৎসাগত সীমাবদ্ধতা?"] },
      },
      options: {
        kidneys: { label: "কিডনির সমস্যা" },
        ldl: { label: "উচ্চ কোলেস্টেরল" },
        lowsugar: { label: "ডায়াবেটিসের ঝুঁকি" },
        none: { label: "এগুলোর কোনোটিই নয়" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["আপনি কোথায় খান?"], placeholder: "খুঁজুন" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "অন্য কোথাও" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["কত দিনের স্ট্রিক লক্ষ্য রাখবেন, বেছে নিন"] },
      },
      options: {
        "7": { label: "7 দিন" },
        "14": { label: "14 দিন" },
        "30": { label: "30 দিন" },
        "50": { label: "50 দিন" },
      },
    },
  ],
  building: {
    lines: ["আপনার ব্যক্তিগত প্ল্যান তৈরি হচ্ছে"],
    title: "আপনার দৈনিক প্ল্যান",
    rows: { calories: "ক্যালরি", protein: "প্রোটিন", carbs: "কার্বস", fat: "ফ্যাট", diet: "ডায়েট" },
    limitCap: { ldl: "স্যাচু. ফ্যাট ≤ {n} g", kidneys: "সোডিয়াম ≤ {n} mg" },
    cta: "প্ল্যানটা দেখান",
    floorTitle: "{floor}kcal-এ থামানো হয়েছে",
    floorBody: "হিসাব আরও নিচে যেতে চাইছিল। চিকিৎসকের তত্ত্বাবধান ছাড়া আমরা এর নিচে লক্ষ্যমাত্রা রাখি না, তাই আপনারটা এখানেই। আপনার ডায়েরিতেও সেটা লেখা থাকবে।",
  },
  summary: {
    lines: ["এই হলো আপনার প্ল্যান"],
    kcalLabel: "kcal প্রতিদিন",
    floorMarker: "নিরাপত্তার জন্য সীমিত · কখনো {floor}-এর নিচে নয়",
    macros: {
      protein: "প্রোটিন",
      carbs: "কার্বস",
      fat: "ফ্যাট",
      satfat: "স্যাচুরেটেড ফ্যাট · আপনার অনুরোধে",
    },
    capNote: "ওই গতির জন্য প্রতিদিন যত বড় পরিবর্তন দরকার, তা নিরাপদে ধরে রাখা যায় না, তাই আপনারটা নিরাপদ সংস্করণ: আপনার শরীর এক দিনে যা খরচ করে তার {share}%।",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "আপনার প্রথম খাবারের ছবি তুলুন",
  },
  ui: {
    continueLabel: "চালিয়ে যান",
    saveKept: "এটি সেভ করা যায়নি। আপনার উত্তর এখনও এখানে আছে। চালিয়ে যান চাপলে আবার পাঠানো হবে।",
    idlePlaceholder: "Spud-কে মেসেজ করুন…",
    optionContinues: "Selects and continues",
    stepper: { continue: "চালিয়ে যান", less: "কম", more: "বেশি" },
    units: { years: "বছর", yearsCount: { one: "{n} বছর", other: "{n} বছর" } },
  },
  beats: {
    ageWhy: "বয়সের সঙ্গে আপনার মেটাবলিজম বদলায়, তাই আমরা সেটা হিসাবে রাখি",
    echo: { rest: "বিশ্রামে: দিনে {rest}kcal", days: "আপনার দিনগুলো {burn}kcal খরচ করে" },
    baseline: { title: "এই হলো আপনার শুরুর অবস্থা", bmi: "BMI", what: "বডি মাস ইনডেক্স" },
    prelim: { title: "আপনার পরিকল্পনা", burn: "আপনি খরচ করেন", gap: "{delta} আপনার গতি", eat: "আপনি খান", perDay: "kcal দিনে", keepTitle: "আপনি প্রায় {burn}kcal খরচ করেন" },
  },
  target: {
    markers: {
      lowest: "{weight} · আমাদের সর্বনিম্ন",
      now: "{weight} · এখন",
      nowLowest: "{weight} · এখন · আমাদের সর্বনিম্ন",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "আমার পরামর্শ {weight}, প্রায় {pct}% কম, প্রথম লক্ষ্য হিসেবে ভালো", up: "আমার পরামর্শ {weight}, প্রায় {pct}% বেশি, প্রথম লক্ষ্য হিসেবে ভালো" },
  },
  pace: {
    rate: "সপ্তাহে {rate}",
    rateSuffix: "প্রতি সপ্তাহে",
    result: "{month} নাগাদ {target} · দিনে {kcal}kcal",
    echo: "{from} থেকে {to}।",
  },
  plan: {
    weightTitle: "আপনার ওজন",
    everyDay: "প্রতিদিন",
    infoTitle: "আপনার তথ্য",
    basedOn: "আপনার উত্তরের ভিত্তিতে",
    changeAnytime: "এটি যেকোনো সময় বদলাতে পারেন",
    goal: {
      lose: "লক্ষ্য: −{kg} · {month} নাগাদ",
      gain: "লক্ষ্য: +{kg} · {month} নাগাদ",
      maintain: "লক্ষ্য: প্রায় {kg}-এ থাকা",
      maintainRange: "পরিসর: {range}",
    },
    info: {
      startWeight: "শুরুর ওজন", goalWeight: "লক্ষ্য ওজন", activity: "কার্যকলাপ",
      target: "লক্ষ্যমাত্রা", targetLose: "−{kg} · {month} নাগাদ", targetGain: "+{kg} · {month} নাগাদ",
    },
    satFat: { label: "স্যাচু. ফ্যাট", asked: "স্যাচুরেটেড ফ্যাট · আপনার অনুরোধে", perDay: "দিনে ≤ {g}" },
    first: { title: "আপনার প্রথম ধাপ", step: "পরের খাবারের ছবি তুলুন। eait সেটি {kcal}kcal-এর সঙ্গে মিলিয়ে দেখে।" },
    loader: { goal: "আপনার লক্ষ্য", lose: "−{kg} · {month} নাগাদ", gain: "+{kg} · {month} নাগাদ" },
    chart: { estimateAria: "আনুমানিক ওজন: এখন {from}, {month} নাগাদ {to}" },
  },
  signup: { heading: "আপনার প্ল্যান সংরক্ষণ করুন", line: "যাতে আপনার প্ল্যান এবং সাবস্ক্রিপশন নতুন ফোনে আপনার সাথে থাকে এবং আপনার খাবারগুলো সংরক্ষিত থাকে।" },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "স্বাস্থ্য অ্যাপের সঙ্গে সিঙ্ক করুন", body: "ওজন আর কার্যকলাপ এখানে আসে। আপনার খাবার যায় স্বাস্থ্য অ্যাপে।" },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "একটা খাবার আমার তরফ থেকে। ছবি, নাকি শুধু বলে দেবেন?",
    react: "কোনো সমস্যা নেই। আগে আমাকে একবার পরখ করে দেখুন",
    photo: "ছবি তুলুন",
    tell: "কী খেয়েছেন, আমাকে বলুন",
    keepGoing: "চালিয়ে যান",
    correct: "খাবার সংশোধন করুন",
    afterAsk: "একটা হয়ে গেল। প্রতিটি খাবারের জন্য এটা চান?",
  },
  refusals: {
    invalid: {
      age: "এটা বয়স বলে মনে হচ্ছে না — যেমন 34, এমন কিছু লিখুন।",
      height_cm: "সেন্টিমিটারে — যেমন 175।",
      weight_kg: "কিলোগ্রামে — আনুমানিক হলেও চলবে।",
      target_weight_kg: "kg-তে একটি সংখ্যা — যেমন 70।",
    },
    ambiguousAge: {
      line: "ঠিক পড়েছি কি না নিশ্চিত হতে চাই — আপনি যদি {year} সাল বোঝাতে চান, তাহলে চারটি অঙ্কই পাঠান।",
      confirm: "আমার বয়স {age}",
    },
    direction: {
      gain: "আপনার ওজন এখন {weight} kg, আর বাড়ানোর লক্ষ্য দিয়েছেন {target} — এখান থেকে সেটা বাড়ানো নয়। লক্ষ্য বদলে থাকলে সেটা পাল্টে দিতে পারি; নইলে {weight} থেকে বেশি একটা সংখ্যা দিন।",
      lose: "আপনার ওজন এখন {weight} kg, আর কমানোর লক্ষ্য দিয়েছেন {target} — এখান থেকে সেটা কমানো নয়। লক্ষ্য বদলে থাকলে সেটা পাল্টে দিতে পারি; নইলে {weight} থেকে কম একটা সংখ্যা দিন।",
      switchToLose: "ওজন কমানোয় বদলান",
      switchToGain: "ওজন বাড়ানোয় বদলান",
      above: "{weight} থেকে বেশি একটা সংখ্যা…",
      below: "{weight} থেকে কম একটা সংখ্যা…",
    },
    switched: {
      gain: "বদলে দিয়েছি — তাহলে ওজন বাড়ানো। কোথায় পৌঁছাতে চান, kg-তে?",
    },
  },
};

const PT_PT: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Começar",
    signin: "Já tenho uma conta",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["O que queres alcançar?"] },
      },
      options: {
        lose: { label: "Perder peso" },
        maintain: { label: "Manter o peso" },
        gain: { label: "Ganhar peso" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Qual é o teu sexo?"] },
      },
      options: {
        male: { label: "Masculino" },
        female: { label: "Feminino" },
        other: { label: "Outro" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["A tua idade?"],
          placeholder: "A tua idade",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Altura"],
          placeholder: "Altura em cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["O teu peso"],
          placeholder: "Peso em kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Quão ativos são os teus dias?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Sem treinos" },
        few: { label: "1–2", hint: "Treinos de vez em quando" },
        some: { label: "3–4", hint: "Alguns treinos por semana" },
        many: { label: "5+", hint: "Treino quase todos os dias" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Que peso queres atingir?"],
          placeholder: "Peso-alvo em kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["A que ritmo?"] },
      },
      options: {
        easy: { label: "Leve" },
        steady: { label: "Constante" },
        push: { label: "Rápido" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Já contaste calorias?"] } },
      options: {
        never: { label: "Nunca" },
        stopped: { label: "Tentei, desisti" },
        onoff: { label: "De vez em quando" },
        now: { label: "Conto agora" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["O que te fez parar?", "Escolhe tudo o que se aplica"],
          variants: {
            onoff: ["O que se meteu no caminho?", "Escolhe tudo o que se aplica"],
            now: ["O que gostarias que fosse mais fácil?", "Escolhe tudo o que se aplica"],
          },
        },
      },
      options: {
        too_long: { label: "Demorava demasiado" },
        forgot: { label: "Esquecia-me" },
        invisible: { label: "Não via resultados" },
        no_idea: { label: "Não sabia o que comer" },
        stressful: { label: "Era stressante" },
        nobody: { label: "Ninguém a quem perguntar" },
        creeping: { label: "O meu peso voltava a subir" },
        not_enough: { label: "Difícil comer o suficiente" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Quando é mais difícil registar?"],
          variants: { never: ["Quando achas que registar vai ser mais difícil?"] },
        },
      },
      options: {
        workdays: { label: "Dias de trabalho cheios" },
        eating_out: { label: "Comer fora" },
        cooking: { label: "Cozinhar para outros" },
        snacks: { label: "Snacks e bebidas" },
        evenings: { label: "Serões e fins de semana" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Segues alguma dieta?"] },
      },
      options: {
        balanced: { label: "Equilibrada" },
        wholefood: { label: "Alimentos integrais" },
        mediterranean: { label: "Mediterrânica" },
        flexitarian: { label: "Flexitariana" },
        pescatarian: { label: "Pescetariana" },
        vegetarian: { label: "Vegetariana" },
        vegan: { label: "Vegana" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Alguma restrição médica?"] },
      },
      options: {
        kidneys: { label: "Doença renal" },
        ldl: { label: "Colesterol alto" },
        lowsugar: { label: "Risco de diabetes" },
        none: { label: "Nenhuma destas" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Onde comes?"], placeholder: "Pesquisar" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Outro lugar" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Escolhe uma sequência como objetivo"] },
      },
      options: {
        "7": { label: "7 dias" },
        "14": { label: "14 dias" },
        "30": { label: "30 dias" },
        "50": { label: "50 dias" },
      },
    },
  ],
  building: {
    lines: ["A criar o teu plano pessoal"],
    title: "O teu plano diário",
    rows: { calories: "Calorias", protein: "Proteína", carbs: "Hidratos", fat: "Gordura", diet: "Dieta" },
    limitCap: { ldl: "gordura saturada ≤ {n} g", kidneys: "sódio ≤ {n} mg" },
    cta: "Mostra-me o plano",
    floorTitle: "Parámos em {floor}kcal",
    floorBody: "As contas queriam ir mais abaixo. Não definimos alvos abaixo disto sem acompanhamento médico, por isso o teu fica aqui. Isso também vai aparecer no teu diário.",
  },
  summary: {
    lines: ["Aqui está o teu plano"],
    kcalLabel: "kcal por dia",
    floorMarker: "limitado por segurança · nunca abaixo de {floor}",
    macros: {
      protein: "Proteína",
      carbs: "Hidratos",
      fat: "Gordura",
      satfat: "Gordura saturada · a teu pedido",
    },
    capNote: "Esse ritmo exige uma mudança diária maior do que é seguro manter, por isso o teu é a versão segura: {share}% do que o teu corpo gasta num dia.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografa a tua primeira refeição",
  },
  ui: {
    continueLabel: "Continuar",
    saveKept: "Não foi possível guardar. A tua resposta continua aqui. Continuar envia-a de novo.",
    idlePlaceholder: "Mensagem para o Spud…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Continuar", less: "Menos", more: "Mais" },
    units: { years: "anos", yearsCount: { one: "{n} ano", other: "{n} anos" } },
  },
  beats: {
    ageWhy: "O teu metabolismo muda com a idade, por isso temos isso em conta",
    echo: { rest: "Em repouso: {rest}kcal por dia", days: "Os teus dias gastam {burn}kcal" },
    baseline: { title: "Este é o teu ponto de partida", bmi: "IMC", what: "Índice de massa corporal" },
    prelim: { title: "O teu plano", burn: "Gastas", gap: "{delta} o teu ritmo", eat: "Comes", perDay: "kcal por dia", keepTitle: "Gastas cerca de {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · o mínimo que definimos",
      now: "{weight} · agora",
      nowLowest: "{weight} · agora · o mínimo que definimos",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Sugiro {weight}, cerca de {pct}% a menos, um bom primeiro objetivo", up: "Sugiro {weight}, cerca de {pct}% a mais, um bom primeiro objetivo" },
  },
  pace: {
    rate: "{rate} por semana",
    rateSuffix: "por semana",
    result: "{target} por volta de {month} · {kcal}kcal por dia",
    echo: "De {from} para {to}.",
  },
  plan: {
    weightTitle: "O teu peso",
    everyDay: "Todos os dias",
    infoTitle: "Os teus dados",
    basedOn: "Com base nas tuas respostas",
    changeAnytime: "Podes mudar isto quando quiseres",
    goal: {
      lose: "Objetivo: −{kg} até {month}",
      gain: "Objetivo: +{kg} até {month}",
      maintain: "Objetivo: ficar perto de {kg}",
      maintainRange: "Intervalo: {range}",
    },
    info: {
      startWeight: "Peso inicial", goalWeight: "Peso-alvo", activity: "Atividade",
      target: "Alvo", targetLose: "−{kg} até {month}", targetGain: "+{kg} até {month}",
    },
    satFat: { label: "gord. saturada", asked: "Gordura saturada · a teu pedido", perDay: "≤ {g} por dia" },
    first: { title: "O teu primeiro passo", step: "Fotografa a tua próxima refeição. eait compara-a com {kcal}kcal." },
    loader: { goal: "O teu objetivo", lose: "−{kg} até {month}", gain: "+{kg} até {month}" },
    chart: { estimateAria: "Peso estimado: {from} agora, {to} por volta de {month}" },
  },
  signup: { heading: "Guarda o teu plano", line: "Assim o teu plano e a tua subscrição seguem-te para um telemóvel novo e as tuas refeições ficam guardadas." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Sincronizar com a app Saúde", body: "O peso e a atividade entram. As tuas refeições vão para a app Saúde." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Uma refeição por minha conta. Foto, ou preferes contar-me?",
    react: "Sem problema. Experimenta-me primeiro",
    photo: "Tirar uma foto",
    tell: "Conta-me o que comeste",
    keepGoing: "Continuar",
    correct: "Corrigir refeição",
    afterAsk: "Essa foi uma. Queres isto em todas as refeições?",
  },
  refusals: {
    invalid: {
      age: "Isso não parece uma idade — experimenta algo como 34.",
      height_cm: "Em centímetros — algo como 175.",
      weight_kg: "Em quilos — um valor aproximado chega.",
      target_weight_kg: "Um número em kg — como 70.",
    },
    ambiguousAge: {
      line: "Quero ter a certeza de que li bem — se querias dizer o ano {year}, envia os quatro dígitos.",
      confirm: "Tenho {age} anos",
    },
    direction: {
      gain: "Estás com {weight} kg e pediste para subir até {target} — a partir daqui, isso não é uma subida. Se o objetivo mudou, podemos trocá-lo; senão, dá-me um número acima de {weight}.",
      lose: "Estás com {weight} kg e pediste para descer até {target} — a partir daqui, isso não é uma descida. Se o objetivo mudou, podemos trocá-lo; senão, dá-me um número abaixo de {weight}.",
      switchToLose: "Mudar para perder peso",
      switchToGain: "Mudar para ganhar peso",
      above: "Um número acima de {weight}…",
      below: "Um número abaixo de {weight}…",
    },
    switched: {
      gain: "Feito — vamos ganhar peso. Onde gostavas de chegar, em kg?",
    },
  },
};

const MS: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Mula",
    signin: "Saya sudah ada akaun",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Apa tujuan anda di sini?"] },
      },
      options: {
        lose: { label: "Turunkan berat badan" },
        maintain: { label: "Kekalkan berat saya" },
        gain: { label: "Naikkan berat badan" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Apakah jantina anda?"] },
      },
      options: {
        male: { label: "Lelaki" },
        female: { label: "Perempuan" },
        other: { label: "Lain-lain" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Umur anda?"],
          placeholder: "Umur anda",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Ketinggian"],
          placeholder: "Tinggi dalam cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Berat badan anda"],
          placeholder: "Berat dalam kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Seaktif mana hari-hari anda?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Tiada senaman" },
        few: { label: "1–2", hint: "Senaman sekali-sekala" },
        some: { label: "3–4", hint: "Beberapa sesi senaman seminggu" },
        many: { label: "5+", hint: "Atlet tegar" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Berapa berat yang anda sasarkan?"],
          placeholder: "Berat matlamat dalam kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Berapa pantas?"] },
      },
      options: {
        easy: { label: "Santai" },
        steady: { label: "Sekata" },
        push: { label: "Pantas" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Pernahkah anda mengira kalori?"] } },
      options: {
        never: { label: "Tidak pernah" },
        stopped: { label: "Cuba, kemudian berhenti" },
        onoff: { label: "Kadang-kadang" },
        now: { label: "Saya masih mengira" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Apa yang membuatkan anda berhenti?", "Pilih semua yang sesuai"],
          variants: {
            onoff: ["Apa yang menghalang anda?", "Pilih semua yang sesuai"],
            now: ["Apa yang anda ingin permudahkan?", "Pilih semua yang sesuai"],
          },
        },
      },
      options: {
        too_long: { label: "Mengambil masa terlalu lama" },
        forgot: { label: "Saya terlupa" },
        invisible: { label: "Tiada hasil yang kelihatan" },
        no_idea: { label: "Tidak tahu mahu makan apa" },
        stressful: { label: "Terasa stres" },
        nobody: { label: "Tiada siapa untuk ditanya" },
        creeping: { label: "Berat badan saya kembali naik" },
        not_enough: { label: "Sukar untuk makan cukup" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Bilakah paling sukar untuk mencatat?"],
          variants: { never: ["Bilakah anda jangkakan paling sukar untuk mencatat?"] },
        },
      },
      options: {
        workdays: { label: "Hari bekerja yang sibuk" },
        eating_out: { label: "Makan di luar" },
        cooking: { label: "Memasak untuk orang lain" },
        snacks: { label: "Snek dan minuman" },
        evenings: { label: "Waktu petang dan hujung minggu" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Adakah anda mengikut sesuatu diet?"] },
      },
      options: {
        balanced: { label: "Seimbang" },
        wholefood: { label: "Makanan tidak diproses" },
        mediterranean: { label: "Mediterranean" },
        flexitarian: { label: "Fleksitarian" },
        pescatarian: { label: "Peskatarian" },
        vegetarian: { label: "Vegetarian" },
        vegan: { label: "Vegan" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Ada batasan perubatan?"] },
      },
      options: {
        kidneys: { label: "Penyakit buah pinggang" },
        ldl: { label: "Kolesterol tinggi" },
        lowsugar: { label: "Risiko diabetes" },
        none: { label: "Tiada antara ini" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Di mana anda makan?"], placeholder: "Cari" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Tempat lain" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Pilih rentetan yang anda sasarkan"] },
      },
      options: {
        "7": { label: "7 hari" },
        "14": { label: "14 hari" },
        "30": { label: "30 hari" },
        "50": { label: "50 hari" },
      },
    },
  ],
  building: {
    lines: ["Membina pelan peribadi anda"],
    title: "Pelan harian anda",
    rows: { calories: "Kalori", protein: "Protein", carbs: "Karbohidrat", fat: "Lemak", diet: "Diet" },
    limitCap: { ldl: "lemak tepu ≤ {n} g", kidneys: "natrium ≤ {n} mg" },
    cta: "Tunjukkan pelan",
    floorTitle: "Kami berhenti pada {floor}kcal",
    floorBody: "Kiraan mahu pergi lebih rendah. Kami tidak menetapkan sasaran di bawah ini tanpa pengawasan perubatan, jadi di sinilah sasaran anda. Ia juga dinyatakan dalam diari anda.",
  },
  summary: {
    lines: ["Inilah pelan anda"],
    kcalLabel: "kcal sehari",
    floorMarker: "dihadkan demi keselamatan · tidak kurang daripada {floor}",
    macros: {
      protein: "Protein",
      carbs: "Karbohidrat",
      fat: "Lemak",
      satfat: "Lemak tepu · atas permintaan anda",
    },
    capNote: "Kadar itu memerlukan perubahan harian yang lebih besar daripada yang selamat untuk diteruskan, jadi anda mendapat versi selamat: {share}% daripada tenaga yang dibakar badan anda dalam sehari.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Ambil foto hidangan pertama anda",
  },
  ui: {
    continueLabel: "Teruskan",
    saveKept: "Itu tidak dapat disimpan. Jawapan anda masih ada di sini. Teruskan akan menghantarnya semula.",
    idlePlaceholder: "Mesej Spud…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Teruskan", less: "Kurang", more: "Lagi" },
    units: { years: "tahun", yearsCount: { one: "{n} tahun", other: "{n} tahun" } },
  },
  beats: {
    ageWhy: "Metabolisme anda berubah mengikut usia, jadi kami mengambil kira perkara itu",
    echo: { rest: "Ketika rehat: {rest}kcal sehari", days: "Hari-hari anda membakar {burn}kcal" },
    baseline: { title: "Ini titik permulaan anda", bmi: "BMI", what: "Indeks jisim badan" },
    prelim: { title: "Pelan anda", burn: "Anda membakar", gap: "{delta} kadar anda", eat: "Anda makan", perDay: "kcal sehari", keepTitle: "Anda membakar kira-kira {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · terendah yang kami tetapkan",
      now: "{weight} · sekarang",
      nowLowest: "{weight} · sekarang · terendah yang kami tetapkan",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Saya cadangkan {weight}, kira-kira {pct}% kurang, matlamat pertama yang baik", up: "Saya cadangkan {weight}, kira-kira {pct}% lebih, matlamat pertama yang baik" },
  },
  pace: {
    rate: "{rate} seminggu",
    rateSuffix: "seminggu",
    result: "{target} sekitar {month} · {kcal}kcal sehari",
    echo: "Daripada {from} kepada {to}.",
  },
  plan: {
    weightTitle: "Berat anda",
    everyDay: "Setiap hari",
    infoTitle: "Maklumat anda",
    basedOn: "Berdasarkan jawapan anda",
    changeAnytime: "Anda boleh menukar ini bila-bila masa",
    goal: {
      lose: "Matlamat: −{kg} menjelang {month}",
      gain: "Matlamat: +{kg} menjelang {month}",
      maintain: "Matlamat: kekal sekitar {kg}",
      maintainRange: "Julat: {range}",
    },
    info: {
      startWeight: "Berat permulaan", goalWeight: "Berat matlamat", activity: "Aktiviti",
      target: "Sasaran", targetLose: "−{kg} menjelang {month}", targetGain: "+{kg} menjelang {month}",
    },
    satFat: { label: "lemak tepu", asked: "Lemak tepu · permintaan anda", perDay: "≤ {g} sehari" },
    first: { title: "Langkah pertama anda", step: "Ambil foto hidangan anda seterusnya. eait menyemaknya dengan {kcal}kcal." },
    loader: { goal: "Matlamat anda", lose: "−{kg} menjelang {month}", gain: "+{kg} menjelang {month}" },
    chart: { estimateAria: "Anggaran berat: {from} sekarang, {to} sekitar {month}" },
  },
  signup: { heading: "Simpan pelan anda", line: "Supaya pelan dan langganan anda mengikut anda ke telefon baharu, dan hidangan anda disimpan." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Segerakkan dengan Kesihatan Apple", body: "Berat dan aktiviti masuk. Hidangan anda dihantar ke Kesihatan." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Satu hidangan saya belanja. Foto, atau beritahu saja?",
    react: "Tiada masalah. Cuba saya dulu",
    photo: "Ambil foto",
    tell: "Beritahu apa yang anda makan",
    keepGoing: "Teruskan",
    correct: "Betulkan hidangan",
    afterAsk: "Itu satu. Mahu ini untuk setiap hidangan?",
  },
  refusals: {
    invalid: {
      age: "Itu tidak kelihatan seperti umur — cuba sesuatu seperti 34.",
      height_cm: "Dalam sentimeter — contohnya 175.",
      weight_kg: "Dalam kilogram — anggaran pun tidak mengapa.",
      target_weight_kg: "Nombor dalam kg — contohnya 70.",
    },
    ambiguousAge: {
      line: "Saya mahu pastikan saya membacanya dengan betul — jika maksud anda tahun {year}, hantar keempat-empat digit.",
      confirm: "Umur saya {age}",
    },
    direction: {
      gain: "Berat anda {weight} kg dan anda minta naik ke {target} — itu bukan kenaikan dari sini. Jika matlamat sudah berubah, kita boleh tukar; jika tidak, berikan nombor melebihi {weight}.",
      lose: "Berat anda {weight} kg dan anda minta turun ke {target} — itu bukan penurunan dari sini. Jika matlamat sudah berubah, kita boleh tukar; jika tidak, berikan nombor di bawah {weight}.",
      switchToLose: "Tukar ke turun berat",
      switchToGain: "Tukar ke naik berat",
      above: "Nombor melebihi {weight}…",
      below: "Nombor di bawah {weight}…",
    },
    switched: {
      gain: "Sudah ditukar — naik berat. Anda mahu ke berapa, dalam kg?",
    },
  },
};

const CA: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Comença",
    signin: "Ja tinc un compte",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Què vols aconseguir?"] },
      },
      options: {
        lose: { label: "Baixar de pes" },
        maintain: { label: "Mantenir el pes" },
        gain: { label: "Pujar de pes" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Quin és el teu sexe?"] },
      },
      options: {
        male: { label: "Home" },
        female: { label: "Dona" },
        other: { label: "Altre" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["La teva edat?"],
          placeholder: "La teva edat",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Alçada"],
          placeholder: "Alçada en cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["El teu pes"],
          placeholder: "Pes en kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Com d'actius són els teus dies?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Sense entrenaments" },
        few: { label: "1–2", hint: "Entrenaments de tant en tant" },
        some: { label: "3–4", hint: "Uns quants entrenaments per setmana" },
        many: { label: "5+", hint: "Esportista de debò" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["A quin pes vols arribar?"],
          placeholder: "Pes objectiu en kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["A quin ritme?"] },
      },
      options: {
        easy: { label: "Suau" },
        steady: { label: "Constant" },
        push: { label: "Ràpid" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Has comptat calories abans?"] } },
      options: {
        never: { label: "Mai" },
        stopped: { label: "Ho vaig provar, ho vaig deixar" },
        onoff: { label: "De tant en tant" },
        now: { label: "Les compto ara" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Què t'ha aturat?", "Tria tot el que encaixi"],
          variants: {
            onoff: ["Què s'hi va interposar?", "Tria tot el que encaixi"],
            now: ["Què voldries que fos més fàcil?", "Tria tot el que encaixi"],
          },
        },
      },
      options: {
        too_long: { label: "Em prenia massa temps" },
        forgot: { label: "Se m'oblidava" },
        invisible: { label: "No en veia els resultats" },
        no_idea: { label: "No sabia què menjar" },
        stressful: { label: "Em resultava estressant" },
        nobody: { label: "Ningú a qui preguntar" },
        creeping: { label: "El pes em tornava a pujar" },
        not_enough: { label: "Em costava menjar prou" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Quan costa més registrar?"],
          variants: { never: ["Quan creus que registrar serà més difícil?"] },
        },
      },
      options: {
        workdays: { label: "Dies de feina aferrissats" },
        eating_out: { label: "Menjar fora" },
        cooking: { label: "Cuinar per a altres" },
        snacks: { label: "Snacks i begudes" },
        evenings: { label: "Vespres i caps de setmana" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Segueixes alguna dieta?"] },
      },
      options: {
        balanced: { label: "Equilibrada" },
        wholefood: { label: "Aliments sense processar" },
        mediterranean: { label: "Mediterrània" },
        flexitarian: { label: "Flexitariana" },
        pescatarian: { label: "Pescetariana" },
        vegetarian: { label: "Vegetariana" },
        vegan: { label: "Vegana" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Alguna limitació mèdica?"] },
      },
      options: {
        kidneys: { label: "Malaltia renal" },
        ldl: { label: "Colesterol alt" },
        lowsugar: { label: "Risc de diabetis" },
        none: { label: "Cap d'aquestes" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["On menges?"], placeholder: "Cerca" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "En un altre lloc" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Tria la ratxa que vols assolir"] },
      },
      options: {
        "7": { label: "7 dies" },
        "14": { label: "14 dies" },
        "30": { label: "30 dies" },
        "50": { label: "50 dies" },
      },
    },
  ],
  building: {
    lines: ["Estic creant el teu pla personal"],
    title: "El teu pla diari",
    rows: { calories: "Calories", protein: "Proteïna", carbs: "Carbohidrats", fat: "Greix", diet: "Dieta" },
    limitCap: { ldl: "greix saturat ≤ {n} g", kidneys: "sodi ≤ {n} mg" },
    cta: "Ensenya'm el pla",
    floorTitle: "Ens hem aturat a {floor}kcal",
    floorBody: "El càlcul volia baixar més. Sense supervisió mèdica no fixem objectius per sota d'aquest valor, així que el teu es queda aquí. El teu diari també ho indicarà.",
  },
  summary: {
    lines: ["Aquest és el teu pla"],
    kcalLabel: "kcal al dia",
    floorMarker: "limitat per seguretat · mai per sota de {floor}",
    macros: {
      protein: "Proteïna",
      carbs: "Carbohidrats",
      fat: "Greix",
      satfat: "Greix saturat · ho has demanat",
    },
    capNote: "Aquest ritme demana un canvi diari més gran del que és segur mantenir, així que el teu és la versió segura: el {share} % del que el teu cos crema en un dia.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografia el teu primer àpat",
  },
  ui: {
    continueLabel: "Continua",
    saveKept: "No s'ha pogut desar. La teva resposta encara és aquí. Amb Continua, s'envia de nou.",
    idlePlaceholder: "Escriu a Spud…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Continua", less: "Menys", more: "Més" },
    units: { years: "anys", yearsCount: { one: "{n} any", other: "{n} anys" } },
  },
  beats: {
    ageWhy: "El metabolisme canvia amb l'edat, i ho tenim en compte",
    echo: { rest: "En repòs: {rest}kcal al dia", days: "Els teus dies cremen {burn}kcal" },
    baseline: { title: "Aquest és el teu punt de partida", bmi: "IMC", what: "Índex de massa corporal" },
    prelim: { title: "El teu pla", burn: "Cremes", gap: "{delta} el teu ritme", eat: "Menjes", perDay: "kcal al dia", keepTitle: "Cremes unes {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · el mínim que fixem",
      now: "{weight} · ara",
      nowLowest: "{weight} · ara · el mínim que fixem",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Et proposo {weight}, un {pct} % menys: un bon primer objectiu", up: "Et proposo {weight}, un {pct} % més: un bon primer objectiu" },
  },
  pace: {
    rate: "{rate} per setmana",
    rateSuffix: "per setmana",
    result: "{target} cap a {month} · {kcal}kcal al dia",
    echo: "De {from} a {to}.",
  },
  plan: {
    weightTitle: "El teu pes",
    everyDay: "Cada dia",
    infoTitle: "Les teves dades",
    basedOn: "Segons les teves respostes",
    changeAnytime: "Pots canviar-ho quan vulguis",
    goal: {
      lose: "Meta: −{kg} cap a {month}",
      gain: "Meta: +{kg} cap a {month}",
      maintain: "Meta: mantenir-se al voltant de {kg}",
      maintainRange: "Interval: {range}",
    },
    info: {
      startWeight: "Pes inicial", goalWeight: "Pes objectiu", activity: "Activitat",
      target: "Objectiu", targetLose: "−{kg} cap a {month}", targetGain: "+{kg} cap a {month}",
    },
    satFat: { label: "greix sat.", asked: "Greix saturat · ho has demanat", perDay: "≤ {g} al dia" },
    first: { title: "El teu primer pas", step: "Fes una foto al teu proper àpat. eait el compara amb {kcal}kcal." },
    loader: { goal: "La teva meta", lose: "−{kg} cap a {month}", gain: "+{kg} cap a {month}" },
    chart: { estimateAria: "Pes estimat: {from} ara, {to} cap a {month}" },
  },
  signup: { heading: "Desa el teu pla", line: "Així el teu pla i la teva subscripció et segueixen a un telèfon nou, i els teus àpats es conserven." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Sincronitza amb Salut", body: "El pes i l'activitat entren. Els teus àpats van a Salut." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "El primer àpat el convido jo. Una foto, o m'ho expliques?",
    react: "Cap problema. Prova'm primer",
    photo: "Fes una foto",
    tell: "Explica'm què has menjat",
    keepGoing: "Continua",
    correct: "Corregeix l'àpat",
    afterAsk: "Ja en portem un. Ho vols per a cada àpat?",
  },
  refusals: {
    invalid: {
      age: "Això no sembla una edat — prova amb alguna cosa com 34.",
      height_cm: "En centímetres — alguna cosa com 175.",
      weight_kg: "En quilograms — aproximat ja va bé.",
      target_weight_kg: "Un número en kg — com 70.",
    },
    ambiguousAge: {
      line: "Vull assegurar-me que ho he llegit bé — si volies dir l'any {year}, envia les quatre xifres.",
      confirm: "Tinc {age} anys",
    },
    direction: {
      gain: "Ara peses {weight} kg i has demanat pujar fins a {target} — des d'aquí això no és pujar. Si la meta ha canviat, la podem canviar; si no, dona'm un número per sobre de {weight}.",
      lose: "Ara peses {weight} kg i has demanat baixar fins a {target} — des d'aquí això no és baixar. Si la meta ha canviat, la podem canviar; si no, dona'm un número per sota de {weight}.",
      switchToLose: "Canvia a baixar de pes",
      switchToGain: "Canvia a pujar de pes",
      above: "Un número per sobre de {weight}…",
      below: "Un número per sota de {weight}…",
    },
    switched: {
      gain: "Canviat — doncs a pujar. On t'agradaria arribar, en kg?",
    },
  },
};

const SL: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Začni",
    signin: "Račun že imam",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Kaj želiš doseči?"] },
      },
      options: {
        lose: { label: "Izgubiti težo" },
        maintain: { label: "Ohraniti težo" },
        gain: { label: "Pridobiti težo" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Kakšen je tvoj spol?"] },
      },
      options: {
        male: { label: "Moški" },
        female: { label: "Ženski" },
        other: { label: "Drugo" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Tvoja starost?"],
          placeholder: "Tvoja starost",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Višina"],
          placeholder: "Višina v cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Tvoja teža"],
          placeholder: "Teža v kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Kako aktivni so tvoji dnevi?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Brez vadbe" },
        few: { label: "1–2", hint: "Vadba občasno" },
        some: { label: "3–4", hint: "Nekaj vadb na teden" },
        many: { label: "5+", hint: "Vadba skoraj vsak dan" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Kakšno težo ciljaš?"],
          placeholder: "Ciljna teža v kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Kako hitro?"] },
      },
      options: {
        easy: { label: "Blag" },
        steady: { label: "Enakomeren" },
        push: { label: "Hiter" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Imaš izkušnje s štetjem kalorij?"] } },
      options: {
        never: { label: "Nikoli" },
        stopped: { label: "Prej ja, zdaj ne" },
        onoff: { label: "Kdaj pa kdaj" },
        now: { label: "Trenutno štejem" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Kaj te je ustavilo?", "Izberi vse, kar se ujema"],
          variants: {
            onoff: ["Kaj je prišlo vmes?", "Izberi vse, kar se ujema"],
            now: ["Kaj bi bilo lažje?", "Izberi vse, kar se ujema"],
          },
        },
      },
      options: {
        too_long: { label: "Vzelo je preveč časa" },
        forgot: { label: "Pozabljalo se mi je" },
        invisible: { label: "Rezultatov ni bilo videti" },
        no_idea: { label: "Ni bilo idej, kaj jesti" },
        stressful: { label: "Bilo je stresno" },
        nobody: { label: "Ni bilo koga vprašati" },
        creeping: { label: "Teža se je vračala" },
        not_enough: { label: "Težko je bilo pojesti dovolj" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kdaj je beleženje najtežje?"],
          variants: { never: ["Kdaj misliš, da bo beleženje najtežje?"] },
        },
      },
      options: {
        workdays: { label: "Zasedeni delovniki" },
        eating_out: { label: "Prehranjevanje zunaj" },
        cooking: { label: "Kuhanje za druge" },
        snacks: { label: "Prigrizki in pijače" },
        evenings: { label: "Večeri in vikendi" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Ali slediš kakšni dieti?"] },
      },
      options: {
        balanced: { label: "Uravnotežena" },
        wholefood: { label: "Polnovredna" },
        mediterranean: { label: "Mediteranska" },
        flexitarian: { label: "Fleksitarijanska" },
        pescatarian: { label: "Peskatarijanska" },
        vegetarian: { label: "Vegetarijanska" },
        vegan: { label: "Veganska" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Kakšne zdravstvene omejitve?"] },
      },
      options: {
        kidneys: { label: "Bolezen ledvic" },
        ldl: { label: "Visok holesterol" },
        lowsugar: { label: "Tveganje za sladkorno bolezen" },
        none: { label: "Nič od tega" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Kje ješ?"], placeholder: "Iskanje" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Drugje" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Izberi niz, ki ga želiš doseči"] },
      },
      options: {
        "7": { label: "7 dni" },
        "14": { label: "14 dni" },
        "30": { label: "30 dni" },
        "50": { label: "50 dni" },
      },
    },
  ],
  building: {
    lines: ["Pripravljam tvoj osebni načrt"],
    title: "Tvoj dnevni načrt",
    rows: { calories: "Kalorije", protein: "Beljakovine", carbs: "Ogljikovi hidrati", fat: "Maščobe", diet: "Dieta" },
    limitCap: { ldl: "nasičene maščobe ≤ {n} g", kidneys: "natrij ≤ {n} mg" },
    cta: "Pokaži mi načrt",
    floorTitle: "Ustavili smo se pri {floor}kcal",
    floorBody: "Izračun bi šel nižje. Brez zdravniškega nadzora ne nastavljamo ciljnih vrednosti pod to mejo, zato je tvoja tukaj. To bo pisalo tudi v tvojem dnevniku.",
  },
  summary: {
    lines: ["To je tvoj načrt"],
    kcalLabel: "kcal na dan",
    floorMarker: "omejeno zaradi varnosti · nikoli pod {floor}",
    macros: {
      protein: "Beljakovine",
      carbs: "Ogljikovi hidrati",
      fat: "Maščobe",
      satfat: "Nasičene maščobe · na tvojo željo",
    },
    capNote: "Ta tempo bi zahteval večjo dnevno spremembo, kot jo je varno vzdrževati, zato imaš varno različico: {share} % tega, kar tvoje telo porabi v enem dnevu.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografiraj svoj prvi obrok",
  },
  ui: {
    continueLabel: "Nadaljuj",
    saveKept: "Tega ni bilo mogoče shraniti. Tvoj odgovor je še vedno tu. Gumb Nadaljuj ga pošlje znova.",
    idlePlaceholder: "Sporočilo za Spuda…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Nadaljuj", less: "Manj", more: "Več" },
    units: { years: "let", yearsCount: { one: "{n} leto", other: "{n} let" } },
  },
  beats: {
    ageWhy: "Presnova se s starostjo spreminja, zato to upoštevamo",
    echo: { rest: "V mirovanju: {rest}kcal na dan", days: "Tvoji dnevi porabijo {burn}kcal" },
    baseline: { title: "To je tvoje izhodišče", bmi: "ITM", what: "Indeks telesne mase" },
    prelim: { title: "Tvoj načrt", burn: "Porabiš", gap: "{delta} tvoj tempo", eat: "Ješ", perDay: "kcal na dan", keepTitle: "Porabiš približno {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · najnižje, kar nastavimo",
      now: "{weight} · zdaj",
      nowLowest: "{weight} · zdaj · najnižje, kar nastavimo",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Predlagam {weight}, približno {pct} % manj, dober prvi cilj", up: "Predlagam {weight}, približno {pct} % več, dober prvi cilj" },
  },
  pace: {
    rate: "{rate} na teden",
    rateSuffix: "na teden",
    result: "{target} · predvidoma {month} · {kcal}kcal na dan",
    echo: "Od {from} do {to}.",
  },
  plan: {
    weightTitle: "Tvoja teža",
    everyDay: "Vsak dan",
    infoTitle: "Tvoji podatki",
    basedOn: "Na podlagi tvojih odgovorov",
    changeAnytime: "To lahko kadar koli spremeniš",
    goal: {
      lose: "Cilj: −{kg} · predvidoma {month}",
      gain: "Cilj: +{kg} · predvidoma {month}",
      maintain: "Cilj: ostati okoli {kg}",
      maintainRange: "Razpon: {range}",
    },
    info: {
      startWeight: "Začetna teža", goalWeight: "Ciljna teža", activity: "Aktivnost",
      target: "Ciljna vrednost", targetLose: "−{kg} · predvidoma {month}", targetGain: "+{kg} · predvidoma {month}",
    },
    satFat: { label: "nas. maščobe", asked: "Nasičene maščobe · na tvojo željo", perDay: "≤ {g} na dan" },
    first: { title: "Tvoj prvi korak", step: "Fotografiraj naslednji obrok. eait ga preveri glede na {kcal}kcal." },
    loader: { goal: "Tvoj cilj", lose: "−{kg} · predvidoma {month}", gain: "+{kg} · predvidoma {month}" },
    chart: { estimateAria: "Ocenjena teža: zdaj {from}; {to} · predvidoma {month}" },
  },
  signup: { heading: "Shrani svoj paket", line: "Tako se tvoj paket in naročnina preselita s teboj na nov telefon, tvoji obroki pa ostanejo shranjeni." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Sinhronizacija z aplikacijo Zdravje", body: "Teža in aktivnost prideta noter. Tvoji obroki gredo v aplikacijo Zdravje." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "En obrok je na moj račun. Fotografija ali mi kar poveš?",
    react: "Ni problema. Najprej me preizkusi",
    photo: "Posnemi fotografijo",
    tell: "Povej mi, kaj je bilo na krožniku",
    keepGoing: "Nadaljuj",
    correct: "Popravi obrok",
    afterAsk: "To je bil prvi. Želiš tako pri vsakem obroku?",
  },
  refusals: {
    invalid: {
      age: "To ni videti kot starost — poskusi na primer 34.",
      height_cm: "V centimetrih — na primer 175.",
      weight_kg: "V kilogramih — približno je v redu.",
      target_weight_kg: "Število v kg — na primer 70.",
    },
    ambiguousAge: {
      line: "Da ne bo pomote: če gre za letnico {year}, pošlji vse štiri števke.",
      confirm: "Imam {age} let",
    },
    direction: {
      gain: "Zdaj imaš {weight} kg, cilj pa je {target} — to ni več, kot imaš zdaj. Če se je cilj spremenil, ga lahko zamenjaš; sicer mi napiši število nad {weight}.",
      lose: "Zdaj imaš {weight} kg, cilj pa je {target} — to ni manj, kot imaš zdaj. Če se je cilj spremenil, ga lahko zamenjaš; sicer mi napiši število pod {weight}.",
      switchToLose: "Preklopi na izgubo teže",
      switchToGain: "Preklopi na pridobivanje teže",
      above: "Število nad {weight}…",
      below: "Število pod {weight}…",
    },
    switched: {
      gain: "Preklopljeno — torej pridobivanje teže. Kam želiš priti, v kg?",
    },
  },
};

const HR: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Kreni",
    signin: "Već imam račun",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Što želiš postići?"] },
      },
      options: {
        lose: { label: "Smršaviti" },
        maintain: { label: "Zadržati težinu" },
        gain: { label: "Dobiti na težini" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Tvoj spol?"] },
      },
      options: {
        male: { label: "Muško" },
        female: { label: "Žensko" },
        other: { label: "Drugo" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Tvoja dob?"],
          placeholder: "Tvoja dob",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Visina"],
          placeholder: "Visina u cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Tvoja težina"],
          placeholder: "Težina u kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Koliko su aktivni tvoji dani?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Bez treninga" },
        few: { label: "1–2", hint: "Trening tu i tamo" },
        some: { label: "3–4", hint: "Nekoliko treninga tjedno" },
        many: { label: "5+", hint: "Trening gotovo svaki dan" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Kojoj težini težiš?"],
          placeholder: "Ciljna težina u kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Kojim tempom?"] },
      },
      options: {
        easy: { label: "Blago" },
        steady: { label: "Ujednačeno" },
        push: { label: "Žustro" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Imaš li iskustva s brojanjem kalorija?"] } },
      options: {
        never: { label: "Nikad" },
        stopped: { label: "Ranije da, sada ne" },
        onoff: { label: "Povremeno" },
        now: { label: "Trenutno brojim" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Što te je zaustavilo?", "Odaberi sve što odgovara"],
          variants: {
            onoff: ["Što ti je smetalo?", "Odaberi sve što odgovara"],
            now: ["Što bi bilo lakše?", "Odaberi sve što odgovara"],
          },
        },
      },
      options: {
        too_long: { label: "Trajalo je predugo" },
        forgot: { label: "Zaboravljalo mi se" },
        invisible: { label: "Nisu se vidjeli rezultati" },
        no_idea: { label: "Nije bilo ideja što jesti" },
        stressful: { label: "Bilo je stresno" },
        nobody: { label: "Nije bilo koga pitati" },
        creeping: { label: "Težina se vraćala" },
        not_enough: { label: "Teško je bilo pojesti dovoljno" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kada je bilježenje najteže?"],
          variants: { never: ["Kada misliš da će bilježenje biti najteže?"] },
        },
      },
      options: {
        workdays: { label: "Naporni radni dani" },
        eating_out: { label: "Jelo vani" },
        cooking: { label: "Kuhanje za druge" },
        snacks: { label: "Grickalice i pića" },
        evenings: { label: "Večeri i vikendi" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Držiš li se neke prehrane?"] },
      },
      options: {
        balanced: { label: "Uravnotežena" },
        wholefood: { label: "Cjelovita hrana" },
        mediterranean: { label: "Mediteranska" },
        flexitarian: { label: "Fleksitarijanska" },
        pescatarian: { label: "Peskatarijanska" },
        vegetarian: { label: "Vegetarijanska" },
        vegan: { label: "Veganska" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Imaš li zdravstvena ograničenja?"] },
      },
      options: {
        kidneys: { label: "Bolest bubrega" },
        ldl: { label: "Visok kolesterol" },
        lowsugar: { label: "Rizik od dijabetesa" },
        none: { label: "Ništa od navedenog" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Gdje jedeš?"], placeholder: "Traži" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Negdje drugdje" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Odaberi niz kojem težiš"] },
      },
      options: {
        "7": { label: "7 dana" },
        "14": { label: "14 dana" },
        "30": { label: "30 dana" },
        "50": { label: "50 dana" },
      },
    },
  ],
  building: {
    lines: ["Izrađujemo tvoj osobni plan"],
    title: "Tvoj dnevni plan",
    rows: { calories: "Kalorije", protein: "Proteini", carbs: "Ugljikohidrati", fat: "Masti", diet: "Prehrana" },
    limitCap: { ldl: "zasićene masti ≤ {n} g", kidneys: "natrij ≤ {n} mg" },
    cta: "Pokaži mi plan",
    floorTitle: "Stali smo na {floor}kcal",
    floorBody: "Izračun je htio ići niže. Bez liječničkog nadzora ne postavljamo ciljeve ispod ovoga, pa je tvoj upravo ovdje. To će pisati i u tvom dnevniku.",
  },
  summary: {
    lines: ["Ovo je tvoj plan"],
    kcalLabel: "kcal dnevno",
    floorMarker: "ograničeno radi sigurnosti · nikad ispod {floor}",
    macros: {
      protein: "Proteini",
      carbs: "Ugljikohidrati",
      fat: "Masti",
      satfat: "Zasićene masti · na tvoj zahtjev",
    },
    capNote: "Taj tempo traži veću dnevnu promjenu nego što je sigurno održivo, pa dobivaš sigurnu verziju: {share}% onoga što tvoje tijelo potroši u danu.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografiraj svoj prvi obrok",
  },
  ui: {
    continueLabel: "Nastavi",
    saveKept: "To se nije moglo spremiti. Odgovor je još tu. Dodirom na Nastavi šalje se ponovno.",
    idlePlaceholder: "Poruka za Spuda…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Nastavi", less: "Manje", more: "Više" },
    units: { years: "god.", yearsCount: { one: "{n} godina", other: "{n} god." } },
  },
  beats: {
    ageWhy: "Metabolizam se mijenja s godinama, pa to uračunavamo",
    echo: { rest: "U mirovanju: {rest}kcal dnevno", days: "Tvoji dani troše {burn}kcal" },
    baseline: { title: "Ovo je tvoja polazna točka", bmi: "BMI", what: "Indeks tjelesne mase" },
    prelim: { title: "Tvoj plan", burn: "Trošiš", gap: "{delta} tvoj tempo", eat: "Jedeš", perDay: "kcal dnevno", keepTitle: "Trošiš oko {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · najniže što postavljamo",
      now: "{weight} · sada",
      nowLowest: "{weight} · sada · najniže što postavljamo",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Predlažem {weight}, oko {pct}% manje — dobar prvi cilj", up: "Predlažem {weight}, oko {pct}% više — dobar prvi cilj" },
  },
  pace: {
    rate: "{rate} tjedno",
    rateSuffix: "tjedno",
    result: "{target} · procjena: {month} · {kcal}kcal dnevno",
    echo: "Od {from} do {to}.",
  },
  plan: {
    weightTitle: "Tvoja težina",
    everyDay: "Svaki dan",
    infoTitle: "Tvoji podaci",
    basedOn: "Na temelju tvojih odgovora",
    changeAnytime: "Ovo možeš promijeniti bilo kada",
    goal: {
      lose: "Cilj: −{kg} · {month}",
      gain: "Cilj: +{kg} · {month}",
      maintain: "Cilj: ostati oko {kg}",
      maintainRange: "Raspon: {range}",
    },
    info: {
      startWeight: "Početna težina", goalWeight: "Ciljna težina", activity: "Aktivnost",
      target: "Ciljna vrijednost", targetLose: "−{kg} · {month}", targetGain: "+{kg} · {month}",
    },
    satFat: { label: "zasićene masti", asked: "Zasićene masti · na tvoj zahtjev", perDay: "≤ {g} dnevno" },
    first: { title: "Tvoj prvi korak", step: "Fotografiraj sljedeći obrok. eait ga provjerava u odnosu na {kcal}kcal." },
    loader: { goal: "Tvoj cilj", lose: "−{kg} · {month}", gain: "+{kg} · {month}" },
    chart: { estimateAria: "Procijenjena težina: sada {from}, {to} — procjena: {month}" },
  },
  signup: { heading: "Spremi svoj plan", line: "Tako tvoj plan i pretplata idu s tobom na novi telefon, a tvoji obroci ostaju sačuvani." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Sinkroniziraj s aplikacijom Zdravlje", body: "Težina i aktivnost stižu ovamo. Obroci idu u aplikaciju Zdravlje." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Jedan obrok častim ja. Fotografija ili samo opis?",
    react: "Nema problema. Prvo me isprobaj",
    photo: "Fotografiraj",
    tell: "Opiši što je bilo za jelo",
    keepGoing: "Nastavi",
    correct: "Ispravi obrok",
    afterAsk: "To je bio jedan. Želiš ovo za svaki obrok?",
  },
  refusals: {
    invalid: {
      age: "To ne izgleda kao dob — probaj nešto poput 34.",
      height_cm: "U centimetrima — nešto poput 175.",
      weight_kg: "U kilogramima — otprilike je dovoljno.",
      target_weight_kg: "Broj u kg — npr. 70.",
    },
    ambiguousAge: {
      line: "Samo provjera — ako misliš na godinu {year}, pošalji sve četiri znamenke.",
      confirm: "Imam {age}",
    },
    direction: {
      gain: "Sada imaš {weight} kg, a cilj ti je {target} — odavde to nije dobivanje na težini. Ako se cilj promijenio, možemo ga zamijeniti; inače mi daj broj veći od {weight}.",
      lose: "Sada imaš {weight} kg, a cilj ti je {target} — odavde to nije gubitak težine. Ako se cilj promijenio, možemo ga zamijeniti; inače mi daj broj manji od {weight}.",
      switchToLose: "Prebaci na mršavljenje",
      switchToGain: "Prebaci na dobivanje težine",
      above: "Broj veći od {weight}…",
      below: "Broj manji od {weight}…",
    },
    switched: {
      gain: "Prebačeno — dobivanje težine. Gdje želiš biti, u kg?",
    },
  },
};

const SK: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Začať",
    signin: "Už mám účet",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Čo tu chceš dosiahnuť?"] },
      },
      options: {
        lose: { label: "Schudnúť" },
        maintain: { label: "Udržať si váhu" },
        gain: { label: "Pribrať" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Aké je tvoje pohlavie?"] },
      },
      options: {
        male: { label: "Mužské" },
        female: { label: "Ženské" },
        other: { label: "Iné" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Tvoj vek?"],
          placeholder: "Tvoj vek",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Výška"],
          placeholder: "Výška v cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Tvoja váha"],
          placeholder: "Váha v kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Aké aktívne sú tvoje dni?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Bez tréningov" },
        few: { label: "1–2", hint: "Tréningy občas" },
        some: { label: "3–4", hint: "Pár tréningov týždenne" },
        many: { label: "5+", hint: "Tréning takmer každý deň" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Akú váhu chceš dosiahnuť?"],
          placeholder: "Cieľová váha v kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Ako rýchlo?"] },
      },
      options: {
        easy: { label: "Pomaly" },
        steady: { label: "Stabilne" },
        push: { label: "Svižne" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Máš za sebou počítanie kalórií?"] } },
      options: {
        never: { label: "Nikdy" },
        stopped: { label: "Predtým áno, teraz nie" },
        onoff: { label: "S prestávkami" },
        now: { label: "Počítam teraz" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Čo ťa zastavilo?", "Vyber všetko, čo sedí"],
          variants: {
            onoff: ["Čo ti prekážalo?", "Vyber všetko, čo sedí"],
            now: ["Čo by malo byť jednoduchšie?", "Vyber všetko, čo sedí"],
          },
        },
      },
      options: {
        too_long: { label: "Trvalo to príliš dlho" },
        forgot: { label: "Zabúdalo sa mi" },
        invisible: { label: "Nebolo vidieť výsledky" },
        no_idea: { label: "Chýbali nápady, čo jesť" },
        stressful: { label: "Bolo to stresujúce" },
        nobody: { label: "Nebolo koho spýtať" },
        creeping: { label: "Váha sa vracala" },
        not_enough: { label: "Ťažké bolo zjesť dosť" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kedy je zapisovanie najťažšie?"],
          variants: { never: ["Kedy myslíš, že zapisovanie bude najťažšie?"] },
        },
      },
      options: {
        workdays: { label: "Náročné pracovné dni" },
        eating_out: { label: "Jedlo vonku" },
        cooking: { label: "Varenie pre iných" },
        snacks: { label: "Občerstvenie a nápoje" },
        evenings: { label: "Večery a víkendy" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Držíš nejakú diétu?"] },
      },
      options: {
        balanced: { label: "Vyvážená" },
        wholefood: { label: "Nespracované potraviny" },
        mediterranean: { label: "Stredomorská" },
        flexitarian: { label: "Flexitariánska" },
        pescatarian: { label: "Pescetariánska" },
        vegetarian: { label: "Vegetariánska" },
        vegan: { label: "Vegánska" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Nejaké zdravotné obmedzenia?"] },
      },
      options: {
        kidneys: { label: "Ochorenie obličiek" },
        ldl: { label: "Vysoký cholesterol" },
        lowsugar: { label: "Riziko cukrovky" },
        none: { label: "Nič z toho" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Kde ješ?"], placeholder: "Hľadať" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Inde" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Vyber si sériu, na ktorú sa zameriaš"] },
      },
      options: {
        "7": { label: "7 dní" },
        "14": { label: "14 dní" },
        "30": { label: "30 dní" },
        "50": { label: "50 dní" },
      },
    },
  ],
  building: {
    lines: ["Zostavujem tvoj osobný plán"],
    title: "Tvoj denný plán",
    rows: { calories: "Kalórie", protein: "Bielkoviny", carbs: "Sacharidy", fat: "Tuky", diet: "Diéta" },
    limitCap: { ldl: "nasýtené tuky ≤ {n} g", kidneys: "sodík ≤ {n} mg" },
    cta: "Ukáž mi plán",
    floorTitle: "Zastavili sme sa na {floor}kcal",
    floorBody: "Výpočet chcel ísť nižšie. Bez lekárskeho dohľadu nenastavujeme normy pod toto minimum, takže tvoj zostáva tu. Uvidíš to aj v denníku.",
  },
  summary: {
    lines: ["Tu je tvoj plán"],
    kcalLabel: "kcal denne",
    floorMarker: "obmedzené kvôli bezpečnosti · nikdy pod {floor}",
    macros: {
      protein: "Bielkoviny",
      carbs: "Sacharidy",
      fat: "Tuky",
      satfat: "Nasýtené tuky · na tvoju žiadosť",
    },
    capNote: "Toto tempo by si vyžadovalo väčšiu dennú zmenu, než je bezpečné dlhodobo udržať, preto máš bezpečnú verziu: {share} % z toho, čo tvoje telo spáli za deň.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Odfoť svoje prvé jedlo",
  },
  ui: {
    continueLabel: "Pokračovať",
    saveKept: "Nepodarilo sa to uložiť. Tvoja odpoveď je stále tu. Ťuknutím na Pokračovať ju pošleš znova.",
    idlePlaceholder: "Spud čaká na správu…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Pokračovať", less: "Menej", more: "Viac" },
    units: { years: "rokov", yearsCount: { one: "{n} rok", other: "{n} r." } },
  },
  beats: {
    ageWhy: "Metabolizmus sa s vekom mení, preto to zohľadňujeme",
    echo: { rest: "V pokoji: {rest}kcal denne", days: "Tvoje dni spália {burn}kcal" },
    baseline: { title: "Tu je tvoj východiskový bod", bmi: "BMI", what: "Index telesnej hmotnosti" },
    prelim: { title: "Tvoj plán", burn: "Spáliš", gap: "{delta} tvoje tempo", eat: "Ješ", perDay: "kcal denne", keepTitle: "Spáliš asi {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · najnižšia, akú nastavíme",
      now: "{weight} · teraz",
      nowLowest: "{weight} · teraz · najnižšia, akú nastavíme",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Navrhujem {weight}, asi o {pct} % menej, dobrý prvý cieľ", up: "Navrhujem {weight}, asi o {pct} % viac, dobrý prvý cieľ" },
  },
  pace: {
    rate: "{rate} za týždeň",
    rateSuffix: "za týždeň",
    result: "{target} približne {month} · {kcal}kcal denne",
    echo: "Z {from} na {to}.",
  },
  plan: {
    weightTitle: "Tvoja váha",
    everyDay: "Každý deň",
    infoTitle: "Tvoje údaje",
    basedOn: "Podľa tvojich odpovedí",
    changeAnytime: "Môžeš to kedykoľvek zmeniť",
    goal: {
      lose: "Cieľ: −{kg} · {month}",
      gain: "Cieľ: +{kg} · {month}",
      maintain: "Cieľ: zostať okolo {kg}",
      maintainRange: "Rozsah: {range}",
    },
    info: {
      startWeight: "Počiatočná váha", goalWeight: "Cieľová váha", activity: "Aktivita",
      target: "Cieľ", targetLose: "−{kg} · {month}", targetGain: "+{kg} · {month}",
    },
    satFat: { label: "nas. tuky", asked: "Nasýtené tuky · na tvoju žiadosť", perDay: "≤ {g} denne" },
    first: { title: "Tvoj prvý krok", step: "Odfoť svoje ďalšie jedlo. eait ho porovná s {kcal}kcal." },
    loader: { goal: "Tvoj cieľ", lose: "−{kg} · {month}", gain: "+{kg} · {month}" },
    chart: { estimateAria: "Odhadovaná váha: teraz {from}, {to} približne {month}" },
  },
  signup: { heading: "Ulož si svoj plán", line: "Aby s tebou tvoj plán aj predplatné prešli na nový telefón a tvoje jedlá ostali uložené." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Synchronizácia s aplikáciou Zdravie", body: "Váha a aktivita prídu sem. Tvoje jedlá idú do aplikácie Zdravie." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Jedno jedlo ide na mňa. Fotka, alebo mi to len povieš?",
    react: "Žiadny problém. Najprv ma vyskúšaj",
    photo: "Odfotiť",
    tell: "Napísať, čo bolo na tanieri",
    keepGoing: "Pokračovať",
    correct: "Opraviť jedlo",
    afterAsk: "To bolo jedno. Chceš to tak pri každom jedle?",
  },
  refusals: {
    invalid: {
      age: "To nevyzerá ako vek — skús niečo ako 34.",
      height_cm: "V centimetroch — niečo ako 175.",
      weight_kg: "V kilogramoch — stačí približne.",
      target_weight_kg: "Číslo v kg — napríklad 70.",
    },
    ambiguousAge: {
      line: "Chcem mať istotu, že to čítam správne — ak ide o rok {year}, pošli všetky štyri číslice.",
      confirm: "Mám {age} rokov",
    },
    direction: {
      gain: "Teraz máš {weight} kg a chceš pribrať na {target} — odtiaľto to nie je prírastok. Ak sa cieľ zmenil, môžeme ho prepnúť; inak mi daj číslo nad {weight}.",
      lose: "Teraz máš {weight} kg a chceš schudnúť na {target} — odtiaľto to nie je úbytok. Ak sa cieľ zmenil, môžeme ho prepnúť; inak mi daj číslo pod {weight}.",
      switchToLose: "Prepnúť na chudnutie",
      switchToGain: "Prepnúť na priberanie",
      above: "Číslo nad {weight}…",
      below: "Číslo pod {weight}…",
    },
    switched: {
      gain: "Prepnuté — ideme priberať. Kde chceš byť, v kg?",
    },
  },
};

const NO: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Kom i gang",
    signin: "Jeg har allerede en konto",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Hva vil du oppnå?"] },
      },
      options: {
        lose: { label: "Gå ned i vekt" },
        maintain: { label: "Holde vekten" },
        gain: { label: "Gå opp i vekt" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Hvilket kjønn har du?"] },
      },
      options: {
        male: { label: "Mann" },
        female: { label: "Kvinne" },
        other: { label: "Annet" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Alderen din?"],
          placeholder: "Alderen din",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Høyde"],
          placeholder: "Høyde i cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Vekten din"],
          placeholder: "Vekt i kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Hvor aktive er dagene dine?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Ingen trening" },
        few: { label: "1–2", hint: "Trening av og til" },
        some: { label: "3–4", hint: "Noen treningsøkter i uken" },
        many: { label: "5+", hint: "Trener nesten daglig" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Hvilken vekt sikter du mot?"],
          placeholder: "Målvekt i kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Hvor fort?"] },
      },
      options: {
        easy: { label: "Rolig" },
        steady: { label: "Jevnt" },
        push: { label: "Raskt" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Telt kalorier før?"] } },
      options: {
        never: { label: "Aldri" },
        stopped: { label: "Prøvde, sluttet" },
        onoff: { label: "Av og til" },
        now: { label: "Jeg teller nå" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Hva fikk deg til å slutte?", "Velg alt som passer"],
          variants: {
            onoff: ["Hva kom i veien?", "Velg alt som passer"],
            now: ["Hva vil du skal være enklere?", "Velg alt som passer"],
          },
        },
      },
      options: {
        too_long: { label: "Det tok for lang tid" },
        forgot: { label: "Jeg glemte det" },
        invisible: { label: "Jeg så ikke at det virket" },
        no_idea: { label: "Jeg visste ikke hva jeg skulle spise" },
        stressful: { label: "Det føltes stressende" },
        nobody: { label: "Ingen å spørre" },
        creeping: { label: "Vekten krøp tilbake" },
        not_enough: { label: "Vanskelig å spise nok" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Når er det vanskeligst å logge?"],
          variants: { never: ["Når tror du det blir vanskeligst å logge?"] },
        },
      },
      options: {
        workdays: { label: "Travle hverdager" },
        eating_out: { label: "Spise ute" },
        cooking: { label: "Lage mat til andre" },
        snacks: { label: "Snacks og drikke" },
        evenings: { label: "Kvelder og helger" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Følger du et kosthold?"] },
      },
      options: {
        balanced: { label: "Balansert" },
        wholefood: { label: "Lite bearbeidet" },
        mediterranean: { label: "Middelhavskost" },
        flexitarian: { label: "Fleksitariansk" },
        pescatarian: { label: "Pescetariansk" },
        vegetarian: { label: "Vegetarisk" },
        vegan: { label: "Vegansk" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Noen medisinske begrensninger?"] },
      },
      options: {
        kidneys: { label: "Nyresykdom" },
        ldl: { label: "Høyt kolesterol" },
        lowsugar: { label: "Diabetesrisiko" },
        none: { label: "Ingen av disse" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Hvor spiser du?"], placeholder: "Søk" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Et annet sted" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Velg en rekke å sikte mot"] },
      },
      options: {
        "7": { label: "7 dager" },
        "14": { label: "14 dager" },
        "30": { label: "30 dager" },
        "50": { label: "50 dager" },
      },
    },
  ],
  building: {
    lines: ["Lager den personlige planen din"],
    title: "Dagsplanen din",
    rows: { calories: "Kalorier", protein: "Protein", carbs: "Karbohydrater", fat: "Fett", diet: "Kosthold" },
    limitCap: { ldl: "mettet fett ≤ {n} g", kidneys: "natrium ≤ {n} mg" },
    cta: "Vis meg planen",
    floorTitle: "Vi stoppet på {floor}kcal",
    floorBody: "Regnestykket ville gå lavere. Vi setter ikke rammer under dette uten medisinsk oppfølging, så det er her din ligger. Det står også i dagboken din.",
  },
  summary: {
    lines: ["Her er planen din"],
    kcalLabel: "kcal om dagen",
    floorMarker: "begrenset av sikkerhetshensyn · aldri under {floor}",
    macros: {
      protein: "Protein",
      carbs: "Karbohydrater",
      fat: "Fett",
      satfat: "Mettet fett · du ba om det",
    },
    capNote: "Det tempoet krever en større daglig endring enn det er trygt å holde over tid, så du får den trygge versjonen: {share} % av det kroppen din forbrenner på en dag.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Ta bilde av ditt første måltid",
  },
  ui: {
    continueLabel: "Fortsett",
    saveKept: "Det kunne ikke lagres. Svaret ditt er fortsatt her. Fortsett sender det på nytt.",
    idlePlaceholder: "Melding til Spud…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Fortsett", less: "Mindre", more: "Mer" },
    units: { years: "år", yearsCount: { one: "{n} år", other: "{n} år" } },
  },
  beats: {
    ageWhy: "Stoffskiftet endrer seg med alderen, så vi regner det inn",
    echo: { rest: "I hvile: {rest}kcal om dagen", days: "Dagene dine forbrenner {burn}kcal" },
    baseline: { title: "Her er utgangspunktet ditt", bmi: "KMI", what: "Kroppsmasseindeks" },
    prelim: { title: "Planen din", burn: "Du forbrenner", gap: "{delta} tempoet ditt", eat: "Du spiser", perDay: "kcal om dagen", keepTitle: "Du forbrenner rundt {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · laveste vi setter",
      now: "{weight} · nå",
      nowLowest: "{weight} · nå · laveste vi setter",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Jeg foreslår {weight}, rundt {pct} % ned, et godt første mål", up: "Jeg foreslår {weight}, rundt {pct} % opp, et godt første mål" },
  },
  pace: {
    rate: "{rate} i uken",
    rateSuffix: "i uken",
    result: "{target} rundt {month} · {kcal}kcal om dagen",
    echo: "Fra {from} til {to}.",
  },
  plan: {
    weightTitle: "Vekten din",
    everyDay: "Hver dag",
    infoTitle: "Opplysningene dine",
    basedOn: "Basert på svarene dine",
    changeAnytime: "Du kan endre dette når som helst",
    goal: {
      lose: "Mål: −{kg} innen {month}",
      gain: "Mål: +{kg} innen {month}",
      maintain: "Mål: hold deg rundt {kg}",
      maintainRange: "Intervall: {range}",
    },
    info: {
      startWeight: "Startvekt", goalWeight: "Målvekt", activity: "Aktivitet",
      target: "Målsetting", targetLose: "−{kg} innen {month}", targetGain: "+{kg} innen {month}",
    },
    satFat: { label: "mettet fett", asked: "Mettet fett · du ba om det", perDay: "≤ {g} om dagen" },
    first: { title: "Ditt første steg", step: "Ta bilde av ditt neste måltid. eait sjekker det mot {kcal}kcal." },
    loader: { goal: "Målet ditt", lose: "−{kg} innen {month}", gain: "+{kg} innen {month}" },
    chart: { estimateAria: "Anslått vekt: {from} nå, {to} rundt {month}" },
  },
  signup: { heading: "Lagre planen din", line: "Slik følger planen og abonnementet ditt med over på en ny telefon, og måltidene dine blir lagret." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Synkroniser med Apple Helse", body: "Vekt og aktivitet kommer inn. Måltidene dine går til Helse." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Ett måltid spanderer jeg. Bilde, eller vil du bare fortelle?",
    react: "Null problem. Prøv meg først",
    photo: "Ta bilde",
    tell: "Fortell meg hva du spiste",
    keepGoing: "Fortsett",
    correct: "Korriger måltidet",
    afterAsk: "Det var ett. Vil du ha dette for hvert måltid?",
  },
  refusals: {
    invalid: {
      age: "Det ser ikke ut som en alder — prøv for eksempel 34.",
      height_cm: "I centimeter — for eksempel 175.",
      weight_kg: "I kilo — omtrent er greit.",
      target_weight_kg: "Et tall i kg — for eksempel 70.",
    },
    ambiguousAge: {
      line: "Jeg vil være sikker på at jeg leste det riktig — hvis du mente året {year}, send alle fire sifrene.",
      confirm: "Jeg er {age}",
    },
    direction: {
      gain: "Du er på {weight} kg og ba om å gå opp til {target} — det er ingen økning herfra. Hvis målet har endret seg, kan vi bytte det; ellers gi meg et tall over {weight}.",
      lose: "Du er på {weight} kg og ba om å gå ned til {target} — det er ingen nedgang herfra. Hvis målet har endret seg, kan vi bytte det; ellers gi meg et tall under {weight}.",
      switchToLose: "Bytt til å gå ned",
      switchToGain: "Bytt til å gå opp",
      above: "Et tall over {weight}…",
      below: "Et tall under {weight}…",
    },
    switched: {
      gain: "Byttet — da går vi opp. Hvor vil du lande, i kg?",
    },
  },
};

const FI: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Aloita",
    signin: "Minulla on jo tili",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Mitä haluat saavuttaa?"] },
      },
      options: {
        lose: { label: "Pudottaa painoa" },
        maintain: { label: "Säilyttää painoni" },
        gain: { label: "Nostaa painoa" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Mikä on sukupuolesi?"] },
      },
      options: {
        male: { label: "Mies" },
        female: { label: "Nainen" },
        other: { label: "Muu" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Ikäsi?"],
          placeholder: "Ikäsi",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Pituus"],
          placeholder: "Pituus, cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Painosi"],
          placeholder: "Paino, kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Kuinka aktiivisia päiväsi ovat?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Ei treenejä" },
        few: { label: "1–2", hint: "Treeniä silloin tällöin" },
        some: { label: "3–4", hint: "Muutama treeni viikossa" },
        many: { label: "5+", hint: "Omistautunut urheilija" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Mihin painoon tähtäät?"],
          placeholder: "Tavoitepaino, kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Kuinka nopeasti?"] },
      },
      options: {
        easy: { label: "Rauhallisesti" },
        steady: { label: "Tasaisesti" },
        push: { label: "Reippaasti" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Oletko laskenut kaloreja?"] } },
      options: {
        never: { label: "En koskaan" },
        stopped: { label: "Kokeilin, lopetin" },
        onoff: { label: "Silloin tällöin" },
        now: { label: "Lasken nykyään" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Mikä sai sinut lopettamaan?", "Valitse kaikki, jotka sopivat"],
          variants: {
            onoff: ["Mikä tuli väliin?", "Valitse kaikki, jotka sopivat"],
            now: ["Mitä haluaisit olevan helpompaa?", "Valitse kaikki, jotka sopivat"],
          },
        },
      },
      options: {
        too_long: { label: "Siihen meni liikaa aikaa" },
        forgot: { label: "Unohdin" },
        invisible: { label: "En nähnyt tuloksia" },
        no_idea: { label: "En tiennyt, mitä syödä" },
        stressful: { label: "Tuntui stressaavalta" },
        nobody: { label: "Ei ketään, keneltä kysyä" },
        creeping: { label: "Painoni hiipi takaisin" },
        not_enough: { label: "Vaikea syödä tarpeeksi" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Milloin kirjaaminen on vaikeinta?"],
          variants: { never: ["Milloin arvelet kirjaamisen olevan vaikeinta?"] },
        },
      },
      options: {
        workdays: { label: "Kiireiset työpäivät" },
        eating_out: { label: "Ravintolassa syöminen" },
        cooking: { label: "Muille kokkaaminen" },
        snacks: { label: "Välipalat ja juomat" },
        evenings: { label: "Illat ja viikonloput" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Noudatatko jotain ruokavaliota?"] },
      },
      options: {
        balanced: { label: "Monipuolinen" },
        wholefood: { label: "Prosessoimaton ruoka" },
        mediterranean: { label: "Välimerellinen" },
        flexitarian: { label: "Fleksitaristinen" },
        pescatarian: { label: "Pescovegetaristinen" },
        vegetarian: { label: "Kasvis" },
        vegan: { label: "Vegaaninen" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Onko lääketieteellisiä rajoitteita?"] },
      },
      options: {
        kidneys: { label: "Munuaissairaus" },
        ldl: { label: "Korkea kolesteroli" },
        lowsugar: { label: "Diabetesriski" },
        none: { label: "Ei mikään näistä" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Missä syöt?"], placeholder: "Hae" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Muualla" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Valitse tavoiteputki"] },
      },
      options: {
        "7": { label: "7 päivää" },
        "14": { label: "14 päivää" },
        "30": { label: "30 päivää" },
        "50": { label: "50 päivää" },
      },
    },
  ],
  building: {
    lines: ["Teemme henkilökohtaista suunnitelmaasi"],
    title: "Päivittäinen suunnitelmasi",
    rows: { calories: "Kalorit", protein: "Proteiini", carbs: "Hiilihydraatit", fat: "Rasva", diet: "Ruokavalio" },
    limitCap: { ldl: "tyydyttynyt rasva ≤ {n} g", kidneys: "natrium ≤ {n} mg" },
    cta: "Näytä suunnitelma",
    floorTitle: "Pysähdyimme tähän: {floor}kcal",
    floorBody: "Laskelma olisi mennyt alemmas. Emme aseta tavoitetasoja tämän alle ilman lääkärin seurantaa, joten sinun tavoitetasosi on tässä. Se lukee myös päiväkirjassasi.",
  },
  summary: {
    lines: ["Tässä on suunnitelmasi"],
    kcalLabel: "kcal päivässä",
    floorMarker: "rajattu turvallisuuden vuoksi · ei koskaan alle {floor}",
    macros: {
      protein: "Proteiini",
      carbs: "Hiilihydraatit",
      fat: "Rasva",
      satfat: "Tyydyttynyt rasva · pyynnöstäsi",
    },
    capNote: "Tuo tahti vaatisi suuremman päivittäisen muutoksen kuin on turvallista ylläpitää, joten saat turvallisen version: {share} % siitä, mitä kehosi kuluttaa päivässä.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Kuvaa ensimmäinen ateriasi",
  },
  ui: {
    continueLabel: "Jatka",
    saveKept: "Tallennus epäonnistui. Vastauksesi on yhä tässä. Jatka lähettää sen uudelleen.",
    idlePlaceholder: "Kirjoita Spudille…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Jatka", less: "Vähemmän", more: "Enemmän" },
    units: { years: "vuotta", yearsCount: { one: "{n} vuosi", other: "{n} vuotta" } },
  },
  beats: {
    ageWhy: "Aineenvaihdunta muuttuu iän myötä, joten otamme sen huomioon",
    echo: { rest: "Levossa: {rest}kcal päivässä", days: "Päiväsi kuluttavat {burn}kcal" },
    baseline: { title: "Tässä on lähtötasosi", bmi: "BMI", what: "Painoindeksi" },
    prelim: { title: "Suunnitelmasi", burn: "Kulutat", gap: "{delta} tahtisi", eat: "Syöt", perDay: "kcal päivässä", keepTitle: "Kulutat noin {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · alin, jonka asetamme",
      now: "{weight} · nyt",
      nowLowest: "{weight} · nyt · alin, jonka asetamme",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Ehdotan {weight}, noin {pct} % vähemmän, hyvä ensimmäinen tavoite", up: "Ehdotan {weight}, noin {pct} % enemmän, hyvä ensimmäinen tavoite" },
  },
  pace: {
    rate: "{rate} viikossa",
    rateSuffix: "viikossa",
    result: "{target} · arvio: {month} · {kcal}kcal päivässä",
    echo: "Nykyisestä {from} tavoitepainoon {to}.",
  },
  plan: {
    weightTitle: "Painosi",
    everyDay: "Joka päivä",
    infoTitle: "Tietosi",
    basedOn: "Vastaustesi perusteella",
    changeAnytime: "Voit muuttaa tätä milloin vain",
    goal: {
      lose: "Tavoite: −{kg} · {month}",
      gain: "Tavoite: +{kg} · {month}",
      maintain: "Tavoite: ylläpito, noin {kg}",
      maintainRange: "Vaihteluväli: {range}",
    },
    info: {
      startWeight: "Lähtöpaino", goalWeight: "Tavoitepaino", activity: "Aktiivisuus",
      target: "Tavoitetaso", targetLose: "−{kg} · {month}", targetGain: "+{kg} · {month}",
    },
    satFat: { label: "tyyd. rasva", asked: "Tyydyttynyt rasva · toiveesi", perDay: "≤ {g} päivässä" },
    first: { title: "Ensimmäinen askeleesi", step: "Kuvaa seuraava ateriasi. eait vertaa sitä lukuun {kcal}kcal." },
    loader: { goal: "Tavoitteesi", lose: "−{kg} · {month}", gain: "+{kg} · {month}" },
    chart: { estimateAria: "Arvioitu paino: nyt {from}, {to} arviolta {month}" },
  },
  signup: { heading: "Tallenna tilauksesi", line: "Näin suunnitelmasi ja tilauksesi siirtyvät mukanasi uuteen puhelimeen ja ateriasi säilyvät." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Synkronoi Terveys-apin kanssa", body: "Paino ja aktiivisuus tulevat sisään. Ateriasi menevät Terveys-appiin." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Yksi ateria minun piikkiini. Kuva, vai kerrotko vain?",
    react: "Ei haittaa. Kokeile minua ensin",
    photo: "Ota kuva",
    tell: "Kerro, mitä söit",
    keepGoing: "Jatka",
    correct: "Korjaa ateria",
    afterAsk: "Siinä yksi. Haluatko tämän jokaiseen ateriaan?",
  },
  refusals: {
    invalid: {
      age: "Tuo ei näytä iältä – kokeile vaikkapa 34.",
      height_cm: "Senttimetreinä – esimerkiksi 175.",
      weight_kg: "Kilogrammoina – suunnilleen riittää.",
      target_weight_kg: "Luku kilogrammoina – esimerkiksi 70.",
    },
    ambiguousAge: {
      line: "Haluan varmistaa, että luin oikein – jos tarkoitit vuotta {year}, lähetä kaikki neljä numeroa.",
      confirm: "Olen {age}",
    },
    direction: {
      gain: "Painat nyt {weight} kg ja tavoitepainoksi annoit {target} – se ei ole painonnousua tästä. Jos tavoite muuttui, voimme vaihtaa sen; muuten anna luku, joka on yli {weight}.",
      lose: "Painat nyt {weight} kg ja tavoitepainoksi annoit {target} – se ei ole painonpudotusta tästä. Jos tavoite muuttui, voimme vaihtaa sen; muuten anna luku, joka on alle {weight}.",
      switchToLose: "Vaihda painonpudotukseen",
      switchToGain: "Vaihda painonnousuun",
      above: "Luku, joka on yli {weight}…",
      below: "Luku, joka on alle {weight}…",
    },
    switched: {
      gain: "Vaihdettu – painonnousu siis. Mihin haluaisit päätyä, kilogrammoina?",
    },
  },
};

const DA: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Kom i gang",
    signin: "Jeg har allerede en konto",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Hvad er du her for?"] },
      },
      options: {
        lose: { label: "Tabe mig" },
        maintain: { label: "Holde min vægt" },
        gain: { label: "Tage på" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Hvad er dit køn?"] },
      },
      options: {
        male: { label: "Mand" },
        female: { label: "Kvinde" },
        other: { label: "Andet" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Din alder?"],
          placeholder: "Din alder",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Højde"],
          placeholder: "Højde i cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Din vægt"],
          placeholder: "Vægt i kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Hvor aktive er dine dage?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Ingen træning" },
        few: { label: "1–2", hint: "Træning en gang imellem" },
        some: { label: "3–4", hint: "Et par træningspas om ugen" },
        many: { label: "5+", hint: "Dedikeret atlet" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Hvilken vægt sigter du efter?"],
          placeholder: "Målvægt i kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Hvor hurtigt?"] },
      },
      options: {
        easy: { label: "Roligt" },
        steady: { label: "Jævnt" },
        push: { label: "Raskt" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Talt kalorier før?"] } },
      options: {
        never: { label: "Aldrig" },
        stopped: { label: "Prøvede, stoppede" },
        onoff: { label: "Af og til" },
        now: { label: "Jeg tæller nu" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Hvad fik dig til at stoppe?", "Vælg alt, der passer"],
          variants: {
            onoff: ["Hvad kom i vejen?", "Vælg alt, der passer"],
            now: ["Hvad vil du gerne have lettere?", "Vælg alt, der passer"],
          },
        },
      },
      options: {
        too_long: { label: "Det tog for lang tid" },
        forgot: { label: "Jeg glemte det" },
        invisible: { label: "Jeg så ikke, at det virkede" },
        no_idea: { label: "Jeg vidste ikke, hvad jeg skulle spise" },
        stressful: { label: "Det føltes stressende" },
        nobody: { label: "Ingen at spørge" },
        creeping: { label: "Min vægt krøb tilbage" },
        not_enough: { label: "Svært at spise nok" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Hvornår er det sværest at logge?"],
          variants: { never: ["Hvornår regner du med, at det er sværest at logge?"] },
        },
      },
      options: {
        workdays: { label: "Travle hverdage" },
        eating_out: { label: "Spise ude" },
        cooking: { label: "Lave mad til andre" },
        snacks: { label: "Snacks og drikke" },
        evenings: { label: "Aftener og weekender" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Følger du en bestemt kost?"] },
      },
      options: {
        balanced: { label: "Balanceret" },
        wholefood: { label: "Uforarbejdet" },
        mediterranean: { label: "Middelhavskost" },
        flexitarian: { label: "Fleksitarisk" },
        pescatarian: { label: "Pescetarisk" },
        vegetarian: { label: "Vegetarisk" },
        vegan: { label: "Vegansk" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Nogen medicinske begrænsninger?"] },
      },
      options: {
        kidneys: { label: "Nyresygdom" },
        ldl: { label: "Højt kolesterol" },
        lowsugar: { label: "Risiko for diabetes" },
        none: { label: "Ingen af disse" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Hvor spiser du?"], placeholder: "Søg" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Et andet sted" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Vælg en stime at sigte efter"] },
      },
      options: {
        "7": { label: "7 dage" },
        "14": { label: "14 dage" },
        "30": { label: "30 dage" },
        "50": { label: "50 dage" },
      },
    },
  ],
  building: {
    lines: ["Bygger din personlige plan"],
    title: "Din dagsplan",
    rows: { calories: "Kalorier", protein: "Protein", carbs: "Kulhydrater", fat: "Fedt", diet: "Kost" },
    limitCap: { ldl: "mættet fedt ≤ {n} g", kidneys: "natrium ≤ {n} mg" },
    cta: "Vis mig planen",
    floorTitle: "Vi stoppede ved {floor}kcal",
    floorBody: "Regnestykket ville længere ned. Vi sætter ikke mål under dette uden lægelig opfølgning, så det er her, dit ligger. Det står også i din dagbog.",
  },
  summary: {
    lines: ["Her er din plan"],
    kcalLabel: "kcal om dagen",
    floorMarker: "begrænset af hensyn til sikkerheden · aldrig under {floor}",
    macros: {
      protein: "Protein",
      carbs: "Kulhydrater",
      fat: "Fedt",
      satfat: "Mættet fedt · du bad om det",
    },
    capNote: "Det tempo kræver en større daglig ændring, end det er sikkert at holde, så du får den sikre udgave: {share} % af det, din krop forbrænder på en dag.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografér dit første måltid",
  },
  ui: {
    continueLabel: "Fortsæt",
    saveKept: "Det kunne ikke gemmes. Dit svar er her stadig. Fortsæt sender det igen.",
    idlePlaceholder: "Skriv til Spud…",
    optionContinues: "Selects and continues",
    stepper: { continue: "Fortsæt", less: "Mindre", more: "Mere" },
    units: { years: "år", yearsCount: { one: "{n} år", other: "{n} år" } },
  },
  beats: {
    ageWhy: "Dit stofskifte ændrer sig med alderen, så det regner vi med",
    echo: { rest: "I hvile: {rest}kcal om dagen", days: "Dine dage forbrænder {burn}kcal" },
    baseline: { title: "Her er dit udgangspunkt", bmi: "BMI", what: "Body mass index" },
    prelim: { title: "Din plan", burn: "Du forbrænder", gap: "{delta} dit tempo", eat: "Du spiser", perDay: "kcal om dagen", keepTitle: "Du forbrænder cirka {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · laveste vi sætter",
      now: "{weight} · nu",
      nowLowest: "{weight} · nu · laveste vi sætter",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Jeg foreslår {weight}, cirka {pct} % ned, et godt første mål", up: "Jeg foreslår {weight}, cirka {pct} % op, et godt første mål" },
  },
  pace: {
    rate: "{rate} om ugen",
    rateSuffix: "om ugen",
    result: "{target} omkring {month} · {kcal}kcal om dagen",
    echo: "Fra {from} til {to}.",
  },
  plan: {
    weightTitle: "Din vægt",
    everyDay: "Hver dag",
    infoTitle: "Dine oplysninger",
    basedOn: "Baseret på dine svar",
    changeAnytime: "Du kan ændre det når som helst",
    goal: {
      lose: "Mål: −{kg} inden {month}",
      gain: "Mål: +{kg} inden {month}",
      maintain: "Mål: hold dig omkring {kg}",
      maintainRange: "Interval: {range}",
    },
    info: {
      startWeight: "Startvægt", goalWeight: "Målvægt", activity: "Aktivitet",
      target: "Målværdi", targetLose: "−{kg} inden {month}", targetGain: "+{kg} inden {month}",
    },
    satFat: { label: "mættet fedt", asked: "Mættet fedt · du bad om det", perDay: "≤ {g} om dagen" },
    first: { title: "Dit første skridt", step: "Tag et foto af dit næste måltid. eait tjekker det mod {kcal}kcal." },
    loader: { goal: "Dit mål", lose: "−{kg} inden {month}", gain: "+{kg} inden {month}" },
    chart: { estimateAria: "Anslået vægt: {from} nu, {to} omkring {month}" },
  },
  signup: { heading: "Gem din plan", line: "Så følger din plan og dit abonnement med over på en ny telefon, og dine måltider bliver gemt." },
  referral: {
    ask: "Did a friend send you a link?",
    field: "Friend's invite link",
    unknown: "That link doesn't match anyone. Check it, or skip.",
    own: "That's your own link. A friend's link goes here.",
    already: "This account already joined with a friend's link.",
    paid: "Invite links are for new members, and this account has already bought eait.",
    tryAgain: "Try again",
    skip: "Skip",
  },
  health: { title: "Synkroniser med Sundhed", body: "Vægt og aktivitet kommer ind. Dine måltider går til Sundhed." },
  liveActivity: { titles: ["Questions", "Your plan", "Almost done"], go: "Continue" },
  firstMeal: {
    ask: "Ét måltid er på mig. Foto, eller vil du bare fortælle mig det?",
    react: "Intet problem. Prøv mig først",
    photo: "Tag et foto",
    tell: "Fortæl mig, hvad du spiste",
    keepGoing: "Fortsæt",
    correct: "Ret måltid",
    afterAsk: "Det var ét. Vil du have det til hvert måltid?",
  },
  refusals: {
    invalid: {
      age: "Det ligner ikke en alder — prøv noget i stil med 34.",
      height_cm: "I centimeter — noget i stil med 175.",
      weight_kg: "I kilo — cirka er fint.",
      target_weight_kg: "Et tal i kg — fx 70.",
    },
    ambiguousAge: {
      line: "Jeg vil være sikker på, at jeg læste det rigtigt — hvis du mente året {year}, så send alle fire cifre.",
      confirm: "Jeg er {age}",
    },
    direction: {
      gain: "Du vejer {weight} kg og bad om at komme op på {target} — det er ikke en stigning herfra. Hvis målet har ændret sig, kan vi skifte det; ellers giv mig et tal over {weight}.",
      lose: "Du vejer {weight} kg og bad om at komme ned på {target} — det er ikke et fald herfra. Hvis målet har ændret sig, kan vi skifte det; ellers giv mig et tal under {weight}.",
      switchToLose: "Skift til vægttab",
      switchToGain: "Skift til vægtøgning",
      above: "Et tal over {weight}…",
      below: "Et tal under {weight}…",
    },
    switched: {
      gain: "Skiftet — så er det vægtøgning. Hvor vil du gerne ende, i kg?",
    },
  },
};

const HU: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Kezdjük",
    signin: "Már van fiókom",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Mi a célod?"] },
      },
      options: {
        lose: { label: "Fogyás" },
        maintain: { label: "Testsúly megtartása" },
        gain: { label: "Súlygyarapítás" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Mi a nemed?"] },
      },
      options: {
        male: { label: "Férfi" },
        female: { label: "Nő" },
        other: { label: "Egyéb" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Életkorod?"],
          placeholder: "Életkorod",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Magasság"],
          placeholder: "Magasság cm-ben",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["A súlyod"],
          placeholder: "Testsúly kg-ban",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Mennyire aktívak a napjaid?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Nincs edzés" },
        few: { label: "1–2", hint: "Néha egy-egy edzés" },
        some: { label: "3–4", hint: "Heti néhány edzés" },
        many: { label: "5+", hint: "Elkötelezett sportoló" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Milyen testsúlyt szeretnél elérni?"],
          placeholder: "Célsúly kg-ban",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Milyen gyorsan?"] },
      },
      options: {
        easy: { label: "Kíméletes" },
        steady: { label: "Egyenletes" },
        push: { label: "Lendületes" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Számoltál már kalóriát?"] } },
      options: {
        never: { label: "Soha" },
        stopped: { label: "Próbáltam, abbahagytam" },
        onoff: { label: "Időnként" },
        now: { label: "Most is számolok" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Mi állított meg?", "Jelölj be mindent, ami igaz"],
          variants: {
            onoff: ["Mi jött közbe?", "Jelölj be mindent, ami igaz"],
            now: ["Mi legyen könnyebb?", "Jelölj be mindent, ami igaz"],
          },
        },
      },
      options: {
        too_long: { label: "Túl sokáig tartott" },
        forgot: { label: "Elfelejtettem" },
        invisible: { label: "Nem láttam, hogy működik" },
        no_idea: { label: "Nem tudtam, mit egyek" },
        stressful: { label: "Stresszes volt" },
        nobody: { label: "Nem volt kitől kérdezni" },
        creeping: { label: "A súlyom visszakúszott" },
        not_enough: { label: "Nehéz volt eleget enni" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Mikor a legnehezebb naplózni?"],
          variants: { never: ["Mikor lesz szerinted a legnehezebb naplózni?"] },
        },
      },
      options: {
        workdays: { label: "Zsúfolt munkanapok" },
        eating_out: { label: "Éttermi étkezés" },
        cooking: { label: "Másoknak főzés" },
        snacks: { label: "Nasik és italok" },
        evenings: { label: "Esték és hétvégék" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Követsz valamilyen étrendet?"] },
      },
      options: {
        balanced: { label: "Kiegyensúlyozott" },
        wholefood: { label: "Teljes értékű" },
        mediterranean: { label: "Mediterrán" },
        flexitarian: { label: "Flexitáriánus" },
        pescatarian: { label: "Pescetáriánus" },
        vegetarian: { label: "Vegetáriánus" },
        vegan: { label: "Vegán" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Van egészségügyi korlátozásod?"] },
      },
      options: {
        kidneys: { label: "Vesebetegség" },
        ldl: { label: "Magas koleszterin" },
        lowsugar: { label: "Cukorbetegség kockázata" },
        none: { label: "Egyik sem" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Hol eszel?"], placeholder: "Keresés" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Máshol" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Milyen sorozatot tűzöl ki célul?"] },
      },
      options: {
        "7": { label: "7 nap" },
        "14": { label: "14 nap" },
        "30": { label: "30 nap" },
        "50": { label: "50 nap" },
      },
    },
  ],
  building: {
    lines: ["Készül a személyre szabott terved"],
    title: "A napi terved",
    rows: { calories: "Kalória", protein: "Fehérje", carbs: "Szénhidrát", fat: "Zsír", diet: "Étrend" },
    limitCap: { ldl: "telített zsír ≤ {n} g", kidneys: "nátrium ≤ {n} mg" },
    cta: "Mutasd a tervet",
    floorTitle: "{floor}kcal-nál megálltunk",
    floorBody: "A számítás lejjebb menne. Orvosi felügyelet nélkül nem állítunk be ennél alacsonyabb célt, ezért a tiéd itt áll meg. A naplódban is ez fog szerepelni.",
  },
  summary: {
    lines: ["Itt a terved"],
    kcalLabel: "kcal naponta",
    floorMarker: "biztonsági korlát · sosem megy {floor} alá",
    macros: {
      protein: "Fehérje",
      carbs: "Szénhidrát",
      fat: "Zsír",
      satfat: "Telített zsír · te kérted",
    },
    capNote: "Ez a tempó nagyobb napi változást igényelne, mint ami biztonságosan tartható, ezért a biztonságos változatot kapod: a tested napi energiafelhasználásának {share}%-át.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotózd le az első étkezésedet",
  },
  ui: {
    continueLabel: "Tovább",
    saveKept: "Ezt nem sikerült menteni. A válaszod még itt van. A Tovább újra elküldi.",
    idlePlaceholder: "Üzenet Spudnak…",
    optionContinues: "Kiválasztja és folytat",
    stepper: { continue: "Tovább", less: "Kevesebb", more: "Több" },
    units: { years: "év", yearsCount: { one: "{n} év", other: "{n} év" } },
  },
  beats: {
    ageWhy: "Az anyagcseréd az életkorral változik, ezt is beszámítjuk",
    echo: { rest: "Nyugalomban: napi {rest}kcal", days: "A napjaid elégetnek {burn}kcal-t" },
    baseline: { title: "Itt a kiindulópontod", bmi: "BMI", what: "Testtömegindex" },
    prelim: { title: "A terved", burn: "Elégetsz", gap: "{delta} a tempód", eat: "Eszel", perDay: "kcal naponta", keepTitle: "Nagyjából {burn}kcal-t égetsz el" },
  },
  target: {
    markers: {
      lowest: "{weight} · legalacsonyabb cél",
      now: "{weight} · most",
      nowLowest: "{weight} · most · legalacsonyabb cél",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Javaslatom: {weight}, kb. {pct}%-kal kevesebb, jó első cél", up: "Javaslatom: {weight}, kb. {pct}%-kal több, jó első cél" },
  },
  pace: {
    rate: "heti {rate}",
    rateSuffix: "hetente",
    result: "{target} · kb. {month} · napi {kcal}kcal",
    echo: "{from} → {to}.",
  },
  plan: {
    weightTitle: "A súlyod",
    everyDay: "Minden nap",
    infoTitle: "Az adataid",
    basedOn: "A válaszaid alapján",
    changeAnytime: "Ezt bármikor módosíthatod",
    goal: {
      lose: "Cél: −{kg} · határidő: {month}",
      gain: "Cél: +{kg} · határidő: {month}",
      maintain: "Cél: {kg} körül maradni",
      maintainRange: "Tartomány: {range}",
    },
    info: {
      startWeight: "Kezdő súly", goalWeight: "Célsúly", activity: "Aktivitás",
      target: "Célérték", targetLose: "−{kg} · határidő: {month}", targetGain: "+{kg} · határidő: {month}",
    },
    satFat: { label: "tel. zsír", asked: "Telített zsír · te kérted", perDay: "≤ {g} naponta" },
    first: { title: "Az első lépésed", step: "Fotózd le a következő étkezésedet. Az eait {kcal}kcal-hoz hasonlítja." },
    loader: { goal: "A célod", lose: "−{kg} · határidő: {month}", gain: "+{kg} · határidő: {month}" },
    chart: { estimateAria: "Becsült testsúly: most {from}, kb. {month}: {to}" },
  },
  signup: { heading: "Mentsd el a csomagodat", line: "Így a csomagod és az előfizetésed veled tart az új telefonodra, az ételeid pedig megmaradnak." },
  referral: {
    ask: "Küldött egy barátod linket?",
    field: "A barátod meghívólinkje",
    unknown: "Ez a link senkihez sem tartozik. Ellenőrizd, vagy hagyd ki.",
    own: "Ez a saját linked. Ide egy barátod linkje kell.",
    already: "Ez a fiók már csatlakozott egy barát linkjével.",
    paid: "A meghívólinkek új tagoknak szólnak, és ez a fiók már megvásárolta az eait-et.",
    tryAgain: "Próbáld újra",
    skip: "Kihagyás",
  },
  health: { title: "Szinkronizálás az Egészség appal", body: "A testsúly és az aktivitás beérkezik. Az étkezéseid az Egészség appba kerülnek." },
  liveActivity: { titles: ["Kérdések", "A terved", "Mindjárt kész"], go: "Tovább" },
  firstMeal: {
    ask: "Egy étkezés az én kontómra. Fotó, vagy inkább elmondod?",
    react: "Semmi gond. Előbb próbálj ki",
    photo: "Fotó készítése",
    tell: "Elmondom, mit ettem",
    keepGoing: "Tovább",
    correct: "Étkezés javítása",
    afterAsk: "Ez volt az első. Szeretnéd így minden étkezésnél?",
  },
  refusals: {
    invalid: {
      age: "Ez nem tűnik életkornak — próbáld valami ilyesmivel: 34.",
      height_cm: "Centiméterben — például 175.",
      weight_kg: "Kilogrammban — nagyjából is jó.",
      target_weight_kg: "Egy szám kg-ban — például 70.",
    },
    ambiguousAge: {
      line: "Biztos akarok lenni benne, hogy jól olvastam — ha évszámra gondoltál ({year}), küldd el mind a négy számjegyet.",
      confirm: "{age} éves vagyok",
    },
    direction: {
      gain: "Most {weight} kg a testsúlyod, a gyarapodási célod pedig {target} — innen ez nem gyarapodás. Ha a cél változott, átállíthatjuk; különben adj meg egy {weight} feletti számot.",
      lose: "Most {weight} kg a testsúlyod, a fogyási célod pedig {target} — innen ez nem fogyás. Ha a cél változott, átállíthatjuk; különben adj meg egy {weight} alatti számot.",
      switchToLose: "Váltás fogyásra",
      switchToGain: "Váltás súlygyarapításra",
      above: "Egy {weight} feletti szám…",
      below: "Egy {weight} alatti szám…",
    },
    switched: {
      gain: "Átállítva — akkor súlygyarapítás. Hová szeretnél eljutni, kg-ban?",
    },
  },
};

const EL: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Ξεκίνα",
    signin: "Έχω ήδη λογαριασμό",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Τι θέλεις να πετύχεις;"] },
      },
      options: {
        lose: { label: "Απώλεια βάρους" },
        maintain: { label: "Διατήρηση βάρους" },
        gain: { label: "Αύξηση βάρους" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Ποιο είναι το φύλο σου;"] },
      },
      options: {
        male: { label: "Άνδρας" },
        female: { label: "Γυναίκα" },
        other: { label: "Άλλο" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Η ηλικία σου;"],
          placeholder: "Η ηλικία σου",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Ύψος"],
          placeholder: "Ύψος σε cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Το βάρος σου"],
          placeholder: "Βάρος σε kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Πόσο δραστήριες είναι οι μέρες σου;"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Καθόλου προπόνηση" },
        few: { label: "1–2", hint: "Προπόνηση πού και πού" },
        some: { label: "3–4", hint: "Μερικές προπονήσεις την εβδομάδα" },
        many: { label: "5+", hint: "Προπόνηση σχεδόν κάθε μέρα" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Σε ποιο βάρος στοχεύεις;"],
          placeholder: "Βάρος-στόχος σε kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Πόσο γρήγορα;"] },
      },
      options: {
        easy: { label: "Ήπια" },
        steady: { label: "Σταθερά" },
        push: { label: "Γρήγορα" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Έχεις μετρήσει θερμίδες;"] } },
      options: {
        never: { label: "Ποτέ" },
        stopped: { label: "Δοκίμασα, σταμάτησα" },
        onoff: { label: "Περιστασιακά" },
        now: { label: "Μετράω τώρα" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Τι σε σταμάτησε;", "Διάλεξε όσα ταιριάζουν"],
          variants: {
            onoff: ["Τι μπήκε εμπόδιο;", "Διάλεξε όσα ταιριάζουν"],
            now: ["Τι θα ήθελες πιο εύκολο;", "Διάλεξε όσα ταιριάζουν"],
          },
        },
      },
      options: {
        too_long: { label: "Έπαιρνε πολύ χρόνο" },
        forgot: { label: "Το ξεχνούσα" },
        invisible: { label: "Δεν έβλεπα να δουλεύει" },
        no_idea: { label: "Δεν ήξερα τι να φάω" },
        stressful: { label: "Ήταν αγχωτικό" },
        nobody: { label: "Κανέναν να ρωτήσω" },
        creeping: { label: "Το βάρος μου ξανά ανέβαινε" },
        not_enough: { label: "Δύσκολο να φάω αρκετά" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Πότε η καταγραφή είναι πιο δύσκολη;"],
          variants: { never: ["Πότε περιμένεις να είναι πιο δύσκολη η καταγραφή;"] },
        },
      },
      options: {
        workdays: { label: "Φορτωμένες εργάσιμες" },
        eating_out: { label: "Φαγητό έξω" },
        cooking: { label: "Μαγείρεμα για άλλους" },
        snacks: { label: "Σνακ και ποτά" },
        evenings: { label: "Βράδια και Σαββατοκύριακα" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Ακολουθείς κάποια διατροφή;"] },
      },
      options: {
        balanced: { label: "Ισορροπημένη" },
        wholefood: { label: "Ανεπεξέργαστη" },
        mediterranean: { label: "Μεσογειακή" },
        flexitarian: { label: "Φλεξιταριανή" },
        pescatarian: { label: "Πεσκεταριανή" },
        vegetarian: { label: "Χορτοφαγική" },
        vegan: { label: "Βίγκαν" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Κάποιοι ιατρικοί περιορισμοί;"] },
      },
      options: {
        kidneys: { label: "Πάθηση νεφρών" },
        ldl: { label: "Υψηλή χοληστερίνη" },
        lowsugar: { label: "Κίνδυνος διαβήτη" },
        none: { label: "Τίποτα από αυτά" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Πού τρως;"], placeholder: "Αναζήτηση" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Κάπου αλλού" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Διάλεξε ένα σερί να κυνηγήσεις"] },
      },
      options: {
        "7": { label: "7 ημέρες" },
        "14": { label: "14 ημέρες" },
        "30": { label: "30 ημέρες" },
        "50": { label: "50 ημέρες" },
      },
    },
  ],
  building: {
    lines: ["Φτιάχνουμε το προσωπικό σου πλάνο"],
    title: "Το ημερήσιο πλάνο σου",
    rows: { calories: "Θερμίδες", protein: "Πρωτεΐνη", carbs: "Υδατάνθρακες", fat: "Λιπαρά", diet: "Διατροφή" },
    limitCap: { ldl: "κορεσμένα λιπαρά ≤ {n} g", kidneys: "νάτριο ≤ {n} mg" },
    cta: "Δείξε μου το πλάνο",
    floorTitle: "Σταματήσαμε στις {floor}kcal",
    floorBody: "Ο υπολογισμός ήθελε να πάει πιο χαμηλά. Δεν ορίζουμε στόχους κάτω από αυτό χωρίς ιατρική παρακολούθηση, οπότε εδώ μένει ο δικός σου. Θα το γράφει και στο ημερολόγιό σου.",
  },
  summary: {
    lines: ["Αυτό είναι το πλάνο σου"],
    kcalLabel: "kcal την ημέρα",
    floorMarker: "περιορισμένο για ασφάλεια · ποτέ κάτω από {floor}",
    macros: {
      protein: "Πρωτεΐνη",
      carbs: "Υδατάνθρακες",
      fat: "Λιπαρά",
      satfat: "Κορεσμένα λιπαρά · το ζήτησες",
    },
    capNote: "Αυτός ο ρυθμός θέλει μεγαλύτερη ημερήσια αλλαγή απ' όση είναι ασφαλές να διατηρηθεί, οπότε ο δικός σου είναι η ασφαλής εκδοχή: {share}% από όσα καίει το σώμα σου σε μια μέρα.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Φωτογράφισε το πρώτο σου γεύμα",
  },
  ui: {
    continueLabel: "Συνέχεια",
    saveKept: "Δεν ήταν δυνατή η αποθήκευση. Η απάντησή σου είναι ακόμα εδώ. Πάτα Συνέχεια για να σταλεί ξανά.",
    idlePlaceholder: "Μήνυμα προς Spud…",
    optionContinues: "Επιλέγει και συνεχίζει",
    stepper: { continue: "Συνέχεια", less: "Λιγότερο", more: "Περισσότερο" },
    units: { years: "έτη", yearsCount: { one: "{n} έτος", other: "{n} έτη" } },
  },
  beats: {
    ageWhy: "Ο μεταβολισμός σου αλλάζει με την ηλικία, γι' αυτό το υπολογίζουμε",
    echo: { rest: "Σε ηρεμία: {rest}kcal την ημέρα", days: "Οι μέρες σου καίνε {burn}kcal" },
    baseline: { title: "Αυτό είναι το σημείο εκκίνησής σου", bmi: "ΔΜΣ", what: "Δείκτης μάζας σώματος" },
    prelim: { title: "Το πλάνο σου", burn: "Καίς", gap: "{delta} ο ρυθμός σου", eat: "Τρως", perDay: "kcal την ημέρα", keepTitle: "Καίς περίπου {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · το κατώτατο που ορίζουμε",
      now: "{weight} · τώρα",
      nowLowest: "{weight} · τώρα · το κατώτατο που ορίζουμε",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Προτείνω {weight}, περίπου {pct}% λιγότερο, ένας καλός πρώτος στόχος", up: "Προτείνω {weight}, περίπου {pct}% περισσότερο, ένας καλός πρώτος στόχος" },
  },
  pace: {
    rate: "{rate} την εβδομάδα",
    rateSuffix: "την εβδομάδα",
    result: "{target} περίπου έως {month} · {kcal}kcal την ημέρα",
    echo: "Από {from} σε {to}.",
  },
  plan: {
    weightTitle: "Το βάρος σου",
    everyDay: "Κάθε μέρα",
    infoTitle: "Τα στοιχεία σου",
    basedOn: "Με βάση τις απαντήσεις σου",
    changeAnytime: "Μπορείς να το αλλάξεις όποτε θες",
    goal: {
      lose: "Στόχος: −{kg} · {month}",
      gain: "Στόχος: +{kg} · {month}",
      maintain: "Στόχος: να μείνεις γύρω στα {kg}",
      maintainRange: "Εύρος: {range}",
    },
    info: {
      startWeight: "Αρχικό βάρος", goalWeight: "Βάρος-στόχος", activity: "Δραστηριότητα",
      target: "Στόχος", targetLose: "−{kg} · {month}", targetGain: "+{kg} · {month}",
    },
    satFat: { label: "κορ. λιπαρά", asked: "Κορεσμένα λιπαρά · το ζήτησες", perDay: "≤ {g} την ημέρα" },
    first: { title: "Το πρώτο σου βήμα", step: "Φωτογράφισε το επόμενο γεύμα σου. Το eait το συγκρίνει με {kcal}kcal." },
    loader: { goal: "Ο στόχος σου", lose: "−{kg} · {month}", gain: "+{kg} · {month}" },
    chart: { estimateAria: "Εκτιμώμενο βάρος: {from} τώρα, {to} περίπου έως {month}" },
  },
  signup: { heading: "Αποθήκευσε το πλάνο σου", line: "Έτσι το πλάνο και η συνδρομή σου σε ακολουθούν σε νέο τηλέφωνο και τα γεύματά σου διατηρούνται." },
  referral: {
    ask: "Σου έστειλε κάποιος φίλος σύνδεσμο;",
    field: "Σύνδεσμος πρόσκλησης φίλου",
    unknown: "Αυτός ο σύνδεσμος δεν αντιστοιχεί σε κανέναν. Έλεγξέ τον ή κάνε παράλειψη.",
    own: "Αυτός είναι ο δικός σου σύνδεσμος. Εδώ μπαίνει ο σύνδεσμος ενός φίλου.",
    already: "Αυτός ο λογαριασμός έχει ήδη γραφτεί με σύνδεσμο φίλου.",
    paid: "Οι σύνδεσμοι πρόσκλησης είναι για νέα μέλη, και αυτός ο λογαριασμός έχει ήδη αγοράσει το eait.",
    tryAgain: "Δοκίμασε ξανά",
    skip: "Παράλειψη",
  },
  health: { title: "Συγχρονισμός με την Υγεία", body: "Το βάρος και η δραστηριότητα έρχονται εδώ. Τα γεύματά σου πάνε στην Υγεία." },
  liveActivity: { titles: ["Ερωτήσεις", "Το πλάνο σου", "Σχεδόν τελειώσαμε"], go: "Συνέχεια" },
  firstMeal: {
    ask: "Ένα γεύμα κερνάω εγώ. Φωτογραφία ή απλώς μου το λες;",
    react: "Κανένα πρόβλημα. Δοκίμασέ με πρώτα",
    photo: "Τράβηξε φωτογραφία",
    tell: "Πες μου τι έφαγες",
    keepGoing: "Συνέχισε",
    correct: "Διόρθωση γεύματος",
    afterAsk: "Αυτό ήταν το ένα. Το θέλεις για κάθε γεύμα;",
  },
  refusals: {
    invalid: {
      age: "Αυτό δεν μοιάζει με ηλικία — δοκίμασε κάτι σαν 34.",
      height_cm: "Σε εκατοστά — κάτι σαν 175.",
      weight_kg: "Σε κιλά — κατά προσέγγιση αρκεί.",
      target_weight_kg: "Ένας αριθμός σε kg — π.χ. 70.",
    },
    ambiguousAge: {
      line: "Θέλω να βεβαιωθώ ότι το διάβασα σωστά — αν εννοούσες το έτος {year}, στείλε και τα τέσσερα ψηφία.",
      confirm: "Είμαι {age} ετών",
    },
    direction: {
      gain: "Είσαι στα {weight} kg και ζήτησες να ανέβεις στα {target} — από εδώ αυτό δεν είναι αύξηση. Αν άλλαξε ο στόχος, μπορούμε να τον αλλάξουμε· αλλιώς δώσε μου έναν αριθμό πάνω από {weight}.",
      lose: "Είσαι στα {weight} kg και ζήτησες να πέσεις στα {target} — από εδώ αυτό δεν είναι μείωση. Αν άλλαξε ο στόχος, μπορούμε να τον αλλάξουμε· αλλιώς δώσε μου έναν αριθμό κάτω από {weight}.",
      switchToLose: "Αλλαγή σε απώλεια βάρους",
      switchToGain: "Αλλαγή σε αύξηση βάρους",
      above: "Ένας αριθμός πάνω από {weight}…",
      below: "Ένας αριθμός κάτω από {weight}…",
    },
    switched: {
      gain: "Έγινε — πάμε για αύξηση. Πού θα ήθελες να φτάσεις, σε kg;",
    },
  },
};

const RO: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Începe",
    signin: "Am deja un cont",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Ce vrei să obții?"] },
      },
      options: {
        lose: { label: "Să slăbesc" },
        maintain: { label: "Să-mi mențin greutatea" },
        gain: { label: "Să iau în greutate" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Care e sexul tău?"] },
      },
      options: {
        male: { label: "Masculin" },
        female: { label: "Feminin" },
        other: { label: "Altul" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Vârsta ta?"],
          placeholder: "Vârsta ta",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Înălțime"],
          placeholder: "Înălțimea în cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Greutatea ta"],
          placeholder: "Greutatea în kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Cât de active sunt zilele tale?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Fără antrenamente" },
        few: { label: "1–2", hint: "Antrenamente din când în când" },
        some: { label: "3–4", hint: "Câteva antrenamente pe săptămână" },
        many: { label: "5+", hint: "Antrenament aproape zilnic" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Ce greutate îți propui?"],
          placeholder: "Greutatea țintă în kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Cât de repede?"] },
      },
      options: {
        easy: { label: "Lejer" },
        steady: { label: "Constant" },
        push: { label: "Alert" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Ai mai numărat calorii?"] } },
      options: {
        never: { label: "Niciodată" },
        stopped: { label: "Am încercat, m-am oprit" },
        onoff: { label: "Din când în când" },
        now: { label: "Număr acum" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Ce te-a oprit?", "Alege tot ce se potrivește"],
          variants: {
            onoff: ["Ce ți-a stat în cale?", "Alege tot ce se potrivește"],
            now: ["Ce ai vrea să fie mai ușor?", "Alege tot ce se potrivește"],
          },
        },
      },
      options: {
        too_long: { label: "Dura prea mult" },
        forgot: { label: "Uitam" },
        invisible: { label: "Nu vedeam rezultate" },
        no_idea: { label: "Nu știam ce să mănânc" },
        stressful: { label: "Era stresant" },
        nobody: { label: "Nu aveam pe cine să întreb" },
        creeping: { label: "Greutatea mea tot revenea" },
        not_enough: { label: "Greu să mănânc suficient" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Când e cel mai greu să notezi?"],
          variants: { never: ["Când te aștepți să fie cel mai greu să notezi?"] },
        },
      },
      options: {
        workdays: { label: "Zile lucrătoare aglomerate" },
        eating_out: { label: "Mese în oraș" },
        cooking: { label: "Gătit pentru alții" },
        snacks: { label: "Gustări și băuturi" },
        evenings: { label: "Seri și weekenduri" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Urmezi o dietă?"] },
      },
      options: {
        balanced: { label: "Echilibrată" },
        wholefood: { label: "Alimente integrale" },
        mediterranean: { label: "Mediteraneeană" },
        flexitarian: { label: "Flexitariană" },
        pescatarian: { label: "Pescetariană" },
        vegetarian: { label: "Vegetariană" },
        vegan: { label: "Vegană" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Ai limitări medicale?"] },
      },
      options: {
        kidneys: { label: "Afecțiune renală" },
        ldl: { label: "Colesterol ridicat" },
        lowsugar: { label: "Risc de diabet" },
        none: { label: "Niciuna dintre acestea" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Unde mănânci?"], placeholder: "Caută" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Altundeva" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Ce serie îți propui?"] },
      },
      options: {
        "7": { label: "7 zile" },
        "14": { label: "14 zile" },
        "30": { label: "30 de zile" },
        "50": { label: "50 de zile" },
      },
    },
  ],
  building: {
    lines: ["Îți construim planul personal"],
    title: "Planul tău zilnic",
    rows: { calories: "Calorii", protein: "Proteine", carbs: "Carbohidrați", fat: "Grăsimi", diet: "Dietă" },
    limitCap: { ldl: "grăsimi saturate ≤ {n} g", kidneys: "sodiu ≤ {n} mg" },
    cta: "Arată-mi planul",
    floorTitle: "Ne-am oprit la {floor}kcal",
    floorBody: "Calculul voia să coboare mai jos. Nu stabilim ținte sub acest nivel fără supraveghere medicală, așa că aici rămâne a ta. Scrie asta și în jurnalul tău.",
  },
  summary: {
    lines: ["Iată planul tău"],
    kcalLabel: "kcal pe zi",
    floorMarker: "limitat pentru siguranță · niciodată sub {floor}",
    macros: {
      protein: "Proteine",
      carbs: "Carbohidrați",
      fat: "Grăsimi",
      satfat: "Grăsimi saturate · la cererea ta",
    },
    capNote: "Ritmul acesta ar cere o schimbare zilnică mai mare decât poate fi menținută în siguranță, așa că primești varianta sigură: {share}% din ce arde corpul tău într-o zi.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografiază prima ta masă",
  },
  ui: {
    continueLabel: "Continuă",
    saveKept: "Nu s-a putut salva. Răspunsul tău e încă aici. Continuă îl trimite din nou.",
    idlePlaceholder: "Scrie-i lui Spud…",
    optionContinues: "Selectează și continuă",
    stepper: { continue: "Continuă", less: "Mai puțin", more: "Mai mult" },
    units: { years: "ani", yearsCount: { one: "{n} an", other: "{n} ani" } },
  },
  beats: {
    ageWhy: "Metabolismul se schimbă odată cu vârsta, așa că ținem cont de asta",
    echo: { rest: "În repaus: {rest}kcal pe zi", days: "Zilele tale ard {burn}kcal" },
    baseline: { title: "Iată punctul tău de pornire", bmi: "IMC", what: "Indicele de masă corporală" },
    prelim: { title: "Planul tău", burn: "Arzi", gap: "{delta} ritmul tău", eat: "Mănânci", perDay: "kcal pe zi", keepTitle: "Arzi cam {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · minimul nostru",
      now: "{weight} · acum",
      nowLowest: "{weight} · acum · minimul nostru",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Îți sugerez {weight}, cu aproximativ {pct}% mai puțin, un prim obiectiv bun", up: "Îți sugerez {weight}, cu aproximativ {pct}% mai mult, un prim obiectiv bun" },
  },
  pace: {
    rate: "{rate} pe săptămână",
    rateSuffix: "pe săptămână",
    result: "{target} cam în {month} · {kcal}kcal pe zi",
    echo: "De la {from} la {to}.",
  },
  plan: {
    weightTitle: "Greutatea ta",
    everyDay: "În fiecare zi",
    infoTitle: "Datele tale",
    basedOn: "Pe baza răspunsurilor tale",
    changeAnytime: "Poți schimba asta oricând",
    goal: {
      lose: "Obiectiv: −{kg} până în {month}",
      gain: "Obiectiv: +{kg} până în {month}",
      maintain: "Obiectiv: să rămâi în jur de {kg}",
      maintainRange: "Interval: {range}",
    },
    info: {
      startWeight: "Greutatea de pornire", goalWeight: "Greutatea țintă", activity: "Activitate",
      target: "Țintă", targetLose: "−{kg} până în {month}", targetGain: "+{kg} până în {month}",
    },
    satFat: { label: "grăsimi sat.", asked: "Grăsimi saturate · la cererea ta", perDay: "≤ {g} pe zi" },
    first: { title: "Primul tău pas", step: "Fotografiază următoarea masă. eait o verifică față de {kcal}kcal." },
    loader: { goal: "Obiectivul tău", lose: "−{kg} până în {month}", gain: "+{kg} până în {month}" },
    chart: { estimateAria: "Greutate estimată: {from} acum, {to} cam în {month}" },
  },
  signup: { heading: "Salvează-ți planul", line: "Ca planul și abonamentul tău să te urmeze pe un telefon nou, iar mesele tale să fie păstrate." },
  referral: {
    ask: "Ți-a trimis un prieten un link?",
    field: "Linkul de invitație de la prieten",
    unknown: "Linkul nu corespunde nimănui. Verifică-l sau sari peste.",
    own: "Acesta e linkul tău. Aici pui linkul unui prieten.",
    already: "Acest cont s-a alăturat deja cu linkul unui prieten.",
    paid: "Linkurile de invitație sunt pentru membri noi, iar acest cont a cumpărat deja eait.",
    tryAgain: "Încearcă din nou",
    skip: "Sari peste",
  },
  health: { title: "Sincronizează cu Sănătate", body: "Greutatea și activitatea intră. Mesele tale ajung în Sănătate." },
  liveActivity: { titles: ["Întrebări", "Planul tău", "Aproape gata"], go: "Continuă" },
  firstMeal: {
    ask: "O masă din partea mea. Fotografie sau îmi spui?",
    react: "Nicio problemă. Încearcă-mă mai întâi",
    photo: "Fă o fotografie",
    tell: "Spune-mi ce ai mâncat",
    keepGoing: "Continuă",
    correct: "Corectează masa",
    afterAsk: "Asta a fost una. Vrei asta la fiecare masă?",
  },
  refusals: {
    invalid: {
      age: "Nu pare o vârstă — încearcă ceva de genul 34.",
      height_cm: "În centimetri — ceva de genul 175.",
      weight_kg: "În kilograme — aproximativ e în regulă.",
      target_weight_kg: "Un număr în kg — de exemplu 70.",
    },
    ambiguousAge: {
      line: "Vreau să mă asigur că am citit bine — dacă te refereai la anul {year}, trimite toate cele patru cifre.",
      confirm: "Am {age} ani",
    },
    direction: {
      gain: "Ai {weight} kg și ai cerut să ajungi la {target} — de aici nu e o creștere. Dacă s-a schimbat obiectivul, îl putem schimba; altfel dă-mi un număr peste {weight}.",
      lose: "Ai {weight} kg și ai cerut să cobori la {target} — de aici nu e o scădere. Dacă s-a schimbat obiectivul, îl putem schimba; altfel dă-mi un număr sub {weight}.",
      switchToLose: "Treci la slăbit",
      switchToGain: "Treci la luat în greutate",
      above: "Un număr peste {weight}…",
      below: "Un număr sub {weight}…",
    },
    switched: {
      gain: "Am schimbat — deci luăm în greutate. Unde ai vrea să ajungi, în kg?",
    },
  },
};

const CS: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Začít",
    signin: "Už mám účet",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Co je tvůj cíl?"] },
      },
      options: {
        lose: { label: "Zhubnout" },
        maintain: { label: "Udržet váhu" },
        gain: { label: "Přibrat" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Jaké je tvoje pohlaví?"] },
      },
      options: {
        male: { label: "Muž" },
        female: { label: "Žena" },
        other: { label: "Jiné" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Tvůj věk?"],
          placeholder: "Tvůj věk",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Výška"],
          placeholder: "Výška v cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Tvoje váha"],
          placeholder: "Váha v kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Jak aktivní jsou tvoje dny?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Bez tréninků" },
        few: { label: "1–2", hint: "Občas nějaký trénink" },
        some: { label: "3–4", hint: "Pár tréninků týdně" },
        many: { label: "5+", hint: "Trénink skoro denně" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Na jakou váhu míříš?"],
          placeholder: "Cílová váha v kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Jak rychle?"] },
      },
      options: {
        easy: { label: "Mírně" },
        steady: { label: "Vyrovnaně" },
        push: { label: "Svižně" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Máš zkušenost s počítáním kalorií?"] } },
      options: {
        never: { label: "Nikdy" },
        stopped: { label: "Dřív jo, teď ne" },
        onoff: { label: "S přestávkami" },
        now: { label: "Počítám teď" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Co tě zastavilo?", "Vyber všechno, co sedí"],
          variants: {
            onoff: ["Co ti překáželo?", "Vyber všechno, co sedí"],
            now: ["Co by mělo být jednodušší?", "Vyber všechno, co sedí"],
          },
        },
      },
      options: {
        too_long: { label: "Trvalo to moc dlouho" },
        forgot: { label: "Zapomínalo se mi" },
        invisible: { label: "Nebylo vidět výsledky" },
        no_idea: { label: "Chyběly nápady, co jíst" },
        stressful: { label: "Bylo to stresující" },
        nobody: { label: "Nebylo koho se zeptat" },
        creeping: { label: "Váha se vracela" },
        not_enough: { label: "Těžké bylo sníst dost" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kdy je zapisování nejtěžší?"],
          variants: { never: ["Kdy si myslíš, že zapisování bude nejtěžší?"] },
        },
      },
      options: {
        workdays: { label: "Náročné pracovní dny" },
        eating_out: { label: "Jídlo venku" },
        cooking: { label: "Vaření pro jiné" },
        snacks: { label: "Svačiny a nápoje" },
        evenings: { label: "Večery a víkendy" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Držíš nějakou dietu?"] },
      },
      options: {
        balanced: { label: "Vyvážená" },
        wholefood: { label: "Nezpracované potraviny" },
        mediterranean: { label: "Středomořská" },
        flexitarian: { label: "Flexitariánská" },
        pescatarian: { label: "Pescetariánská" },
        vegetarian: { label: "Vegetariánská" },
        vegan: { label: "Veganská" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Nějaká zdravotní omezení?"] },
      },
      options: {
        kidneys: { label: "Onemocnění ledvin" },
        ldl: { label: "Vysoký cholesterol" },
        lowsugar: { label: "Riziko cukrovky" },
        none: { label: "Nic z toho" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Kde jíš?"], placeholder: "Hledat" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Jinde" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Jakou sérii si dáš za cíl?"] },
      },
      options: {
        "7": { label: "7 dní" },
        "14": { label: "14 dní" },
        "30": { label: "30 dní" },
        "50": { label: "50 dní" },
      },
    },
  ],
  building: {
    lines: ["Sestavuji tvůj osobní plán"],
    title: "Tvůj denní plán",
    rows: { calories: "Kalorie", protein: "Bílkoviny", carbs: "Sacharidy", fat: "Tuky", diet: "Dieta" },
    limitCap: { ldl: "nasycené tuky ≤ {n} g", kidneys: "sodík ≤ {n} mg" },
    cta: "Ukaž mi plán",
    floorTitle: "Zastavili jsme se na {floor}kcal",
    floorBody: "Výpočet chtěl jít níž. Bez lékařského dohledu cíle pod toto minimum nenastavujeme, takže tvůj zůstává tady. V deníku to bude uvedeno taky.",
  },
  summary: {
    lines: ["Tady je tvůj plán"],
    kcalLabel: "kcal denně",
    floorMarker: "omezeno kvůli bezpečnosti · nikdy pod {floor}",
    macros: {
      protein: "Bílkoviny",
      carbs: "Sacharidy",
      fat: "Tuky",
      satfat: "Nasycené tuky · na tvoje přání",
    },
    capNote: "Takové tempo by vyžadovalo větší denní změnu, než je bezpečné dlouhodobě udržet, takže máš bezpečnou verzi: {share} % toho, co tvoje tělo za den spálí.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Vyfoť své první jídlo",
  },
  ui: {
    continueLabel: "Pokračovat",
    saveKept: "Nepodařilo se to uložit. Tvoje odpověď tu pořád je. Tlačítko Pokračovat ji odešle znovu.",
    idlePlaceholder: "Zpráva pro Spud…",
    optionContinues: "Vybere a pokračuje",
    stepper: { continue: "Pokračovat", less: "Méně", more: "Více" },
    units: { years: "let", yearsCount: { one: "{n} rok", other: "{n} let" } },
  },
  beats: {
    ageWhy: "S věkem se mění metabolismus, a tak s tím počítáme",
    echo: { rest: "V klidu: {rest}kcal denně", days: "Tvoje dny spálí {burn}kcal" },
    baseline: { title: "Tady je tvůj výchozí bod", bmi: "BMI", what: "Index tělesné hmotnosti" },
    prelim: { title: "Tvůj plán", burn: "Spálíš", gap: "{delta} tvoje tempo", eat: "Jíš", perDay: "kcal denně", keepTitle: "Spálíš zhruba {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · nejnižší, co nastavíme",
      now: "{weight} · teď",
      nowLowest: "{weight} · teď · nejnižší, co nastavíme",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Navrhuji {weight}, zhruba o {pct} % méně, dobrý první cíl", up: "Navrhuji {weight}, zhruba o {pct} % více, dobrý první cíl" },
  },
  pace: {
    rate: "{rate} týdně",
    rateSuffix: "týdně",
    result: "{target} · odhad: {month} · {kcal}kcal denně",
    echo: "Z {from} na {to}.",
  },
  plan: {
    weightTitle: "Tvoje váha",
    everyDay: "Každý den",
    infoTitle: "Tvoje údaje",
    basedOn: "Podle tvých odpovědí",
    changeAnytime: "Tohle můžeš kdykoli změnit",
    goal: {
      lose: "Cíl: −{kg} · orientačně {month}",
      gain: "Cíl: +{kg} · orientačně {month}",
      maintain: "Cíl: držet se kolem {kg}",
      maintainRange: "Rozmezí: {range}",
    },
    info: {
      startWeight: "Počáteční váha", goalWeight: "Cílová váha", activity: "Aktivita",
      target: "Cíl", targetLose: "−{kg} · orientačně {month}", targetGain: "+{kg} · orientačně {month}",
    },
    satFat: { label: "nas. tuky", asked: "Nasycené tuky · na tvoje přání", perDay: "≤ {g} denně" },
    first: { title: "Tvůj první krok", step: "Vyfoť svoje příští jídlo. eait ho zkontroluje proti {kcal}kcal." },
    loader: { goal: "Tvůj cíl", lose: "−{kg} · orientačně {month}", gain: "+{kg} · orientačně {month}" },
    chart: { estimateAria: "Odhadovaná váha: teď {from}, odhad na {month}: {to}" },
  },
  signup: { heading: "Ulož si svůj plán", line: "Aby s tebou tvůj plán i předplatné přešly na nový telefon a tvá jídla zůstala uložená." },
  referral: {
    ask: "Poslal ti kamarád odkaz?",
    field: "Odkaz s pozvánkou od kamaráda",
    unknown: "Tento odkaz nikomu nepatří. Zkontroluj ho, nebo přeskoč.",
    own: "To je tvůj vlastní odkaz. Sem patří odkaz kamaráda.",
    already: "Tento účet se už připojil přes odkaz kamaráda.",
    paid: "Pozvánky jsou pro nové členy a tento účet už eait koupil.",
    tryAgain: "Zkusit znovu",
    skip: "Přeskočit",
  },
  health: { title: "Synchronizovat s aplikací Zdraví", body: "Váha a aktivita se načtou sem. Tvoje jídla jdou do aplikace Zdraví." },
  liveActivity: { titles: ["Otázky", "Tvůj plán", "Skoro hotovo"], go: "Pokračovat" },
  firstMeal: {
    ask: "Jedno jídlo na mě. Fotka, nebo mi to jen popíšeš?",
    react: "Žádný problém. Nejdřív mě vyzkoušej",
    photo: "Vyfotit",
    tell: "Řekni mi, co bylo k jídlu",
    keepGoing: "Jedeme dál",
    correct: "Opravit",
    afterAsk: "To bylo jedno. Chceš to tak u každého jídla?",
  },
  refusals: {
    invalid: {
      age: "To nevypadá jako věk — zkus něco jako 34.",
      height_cm: "V centimetrech — třeba 175.",
      weight_kg: "V kilogramech — stačí zhruba.",
      target_weight_kg: "Číslo v kg — třeba 70.",
    },
    ambiguousAge: {
      line: "Pro jistotu: pokud myslíš rok {year}, pošli všechny čtyři číslice.",
      confirm: "Je mi {age}",
    },
    direction: {
      gain: "Máš {weight} kg a chceš přibrat na {target} — to odsud není přírůstek. Pokud se cíl změnil, můžeme ho přepnout; jinak mi dej číslo nad {weight}.",
      lose: "Máš {weight} kg a chceš zhubnout na {target} — to odsud není úbytek. Pokud se cíl změnil, můžeme ho přepnout; jinak mi dej číslo pod {weight}.",
      switchToLose: "Přepnout na hubnutí",
      switchToGain: "Přepnout na přibírání",
      above: "Číslo nad {weight}…",
      below: "Číslo pod {weight}…",
    },
    switched: {
      gain: "Přepnuto — tak přibíráme. Kam se chceš dostat, v kg?",
    },
  },
};

const HI: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "शुरू करें",
    signin: "मेरा अकाउंट पहले से है",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["आप यहाँ किसलिए हैं?"] },
      },
      options: {
        lose: { label: "वज़न घटाएँ" },
        maintain: { label: "वज़न बनाए रखें" },
        gain: { label: "वज़न बढ़ाएँ" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["आपका लिंग क्या है?"] },
      },
      options: {
        male: { label: "पुरुष" },
        female: { label: "महिला" },
        other: { label: "अन्य" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["आपकी उम्र?"],
          placeholder: "आपकी उम्र",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["कद"],
          placeholder: "लंबाई cm में",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["आपका वज़न"],
          placeholder: "वज़न kg में",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["आपके दिन कितने सक्रिय रहते हैं?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "कोई वर्कआउट नहीं" },
        few: { label: "1–2", hint: "कभी-कभार वर्कआउट" },
        some: { label: "3–4", hint: "हफ़्ते में कुछ वर्कआउट" },
        many: { label: "5+", hint: "एथलीट जैसी दिनचर्या" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["आपका लक्ष्य वज़न क्या है?"],
          placeholder: "लक्ष्य वज़न kg में",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["कितनी तेज़ी से?"] },
      },
      options: {
        easy: { label: "हल्की" },
        steady: { label: "स्थिर" },
        push: { label: "तेज़" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["क्या पहले कभी कैलोरी गिनी हैं?"] } },
      options: {
        never: { label: "कभी नहीं" },
        stopped: { label: "कोशिश की, फिर छोड़ दिया" },
        onoff: { label: "कभी-कभी" },
        now: { label: "अभी गिनती चल रही है" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["किस चीज़ ने आपको रोका?", "जो भी लागू हो सब चुनें"],
          variants: {
            onoff: ["क्या रुकावट आई?", "जो भी लागू हो सब चुनें"],
            now: ["क्या और आसान होना चाहिए?", "जो भी लागू हो सब चुनें"],
          },
        },
      },
      options: {
        too_long: { label: "बहुत समय लगता था" },
        forgot: { label: "याद नहीं रहता था" },
        invisible: { label: "असर दिखता नहीं था" },
        no_idea: { label: "समझ नहीं आता था कि क्या खाएँ" },
        stressful: { label: "तनावपूर्ण लगता था" },
        nobody: { label: "पूछने के लिए कोई नहीं था" },
        creeping: { label: "मेरा वज़न फिर बढ़ने लगता था" },
        not_enough: { label: "ज़रूरत भर खाना मुश्किल था" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["दर्ज करना कब सबसे मुश्किल है?"],
          variants: { never: ["कब दर्ज करना सबसे मुश्किल लगेगा?"] },
        },
      },
      options: {
        workdays: { label: "व्यस्त काम के दिन" },
        eating_out: { label: "बाहर खाना" },
        cooking: { label: "दूसरों के लिए खाना बनाना" },
        snacks: { label: "नाश्ता और पेय" },
        evenings: { label: "शामें और वीकेंड" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["आपकी डाइट कैसी है?"] },
      },
      options: {
        balanced: { label: "संतुलित" },
        wholefood: { label: "साबुत आहार" },
        mediterranean: { label: "मेडिटेरेनियन" },
        flexitarian: { label: "फ़्लेक्सिटेरियन" },
        pescatarian: { label: "पेस्केटेरियन" },
        vegetarian: { label: "शाकाहारी" },
        vegan: { label: "वीगन" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["कोई मेडिकल पाबंदी?"] },
      },
      options: {
        kidneys: { label: "किडनी की बीमारी" },
        ldl: { label: "हाई कोलेस्ट्रॉल" },
        lowsugar: { label: "डायबिटीज़ का खतरा" },
        none: { label: "इनमें से कोई नहीं" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["आप कहाँ खाते हैं?"], placeholder: "खोजें" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "कहीं और" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["कितनी लंबी स्ट्रीक का लक्ष्य रखें?"] },
      },
      options: {
        "7": { label: "7 दिन" },
        "14": { label: "14 दिन" },
        "30": { label: "30 दिन" },
        "50": { label: "50 दिन" },
      },
    },
  ],
  building: {
    lines: ["आपका निजी प्लान बन रहा है"],
    title: "आपका रोज़ का प्लान",
    rows: { calories: "कैलोरी", protein: "प्रोटीन", carbs: "कार्ब्स", fat: "फ़ैट", diet: "डाइट" },
    limitCap: { ldl: "सैचुरेटेड फ़ैट ≤ {n} g", kidneys: "सोडियम ≤ {n} mg" },
    cta: "मुझे प्लान दिखाएँ",
    floorTitle: "{floor}kcal पर रोक दिया गया",
    floorBody: "हिसाब इससे नीचे जाना चाहता था। डॉक्टर की निगरानी के बिना हम इससे कम लक्ष्य नहीं रखते, इसलिए आपका लक्ष्य यहीं है। आपकी डायरी में भी यही लिखा होगा।",
  },
  summary: {
    lines: ["यह रहा आपका प्लान"],
    kcalLabel: "kcal प्रति दिन",
    floorMarker: "सुरक्षा के लिए सीमित · {floor} से कभी कम नहीं",
    macros: {
      protein: "प्रोटीन",
      carbs: "कार्ब्स",
      fat: "फ़ैट",
      satfat: "सैचुरेटेड फ़ैट · आपके कहने पर",
    },
    capNote: "उस रफ़्तार के लिए रोज़ इतना बड़ा बदलाव चाहिए जितना सुरक्षित रूप से लंबे समय तक नहीं चल सकता, इसलिए आपका प्लान सुरक्षित वाला है: आपका शरीर एक दिन में जितना खर्च करता है, उसका {share}%।",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "अपने पहले भोजन की फ़ोटो लें",
  },
  ui: {
    continueLabel: "जारी रखें",
    saveKept: "यह सेव नहीं हो सका। आपका जवाब अभी भी यहीं है। जारी रखें दबाने पर यह फिर से भेजा जाएगा।",
    idlePlaceholder: "Spud को मैसेज करें…",
    optionContinues: "चुनें और जारी रखें",
    stepper: { continue: "जारी रखें", less: "कम", more: "ज़्यादा" },
    units: { years: "साल", yearsCount: { one: "{n} साल", other: "{n} साल" } },
  },
  beats: {
    ageWhy: "उम्र के साथ आपका मेटाबॉलिज़्म बदलता है, इसलिए हम इसे ध्यान में रखते हैं",
    echo: { rest: "आराम की स्थिति में: {rest}kcal प्रति दिन", days: "आपके दिन {burn}kcal खर्च करते हैं" },
    baseline: { title: "यह रहा आपका शुरुआती आधार", bmi: "BMI", what: "बॉडी मास इंडेक्स" },
    prelim: { title: "आपकी योजना", burn: "आप खर्च करते हैं", gap: "{delta} आपकी रफ़्तार", eat: "आप खाते हैं", perDay: "kcal प्रति दिन", keepTitle: "आप लगभग {burn}kcal खर्च करते हैं" },
  },
  target: {
    markers: {
      lowest: "{weight} · हमारा न्यूनतम",
      now: "{weight} · अभी",
      nowLowest: "{weight} · अभी · हमारा न्यूनतम",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "मेरा सुझाव है {weight}, लगभग {pct}% कम, एक अच्छा पहला लक्ष्य", up: "मेरा सुझाव है {weight}, लगभग {pct}% ज़्यादा, एक अच्छा पहला लक्ष्य" },
  },
  pace: {
    rate: "{rate} प्रति हफ़्ता",
    rateSuffix: "प्रति हफ़्ता",
    result: "{month} के आसपास {target} · {kcal}kcal प्रति दिन",
    echo: "{from} से {to} तक।",
  },
  plan: {
    weightTitle: "आपका वज़न",
    everyDay: "हर दिन",
    infoTitle: "आपकी जानकारी",
    basedOn: "आपके जवाबों के आधार पर",
    changeAnytime: "इसे कभी भी बदला जा सकता है",
    goal: {
      lose: "लक्ष्य: −{kg} · {month} तक",
      gain: "लक्ष्य: +{kg} · {month} तक",
      maintain: "लक्ष्य: लगभग {kg} पर बने रहें",
      maintainRange: "दायरा: {range}",
    },
    info: {
      startWeight: "शुरुआती वज़न", goalWeight: "लक्ष्य वज़न", activity: "गतिविधि",
      target: "लक्ष्य", targetLose: "−{kg} · {month} तक", targetGain: "+{kg} · {month} तक",
    },
    satFat: { label: "सैच. फ़ैट", asked: "सैचुरेटेड फ़ैट · आपके कहने पर", perDay: "≤ {g} प्रति दिन" },
    first: { title: "आपका पहला क़दम", step: "अपने अगले भोजन की फ़ोटो लें। eait इसे {kcal}kcal से तुलना करेगा।" },
    loader: { goal: "आपका लक्ष्य", lose: "−{kg} · {month} तक", gain: "+{kg} · {month} तक" },
    chart: { estimateAria: "अनुमानित वज़न: अभी {from}, {month} के आसपास {to}" },
  },
  signup: { heading: "अपना प्लान सेव करें", line: "ताकि आपका प्लान और आपकी सदस्यता नए फ़ोन पर आपके साथ चले, और आपके भोजन सुरक्षित रहें।" },
  referral: {
    ask: "क्या किसी दोस्त ने आपको लिंक भेजा है?",
    field: "दोस्त का इनवाइट लिंक",
    unknown: "यह लिंक किसी से मेल नहीं खाता। इसे जाँचें, या स्किप करें।",
    own: "यह आपका अपना लिंक है। यहाँ किसी दोस्त का लिंक डालें।",
    already: "यह अकाउंट पहले ही किसी दोस्त के लिंक से जुड़ चुका है।",
    paid: "इनवाइट लिंक नए सदस्यों के लिए हैं, और इस अकाउंट से eait पहले ही ख़रीदा जा चुका है।",
    tryAgain: "फिर से कोशिश करें",
    skip: "स्किप करें",
  },
  health: { title: "स्वास्थ्य के साथ सिंक करें", body: "वज़न और गतिविधि यहाँ आते हैं। आपके भोजन स्वास्थ्य में जाते हैं।" },
  liveActivity: { titles: ["सवाल", "आपका प्लान", "लगभग हो गया"], go: "जारी रखें" },
  firstMeal: {
    ask: "एक भोजन मेरी तरफ़ से। फ़ोटो लें या बस मुझे बताएँ?",
    react: "कोई बात नहीं। पहले मुझे आज़माकर देखें",
    photo: "फ़ोटो लें",
    tell: "मुझे बताएँ कि आपने क्या खाया",
    keepGoing: "आगे बढ़ें",
    correct: "भोजन सुधारें",
    afterAsk: "यह एक हो गया। हर भोजन के लिए ऐसा ही चाहिए?",
  },
  refusals: {
    invalid: {
      age: "यह उम्र जैसा नहीं लग रहा — कुछ ऐसा लिखें, जैसे 34।",
      height_cm: "सेंटीमीटर में — जैसे 175।",
      weight_kg: "किलोग्राम में — अंदाज़े से भी चलेगा।",
      target_weight_kg: "kg में एक संख्या — जैसे 70।",
    },
    ambiguousAge: {
      line: "बस पक्का कर लें: अगर आपका मतलब साल {year} से था, तो चारों अंक भेजें।",
      confirm: "मेरी उम्र {age} है",
    },
    direction: {
      gain: "अभी आपका वज़न {weight} kg है और लक्ष्य {target} — यहाँ से यह बढ़त नहीं है। अगर लक्ष्य बदल गया है, तो हम उसे बदल सकते हैं; वरना {weight} से ज़्यादा कोई संख्या दें।",
      lose: "अभी आपका वज़न {weight} kg है और लक्ष्य {target} — यहाँ से यह कमी नहीं है। अगर लक्ष्य बदल गया है, तो हम उसे बदल सकते हैं; वरना {weight} से कम कोई संख्या दें।",
      switchToLose: "वज़न घटाने पर स्विच करें",
      switchToGain: "वज़न बढ़ाने पर स्विच करें",
      above: "{weight} से ज़्यादा कोई संख्या…",
      below: "{weight} से कम कोई संख्या…",
    },
    switched: {
      gain: "बदल दिया — तो वज़न बढ़ाना है। लक्ष्य कितना रखें, kg में?",
    },
  },
};

const TH: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "เริ่มเลย",
    signin: "ฉันมีบัญชีอยู่แล้ว",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["คุณอยากทำอะไร?"] },
      },
      options: {
        lose: { label: "ลดน้ำหนัก" },
        maintain: { label: "รักษาน้ำหนัก" },
        gain: { label: "เพิ่มน้ำหนัก" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["เพศของคุณคือ?"] },
      },
      options: {
        male: { label: "ชาย" },
        female: { label: "หญิง" },
        other: { label: "อื่นๆ" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["อายุของคุณ?"],
          placeholder: "อายุของคุณ",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["ส่วนสูง"],
          placeholder: "ส่วนสูงเป็น ซม.",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["น้ำหนักของคุณ"],
          placeholder: "น้ำหนักเป็น กก.",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["แต่ละวันคุณแอ็กทีฟแค่ไหน?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "ไม่ออกกำลังกาย" },
        few: { label: "1–2", hint: "ออกกำลังกายบ้างเป็นครั้งคราว" },
        some: { label: "3–4", hint: "ออกกำลังกายสองสามครั้งต่อสัปดาห์" },
        many: { label: "5+", hint: "ฝึกซ้อมจริงจัง" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["คุณตั้งเป้าน้ำหนักไว้เท่าไหร่?"],
          placeholder: "น้ำหนักเป้าหมายเป็น กก.",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["เร็วแค่ไหน?"] },
      },
      options: {
        easy: { label: "สบายๆ" },
        steady: { label: "สม่ำเสมอ" },
        push: { label: "เร็ว" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["เคยนับแคลอรี่ไหม?"] } },
      options: {
        never: { label: "ไม่เคย" },
        stopped: { label: "เคยลอง แล้วเลิก" },
        onoff: { label: "นับบ้างหยุดบ้าง" },
        now: { label: "ตอนนี้กำลังนับอยู่" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["อะไรทำให้คุณเลิก?", "เลือกทุกข้อที่ตรง"],
          variants: {
            onoff: ["อะไรเป็นอุปสรรค?", "เลือกทุกข้อที่ตรง"],
            now: ["อยากให้อะไรง่ายขึ้น?", "เลือกทุกข้อที่ตรง"],
          },
        },
      },
      options: {
        too_long: { label: "ใช้เวลานานเกินไป" },
        forgot: { label: "ชอบลืม" },
        invisible: { label: "ไม่เห็นผลลัพธ์" },
        no_idea: { label: "ไม่รู้จะกินอะไร" },
        stressful: { label: "รู้สึกเครียด" },
        nobody: { label: "ไม่มีใครให้ถาม" },
        creeping: { label: "น้ำหนักกลับมาขึ้นเรื่อยๆ" },
        not_enough: { label: "กินให้พอยาก" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["ช่วงไหนบันทึกยากสุด?"],
          variants: { never: ["คิดว่าช่วงไหนจะบันทึกยากสุด?"] },
        },
      },
      options: {
        workdays: { label: "วันทำงานที่ยุ่ง" },
        eating_out: { label: "กินข้าวนอกบ้าน" },
        cooking: { label: "ทำอาหารให้คนอื่น" },
        snacks: { label: "ของว่างและเครื่องดื่ม" },
        evenings: { label: "ตอนเย็นและวันหยุด" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["คุณกินตามแนวทางอาหารแบบไหนไหม?"] },
      },
      options: {
        balanced: { label: "สมดุล" },
        wholefood: { label: "อาหารไม่แปรรูป" },
        mediterranean: { label: "เมดิเตอร์เรเนียน" },
        flexitarian: { label: "เฟล็กซิทาเรียน" },
        pescatarian: { label: "เพสคาทาเรียน" },
        vegetarian: { label: "มังสวิรัติ" },
        vegan: { label: "วีแกน" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["มีข้อจำกัดทางการแพทย์ไหม?"] },
      },
      options: {
        kidneys: { label: "โรคไต" },
        ldl: { label: "คอเลสเตอรอลสูง" },
        lowsugar: { label: "เสี่ยงเบาหวาน" },
        none: { label: "ไม่มีเลย" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["คุณกินข้าวที่ไหน?"], placeholder: "ค้นหา" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "ที่อื่น" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["เลือกสตรีคที่อยากทำให้ถึง"] },
      },
      options: {
        "7": { label: "7 วัน" },
        "14": { label: "14 วัน" },
        "30": { label: "30 วัน" },
        "50": { label: "50 วัน" },
      },
    },
  ],
  building: {
    lines: ["กำลังสร้างแผนส่วนตัวของคุณ"],
    title: "แผนรายวันของคุณ",
    rows: { calories: "แคลอรี", protein: "โปรตีน", carbs: "คาร์บ", fat: "ไขมัน", diet: "แนวทางอาหาร" },
    limitCap: { ldl: "ไขมันอิ่มตัว ≤ {n} ก.", kidneys: "โซเดียม ≤ {n} มก." },
    cta: "ดูแผน",
    floorTitle: "เราหยุดไว้ที่ {floor}kcal",
    floorBody: "ตัวเลขคำนวณได้ต่ำกว่านี้ แต่เราไม่ตั้งเป้าต่ำกว่าระดับนี้หากไม่มีแพทย์ดูแล เป้าของคุณจึงอยู่ตรงนี้ ในไดอารี่ของคุณก็จะแสดงไว้ด้วย",
  },
  summary: {
    lines: ["นี่คือแผนของคุณ"],
    kcalLabel: "kcal ต่อวัน",
    floorMarker: "จำกัดไว้เพื่อความปลอดภัย · ไม่ต่ำกว่า {floor}",
    macros: {
      protein: "โปรตีน",
      carbs: "คาร์บ",
      fat: "ไขมัน",
      satfat: "ไขมันอิ่มตัว · ตามที่คุณขอ",
    },
    capNote: "ความเร็วนั้นต้องเปลี่ยนต่อวันมากเกินกว่าที่ทำต่อเนื่องได้อย่างปลอดภัย แผนของคุณจึงเป็นแบบปลอดภัย: {share}% ของพลังงานที่ร่างกายเผาผลาญต่อวัน",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "ถ่ายรูปมื้อแรกของคุณ",
  },
  ui: {
    continueLabel: "ต่อไป",
    saveKept: "บันทึกไม่สำเร็จ คำตอบของคุณยังอยู่ แตะ ต่อไป เพื่อส่งอีกครั้ง",
    idlePlaceholder: "ส่งข้อความถึง Spud…",
    optionContinues: "เลือกและดำเนินการต่อ",
    stepper: { continue: "ต่อไป", less: "น้อยลง", more: "มากขึ้น" },
    units: { years: "ปี", yearsCount: { one: "{n} ปี", other: "{n} ปี" } },
  },
  beats: {
    ageWhy: "การเผาผลาญเปลี่ยนไปตามอายุ เราจึงนำมาคำนวณด้วย",
    echo: { rest: "ขณะพัก: {rest}kcal ต่อวัน", days: "วันของคุณเผาผลาญ {burn}kcal" },
    baseline: { title: "นี่คือจุดเริ่มต้นของคุณ", bmi: "BMI", what: "ดัชนีมวลกาย" },
    prelim: { title: "แผนของคุณ", burn: "คุณเผาผลาญ", gap: "{delta} ความเร็วของคุณ", eat: "คุณกิน", perDay: "kcal ต่อวัน", keepTitle: "คุณเผาผลาญประมาณ {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · ต่ำสุดที่เราตั้งให้",
      now: "{weight} · ตอนนี้",
      nowLowest: "{weight} · ตอนนี้ · ต่ำสุดที่เราตั้งให้",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "เราแนะนำ {weight} น้อยลงประมาณ {pct}% เป็นเป้าหมายแรกที่ดี", up: "เราแนะนำ {weight} มากขึ้นประมาณ {pct}% เป็นเป้าหมายแรกที่ดี" },
  },
  pace: {
    rate: "{rate} ต่อสัปดาห์",
    rateSuffix: "ต่อสัปดาห์",
    result: "{target} ราว{month} · {kcal}kcal ต่อวัน",
    echo: "จาก {from} เป็น {to}",
  },
  plan: {
    weightTitle: "น้ำหนักของคุณ",
    everyDay: "ทุกวัน",
    infoTitle: "ข้อมูลของคุณ",
    basedOn: "จากคำตอบของคุณ",
    changeAnytime: "เปลี่ยนได้ทุกเมื่อ",
    goal: {
      lose: "เป้าหมาย: −{kg} ภายใน {month}",
      gain: "เป้าหมาย: +{kg} ภายใน {month}",
      maintain: "เป้าหมาย: คงไว้ราว {kg}",
      maintainRange: "ช่วง: {range}",
    },
    info: {
      startWeight: "น้ำหนักเริ่มต้น", goalWeight: "น้ำหนักเป้าหมาย", activity: "กิจกรรม",
      target: "เป้า", targetLose: "−{kg} ภายใน {month}", targetGain: "+{kg} ภายใน {month}",
    },
    satFat: { label: "ไขมันอิ่มตัว", asked: "ไขมันอิ่มตัว · ตามที่คุณขอ", perDay: "≤ {g} ต่อวัน" },
    first: { title: "ก้าวแรกของคุณ", step: "ถ่ายรูปมื้อถัดไปของคุณ eait จะเช็กเทียบกับ {kcal}kcal" },
    loader: { goal: "เป้าหมายของคุณ", lose: "−{kg} ภายใน {month}", gain: "+{kg} ภายใน {month}" },
    chart: { estimateAria: "น้ำหนักโดยประมาณ: ตอนนี้ {from} ราว{month} {to}" },
  },
  signup: { heading: "บันทึกแพลนของคุณ", line: "เพื่อให้แพลนและการสมัครสมาชิกของคุณติดตามคุณไปยังโทรศัพท์เครื่องใหม่ และมื้ออาหารของคุณจะถูกเก็บไว้" },
  referral: {
    ask: "มีเพื่อนส่งลิงก์มาให้ไหม?",
    field: "ลิงก์คำเชิญจากเพื่อน",
    unknown: "ลิงก์นี้ไม่ตรงกับใครเลย ตรวจสอบอีกครั้ง หรือข้ามไป",
    own: "นี่คือลิงก์ของคุณเอง ใส่ลิงก์ของเพื่อนที่นี่",
    already: "บัญชีนี้เข้าร่วมด้วยลิงก์ของเพื่อนไปแล้ว",
    paid: "ลิงก์คำเชิญมีไว้สำหรับสมาชิกใหม่ และบัญชีนี้ซื้อ eait ไปแล้ว",
    tryAgain: "ลองอีกครั้ง",
    skip: "ข้าม",
  },
  health: { title: "ซิงค์กับแอปสุขภาพ", body: "น้ำหนักและกิจกรรมเข้ามา มื้ออาหารของคุณส่งไปที่แอปสุขภาพ" },
  liveActivity: { titles: ["คำถาม", "แผนของคุณ", "ใกล้เสร็จแล้ว"], go: "ต่อไป" },
  firstMeal: {
    ask: "มื้อแรกเราเลี้ยงเอง ถ่ายรูป หรือเล่าให้ฟังก็ได้?",
    react: "ไม่เป็นไร ลองใช้เราก่อน",
    photo: "ถ่ายรูป",
    tell: "เล่าว่ากินอะไรไป",
    keepGoing: "ไปต่อ",
    correct: "แก้มื้อให้ถูก",
    afterAsk: "นั่นคือหนึ่งมื้อ อยากได้แบบนี้ทุกมื้อไหม?",
  },
  refusals: {
    invalid: {
      age: "ดูไม่เหมือนอายุนะ — ลองแบบ 34",
      height_cm: "เป็นเซนติเมตร — ประมาณ 175",
      weight_kg: "เป็นกิโลกรัม — ประมาณๆ ก็ได้",
      target_weight_kg: "ตัวเลขเป็น กก. — เช่น 70",
    },
    ambiguousAge: {
      line: "ขอเช็กว่าเราอ่านถูก — ถ้าหมายถึงปี {year} ส่งมาให้ครบสี่หลัก",
      confirm: "อายุ {age}",
    },
    direction: {
      gain: "ตอนนี้คุณหนัก {weight} กก. และขอเพิ่มเป็น {target} — จากตรงนี้นั่นไม่ใช่การเพิ่ม ถ้าเป้าหมายเปลี่ยนแล้ว เราสลับให้ได้ ไม่งั้นบอกตัวเลขที่มากกว่า {weight}",
      lose: "ตอนนี้คุณหนัก {weight} กก. และขอลดเป็น {target} — จากตรงนี้นั่นไม่ใช่การลด ถ้าเป้าหมายเปลี่ยนแล้ว เราสลับให้ได้ ไม่งั้นบอกตัวเลขที่น้อยกว่า {weight}",
      switchToLose: "สลับเป็นลดน้ำหนัก",
      switchToGain: "สลับเป็นเพิ่มน้ำหนัก",
      above: "ตัวเลขที่มากกว่า {weight}…",
      below: "ตัวเลขที่น้อยกว่า {weight}…",
    },
    switched: {
      gain: "สลับแล้ว — เพิ่มน้ำหนักนะ อยากไปถึงกี่ กก.?",
    },
  },
};

const SV: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Kom igång",
    signin: "Jag har redan ett konto",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Vad vill du uppnå?"] },
      },
      options: {
        lose: { label: "Gå ner i vikt" },
        maintain: { label: "Hålla min vikt" },
        gain: { label: "Gå upp i vikt" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Vilket är ditt kön?"] },
      },
      options: {
        male: { label: "Man" },
        female: { label: "Kvinna" },
        other: { label: "Annat" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Din ålder?"],
          placeholder: "Din ålder",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Längd"],
          placeholder: "Längd i cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Din vikt"],
          placeholder: "Vikt i kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Hur aktiva är dina dagar?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Ingen träning" },
        few: { label: "1–2", hint: "Träning då och då" },
        some: { label: "3–4", hint: "Några träningspass i veckan" },
        many: { label: "5+", hint: "Hängiven idrottare" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Vilken vikt siktar du på?"],
          placeholder: "Målvikt i kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Hur snabbt?"] },
      },
      options: {
        easy: { label: "Lugnt" },
        steady: { label: "Jämnt" },
        push: { label: "Raskt" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Räknat kalorier förut?"] } },
      options: {
        never: { label: "Aldrig" },
        stopped: { label: "Försökte, slutade" },
        onoff: { label: "Då och då" },
        now: { label: "Jag räknar nu" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Vad fick dig att sluta?", "Välj allt som stämmer"],
          variants: {
            onoff: ["Vad kom i vägen?", "Välj allt som stämmer"],
            now: ["Vad vill du ska vara enklare?", "Välj allt som stämmer"],
          },
        },
      },
      options: {
        too_long: { label: "Det tog för lång tid" },
        forgot: { label: "Jag glömde" },
        invisible: { label: "Jag såg inte att det funkade" },
        no_idea: { label: "Jag visste inte vad jag skulle äta" },
        stressful: { label: "Det kändes stressigt" },
        nobody: { label: "Ingen att fråga" },
        creeping: { label: "Vikten smög tillbaka" },
        not_enough: { label: "Svårt att äta tillräckligt" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["När är det svårast att logga?"],
          variants: { never: ["När tror du att det blir svårast att logga?"] },
        },
      },
      options: {
        workdays: { label: "Stressiga arbetsdagar" },
        eating_out: { label: "Äta ute" },
        cooking: { label: "Laga mat åt andra" },
        snacks: { label: "Snacks och drycker" },
        evenings: { label: "Kvällar och helger" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Följer du någon kost?"] },
      },
      options: {
        balanced: { label: "Balanserad" },
        wholefood: { label: "Oprocessad" },
        mediterranean: { label: "Medelhavsinspirerad" },
        flexitarian: { label: "Flexitarisk" },
        pescatarian: { label: "Pescetarisk" },
        vegetarian: { label: "Vegetarisk" },
        vegan: { label: "Vegansk" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Några medicinska begränsningar?"] },
      },
      options: {
        kidneys: { label: "Njursjukdom" },
        ldl: { label: "Högt kolesterol" },
        lowsugar: { label: "Risk för diabetes" },
        none: { label: "Inget av detta" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Var äter du?"], placeholder: "Sök" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Någon annanstans" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Välj en svit att sikta på"] },
      },
      options: {
        "7": { label: "7 dagar" },
        "14": { label: "14 dagar" },
        "30": { label: "30 dagar" },
        "50": { label: "50 dagar" },
      },
    },
  ],
  building: {
    lines: ["Skapar din personliga plan"],
    title: "Din dagliga plan",
    rows: { calories: "Kalorier", protein: "Protein", carbs: "Kolhydrater", fat: "Fett", diet: "Kost" },
    limitCap: { ldl: "mättat fett ≤ {n} g", kidneys: "natrium ≤ {n} mg" },
    cta: "Visa mig planen",
    floorTitle: "Vi stannade vid {floor}kcal",
    floorBody: "Räknestycket ville gå lägre. Vi sätter inga mål under det här utan medicinsk uppföljning, så här hamnar ditt. Det står även i din dagbok.",
  },
  summary: {
    lines: ["Här är din plan"],
    kcalLabel: "kcal per dag",
    floorMarker: "begränsat för säkerhets skull · aldrig under {floor}",
    macros: {
      protein: "Protein",
      carbs: "Kolhydrater",
      fat: "Fett",
      satfat: "Mättat fett · du bad om det",
    },
    capNote: "Det tempot kräver en större daglig förändring än vad som är säkert att hålla, så du får den säkra versionen: {share} % av det din kropp förbränner på en dag.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fota din första måltid",
  },
  ui: {
    continueLabel: "Fortsätt",
    saveKept: "Kunde inte spara det. Ditt svar finns kvar. Fortsätt skickar det igen.",
    idlePlaceholder: "Skriv till Spud…",
    optionContinues: "Väljer och fortsätter",
    stepper: { continue: "Fortsätt", less: "Mindre", more: "Mer" },
    units: { years: "år", yearsCount: { one: "{n} år", other: "{n} år" } },
  },
  beats: {
    ageWhy: "Ämnesomsättningen förändras med åldern, så vi räknar med det",
    echo: { rest: "I vila: {rest}kcal per dag", days: "Dina dagar förbränner {burn}kcal" },
    baseline: { title: "Här är din utgångspunkt", bmi: "BMI", what: "Kroppsmasseindex" },
    prelim: { title: "Din plan", burn: "Du förbränner", gap: "{delta} ditt tempo", eat: "Du äter", perDay: "kcal per dag", keepTitle: "Du förbränner cirka {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · lägsta vi sätter",
      now: "{weight} · nu",
      nowLowest: "{weight} · nu · lägsta vi sätter",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Jag föreslår {weight}, cirka {pct} % ner, ett bra första mål", up: "Jag föreslår {weight}, cirka {pct} % upp, ett bra första mål" },
  },
  pace: {
    rate: "{rate} i veckan",
    rateSuffix: "i veckan",
    result: "{target} runt {month} · {kcal}kcal per dag",
    echo: "Från {from} till {to}.",
  },
  plan: {
    weightTitle: "Din vikt",
    everyDay: "Varje dag",
    infoTitle: "Dina uppgifter",
    basedOn: "Utifrån dina svar",
    changeAnytime: "Du kan ändra det när du vill",
    goal: {
      lose: "Mål: −{kg} till {month}",
      gain: "Mål: +{kg} till {month}",
      maintain: "Mål: ligga kvar runt {kg}",
      maintainRange: "Intervall: {range}",
    },
    info: {
      startWeight: "Startvikt", goalWeight: "Målvikt", activity: "Aktivitet",
      target: "Mål", targetLose: "−{kg} till {month}", targetGain: "+{kg} till {month}",
    },
    satFat: { label: "mättat fett", asked: "Mättat fett · du bad om det", perDay: "≤ {g} per dag" },
    first: { title: "Ditt första steg", step: "Fotografera din nästa måltid. eait kollar den mot {kcal}kcal." },
    loader: { goal: "Ditt mål", lose: "−{kg} till {month}", gain: "+{kg} till {month}" },
    chart: { estimateAria: "Uppskattad vikt: {from} nu, {to} runt {month}" },
  },
  signup: { heading: "Spara din plan", line: "Så följer din plan och din prenumeration med till en ny telefon, och dina måltider sparas." },
  referral: {
    ask: "Har en vän skickat en länk till dig?",
    field: "Vännens inbjudningslänk",
    unknown: "Länken matchar ingen. Kolla den eller hoppa över.",
    own: "Det är din egen länk. En väns länk ska stå här.",
    already: "Det här kontot har redan gått med via en väns länk.",
    paid: "Inbjudningslänkar är för nya medlemmar, och det här kontot har redan köpt eait.",
    tryAgain: "Försök igen",
    skip: "Hoppa över",
  },
  health: { title: "Synka med Hälsa", body: "Vikt och aktivitet kommer in. Dina måltider går till Hälsa." },
  liveActivity: { titles: ["Frågor", "Din plan", "Nästan klart"], go: "Fortsätt" },
  firstMeal: {
    ask: "En måltid bjuder jag på. Foto, eller berättar du bara?",
    react: "Inga problem. Testa mig först",
    photo: "Ta ett foto",
    tell: "Berätta vad du åt",
    keepGoing: "Fortsätt",
    correct: "Korrigera måltiden",
    afterAsk: "Det var en. Vill du ha det här för varje måltid?",
  },
  refusals: {
    invalid: {
      age: "Det ser inte ut som en ålder — testa något i stil med 34.",
      height_cm: "I centimeter — något i stil med 175.",
      weight_kg: "I kilo — ungefär räcker.",
      target_weight_kg: "Ett tal i kg — till exempel 70.",
    },
    ambiguousAge: {
      line: "Vill vara säker på att jag läste rätt — om du menade året {year}, skicka alla fyra siffrorna.",
      confirm: "Jag är {age}",
    },
    direction: {
      gain: "Du väger {weight} kg och vill gå upp till {target} — det är ingen uppgång härifrån. Om målet har ändrats kan vi byta; annars ge mig ett tal över {weight}.",
      lose: "Du väger {weight} kg och vill gå ner till {target} — det är ingen nedgång härifrån. Om målet har ändrats kan vi byta; annars ge mig ett tal under {weight}.",
      switchToLose: "Byt till att gå ner",
      switchToGain: "Byt till att gå upp",
      above: "Ett tal över {weight}…",
      below: "Ett tal under {weight}…",
    },
    switched: {
      gain: "Bytt — då går vi upp. Var vill du landa, i kg?",
    },
  },
};

const UK: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Почати",
    signin: "У мене вже є акаунт",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Яка в тебе мета?"] },
      },
      options: {
        lose: { label: "Схуднути" },
        maintain: { label: "Зберегти вагу" },
        gain: { label: "Набрати вагу" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Твоя стать?"] },
      },
      options: {
        male: { label: "Чоловіча" },
        female: { label: "Жіноча" },
        other: { label: "Інша" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Твій вік?"],
          placeholder: "Твій вік",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Зріст"],
          placeholder: "Зріст у см",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Твоя вага"],
          placeholder: "Вага в кг",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Наскільки активні твої дні?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Без тренувань" },
        few: { label: "1–2", hint: "Тренування час від часу" },
        some: { label: "3–4", hint: "Кілька тренувань на тиждень" },
        many: { label: "5+", hint: "Майже щодня" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["До якої ваги прагнеш?"],
          placeholder: "Бажана вага в кг",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Як швидко?"] },
      },
      options: {
        easy: { label: "М'який" },
        steady: { label: "Рівний" },
        push: { label: "Швидкий" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Доводилося рахувати калорії?"] } },
      options: {
        never: { label: "Ні разу" },
        stopped: { label: "Раніше так, тепер ні" },
        onoff: { label: "З перервами" },
        now: { label: "Рахую зараз" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Що тебе зупинило?", "Вибери все, що підходить"],
          variants: {
            onoff: ["Що тобі заважало?", "Вибери все, що підходить"],
            now: ["Що було б легше?", "Вибери все, що підходить"],
          },
        },
      },
      options: {
        too_long: { label: "Це займало забагато часу" },
        forgot: { label: "Вилітало з голови" },
        invisible: { label: "Не було видно результату" },
        no_idea: { label: "Було незрозуміло, що їсти" },
        stressful: { label: "Це напружувало" },
        nobody: { label: "Нікого було запитати" },
        creeping: { label: "Вага весь час поверталася" },
        not_enough: { label: "Важко було з'їдати достатньо" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Коли записувати найважче?"],
          variants: { never: ["Як гадаєш, коли записувати буде найважче?"] },
        },
      },
      options: {
        workdays: { label: "Завантажені будні" },
        eating_out: { label: "Їжа поза домом" },
        cooking: { label: "Готування для інших" },
        snacks: { label: "Перекуси й напої" },
        evenings: { label: "Вечори й вихідні" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Ти дотримуєшся якоїсь дієти?"] },
      },
      options: {
        balanced: { label: "Збалансована" },
        wholefood: { label: "Цільні продукти" },
        mediterranean: { label: "Середземноморська" },
        flexitarian: { label: "Флекситаріанська" },
        pescatarian: { label: "Пескетаріанська" },
        vegetarian: { label: "Вегетаріанська" },
        vegan: { label: "Веганська" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Є медичні обмеження?"] },
      },
      options: {
        kidneys: { label: "Захворювання нирок" },
        ldl: { label: "Високий холестерин" },
        lowsugar: { label: "Ризик діабету" },
        none: { label: "Нічого з цього" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Де ти їси?"], placeholder: "Пошук" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Деінде" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Обери серію, на яку націлитися"] },
      },
      options: {
        "7": { label: "7 днів" },
        "14": { label: "14 днів" },
        "30": { label: "30 днів" },
        "50": { label: "50 днів" },
      },
    },
  ],
  building: {
    lines: ["Складаю твій особистий план"],
    title: "Твій план на день",
    rows: { calories: "Калорії", protein: "Білок", carbs: "Вуглеводи", fat: "Жири", diet: "Дієта" },
    limitCap: { ldl: "насичені жири ≤ {n} г", kidneys: "натрій ≤ {n} мг" },
    cta: "Показати план",
    floorTitle: "Ми зупинилися на {floor}ккал",
    floorBody: "Розрахунок хотів піти нижче. Без нагляду лікаря ми не ставимо цілей нижче цієї позначки, тож твоя — тут. У щоденнику це теж буде вказано.",
  },
  summary: {
    lines: ["Ось твій план"],
    kcalLabel: "ккал на день",
    floorMarker: "обмежено заради безпеки · ніколи не нижче {floor}",
    macros: {
      protein: "Білок",
      carbs: "Вуглеводи",
      fat: "Жири",
      satfat: "Насичені жири · на твоє прохання",
    },
    capNote: "Такий темп потребував би більшої щоденної різниці, ніж безпечно витримувати, тож у тебе безпечний варіант: {share}% від того, що тіло спалює за день.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Сфотографуй перший прийом їжі",
  },
  ui: {
    continueLabel: "Продовжити",
    saveKept: "Не вдалося зберегти. Твоя відповідь усе ще тут. «Продовжити» надішле її знову.",
    idlePlaceholder: "Написати Spud…",
    optionContinues: "Вибирає й продовжує",
    stepper: { continue: "Продовжити", less: "Менше", more: "Більше" },
    units: { years: "років", yearsCount: { one: "{n} рік", other: "{n} р." } },
  },
  beats: {
    ageWhy: "З віком обмін речовин змінюється, тож ми це враховуємо",
    echo: { rest: "У спокої: {rest}ккал на день", days: "Твої дні спалюють {burn}ккал" },
    baseline: { title: "Ось твоя точка відліку", bmi: "ІМТ", what: "Індекс маси тіла" },
    prelim: { title: "Твій план", burn: "Ти спалюєш", gap: "{delta} твій темп", eat: "Ти їси", perDay: "ккал на день", keepTitle: "Ти спалюєш близько {burn}ккал" },
  },
  target: {
    markers: {
      lowest: "{weight} · мінімум, який ми ставимо",
      now: "{weight} · зараз",
      nowLowest: "{weight} · зараз · мінімум, який ми ставимо",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Пропоную {weight} — приблизно на {pct}% менше, гарна перша мета", up: "Пропоную {weight} — приблизно на {pct}% більше, гарна перша мета" },
  },
  pace: {
    rate: "{rate} на тиждень",
    rateSuffix: "на тиждень",
    result: "{target} · орієнтир — {month} · {kcal}ккал на день",
    echo: "З {from} до {to}.",
  },
  plan: {
    weightTitle: "Твоя вага",
    everyDay: "Щодня",
    infoTitle: "Твої дані",
    basedOn: "За твоїми відповідями",
    changeAnytime: "Це можна змінити будь-коли",
    goal: {
      lose: "Мета: −{kg} · орієнтир — {month}",
      gain: "Мета: +{kg} · орієнтир — {month}",
      maintain: "Мета: триматися близько {kg}",
      maintainRange: "Діапазон: {range}",
    },
    info: {
      startWeight: "Початкова вага", goalWeight: "Бажана вага", activity: "Активність",
      target: "Ціль", targetLose: "−{kg} · орієнтир — {month}", targetGain: "+{kg} · орієнтир — {month}",
    },
    satFat: { label: "нас. жири", asked: "Насичені жири · твій запит", perDay: "≤ {g} на день" },
    first: { title: "Твій перший крок", step: "Сфотографуй свій наступний прийом їжі. eait звірить його з {kcal}ккал." },
    loader: { goal: "Твоя мета", lose: "−{kg} · орієнтир — {month}", gain: "+{kg} · орієнтир — {month}" },
    chart: { estimateAria: "Оцінка ваги: {from} зараз, {to} — орієнтовно {month}" },
  },
  signup: { heading: "Збережи свій план", line: "Так твій план і підписка перейдуть з тобою на новий телефон, а прийоми їжі збережуться." },
  referral: {
    ask: "Друг надіслав тобі посилання?",
    field: "Посилання-запрошення від друга",
    unknown: "Це посилання нікому не належить. Перевір його або пропусти.",
    own: "Це твоє власне посилання. Сюди — посилання друга.",
    already: "Цей акаунт уже приєднався за посиланням друга.",
    paid: "Посилання-запрошення — для нових учасників, а на цьому акаунті вже є покупка eait.",
    tryAgain: "Спробувати ще раз",
    skip: "Пропустити",
  },
  health: { title: "Синхронізація з Apple Health", body: "Вага й активність — зі «Здоров'я», прийоми їжі — у «Здоров'я»." },
  liveActivity: { titles: ["Запитання", "Твій план", "Майже готово"], go: "Продовжити" },
  firstMeal: {
    ask: "Один прийом їжі — за мій рахунок. Фото чи просто розкажеш?",
    react: "Без проблем. Спершу випробуй мене",
    photo: "Зробити фото",
    tell: "Розповісти, що було на тарілці",
    keepGoing: "Далі",
    correct: "Виправити",
    afterAsk: "Це був перший. Хочеш так із кожним прийомом їжі?",
  },
  refusals: {
    invalid: {
      age: "Не схоже на вік — спробуй щось на кшталт 34.",
      height_cm: "У сантиметрах — щось на кшталт 175.",
      weight_kg: "У кілограмах — можна приблизно.",
      target_weight_kg: "Число в кг — наприклад, 70.",
    },
    ambiguousAge: {
      line: "Хочу переконатися, що все правильно: якщо йдеться про {year} рік, надішли всі чотири цифри.",
      confirm: "Мені {age}",
    },
    direction: {
      gain: "Зараз у тебе {weight} кг, а мета — {target}: це не набір ваги. Якщо мета змінилася, можемо перемкнути; інакше дай число більше за {weight}.",
      lose: "Зараз у тебе {weight} кг, а мета — {target}: це не зниження ваги. Якщо мета змінилася, можемо перемкнути; інакше дай число менше за {weight}.",
      switchToLose: "Перемкнути на схуднення",
      switchToGain: "Перемкнути на набір",
      above: "Число більше за {weight}…",
      below: "Число менше за {weight}…",
    },
    switched: {
      gain: "Перемкнуто — отже, набираємо. До якої ваги хочеш прийти, у кг?",
    },
  },
};

const NL: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Aan de slag",
    signin: "Ik heb al een account",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Wat wil je bereiken?"] },
      },
      options: {
        lose: { label: "Afvallen" },
        maintain: { label: "Mijn gewicht houden" },
        gain: { label: "Aankomen" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Wat is je geslacht?"] },
      },
      options: {
        male: { label: "Man" },
        female: { label: "Vrouw" },
        other: { label: "Anders" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Je leeftijd?"],
          placeholder: "Je leeftijd",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Lengte"],
          placeholder: "Lengte in cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Je gewicht"],
          placeholder: "Gewicht in kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Hoe actief zijn je dagen?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Geen trainingen" },
        few: { label: "1–2", hint: "Af en toe een training" },
        some: { label: "3–4", hint: "Een paar trainingen per week" },
        many: { label: "5+", hint: "Fanatieke sporter" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Naar welk gewicht wil je toe?"],
          placeholder: "Streefgewicht in kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Hoe snel?"] },
      },
      options: {
        easy: { label: "Rustig" },
        steady: { label: "Gestaag" },
        push: { label: "Stevig" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Al eens calorieën geteld?"] } },
      options: {
        never: { label: "Nooit" },
        stopped: { label: "Geprobeerd, gestopt" },
        onoff: { label: "Af en toe" },
        now: { label: "Ik tel nu" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Wat hield je tegen?", "Kies alles wat past"],
          variants: {
            onoff: ["Wat kwam ertussen?", "Kies alles wat past"],
            now: ["Wat zou je makkelijker willen?", "Kies alles wat past"],
          },
        },
      },
      options: {
        too_long: { label: "Het duurde te lang" },
        forgot: { label: "Ik vergat het" },
        invisible: { label: "Ik zag niet dat het werkte" },
        no_idea: { label: "Ik wist niet wat te eten" },
        stressful: { label: "Het voelde stressvol" },
        nobody: { label: "Niemand om te vragen" },
        creeping: { label: "Mijn gewicht kroop terug" },
        not_enough: { label: "Moeilijk genoeg eten" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Wanneer is bijhouden het lastigst?"],
          variants: { never: ["Wanneer denk je dat bijhouden het lastigst wordt?"] },
        },
      },
      options: {
        workdays: { label: "Drukke werkdagen" },
        eating_out: { label: "Uit eten" },
        cooking: { label: "Koken voor anderen" },
        snacks: { label: "Snacks en drankjes" },
        evenings: { label: "Avonden en weekenden" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Volg je een dieet?"] },
      },
      options: {
        balanced: { label: "Gebalanceerd" },
        wholefood: { label: "Onbewerkt" },
        mediterranean: { label: "Mediterraan" },
        flexitarian: { label: "Flexitarisch" },
        pescatarian: { label: "Pescotarisch" },
        vegetarian: { label: "Vegetarisch" },
        vegan: { label: "Veganistisch" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Medische beperkingen?"] },
      },
      options: {
        kidneys: { label: "Nieraandoening" },
        ldl: { label: "Hoog cholesterol" },
        lowsugar: { label: "Risico op diabetes" },
        none: { label: "Geen van deze" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Waar eet je?"], placeholder: "Zoek" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Ergens anders" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Kies een reeks als doel"] },
      },
      options: {
        "7": { label: "7 dagen" },
        "14": { label: "14 dagen" },
        "30": { label: "30 dagen" },
        "50": { label: "50 dagen" },
      },
    },
  ],
  building: {
    lines: ["Je persoonlijke plan wordt gemaakt"],
    title: "Je dagplan",
    rows: { calories: "Calorieën", protein: "Eiwit", carbs: "Koolhydraten", fat: "Vet", diet: "Dieet" },
    limitCap: { ldl: "verzadigd vet ≤ {n} g", kidneys: "natrium ≤ {n} mg" },
    cta: "Laat het plan zien",
    floorTitle: "We zijn gestopt bij {floor}kcal",
    floorBody: "De berekening wilde lager uitkomen. Zonder medische begeleiding stellen we geen doel onder deze grens in, dus hier ligt het jouwe. Dat staat ook in je dagboek.",
  },
  summary: {
    lines: ["Hier is je plan"],
    kcalLabel: "kcal per dag",
    floorMarker: "veiligheidshalve begrensd · nooit onder {floor}",
    macros: {
      protein: "Eiwit",
      carbs: "Koolhydraten",
      fat: "Vet",
      satfat: "Verzadigd vet · op jouw verzoek",
    },
    capNote: "Dat tempo vraagt om een groter dagelijks verschil dan veilig vol te houden is, dus je krijgt de veilige versie: {share}% van wat je lichaam per dag verbrandt.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografeer je eerste maaltijd",
  },
  ui: {
    continueLabel: "Verder",
    saveKept: "Dat kon niet worden opgeslagen. Je antwoord staat er nog. Met Verder stuur je het opnieuw.",
    idlePlaceholder: "Bericht aan Spud…",
    optionContinues: "Selecteert en gaat verder",
    stepper: { continue: "Verder", less: "Minder", more: "Meer" },
    units: { years: "jaar", yearsCount: { one: "{n} jaar", other: "{n} jaar" } },
  },
  beats: {
    ageWhy: "Je stofwisseling verandert met de leeftijd, dus daar rekenen we mee",
    echo: { rest: "In rust: {rest}kcal per dag", days: "Je dagen verbranden {burn}kcal" },
    baseline: { title: "Dit is je uitgangspunt", bmi: "BMI", what: "Body mass index" },
    prelim: { title: "Je plan", burn: "Je verbrandt", gap: "{delta} je tempo", eat: "Je eet", perDay: "kcal per dag", keepTitle: "Je verbrandt ongeveer {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · ons minimum",
      now: "{weight} · nu",
      nowLowest: "{weight} · nu · ons minimum",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Ik stel {weight} voor, zo'n {pct}% eraf, een goed eerste doel", up: "Ik stel {weight} voor, zo'n {pct}% erbij, een goed eerste doel" },
  },
  pace: {
    rate: "{rate} per week",
    rateSuffix: "per week",
    result: "{target} rond {month} · {kcal}kcal per dag",
    echo: "Van {from} naar {to}.",
  },
  plan: {
    weightTitle: "Je gewicht",
    everyDay: "Elke dag",
    infoTitle: "Je gegevens",
    basedOn: "Op basis van je antwoorden",
    changeAnytime: "Je kunt dit altijd aanpassen",
    goal: {
      lose: "Doel: {kg} afvallen vóór {month}",
      gain: "Doel: {kg} aankomen vóór {month}",
      maintain: "Doel: rond {kg} blijven",
      maintainRange: "Bereik: {range}",
    },
    info: {
      startWeight: "Startgewicht", goalWeight: "Streefgewicht", activity: "Activiteit",
      target: "Doel", targetLose: "{kg} afvallen vóór {month}", targetGain: "{kg} aankomen vóór {month}",
    },
    satFat: { label: "verz. vet", asked: "Verzadigd vet · op jouw verzoek", perDay: "≤ {g} per dag" },
    first: { title: "Je eerste stap", step: "Maak een foto van je volgende maaltijd. eait checkt hem tegen {kcal}kcal." },
    loader: { goal: "Je doel", lose: "−{kg} vóór {month}", gain: "+{kg} vóór {month}" },
    chart: { estimateAria: "Geschat gewicht: nu {from}, rond {month} {to}" },
  },
  signup: { heading: "Bewaar je plan", line: "Zo gaan je plan en je abonnement mee naar een nieuwe telefoon en blijven je maaltijden bewaard." },
  referral: {
    ask: "Heeft een vriend je een link gestuurd?",
    field: "Uitnodigingslink van een vriend",
    unknown: "Die link hoort bij niemand. Check hem, of sla over.",
    own: "Dat is je eigen link. Hier hoort de link van een vriend.",
    already: "Dit account is al aangemeld met de link van een vriend.",
    paid: "Uitnodigingslinks zijn voor nieuwe leden, en dit account heeft eait al gekocht.",
    tryAgain: "Probeer opnieuw",
    skip: "Overslaan",
  },
  health: { title: "Synchroniseren met Gezondheid", body: "Gewicht en activiteit komen binnen. Je maaltijden gaan naar Gezondheid." },
  liveActivity: { titles: ["Vragen", "Je plan", "Bijna klaar"], go: "Verder" },
  firstMeal: {
    ask: "Eén maaltijd van mij. Foto, of vertel je het me gewoon?",
    react: "Geen probleem. Probeer me eerst uit",
    photo: "Maak een foto",
    tell: "Vertel me wat je hebt gegeten",
    keepGoing: "Ga door",
    correct: "Maaltijd corrigeren",
    afterAsk: "Dat was er één. Wil je dit voor elke maaltijd?",
  },
  refusals: {
    invalid: {
      age: "Dat lijkt geen leeftijd — probeer iets als 34.",
      height_cm: "In centimeters — iets als 175.",
      weight_kg: "In kilo's — ongeveer is prima.",
      target_weight_kg: "Een getal in kg — bijvoorbeeld 70.",
    },
    ambiguousAge: {
      line: "Ik wil zeker weten dat ik dat goed lees — bedoelde je het jaar {year}, stuur dan alle vier de cijfers.",
      confirm: "Ik ben {age}",
    },
    direction: {
      gain: "Je zit op {weight} kg en wilt aankomen tot {target} — dat is vanaf hier geen aankomen. Is het doel veranderd, dan zetten we het om; anders geef me een getal boven {weight}.",
      lose: "Je zit op {weight} kg en wilt afvallen tot {target} — dat is vanaf hier geen afvallen. Is het doel veranderd, dan zetten we het om; anders geef me een getal onder {weight}.",
      switchToLose: "Overschakelen naar afvallen",
      switchToGain: "Overschakelen naar aankomen",
      above: "Een getal boven {weight}…",
      below: "Een getal onder {weight}…",
    },
    switched: {
      gain: "Omgezet — aankomen dus. Waar wil je uitkomen, in kg?",
    },
  },
};

const PL: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Zacznij",
    signin: "Mam już konto",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Jaki jest twój cel?"] },
      },
      options: {
        lose: { label: "Schudnąć" },
        maintain: { label: "Utrzymać wagę" },
        gain: { label: "Przytyć" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Jaka jest twoja płeć?"] },
      },
      options: {
        male: { label: "Mężczyzna" },
        female: { label: "Kobieta" },
        other: { label: "Inna" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Twój wiek?"],
          placeholder: "Twój wiek",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Wzrost"],
          placeholder: "Wzrost w cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Twoja waga"],
          placeholder: "Waga w kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Jak aktywne są twoje dni?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Bez treningów" },
        few: { label: "1–2", hint: "Treningi od czasu do czasu" },
        some: { label: "3–4", hint: "Kilka treningów w tygodniu" },
        many: { label: "5+", hint: "Trening prawie codziennie" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Do jakiej wagi dążysz?"],
          placeholder: "Docelowa waga w kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Jak szybko?"] },
      },
      options: {
        easy: { label: "Łagodnie" },
        steady: { label: "Równo" },
        push: { label: "Szybko" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Masz doświadczenie w liczeniu kalorii?"] } },
      options: {
        never: { label: "Nigdy" },
        stopped: { label: "Kiedyś tak, teraz nie" },
        onoff: { label: "Z przerwami" },
        now: { label: "Tak, liczę" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Co cię zatrzymało?", "Zaznacz wszystko, co pasuje"],
          variants: {
            onoff: ["Co ci przeszkodziło?", "Zaznacz wszystko, co pasuje"],
            now: ["Co chcesz uprościć?", "Zaznacz wszystko, co pasuje"],
          },
        },
      },
      options: {
        too_long: { label: "To zajmowało za dużo czasu" },
        forgot: { label: "Zapominało się" },
        invisible: { label: "Nie było widać efektów" },
        no_idea: { label: "Brakowało pomysłu, co jeść" },
        stressful: { label: "To było stresujące" },
        nobody: { label: "Nie było kogo zapytać" },
        creeping: { label: "Waga wracała" },
        not_enough: { label: "Trudno było zjeść wystarczająco" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kiedy zapisywanie jest najtrudniejsze?"],
          variants: { never: ["Kiedy spodziewasz się, że zapisywanie będzie najtrudniejsze?"] },
        },
      },
      options: {
        workdays: { label: "Zajęte dni powszednie" },
        eating_out: { label: "Jedzenie na mieście" },
        cooking: { label: "Gotowanie dla innych" },
        snacks: { label: "Przekąski i napoje" },
        evenings: { label: "Wieczory i weekendy" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Stosujesz jakąś dietę?"] },
      },
      options: {
        balanced: { label: "Zbilansowana" },
        wholefood: { label: "Nieprzetworzona żywność" },
        mediterranean: { label: "Śródziemnomorska" },
        flexitarian: { label: "Fleksitariańska" },
        pescatarian: { label: "Peskatariańska" },
        vegetarian: { label: "Wegetariańska" },
        vegan: { label: "Wegańska" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Masz ograniczenia zdrowotne?"] },
      },
      options: {
        kidneys: { label: "Choroba nerek" },
        ldl: { label: "Wysoki cholesterol" },
        lowsugar: { label: "Ryzyko cukrzycy" },
        none: { label: "Żadne z tych" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Gdzie jesz?"], placeholder: "Szukaj" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Gdzie indziej" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Jaką serię chcesz osiągnąć?"] },
      },
      options: {
        "7": { label: "7 dni" },
        "14": { label: "14 dni" },
        "30": { label: "30 dni" },
        "50": { label: "50 dni" },
      },
    },
  ],
  building: {
    lines: ["Tworzę twój osobisty plan"],
    title: "Twój plan dnia",
    rows: { calories: "Kalorie", protein: "Białko", carbs: "Węglowodany", fat: "Tłuszcz", diet: "Dieta" },
    limitCap: { ldl: "tłuszcze nasycone ≤ {n} g", kidneys: "sód ≤ {n} mg" },
    cta: "Pokaż mi plan",
    floorTitle: "Zatrzymaliśmy się na {floor}kcal",
    floorBody: "Z rachunku wychodziło mniej. Bez nadzoru lekarza nie ustalamy celów poniżej tej wartości, więc twój jest właśnie tutaj. Zobaczysz to też w swoim dzienniku.",
  },
  summary: {
    lines: ["Oto twój plan"],
    kcalLabel: "kcal dziennie",
    floorMarker: "ograniczone dla bezpieczeństwa · nigdy poniżej {floor}",
    macros: {
      protein: "Białko",
      carbs: "Węglowodany",
      fat: "Tłuszcz",
      satfat: "Tłuszcze nasycone · na twoją prośbę",
    },
    capNote: "To tempo wymaga większej dziennej zmiany, niż można bezpiecznie utrzymać, więc dostajesz bezpieczną wersję: {share}% tego, co twój organizm spala w ciągu dnia.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Sfotografuj swój pierwszy posiłek",
  },
  ui: {
    continueLabel: "Dalej",
    saveKept: "Nie udało się tego zapisać. Twoja odpowiedź wciąż tu jest. „Dalej” wyśle ją ponownie.",
    idlePlaceholder: "Wiadomość do Spuda…",
    optionContinues: "Wybiera i przechodzi dalej",
    stepper: { continue: "Dalej", less: "Mniej", more: "Więcej" },
    units: { years: "lat", yearsCount: { one: "{n} rok", other: "{n} l." } },
  },
  beats: {
    ageWhy: "Metabolizm zmienia się z wiekiem, więc to uwzględniamy",
    echo: { rest: "W spoczynku: {rest}kcal dziennie", days: "Twoje dni spalają {burn}kcal" },
    baseline: { title: "Twój punkt wyjścia", bmi: "BMI", what: "Wskaźnik masy ciała" },
    prelim: { title: "Twój plan", burn: "Spalasz", gap: "{delta} twoje tempo", eat: "Jesz", perDay: "kcal dziennie", keepTitle: "Spalasz około {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · nasze minimum",
      now: "{weight} · teraz",
      nowLowest: "{weight} · teraz · nasze minimum",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Proponuję {weight}, około {pct}% mniej — dobry pierwszy cel", up: "Proponuję {weight}, około {pct}% więcej — dobry pierwszy cel" },
  },
  pace: {
    rate: "{rate} tygodniowo",
    rateSuffix: "tygodniowo",
    result: "{target} — szacunkowo {month} · {kcal}kcal dziennie",
    echo: "Od {from} do {to}.",
  },
  plan: {
    weightTitle: "Twoja waga",
    everyDay: "Każdego dnia",
    infoTitle: "Twoje dane",
    basedOn: "Na podstawie twoich odpowiedzi",
    changeAnytime: "Możesz to zmienić w dowolnej chwili",
    goal: {
      lose: "Cel: −{kg} · orientacyjnie {month}",
      gain: "Cel: +{kg} · orientacyjnie {month}",
      maintain: "Cel: utrzymać około {kg}",
      maintainRange: "Zakres: {range}",
    },
    info: {
      startWeight: "Waga początkowa", goalWeight: "Waga docelowa", activity: "Aktywność",
      target: "Cel", targetLose: "−{kg} · orientacyjnie {month}", targetGain: "+{kg} · orientacyjnie {month}",
    },
    satFat: { label: "tł. nasycone", asked: "Tłuszcze nasycone · na twoją prośbę", perDay: "≤ {g} dziennie" },
    first: { title: "Twój pierwszy krok", step: "Sfotografuj kolejny posiłek. eait porówna go z {kcal}kcal." },
    loader: { goal: "Twój cel", lose: "−{kg} · orientacyjnie {month}", gain: "+{kg} · orientacyjnie {month}" },
    chart: { estimateAria: "Szacowana waga: teraz {from}, {to} — szacunkowo {month}" },
  },
  signup: { heading: "Zapisz swój plan", line: "Dzięki temu Twój plan i subskrypcja przejdą z Tobą na nowy telefon, a posiłki zostaną zachowane." },
  referral: {
    ask: "Masz link od znajomych?",
    field: "Link z zaproszeniem od znajomych",
    unknown: "Ten link do nikogo nie pasuje. Sprawdź go albo pomiń.",
    own: "To twój własny link. Tu wpisz link od znajomych.",
    already: "To konto już dołączyło przez link od znajomych.",
    paid: "Linki z zaproszeniem są dla nowych osób, a na tym koncie eait już został kupiony.",
    tryAgain: "Spróbuj ponownie",
    skip: "Pomiń",
  },
  health: { title: "Synchronizuj z aplikacją Zdrowie", body: "Waga i aktywność trafiają do eait. Twoje posiłki trafiają do aplikacji Zdrowie." },
  liveActivity: { titles: ["Pytania", "Twój plan", "Prawie gotowe"], go: "Kontynuuj" },
  firstMeal: {
    ask: "Jeden posiłek na mój koszt. Zdjęcie czy po prostu opiszesz?",
    react: "Spokojnie. Najpierw mnie wypróbuj",
    photo: "Zrób zdjęcie",
    tell: "Opisz mi swój posiłek",
    keepGoing: "Dalej",
    correct: "Popraw posiłek",
    afterAsk: "To był jeden. Chcesz tak przy każdym posiłku?",
  },
  refusals: {
    invalid: {
      age: "To nie wygląda na wiek — spróbuj czegoś w stylu 34.",
      height_cm: "W centymetrach — na przykład 175.",
      weight_kg: "W kilogramach — wystarczy w przybliżeniu.",
      target_weight_kg: "Liczba w kg — na przykład 70.",
    },
    ambiguousAge: {
      line: "Chcę mieć pewność, że dobrze to odczytuję — jeśli chodziło ci o rok {year}, wyślij wszystkie cztery cyfry.",
      confirm: "Mój wiek: {age}",
    },
    direction: {
      gain: "Ważysz {weight} kg i chcesz przytyć do {target} — stąd to nie jest przyrost. Jeśli cel się zmienił, możemy go przestawić; jeśli nie, podaj liczbę powyżej {weight}.",
      lose: "Ważysz {weight} kg i chcesz schudnąć do {target} — stąd to nie jest spadek. Jeśli cel się zmienił, możemy go przestawić; jeśli nie, podaj liczbę poniżej {weight}.",
      switchToLose: "Przestaw na chudnięcie",
      switchToGain: "Przestaw na przybieranie",
      above: "Liczba powyżej {weight}…",
      below: "Liczba poniżej {weight}…",
    },
    switched: {
      gain: "Przestawione — czyli przybieranie. Ile chcesz ważyć, w kg?",
    },
  },
};

const TR: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Başla",
    signin: "Zaten bir hesabım var",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["Hedefin ne?"] },
      },
      options: {
        lose: { label: "Kilo vermek" },
        maintain: { label: "Kilomu korumak" },
        gain: { label: "Kilo almak" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Cinsiyetin ne?"] },
      },
      options: {
        male: { label: "Erkek" },
        female: { label: "Kadın" },
        other: { label: "Diğer" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Yaşın?"],
          placeholder: "Yaşın",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Boy"],
          placeholder: "Boy (cm)",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Kilon"],
          placeholder: "Kilo (kg)",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Günlerin ne kadar hareketli?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Antrenman yok" },
        few: { label: "1–2", hint: "Arada bir antrenman" },
        some: { label: "3–4", hint: "Haftada birkaç antrenman" },
        many: { label: "5+", hint: "Neredeyse her gün antrenman" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Hangi kiloyu hedefliyorsun?"],
          placeholder: "Hedef kilo (kg)",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Ne hızda?"] },
      },
      options: {
        easy: { label: "Hafif" },
        steady: { label: "Düzenli" },
        push: { label: "Hızlı" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Daha önce kalori saydın mı?"] } },
      options: {
        never: { label: "Hiç" },
        stopped: { label: "Denemiştim, bıraktım" },
        onoff: { label: "Arada sırada" },
        now: { label: "Şimdi sayıyorum" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["Seni ne durdurdu?", "Uyanların hepsini seç"],
          variants: {
            onoff: ["Ne engel oldu?", "Uyanların hepsini seç"],
            now: ["Neyin daha kolay olmasını isterdin?", "Uyanların hepsini seç"],
          },
        },
      },
      options: {
        too_long: { label: "Çok uzun sürüyordu" },
        forgot: { label: "Unutuyordum" },
        invisible: { label: "İşe yaradığını göremiyordum" },
        no_idea: { label: "Ne yiyeceğimi bilmiyordum" },
        stressful: { label: "Stresli geliyordu" },
        nobody: { label: "Soracak kimse yoktu" },
        creeping: { label: "Kilom sürekli geri geliyordu" },
        not_enough: { label: "Yeterince yemek zordu" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Kaydetmek ne zaman en zor?"],
          variants: { never: ["Kaydetmenin ne zaman en zor olacağını düşünüyorsun?"] },
        },
      },
      options: {
        workdays: { label: "Yoğun iş günleri" },
        eating_out: { label: "Dışarıda yemek" },
        cooking: { label: "Başkaları için yemek yapmak" },
        snacks: { label: "Atıştırmalıklar ve içecekler" },
        evenings: { label: "Akşamlar ve hafta sonları" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Belirli bir diyet uyguluyor musun?"] },
      },
      options: {
        balanced: { label: "Dengeli" },
        wholefood: { label: "İşlenmemiş gıdalar" },
        mediterranean: { label: "Akdeniz" },
        flexitarian: { label: "Fleksitaryen" },
        pescatarian: { label: "Pesketaryen" },
        vegetarian: { label: "Vejetaryen" },
        vegan: { label: "Vegan" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Tıbbi bir kısıtlaman var mı?"] },
      },
      options: {
        kidneys: { label: "Böbrek rahatsızlığı" },
        ldl: { label: "Yüksek kolesterol" },
        lowsugar: { label: "Diyabet riski" },
        none: { label: "Hiçbiri" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Nerede yemek yiyorsun?"], placeholder: "Ara" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Başka bir yer" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Hedefleyeceğin bir seri seç"] },
      },
      options: {
        "7": { label: "7 gün" },
        "14": { label: "14 gün" },
        "30": { label: "30 gün" },
        "50": { label: "50 gün" },
      },
    },
  ],
  building: {
    lines: ["Kişisel planın hazırlanıyor"],
    title: "Günlük planın",
    rows: { calories: "Kalori", protein: "Protein", carbs: "Karbonhidrat", fat: "Yağ", diet: "Diyet" },
    limitCap: { ldl: "doymuş yağ ≤ {n} g", kidneys: "sodyum ≤ {n} mg" },
    cta: "Planı göster",
    floorTitle: "{floor}kcal'de durduk",
    floorBody: "Hesap daha aşağı inmek istedi. Tıbbi gözetim olmadan bunun altında hedef koymuyoruz, o yüzden seninki burada. Bu, günlüğünde de yazacak.",
  },
  summary: {
    lines: ["İşte planın"],
    kcalLabel: "kcal / gün",
    floorMarker: "güvenlik için sınırlı · asla {floor} altına inmez",
    macros: {
      protein: "Protein",
      carbs: "Karbonhidrat",
      fat: "Yağ",
      satfat: "Doymuş yağ · sen istedin",
    },
    capNote: "Bu tempo, güvenle sürdürülebilecekten daha büyük bir günlük değişim gerektiriyor; bu yüzden seninki güvenli sürüm: vücudunun bir günde yaktığı enerjinin %{share} kadarı.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "İlk öğününün fotoğrafını çek",
  },
  ui: {
    continueLabel: "Devam",
    saveKept: "Kaydedilemedi. Yanıtın hâlâ burada. Devam onu tekrar gönderir.",
    idlePlaceholder: "Spud'a yaz…",
    optionContinues: "Seçer ve devam eder",
    stepper: { continue: "Devam", less: "Daha az", more: "Daha fazla" },
    units: { years: "yaş", yearsCount: { one: "{n} yaş", other: "{n} yaş" } },
  },
  beats: {
    ageWhy: "Metabolizman yaşla değişir, biz de bunu hesaba katarız",
    echo: { rest: "Dinlenirken: günde {rest}kcal", days: "Günlerin {burn}kcal yakar" },
    baseline: { title: "İşte başlangıç noktan", bmi: "VKİ", what: "Vücut kitle indeksi" },
    prelim: { title: "Planın", burn: "Yakarsın", gap: "{delta} tempon", eat: "Yersin", perDay: "kcal/gün", keepTitle: "Yaklaşık {burn}kcal yakarsın" },
  },
  target: {
    markers: {
      lowest: "{weight} · koyduğumuz en düşük",
      now: "{weight} · şu an",
      nowLowest: "{weight} · şu an · koyduğumuz en düşük",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "{weight} öneriyorum, yaklaşık %{pct} aşağı, iyi bir ilk hedef", up: "{weight} öneriyorum, yaklaşık %{pct} yukarı, iyi bir ilk hedef" },
  },
  pace: {
    rate: "haftada {rate}",
    rateSuffix: "haftada",
    result: "{month} civarında {target} · günde {kcal}kcal",
    echo: "{from} → {to}.",
  },
  plan: {
    weightTitle: "Kilon",
    everyDay: "Her gün",
    infoTitle: "Bilgilerin",
    basedOn: "Yanıtlarına göre",
    changeAnytime: "Bunu istediğin zaman değiştirebilirsin",
    goal: {
      lose: "Hedef: {month} tarihine kadar {kg} vermek",
      gain: "Hedef: {month} tarihine kadar {kg} almak",
      maintain: "Hedef: {kg} civarında kalmak",
      maintainRange: "Aralık: {range}",
    },
    info: {
      startWeight: "Başlangıç kilosu", goalWeight: "Hedef kilo", activity: "Aktivite",
      target: "Hedef", targetLose: "{month} tarihine kadar {kg} vermek", targetGain: "{month} tarihine kadar {kg} almak",
    },
    satFat: { label: "doymuş yağ", asked: "Doymuş yağ · senin isteğin", perDay: "günde ≤ {g}" },
    first: { title: "İlk adımın", step: "Bir sonraki öğününün fotoğrafını çek. eait onu {kcal}kcal ile karşılaştırır." },
    loader: { goal: "Hedefin", lose: "−{kg} · {month}", gain: "+{kg} · {month}" },
    chart: { estimateAria: "Tahmini kilo: şu an {from}, {month} civarında {to}" },
  },
  signup: { heading: "Planını kaydet", line: "Böylece planın ve aboneliğin yeni bir telefona taşınır, yemeklerin de korunur." },
  referral: {
    ask: "Bir arkadaşın sana bağlantı mı gönderdi?",
    field: "Arkadaşının davet bağlantısı",
    unknown: "Bu bağlantı kimseyle eşleşmiyor. Kontrol et ya da atla.",
    own: "Bu senin kendi bağlantın. Buraya bir arkadaşının bağlantısı gelir.",
    already: "Bu hesap zaten bir arkadaş bağlantısıyla katıldı.",
    paid: "Davet bağlantıları yeni üyeler içindir ve bu hesap eait'i zaten satın aldı.",
    tryAgain: "Tekrar dene",
    skip: "Atla",
  },
  health: { title: "Sağlık ile eşzamanla", body: "Kilo ve aktivite gelir. Öğünlerin Sağlık'a gider." },
  liveActivity: { titles: ["Sorular", "Planın", "Neredeyse bitti"], go: "Devam" },
  firstMeal: {
    ask: "Bir öğün benden. Fotoğraf mı, yoksa anlatır mısın?",
    react: "Sorun değil. Önce beni dene",
    photo: "Fotoğraf çek",
    tell: "Ne yediğini anlat",
    keepGoing: "Devam et",
    correct: "Öğünü düzelt",
    afterAsk: "Bu bir taneydi. Her öğünde ister misin?",
  },
  refusals: {
    invalid: {
      age: "Bu bir yaş gibi görünmüyor — 34 gibi bir şey dene.",
      height_cm: "Santimetre olarak — 175 gibi bir şey.",
      weight_kg: "Kilogram olarak — yaklaşık olması yeter.",
      target_weight_kg: "kg cinsinden bir sayı — 70 gibi.",
    },
    ambiguousAge: {
      line: "Doğru okuduğumdan emin olmak istiyorum — {year} yılını kastettiysen dört hanenin hepsini gönder.",
      confirm: "{age} yaşındayım",
    },
    direction: {
      gain: "Şu an {weight} kg'sın ve {target} hedefine kilo almak istedin — buradan bu bir artış değil. Amaç değiştiyse onu değiştirebiliriz; değilse bana {weight} üstünde bir sayı ver.",
      lose: "Şu an {weight} kg'sın ve {target} hedefine kilo vermek istedin — buradan bu bir düşüş değil. Amaç değiştiyse onu değiştirebiliriz; değilse bana {weight} altında bir sayı ver.",
      switchToLose: "Kilo vermeye geç",
      switchToGain: "Kilo almaya geç",
      above: "{weight} üstünde bir sayı…",
      below: "{weight} altında bir sayı…",
    },
    switched: {
      gain: "Değiştirildi — kilo alıyoruz. kg olarak nereye varmak istersin?",
    },
  },
};

const ZH_HANT: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "開始使用",
    signin: "我已經有帳號了",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["你的目標是什麼？"] },
      },
      options: {
        lose: { label: "減重" },
        maintain: { label: "維持體重" },
        gain: { label: "增重" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["你的生理性別是？"] },
      },
      options: {
        male: { label: "男性" },
        female: { label: "女性" },
        other: { label: "其他" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["你的年齡？"],
          placeholder: "你的年齡",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["身高"],
          placeholder: "身高（公分）",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["你的體重"],
          placeholder: "體重（公斤）",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["你平常的活動量如何？"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "不運動" },
        few: { label: "1–2", hint: "偶爾運動" },
        some: { label: "3–4", hint: "每週運動幾次" },
        many: { label: "5+", hint: "幾乎天天訓練" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["你的目標體重是多少？"],
          placeholder: "目標體重（公斤）",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["想用什麼節奏？"] },
      },
      options: {
        easy: { label: "溫和" },
        steady: { label: "穩定" },
        push: { label: "較快" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["算過卡路里嗎？"] } },
      options: {
        never: { label: "沒算過" },
        stopped: { label: "試過，後來停了" },
        onoff: { label: "斷斷續續" },
        now: { label: "現在還在算" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["什麼讓你停下來？", "符合的都選"],
          variants: {
            onoff: ["什麼讓你卡住了？", "符合的都選"],
            now: ["你希望什麼更簡單？", "符合的都選"],
          },
        },
      },
      options: {
        too_long: { label: "太花時間" },
        forgot: { label: "常常忘記" },
        invisible: { label: "看不出效果" },
        no_idea: { label: "不知道該吃什麼" },
        stressful: { label: "壓力很大" },
        nobody: { label: "沒人可以問" },
        creeping: { label: "體重總是悄悄回升" },
        not_enough: { label: "很難吃夠" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["什麼時候最難記錄？"],
          variants: { never: ["你覺得什麼時候會最難記錄？"] },
        },
      },
      options: {
        workdays: { label: "忙碌的工作日" },
        eating_out: { label: "外食" },
        cooking: { label: "幫別人煮飯" },
        snacks: { label: "零食和飲料" },
        evenings: { label: "晚上和週末" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["你有遵循特定的飲食方式嗎？"] },
      },
      options: {
        balanced: { label: "均衡飲食" },
        wholefood: { label: "原型食物" },
        mediterranean: { label: "地中海飲食" },
        flexitarian: { label: "彈性素" },
        pescatarian: { label: "海鮮素" },
        vegetarian: { label: "蛋奶素" },
        vegan: { label: "純素" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["有任何醫療上的限制嗎？"] },
      },
      options: {
        kidneys: { label: "腎臟疾病" },
        ldl: { label: "膽固醇偏高" },
        lowsugar: { label: "糖尿病風險" },
        none: { label: "以上皆無" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["你在哪裡吃飯？"], placeholder: "搜尋" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "其他地區" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["選一個想達成的連續天數"] },
      },
      options: {
        "7": { label: "7 天" },
        "14": { label: "14 天" },
        "30": { label: "30 天" },
        "50": { label: "50 天" },
      },
    },
  ],
  building: {
    lines: ["正在建立你的個人計畫"],
    title: "你的每日計畫",
    rows: { calories: "熱量", protein: "蛋白質", carbs: "碳水", fat: "脂肪", diet: "飲食" },
    limitCap: { ldl: "飽和脂肪 ≤ {n} 公克", kidneys: "鈉 ≤ {n} 毫克" },
    cta: "讓我看看計畫",
    floorTitle: "我們停在 {floor}大卡",
    floorBody: "計算結果原本還想再往下。沒有醫療監督的情況下，我們不會設定低於這個數字的目標，所以你的目標就定在這裡。你的日記上也會註明這一點。",
  },
  summary: {
    lines: ["這是你的計畫"],
    kcalLabel: "大卡／天",
    floorMarker: "基於安全設限 · 絕不低於 {floor}",
    macros: {
      protein: "蛋白質",
      carbs: "碳水",
      fat: "脂肪",
      satfat: "飽和脂肪 · 依你的要求",
    },
    capNote: "這個節奏需要的每日落差，超過能安全維持的程度，所以你拿到的是安全版本：身體一天消耗量的 {share}%。",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "拍下你的第一餐",
  },
  ui: {
    continueLabel: "繼續",
    saveKept: "無法儲存。你的答案還在，按「繼續」會再傳送一次。",
    idlePlaceholder: "傳訊息給 Spud…",
    optionContinues: "選取並繼續",
    stepper: { continue: "繼續", less: "減少", more: "增加" },
    units: { years: "歲", yearsCount: { one: "{n} 歲", other: "{n} 歲" } },
  },
  beats: {
    ageWhy: "你的代謝會隨年齡改變，所以我們把它納入計算",
    echo: { rest: "靜止時：每天 {rest}大卡", days: "你的日子消耗 {burn}大卡" },
    baseline: { title: "這是你的起點", bmi: "身體質量指數（BMI）", what: "身體質量指數" },
    prelim: { title: "你的計畫", burn: "你消耗", gap: "{delta} 你的步調", eat: "你攝取", perDay: "大卡/天", keepTitle: "你消耗約 {burn}大卡" },
  },
  target: {
    markers: {
      lowest: "{weight} · 我們設定的最低值",
      now: "{weight} · 目前",
      nowLowest: "{weight} · 目前 · 我們設定的最低值",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "我建議 {weight}，約減少 {pct}%，是不錯的第一個目標", up: "我建議 {weight}，約增加 {pct}%，是不錯的第一個目標" },
  },
  pace: {
    rate: "每週 {rate}",
    rateSuffix: "每週",
    result: "約 {month} 達到 {target} · 每天 {kcal}大卡",
    echo: "從 {from} 到 {to}。",
  },
  plan: {
    weightTitle: "你的體重",
    everyDay: "每天",
    infoTitle: "你的資料",
    basedOn: "根據你的回答",
    changeAnytime: "你可以隨時更改",
    goal: {
      lose: "目標：{month}前減少 {kg}",
      gain: "目標：{month}前增加 {kg}",
      maintain: "目標：維持在 {kg} 左右",
      maintainRange: "範圍：{range}",
    },
    info: {
      startWeight: "起始體重", goalWeight: "目標體重", activity: "活動量",
      target: "目標", targetLose: "{month}前減少 {kg}", targetGain: "{month}前增加 {kg}",
    },
    satFat: { label: "飽和脂肪", asked: "飽和脂肪 · 依你的要求", perDay: "每天 ≤ {g}" },
    first: { title: "你的第一步", step: "拍下你的下一餐。eait 會以 {kcal}大卡檢查它。" },
    loader: { goal: "你的目標", lose: "{month}前 −{kg}", gain: "{month}前 +{kg}" },
    chart: { estimateAria: "預估體重：現在 {from}，約 {month} 達到 {to}" },
  },
  signup: { heading: "儲存你的方案", line: "這樣，你的方案和訂閱會跟隨你到新機，你的餐食記錄也會保留。" },
  referral: {
    ask: "有朋友傳連結給你嗎？",
    field: "朋友的邀請連結",
    unknown: "這個連結找不到對應的人。請檢查一下，或略過。",
    own: "這是你自己的連結。這裡要填朋友的連結。",
    already: "這個帳號已經透過朋友的連結加入過了。",
    paid: "邀請連結僅限新會員使用，而這個帳號已經購買過 eait。",
    tryAgain: "再試一次",
    skip: "略過",
  },
  health: { title: "與「健康」同步", body: "體重和活動資料會匯入，你的餐點會寫入「健康」。" },
  liveActivity: { titles: ["問題", "你的計畫", "快完成了"], go: "繼續" },
  firstMeal: {
    ask: "第一餐我請客。拍照，還是直接告訴我？",
    react: "沒問題，先試試看我吧",
    photo: "拍照",
    tell: "告訴我你吃了什麼",
    keepGoing: "繼續",
    correct: "修正餐點",
    afterAsk: "這就是一餐。想要每一餐都這樣嗎？",
  },
  refusals: {
    invalid: {
      age: "這看起來不像年齡，試試像 34 這樣的數字。",
      height_cm: "以公分為單位，例如 175。",
      weight_kg: "以公斤為單位，大概就好。",
      target_weight_kg: "以公斤為單位的數字，例如 70。",
    },
    ambiguousAge: {
      line: "我想確認沒看錯：如果你指的是 {year} 年，請傳完整的四位數。",
      confirm: "我 {age} 歲",
    },
    direction: {
      gain: "你目前 {weight} 公斤，想增重到 {target}，但從現在來看這不是增重。如果目標改變了，我們可以切換；否則請給我一個大於 {weight} 的數字。",
      lose: "你目前 {weight} 公斤，想減重到 {target}，但從現在來看這不是減重。如果目標改變了，我們可以切換；否則請給我一個小於 {weight} 的數字。",
      switchToLose: "改為減重",
      switchToGain: "改為增重",
      above: "大於 {weight} 的數字…",
      below: "小於 {weight} 的數字…",
    },
    switched: {
      gain: "已切換，那就增重。你想達到幾公斤？",
    },
  },
};

const ZH_HANS: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "开始使用",
    signin: "我已有账户",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["你想达成什么目标？"] },
      },
      options: {
        lose: { label: "减重" },
        maintain: { label: "保持体重" },
        gain: { label: "增重" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["你的性别是？"] },
      },
      options: {
        male: { label: "男性" },
        female: { label: "女性" },
        other: { label: "其他" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["你的年龄？"],
          placeholder: "你的年龄",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["身高"],
          placeholder: "身高（厘米）",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["你的体重"],
          placeholder: "体重（公斤）",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["你平时的活动量如何？"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "不锻炼" },
        few: { label: "1–2", hint: "偶尔锻炼" },
        some: { label: "3–4", hint: "每周锻炼几次" },
        many: { label: "5+", hint: "几乎每天训练" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["你的目标体重是多少？"],
          placeholder: "目标体重（公斤）",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["想按什么节奏？"] },
      },
      options: {
        easy: { label: "温和" },
        steady: { label: "稳定" },
        push: { label: "较快" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["算过卡路里吗？"] } },
      options: {
        never: { label: "没算过" },
        stopped: { label: "试过，后来停了" },
        onoff: { label: "断断续续" },
        now: { label: "现在还在算" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["是什么让你停下了？", "符合的都选"],
          variants: {
            onoff: ["是什么让你卡住了？", "符合的都选"],
            now: ["你希望什么更简单？", "符合的都选"],
          },
        },
      },
      options: {
        too_long: { label: "太花时间" },
        forgot: { label: "常常忘记" },
        invisible: { label: "看不到效果" },
        no_idea: { label: "不知道该吃什么" },
        stressful: { label: "压力很大" },
        nobody: { label: "没人可以问" },
        creeping: { label: "体重总是悄悄回升" },
        not_enough: { label: "很难吃够" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["什么时候最难记录？"],
          variants: { never: ["你觉得什么时候会最难记录？"] },
        },
      },
      options: {
        workdays: { label: "忙碌的工作日" },
        eating_out: { label: "外食" },
        cooking: { label: "帮别人做饭" },
        snacks: { label: "零食和饮料" },
        evenings: { label: "晚上和周末" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["你有遵循某种饮食方式吗？"] },
      },
      options: {
        balanced: { label: "均衡饮食" },
        wholefood: { label: "天然全食物" },
        mediterranean: { label: "地中海饮食" },
        flexitarian: { label: "弹性素食" },
        pescatarian: { label: "鱼素" },
        vegetarian: { label: "素食" },
        vegan: { label: "纯素" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["有医疗方面的限制吗？"] },
      },
      options: {
        kidneys: { label: "肾脏疾病" },
        ldl: { label: "胆固醇偏高" },
        lowsugar: { label: "糖尿病风险" },
        none: { label: "以上都没有" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["你在哪里吃饭？"], placeholder: "搜索" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "其他地方" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["选一个连续记录目标"] },
      },
      options: {
        "7": { label: "7 天" },
        "14": { label: "14 天" },
        "30": { label: "30 天" },
        "50": { label: "50 天" },
      },
    },
  ],
  building: {
    lines: ["正在制定你的个人计划"],
    title: "你的每日计划",
    rows: { calories: "热量", protein: "蛋白质", carbs: "碳水", fat: "脂肪", diet: "饮食" },
    limitCap: { ldl: "饱和脂肪 ≤ {n}克", kidneys: "钠 ≤ {n}毫克" },
    cta: "查看我的计划",
    floorTitle: "我们停在了{floor}千卡",
    floorBody: "按计算本可以更低。没有医生监督，我们不会把目标设得比这更低，所以你的目标就定在这里。你的日记里也会注明这一点。",
  },
  summary: {
    lines: ["这是你的计划"],
    kcalLabel: "千卡/天",
    floorMarker: "出于安全已设限 · 绝不低于 {floor}",
    macros: {
      protein: "蛋白质",
      carbs: "碳水",
      fat: "脂肪",
      satfat: "饱和脂肪 · 按你的要求",
    },
    capNote: "这个节奏需要的每日热量差超出了能安全坚持的范围，所以你拿到的是安全版本：身体一天消耗量的 {share}%。",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "拍下你的第一餐",
  },
  ui: {
    continueLabel: "继续",
    saveKept: "无法保存。你的回答还在，点击“继续”会再次发送。",
    idlePlaceholder: "给 Spud 发消息…",
    optionContinues: "选择并继续",
    stepper: { continue: "继续", less: "减少", more: "增加" },
    units: { years: "岁", yearsCount: { one: "{n}岁", other: "{n}岁" } },
  },
  beats: {
    ageWhy: "代谢会随年龄变化，所以我们会把它考虑进去",
    echo: { rest: "静息时：每天{rest}千卡", days: "你的日子消耗 {burn}千卡" },
    baseline: { title: "这是你的起点", bmi: "身体质量指数（BMI）", what: "身体质量指数" },
    prelim: { title: "你的计划", burn: "你消耗", gap: "{delta} 你的节奏", eat: "你摄入", perDay: "千卡/天", keepTitle: "你消耗约 {burn}千卡" },
  },
  target: {
    markers: {
      lowest: "{weight} · 我们设定的最低值",
      now: "{weight} · 当前",
      nowLowest: "{weight} · 当前 · 我们设定的最低值",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "我建议{weight}，约减少{pct}%，是不错的第一个目标", up: "我建议{weight}，约增加{pct}%，是不错的第一个目标" },
  },
  pace: {
    rate: "每周{rate}",
    rateSuffix: "每周",
    result: "约{month}达到{target} · 每天{kcal}千卡",
    echo: "从{from}到{to}。",
  },
  plan: {
    weightTitle: "你的体重",
    everyDay: "每天",
    infoTitle: "你的信息",
    basedOn: "基于你的回答",
    changeAnytime: "你可以随时更改",
    goal: {
      lose: "目标：减 {kg}，预计{month}",
      gain: "目标：增 {kg}，预计{month}",
      maintain: "目标：保持在 {kg} 左右",
      maintainRange: "范围：{range}",
    },
    info: {
      startWeight: "起始体重", goalWeight: "目标体重", activity: "活动量",
      target: "目标", targetLose: "减 {kg}，预计{month}", targetGain: "增 {kg}，预计{month}",
    },
    satFat: { label: "饱和脂肪", asked: "饱和脂肪 · 按你的要求", perDay: "每天 ≤ {g}" },
    first: { title: "你的第一步", step: "拍下你的下一餐。eait 会按 {kcal}千卡 检查它。" },
    loader: { goal: "你的目标", lose: "−{kg}，预计{month}", gain: "+{kg}，预计{month}" },
    chart: { estimateAria: "预估体重：现在{from}，约{month}达到{to}" },
  },
  signup: { heading: "保存你的方案", line: "这样，你的方案和订阅会跟随你到新手机，你的餐食记录也会保留。" },
  referral: {
    ask: "好友给你发过链接吗？",
    field: "好友的邀请链接",
    unknown: "这个链接没有匹配到任何人。检查一下，或者跳过。",
    own: "这是你自己的链接。这里要填好友的链接。",
    already: "这个账户已经通过好友链接加入过了。",
    paid: "邀请链接仅限新成员使用，而这个账户已经购买过 eait。",
    tryAgain: "再试一次",
    skip: "跳过",
  },
  health: { title: "与“健康”同步", body: "体重和活动数据会同步进来，你的餐食会写入“健康”。" },
  liveActivity: { titles: ["问题", "你的计划", "快完成了"], go: "继续" },
  firstMeal: {
    ask: "这一餐我免费帮你看。拍照，还是直接告诉我？",
    react: "没问题，先试试我吧",
    photo: "拍照",
    tell: "告诉我你吃了什么",
    keepGoing: "继续",
    correct: "修正这一餐",
    afterAsk: "这是第一餐。想每餐都这样吗？",
  },
  refusals: {
    invalid: {
      age: "这看起来不像年龄——试试像 34 这样的数字。",
      height_cm: "以厘米为单位——比如 175。",
      weight_kg: "以公斤为单位——大概的数字就行。",
      target_weight_kg: "以公斤为单位的数字——比如 70。",
    },
    ambiguousAge: {
      line: "我想确认没有理解错——如果你指的是{year}年，请发送完整的四位数字。",
      confirm: "我{age}岁",
    },
    direction: {
      gain: "你现在{weight}公斤，却想增重到{target}——这并不是增重。如果目标变了，我们可以切换；否则请给我一个大于{weight}的数字。",
      lose: "你现在{weight}公斤，却想减重到{target}——这并不是减重。如果目标变了，我们可以切换；否则请给我一个小于{weight}的数字。",
      switchToLose: "切换为减重",
      switchToGain: "切换为增重",
      above: "大于{weight}的数字…",
      below: "小于{weight}的数字…",
    },
    switched: {
      gain: "已切换——那就增重。你想达到多少公斤？",
    },
  },
};

const KO: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "시작하기",
    signin: "이미 계정이 있어요",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["어떤 목표가 있으세요?"] },
      },
      options: {
        lose: { label: "체중 감량" },
        maintain: { label: "체중 유지" },
        gain: { label: "체중 증량" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["성별이 어떻게 되세요?"] },
      },
      options: {
        male: { label: "남성" },
        female: { label: "여성" },
        other: { label: "기타" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["나이?"],
          placeholder: "나이",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["키"],
          placeholder: "키(cm)",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["몸무게"],
          placeholder: "체중(kg)",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["평소 얼마나 활동적이세요?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "운동 안 해요" },
        few: { label: "1–2", hint: "가끔 운동해요" },
        some: { label: "3–4", hint: "일주일에 몇 번 운동해요" },
        many: { label: "5+", hint: "거의 매일 운동해요" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["목표 체중은 얼마예요?"],
          placeholder: "목표 체중(kg)",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["어떤 속도로 할까요?"] },
      },
      options: {
        easy: { label: "천천히" },
        steady: { label: "꾸준히" },
        push: { label: "빠르게" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["칼로리를 계산해 본 적 있나요?"] } },
      options: {
        never: { label: "한 번도 없어요" },
        stopped: { label: "해봤다가 그만뒀어요" },
        onoff: { label: "했다 말다 해요" },
        now: { label: "지금도 계산해요" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["무엇 때문에 그만두셨나요?", "해당하는 것을 모두 고르세요"],
          variants: {
            onoff: ["무엇이 방해가 됐나요?", "해당하는 것을 모두 고르세요"],
            now: ["뭐가 더 쉬웠으면 하나요?", "해당하는 것을 모두 고르세요"],
          },
        },
      },
      options: {
        too_long: { label: "시간이 너무 걸려요" },
        forgot: { label: "자꾸 까먹어요" },
        invisible: { label: "효과가 눈에 안 보여요" },
        no_idea: { label: "뭘 먹어야 할지 몰라서요" },
        stressful: { label: "스트레스였어요" },
        nobody: { label: "물어볼 사람이 없어요" },
        creeping: { label: "체중이 자꾸 다시 늘어요" },
        not_enough: { label: "충분히 먹기 힘들어요" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["언제 기록하기가 가장 어려워요?"],
          variants: { never: ["언제 기록하기가 가장 어려울 것 같아요?"] },
        },
      },
      options: {
        workdays: { label: "바쁜 평일" },
        eating_out: { label: "외식할 때" },
        cooking: { label: "남을 위해 요리할 때" },
        snacks: { label: "간식과 음료" },
        evenings: { label: "저녁과 주말" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["따로 하는 식단이 있나요?"] },
      },
      options: {
        balanced: { label: "균형 잡힌 식단" },
        wholefood: { label: "자연식품 위주" },
        mediterranean: { label: "지중해식" },
        flexitarian: { label: "플렉시테리언" },
        pescatarian: { label: "페스코 베지테리언" },
        vegetarian: { label: "베지테리언" },
        vegan: { label: "비건" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["의학적 제한이 있나요?"] },
      },
      options: {
        kidneys: { label: "신장 질환" },
        ldl: { label: "높은 콜레스테롤" },
        lowsugar: { label: "당뇨병 위험" },
        none: { label: "해당 없음" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["어디서 식사하세요?"], placeholder: "검색" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "다른 곳" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["목표 연속 기록을 골라 보세요"] },
      },
      options: {
        "7": { label: "7일" },
        "14": { label: "14일" },
        "30": { label: "30일" },
        "50": { label: "50일" },
      },
    },
  ],
  building: {
    lines: ["나만의 플랜을 만들고 있어요"],
    title: "하루 플랜",
    rows: { calories: "칼로리", protein: "단백질", carbs: "탄수화물", fat: "지방", diet: "식단" },
    limitCap: { ldl: "포화 지방 ≤ {n}g", kidneys: "나트륨 ≤ {n}mg" },
    cta: "플랜 보기",
    floorTitle: "{floor}kcal에서 멈췄어요",
    floorBody: "계산상으로는 더 내려갈 수 있었어요. 의료진의 관리 없이는 이보다 낮은 목표를 정하지 않아서, 여기로 맞췄어요. 다이어리에도 이렇게 표시돼요.",
  },
  summary: {
    lines: ["플랜이 준비됐어요"],
    kcalLabel: "kcal/일",
    floorMarker: "안전을 위해 제한 · {floor} 미만으로는 안 내려가요",
    macros: {
      protein: "단백질",
      carbs: "탄수화물",
      fat: "지방",
      satfat: "포화 지방 · 요청하신 항목",
    },
    capNote: "그 속도는 안전하게 유지하기 어려울 만큼 하루 변화가 커야 해서, 안전한 버전으로 맞췄어요. 몸이 하루에 소모하는 에너지의 {share}%예요.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "첫 식사를 찍어 보세요",
  },
  ui: {
    continueLabel: "계속",
    saveKept: "저장하지 못했어요. 답변은 그대로 있어요. 계속을 누르면 다시 보내요.",
    idlePlaceholder: "Spud에게 메시지…",
    optionContinues: "선택하고 계속",
    stepper: { continue: "계속", less: "줄이기", more: "늘리기" },
    units: { years: "세", yearsCount: { one: "{n}세", other: "{n}세" } },
  },
  beats: {
    ageWhy: "나이에 따라 대사가 달라지니 그만큼 반영해요",
    echo: { rest: "휴식 중: 하루 {rest}kcal", days: "하루에는 {burn}kcal를 써요" },
    baseline: { title: "현재 기준점이에요", bmi: "BMI", what: "체질량지수" },
    prelim: { title: "내 계획", burn: "소모", gap: "내 속도 {delta}", eat: "섭취", perDay: "kcal/일", keepTitle: "하루에 약 {burn}kcal를 써요" },
  },
  target: {
    markers: {
      lowest: "{weight} · 설정 가능한 최저치",
      now: "{weight} · 현재",
      nowLowest: "{weight} · 현재 · 설정 가능한 최저치",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "{weight}를 추천해요. 약 {pct}% 감소로, 첫 목표로 좋아요", up: "{weight}를 추천해요. 약 {pct}% 증가로, 첫 목표로 좋아요" },
  },
  pace: {
    rate: "주당 {rate}",
    rateSuffix: "주당",
    result: "{month}쯤 {target} · 하루 {kcal}kcal",
    echo: "{from}에서 {to}로.",
  },
  plan: {
    weightTitle: "내 체중",
    everyDay: "매일",
    infoTitle: "내 정보",
    basedOn: "내 답변을 바탕으로",
    changeAnytime: "언제든 바꿀 수 있어요",
    goal: {
      lose: "목표: {month}까지 {kg} 감량",
      gain: "목표: {month}까지 {kg} 증량",
      maintain: "목표: {kg} 정도 유지",
      maintainRange: "범위: {range}",
    },
    info: {
      startWeight: "시작 체중", goalWeight: "목표 체중", activity: "활동량",
      target: "목표", targetLose: "{month}까지 {kg} 감량", targetGain: "{month}까지 {kg} 증량",
    },
    satFat: { label: "포화 지방", asked: "포화 지방 · 요청한 항목", perDay: "하루 {g} 이하" },
    first: { title: "첫 번째 단계", step: "다음 식사를 사진으로 찍어 보세요. eait이 {kcal}kcal와 비교해 확인해요." },
    loader: { goal: "내 목표", lose: "{month}까지 −{kg}", gain: "{month}까지 +{kg}" },
    chart: { estimateAria: "예상 체중: 현재 {from}, {month}쯤 {to}" },
  },
  signup: { heading: "플랜 저장하기", line: "새 휴대폰으로 바꿔도 플랜과 구독이 그대로 따라오고, 식사 기록도 보관됩니다." },
  referral: {
    ask: "친구에게 링크를 받았나요?",
    field: "친구의 초대 링크",
    unknown: "일치하는 사용자가 없는 링크예요. 확인하거나 건너뛰어 주세요.",
    own: "내 링크예요. 여기에는 친구의 링크를 넣어 주세요.",
    already: "이 계정은 이미 친구 링크로 가입했어요.",
    paid: "초대 링크는 신규 회원용인데, 이 계정은 이미 eait 구매 내역이 있어요.",
    tryAgain: "다시 시도",
    skip: "건너뛰기",
  },
  health: { title: "건강 앱과 동기화", body: "체중과 활동은 가져오고, 식사는 건강 앱으로 보내요." },
  liveActivity: { titles: ["질문", "내 플랜", "거의 다 됐어요"], go: "계속" },
  firstMeal: {
    ask: "한 끼는 제가 쏠게요. 사진으로 할까요, 말로 할까요?",
    react: "괜찮아요. 먼저 한번 써 보세요",
    photo: "사진 찍기",
    tell: "먹은 음식 말하기",
    keepGoing: "계속하기",
    correct: "식사 수정",
    afterAsk: "한 끼 끝났어요. 매 끼니 이렇게 해 볼까요?",
  },
  refusals: {
    invalid: {
      age: "나이 같지 않아요. 34처럼 입력해 보세요.",
      height_cm: "센티미터로 입력해 주세요. 예: 175.",
      weight_kg: "킬로그램으로 입력해 주세요. 대략이어도 괜찮아요.",
      target_weight_kg: "kg 단위 숫자로 입력해 주세요. 예: 70.",
    },
    ambiguousAge: {
      line: "제대로 읽었는지 확인하고 싶어요. {year}년을 뜻한 거라면 네 자리 모두 보내 주세요.",
      confirm: "{age}세예요",
    },
    direction: {
      gain: "지금 {weight}kg인데 {target}까지 늘리고 싶다고 했어요. 지금 기준으로는 증가가 아니에요. 목표가 바뀌었다면 전환할 수 있어요. 아니라면 {weight}보다 큰 숫자를 알려 주세요.",
      lose: "지금 {weight}kg인데 {target}까지 줄이고 싶다고 했어요. 지금 기준으로는 감량이 아니에요. 목표가 바뀌었다면 전환할 수 있어요. 아니라면 {weight}보다 작은 숫자를 알려 주세요.",
      switchToLose: "감량으로 전환",
      switchToGain: "증량으로 전환",
      above: "{weight}보다 큰 숫자…",
      below: "{weight}보다 작은 숫자…",
    },
    switched: {
      gain: "전환했어요. 증량으로 가요. 목표 체중은 몇 kg인가요?",
    },
  },
};

const JA: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "はじめる",
    signin: "アカウントをお持ちの方",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["目標は何ですか？"] },
      },
      options: {
        lose: { label: "体重を減らす" },
        maintain: { label: "体重を維持する" },
        gain: { label: "体重を増やす" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["性別を教えてください"] },
      },
      options: {
        male: { label: "男性" },
        female: { label: "女性" },
        other: { label: "その他" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["年齢？"],
          placeholder: "年齢",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["身長"],
          placeholder: "身長（cm）",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["体重"],
          placeholder: "体重（kg）",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["普段どのくらい体を動かしますか？"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "運動なし" },
        few: { label: "1–2", hint: "ときどき運動する" },
        some: { label: "3–4", hint: "週に数回運動する" },
        many: { label: "5+", hint: "ほぼ毎日トレーニング" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["目標体重はどのくらいですか？"],
          placeholder: "目標体重（kg）",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["どのくらいのペースで？"] },
      },
      options: {
        easy: { label: "ゆるやか" },
        steady: { label: "着実" },
        push: { label: "速め" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["カロリーを計算したことはありますか？"] } },
      options: {
        never: { label: "一度もない" },
        stopped: { label: "やってみて、やめた" },
        onoff: { label: "やったりやめたり" },
        now: { label: "今も計算中" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["何が原因でやめましたか？", "あてはまるものをすべて選んでください"],
          variants: {
            onoff: ["何がじゃまになりましたか？", "あてはまるものをすべて選んでください"],
            now: ["何をもっと簡単にしたいですか？", "あてはまるものをすべて選んでください"],
          },
        },
      },
      options: {
        too_long: { label: "時間がかかりすぎた" },
        forgot: { label: "忘れてしまった" },
        invisible: { label: "効果が見えなかった" },
        no_idea: { label: "何を食べればいいか分からなかった" },
        stressful: { label: "ストレスに感じた" },
        nobody: { label: "聞ける人がいなかった" },
        creeping: { label: "体重が少しずつ戻ってきた" },
        not_enough: { label: "十分に食べるのが難しかった" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["記録が難しいのはいつですか？"],
          variants: { never: ["記録が難しくなりそうなのはいつですか？"] },
        },
      },
      options: {
        workdays: { label: "忙しい平日" },
        eating_out: { label: "外食" },
        cooking: { label: "人のために料理" },
        snacks: { label: "間食と飲み物" },
        evenings: { label: "夜と週末" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["決まった食事スタイルはありますか？"] },
      },
      options: {
        balanced: { label: "バランス重視" },
        wholefood: { label: "ホールフード" },
        mediterranean: { label: "地中海式" },
        flexitarian: { label: "フレキシタリアン" },
        pescatarian: { label: "ペスカタリアン" },
        vegetarian: { label: "ベジタリアン" },
        vegan: { label: "ヴィーガン" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["医療上の制限はありますか？"] },
      },
      options: {
        kidneys: { label: "腎臓の疾患" },
        ldl: { label: "高コレステロール" },
        lowsugar: { label: "糖尿病のリスク" },
        none: { label: "どれも当てはまらない" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["どこで食事をしますか？"], placeholder: "検索" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "その他の地域" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["連続記録の目標を選びましょう"] },
      },
      options: {
        "7": { label: "7日" },
        "14": { label: "14日" },
        "30": { label: "30日" },
        "50": { label: "50日" },
      },
    },
  ],
  building: {
    lines: ["あなた専用のプランを作成中"],
    title: "1日のプラン",
    rows: { calories: "カロリー", protein: "タンパク質", carbs: "炭水化物", fat: "脂質", diet: "食事スタイル" },
    limitCap: { ldl: "飽和脂肪酸 ≤ {n}g", kidneys: "ナトリウム ≤ {n}mg" },
    cta: "プランを見る",
    floorTitle: "{floor}kcalで止めました",
    floorBody: "計算上はもっと低くなりましたが、医師の管理なしにこれより低い目標は設定しません。なので、あなたの目標はここになります。日記にもそう表示されます。",
  },
  summary: {
    lines: ["あなたのプランです"],
    kcalLabel: "kcal/日",
    floorMarker: "安全のため上限あり · {floor}未満にはなりません",
    macros: {
      protein: "タンパク質",
      carbs: "炭水化物",
      fat: "脂質",
      satfat: "飽和脂肪酸 · ご希望により",
    },
    capNote: "そのペースだと、安全に続けられる範囲を超えて毎日の摂取量を変える必要があります。そのため、安全なバージョンにしました：1日に体が消費する量の{share}%です。",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "最初の食事を撮影する",
  },
  ui: {
    continueLabel: "続ける",
    saveKept: "保存できませんでした。回答は残っています。「続ける」でもう一度送信します。",
    idlePlaceholder: "Spudにメッセージ…",
    optionContinues: "選択して次へ進みます",
    stepper: { continue: "続ける", less: "減らす", more: "増やす" },
    units: { years: "歳", yearsCount: { one: "{n}歳", other: "{n}歳" } },
  },
  beats: {
    ageWhy: "代謝は年齢とともに変わるので、それも計算に入れます",
    echo: { rest: "安静時：1日{rest}kcal", days: "あなたの一日は{burn}kcalを消費します" },
    baseline: { title: "あなたの現在地です", bmi: "BMI", what: "ボディマス指数" },
    prelim: { title: "あなたのプラン", burn: "あなたが消費", gap: "あなたのペース {delta}", eat: "あなたが食べる", perDay: "kcal/日", keepTitle: "あなたは約{burn}kcalを消費します" },
  },
  target: {
    markers: {
      lowest: "{weight} · 設定できる下限",
      now: "{weight} · 現在",
      nowLowest: "{weight} · 現在 · 設定できる下限",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "おすすめは{weight}。約{pct}%減で、最初の目標にちょうどいいです", up: "おすすめは{weight}。約{pct}%増で、最初の目標にちょうどいいです" },
  },
  pace: {
    rate: "週{rate}",
    rateSuffix: "/週",
    result: "{month}ごろ{target} · 1日{kcal}kcal",
    echo: "{from}から{to}へ。",
  },
  plan: {
    weightTitle: "あなたの体重",
    everyDay: "毎日",
    infoTitle: "あなたの情報",
    basedOn: "あなたの回答にもとづいています",
    changeAnytime: "いつでも変更できます",
    goal: {
      lose: "目標：{month}までに{kg}減",
      gain: "目標：{month}までに{kg}増",
      maintain: "目標：{kg}前後をキープ",
      maintainRange: "範囲：{range}",
    },
    info: {
      startWeight: "開始時の体重", goalWeight: "目標体重", activity: "活動量",
      target: "目標", targetLose: "{month}までに{kg}減", targetGain: "{month}までに{kg}増",
    },
    satFat: { label: "飽和脂肪酸", asked: "飽和脂肪酸 · ご希望により", perDay: "1日{g}以下" },
    first: { title: "最初の一歩", step: "次の食事を撮影してください。eaitが{kcal}kcalと照合します。" },
    loader: { goal: "あなたの目標", lose: "{month}までに−{kg}", gain: "{month}までに+{kg}" },
    chart: { estimateAria: "体重の見込み：現在{from}、{month}ごろ{to}" },
  },
  signup: { heading: "プランを保存", line: "新しいスマホに変えてもプランとサブスクリプションが引き継がれ、食事の記録も残ります。" },
  referral: {
    ask: "友だちからリンクが届きましたか？",
    field: "友だちの招待リンク",
    unknown: "このリンクに該当する人が見つかりません。確認するか、スキップしてください。",
    own: "これはあなた自身のリンクです。ここには友だちのリンクを入力してください。",
    already: "このアカウントはすでに友だちのリンクで登録済みです。",
    paid: "招待リンクは新規メンバー向けです。このアカウントはすでにeaitを購入しています。",
    tryAgain: "もう一度試す",
    skip: "スキップ",
  },
  health: { title: "ヘルスケアと同期", body: "体重とアクティビティを取り込み、食事をヘルスケアに書き込みます。" },
  liveActivity: { titles: ["質問", "あなたのプラン", "あと少し"], go: "続ける" },
  firstMeal: {
    ask: "1食分は無料でどうぞ。写真にしますか、それとも教えてくれますか？",
    react: "大丈夫です。まずは試してみてください",
    photo: "写真を撮る",
    tell: "食べたものを伝える",
    keepGoing: "続ける",
    correct: "食事を修正",
    afterAsk: "これで1食です。毎食こうしてみませんか？",
  },
  refusals: {
    invalid: {
      age: "年齢ではないようです。34のように入力してください。",
      height_cm: "センチメートルで入力してください（例：175）。",
      weight_kg: "キログラムで入力してください。だいたいで大丈夫です。",
      target_weight_kg: "kgの数字で入力してください（例：70）。",
    },
    ambiguousAge: {
      line: "念のため確認させてください。{year}年のことなら、4桁すべて送ってください。",
      confirm: "{age}歳です",
    },
    direction: {
      gain: "今は{weight}kgで、{target}まで増やしたいとのことですが、今の体重からだと増量になりません。目標が変わったなら切り替えられます。そうでなければ{weight}より大きい数字を教えてください。",
      lose: "今は{weight}kgで、{target}まで減らしたいとのことですが、今の体重からだと減量になりません。目標が変わったなら切り替えられます。そうでなければ{weight}より小さい数字を教えてください。",
      switchToLose: "減量に切り替える",
      switchToGain: "増量に切り替える",
      above: "{weight}より大きい数字…",
      below: "{weight}より小さい数字…",
    },
    switched: {
      gain: "切り替えました。増量ですね。何kgを目指しますか？",
    },
  },
};

const PT_BR: OnboardingContent = {
  // Bumped whenever a word below changes, which is what makes the funnel readable: events carry the
  // contentVersion they were recorded against, so "did the new copy help" is a question the data
  // can answer instead of a matter of opinion. v4 cut "No card … nothing to cancel later" from the
  // welcome — the hard paywall sells a subscription behind a seven-day trial, and a trial takes a
  // card, so the line became false the day that shipped. v5 IS THE CHAT FLOW: the copy is Spud's
  // side of a conversation now, so the screens carry `asks` and nothing that described a screen.
  //
  // FIVE, NOT FOUR, AND THE MERGE IS WHY. Both this branch and the paywall's copy fix landed on
  // "4", and the version is the join key between a funnel row and the words that produced it —
  // two different flows sharing one number is exactly the meaningless average the counter exists
  // to prevent. v6 asks for an age rather than a year of birth — and predates the first shipped
  // binary, so the REVERSE dead end (age-worded copy on a binary whose parser wanted a year) has
  // no installed base; reword this question again after launch only behind a client-version gate,
  // because `usableContent` checks structure, not meaning, in that direction. v7 is three
  // questions shorter — why now, the hardest moment and eating out are gone, so a v6 funnel has
  // rows a v7 one cannot, and reading the two under one number would compare a fourteen-place
  // flow with an eleven-place one. The words did not change; the FLOW they are counted against
  // did, and that is the same join the number exists for. v8 rewrites the welcome's second and
  // third lines: the verdict is named before the questions, and the billing sentence is the
  // landing's. v9 (issue #95) replaces the welcome's opening claim: "No email, no name." became
  // "No account needed to start.", because sign-in now asks Apple and Google for the address and
  // the old sentence was a privacy promise the product had stopped keeping. It is the most
  // consequential copy change this file has had, so a funnel row tagged v8 and one tagged v9 were
  // answering under different promises — which is exactly what this number exists to keep apart.
  // The claim cannot come back: `retired-no-email` in `claims.ts` refuses it on the admin write,
  // and `usableWelcome` refuses a stored revision that still carries it on the read. v10 (#609)
  // adds one clause to the weight question: the iPhone app keeps that number current from Apple
  // Health, and a newer one moves the target on every surface, the browser included. v11 grows
  // the country question from four options to fifteen: it offered Germany, the UK, the US and
  // "Somewhere else" while the product shipped in eight languages, so a Vietnamese, Indonesian,
  // Italian, Spanish or Russian reader had exactly one true answer and it was the sentinel. The
  // labels left this file with it — a country's name is CLDR's, not an admin's. Bumped because a
  // funnel row for a four-chip screen and one for a fifteen-chip screen are not the same screen.
  // v12 is the v5 redesign's copy (issue #42): the age question asks "How old are you?" plainly,
  // and the activity options answer in plain frequencies — "A little each week" — rather than
  // effort labels. v13 (#50) drops 'No account needed to start.': the web asks for a sign-in
  // before the first question, and one content tree cannot say it on the phone only.
  // v14 is targets v2 (#81): the activity question's five levels became three — few/some/many —
  // and the sex question gained "other". A stored v13 revision carries neither, so the validator
  // retires it and every language falls back to this.
  //
  // v15 IS ONBOARDING V2 (#82): the conversation becomes Cal AI-shaped plain screens, one question
  // each — twelve screens where seven used to be, the struggles eight became five stored picks,
  // the restrictions screen split into `diet` (seven single-choice) and `medical` (multi-select,
  // "None of these" a drawn row), and the sign-up beat lands between the plan and the country.
  // A stored v14 revision names screens and asks this shape cannot satisfy, so it falls back whole.
  // v16 (#1078): the activity question's three bands became four — 0 / 1–2 / 3–4 / 5+ — and `few`
  // moved from "0–2" to "1–2". A stored v15 labels the new `few` "0–2" and has no `none` at all,
  // so `usableContent` retires it and every language falls back to this. v17 (ieat-app#2050)
  // rewrites the welcome as a title and a subtitle — "A plan built around you" — over the photo.
  version: DEFAULT_ONBOARDING_CONTENT.version,
  welcome: {
    lines: [],
    cta: "Começar",
    signin: "Já tenho uma conta",
  },
  screens: [
    {
      id: "goal",
      asks: {
        goal: { lines: ["O que você quer alcançar?"] },
      },
      options: {
        lose: { label: "Perder peso" },
        maintain: { label: "Manter meu peso" },
        gain: { label: "Ganhar peso" },
      },
    },
    {
      id: "sex",
      asks: {
        sex: { lines: ["Qual é o seu sexo?"] },
      },
      options: {
        male: { label: "Masculino" },
        female: { label: "Feminino" },
        other: { label: "Outro" },
      },
    },
    {
      id: "age",
      asks: {
        // Asked as an AGE and stored as a year — `checkNumber` in `onboarding-chat.ts` converts.
        birth_year: {
          lines: ["Sua idade?"],
          placeholder: "Sua idade",
        },
      },
    },
    {
      id: "height",
      asks: {
        height_cm: {
          lines: ["Altura"],
          placeholder: "Altura em cm",
        },
      },
    },
    {
      id: "weight",
      asks: {
        weight_kg: {
          lines: ["Seu peso"],
          placeholder: "Peso em kg",
        },
      },
    },
    {
      id: "activity",
      asks: {
        activity: {
          lines: ["Quão ativos são seus dias?"],
        },
      },
      options: {
        // Targets v2/#1078: four levels id'd by their icons — the range is the label, the line
        // beneath is the hint.
        none: { label: "0", hint: "Sem treinos" },
        few: { label: "1–2", hint: "Treino de vez em quando" },
        some: { label: "3–4", hint: "Alguns treinos por semana" },
        many: { label: "5+", hint: "Treino quase todo dia" },
      },
    },
    {
      id: "target",
      asks: {
        target_weight_kg: {
          lines: ["Qual peso você quer alcançar?"],
          placeholder: "Peso-meta em kg",
        },
      },
    },
    {
      id: "pace",
      asks: {
        pace: { lines: ["Em que ritmo?"] },
      },
      options: {
        easy: { label: "Leve" },
        steady: { label: "Constante" },
        push: { label: "Rápido" },
      },
    },
    {
      id: "counted",
      asks: { counted_before: { lines: ["Já contou calorias?"] } },
      options: {
        never: { label: "Nunca" },
        stopped: { label: "Tentei, desisti" },
        onoff: { label: "De vez em quando" },
        now: { label: "Ainda conto" },
      },
    },
    {
      id: "barrier",
      asks: {
        barriers: {
          lines: ["O que fez você parar?", "Escolha todas que se aplicam"],
          variants: {
            onoff: ["O que atrapalhou?", "Escolha todas que se aplicam"],
            now: ["O que você gostaria que fosse mais fácil?", "Escolha todas que se aplicam"],
          },
        },
      },
      options: {
        too_long: { label: "Demorava demais" },
        forgot: { label: "Eu esquecia" },
        invisible: { label: "Não via resultados" },
        no_idea: { label: "Não sabia o que comer" },
        stressful: { label: "Era estressante" },
        nobody: { label: "Ninguém para perguntar" },
        creeping: { label: "Meu peso voltava a subir" },
        not_enough: { label: "Difícil comer o suficiente" },
      },
    },
    {
      id: "situation",
      asks: {
        situations: {
          lines: ["Quando é mais difícil registrar?"],
          variants: { never: ["Quando você acha que registrar vai ser mais difícil?"] },
        },
      },
      options: {
        workdays: { label: "Dias de trabalho cheios" },
        eating_out: { label: "Comer fora" },
        cooking: { label: "Cozinhar para outros" },
        snacks: { label: "Lanches e bebidas" },
        evenings: { label: "Fins de tarde e fins de semana" },
      },
    },
    {
      id: "diet",
      asks: {
        diet: { lines: ["Você segue alguma dieta?"] },
      },
      options: {
        balanced: { label: "Equilibrada" },
        wholefood: { label: "Alimentos integrais" },
        mediterranean: { label: "Mediterrânea" },
        flexitarian: { label: "Flexitariana" },
        pescatarian: { label: "Pescetariana" },
        vegetarian: { label: "Vegetariana" },
        vegan: { label: "Vegana" },
      },
    },
    {
      id: "medical",
      asks: {
        medical: { lines: ["Alguma restrição médica?"] },
      },
      options: {
        kidneys: { label: "Doença renal" },
        ldl: { label: "Colesterol alto" },
        lowsugar: { label: "Risco de diabetes" },
        none: { label: "Nenhuma dessas" },
      },
    },
    {
      id: "country",
      asks: {
        country: { lines: ["Onde você come?"], placeholder: "Buscar" },
      },
      // ON, AND ASKED OF ALMOST NOBODY. `enabled` is the admin's switch — "this question may be
      // asked at all" — and it is no longer what decides who meets it. `resolveCountry` does, on
      // both surfaces: a device or a browser that reports a curated region answers the question and
      // it is never put, and only the users whose region we have not tuned for are asked. That is
      // roughly the cost of the old off-switch for almost everyone, and an answer for the people
      // the guess was failing.
      //
      // IT WAS OFF, AND THAT SHIPPED `country = other` TO PROD. An account in Germany was analysed
      // against a country called "other" because the phone reported a region outside the three and
      // nothing asked (#359, #365). Settings could always correct it; nobody knew to.
      //
      // Still the one group that may be switched off at all, because it is the one whose field
      // never reaches `explainTargets`. An admin who switches it off gets the old behaviour back.
      enabled: true,
      options: {
        other: { label: "Outro lugar" },
      },
    },
    {
      id: "streak",
      asks: {
        streak_goal_days: { lines: ["Escolha uma meta de sequência"] },
      },
      options: {
        "7": { label: "7 dias" },
        "14": { label: "14 dias" },
        "30": { label: "30 dias" },
        "50": { label: "50 dias" },
      },
    },
  ],
  building: {
    lines: ["Criando seu plano pessoal"],
    title: "Seu plano diário",
    rows: { calories: "Calorias", protein: "Proteína", carbs: "Carboidratos", fat: "Gordura", diet: "Dieta" },
    limitCap: { ldl: "gordura saturada ≤ {n} g", kidneys: "sódio ≤ {n} mg" },
    cta: "Me mostra o plano",
    floorTitle: "Paramos em {floor}kcal",
    floorBody: "A conta queria ir mais baixo. Não definimos metas abaixo disso sem acompanhamento médico, então a sua fica aqui. Isso também vai aparecer no seu diário.",
  },
  summary: {
    lines: ["Aqui está seu plano"],
    kcalLabel: "kcal por dia",
    floorMarker: "limitado por segurança · nunca abaixo de {floor}",
    macros: {
      protein: "Proteína",
      carbs: "Carboidratos",
      fat: "Gordura",
      satfat: "Gordura saturada · você pediu",
    },
    capNote: "Esse ritmo exige uma mudança diária maior do que é seguro manter, então o seu é a versão segura: {share}% do que seu corpo gasta em um dia.",
    // R0 of the retention plan: onboarding ends with ONE unambiguous instruction, and the thing
    // being asked for is the first photo. "Start logging" points at a diary, which is an empty list
    // and a second decision.
    cta: "Fotografe sua primeira refeição",
  },
  ui: {
    continueLabel: "Continuar",
    saveKept: "Não foi possível salvar. Sua resposta continua aqui. Continuar envia de novo.",
    idlePlaceholder: "Mensagem para o Spud…",
    optionContinues: "Seleciona e continua",
    stepper: { continue: "Continuar", less: "Menos", more: "Mais" },
    units: { years: "anos", yearsCount: { one: "{n} ano", other: "{n} anos" } },
  },
  beats: {
    ageWhy: "Seu metabolismo muda com a idade, por isso levamos isso em conta",
    echo: { rest: "Em repouso: {rest}kcal por dia", days: "Seus dias gastam {burn}kcal" },
    baseline: { title: "Este é seu ponto de partida", bmi: "IMC", what: "Índice de massa corporal" },
    prelim: { title: "Seu plano", burn: "Você gasta", gap: "{delta} seu ritmo", eat: "Você come", perDay: "kcal por dia", keepTitle: "Você gasta cerca de {burn}kcal" },
  },
  target: {
    markers: {
      lowest: "{weight} · o mínimo que definimos",
      now: "{weight} · agora",
      nowLowest: "{weight} · agora · o mínimo que definimos",
      deltaDown: "− {weight}",
      deltaUp: "+ {weight}",
    },
    suggestion: { down: "Sugiro {weight}, cerca de {pct}% a menos, uma boa primeira meta", up: "Sugiro {weight}, cerca de {pct}% a mais, uma boa primeira meta" },
  },
  pace: {
    rate: "{rate} por semana",
    rateSuffix: "por semana",
    result: "{target} por volta de {month} · {kcal}kcal por dia",
    echo: "De {from} para {to}.",
  },
  plan: {
    weightTitle: "Seu peso",
    everyDay: "Todo dia",
    infoTitle: "Seus dados",
    basedOn: "Com base nas suas respostas",
    changeAnytime: "Você pode mudar isso quando quiser",
    goal: {
      lose: "Meta: perder {kg} até {month}",
      gain: "Meta: ganhar {kg} até {month}",
      maintain: "Meta: ficar em torno de {kg}",
      maintainRange: "Faixa: {range}",
    },
    info: {
      startWeight: "Peso inicial", goalWeight: "Peso-meta", activity: "Atividade",
      target: "Meta", targetLose: "perder {kg} até {month}", targetGain: "ganhar {kg} até {month}",
    },
    satFat: { label: "gord. saturada", asked: "Gordura saturada · você pediu", perDay: "≤ {g} por dia" },
    first: { title: "Seu primeiro passo", step: "Fotografe sua próxima refeição. eait a compara com {kcal}kcal." },
    loader: { goal: "Sua meta", lose: "−{kg} até {month}", gain: "+{kg} até {month}" },
    chart: { estimateAria: "Peso estimado: {from} agora, {to} por volta de {month}" },
  },
  signup: { heading: "Salve seu plano", line: "Assim seu plano e sua assinatura vão com você para um novo celular e suas refeições ficam salvas." },
  referral: {
    ask: "Um amigo te mandou um link?",
    field: "Link de convite do amigo",
    unknown: "Esse link não corresponde a ninguém. Confira ou pule.",
    own: "Esse é o seu próprio link. Aqui vai o link de um amigo.",
    already: "Esta conta já entrou com o link de um amigo.",
    paid: "Links de convite são para novos membros, e esta conta já comprou o eait.",
    tryAgain: "Tentar de novo",
    skip: "Pular",
  },
  health: { title: "Sincronizar com o Saúde", body: "Peso e atividade entram. Suas refeições vão para o Saúde." },
  liveActivity: { titles: ["Perguntas", "Seu plano", "Quase lá"], go: "Continuar" },
  firstMeal: {
    ask: "Uma refeição por minha conta. Foto ou prefere me contar?",
    react: "Sem problema. Me teste primeiro",
    photo: "Tirar uma foto",
    tell: "Me conte o que você comeu",
    keepGoing: "Continuar",
    correct: "Corrigir refeição",
    afterAsk: "Essa foi uma. Quer isso em toda refeição?",
  },
  refusals: {
    invalid: {
      age: "Isso não parece uma idade — tente algo como 34.",
      height_cm: "Em centímetros — algo como 175.",
      weight_kg: "Em quilos — um valor aproximado já serve.",
      target_weight_kg: "Um número em kg — como 70.",
    },
    ambiguousAge: {
      line: "Quero ter certeza de que entendi — se você quis dizer o ano {year}, envie os quatro dígitos.",
      confirm: "Tenho {age} anos",
    },
    direction: {
      gain: "Você está com {weight} kg e pediu para ganhar até {target} — isso não é um ganho a partir de agora. Se a meta mudou, podemos trocar; senão, me dê um número acima de {weight}.",
      lose: "Você está com {weight} kg e pediu para perder até {target} — isso não é uma perda a partir de agora. Se a meta mudou, podemos trocar; senão, me dê um número abaixo de {weight}.",
      switchToLose: "Mudar para perder",
      switchToGain: "Mudar para ganhar",
      above: "Um número acima de {weight}…",
      below: "Um número abaixo de {weight}…",
    },
    switched: {
      gain: "Pronto — vamos ganhar. Onde você gostaria de chegar, em kg?",
    },
  },
};

export const ONBOARDING_CONTENT: Localized<OnboardingContent> = {
  en: DEFAULT_ONBOARDING_CONTENT,
  fr: FR,
  de: DE,
  it: IT,
  es: ES,
  vi: VI,
  id: ID,
  ru: RU, te: TE, ta: TA, pa: PA, or: OR, mr: MR, ml: ML, kn: KN, gu: GU, bn: BN, "pt-PT": PT_PT, ms: MS, ca: CA, sl: SL, hr: HR, sk: SK, no: NO, fi: FI, da: DA, hu: HU, el: EL, ro: RO, cs: CS, hi: HI, th: TH, sv: SV, uk: UK, nl: NL, pl: PL, tr: TR, "zh-Hant": ZH_HANT, "zh-Hans": ZH_HANS, ko: KO, ja: JA, "pt-BR": PT_BR,
};

/**
 * What the admin has saved, as the row holds it: a revision per language, and never all of them.
 *
 * `Partial` rather than `Localized`, deliberately — a stored set with no English in it is a host
 * whose admin has edited German and nothing else, which is ordinary. `Localized`'s required `en` is
 * a promise about the COMPILED-IN tables, where it is what makes the fallback total; a stored row
 * is an overlay on those and is allowed to be as sparse as an admin's afternoon.
 */
export type OnboardingContentSet = Partial<Record<Lang, OnboardingContent>>;

/** The compiled-in copy for one language. English for one nobody has written yet. */
export const onboardingContentFor = (lang: Lang): OnboardingContent => t(lang)(ONBOARDING_CONTENT);

/**
 * The stored revision for ONE language, or that language's compiled-in copy.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * THE ADMIN'S SAVE IS PER LANGUAGE, AND THE ROW HOLDS ALL OF THEM
 *
 * `onboarding_content` is one row of jsonb and stays one row: what changed is that the JSON is now
 * `Localized<OnboardingContent>` instead of a bare one. No column, no migration, no second table —
 * and, more to the point, no way for a save in one language to serve itself to a reader of another.
 * An admin edits German, Germans see it, and the Italian a phone renders is the compiled-in one
 * until somebody writes an Italian revision.
 *
 * A LEGACY ROW IS ENGLISH, because English was all there was when it was written. Reading it as
 * every language would hand a German the English an admin typed in 2026 — the exact failure the
 * per-language fallback exists to prevent — so a bare `OnboardingContent` is adopted for `en` only.
 *
 * Each language then goes through `usableContent`, which is the SAME old-app/new-server guard as
 * before, with THIS language's compiled-in copy as the fallback rather than English.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */
export function usableContentFor(lang: Lang, stored: unknown): OnboardingContent {
  // RAW, tokens and all: the admin editor, an experiment's clone and a draft all read this, and a
  // branded copy saved back would write the brand's name into the stored row as plain text.
  // The paths that serve readers brand the result (`onboardingServedFor`).
  const fallback = ONBOARDING_CONTENT[lang] ?? ONBOARDING_CONTENT.en;
  if (typeof stored !== "object" || stored === null) return fallback;
  // A bare revision — the shape saved before this branch. English, and nothing else.
  const legacy = Array.isArray((stored as { screens?: unknown }).screens);
  const candidate = legacy ? (lang === "en" ? stored : undefined) : (stored as Record<string, unknown>)[lang];
  return candidate === undefined ? fallback : usableContent(candidate, fallback);
}

/** Every language's stored revision, read back for a save that must not clobber its neighbours. */
export function storedContentSet(stored: unknown): OnboardingContentSet {
  if (typeof stored !== "object" || stored === null) return {};
  if (Array.isArray((stored as { screens?: unknown }).screens)) return { en: stored as OnboardingContent };
  return { ...(stored as OnboardingContentSet) };
}
