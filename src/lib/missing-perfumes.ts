import { serverSupabase } from "@/lib/supabase-server";
import { getAdminChatIds, sendTelegram, escapeHtml } from "@/lib/telegram";

/**
 * Mijozlar so'ragan, lekin katalogda yo'q atirlar ro'yxati — egasi keyin
 * shularni saytga qo'shadi. Alohida jadval o'rniga app_settings'da bitta
 * JSON qiymat (migratsiya shart emas).
 *
 * Oqim: /a/<slug> atir topmaydi → adminlarga Telegram xabari ikki tugma bilan.
 * "Bizning segment" bosilsa ro'yxatga tushadi, "Sotmaymiz" (masalan Dubay/arab
 * atirlari) — hech qayerga yozilmaydi (egasi qarori).
 */
export const MISSING_KEY = "missing_perfumes";
const MAX_ITEMS = 300;

export type MissingPerfume = {
  slug: string;
  name: string;
  /** Necha marta so'ralgan (bir mijoz — kuniga bir marta sanaladi). */
  count: number;
  firstAt: string;
  lastAt: string;
};

export const normalizeMissingSlug = (slug: string) =>
  slug.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Sof funksiya: ro'yxatga so'rovni qo'shadi (bor bo'lsa sanog'ini oshiradi). */
export function mergeMissing(list: MissingPerfume[], slug: string, name: string, nowIso: string): MissingPerfume[] {
  const key = normalizeMissingSlug(slug);
  if (!key) return list;
  const i = list.findIndex((m) => m.slug === key);
  const next =
    i >= 0
      ? list.map((m, j) => (j === i ? { ...m, count: m.count + 1, lastAt: nowIso } : m))
      : [...list, { slug: key, name, count: 1, firstAt: nowIso, lastAt: nowIso }];
  // Juda uzun bo'lib ketmasin — eng eski so'ralganlar tushib qoladi
  return next.sort((a, b) => b.lastAt.localeCompare(a.lastAt)).slice(0, MAX_ITEMS);
}

export function removeMissing(list: MissingPerfume[], slug: string): MissingPerfume[] {
  const key = normalizeMissingSlug(slug);
  return list.filter((m) => m.slug !== key);
}

const asList = (v: unknown): MissingPerfume[] => (Array.isArray(v) ? (v as MissingPerfume[]) : []);

export async function readMissing(): Promise<MissingPerfume[]> {
  const { data, error } = await serverSupabase().from("app_settings").select("value").eq("key", MISSING_KEY).maybeSingle();
  if (error) throw new Error(error.message);
  return asList(data?.value);
}

async function writeMissing(list: MissingPerfume[]): Promise<void> {
  const { error } = await serverSupabase()
    .from("app_settings")
    .upsert({ key: MISSING_KEY, value: list, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function recordMissingPerfume(slug: string, name: string): Promise<void> {
  await writeMissing(mergeMissing(await readMissing(), slug, name, new Date().toISOString()));
}

export async function deleteMissingPerfume(slug: string): Promise<void> {
  await writeMissing(removeMissing(await readMissing(), slug));
}

/** "creed-viking" → "Creed Viking" */
export const missingTitle = (slug: string) =>
  slug.replace(/[-_+.]+/g, " ").trim().replace(/\s+/g, " ").replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());

/** Telegram callback_data 64 baytdan oshmasin (kirill harfi 2 bayt). */
export function callbackSlug(slug: string, prefix = "mpok_"): string {
  let s = normalizeMissingSlug(slug);
  while (s && new TextEncoder().encode(prefix + s).length > 64) s = s.slice(0, -1);
  return s.replace(/-+$/, "");
}

export const MISSING_CALLBACK = /^mp(ok|no)_(.+)$/;

/** Adminlarga: "mijoz so'radi, yo'q" + ro'yxatga qo'shish / sotmaymiz tugmalari. */
export async function sendMissingPerfumeAlert(slug: string, linkBase: string): Promise<void> {
  const key = callbackSlug(slug);
  if (!key) return;
  const text =
    `🔎 <b>Mijoz so'radi — katalogda YO'Q</b>\n\n` +
    `🧴 ${escapeHtml(missingTitle(key))}\n` +
    `🔗 ${escapeHtml(`${linkBase}/a/${key}`)}\n\n` +
    `Bizning segmentmi? "Ro'yxatga" bossangiz, Omborxona'dagi ro'yxatga tushadi — keyin saytga qo'shasiz.`;
  const buttons = [[
    { text: "✅ Bizning segment — ro'yxatga", callback_data: `mpok_${key}` },
    { text: "❌ Bunaqasini sotmaymiz", callback_data: `mpno_${key}` },
  ]];
  for (const id of await getAdminChatIds()) await sendTelegram(id, text, buttons);
}
