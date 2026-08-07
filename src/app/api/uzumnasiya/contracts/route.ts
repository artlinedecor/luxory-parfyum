import { NextResponse } from "next/server";
import {
  confirmContract,
  cancelContract,
  checkContractStatus,
} from "@/lib/uzumnasiya";

/**
 * 4-bosqich: shartnomani boshqarish.
 * Kutadi: { action: "confirm" | "cancel" | "status", contract_id: number }
 */
export async function POST(req: Request) {
  try {
    const { action, contract_id } = (await req.json()) as {
      action: "confirm" | "cancel" | "status";
      contract_id: number;
    };
    if (!contract_id || !action) {
      return NextResponse.json(
        { error: "action va contract_id majburiy" },
        { status: 400 }
      );
    }

    const fn =
      action === "confirm"
        ? confirmContract
        : action === "cancel"
        ? cancelContract
        : checkContractStatus;

    const res = await fn(Number(contract_id));
    return NextResponse.json({
      success: true,
      response_code: res.response_code,
      data: res.data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
