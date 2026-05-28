export interface Product {
  id: string;
  merchant_id: string;
  title: string;
  title_ru?: string;
  description: string | null;
  description_ru?: string | null;
  price_usd: number;
  product_type: "lux_copy" | "original";
  image_url: string | null;
  is_available: boolean;
  stock?: number;
  gender?: "male" | "female" | "unisex";
  created_at: string;
}

export interface Order {
  id: string;
  merchant_id: string;
  items: {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
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
