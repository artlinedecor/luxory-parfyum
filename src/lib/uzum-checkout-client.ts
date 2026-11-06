/** Bounded read-only checks; never use this helper to create/retry a loan. */
export async function fetchUzumRead<T>(path: "/api/uzumnasiya/check-status" | "/api/uzumnasiya/calculate", body: unknown): Promise<{ ok: boolean; data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store", signal: controller.signal });
    let data: T;
    try { data = await response.json(); }
    catch { throw new Error("Uzum javobini o'qib bo'lmadi. Birozdan keyin qayta tekshiring."); }
    return { ok: response.ok, data };
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Uzum 30 soniya ichida javob bermadi. Qayta tekshiring yoki Telegram orqali yordam so'rang.");
    throw error;
  } finally { clearTimeout(timer); }
}

export function friendlyUzumError(raw: string): string {
  const value = (raw || "").toLowerCase();
  if (/storage|quotaexceeded|securityerror/i.test(raw)) return "Brauzer xotirasiga saqlab bo'lmadi. Rasmiylashtirishni boshqa brauzerda oching yoki do'kon bilan bog'laning.";
  if (/failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(raw)) return "Uzum bilan aloqa uzildi. Internet aloqangizni tekshiring va qayta urinib ko'ring.";
  if (/внешний сервис|не отвеча|попробуйте позже|ulanib bo'lmadi|javob bermadi|timeout/i.test(raw)) return "Uzum tizimi hozir javob bermayapti. Iltimos, bir necha soniyadan keyin qayta urinib ko'ring.";
  if (/не найден|not found/i.test(value)) return "Ma'lumot topilmadi. Telefon raqamni tekshirib, qayta urinib ko'ring.";
  if (/авторизац|token/i.test(value)) return "Ulanishda texnik nosozlik. Iltimos, do'kon bilan bog'laning.";
  return raw || "Xatolik yuz berdi. Qayta urinib ko'ring.";
}
