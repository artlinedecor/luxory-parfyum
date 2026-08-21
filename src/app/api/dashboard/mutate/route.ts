import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { serverSupabase } from "@/lib/supabase-server";
import { assertAllowed } from "@/lib/dashboard-tables";

/**
 * Dashboard uchun yozish — insert / update / delete.
 *
 * Faqat admin sessiyasi bilan ishlaydi. Jadval va amal ruxsat
 * ro'yxatidan tekshiriladi (dashboard-tables.ts).
 *
 * Kutadi: { table, action, values?, match?, matchIn? }
 *   insert -> values (obyekt yoki massiv)
 *   update -> values + match
 *   delete -> match yoki matchIn
 */
export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { table, action, values, match, matchIn } = (await req.json()) as {
      table: string;
      action: string;
      values?: Record<string, unknown> | Record<string, unknown>[];
      match?: Record<string, unknown>;
      matchIn?: { column: string; values: unknown[] };
    };

    assertAllowed(table, action);

    const supabase = serverSupabase();

    if (action === "insert") {
      if (!values) throw new Error("insert uchun values majburiy");
      const { data, error } = await supabase.from(table).insert(values).select();
      if (error) throw new Error(error.message);
      return NextResponse.json({ data });
    }

    if (action === "update") {
      if (!values || Array.isArray(values)) throw new Error("update uchun values obyekt bo'lishi kerak");
      if (!match || !Object.keys(match).length) {
        // ⚠️ match'siz update BUTUN jadvalni o'zgartirardi.
        throw new Error("update uchun match majburiy");
      }
      const { data, error } = await supabase.from(table).update(values).match(match).select();
      if (error) throw new Error(error.message);
      return NextResponse.json({ data });
    }

    // delete
    let q = supabase.from(table).delete();
    if (matchIn) {
      q = q.in(matchIn.column, matchIn.values as never[]);
    } else if (match && Object.keys(match).length) {
      q = q.match(match);
    } else {
      // ⚠️ Shartsiz delete BUTUN jadvalni o'chirardi.
      throw new Error("delete uchun match majburiy");
    }
    const { error } = await q;
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[dashboard/mutate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" },
      { status: 400 }
    );
  }
}
