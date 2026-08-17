"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CreditCard } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

/**
 * Hero — qorong'i fotosurat ustidagi editorial blok.
 *
 * Uchta muhim tuzatish:
 *  1. pt-28 — sarlavha fiksatsiyalangan header ostida qolib ketmasin
 *     (avval "Atirning" so'zi kesilib turardi).
 *  2. Fon rasmining o'rtasi yorqin (tilla flakon), shu bois matn ortiga
 *     radial quyuqlashtirish qo'yildi — aks holda oq matn o'qilmasdi.
 *  3. Aloqa ikonkalari olib tashlandi — ular footer'da bor, bu yerda esa
 *     ekranni to'ldirib sarlavhani pastga siqib chiqarardi.
 */
export default function HeroSection() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  // Bosqichma-bosqich ochilish — CSS orqali (globals.css: .hero-rise).
  // JS'ga bog'lanmaydi: framer-motion kech yuklansa ham matn ko'rinadi.
  const rise = (delay: number) => ({
    style: { animationDelay: `${delay}s` },
  });

  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden"
    >
      {/* Fon rasmi */}
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.06 }}
        animate={reduce ? undefined : { scale: 1 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="/hero.webp"
          alt="Elore Parfume — Toshkentda original atirlar va super klon parfyumeriya do'koni"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </motion.div>

      {/* Matn o'qilishi uchun qatlamlar (rasm ustida, matn ostida) */}
      <div aria-hidden className="absolute inset-0 bg-[#141210]/62" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 85% at 50% 42%, rgba(10,9,8,0.72) 0%, rgba(10,9,8,0.42) 45%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#faf8f5]/55 to-[#faf8f5]"
      />

      {/* Matn */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-28 pb-32 text-center sm:pb-36">
        <p {...rise(0.05)} className="hero-rise eyebrow text-[#ded0b8]">
          {t("hero_badge")}
        </p>

        <h1
          {...rise(0.15)}
          className="hero-rise mt-6 font-heading text-[2.6rem] leading-[1.06] text-white sm:text-6xl md:text-[4.25rem]"
          style={{ textShadow: "0 2px 28px rgba(0,0,0,0.55)" }}
        >
          {t("hero_title_1")} <span className="italic">{t("hero_title_2")}</span>
          <br />
          {t("hero_title_3")}
        </h1>

        <div {...rise(0.3)} className="hero-rise gold-hairline mx-auto mt-7 w-20" />

        <p
          {...rise(0.38)}
          className="hero-rise mx-auto mt-7 max-w-lg text-sm leading-relaxed text-white/80 sm:text-[15px]"
          style={{ textShadow: "0 1px 16px rgba(0,0,0,0.6)" }}
        >
          {t("hero_desc")}
        </p>

        {/* Bo'lib to'lash ilgagi — hero'dagi asosiy savdo argumenti */}
        <div {...rise(0.46)} className="hero-rise mt-8 flex justify-center">
          <Link
            href="#nasiya"
            className="btn btn-glass btn-sm max-w-full rounded-full border-[#ded0b8]/45
                       text-[#ded0b8] hover:border-[#ded0b8]"
          >
            <CreditCard
              className="h-4 w-4 shrink-0 text-[#e8d49a]"
              strokeWidth={1.5}
            />
            <span className="eyebrow text-left text-[#ded0b8]">
              {t("hero_delivery_badge")}
            </span>
          </Link>
        </div>

        {/* CTA */}
        <div
          {...rise(0.56)}
          className="hero-rise mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/catalog"
            id="hero-cta-catalog"
            className="btn btn-gold w-full sm:w-auto"
          >
            {t("btn_catalog")}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>

          <a
            href="https://www.instagram.com/elore_parfumes?igsh=a2xrMmp1ZmpleGpm"
            target="_blank"
            rel="noopener noreferrer"
            id="hero-cta-instagram"
            className="btn btn-glass w-full sm:w-auto"
          >
            {/* lucide 1.31 da brend ikonkalari yo'q — Instagram inline SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Instagram
          </a>
        </div>

        {/* Statistika */}
        <div
          {...rise(0.66)}
          className="hero-rise mt-14 flex items-start justify-center gap-8 sm:gap-16"
        >
          {[
            { v: "200+", l: t("stats_products") },
            { v: "50+", l: t("stats_brands") },
            { v: "24/7", l: t("stats_support") },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="font-heading text-3xl text-white">{s.v}</div>
              <div className="eyebrow mt-2 text-white/55">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
