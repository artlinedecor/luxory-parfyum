"use client";

import { useState, useEffect, useMemo } from "react";
import { dashLoad } from "@/lib/dashboard-api";
import { Order, Product, Transaction } from "@/lib/types";
import {
  orderRevenueUzs, usdToUzs, txAmountUzs, summarizeFinances, segmentOf,
  EXPENSE_SEGMENTS, EXPENSE_SEGMENT_LABELS, USD_TO_UZS, type ExpenseSegment,
} from "@/lib/accounting";
import UsdRateEditor from "@/components/UsdRateEditor";
import { priceOfProductUzs } from "@/lib/pricing-server";

// Uzilmas probel bilan — summa satr oxirida bo'linib ketmasin, har qanday brauzerda bir xil.
const NBSP = " ";
const group = (n: number) => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
const fmt = (n: number) => (Math.round(n) < 0 ? "−" : "") + group(n);
const som = (n: number) => `${fmt(n)}${NBSP}so'm`;
const usd = (n: number) => {
  const r = Math.round(Math.abs(n) * 100) / 100;
  return (n < 0 ? "−$" : "$") + (Number.isInteger(r) ? group(r) : r.toFixed(2));
};
const day = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });

const SEGMENT_TONE: Record<ExpenseSegment, string> = {
  inventory: "bg-orange-400",
  ads: "bg-red-400",
  cargo: "bg-rose-300",
  services: "bg-pink-400",
  deposit: "bg-cyan-400",
  other: "bg-zinc-400",
};

const SEGMENT_NOTE: Partial<Record<ExpenseSegment, string>> = {
  inventory: "omborga — pul atirga aylangan",
  deposit: "qaytadi",
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usdRate, setUsdRate] = useState(USD_TO_UZS);

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
        setUsdRate(d.usdRate || USD_TO_UZS);
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
    const fin = summarizeFinances({ transactions, deliveredOrders, products, rate: usdRate });

    // Har bir buyurtmaning kassaga haqiqatda yozilgan kirimi — "Jami savdo" shu
    // yozuvlar yig'indisi, shuning uchun ro'yxat bilan jami doim mos keladi.
    const incomeByOrder = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "income") continue;
      const m = /#([0-9a-f]{8})/i.exec(t.description || "");
      if (m) incomeByOrder.set(m[1], (incomeByOrder.get(m[1]) ?? 0) + (Number(t.amount) || 0));
    }

    const sales = [...deliveredOrders]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(o => {
        const items = o.items ?? [];
        const usdTotal = items.reduce((s, i) => s + (Number(i.price_at_purchase) || 0) * (Number(i.quantity) || 0), 0);
        return {
          id: o.id,
          date: day(o.created_at),
          client: o.client_name,
          titles: [...new Set(items.map(i => (i.title || "Atir").trim()))].join(", "),
          qty: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
          usdTotal,
          uzs: incomeByOrder.get(o.id.slice(0, 8)) ?? orderRevenueUzs(o, usdRate),
        };
      });

    const expenses = transactions
      .filter(t => t.type === "expense")
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(t => ({
        id: t.id,
        date: day(t.created_at),
        what: (t.description || "").trim(),
        segment: segmentOf(t.expense_category),
        usd: Number(t.amount) || 0,
        uzs: txAmountUzs(t),
      }));

    const notDelivered = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");

    // Omborni sotsak qancha tushadi — saytdagi haqiqiy narx bilan (pricing-server
    // bilan bir xil formula), price_usd bilan emas.
    let expectedSalesUzs = 0;
    for (const p of products) {
      const stock = p.stock || 0;
      if (stock > 0) expectedSalesUzs += stock * priceOfProductUzs(p);
    }

    return {
      fin,
      sales,
      expenses,
      soldItems: sales.reduce((s, o) => s + o.qty, 0),
      notDelivered,
      expectedSalesUzs,
      expectedProfitUzs: expectedSalesUzs - fin.warehouseUzs,
    };
  }, [products, orders, transactions, usdRate]);

  const fin = stats.fin;
  const inStock = products.filter(p => (p.stock || 0) > 0);
  const profitGap = fin.netProfitUzs - fin.realProfitUzs;

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Moliyaviy hisobot</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Qancha pul tikildi, qancha sotildi, qancha rasxod qilindi va hozir qancha pul bo&apos;lishi kerak
          </p>
        </div>
        {!loading && <UsdRateEditor rate={usdRate} onChange={setUsdRate} />}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl h-64 animate-pulse bg-secondary/20" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl h-56 animate-pulse bg-secondary/20" />
            <div className="glass-card rounded-2xl h-56 animate-pulse bg-secondary/20" />
          </div>
        </div>
      ) : (
        <>
          {/* ═══ 1. ASOSIY HISOB ═══ */}
          <section className="glass-card rounded-2xl p-5 sm:p-7 border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
            <div className="space-y-1">
              <Row label="Tikilgan pul" sub="biznesga kiritilgan sarmoya" value={som(fin.capitalUzs)} tone="text-purple-400" />
              <Row
                label="Savdodan tushgan pul"
                sub={`${stats.sales.length} ta yetkazilgan buyurtma, ${stats.soldItems} ta atir`}
                value={`+ ${som(fin.salesUzs)}`}
                tone="text-green-400"
              />
              <Row
                label="Rasxodlar"
                sub={`jami ${usd(fin.expensesUsd)} — tarkibi pastda`}
                value={`− ${som(fin.expensesUzs)}`}
                tone="text-red-400"
              />
            </div>
            <div className="mt-4 pt-4 border-t-2 border-foreground/80 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <p className="text-base sm:text-lg font-bold text-foreground">Qo&apos;lda va kartada bo&apos;lishi kerak</p>
                <p className="text-xs text-muted-foreground mt-0.5">Hech kim pul olmagan bo&apos;lsa, shuncha pul turishi kerak. Farq chiqsa — kiritilmagan rasxod yoki kirim bor.</p>
              </div>
              <p className={`text-3xl sm:text-4xl font-bold tabular-nums whitespace-nowrap ${fin.cashUzs >= 0 ? "text-gradient-gold" : "text-red-400"}`}>
                {som(fin.cashUzs)}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ═══ 2. JAMI BOYLIK ═══ */}
            <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
              <SectionTitle title="Jami boylik" hint="pul + atirlar + qaytadigan pul" />
              <div className="space-y-2.5">
                <Line label="Pul (qo'lda va kartada)" value={som(fin.cashUzs)} />
                <Line label={`Ombordagi atirlar (${fin.warehouseItems} dona, sotib olingan narxda)`} value={som(fin.warehouseUzs)} tone="text-orange-400" />
                {fin.depositsUzs > 0 && <Line label="Uzum'dagi depozit (qaytadi)" value={som(fin.depositsUzs)} tone="text-cyan-400" />}
                <Line label="Jami boylik" value={som(fin.totalWorthUzs)} tone="text-gradient-gold" total />
                <Line label="Tikilgan pul" value={`− ${som(fin.capitalUzs)}`} tone="text-purple-400" />
                <Line label="Boylik o'sishi (haqiqiy foyda)" value={som(fin.realProfitUzs)} tone={fin.realProfitUzs >= 0 ? "text-green-400" : "text-red-400"} total />
              </div>
              {fin.capitalUzs > 0 && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tikilgan pul <b className="text-foreground">{fin.worthMultiple.toFixed(1)} barobar</b>{" "}ko&apos;paydi.
                </p>
              )}
            </section>

            {/* ═══ 3. RASXOD NIMAGA KETDI ═══ */}
            <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
              <SectionTitle title="Rasxod nimaga ketdi" hint={`jami ${usd(fin.expensesUsd)} = ${som(fin.expensesUzs)}`} />
              <div className="space-y-3">
                {EXPENSE_SEGMENTS.filter(seg => fin.expenseSegmentsUzs[seg] !== 0).map(seg => {
                  const v = fin.expenseSegmentsUzs[seg];
                  const pct = fin.expensesUzs > 0 ? Math.max(0, (v / fin.expensesUzs) * 100) : 0;
                  return (
                    <div key={seg} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-foreground">
                          {EXPENSE_SEGMENT_LABELS[seg]}
                          {SEGMENT_NOTE[seg] && <span className="text-[11px] text-muted-foreground"> · {SEGMENT_NOTE[seg]}</span>}
                        </span>
                        <span className="font-semibold tabular-nums whitespace-nowrap">{som(v)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${SEGMENT_TONE[seg]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ═══ 4. FOYDA ═══ */}
          <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            <SectionTitle title="Savdodan qancha foyda qoldi" hint="har bir sotilgan atir bo'yicha" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Line label="Savdodan tushgan" value={som(fin.salesUzs)} tone="text-green-400" />
                <Line label="Sotilgan atirlarning sotib olingan narxi" value={`− ${som(fin.cogsUzs)}`} tone="text-orange-400" />
                <Line label="Reklama, kargo, xizmatlar" value={`− ${som(fin.operatingExpensesUzs)}`} tone="text-red-400" />
                <Line label="Sof foyda" value={som(fin.netProfitUzs)} tone={fin.netProfitUzs >= 0 ? "text-green-400" : "text-red-400"} total />
              </div>
              <div className="rounded-xl bg-secondary/30 border border-border/50 p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  <b className="text-foreground">Nega ikki xil foyda?</b> Sof foyda ({som(fin.netProfitUzs)}) sotilgan atirlardan hisoblanadi,
                  boylik o&apos;sishi ({som(fin.realProfitUzs)}) esa hozir qo&apos;limizda nima borligidan.
                </p>
                {Math.abs(profitGap) >= 1 && (
                  <p>
                    Farq <b className="text-yellow-400">{som(profitGap)}</b> — ombor hisobi to&apos;liq emas: hisob bo&apos;yicha {som(fin.expectedWarehouseUzs)} lik
                    atir qolishi kerak, omborda {som(fin.warehouseUzs)} lik bor. Sabab: ba&apos;zi atirlar sotilgani yozilmagan yoki
                    sotilgan atirning sotib olingan narxi kiritilmagan. Omborni sanab chiqsa aniq bo&apos;ladi.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ═══ 5. SOTUVLAR ═══ */}
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-border bg-secondary/10">
              <SectionTitle title={`Sotuvlar — ${stats.sales.length} ta buyurtma`} hint={`dollar narx × ${fmt(usdRate)} kurs · Uzum — so'mda, komissiyasiz`} />
            </div>
            <div className="divide-y divide-border/50">
              {stats.sales.map((s, i) => (
                <div key={s.id} className="px-5 sm:px-6 py-3 flex items-start gap-3">
                  <span className="w-6 shrink-0 text-xs text-muted-foreground tabular-nums pt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {s.client}
                      <span className="text-muted-foreground font-normal"> · {s.date}</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate" title={s.titles}>
                      {s.qty > 1 ? `${s.qty} ta: ` : ""}{s.titles}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-green-400 tabular-nums whitespace-nowrap">{som(s.uzs)}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{s.usdTotal > 0 ? usd(s.usdTotal) : "Uzum"}</p>
                  </div>
                </div>
              ))}
              {stats.sales.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">Hali yetkazilgan buyurtma yo&apos;q</p>
              )}
            </div>
            <TotalRow label={`Jami · ${stats.soldItems} ta atir`} value={som(fin.salesUzs)} tone="text-green-400" />
            {stats.notDelivered.length > 0 && (
              <p className="px-5 sm:px-6 py-3 text-xs text-muted-foreground border-t border-border/50">
                Hisobga kirmagan: hali yetkazilmagan {stats.notDelivered.length} ta buyurtma. Pul faqat &quot;Yetkazildi&quot; bo&apos;lganda kirim bo&apos;ladi.
              </p>
            )}
          </section>

          {/* ═══ 6. RASXODLAR ═══ */}
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-border bg-secondary/10">
              <SectionTitle title={`Rasxodlar — ${stats.expenses.length} ta yozuv`} hint="dollarda kiritiladi, har biri o'z kunidagi kurs bilan" />
            </div>
            <div className="divide-y divide-border/50">
              {stats.expenses.map(e => (
                <div key={e.id} className="px-5 sm:px-6 py-3 flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEGMENT_TONE[e.segment]}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate" title={e.what}>{e.what || "—"}</p>
                    <p className="text-xs text-muted-foreground">{e.date} · {EXPENSE_SEGMENT_LABELS[e.segment]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-red-400 tabular-nums whitespace-nowrap">{som(e.uzs)}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{usd(e.usd)}</p>
                  </div>
                </div>
              ))}
              {stats.expenses.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">Rasxod kiritilmagan</p>
              )}
            </div>
            <TotalRow label={`Jami · ${usd(fin.expensesUsd)}`} value={som(fin.expensesUzs)} tone="text-red-400" />
          </section>

          {/* ═══ 7. OMBOR ═══ */}
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-border bg-secondary/10">
              <SectionTitle
                title={`Ombordagi atirlar — ${fin.warehouseItems} dona`}
                hint={`hammasi sotilsa ${som(stats.expectedSalesUzs)} tushadi, foyda ${som(stats.expectedProfitUzs)}`}
              />
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nomi</th>
                    <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Qoldiq</th>
                    <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Sotib olingan</th>
                    <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Saytdagi narx</th>
                    <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium text-right">Foyda</th>
                  </tr>
                </thead>
                <tbody>
                  {inStock.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">Omborda atir qolmagan</td>
                    </tr>
                  ) : (
                    <>
                      {inStock.map(product => {
                        const stock = product.stock || 0;
                        const price = priceOfProductUzs(product);
                        const costPrice = usdToUzs((product as { cost_price_usd?: number }).cost_price_usd || 0, usdRate);
                        const profit = stock * (price - costPrice);
                        return (
                          <tr key={product.id} className="border-b border-border/50">
                            <td className="px-4 py-3 text-sm text-foreground max-w-[220px] truncate" title={product.title}>{product.title}</td>
                            <td className="px-4 py-3 text-sm text-right tabular-nums">{stock}</td>
                            <td className="px-4 py-3 text-sm text-right tabular-nums whitespace-nowrap text-orange-400">{som(stock * costPrice)}</td>
                            <td className="px-4 py-3 text-sm text-right tabular-nums whitespace-nowrap">{som(stock * price)}</td>
                            <td className={`px-4 py-3 text-sm text-right tabular-nums whitespace-nowrap font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>{som(profit)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-secondary/40 border-t-2 border-gold/30 font-bold">
                        <td className="px-4 py-3.5 text-sm">Jami</td>
                        <td className="px-4 py-3.5 text-sm text-right tabular-nums">{fin.warehouseItems}</td>
                        <td className="px-4 py-3.5 text-sm text-right tabular-nums whitespace-nowrap text-orange-400">{som(fin.warehouseUzs)}</td>
                        <td className="px-4 py-3.5 text-sm text-right tabular-nums whitespace-nowrap">{som(stats.expectedSalesUzs)}</td>
                        <td className="px-4 py-3.5 text-sm text-right tabular-nums whitespace-nowrap text-green-400">{som(stats.expectedProfitUzs)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Row({ label, sub, value, tone }: { label: string; sub: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm sm:text-base text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <p className={`text-lg sm:text-xl font-bold tabular-nums whitespace-nowrap ${tone}`}>{value}</p>
    </div>
  );
}

function Line({ label, value, tone = "text-foreground", total }: { label: string; value: string; tone?: string; total?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${total ? "border-t border-border/60 pt-2.5 font-bold" : ""}`}>
      <span className={total ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`${tone} font-semibold tabular-nums whitespace-nowrap`}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 bg-secondary/40 border-t-2 border-gold/30">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className={`text-base font-bold tabular-nums whitespace-nowrap ${tone}`}>{value}</span>
    </div>
  );
}
