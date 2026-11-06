"use client";

import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/lib/i18n-context";

/** Opens the owner's chat; screenshots are attached and sent by the customer. */
export default function UzumSupport({ collapsible = false }: { collapsible?: boolean }) {
  const { lang } = useI18n();
  const ru = lang === "ru";
  const content = <div className="space-y-3">
    <p className="text-xs text-muted-foreground leading-relaxed">
      {ru ? "Не получается пройти регистрацию или оформить покупку? Сделайте скриншот ошибки и отправьте нам в Telegram."
        : "Ro'yxatdan o'tish yoki xaridni rasmiylashtirishda muammo bo'ldimi? Xatolik oynasini skrinshot qilib, Telegram orqali bizga yuboring."}
    </p>
    <a href={siteConfig.uzumSupportTelegram} target="_blank" rel="noopener noreferrer"
      className="btn btn-outline btn-block btn-sm gap-2" data-uzum-support="telegram">
      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      {ru ? "Помощь в Telegram" : "Telegram orqali yordam"}
    </a>
    <p className="text-[11px] text-muted-foreground leading-relaxed">
      {ru ? "Перед отправкой скройте СМС-код, данные карты и документа."
        : "Yuborishdan oldin SMS-kod, karta va hujjat ma'lumotlarini berkitib qo'ying."}
    </p>
  </div>;
  return collapsible ? <details className="rounded-xl border border-border p-3.5">
    <summary className="cursor-pointer text-xs font-semibold text-foreground">{ru ? "Возникла проблема?" : "Muammo bo'ldimi?"}</summary>
    <div className="pt-3">{content}</div>
  </details> : <aside aria-label={ru ? "Помощь с Uzum Nasiya" : "Uzum Nasiya bo'yicha yordam"} className="rounded-xl border border-border bg-card p-3.5">{content}</aside>;
}
