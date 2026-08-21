"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { readPending, resolvePending } from "@/lib/uzum-pending";

/**
 * Xavfsizlik tarmog'i: mijoz Uzum sahifasida shartnomani imzolab, lekin
 * saytga qaytmasdan oynani yopib qo'ysa — buyurtma yo'qolib ketardi.
 * Bu komponent istalgan sahifa ochilganda kutilayotgan shartnomani
 * tekshiradi va imzolangan bo'lsa buyurtmani yozadi.
 *
 * /payment-success da ishlamaydi — u yerda UzumPaymentResult o'zi
 * tekshiradi (ikkovi bir vaqtda ishlasa ikki marta yozilib qolishi mumkin).
 */
export default function UzumPendingRecovery() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/payment-success") return;
    if (!readPending()) return;
    resolvePending().catch(() => {});
  }, [pathname]);

  return null;
}
