"use client";

import { useState, useEffect, useMemo } from "react";
import { dashLoad } from "@/lib/dashboard-api";
import { Order, Product, Transaction } from "@/lib/types";
import { orderRevenueUzs, usdToUzs, summarizeFinances } from "@/lib/accounting";
import { priceOfProductUzs } from "@/lib/pricing-server";

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Kutilmoqda", color: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20" },
  accepted: { text: "Qabul qilindi", color: "text-blue-400 bg-blue-400/10 border border-blue-400/20" },
  delivered: { text: "Yetkazildi", color: "text-green-400 bg-green-400/10 border border-green-400/20" },
  cancelled: { text: "Bekor qilindi", color: "text-red-400 bg-red-400/10 border border-red-400/20" },
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setMounted(true);

    const loadDashboardData = async () => {
      try {
        // Audit X7: bazaga to'g'ridan-to'g'ri emas, admin tekshiruvi
        // bo'lgan server route orqali.
        const d = await dashLoad();
        setProducts(d.products as never);
        setOrders(d.orders as Order[]);
        setTransactions(d.transactions as Transaction[]);
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "accepted");

    const fin = summarizeFinances({ transactions, deliveredOrders, products });

    // Omborni sotsak qancha tushadi — saytdagi haqiqiy narx bilan (pricing-server
    // bilan bir xil formula), price_usd bilan emas.
    let expectedSalesUzs = 0;
    for (const p of products) {
      const stock = p.stock || 0;
      if (stock > 0) expectedSalesUzs += stock * priceOfProductUzs(p);
    }

    const countItems = (list: typeof orders) =>
      list.reduce((s, o) => s + (o.items ?? []).reduce((a, i) => a + (Number(i.quantity) || 0), 0), 0);

    const recentOrders = orders.map(o => {
      const items = o.items || [];
      const totalAmount = orderRevenueUzs({ items });

      return {
        id: o.id,
        client: o.client_name,
        items: items.map(item => ({
          title: item.title || "Parfyum",
          quantity: item.quantity,
          price: item.price_at_purchase
        })),
        amount: totalAmount,
        status: o.status,
        date: new Date(o.created_at).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }),
      };
    });

    return {
      fin,
      expectedSalesUzs,
      expectedProfitUzs: expectedSalesUzs - fin.warehouseUzs,
      totalOrdersCount: orders.length,
      pendingOrdersCount: pendingOrders.length,
      totalSoldItems: countItems(deliveredOrders),
      totalPendingItems: countItems(pendingOrders),
      recentOrders,
    };
  }, [products, orders, transactions]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fin = stats.fin;
  const inStock = products.filter(p => (p.stock || 0) > 0);

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">
          <span className="text-gradient-gold">Analitika</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Biznesingizning umumiy ko&apos;rsatkichlari — ombor, sotuvlar va moliya
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 h-32 animate-pulse bg-secondary/20" />
          ))}
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 1: ASOSIY KO'RSATKICHLAR                          */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Tikilgan pul" hint="biznesga kiritilgan sarmoya" value={`${fmt(fin.capitalUzs)} so'm`} tone="text-purple-400" />
            <StatCard label="Jami Savdo" hint="yetkazilgan buyurtmalardan" value={`${fmt(fin.salesUzs)} so'm`} tone="text-blue-400" />
            <StatCard label="Jami Rasxod" hint="tovar xaridi + operatsion" value={`${fmt(fin.expensesUzs)} so'm`} tone="text-red-400" />
            <StatCard label="Kassa" hint="qo'lda va kartada bo'lishi kerak" value={`${fmt(fin.cashUzs)} so'm`} tone={fin.cashUzs >= 0 ? "text-gradient-gold" : "text-red-400"} />
            <StatCard label="Ombor" hint={`${fin.warehouseItems} dona, tan narxda`} value={`${fmt(fin.warehouseUzs)} so'm`} tone="text-orange-400" />
            <StatCard label="Jami boylik" hint="kassa + ombor" value={`${fmt(fin.totalWorthUzs)} so'm`} tone="text-gradient-gold" highlight />
            <StatCard label="Sof Foyda" hint="savdo − tan narx − operatsion" value={`${fmt(fin.netProfitUzs)} so'm`} tone={fin.netProfitUzs >= 0 ? "text-green-400" : "text-red-400"} highlight />
            <StatCard label="Sotilgan atirlar" hint={`${stats.totalOrdersCount} ta buyurtma, ${stats.totalPendingItems} ta kutilmoqda`} value={`${stats.totalSoldItems} ta`} tone="text-gradient-gold" />
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 2: SOF FOYDA TARKIBI (Breakdown)                  */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Foyda Tarkibi */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-secondary">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">💰 Sof Foyda Tarkibi</h3>
                <span className={`text-xl font-bold ${fin.netProfitUzs >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(fin.netProfitUzs)} so&apos;m</span>
              </div>
              <div className="space-y-3">
                <Line label="Jami Savdo (tushum)" value={`+${fmt(fin.salesUzs)} so'm`} tone="text-blue-400" />
                <Line label="Sotilgan atirlarning tan narxi" value={`−${fmt(fin.cogsUzs)} so'm`} tone="text-orange-400" />
                <Line label="Operatsion rasxod (reklama, ChatGPT...)" value={`−${fmt(fin.operatingExpensesUzs)} so'm`} tone="text-red-400" />
                <Line label="= Sof Foyda" value={`${fmt(fin.netProfitUzs)} so'm`} tone={fin.netProfitUzs >= 0 ? 'text-green-400' : 'text-red-400'} total />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                * Tovar xaridi Sof Foydadan darhol ayirilmaydi — atir sotilganda uning tan narxi ayiriladi, qolgani omborda aktiv bo&apos;lib turadi. Tikilgan pul foyda emas.
              </p>
            </div>

            {/* Kassa hisobi */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-secondary">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">🏦 Kassa hisobi</h3>
                <span className={`text-xl font-bold ${fin.cashUzs >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>{fmt(fin.cashUzs)} so&apos;m</span>
              </div>
              <div className="space-y-3">
                <Line label="Tikilgan pul (sarmoya)" value={`+${fmt(fin.capitalUzs)} so'm`} tone="text-purple-400" />
                <Line label="Savdodan tushgan" value={`+${fmt(fin.salesUzs)} so'm`} tone="text-green-400" />
                <Line label="Tovar xaridi" value={`−${fmt(fin.inventoryPurchasesUzs)} so'm`} tone="text-orange-400" />
                <Line label="Operatsion rasxod" value={`−${fmt(fin.operatingExpensesUzs)} so'm`} tone="text-red-400" />
                <Line label="= Kassada bo'lishi kerak" value={`${fmt(fin.cashUzs)} so'm`} tone={fin.cashUzs >= 0 ? 'text-green-400' : 'text-red-400'} total />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                * Egalar pul olmagan bo&apos;lsa, qo&apos;ldagi va kartadagi pul shu summaga teng bo&apos;lishi kerak. Farq bo&apos;lsa — hisobga kiritilmagan xarajat yoki kirim bor.
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* BALANS VA SVERKA                                        */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-gold/20">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">⚖️ Balans va sverka</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Line label="Kassa" value={`${fmt(fin.cashUzs)} so'm`} tone="text-foreground" />
                <Line label="+ Ombordagi tovar (tan narxda)" value={`${fmt(fin.warehouseUzs)} so'm`} tone="text-orange-400" />
                <Line label="= Jami boylik" value={`${fmt(fin.totalWorthUzs)} so'm`} tone="text-gradient-gold" total />
                <Line label="− Tikilgan pul" value={`${fmt(fin.capitalUzs)} so'm`} tone="text-purple-400" />
                <Line label="= Haqiqiy foyda (boylik o'sishi)" value={`${fmt(fin.realProfitUzs)} so'm`} tone={fin.realProfitUzs >= 0 ? 'text-green-400' : 'text-red-400'} total />
              </div>
              <div className="space-y-3">
                <Line label="Hisob bo'yicha omborda bo'lishi kerak" value={`${fmt(fin.expectedWarehouseUzs)} so'm`} tone="text-foreground" />
                <Line label="Omborda haqiqatda (tan narxda)" value={`${fmt(fin.warehouseUzs)} so'm`} tone="text-orange-400" />
                <Line label="= Farq" value={`${fmt(fin.warehouseGapUzs)} so'm`} tone={Math.abs(fin.warehouseGapUzs) < 1 ? 'text-green-400' : 'text-yellow-400'} total />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  * Hisob bo&apos;yicha ombor = tovar xaridi − sotilgan atirlarning tan narxi. Farq bo&apos;lsa: kargo/yo&apos;l haqi atir tan narxiga qo&apos;shilmagan, tester yoki sovg&apos;a berilgan, yoki mahsulotda tan narx noto&apos;g&apos;ri kiritilgan. Haqiqiy foyda bilan Sof Foyda o&apos;rtasidagi farq ham aynan shu.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SOTUVLAR OQIMI (savdoga nisbatan ulushlar)              */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sotuvlar oqimi</h3>
            <div className="space-y-3">
              <Bar label="Jami Savdo (tushum)" value={fin.salesUzs} base={fin.salesUzs} fmt={fmt} color="from-blue-500 to-blue-400" tone="text-blue-400" />
              <Bar label="Sotilganlar tan narxi" value={fin.cogsUzs} base={fin.salesUzs} fmt={fmt} color="from-orange-500 to-amber-400" tone="text-orange-400" />
              <Bar label="Operatsion rasxod" value={fin.operatingExpensesUzs} base={fin.salesUzs} fmt={fmt} color="from-red-600 to-red-400" tone="text-red-400" />
              <Bar label="Sof Foyda" value={fin.netProfitUzs} base={fin.salesUzs} fmt={fmt} color={fin.netProfitUzs >= 0 ? "from-green-600 to-emerald-400" : "from-red-600 to-red-400"} tone={fin.netProfitUzs >= 0 ? "text-green-400" : "text-red-400"} />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* KUTILAYOTGAN (ombordagi hamma atir sotilsa)             */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl p-6 space-y-3 bg-secondary/5 border border-secondary">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">📊 Ombordagi hamma atir sotilsa</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gold">{fmt(stats.expectedSalesUzs)} so&apos;m</p>
                <p className="text-[10px] text-muted-foreground uppercase">Tushadigan pul (sayt narxida)</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-400">{fmt(fin.warehouseUzs)} so&apos;m</p>
                <p className="text-[10px] text-muted-foreground uppercase">Ombor tan narxi</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${stats.expectedProfitUzs >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(stats.expectedProfitUzs)} so&apos;m</p>
                <p className="text-[10px] text-muted-foreground uppercase">Kutilayotgan foyda</p>
              </div>
            </div>
          </div>
          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 4.5: TOVARLAR JADVALI (Batafsil Hisob-kitob)         */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-gold"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-2.625c0-.621.504-1.125 1.125-1.125" /></svg>
              Ombordagi atirlar (so'mda)
            </h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-secondary/20">
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">№</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nomi</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Sotish narxi (saytda)</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Qoldiq</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Tan narxi</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Sotilgandagi</th>
                      <th className="px-4 py-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right font-semibold">Kutilayotgan foyda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">
                          Omborda atir qolmagan
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
                                {product.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground text-right font-medium">{fmt(price)} so&apos;m</td>
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
                        {/* JAMI ROW */}
                        <tr className="bg-secondary/40 border-t-2 border-gold/30">
                          <td className="px-4 py-4 text-sm font-bold text-foreground" colSpan={2}>JAMI</td>
                          <td className="px-4 py-4 text-sm text-foreground text-right font-bold">—</td>
                          <td className="px-4 py-4 text-sm text-blue-400 text-right font-bold">{fin.warehouseItems} ta</td>
                          <td className="px-4 py-4 text-sm text-red-400 text-right font-bold">{fmt(fin.warehouseUzs)} so&apos;m</td>
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

          {/* ═══════════════════════════════════════════════════════ */}
          {/* ROW 5: SO'NGGI BUYURTMALAR                            */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/10">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Buyurtmalar ro&apos;yxati ({stats.recentOrders.length} ta)</h3>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-border/50">
              {stats.recentOrders.map((order) => {
                const status = statusLabels[order.status] || statusLabels.pending;
                return (
                  <div key={order.id} className="p-4 space-y-2 bg-[#0d0d0d]/40">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{order.client}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{order.date}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.text}</span>
                    </div>
                    <div className="space-y-1 bg-secondary/40 p-2.5 rounded-xl border border-border/50">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[200px]">{item.title}</span>
                          <span className="text-foreground font-semibold">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="text-muted-foreground font-medium">Jami summa:</span>
                      <span className="text-gold font-bold">{fmt(order.amount)} so'm</span>
                    </div>
                  </div>
                );
              })}
              {stats.recentOrders.length === 0 && (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm uppercase tracking-wider">
                  So&apos;nggi buyurtmalar topilmadi
                </div>
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mijoz</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mahsulotlar</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Summa</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status</th>
                    <th className="text-left px-6 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => {
                    const status = statusLabels[order.status] || statusLabels.pending;
                    return (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-3 text-sm text-foreground font-semibold whitespace-nowrap">{order.client}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">x{item.quantity}</span>
                                <span className="text-xs truncate max-w-[200px]" title={item.title}>{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gold font-semibold whitespace-nowrap">{fmt(order.amount)} so'm</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.text}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{order.date}</td>
                      </tr>
                    );
                  })}
                  {stats.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm uppercase tracking-wider">
                        So&apos;nggi buyurtmalar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, hint, value, tone, highlight }: { label: string; hint: string; value: string; tone: string; highlight?: boolean }) {
  return (
    <div className={`glass-card rounded-xl p-4 text-center space-y-1 ${highlight ? "border border-gold/20" : ""}`}>
      <p className={`text-lg sm:text-xl lg:text-2xl font-bold break-words ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Line({ label, value, tone, total }: { label: string; value: string; tone: string; total?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${total ? "border-t border-border/50 pt-2 font-bold" : ""}`}>
      <span className={total ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`${tone} font-semibold whitespace-nowrap`}>{value}</span>
    </div>
  );
}

function Bar({ label, value, base, fmt, color, tone }: { label: string; value: number; base: number; fmt: (n: number) => string; color: string; tone: string }) {
  const pct = base > 0 ? Math.min(100, (Math.abs(value) / base) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`${tone} font-semibold`}>{fmt(value)} so&apos;m</span>
      </div>
      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
