/**
 * Click to'lov havolasi — rasmiy hujjat bo'yicha.
 * Manba: https://docs.click.uz/en/click-button/
 *
 * Majburiy : merchant_id, service_id, transaction_param, amount
 * Ixtiyoriy: merchant_user_id, return_url, card_type (uzcard | humo)
 *
 * ⚠️ amount formati N.NN bo'lishi SHART (hujjatda shunday). Oldin butun
 * son yuborilardi.
 */
export function clickPayUrl(params: {
  amountUzs: number;
  orderId: string;
  cardType?: "uzcard" | "humo";
  returnUrl?: string;
}): string {
  const serviceId = process.env.NEXT_PUBLIC_CLICK_SERVICE_ID;
  const merchantId = process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID;

  const q = new URLSearchParams({
    service_id: String(serviceId ?? ""),
    merchant_id: String(merchantId ?? ""),
    amount: Number(params.amountUzs).toFixed(2),
    transaction_param: params.orderId,
  });
  if (params.cardType) q.set("card_type", params.cardType);
  q.set("return_url", params.returnUrl || "https://parfumelux.uz/payment-success");

  return `https://my.click.uz/services/pay?${q.toString()}`;
}

/** Kalitlar sozlanganmi — tugmalarni ko'rsatishdan oldin tekshiriladi. */
export function clickConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLICK_SERVICE_ID && process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID
  );
}
