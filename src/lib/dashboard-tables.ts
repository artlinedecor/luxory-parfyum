/**
 * Dashboard API orqali tegish mumkin bo'lgan jadvallar.
 *
 * ⚠️ Audit X7: dashboard oldin bazaga BRAUZERDAN, ommaviy anon kalit
 * bilan ulanardi. Shu sababli RLS ni yoqib bo'lmasdi — yoqilsa admin
 * paneli o'lardi. Endi hamma so'rov requireAdmin bilan himoyalangan
 * server route'idan o'tadi.
 *
 * Ro'yxat qasddan qisqa: `users` va `uzum_contracts` bu yerda YO'Q —
 * ularga dashboard'dan tegish kerak emas.
 */
export const ALLOWED_TABLES = new Set(["orders", "transactions", "products"]);
export const ALLOWED_ACTIONS = new Set(["insert", "update", "delete"]);

export function assertAllowed(table: string, action: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Ruxsat berilmagan jadval: ${table}`);
  }
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(`Ruxsat berilmagan amal: ${action}`);
  }
}
