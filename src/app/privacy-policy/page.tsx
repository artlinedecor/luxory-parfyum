"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useI18n } from "@/lib/i18n-context";
import { useShopSettings } from "@/lib/settings-context";
import Link from "next/link";

export default function PrivacyPolicy() {
  const { lang } = useI18n();
  const { shopName, shopAddress, shopPhone } = useShopSettings();

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="relative py-10 px-6 sm:px-10 rounded-3xl bg-[#0d0d0d]/80 border border-gold/10 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Decorative background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

          {lang === "uz" ? (
            <article className="space-y-8 prose prose-invert max-w-none text-muted-foreground">
              <div className="space-y-4 border-b border-gold/10 pb-6 text-center">
                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gradient-gold">
                  Maxfiylik Siyosati
                </h1>
                <p className="text-sm text-gold/60">
                  Oxirgi yangilanish: {new Date().toLocaleDateString("uz-UZ")}
                </p>
              </div>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  1. Umumiy qoidalar
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Ushbu Maxfiylik siyosati <strong>{shopName}</strong> (keyingi o'rinlarda "Kompaniya" yoki "Biz") foydalanuvchilarning (keyingi o'rinlarda "Foydalanuvchi" yoki "Siz") shaxsiy ma'lumotlarini qanday to'plashi, foydalanishi, saqlashi va himoya qilishini belgilaydi. Bizning veb-saytimizdan foydalanish orqali siz ushbu Maxfiylik siyosati shartlariga rozilik bildirasiz.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  2. To'planadigan ma'lumotlar
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Siz sayt orqali buyurtma berganingizda, biz quyidagi ma'lumotlarni to'plashimiz mumkin:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base">
                  <li>Foydalanuvchining ismi va familiyasi;</li>
                  <li>Telefon raqami;</li>
                  <li>Yetkazib berish manzili va viloyati;</li>
                  <li>To'lovni tasdiqlovchi chek (skrinshot) yoki to'lov ma'lumotlari;</li>
                  <li>Saytdan foydalanish haqidagi ma'lumotlar (IP-manzil, qurilma turi, kuki-fayllar).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  3. Ma'lumotlardan foydalanish maqsadlari
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Biz to'plagan ma'lumotlardan quyidagi maqsadlarda foydalanamiz:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base">
                  <li>Buyurtmalaringizni qabul qilish, rasmiylashtirish va yetkazib berish;</li>
                  <li>Siz bilan bog'lanish va buyurtma holati haqida xabar berish;</li>
                  <li>Mijozlarni qo'llab-quvvatlash xizmatini ko'rsatish;</li>
                  <li>Veb-sayt xizmatlarini yaxshilash va tahlil qilish;</li>
                  <li>Meta Pixel va boshqa reklama vositalari orqali siz uchun foydali bo'lgan reklamalarni taqdim etish.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  4. Kuki (Cookies) va Reklama Texnologiyalari
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Veb-saytimiz foydalanuvchi tajribasini yaxshilash va reklama samaradorligini tahlil qilish uchun kuki (cookies) fayllaridan hamda uchinchi tomon tahliliy xizmatlaridan (jumladan, Meta Pixel va Yandex Metrika) foydalanadi. Bu texnologiyalar yordamida reklamalar sizning qiziqishlaringizga moslashtiriladi va ularning samaradorligi o'lchanadi. Siz kuki-fayllarni brauzeringiz sozlamalari orqali o'chirib qo'yishingiz mumkin.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  5. Ma'lumotlar xavfsizligi va saqlanishi
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Biz sizning shaxsiy ma'lumotlaringizni ruxsatsiz kirish, yo'qotish yoki oshkor etilishidan himoya qilish uchun zarur bo'lgan tashkiliy va texnik choralarni ko'ramiz. Sizning shaxsiy ma'lumotlaringiz uchinchi shaxslarga sotilmaydi yoki ijaraga berilmaydi. Ma'lumotlar faqatgina buyurtmani yetkazib beruvchi kuryerlik xizmatlariga va qonunchilikda ko'zda tutilgan hollarda davlat organlariga taqdim etilishi mumkin.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  6. Foydalanuvchi huquqlari
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Siz o'zingiz taqdim etgan shaxsiy ma'lumotlarni o'zgartirish, aniqlashtirish yoki o'chirishni talab qilish huquqiga egasiz. Buning uchun pastda ko'rsatilgan aloqa vositalari orqali bizga murojaat qilishingiz mumkin.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  7. Bog'lanish
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Ushbu Maxfiylik siyosati bo'yicha savollaringiz yoki takliflaringiz bo'lsa, quyidagi ma'lumotlar orqali biz bilan bog'lanishingiz mumkin:
                </p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
                  <p><strong className="text-gold">Do'kon nomi:</strong> {shopName}</p>
                  <p><strong className="text-gold">Manzil:</strong> {shopAddress}</p>
                  <p><strong className="text-gold">Telefon:</strong> {shopPhone}</p>
                </div>
              </section>

              <div className="pt-6 border-t border-gold/10 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-2 rounded-xl bg-gradient-gold text-black font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Bosh sahifaga qaytish
                </Link>
              </div>
            </article>
          ) : (
            <article className="space-y-8 prose prose-invert max-w-none text-muted-foreground">
              <div className="space-y-4 border-b border-gold/10 pb-6 text-center">
                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gradient-gold">
                  Политика Конфиденциальности
                </h1>
                <p className="text-sm text-gold/60">
                  Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
                </p>
              </div>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  1. Общие положения
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Настоящая Политика конфиденциальности определяет порядок сбора, использования, хранения и защиты персональных данных пользователей (далее «Пользователь» или «Вы») интернет-магазином <strong>{shopName}</strong> (далее «Компания» или «Мы»). Используя наш сайт, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  2. Собираемые данные
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  При оформлении заказа на сайте мы можем собирать следующие персональные данные:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base">
                  <li>Имя и фамилия Пользователя;</li>
                  <li>Номер телефона;</li>
                  <li>Адрес и регион доставки;</li>
                  <li>Чек оплаты (скриншот) или платежные данные;</li>
                  <li>Технические данные использования сайта (IP-адрес, тип устройства, файлы cookies).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  3. Цели использования данных
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Мы используем собранные данные в следующих целях:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base">
                  <li>Прием, обработка и доставка ваших заказов;</li>
                  <li>Связь с вами и информирование о статусе заказа;</li>
                  <li>Предоставление службы поддержки клиентов;</li>
                  <li>Анализ и улучшение работы сайта;</li>
                  <li>Показ релевантной рекламы через Meta Pixel и другие рекламные платформы.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  4. Использование файлов Cookies и реклама
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Наш сайт использует файлы cookies и сторонние аналитические системы (включая Meta Pixel и Яндекс Метрику) для анализа пользовательского поведения и повышения эффективности рекламы. Это позволяет адаптировать маркетинговые материалы под ваши интересы. Вы можете отключить поддержку cookies в настройках вашего браузера.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  5. Защита и передача данных
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Мы принимаем необходимые технические и организационные меры безопасности для защиты ваших персональных данных от несанкционированного доступа, изменения или раскрытия. Мы не продаем и не сдаем ваши данные в аренду третьим лицам. Данные могут передаваться только курьерским службам для осуществления доставки и государственным органам в соответствии с законодательством.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  6. Права Пользователя
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Вы имеете право на доступ, изменение или удаление своих персональных данных, предоставленных нам. Для этого вы можете связаться с нами по контактам, указанным ниже.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded bg-gold block" />
                  7. Контактная информация
                </h2>
                <p className="leading-relaxed text-sm sm:text-base">
                  Если у вас возникли вопросы касательно политики конфиденциальности, пожалуйста, свяжитесь с нами:
                </p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
                  <p><strong className="text-gold">Название магазина:</strong> {shopName}</p>
                  <p><strong className="text-gold">Адрес:</strong> {shopAddress}</p>
                  <p><strong className="text-gold">Телефон:</strong> {shopPhone}</p>
                </div>
              </section>

              <div className="pt-6 border-t border-gold/10 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-2 rounded-xl bg-gradient-gold text-black font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Вернуться на главную
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <BottomNav />
      {/* Bottom spacer for mobile */}
      <div className="h-20 md:hidden" />
    </>
  );
}
