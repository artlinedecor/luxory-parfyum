"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useShopSettings } from "@/lib/settings-context";

/**
 * Hero — qorong'i fotosurat ustidagi editorial blok.
 * Sahifaning qolgan qismi yorug' (alabastr), shu bois pastki gradient
 * aynan fon rangiga (#faf8f5) ulanadi — chegara sezilmaydi.
 */
export default function HeroSection() {
  const { t } = useI18n();
  const { shopPhone, telegramAdminUsername, telegramChannel } = useShopSettings();

  const socialLink =
    "w-11 h-11 flex items-center justify-center border border-white/25 text-white/75 hover:text-white hover:border-white/60 transition-colors duration-300";

  return (
    <section
      id="hero"
      className="relative min-h-[88vh] flex items-center justify-center overflow-hidden"
    >
      {/* Fon rasmi */}
      <div className="absolute inset-0">
        <Image
          src="/hero.webp"
          alt="Lux Atir — Toshkentda original atirlar va super klon parfyumeriya do'koni"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Matn o'qilishi uchun quyuqlashtirish + pastda alabastrga o'tish */}
        <div className="absolute inset-0 bg-[#1a1a1a]/55" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-b from-transparent to-[#faf8f5]" />
      </div>

      {/* Matn */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 pb-24 text-center">
        <p className="eyebrow text-[#ded0b8]">{t("hero_badge")}</p>

        <h1 className="font-heading mt-6 text-[2.75rem] sm:text-6xl md:text-7xl leading-[1.08] text-white">
          {t("hero_title_1")} <span className="italic">{t("hero_title_2")}</span>
          <br />
          {t("hero_title_3")}
        </h1>

        <div className="gold-hairline w-20 mx-auto mt-8" />

        <p className="mt-8 max-w-lg mx-auto text-sm sm:text-[15px] text-white/70 leading-relaxed">
          {t("hero_desc")}
        </p>

        <p className="mt-5 eyebrow text-[#ded0b8]">
          {t("hero_delivery_badge")}
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/catalog"
            id="hero-cta-catalog"
            className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-3 px-10
                       bg-[#faf8f5] text-[#1a1a1a] eyebrow
                       hover:bg-[#ded0b8] transition-colors duration-300"
          >
            {t("btn_catalog")}
          </Link>

          <a
            href="https://www.instagram.com/elore_parfumes?igsh=a2xrMmp1ZmpleGpm"
            target="_blank"
            rel="noopener noreferrer"
            id="hero-cta-instagram"
            className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2 px-10
                       border border-white/35 text-white eyebrow
                       hover:border-white transition-colors duration-300"
          >
            Instagram
          </a>
        </div>

        {/* Aloqa */}
        <div className="mt-12 flex justify-center items-center gap-2.5">
          <a
            href="https://www.instagram.com/elore_parfumes?igsh=a2xrMmp1ZmpleGpm"
            target="_blank"
            rel="noopener noreferrer"
            className={socialLink}
            title="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href={`tel:${shopPhone.replace(/\s/g, "")}`}
            className={socialLink}
            title="Telefon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>
          <a
            href={telegramAdminUsername}
            target="_blank"
            rel="noopener noreferrer"
            className={socialLink}
            title="Telegram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
          <a
            href={telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className={socialLink}
            title="Telegram kanal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </a>
        </div>

        {/* Statistika */}
        <div className="mt-14 flex items-center justify-center gap-10 sm:gap-16">
          {[
            { v: "200+", l: t("stats_products") },
            { v: "50+", l: t("stats_brands") },
            { v: "24/7", l: t("stats_support") },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="font-heading text-3xl text-white">{s.v}</div>
              <div className="mt-1.5 eyebrow text-white/50">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
