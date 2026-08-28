const fs = require('fs');

const files = JSON.parse(fs.readFileSync('scratch/all_storage_images.json', 'utf8'));

const PERFUMES = [
  { name: "CLIVE CHRISTIAN No.1", search: ["clive", "no_1", "no1", "christian"] },
  { name: "BLEU DE CHANEL PARFUM", search: ["bleu", "chanel"] },
  { name: "AFTERNOON SWIM Louis Vuitton", search: ["afternoon", "swim", "louis_vuitton"] },
  { name: "Amouage Guidance 46", search: ["amouage", "guidance"] },
  { name: "BYREDO BAL D’AFRIQUE", search: ["byredo", "bal_d"] },
  { name: "CHANEL CHANCE", search: ["chance", "chanel"] },
  { name: "Clive Christian Hedonistic", search: ["hedonistic", "kiss_me", "clive"] },
  { name: "Clive Christian Blonde Amber", search: ["blonde_amber", "amber", "clive"] },
  { name: "COCO MADEMOISELLE CHANEL", search: ["coco", "mademoiselle", "chanel"] },
  { name: "DIOR SAUVAGE ELIXIR", search: ["sauvage", "elixir", "dior"] },
  { name: "Ex Nihilo Fleur Narcotique", search: ["fleur_narcotique", "ex_nihilo", "narcotique"] },
  { name: "EYES Louis Vuitton", search: ["eyes", "louis_vuitton"] },
  { name: "Good Girl Gone Bad by Kilian", search: ["good_girl", "kilian"] },
  { name: "HFC Paris Delisitrige", search: ["hfc", "delisitrige", "devil"] },
  { name: "HORMONE This Is Not GABA", search: ["hormone", "gaba"] },
  { name: "Louis Vuitton Attrape-Rêves", search: ["attrape", "louis_vuitton"] },
  { name: "Louis Vuitton California Dream", search: ["california", "louis_vuitton"] },
  { name: "Maison Crivelli Oud Maracujá", search: ["crivelli", "oud_maracuj", "maracuja"] },
  { name: "Maison Crivelli Patchouli Magnetik", search: ["patchouli", "crivelli"] },
  { name: "MARC-ANTOINE BARROIS TILIA", search: ["tilia", "barrois", "marc-antoine"] },
  { name: "Marc-Antoine Barrois Aldebaran", search: ["aldebaran", "barrois", "marc-antoine"] },
  { name: "Marc-Antoine Barrois Ganymede", search: ["ganymede", "barrois", "marc-antoine"] },
  { name: "My Burberry Blush", search: ["burberry", "blush"] },
  { name: "PACIFIC CHILL Louis Vuitton", search: ["pacific", "chill", "louis_vuitton"] },
  { name: "Versace Bright Crystal", search: ["bright_crystal", "versace"] },
  { name: "VERSACE CRYSTAL NOIR", search: ["crystal_noir", "versace", "noir"] },
  { name: "XERJOFF ACCENTO PURPLE", search: ["accento", "purple", "xerjoff"] },
  { name: "XERJOFF AMARIS Alexandria II", search: ["alexandria", "amaris", "xerjoff"] },
  { name: "Xerjoff Erba Pura", search: ["erba_pura", "xerjoff"] },
  { name: "XERJOFF MORE THAN WORDS", search: ["more_than_words", "xerjoff"] },
  { name: "XERJOFF TORINO21", search: ["torino", "xerjoff"] },
  { name: "YSL Libre", search: ["libre", "ysl"] }
];

PERFUMES.forEach(p => {
  console.log(`\n========================================`);
  console.log(`[${p.name}]`);
  const matched = files.filter(f => {
    const fLow = f.toLowerCase();
    return p.search.some(s => fLow.includes(s));
  });
  matched.forEach(m => console.log(`  - ${m}`));
});
