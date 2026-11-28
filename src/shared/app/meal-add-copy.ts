// Add an ingredient to a meal (calodex_app#3678) — the meal screen's Ingredients header and the
// pick-mode food search it opens. One table in shared so the phone and the browser speak the same
// words in every shipped language; the wording is Cal AI's function ("+ Add More", "Search for an
// ingredient", "Suggestions") in this product's own translations, never its art or icons.

import { t, type Localized } from "../lang.ts";
import type { Lang } from "../types.ts";

export interface MealAddCopy {
  /** The section label above the meal's ingredient rows. */
  ingredients: string;
  /** The header action that opens the picker. */
  addMore: string;
  /** The picker's search field placeholder and accessible name. */
  searchPlaceholder: string;
  /** The empty picker's section label. */
  suggestions: string;
}

export const MEAL_ADD_COPY: Localized<MealAddCopy> = {
  en: { ingredients: "Ingredients", addMore: "+ Add More", searchPlaceholder: "Search for an ingredient", suggestions: "Suggestions" },
  de: { ingredients: "Zutaten", addMore: "+ Mehr hinzufügen", searchPlaceholder: "Nach einer Zutat suchen", suggestions: "Vorschläge" },
  fr: { ingredients: "Ingrédients", addMore: "+ Ajouter", searchPlaceholder: "Rechercher un ingrédient", suggestions: "Suggestions" },
  it: { ingredients: "Ingredienti", addMore: "+ Aggiungi altro", searchPlaceholder: "Cerca un ingrediente", suggestions: "Suggerimenti" },
  es: { ingredients: "Ingredientes", addMore: "+ Añadir más", searchPlaceholder: "Buscar un ingrediente", suggestions: "Sugerencias" },
  vi: { ingredients: "Nguyên liệu", addMore: "+ Thêm", searchPlaceholder: "Tìm một nguyên liệu", suggestions: "Gợi ý" },
  id: { ingredients: "Bahan", addMore: "+ Tambah lagi", searchPlaceholder: "Cari bahan", suggestions: "Saran" },
  ru: { ingredients: "Ингредиенты", addMore: "+ Добавить", searchPlaceholder: "Найти ингредиент", suggestions: "Предложения" },
  sq: { ingredients: "Përbërësit", addMore: "+ Shto më shumë", searchPlaceholder: "Kërko një përbërës", suggestions: "Sugjerime" },
  bg: { ingredients: "Съставки", addMore: "+ Добави още", searchPlaceholder: "Търси съставка", suggestions: "Предложения" },
  te: { ingredients: "పదార్థాలు", addMore: "+ మరిన్ని చేర్చండి", searchPlaceholder: "పదార్థం కోసం వెతకండి", suggestions: "సూచనలు" },
  ta: { ingredients: "பொருட்கள்", addMore: "+ மேலும் சேர்", searchPlaceholder: "பொருளைத் தேடுங்கள்", suggestions: "பரிந்துரைகள்" },
  pa: { ingredients: "ਸਮੱਗਰੀ", addMore: "+ ਹੋਰ ਜੋੜੋ", searchPlaceholder: "ਸਮੱਗਰੀ ਲੱਭੋ", suggestions: "ਸੁਝਾਅ" },
  or: { ingredients: "ଉପାଦାନ", addMore: "+ ଆଉ ଯୋଡ଼ନ୍ତୁ", searchPlaceholder: "ଉପାଦାନ ଖୋଜନ୍ତୁ", suggestions: "ପରାମର୍ଶ" },
  mr: { ingredients: "घटक", addMore: "+ आणखी जोडा", searchPlaceholder: "घटक शोधा", suggestions: "सूचना" },
  ml: { ingredients: "ചേരുവകൾ", addMore: "+ കൂടുതൽ ചേർക്കുക", searchPlaceholder: "ഒരു ചേരുവ തിരയുക", suggestions: "നിർദ്ദേശങ്ങൾ" },
  kn: { ingredients: "ಪದಾರ್ಥಗಳು", addMore: "+ ಇನ್ನಷ್ಟು ಸೇರಿಸಿ", searchPlaceholder: "ಪದಾರ್ಥವನ್ನು ಹುಡುಕಿ", suggestions: "ಸಲಹೆಗಳು" },
  gu: { ingredients: "ઘટકો", addMore: "+ વધુ ઉમેરો", searchPlaceholder: "ઘટક શોધો", suggestions: "સૂચનો" },
  bn: { ingredients: "উপাদান", addMore: "+ আরও যোগ করুন", searchPlaceholder: "একটি উপাদান খুঁজুন", suggestions: "পরামর্শ" },
  "pt-PT": { ingredients: "Ingredientes", addMore: "+ Adicionar mais", searchPlaceholder: "Procurar um ingrediente", suggestions: "Sugestões" },
  ms: { ingredients: "Bahan-bahan", addMore: "+ Tambah lagi", searchPlaceholder: "Cari bahan", suggestions: "Cadangan" },
  ca: { ingredients: "Ingredients", addMore: "+ Afegeix-ne més", searchPlaceholder: "Cerca un ingredient", suggestions: "Suggeriments" },
  sl: { ingredients: "Sestavine", addMore: "+ Dodaj več", searchPlaceholder: "Poišči sestavino", suggestions: "Predlogi" },
  hr: { ingredients: "Sastojci", addMore: "+ Dodaj još", searchPlaceholder: "Pretraži sastojak", suggestions: "Prijedlozi" },
  sk: { ingredients: "Prísady", addMore: "+ Pridať ďalšie", searchPlaceholder: "Hľadať prísadu", suggestions: "Návrhy" },
  no: { ingredients: "Ingredienser", addMore: "+ Legg til flere", searchPlaceholder: "Søk etter en ingrediens", suggestions: "Forslag" },
  fi: { ingredients: "Ainesosat", addMore: "+ Lisää lisää", searchPlaceholder: "Hae ainesosaa", suggestions: "Ehdotukset" },
  da: { ingredients: "Ingredienser", addMore: "+ Tilføj flere", searchPlaceholder: "Søg efter en ingrediens", suggestions: "Forslag" },
  hu: { ingredients: "Hozzávalók", addMore: "+ Továbbiak hozzáadása", searchPlaceholder: "Hozzávaló keresése", suggestions: "Javaslatok" },
  el: { ingredients: "Συστατικά", addMore: "+ Προσθήκη άλλων", searchPlaceholder: "Αναζήτηση συστατικού", suggestions: "Προτάσεις" },
  ro: { ingredients: "Ingrediente", addMore: "+ Adaugă mai multe", searchPlaceholder: "Caută un ingredient", suggestions: "Sugestii" },
  cs: { ingredients: "Ingredience", addMore: "+ Přidat další", searchPlaceholder: "Hledat ingredienci", suggestions: "Návrhy" },
  hi: { ingredients: "सामग्री", addMore: "+ और जोड़ें", searchPlaceholder: "कोई सामग्री खोजें", suggestions: "सुझाव" },
  th: { ingredients: "ส่วนผสม", addMore: "+ เพิ่มอีก", searchPlaceholder: "ค้นหาส่วนผสม", suggestions: "คำแนะนำ" },
  sv: { ingredients: "Ingredienser", addMore: "+ Lägg till fler", searchPlaceholder: "Sök efter en ingrediens", suggestions: "Förslag" },
  uk: { ingredients: "Інгредієнти", addMore: "+ Додати ще", searchPlaceholder: "Знайти інгредієнт", suggestions: "Пропозиції" },
  nl: { ingredients: "Ingrediënten", addMore: "+ Meer toevoegen", searchPlaceholder: "Zoek een ingrediënt", suggestions: "Suggesties" },
  pl: { ingredients: "Składniki", addMore: "+ Dodaj więcej", searchPlaceholder: "Szukaj składnika", suggestions: "Sugestie" },
  tr: { ingredients: "Malzemeler", addMore: "+ Daha fazla ekle", searchPlaceholder: "Bir malzeme ara", suggestions: "Öneriler" },
  "zh-Hant": { ingredients: "食材", addMore: "+ 新增更多", searchPlaceholder: "搜尋食材", suggestions: "建議" },
  "zh-Hans": { ingredients: "食材", addMore: "+ 添加更多", searchPlaceholder: "搜索食材", suggestions: "建议" },
  ko: { ingredients: "재료", addMore: "+ 더 추가", searchPlaceholder: "재료 검색", suggestions: "추천" },
  ja: { ingredients: "材料", addMore: "+ さらに追加", searchPlaceholder: "材料を検索", suggestions: "候補" },
  "pt-BR": { ingredients: "Ingredientes", addMore: "+ Adicionar mais", searchPlaceholder: "Buscar um ingrediente", suggestions: "Sugestões" },
};

export const mealAddCopyFor = (lang: Lang): MealAddCopy => t(lang)(MEAL_ADD_COPY);
