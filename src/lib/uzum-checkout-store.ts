import { serverSupabase } from "./supabase-server";
import type { PricedLine } from "./pricing-server";

export interface UzumCheckoutMeta {
  ext_order_id: number;
  token_hash: string;
  fingerprint: string;
  buyer_id: number;
  period: string;
  quoted_total: number;
  quoted_month?: number;
  quoted_deposit?: number;
  quoted_first_payment_date?: string;
  contract_id?: number;
  uzum_order_id?: number;
  webview_path?: string;
  price_month?: string;
  client_act_pdf?: string;
  signed?: boolean;
  notification?: "pending" | "sending" | "sent";
  review_required?: boolean;
  notification_claimed_at?: number;
  last_checked_at?: number;
}
export type CheckoutLine = PricedLine & { uzum_checkout?: UzumCheckoutMeta };
export interface CheckoutOrder {
  id: string; items: CheckoutLine[]; client_name: string; client_phone: string;
  client_address?: string; region: string; order_type: string; status: string;
  payment_status: string; total_amount: number; created_at?: string;
}

function fail(error: { message: string } | null) { if (error) throw new Error(`Uzum checkout storage: ${error.message}`); }

export const checkoutStore = {
  async get(id: string): Promise<CheckoutOrder | null> {
    const { data, error } = await serverSupabase().from("orders").select("*").eq("id", id).eq("order_type", "uzum_nasiya").maybeSingle();
    fail(error); return data;
  },
  async insert(order: CheckoutOrder): Promise<boolean> {
    const { error } = await serverSupabase().from("orders").insert(order);
    if (error?.code === "23505") return false;
    fail(error); return true;
  },
  async patch(id: string, values: Partial<CheckoutOrder>): Promise<CheckoutOrder> {
    const { data, error } = await serverSupabase().from("orders").update(values).eq("id", id).eq("order_type", "uzum_nasiya").select("*").single();
    fail(error); if (!data) throw new Error("Uzum checkout row missing"); return data;
  },
  async link(order: CheckoutOrder, meta: UzumCheckoutMeta, status: string) {
    const db = serverSupabase();
    const values = {
      contract_id: meta.contract_id, order_row_id: order.id, uzum_order_id: meta.uzum_order_id,
      phone: order.client_phone, total: order.total_amount, period: meta.period, status,
      updated_at: new Date().toISOString(),
    };
    // Creation/repair must never overwrite a concurrently confirmed/cancelled mapping.
    const inserted = await db.from("uzum_contracts").upsert(values, { onConflict: "contract_id", ignoreDuplicates: true });
    fail(inserted.error);
    const existing = await db.from("uzum_contracts").select("order_row_id").eq("contract_id", meta.contract_id).single();
    fail(existing.error);
    if (existing.data?.order_row_id !== order.id) throw new Error("Uzum contract belongs to another order");
    if (status === "created") return;
    let update = db.from("uzum_contracts").update(values).eq("contract_id", meta.contract_id).eq("order_row_id", order.id);
    if (status === "signed") update = update.in("status", ["created", "signed"]);
    if (status === "confirmed") update = update.neq("status", "cancelled");
    const changed = await update;
    fail(changed.error);
  },
  async writeBank(order: CheckoutOrder, meta: UzumCheckoutMeta): Promise<CheckoutOrder | null> {
    const items = order.items.map((line, i) => i === 0 ? { ...line, uzum_checkout: { ...line.uzum_checkout, ...meta } } : line);
    const { data, error } = await serverSupabase().from("orders").update({ items,
      payment_status: order.payment_status === "paid" ? "paid" : meta.review_required ? "unpaid" : "waiting" })
      .eq("id", order.id).eq("items", JSON.stringify(order.items)).eq("payment_status", order.payment_status)
      .is("items->0->uzum_checkout->>signed", null).neq("status", "cancelled").select("*").maybeSingle();
    fail(error); return data;
  },
  async complete(order: CheckoutOrder, values: Partial<CheckoutOrder>): Promise<CheckoutOrder | null> {
    const { data, error } = await serverSupabase().from("orders").update(values).eq("id", order.id)
      .eq("order_type", "uzum_nasiya").eq("payment_status", order.payment_status)
      .eq("status", order.status).neq("status", "cancelled")
      .is("items->0->uzum_checkout->>signed", null).select("*").maybeSingle();
    fail(error); return data;
  },
  async activate(order: CheckoutOrder): Promise<CheckoutOrder | null> {
    const { data, error } = await serverSupabase().from("orders").update({ payment_status: "paid",
      status: ["accepted", "delivered"].includes(order.status) ? order.status : "processing" })
      .eq("id", order.id).eq("order_type", "uzum_nasiya").eq("payment_status", order.payment_status)
      .eq("status", order.status).neq("status", "cancelled").select("*").maybeSingle();
    fail(error); return data;
  },
  async contractForOrder(id: string): Promise<{ contract_id: number; uzum_order_id: number; period: string } | null> {
    const { data, error } = await serverSupabase().from("uzum_contracts").select("contract_id,uzum_order_id,period").eq("order_row_id", id).maybeSingle();
    fail(error); return data;
  },
  async touchChecked(order: CheckoutOrder): Promise<CheckoutOrder | null> {
    const meta = order.items[0]?.uzum_checkout;
    if (!meta) return order;
    const items = order.items.map((line, i) => i === 0 ? { ...line, uzum_checkout: { ...meta, last_checked_at: Date.now() } } : line);
    const { data, error } = await serverSupabase().from("orders").update({ items }).eq("id", order.id)
      .eq("items", JSON.stringify(order.items)).select("*").maybeSingle();
    fail(error); return data;
  },
  async byContract(id: number): Promise<CheckoutOrder | null> {
    const { data, error } = await serverSupabase().from("orders").select("*").eq("order_type", "uzum_nasiya")
      .eq("items->0->uzum_checkout->>contract_id", String(id)).maybeSingle();
    fail(error); if (data) return data;
    const legacy = await serverSupabase().from("uzum_contracts").select("order_row_id").eq("contract_id", id).maybeSingle();
    fail(legacy.error); return legacy.data?.order_row_id ? this.get(legacy.data.order_row_id) : null;
  },
  async byExternal(id: number): Promise<CheckoutOrder | null> {
    const { data, error } = await serverSupabase().from("orders").select("*").eq("order_type", "uzum_nasiya")
      .eq("items->0->uzum_checkout->>ext_order_id", String(id)).maybeSingle();
    fail(error); return data;
  },
};
