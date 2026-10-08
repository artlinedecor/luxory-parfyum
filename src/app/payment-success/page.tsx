import { Suspense } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import UzumPaymentResult from "@/components/UzumPaymentResult";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

// To'lov natijasi — shaxsiy sahifa, qidiruvga chiqmaydi.
export const metadata: Metadata = {
  title: `To'lov natijasi — ${siteConfig.siteName}`,
  robots: { index: false, follow: false },
};

export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16 flex items-center justify-center">
        <Suspense fallback={null}>
          <UzumPaymentResult />
        </Suspense>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
