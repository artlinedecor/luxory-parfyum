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
    // Home — Premium Hero
    hero_badge: "Premium Parfyumeriya",
    hero_title_1: "Atirning",
    hero_title_2: "Hashamatli",
    hero_title_3: "Dunyosi",
    hero_desc: "Dunyoning eng nufuzli brendlari — Baccarat Rouge 540, Tom Ford, Creed Aventus. Original va Super Klon parfyumeriya kolleksiyamiz bilan tanishing.",
    hero_delivery_badge: "🚚 O'zbekiston bo'ylab yetkazib berish mavjud",
    btn_catalog: "Katalogni ko'rish",
    btn_original: "Original atirlar",
    hero_scroll: "Pastga",
    stats_products: "Mahsulotlar",
    stats_brands: "Brendlar",
    stats_support: "Qo'llab-quvvatlash",
    collection_title_1: "Bizning ",
    collection_title_2: "Kolleksiya",
    collection_desc: "Original atirlar va ularning mukammal klonlari — sifati va koʻrinishida hech qanday farq yoʻq!",
    features_fast_title: "Tez Yetkazib Berish",
    features_fast_desc: "O'zbekiston bo'ylab eng tez fursatda yetkazib beramiz",
    features_quality_title: "Sifat Kafolati",
    features_quality_desc: "100% original va eng sifatli super klonlar",
    features_price_title: "Qulay Narxlar",
    features_price_desc: "Eng yaxshi narx va sifat nisbati",
    // Catalog
    tab_all: "Barchasi",
    tab_lux: "Super Klonlar",
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
    cart_btn_checkout: "Buyurtmani tasdiqlash",
    cart_payment_card: "To'lov kartasi",
    cart_success_title: "Buyurtma yuborildi!",
    cart_success_desc: "Buyurtmangiz qabul qilindi va adminga xabar yuborildi. Tez orada siz bilan bog'lanamiz.",
    cart_send_check_btn: "Telegram orqali chekni yuboring",
    cart_back_btn: "Katalogga qaytish",
    cart_receipt_label: "To'lov cheki (skrinshot)",
    cart_receipt_placeholder: "Chek rasmini yuklash uchun bosing",
    cart_receipt_hint: "PNG, JPG — ixtiyoriy",
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
    btn_order_deposit: "Savatga qo'shish",
    btn_added: "✓ Qo'shildi",
  },
  ru: {
    // Nav
    home: "Главная",
    catalog: "Каталог",
    cart: "Корзина",
    login: "Войти",
    // Home — Premium Hero
    hero_badge: "Премиум Парфюмерия",
    hero_title_1: "Роскошный",
    hero_title_2: "Мир",
    hero_title_3: "Парфюмерии",
    hero_desc: "Самые престижные бренды мира — Baccarat Rouge 540, Tom Ford, Creed Aventus. Откройте нашу коллекцию оригиналов и супер-клонов.",
    hero_delivery_badge: "🚚 Доставка по всему Узбекистану",
    btn_catalog: "Смотреть каталог",
    btn_original: "Оригинальные ароматы",
    hero_scroll: "Вниз",
    stats_products: "Товаров",
    stats_brands: "Брендов",
    stats_support: "Поддержка",
    collection_title_1: "Наша ",
    collection_title_2: "Коллекция",
    collection_desc: "Оригинальные ароматы и их идеальные клоны — абсолютно без разницы в качестве и внешнем виде!",
    features_fast_title: "Быстрая Доставка",
    features_fast_desc: "Быстрая доставка по всему Узбекистану",
    features_quality_title: "Гарантия Качества",
    features_quality_desc: "100% оригиналы и лучшие супер-клоны",
    features_price_title: "Доступные Цены",
    features_price_desc: "Лучшее соотношение цены и качества",
    // Catalog
    tab_all: "Все",
    tab_lux: "Супер Клоны",
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
    cart_btn_checkout: "Подтвердить заказ",
    cart_payment_card: "Карта для оплаты",
    cart_success_title: "Заказ отправлен!",
    cart_success_desc: "Ваш заказ принят и администратор уведомлён. Мы свяжемся с вами в ближайшее время.",
    cart_send_check_btn: "Отправить чек через Telegram",
    cart_back_btn: "Вернуться в каталог",
    cart_receipt_label: "Чек оплаты (скриншот)",
    cart_receipt_placeholder: "Нажмите, чтобы загрузить скриншот",
    cart_receipt_hint: "PNG, JPG — необязательно",
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
    btn_order_deposit: "В корзину",
    btn_added: "✓ Добавлено",
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("uz");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
