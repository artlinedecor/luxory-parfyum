"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export default function FloatingCart() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide on dashboard and cart pages
  if (pathname.startsWith("/dashboard") || pathname === "/cart") return null;

  // Hide if cart is empty
  if (totalItems === 0) return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-24 md:bottom-6 right-6 z-50 animate-scale-in group"
    >
      <div className="relative w-14 h-14 rounded-full bg-gradient-gold text-black flex items-center justify-center shadow-2xl shadow-gold/30 hover:scale-105 transition-transform duration-300">
        <ShoppingBag className="w-6 h-6" strokeWidth={1.25} />

        {/* Counter Badge */}
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-background">
          {totalItems}
        </div>
      </div>
    </Link>
  );
}
