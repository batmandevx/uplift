import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/escalation-gates?status=PENDING
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "PENDING";

  const gates = await db.escalationGate.findMany({
    where: status === "ALL" ? undefined : { status },
    orderBy: { requestedAt: "desc" },
    take: 50,
    include: { debtor: { select: { token: true } } },
  });

  return NextResponse.json(
    gates.map((g) => ({
      id: g.id,
      debtorToken: g.debtor.token,
      fromLevel: g.fromLevel,
      toLevel: g.toLevel,
      rationale: g.rationale ?? "",
      requestedAt: g.requestedAt,
      status: g.status,
    })),
  );
}
