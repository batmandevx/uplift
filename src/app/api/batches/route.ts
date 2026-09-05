import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { round0 } from "@/lib/recovery-stats";

// GET /api/batches
export async function GET() {
  const batches = await db.recoveryBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { debtors: true } },
    },
  });

  // Aggregate recovered totals per batch
  const result = await Promise.all(
    batches.map(async (b) => {
      const agg = await db.debtor.aggregate({
        where: { batchId: b.id },
        _sum: { recoveredAmount: true },
      });
      return {
        id: b.id,
        name: b.name,
        region: b.region,
        mandateLevel: b.mandateLevel,
        holdoutRatio: b.holdoutRatio,
        status: b.status,
        startedAt: b.startedAt,
        closedAt: b.closedAt,
        debtorCount: b._count.debtors,
        recoveredTotal: round0(agg._sum.recoveredAmount ?? 0),
      };
    }),
  );

  return NextResponse.json(result);
}
