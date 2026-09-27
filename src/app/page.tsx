import HomePage from "@/components/HomePage";

/**
 * Bosh sahifa statik (ISR). Soatda bir marta qayta yasaladi — vaqtga bog'liq
 * bloklar (oktyabr aksiyasi, config/promo.ts) tugagach keshlangan HTML'da
 * uzoq qolib ketmasin. Client ham aksiya muddatini o'zi tekshiradi.
 */
export const revalidate = 3600;

export default function Page() {
  return <HomePage />;
}
