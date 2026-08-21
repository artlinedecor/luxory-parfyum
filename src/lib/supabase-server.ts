import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server tomon Supabase mijozi — service_role kaliti bilan.
 *
 * ⚠️ Audit X7: RLS yoqilgandan keyin anon kalit `orders`, `users` va
 * `transactions` jadvallariga kira olmaydi. Server route'lari SHU
 * funksiyadan foydalanishi shart.
 *
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY hech qachon NEXT_PUBLIC_ prefiksi bilan
 * bo'lmasin — u brauzerga chiqmasligi kerak.
 *
 * RLS yoqilgunga qadar anon kalitga qaytamiz, lekin ogohlantirish
 * yozamiz — aks holda deploy jimgina buzilardi.
 */
let warned = false;

export function serverSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL sozlanmagan");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    if (!warned) {
      warned = true;
      console.warn(
        "[supabase-server] SUPABASE_SERVICE_ROLE_KEY sozlanmagan — " +
          "vaqtincha anon kalit ishlatilmoqda. RLS yoqilgach bu ISHLAMAY QOLADI."
      );
    }
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anon) throw new Error("Supabase kaliti topilmadi");
    return createClient(url, anon);
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
