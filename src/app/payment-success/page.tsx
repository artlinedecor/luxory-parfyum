import Link from "next/link";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto animate-scale-in">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">
            To'lov amalga oshirildi!
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Buyurtmangiz qabul qilindi. Tez orada adminlarimiz siz bilan bog'lanadi va 3 ish kunida yetkazib beriladi.
          </p>

          <div className="flex flex-col gap-3 pt-6">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-gold text-black font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-gold/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Katalogga qaytish
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
