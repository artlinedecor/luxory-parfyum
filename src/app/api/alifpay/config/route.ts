import { NextResponse } from "next/server";
import { guardAlif, ALIF_HEADERS } from "@/lib/alif-api";
import { alifConfig } from "@/lib/alifpay";

export async function GET(req: Request) {
  try {
    if (await guardAlif(req, "config")) return NextResponse.json({ enabled: false }, { headers: ALIF_HEADERS });
    return NextResponse.json({ enabled: true, sandbox: alifConfig().mode === "sandbox" }, { headers: ALIF_HEADERS });
  } catch { return NextResponse.json({ enabled: false }, { headers: ALIF_HEADERS }); }
}
