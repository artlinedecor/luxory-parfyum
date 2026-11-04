/** Shared eligibility rules. Only the bank calculator decides which tariff fits. */
export function buyerNextStep(data: {
  status?: unknown; buyer_id?: unknown; user_id?: unknown; id?: unknown;
  is_in_black_list?: unknown; has_overdue_contracts?: unknown;
  webview?: unknown; has_limit?: unknown; balance?: unknown; available_periods?: unknown;
}): { step: "calculate" | "verify" | "blocked" | "error"; userId?: number; message?: string; webview?: string } {
  const status = Number(data.status);
  if ([8, 9, 13, 14, 403].includes(status) || data.is_in_black_list === true || data.has_overdue_contracts === true) {
    return { step: "blocked", message: "Bu raqam uchun bo'lib to'lash hozircha mavjud emas. Uzum Nasiya qo'llab-quvvatlash xizmatiga murojaat qiling." };
  }
  if (status === 4) {
    const userId = Number(data.buyer_id ?? data.user_id ?? data.id);
    return Number.isSafeInteger(userId) && userId > 0
      ? { step: "calculate", userId }
      : { step: "error", message: "Uzum mijoz identifikatorini qaytarmadi. Qayta urinib ko'ring yoki do'kon bilan bog'laning." };
  }
  if ([0, 1, 2, 5, 10, 11, 12].includes(status)) {
    let webview: string | undefined;
    try {
      const url = new URL(String(data.webview));
      if (url.protocol === "https:" && (url.hostname === "uzumnasiya.uz" || url.hostname.endsWith(".uzumnasiya.uz"))) webview = url.href;
    } catch { /* no registration URL */ }
    return { step: "verify", webview, message: status === 2
      ? "Uzum hujjatlaringizni tekshirmoqda. Tekshiruv holatini ko'ring, so'ng qayta tekshiring."
      : "Uzum Nasiyada ro'yxatdan o'tish yoki verifikatsiyani yakunlang, so'ng shu sahifaga qayting." };
  }
  return { step: "error", message: "Uzumdan noma'lum holat olindi. Qayta urinib ko'ring yoki do'kon bilan bog'laning." };
}

export function isSignedContract(data: { contract_status?: unknown; is_signed?: unknown }): boolean {
  const status = Number(data.contract_status);
  if (![0, 1, 2].includes(status) || data.is_signed === false) return false;
  return data.is_signed === true;
}
