"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { useWishlist } from "@/lib/wishlist-context";
import {
  getFragranceView,
  CONCENTRATION_LABEL,
  NOTE_FAMILY_LABEL,
  SEASON_LABEL,
  TIME_LABEL,
  type Concentration,
  type NoteFamily,
  type Season,
  type TimeOfDay,
} from "@/lib/fragrance";
import * as Accordion from "@radix-ui/react-accordion";
import * as Slider from "@radix-ui/react-slider";
import { ChevronDown, Search, X, SlidersHorizontal } from "lucide-react";
import {
  calculateOriginalPriceUzs,
  calculatePremiumPriceUzs,
  formatUzs,
} from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import QuickViewDialog from "./QuickViewDialog";

const PAGE = 24; // bir "sahifa"da nechta mahsulot chiziladi

interface ProductGridProps {
  products: Product[];
}

type Gender = "all" | "male" | "female" | "unisex";

/** Bitta mahsulotning saralash uchun kerakli belgilari. */
interface Facets {
  brand: string | null;
  concentration: Concentration | null;
  families: NoteFamily[];
  seasons: Season[];
  times: TimeOfDay[];
  priceUzs: number;
  haystack: string;
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [genderFilter, setGenderFilter] = useState<Gender>("all");
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [concFilter, setConcFilter] = useState<Concentration | null>(null);
  const [familyFilter, setFamilyFilter] = useState<NoteFamily | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<Season | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeOfDay | null>(null);
  const [onlySaved, setOnlySaved] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [quickView, setQuickView] = useState<Product | null>(null);
  // Bir vaqtda chizilayotgan kartochkalar soni (hammasini birdan chizish telefonni qotirardi)
  const [visible, setVisible] = useState(PAGE);

  const router = useRouter();
  const { addItem } = useCart();
  const { t, lang } = useI18n();
  const wishlist = useWishlist();

  // Har bir mahsulot uchun belgilar bir marta hisoblanadi
  const facets = useMemo(() => {
    const map = new Map<string, Facets>();
    for (const p of products) {
      const f = getFragranceView(p);
      map.set(p.id, {
        brand: f.brand,
        concentration: f.concentration,
        families: f.families,
        seasons: f.seasons,
        times: f.times,
        priceUzs:
          p.product_type === "original"
            ? calculateOriginalPriceUzs(p.price_usd)
            : calculatePremiumPriceUzs(p.price_usd),
        haystack: `${p.title || ""} ${p.title_ru || ""} ${f.brand || ""} ${f.name}`.toLowerCase(),
      });
    }
    return map;
  }, [products]);

  // Faqat ma'lumotda haqiqatan uchraydigan variantlar ko'rsatiladi
  const options = useMemo(() => {
    const brands = new Map<string, number>();
    const concs = new Set<Concentration>();
    const families = new Set<NoteFamily>();
    const seasons = new Set<Season>();
    const times = new Set<TimeOfDay>();

    for (const f of facets.values()) {
      if (f.brand) brands.set(f.brand, (brands.get(f.brand) ?? 0) + 1);
      if (f.concentration) concs.add(f.concentration);
      f.families.forEach((x) => families.add(x));
      f.seasons.forEach((x) => seasons.add(x));
      f.times.forEach((x) => times.add(x));
    }

    const prices = [...facets.values()].map((f) => f.priceUzs);

    return {
      // eng ko'p uchraydigan brendlar oldinda
      brands: [...brands.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count })),
      concentrations: [...concs],
      families: [...families],
      seasons: [...seasons],
      times: [...times],
      // Narx suruvchisi faqat narxlarda haqiqiy farq bo'lsa ko'rsatiladi.
      // Hozir katalogdagi klonlarning narxi bir xil — o'shanda foydasiz.
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      // Nechta turli narx bor — 1-2 ta bo'lsa suruvchi foydasiz
      distinctPrices: new Set(prices).size,
    };
  }, [facets]);

  // Narx suruvchisi chegaralari — haqiqiy eng arzon/eng qimmatdan olinadi,
  // nolga yaxlitlanmaydi (aks holda "0 so'm" deb turardi).
  const priceFloor = options.minPrice;
  const priceCeil = options.maxPrice;
  const priceStep = Math.max(
    1000,
    Math.round((priceCeil - priceFloor) / 40 / 1000) * 1000
  );
  const hasPriceRange = options.distinctPrices >= 3 && priceCeil > priceFloor;
  const priceValue = maxPrice ?? priceCeil;

  const activeCount =
    (brandFilter ? 1 : 0) +
    (concFilter ? 1 : 0) +
    (familyFilter ? 1 : 0) +
    (seasonFilter ? 1 : 0) +
    (timeFilter ? 1 : 0) +
    (onlySaved ? 1 : 0) +
    (maxPrice !== null ? 1 : 0);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const f = facets.get(p.id);
      if (!f) return false;

      const productGender = p.gender || "unisex";
      const genderMatch =
        genderFilter === "all" ||
        productGender === genderFilter ||
        (genderFilter !== "unisex" && productGender === "unisex");
      if (!genderMatch) return false;

      if (q && !f.haystack.includes(q)) return false;
      if (brandFilter && f.brand !== brandFilter) return false;
      if (concFilter && f.concentration !== concFilter) return false;
      if (familyFilter && !f.families.includes(familyFilter)) return false;
      if (seasonFilter && !f.seasons.includes(seasonFilter)) return false;
      if (timeFilter && !f.times.includes(timeFilter)) return false;
      if (onlySaved && !wishlist.has(p.id)) return false;
      if (maxPrice !== null && f.priceUzs > maxPrice) return false;

      return true;
    });
  }, [
    products,
    facets,
    genderFilter,
    query,
    brandFilter,
    concFilter,
    familyFilter,
    seasonFilter,
    timeFilter,
    onlySaved,
    maxPrice,
    wishlist,
  ]);

  // Filtr/qidiruv o'zgarsa — boshidan ko'rsatamiz.
  // Effekt emas, chizish paytida tiklaymiz: effekt ishlaguncha eski uzun
  // ro'yxat bir kadr chizilib, telefonda sakrash sezilardi.
  const filterKey = [
    genderFilter,
    query,
    brandFilter,
    concFilter,
    familyFilter,
    seasonFilter,
    timeFilter,
    onlySaved,
    maxPrice,
  ].join("|\u0000|"); // ajratkich - qidiruvdagi bosh joy chalkashtirmasin
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisible(PAGE);
  }

  // Pastga yetganda keyingi qismini avtomatik yuklaymiz
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => (v < filteredProducts.length ? v + PAGE : v));
        }
      },
      { rootMargin: "600px" } // oldindan yuklaymiz — uzluksiz his qilinadi
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filteredProducts.length]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    const f = getFragranceView(product);
    toast(f.brand ? `${f.brand} — ${f.name}` : f.name, {
      description: lang === "ru" ? "Добавлено в корзину" : "Savatchaga qo'shildi",
      action: {
        label: lang === "ru" ? "Корзина" : "Savatcha",
        onClick: () => router.push("/cart"),
      },
    });
  };

  const resetFilters = () => {
    setBrandFilter(null);
    setConcFilter(null);
    setFamilyFilter(null);
    setSeasonFilter(null);
    setTimeFilter(null);
    setOnlySaved(false);
    setMaxPrice(null);
  };

  const genderLabels: Record<Gender, { uz: string; ru: string }> = {
    all: { uz: "Barchasi", ru: "Все" },
    male: { uz: "Erkaklar", ru: "Мужские" },
    female: { uz: "Ayollar", ru: "Женские" },
    unisex: { uz: "Unisex", ru: "Унисекс" },
  };

  return (
    <div className="space-y-8">
      {/* Qidiruv */}
      <div className="max-w-xl mx-auto w-full">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground
                       group-focus-within:text-gold-dark transition-colors pointer-events-none z-[1]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="field field-icon field-clear w-full"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-[1]"
              aria-label={lang === "ru" ? "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c" : "Tozalash"}
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Jins + filtrlarni ochish */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(["all", "male", "female", "unisex"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGenderFilter(g)}
            className="pill"
            data-active={genderFilter === g}
          >
            {lang === "ru" ? genderLabels[g].ru : genderLabels[g].uz}
          </button>
        ))}

        <button
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="pill gap-2"
          data-active={filtersOpen || activeCount > 0}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
          {lang === "ru" ? "\u0424\u0438\u043b\u044c\u0442\u0440\u044b" : "Filtrlar"}
          {activeCount > 0 && ` (${activeCount})`}
        </button>
      </div>

      {/* Aqlli filtrlar */}
      {filtersOpen && (
        <div className="border-y border-border animate-fade-in">
          <Accordion.Root
            type="multiple"
            defaultValue={["family", "concentration"]}
            className="divide-y divide-border"
          >
            {options.families.length > 0 && (
              <FilterGroup
                id="family"
                label={lang === "ru" ? "\u0421\u0435\u043c\u0435\u0439\u0441\u0442\u0432\u043e \u043d\u043e\u0442" : "Notalar oilasi"}
                active={
                  familyFilter
                    ? NOTE_FAMILY_LABEL[familyFilter][lang === "ru" ? "ru" : "uz"]
                    : null
                }
              >
                <ChipRow
                  items={options.families.map((f) => ({
                    key: f,
                    label: NOTE_FAMILY_LABEL[f][lang === "ru" ? "ru" : "uz"],
                  }))}
                  value={familyFilter}
                  onChange={(v) => setFamilyFilter(v as NoteFamily | null)}
                />
              </FilterGroup>
            )}

            {options.concentrations.length > 0 && (
              <FilterGroup
                id="concentration"
                label={lang === "ru" ? "\u041a\u043e\u043d\u0446\u0435\u043d\u0442\u0440\u0430\u0446\u0438\u044f" : "Konsentratsiya"}
                active={concFilter ? CONCENTRATION_LABEL[concFilter] : null}
              >
                <ChipRow
                  items={options.concentrations.map((c) => ({
                    key: c,
                    label: CONCENTRATION_LABEL[c],
                  }))}
                  value={concFilter}
                  onChange={(v) => setConcFilter(v as Concentration | null)}
                />
              </FilterGroup>
            )}

            {options.seasons.length > 0 && (
              <FilterGroup
                id="season"
                label={lang === "ru" ? "\u0421\u0435\u0437\u043e\u043d" : "Mavsum"}
                active={
                  seasonFilter
                    ? SEASON_LABEL[seasonFilter][lang === "ru" ? "ru" : "uz"]
                    : null
                }
              >
                <ChipRow
                  items={options.seasons.map((x) => ({
                    key: x,
                    label: SEASON_LABEL[x][lang === "ru" ? "ru" : "uz"],
                  }))}
                  value={seasonFilter}
                  onChange={(v) => setSeasonFilter(v as Season | null)}
                />
              </FilterGroup>
            )}

            {options.times.length > 0 && (
              <FilterGroup
                id="time"
                label={lang === "ru" ? "\u0412\u0440\u0435\u043c\u044f \u0441\u0443\u0442\u043e\u043a" : "Kun vaqti"}
                active={
                  timeFilter
                    ? TIME_LABEL[timeFilter][lang === "ru" ? "ru" : "uz"]
                    : null
                }
              >
                <ChipRow
                  items={options.times.map((x) => ({
                    key: x,
                    label: TIME_LABEL[x][lang === "ru" ? "ru" : "uz"],
                  }))}
                  value={timeFilter}
                  onChange={(v) => setTimeFilter(v as TimeOfDay | null)}
                />
              </FilterGroup>
            )}

            {options.brands.length > 0 && (
              <FilterGroup
                id="brand"
                label={lang === "ru" ? "\u0411\u0440\u0435\u043d\u0434" : "Brend"}
                active={brandFilter}
              >
                <ChipRow
                  items={options.brands.map((b) => ({
                    key: b.name,
                    label: `${b.name} (${b.count})`,
                  }))}
                  value={brandFilter}
                  onChange={setBrandFilter}
                />
              </FilterGroup>
            )}

            {/* Narx - faqat katalogda haqiqiy farq bo'lsa */}
            {hasPriceRange && (
              <FilterGroup
                id="price"
                label={lang === "ru" ? "\u0426\u0435\u043d\u0430" : "Narx"}
                active={
                  maxPrice !== null
                    ? `${formatUzs(maxPrice)} ${lang === "ru" ? "\u0434\u043e" : "gacha"}`
                    : null
                }
              >
                <div className="pt-1 pb-2 max-w-md">
                  <Slider.Root
                    min={priceFloor}
                    max={priceCeil}
                    step={priceStep}
                    value={[priceValue]}
                    onValueChange={([v]) => setMaxPrice(v >= priceCeil ? null : v)}
                    className="relative flex items-center w-full h-6 select-none touch-none"
                    aria-label={lang === "ru" ? "\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u0430\u044f \u0446\u0435\u043d\u0430" : "Eng yuqori narx"}
                  >
                    <Slider.Track className="relative h-[2px] w-full bg-border">
                      <Slider.Range className="absolute h-full bg-gold-dark" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-4 h-4 bg-foreground border border-foreground
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold
                                 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                                 hover:bg-gold-dark hover:border-gold-dark transition-colors"
                    />
                  </Slider.Root>

                  <div className="mt-3 flex justify-between text-[11px] tabular-nums text-muted-foreground">
                    <span>{formatUzs(priceFloor)}</span>
                    <span className="text-foreground">
                      {formatUzs(priceValue)} {lang === "ru" ? "\u0441\u0443\u043c" : "so'm"}
                    </span>
                  </div>
                </div>
              </FilterGroup>
            )}
          </Accordion.Root>

          <div className="flex flex-wrap items-center gap-3 py-6">
            <button
              onClick={() => setOnlySaved((v) => !v)}
              className="pill"
              data-active={onlySaved}
            >
              {lang === "ru" ? "\u0418\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435" : "Sevimlilar"}
              {wishlist.count > 0 && ` (${wishlist.count})`}
            </button>

            {activeCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                {lang === "ru" ? "\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c" : "Tozalash"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Natija soni ───────────────────────────────────────── */}
      {(activeCount > 0 || query) && filteredProducts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {filteredProducts.length} {lang === "ru" ? "аромата" : "ta atir"}
        </p>
      )}

      {/* ── Ro'yxat ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
        {filteredProducts.slice(0, visible).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onQuickView={setQuickView}
          />
        ))}
      </div>

      {/* Avtomatik yuklash nuqtasi + zaxira tugma */}
      {visible < filteredProducts.length && (
        <div ref={sentinelRef} className="flex justify-center pt-4">
          <button
            onClick={() => setVisible((v) => v + PAGE)}
            className="btn btn-outline"
          >
            {lang === "ru" ? "Показать ещё" : "Yana ko'rsatish"}
            <span className="ml-2 opacity-60 normal-case tracking-normal">
              {visible}/{filteredProducts.length}
            </span>
          </button>
        </div>
      )}

      {/* Bo'sh holat */}
      {filteredProducts.length === 0 && (
        <div className="py-24 text-center space-y-4">
          <p className="font-heading text-xl text-foreground">
            {query ? (
              <>
                &ldquo;{query}&rdquo; {t("search_no_results")}
              </>
            ) : (
              t("empty_catalog")
            )}
          </p>
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {lang === "ru" ? "Сбросить фильтры" : "Filtrlarni tozalash"}
            </button>
          )}
        </div>
      )}

      <QuickViewDialog
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => {
          handleAddToCart(p);
          setQuickView(null);
        }}
      />
    </div>
  );
}

/** Yig'iladigan filtr guruhi - brendlar ro'yxati uzun, doim ochiq turmasin. */
function FilterGroup({
  id,
  label,
  active,
  children,
}: {
  id: string;
  label: string;
  active?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={id}>
      <Accordion.Header>
        <Accordion.Trigger
          className="group/acc w-full flex items-center justify-between gap-4 py-5 text-left
                     min-h-[52px] hover:text-foreground transition-colors"
        >
          <span className="flex items-baseline gap-3 min-w-0">
            <span className="eyebrow text-muted-foreground group-hover/acc:text-foreground transition-colors">
              {label}
            </span>
            {active && (
              <span className="text-[11px] text-gold-dark truncate">{active}</span>
            )}
          </span>
          <ChevronDown
            className="w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-300
                       group-data-[state=open]/acc:rotate-180"
            strokeWidth={1.5}
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden">
        <div className="pb-6">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

/** Variantlar qatori. */
function ChipRow({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(value === it.key ? null : it.key)}
          className="pill"
          data-active={value === it.key}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
