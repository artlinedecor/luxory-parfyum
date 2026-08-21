export interface Product {
  id: string;
  title: string;
  title_ru?: string;
  price_usd: number;
  product_type: "lux_copy" | "original";
  image_url: string | null;
  created_at: string;
  // Quyidagilar faqat detal sahifada (to'liq qator) keladi —
  // ro'yxat so'rovi tezlik uchun ularni olmaydi.
  merchant_id?: string;
  description?: string | null;
  description_ru?: string | null;
  is_available?: boolean;
  stock?: number;
  gender?: "male" | "female" | "unisex";

  // ── Parfyumeriya maydonlari (migrations/002_fragrance_fields.sql) ──
  // Hammasi ixtiyoriy: bo'sh bo'lsa UI o'sha blokni chizmaydi.
  brand?: string | null;
  fragrance_name?: string | null;
  volume_ml?: number | null;
  concentration?: string | null;
  image_url_2?: string | null;
  notes_top?: string[] | null;
  notes_heart?: string[] | null;
  notes_base?: string[] | null;
  accords?: { name: string; strength: number }[] | null;
  note_families?: string[] | null;
  seasons?: string[] | null;
  time_of_day?: string[] | null;
}

export interface Order {
  id: string;
  merchant_id: string;
  items: {
    product_id: string;
    quantity: number;
    /** Eski maydon — DOLLARDA. Yangi buyurtmalarda price_uzs ishlatiladi. */
    price_at_purchase: number;
    /** Soʼmdagi haqiqiy narx — kassa va toʼlov shu maydonga tayanadi. */
    price_uzs?: number;
    title?: string;
    product_type?: "lux_copy" | "original";
  }[];
  client_name: string;
  client_phone: string;
  client_address?: string;
  region: string;
  receipt_url?: string;
  order_type: "full_payment" | "deposit_50";
  status: "pending" | "accepted" | "delivered" | "cancelled";
  created_at: string;
}

export interface Transaction {
  id: string;
  merchant_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "superadmin" | "merchant" | "client";
  created_at: string;
}
