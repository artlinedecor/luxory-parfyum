import { serverSupabase } from "./supabase-server";
import type { PricedLine } from "./pricing-server";
import type { AlifMode } from "./alifpay";

export interface AlifMeta {
  mode: AlifMode; token_hash: string; fingerprint: string; invoice_id?: string;
  state: "pending" | "paid" | "refunded"; created_at: number;
}
export interface AlifOrder {
  id: string; items: (PricedLine & { alif_checkout?: AlifMeta })[];
  client_name: string; client_phone: string; region: string; total_amount: number;
  order_type: string; status: string; payment_status: string;
}
const check = (error: { message: string } | null) => { if (error) throw new Error("Alif buyurtmasini saqlab bo'lmadi"); };
export const alifStore = {
  async get(id: string): Promise<AlifOrder | null> {
    const { data, error } = await serverSupabase().from("orders").select("*").eq("id", id).eq("order_type", "full_payment").maybeSingle();
    check(error); return data?.items?.[0]?.alif_checkout ? data : null;
  },
  async insert(row: AlifOrder): Promise<boolean> {
    const { error } = await serverSupabase().from("orders").insert(row);
    if (error?.code === "23505") return false;
    check(error); return true;
  },
  async cas(row: AlifOrder, values: Partial<AlifOrder>): Promise<AlifOrder | null> {
    const { data, error } = await serverSupabase().from("orders").update(values).eq("id", row.id)
      .eq("order_type", "full_payment").eq("items", JSON.stringify(row.items))
      .eq("payment_status", row.payment_status).eq("status", row.status).select("*").maybeSingle();
    check(error); return data;
  },
};
