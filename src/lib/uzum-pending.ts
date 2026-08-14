"use client";

import { createClient } from "@/utils/supabase/client";
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

/** Buyurtmani Supabase'ga yozadi (faqat shartnoma imzolangach chaqiriladi) */
async function insertOrder(p: PendingOrder) {
  const supabase = createClient();
  const base: Record<string, unknown> = {
    items: p.items,
    client_name: p.client.name,
    client_phone: p.client.phone,
    region: `${p.client.region} — ${p.client.address}`,
    status: "pending",
    total_amount: p.total,
  };

  // Migratsiya bajarilgan bo'lsa — maxsus ustunlar bilan
  let res = await supabase
    .from("orders")
    .insert({
      ...base,
      order_type: "uzum_nasiya",
      uzum_contract_id: p.contract_id,
      uzum_order_id: p.order,
      uzum_period: p.period,
    })
    .select("id")
    .single();
  if (!res.error) return;

  // Zaxira: eski sxema — shartnoma ma'lumoti birinchi mahsulot ichida
  const itemsWithMeta = p.items.map((it, i) =>
    i === 0
      ? { ...it, _uzum: { contract_id: p.contract_id, order: p.order, period: p.period } }
      : it
  );
  await supabase
    .from("orders")
    .insert({ ...base, order_type: "full_payment", items: itemsWithMeta })
    .select("id")
    .single();
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

      const eid = `pur_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      trackMetaEvent("Purchase", eid, {}, {
        value: p.total,
        currency: "UZS",
        content_type: "product",
        content_ids: p.items.map((i) => i.product_id),
        order_id: String(p.contract_id),
      });
    }
    clearPending();
    return "signed";
  } catch {
    return "error";
  }
}
