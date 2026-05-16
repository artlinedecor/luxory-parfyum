"use client";

import Link from "next/link";
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>

        {/* Counter Badge */}
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-[#0a0a0a]">
          {totalItems}
        </div>
      </div>
    </Link>
  );
}
