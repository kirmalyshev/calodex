// The welcome and sign-up screen's words (#110): the welcome's two doors, then the sign-up
// screen's headline, consent boxes and error. Moved out of `PAGE_COPY` (S8 put them in
// `src/backend/web/copy.ts`, which is backend-only) because the phone's sign-up — M3,
// ieat-app#922 — draws the same screen and would otherwise write its own eight-language copy.
// `chatRefusalIdentity` stays in `PAGE_COPY` — it is
// the chat surface's `identity-required` refusal, not a word this screen owns.

import { t, type Localized } from "../lang.ts";
import type { Lang } from "../types.ts";

export interface SignupCopy {
  /** The welcome's primary — into the questions, which is where the session account is born. */
  startCta: string;
  /** The welcome's secondary — for somebody whose account already exists. */
  haveAccountCta: string;
  /** The sign-up screen's headline — the product's promise, said once. */
  signUpHeading: string;
  /** The heading when the person arrives from their plan (19, ieat-app#2050): "Save your progress". Web only. */
  saveHeading: string;
  /** The heading when a camera or dock refusal with no purchase asks for the identity (26): "Sign in to log this meal". */
  signInMealHeading: string;
  /**
   * A provider button's label: "Continue with Apple", "Continue with Google". `{provider}`
   * holds the brand, because a language puts it where its grammar needs it — moved out of
   * `PAGE_COPY` for the phone, whose sign-up screen draws the same buttons (ieat-app#922).
   * Apple renders its own system label on iOS; only Google reads this there.
   */
  continueWith: string;
  /**
   * The third provider's label (#569): "Continue with email" — email is a WORD here, not a
   * brand, so it is its own translated key rather than `{provider}` filled with one.
   */
  continueEmail: string;
  /**
   * The consent line: on the phone a byline under the provider buttons — continuing IS the
   * agreement, there is no box (ieat-app#2806) — and on the web sign-up still the required box's
   * label. `{terms}` and `{privacy}` hold the two document names, so a translation puts them
   * wherever its grammar needs them rather than reordering a sentence that was written in English.
   */
  termsLabel: string;
  /** The document names inside `termsLabel` — each links where the operator published it. */
  termsLink: string;
  privacyLink: string;
  /** The optional box. Unticked means nothing is recorded — the stamp is a date, not a boolean. */
  consentMarketing: string;
  /** What a sign-up POST without the terms tick comes back to. */
  errorTerms: string;
}

export const SIGNUP_COPY: Localized<SignupCopy> = {
  en: {
    startCta: "Build my plan",
    haveAccountCta: "I already have an account",
    continueWith: "Continue with {provider}",
    continueEmail: "Continue with email",
    signUpHeading: "Photograph what you eat, get an honest answer",
    saveHeading: "Save your progress",
    signInMealHeading: "Sign in to log this meal",
    termsLabel: "By continuing, you agree to {app}'s {terms} and {privacy}",
    termsLink: "Terms",
    privacyLink: "Privacy Policy",
    consentMarketing: "Send me tips and new features from {app}",
    errorTerms: "Agree to the Terms and Privacy Policy to continue.",
  },


  fr: {
    startCta: "Créer mon plan",
    haveAccountCta: "J'ai déjà un compte",
    continueWith: "Continuer avec {provider}",
    continueEmail: "Continuer par e-mail",
    signUpHeading: "Photographie ce que tu manges, reçois une réponse honnête",
    saveHeading: "Sauvegarde ta progression",
    signInMealHeading: "Connecte-toi pour noter ce repas",
    termsLabel: "En continuant, tu acceptes les {terms} et la {privacy} {d_app}",
    termsLink: "Conditions",
    privacyLink: "Politique de confidentialité",
    consentMarketing: "Envoie-moi des conseils et les nouveautés {d_app}",
    errorTerms: "Accepte les Conditions et la Politique de confidentialité pour continuer.",
  },


  de: {
    startCta: "Meinen Plan erstellen",
    haveAccountCta: "Ich habe schon ein Konto",
    continueWith: "Weiter mit {provider}",
    continueEmail: "Weiter per E-Mail",
    signUpHeading: "Fotografier, was du isst, und bekomm eine ehrliche Antwort",
    saveHeading: "Speichere deinen Fortschritt",
    signInMealHeading: "Melde dich an, um diese Mahlzeit zu erfassen",
    termsLabel: "Wenn du fortfährst, stimmst du den {terms} und der {privacy} von {app} zu",
    termsLink: "Nutzungsbedingungen",
    privacyLink: "Datenschutzerklärung",
    consentMarketing: "Schick mir Tipps und neue Funktionen von {app}",
    errorTerms: "Stimm den Nutzungsbedingungen und der Datenschutzerklärung zu, um weiterzumachen.",
  },


  it: {
    startCta: "Crea il mio piano",
    haveAccountCta: "Ho già un account",
    continueWith: "Continua con {provider}",
    continueEmail: "Continua con l'email",
    signUpHeading: "Fotografa quello che mangi, ricevi una risposta onesta",
    saveHeading: "Salva i tuoi progressi",
    signInMealHeading: "Accedi per registrare questo pasto",
    termsLabel: "Continuando, accetti i {terms} e l’{privacy} di {app}",
    termsLink: "Termini",
    privacyLink: "Informativa sulla privacy",
    consentMarketing: "Inviami consigli e novità da {app}",
    errorTerms: "Accetta i Termini e l'Informativa sulla privacy per continuare.",
  },


  es: {
    startCta: "Crear mi plan",
    haveAccountCta: "Ya tengo una cuenta",
    continueWith: "Continuar con {provider}",
    continueEmail: "Continuar con el correo",
    signUpHeading: "Fotografía lo que comes, recibe una respuesta honesta",
    saveHeading: "Guarda tu progreso",
    signInMealHeading: "Inicia sesión para registrar esta comida",
    termsLabel: "Al continuar, aceptas los {terms} y la {privacy} de {app}",
    termsLink: "Términos",
    privacyLink: "Política de privacidad",
    consentMarketing: "Envíame consejos y novedades de {app}",
    errorTerms: "Acepta los Términos y la Política de privacidad para continuar.",
  },


  vi: {
    startCta: "Lập kế hoạch cho mình",
    haveAccountCta: "Mình đã có tài khoản",
    continueWith: "Tiếp tục với {provider}",
    continueEmail: "Tiếp tục bằng email",
    signUpHeading: "Chụp món bạn ăn, nhận câu trả lời thẳng thắn",
    saveHeading: "Lưu tiến trình của bạn",
    signInMealHeading: "Đăng nhập để ghi lại bữa ăn này",
    termsLabel: "Khi tiếp tục, bạn đồng ý với {terms} và {privacy} của {app}",
    termsLink: "Điều khoản",
    privacyLink: "Chính sách quyền riêng tư",
    consentMarketing: "Gửi cho mình mẹo và tính năng mới từ {app}",
    errorTerms: "Đồng ý với Điều khoản và Chính sách quyền riêng tư để tiếp tục.",
  },


  id: {
    startCta: "Buat rencanaku",
    haveAccountCta: "Aku sudah punya akun",
    continueWith: "Lanjutkan dengan {provider}",
    continueEmail: "Lanjutkan dengan email",
    signUpHeading: "Foto makananmu, dapatkan jawaban jujur",
    saveHeading: "Simpan progresmu",
    signInMealHeading: "Masuk untuk mencatat makanan ini",
    termsLabel: "Dengan melanjutkan, kamu menyetujui {terms} dan {privacy} {app}",
    termsLink: "Ketentuan",
    privacyLink: "Kebijakan Privasi",
    consentMarketing: "Kirimi aku tips dan fitur baru dari {app}",
    errorTerms: "Setujui Ketentuan dan Kebijakan Privasi untuk melanjutkan.",
  },


  ru: {
    startCta: "Составить мой план",
    haveAccountCta: "У меня уже есть аккаунт",
    continueWith: "Продолжить через {provider}",
    continueEmail: "Продолжить через e-mail",
    signUpHeading: "Сфотографируй еду — получи честный ответ",
    saveHeading: "Сохрани свой прогресс",
    signInMealHeading: "Войди, чтобы записать этот приём пищи",
    termsLabel: "Продолжая, вы принимаете {terms} и {privacy} {app}",
    termsLink: "Условия",
    privacyLink: "Политику конфиденциальности",
    consentMarketing: "Присылать мне советы и новинки {app}",
    errorTerms: "Чтобы продолжить, прими Условия и Политику конфиденциальности.",
  },


  te: {
    startCta: "నా ప్లాన్ రూపొందించండి",
    haveAccountCta: "నాకు ఇప్పటికే ఖాతా ఉంది",
    continueWith: "{provider} ద్వారా కొనసాగించండి",
    continueEmail: "ఈమెయిల్‌తో కొనసాగించండి",
    signUpHeading: "మీరు తినేదాన్ని ఫోటో తీయండి, నిజాయితీగల సమాధానం పొందండి",
    saveHeading: "మీ ప్రోగ్రెస్‌ను సేవ్ చేయండి",
    signInMealHeading: "ఈ భోజనాన్ని నమోదు చేయడానికి సైన్ ఇన్ చేయండి",
    termsLabel: "కొనసాగడం ద్వారా, మీరు {app} {terms}, {privacy} — వీటికి అంగీకరిస్తున్నారు",
    termsLink: "నిబంధనలు",
    privacyLink: "గోప్యతా విధానం",
    consentMarketing: "{app} నుండి చిట్కాలు, కొత్త ఫీచర్‌లు నాకు పంపండి",
    errorTerms: "కొనసాగడానికి నిబంధనలు, గోప్యతా విధానానికి అంగీకరించండి.",
  },


  ta: {
    startCta: "என் திட்டத்தை உருவாக்கு",
    haveAccountCta: "எனக்கு ஏற்கெனவே கணக்கு உள்ளது",
    continueWith: "{provider} மூலம் தொடர்க",
    continueEmail: "மின்னஞ்சல் மூலம் தொடர்க",
    signUpHeading: "நீங்கள் சாப்பிடுவதைப் புகைப்படம் எடுங்கள், நேர்மையான பதிலைப் பெறுங்கள்",
    saveHeading: "உங்கள் முன்னேற்றத்தைச் சேமியுங்கள்",
    signInMealHeading: "இந்த உணவைப் பதிவு செய்ய உள்நுழையுங்கள்",
    termsLabel: "தொடர்வதன் மூலம், {app}-இன் {terms} மற்றும் {privacy} ஆகியவற்றை ஏற்கிறீர்கள்",
    termsLink: "விதிமுறைகள்",
    privacyLink: "தனியுரிமைக் கொள்கை",
    consentMarketing: "{app}-இலிருந்து குறிப்புகளையும் புதிய அம்சங்களையும் எனக்கு அனுப்பவும்",
    errorTerms: "தொடர விதிமுறைகளையும் தனியுரிமைக் கொள்கையையும் ஏற்கவும்.",
  },


  pa: {
    startCta: "ਮੇਰਾ ਪਲਾਨ ਬਣਾਓ",
    haveAccountCta: "ਮੇਰਾ ਪਹਿਲਾਂ ਤੋਂ ਅਕਾਊਂਟ ਹੈ",
    continueWith: "{provider} ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    continueEmail: "ਈਮੇਲ ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    signUpHeading: "ਆਪਣੇ ਖਾਣੇ ਦੀ ਫ਼ੋਟੋ ਲਓ, ਇਮਾਨਦਾਰ ਜਵਾਬ ਪਾਓ",
    saveHeading: "ਆਪਣੀ ਪ੍ਰਗਤੀ ਸੇਵ ਕਰੋ",
    signInMealHeading: "ਇਹ ਭੋਜਨ ਲਿਖਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ",
    termsLabel: "ਜਾਰੀ ਰੱਖਣ ਨਾਲ, ਤੁਸੀਂ {app} ਦੀਆਂ {terms} ਅਤੇ {privacy} ਨਾਲ ਸਹਿਮਤ ਹੁੰਦੇ ਹੋ",
    termsLink: "ਸ਼ਰਤਾਂ",
    privacyLink: "ਪਰਦੇਦਾਰੀ ਨੀਤੀ",
    consentMarketing: "ਮੈਨੂੰ {app} ਤੋਂ ਸੁਝਾਅ ਅਤੇ ਨਵੇਂ ਫ਼ੀਚਰ ਭੇਜੋ",
    errorTerms: "ਜਾਰੀ ਰੱਖਣ ਲਈ ਸ਼ਰਤਾਂ ਅਤੇ ਪਰਦੇਦਾਰੀ ਨੀਤੀ ਨਾਲ ਸਹਿਮਤੀ ਦਿਓ।",
  },


  or: {
    startCta: "ମୋ ପ୍ଲାନ୍ ତିଆରି କରନ୍ତୁ",
    haveAccountCta: "ମୋର ପୂର୍ବରୁ ଆକାଉଣ୍ଟ ଅଛି",
    continueWith: "{provider} ସହ ଜାରି ରଖନ୍ତୁ",
    continueEmail: "ଇମେଲ୍ ସହ ଜାରି ରଖନ୍ତୁ",
    signUpHeading: "ଯାହା ଖାଉଛନ୍ତି ତାହାର ଫଟୋ ନିଅନ୍ତୁ, ସଚ୍ଚୋଟ ଉତ୍ତର ପାଆନ୍ତୁ",
    saveHeading: "ଆପଣଙ୍କ ପ୍ରଗତି ସେଭ୍ କରନ୍ତୁ",
    signInMealHeading: "ଏହି ଖାଦ୍ୟଟିକୁ ଲେଖିବା ପାଇଁ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
    termsLabel: "ଜାରି ରଖିଲେ, ତୁମେ {app} ର {terms} ଓ {privacy} ସହ ସହମତ ହେଉଛ",
    termsLink: "ସର୍ତ୍ତାବଳୀ",
    privacyLink: "ଗୋପନୀୟତା ନୀତି",
    consentMarketing: "{app} ରୁ ମୋତେ ଟିପ୍ସ ଓ ନୂଆ ଫିଚର୍ ପଠାନ୍ତୁ",
    errorTerms: "ଜାରି ରଖିବାକୁ ସର୍ତ୍ତାବଳୀ ଓ ଗୋପନୀୟତା ନୀତିରେ ସହମତି ଦିଅନ୍ତୁ।",
  },


  mr: {
    startCta: "माझा प्लॅन तयार करा",
    haveAccountCta: "माझे आधीच अकाउंट आहे",
    continueWith: "{provider} सह पुढे जा",
    continueEmail: "ईमेलसह पुढे जा",
    signUpHeading: "तुम्ही जे खाता त्याचा फोटो काढा, प्रामाणिक उत्तर मिळवा",
    saveHeading: "तुमची प्रगती सेव्ह करा",
    signInMealHeading: "हे जेवण नोंदवण्यासाठी साइन इन करा",
    termsLabel: "पुढे चालू ठेवल्यास, तुम्ही {app} च्या {terms} आणि {privacy} शी सहमत असता",
    termsLink: "अटी",
    privacyLink: "गोपनीयता धोरण",
    consentMarketing: "{app} कडून टिप्स आणि नवीन फीचर्स मला पाठवा",
    errorTerms: "पुढे जाण्यासाठी अटी आणि गोपनीयता धोरणाशी सहमत व्हा.",
  },


  ml: {
    startCta: "എന്റെ പ്ലാൻ തയ്യാറാക്കൂ",
    haveAccountCta: "എനിക്ക് ഇതിനകം അക്കൗണ്ടുണ്ട്",
    continueWith: "{provider} ഉപയോഗിച്ച് തുടരുക",
    continueEmail: "ഇമെയിൽ ഉപയോഗിച്ച് തുടരുക",
    signUpHeading: "കഴിക്കുന്നതിന്റെ ഫോട്ടോ എടുക്കൂ, സത്യസന്ധമായ മറുപടി നേടൂ",
    saveHeading: "നിങ്ങളുടെ പുരോഗതി സംരക്ഷിക്കൂ",
    signInMealHeading: "ഈ ഭക്ഷണം രേഖപ്പെടുത്താൻ സൈൻ ഇൻ ചെയ്യൂ",
    termsLabel: "തുടരുമ്പോൾ, നിങ്ങൾ {app}-ന്റെ {terms}, {privacy} എന്നിവ അംഗീകരിക്കുന്നു",
    termsLink: "നിബന്ധനകൾ",
    privacyLink: "സ്വകാര്യതാ നയം",
    consentMarketing: "{app}-ൽ നിന്നുള്ള നുറുങ്ങുകളും പുതിയ ഫീച്ചറുകളും എനിക്ക് അയയ്ക്കൂ",
    errorTerms: "തുടരാൻ നിബന്ധനകളും സ്വകാര്യതാ നയവും അംഗീകരിക്കൂ.",
  },


  kn: {
    startCta: "ನನ್ನ ಪ್ಲಾನ್ ರೂಪಿಸಿ",
    haveAccountCta: "ನನಗೆ ಈಗಾಗಲೇ ಖಾತೆ ಇದೆ",
    continueWith: "{provider} ಮೂಲಕ ಮುಂದುವರಿಸಿ",
    continueEmail: "ಇಮೇಲ್ ಮೂಲಕ ಮುಂದುವರಿಸಿ",
    signUpHeading: "ನೀವು ತಿನ್ನುವುದರ ಫೋಟೋ ತೆಗೆಯಿರಿ, ಪ್ರಾಮಾಣಿಕ ಉತ್ತರ ಪಡೆಯಿರಿ",
    saveHeading: "ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಉಳಿಸಿ",
    signInMealHeading: "ಈ ಊಟವನ್ನು ದಾಖಲಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
    termsLabel: "ಮುಂದುವರಿಸುವ ಮೂಲಕ, ನೀವು {app} ನ {terms} ಮತ್ತು {privacy} ಗೆ ಒಪ್ಪುತ್ತೀರಿ",
    termsLink: "ನಿಯಮಗಳು",
    privacyLink: "ಗೌಪ್ಯತಾ ನೀತಿ",
    consentMarketing: "{app} ನಿಂದ ಸಲಹೆಗಳು ಮತ್ತು ಹೊಸ ಫೀಚರ್‌ಗಳನ್ನು ನನಗೆ ಕಳುಹಿಸಿ",
    errorTerms: "ಮುಂದುವರಿಯಲು ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಗೆ ಒಪ್ಪಿಗೆ ನೀಡಿ.",
  },


  gu: {
    startCta: "મારો પ્લાન બનાવો",
    haveAccountCta: "મારું એકાઉન્ટ પહેલેથી છે",
    continueWith: "{provider} સાથે ચાલુ રાખો",
    continueEmail: "ઇમેઇલ સાથે ચાલુ રાખો",
    signUpHeading: "તમે જે ખાઓ તેનો ફોટો લો, પ્રામાણિક જવાબ મેળવો",
    saveHeading: "તમારી પ્રગતિ સેવ કરો",
    signInMealHeading: "આ ભોજન નોંધવા માટે સાઇન ઇન કરો",
    termsLabel: "ચાલુ રાખવાથી, તમે {app}ની {terms} અને {privacy} સાથે સંમત થાઓ છો",
    termsLink: "શરતો",
    privacyLink: "ગોપનીયતા નીતિ",
    consentMarketing: "મને {app} તરફથી ટિપ્સ અને નવાં ફીચર મોકલો",
    errorTerms: "ચાલુ રાખવા માટે શરતો અને ગોપનીયતા નીતિ સાથે સંમતિ આપો.",
  },


  bn: {
    startCta: "আমার প্ল্যান তৈরি করুন",
    haveAccountCta: "আমার আগে থেকেই অ্যাকাউন্ট আছে",
    continueWith: "{provider} দিয়ে চালিয়ে যান",
    continueEmail: "ইমেইল দিয়ে চালিয়ে যান",
    signUpHeading: "যা খান তার ছবি তুলুন, সৎ উত্তর পান",
    saveHeading: "আপনার অগ্রগতি সেভ করুন",
    signInMealHeading: "এই খাবারটি লিখে রাখতে সাইন ইন করুন",
    termsLabel: "চালিয়ে গেলে, আপনি {app}-এর {terms} ও {privacy} মেনে নিচ্ছেন",
    termsLink: "শর্তাবলি",
    privacyLink: "গোপনীয়তা নীতি",
    consentMarketing: "{app} থেকে আমাকে টিপস ও নতুন ফিচারের খবর পাঠান",
    errorTerms: "চালিয়ে যেতে শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন।",
  },


  "pt-PT": {
    startCta: "Criar o meu plano",
    haveAccountCta: "Já tenho uma conta",
    continueWith: "Continuar com {provider}",
    continueEmail: "Continuar com e-mail",
    signUpHeading: "Fotografa o que comes e recebe uma resposta honesta",
    saveHeading: "Guarda o teu progresso",
    signInMealHeading: "Inicia sessão para registar esta refeição",
    termsLabel: "Ao continuar, concorda com os {terms} e a {privacy} do {app}",
    termsLink: "Termos",
    privacyLink: "Política de Privacidade",
    consentMarketing: "Quero receber dicas e novidades do {app}",
    errorTerms: "Aceita os Termos e a Política de Privacidade para continuar.",
  },


  ms: {
    startCta: "Bina pelan saya",
    haveAccountCta: "Saya sudah ada akaun",
    continueWith: "Teruskan dengan {provider}",
    continueEmail: "Teruskan dengan e-mel",
    signUpHeading: "Ambil foto apa yang anda makan, dapatkan jawapan yang jujur",
    saveHeading: "Simpan kemajuan anda",
    signInMealHeading: "Log masuk untuk merekod hidangan ini",
    termsLabel: "Dengan meneruskan, anda bersetuju dengan {terms} dan {privacy} {app}",
    termsLink: "Terma",
    privacyLink: "Dasar Privasi",
    consentMarketing: "Hantarkan saya petua dan ciri baharu daripada {app}",
    errorTerms: "Setuju dengan Terma dan Dasar Privasi untuk teruskan.",
  },


  ca: {
    startCta: "Crea el meu pla",
    haveAccountCta: "Ja tinc un compte",
    continueWith: "Continua amb {provider}",
    continueEmail: "Continua amb el correu",
    signUpHeading: "Fes una foto al que menges i rep una resposta honesta",
    saveHeading: "Desa el teu progrés",
    signInMealHeading: "Inicia sessió per apuntar aquest àpat",
    termsLabel: "En continuar, acceptes les {terms} i la {privacy} {d_app}",
    termsLink: "Condicions",
    privacyLink: "Política de privadesa",
    consentMarketing: "Envia'm consells i novetats {d_app}",
    errorTerms: "Accepta les Condicions i la Política de privadesa per continuar.",
  },


  sl: {
    startCta: "Sestavi moj načrt",
    haveAccountCta: "Račun že imam",
    continueWith: "Nadaljuj z {provider}",
    continueEmail: "Nadaljuj z e-pošto",
    signUpHeading: "Fotografiraj, kar ješ, in dobi pošten odgovor",
    saveHeading: "Shrani svoj napredek",
    signInMealHeading: "Prijavi se, da zabeležiš ta obrok",
    termsLabel: "Z nadaljevanjem se strinjaš s {terms} in {privacy} storitve {app}",
    termsLink: "pogoji uporabe",
    privacyLink: "pravilnikom o zasebnosti",
    consentMarketing: "Pošiljaj mi nasvete in novosti od {app}",
    errorTerms: "Za nadaljevanje sprejmi pogoje uporabe in pravilnik o zasebnosti.",
  },


  hr: {
    startCta: "Izradi moj plan",
    haveAccountCta: "Već imam račun",
    continueWith: "Nastavi uz {provider}",
    continueEmail: "Nastavi e-poštom",
    signUpHeading: "Fotografiraj što jedeš i dobij iskren odgovor",
    saveHeading: "Spremi svoj napredak",
    signInMealHeading: "Prijavi se da zabilježiš ovaj obrok",
    termsLabel: "Nastavljanjem se slažeš s dokumentima {app}: {terms} i {privacy}",
    termsLink: "Uvjeti korištenja",
    privacyLink: "Pravila privatnosti",
    consentMarketing: "Šalji mi savjete i nove značajke od {app}",
    errorTerms: "Za nastavak prihvati Uvjete korištenja i Pravila privatnosti.",
  },


  sk: {
    startCta: "Vytvoriť môj plán",
    haveAccountCta: "Už mám účet",
    continueWith: "Pokračovať cez {provider}",
    continueEmail: "Pokračovať e-mailom",
    signUpHeading: "Odfoť, čo ješ, a dostaneš poctivú odpoveď",
    saveHeading: "Ulož si svoj pokrok",
    signInMealHeading: "Prihlás sa a zapíš si toto jedlo",
    termsLabel: "Pokračovaním prijímaš {terms} a {privacy} aplikácie {app}",
    termsLink: "Podmienky",
    privacyLink: "Zásady ochrany súkromia",
    consentMarketing: "Posielajte mi tipy a novinky od {app}",
    errorTerms: "Na pokračovanie prijmi Podmienky a Zásady ochrany súkromia.",
  },


  no: {
    startCta: "Lag planen min",
    haveAccountCta: "Jeg har allerede en konto",
    continueWith: "Fortsett med {provider}",
    continueEmail: "Fortsett med e-post",
    signUpHeading: "Ta bilde av det du spiser, få et ærlig svar",
    saveHeading: "Lagre fremgangen din",
    signInMealHeading: "Logg inn for å lagre dette måltidet",
    termsLabel: "Ved å fortsette godtar du {terms} og {privacy} for {app}",
    termsLink: "vilkårene",
    privacyLink: "personvernerklæringen",
    consentMarketing: "Send meg tips og nye funksjoner fra {app}",
    errorTerms: "Godta vilkårene og personvernerklæringen for å fortsette.",
  },


  fi: {
    startCta: "Rakenna suunnitelmani",
    haveAccountCta: "Minulla on jo tili",
    continueWith: "Jatka palvelulla {provider}",
    continueEmail: "Jatka sähköpostilla",
    signUpHeading: "Kuvaa, mitä syöt, ja saat rehellisen vastauksen",
    saveHeading: "Tallenna edistymisesi",
    signInMealHeading: "Kirjaudu sisään tallentaaksesi tämän aterian",
    termsLabel: "Jatkamalla hyväksyt {app}-palvelun ehdot: {terms} ja {privacy}",
    termsLink: "Käyttöehdot",
    privacyLink: "Tietosuojakäytäntö",
    consentMarketing: "Lähetä minulle vinkkejä ja uutuuksia {app}-sovelluksesta",
    errorTerms: "Hyväksy käyttöehdot ja tietosuojakäytäntö jatkaaksesi.",
  },


  da: {
    startCta: "Lav min plan",
    haveAccountCta: "Jeg har allerede en konto",
    continueWith: "Fortsæt med {provider}",
    continueEmail: "Fortsæt med e-mail",
    signUpHeading: "Tag et foto af det, du spiser, og få et ærligt svar",
    saveHeading: "Gem dine fremskridt",
    signInMealHeading: "Log ind for at gemme dette måltid",
    termsLabel: "Ved at fortsætte accepterer du {terms} og {privacy} for {app}",
    termsLink: "Vilkår",
    privacyLink: "Privatlivspolitik",
    consentMarketing: "Send mig tips og nye funktioner fra {app}",
    errorTerms: "Accepter Vilkår og Privatlivspolitik for at fortsætte.",
  },


  hu: {
    startCta: "Kérem a tervemet",
    haveAccountCta: "Már van fiókom",
    continueWith: "Folytatás ezzel: {provider}",
    continueEmail: "Folytatás e-maillel",
    signUpHeading: "Fotózd le, amit eszel, és kapj őszinte választ",
    saveHeading: "Mentsd el a haladásodat",
    signInMealHeading: "Jelentkezz be az étkezés rögzítéséhez",
    termsLabel: "Folytatással elfogadod az {app} {terms} és {privacy}",
    termsLink: "Felhasználási feltételeit",
    privacyLink: "Adatvédelmi irányelveit",
    consentMarketing: "Kérek tippeket és újdonságokat az {app}-től",
    errorTerms: "A folytatáshoz fogadd el a Felhasználási feltételeket és az Adatvédelmi irányelveket.",
  },


  el: {
    startCta: "Φτιάξε το πλάνο μου",
    haveAccountCta: "Έχω ήδη λογαριασμό",
    continueWith: "Συνέχεια με {provider}",
    continueEmail: "Συνέχεια με email",
    signUpHeading: "Φωτογράφισε ό,τι τρως, πάρε μια ειλικρινή απάντηση",
    saveHeading: "Αποθήκευσε την πρόοδό σου",
    signInMealHeading: "Σύνδεσου για να καταγράψεις αυτό το γεύμα",
    termsLabel: "Συνεχίζοντας, αποδέχεσαι τους {terms} και την {privacy} του {app}",
    termsLink: "Όρους χρήσης",
    privacyLink: "Πολιτική απορρήτου",
    consentMarketing: "Στείλε μου συμβουλές και νέες λειτουργίες από το {app}",
    errorTerms: "Αποδέξου τους Όρους χρήσης και την Πολιτική απορρήτου για να συνεχίσεις.",
  },


  ro: {
    startCta: "Construiește-mi planul",
    haveAccountCta: "Am deja un cont",
    continueWith: "Continuă cu {provider}",
    continueEmail: "Continuă cu e-mail",
    signUpHeading: "Fotografiază ce mănânci, primește un răspuns onest",
    saveHeading: "Salvează-ți progresul",
    signInMealHeading: "Conectează-te pentru a nota această masă",
    termsLabel: "Continuând, ești de acord cu {terms} și cu {privacy} {app}",
    termsLink: "Termenii",
    privacyLink: "Politica de confidențialitate",
    consentMarketing: "Trimite-mi sfaturi și noutăți de la {app}",
    errorTerms: "Acceptă Termenii și Politica de confidențialitate ca să continui.",
  },


  cs: {
    startCta: "Sestavit můj plán",
    haveAccountCta: "Už mám účet",
    continueWith: "Pokračovat přes {provider}",
    continueEmail: "Pokračovat přes e-mail",
    signUpHeading: "Vyfoť, co jíš, a dostaneš poctivou odpověď",
    saveHeading: "Ulož si svůj pokrok",
    signInMealHeading: "Přihlas se a zapiš si toto jídlo",
    termsLabel: "Pokračováním přijímáš {terms} a {privacy} {app}",
    termsLink: "Podmínky",
    privacyLink: "Zásady ochrany osobních údajů",
    consentMarketing: "Chci dostávat tipy a novinky od {app}",
    errorTerms: "Pro pokračování odsouhlas Podmínky a Zásady ochrany osobních údajů.",
  },


  hi: {
    startCta: "मेरा प्लान बनाएँ",
    haveAccountCta: "मेरा पहले से अकाउंट है",
    continueWith: "{provider} के साथ जारी रखें",
    continueEmail: "ईमेल के साथ जारी रखें",
    signUpHeading: "अपने खाने की फ़ोटो लें, ईमानदार जवाब पाएँ",
    saveHeading: "अपनी प्रगति सेव करें",
    signInMealHeading: "इस भोजन को दर्ज करने के लिए साइन इन करें",
    termsLabel: "जारी रखने पर, आप {app} की {terms} और {privacy} से सहमत होते हैं",
    termsLink: "शर्तों",
    privacyLink: "गोपनीयता नीति",
    consentMarketing: "मुझे {app} से सुझाव और नए फ़ीचर भेजें",
    errorTerms: "जारी रखने के लिए शर्तों और गोपनीयता नीति से सहमति दें।",
  },


  th: {
    startCta: "สร้างแผนของฉัน",
    haveAccountCta: "ฉันมีบัญชีอยู่แล้ว",
    continueWith: "ดำเนินการต่อด้วย {provider}",
    continueEmail: "ดำเนินการต่อด้วยอีเมล",
    signUpHeading: "ถ่ายรูปสิ่งที่คุณกิน แล้วรับคำตอบที่ตรงไปตรงมา",
    saveHeading: "บันทึกความคืบหน้าของคุณ",
    signInMealHeading: "เข้าสู่ระบบเพื่อบันทึกมื้อนี้",
    termsLabel: "เมื่อดำเนินการต่อ ถือว่าคุณยอมรับ{terms}และ{privacy}ของ {app}",
    termsLink: "ข้อกำหนด",
    privacyLink: "นโยบายความเป็นส่วนตัว",
    consentMarketing: "ส่งเคล็ดลับและฟีเจอร์ใหม่จาก {app} ให้ฉัน",
    errorTerms: "ยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัวเพื่อดำเนินการต่อ",
  },


  sv: {
    startCta: "Bygg min plan",
    haveAccountCta: "Jag har redan ett konto",
    continueWith: "Fortsätt med {provider}",
    continueEmail: "Fortsätt med e-post",
    signUpHeading: "Fotografera det du äter, få ett ärligt svar",
    saveHeading: "Spara dina framsteg",
    signInMealHeading: "Logga in för att spara den här måltiden",
    termsLabel: "Genom att fortsätta godkänner du {app}{app_s} {terms} och {privacy}",
    termsLink: "Villkor",
    privacyLink: "Integritetspolicy",
    consentMarketing: "Skicka mig tips och nya funktioner från {app}",
    errorTerms: "Godkänn villkoren och integritetspolicyn för att fortsätta.",
  },


  uk: {
    startCta: "Скласти мій план",
    haveAccountCta: "У мене вже є акаунт",
    continueWith: "Продовжити з {provider}",
    continueEmail: "Продовжити з е-поштою",
    signUpHeading: "Фотографуй, що їси, — отримуй чесну відповідь",
    saveHeading: "Збережи свій прогрес",
    signInMealHeading: "Увійди, щоб записати цей прийом їжі",
    termsLabel: "Продовжуючи, ти приймаєш {terms} і {privacy} {app}",
    termsLink: "Умови",
    privacyLink: "Політику конфіденційності",
    consentMarketing: "Надсилати мені поради та новинки {app}",
    errorTerms: "Щоб продовжити, прийми Умови та Політику конфіденційності.",
  },


  nl: {
    startCta: "Maak mijn plan",
    haveAccountCta: "Ik heb al een account",
    continueWith: "Doorgaan met {provider}",
    continueEmail: "Doorgaan met e-mail",
    signUpHeading: "Fotografeer wat je eet, krijg een eerlijk antwoord",
    saveHeading: "Bewaar je voortgang",
    signInMealHeading: "Log in om deze maaltijd vast te leggen",
    termsLabel: "Door verder te gaan ga je akkoord met de {terms} en het {privacy} van {app}",
    termsLink: "Voorwaarden",
    privacyLink: "Privacybeleid",
    consentMarketing: "Stuur me tips en nieuwe functies van {app}",
    errorTerms: "Ga akkoord met de Voorwaarden en het Privacybeleid om door te gaan.",
  },


  pl: {
    startCta: "Stwórz mój plan",
    haveAccountCta: "Mam już konto",
    continueWith: "Kontynuuj z {provider}",
    continueEmail: "Kontynuuj przez e-mail",
    signUpHeading: "Zrób zdjęcie tego, co jesz, i dostań rzetelną odpowiedź",
    saveHeading: "Zapisz swoje postępy",
    signInMealHeading: "Zaloguj się, by zapisać ten posiłek",
    termsLabel: "Kontynuując, akceptujesz zasady {app}: {terms} i {privacy}",
    termsLink: "Regulamin",
    privacyLink: "Polityka prywatności",
    consentMarketing: "Wysyłaj mi wskazówki i nowości od {app}",
    errorTerms: "Zaakceptuj Regulamin i Politykę prywatności, aby kontynuować.",
  },


  tr: {
    startCta: "Planımı oluştur",
    haveAccountCta: "Zaten bir hesabım var",
    continueWith: "{provider} ile devam et",
    continueEmail: "E-posta ile devam et",
    signUpHeading: "Yediğinin fotoğrafını çek, dürüst bir yanıt al",
    saveHeading: "İlerlemeni kaydet",
    signInMealHeading: "Bu öğünü kaydetmek için giriş yap",
    termsLabel: "Devam ederek {app}'in {terms} ve {privacy} metinlerini kabul etmiş olursun",
    termsLink: "Koşullar",
    privacyLink: "Gizlilik Politikası",
    consentMarketing: "Bana {app}'ten ipuçları ve yeni özellikler gönder",
    errorTerms: "Devam etmek için Koşullar'ı ve Gizlilik Politikası'nı kabul et.",
  },


  "zh-Hant": {
    startCta: "建立我的計畫",
    haveAccountCta: "我已經有帳號了",
    continueWith: "使用 {provider} 繼續",
    continueEmail: "使用電子郵件繼續",
    signUpHeading: "拍下你吃的東西，得到誠實的答案",
    saveHeading: "儲存你的進度",
    signInMealHeading: "登入以記錄這一餐",
    termsLabel: "繼續即表示你同意 {app} 的 {terms} 和 {privacy}",
    termsLink: "使用條款",
    privacyLink: "隱私權政策",
    consentMarketing: "寄給我 {app} 的小技巧和新功能",
    errorTerms: "請同意使用條款和隱私權政策以繼續。",
  },


  "zh-Hans": {
    startCta: "制定我的计划",
    haveAccountCta: "我已有账户",
    continueWith: "通过{provider}继续",
    continueEmail: "通过邮箱继续",
    signUpHeading: "拍下你吃的东西，获得如实的答案",
    saveHeading: "保存你的进度",
    signInMealHeading: "登录以记录这顿饭",
    termsLabel: "继续即表示你同意 {app} 的{terms}和{privacy}",
    termsLink: "条款",
    privacyLink: "隐私政策",
    consentMarketing: "向我发送 {app} 的小贴士和新功能",
    errorTerms: "同意条款和隐私政策后即可继续。",
  },


  ko: {
    startCta: "내 플랜 만들기",
    haveAccountCta: "이미 계정이 있어요",
    continueWith: "{provider}로 계속하기",
    continueEmail: "이메일로 계속하기",
    signUpHeading: "먹는 음식을 찍으면 솔직한 답을 드려요",
    saveHeading: "진행 상황을 저장하세요",
    signInMealHeading: "이 식사를 기록하려면 로그인하세요",
    termsLabel: "계속하면 {app}의 {terms} 및 {privacy}에 동의하게 돼요",
    termsLink: "이용약관",
    privacyLink: "개인정보 처리방침",
    consentMarketing: "{app}의 팁과 새 기능 소식을 받을게요",
    errorTerms: "계속하려면 이용약관과 개인정보 처리방침에 동의해 주세요.",
  },


  ja: {
    startCta: "プランを作る",
    haveAccountCta: "アカウントをお持ちの方",
    continueWith: "{provider}で続ける",
    continueEmail: "メールで続ける",
    signUpHeading: "食べたものを撮るだけで、正直な答えを",
    saveHeading: "進捗を保存しましょう",
    signInMealHeading: "ログインしてこの食事を記録",
    termsLabel: "続行すると、{app}の{terms}と{privacy}に同意したことになります",
    termsLink: "利用規約",
    privacyLink: "プライバシーポリシー",
    consentMarketing: "{app}からヒントや新機能のお知らせを受け取る",
    errorTerms: "続けるには利用規約とプライバシーポリシーに同意してください。",
  },


  "pt-BR": {
    startCta: "Montar meu plano",
    haveAccountCta: "Já tenho uma conta",
    continueWith: "Continuar com {provider}",
    continueEmail: "Continuar com e-mail",
    signUpHeading: "Fotografe o que você come e receba uma resposta honesta",
    saveHeading: "Salve seu progresso",
    signInMealHeading: "Entre para registrar esta refeição",
    termsLabel: "Ao continuar, você concorda com os {terms} e a {privacy} do {app}",
    termsLink: "Termos",
    privacyLink: "Política de Privacidade",
    consentMarketing: "Quero receber dicas e novidades do {app}",
    errorTerms: "Aceite os Termos e a Política de Privacidade para continuar.",

  },
};

export const signupCopyFor = (lang: Lang): SignupCopy => t(lang)(SIGNUP_COPY);
