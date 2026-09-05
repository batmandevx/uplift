import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/recovery-distribution?batchId=...
// Histogram of per-debtor recovery % (recovered / outstanding) bucketed into
// 5 bands: 0-20%, 20-40%, 40-60%, 60-80%, 80-100%. Split treated vs holdout.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const debtors = await db.debtor.findMany({
    where: { batchId },
    select: { isHoldout: true, recoveredAmount: true, outstandingAmount: true },
  });

  const buckets = [
    { bucket: "0-20%", lo: 0, hi: 0.2, treated: 0, holdout: 0 },
    { bucket: "20-40%", lo: 0.2, hi: 0.4, treated: 0, holdout: 0 },
    { bucket: "40-60%", lo: 0.4, hi: 0.6, treated: 0, holdout: 0 },
    { bucket: "60-80%", lo: 0.6, hi: 0.8, treated: 0, holdout: 0 },
    { bucket: "80-100%", lo: 0.8, hi: 1.01, treated: 0, holdout: 0 },
  ];

  for (const d of debtors) {
    if (d.outstandingAmount <= 0) continue;
    const pct = d.recoveredAmount / d.outstandingAmount;
    const b = buckets.find((b) => pct >= b.lo && pct < b.hi);
    if (b) {
      if (d.isHoldout) b.holdout++;
      else b.treated++;
    }
  }

  return NextResponse.json(
    buckets.map((b) => ({ bucket: b.bucket, treated: b.treated, holdout: b.holdout })),
  );
}
