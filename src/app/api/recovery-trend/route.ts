import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { round0 } from "@/lib/recovery-stats";

// GET /api/recovery-trend?batchId=&days=14
// Returns a per-day cumulative + daily recovery trend derived from
// RecoveryAttempt.amountCollected timestamps. Used for KPI sparklines and
// the recovery trend mini-chart.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }
  const days = Math.min(
    90,
    Math.max(1, Number(req.nextUrl.searchParams.get("days") || "14")),
  );

  const batch = await db.recoveryBatch.findUnique({
    where: { id: batchId },
    select: { name: true, startedAt: true },
  });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Fetch attempts within the window
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const attempts = await db.recoveryAttempt.findMany({
    where: { batchId, attemptedAt: { gte: since } },
    select: { amountCollected: true, attemptedAt: true },
    orderBy: { attemptedAt: "asc" },
  });

  // Bucket by day (yyyy-mm-dd in IST = UTC+5:30)
  const buckets = new Map<string, { recovered: number; attempts: number }>();
  for (const a of attempts) {
    const ist = new Date(a.attemptedAt.getTime() + 5.5 * 60 * 60 * 1000);
    const day = ist.toISOString().slice(0, 10);
    const cur = buckets.get(day) ?? { recovered: 0, attempts: 0 };
    cur.recovered += a.amountCollected;
    cur.attempts += 1;
    buckets.set(day, cur);
  }

  // Build a continuous day series (fill gaps with 0)
  const points: {
    day: string;
    cumulativeRecovered: number;
    dailyRecovered: number;
    attempts: number;
  }[] = [];
  let cumulative = 0;
  const today = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const ist = new Date(today.getTime() + 5.5 * 60 * 60 * 1000 - d * 24 * 60 * 60 * 1000);
    const day = ist.toISOString().slice(0, 10);
    const b = buckets.get(day) ?? { recovered: 0, attempts: 0 };
    cumulative += b.recovered;
    points.push({
      day,
      cumulativeRecovered: round0(cumulative),
      dailyRecovered: round0(b.recovered),
      attempts: b.attempts,
    });
  }

  return NextResponse.json({ points, batchName: batch.name });
}
