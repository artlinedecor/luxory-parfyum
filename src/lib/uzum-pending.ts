"use client";

import { trackMetaEvent } from "@/lib/meta-tracker";

const KEY = "uzum_pending";

export interface PendingOrder {
  contract_id: number;
  order: number;
  period: string;
  total: number;
  client: { name: string; phone: string; address: string; region: string };
  items: { product_id: string; title: string; quantity: number; price: number }[];
  ts: number;
}

/** Shartnoma tuzilgach — bazaga YOZMAYMIZ, faqat brauzerda saqlab turamiz */
export function savePending(p: PendingOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function readPending(): PendingOrder | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingOrder;
    // 24 soatdan eski bo'lsa — tashlab yuboramiz
    if (!p?.contract_id || Date.now() - (p.ts || 0) > 86400000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/**
 * Buyurtmani SERVER orqali yozadi.
 *
 * ⚠️ Audit D1: oldin bu yerda brauzerdan to'g'ridan-to'g'ri Supabase'ga
 * yozilardi. Birinchi insert bazada MAVJUD BO'LMAGAN `uzum_contract_id`
 * ustuniga yozardi — ya'ni har doim yiqilardi. Zaxira insertning xatosi
 * esa umuman tekshirilmasdi va funksiya hech qachon throw qilmasdi.
 * Mijoz qarz shartnomasini imzolab, buyurtmasiz qolishi mumkin edi.
 *
 * Endi xato bo'lsa THROW qiladi — chaqiruvchi localStorage'ni
 * tozalamaydi va mijoz qayta urinib ko'ra oladi.
 */
async function insertOrder(p: PendingOrder): Promise<string> {
  const res = await fetch("/api/uzumnasiya/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contract_id: p.contract_id,
      uzum_order: p.order,
      period: p.period,
      client: p.client,
      // ⚠️ narx YUBORILMAYDI — server bazadan hisoblaydi
      items: p.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    }),
  });
  const j = await res.json();
  if (!res.ok || !j.order_id) {
    throw new Error(j.error || "Buyurtmani saqlab bo'lmadi");
  }
  return String(j.order_id);
}
export type PendingResult = "signed" | "not_signed" | "none" | "error";

/**
 * Kutilayotgan shartnomani tekshiradi.
 * Imzolangan bo'lsa (status 1 yoki 2) — buyurtmani bazaga yozadi va
 * Meta'ga Purchase yuboradi. Imzolanmagan bo'lsa — HECH NARSA yozmaydi.
 */
export async function resolvePending(): Promise<PendingResult> {
  const p = readPending();
  if (!p) return "none";

  try {
    const r = await fetch("/api/uzumnasiya/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", contract_id: p.contract_id }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Xatolik");

    const st = Number(j.data?.contract_status);
    if (st !== 1 && st !== 2) return "not_signed"; // imzolanmagan — buyurtma yaratilmaydi

    // Ikki marta yozilmasin
    const savedKey = `uzum_saved_${p.contract_id}`;
    if (!localStorage.getItem(savedKey)) {
      await insertOrder(p);
      localStorage.setItem(savedKey, "1");

      // Telegram botga tasdiqlash tugmalari bilan yuboramiz
      fetch("/api/uzumnasiya/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_id: p.contract_id,
          order: p.order,
          period: p.period,
          total: p.total,
          client: p.client,
          items: p.items,
        }),
      }).catch(() => {});

      const eid = `pur_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      trackMetaEvent("Purchase", eid, {}, {
        value: p.total,
        currency: "UZS",
        content_type: "product",
        content_ids: p.items.map((i) => i.product_id),
        order_id: String(p.contract_id),
      });
    }
    // ⚠️ Faqat MUVAFFAQIYATDA tozalanadi. Xato bo'lsa pending saqlanib
    // qoladi va mijoz sahifani qayta ochganda avtomatik qayta urinadi.
    clearPending();
    return "signed";
  } catch (e) {
    console.error("[uzum] buyurtmani yakunlab bo'lmadi", e);
    return "error";
  }
}
