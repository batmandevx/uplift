import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meanCI, round0 } from "@/lib/recovery-stats";

// GET /api/holdout-comparison?batchId=...
// Pre-registered treated-vs-holdout comparison with mean CI.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const debtors = await db.debtor.findMany({
    where: { batchId },
    select: { isHoldout: true, recoveredAmount: true },
  });

  const treatedVals = debtors.filter((d) => !d.isHoldout).map((d) => d.recoveredAmount);
  const holdoutVals = debtors.filter((d) => d.isHoldout).map((d) => d.recoveredAmount);

  const treatedMean = treatedVals.length
    ? treatedVals.reduce((a, b) => a + b, 0) / treatedVals.length
    : 0;
  const holdoutMean = holdoutVals.length
    ? holdoutVals.reduce((a, b) => a + b, 0) / holdoutVals.length
    : 0;

  const treatedCI = meanCI(treatedVals);
  const holdoutCI = meanCI(holdoutVals);

  return NextResponse.json({
    treated: {
      n: treatedVals.length,
      mean: round0(treatedMean),
      ci: [round0(treatedCI[0]), round0(treatedCI[1])] as [number, number],
      total: round0(treatedVals.reduce((a, b) => a + b, 0)),
    },
    holdout: {
      n: holdoutVals.length,
      mean: round0(holdoutMean),
      ci: [round0(holdoutCI[0]), round0(holdoutCI[1])] as [number, number],
      total: round0(holdoutVals.reduce((a, b) => a + b, 0)),
    },
  });
}
