import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { readMissing, deleteMissingPerfume } from "@/lib/missing-perfumes";

const NO_STORE = { "Cache-Control": "no-store" };

/** Mijozlar so'ragan, katalogda yo'q atirlar — faqat admin. */
export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const items = (await readMissing()).sort((a, b) => b.count - a.count || b.lastAt.localeCompare(a.lastAt));
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (e) {
    console.error("[missing-perfumes]", e);
    return NextResponse.json({ error: "Ro'yxatni o'qib bo'lmadi" }, { status: 500 });
  }
}

/** Atir saytga qo'shilgach ro'yxatdan olib tashlash: DELETE ?slug=creed-viking */
export async function DELETE(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug majburiy" }, { status: 400 });
  try {
    await deleteMissingPerfume(slug);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    console.error("[missing-perfumes] delete", e);
    return NextResponse.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
