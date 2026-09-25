"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Product } from "@/lib/types";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs } from "@/lib/utils";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Savatcha qurilmada saqlanadi — Instagram/Telegram brauzerida mijoz boshqa
 * ilovaga o'tib qaytsa yoki sahifani yangilasa, tanlagan atiri yo'qolmasin.
 * Narx baribir serverda bazadan hisoblanadi (pricing-server.ts), bu yerdagi
 * mahsulot ma'lumoti faqat ko'rsatish uchun.
 */
const STORAGE_KEY = "lux_cart_v1";

function readSavedCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((i) => i?.product?.id && Number(i.quantity) > 0)
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    // Mikrovazifada — birinchi render server HTML bilan mos kelsin
    queueMicrotask(() => {
      const saved = readSavedCart();
      if (saved.length) setItems((prev) => (prev.length ? prev : saved));
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      // Tavsiflar kerak emas — joyni tejaymiz
      const slim = items.map(({ product, quantity }) => ({
        product: { ...product, description: undefined, description_ru: undefined },
        quantity,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      /* xotira yopiq (maxfiy rejim) — savatcha shu sahifada ishlayveradi */
    }
  }, [items]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => {
      const itemPriceUzs = item.product.product_type === "original" 
        ? calculateOriginalPriceUzs(item.product.price_usd)
        : calculatePremiumPriceUzs(item.product.price_usd);
      return sum + itemPriceUzs * item.quantity;
    },
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
