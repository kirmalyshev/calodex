// The server-composed messages this product sends, and the arithmetic that decides which.
//
// THIS HEADER WAS WRITTEN FOR TWO MESSAGES AND IS KEPT FOR WHAT IT STILL EXPLAINS (the trial reminder
// and the 20:30 line). It is no longer the whole list: `NOTIFICATION_IDS` carries six ids, the
// phone schedules per-meal LOCAL reminders (`meal-reminders.ts`, #902) and the server sends the same
// slots as web push to browsers (`engine/meal-slots.ts`, #2149). There is no "one message a day"
// rule any more (ieat-app#1965, Kirill 10 Oct): what bounds a day is one claim per (account, local
// day, SENDER) and the account's own `push_daily_max`, both in `claimSend` (`engine/notify.ts`).
// What is promised to the person is still told by the scripted lines.
//
// The scripted `trial-started` and `trial-day-one` lines (`chat-copy.ts`) promise exactly two:
// "I'll remind you the day before it ends, never the day after" (ieat-app#1591: the 3-day trial
// gets ONE trial-ends reminder, not two), and "At 20:30 you get one line — today against the plan,
// and one concrete thing for tomorrow." Nothing else may be sent by these two. There is no
// cross-sender daily cap (ieat-app#1965): the trial-ends day carries the phone's reminder AND the
// evening line, which is still exactly the two the scripted lines promise.
//
// It lives in shared because both sides need the same answers. The phone schedules the trial
// reminder LOCALLY, off `entitlement.expiresAt`, so it can fire it with no network and cancel
// it the moment the server says the trial converted; the server composes and pushes the 20:30
// line, because a local notification cannot carry a sentence about a day it has not seen. Two
// implementations of "which day is the last" would drift silently, and the symptom would be a
// reminder on the day after — the one thing the copy promises never happens.
//
// The WORDS are admin-editable and the SHAPE is not, the same split onboarding content makes:
// `validateNotificationCopy` runs on the WRITE, so a placeholder the composer cannot fill or a
// health claim never reaches a lock screen.

import { lintCopy } from "./claims.ts";
import { localDate, localTime } from "./dates.ts";
import { trialReminder, type Entitlement } from "./entitlement.ts";
import { genderedRussian, kcalNumbers, wholeNumbers, t, type Localized } from "./lang.ts";
import type { FoodTargets, Goal, Lang } from "./types.ts";

/** Every message that may be sent. Adding one is a product decision, not a copy edit. */
export const NOTIFICATION_IDS = [
  "trial-end", "evening", "nudge", "onboarding-start", "onboarding-photo", "streak-risk",
] as const;
export type NotificationId = (typeof NOTIFICATION_IDS)[number];

export interface NotificationMessage {
  title: string;
  body: string;
  /**
   * `evening` only: the body for a day with nothing logged.
   *
   * A separate string rather than a clever substitution, because "0 of your 2,100kcal today" is
   * an accusation and the recovery framing R1 asks for is a different sentence, not a smaller
   * number. It cannot carry `{eaten}` — there is nothing eaten — and the validator says so.
   */
  emptyBody?: string;
  /**
   * Rotation: further bodies for the same title, by variant name (`v2`…). Present only on the
   * triggers (`onboarding-*`, `streak-risk`), which send a different line on each occasion.
   */
  alternates?: Record<string, string>;
}

export type NotificationCopy = Record<NotificationId, NotificationMessage>;

/**
 * What each field may interpolate, and what it MUST.
 *
 * Same discipline as `SCRIPTED_PARAMS` in `chat.ts`: the composer fills a declared set, so an
 * admin cannot introduce a placeholder that renders as a literal `{weight}` on somebody's lock
 * screen, and cannot delete one the sentence needs to mean anything. Titles take none — a title is
 * read at a glance and a number in it is a number without its sentence.
 */
export const NOTIFICATION_PLACEHOLDERS: Record<string, readonly string[]> = {
  "trial-end.title": [], "trial-end.body": [],
  "evening.title": [], "evening.body": ["eaten", "plan", "tomorrow"],
  "evening.emptyBody": ["plan", "tomorrow"],
  "nudge.title": [], "nudge.body": [],
  "onboarding-start.title": [], "onboarding-start.body": [],
  "onboarding-photo.title": [], "onboarding-photo.body": [],
  "streak-risk.title": [], "streak-risk.body": [],
};

/** iOS truncates well before these; they are a bound on abuse, not a design guide. */
export const MAX_NOTIFICATION_TITLE = 60;
export const MAX_NOTIFICATION_BODY = 240;

/**
 * The shipped words.
 *
 * The reminder says what happens and how to stop it, and nothing else: no countdown, no
 * "you'll lose your progress", no second pitch. Step 15's rules for the sheet apply to the
 * messages that follow from it — the trial was sold once, and a reminder that sells it again is
 * the reason people turn notifications off.
 */
export const DEFAULT_NOTIFICATION_COPY: NotificationCopy = {
  "trial-end": {
    title: "Trial ends tomorrow",
    // A CANCELLATION leaves the expiry where it was, so somebody who has already stopped it
    // still gets this message, and every language's words must stay true for them: never announce
    // that a subscription is about to start.
    body: "Want out? Settings › Subscriptions. Otherwise it renews on its own.",
  },
  evening: {
    title: "How today went",
    body: "You ate {eaten} of your {plan}kcal today. {tomorrow}",
    emptyBody: "Quiet day in the diary, and that happens. {plan}kcal is still the number. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Still want your plan?",
    body: "I saved your answers. The rest takes a couple of minutes.",
    alternates: { v2: "Come back when you have a minute. I kept your place.", v3: "Whenever you're ready, the last questions are where you left them.", v4: "I need a few more answers before I can work out your number." },
  },
  "onboarding-photo": {
    title: "Your plan's ready",
    body: "Log your first meal. Just snap a photo of what you're eating.",
    alternates: { v2: "I'd like to see what you're having today.", v3: "Start with whatever's next, coffee included.", v4: "Point the camera at your next meal and I'll do the counting." },
  },
  "streak-risk": {
    title: "Good few days",
    body: "You've logged the last few days. How's today looking?",
    alternates: { v2: "Nice to see you most days. What's on today's plate?", v3: "Busy day? Add whatever you remember.", v4: "Same as the last few days? Show me what you eat next." },
  },
  nudge: {
    title: "Quick one",
    body: "What have you eaten so far today? Tell me and I'll do the sums.",
  },
};

/**
 * Every message in every language, and the stored row's shape.
 *
 * `en` IS `DEFAULT_NOTIFICATION_COPY` itself, so the admin's reset, the merge in `engine/notify.ts`
 * and every test go on looking in the one place they already look.
 */
export const NOTIFICATION_COPY: Localized<NotificationCopy> = {
  en: DEFAULT_NOTIFICATION_COPY,
  fr: {
    "trial-end": {
      title: "Ton essai finit demain",
      body: "Pour annuler, c'est dans Réglages › Abonnements. Sinon, il se renouvelle tout seul.",
    },
    evening: {
      title: "Bilan du jour",
      body: "Aujourd'hui, tu es à {eaten} sur tes {plan}kcal. {tomorrow}",
      emptyBody: "Rien de noté aujourd'hui, aucun souci. On reste sur {plan}kcal. {tomorrow}",
    },
    "onboarding-start": {
      title: "On finit ton plan ?",
      body: "Tes réponses sont bien enregistrées. Il ne reste que deux minutes.",
      alternates: { v2: "Reprends quand tu as une minute, c'est presque terminé.", v3: "Dès que tu as un moment, les dernières questions t'attendent.", v4: "Encore deux ou trois questions pour finaliser ton objectif quotidien." },
    },
    "onboarding-photo": {
      title: "Ton plan est prêt",
      body: "Note ton premier repas. Prends simplement en photo ce que tu manges.",
      alternates: { v2: "Envoie une petite photo de ce que tu manges aujourd'hui.", v3: "Commence par ce que tu prends maintenant, même un simple café.", v4: "Prends ton repas en photo, je m'occupe de calculer les calories." },
    },
    "streak-risk": {
      title: "Belle régularité",
      body: "Tu as bien noté ces derniers jours. Comment se passe ta journée ?",
      alternates: { v2: "Top de te voir aussi régulier. Tu as mangé quoi de bon aujourd'hui ?", v3: "Grosse journée ? Note simplement ce dont tu te souviens.", v4: "On continue sur la lancée ? Montre-moi ce que tu manges après." },
    },
    nudge: {
      title: "Petite question",
      body: "Tu as mangé quoi aujourd'hui ? Dis-moi tout, je calcule les calories.",
    },
  },
  de: {
    "trial-end": {
      title: "Trial endet morgen",
      body: "Kündigen geht über Einstellungen › Abonnements. Sonst verlängert es sich automatisch.",
    },
    evening: {
      title: "So lief dein Tag",
      body: "Heute hast du {eaten} von deinen {plan}kcal gegessen. {tomorrow}",
      emptyBody: "Heute nichts eingetragen, kein Ding. Es bleibt bei {plan}kcal. {tomorrow}",
    },
    "onboarding-start": {
      title: "Plan noch fertig machen?",
      body: "Deine Antworten sind gespeichert. Der Rest dauert nur zwei Minuten.",
      alternates: { v2: "Mach einfach weiter, wenn du kurz Zeit hast. Es fehlt nicht mehr viel.", v3: "Wenn du soweit bist: die letzten Fragen warten schon auf dich.", v4: "Noch ein paar kurze Fragen, dann steht dein Tagesplan." },
    },
    "onboarding-photo": {
      title: "Dein Plan steht",
      body: "Trag deine erste Mahlzeit ein. Fotografier einfach, was du isst.",
      alternates: { v2: "Schick einfach ein Foto von dem, was du heute isst.", v3: "Fang einfach mit der nächsten Kleinigkeit an, auch wenn es nur ein Kaffee ist.", v4: "Kurz dein Essen knipsen, das Kalorienzählen übernehme ich." },
    },
    "streak-risk": {
      title: "Guter Lauf",
      body: "Die letzten Tage hast du super mitgemacht. Wie läuft es heute?",
      alternates: { v2: "Läuft doch gut diese Woche. Was gab es heute bei dir?", v3: "Stressiger Tag? Trag einfach ein, woran du dich noch erinnerst.", v4: "Weiter wie bisher? Schick mir einfach dein nächstes Essen." },
    },
    nudge: {
      title: "Kurze Frage",
      body: "Schon was gegessen heute? Sag kurz Bescheid, ich zähle die Kalorien zusammen.",
    },
  },
  it: {
    "trial-end": {
      title: "La prova finisce domani",
      body: "Vuoi disdire? Vai su Impostazioni › Abbonamenti. Altrimenti si rinnova da sola.",
    },
    evening: {
      title: "Com'è andata oggi",
      body: "Oggi sei a {eaten} delle tue {plan}kcal. {tomorrow}",
      emptyBody: "Niente sul diario oggi, nessun problema. L'obiettivo resta {plan}kcal. {tomorrow}",
    },
    "onboarding-start": {
      title: "Finiamo il tuo piano?",
      body: "Le tue risposte sono salvate. Mancano giusto due minuti.",
      alternates: { v2: "Riprendi appena hai un minuto, manca davvero pochissimo.", v3: "Quando ti va, le ultime domande sono qui ad aspettarti.", v4: "Ancora un paio di risposte e il tuo piano giornaliero è pronto." },
    },
    "onboarding-photo": {
      title: "Il tuo piano è pronto",
      body: "Registra il tuo primo pasto. Basta una foto di quello che mangi.",
      alternates: { v2: "Manda una foto di quello che mangi oggi.", v3: "Comincia da quello che prendi adesso, anche solo un caffè.", v4: "Scatta una foto a quello che mangi, a contare le calorie ci penso io." },
    },
    "streak-risk": {
      title: "Bella costanza",
      body: "Hai registrato con costanza in questi giorni. Come va oggi?",
      alternates: { v2: "Bello vederti così costante. Cosa hai mangiato di buono oggi?", v3: "Giornata piena? Segna pure solo quello che ti ricordi.", v4: "Continuiamo come ieri? Fammi vedere cosa mangi dopo." },
    },
    nudge: {
      title: "Domanda al volo",
      body: "Cosa hai mangiato finora oggi? Dimmi pure, alle calorie ci penso io.",
    },
  },
  es: {
    "trial-end": {
      title: "La prueba termina mañana",
      body: "¿Quieres cancelar? Ajustes › Suscripciones. Si no, se renueva automáticamente.",
    },
    evening: {
      title: "Resumen de hoy",
      body: "Hoy llevas {eaten} de tus {plan}kcal. {tomorrow}",
      emptyBody: "Hoy no has anotado nada, no pasa nada. Seguimos con {plan}kcal. {tomorrow}",
    },
    "onboarding-start": {
      title: "¿Seguimos con tu plan?",
      body: "Tus respuestas están guardadas. Solo te quedan dos minutos.",
      alternates: { v2: "Sigue cuando tengas un momento, ya casi lo tienes terminado.", v3: "Cuando te venga bien, las últimas preguntas te están esperando.", v4: "Solo un par de respuestas más y te dejo listo el plan diario." },
    },
    "onboarding-photo": {
      title: "Tu plan está listo",
      body: "Registra tu primera comida. Solo haz una foto de lo que comes.",
      alternates: { v2: "Mándame una foto de lo que comas hoy.", v3: "Empieza con lo próximo que tomes, aunque sea un café.", v4: "Sácale foto a tu próxima comida y yo me encargo de las calorías." },
    },
    "streak-risk": {
      title: "Buena racha",
      body: "Llevas varios días apuntando todo muy bien. ¿Cómo va hoy?",
      alternates: { v2: "Qué bien verte tan constante. ¿Qué has comido hoy?", v3: "¿Día ajetreado? Apunta lo que te acuerdes.", v4: "¿Seguimos como estos días? Enséñame lo próximo que comas." },
    },
    nudge: {
      title: "Una pregunta rápida",
      body: "¿Qué has comido hoy? Cuéntame y te calculo las calorías.",
    },
  },
  vi: {
    "trial-end": {
      title: "Mai hết dùng thử",
      body: "Muốn hủy? Vào Cài đặt › Gói đăng ký. Nếu không, gói sẽ tự động gia hạn.",
    },
    evening: {
      title: "Hôm nay thế nào",
      body: "Hôm nay bạn đã ăn {eaten} trên {plan}kcal. {tomorrow}",
      emptyBody: "Hôm nay chưa ghi món nào, không sao cả. Mục tiêu vẫn là {plan}kcal. {tomorrow}",
    },
    "onboarding-start": {
      title: "Hoàn thành kế hoạch nhé?",
      body: "Câu trả lời của bạn đã được lưu. Chỉ mất thêm hai phút thôi.",
      alternates: { v2: "Khi nào rảnh vào làm tiếp nhé, chỉ còn một chút nữa thôi.", v3: "Khi nào tiện bạn cứ quay lại, mấy câu hỏi cuối vẫn đợi ở đây.", v4: "Chỉ vài câu trả lời nữa là có ngay kế hoạch calo mỗi ngày của bạn." },
    },
    "onboarding-photo": {
      title: "Kế hoạch đã sẵn sàng",
      body: "Ghi bữa ăn đầu tiên của bạn. Chỉ cần chụp ảnh món bạn đang ăn.",
      alternates: { v2: "Hôm nay ăn gì thì chụp gửi mình xem với nhé.", v3: "Bắt đầu từ món tiếp theo bạn dùng nhé, kể cả ly cà phê.", v4: "Chụp ảnh bữa ăn tiếp theo, việc tính calo cứ để mình lo." },
    },
    "streak-risk": {
      title: "Đang vào guồng",
      body: "Mấy hôm nay bạn ghi chép rất đều. Hôm nay thế nào rồi?",
      alternates: { v2: "Thấy bạn duy trì đều đặn thế này vui ghê. Hôm nay bạn ăn gì ngon rồi?", v3: "Hôm nay bận rộn quá à? Nhớ được món gì thì cứ ghi lại nhé.", v4: "Tiếp tục duy trì nhé? Cho mình xem món tiếp theo bạn ăn." },
    },
    nudge: {
      title: "Hỏi nhanh chút",
      body: "Từ sáng đến giờ bạn ăn gì rồi? Nhắn mình để mình tính calo cho.",
    },
  },
  id: {
    "trial-end": {
      title: "Trial berakhir besok",
      body: "Mau berhenti? Pengaturan › Langganan. Kalau tidak, langganan diperpanjang otomatis.",
    },
    evening: {
      title: "Catatan hari ini",
      body: "Hari ini sudah masuk {eaten} dari target {plan}kcal. {tomorrow}",
      emptyBody: "Hari ini belum ada catatan, santai saja. Targetmu tetap {plan}kcal. {tomorrow}",
    },
    "onboarding-start": {
      title: "Masih mau lanjut buat plan?",
      body: "Jawabanmu sudah tersimpan. Sisanya cuma perlu dua menit.",
      alternates: { v2: "Buka lagi pas senggang. Semuanya sudah tersimpan aman.", v3: "Kalau sudah siap, pertanyaan terakhir masih menunggumu di sini.", v4: "Tinggal beberapa pertanyaan lagi buat hitung target harianmu." },
    },
    "onboarding-photo": {
      title: "Plan kamu sudah siap",
      body: "Catat makan pertamamu. Cukup foto makanan yang kamu santap.",
      alternates: { v2: "Coba tunjukkan makananmu hari ini.", v3: "Mulai dari apa pun selanjutnya, kopi juga dihitung.", v4: "Arahkan kamera ke makananmu, biar aku yang hitung kalorinya." },
    },
    "streak-risk": {
      title: "Langkah bagus",
      body: "Beberapa hari kemarin sudah tercatat. Bagaimana dengan hari ini?",
      alternates: { v2: "Senang melihatmu aktif tiap hari. Ada apa di piring hari ini?", v3: "Lagi sibuk? Catat saja seingatmu.", v4: "Sama seperti kemarin-kemarin? Tunjukkan apa yang kamu makan berikutnya." },
    },
    nudge: {
      title: "Tanya sebentar",
      body: "Sudah makan apa saja hari ini? Kasih tahu, biar aku yang hitung.",
    },
  },
  ru: {
    "trial-end": {
      title: "Завтра кончается триал",
      body: "Отменить можно тут: Настройки › Подписки. Если всё ок, ничего делать не надо.",
    },
    evening: {
      title: "Как день?",
      body: "Сегодня у тебя {eaten} из {plan}ккал. {tomorrow}",
      emptyBody: "Сегодня пусто, бывает. План всё тот же, {plan}ккал. {tomorrow}",
    },
    "onboarding-start": {
      title: "Доделаем план?",
      body: "Осталась пара вопросов, ответы сохранены.",
      alternates: { v2: "Загляни, когда будет минутка. Продолжишь с того же места.", v3: "Последние вопросы никуда не делись, это пара минут.", v4: "Ещё пара ответов, и я посчитаю твой план." },
    },
    "onboarding-photo": {
      title: "План есть",
      body: "Запишите первый приём пищи. Просто сфотографируйте, что едите.",
      alternates: { v2: "Что у тебя сегодня на тарелке? Покажи.", v3: "Начать можно хоть с кофе.", v4: "Ты фоткаешь, я считаю. Договорились?" },
    },
    "streak-risk": {
      title: "Хорошо идёшь",
      body: "Последние дни всё записано. А как сегодня?",
      alternates: { v2: "Ты заходишь почти каждый день, это радует. Что сегодня ешь?", v3: "Закрутило сегодня? Добавь, что помнишь.", v4: "Сфоткай, что будешь есть, а я посчитаю." },
    },
    nudge: {
      title: "Как день?",
      body: "Что сегодня было из еды? Покажи, я посчитаю.",
    },
  },
  sq: {
  "trial-end": {
    title: "Prova mbaron nesër",
    body: "Do ta ndërpresësh? Cilësimet › Abonimet. Përndryshe rinovohet vetë.",
  },
  evening: {
    title: "Si shkoi dita",
    body: "Sot ke shënuar {eaten} nga {plan}kcal e tua. {tomorrow}",
    emptyBody: "Asgjë në ditar sot, ndodh. Plani yt mbetet {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "E do akoma planin tënd?",
    body: "Përgjigjet e tua janë ruajtur. Pjesa tjetër zgjat nja dy minuta.",
    alternates: { v2: "Kthehu kur të kesh një minutë. Çdo gjë është e ruajtur.", v3: "Kur të kesh kohë, pyetjet e fundit po të presin këtu.", v4: "Më duhen edhe disa përgjigje për të llogaritur planin tënd ditor." },
  },
  "onboarding-photo": {
    title: "Plani është gati",
    body: "Regjistro vaktin e parë. Thjesht bëj një foto të asaj që po ha.",
    alternates: { v2: "Më trego çfarë po ha sot.", v3: "Fillo me çfarëdo që ke radhën, edhe kafeja numërohet.", v4: "Drejtoje kamerën nga ushqimi dhe unë i numëroj kaloritë." },
  },
  "streak-risk": {
    title: "Ritëm i mirë",
    body: "Ditët e fundit janë regjistruar. Si duket dita sot?",
    alternates: { v2: "Kënaqësi të të shoh kaq shpesh. Çfarë ke sot në pjatë?", v3: "Ditë e ngarkuar? Shëno çfarëdo që të kujtohet.", v4: "Si ditët e fundit? Më trego çfarë do të hash tani." },
  },
  nudge: {
    title: "Pyetje e shpejtë",
    body: "Çfarë ke ngrënë sot deri tani? Më thuaj dhe unë i bëj llogaritë.",
  },
},
  bg: {
  "trial-end": {
    title: "Триалът свършва утре",
    body: "Искаш да спреш? Настройки › Абонаменти. Иначе се подновява автоматично.",
  },
  evening: {
    title: "Как мина денят",
    body: "За днес имаш записани {eaten} от твоите {plan}ккал. {tomorrow}",
    emptyBody: "Днес нищо не е записано, случва се. Числото си остава {plan}ккал. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Планът още ли ти трябва?",
    body: "Отговорите ти са запазени. Останаха още две минути.",
    alternates: { v2: "Върни се, когато имаш минута. Всичко е запазено.", v3: "Когато имаш време, останаха само последните въпроси.", v4: "Останаха още няколко въпроса, за да изчисля дневния ти план." },
  },
  "onboarding-photo": {
    title: "Планът ти е тук",
    body: "Запиши първото си хранене. Просто снимай какво ядеш.",
    alternates: { v2: "Покажи какво хапваш днес.", v3: "Започни със следващото ядене, дори да е само кафе.", v4: "Насочи камерата към храната и аз ще пресметна калориите." },
  },
  "streak-risk": {
    title: "Добро темпо",
    body: "Последните дни са записани. Как е днес?",
    alternates: { v2: "Хубаво е да се виждаме редовно. Какво има в чинията днес?", v3: "Натоварен ден? Запиши каквото се сетиш.", v4: "Както предишните дни? Покажи какво ще хапнеш." },
  },
  nudge: {
    title: "Бърз въпрос",
    body: "Какво хапна днес досега? Кажи ми и ще сметна всичко.",
  },
},
  te: {
  "trial-end": {
    title: "ట్రయల్ రేపటితో ముగుస్తుంది",
    body: "క్యాన్సిల్ చేయాలనుకుంటున్నారా? సెట్టింగ్‌లు › సబ్‌స్క్రిప్షన్‌లు లోకి వెళ్లండి. లేదంటే ఆటోమేటిక్‌గా రెన్యూ అవుతుంది.",
  },
  evening: {
    title: "ఈరోజు ఎలా గడిచింది",
    body: "ఈరోజు మీ {plan}kcalలో {eaten} పూర్తయ్యాయి. {tomorrow}",
    emptyBody: "ఈరోజు డైరీలో ఏమీ రాయలేదు, ఏమీ పర్లేదు. లక్ష్యం ఇంకా {plan}kcal మాత్రమే. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "ప్లాన్ పూర్తి చేద్దామా?",
    body: "మీ సమాధానాలు సేవ్ చేశాను. ఇంకో రెండు నిమిషాలు అంతే.",
    alternates: { v2: "కాస్త సమయం దొరికినప్పుడు కొనసాగించండి, దాదాపు పూర్తయిపోయింది.", v3: "ఖాళీ ఉన్నప్పుడు రండి, చివరి కొన్ని ప్రశ్నలు మీ కోసం ఎదురుచూస్తున్నాయి.", v4: "ఇంకో రెండు మూడు ప్రశ్నలకు సమాధానమిస్తే మీ రోజువారీ ప్లాన్ సిద్ధమవుతుంది." },
  },
  "onboarding-photo": {
    title: "ప్లాన్ సిద్ధమైంది",
    body: "మీ మొదటి భోజనాన్ని నమోదు చేయండి. మీరు తింటున్న దాని ఫోటో తీస్తే చాలు.",
    alternates: { v2: "ఈరోజు ఏమి తింటున్నా ఒక ఫోటో తీసి పంపండి.", v3: "తర్వాత తీసుకునే దానితోనే మొదలుపెట్టండి, టీ లేదా కాఫీ అయినా ఫర్వాలేదు.", v4: "తర్వాతి భోజనాన్ని ఫోటో తీయండి, క్యాలరీలు లెక్కించే పని నాది." },
  },
  "streak-risk": {
    title: "మంచి ట్రాక్",
    body: "గత కొన్ని రోజులుగా క్రమం తప్పకుండా నమోదు చేశారు. మరి ఈరోజు ఎలా ఉంది?",
    alternates: { v2: "రోజూ ఇలా నమోదు చేయడం చూస్తుంటే బాగుంది. ఈరోజు ఏం తిన్నారు?", v3: "ఈరోజు చాలా బిజీగా గడిచిందా? గుర్తున్నంత వరకు రాస్తే చాలు.", v4: "అలాగే కొనసాగిద్దామా? తర్వాత ఏం తింటారో నాకు చూపించండి." },
  },
  nudge: {
    title: "చిన్న ప్రశ్న",
    body: "ఈరోజు ఇప్పటిదాకా ఏమేం తిన్నారు? చెప్తే క్యాలరీల లెక్క నేను వేస్తాను.",
  },
},
  ta: {
  "trial-end": {
    title: "டிரையல் நாளை முடிகிறது",
    body: "நிறுத்த வேண்டுமா? அமைப்புகள் › சந்தாக்கள் செல்லவும். இல்லையென்றால் தானாகவே புதுப்பிக்கப்படும்.",
  },
  evening: {
    title: "இன்றைய பதிவு",
    body: "இன்று உங்கள் {plan}kcal இலக்கில் {eaten} சாப்பிட்டுள்ளீர்கள். {tomorrow}",
    emptyBody: "இன்று எதுவும் பதிவு செய்யவில்லை, பரவாயில்லை. இலக்கு இன்னும் {plan}kcal தான். {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "திட்டம் தொடர விருப்பமா?",
    body: "உங்கள் பதில்கள் சேமிக்கப்பட்டுள்ளன. மீதமுள்ளவை இரண்டு நிமிடங்களில் முடிந்துவிடும்.",
    alternates: { v2: "நேரம் கிடைக்கும்போது வாருங்கள். எல்லாம் பத்திரமாக சேமிக்கப்பட்டுள்ளது.", v3: "நீங்கள் தயாராக இருக்கும்போது வாருங்கள், கடைசி கேள்விகள் இங்கேயே உள்ளன.", v4: "இன்னும் சில கேள்விகளுக்குப் பதிலளித்தால் உங்கள் தினசரி இலக்கைக் கணக்கிட்டுவிடலாம்." },
  },
  "onboarding-photo": {
    title: "உங்கள் திட்டம் தயார்",
    body: "உங்கள் முதல் உணவைப் பதிவு செய்யுங்கள். சாப்பிடுவதை ஒரு புகைப்படம் எடுத்தால் போதும்.",
    alternates: { v2: "இன்று என்ன சாப்பிடுகிறீர்கள் என்று காட்டுங்கள்.", v3: "அடுத்து சாப்பிடுவதிலிருந்து தொடங்குங்கள், காபியும் கணக்கில் வரும்.", v4: "கேமராவை உணவை நோக்கி வையுங்கள், கலோரிகளை நான் கணக்கிடுகிறேன்." },
  },
  "streak-risk": {
    title: "நல்ல வேகம்",
    body: "கடந்த சில நாட்கள் பதிவாகியுள்ளன. இன்று எப்படிப் போகிறது?",
    alternates: { v2: "உங்களை தினமும் பார்ப்பது மகிழ்ச்சி. இன்று தட்டில் என்ன இருக்கிறது?", v3: "வேலை அதிகமா? நினைவிருப்பதை மட்டும் பதிவு செய்யுங்கள்.", v4: "கடந்த நாட்களைப் போலவே தொடர்வோமா? அடுத்து என்ன சாப்பிடுகிறீர்கள் என்று காட்டுங்கள்." },
  },
  nudge: {
    title: "ஒரு சிறிய கேள்வி",
    body: "இன்று இதுவரை என்ன சாப்பிட்டீர்கள்? சொல்லுங்கள், நான் கணக்கிடுகிறேன்.",
  },
},
  pa: {
  "trial-end": {
    title: "ਟ੍ਰਾਇਲ ਕੱਲ੍ਹ ਖ਼ਤਮ",
    body: "ਕੈਂਸਲ ਕਰਨਾ ਹੈ? ਸੈਟਿੰਗਾਂ › ਸਬਸਕ੍ਰਿਪਸ਼ਨਾਂ ਵਿੱਚ ਜਾਓ। ਨਹੀਂ ਤਾਂ ਇਹ ਆਪਣੇ ਆਪ ਰੀਨਿਊ ਹੋ ਜਾਵੇਗਾ।",
  },
  evening: {
    title: "ਅੱਜ ਦਾ ਹਾਲ",
    body: "ਅੱਜ ਤੁਸੀਂ ਆਪਣੇ {plan}kcal ਵਿੱਚੋਂ {eaten} ਖਾਧੇ। {tomorrow}",
    emptyBody: "ਅੱਜ ਡਾਇਰੀ ਵਿੱਚ ਕੁਝ ਦਰਜ ਨਹੀਂ ਹੋਇਆ, ਕੋਈ ਗੱਲ ਨਹੀਂ। ਟੀਚਾ ਅਜੇ ਵੀ {plan}kcal ਹੀ ਹੈ। {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "ਪਲਾਨ ਪੂਰਾ ਕਰੀਏ?",
    body: "ਤੁਹਾਡੇ ਜਵਾਬ ਸੇਵ ਹਨ। ਬਸ ਦੋ ਮਿੰਟ ਹੋਰ ਲੱਗਣਗੇ।",
    alternates: { v2: "ਜਦੋਂ ਵੀ ਵੇਹਲ ਮਿਲੇ ਪੂਰਾ ਕਰ ਲਵੋ, ਬਸ ਥੋੜ੍ਹਾ ਜਿਹਾ ਹੀ ਬਾਕੀ ਹੈ।", v3: "ਜਦੋਂ ਵੀ ਸਮਾਂ ਲੱਗੇ, ਬਾਕੀ ਸਵਾਲ ਇੱਥੇ ਹੀ ਤੁਹਾਡੀ ਉਡੀਕ ਕਰ ਰਹੇ ਹਨ।", v4: "ਬਸ ਦੋ-ਤਿੰਨ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਹੋਰ, ਅਤੇ ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਪਲਾਨ ਤਿਆਰ।" },
  },
  "onboarding-photo": {
    title: "ਪਲਾਨ ਤਿਆਰ ਹੈ",
    body: "ਆਪਣਾ ਪਹਿਲਾ ਖਾਣਾ ਦਰਜ ਕਰੋ। ਜੋ ਖਾ ਰਹੇ ਹੋ ਉਸਦੀ ਬਸ ਇੱਕ ਫੋਟੋ ਖਿੱਚੋ।",
    alternates: { v2: "ਅੱਜ ਜੋ ਵੀ ਖਾਓ, ਉਸਦੀ ਇੱਕ ਫ਼ੋਟੋ ਭੇਜ ਦਿਓ।", v3: "ਅਗਲੀ ਜੋ ਵੀ ਚੀਜ਼ ਲਵੋ ਉਸੇ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ, ਚਾਹ ਜਾਂ ਕੌਫ਼ੀ ਵੀ ਚੱਲੇਗੀ।", v4: "ਅਗਲੇ ਖਾਣੇ ਦੀ ਫ਼ੋਟੋ ਖਿੱਚੋ, ਕੈਲੋਰੀਆਂ ਗਿਣਨਾ ਮੇਰੇ 'ਤੇ ਛੱਡ ਦਿਓ।" },
  },
  "streak-risk": {
    title: "ਵਧੀਆ ਸਿਲਸਿਲਾ",
    body: "ਪਿਛਲੇ ਕੁਝ ਦਿਨ ਤੁਸੀਂ ਬਹੁਤ ਵਧੀਆ ਤਰੀਕੇ ਨਾਲ ਦਰਜ ਕੀਤਾ। ਅੱਜ ਕਿਵੇਂ ਚੱਲ ਰਿਹਾ ਹੈ?",
    alternates: { v2: "ਤੁਹਾਨੂੰ ਰੋਜ਼ਾਨਾ ਇੰਝ ਲੌਗ ਕਰਦੇ ਵੇਖ ਕੇ ਬਹੁਤ ਚੰਗਾ ਲੱਗਦਾ ਹੈ। ਅੱਜ ਕੀ ਖਾਧਾ?", v3: "ਅੱਜ ਰੁਝੇਵੇਂ ਵਾਲਾ ਦਿਨ ਸੀ? ਜੋ ਵੀ ਯਾਦ ਹੋਵੇ, ਬਸ ਉਹੀ ਲਿਖ ਦਿਓ।", v4: "ਪਹਿਲਾਂ ਵਾਂਗ ਹੀ ਜਾਰੀ ਰੱਖਣਾ ਹੈ? ਅਗਲੀ ਵਾਰ ਜੋ ਵੀ ਖਾਓ, ਦਿਖਾ ਦਿਓ।" },
  },
  nudge: {
    title: "ਛੋਟਾ ਜਿਹਾ ਸਵਾਲ",
    body: "ਅੱਜ ਹੁਣ ਤੱਕ ਕੀ ਕੁਝ ਖਾਧਾ? ਮੈਨੂੰ ਦੱਸੋ, ਕੈਲੋਰੀਆਂ ਦਾ ਹਿਸਾਬ ਮੈਂ ਕਰ ਦਿਆਂਗਾ।",
  },
},
  or: {
  "trial-end": {
    title: "ଟ୍ରାଏଲ୍ କାଲି ଶେଷ ହେବ",
    body: "ବନ୍ଦ କରିବାକୁ ଚାହାନ୍ତି? ସେଟିଂସ୍ › ସବସ୍କ୍ରିପସନ୍ ରେ ଯାଆନ୍ତୁ। ନଚେତ୍ ଏହା ଆପେ ଆପେ ରିନ୍ୟୁ ହୋଇଯିବ।",
  },
  evening: {
    title: "ଆଜିର ଖାଦ୍ୟ ତାଲିକା",
    body: "ଆଜି ଆପଣ {plan}kcal ରୁ {eaten} ଖାଇଛନ୍ତି। {tomorrow}",
    emptyBody: "ଡାଏରୀରେ ଆଜି କିଛି ଲେଖା ହୋଇନାହିଁ, କିଛି କଥା ନାହିଁ। ଲକ୍ଷ୍ୟ ଏବେ ବି {plan}kcal ରହିଛି। {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "ପ୍ଲାନ୍ ତିଆରି କରିବାକୁ ଚାହାନ୍ତି ତ?",
    body: "ଆପଣଙ୍କ ଉତ୍ତର ସବୁ ସାଇତା ହୋଇଛି। ବାକିତକ ପାଇଁ ମାତ୍ର ଦୁଇ ମିନିଟ୍ ଲାଗିବ।",
    alternates: { v2: "ସମୟ ମିଳିଲେ ଫେରିଆସନ୍ତୁ। ସବୁ କିଛି ସାଇତା ହୋଇ ରହିଛି।", v3: "ଯେତେବେଳେ ଇଚ୍ଛା ଆସନ୍ତୁ, ବାକି ପ୍ରଶ୍ନଗୁଡ଼ିକ ଏଠାରେ ଅଛି।", v4: "ଆଉ କେତୋଟି ଉତ୍ତର ଦେଲେ ମୁଁ ଆପଣଙ୍କ ଦୈନିକ ଲକ୍ଷ୍ୟ ସ୍ଥିର କରିଦେବି।" },
  },
  "onboarding-photo": {
    title: "ଆପଣଙ୍କ ପ୍ଲାନ୍ ପ୍ରସ୍ତୁତ",
    body: "ଆପଣଙ୍କ ପ୍ରଥମ ଖାଦ୍ୟ ଲଗ୍ କରନ୍ତୁ। ଯାହା ଖାଉଛନ୍ତି ତାହାର ଗୋଟିଏ ଫଟୋ ନିଅନ୍ତୁ।",
    alternates: { v2: "ଆଜି କଣ ଖାଉଛନ୍ତି ଦେଖାନ୍ତୁ।", v3: "ପରବର୍ତ୍ତୀ ଖାଦ୍ୟରୁ ଆରମ୍ଭ କରନ୍ତୁ, କଫି ମଧ୍ୟ ଚଳିବ।", v4: "ଖାଦ୍ୟ ଆଡ଼କୁ କ୍ୟାମେରା ରଖନ୍ତୁ, କ୍ୟାଲୋରୀ ମୁଁ ଗଣିଦେବି।" },
  },
  "streak-risk": {
    title: "ଭଲ ଗତି ଚାଲିଛି",
    body: "ଗତ କିଛି ଦିନର ହିସାବ ଲେଖା ହୋଇଛି। ଆଜି କେମିତି ଚାଲିଛି?",
    alternates: { v2: "ଆପଣଙ୍କୁ ପ୍ରତିଦିନ ଦେଖି ଖୁସି ଲାଗୁଛି। ଆଜି ଥାଳିରେ କଣ ଅଛି?", v3: "ବ୍ୟସ୍ତ ଥିଲେ କି? ଯାହା ମନେପଡୁଛି ଲେଖିଦିଅନ୍ତୁ।", v4: "ପୂର୍ବ ଦିନମାନଙ୍କ ଭଳି? ଏବେ କଣ ଖାଉଛନ୍ତି ଦେଖାନ୍ତୁ।" },
  },
  nudge: {
    title: "ଛୋଟ ପ୍ରଶ୍ନଟିଏ",
    body: "ଆଜି ଏପର୍ଯ୍ୟନ୍ତ କଣ ଖାଇଛନ୍ତି? ମୋତେ ଜଣାନ୍ତୁ, ମୁଁ ହିସାବ କରିଦେବି।",
  },
},
  mr: {
  "trial-end": {
    title: "ट्रायल उद्या संपते",
    body: "रद्द करायचे आहे? सेटिंग्ज › सबस्क्रिप्शन्स. नाहीतर ते आपोआप रिन्यू होईल.",
  },
  evening: {
    title: "आजचा दिवस कसा राहिला",
    body: "आज तुमच्या {plan}kcal पैकी {eaten} नोंदवले गेले. {tomorrow}",
    emptyBody: "डायरीत आज काहीच नोंद नाही, हरकत नाही. लक्ष्य अजूनही {plan}kcal आहे. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "प्लॅन अजून हवा आहे ना?",
    body: "तुमची उत्तरे सेव्ह केली आहेत. बाकीचे काम दोन मिनिटांत होईल.",
    alternates: { v2: "वेळ मिळेल तेव्हा परत या. सर्व काही सेव्ह आहे.", v3: "जेव्हा तयार असाल तेव्हा शेवटचे प्रश्न इथेच आहेत.", v4: "आणखी काही प्रश्नांची उत्तरे द्या, म्हणजे रोजचा प्लॅन ठरवता येईल." },
  },
  "onboarding-photo": {
    title: "प्लॅन तयार आहे",
    body: "तुमचे पहिले जेवण नोंदवा. जे खात आहात त्याचा फक्त एक फोटो काढा.",
    alternates: { v2: "आज काय खाताय ते दाखवा.", v3: "पुढच्या खाण्यापासून सुरुवात करा, कॉफीसुद्धा चालेल.", v4: "कॅमेरा जेवणाकडे धरा, कॅलरी मोजण्याचे काम मी करतो." },
  },
  "streak-risk": {
    title: "छान सुरू आहे",
    body: "गेल्या काही दिवसांची नोंद झाली आहे. आज काय परिस्थिती आहे?",
    alternates: { v2: "तुम्हाला रोज पाहून छान वाटते. आज ताटात काय आहे?", v3: "व्यस्त दिवस होता? जे काही आठवत असेल तेवढे नोंदवा.", v4: "गेल्या काही दिवसांसारखेच? पुढे काय खाणार ते दाखवा." },
  },
  nudge: {
    title: "छोटासा प्रश्न",
    body: "आज आत्तापर्यंत काय खाल्ले? मला सांगा, मी हिशोब करतो.",
  },
},
  ml: {
  "trial-end": {
    title: "ട്രയൽ നാളെ തീരും",
    body: "റദ്ദാക്കണോ? ക്രമീകരണം › സബ്സ്ക്രിപ്ഷനുകൾ എന്നതിൽ പോകുക. അല്ലെങ്കിൽ തനിയെ റിന്യൂ ആകും.",
  },
  evening: {
    title: "ഇന്നത്തെ വിശേഷം",
    body: "ഇന്ന് നിങ്ങളുടെ {plan}kcal-ൽ {eaten} പൂർത്തിയായി. {tomorrow}",
    emptyBody: "ഇന്ന് ഡയറിയിൽ ഒന്നും കുറിച്ചില്ല, അതൊരു പ്രശ്നമല്ല. ലക്ഷ്യം ഇപ്പോഴും {plan}kcal തന്നെയാണ്. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "പ്ലാൻ പൂർത്തിയാക്കാം?",
    body: "നിങ്ങളുടെ ഉത്തരങ്ങൾ സേവ് ചെയ്തിട്ടുണ്ട്. ബാക്കിക്ക് വെറും രണ്ട് മിനിറ്റ് മതി.",
    alternates: { v2: "സമയം കിട്ടുമ്പോൾ ബാക്കി ചെയ്യാം, ഇനി വളരെ കുറച്ചേ ബാക്കിയുള്ളൂ.", v3: "സൗകര്യപ്പെടുമ്പോൾ വരൂ, അവസാനത്തെ ഏതാനും ചോദ്യങ്ങൾ ഇവിടെയുണ്ട്.", v4: "രണ്ടുമൂന്ന് ചോദ്യങ്ങൾക്ക് കൂടി ഉത്തരം നൽകിയാൽ നിങ്ങളുടെ പ്ലാൻ തയ്യാറാകും." },
  },
  "onboarding-photo": {
    title: "പ്ലാൻ റെഡിയാണ്",
    body: "നിങ്ങളുടെ ആദ്യ ഭക്ഷണം രേഖപ്പെടുത്തൂ. കഴിക്കുന്നതിന്റെ ഒരു ഫോട്ടോ എടുത്താൽ മതി.",
    alternates: { v2: "ഇന്ന് എന്ത് കഴിച്ചാലും ഒരു ഫോട്ടോ അയച്ചു തരൂ.", v3: "അടുത്തതായി എന്ത് കഴിച്ചാലും അതോടെ തുടങ്ങാം, ഒരു കാപ്പി ആയാലും മതി.", v4: "അടുത്ത ഭക്ഷണത്തിന്റെ ഫോട്ടോ എടുക്കൂ, കലോറി കണക്കുകൂട്ടൽ ഞാൻ നോക്കിക്കോളാം." },
  },
  "streak-risk": {
    title: "നല്ല തുടർച്ച",
    body: "കഴിഞ്ഞ ദിവസങ്ങളിൽ നിങ്ങൾ കൃത്യമായി രേഖപ്പെടുത്തിയിരുന്നു. ഇന്ന് എങ്ങനെയുണ്ട്?",
    alternates: { v2: "എല്ലാ ദിവസവും ഇങ്ങനെ രേഖപ്പെടുത്തുന്നത് കാണാൻ നല്ല രസമുണ്ട്. ഇന്ന് എന്തൊക്കെ കഴിച്ചു?", v3: "ഇന്ന് നല്ല തിരക്കായിരുന്നോ? ഓർമ്മയുള്ളത് മാത്രം ചേർത്താൽ മതി.", v4: "പഴയതുപോലെ തുടരാം? അടുത്തതായി എന്ത് കഴിച്ചാലും കാണിച്ചു തരൂ." },
  },
  nudge: {
    title: "ചെറിയൊരു ചോദ്യം",
    body: "ഇന്ന് ഇതുവരെ എന്തൊക്കെ കഴിച്ചു? പറഞ്ഞോളൂ, കലോറി കണക്ക് ഞാൻ നോക്കിക്കോളാം.",
  },
},
  kn: {
  "trial-end": {
    title: "ಟ್ರಯಲ್ ನಾಳೆ ಮುಗಿಯುತ್ತೆ",
    body: "ಕ್ಯಾನ್ಸಲ್ ಮಾಡಬೇಕೆ? ಸೆಟ್ಟಿಂಗ್‌ಗಳು › ಚಂದಾದಾರಿಕೆಗಳು ಗೆ ಹೋಗಿ. ಇಲ್ಲದಿದ್ದರೆ ತಾನಾಗಿಯೇ ರಿನ್ಯೂ ಆಗುತ್ತದೆ.",
  },
  evening: {
    title: "ಇಂದಿನ ವಿವರ",
    body: "ಇಂದು ನಿಮ್ಮ {plan}kcal ಗುರಿಯಲ್ಲಿ {eaten} ಮುಗಿದಿದೆ. {tomorrow}",
    emptyBody: "ಇಂದು ಡೈರಿಯಲ್ಲಿ ಏನೂ ಬರೆದಿಲ್ಲ, ಪರವಾಗಿಲ್ಲ. ಗುರಿ ಇನ್ನೂ {plan}kcal ಆಗಿದೆ. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "ಪ್ಲಾನ್ ಪೂರ್ಣಗೊಳಿಸಬೇಕೆ?",
    body: "ನಿಮ್ಮ ಉತ್ತರಗಳು ಸೇವ್ ಆಗಿವೆ. ಇನ್ನು ಕೇವಲ ಎರಡು ನಿಮಿಷದ ಕೆಲಸ.",
    alternates: { v2: "ಸ್ವಲ್ಪ ಸಮಯ ಸಿಕ್ಕಾಗ ಮುಂದುವರಿಸಿ, ಇನ್ನು ಸ್ವಲ್ಪವೇ ಬಾಕಿ ಇದೆ.", v3: "ಪುರುಸೊತ್ತಾದಾಗ ಬನ್ನಿ, ಕೊನೆಯ ಕೆಲವು ಪ್ರಶ್ನೆಗಳು ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿವೆ.", v4: "ಇನ್ನೊಂದೆರಡು ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿದರೆ ನಿಮ್ಮ ದಿನದ ಪ್ಲಾನ್ ಸಿದ್ಧವಾಗುತ್ತದೆ." },
  },
  "onboarding-photo": {
    title: "ಪ್ಲಾನ್ ಸಿದ್ಧವಾಗಿದೆ",
    body: "ನಿಮ್ಮ ಮೊದಲ ಊಟವನ್ನು ದಾಖಲಿಸಿ. ತಿನ್ನುತ್ತಿರುವುದರ ಒಂದು ಫೋಟೋ ತೆಗೆದರೆ ಸಾಕು.",
    alternates: { v2: "ಇಂದು ನೀವು ಏನೇ ತಿಂದರೂ ಒಂದು ಫೋಟೋ ಕಳುಹಿಸಿ.", v3: "ಮುಂದೆ ತೆಗೆದುಕೊಳ್ಳುವ ಯಾವುದರಿಂದಾದರೂ ಶುರುಮಾಡಿ, ಕಾಫಿ ಆದರೂ ಸರಿ.", v4: "ಮುಂದಿನ ಊಟದ ಫೋಟೋ ತೆಗೆಯಿರಿ, ಕ್ಯಾಲೊರಿ ಲೆಕ್ಕ ಮಾಡುವ ಕೆಲಸ ನಂದು." },
  },
  "streak-risk": {
    title: "ಉತ್ತಮ ಓಟ",
    body: "ಕಳೆದ ಕೆಲವು ದಿನಗಳಿಂದ ತಪ್ಪದೇ ದಾಖಲಿಸಿದ್ದೀರಿ. ಇಂದು ಹೇಗಿದೆ?",
    alternates: { v2: "ಹೀಗೆ ಪ್ರತಿದಿನ ಲಾಗ್ ಮಾಡುವುದನ್ನು ನೋಡಿ ಖುಷಿಯಾಯಿತು. ಇಂದು ಏನು ತಿಂದಿದ್ದೀರಿ?", v3: "ಇಂದು ತುಂಬಾ ಕೆಲಸವಿತ್ತೇ? ನೆನಪಿರುವುದನ್ನು ಮಾತ್ರ ಬರೆದರೆ ಸಾಕು.", v4: "ಹಿಂದಿನಂತೆಯೇ ಮುಂದುವರಿಸಬೇಕೇ? ಮುಂದೆ ಏನು ತಿನ್ನುತ್ತೀರಿ ಎಂದು ತೋರಿಸಿ." },
  },
  nudge: {
    title: "ಸಣ್ಣ ಪ್ರಶ್ನೆ",
    body: "ಇಂದು ಇಲ್ಲಿಯವರೆಗೆ ಏನೇನು ತಿಂದಿದ್ದೀರಿ? ತಿಳಿಸಿ, ಕ್ಯಾಲೊರಿ ಲೆಕ್ಕ ನಾನು ನೋಡಿಕೊಳ್ಳುತ್ತೇನೆ.",
  },
},
  gu: {
  "trial-end": {
    title: "ટ્રાયલ કાલે પૂરું થાય છે",
    body: "બંધ કરવું છે? સેટિંગ્સ › સબ્સ્ક્રિપ્શન્સ માં જાઓ. નહીં તો તે આપમેળે રિન્યૂ થશે.",
  },
  evening: {
    title: "આજનો હિસાબ",
    body: "આજે તમે તમારા {plan}kcal માંથી {eaten} લીધું. {tomorrow}",
    emptyBody: "ડાયરીમાં આજે કશું નથી નોંધાયું, આવું થાય. લક્ષ્ય હજુ પણ {plan}kcal છે. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "પ્લાન બનાવવો છે ને?",
    body: "તમારા જવાબો સાચવી લીધા છે. બાકીનું પૂરું કરવામાં બે મિનિટ લાગશે.",
    alternates: { v2: "સમય મળે ત્યારે પાછા આવો. બધું સાચવીને રાખ્યું છે.", v3: "જ્યારે તૈયાર હો ત્યારે આવજો, છેલ્લા પ્રશ્નો અહીં જ છે.", v4: "બસ થોડા વધુ જવાબો આપો, જેથી હું તમારો દૈનિક પ્લાન બનાવી શકું." },
  },
  "onboarding-photo": {
    title: "તમારો પ્લાન તૈયાર છે",
    body: "તમારું પહેલું ભોજન નોંધો. જે ખાઓ છો તેનો બસ એક ફોટો લો.",
    alternates: { v2: "આજે શું ખાઓ છો તે બતાવો.", v3: "હવે પછી જે પણ ખાઓ તેનાથી શરૂઆત કરો, કોફી પણ ગણાય.", v4: "કેમેરા જમવા તરફ રાખો, કેલરી હું ગણી લઈશ." },
  },
  "streak-risk": {
    title: "સરસ ગતિ છે",
    body: "છેલ્લા થોડા દિવસો સરસ નોંધાયા છે. આજે કેવું ચાલે છે?",
    alternates: { v2: "તમને રોજ જોઈને આનંદ થાય છે. આજે થાળીમાં શું છે?", v3: "વ્યસ્ત દિવસ રહ્યો? જે યાદ આવે તે ઉમેરી દો.", v4: "છેલ્લા દિવસોની જેમ જ? હવે પછી જે ખાઓ તે બતાવો." },
  },
  nudge: {
    title: "નાનો સવાલ",
    body: "આજે અત્યાર સુધી શું ખાધું? મને કહો, હું ગણતરી કરી લઈશ.",
  },
},
  bn: {
  "trial-end": {
    title: "কাল ট্রায়াল শেষ",
    body: "বন্ধ করতে চাইলে: সেটিংস › সাবস্ক্রিপশন। নইলে নিজে থেকেই রিনিউ হয়ে যাবে।",
  },
  evening: {
    title: "আজ কেমন গেল",
    body: "আজ আপনার {plan}kcal-এর মধ্যে {eaten} খেয়েছেন। {tomorrow}",
    emptyBody: "আজ ডায়েরিতে কিছু লেখা হয়নি, এমন হতেই পারে। লক্ষ্য এখনও {plan}kcal। {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "প্ল্যানটা শেষ করবেন?",
    body: "আপনার উত্তরগুলো সেভ আছে। বাকিটুকু শেষ করতে মাত্র দু মিনিট লাগবে।",
    alternates: { v2: "সময় পেলে বাকিটুকু শেষ করে নিন, আর সামান্যই বাকি।", v3: "সুবিধামতো সময়ে আসুন, শেষের কয়েকটি প্রশ্ন এখানেই আপনার জন্য অপেক্ষা করছে।", v4: "আর দু-তিনটি প্রশ্নের উত্তর পেলেই আপনার দৈনিক প্ল্যান তৈরি হয়ে যাবে।" },
  },
  "onboarding-photo": {
    title: "প্ল্যান তৈরি",
    body: "আপনার প্রথম খাবার লগ করুন। যা খাচ্ছেন তার একটা ছবি তুললেই হবে।",
    alternates: { v2: "আজ যা খাচ্ছেন, একটা ছবি তুলে পাঠিয়ে দিন।", v3: "পরের খাবার যা-ই হোক তা দিয়েই শুরু করুন, এক কাপ চা হলেও চলবে।", v4: "পরের খাবারের একটা ছবি তুলুন, ক্যালোরি গোনার কাজটা আমার।" },
  },
  "streak-risk": {
    title: "দারুণ ধারাবাহিকতা",
    body: "গত কয়েক দিন চমৎকারভাবে লগ করেছেন। আজ কেমন চলছে?",
    alternates: { v2: "আপনাকে রোজ এভাবে লগ করতে দেখে দারুণ লাগছে। আজ কী খেলেন?", v3: "আজ খুব ব্যস্ত দিন ছিল? যতটুকু মনে আছে শুধু সেটুকুই লিখে দিন।", v4: "আগের মতোই চালিয়ে যাবেন? পরের বার যা খাবেন দেখিয়ে দিন।" },
  },
  nudge: {
    title: "ছোট্ট প্রশ্ন",
    body: "আজ এ পর্যন্ত কী কী খেলেন? বলুন, ক্যালোরির হিসাবটা আমি করে দিচ্ছি।",
  },
},
  "pt-PT": {
  "trial-end": {
    title: "O teste grátis acaba amanhã",
    body: "Queres cancelar? Definições › Subscrições. Se não, renova automaticamente.",
  },
  evening: {
    title: "Como correu o dia",
    body: "Hoje levas {eaten} das tuas {plan}kcal. {tomorrow}",
    emptyBody: "Nada no diário hoje, acontece. O objetivo continua nos {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Ainda queres o teu plano?",
    body: "As tuas respostas estão guardadas. O resto demora dois minutos.",
    alternates: { v2: "Volta quando tiveres um minuto. Está tudo guardado.", v3: "Quando quiseres, as últimas perguntas continuam aqui à tua espera.", v4: "Só preciso de mais algumas respostas para calcular o teu plano diário." },
  },
  "onboarding-photo": {
    title: "O plano está pronto",
    body: "Regista a tua primeira refeição. Basta tirares uma foto ao que estás a comer.",
    alternates: { v2: "Mostra-me o que vais comer hoje.", v3: "Começa pelo próximo petisco, o café também conta.", v4: "Aponta a câmara à tua refeição e eu conto as calorias." },
  },
  "streak-risk": {
    title: "Bom ritmo",
    body: "Os últimos dias ficaram registados. Como está a correr hoje?",
    alternates: { v2: "É bom ver-te por aqui com frequência. O que tens hoje no prato?", v3: "Dia corrido? Aponta aquilo de que te lembrares.", v4: "Como nos últimos dias? Mostra-me o que vais comer a seguir." },
  },
  nudge: {
    title: "Pergunta rápida",
    body: "O que comeste hoje até agora? Diz-me e eu faço as contas.",
  },
},
  ms: {
  "trial-end": {
    title: "Percubaan tamat esok",
    body: "Nak batalkan? Pergi ke Seting › Langganan. Jika tidak, ia akan diperbaharui secara automatik.",
  },
  evening: {
    title: "Ringkasan hari ini",
    body: "Hari ini anda sudah ambil {eaten} daripada {plan}kcal. {tomorrow}",
    emptyBody: "Tiada rekod hari ini, tak mengapa. Sasaran kekal {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Nak siapkan pelan anda?",
    body: "Jawapan anda sudah disimpan. Tinggal dua minit sahaja lagi.",
    alternates: { v2: "Sambung bila ada kelapangan, dah tak banyak yang tinggal.", v3: "Bila anda bersedia, beberapa soalan terakhir sedia menunggu di sini.", v4: "Hanya perlu jawab sedikit lagi untuk dapatkan pelan harian anda." },
  },
  "onboarding-photo": {
    title: "Pelan anda dah siap",
    body: "Catat hidangan pertama anda. Ambil sahaja gambar makanan yang anda makan.",
    alternates: { v2: "Kongsikan gambar apa yang anda makan hari ini.", v3: "Mulakan dengan apa saja hidangan seterusnya, kopi pun boleh.", v4: "Tangkap gambar hidangan anda, biar saya kirakan kalorinya." },
  },
  "streak-risk": {
    title: "Rentak yang baik",
    body: "Rajin anda mencatat beberapa hari ini. Bagaimana dengan hari ini?",
    alternates: { v2: "Bagusnya anda konsisten mencatat. Apa makanan sedap hari ini?", v3: "Hari yang sibuk? Catat saja apa yang anda ingat.", v4: "Kekalkan momentum? Tunjukkan hidangan seterusnya." },
  },
  nudge: {
    title: "Tanya sikit",
    body: "Dah makan apa hari ini? Beritahu saya, biar saya kirakan kalorinya.",
  },
},
  ca: {
  "trial-end": {
    title: "La prova acaba demà",
    body: "Vols cancel·lar? Configuració › Subscripcions. Si no, es renova sol.",
  },
  evening: {
    title: "Com ha anat el dia",
    body: "Avui portes {eaten} de les teves {plan}kcal. {tomorrow}",
    emptyBody: "Avui el diari està buit, no passa res. L'objectiu continua sent {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Encara vols el teu pla?",
    body: "Les teves respostes estan guardades. La resta són dos minuts.",
    alternates: { v2: "Torna quan tinguis un moment. Està tot guardat.", v3: "Quan vulguis, les últimes preguntes t'esperen aquí mateix.", v4: "Només em calen un parell de respostes més per calcular el teu pla diari." },
  },
  "onboarding-photo": {
    title: "El teu pla està a punt",
    body: "Registra el teu primer àpat. Només cal que facis una foto del que menges.",
    alternates: { v2: "Ensenya'm què menges avui.", v3: "Comença pel que vingui, el cafè també compta.", v4: "Apunta la càmera al proper àpat i jo compto les calories." },
  },
  "streak-risk": {
    title: "Bona ratxa",
    body: "Els últims dies ho has apuntat tot. Com va avui?",
    alternates: { v2: "Fa goig veure't tan sovint. Què hi ha al plat avui?", v3: "Dia enfeinat? Apunta el que recordis.", v4: "Com aquests dies enrere? Ensenya'm què menges ara." },
  },
  nudge: {
    title: "Una pregunta ràpida",
    body: "Què has menjat avui fins ara? Digues-m'ho i jo faig els números.",
  },
},
  sl: {
  "trial-end": {
    title: "Trial se izteče jutri",
    body: "Želiš preklicati? Nastavitve › Naročnine. Sicer se podaljša samodejno.",
  },
  evening: {
    title: "Kako je šlo danes",
    body: "Danes imaš za sabo {eaten} od svojih {plan}kcal. {tomorrow}",
    emptyBody: "Danes v dnevniku ni vpisov, nič hudega. Cilj ostaja {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Dokončava tvoj načrt?",
    body: "Tvoji odgovori so shranjeni. Do konca sta le še dve minuti.",
    alternates: { v2: "Nadaljuj, ko bo čas, ostalo je le še malo.", v3: "Ko bo čas, te zadnja vprašanja čakajo tukaj.", v4: "Le še nekaj odgovorov in tvoj dnevni načrt bo pripravljen." },
  },
  "onboarding-photo": {
    title: "Načrt je pripravljen",
    body: "Zabeleži svoj prvi obrok. Samo poslikaj, kar ješ.",
    alternates: { v2: "Pošlji fotko tega, kar bo danes na meniju.", v3: "Začni s čimerkoli, kar je naslednje, tudi z navadno kavo.", v4: "Slikaj naslednji obrok, štetje kalorij pa prepusti meni." },
  },
  "streak-risk": {
    title: "Lep niz",
    body: "Zadnje dni je šlo beleženje odlično od rok. Kako kaže danes?",
    alternates: { v2: "Lepo je videti takšno vztrajnost. Kaj dobrega je bilo danes na jedilniku?", v3: "Naporen dan? Vpiši le tisto, kar imaš v spominu.", v4: "Nadaljuješ v istem ritmu? Pokaži naslednji obrok." },
  },
  nudge: {
    title: "Hitro vprašanje",
    body: "Kaj je bilo danes dobrega za pod zob? Sporoči, pa preštejem kalorije.",
  },
},
  hr: {
  "trial-end": {
    title: "Trial istječe sutra",
    body: "Želiš odustati? Postavke › Pretplate. Inače se pretplata sama obnavlja.",
  },
  evening: {
    title: "Kako je prošao dan",
    body: "Danas imaš zabilježeno {eaten} od svojih {plan}kcal. {tomorrow}",
    emptyBody: "Mirno u dnevniku danas, dogodi se. Cilj je i dalje {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Želiš li i dalje svoj plan?",
    body: "Tvoji odgovori su spremljeni. Ostalo traje par minuta.",
    alternates: { v2: "Navrati kad uloviš minutu. Sve te čeka spremljeno.", v3: "Kad uhvatiš vremena, zadnja pitanja te čekaju na istom mjestu.", v4: "Treba mi još par odgovora da ti izračunam dnevni plan." },
  },
  "onboarding-photo": {
    title: "Plan je spreman",
    body: "Zabilježi svoj prvi obrok. Samo slikaj što jedeš.",
    alternates: { v2: "Pokaži što fino jedeš danas.", v3: "Kreni s bilo čim idućim, kava se isto računa.", v4: "Usmjeri kameru prema obroku, a ja ću zbrojiti kalorije." },
  },
  "streak-risk": {
    title: "Dobar ritam",
    body: "Zadnjih nekoliko dana je upisano. Kako stoji danas?",
    alternates: { v2: "Lijepo te vidjeti redovito. Što je danas na tanjuru?", v3: "Gusti raspored? Upiši što god se sjetiš.", v4: "Kao i prošlih dana? Pokaži što je sljedeće za jelo." },
  },
  nudge: {
    title: "Kratko pitanje",
    body: "Što je danas bilo na meniju? Napiši mi i ja ću zbrojiti.",
  },
},
  sk: {
  "trial-end": {
    title: "Trial končí zajtra",
    body: "Chceš skončiť? Nastavenia › Predplatné. Inak sa obnoví samo.",
  },
  evening: {
    title: "Ako dopadol dnešok",
    body: "Dnes máš zapísaných {eaten} z tvojich {plan}kcal. {tomorrow}",
    emptyBody: "Dnes je v denníku pokoj, aj to sa stáva. Cieľ zostáva {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Stále chceš svoj plán?",
    body: "Odpovede máš uložené. Zvyšok zaberie pár minút.",
    alternates: { v2: "Vráť sa, keď budeš mať chvíľku. Všetko ťa čaká uložené.", v3: "Keď budeš mať čas, posledné otázky ťa čakajú na rovnakom mieste.", v4: "Ešte pár odpovedí a môžem ti vypočítať denný plán." },
  },
  "onboarding-photo": {
    title: "Plán je hotový",
    body: "Zapíš svoje prvé jedlo. Stačí odfotiť, čo jete.",
    alternates: { v2: "Ukáž, čo dobré dnes ješ.", v3: "Začni čímkoľvek ďalším, aj káva sa počíta.", v4: "Namier foťák na jedlo a ja spočítam kalórie." },
  },
  "streak-risk": {
    title: "Pekné tempo",
    body: "Posledné dni máš zapísané. Ako to vyzerá dnes?",
    alternates: { v2: "Fajn vidieť ťa skoro každý deň. Čo máš dnes na tanieri?", v3: "Rušný deň? Zapíš si čokoľvek, na čo si spomenieš.", v4: "Tak ako minulé dni? Ukáž, čo ideš jesť." },
  },
  nudge: {
    title: "Rýchla otázka",
    body: "Čo dobré bolo dnes zatiaľ na tanieri? Napíš a ja to zrátam.",
  },
},
  no: {
  "trial-end": {
    title: "Trialen slutter i morgen",
    body: "Vil du avslutte? Gå til Innstillinger › Abonnementer. Ellers fornyes det automatisk.",
  },
  evening: {
    title: "Sånn gikk dagen",
    body: "I dag har du spist {eaten} av dine {plan}kcal. {tomorrow}",
    emptyBody: "Ingenting logget i dag, helt greit. Målet står fast på {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Fullføre planen din?",
    body: "Svarene dine er lagret. Det tar bare et par minutter til.",
    alternates: { v2: "Fortsett når du har et ledig minutt, du er nesten i mål.", v3: "Når det passer, ligger de siste spørsmålene klare for deg.", v4: "Bare et par spørsmål til, så er dagsplanen din klar." },
  },
  "onboarding-photo": {
    title: "Planen din er klar",
    body: "Logg ditt første måltid. Ta bare et bilde av det du spiser.",
    alternates: { v2: "Send et bilde av det du spiser i dag.", v3: "Start med det neste du inntar, kaffe teller også.", v4: "Ta bilde av neste måltid, så fikser jeg kaloriene." },
  },
  "streak-risk": {
    title: "God flyt",
    body: "Du har logget jevnt de siste dagene. Hvordan går det i dag?",
    alternates: { v2: "Kjekt å se deg så jevnlig. Hva godt har du spist i dag?", v3: "Travel dag? Bare legg inn det du husker i farta.", v4: "Fortsetter du i samme spor? Vis meg neste måltid." },
  },
  nudge: {
    title: "Kjapt spørsmål",
    body: "Hva har du spist så langt i dag? Si fra, så tar jeg kaloriene.",
  },
},
  fi: {
  "trial-end": {
    title: "Kokeilu päättyy huomenna",
    body: "Haluatko lopettaa? Asetukset › Tilaukset. Muuten se uusiutuu automaattisesti.",
  },
  evening: {
    title: "Päivän koonti",
    body: "Tänään tuli syötyä {eaten} tavoitteestasi {plan}kcal. {tomorrow}",
    emptyBody: "Ei merkintöjä tänään, sitä sattuu. Tavoite on yhä {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Haluatko vielä suunnitelman?",
    body: "Vastauksesi ovat tallessa. Loppu vie pari minuuttia.",
    alternates: { v2: "Palaa kun ehdit. Kaikki on tallessa.", v3: "Viimeiset kysymykset odottavat, kun olet valmis jatkamaan.", v4: "Vastaa vielä pariin kysymykseen, niin lasken päivittäisen tavoitteesi." },
  },
  "onboarding-photo": {
    title: "Suunnitelma on valmis",
    body: "Kirjaa ensimmäinen ateriasi. Ota vain kuva siitä, mitä syöt.",
    alternates: { v2: "Näytä mitä syöt tänään.", v3: "Aloita seuraavasta syömisestä, kahvikin lasketaan.", v4: "Osoita kamera seuraavaan ateriaan, niin minä lasken kalorit." },
  },
  "streak-risk": {
    title: "Hyvä tahti",
    body: "Viime päivät on kirjattu. Miltä tänään näyttää?",
    alternates: { v2: "Kiva nähdä sinua usein. Mitä tänään on lautasella?", v3: "Kiireinen päivä? Lisää vain se mitä muistat.", v4: "Samaan tapaan kuin viime päivinä? Näytä mitä syöt seuraavaksi." },
  },
  nudge: {
    title: "Pieni kysymys",
    body: "Mitä olet syönyt tänään tähän mennessä? Kerro niin minä lasken.",
  },
},
  da: {
  "trial-end": {
    title: "Trialen slutter i morgen",
    body: "Vil du stoppe? Indstillinger › Abonnementer. Ellers fornyes det automatisk.",
  },
  evening: {
    title: "Dagens tal",
    body: "I dag har du spist {eaten} af dine {plan}kcal. {tomorrow}",
    emptyBody: "Ingen registreringer i dag, det sker. Målet er stadig {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Vil du stadig have planen?",
    body: "Dine svar er gemt. Resten tager et par minutter.",
    alternates: { v2: "Kig forbi, når du har tid. Alt er gemt.", v3: "Når du er klar, venter de sidste spørgsmål lige her.", v4: "Lige et par svar mere, så regner jeg dit daglige mål ud." },
  },
  "onboarding-photo": {
    title: "Planen er klar",
    body: "Log dit første måltid. Tag bare et billede af det, du spiser.",
    alternates: { v2: "Vis mig, hvad du spiser i dag.", v3: "Start med det næste, kaffe tæller også med.", v4: "Ret kameraet mod dit næste måltid, så tæller jeg kalorierne." },
  },
  "streak-risk": {
    title: "God stime",
    body: "De sidste par dage er tastet ind. Hvordan ser det ud i dag?",
    alternates: { v2: "Hyggeligt at se dig næsten hver dag. Hvad er der på tallerkenen i dag?", v3: "Travl dag? Skriv det ind, du kan huske.", v4: "Ligesom de sidste par dage? Vis mig, hvad du spiser nu." },
  },
  nudge: {
    title: "Kort spørgsmål",
    body: "Hvad har du spist i dag indtil videre? Fortæl mig det, så regner jeg på det.",
  },
},
  hu: {
  "trial-end": {
    title: "Holnap lejár a trial",
    body: "Lemondanád? Beállítások › Előfizetések. Különben automatikusan megújul.",
  },
  evening: {
    title: "Mai napod",
    body: "Ma {eaten} kalóriánál jársz a tervezett {plan}kcal-ból. {tomorrow}",
    emptyBody: "Ma üres maradt a napló, nem gond. A cél változatlanul {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Befejezzük a terved?",
    body: "A válaszaid megvannak. Már csak két perc van hátra.",
    alternates: { v2: "Folytasd, ha van egy perced, már majdnem a végén jársz.", v3: "Amikor jólesik, az utolsó kérdések itt várnak.", v4: "Még két-három kérdés, és összeáll a napi terved." },
  },
  "onboarding-photo": {
    title: "Kész a terved",
    body: "Rögzítsd az első étkezésedet. Csak fotózd le, amit eszel.",
    alternates: { v2: "Dobj egy fotót arról, mit eszel ma.", v3: "Kezdd a legközelebbi dologgal, akár egy sima kávéval.", v4: "Fotózd le a következő kajádat, a kalóriaszámolást bízd rám." },
  },
  "streak-risk": {
    title: "Szép sorozat",
    body: "Az elmúlt napokban szuperül naplóztál. Hogy áll a mai nap?",
    alternates: { v2: "Öröm látni a kitartásodat. Mi finomat ettél ma?", v3: "Rohanós nap? Írd be nyugodtan csak azt, ami eszedbe jut.", v4: "Folytatjuk a lendületet? Mutasd a következő kajádat." },
  },
  nudge: {
    title: "Gyors kérdés",
    body: "Ettél már valamit ma? Küldd el, a kalóriákat én számolom.",
  },
},
  el: {
  "trial-end": {
    title: "Η δοκιμή λήγει αύριο",
    body: "Θες να σταματήσεις; Ρυθμίσεις › Συνδρομές. Αλλιώς ανανεώνεται αυτόματα.",
  },
  evening: {
    title: "Πώς πήγε η μέρα",
    body: "Σήμερα κατέγραψες {eaten} από τις {plan}kcal σου. {tomorrow}",
    emptyBody: "Τίποτα στο ημερολόγιο σήμερα, συμβαίνει. Ο στόχος παραμένει {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Θες ακόμα το πλάνο σου;",
    body: "Οι απαντήσεις σου έχουν αποθηκευτεί. Τα υπόλοιπα παίρνουν δύο λεπτά.",
    alternates: { v2: "Έλα πίσω όταν βρεις ένα λεπτό. Όλα είναι αποθηκευμένα.", v3: "Όποτε έχεις χρόνο, οι τελευταίες ερωτήσεις σε περιμένουν εδώ.", v4: "Λίγες απαντήσεις ακόμα για να υπολογίσω το ημερήσιο πλάνο σου." },
  },
  "onboarding-photo": {
    title: "Το πλάνο είναι έτοιμο",
    body: "Κατάγραψε το πρώτο σου γεύμα. Απλώς τράβηξε μια φωτογραφία από ό,τι τρως.",
    alternates: { v2: "Δείξε μου τι τρως σήμερα.", v3: "Ξεκίνα με ό,τι ακολουθεί, ακόμα και ο καφές μετράει.", v4: "Στρέψε την κάμερα στο επόμενο γεύμα και θα μετρήσω τις θερμίδες." },
  },
  "streak-risk": {
    title: "Καλός ρυθμός",
    body: "Οι προηγούμενες μέρες έχουν καταγραφεί. Πώς πάει σήμερα;",
    alternates: { v2: "Χαίρομαι που σε βλέπω τόσο συχνά. Τι έχει το πιάτο σήμερα;", v3: "Γεμάτη μέρα; Σημείωσε ό,τι θυμάσαι.", v4: "Όπως τις προηγούμενες μέρες; Δείξε μου τι θα φας τώρα." },
  },
  nudge: {
    title: "Μια γρήγορη ερώτηση",
    body: "Τι έχεις φάει μέχρι τώρα σήμερα; Πες μου και θα κάνω τους υπολογισμούς.",
  },
},
  ro: {
  "trial-end": {
    title: "Proba se termină mâine",
    body: "Vrei să anulezi? Configurări › Abonamente. Altfel, se reînnoiește automat.",
  },
  evening: {
    title: "Cum a fost azi",
    body: "Azi ai ajuns la {eaten} din cele {plan}kcal. {tomorrow}",
    emptyBody: "N-ai notat nimic azi, nu-i nicio problemă. Rămânem la {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Terminăm planul tău?",
    body: "Răspunsurile tale sunt salvate. Mai durează doar două minute.",
    alternates: { v2: "Continuă când ai o clipă liberă, mai e foarte puțin.", v3: "Când ai timp, ultimele întrebări te așteaptă aici.", v4: "Încă două-trei răspunsuri și planul tău zilnic e gata." },
  },
  "onboarding-photo": {
    title: "Planul tău e gata",
    body: "Notează prima ta masă. Fă doar o poză cu ce mănânci.",
    alternates: { v2: "Trimite o poză cu ce mănânci azi.", v3: "Începe cu ce ai în față acum, chiar și o simplă cafea.", v4: "Fă o poză la ce mănânci, de calculat caloriile mă ocup eu." },
  },
  "streak-risk": {
    title: "Ritm bun",
    body: "Ai notat conștiincios în ultimele zile. Cum merge azi?",
    alternates: { v2: "Mă bucur să te văd atât de consecvent. Ce ai mâncat bun azi?", v3: "Zi plină? Notează doar ce-ți aduci aminte.", v4: "Continuăm la fel? Arată-mi ce mănânci mai târziu." },
  },
  nudge: {
    title: "Întrebare rapidă",
    body: "Ce ai mâncat bun azi? Spune-mi și calculez eu caloriile.",
  },
},
  cs: {
  "trial-end": {
    title: "Trial zítra končí",
    body: "Chceš ho zrušit? Nastavení › Předplatná. Jinak se obnoví sám.",
  },
  evening: {
    title: "Jak dnešek dopadl",
    body: "Dnes máš za sebou {eaten} ze svých {plan}kcal. {tomorrow}",
    emptyBody: "Dneska v deníku nic není, to nevadí. Pořád míříme na {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Dokončíme tvůj plán?",
    body: "Odpovědi máš uložené. Zbytek zabere jen dvě minutky.",
    alternates: { v2: "Pokračuj, až budeš mít chvilku, zbývá už jen kousek.", v3: "Až bude čas, poslední otázky tady na tebe čekají.", v4: "Ještě dvě tři odpovědi a tvůj denní plán je na světě." },
  },
  "onboarding-photo": {
    title: "Plán je hotový",
    body: "Zapiš své první jídlo. Stačí vyfotit, co jíš.",
    alternates: { v2: "Pošli fotku toho, co dneska jíš.", v3: "Začni čímkoliv dalším, klidně i samotnou kávou.", v4: "Vyfoť další jídlo a počítání kalorií nech na mně." },
  },
  "streak-risk": {
    title: "Pěkná série",
    body: "Poslední dny zapisuješ parádně. Jak to vypadá dneska?",
    alternates: { v2: "Moc fajn tě tu vídat. Co dobrého bylo dneska k jídlu?", v3: "Zabraný den? Zapiš klidně jen to, na co si vzpomeneš.", v4: "Pokračujeme jako včera? Ukaž mi, co si dáš dalšího." },
  },
  nudge: {
    title: "Rychlý dotaz",
    body: "Co už máš dneska v sobě? Napiš mi to a já spočítám kalorie.",
  },
},
  hi: {
  "trial-end": {
    title: "ट्रायल कल खत्म",
    body: "कैंसिल करना है? सेटिंग्ज़ › सब्सक्रिप्शन पर जाएं। वरना यह अपने-आप रिन्यू हो जाएगा।",
  },
  evening: {
    title: "आज का हाल",
    body: "आज आपने अपने {plan}kcal में से {eaten} खाए। {tomorrow}",
    emptyBody: "आज डायरी में कुछ दर्ज नहीं हुआ, कोई बात नहीं। लक्ष्य अभी भी {plan}kcal ही है। {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "प्लान पूरा करें?",
    body: "आपके जवाब सेव हैं। बस दो मिनट और लगेंगे।",
    alternates: { v2: "जब भी समय मिले पूरा कर लीजिए, बस थोड़ा-सा ही बचा है।", v3: "जब भी फुरसत हो, बाकी सवाल यहीं आपका इंतज़ार कर रहे हैं।", v4: "बस दो-तीन और सवालों के जवाब, और आपका रोज़ का प्लान तैयार।" },
  },
  "onboarding-photo": {
    title: "प्लान तैयार है",
    body: "अपना पहला भोजन दर्ज करें। जो खा रहे हैं, बस उसकी एक फोटो लें।",
    alternates: { v2: "आज जो भी खाएं, उसकी एक फोटो भेज दीजिए।", v3: "अगली जो भी चीज़ लें उसी से शुरू करें, चाय या कॉफ़ी भी चलेगी।", v4: "अगले खाने की फोटो खींचिए, कैलोरी गिनने का काम मुझ पर छोड़ दीजिए।" },
  },
  "streak-risk": {
    title: "बढ़िया सिलसिला",
    body: "पिछले कुछ दिन आपने बहुत अच्छे से दर्ज किया। आज का दिन कैसा चल रहा है?",
    alternates: { v2: "आपको रोज़ ऐसे दर्ज करते देख अच्छा लगता है। आज क्या बढ़िया खाया?", v3: "आज व्यस्त दिन था? जो भी याद हो, बस वही लिख दीजिए।", v4: "सिलसिला जारी रखें? अगली बार जो भी खाएं, मुझे दिखाइए।" },
  },
  nudge: {
    title: "छोटा सवाल",
    body: "आज अब तक क्या-क्या खाया? मुझे बताइए, कैलोरी का हिसाब मैं लगा दूंगा।",
  },
},
  th: {
  "trial-end": {
    title: "ทดลองใช้หมดพรุ่งนี้",
    body: "ไม่อยากต่ออายุ? ไปที่ การตั้งค่า › การสมัครรับ ถ้าไม่ยกเลิกจะต่ออายุเอง",
  },
  evening: {
    title: "สรุปวันนี้",
    body: "วันนี้กินไป {eaten} จากเป้า {plan}kcal. {tomorrow}",
    emptyBody: "วันนี้ไม่ได้บันทึกอะไร ไม่เป็นไรนะ เป้าหมายยังคงเป็น {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "ยังอยากได้แผนอยู่ไหม",
    body: "บันทึกคำตอบไว้ให้หมดแล้ว เหลืออีกแค่สองนาทีก็เสร็จ",
    alternates: { v2: "ว่างเมื่อไหร่ค่อยกลับมา ข้อมูลทุกอย่างยังอยู่ครบ", v3: "พร้อมเมื่อไหร่ คำถามที่เหลือรออยู่ที่เดิมนะ", v4: "ตอบอีกไม่กี่คำถาม ก็จะได้เป้าหมายแคลอรีประจำวันแล้ว" },
  },
  "onboarding-photo": {
    title: "แผนของคุณพร้อมแล้ว",
    body: "บันทึกมื้อแรกของคุณ แค่ถ่ายรูปอาหารที่กินอยู่",
    alternates: { v2: "ขอดูหน่อยว่าวันนี้กินอะไรบ้าง", v3: "เริ่มจากของกินมื้อต่อไปได้เลย กาแฟก็นับนะ", v4: "แค่ส่องกล้องไปที่มื้อถัดไป เดี๋ยวช่วยนับแคลอรีให้" },
  },
  "streak-risk": {
    title: "กำลังไปได้สวย",
    body: "สองสามวันที่ผ่านมาบันทึกครบเลย วันนี้เป็นยังไงบ้าง",
    alternates: { v2: "ดีใจที่เห็นคุณแวะมาเกือบทุกวัน วันนี้ในจานมีอะไรบ้าง", v3: "วันนี้ยุ่งเหรอ บันทึกเท่าที่จำได้ก็พอ", v4: "เหมือนสองสามวันที่ผ่านมาไหม ขอดูหน่อยว่าจะกินอะไรต่อ" },
  },
  nudge: {
    title: "ถามนิดนึง",
    body: "วันนี้กินอะไรไปบ้างแล้ว บอกมาได้เลยเดี๋ยวช่วยคำนวณให้",
  },
},
  sv: {
  "trial-end": {
    title: "Trialen slutar i morgon",
    body: "Vill du avsluta? Gå till Inställningar › Prenumerationer. Annars förnyas det automatiskt.",
  },
  evening: {
    title: "Så gick dagen",
    body: "I dag har du ätit {eaten} av dina {plan}kcal. {tomorrow}",
    emptyBody: "Inget loggat i dag, helt lugnt. Målet är fortfarande {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Ska vi göra klart din plan?",
    body: "Dina svar är sparade. Det tar bara ett par minuter.",
    alternates: { v2: "Fortsätt när du har en minut över, du är nästan klar.", v3: "När det passar dig finns de sista frågorna kvar här.", v4: "Bara några korta frågor till så är din dagsplan klar." },
  },
  "onboarding-photo": {
    title: "Planen är klar",
    body: "Logga din första måltid. Ta bara en bild av det du äter.",
    alternates: { v2: "Skicka en bild på det du äter i dag.", v3: "Börja med nästa grej du tar, till och med en kaffe räknas.", v4: "Fota nästa måltid så sköter jag kaloriräkningen." },
  },
  "streak-risk": {
    title: "Bra flyt",
    body: "Du har loggat på bra de senaste dagarna. Hur ser det ut i dag?",
    alternates: { v2: "Kul att se dig så regelbundet. Vad har du ätit för gott i dag?", v3: "Full rulle i dag? Logga bara det du kommer ihåg i farten.", v4: "Kör vi på som vanligt? Visa vad du äter härnäst." },
  },
  nudge: {
    title: "Snabb fråga",
    body: "Vad har du ätit hittills i dag? Hör av dig så räknar jag kalorierna.",
  },
},
  uk: {
  "trial-end": {
    title: "Тріал закінчується завтра",
    body: "Хочеш скасувати? Параметри › Підписки. Інакше підписка продовжиться автоматично.",
  },
  evening: {
    title: "Як минув день",
    body: "За сьогодні вийшло {eaten} із твоїх {plan}ккал. {tomorrow}",
    emptyBody: "Сьогодні в щоденнику пусто, буває. Твій план той самий: {plan}ккал. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "План ще потрібен?",
    body: "Твої відповіді збережено. Залишилося буквально пару хвилин.",
    alternates: { v2: "Заходь, коли буде хвилинка. Усі відповіді на місці.", v3: "Як матимеш час, останні запитання чекають там само.", v4: "Ще пара відповідей, і я розрахую твою денну норму." },
  },
  "onboarding-photo": {
    title: "Твій план готовий",
    body: "Запиши перший прийом їжі. Просто сфотографуй, що їси.",
    alternates: { v2: "Покажи, що в тебе сьогодні смачненького.", v3: "Почни з будь-якого перекусу, навіть кава підійде.", v4: "Наведи камеру на страву, а підрахунки за мною." },
  },
  "streak-risk": {
    title: "Чудовий темп",
    body: "Останні дні все записано. Як справи сьогодні?",
    alternates: { v2: "Класно бачити тебе щодня. Що смачного сьогодні?", v3: "Багато справ? Запиши хоч щось із того, що згадаєш.", v4: "Як у минулі дні? Покажи, що будеш їсти далі." },
  },
  nudge: {
    title: "Швидке питання",
    body: "Що вже вдалося перекусити за день? Напиши, а я все порахую.",
  },
},
  nl: {
  "trial-end": {
    title: "Trial stopt morgen",
    body: "Wil je stoppen? Instellingen › Abonnementen. Anders wordt het vanzelf verlengd.",
  },
  evening: {
    title: "Overzicht van vandaag",
    body: "Vandaag zit je op {eaten} van je {plan}kcal. {tomorrow}",
    emptyBody: "Vandaag niks bijgehouden, kan gebeuren. Je doel blijft {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Nog steeds je plan afmaken?",
    body: "Je antwoorden zijn bewaard. De rest kost een paar minuten.",
    alternates: { v2: "Kom terug wanneer je tijd hebt. Alles staat voor je klaar.", v3: "Wanneer je eraan toe bent, de laatste vragen wachten op je.", v4: "Nog een paar antwoorden en dan bereken ik je dagelijkse doel." },
  },
  "onboarding-photo": {
    title: "Je plan is klaar",
    body: "Log je eerste maaltijd. Maak gewoon een foto van wat je eet.",
    alternates: { v2: "Laat maar zien wat je vandaag eet.", v3: "Begin met wat nu komt, koffie telt ook mee.", v4: "Richt je camera op je volgende maaltijd en ik tel de calorieën." },
  },
  "streak-risk": {
    title: "Lekker bezig",
    body: "De afgelopen dagen staan erin. Hoe ziet het er vandaag uit?",
    alternates: { v2: "Fijn om je zo vaak te zien. Wat ligt er vandaag op je bord?", v3: "Drukke dag? Voeg gewoon toe wat je je herinnert.", v4: "Hetzelfde als de afgelopen dagen? Laat zien wat je nu eet." },
  },
  nudge: {
    title: "Korte vraag",
    body: "Wat heb je vandaag al gegeten? Vertel het me, dan reken ik het uit.",
  },
},
  pl: {
  "trial-end": {
    title: "Trial kończy się jutro",
    body: "Chcesz zrezygnować? Ustawienia › Subskrypcje. Inaczej odnowi się automatycznie.",
  },
  evening: {
    title: "Podsumowanie dnia",
    body: "Za dzisiaj wpadło {eaten} z Twoich {plan}kcal. {tomorrow}",
    emptyBody: "W dzienniku dzisiaj pusto, bywa i tak. Twój cel to nadal {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Dalej chcesz swój plan?",
    body: "Twoje odpowiedzi są zapisane. Dokończenie zajmie ze dwie minuty.",
    alternates: { v2: "Wróć, jak złapiesz chwilę. Wszystko czeka zapisane.", v3: "Gdy znajdziesz czas, ostatnie pytania czekają w tym samym miejscu.", v4: "Jeszcze tylko kilka odpowiedzi i obliczę Twój dzienny plan." },
  },
  "onboarding-photo": {
    title: "Plan jest gotowy",
    body: "Zapisz swój pierwszy posiłek. Wystarczy zrobić zdjęcie tego, co jesz.",
    alternates: { v2: "Pokaż, co masz dziś dobrego na talerzu.", v3: "Zacznij od czegokolwiek, kawa też się liczy.", v4: "Skieruj aparat na posiłek, a ja policzę kalorie." },
  },
  "streak-risk": {
    title: "Dobre tempo",
    body: "Ostatnie dni są zapisane. Jak wygląda dzisiejszy dzień?",
    alternates: { v2: "Fajnie widzieć Cię regularnie. Co dziś jesz?", v3: "Zabiegany dzień? Zapisz cokolwiek, co pamiętasz.", v4: "Tak jak w ostatnich dniach? Pokaż, co jesz za chwilę." },
  },
  nudge: {
    title: "Szybkie pytanie",
    body: "Co wpadło dziś na ząb? Napisz, a ja wszystko podliczę.",
  },
},
  tr: {
  "trial-end": {
    title: "Deneme yarın bitiyor",
    body: "İptal etmek istersen: Ayarlar › Abonelikler. Yoksa kendiliğinden yenilenir.",
  },
  evening: {
    title: "Bugün nasıl geçti",
    body: "Bugün {plan}kcal'lik hedefin {eaten} kadarı tamamlandı. {tomorrow}",
    emptyBody: "Bugün günlüğe bir şey yazmadın, hiç sorun değil. Hedef hâlâ {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Planını tamamlayalım mı?",
    body: "Cevapların kayıtlı. Gerisi sadece iki dakika sürer.",
    alternates: { v2: "Müsait olduğunda devam et, neredeyse bitti sayılır.", v3: "Hazır hissettiğinde son birkaç soru seni burada bekliyor.", v4: "Günlük planını hazırlamak için birkaç cevaba daha ihtiyacım var." },
  },
  "onboarding-photo": {
    title: "Planın hazır",
    body: "İlk öğününü kaydet. Yediğinin bir fotoğrafını çekmen yeter.",
    alternates: { v2: "Bugün yediklerinin bir fotoğrafını atman yeterli.", v3: "Sıradaki atıştırmalıkla başla, bir kahve bile olur.", v4: "Sıradaki öğününü çek, kalori sayma işi bende." },
  },
  "streak-risk": {
    title: "Harika seri",
    body: "Son günlerde harika gidiyordun. Bugün durumlar nasıl?",
    alternates: { v2: "Seni böyle düzenli görmek çok güzel. Bugün neler yedin?", v3: "Yoğun bir gün mü? Aklında kalanları yazsan da yeter.", v4: "Aynı tempoda devam mı? Sonraki öğününü bana göster." },
  },
  nudge: {
    title: "Kısa bir soru",
    body: "Bugün neler yedin? Bana yaz, kalorileri ben hesaplarım.",
  },
},
  "zh-Hant": {
  "trial-end": {
    title: "試用明天到期",
    body: "想取消的話到「設定 › 訂閱項目」即可，不然會自動續訂。",
  },
  evening: {
    title: "今天的總結",
    body: "你今天吃了{eaten}，計畫是{plan}大卡。{tomorrow}",
    emptyBody: "今天還沒記下餐點，沒關係的。目標依舊是{plan}大卡。{tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "要完成你的計畫嗎？",
    body: "你的回答都存好了，剩下只要兩分鐘。",
    alternates: { v2: "有空隨時回來，就差最後一點點了。", v3: "想繼續隨時都能回來，最後幾題都在這裡等著你。", v4: "只要再回答兩三題，就能排出你的每日計畫。" },
  },
  "onboarding-photo": {
    title: "計畫做好了",
    body: "記錄你的第一餐。拍一張你吃的東西就好。",
    alternates: { v2: "今天吃什麼，拍張照傳給我看看吧。", v3: "從下一樣要吃的開始拍就行，就算是咖啡也算。", v4: "對著下一餐拍張照，算熱量的事交給我。" },
  },
  "streak-risk": {
    title: "節奏很棒",
    body: "最近幾天你都記得很勤。今天吃得怎麼樣？",
    alternates: { v2: "看你每天都記得很認真。今天吃了什麼好吃的？", v3: "今天特別忙？只要記下想得起來的部分就好。", v4: "繼續保持節奏？下一餐讓我看看你吃什麼。" },
  },
  nudge: {
    title: "問一下",
    body: "今天到現在吃了什麼？跟我說，熱量我來算。",
  },
},
  "zh-Hans": {
  "trial-end": {
    title: "试用明天到期",
    body: "不想续了？在 设置 › 订阅 里取消就行。不取消会自动续订。",
  },
  evening: {
    title: "今天吃得怎么样",
    body: "今天吃了{eaten}，计划是{plan}千卡。{tomorrow}",
    emptyBody: "今天日记空空的，很正常。每天的目标还是{plan}千卡。{tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "还要继续做计划吗？",
    body: "你的回答都存好了，剩下两分钟就能搞定。",
    alternates: { v2: "有空随时回来，进度都帮你存着。", v3: "不着急，最后几个问题随时等你有空再答。", v4: "再回答两三个问题，你的每日热量目标就出来了。" },
  },
  "onboarding-photo": {
    title: "你的计划做好了",
    body: "记录你的第一餐。拍一张你吃的东西就行。",
    alternates: { v2: "给我看看你今天吃什么好吃的。", v3: "从手边的这口开始就行，咖啡也算。", v4: "把镜头对准下一餐，热量我来帮你算。" },
  },
  "streak-risk": {
    title: "节奏不错",
    body: "这几天都有认真记，今天感觉怎么样？",
    alternates: { v2: "天天能见到你真好，今天盘子里都有什么？", v3: "今天太忙了？想起来什么就记点什么。", v4: "跟前几天差不多？拍一下接下来吃什么吧。" },
  },
  nudge: {
    title: "问问你",
    body: "今天到现在都吃什么了？告诉我，剩下的我来算。",
  },
},
  ko: {
  "trial-end": {
    title: "체험 내일 끝나요",
    body: "그만두려면 설정 › 구독에서 취소하세요. 안 하면 자동으로 갱신돼요.",
  },
  evening: {
    title: "오늘의 식단",
    body: "오늘 {plan}kcal 중 {eaten}을 기록했어요. {tomorrow}",
    emptyBody: "오늘은 기록이 없네요, 그럴 수도 있죠. 목표는 여전히 {plan}kcal예요. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "플랜 계속 만드시겠어요?",
    body: "답변은 다 저장해 뒀어요. 2분이면 끝나요.",
    alternates: { v2: "시간 날 때 편하게 오세요. 다 저장해 뒀어요.", v3: "준비됐을 때 오세요. 남은 질문이 기다리고 있어요.", v4: "질문 몇 개만 더 답하면 맞춤 목표 칼로리가 나와요." },
  },
  "onboarding-photo": {
    title: "플랜이 준비됐어요",
    body: "첫 끼니를 기록해 보세요. 먹는 것을 사진으로 찍기만 하면 돼요.",
    alternates: { v2: "오늘 드시는 음식 보여주세요.", v3: "다음에 먹는 것부터 시작해요, 커피 한 잔도 좋아요.", v4: "다음 식사에 카메라를 비추면 계산은 제가 할게요." },
  },
  "streak-risk": {
    title: "좋은 흐름이에요",
    body: "최근 며칠간 잘 기록하셨네요. 오늘은 어때요?",
    alternates: { v2: "자주 뵈니 반가워요. 오늘 접시엔 뭐가 있나요?", v3: "바쁜 하루였나요? 기억나는 것만 적어보세요.", v4: "최근 며칠처럼 가볼까요? 다음에 드실 음식 보여주세요." },
  },
  nudge: {
    title: "잠깐 확인",
    body: "오늘 지금까지 뭐 드셨어요? 알려주시면 제가 계산할게요.",
  },
},
  ja: {
  "trial-end": {
    title: "トライアルは明日まで",
    body: "やめるなら 設定 › サブスクリプション から。そのままなら自動で更新されます。",
  },
  evening: {
    title: "今日の記録",
    body: "今日は{plan}kcalのうち{eaten}を記録しました。{tomorrow}",
    emptyBody: "今日は記録なし、そんな日もあります。目標は{plan}kcalのままです。{tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "プランの作成を続けますか？",
    body: "回答は保存してあります。あと2分ほどで終わります。",
    alternates: { v2: "時間があるときにいつでもどうぞ。続きから再開できます。", v3: "いつでも大丈夫。残りの質問はそのまま待っています。", v4: "あと数問答えてもらえれば、毎日の目標プランを計算できます。" },
  },
  "onboarding-photo": {
    title: "プランができました",
    body: "最初の食事を記録しましょう。食べるものを写真に撮るだけです。",
    alternates: { v2: "今日何を食べるか見せてください。", v3: "次の一口からで大丈夫、コーヒーだけでも記録できます。", v4: "次の食事にカメラを向けるだけで、カロリーは計算します。" },
  },
  "streak-risk": {
    title: "いい調子です",
    body: "ここ数日しっかり記録できていますね。今日はどんな感じですか？",
    alternates: { v2: "毎日見かけられて嬉しいです。今日のお皿には何が乗っていますか？", v3: "忙しい一日でしたか？覚えているものだけで大丈夫です。", v4: "ここ数日と同じ感じですか？次食べるものを見せてください。" },
  },
  nudge: {
    title: "ちょっと確認",
    body: "今日これまでに何を食べましたか？教えてくれれば計算します。",
  },
},
  "pt-BR": {
  "trial-end": {
    title: "O teste acaba amanhã",
    body: "Quer cancelar? Vá em Ajustes › Assinaturas. Se não, ela renova sozinha.",
  },
  evening: {
    title: "Resumo de hoje",
    body: "Hoje você bateu {eaten} das suas {plan}kcal. {tomorrow}",
    emptyBody: "Nada anotado hoje, normal. A meta continua em {plan}kcal. {tomorrow}",
  },
  // The free account's line (#730): no figures, because the figures read the day against the plan
  // and that reading is what a subscription buys.
  "onboarding-start": {
    title: "Bora fechar seu plano?",
    body: "Suas respostas estão salvas. Só faltam dois minutinhos.",
    alternates: { v2: "Continua quando tiver um tempinho, tá quase no fim.", v3: "Quando puder, as últimas perguntas já estão te esperando.", v4: "Só mais duas ou três perguntas e seu plano diário tá pronto." },
  },
  "onboarding-photo": {
    title: "Seu plano tá pronto",
    body: "Registre sua primeira refeição. É só tirar uma foto do que você está comendo.",
    alternates: { v2: "Manda uma foto do que você for comer hoje.", v3: "Começa pelo próximo que você tomar, até um cafezinho vale.", v4: "Tira foto do seu próximo prato que eu cuido das calorias." },
  },
  "streak-risk": {
    title: "Boa sequência",
    body: "Você anotou tudo certinho nos últimos dias. Como tá hoje?",
    alternates: { v2: "Muito bom ver seu foco por aqui. O que você comeu de bom hoje?", v3: "Dia corrido? Anota só o que você lembrar de cabeça.", v4: "Seguindo o ritmo? Me mostra o que você for comer a seguir." },
  },
  nudge: {
    title: "Pergunta rápida",
    body: "O que você já comeu hoje? Me manda que eu calculo as calorias.",
  },
},
};

/** The compiled-in copy for one language. English for one nobody has written yet. */
export const notificationCopyFor = (lang: Lang): NotificationCopy => t(lang)(NOTIFICATION_COPY);

/**
 * What the admin has saved, per language. `Partial`, not `Localized`, for the reason
 * `OnboardingContentSet` is: a stored set is an OVERLAY on the compiled-in table, and a host whose
 * admin has only ever edited German has no English in it.
 */
export type NotificationCopySet = Partial<Record<Lang, NotificationCopy>>;

/**
 * A stored row as a SET, whatever shape it was written in.
 *
 * A row saved before #358 is a bare `NotificationCopy` — the messages at the top level — and it
 * is English, because English was all there was. Read as every language it would put an admin's
 * English on a Russian lock screen; read as none of them it would silently discard an edit that is
 * live in production today. So it is adopted for `en` and for nothing else, which is what it meant.
 *
 * Detected by a message id at the top level rather than by the absence of language keys: `ru` and
 * `evening` cannot both be right, and naming the thing we are looking FOR survives the next
 * language code better than naming everything we are not.
 */
export function storedNotificationCopy(stored: unknown): NotificationCopySet {
  if (typeof stored !== "object" || stored === null) return {};
  const raw = stored as Record<string, unknown>;
  if (NOTIFICATION_IDS.some((id) => typeof raw[id] === "object" && raw[id] !== null)) {
    return { en: stored as NotificationCopy };
  }
  return { ...(stored as NotificationCopySet) };
}

/** 20:30 in the server's zone, as R1 specifies. The reminders ride the same slot. */
export const REMINDER_TIME = { hour: 20, minute: 30 } as const;

/**
 * The reply field under the 20:30 message (ieat-app#731). The server names the category on the
 * push; the app registers it at startup with these words, so the field and its button speak the
 * account's language. What is typed there takes the chat's typed-meal path, nothing new.
 */
export const LOG_REPLY_CATEGORY = "log-reply";
export const LOG_REPLY_ACTION = "log";

export interface LogReplyCopy {
  /** The button that opens the field, and the a11y label of the action. */
  button: string;
  /** The field's send button. */
  submit: string;
  placeholder: string;
}

export const LOG_REPLY_COPY: Localized<LogReplyCopy> = {
  en: { button: "Log a meal", submit: "Log", placeholder: "What did you eat?" },
  fr: { button: "Noter un repas", submit: "Noter", placeholder: "Qu'as-tu mangé ?" },
  de: { button: "Mahlzeit eintragen", submit: "Eintragen", placeholder: "Was hast du gegessen?" },
  it: { button: "Registra un pasto", submit: "Registra", placeholder: "Cosa hai mangiato?" },
  es: { button: "Apuntar una comida", submit: "Apuntar", placeholder: "¿Qué has comido?" },
  vi: { button: "Ghi một bữa ăn", submit: "Ghi", placeholder: "Bạn đã ăn gì?" },
  id: { button: "Catat makanan", submit: "Catat", placeholder: "Kamu makan apa?" },
  ru: { button: "Записать еду", submit: "Записать", placeholder: "Что было на тарелке?" },
  sq: { button: "Regjistro një vakt", submit: "Regjistro", placeholder: "Çfarë hëngre?" },
  bg: { button: "Запиши оброк", submit: "Запиши", placeholder: "Какво изяде?" },
  te: { button: "భోజనం నమోదు చేయండి", submit: "నమోదు చేయండి", placeholder: "మీరు ఏమి తిన్నారు?" },
  ta: { button: "உணவைப் பதிவுசெய்", submit: "பதிவுசெய்", placeholder: "என்ன சாப்பிட்டீர்கள்?" },
  pa: { button: "ਖਾਣਾ ਦਰਜ ਕਰੋ", submit: "ਦਰਜ ਕਰੋ", placeholder: "ਤੁਸੀਂ ਕੀ ਖਾਧਾ?" },
  or: { button: "ଭୋଜନ ଲଗ୍ କରନ୍ତୁ", submit: "ଲଗ୍ କରନ୍ତୁ", placeholder: "ଆପଣ କ'ଣ ଖାଇଲେ?" },
  mr: { button: "जेवण नोंदवा", submit: "नोंदवा", placeholder: "तुम्ही काय खाल्ले?" },
  ml: { button: "ഭക്ഷണം രേഖപ്പെടുത്തുക", submit: "രേഖപ്പെടുത്തുക", placeholder: "നിങ്ങൾ എന്ത് കഴിച്ചു?" },
  kn: { button: "ಊಟ ದಾಖಲಿಸಿ", submit: "ದಾಖಲಿಸಿ", placeholder: "ನೀವು ಏನು ತಿಂದಿರಿ?" },
  gu: { button: "ભોજન નોંધો", submit: "નોંધો", placeholder: "તમે શું ખાધું?" },
  bn: { button: "খাবার লগ করুন", submit: "লগ করুন", placeholder: "আপনি কী খেয়েছেন?" },
  "pt-PT": { button: "Registar refeição", submit: "Registar", placeholder: "O que comeste?" },
  ms: { button: "Catat hidangan", submit: "Catat", placeholder: "Apa yang anda makan?" },
  ca: { button: "Registra un àpat", submit: "Registra", placeholder: "Què has menjat?" },
  sl: { button: "Zabeleži obrok", submit: "Zabeleži", placeholder: "Kaj je bilo na krožniku?" },
  hr: { button: "Zabilježi obrok", submit: "Zabilježi", placeholder: "Što je bilo za jelo?" },
  sk: { button: "Zapísať jedlo", submit: "Zapísať", placeholder: "Čo bolo na tanieri?" },
  no: { button: "Logg et måltid", submit: "Logg", placeholder: "Hva spiste du?" },
  fi: { button: "Kirjaa ateria", submit: "Kirjaa", placeholder: "Mitä söit?" },
  da: { button: "Registrér et måltid", submit: "Registrér", placeholder: "Hvad spiste du?" },
  hu: { button: "Étkezés rögzítése", submit: "Rögzítés", placeholder: "Mit ettél?" },
  el: { button: "Καταγραφή γεύματος", submit: "Καταγραφή", placeholder: "Τι έφαγες;" },
  ro: { button: "Înregistrează o masă", submit: "Înregistrează", placeholder: "Ce ai mâncat?" },
  cs: { button: "Zapsat jídlo", submit: "Zapsat", placeholder: "Co bylo k jídlu?" },
  hi: { button: "भोजन दर्ज करें", submit: "दर्ज करें", placeholder: "आपने क्या खाया?" },
  th: { button: "จดมื้ออาหาร", submit: "จด", placeholder: "คุณกินอะไรไป?" },
  sv: { button: "Logga en måltid", submit: "Logga", placeholder: "Vad åt du?" },
  uk: { button: "Записати їжу", submit: "Записати", placeholder: "Що було на тарілці?" },
  nl: { button: "Maaltijd loggen", submit: "Loggen", placeholder: "Wat heb je gegeten?" },
  pl: { button: "Zapisz posiłek", submit: "Zapisz", placeholder: "Co było na talerzu?" },
  tr: { button: "Öğün kaydet", submit: "Kaydet", placeholder: "Ne yedin?" },
  "zh-Hant": { button: "記錄一餐", submit: "記錄", placeholder: "你吃了什麼？" },
  "zh-Hans": { button: "记录一餐", submit: "记录", placeholder: "你吃了什么？" },
  ko: { button: "식사 기록", submit: "기록", placeholder: "무엇을 먹었나요?" },
  ja: { button: "食事を記録", submit: "記録", placeholder: "何を食べましたか？" },
  "pt-BR": { button: "Registrar refeição", submit: "Registrar", placeholder: "O que você comeu?" },
};

export const logReplyCopyFor = (lang: Lang): LogReplyCopy => t(lang)(LOG_REPLY_COPY);

/** The id the APP schedules itself. `evening` is a push and is never local. */
export type TrialReminderId = Extract<NotificationId, "trial-end">;

/** One reminder to put on the device: `date` is `YYYY-MM-DD` in the SERVER's zone. */
export interface ScheduledReminder {
  id: TrialReminderId;
  date: string;
}

/**
 * The reminders that should be on this device right now — at most one. Empty means cancel
 * everything.
 *
 * The app's ONE decision about local notifications: its scheduler cancels every id this does not
 * name and schedules every id it does. It lives here rather than in `src/mobile` for the reason
 * `aggregateDays` does — `bun test` does not reach the app, so arithmetic mixed in with
 * `expo-notifications` is untested by construction.
 *
 * Empty covers every ending a trial has: never bought, expired, converted to a real subscription,
 * or opened so late that the day is behind. The caller does not distinguish them, because there
 * is nothing different to do about any of them.
 *
 * A date already past is DROPPED rather than scheduled. iOS accepts a calendar trigger whose
 * components are behind it and then never fires it, which is the same outcome told less honestly —
 * and it leaves `getAllScheduledNotificationsAsync` claiming a reminder that cannot arrive.
 */
export function reminderPlan(
  entitlement: Entitlement,
  timezone: string,
  now: Date = new Date(),
): ScheduledReminder[] {
  const date = trialReminder(entitlement, timezone, now.getTime());
  if (date === null) return [];
  // Compared as strings, which is chronological for `YYYY-MM-DD`, and against TODAY in the SERVER's
  // zone rather than the device's — the same rule the diary and the health aggregation follow.
  //
  // THE SERVER'S ZONE IS LOAD-BEARING, AND THE OTHER END OF THE CONTRACT IS THE TRIGGER. Deciding
  // "has today's slot gone" from the server's wall clock is correct only because the app schedules
  // these as CALENDAR triggers carrying that same zone (`src/mobile/lib/notifications/expo.ts`), so
  // iOS resolves 20:30 in it too. A date trigger, or a trigger without a timezone, would resolve
  // 20:30 on the device instead, and this comparison would be wrong in both directions for anybody
  // who travels. If that trigger type ever changes, change this with it.
  const today = localDate(timezone, now);
  // TODAY counts only while today's slot is still ahead. `date >= today` alone is date granularity,
  // and an app first opened at 21:00 on the day-6 date would schedule a 20:30 trigger that iOS
  // accepts and never fires — the exact outcome this filter exists to avoid, and on that day the
  // server is silent too, so the user gets nothing at all on a day the budget says one.
  // Compared as MINUTES, not as strings, and modulo 24. `hour12: false` formats midnight as 24 in
  // some ICU versions — `zoneOffsetMs` in the backend's scheduler guards the same construction for
  // the same reason — and this is the first place `localTime`'s output is compared rather than
  // displayed. It also runs on the PHONE, under an Intl no test here exercises, so the failure
  // would be a reminder silently dropped for anyone who opened the app between midnight and 01:00
  // on that one day, once per trial, and unreproducible on a Mac.
  const [h, m] = localTime(timezone, now).split(":").map(Number) as [number, number];
  const passed = (h % 24) * 60 + m >= REMINDER_TIME.hour * 60 + REMINDER_TIME.minute;
  return date === today && passed || date < today ? [] : [{ id: "trial-end", date }];
}

/** Interpolate a message. `empty` picks the evening line's nothing-logged variant. */
export function fillNotification(
  copy: NotificationCopy,
  id: NotificationId,
  params: Record<string, string>,
  opts: { empty?: boolean } = {},
): { title: string; body: string } {
  const message = copy[id];
  const template = opts.empty && message.emptyBody ? message.emptyBody : message.body;
  return { title: fill(message.title, params), body: fill(template, params) };
}

const fill = (template: string, params: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => params[key] ?? whole);

export type NotificationCopyValidation =
  | { ok: true; content: NotificationCopy }
  | { ok: false; errors: string[] };

/**
 * Validate admin-supplied copy against what the composer can actually fill, and against the claims
 * rule set.
 *
 * On the WRITE, never on the read — a phone that has already been handed a broken template shows a
 * literal `{plan}` on a lock screen and no client-side tolerance recovers it. The claims gate is
 * the same one the landing page's build runs (`shared/claims.ts`): a notification is public
 * copy that arrives unasked, on the device of somebody who told us about their kidneys.
 *
 * Every error, not the first: an editor that reports one problem per save takes six saves to fix
 * six typos.
 */
export function validateNotificationCopy(input: unknown): NotificationCopyValidation {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["copy must be an object"] };
  }
  const raw = input as Record<string, unknown>;

  for (const key of Object.keys(raw)) {
    if (!(NOTIFICATION_IDS as readonly string[]).includes(key)) {
      errors.push(`"${key}" is not a message this product sends`);
    }
  }

  const claimFields: Record<string, string> = {};

  for (const id of NOTIFICATION_IDS) {
    const entry = raw[id];
    if (typeof entry !== "object" || entry === null) { errors.push(`${id} is required`); continue; }
    const m = entry as Record<string, unknown>;

    const fields: [string, unknown, boolean][] = [
      ["title", m.title, true],
      ["body", m.body, true],
      // The nothing-logged variant exists for the evening line and for nothing else: a reminder
      // does not depend on what was logged, so a second body there would never be reached.
      ["emptyBody", m.emptyBody, id === "evening"],
    ];

    for (const [name, value, required] of fields) {
      const at = `${id}.${name}`;
      if (value === undefined) {
        if (required) errors.push(`${at} is required`);
        continue;
      }
      if (!required) { errors.push(`${at} is not used by "${id}"`); continue; }
      if (typeof value !== "string" || value.trim() === "") { errors.push(`${at} is required`); continue; }
      const max = name === "title" ? MAX_NOTIFICATION_TITLE : MAX_NOTIFICATION_BODY;
      if (value.length > max) errors.push(`${at} is over ${max} characters`);

      const declared = NOTIFICATION_PLACEHOLDERS[at] ?? [];
      const used = new Set(Array.from(value.matchAll(/\{(\w+)\}/g), (mm) => mm[1] as string));
      for (const key of used) {
        if (!declared.includes(key)) errors.push(`${at} uses {${key}}, which nothing fills here`);
      }
      for (const key of declared) {
        if (!used.has(key)) errors.push(`${at} is missing {${key}}`);
      }
      claimFields[at] = value;
    }
  }

  for (const v of lintCopy(claimFields)) {
    errors.push(`${v.field} contains a ${v.pattern} claim: "${v.span}"`);
  }

  // ADMIN-TYPED RUSSIAN GETS THE GENDER CHECK TOO, and this is the only place it can run.
  //
  // `genderedRussian` is a build-time guard over the COMPILED-IN tables — and a stored revision
  // REPLACES those for every user, so without this the whole check was a rule about strings an
  // admin could overwrite through the editor without anything looking. It needs no `lang`: a
  // string in any other language has no Cyrillic in it and cannot match.
  for (const g of genderedRussian(raw)) {
    errors.push(`${g.at} tells a Russian reader their gender ("${g.text}") — Russian past tense`
      + " and short adjectives agree, so this greets half your readers as the wrong person");
  }

  if (errors.length > 0) return { ok: false, errors };
  // Every id is present, every field is a string of the right shape: the cast describes what the
  // loop above has just proved.
  return { ok: true, content: raw as unknown as NotificationCopy };
}

export interface EveningInput {
  targets: FoodTargets;
  totals: { kcal: number; protein_g: number };
  goal: Goal;
  /** Meals logged on the day. Zero is its own sentence, not a total of nothing. */
  meals: number;
}

/** A protein gap smaller than this is noise against an estimate, not a thing to act on. */
const PROTEIN_GAP_G = 15;
/** Under the plan by less than this is a normal day, not something to name. */
const UNDER_KCAL = 400;
/** A gain plan that fell short by less than this is on plan. */
const UNDER_KCAL_GAIN = 200;

/**
 * The retention-bearing half of the 20:30 line, as six templates rather than six sentences.
 *
 * The BRANCHING stays in `eveningPrescription` below — which lever a day gets is a claim about that
 * day's arithmetic, and a translator has no business moving it. What is here is the wording of each
 * branch once it has been chosen, which is exactly what a translator does have business with.
 *
 * `skyr` survives in the European languages, where it is on the shelf, and is adapted to Greek
 * yoghurt in Vietnamese and Indonesian, where it is not. A calqued shopping list is a prescription
 * nobody can act on, which makes it the same as no prescription at all.
 */
export const EVENING_PRESCRIPTIONS: Localized<Record<
  "noMeals" | "over" | "protein" | "gainUnder" | "under" | "onPlan", string
>> = {
  en: {
    noMeals: "One photo tomorrow puts the day back on the board.",
    over: "{over} over today — tomorrow starts at {plan} again.",
    protein: "Protein ran {gap}g short — eggs or skyr at breakfast closes it.",
    gainUnder: "{under}kcal short of the plan — a handful of nuts tomorrow covers it.",
    under: "{under} under the plan — eating the whole number tomorrow is the plan, not a slip.",
    onPlan: "On plan. Same again tomorrow.",
  },
  fr: {
    noMeals: "Demain, une seule photo suffit pour reprendre le fil.",
    over: "{over} de trop aujourd'hui — demain, on repart sur {plan}.",
    protein: "Il a manqué {gap}g de protéines — des œufs ou du skyr au petit-déjeuner suffiront à combler l'écart.",
    gainUnder: "Il manquait {under}kcal — une poignée de noix demain, et c'est réglé.",
    under: "{under} en dessous du plan — demain, manger tout ce qui est prévu, c'est le plan, pas un écart.",
    onPlan: "Pile dans le plan. On refait pareil demain.",
  },
  de: {
    noMeals: "Ein Foto morgen, und der Tag zählt wieder.",
    over: "Heute {over} über dem Plan – morgen geht's wieder bei {plan} los.",
    protein: "Beim Protein fehlten {gap}g — Eier oder Skyr zum Frühstück schließen die Lücke.",
    gainUnder: "{under}kcal unter dem Plan — eine Handvoll Nüsse morgen deckt das.",
    under: "{under} unter dem Plan – morgen die volle Menge zu essen ist kein Ausrutscher, sondern der Plan.",
    onPlan: "Im Plan. Morgen genauso.",
  },
  it: {
    noMeals: "Una foto domani rimette la giornata nel conteggio.",
    over: "Oggi {over} in più — domani si riparte da {plan}.",
    protein: "Ti sono mancati {gap}g di proteine: uova o skyr a colazione e recuperi.",
    gainUnder: "{under}kcal sotto il piano — una manciata di noci domani copre tutto.",
    under: "{under} sotto il piano — domani mangiare tutte le kcal previste è il piano, non uno sgarro.",
    onPlan: "In linea con il piano. Domani si replica.",
  },
  es: {
    noMeals: "Mañana, con una foto, el día vuelve a contar.",
    over: "{over} por encima hoy — mañana vuelve a empezar en {plan}.",
    protein: "Faltaron {gap}g de proteína — huevos o skyr en el desayuno lo cierran.",
    gainUnder: "{under}kcal por debajo del plan — un puñado de frutos secos mañana lo cubre.",
    under: "{under} por debajo del plan — mañana come todo lo que marca el plan: eso es el plan, no un exceso.",
    onPlan: "En el plan. Mañana igual.",
  },
  vi: {
    noMeals: "Mai chỉ cần một tấm ảnh là ngày của bạn lại có số liệu.",
    over: "Hôm nay vượt {over} — ngày mai lại bắt đầu từ {plan}.",
    protein: "Đạm còn thiếu {gap}g — trứng hoặc sữa chua Hy Lạp buổi sáng là đủ bù.",
    gainUnder: "Thiếu {under}kcal so với kế hoạch — ngày mai một nắm hạt là đủ.",
    under: "Thiếu {under} so với kế hoạch — ngày mai ăn trọn con số mới là kế hoạch, không phải lỡ nhịp.",
    onPlan: "Đúng kế hoạch. Ngày mai cứ vậy.",
  },
  id: {
    noMeals: "Satu foto besok, dan hari itu terhitung lagi.",
    over: "Hari ini {over} di atas rencana — besok mulai lagi dari {plan}.",
    protein: "Protein kurang {gap}g — telur atau yogurt Yunani saat sarapan menutupnya.",
    gainUnder: "Kurang {under}kcal dari rencana — segenggam kacang besok sudah cukup.",
    under: "Kurang {under} dari rencana — besok makan sesuai angka penuh memang rencananya, bukan pelanggaran.",
    onPlan: "Sesuai rencana. Besok sama lagi.",
  },
  ru: {
    noMeals: "Одно фото завтра — и день снова в счёте.",
    over: "Сегодня {over} сверху — завтра снова стартуешь с {plan}.",
    protein: "Белка не хватило {gap}г — яйца или скир на завтрак закрывают разрыв.",
    gainUnder: "{under}ккал не хватило до плана — горсть орехов завтра это покроет.",
    under: "{under} ниже плана. Съесть завтра всю цифру — это и есть план, а не срыв.",
    onPlan: "По плану. Завтра — так же.",
  },
  sq: {
    noMeals: "Një foto nesër dhe dita numërohet prapë.",
    over: "{over} tepër sot — nesër fillon prapë me {plan}.",
    protein: "Proteinës i munguan {gap} g — vezë ose skyr në mëngjes e mbyllin.",
    gainUnder: "{under}kcal nën planin — një grusht arra nesër e mbyll.",
    under: "{under} nën planin — të ngrënit e gjithë numrin nesër është plani, jo shkelje.",
    onPlan: "Në plan. Njësoj edhe nesër.",
  },
  bg: {
    noMeals: "Една снимка утре — и денят отново се брои.",
    over: "{over} в повече днес — утре пак започва от {plan}.",
    protein: "На протеина му липсваха {gap} г — яйца или скир на закуска го покриват.",
    gainUnder: "{under}ккал под плана — шепа ядки утре ги покрива.",
    under: "{under} под плана — утре да стигнеш цялото число е планът, не пропуск.",
    onPlan: "В плана. Утре — същото.",
  },
  te: {
    noMeals: "రేపు ఒక ఫోటో, ఆ రోజు మళ్ళీ లెక్కలోకి వస్తుంది.",
    over: "ఈరోజు {over} ఎక్కువ — రేపు మళ్ళీ {plan} నుండి మొదలు.",
    protein: "ప్రోటీన్ {gap} g తక్కువైంది — అల్పాహారంలో గుడ్లు లేదా పెరుగు దాన్ని పూరిస్తాయి.",
    gainUnder: "ప్లాన్ కంటే {under}kcal తక్కువ — రేపు గుప్పెడు గింజలు దాన్ని పూరిస్తాయి.",
    under: "ప్లాన్ కంటే {under} తక్కువ — రేపు పూర్తి సంఖ్య తినడమే ప్లాన్, అది తప్పు కాదు.",
    onPlan: "ప్లాన్ ప్రకారమే. రేపు కూడా ఇలాగే.",
  },
  ta: {
    noMeals: "நாளை ஒரு புகைப்படம், அந்த நாள் மீண்டும் கணக்கில் சேரும்.",
    over: "இன்று {over} அதிகம் — நாளை மீண்டும் {plan} இலிருந்து தொடக்கம்.",
    protein: "புரதம் {gap} g குறைவு — காலை உணவில் முட்டை அல்லது தயிர் அதை ஈடுசெய்யும்.",
    gainUnder: "திட்டத்தை விட {under}kcal குறைவு — நாளை ஒரு கைப்பிடி கொட்டைகள் அதை ஈடுசெய்யும்.",
    under: "திட்டத்தை விட {under} குறைவு — நாளை முழு எண்ணையும் சாப்பிடுவதுதான் திட்டம், தவறு அல்ல.",
    onPlan: "திட்டப்படி. நாளையும் இதேபோல்.",
  },
  pa: {
    noMeals: "ਕੱਲ੍ਹ ਇੱਕ ਫ਼ੋਟੋ, ਅਤੇ ਦਿਨ ਫਿਰ ਤੋਂ ਗਿਣਤੀ ਵਿੱਚ।",
    over: "ਅੱਜ {over} ਵੱਧ — ਕੱਲ੍ਹ ਫਿਰ ਤੋਂ {plan} ਨਾਲ ਸ਼ੁਰੂਆਤ।",
    protein: "ਪ੍ਰੋਟੀਨ {gap} g ਘੱਟ ਰਿਹਾ — ਨਾਸ਼ਤੇ ਵਿੱਚ ਆਂਡੇ ਜਾਂ ਦਹੀਂ ਨਾਲ ਇਹ ਪੂਰਾ ਹੋ ਜਾਵੇਗਾ।",
    gainUnder: "ਪਲਾਨ ਤੋਂ {under}kcal ਘੱਟ — ਕੱਲ੍ਹ ਮੁੱਠੀ ਭਰ ਮੇਵਿਆਂ ਨਾਲ ਇਹ ਪੂਰਾ ਹੋ ਜਾਵੇਗਾ।",
    under: "ਪਲਾਨ ਤੋਂ {under} ਘੱਟ — ਕੱਲ੍ਹ ਪੂਰਾ ਨੰਬਰ ਖਾਣਾ ਹੀ ਪਲਾਨ ਹੈ, ਕੋਈ ਚੂਕ ਨਹੀਂ।",
    onPlan: "ਪਲਾਨ ਮੁਤਾਬਕ। ਕੱਲ੍ਹ ਵੀ ਇਸੇ ਤਰ੍ਹਾਂ।",
  },
  or: {
    noMeals: "କାଲି ଗୋଟିଏ ଫଟୋ, ଆଉ ଦିନଟି ପୁଣି ବୋର୍ଡରେ।",
    over: "ଆଜି {over} ଅଧିକ — କାଲି ପୁଣି {plan} ରୁ ଆରମ୍ଭ।",
    protein: "ପ୍ରୋଟିନ୍ {gap} g କମ୍ ରହିଲା — ଜଳଖିଆରେ ଅଣ୍ଡା କିମ୍ବା ସ୍କିର୍ ଏହାକୁ ପୂରଣ କରିବ।",
    gainUnder: "ପ୍ଲାନ୍‌ରୁ {under}kcal କମ୍ — କାଲି ମୁଠାଏ ବାଦାମ ଏହାକୁ ପୂରଣ କରିବ।",
    under: "ପ୍ଲାନ୍‌ରୁ {under} କମ୍ — କାଲି ପୂରା ସଂଖ୍ୟା ଖାଇବା ହିଁ ପ୍ଲାନ୍, ଭୁଲ୍ ନୁହେଁ।",
    onPlan: "ପ୍ଲାନ୍ ଅନୁସାରେ। କାଲି ବି ସେହିପରି।",
  },
  mr: {
    noMeals: "उद्या एक फोटो, आणि दिवस पुन्हा मोजणीत.",
    over: "आज {over} जास्त — उद्या पुन्हा {plan} पासून सुरुवात.",
    protein: "प्रोटीन {gap} g कमी पडले — नाश्त्याला अंडी किंवा दही घेतल्यास ते भरून निघेल.",
    gainUnder: "प्लॅनपेक्षा {under}kcal कमी — उद्या मूठभर सुकामेवा घेतल्यास ते भरून निघेल.",
    under: "प्लॅनपेक्षा {under} कमी — उद्या पूर्ण आकडा खाणे हाच प्लॅन आहे, चूक नव्हे.",
    onPlan: "प्लॅननुसार. उद्याही असेच.",
  },
  ml: {
    noMeals: "നാളെ ഒരു ഫോട്ടോ, ആ ദിവസം വീണ്ടും കണക്കിൽ.",
    over: "ഇന്ന് {over} കൂടുതൽ — നാളെ വീണ്ടും {plan} മുതൽ തുടങ്ങും.",
    protein: "പ്രോട്ടീൻ {gap} g കുറവായിരുന്നു — പ്രഭാതഭക്ഷണത്തിന് മുട്ടയോ സ്കീറോ കഴിച്ചാൽ അത് നികത്താം.",
    gainUnder: "പ്ലാനിനെക്കാൾ {under}kcal കുറവ് — നാളെ ഒരു പിടി നട്സ് കഴിച്ചാൽ അത് നികത്താം.",
    under: "പ്ലാനിനെക്കാൾ {under} കുറവ് — നാളെ മുഴുവൻ സംഖ്യയും കഴിക്കുന്നതാണ് പ്ലാൻ, അതൊരു വീഴ്ചയല്ല.",
    onPlan: "പ്ലാൻ പ്രകാരം. നാളെയും ഇതുപോലെ.",
  },
  kn: {
    noMeals: "ನಾಳೆ ಒಂದು ಫೋಟೋ, ದಿನ ಮತ್ತೆ ಲೆಕ್ಕಕ್ಕೆ ಬರುತ್ತದೆ.",
    over: "ಇಂದು {over} ಹೆಚ್ಚು — ನಾಳೆ ಮತ್ತೆ ಪೂರ್ಣ {plan} ಸಿಗುತ್ತದೆ.",
    protein: "ಪ್ರೋಟೀನ್ {gap} g ಕಡಿಮೆ ಆಯಿತು — ಬೆಳಗಿನ ಉಪಾಹಾರದಲ್ಲಿ ಮೊಟ್ಟೆ ಅಥವಾ ಮೊಸರು ಅದನ್ನು ತುಂಬುತ್ತದೆ.",
    gainUnder: "ಪ್ಲಾನ್‌ಗಿಂತ {under}kcal ಕಡಿಮೆ — ನಾಳೆ ಒಂದು ಹಿಡಿ ಬೀಜಗಳು ಅದನ್ನು ತುಂಬುತ್ತವೆ.",
    under: "ಪ್ಲಾನ್‌ಗಿಂತ {under} ಕಡಿಮೆ — ನಾಳೆ ಪೂರ್ಣ ಸಂಖ್ಯೆಯಷ್ಟು ತಿನ್ನುವುದೇ ಪ್ಲಾನ್, ತಪ್ಪಲ್ಲ.",
    onPlan: "ಪ್ಲಾನ್‌ಗೆ ತಕ್ಕಂತೆ. ನಾಳೆಯೂ ಹಾಗೆಯೇ.",
  },
  gu: {
    noMeals: "કાલે એક ફોટો, અને દિવસ ફરી ગણતરીમાં.",
    over: "આજે {over} વધુ — કાલે ફરી {plan} થી શરૂઆત.",
    protein: "પ્રોટીન {gap} g ઓછું રહ્યું — નાસ્તામાં ઈંડાં કે દહીંથી તે પૂરું થઈ જશે.",
    gainUnder: "પ્લાન કરતાં {under}kcal ઓછું — કાલે મુઠ્ઠીભર સૂકો મેવો તે પૂરું કરી દેશે.",
    under: "પ્લાન કરતાં {under} ઓછું — કાલે પૂરો આંકડો ખાવો એ જ પ્લાન છે, કોઈ ચૂક નહીં.",
    onPlan: "પ્લાન મુજબ. કાલે પણ આવું જ.",
  },
  bn: {
    noMeals: "কাল একটা ছবি দিলেই দিনটা আবার হিসাবে ফিরবে।",
    over: "আজ {over} বেশি — কাল আবার {plan} থেকে শুরু।",
    protein: "প্রোটিন {gap} g কম ছিল — সকালের নাশতায় ডিম বা দই খেলে তা পূরণ হবে।",
    gainUnder: "প্ল্যানের চেয়ে {under}kcal কম — কাল এক মুঠো বাদাম খেলেই তা পূরণ হবে।",
    under: "প্ল্যানের চেয়ে {under} কম — কাল পুরো সংখ্যাটা খাওয়াই প্ল্যান, কোনো ভুল নয়।",
    onPlan: "প্ল্যান অনুযায়ী। কালও একই রকম।",
  },
  "pt-PT": {
    noMeals: "Amanhã, uma foto volta a pôr o dia no registo.",
    over: "{over} acima hoje — amanhã começa de novo em {plan}.",
    protein: "Faltaram {gap} g de proteína — ovos ou skyr ao pequeno-almoço resolvem.",
    gainUnder: "{under}kcal abaixo do plano — um punhado de frutos secos amanhã resolve.",
    under: "{under} abaixo do plano — comer o número inteiro amanhã é o plano, não um deslize.",
    onPlan: "Dentro do plano. Repete amanhã.",
  },
  ms: {
    noMeals: "Satu foto esok dan hari itu dikira semula.",
    over: "{over} terlebih hari ini — esok bermula semula pada {plan}.",
    protein: "Protein kurang {gap} g — telur atau skyr ketika sarapan boleh mencukupkannya.",
    gainUnder: "{under}kcal kurang daripada pelan — segenggam kacang esok menampungnya.",
    under: "{under} di bawah pelan — makan jumlah penuh esok ialah pelannya, bukan kesilapan.",
    onPlan: "Ikut pelan. Sama lagi esok.",
  },
  ca: {
    noMeals: "Demà, amb una sola foto el dia torna a comptar.",
    over: "{over} de més avui — demà tornes a començar amb {plan}.",
    protein: "Han faltat {gap} g de proteïna — uns ous o skyr a l'esmorzar ho compensen.",
    gainUnder: "Han faltat {under}kcal per al pla — un grapat de fruits secs demà ho cobreix.",
    under: "{under} per sota del pla — demà, menjar tot el que toca és el pla, no un error.",
    onPlan: "Dins del pla. Demà, igual.",
  },
  sl: {
    noMeals: "Ena fotografija jutri in dan spet šteje.",
    over: "Danes {over} nad načrtom — jutri spet začneš pri {plan}.",
    protein: "Beljakovin je zmanjkalo za {gap} g — jajca ali skyr za zajtrk to zapolnijo.",
    gainUnder: "Do načrta je manjkalo {under}kcal — pest oreščkov jutri to pokrije.",
    under: "{under} pod načrtom — če jutri poješ celotno številko, je to načrt, ne spodrsljaj.",
    onPlan: "Po načrtu. Jutri enako.",
  },
  hr: {
    noMeals: "Jedna fotografija sutra i dan se opet računa.",
    over: "Danas {over} preko — sutra opet kreće od {plan}.",
    protein: "Nedostajalo je {gap} g proteina — jaja ili skyr za doručak pokrivaju razliku.",
    gainUnder: "{under}kcal manje od plana — šaka orašastih plodova sutra to pokriva.",
    under: "{under} ispod plana — sutra pojedi cijeli iznos: to je plan, a ne posrtaj.",
    onPlan: "U planu. Sutra isto.",
  },
  sk: {
    noMeals: "Jedna fotka zajtra a deň je znova v hre.",
    over: "Dnes {over} nad plánom — zajtra sa znova začína na {plan}.",
    protein: "Bielkovín chýbalo {gap} g — vajcia alebo skyr na raňajky to doplnia.",
    gainUnder: "Do plánu chýbalo {under}kcal — hrsť orieškov zajtra to pokryje.",
    under: "Dnes {under} pod plánom — zjesť zajtra celé číslo je plán, nie zakopnutie.",
    onPlan: "Podľa plánu. Zajtra znova tak.",
  },
  no: {
    noMeals: "Ett bilde i morgen, så teller dagen igjen.",
    over: "{over} over i dag — i morgen begynner du på {plan} igjen.",
    protein: "Proteinet var {gap} g for lite — egg eller skyr til frokost tetter gapet.",
    gainUnder: "{under}kcal under planen — en neve nøtter i morgen dekker det.",
    under: "{under} under planen — å spise hele tallet i morgen er planen, ikke en glipp.",
    onPlan: "Innenfor planen. Likedan i morgen.",
  },
  fi: {
    noMeals: "Yksi kuva huomenna, niin päivä lasketaan taas.",
    over: "Tänään {over} yli – huomenna lähtökohta on taas {plan}.",
    protein: "Proteiinia jäi {gap} g vajaaksi – kananmunat tai rahka aamiaisella paikkaavat sen.",
    gainUnder: "{under}kcal suunnitelmasta jäi syömättä – kourallinen pähkinöitä huomenna paikkaa sen.",
    under: "{under} alle suunnitelman – koko määrän syöminen huomenna on suunnitelma, ei lipsahdus.",
    onPlan: "Suunnitelman mukaan. Samoin huomenna.",
  },
  da: {
    noMeals: "Ét foto i morgen, så tæller dagen igen.",
    over: "{over} over i dag — i morgen starter vi på {plan} igen.",
    protein: "Protein manglede {gap} g — æg eller skyr til morgenmad lukker hullet.",
    gainUnder: "{under}kcal under planen — en håndfuld nødder i morgen dækker det.",
    under: "{under} under planen — at spise hele tallet i morgen er planen, ikke et fejltrin.",
    onPlan: "Inden for planen. Det samme igen i morgen.",
  },
  hu: {
    noMeals: "Egy fotó holnap, és a nap újra számít.",
    over: "Ma {over} túllépés — holnap újra {plan} a kiindulás.",
    protein: "{gap} g fehérje hiányzott — tojás vagy skyr reggelire pótolja.",
    gainUnder: "{under}kcal hiányzott a tervhez — holnap egy marék dió pótolja.",
    under: "{under} a terv alatt — holnap a teljes mennyiséget megenni maga a terv, nem botlás.",
    onPlan: "A terv szerint. Holnap ugyanígy.",
  },
  el: {
    noMeals: "Μια φωτογραφία αύριο και η μέρα μετράει ξανά.",
    over: "{over} πάνω σήμερα — αύριο ξεκινάς ξανά με {plan}.",
    protein: "Έλειψαν {gap} g πρωτεΐνης — αυγά ή skyr στο πρωινό καλύπτουν τη διαφορά.",
    gainUnder: "{under}kcal κάτω από το πλάνο — μια χούφτα ξηροί καρποί αύριο το καλύπτουν.",
    under: "{under} κάτω από το πλάνο — αύριο τρως όλο το νούμερο: αυτό είναι το πλάνο, όχι στραβοπάτημα.",
    onPlan: "Εντός πλάνου. Αύριο πάλι τα ίδια.",
  },
  ro: {
    noMeals: "O fotografie mâine și ziua contează din nou.",
    over: "{over} peste azi — mâine începi din nou de la {plan}.",
    protein: "Proteinele au fost cu {gap} g sub țintă — ouă sau skyr la micul dejun acoperă diferența.",
    gainUnder: "Cu {under}kcal sub plan — o mână de nuci mâine acoperă diferența.",
    under: "{under} sub plan — să mănânci mâine tot numărul e planul, nu o abatere.",
    onPlan: "Conform planului. La fel și mâine.",
  },
  cs: {
    noMeals: "Zítra stačí jedna fotka a den se zase počítá.",
    over: "Dnes {over} nad plánem — zítra se začíná znovu od {plan}.",
    protein: "Bílkovin chybělo {gap} g — vejce nebo skyr ke snídani to doženou.",
    gainUnder: "Do plánu chybělo {under}kcal — hrst ořechů zítra to pokryje.",
    under: "{under} pod plánem — sníst zítra celé číslo je plán, ne zakopnutí.",
    onPlan: "Podle plánu. Zítra zase tak.",
  },
  hi: {
    noMeals: "कल एक फ़ोटो, और दिन फिर से गिनती में।",
    over: "आज {over} ज़्यादा — कल फिर से {plan} से शुरुआत।",
    protein: "प्रोटीन {gap} g कम रहा — नाश्ते में अंडे या दही से यह पूरा हो जाएगा।",
    gainUnder: "प्लान से {under}kcal कम — कल मुट्ठी भर मेवे से यह पूरा हो जाएगा।",
    under: "प्लान से {under} कम — कल पूरा नंबर खाना ही प्लान है, कोई चूक नहीं।",
    onPlan: "प्लान के मुताबिक। कल भी ऐसा ही।",
  },
  th: {
    noMeals: "รูปเดียวพรุ่งนี้ วันนั้นก็กลับมานับอีกครั้ง",
    over: "วันนี้เกิน {over} — พรุ่งนี้เริ่มที่ {plan} ใหม่",
    protein: "โปรตีนขาดไป {gap} ก. — ไข่หรือสกีร์ตอนเช้าช่วยเติมได้",
    gainUnder: "ยังขาดอีก {under}kcal จากแผน — ถั่วสักกำมือพรุ่งนี้ก็พอ",
    under: "ต่ำกว่าแผน {under} — พรุ่งนี้กินให้ครบตามตัวเลขคือแผน ไม่ใช่การพลาด",
    onPlan: "ตรงตามแผน พรุ่งนี้ทำแบบเดิมอีกนะ",
  },
  sv: {
    noMeals: "Ett foto i morgon, så räknas dagen igen.",
    over: "{over} över i dag — i morgon börjar det om på {plan}.",
    protein: "Proteinet hamnade {gap} g under — ägg eller skyr till frukost fyller luckan.",
    gainUnder: "{under}kcal under planen — en näve nötter i morgon täcker det.",
    under: "{under} under planen — att äta hela siffran i morgon är planen, inte ett snedsteg.",
    onPlan: "Enligt planen. Samma igen i morgon.",
  },
  uk: {
    noMeals: "Одне фото завтра — і день знову в рахунку.",
    over: "Сьогодні {over} понад план — завтра знову починаєш із {plan}.",
    protein: "Білка забракло {gap} г — яйця чи скир на сніданок це закриють.",
    gainUnder: "До плану забракло {under}ккал — жменя горіхів завтра це покриє.",
    under: "{under} нижче плану. З'їсти завтра всю цифру — це і є план, а не зрив.",
    onPlan: "За планом. Завтра — так само.",
  },
  nl: {
    noMeals: "Eén foto morgen en de dag telt weer mee.",
    over: "Vandaag {over} erover — morgen begint weer bij {plan}.",
    protein: "Eiwit kwam {gap} g tekort — eieren of skyr bij het ontbijt vullen dat aan.",
    gainUnder: "{under}kcal onder het plan — een handje noten morgen vult dat aan.",
    under: "{under} onder het plan — morgen het volledige aantal eten is het plan, geen misstap.",
    onPlan: "Volgens plan. Morgen hetzelfde.",
  },
  pl: {
    noMeals: "Jedno zdjęcie jutro i dzień znów się liczy.",
    over: "Dziś {over} ponad plan — jutro znów zaczynasz od {plan}.",
    protein: "Białka zabrakło {gap} g — jajka lub skyr na śniadanie uzupełnią lukę.",
    gainUnder: "{under}kcal poniżej planu — jutro garść orzechów to pokryje.",
    under: "{under} poniżej planu — zjedzenie jutro pełnej liczby to plan, a nie wpadka.",
    onPlan: "Zgodnie z planem. Jutro tak samo.",
  },
  tr: {
    noMeals: "Yarın bir fotoğraf, günü yeniden tabloya koyar.",
    over: "Bugün {over} fazla — yarın yine {plan} ile başlıyor.",
    protein: "Protein {gap} g eksik kaldı — kahvaltıda yumurta ya da skyr bunu kapatır.",
    gainUnder: "Plana {under}kcal eksik — yarın bir avuç kuruyemiş bunu karşılar.",
    under: "Planın {under} altında — yarın sayının tamamını yemek plan, kaçamak değil.",
    onPlan: "Plana uygun. Yarın da aynısı.",
  },
  "zh-Hant": {
    noMeals: "明天拍一張照片，這一天就重新算進去了。",
    over: "今天超過 {over}，明天又從 {plan} 重新開始。",
    protein: "蛋白質少了 {gap} 公克，早餐吃蛋或優格就能補上。",
    gainUnder: "比計畫少 {under}大卡，明天吃一把堅果就補上了。",
    under: "比計畫少 {under}。明天吃足計畫的量是照計畫走，不是失誤。",
    onPlan: "符合計畫。明天照樣。",
  },
  "zh-Hans": {
    noMeals: "明天拍一张照片，就能重新开始记录。",
    over: "今天超出{over}——明天重新从{plan}开始。",
    protein: "蛋白质少了{gap}克——早餐吃鸡蛋或冰岛酸奶就能补上。",
    gainUnder: "比计划少了{under}千卡——明天一把坚果就能补上。",
    under: "比计划少了{under}——明天吃满这个数字就是计划本身，不算失误。",
    onPlan: "符合计划。明天照旧。",
  },
  ko: {
    noMeals: "내일 사진 한 장이면 다시 기록이 이어져요.",
    over: "오늘 {over} 초과 — 내일은 다시 {plan}부터 시작해요.",
    protein: "단백질이 {gap}g 부족했어요 — 아침에 달걀이나 스키르를 먹으면 채워져요.",
    gainUnder: "플랜보다 {under}kcal 적어요 — 내일 견과류 한 줌이면 채울 수 있어요.",
    under: "플랜보다 {under} 적어요 — 내일 목표만큼 다 먹는 건 실수가 아니라 플랜대로예요.",
    onPlan: "플랜대로예요. 내일도 똑같이 가요.",
  },
  ja: {
    noMeals: "明日写真を1枚撮れば、また記録に戻れます。",
    over: "今日は{over}オーバー。明日はまた{plan}から始まります。",
    protein: "タンパク質が{gap}g不足。朝食に卵やスキールを足せば埋まります。",
    gainUnder: "プランまで{under}kcal不足。明日ナッツをひとつかみ足せば補えます。",
    under: "プランより{under}少なめ。明日しっかり全部食べるのはプランどおりで、失敗ではありません。",
    onPlan: "プランどおりです。明日も同じ調子で。",
  },
  "pt-BR": {
    noMeals: "Amanhã, uma foto já coloca o dia de volta no registro.",
    over: "{over} acima hoje — amanhã começa de novo em {plan}.",
    protein: "Faltaram {gap} g de proteína — ovos ou skyr no café da manhã resolvem.",
    gainUnder: "{under}kcal abaixo do plano — um punhado de castanhas amanhã resolve.",
    under: "{under} abaixo do plano — comer o número inteiro amanhã é o plano, não um deslize.",
    onPlan: "Dentro do plano. Repita amanhã.",
  },
};

export interface EveningInput {
  targets: FoodTargets;
  totals: { kcal: number; protein_g: number };
  goal: Goal;
  /** Meals logged on the day. Zero is its own sentence, not a total of nothing. */
  meals: number;
}

/**
 * The retention-bearing half of the 20:30 line: ONE concrete thing for tomorrow.
 *
 * R1 is explicit that totals alone are a diary — the prescription is what makes the message worth
 * receiving. Deterministic, like `firstVerdictLines`: the model is never asked for it, so it cannot
 * invent a number, and it is compiled in rather than admin-editable for the same reason the
 * onboarding QUESTIONS are, since each branch is a claim about the user's own day.
 *
 * One sentence, one lever, in priority order. A message that names three things is a message that
 * names none. THE ORDER IS NOT TRANSLATABLE and is why the branching stayed here while the wording
 * moved into `EVENING_PRESCRIPTIONS`.
 */
export function eveningPrescription(i: EveningInput, lang: Lang): string {
  const say = t(lang)(EVENING_PRESCRIPTIONS);
  const n = wholeNumbers(lang);
  const kn = kcalNumbers(lang);
  if (i.meals === 0) return say.noMeals;

  const overBy = i.totals.kcal - i.targets.kcal;
  if (i.goal !== "gain" && overBy > 0) {
    return fill(say.over, { over: kn(overBy), plan: kn(i.targets.kcal) });
  }

  const proteinGap = i.targets.protein_g - i.totals.protein_g;
  if (proteinGap >= PROTEIN_GAP_G) return fill(say.protein, { gap: n(proteinGap) });

  const underBy = -overBy;
  if (i.goal === "gain" && underBy >= UNDER_KCAL_GAIN) return fill(say.gainUnder, { under: kn(underBy) });
  if (i.goal !== "gain" && underBy >= UNDER_KCAL) return fill(say.under, { under: kn(underBy) });

  return say.onPlan;
}
