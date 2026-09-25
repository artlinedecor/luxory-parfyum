"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { dashLoad } from "@/lib/dashboard-api";
import { Order, Product, Transaction } from "@/lib/types";
import {
  orderRevenueUzs, usdToUzs, txAmountUzs, summarizeFinances, segmentOf,
  EXPENSE_SEGMENTS, EXPENSE_SEGMENT_LABELS, USD_TO_UZS, type ExpenseSegment,
} from "@/lib/accounting";
import UsdRateEditor from "@/components/UsdRateEditor";
import AddExpenseButton from "@/components/AddExpenseButton";
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

const STATUS_TEXT: Record<string, string> = {
  pending: "Kutilmoqda",
  processing: "Tasdiqlangan",
  accepted: "Qabul qilindi",
};

type Detail = "cash" | "capital" | "sales" | "expenses" | "warehouse" | "profit" | "worth" | "deposit" | "pending";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usdRate, setUsdRate] = useState(USD_TO_UZS);
  const [open, setOpen] = useState<Detail | null>(null);

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

    // Har bir buyurtmaning kassaga haqiqatda yozilgan kirimi — "Savdo" shu
    // yozuvlar yig'indisi, shuning uchun ro'yxat bilan jami doim mos keladi.
    const incomeByOrder = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "income") continue;
      const m = /#([0-9a-f]{8})/i.exec(t.description || "");
      if (m) incomeByOrder.set(m[1], (incomeByOrder.get(m[1]) ?? 0) + (Number(t.amount) || 0));
    }

    const describe = (o: Order) => {
      const items = o.items ?? [];
      return {
        id: o.id,
        date: day(o.created_at),
        client: o.client_name,
        titles: [...new Set(items.map(i => (i.title || "Atir").trim()))].join(", "),
        qty: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
        usdTotal: items.reduce((s, i) => s + (Number(i.price_at_purchase) || 0) * (Number(i.quantity) || 0), 0),
      };
    };

    const byDateDesc = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at);

    const sales = [...deliveredOrders].sort(byDateDesc).map(o => ({
      ...describe(o),
      uzs: incomeByOrder.get(o.id.slice(0, 8)) ?? orderRevenueUzs(o, usdRate),
    }));

    const pending = orders
      .filter(o => o.status !== "delivered" && o.status !== "cancelled")
      .sort(byDateDesc)
      .map(o => ({
        ...describe(o),
        status: STATUS_TEXT[o.status] ?? o.status,
        uzs: Number(o.total_amount) > 0 ? Number(o.total_amount) : orderRevenueUzs(o, usdRate),
      }));

    const expenses = transactions
      .filter(t => t.type === "expense")
      .sort(byDateDesc)
      .map(t => ({
        id: t.id,
        date: day(t.created_at),
        what: (t.description || "").trim(),
        segment: segmentOf(t.expense_category),
        usd: Number(t.amount) || 0,
        uzs: txAmountUzs(t),
      }));

    const capital = transactions
      .filter(t => t.type === "capital")
      .sort(byDateDesc)
      .map(t => ({ id: t.id, date: day(t.created_at), what: (t.description || "").trim(), uzs: Number(t.amount) || 0 }));

    // Omborni sotsak qancha tushadi — saytdagi haqiqiy narx bilan (pricing-server
    // bilan bir xil formula), price_usd bilan emas.
    const warehouse = products
      .filter(p => (p.stock || 0) > 0)
      .map(p => {
        const stock = p.stock || 0;
        const cost = usdToUzs((p as { cost_price_usd?: number }).cost_price_usd || 0, usdRate);
        const price = priceOfProductUzs(p);
        return { id: p.id, title: p.title, stock, costTotal: stock * cost, saleTotal: stock * price, noCost: cost <= 0 };
      })
      .sort((a, b) => b.costTotal - a.costTotal);
    const expectedSalesUzs = warehouse.reduce((s, w) => s + w.saleTotal, 0);

    return {
      fin,
      sales,
      pending,
      pendingUzs: pending.reduce((s, o) => s + o.uzs, 0),
      expenses,
      capital,
      warehouse,
      soldItems: sales.reduce((s, o) => s + o.qty, 0),
      expectedSalesUzs,
    };
  }, [products, orders, transactions, usdRate]);

  const fin = stats.fin;
  const addExpense = (tx: Transaction) => setTransactions(prev => [tx, ...prev]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Moliyaviy hisobot</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kartani bosing — asosi bittalab ochiladi</p>
        </div>
        {!loading && (
          <div className="flex flex-wrap items-center gap-2">
            <UsdRateEditor rate={usdRate} onChange={setUsdRate} />
            <AddExpenseButton rate={usdRate} onSaved={addExpense} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl h-44 animate-pulse bg-secondary/20" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="glass-card rounded-xl h-24 animate-pulse bg-secondary/20" />)}
          </div>
        </div>
      ) : (
        <>
          {/* ═══ HOZIR TURGAN PUL — faqat pul, ombor kirmaydi ═══ */}
          <button
            type="button"
            onClick={() => setOpen("cash")}
            className="w-full text-left glass-card rounded-2xl p-5 sm:p-7 border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent hover:border-gold/70 active:scale-[0.995] transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hozir turgan pul</p>
              <Chevron />
            </div>
            <p className={`mt-1 text-4xl sm:text-5xl font-bold tabular-nums whitespace-nowrap ${fin.cashUzs >= 0 ? "text-gradient-gold" : "text-red-400"}`}>
              {som(fin.cashUzs)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">qo&apos;lda va kartada · ombordagi atirlar bunga kirmaydi</p>
          </button>

          {/* ═══ KO'RSATKICHLAR — har biri alohida, bosilsa asosi ochiladi ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile onClick={() => setOpen("sales")} label="Savdo" value={som(fin.salesUzs)} sub={`${stats.sales.length} ta buyurtma · ${stats.soldItems} ta atir`} tone="text-green-400" />
            <Tile onClick={() => setOpen("expenses")} label="Rasxod" value={som(fin.expensesUzs)} sub={`${usd(fin.expensesUsd)} · ${stats.expenses.length} ta yozuv`} tone="text-red-400" />
            <Tile onClick={() => setOpen("warehouse")} label="Ombor" value={som(fin.warehouseUzs)} sub={`${fin.warehouseItems} dona · sotib olingan narxda`} tone="text-orange-400" />
            <Tile onClick={() => setOpen("profit")} label="Sof foyda" value={som(fin.netProfitUzs)} sub="savdo − atir narxi − reklama, kargo" tone={fin.netProfitUzs >= 0 ? "text-green-400" : "text-red-400"} />
            <Tile onClick={() => setOpen("capital")} label="Tikilgan pul" value={som(fin.capitalUzs)} sub="sarmoya · savdoga kirmaydi" tone="text-purple-400" />
            <Tile
              onClick={() => setOpen("worth")}
              label="Jami boylik"
              value={som(fin.totalWorthUzs)}
              sub={fin.capitalUzs > 0 ? `pul + ombor + depozit · ${fin.worthMultiple.toFixed(1)}×` : "pul + ombor + depozit"}
              tone="text-gradient-gold"
            />
            <Tile onClick={() => setOpen("deposit")} label="Qaytadigan pul" value={som(fin.depositsUzs)} sub="Uzum depoziti" tone="text-cyan-400" />
            <Tile onClick={() => setOpen("pending")} label="Kutilayotgan buyurtma" value={som(stats.pendingUzs)} sub={`${stats.pending.length} ta · hali kirim emas`} tone="text-blue-400" />
          </div>
        </>
      )}

      {/* ═══ OCHILADIGAN OYNALAR ═══ */}
      {open === "cash" && (
        <Sheet title="Hozir turgan pul" total={som(fin.cashUzs)} onClose={() => setOpen(null)}>
          <Lines>
            <Line label="Tikilgan pul" value={som(fin.capitalUzs)} tone="text-purple-400" />
            <Line label="+ Savdodan tushgan" value={som(fin.salesUzs)} tone="text-green-400" />
            {EXPENSE_SEGMENTS.filter(seg => fin.expenseSegmentsUzs[seg] !== 0).map(seg => (
              <Line key={seg} label={`− ${EXPENSE_SEGMENT_LABELS[seg]}`} value={som(fin.expenseSegmentsUzs[seg])} tone="text-red-400" />
            ))}
            <Line label="= Hozir turgan pul" value={som(fin.cashUzs)} tone="text-gradient-gold" total />
          </Lines>
          <Note>Hech kim pul olmagan bo&apos;lsa, qo&apos;lda va kartada shuncha pul turishi kerak. Farq chiqsa — kiritilmagan rasxod yoki kirim bor.</Note>
        </Sheet>
      )}

      {open === "sales" && (
        <Sheet
          title={`Savdo — ${stats.sales.length} ta buyurtma`}
          total={som(fin.salesUzs)}
          hint={`dollar narx × ${fmt(usdRate)} kurs · Uzum — so'mda, komissiyasiz`}
          onClose={() => setOpen(null)}
        >
          <List empty="Hali yetkazilgan buyurtma yo'q">
            {stats.sales.map(s => (
              <Item
                key={s.id}
                title={s.client}
                meta={`${s.date} · ${s.qty > 1 ? `${s.qty} ta: ` : ""}${s.titles}`}
                value={som(s.uzs)}
                sub={s.usdTotal > 0 ? usd(s.usdTotal) : "Uzum"}
                tone="text-green-400"
              />
            ))}
          </List>
        </Sheet>
      )}

      {open === "expenses" && (
        <Sheet title={`Rasxod — ${stats.expenses.length} ta yozuv`} total={som(fin.expensesUzs)} hint={`jami ${usd(fin.expensesUsd)} · har biri o'z kunidagi kurs bilan`} onClose={() => setOpen(null)}>
          <div className="space-y-2.5">
            {EXPENSE_SEGMENTS.filter(seg => fin.expenseSegmentsUzs[seg] !== 0).map(seg => {
              const v = fin.expenseSegmentsUzs[seg];
              const pct = fin.expensesUzs > 0 ? Math.max(0, (v / fin.expensesUzs) * 100) : 0;
              return (
                <div key={seg} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-foreground">{EXPENSE_SEGMENT_LABELS[seg]}</span>
                    <span className="font-semibold tabular-nums whitespace-nowrap">{som(v)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${SEGMENT_TONE[seg]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end"><AddExpenseButton rate={usdRate} onSaved={addExpense} /></div>
          <List empty="Rasxod kiritilmagan">
            {stats.expenses.map(e => (
              <Item
                key={e.id}
                dot={SEGMENT_TONE[e.segment]}
                title={e.what || "—"}
                meta={`${e.date} · ${EXPENSE_SEGMENT_LABELS[e.segment]}`}
                value={som(e.uzs)}
                sub={usd(e.usd)}
                tone="text-red-400"
              />
            ))}
          </List>
        </Sheet>
      )}

      {open === "warehouse" && (
        <Sheet
          title={`Ombor — ${fin.warehouseItems} dona`}
          total={som(fin.warehouseUzs)}
          hint={`hammasi sotilsa ${som(stats.expectedSalesUzs)} tushadi, foyda ${som(stats.expectedSalesUzs - fin.warehouseUzs)}`}
          onClose={() => setOpen(null)}
        >
          <List empty="Omborda atir qolmagan">
            {stats.warehouse.map(w => (
              <Item
                key={w.id}
                title={w.title}
                meta={`${w.stock} dona · saytda ${som(w.saleTotal)}`}
                value={w.noCost ? "narx yo'q" : som(w.costTotal)}
                sub="sotib olingan"
                tone={w.noCost ? "text-yellow-400" : "text-orange-400"}
              />
            ))}
          </List>
        </Sheet>
      )}

      {open === "profit" && (
        <Sheet title="Sof foyda" total={som(fin.netProfitUzs)} hint="har bir sotilgan atir bo'yicha" onClose={() => setOpen(null)}>
          <Lines>
            <Line label="Savdodan tushgan" value={som(fin.salesUzs)} tone="text-green-400" />
            <Line label="− Sotilgan atirlarning sotib olingan narxi" value={som(fin.cogsUzs)} tone="text-orange-400" />
            {(["ads", "cargo", "services", "other"] as const).filter(seg => fin.expenseSegmentsUzs[seg] !== 0).map(seg => (
              <Line key={seg} label={`− ${EXPENSE_SEGMENT_LABELS[seg]}`} value={som(fin.expenseSegmentsUzs[seg])} tone="text-red-400" />
            ))}
            <Line label="= Sof foyda" value={som(fin.netProfitUzs)} tone={fin.netProfitUzs >= 0 ? "text-green-400" : "text-red-400"} total />
          </Lines>
          <Note>
            Atir xaridi darhol foydadan ayirilmaydi: atir sotilganda uning narxi ayiriladi, sotilmagani omborda turadi.
            {Math.abs(fin.warehouseGapUzs) >= 1 && (
              <> Hisob bo&apos;yicha omborda {som(fin.expectedWarehouseUzs)} lik atir qolishi kerak, haqiqatda {som(fin.warehouseUzs)} lik bor —
                farq <b className="text-yellow-400">{som(fin.warehouseGapUzs)}</b>. Sabab: ba&apos;zi atirlar sotilgani yozilmagan yoki sotib olingan narxi kiritilmagan.</>
            )}
          </Note>
        </Sheet>
      )}

      {open === "capital" && (
        <Sheet title="Tikilgan pul" total={som(fin.capitalUzs)} hint="biznesga kiritilgan sarmoya — savdo ham, foyda ham emas" onClose={() => setOpen(null)}>
          <List empty="Tikilgan pul kiritilmagan — Kassa sahifasida “Sarmoya” turi bilan qo'shing">
            {stats.capital.map(c => <Item key={c.id} title={c.what || "Sarmoya"} meta={c.date} value={som(c.uzs)} tone="text-purple-400" />)}
          </List>
        </Sheet>
      )}

      {open === "worth" && (
        <Sheet title="Jami boylik" total={som(fin.totalWorthUzs)} onClose={() => setOpen(null)}>
          <Lines>
            <Line label="Hozir turgan pul" value={som(fin.cashUzs)} />
            <Line label={`+ Ombordagi atirlar (${fin.warehouseItems} dona)`} value={som(fin.warehouseUzs)} tone="text-orange-400" />
            <Line label="+ Qaytadigan pul (depozit)" value={som(fin.depositsUzs)} tone="text-cyan-400" />
            <Line label="= Jami boylik" value={som(fin.totalWorthUzs)} tone="text-gradient-gold" total />
            <Line label="− Tikilgan pul" value={som(fin.capitalUzs)} tone="text-purple-400" />
            <Line label="= Boylik o'sishi" value={som(fin.realProfitUzs)} tone={fin.realProfitUzs >= 0 ? "text-green-400" : "text-red-400"} total />
          </Lines>
          {fin.capitalUzs > 0 && <Note>Tikilgan pul <b className="text-foreground">{fin.worthMultiple.toFixed(1)} barobar</b>{" "}ko&apos;paydi.</Note>}
        </Sheet>
      )}

      {open === "deposit" && (
        <Sheet title="Qaytadigan pul" total={som(fin.depositsUzs)} hint="berilgan, lekin qaytib keladigan pul — rasxod emas" onClose={() => setOpen(null)}>
          <List empty="Qaytadigan pul yo'q">
            {stats.expenses.filter(e => e.segment === "deposit").map(e => (
              <Item key={e.id} title={e.what || "Depozit"} meta={e.date} value={som(e.uzs)} sub={usd(e.usd)} tone="text-cyan-400" />
            ))}
          </List>
        </Sheet>
      )}

      {open === "pending" && (
        <Sheet title={`Kutilayotgan buyurtma — ${stats.pending.length} ta`} total={som(stats.pendingUzs)} hint="“Yetkazildi” qilinganda kirim bo'ladi" onClose={() => setOpen(null)}>
          <List empty="Kutilayotgan buyurtma yo'q">
            {stats.pending.map(o => (
              <Item key={o.id} title={o.client} meta={`${o.date} · ${o.status} · ${o.titles}`} value={som(o.uzs)} tone="text-blue-400" />
            ))}
          </List>
        </Sheet>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
}

function Tile({ label, value, sub, tone, onClick }: { label: string; value: string; sub: string; tone: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card rounded-xl p-4 space-y-1 min-w-0 text-left hover:border-gold/40 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
        <Chevron />
      </div>
      <p className={`text-lg sm:text-xl font-bold tabular-nums break-words ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
    </button>
  );
}

function Sheet({ title, total, hint, onClose, children }: { title: string; total: string; hint?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[88vh] flex flex-col bg-background border border-border rounded-t-2xl sm:rounded-2xl"
      >
        <div className="px-5 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
              {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
            </div>
            <button type="button" onClick={onClose} className="w-11 h-11 -mr-3 -mt-2 flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Yopish">✕</button>
          </div>
          <p className="text-2xl font-bold tabular-nums text-gradient-gold mt-1">{total}</p>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Lines({ children }: { children: ReactNode }) {
  return <div className="space-y-2.5">{children}</div>;
}

function Line({ label, value, tone = "text-foreground", total }: { label: string; value: string; tone?: string; total?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${total ? "border-t border-border/60 pt-2.5 font-bold" : ""}`}>
      <span className={total ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`${tone} font-semibold tabular-nums whitespace-nowrap`}>{value}</span>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-secondary/30 border border-border/50 p-3 text-xs text-muted-foreground leading-relaxed">{children}</p>;
}

function List({ empty, children }: { empty: string; children: ReactNode[] }) {
  if (children.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return <div className="divide-y divide-border/50 -mx-5">{children}</div>;
}

function Item({ title, meta, value, sub, tone, dot }: { title: string; meta: string; value: string; sub?: string; tone: string; dot?: string }) {
  return (
    <div className="px-5 py-2.5 flex items-start gap-3">
      {dot && <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate" title={title}>{title}</p>
        <p className="text-xs text-muted-foreground truncate" title={meta}>{meta}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums whitespace-nowrap ${tone}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground tabular-nums">{sub}</p>}
      </div>
    </div>
  );
}
