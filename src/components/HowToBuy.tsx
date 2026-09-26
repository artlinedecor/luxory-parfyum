"use client";

import { Search, Smartphone, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

/**
 * "Qanday sotib olinadi" — 3 qadam. Eski katta InstallmentBanner o'rnida:
 * u ekranning ikki barobarini egallab, ichida bir dona rasm va raqamsiz
 * "3 oy / 6 oy / 12 oy" kataklari bor edi. Matnlar — saytda allaqachon
 * tasdiqlangan va'dalar (nasiya_point_*).
 */
export default function HowToBuy() {
  const { lang } = useI18n();
  const ru = lang === "ru";

  const steps = [
    { Icon: Search, title: ru ? "Выберите аромат" : "Atirni tanlang", text: ru ? "Нажмите «Купить в рассрочку» на странице аромата" : "Atir sahifasida «Bo'lib to'lash» tugmasini bosing" },
    { Icon: Smartphone, title: ru ? "Телефон и SMS-код" : "Telefon va SMS-kod", text: ru ? "Договор Uzum Nasiya онлайн, за 2 минуты — без визита в банк" : "Uzum Nasiya shartnomasi onlayn, 2 daqiqada — bankka bormaysiz" },
    { Icon: Truck, title: ru ? "Доставим" : "Yetkazib beramiz", text: ru ? "Платите 3, 6 или 12 месяцев" : "To'lovni 3, 6 yoki 12 oyga bo'lib to'laysiz" },
  ];

  return (
    <section id="nasiya" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl text-foreground text-center">
          {ru ? "Как купить в рассрочку" : "Bo'lib to'lashga qanday olinadi"}
        </h2>
        <ol className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="flex sm:flex-col items-start gap-4 rounded-2xl border border-border bg-background p-4 sm:p-5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6100FF]/[0.08] text-[#5a00e6]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">{i + 1}</span>
              </span>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
