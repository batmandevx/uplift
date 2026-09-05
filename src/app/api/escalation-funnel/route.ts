import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LADDER } from "@/lib/recovery-stats";

// GET /api/escalation-funnel?batchId=...
// Returns count of debtors currently sitting on each rung of the
// mandate-gated escalation ladder.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const debtors = await db.debtor.findMany({
    where: { batchId },
    select: { currentLevel: true },
  });

  const counts = new Map<number, number>();
  for (const d of debtors) {
    counts.set(d.currentLevel, (counts.get(d.currentLevel) ?? 0) + 1);
  }

  return NextResponse.json(
    LADDER.map((r) => ({
      level: r.level,
      label: r.label,
      count: counts.get(r.level) ?? 0,
    })),
  );
}
