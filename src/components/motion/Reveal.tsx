"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Skroll paytida sekin ochiladigan blok.
 *
 * Ataylab framer-motion'siz — IntersectionObserver + CSS transition.
 * Sabab: bu sahifada kartochkalar 200 dan ortiq bo'lishi mumkin, har
 * biriga JS animatsiya osilsa arzon Android'da skroll qotadi (bu loyihada
 * bir marta shunday bo'lgan). Framer-motion faqat sanoqli, alohida
 * elementlarda ishlatiladi.
 *
 * Telefonda va "animatsiyani kamaytirish" yoqilganda umuman animatsiya
 * qilinmaydi — blok darrov ko'rinadi.
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  /** Sekundning mingdan biri — ketma-ket ochilish uchun */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 1024px)").matches;
    if (reduce || small) return; // darrov ko'rinadi

    // Blok boshidan ko'rinadigan qilib chiziladi (JS ishlamasa ham matn
    // yo'qolmasin), animatsiya kerakligini esa faqat brauzerda bilamiz.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(false);
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`${className} transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
