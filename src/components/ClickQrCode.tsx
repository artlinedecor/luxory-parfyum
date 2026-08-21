"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * To'lov havolasini QR kod qilib ko'rsatadi.
 *
 * Mijoz kompyuterda bo'lsa — telefoni bilan skanerlab, Click ilovasida
 * to'laydi. Telefonda bo'lsa — havolani bosadi.
 *
 * ⚠️ Bu Click Pass EMAS. Click Pass (api.click.uz/v2/merchant/click_pass)
 * teskari yo'nalishda ishlaydi: u kassaning MIJOZ QR kodini skanerlashi
 * uchun (`otp_data` = QR mazmuni, `cashbox_code` = kassa raqami).
 * Onlayn do'kon uchun to'g'ri kelmaydi.
 */
export default function ClickQrCode({ url }: { url: string }) {
  const [src, setSrc] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [url]);

  if (err) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <div className="p-2.5 bg-white rounded-lg border border-border/60">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Click to'lov QR kodi" width={140} height={140} className="block" />
        ) : (
          <div className="w-[140px] h-[140px] animate-pulse bg-black/5" />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed max-w-[220px]">
        Telefoningiz kamerasi bilan skanerlang &mdash; Click ilovasida to&apos;lov oynasi ochiladi
      </p>
    </div>
  );
}
