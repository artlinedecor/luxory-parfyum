/**
 * Dashboard sahifalari uchun ma'lumot qatlami.
 *
 * ⚠️ Audit X7: oldin har bir sahifa bazaga BRAUZERDAN, ommaviy anon
 * kalit bilan to'g'ridan-to'g'ri ulanardi (37 ta so'rov, 6 sahifa).
 * Shu sababli RLS ni yoqib bo'lmasdi va istalgan odam mijozlarning
 * ismi, telefoni va manzilini o'qiy olardi.
 *
 * Endi hamma so'rov admin sessiyasi tekshiriladigan server route'idan
 * o'tadi. Sahifalarning ko'rinishi va mantiqi o'zgarmaydi.
 */

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    // Sessiya cookie'si yuborilishi shart
    credentials: "same-origin",
    cache: "no-store",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Sessiya tugagan. Iltimos, qaytadan kiring.");
    }
    throw new Error(j.error || `Xatolik (${res.status})`);
  }
  return j as T;
}

export type DashboardData<P = Record<string, unknown>, O = Record<string, unknown>, T = Record<string, unknown>> = {
  products: P[];
  orders: O[];
  transactions: T[];
};

/** Barcha dashboard ma'lumotlari — bitta so'rovda. */
export function dashLoad<P = never, O = never, T = never>(): Promise<DashboardData<P, O, T>> {
  return call<DashboardData<P, O, T>>("/api/dashboard/data");
}

type Values = Record<string, unknown>;

function mutate(body: Record<string, unknown>) {
  return call<{ data?: unknown[]; ok?: boolean }>("/api/dashboard/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function dashInsert<R = Record<string, unknown>>(
  table: string,
  values: Values | Values[]
): Promise<R[]> {
  const r = await mutate({ table, action: "insert", values });
  return (r.data ?? []) as R[];
}

export async function dashUpdate<R = Record<string, unknown>>(
  table: string,
  values: Values,
  match: Values
): Promise<R[]> {
  const r = await mutate({ table, action: "update", values, match });
  return (r.data ?? []) as R[];
}

export async function dashDelete(table: string, match: Values): Promise<void> {
  await mutate({ table, action: "delete", match });
}

/** `column IN (...)` bo'yicha o'chirish. */
export async function dashDeleteIn(
  table: string,
  column: string,
  values: unknown[]
): Promise<void> {
  if (!values.length) return;
  await mutate({ table, action: "delete", matchIn: { column, values } });
}
