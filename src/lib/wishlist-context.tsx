"use client";

/**
 * Sevimlilar (Wishlist) — faqat brauzerda saqlanadi (localStorage).
 * Serverga hech narsa yozilmaydi, ro'yxatdan o'tish talab qilinmaydi.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "lux_wishlist_v1";

interface WishlistValue {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  // Birinchi chizishdan keyin o'qiymiz — server/klient mos kelishi buzilmasin
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // localStorage — tashqi tizim, uni faqat brauzerda o'qish mumkin.
          // Boshlang'ich qiymat sifatida o'qisak, server bilan mos kelmay
          // gidratatsiya buzilardi. Shuning uchun bir marta effektda.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIds(parsed.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {
      /* localStorage yopiq bo'lsa — shunchaki bo'sh ro'yxat */
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* joy tugagan bo'lsa jim o'tamiz */
    }
  }, []);

  const value = useMemo<WishlistValue>(
    () => ({
      ids,
      count: ids.length,
      has: (id) => ids.includes(id),
      toggle: (id) =>
        persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
      remove: (id) => persist(ids.filter((x) => x !== id)),
    }),
    [ids, persist]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist faqat WishlistProvider ichida ishlaydi");
  }
  return ctx;
}
