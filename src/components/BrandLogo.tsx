"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { useShopSettings } from "@/lib/settings-context";

/**
 * Brend belgisi — emblema + nom.
 *
 * Rasm yuklanmasa (havola buzuq, internet sekin, sozlamada eski Supabase
 * havolasi qolgan) brauzerning buzuq rasm belgisi ko'rinmasligi kerak —
 * o'rniga tilla ramkadagi harf chiziladi.
 */
export default function BrandLogo({
  size = "md",
  withName = true,
}: {
  size?: "sm" | "md";
  withName?: boolean;
}) {
  const { shopName, logoUrl } = useShopSettings();
  // Ikki bosqichli zaxira: sozlamadagi havola ishlamasa loyihadagi
  // logotipga, u ham bo'lmasa harfli ramkaga o'tamiz. Admin brauzerida
  // eski (o'chirilgan) Supabase havolasi qolgan bo'lishi mumkin —
  // o'shanda buzuq rasm belgisi ko'rinmasin.
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  const box = size === "sm" ? "w-6 h-6" : "w-9 h-9";
  const nameSize =
    size === "sm"
      ? "text-base tracking-[0.05em]"
      : "text-[17px] sm:text-xl tracking-[0.05em] sm:tracking-[0.08em]";

  const configured = logoUrl && logoUrl !== siteConfig.logoMark ? logoUrl : null;
  const src = stage === 0 ? configured || siteConfig.logoMark : stage === 1 ? siteConfig.logoMark : null;

  return (
    <>
      {src ? (
        // next/image emas: manba sozlamalardan kelishi mumkin (tashqi host),
        // Vercel optimizatori esa o'chirilgan — foydasi yo'q.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${shopName} logotipi`}
          width={36}
          height={36}
          className={`${box} shrink-0 object-contain`}
          onError={() => setStage((v) => (v === 0 && configured ? 1 : 2))}
        />
      ) : (
        <span
          className={`${box} shrink-0 flex items-center justify-center border border-gold`}
          aria-hidden
        >
          <span className="font-heading text-sm text-gold-dark">
            {siteConfig.logoInitial}
          </span>
        </span>
      )}

      {withName && (
        <span
          className={`font-heading ${nameSize} whitespace-nowrap text-foreground`}
        >
          {shopName}
        </span>
      )}
    </>
  );
}
