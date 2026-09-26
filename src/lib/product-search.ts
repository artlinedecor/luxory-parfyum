import { priceOfProductUzs } from "@/lib/pricing-server";
import { formatUzs } from "@/lib/utils";

/**
 * ChatPlace AI sotuvchisi uchun atir qidiruvi — sof funksiyalar.
 *
 * Mijozlar botga har xil yozadi: "Baccarat bormi", "шанель шанс",
 * "диор саваж". Qidiruv kirillni lotinga o'giradi, brendlarning ruscha /
 * o'zbekcha talaffuzini asl nomiga keltiradi va savol so'zlarini
 * ("bormi", "narxi", "есть") e'tiborsiz qoldiradi.
 */

export type SearchableProduct = {
  id: string;
  title: string;
  title_ru?: string | null;
  brand?: string | null;
  fragrance_name?: string | null;
  stock?: number | null;
};

export type PublicProductRow = SearchableProduct & {
  price_usd: number;
  product_type: string;
  volume_ml?: number | null;
  image_url?: string | null;
};

export type PublicItem = {
  title: string;
  brand: string | null;
  volume_ml: number | null;
  type: "original" | "klon";
  price_uzs: number;
  price_text: string;
  installment_text: string;
  in_stock: boolean;
  availability_text: string;
  url: string;
  image: string | null;
};

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

// Talaffuz → asl yozilish. Kalit — transliteratsiyadan keyingi ko'rinish.
const ALIASES: Record<string, string> = {
  shanel: "chanel", shanell: "chanel", shans: "chance",
  bakkara: "baccarat", bakara: "baccarat", bakkarat: "baccarat",
  savaj: "sauvage", savage: "sauvage", sovaj: "sauvage",
  kreed: "creed", krid: "creed", aventus: "aventus",
  versache: "versace", versach: "versace",
  armani: "armani", giorgio: "giorgio", jorjo: "giorgio",
  vitton: "vuitton", viton: "vuitton", luvi: "louis", lui: "louis",
  kilian: "kilian", killian: "kilian",
  jadore: "jadore", jador: "jadore", zhador: "jadore", zhadore: "jadore",
  ford: "ford", tomford: "tom ford",
  gucci: "gucci", guchi: "gucci", gucchi: "gucci",
  ksirjoff: "xerjoff", kserjoff: "xerjoff", xerjof: "xerjoff",
  amuaj: "amouage", amuage: "amouage",
  kurkdjian: "kurkdjian", kurkjan: "kurkdjian",
  karolina: "carolina", herrera: "herrera", errera: "herrera",
  lankom: "lancome", lancom: "lancome",
  dolche: "dolce", gabbana: "gabbana", gabana: "gabbana",
  ivsen: "ysl", ivsenloran: "ysl", saint: "saint", loran: "laurent",
  bayredo: "byredo", bairedo: "byredo",
  no5: "5", n5: "5",
  lv: "louis vuitton", pdm: "parfums de marly", bvlgari: "bulgari", bulgary: "bulgari",
  // 2026-09-26 qo'shilgan atirlar (docs/yangi-atirlar-2026-09-26.json)
  tyger: "tygar", tayger: "tygar", taygar: "tygar", tigar: "tygar",
  mis: "miss", xom: "homme", xomme: "homme", tender: "tendre",
  blek: "black", blak: "black", xer: "her", barberri: "burberry", barberi: "burberry", berberi: "burberry",
  mauntin: "mountain", maunten: "mountain", voter: "water",
  tabako: "tobacco", tabakko: "tobacco", vanila: "vanilla", ud: "oud", vud: "wood", orxid: "orchid", orhid: "orchid",
  enjels: "angels", enjel: "angels", sher: "share", marli: "marly", leyton: "layton", xerod: "herod", gerod: "herod",
  naksos: "naxos", interlyud: "interlude", idol: "idole", blum: "bloom", gardeniya: "gardenia", gorjes: "gorgeous",
  kod: "code", dilan: "dylan", bleu: "blue", blyu: "blue", blu: "blue",
  inviktus: "invictus", fantom: "phantom", pako: "paco", raban: "rabanne", rabann: "rabanne",
  gud: "good", gerl: "girl", jpg: "jean paul gaultier", jan: "jean", pol: "paul", gote: "gaultier", gotye: "gaultier",
  skandal: "scandal", xajivat: "hacivat", xadjivat: "hacivat", xachivat: "hacivat", hajivat: "hacivat",
  sayd: "side", effekt: "effect", layt: "light", marjela: "margiela", marjiela: "margiela",
  replika: "replica", fayrpleys: "fireplace", fayerpleys: "fireplace", kafe: "cafe",
  allyur: "allure", alyur: "allure", allur: "allure", lezer: "leather", lav: "love", shay: "shy",
  nyui: "nuit", nui: "nuit", gipnotik: "hypnotic", puazon: "poison",
};

// Tanlashda hisobga olinmaydigan so'zlar: konsentratsiya va hajm atirni boshqasidan ajratmaydi
const TITLE_NOISE = new Set(["eau", "de", "parfum", "toilette", "edp", "edt", "ml"]);

// Savol va to'ldiruvchi so'zlar — mahsulot nomida bo'lmaydi.
const STOPWORDS = new Set([
  "bormi", "bor", "narxi", "narx", "qancha", "necha", "atir", "atr", "parfyum", "parfum", "ml",
  "kerak", "menga", "sizda", "bu", "va", "yoki", "original", "klon",
  "est", "yest", "skolko", "tsena", "duxi", "dukhi", "aromat", "u", "vas", "mne", "nujno",
]);

export function normalizeQuery(q: string): string {
  // Apostrof so'zni bo'lmasin (J'adore → jadore); "дж" o'zbekcha j
  const lower = (q || "").toLowerCase().replace(/['’`ʼ]/g, "").replace(/дж/g, "ж");
  const latin = [...lower].map((ch) => CYR[ch] ?? ch).join("");
  const plain = latin.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return plain
    .replace(/[^a-z0-9]+/g, " ")
    // "Eau de Parfum" / "Парфюмерная вода" = edp: "bleu-de-chanel-edp" EDP'ni Parfum'dan ajratsin
    .replace(/\b(eau de parfum|parfyumernaya voda)\b/g, "edp")
    .replace(/\b(eau de toilette|tualetnaya voda)\b/g, "edt")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ALIASES[w] ?? w)
    .join(" ");
}

function haystackWords(p: SearchableProduct): string[] {
  return normalizeQuery([p.brand, p.title, p.fragrance_name, p.title_ru].filter(Boolean).join(" "))
    .split(" ")
    .filter(Boolean);
}

/** Har bir so'z: to'liq mos 3, so'z boshi 2, ichida 1. */
function wordScore(word: string, hay: string[]): number {
  let best = 0;
  for (const h of hay) {
    if (h === word) return 3;
    if (h.startsWith(word) || (word.length >= 4 && word.startsWith(h) && h.length >= 4)) best = Math.max(best, 2);
    else if (word.length >= 3 && h.includes(word)) best = Math.max(best, 1);
  }
  return best;
}

type Ranked<T> = { p: T; matched: number; score: number; extra: number };

/** Nomdagi so'rovda yo'q so'zlar soni (hajm va konsentratsiya so'zlarisiz). */
function titleExtra(p: SearchableProduct, words: string[]): number {
  const titleWords = new Set(normalizeQuery(p.title).split(" "));
  let extra = 0;
  for (const t of titleWords) {
    if (!t || TITLE_NOISE.has(t) || /^\d+(ml)?$/.test(t)) continue;
    // "ex" (Ex Nihilo) "extrait" ni qoplamasin: qisqa so'z faqat to'liq mos kelsa hisoblanadi
    if (!words.some((w) => w === t || (w.length >= 3 && wordScore(w, [t]) >= 2))) extra++;
  }
  return extra;
}

/** Mos kelgan mahsulotlar: ko'p so'z mos kelgani, keyin ball, keyin omborda bori oldin. */
function rankProducts<T extends SearchableProduct>(products: T[], words: string[]): Ranked<T>[] {
  const scored: Ranked<T>[] = [];
  for (const p of products) {
    const hay = haystackWords(p);
    let matched = 0;
    let score = 0;
    for (const w of words) {
      const s = wordScore(w, hay);
      if (s > 0) matched++;
      score += s;
    }
    // extra — nomdagi ortiqcha so'zlar: "The Hedonist" so'ralsa "The Hedonist Extrait" emas, o'zi.
    // Faqat asosiy nom sanaladi: ruscha nom, hajm va "Eau de Parfum" hisobga olinmaydi, aks holda
    // "chanel allure" so'ralganda to'liq yozilgan "Chanel Allure Eau de Parfum" o'rniga Allure Homme Sport chiqardi.
    if (matched > 0) scored.push({ p, matched, score, extra: titleExtra(p, words) });
  }

  const inStock = (p: T) => ((p.stock ?? 0) > 0 ? 1 : 0);
  return scored.sort(
    (a, b) => b.matched - a.matched || b.score - a.score || inStock(b.p) - inStock(a.p) || a.extra - b.extra,
  );
}

const queryWords = (q: string) => normalizeQuery(q).split(" ").filter((w) => w && !STOPWORDS.has(w));

export function searchProducts<T extends SearchableProduct>(products: T[], q: string, limit: number): T[] {
  const words = queryWords(q);
  if (!words.length) return [];
  return rankProducts(products, words)
    .slice(0, Math.max(0, limit))
    .map((s) => s.p);
}

// Havolada bo'lishi mumkin, lekin atirni ajratmaydigan so'zlar — mos kelmasa ham bo'ladi
const GENERIC = new Set([
  "eau", "de", "du", "la", "le", "the", "parfum", "parfume", "perfume", "toilette", "extrait", "edp", "edt",
  "by", "and",
  "s", "t", "m", "d", "ll", "re", // apostrof bo'lingan: devil-s, can-t, i-m
]);

/**
 * Bot yuboradigan qisqa havola: /a/dior-sauvage-elixir → shu atir.
 * Nomdagi har bir ajratuvchi so'z (GENERIC dan tashqari) atir nomida bo'lishi shart:
 * "giorgio-armani-si" Acqua di Gio'ga, "pdm-layton" boshqa PDM'ga olib bormasin —
 * faqat brend mos kelsa null (katalog). Teng mos kelganda nomi eng qisqasi.
 */
export function findShortLinkProduct<T extends SearchableProduct>(products: T[], slug: string): T | null {
  const all = queryWords(slug.replace(/[-_+.]+/g, " "));
  const required = all.filter((w) => !GENERIC.has(w));
  if (!required.length) return null;
  const ok = new Set(rankProducts(products, required).filter((r) => r.matched === required.length).map((r) => r.p));
  // Mos kelganlar ichidan umumiy so'zlar bilan ham eng mosi: "...extrait" → Extrait, "...edp" → EDP
  const best = rankProducts([...ok], all).sort((a, b) => b.score - a.score || a.extra - b.extra)[0];
  return best ? best.p : null;
}

export function toPublicItem(p: PublicProductRow, siteUrl: string): PublicItem {
  const price = priceOfProductUzs(p);
  const inStock = (p.stock ?? 0) > 0;
  return {
    title: p.title,
    brand: p.brand ?? null,
    volume_ml: p.volume_ml ?? null,
    type: p.product_type === "original" ? "original" : "klon",
    price_uzs: price,
    price_text: `${formatUzs(price)} so'm`,
    installment_text: "3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya)",
    in_stock: inStock,
    availability_text: inStock ? "Omborda bor" : "Buyurtma bilan · 3 kungacha",
    url: `${siteUrl.replace(/\/$/, "")}/catalog/${p.id}?utm_source=chatplace&utm_medium=bot`,
    image: p.image_url ?? null,
  };
}

/** Bot to'g'ridan-to'g'ri yuborishi mumkin bo'lgan tayyor matn. */
export function buildReply(items: PublicItem[], q: string): string {
  if (!items.length) {
    return `"${q.trim()}" katalogimizda topilmadi. O'xshash hidli atirlarni tavsiya qilishimni xohlaysizmi?`;
  }
  const lines = items.map((it) => {
    const name = [it.brand, it.title].filter(Boolean).join(" ");
    return `• ${name} — ${it.price_text}\n${it.url}`;
  });
  return `${lines.join("\n\n")}\n\n3, 6 yoki 12 oyga bo'lib to'lash mumkin — havolani bosing, 2 daqiqada rasmiylashtiriladi.`;
}
