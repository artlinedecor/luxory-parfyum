"use client";

import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { Product } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { useWishlist } from "@/lib/wishlist-context";
import { getFragranceView, formatVolume } from "@/lib/fragrance";
import {
  calculateOriginalPriceUzs,
  calculatePremiumPriceUzs,
  formatUzs,
} from "@/lib/utils";
import AccordBars from "./AccordBars";

interface QuickViewDialogProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Tezkor ko'rish — katalogdan chiqmasdan atirni ko'zdan kechirish.
 * Ro'yxat so'rovi tavsif/nota ustunlarini olmaydi, shuning uchun bu yerda
 * faqat mavjud ma'lumot ko'rsatiladi; to'liqi uchun mahsulot sahifasi.
 */
export default function QuickViewDialog({
  product,
  onClose,
  onAddToCart,
}: QuickViewDialogProps) {
  const { t, lang } = useI18n();
  const wishlist = useWishlist();

  const frag = product ? getFragranceView(product) : null;
  const isOriginal = product?.product_type === "original";
  const priceUzs = product
    ? isOriginal
      ? calculateOriginalPriceUzs(product.price_usd)
      : calculatePremiumPriceUzs(product.price_usd)
    : 0;
  const displayName =
    product && lang === "ru" && product.title_ru ? product.title_ru : frag?.name;
  const saved = product ? wishlist.has(product.id) : false;

  return (
    <Dialog.Root
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AnimatePresence>
        {product && frag && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="fixed inset-0 z-[90] bg-[#1a1a1a]/45 backdrop-blur-[2px]"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.99 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="fixed left-1/2 top-1/2 z-[100] w-[calc(100vw-2rem)] max-w-3xl max-h-[88vh]
                           -translate-x-1/2 -translate-y-1/2 overflow-y-auto
                           bg-card border border-border shadow-[0_40px_90px_-50px_rgba(26,26,26,0.5)]
                           focus:outline-none"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {/* Rasm */}
                  <div className="relative aspect-[3/4] bg-surface-image">
                    <Image
                      src={product.image_url || "/products/default.png"}
                      alt={displayName || ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 384px"
                    />
                    {frag.concentrationLabel && (
                      <span className="absolute top-3 left-3 eyebrow px-2 py-1 bg-white/85 text-foreground/80">
                        {frag.concentrationLabel}
                      </span>
                    )}
                    {frag.volumeMl && (
                      <span className="absolute top-3 right-3 eyebrow px-2 py-1 bg-white/85 text-muted-foreground">
                        {formatVolume(frag.volumeMl)}
                      </span>
                    )}
                  </div>

                  {/* Ma'lumot */}
                  <div className="p-6 sm:p-8 flex flex-col">
                    {frag.brand && (
                      <p className="eyebrow text-muted-foreground">{frag.brand}</p>
                    )}

                    <Dialog.Title className="font-heading mt-2 text-[1.75rem] leading-tight text-foreground">
                      {displayName}
                    </Dialog.Title>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-semibold text-foreground tabular-nums">
                        {formatUzs(priceUzs)}
                      </span>
                      <span className="eyebrow text-muted-foreground">
                        {lang === "ru" ? "сум" : "so'm"}
                      </span>
                    </div>

                    {frag.accords && (
                      <div className="mt-7">
                        <AccordBars accords={frag.accords} limit={4} compact />
                      </div>
                    )}

                    <div className="mt-auto pt-8 space-y-2.5">
                      <button
                        onClick={() => onAddToCart?.(product)}
                        className="w-full min-h-[48px] py-3 bg-foreground text-background eyebrow
                                   hover:bg-gold-dark transition-colors duration-300"
                      >
                        {t("btn_add_cart")}
                      </button>

                      <div className="flex gap-2.5">
                        <Link
                          href={`/catalog/${product.id}`}
                          onClick={onClose}
                          className="flex-1 min-h-[44px] flex items-center justify-center border border-border
                                     eyebrow text-muted-foreground hover:text-foreground
                                     hover:border-foreground/30 transition-colors duration-300"
                        >
                          {lang === "ru" ? "Подробнее" : "Batafsil"}
                        </Link>

                        <button
                          onClick={() => wishlist.toggle(product.id)}
                          aria-pressed={saved}
                          aria-label={lang === "ru" ? "В избранное" : "Sevimlilarga"}
                          className={`w-12 min-h-[44px] flex items-center justify-center border transition-colors duration-300 ${
                            saved
                              ? "border-gold text-gold-dark"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Heart
                            className="w-4 h-4"
                            strokeWidth={1.5}
                            fill={saved ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <Dialog.Close
                  aria-label={lang === "ru" ? "Закрыть" : "Yopish"}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                             bg-white/85 text-foreground/70 hover:text-foreground transition-colors sm:bg-transparent"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
