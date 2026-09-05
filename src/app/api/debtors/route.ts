import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { round0 } from "@/lib/recovery-stats";

// GET /api/debtors?batchId=&q=&status=&limit=&offset=
// List debtors for a batch with optional token/region search + status filter.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const batchId = sp.get("batchId");
  const q = sp.get("q")?.trim().toLowerCase() || "";
  const status = sp.get("status") || "all"; // all | optout | active | treated | holdout
  const limit = Math.min(200, Number(sp.get("limit") || "100"));
  const offset = Math.max(0, Number(sp.get("offset") || "0"));

  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const where: Record<string, unknown> = { batchId };
  if (q) {
    where.OR = [
      { token: { contains: q } },
      { region: { contains: q } },
    ];
  }
  if (status === "optout") where.optOut = true;
  else if (status === "active") where.optOut = false;
  else if (status === "treated") where.isHoldout = false;
  else if (status === "holdout") where.isHoldout = true;

  const debtors = await db.debtor.findMany({
    where,
    orderBy: [{ lastAttemptAt: "desc" }, { token: "asc" }],
    take: limit,
    skip: offset,
  });

  return NextResponse.json(
    debtors.map((d) => ({
      id: d.id,
      token: d.token,
      region: d.region,
      preferredLanguage: d.preferredLanguage,
      outstandingAmount: round0(d.outstandingAmount),
      recoveredAmount: round0(d.recoveredAmount),
      isHoldout: d.isHoldout,
      optOut: d.optOut,
      currentLevel: d.currentLevel,
      attemptCountTotal: d.attemptCountTotal,
      lastAttemptAt: d.lastAttemptAt,
    })),
  );
}
