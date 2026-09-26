"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search, Truck, Smartphone, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { UzumMark } from "@/components/PaymentLogos";

/**
 * Hero — sotuvga yo'naltirilgan birinchi ekran.
 *
 * Oldingi versiya faqat "Atirning Hashamatli Dunyosi" kayfiyatini berardi:
 * birinchi ekranda na atir, na narx, na bo'lib to'lash taklifi aniq edi,
 * ikkinchi asosiy tugma esa mijozni Instagram'ga — saytdan tashqariga olib
 * ketardi. Endi: aniq taklif (brend atirlar + 12 oygacha bo'lib to'lash),
 * qidiruv (mijoz ko'pincha aniq atir nomini biladi) va katalogga bitta
 * asosiy tugma. "24/7" kabi tasdiqlanmagan raqamlar o'rniga haqiqiy
 * katalog soni.
 */
export default function HeroSection({ productCount }: { productCount: number }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const ru = lang === "ru";

  const rise = (delay: number) => ({ style: { animationDelay: `${delay}s` } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  };

  const trust = [
    { Icon: Sparkles, text: productCount > 0 ? `${productCount} ${ru ? "ароматов" : "ta atir"}` : ru ? "Большой выбор" : "Katta tanlov" },
    { Icon: Smartphone, text: ru ? "Телефон + SMS" : "Telefon + SMS" },
    { Icon: Truck, text: ru ? "Доставка по РУз" : "O'zbekiston bo'ylab" },
  ];

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Fon rasmi */}
      <div className="absolute inset-0">
        <Image
          src="/hero.webp"
          alt="Elore Parfume — Toshkentda original atirlar va super klon parfyumeriya do'koni"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
      <div aria-hidden className="absolute inset-0 bg-[#141210]/70" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% 35%, rgba(10,9,8,0.55) 0%, rgba(10,9,8,0.2) 55%, transparent 85%)" }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#faf8f5]" />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 pt-24 pb-12 sm:pt-32 sm:pb-20 text-center">
        <p {...rise(0.05)} className="hero-rise eyebrow text-[#ded0b8]">
          {t("hero_badge")}
        </p>

        <h1
          {...rise(0.12)}
          className="hero-rise mt-4 font-heading text-[2.1rem] leading-[1.08] text-white sm:text-6xl"
          style={{ textShadow: "0 2px 28px rgba(0,0,0,0.55)" }}
        >
          {t("hero_title_1")} <span className="italic text-[#e8d49a]">{t("hero_title_2")}</span>
          <br />
          {t("hero_title_3")}
          <span className="sr-only"> — Toshkentda Original Atirlar va Brend Parfyumeriya Do&#39;koni | Parfume Lux (Elore)</span>
        </h1>

        <p
          {...rise(0.22)}
          className="hero-rise mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/80"
          style={{ textShadow: "0 1px 16px rgba(0,0,0,0.6)" }}
        >
          {t("hero_desc")}
        </p>

        {/* Bo'lib to'lash taklifi — asosiy savdo argumenti */}
        <div {...rise(0.3)} className="hero-rise mt-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-[13px] text-[#1a1a1a] shadow-lg">
            <UzumMark size={20} />
            <span>
              <b className="font-semibold">3 · 6 · 12</b> {ru ? "мес. рассрочка — Uzum Nasiya" : "oyga bo'lib to'lash — Uzum Nasiya"}
            </span>
          </span>
        </div>

        {/* Qidiruv — mijoz ko'pincha aniq atir nomini biladi */}
        <form {...rise(0.38)} onSubmit={submit} role="search" className="hero-rise mx-auto mt-7 flex max-w-md gap-2">
          <label htmlFor="hero-search" className="sr-only">{ru ? "Поиск аромата" : "Atir qidirish"}</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
            <input
              id="hero-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={ru ? "Например: Baccarat, Sauvage" : "Masalan: Baccarat, Sauvage"}
              className="h-[52px] w-full rounded-2xl border border-white/20 bg-white pl-11 pr-3 text-[15px] text-[#1a1a1a] placeholder:text-[#8a8580] focus:outline-none focus:ring-2 focus:ring-[#e8d49a]"
            />
          </div>
          <button type="submit" className="btn btn-gold h-[52px] min-h-0 rounded-2xl px-5" aria-label={ru ? "Найти" : "Qidirish"}>
            <Search className="h-4 w-4 sm:hidden" strokeWidth={2} />
            <span className="hidden sm:inline">{ru ? "Найти" : "Qidirish"}</span>
          </button>
        </form>

        <div {...rise(0.46)} className="hero-rise mt-3 flex justify-center">
          <Link href="/catalog" id="hero-cta-catalog" className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-medium text-white/90 underline-offset-4 hover:underline">
            {ru ? "Смотреть весь каталог" : "Butun katalogni ko'rish"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>

        {/* Ishonch qatori — faqat haqiqiy ma'lumot */}
        <ul {...rise(0.54)} className="hero-rise mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/75">
          {trust.map(({ Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-[#e8d49a]" strokeWidth={1.75} />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
