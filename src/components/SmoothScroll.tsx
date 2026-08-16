"use client";

import { useEffect } from "react";

/**
 * Lyuks silliq skroll (Lenis).
 *
 * FAQAT kompyuterda ishlaydi. Telefonda maxsus sabab bor: brauzerning
 * o'z skrolli tabiiy va yengil, Lenis esa har kadrda JS bilan qayta
 * hisoblaydi — arzon Android'da skroll qotib qolardi (bu loyihada bir
 * marta shunday bo'lgan). "Animatsiyani kamaytirish" yoqilgan bo'lsa ham
 * yoqilmaydi.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1025px)").matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isDesktop || !hasFinePointer || reduceMotion) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => 1 - Math.pow(1 - t, 3), // yumshoq to'xtash
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
