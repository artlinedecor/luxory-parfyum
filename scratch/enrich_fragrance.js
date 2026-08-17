/**
 * enrich_fragrance.js — katalogni parfyumeriya ma'lumoti bilan to'ldiradi:
 * brend, atir nomi, hajm, konsentratsiya, notalar piramidasi, akkord
 * balansi, nota oilasi, mavsum va kun vaqti.
 *
 *   node scratch/enrich_fragrance.js                 # DRY-RUN (hech narsa yozilmaydi)
 *   node scratch/enrich_fragrance.js --apply         # bazaga yozadi
 *   node scratch/enrich_fragrance.js --apply --limit 20
 *   node scratch/enrich_fragrance.js --apply --only-parse   # AI'siz, faqat nomdan
 *
 * MUHIM:
 *  - Avval migrations/02_add_fragrance_fields.sql ni qo'llang.
 *  - Ishga tushishidan oldin scratch/ ga zaxira yoziladi.
 *  - Brend/hajm/konsentratsiya NOMDAN aniqlanadi (aniq, AI'siz).
 *  - Notalar va akkordlar AI'dan olinadi. AI atirni tanimasa — o'sha
 *    mahsulot O'TKAZIB YUBORILADI, taxminiy nota yozilmaydi.
 */
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const APPLY = process.argv.includes("--apply");
const ONLY_PARSE = process.argv.includes("--only-parse");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Nomdan ajratish (src/lib/fragrance.ts bilan bir xil qoidalar) ──
const BRANDS = [
  "Boadicea the Victorious",
  "Histoires de Parfums",
  "Vilhelm Parfumerie",
  "Matiere Premiere",
  "Essential Parfums",
  "Attar Collection",
  "Milton-Lloyd",
  "Milton Lloyd",
  "The Harmonist",
  "Giorgio Armani",
  "Louis Vuitton",
  "Pantheon Roma",
  "Les Soeurs",
  "Victoria's Secret",
  "Montblanc",
  "Arabesque",
  "Molinard",
  "Clinique",
  "Lacoste",
  "Amouage",
  "Vilhelm",
  "Chase",
  "HFC",
  "MFK",
  "Maison Francis Kurkdjian", "Marc-Antoine Barrois", "Marc Antoine Barrois",
  "Van Cleef & Arpels", "Juliette Has A Gun", "Parfums de Marly",
  "Maison Crivelli", "Maison Margiela", "Escentric Molecules",
  "Comme des Garcons", "Jean Paul Gaultier", "Carolina Herrera",
  "Narciso Rodriguez", "Yves Saint Laurent", "Salvatore Ferragamo",
  "Dolce & Gabbana", "Dolce and Gabbana", "Swiss Arabian", "Ard Al Zaafaran",
  "Tiziana Terenzi", "Acqua di Parma", "Clive Christian", "Giardini di Toscana",
  "Frederic Malle", "Bottega Veneta", "Thierry Mugler", "Viktor & Rolf",
  "Al Haramain", "Serge Lutens", "Issey Miyake", "Calvin Klein",
  "Paco Rabanne", "Bond No 9", "Orto Parisi", "Marc Jacobs", "Penhaligon's",
  "Penhaligons", "Ex Nihilo", "Jo Malone", "Tom Ford", "Hugo Boss",
  "Nasomatto", "Le Labo", "Diptyque", "Zoologist", "Trussardi", "Boucheron",
  "Burberry", "Guerlain", "Givenchy", "Valentino", "Lancome", "Amouage",
  "Xerjoff", "Nishane", "Mancera", "Montale", "Lattafa", "Rasasi", "Bvlgari",
  "Versace", "Cartier", "Hermes", "Chanel", "Byredo", "Initio", "Kilian",
  "Armani", "Ajmal", "Afnan", "Azzaro", "Creed", "Kenzo", "Floris", "Chloe",
  "Gucci", "Prada", "Armaf", "Roja", "Dior", "Memo", "YSL",
];
const ALIASES = {
  MFK: "Maison Francis Kurkdjian",
  HFC: "Haute Fragrance Company",
  "Milton Lloyd": "Milton-Lloyd",
  "Boadicea the Victorious": "Boadicea The Victorious",
  YSL: "Yves Saint Laurent",
  "Marc Antoine Barrois": "Marc-Antoine Barrois",
  "Dolce and Gabbana": "Dolce & Gabbana",
  Penhaligons: "Penhaligon's",
};

const stripNoise = (s) =>
  (s || "")
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
      " "
    )
    .replace(/[|｜]+/g, " ")
    .replace(/\s*[—–-]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseBrand(title) {
  const clean = stripNoise(title);
  for (const b of BRANDS) {
    if (new RegExp(`(^|[^\\p{L}])${esc(b)}([^\\p{L}]|$)`, "iu").test(clean)) {
      return ALIASES[b] || b;
    }
  }
  const by = clean.match(/\bby\s+([\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+)?)/u);
  return by ? by[1] : null;
}

function parseName(title, brand) {
  let s = stripNoise(title);
  if (brand) {
    s = s.replace(new RegExp(`\\s*\\bby\\s+${esc(brand)}\\b`, "iu"), "");
    const variants = [brand, ...Object.keys(ALIASES).filter((k) => ALIASES[k] === brand)];
    for (const v of variants) {
      s = s.replace(new RegExp(`(^|[^\\p{L}])${esc(v)}([^\\p{L}]|$)`, "iu"), "$1$2");
    }
  }
  s = s
    .replace(/\d{1,3}\s*(?:ml|мл)\b/gi, "")
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne|extrait de parfum|edp|edt|edc)\b/gi, "")
    .replace(/^\s*[—–\-:,]+\s*/, "")
    .replace(/\s*[—–\-:,]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s.length >= 2 ? s : stripNoise(title);
}

function parseVolume(title) {
  const m = (title || "").match(/(\d{1,3})\s*(?:ml|мл)\b/i);
  if (!m) return null;
  const ml = parseInt(m[1], 10);
  return ml > 0 && ml <= 500 ? ml : null;
}

function parseConcentration(title) {
  const t = (title || "").toLowerCase();
  if (/\bextrait\b|\bpure parfum\b/.test(t)) return "extrait";
  if (/\belixir\b/.test(t)) return "elixir";
  if (/\bedp\b|eau de parfum/.test(t)) return "edp";
  if (/\bedt\b|eau de toilette/.test(t)) return "edt";
  if (/\bedc\b|eau de cologne/.test(t)) return "edc";
  if (/\bcologne\b/.test(t)) return "cologne";
  if (/\bparfum\b/.test(t)) return "extrait";
  return null;
}

// ── AI orqali notalar va akkordlar ────────────────────────────────
const FAMILIES = ["woody","floral","oriental","fresh","gourmand","citrus","aquatic","spicy","leather"];
const SEASONS = ["spring","summer","autumn","winter"];
const TIMES = ["day","night"];

const SYSTEM_PROMPT = `Sen parfyumeriya bo'yicha mutaxassissan. Senga atirlar ro'yxati beriladi.
Har bir atir uchun HAQIQIY tarkibni qaytar (Fragrantica darajasidagi bilim).

Qat'iy qoidalar:
- Atirni ANIQ tanimasang, uni "unknown": true bilan belgila va boshqa maydonlarni bo'sh qoldir. HECH QACHON o'ylab topma.
- Nota nomlari o'zbekcha lotin yozuvida bo'lsin: "Bergamot", "Sandal daraxti", "Vanil", "Ud", "Yasmin", "Pachuli", "Ambra", "Muskus", "Kehribar", "Qora murch".
- accords: 3-5 ta, strength 20..100 oralig'ida, kamayish tartibida. name o'zbekcha: Yog'ochli, Gulli, Shirin, O'tkir, Sitrusli, Sharqona, Charmli, Yangi, Suvli, Mevali, Aromatik, Puderli, Tutunli, Musknli.
- families: faqat shu ro'yxatdan: ${FAMILIES.join(", ")}.
- seasons: faqat: ${SEASONS.join(", ")}. times: faqat: ${TIMES.join(", ")}.

Javob FAQAT JSON bo'lsin:
{"items":[{"id":"...","unknown":false,"notes_top":[],"notes_heart":[],"notes_base":[],"accords":[{"name":"","strength":0}],"note_families":[],"seasons":[],"time_of_day":[]}]}`;

async function askOpenAI(batch) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify(
            batch.map((p) => ({ id: p.id, brand: p.brand, name: p.fragrance_name }))
          ),
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  const parsed = JSON.parse(json.choices[0].message.content);
  return Array.isArray(parsed.items) ? parsed.items : [];
}

const clean = (arr, allowed) =>
  Array.isArray(arr)
    ? [...new Set(arr.filter((x) => typeof x === "string" && (!allowed || allowed.includes(x))))]
    : [];

// ── Asosiy oqim ───────────────────────────────────────────────────
(async () => {
  console.log(APPLY ? "REJIM: --apply (bazaga yoziladi)" : "REJIM: DRY-RUN");

  const { data: products, error } = await supabase
    .from("products")
    .select("id,title,title_ru,brand,fragrance_name,volume_ml,concentration,notes_top,accords")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42703") {
      console.error(
        "\nXATO: parfyumeriya ustunlari yo'q.\n" +
          "Avval Supabase SQL Editor'da migrations/02_add_fragrance_fields.sql ni ishga tushiring.\n"
      );
      process.exit(1);
    }
    throw error;
  }

  console.log(`Katalogda ${products.length} ta mahsulot topildi.`);

  // Zaxira
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `backup_fragrance_${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), "utf8");
  console.log(`Zaxira: ${path.basename(backupPath)}`);

  // 1-bosqich: nomdan ajratish (aniq, AI'siz)
  const targets = products.slice(0, LIMIT);
  const updates = new Map();

  for (const p of targets) {
    const brand = p.brand || parseBrand(p.title);
    const name = p.fragrance_name || parseName(p.title, brand);
    const volume = p.volume_ml ?? parseVolume(p.title);
    const conc = p.concentration || parseConcentration(p.title);

    const u = {};
    if (brand && brand !== p.brand) u.brand = brand;
    if (name && name !== p.fragrance_name) u.fragrance_name = name;
    if (volume && volume !== p.volume_ml) u.volume_ml = volume;
    if (conc && conc !== p.concentration) u.concentration = conc;
    if (Object.keys(u).length) updates.set(p.id, u);
  }

  const parsedCount = updates.size;
  const noBrand = targets.filter((p) => !(p.brand || parseBrand(p.title)));
  console.log(`\n1-bosqich (nomdan): ${parsedCount} ta mahsulotga o'zgarish.`);
  console.log(`Brendi aniqlanmadi: ${noBrand.length} ta.`);
  if (noBrand.length) {
    console.log("  Misollar:", noBrand.slice(0, 8).map((p) => p.title).join(" | "));
  }

  // 2-bosqich: AI orqali notalar va akkordlar
  let aiFilled = 0;
  let aiUnknown = 0;

  if (!ONLY_PARSE) {
    if (!process.env.OPENAI_API_KEY) {
      console.error("\nOPENAI_API_KEY yo'q — 2-bosqich o'tkazib yuborildi.");
    } else {
      const needNotes = targets.filter(
        (p) => !Array.isArray(p.notes_top) || p.notes_top.length === 0
      );
      console.log(`\n2-bosqich (AI): ${needNotes.length} ta atir uchun nota kerak.`);

      const BATCH = 12;
      for (let i = 0; i < needNotes.length; i += BATCH) {
        const batch = needNotes.slice(i, i + BATCH).map((p) => {
          const brand = updates.get(p.id)?.brand || p.brand || parseBrand(p.title);
          return {
            id: p.id,
            brand,
            fragrance_name:
              updates.get(p.id)?.fragrance_name ||
              p.fragrance_name ||
              parseName(p.title, brand),
          };
        });

        process.stdout.write(
          `  ${i + 1}-${Math.min(i + BATCH, needNotes.length)} / ${needNotes.length} ... `
        );

        let items;
        try {
          items = await askOpenAI(batch);
        } catch (e) {
          console.log("XATO:", e.message);
          continue;
        }

        let ok = 0;
        for (const it of items) {
          if (!it || !it.id || it.unknown) {
            aiUnknown++;
            continue;
          }
          const top = clean(it.notes_top);
          const heart = clean(it.notes_heart);
          const base = clean(it.notes_base);
          if (!top.length && !heart.length && !base.length) {
            aiUnknown++;
            continue;
          }

          const accords = (Array.isArray(it.accords) ? it.accords : [])
            .filter((a) => a && typeof a.name === "string" && typeof a.strength === "number")
            .map((a) => ({
              name: a.name,
              strength: Math.max(0, Math.min(100, Math.round(a.strength))),
            }))
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 5);

          const prev = updates.get(it.id) || {};
          updates.set(it.id, {
            ...prev,
            notes_top: top,
            notes_heart: heart,
            notes_base: base,
            accords: accords.length ? accords : null,
            note_families: clean(it.note_families, FAMILIES),
            seasons: clean(it.seasons, SEASONS),
            time_of_day: clean(it.time_of_day, TIMES),
          });
          ok++;
          aiFilled++;
        }
        console.log(`${ok} ta to'ldirildi`);
      }
    }
  }

  // ── Xulosa ──────────────────────────────────────────────────────
  console.log("\n──────── XULOSA ────────");
  console.log(`Jami o'zgaradigan mahsulot : ${updates.size}`);
  console.log(`AI nota to'ldirdi          : ${aiFilled}`);
  console.log(`AI tanimadi (o'tkazildi)   : ${aiUnknown}`);

  const sample = [...updates.entries()].slice(0, 3);
  for (const [id, u] of sample) {
    const p = products.find((x) => x.id === id);
    console.log(`\n  ${p.title}`);
    console.log("  ->", JSON.stringify(u).slice(0, 400));
  }

  if (!APPLY) {
    console.log("\nDRY-RUN — bazaga hech narsa yozilmadi. Yozish uchun --apply qo'shing.");
    return;
  }

  console.log("\nBazaga yozilyapti...");
  let written = 0;
  let failed = 0;
  for (const [id, u] of updates) {
    const { error: upErr } = await supabase.from("products").update(u).eq("id", id);
    if (upErr) {
      failed++;
      console.error(`  XATO ${id}: ${upErr.message}`);
    } else {
      written++;
    }
  }
  console.log(`Yozildi: ${written}, xato: ${failed}`);
  console.log(`Qaytarish kerak bo'lsa zaxira: ${path.basename(backupPath)}`);
})().catch((e) => {
  console.error("Kutilmagan xato:", e);
  process.exit(1);
});
