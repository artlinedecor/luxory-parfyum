"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { Product } from "@/lib/types";

/**
 * Hero — C uslubi (egasi tanlagan, 2026-09-26): Uzum binafsha katta karta,
 * ichida katalogdagi haqiqiy atir surati, qidiruv va aniq taklif; ostida
 * rangli toifalar. Oldingi qorong'i "AURELIA" fotosurati (biz sotmaydigan
 * flakon) va ingichka serif shrift olib tashlandi.
 */
export default function HeroSection({ productCount, products }: { productCount: number; products: Product[] }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const ru = lang === "ru";

  // Karta ichidagi surat — omborda bor, rasmi bor birinchi atir
  const showcase = products.find((p) => p.image_url && (p.stock ?? 0) > 0) ?? products.find((p) => p.image_url);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  };

  const categories = [
    { href: "/catalog?g=female", label: ru ? "Женские" : "Ayollar", cls: "bg-[#ffe1ec] text-[#8a1c46]" },
    { href: "/catalog?g=male", label: ru ? "Мужские" : "Erkaklar", cls: "bg-[#dff3ff] text-[#0c4a6e]" },
    { href: "/catalog?g=unisex", label: "Unisex", cls: "bg-[#fff1c9] text-[#7a4b00]" },
    { href: "/#omborda", label: ru ? "В наличии" : "Omborda bor", cls: "bg-[#dcf7e8] text-[#0b5a36]" },
  ];

  return (
    <section id="hero" className="px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] bg-[#6100ff] text-white">
          {/* Yumshoq doiralar — tekis rang zerikarli bo'lmasin */}
          <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#8f4dff]/40" />

          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 px-5 pt-6 pb-5 sm:px-10 sm:pt-12 sm:pb-10">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/75">
                {t("hero_badge")}
              </p>
              <h1 className="mt-2 font-heading text-[1.7rem] leading-[1.12] sm:text-5xl">
                {t("hero_title_1")} <span className="text-[#ffd84d]">{t("hero_title_2")}</span> {t("hero_title_3")}
                <span className="sr-only"> — Toshkentda Original Atirlar va Brend Parfyumeriya Do&#39;koni | Parfume Lux (Elore)</span>
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/85 sm:text-base">
                {t("hero_desc")}
              </p>
            </div>

            {showcase?.image_url && (
              <Link
                href={`/catalog/${showcase.id}`}
                className="relative block h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/20 sm:h-60 sm:w-44"
                aria-label={showcase.title}
              >
                <Image src={showcase.image_url} alt={showcase.title} fill priority className="object-cover" sizes="(max-width: 640px) 96px, 176px" />
              </Link>
            )}
          </div>

          {/* Qidiruv — mijoz ko'pincha aniq atir nomini biladi */}
          <form onSubmit={submit} role="search" className="relative flex gap-2 px-5 pb-5 sm:px-10 sm:pb-10">
            <label htmlFor="hero-search" className="sr-only">{ru ? "Поиск аромата" : "Atir qidirish"}</label>
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6480]" strokeWidth={2} />
              <input
                id="hero-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={ru ? "Например: Baccarat, Sauvage" : "Masalan: Baccarat, Sauvage"}
                className="h-12 w-full rounded-2xl bg-white pl-11 pr-3 text-[15px] text-[#1d1433] placeholder:text-[#8a83a0] focus:outline-none focus:ring-4 focus:ring-white/30"
              />
            </div>
            <button type="submit" className="h-12 shrink-0 rounded-2xl bg-[#1d1433] px-4 text-sm font-bold text-white active:scale-95 transition-transform" aria-label={ru ? "Найти" : "Qidirish"}>
              <Search className="h-4 w-4 sm:hidden" strokeWidth={2.25} />
              <span className="hidden sm:inline">{ru ? "Найти" : "Qidirish"}</span>
            </button>
          </form>

          <div className="relative flex items-center justify-between gap-3 border-t border-white/15 px-5 py-3 text-[12px] text-white/85 sm:px-10">
            <span>
              <b className="font-bold text-white">3 · 6 · 12</b> {ru ? "мес. рассрочка — Uzum Nasiya" : "oyga bo'lib to'lash — Uzum Nasiya"}
            </span>
            <Link href="/catalog" id="hero-cta-catalog" className="inline-flex min-h-[40px] shrink-0 items-center gap-1 font-bold text-white">
              {productCount > 0 ? `${productCount} ${ru ? "ароматов" : "ta atir"}` : ru ? "Каталог" : "Katalog"}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Toifalar */}
        <nav aria-label={ru ? "Категории" : "Toifalar"} className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className={`inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-[13px] font-bold ${c.cls}`}>
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
