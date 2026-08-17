"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChevronLeft, Heart, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { useWishlist } from "@/lib/wishlist-context";
import { trackMetaEvent } from "@/lib/meta-tracker";
import {
  getFragranceView,
  formatVolume,
  NOTE_FAMILY_LABEL,
  SEASON_LABEL,
  TIME_LABEL,
} from "@/lib/fragrance";
import {
  calculateOriginalPriceUzs,
  calculatePremiumPriceUzs,
  formatUzs,
} from "@/lib/utils";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import FragrancePyramid from "@/components/FragrancePyramid";
import AccordBars from "@/components/AccordBars";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const router = useRouter();
  const { addItem } = useCart();
  const { t, lang } = useI18n();
  const wishlist = useWishlist();

  const frag = getFragranceView(product);
  const isOriginal = product.product_type === "original";
  const saved = wishlist.has(product.id);

  const displayName =
    lang === "ru" && product.title_ru ? product.title_ru : frag.name;
  const displayDesc =
    lang === "ru" && product.description_ru
      ? product.description_ru
      : product.description;

  const priceUzs = isOriginal
    ? calculateOriginalPriceUzs(product.price_usd)
    : calculatePremiumPriceUzs(product.price_usd);

  // Bazada bor rasmlar (soxta rakurs qo'shilmaydi)
  const images = [product.image_url, product.image_url_2].filter(
    (x): x is string => !!x
  );
  const gallery = images.length ? images : ["/products/default.png"];
  const currentSrc = imageError
    ? "/products/default.png"
    : gallery[Math.min(activeImage, gallery.length - 1)];

  // ViewContent — mahsulot sahifasi ochilganda
  useEffect(() => {
    const eid = `vc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    trackMetaEvent(
      "ViewContent",
      eid,
      {},
      {
        content_ids: [product.id],
        content_name: product.title,
        content_type: "product",
        value: priceUzs,
        currency: "UZS",
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = () => {
    addItem(product);
    // Meta hodisasi uchun bir martalik id. Bu chizish emas, bosish
    // ishlovchisi — tasodifiy qiymat bu yerda xavfsiz.
    // eslint-disable-next-line react-hooks/purity
    const eid = `atc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    trackMetaEvent(
      "AddToCart",
      eid,
      {},
      {
        content_ids: [product.id],
        content_name: product.title,
        content_type: "product",
        value: priceUzs,
        currency: "UZS",
      }
    );
    toast(frag.brand ? `${frag.brand} — ${frag.name}` : frag.name, {
      description: lang === "ru" ? "Добавлено в корзину" : "Savatchaga qo'shildi",
      action: {
        label: lang === "ru" ? "Корзина" : "Savatcha",
        onClick: () => router.push("/cart"),
      },
    });
  };

  // Mavsum / kun vaqti / oila teglari — faqat bazada bo'lsa
  const contextTags = [
    ...frag.families.map((f) => NOTE_FAMILY_LABEL[f][lang === "ru" ? "ru" : "uz"]),
    ...frag.seasons.map((s) => SEASON_LABEL[s][lang === "ru" ? "ru" : "uz"]),
    ...frag.times.map((x) => TIME_LABEL[x][lang === "ru" ? "ru" : "uz"]),
  ];

  const hasNotes = !!(frag.notes || frag.accords);
  const tabList = [
    hasNotes && { id: "notes", label: lang === "ru" ? "Аромат" : "Ifor" },
    displayDesc && { id: "about", label: lang === "ru" ? "Описание" : "Tavsif" },
    { id: "delivery", label: lang === "ru" ? "Доставка" : "Yetkazib berish" },
  ].filter(Boolean) as { id: string; label: string }[];

  const tabTrigger =
    "relative py-4 eyebrow text-muted-foreground transition-colors " +
    "hover:text-foreground data-[state=active]:text-foreground " +
    "after:absolute after:left-0 after:right-0 after:-bottom-px after:h-px " +
    "after:bg-gold after:scale-x-0 after:transition-transform after:duration-300 " +
    "data-[state=active]:after:scale-x-100";

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Orqaga */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 eyebrow text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          {lang === "ru" ? "Каталог" : "Katalog"}
        </Link>

        {/* ── Asosiy blok ─────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Rasm */}
          <div className="md:sticky md:top-24 space-y-3">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-image border border-border">
              {!imageLoaded && <div className="absolute inset-0 z-[1] shimmer" />}
              <Image
                src={currentSrc}
                alt={displayName}
                fill
                priority
                className={`object-cover transition-opacity duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={() => {
                  if (!imageError) setImageError(true);
                  setImageLoaded(true);
                }}
                onLoad={() => setImageLoaded(true)}
              />

              {frag.concentrationLabel && (
                <span className="absolute top-4 left-4 z-[2] eyebrow px-2.5 py-1.5 bg-white/85 text-foreground/80">
                  {frag.concentrationLabel}
                </span>
              )}
              {frag.volumeMl && (
                <span className="absolute top-4 right-4 z-[2] eyebrow px-2.5 py-1.5 bg-white/85 text-muted-foreground">
                  {formatVolume(frag.volumeMl)}
                </span>
              )}
              {isOriginal && (
                <span className="absolute bottom-4 left-4 z-[2] eyebrow px-2.5 py-1.5 bg-gradient-gold text-[#1a1a1a]">
                  Original
                </span>
              )}
            </div>

            {/* Rakurslar — ikkinchi rasm bo'lsagina */}
            {gallery.length > 1 && (
              <div className="flex gap-3">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => {
                      setActiveImage(i);
                      setImageLoaded(true);
                    }}
                    className={`relative w-16 aspect-[3/4] overflow-hidden border transition-colors ${
                      i === activeImage
                        ? "border-gold"
                        : "border-border hover:border-foreground/25"
                    }`}
                    aria-label={`${i + 1}-rasm`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ma'lumot */}
          <div className="space-y-8">
            <div>
              {frag.brand && (
                <p className="eyebrow text-muted-foreground">{frag.brand}</p>
              )}

              <h1 className="font-heading mt-3 text-4xl sm:text-5xl leading-[1.1] text-foreground">
                {displayName}
              </h1>

              <p className="mt-4 text-xs text-muted-foreground">
                {isOriginal
                  ? lang === "ru"
                    ? "Оригинал под заказ"
                    : "Buyurtma asosida original"
                  : lang === "ru"
                  ? "Копия высшего качества"
                  : "Oliy toifali klon"}
                {frag.volumeMl ? ` · ${formatVolume(frag.volumeMl)}` : ""}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-foreground tabular-nums">
                {formatUzs(priceUzs)}
              </span>
              <span className="eyebrow text-muted-foreground">
                {lang === "ru" ? "сум" : "so'm"}
              </span>
            </div>

            {/* Harakatlar */}
            <div className="flex gap-2.5">
              <button
                onClick={handleAddToCart}
                className="btn btn-primary flex-1"
              >
                {t("btn_add_cart")}
              </button>

              <button
                onClick={() => wishlist.toggle(product.id)}
                aria-pressed={saved}
                aria-label={lang === "ru" ? "В избранное" : "Sevimlilarga"}
                className="btn-icon w-14 min-h-[54px]"
              >
                <Heart
                  className="w-5 h-5"
                  strokeWidth={1.5}
                  fill={saved ? "currentColor" : "none"}
                />
              </button>
            </div>

            {contextTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contextTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1.5 border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Ma'lumot bo'limlari ─────────────────────────── */}
            <Tabs.Root defaultValue={tabList[0].id} className="pt-2">
              <Tabs.List className="flex gap-8 border-b border-border">
                {tabList.map((tab) => (
                  <Tabs.Trigger key={tab.id} value={tab.id} className={tabTrigger}>
                    {tab.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {hasNotes && (
                <Tabs.Content
                  value="notes"
                  className="pt-8 space-y-10 focus:outline-none animate-fade-in"
                >
                  {frag.accords && <AccordBars accords={frag.accords} />}
                  {frag.notes && <FragrancePyramid notes={frag.notes} />}
                </Tabs.Content>
              )}

              {displayDesc && (
                <Tabs.Content
                  value="about"
                  className="pt-8 focus:outline-none animate-fade-in"
                >
                  <p className="text-sm text-foreground/75 leading-[1.9] whitespace-pre-line">
                    {displayDesc}
                  </p>
                </Tabs.Content>
              )}

              <Tabs.Content
                value="delivery"
                className="pt-8 space-y-6 focus:outline-none animate-fade-in"
              >
                {[
                  {
                    Icon: Truck,
                    title: t("features_fast_title"),
                    desc: t("features_fast_desc"),
                  },
                  {
                    Icon: ShieldCheck,
                    title: t("features_quality_title"),
                    desc: t("features_quality_desc"),
                  },
                  {
                    Icon: CreditCard,
                    title: t("installment_short"),
                    desc: t("features_price_desc"),
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <Icon
                      className="w-5 h-5 shrink-0 mt-0.5 text-gold-dark"
                      strokeWidth={1.25}
                    />
                    <div className="space-y-1.5">
                      <p className="eyebrow text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
