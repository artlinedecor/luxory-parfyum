export const UZUM_API_URL = process.env.UZUM_API_URL || "https://checkout.uzumnasiya.uz";

export interface UzumProductItem {
  amount: number;
  name: string;
  price: number; // Price in UZS (sum)
  category?: number;
  unit_id?: number;
  product_id?: string | number;
  code?: string;
}

export interface CreateOrderParams {
  phone: string;
  period: string; // "3" | "6" | "12"
  ext_order_id: string;
  callback?: string;
  products: UzumProductItem[];
  user_id?: number | string;
}

export interface CreateOrderResponse {
  status: "success" | "error" | string;
  message?: string;
  data?: {
    webview_path?: string;
    paymart_client?: {
      contract_id?: string | number;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export async function createUzumOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) {
    throw new Error("UZUM_PARTNER_TOKEN muhit o'zgaruvchisi topilmadi (.env.local da UZUM_PARTNER_TOKEN sozlang)");
  }

  const payload = {
    phone: params.phone,
    period: params.period,
    ext_order_id: params.ext_order_id,
    callback: params.callback,
    products: params.products,
    user_id: params.user_id || params.phone,
  };

  const response = await fetch(`${UZUM_API_URL}/api/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(process.env.UZUM_MERCHANT_ID ? { "X-Merchant-Id": process.env.UZUM_MERCHANT_ID } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Uzum Nasiya API xatosi (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

export async function checkContractStatus(contractId: string | number) {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) throw new Error("UZUM_PARTNER_TOKEN topilmadi");

  const response = await fetch(`${UZUM_API_URL}/api/v1/contracts/check-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ contract_id: contractId }),
  });

  if (!response.ok) {
    throw new Error("Uzum Nasiya shartnoma holatini tekshirib bo'lmadi");
  }

  return response.json();
}

export async function confirmContract(contractId: string | number) {
  const token = process.env.UZUM_PARTNER_TOKEN;
  if (!token) throw new Error("UZUM_PARTNER_TOKEN topilmadi");

  const response = await fetch(`${UZUM_API_URL}/api/v1/contracts/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ contract_id: contractId }),
  });

  if (!response.ok) {
    throw new Error("Uzum Nasiya shartnomasini tasdiqlashda xatolik");
  }

  return response.json();
}
