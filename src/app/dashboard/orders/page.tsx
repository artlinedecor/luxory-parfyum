"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Order, Product } from "@/lib/types";
import { dashLoad } from "@/lib/dashboard-api";
import { USD_TO_UZS } from "@/lib/accounting";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs, formatUzs } from "@/lib/utils";
import { trackDmConversion } from "@/lib/meta-tracker";
import UzumContractActions from "@/components/UzumContractActions";

/** `uzum_contracts` jadvalidan bitta qator (dashboard-data qaytargan shakli). */
interface UzumContractRow {
  contract_id: number;
  order_row_id: string | null;
  uzum_order_id: number | null;
  status: string;
}

/**
 * Buyurtmadan Uzum Nasiya shartnoma ma'lumotini oladi.
 *
 * ⚠️ Bu yerda oldin `order.uzum_contract_id` ustuni yoki
 * `items[0]._uzum` metama'lumoti tekshirilardi — ikkalasi ham ESKI
 * sxema qoldig'i edi. `orders.uzum_contract_id` ustuni bazada UMUMAN
 * YO'Q (tekshirildi), yangi buyurtmalar esa items ichida _uzum
 * yozmaydi (pricing-server.ts PricedLine shakli). Natijada HAR BIR
 * yangi Uzum buyurtmasida bu funksiya har doim `null` qaytarardi va
 * "Tasdiqlash" tugmasi dashboard'da HECH QACHON ko'rinmasdi.
 *
 * Shartnoma endi alohida `uzum_contracts` jadvalida, `order_row_id`
 * orqali bog'langan (audit D4) — shu yerdan qidiramiz.
 */
function getUzumInfo(
  orderId: string,
  contracts: UzumContractRow[]
): { contract_id: number; order?: number; status: string } | null {
  const c = contracts.find((row) => row.order_row_id === orderId);
  if (!c) return null;
  return { contract_id: c.contract_id, order: c.uzum_order_id ?? undefined, status: c.status };
}

/**
 * Click orqali to'lov URINISHI muvaffaqiyatsiz bo'lgan buyurtmalarni
 * belgilaydi — mijoz Click sahifasiga o'tgan (prepare chaqirilgan),
 * lekin to'lovni yakunlamagan yoki Click uni rad etgan.
 *
 * ⚠️ Uzum Nasiya uchun bunday belgi YO'Q: agar mijoz OTP kiritmasdan
 * modalni yopib chiqib ketsa, order UMUMAN yaratilmaydi (joriy
 * arxitektura — /api/uzumnasiya/finalize faqat shartnoma imzolangach
 * chaqiriladi), ya'ni hech qanday iz qolmaydi.
 */
function paymentAttemptLabel(order: unknown): { text: string; color: string } | null {
  const o = order as Record<string, unknown> | null;
  if (!o) return null;
  if (o.payment_status === "waiting") {
    return {
      text: "Click: to'lov tugallanmadi",
      color: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
    };
  }
  if (o.payment_status === "cancelled") {
    return {
      text: "Click: to'lov rad etildi",
      color: "text-red-400 bg-red-400/10 border border-red-400/20",
    };
  }
  return null;
}

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Kutilmoqda", color: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20" },
  // Uzum Nasiya shartnomasi tasdiqlangach avtomatik shu holatga o'tadi
  // (uzum-order-sync.ts) — oddiy "Kutilmoqda"dan ajralib turishi uchun.
  processing: { text: "Tasdiqlangan — jo'natish kerak", color: "text-[#a97bff] bg-[#6100FF]/10 border border-[#6100FF]/25" },
  accepted: { text: "Qabul qilindi", color: "text-blue-400 bg-blue-400/10 border border-blue-400/20" },
  delivered: { text: "Yetkazildi", color: "text-green-400 bg-green-400/10 border border-green-400/20" },
  cancelled: { text: "Bekor qilindi", color: "text-red-400 bg-red-400/10 border border-red-400/20" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [uzumContracts, setUzumContracts] = useState<UzumContractRow[]>([]);
  const [usdRate, setUsdRate] = useState(USD_TO_UZS);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  interface ManualItem {
    id: string;
    product_id: string;
    title: string;
    quantity: number;
    price_at_purchase: number;
    product_type: "lux_copy" | "original";
  }

  // Manual order form states (Tezkor va erkin redaktirlash)
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("+998 ");
  const [manualSelectedItems, setManualSelectedItems] = useState<ManualItem[]>([
    {
      id: "item-1",
      product_id: "",
      title: "",
      quantity: 1,
      price_at_purchase: 45,
      product_type: "lux_copy",
    },
  ]);
  const [manualStatus, setManualStatus] = useState("delivered");
  const [manualSaving, setManualSaving] = useState(false);

  // Qo'lda buyurtma summasi ($ va so'mda)
  const manualTotalDollars = manualSelectedItems.reduce(
    (acc, item) => acc + (Number(item.price_at_purchase) || 0) * (Number(item.quantity) || 1),
    0
  );
  const manualTotalUzs = manualTotalDollars * usdRate;

  const fetchOrders = useCallback(async () => {
    // Audit X7: admin tekshiruvi bo'lgan server route orqali.
    try {
      const d = await dashLoad<Product, Order, Record<string, unknown>, UzumContractRow>();
      setOrders(d.orders);
      setProducts(d.products);
      setUzumContracts(d.uzumContracts ?? []);
      setUsdRate(d.usdRate || USD_TO_UZS);
    } catch (e) {
      console.error("Buyurtmalarni yuklab bo'lmadi", e);
      alert(e instanceof Error ? e.message : "Ma'lumot yuklanmadi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
  }, [fetchOrders]);

  const calculateTotal = (order: Order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => sum + ((item.price_at_purchase || 0) * item.quantity), 0);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const prevOrders = orders;
    // Optimistik ko'rsatish
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o));

    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "status", order_id: orderId, status: newStatus }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Holatni yangilab bo'lmadi");
      fetchOrders();
    } catch (e) {
      console.error("Holat yangilanmadi", e);
      alert(e instanceof Error ? e.message : "Holatni yangilab bo'lmadi");
      setOrders(prevOrders); // orqaga qaytaramiz
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Bu buyurtmani o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi!")) return;

    const prevOrders = orders;
    setOrders(prev => prev.filter(o => o.id !== orderId));

    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "delete", order_id: orderId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "O'chirib bo'lmadi");
    } catch (e) {
      console.error("Buyurtma o'chirilmadi", e);
      alert(e instanceof Error ? e.message : "O'chirib bo'lmadi");
      setOrders(prevOrders);
    }
  };

  // Yangi qo'lda buyurtma oynasini ochish
  const handleOpenManualModal = () => {
    setManualName("");
    setManualPhone("+998 ");
    setManualStatus("delivered");
    setManualSelectedItems([
      {
        id: "item-" + Date.now(),
        product_id: "",
        title: "",
        quantity: 1,
        price_at_purchase: 45,
        product_type: "lux_copy",
      },
    ]);
    setShowManualModal(true);
  };

  // Yangi qator qo'shish
  const handleAddManualRow = () => {
    setManualSelectedItems((prev) => [
      ...prev,
      {
        id: "item-" + Date.now() + Math.random().toString(36).slice(2, 6),
        product_id: "",
        title: "",
        quantity: 1,
        price_at_purchase: 45,
        product_type: "lux_copy",
      },
    ]);
  };

  // Qatordagi istalgan maydonni erkin o'zgartirish (Nomi, Soni, Narxi, Turi)
  const handleUpdateManualItem = (
    index: number,
    field: keyof ManualItem,
    value: string | number
  ) => {
    setManualSelectedItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };

      if (field === "title") {
        current.title = String(value);
        // Catalogda bor-yo'qligini tekshirib, agar to'liq mos kelsa narxini va id sini moslaymiz
        const cleanVal = String(value).trim().toLowerCase();
        const match = products.find((p) => p.title.trim().toLowerCase() === cleanVal);
        if (match) {
          current.product_id = match.id;
          current.product_type = match.product_type || "lux_copy";
          if (!current.price_at_purchase || current.price_at_purchase === 45) {
            current.price_at_purchase = match.price_usd || 45;
          }
        }
      } else if (field === "price_at_purchase") {
        current.price_at_purchase = Number(value) >= 0 ? Number(value) : 0;
      } else if (field === "quantity") {
        current.quantity = Math.max(1, Math.floor(Number(value) || 1));
      } else if (field === "product_type") {
        current.product_type = value as "lux_copy" | "original";
      }

      next[index] = current;
      return next;
    });
  };

  // Qatorni o'chirish
  const handleRemoveManualItem = (index: number) => {
    setManualSelectedItems((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: "item-" + Date.now(),
            product_id: "",
            title: "",
            quantity: 1,
            price_at_purchase: 45,
            product_type: "lux_copy",
          },
        ];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleManualSave = async () => {
    const validItems = manualSelectedItems.filter((i) => i.title.trim().length > 0);
    if (!manualName.trim() || !manualPhone.trim() || validItems.length === 0) {
      alert("Mijoz ismi, telefon raqami va kamida 1 ta atir nomi kiritilishi shart!");
      return;
    }
    setManualSaving(true);

    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "create",
          items: validItems.map((i) => ({
            product_id: i.product_id || undefined,
            title: i.title.trim(),
            quantity: Number(i.quantity) || 1,
            price_at_purchase: Number(i.price_at_purchase) || 0,
            product_type: i.product_type || "lux_copy",
          })),
          client_name: manualName.trim(),
          client_phone: manualPhone.trim(),
          status: manualStatus,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Buyurtma yaratilmadi");

      // DM / qo'lda savdo konversiyasi Meta CAPI ga
      trackDmConversion({
        eventName: "Purchase",
        eventId: `dm_pur_${j.order.id}`,
        clientName: manualName.trim(),
        clientPhone: manualPhone.trim(),
        value: Number(j.total_uzs) || 0,
        currency: "UZS",
        customData: {
          content_ids: validItems.map((i) => i.product_id || i.title),
          content_type: "product",
          num_items: validItems.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
        },
      });

      setShowManualModal(false);
      fetchOrders();
    } catch (e) {
      console.error("Qo'lda buyurtma yaratilmadi", e);
      alert(e instanceof Error ? e.message : "Buyurtma yaratilmadi");
    } finally {
      setManualSaving(false);
    }
  };

  const flatItems = useMemo(() => {
    return orders.flatMap((order) => {
      const items = order.items || [];
      if (items.length === 0) {
        return [{
          product_id: "none",
          title: "Noma'lum mahsulot",
          quantity: 1,
          price_at_purchase: 0,
          product_type: "lux_copy" as const,
          orderId: order.id,
          client_name: order.client_name,
          client_phone: order.client_phone,
          region: order.region,
          status: order.status,
          created_at: order.created_at,
          receipt_url: (order as any).receipt_url,
          order_type: order.order_type,
          parentOrder: order,
          uniqueKey: `${order.id}-empty`
        }];
      }
      return items.map((item, index) => ({
        ...item,
        product_type: (item.product_type || "lux_copy") as "lux_copy" | "original",
        orderId: order.id,
        client_name: order.client_name,
        client_phone: order.client_phone,
        region: order.region,
        status: order.status,
        created_at: order.created_at,
        receipt_url: (order as any).receipt_url,
        order_type: order.order_type,
        parentOrder: order,
        uniqueKey: `${order.id}-${index}-${item.product_id}`
      }));
    });
  }, [orders]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Buyurtmalar</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Yangi va avvalgi buyurtmalarni boshqarish</p>
        </div>
        <button
          onClick={handleOpenManualModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-gold text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-gold/20 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Qo&apos;lda buyurtma
        </button>
      </div>

      {/* Mobile view: Stack of cards for each flat sold item */}
      <div className="md:hidden space-y-4">
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground text-sm animate-pulse bg-secondary/5 border border-border/50 rounded-2xl">Yuklanmoqda...</div>
        )}
        {!isLoading && flatItems.map((item) => {
          const status = statusLabels[item.status] || statusLabels.pending;
          const subtotal = item.price_at_purchase * item.quantity;
          
          return (
            <div key={item.uniqueKey} className="glass-card rounded-2xl p-4 border border-gold/10 space-y-3 relative overflow-hidden bg-[#0d0d0d]/80 backdrop-blur-md">
              {/* Card Header: Client Info & Date */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">{item.client_name}</span>
                  <a href={`tel:${item.client_phone}`} className="text-xs text-gold hover:underline mt-0.5">{item.client_phone}</a>
                </div>
                <span className="text-[10px] text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-lg border border-border/50">
                  {isMounted ? new Date(item.created_at).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" }) : "..."}
                </span>
              </div>

              {/* Product Info */}
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/50 space-y-1.5">
                <p className="text-xs font-semibold text-foreground leading-snug">{item.title}</p>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground uppercase font-semibold">{item.product_type} • x{item.quantity}</span>
                  <span className="text-gold font-medium">
                    {item.price_at_purchase ? `$${item.price_at_purchase}` : (item.price_uzs ? `${formatUzs(item.price_uzs)} so'm` : "$0")} / jami:{" "}
                    <span className="font-bold">
                      {item.price_at_purchase ? `$${item.price_at_purchase * item.quantity}` : (item.price_uzs ? `${formatUzs(item.price_uzs * item.quantity)} so'm` : "$0")}
                    </span>
                  </span>
                </div>
              </div>

              {/* Region and Receipt */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>📍 {item.region}</span>
                {item.receipt_url ? (
                  <button 
                    onClick={() => setLightboxUrl(item.receipt_url)} 
                    className="inline-flex items-center gap-1 text-gold hover:underline font-bold"
                  >
                    🧾 Chekni ko&apos;rish
                  </button>
                ) : (
                  <span className="text-muted-foreground/60">Chek yo&apos;q</span>
                )}
              </div>

              {/* Click orqali urinilgan, lekin tugallanmagan to'lov */}
              {(() => {
                const pay = paymentAttemptLabel(item.parentOrder);
                return pay ? (
                  <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-block ${pay.color}`}>
                    {pay.text}
                  </div>
                ) : null;
              })()}

              {/* Status and Action bar */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.orderId, e.target.value)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold/50 transition-colors ${status.color}`}
                >
                  <option value="pending">Kutilmoqda</option>
                  <option value="processing">Tasdiqlangan — jo&apos;natish kerak</option>
                  <option value="accepted">Qabul qilindi</option>
                  <option value="delivered">Yetkazildi</option>
                  <option value="cancelled">Bekor qilindi</option>
                </select>

                <button
                  onClick={() => handleDeleteOrder(item.orderId)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="O'chirish"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  O&apos;chirish
                </button>
              </div>

              {/* Uzum Nasiya shartnomasi (2-bosqichli tasdiqlash) */}
              {(() => {
                const uz = getUzumInfo(item.parentOrder.id, uzumContracts);
                return uz ? (
                  <UzumContractActions
                    contractId={uz.contract_id}
                    orderNo={uz.order}
                    initiallySigned={uz.status === "signed"}
                  />
                ) : null;
              })()}
            </div>
          );
        })}
        {!isLoading && flatItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-widest bg-secondary/5 border border-border/50 rounded-2xl">Buyurtmalar topilmadi</div>
        )}
      </div>

      {/* Desktop view: Table for widescreen */}
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden shadow-2xl shadow-gold/5">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mijoz / Telefon</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mahsulot</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Turi</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Soni</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Narxi</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Manzil</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Chek</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold text-right">Status / Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground text-sm animate-pulse">Yuklanmoqda...</td></tr>
              )}
              {!isLoading && flatItems.map((item) => {
                const status = statusLabels[item.status] || statusLabels.pending;
                const subtotal = item.price_at_purchase * item.quantity;

                return (
                  <tr key={item.uniqueKey} className="hover:bg-secondary/20 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{item.client_name}</span>
                        <a href={`tel:${item.client_phone}`} className="text-xs text-gold hover:underline mt-1">{item.client_phone}</a>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {isMounted ? new Date(item.created_at).toLocaleString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "..."}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[200px]" title={item.title}>{item.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground uppercase font-medium">{item.product_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-foreground">x{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {item.price_at_purchase ? `$${item.price_at_purchase}` : (item.price_uzs ? `${formatUzs(item.price_uzs)} so'm` : "$0")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gradient-gold">
                        {item.price_at_purchase ? `$${item.price_at_purchase * item.quantity}` : (item.price_uzs ? `${formatUzs(item.price_uzs * item.quantity)} so'm` : "$0")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50">{item.region}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.receipt_url ? (
                        <button onClick={() => setLightboxUrl(item.receipt_url)} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-gold/30 hover:border-gold transition-colors cursor-pointer group">
                          <Image src={item.receipt_url} alt="Chek" fill className="object-cover" sizes="48px" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const pay = paymentAttemptLabel(item.parentOrder);
                          return pay ? (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${pay.color}`}>
                              {pay.text}
                            </span>
                          ) : null;
                        })()}
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.orderId, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors ${status.color}`}
                        >
                          <option value="pending">Kutilmoqda</option>
                          <option value="processing">Tasdiqlangan — jo&apos;natish kerak</option>
                          <option value="accepted">Qabul qilindi</option>
                          <option value="delivered">Yetkazildi</option>
                          <option value="cancelled">Bekor qilindi</option>
                        </select>
                        <button
                          onClick={() => handleDeleteOrder(item.orderId)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors"
                          title="O'chirish"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && flatItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground text-sm uppercase tracking-wider">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Order Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] w-full max-w-2xl rounded-2xl border border-gold/20 shadow-2xl p-5 sm:p-6 relative animate-scale-in max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="text-gradient-gold">Qo&apos;lda buyurtma / sotuv</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atir nomi va narxini erkin yozing yoki takliflardan tez tanlang
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                title="Yopish"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1">
              {/* Mijoz ma'lumotlari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-secondary/20 p-3 rounded-xl border border-border/40">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mijoz ismi</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Masalan: Azizbek Samarqand"
                    className="w-full px-3 py-2 bg-secondary/80 border border-border/60 rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefon raqami</label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 bg-secondary/80 border border-border/60 rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>
              </div>

              {/* Datalist for autocomplete suggestions */}
              <datalist id="perfume-catalog-list">
                {products.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.title} (${p.price_usd})
                  </option>
                ))}
              </datalist>

              {/* Mahsulotlar ro'yxati */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span>Atirlar / Mahsulotlar</span>
                    <span className="text-[10px] lowercase text-gold/80 font-normal">(nom va narx erkin o&apos;zgartiriladi)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddManualRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:text-gold/80 px-2.5 py-1 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/30 transition-all cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    + Yangi atir qo&apos;shish
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {manualSelectedItems.map((item, idx) => {
                    const rowTotal = (Number(item.price_at_purchase) || 0) * (Number(item.quantity) || 1);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-secondary/30 p-2.5 rounded-xl border border-border/60 hover:border-gold/30 transition-all"
                      >
                        {/* Atir nomi (erkin yozish + datalist takliflari) */}
                        <div className="flex-1 min-w-[170px]">
                          <input
                            type="text"
                            list="perfume-catalog-list"
                            value={item.title}
                            onChange={(e) => handleUpdateManualItem(idx, "title", e.target.value)}
                            placeholder="Atir nomini yozing (masalan: Ganymede)..."
                            className="w-full px-2.5 py-1.5 bg-background border border-border/60 rounded-lg text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:border-gold/60 placeholder:text-muted-foreground/50"
                          />
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-start">
                          {/* Soni */}
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateManualItem(idx, "quantity", e.target.value)}
                              className="w-14 px-2 py-1.5 bg-background border border-border/60 rounded-lg text-xs font-semibold text-center text-foreground focus:outline-none focus:border-gold/60"
                              title="Soni"
                            />
                            <span className="text-[11px] text-muted-foreground">ta</span>
                          </div>

                          {/* Narxi ($) - Qo'lda erkin yozish */}
                          <div className="flex items-center gap-1">
                            <div className="relative flex items-center">
                              <span className="absolute left-2 text-muted-foreground text-xs font-bold">$</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.price_at_purchase === 0 ? "" : item.price_at_purchase}
                                onChange={(e) => handleUpdateManualItem(idx, "price_at_purchase", e.target.value)}
                                placeholder="0"
                                className="w-20 pl-5 pr-2 py-1.5 bg-background border border-border/60 rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-gold/60"
                                title="Bitta atir narxi ($)"
                              />
                            </div>
                          </div>

                          {/* Turi */}
                          <select
                            value={item.product_type}
                            onChange={(e) => handleUpdateManualItem(idx, "product_type", e.target.value)}
                            className="text-[11px] px-2 py-1.5 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-gold/60 cursor-pointer"
                          >
                            <option value="lux_copy">Lux</option>
                            <option value="original">Original</option>
                          </select>

                          {/* Qator summasi */}
                          <div className="min-w-[50px] text-right font-bold text-xs text-gradient-gold">
                            ${rowTotal}
                          </div>

                          {/* O'chirish */}
                          <button
                            type="button"
                            onClick={() => handleRemoveManualItem(idx)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status va Jami */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Holat (Status)</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary/80 border border-border/60 rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/60 cursor-pointer"
                  >
                    <option value="delivered">Yetkazildi (Savdo va daromad yoziladi)</option>
                    <option value="accepted">Qabul qilindi</option>
                    <option value="pending">Kutilmoqda</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Jami Summa</label>
                  <div className="px-3 py-2 bg-secondary/80 border border-border/60 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-bold text-gradient-gold">${manualTotalDollars}</span>
                    <span className="text-xs text-muted-foreground font-medium">≈ {formatUzs(manualTotalUzs)} so&apos;m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleManualSave}
                disabled={manualSaving || !manualName.trim() || !manualPhone.trim() || manualSelectedItems.every((i) => !i.title.trim())}
                className="flex-1 py-2.5 rounded-xl bg-gradient-gold text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {manualSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-2xl max-h-[85vh] w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxUrl(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="relative w-full h-[75vh] rounded-2xl overflow-hidden border border-gold/20 shadow-2xl">
              <Image src={lightboxUrl} alt="To'lov cheki" fill className="object-contain bg-black" sizes="(max-width: 768px) 100vw, 672px" />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">🧾 To&apos;lov cheki</p>
          </div>
        </div>
      )}
    </div>
  );
}
