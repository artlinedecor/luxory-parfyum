"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import { Product } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";

interface InstallmentBannerProps {
  /** Rasm katalogdan olinadi — stok surat emas, do'kondagi haqiqiy atir */
  products: Product[];
}

/**
 * Bo'lib to'lash bloki — bosh sahifadagi asosiy taklif.
 *
 * Matn ataylab hech narsani oshirib ko'rsatmaydi: oylik summa yozilmagan,
 * chunki uni Uzum Nasiya tariflari belgilaydi va oldindan aytib bo'lmaydi.
 * Yozilgani — oqimdagi haqiqat: telefon raqam, SMS-kod, onlayn shartnoma.
 */
export default function InstallmentBanner({ products }: InstallmentBannerProps) {
  const { t, lang } = useI18n();

  // Rasmi bor birinchi atir — blok bo'sh ramka bilan chiqmasin
  const showcase = products.find((p) => p.image_url);

  const points = [t("nasiya_point_1"), t("nasiya_point_2"), t("nasiya_point_3")];

  return (
    <section
      id="nasiya"
      className="relative overflow-hidden border-y border-border bg-secondary/40"
    >
      {/* Iliq tilla nur — chuqurlik beradi, matnga xalaqit qilmaydi */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full opacity-[0.18]"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.55) 0%, rgba(197,168,128,0.18) 45%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-12 lg:gap-20 items-center">
          {/* ── Rasm ────────────────────────────────────────────── */}
          {showcase && (
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-image border border-border shadow-soft">
                <Image
                  src={showcase.image_url || "/products/default.png"}
                  alt={showcase.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 40vw"
                />
              </div>

              {/* "To'lov bo'linadi" belgisi. Telefonda rasm OSTIDA turadi —
                  ustiga qo'yilsa flakonni yopib qo'yardi. Kengroq ekranda
                  rasm ustiga chiqadi va chuqurlik hosil qiladi. */}
              <div className="mt-4 bg-card border border-border shadow-deep px-5 py-4
                              sm:absolute sm:-bottom-6 sm:left-10 sm:right-10 sm:mt-0">
                <p className="eyebrow text-muted-foreground">
                  {t("installment_short")}
                </p>
                <div className="mt-2.5 flex items-end gap-2">
                  {["3", "6", "12"].map((m) => (
                    <span
                      key={m}
                      className="flex-1 text-center py-2 border border-border font-heading text-lg text-foreground"
                    >
                      {m}
                      <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {lang === "ru" ? "мес" : "oy"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Matn ────────────────────────────────────────────── */}
          <div className={showcase ? "lg:pl-4" : "max-w-2xl mx-auto text-center"}>
            <p className="eyebrow text-gold-deep flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("nasiya_eyebrow")}
            </p>

            <h2 className="font-heading mt-5 text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] text-foreground">
              {t("nasiya_title_1")}
              <br />
              <span className="italic text-gold-deep">{t("nasiya_title_2")}</span>
            </h2>

            <p className="mt-7 max-w-xl text-sm sm:text-[15px] text-muted-foreground leading-[1.9]">
              {t("nasiya_desc")}
            </p>

            <ul className="mt-8 space-y-3.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex w-5 h-5 shrink-0 items-center justify-center border border-gold">
                    <Check className="w-3 h-3 text-gold-deep" strokeWidth={2} />
                  </span>
                  <span className="text-sm text-foreground/85">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/catalog"
                className="shadow-deep min-h-[54px] inline-flex items-center justify-center px-10
                           bg-foreground text-background eyebrow hover:bg-[#000]"
              >
                {t("nasiya_cta")}
              </Link>
              <Link
                href="/cart"
                className="shadow-deep-gold min-h-[54px] inline-flex items-center justify-center px-10
                           bg-gradient-gold text-[#1a1a1a] eyebrow"
              >
                {t("cart")}
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-muted-foreground/80 leading-relaxed">
              {t("nasiya_note")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
