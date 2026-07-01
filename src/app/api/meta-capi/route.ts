import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { normalizePhone, splitName } from "@/lib/meta-normalize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      event_name,
      event_id,
      user_data = {},
      custom_data = {},
      event_source_url,
      action_source = "website",
      event_time: eventTimeOverride,
    } = body;

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1576987160104483";
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.warn("Meta Pixel ID or Access Token is missing from environment configurations.");
      return NextResponse.json(
        { success: false, message: "Meta config missing" },
        { status: 400 }
      );
    }

    // IP va User Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || (req as any).ip || "";
    const userAgent = req.headers.get("user-agent") || "";

    // Bo'sh bo'lmagan qiymatni SHA-256 qiladi; agar allaqachon hash bo'lsa (64-hex) o'zini qaytaradi.
    const sha256 = (val?: string | null): string | undefined => {
      if (!val) return undefined;
      const cleanVal = String(val).trim().toLowerCase();
      if (!cleanVal) return undefined;
      if (/^[0-9a-f]{64}$/i.test(cleanVal)) return cleanVal;
      return crypto.createHash("sha256").update(cleanVal).digest("hex");
    };

    const finalUserData: any = {};
    if (ip) finalUserData.client_ip_address = ip;
    if (userAgent) finalUserData.client_user_agent = userAgent;

    // Advanced Matching: fn / ln / ph.
    // Client tomondan hash'langan (fn/ln/ph) kelishi mumkin — to'g'ridan-to'g'ri ishlatamiz.
    // DM/qo'lda (server) tomondan xom (client_name/client_phone) kelsa — normalize qilib hash'laymiz.
    let fnHash = sha256(user_data.fn);
    let lnHash = sha256(user_data.ln);
    let phHash = sha256(user_data.ph);

    if ((!fnHash || !lnHash) && user_data.client_name) {
      const { first, last } = splitName(user_data.client_name);
      if (!fnHash && first) fnHash = sha256(first);
      if (!lnHash && last) lnHash = sha256(last);
    }
    if (!phHash && user_data.client_phone) {
      phHash = sha256(normalizePhone(user_data.client_phone));
    }

    if (fnHash) finalUserData.fn = [fnHash];
    if (lnHash) finalUserData.ln = [lnHash];
    if (phHash) finalUserData.ph = [phHash];

    if (user_data.fbp) finalUserData.fbp = user_data.fbp;
    if (user_data.fbc) finalUserData.fbc = user_data.fbc;

    const eventTime = eventTimeOverride
      ? Math.floor(Number(eventTimeOverride))
      : Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name,
          event_time: eventTime,
          event_id,
          event_source_url: event_source_url || req.headers.get("referer") || "",
          action_source,
          user_data: finalUserData,
          custom_data,
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();
    if (!response.ok) {
      console.error("Meta CAPI endpoint returned error:", resData);
      return NextResponse.json(
        { success: false, error: resData },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: resData });
  } catch (error: any) {
    console.error("Meta CAPI execution failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
