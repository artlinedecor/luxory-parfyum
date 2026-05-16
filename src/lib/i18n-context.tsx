"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "uz" | "ru";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  uz: {
    // Nav
    home: "Asosiy",
    catalog: "Katalog",
    cart: "Savatcha",
    login: "Kirish",
    // Home
    hero_title: "Atirning Hashamatli Dunyosi",
    hero_desc: "Original va Lux kopiya parfyumeriya — eng mashhur brendlarning atirlari. Toshkentda yetkazib berish xizmati bilan.",
    btn_catalog: "Katalogni ko'rish",
    btn_original: "Original atirlar",
    stats_products: "Mahsulotlar",
    stats_brands: "Brendlar",
    stats_support: "Qo'llab-quvvatlash",
    collection_title_1: "Bizning ",
    collection_title_2: "Kolleksiya",
    collection_desc: "Eng mashhur brendlarning original va lux kopiya atirlari — barchasi bir joyda.",
    features_fast_title: "Tez Yetkazib Berish",
    features_fast_desc: "O'zbekiston bo'ylab eng tez fursatda yetkazib beramiz",
    features_quality_title: "Sifat Kafolati",
    features_quality_desc: "100% original va eng sifatli kopiyalar",
    features_price_title: "Qulay Narxlar",
    features_price_desc: "Eng yaxshi narx va sifat nisbati",
    // Catalog
    tab_all: "Barchasi",
    tab_lux: "Lux Kopiyalar",
    tab_original: "Original (Zakaz)",
    empty_catalog: "Bu bo'limda hozircha mahsulot yo'q",
    // Cart
    cart_empty_title: "Savatcha bo'sh",
    cart_empty_desc: "Katalogdan o'zingizga yoqqan atirlarni tanlang va savatchaga qo'shing",
    cart_go_catalog: "Katalogga o'tish",
    cart_total_price: "Umumiy summa",
    cart_payable_amount: "To'lanadigan summa",
    cart_total: "Jami",
    cart_deposit_note: "* Original atirlar uchun $50 zaklad to'lanadi. Qolgan summa yetkazib berilganda to'lanadi.",
    cart_order_details: "Buyurtma ma'lumotlari",
    cart_name: "Ismingiz",
    cart_phone: "Telefon raqamingiz",
    cart_region: "Viloyat",
    cart_region_placeholder: "Viloyatni tanlang",
    cart_address: "Manzil / Lokatsiya",
    cart_btn_checkout: "To'lov chekini yuborish va Tasdiqlash",
    cart_payment_card: "To'lov kartasi",
    cart_success_title: "Buyurtma yuborildi!",
    cart_success_desc: "Telegram orqali adminga xabar yuborildi. Iltimos, to'lov chekining skrinshotini ham biriktiring.",
    cart_send_check_btn: "Telegram orqali chekni yuboring",
    cart_back_btn: "Katalogga qaytish",
    // Regions
    region_tashkent_city: "Toshkent shahri",
    region_tashkent: "Toshkent viloyati",
    region_andijan: "Andijon viloyati",
    region_bukhara: "Buxoro viloyati",
    region_jizzakh: "Jizzax viloyati",
    region_kashkadarya: "Qashqadaryo viloyati",
    region_navoi: "Navoiy viloyati",
    region_namangan: "Namangan viloyati",
    region_samarkand: "Samarqand viloyati",
    region_surkhandarya: "Surxondaryo viloyati",
    region_syrdarya: "Sirdaryo viloyati",
    region_fergana: "Farg'ona viloyati",
    region_khorezm: "Xorazm viloyati",
    region_karakalpakstan: "Qoraqalpog'iston Respublikasi",
    // Product
    btn_add_cart: "Savatchaga",
    btn_order_deposit: "$50 Zaklad bilan buyurtma",
    btn_added: "✓ Qo'shildi",
  },
  ru: {
    // Nav
    home: "Главная",
    catalog: "Каталог",
    cart: "Корзина",
    login: "Войти",
    // Home
    hero_title: "Роскошный Мир Парфюмерии",
    hero_desc: "Оригиналы и люкс копии парфюмерии — ароматы самых известных брендов. С доставкой по Ташкенту.",
    btn_catalog: "Смотреть каталог",
    btn_original: "Оригинальные ароматы",
    stats_products: "Товаров",
    stats_brands: "Брендов",
    stats_support: "Поддержка",
    collection_title_1: "Наша ",
    collection_title_2: "Коллекция",
    collection_desc: "Оригиналы и люкс копии от самых известных брендов — все в одном месте.",
    features_fast_title: "Быстрая Доставка",
    features_fast_desc: "Быстрая доставка по всему Узбекистану",
    features_quality_title: "Гарантия Качества",
    features_quality_desc: "100% оригиналы и лучшие копии",
    features_price_title: "Доступные Цены",
    features_price_desc: "Лучшее соотношение цены и качества",
    // Catalog
    tab_all: "Все",
    tab_lux: "Люкс Копии",
    tab_original: "Оригиналы (На заказ)",
    empty_catalog: "В этом разделе пока нет товаров",
    // Cart
    cart_empty_title: "Корзина пуста",
    cart_empty_desc: "Выберите понравившиеся ароматы из каталога и добавьте в корзину",
    cart_go_catalog: "Перейти в каталог",
    cart_total_price: "Общая сумма",
    cart_payable_amount: "Сумма к оплате",
    cart_total: "Итого",
    cart_deposit_note: "* За оригинальные ароматы вносится депозит $50. Остаток оплачивается при доставке.",
    cart_order_details: "Данные заказа",
    cart_name: "Ваше имя",
    cart_phone: "Ваш телефон",
    cart_region: "Регион",
    cart_region_placeholder: "Выберите регион",
    cart_address: "Адрес / Локация",
    cart_btn_checkout: "Отправить чек и Подтвердить",
    cart_payment_card: "Карта для оплаты",
    cart_success_title: "Заказ отправлен!",
    cart_success_desc: "Сообщение отправлено администратору в Telegram. Пожалуйста, прикрепите скриншот чека об оплате.",
    cart_send_check_btn: "Отправить чек через Telegram",
    cart_back_btn: "Вернуться в каталог",
    // Regions
    region_tashkent_city: "г. Ташкент",
    region_tashkent: "Ташкентская область",
    region_andijan: "Андижанская область",
    region_bukhara: "Бухарская область",
    region_jizzakh: "Джизакская область",
    region_kashkadarya: "Кашкадарьинская область",
    region_navoi: "Навоийская область",
    region_namangan: "Наманганская область",
    region_samarkand: "Самаркандская область",
    region_surkhandarya: "Сурхандарьинская область",
    region_syrdarya: "Сырдарьинская область",
    region_fergana: "Ферганская область",
    region_khorezm: "Хорезмская область",
    region_karakalpakstan: "Республика Каракалпакстан",
    // Product
    btn_add_cart: "В корзину",
    btn_order_deposit: "Заказать с депозитом $50",
    btn_added: "✓ Добавлено",
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("uz");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem("lang") as Language;
    if (saved && (saved === "uz" || saved === "ru")) {
      setLang(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
