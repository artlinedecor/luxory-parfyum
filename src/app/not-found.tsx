import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { siteConfig } from "@/config/site";

/**
 * 404 sahifa. Avval Next'ning standart inglizcha "This page could not be
 * found" sahifasi chiqardi — sayt dizaynisiz, navigatsiyasiz. Next 404
 * javobiga `noindex` ni o'zi qo'shadi.
 */
export const metadata: Metadata = {
  title: `Sahifa topilmadi — ${siteConfig.siteName}`,
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-24 md:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="glass-card p-12 text-center space-y-6">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Sahifa topilmadi
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Siz qidirgan sahifa mavjud emas yoki ko&apos;chirilgan. Atirlar katalogidan tanlang.
              <br />
              Страница не найдена — перейдите в каталог.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/catalog" className="btn btn-primary">
                Katalog
              </Link>
              <Link href="/" className="btn btn-outline">
                Bosh sahifa
              </Link>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
      <div className="h-20 md:hidden" />
    </>
  );
}
