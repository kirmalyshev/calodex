// The meal sheet's second tile page (#3676): Fiber · Sugar · Sodium · Sat fat, the short
// consumer labels a tile has room for, in every shipped language. The figures are the meal's own
// stored numbers; the helper exists so the phone and the browser cannot order or unit them apart.

import { spellUnit, t, wholeNumbers, type Localized } from "../lang.ts";
import type { Lang, MealRecord } from "../types.ts";

export interface MealNutrientCopy {
  fiber: string;
  sugar: string;
  sodium: string;
  satfat: string;
}

export const MEAL_NUTRIENT_COPY: Localized<MealNutrientCopy> = {
  "en": { fiber: "Fiber", sugar: "Sugar", sodium: "Sodium", satfat: "Sat fat" },
  "fr": { fiber: "Fibres", sugar: "Sucres", sodium: "Sodium", satfat: "gras sat." },
  "de": { fiber: "Ballaststoffe", sugar: "Zucker", sodium: "Natrium", satfat: "ges. Fette" },
  "it": { fiber: "Fibre", sugar: "Zuccheri", sodium: "Sodio", satfat: "grassi sat." },
  "es": { fiber: "Fibra", sugar: "Azúcar", sodium: "Sodio", satfat: "grasas sat." },
  "vi": { fiber: "Chất xơ", sugar: "Đường", sodium: "Natri", satfat: "béo bão hòa" },
  "id": { fiber: "Serat", sugar: "Gula", sodium: "Natrium", satfat: "lemak jenuh" },
  "ru": { fiber: "Клетчатка", sugar: "Сахар", sodium: "Натрий", satfat: "нас. жиры" },
  "pt-BR": { fiber: "Fibras", sugar: "Açúcar", sodium: "Sódio", satfat: "gord. saturada" },
  "ja": { fiber: "食物繊維", sugar: "糖分", sodium: "ナトリウム", satfat: "飽和脂肪酸" },
  "ko": { fiber: "식이섬유", sugar: "당류", sodium: "나트륨", satfat: "포화 지방" },
  "zh-Hans": { fiber: "膳食纤维", sugar: "糖", sodium: "钠", satfat: "饱和脂肪" },
  "zh-Hant": { fiber: "膳食纖維", sugar: "糖", sodium: "鈉", satfat: "飽和脂肪" },
  "tr": { fiber: "Lif", sugar: "Şeker", sodium: "Sodyum", satfat: "doymuş yağ" },
  "pl": { fiber: "Błonnik", sugar: "Cukier", sodium: "Sód", satfat: "tł. nasycone" },
  "nl": { fiber: "Vezels", sugar: "Suiker", sodium: "Natrium", satfat: "verz. vet" },
  "uk": { fiber: "Клітковина", sugar: "Цукор", sodium: "Натрій", satfat: "нас. жири" },
  "sv": { fiber: "Fibrer", sugar: "Socker", sodium: "Natrium", satfat: "mättat fett" },
  "th": { fiber: "ใยอาหาร", sugar: "น้ำตาล", sodium: "โซเดียม", satfat: "ไขมันอิ่มตัว" },
  "hi": { fiber: "फ़ाइबर", sugar: "शुगर", sodium: "सोडियम", satfat: "सैच. फ़ैट" },
  "cs": { fiber: "Vláknina", sugar: "Cukr", sodium: "Sodík", satfat: "nas. tuky" },
  "ro": { fiber: "Fibre", sugar: "Zahăr", sodium: "Sodiu", satfat: "grăsimi sat." },
  "el": { fiber: "Φυτικές ίνες", sugar: "Ζάχαρη", sodium: "Νάτριο", satfat: "κορ. λιπαρά" },
  "hu": { fiber: "Rost", sugar: "Cukor", sodium: "Nátrium", satfat: "tel. zsír" },
  "da": { fiber: "Kostfibre", sugar: "Sukker", sodium: "Natrium", satfat: "mættet fedt" },
  "fi": { fiber: "Kuitu", sugar: "Sokeri", sodium: "Natrium", satfat: "tyydyt. rasva" },
  "no": { fiber: "Fiber", sugar: "Sukker", sodium: "Natrium", satfat: "mettet fett" },
  "sk": { fiber: "Vláknina", sugar: "Cukor", sodium: "Sodík", satfat: "nas. tuky" },
  "hr": { fiber: "Vlakna", sugar: "Šećer", sodium: "Natrij", satfat: "zasić. masti" },
  "sl": { fiber: "Vlaknine", sugar: "Sladkor", sodium: "Natrij", satfat: "nas. maščobe" },
  "ca": { fiber: "Fibra", sugar: "Sucre", sodium: "Sodi", satfat: "greix sat." },
  "ms": { fiber: "Serat", sugar: "Gula", sodium: "Natrium", satfat: "lemak tepu" },
  "pt-PT": { fiber: "Fibra", sugar: "Açúcar", sodium: "Sódio", satfat: "gord. saturada" },
  "bn": { fiber: "ফাইবার", sugar: "চিনি", sodium: "সোডিয়াম", satfat: "স্যাচু. ফ্যাট" },
  "gu": { fiber: "ફાઇબર", sugar: "ખાંડ", sodium: "સોડિયમ", satfat: "સેચ્યુ. ફેટ" },
  "kn": { fiber: "ನಾರಿನಂಶ", sugar: "ಸಕ್ಕರೆ", sodium: "ಸೋಡಿಯಂ", satfat: "ಸ್ಯಾಚು. ಕೊಬ್ಬು" },
  "ml": { fiber: "നാരുകൾ", sugar: "പഞ്ചസാര", sodium: "സോഡിയം", satfat: "പൂരിത കൊഴുപ്പ്" },
  "mr": { fiber: "फायबर", sugar: "साखर", sodium: "सोडियम", satfat: "सॅच. फॅट" },
  "or": { fiber: "ଫାଇବର୍", sugar: "ଚିନି", sodium: "ସୋଡିୟମ୍", satfat: "ସାଚୁ. ଫ୍ୟାଟ୍" },
  "pa": { fiber: "ਫ਼ਾਈਬਰ", sugar: "ਸ਼ੂਗਰ", sodium: "ਸੋਡੀਅਮ", satfat: "ਸੈਚੁ. ਫ਼ੈਟ" },
  "ta": { fiber: "நார்ச்சத்து", sugar: "சர்க்கரை", sodium: "சோடியம்", satfat: "நிறை. கொழுப்பு" },
  "te": { fiber: "ఫైబర్", sugar: "చక్కెర", sodium: "సోడియం", satfat: "సంతృప్త కొవ్వు" },
  "bg": { fiber: "Фибри", sugar: "Захар", sodium: "Натрий", satfat: "нас. мазнини" },
  "sq": { fiber: "Fibrë", sugar: "Sheqer", sodium: "Natrium", satfat: "ynd. e ngopur" },
};

export interface MealNutrientTile {
  key: keyof MealNutrientCopy;
  icon: "fibre" | "sugar" | "salt" | "satfat";
  value: string;
  label: string;
}

/** The second page's four tiles in the board's order. Sodium is milligrams; the rest are grams. */
export const mealNutrientTiles = (
  meal: Pick<MealRecord, "fiber_g" | "sugar_g" | "sodium_mg" | "satfat_g">,
  lang: Lang,
): MealNutrientTile[] => {
  const copy = t(lang)(MEAL_NUTRIENT_COPY);
  const n = wholeNumbers(lang);
  const g = spellUnit(lang, "g");
  const mg = spellUnit(lang, "mg");
  return [
    { key: "fiber", icon: "fibre", value: `${n(meal.fiber_g)}${g}`, label: copy.fiber },
    { key: "sugar", icon: "sugar", value: `${n(meal.sugar_g)}${g}`, label: copy.sugar },
    { key: "sodium", icon: "salt", value: `${n(meal.sodium_mg)}${mg}`, label: copy.sodium },
    { key: "satfat", icon: "satfat", value: `${n(meal.satfat_g)}${g}`, label: copy.satfat },
  ];
};
