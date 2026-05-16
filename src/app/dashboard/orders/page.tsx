"use client";

import { useState, useEffect } from "react";
import { Order } from "@/lib/types";

// Mock JSONB orders matching the new schema
const mockOrders: Order[] = [
  {
    id: "o1",
    merchant_id: "m1",
    items: [
      { product_id: "p1", title: "Baccarat Rouge 540", product_type: "lux_copy", quantity: 2, price_at_purchase: 35 }
    ],
    client_name: "Aziz Karimov",
    client_phone: "+998901234567",
    region: "Toshkent shahri",
    order_type: "full_payment",
    status: "pending",
    created_at: new Date().toISOString()
  },
  {
    id: "o2",
    merchant_id: "m1",
    items: [
      { product_id: "p2", title: "Tom Ford Lost Cherry", product_type: "original", quantity: 1, price_at_purchase: 120 },
      { product_id: "p3", title: "Creed Aventus", product_type: "lux_copy", quantity: 1, price_at_purchase: 40 }
    ],
    client_name: "Malika Saidova",
    client_phone: "+998997654321",
    region: "Samarqand viloyati",
    order_type: "deposit_50",
    status: "accepted",
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "Kutilmoqda", color: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20" },
  accepted: { text: "Qabul qilindi", color: "text-blue-400 bg-blue-400/10 border border-blue-400/20" },
  delivered: { text: "Yetkazildi", color: "text-green-400 bg-green-400/10 border border-green-400/20" },
  cancelled: { text: "Bekor qilindi", color: "text-red-400 bg-red-400/10 border border-red-400/20" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const calculateTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            <span className="text-gradient-gold">Buyurtmalar</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yangi va avvalgi buyurtmalarni boshqarish
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-gold/5">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mijoz / Telefon</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Mahsulotlar (JSONB)</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Manzil</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami Narx</th>
                <th className="px-6 py-5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {orders.map((order) => {
                const total = calculateTotal(order);
                const status = statusLabels[order.status];
                
                return (
                  <tr key={order.id} className="hover:bg-secondary/20 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{order.client_name}</span>
                        <a href={`tel:${order.client_phone}`} className="text-xs text-gold hover:underline mt-1">
                          {order.client_phone}
                        </a>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {isMounted ? new Date(order.created_at).toLocaleString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "..."}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col text-xs bg-secondary/50 p-2 rounded-lg border border-border/50">
                            <span className="font-semibold text-foreground truncate max-w-[200px]" title={item.title}>
                              {item.title}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-muted-foreground uppercase">{item.product_type} • x{item.quantity}</span>
                              <span className="text-gold font-medium">${item.price_at_purchase}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="inline-flex text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50">
                        {order.region}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gradient-gold">${total}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 uppercase">
                          {order.order_type === "deposit_50" ? "$50 Zaklad" : "To'liq"}
                        </span>
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
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4 animate-float">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Buyurtmalar topilmadi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
