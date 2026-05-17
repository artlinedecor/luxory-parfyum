"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Order } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Kutilmoqda", color: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20" },
  accepted: { text: "Qabul qilindi", color: "text-blue-400 bg-blue-400/10 border border-blue-400/20" },
  delivered: { text: "Yetkazildi", color: "text-green-400 bg-green-400/10 border border-green-400/20" },
  cancelled: { text: "Bekor qilindi", color: "text-red-400 bg-red-400/10 border border-red-400/20" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Manual order form states
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualItems, setManualItems] = useState("");
  const [manualTotal, setManualTotal] = useState("");
  const [manualStatus, setManualStatus] = useState("pending");
  const [manualSaving, setManualSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchOrders();
  }, [fetchOrders]);

  const calculateTotal = (order: Order) => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    return order.items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // 1. Update local state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
    
    const supabase = createClient();
    
    // 2. Fetch order details before updating database (to see if it's transitioning to "delivered")
    const { data: orderData, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!fetchErr && orderData) {
      const order = orderData as Order;
      
      // 3. If transitioning to "delivered" AND wasn't delivered before
      if (newStatus === "delivered" && order.status !== "delivered") {
        // Decrease stock in products table
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id);
            if (isUUID) {
              const { data: prod } = await supabase
                .from("products")
                .select("stock")
                .eq("id", item.product_id)
                .single();
              
              if (prod) {
                const currentStock = prod.stock !== undefined && prod.stock !== null ? prod.stock : 10;
                const newStock = Math.max(0, currentStock - item.quantity);
                await supabase
                  .from("products")
                  .update({ stock: newStock })
                  .eq("id", item.product_id);
              }
            }
          }
        }

        // Add income transaction to transactions table
        const total = calculateTotal(order);
        await supabase.from("transactions").insert({
          type: "income",
          amount: total,
          description: `Buyurtma #${orderId.slice(0, 8)} yetkazildi - Daromad`,
        });
      }
    }

    // 4. Update the order status in Supabase database
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  };

  const handleManualSave = async () => {
    if (!manualName.trim() || !manualPhone.trim()) return;
    setManualSaving(true);
    const supabase = createClient();

    const parsedItems = manualItems.split(",").map(s => s.trim()).filter(Boolean).map(name => ({
      product_id: "manual",
      title: name,
      quantity: 1,
      price_at_purchase: 0,
      product_type: "lux_copy" as const,
    }));

    const { error } = await supabase.from("orders").insert({
      items: parsedItems.length > 0 ? parsedItems : [{ product_id: "manual", title: "Telefon buyurtma", quantity: 1, price_at_purchase: Number(manualTotal) || 0, product_type: "lux_copy" }],
      client_name: manualName,
      client_phone: manualPhone,
      region: "Qo'lda kiritilgan",
      order_type: "full_payment",
      status: manualStatus,
    });

    if (!error) {
      setShowManualModal(false);
      setManualName(""); setManualPhone(""); setManualItems(""); setManualTotal(""); setManualStatus("pending");
      fetchOrders();
    }
    setManualSaving(false);
  };

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
          onClick={() => setShowManualModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-gold text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-gold/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Qo&apos;lda buyurtma
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-gold/5">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mijoz / Telefon</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mahsulotlar</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Manzil</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Chek</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm animate-pulse">Yuklanmoqda...</td></tr>
              )}
              {!isLoading && orders.map((order) => {
                const total = calculateTotal(order);
                const status = statusLabels[order.status] || statusLabels.pending;
                const receiptUrl = (order as unknown as Record<string, unknown>).receipt_url as string | undefined;

                return (
                  <tr key={order.id} className="hover:bg-secondary/20 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{order.client_name}</span>
                        <a href={`tel:${order.client_phone}`} className="text-xs text-gold hover:underline mt-1">{order.client_phone}</a>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {isMounted ? new Date(order.created_at).toLocaleString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "..."}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex flex-col text-xs bg-secondary/50 p-2 rounded-lg border border-border/50">
                            <span className="font-semibold text-foreground truncate max-w-[200px]" title={item.title}>{item.title}</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-muted-foreground uppercase">{item.product_type} • x{item.quantity}</span>
                              <span className="text-gold font-medium">${item.price_at_purchase}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50">{order.region}</span>
                    </td>
                    <td className="px-6 py-4">
                      {receiptUrl ? (
                        <button onClick={() => setLightboxUrl(receiptUrl)} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-gold/30 hover:border-gold transition-colors cursor-pointer group">
                          <Image src={receiptUrl} alt="Chek" fill className="object-cover" sizes="48px" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z" clipRule="evenodd" /></svg>
                          </div>
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gradient-gold">${total}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase">{order.order_type === "deposit_50" ? "$50 Zaklad" : "To'liq"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors ${status.color}`}
                      >
                        <option value="pending">Kutilmoqda</option>
                        <option value="accepted">Qabul qilindi</option>
                        <option value="delivered">Yetkazildi</option>
                        <option value="cancelled">Bekor qilindi</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Buyurtmalar topilmadi</p>
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
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative animate-scale-in">
            <button onClick={() => setShowManualModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-semibold text-foreground mb-4">Qo&apos;lda buyurtma kiritish</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Mijoz ismi</label>
                <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon</label>
                <input type="tel" value={manualPhone} onChange={e => setManualPhone(e.target.value)} placeholder="+998..." className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Mahsulotlar (vergul bilan)</label>
                <input type="text" value={manualItems} onChange={e => setManualItems(e.target.value)} placeholder="Baccarat Rouge, Creed Aventus" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Jami ($)</label>
                  <input type="number" value={manualTotal} onChange={e => setManualTotal(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                  <select value={manualStatus} onChange={e => setManualStatus(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-gold/50 appearance-none">
                    <option value="pending">Kutilmoqda</option>
                    <option value="accepted">Qabul qilindi</option>
                    <option value="delivered">Yetkazildi</option>
                  </select>
                </div>
              </div>
              <button onClick={handleManualSave} disabled={manualSaving || !manualName.trim() || !manualPhone.trim()} className="w-full py-3 mt-2 rounded-xl bg-gradient-gold text-black font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50">
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
