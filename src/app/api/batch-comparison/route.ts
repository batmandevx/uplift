import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meanCI, round0, round2 } from "@/lib/recovery-stats";

// GET /api/batch-comparison
// Compares incremental recovery (treated vs holdout mean + Wilson/mean CI +
// lift %) across ALL batches. Used by the batch-comparison chart so the
// operator can benchmark the running batch against sealed ground-truth batches.
export async function GET() {
  const batches = await db.recoveryBatch.findMany({
    orderBy: { startedAt: "asc" },
  });

  const rows = await Promise.all(
    batches.map(async (b) => {
      const debtors = await db.debtor.findMany({
        where: { batchId: b.id },
        select: { isHoldout: true, recoveredAmount: true },
      });
      const treatedVals = debtors
        .filter((d) => !d.isHoldout)
        .map((d) => d.recoveredAmount);
      const holdoutVals = debtors
        .filter((d) => d.isHoldout)
        .map((d) => d.recoveredAmount);

      const treatedMean = treatedVals.length
        ? treatedVals.reduce((a, x) => a + x, 0) / treatedVals.length
        : 0;
      const holdoutMean = holdoutVals.length
        ? holdoutVals.reduce((a, x) => a + x, 0) / holdoutVals.length
        : 0;
      const treatedCI = meanCI(treatedVals);
      const holdoutCI = meanCI(holdoutVals);
      const incrementalRupees = round0(
        (treatedMean - holdoutMean) * treatedVals.length,
      );
      const liftPct = holdoutMean > 0
        ? round2(((treatedMean - holdoutMean) / holdoutMean) * 100)
        : 0;
      const totalRecovered = round0(
        debtors.reduce((a, d) => a + d.recoveredAmount, 0),
      );

      return {
        batchId: b.id,
        batchName: b.name,
        status: b.status,
        mandateLevel: b.mandateLevel,
        holdoutRatio: b.holdoutRatio,
        debtorCount: debtors.length,
        treatedN: treatedVals.length,
        holdoutN: holdoutVals.length,
        treatedMean: round0(treatedMean),
        holdoutMean: round0(holdoutMean),
        treatedCI: [round0(treatedCI[0]), round0(treatedCI[1])] as [number, number],
        holdoutCI: [round0(holdoutCI[0]), round0(holdoutCI[1])] as [number, number],
        incrementalRupees,
        liftPct,
        totalRecovered,
        closedAt: b.closedAt,
      };
    }),
  );

  return NextResponse.json(rows);
}
