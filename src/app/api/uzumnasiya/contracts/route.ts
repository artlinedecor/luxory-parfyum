import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-guard";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  confirmContract,
  cancelContract,
  checkContractStatus,
  uzumErrorPayload,
} from "@/lib/uzumnasiya";

/**
 * 4-bosqich: shartnomani boshqarish.
 *
 * ⚠️ ID semantikasi (dev API'da jonli tekshirilgan):
 *   confirm / status -> contract_id  (masalan 990001877)
 *   cancel           -> order        (masalan 99914425)
 *
 * Kutadi: { action: "confirm" | "cancel" | "status", contract_id?: number, order?: number }
 */
export async function POST(req: Request) {
  try {
    const { action, contract_id, order } = (await req.json()) as {
      action: "confirm" | "cancel" | "status";
      contract_id?: number;
      order?: number;
    };

    if (!action) {
      return NextResponse.json({ error: "action majburiy" }, { status: 400 });
    }

    // ⚠️ Audit X4: oldin bu route BUTUNLAY ochiq edi — har kim istalgan
    // shartnomani aktivlashtira yoki bekor qila olardi (contract id lar
    // ketma-ket: 990001877...).
    //
    // 'status' ni mijozning O'ZI chaqiradi (uzum-pending.ts:98 —
    // imzolangandan keyin buyurtmani tiklash uchun), shuning uchun u
    // ochiq qoladi, lekin rate limit bilan.
    if (action === "confirm" || action === "cancel") {
      const denied = await requireAdmin(req);
      if (denied) return denied;
    } else if (!rateLimit(`ctr:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Juda ko'p urinish. Birozdan keyin qayta urining." },
        { status: 429 }
      );
    }

    let res;
    if (action === "cancel") {
      const id = Number(order ?? contract_id);
      if (!id) {
        return NextResponse.json(
          { error: "cancel uchun 'order' id majburiy" },
          { status: 400 }
        );
      }
      res = await cancelContract(id);
    } else {
      const id = Number(contract_id);
      if (!id) {
        return NextResponse.json(
          { error: `${action} uchun 'contract_id' majburiy` },
          { status: 400 }
        );
      }
      res = action === "confirm" ? await confirmContract(id) : await checkContractStatus(id);
    }

    return NextResponse.json({
      success: true,
      response_code: res.response_code,
      data: res.data,
    });
  } catch (error) {
    const { body, status } = uzumErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
