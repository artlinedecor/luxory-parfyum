"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROMO, promoEndLabel } from "@/config/promo";
import { useI18n } from "@/lib/i18n-context";
import { usePromoActive } from "@/lib/use-promo";
import { formatUzs } from "@/lib/utils";
import PromoCountdown from "@/components/PromoCountdown";

/**
 * Bosh sahifadagi aksiya lentasi (oktyabr, config/promo.ts).
 * Faqat tasdiqlangan va'dalar: 800 000 so'm, bo'lib to'lash 3/6/12 oy,
 * hozir 0 so'm, karta shart emas, telefon + SMS · 2 daqiqa.
 * Aksiya vaqtida hero ostidagi ikki taklif kartasi yashiriladi (PromoOff) —
 * shu lenta ularning matnini o'z ichiga oladi, takror bo'lmasin.
 *
 * Server HTML'da ham chiziladi (CLS yo'q). Countdown raqamlari faqat
 * client'da chiqadi — ularning joyi oldindan band. endsAt o'tgach
 * komponent hech narsa chizmaydi.
 */
export default function PromoBanner() {
  const { lang } = useI18n();
  const active = usePromoActive();
  if (!active) return null;

  const ru = lang === "ru";

  return (
    <Link
      href="/catalog"
      id="promo-oktyabr"
      className="promo-enter group relative mb-3 block overflow-hidden rounded-[22px] bg-[#1d1433] px-4 pt-3.5 pb-3 text-white transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6100ff] sm:px-6"
    >
      {/* Yumshoq binafsha nur — tekis qora zerikarli bo'lmasin */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#6100ff]/45 blur-2xl" />

      <span className="relative block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
        {ru ? "Октябрьская акция" : "Oktyabr aksiyasi"} · {promoEndLabel(ru ? "ru" : "uz")}
      </span>

      <span className="relative mt-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <span className="promo-shine relative shrink-0 overflow-hidden rounded-xl bg-[#ffd84d] px-2.5 py-2 font-heading text-[20px] font-semibold leading-none text-[#1d1433] tabular-nums">
            −{PROMO.percent}%
          </span>
          <span className="min-w-0 leading-tight">
            <s className="block text-[13px] text-white/50 decoration-[1.5px] tabular-nums">
              <span className="sr-only">{ru ? "Старая цена " : "Eski narx "}</span>
              {formatUzs(PROMO.oldPriceUzs)} {ru ? "сум" : "so'm"}
            </s>
            <span className="block whitespace-nowrap font-heading text-[19px] font-semibold tabular-nums sm:text-[22px]">
              {formatUzs(PROMO.priceUzs)} {ru ? "сум" : "so'm"}
            </span>
          </span>
        </span>
        <span className="hidden text-right text-[12px] leading-snug text-white/60 min-[380px]:block">
          {ru ? "любой" : "har qanday"}
          <br />
          {ru ? "премиум-аромат" : "premium atir"}
        </span>
      </span>

      {/* Qaytarib sanash — raqamlar mount'dan keyin, joy band */}
      <span className="relative mt-3 flex min-h-[46px] items-center justify-between gap-3">
        <span className="text-[12px] leading-tight text-white/60">
          {ru ? "До конца" : "Tugashiga"}
          <br />
          {ru ? "акции" : "qoldi"}
        </span>
        <PromoCountdown lang={ru ? "ru" : "uz"} variant="tiles" />
      </span>

      <span className="relative mt-3 flex min-h-[44px] items-center justify-between gap-3 border-t border-white/12 pt-2.5">
        <span className="min-w-0">
          <b className="block text-balance text-[14px] font-bold leading-snug text-white">
            {ru ? "Закажите сегодня — сейчас платите 0 сум" : "Bugun buyurtma bering — hozir 0 so'm to'laysiz"}
          </b>
          <span className="mt-1 block text-[12px] leading-snug text-white/70">
            {ru ? "Рассрочка на 3, 6 или 12 месяцев" : "3, 6 yoki 12 oyga bo'lib to'lash"}
            <br />
            {ru ? "Карта не нужна · телефон + SMS · 2 минуты" : "Karta shart emas · telefon + SMS · 2 daqiqa"}
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6100ff] transition-transform group-hover:translate-x-0.5">
          <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </span>
    </Link>
  );
}

/** Aksiya yo'q paytdagi kontent (oddiy taklif kartalari) */
export function PromoOff({ children }: { children: React.ReactNode }) {
  return usePromoActive() ? null : <>{children}</>;
}
