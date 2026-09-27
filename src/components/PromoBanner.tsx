"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROMO, promoEndLabel } from "@/config/promo";
import { useI18n } from "@/lib/i18n-context";
import { usePromoActive, usePromoDaysLeft } from "@/lib/use-promo";
import { formatUzs } from "@/lib/utils";

/**
 * Bosh sahifadagi ixcham aksiya lentasi (oktyabr, config/promo.ts).
 * Faqat tasdiqlangan va'dalar: 800 000 so'm, bo'lib to'lash, 0 so'm hozir.
 * Aksiya vaqtida hero ostidagi ikki taklif kartasi yashiriladi (PromoOff) —
 * shu lenta ularning matnini o'z ichiga oladi, takror bo'lmasin.
 *
 * Server HTML'da ham chiziladi (CLS yo'q). Qolgan kunlar faqat client'da
 * hisoblanadi — uning joyi oldindan band (min-width), qator sakramaydi.
 * endsAt o'tgach komponent hech narsa chizmaydi.
 */
export default function PromoBanner() {
  const { lang } = useI18n();
  const active = usePromoActive();
  const days = usePromoDaysLeft();
  if (!active) return null;

  const ru = lang === "ru";
  const daysText =
    days === null || days <= 0
      ? ""
      : days === 1
        ? ru ? "последний день" : "oxirgi kun"
        : ru ? `ещё ${days} дн.` : `yana ${days} kun`;

  return (
    <Link
      href="/catalog"
      id="promo-oktyabr"
      className="group relative mb-3 block overflow-hidden rounded-[22px] bg-[#1d1433] px-4 pt-3.5 pb-3 text-white transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6100ff] sm:px-6"
    >
      {/* Yumshoq binafsha nur — tekis qora zerikarli bo'lmasin */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#6100ff]/45 blur-2xl" />

      <span className="relative flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
        <span>
          {ru ? "Акция" : "Aksiya"} · {promoEndLabel(ru ? "ru" : "uz")}
        </span>
        {/* Joy oldindan band: son client'da kelganda qator sakramaydi */}
        <span className="inline-block min-w-[6.5em] shrink-0 text-right normal-case tracking-normal text-[#ffd84d]">
          {daysText}
        </span>
      </span>

      <span className="relative mt-2 flex items-center gap-3">
        <span className="shrink-0 rounded-xl bg-[#ffd84d] px-2.5 py-2 font-heading text-[20px] font-semibold leading-none text-[#1d1433] tabular-nums">
          −{PROMO.percent}%
        </span>
        <span className="min-w-0 leading-tight">
          <s className="block text-[13px] text-white/50 decoration-[1.5px] tabular-nums">
            <span className="sr-only">{ru ? "Старая цена " : "Eski narx "}</span>
            {formatUzs(PROMO.oldPriceUzs)} {ru ? "сум" : "so'm"}
          </s>
          <span className="block font-heading text-[19px] font-semibold tabular-nums sm:text-[22px]">
            {formatUzs(PROMO.priceUzs)} {ru ? "сум" : "so'm"}
          </span>
        </span>
      </span>

      <span className="relative mt-3 flex min-h-[44px] items-center justify-between gap-2 border-t border-white/12 pt-2.5 text-[14px]">
        <span>
          <b className="font-bold text-white">{ru ? "0 сум сейчас" : "0 so'm hozir"}</b>
          <span className="text-white/75"> · {ru ? "любой премиум-аромат" : "har qanday premium atir"}</span>
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
