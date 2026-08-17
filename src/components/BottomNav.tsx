"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";

import { useCart } from "@/lib/cart-context";

const navItems = [
  {
    label: "Asosiy",
    href: "/",
    icon: (
      <Home className="w-5 h-5" strokeWidth={1.25} />
    ),
  },
  {
    label: "Katalog",
    href: "/catalog",
    icon: (
      <LayoutGrid className="w-5 h-5" strokeWidth={1.25} />
    ),
  },
  {
    label: "Savatcha",
    href: "/cart",
    icon: (
      <ShoppingBag className="w-5 h-5" strokeWidth={1.25} />
    ),
  },
  {
    label: "Kirish",
    href: "/login",
    icon: (
      <User className="w-5 h-5" strokeWidth={1.25} />
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Don't show on dashboard routes
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/92 backdrop-blur-xl border-t border-border" />

      <div className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                transition-all duration-300 min-w-[60px]
                ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <div className={`relative ${isActive ? "animate-scale-in" : ""}`}>
                {item.icon}
                {item.label === "Savatcha" && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-foreground text-background text-[9px] font-semibold flex items-center justify-center animate-scale-in">
                    {totalItems}
                  </span>
                )}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-dark" />
                )}
              </div>
              <span className="text-[11px] tracking-[0.08em] uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
