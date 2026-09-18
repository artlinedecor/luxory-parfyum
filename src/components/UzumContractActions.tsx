"use client";

import { useEffect, useState } from "react";

interface Props {
  contractId: number;
  /** cancel uchun kerak (paymart_client.order) */
  orderNo?: number;
  /** uzum_contracts.status === "signed" — shartnoma imzolangan, holat yuklanguncha ko'rsatiladi. */
  initiallySigned?: boolean;
}

const CONTRACT_STATUS: Record<number, { text: string; color: string }> = {
  0: { text: "Imzolanmagan", color: "bg-gray-500/15 text-gray-400" },
  1: { text: "AKTIV", color: "bg-green-500/15 text-green-400" },
  2: { text: "Moderatsiyada — tasdiqlash kerak", color: "bg-amber-500/15 text-amber-400" },
  3: { text: "Muddati o'tgan (+60)", color: "bg-red-500/15 text-red-400" },
  4: { text: "Muddati o'tgan (+30)", color: "bg-red-500/15 text-red-400" },
  5: { text: "Bekor qilingan", color: "bg-red-500/15 text-red-400" },
  9: { text: "Yopilgan", color: "bg-blue-500/15 text-blue-400" },
};

/**
 * Uzum Nasiya shartnomasini admin paneldan boshqarish.
 *
 * Uzum'da 2 bosqichli tasdiqlash: mijoz OTP bilan imzolagach shartnoma
 * "moderatsiyada" (status 2) turadi. Sotuvchi omborni tekshirib CONFIRM
 * bosgandan keyingina shartnoma AKTIV bo'ladi va tovarni berish mumkin.
 * Bu out-of-stock holatining oldini oladi.
 */
export default function UzumContractActions({ contractId, orderNo, initiallySigned }: Props) {
  const [status, setStatus] = useState<number | null>(null);
  const [signed, setSigned] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  const call = async (action: "status" | "confirm" | "cancel") => {
    setBusy(true);
    setMsg("");
    setSessionExpired(false);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "cancel") body.order = orderNo ?? contractId;
      else body.contract_id = contractId;

      const r = await fetch("/api/uzumnasiya/contracts", {
        method: "POST",
        // ⚠️ Sessiya cookie'si yuborilishi SHART — busiz admin
        // tekshiruvidan o'tmay, tugma "ishlamayapti"dek ko'rinardi.
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (r.status === 401) {
        // Eski, tushunarsiz "⚠️ Ruxsat yo'q" o'rniga — aniq sabab va
        // keyingi qadam. Bu holat sessiya muddati tugaganda yuz beradi.
        setSessionExpired(true);
        return;
      }

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Xatolik");

      if (action === "status") {
        setStatus(Number(j.data?.contract_status));
        setSigned(Boolean(j.data?.is_signed));
      } else {
        setMsg(action === "confirm" ? "✅ Shartnoma aktivlashtirildi" : "Shartnoma bekor qilindi");
        await new Promise((r) => setTimeout(r, 600));
        await call("status");
        return;
      }
    } catch (e) {
      setMsg("⚠️ " + (e instanceof Error ? e.message : "Xatolik"));
    } finally {
      setBusy(false);
    }
  };

  // Shartnoma imzolangan bo'lsa, holatni HAR SAFAR qo'lda tekshirish
  // shart bo'lmasin — sahifa ochilganda o'zi yuklaydi.
  useEffect(() => {
    if (initiallySigned) call("status");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const st = status !== null ? CONTRACT_STATUS[status] : null;

  if (sessionExpired) {
    return (
      <div className="mt-2 p-2.5 rounded-lg bg-destructive/8 border border-destructive/25 space-y-1.5">
        <p className="text-[11px] font-bold text-destructive">
          Sessiya tugagan — qayta kiring
        </p>
        <a href="/login" className="text-[10px] text-destructive underline">
          Kirish sahifasiga o&apos;tish
        </a>
      </div>
    );
  }

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-[#6100FF]/8 border border-[#6100FF]/25 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-[#a97bff]">
          Uzum Nasiya · #{contractId}
        </span>
        {!st && busy && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400">
            Yuklanmoqda...
          </span>
        )}
        {st && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
            {st.text}
            {signed === false && status === 0 ? " (OTP kutilmoqda)" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => call("status")}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-secondary text-foreground hover:bg-secondary/70 disabled:opacity-50"
        >
          Holatni tekshirish
        </button>
        <button
          onClick={() => call("confirm")}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-500/90 text-black hover:bg-green-500 disabled:opacity-50"
          title="Omborda tovar borligini tekshirib tasdiqlang"
        >
          Tasdiqlash
        </button>
        <button
          onClick={() => call("cancel")}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50"
        >
          Bekor qilish
        </button>
      </div>

      {msg && <p className="text-[10px] text-muted-foreground leading-relaxed">{msg}</p>}
    </div>
  );
}
