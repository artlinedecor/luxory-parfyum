"use client";

import { useState, useEffect, useMemo } from "react";
import { Product, Order, Transaction } from "@/lib/types";
import { dashLoad } from "@/lib/dashboard-api";
import { useI18n } from "@/lib/i18n-context";
import { usdToUzs, summarizeFinances } from "@/lib/accounting";
import { priceOfProductUzs } from "@/lib/pricing-server";

export default function AccountingPage() {
  const { lang } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const L = lang === "ru" ? {
    title: "Бухгалтерия",
    subtitle: "Склад, продажи, касса и общее финансовое состояние — всё в одном месте",
    stockSection: "Состояние Склада",
    totalStock: "Общий Остаток",
    invested: "Себестоимость склада",
    ta: "шт",
    revenueIfSold: "Сумма при продаже",
    expectedProfit: "Ожидаемая Прибыль",
    salesSection: "Продажи (Доставленные заказы)",
    soldItems: "Продано Товаров",
    revenue: "Доход",
    cogs: "Себестоимость",
    netProfit: "Чистая Прибыль",
    savdoQoldiq: "Остаток Продаж",
    tableSection: "Таблица Товаров (Подробно)",
    name: "Название",
    sellPrice: "Цена на сайте",
    stock: "Остаток",
    investedCol: "Себестоимость",
    revenueCol: "При продаже",
    profitCol: "Прибыль",
    noItems: "Нет товаров на складе",
    total: "ИТОГО",
  } : {
    title: "Hisob-kitob",
    subtitle: "Ombor, sotuvlar, kassa va umumiy moliyaviy holat — barchasi bitta joyda",
    stockSection: "Ombor Holati",
    totalStock: "Jami Qoldiq",
    invested: "Ombor tan narxi",
    ta: "ta",
    revenueIfSold: "Sotilgandagi Summa",
    expectedProfit: "Kutilayotgan Foyda",
    salesSection: "Sotuvlar (Yetkazilgan buyurtmalar)",
    soldItems: "Sotilgan Tovarlar",
    revenue: "Tushgan Pul (Daromad)",
    cogs: "Tan Narxi (Xarajat)",
    netProfit: "Sof Foyda",
    savdoQoldiq: "Savdo Qoldig'i",
    tableSection: "Tovarlar Jadvali (Batafsil)",
    name: "Nomi",
    sellPrice: "Saytdagi narx",
    stock: "Qoldiq",
    investedCol: "Tan narxi",
    revenueCol: "Sotilgandagi",
    profitCol: "Foyda",
    noItems: "Omborda tovar yo'q",
    total: "JAMI",
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Audit X7: admin tekshiruvi bo'lgan server route orqali.
        const d = await dashLoad();
        setProducts(d.products as never);
        setOrders(d.orders as never);
        setTransactions(d.transactions as never);
      } catch (e) {
        console.error("Error fetching accounting data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const fin = summarizeFinances({ transactions, deliveredOrders, products });

    // Omborni sotsak qancha tushadi — saytdagi haqiqiy narx bilan.
    let expectedSalesUzs = 0;
    for (const p of products) {
      const stock = p.stock || 0;
      if (stock > 0) expectedSalesUzs += stock * priceOfProductUzs(p);
    }

    const totalSold = deliveredOrders.reduce(
      (sum, o) => sum + (o.items ?? []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0),
      0
    );

    return { fin, expectedSalesUzs, expectedProfitUzs: expectedSalesUzs - fin.warehouseUzs, totalSold };
  }, [products, orders, transactions]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const inStock = products.filter(p => (p.stock || 0) > 0);

  return (
    <div className="space-y-8 max-w-6xl pb-10">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">{L.title}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {L.subtitle}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-28 animate-pulse bg-secondary/20" />
          ))}
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 1: OMBOR (STOCK) SUMMARY                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div>
            <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M3.3 7l8.7 5 8.7-5M12 22V12" /></svg>
              {L.stockSection}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-blue-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.totalStock}</p>
                <p className="text-2xl font-bold text-foreground">{stats.fin.warehouseItems.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">{L.ta}</span></p>
                <p className="text-[10px] text-red-400 mt-1 font-medium">{L.invested}: {fmt(stats.fin.warehouseUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-green-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.revenueIfSold}</p>
                <p className="text-2xl font-bold text-green-400">{fmt(stats.expectedSalesUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-gold/60">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.expectedProfit}</p>
                <p className="text-2xl font-bold text-gradient-gold">{fmt(stats.expectedProfitUzs)} so&apos;m</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 2: SOTUVLAR (DELIVERED ORDERS)                */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div>
            <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3m12 6 6-6" /></svg>
              {L.salesSection}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-purple-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{lang === "ru" ? "Вложенный капитал" : "Tikilgan pul (sarmoya)"}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + ("text-purple-400")}>{fmt(stats.fin.capitalUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-green-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.revenue}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + ("text-green-400")}>{fmt(stats.fin.salesUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-orange-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{lang === "ru" ? "Закупка товара" : "Tovar xaridi"}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + ("text-orange-400")}>{fmt(stats.fin.inventoryPurchasesUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-red-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{lang === "ru" ? "Операционные расходы" : "Operatsion rasxod"}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + ("text-red-400")}>{fmt(stats.fin.operatingExpensesUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-red-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.cogs}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + ("text-red-400")}>{fmt(stats.fin.cogsUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-gold/60">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.netProfit}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + (stats.fin.netProfitUzs >= 0 ? "text-gradient-gold" : "text-red-400")}>{fmt(stats.fin.netProfitUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-blue-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{lang === "ru" ? "Касса" : "Kassa"}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + (stats.fin.cashUzs >= 0 ? "text-blue-400" : "text-red-400")}>{fmt(stats.fin.cashUzs)} so&apos;m</p>
              </div>
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-gold/60">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{lang === "ru" ? "Всего активов" : "Jami boylik"}</p>
                <p className={"text-xl lg:text-2xl font-bold break-words " + ("text-gradient-gold")}>{fmt(stats.fin.totalWorthUzs)} so&apos;m</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {lang === "ru"
                ? "Фактическая прибыль (активы − капитал): " + fmt(stats.fin.realProfitUzs) + " сум · Расхождение склада: " + fmt(stats.fin.warehouseGapUzs) + " сум"
                : "Haqiqiy foyda (jami boylik − tikilgan pul): " + fmt(stats.fin.realProfitUzs) + " so'm · Ombor sverka farqi: " + fmt(stats.fin.warehouseGapUzs) + " so'm"}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 4: TOVARLAR JADVALI                           */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div>
            <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-2.625c0-.621.504-1.125 1.125-1.125" /></svg>
              {L.tableSection}
            </h2>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">№</th>
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{L.name}</th>
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">{L.sellPrice}</th>
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">{L.stock}</th>
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">{L.investedCol}</th>
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">{L.revenueCol}</th>
                      <th className="px-4 py-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">{L.profitCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">
                          {L.noItems}
                        </td>
                      </tr>
                    ) : (
                      <>
                        {inStock.map((product, index) => {
                          const stock = product.stock || 0;
                          const price = priceOfProductUzs(product);
                          const costPrice = usdToUzs((product as { cost_price_usd?: number }).cost_price_usd || 0);
                          const invested = stock * costPrice;
                          const revenue = stock * price;
                          const profit = revenue - invested;
                          return (
                            <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[200px] truncate" title={product.title}>
                                {lang === "ru" && product.title_ru ? product.title_ru : product.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground text-right">{fmt(price)} so&apos;m</td>
                              <td className="px-4 py-3 text-sm text-right">
                                <span className={`font-semibold px-2.5 py-1 rounded-full text-xs ${stock > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {stock} ta
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm text-red-400 font-semibold">{fmt(invested)} so&apos;m</span>
                                <span className="block text-[10px] text-muted-foreground">({fmt(costPrice)} × {stock})</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-green-400 text-right font-semibold">{fmt(revenue)} so&apos;m</td>
                              <td className={`px-4 py-3 text-sm font-bold text-right ${profit >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>
                                {fmt(profit)} so&apos;m
                              </td>
                            </tr>
                          );
                        })}
                        {/* JAMI (FOOTER ROW) */}
                        <tr className="bg-secondary/40 border-t-2 border-gold/30">
                          <td className="px-4 py-4 text-sm font-bold text-foreground" colSpan={2}>{L.total}</td>
                          <td className="px-4 py-4 text-sm text-foreground text-right font-bold">—</td>
                          <td className="px-4 py-4 text-sm text-blue-400 text-right font-bold">{stats.fin.warehouseItems} {L.ta}</td>
                          <td className="px-4 py-4 text-sm text-red-400 text-right font-bold">{fmt(stats.fin.warehouseUzs)} so&apos;m</td>
                          <td className="px-4 py-4 text-sm text-green-400 text-right font-bold">{fmt(stats.expectedSalesUzs)} so&apos;m</td>
                          <td className="px-4 py-4 text-sm font-bold text-right text-gradient-gold">{fmt(stats.expectedProfitUzs)} so&apos;m</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
