import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/methodology?batchId=
// Returns the pre-registered methodology for a batch: the analysis plan,
// the methodology hash (fingerprint proving the plan was locked before
// results were observed), the pre-registration timestamp, the primary
// metric, and the significance level.
export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get("batchId");
  if (!batchId) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  const batch = await db.recoveryBatch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      name: true,
      status: true,
      mandateLevel: true,
      holdoutRatio: true,
      analysisPlan: true,
      methodologyHash: true,
      preRegisteredAt: true,
      primaryMetric: true,
      significanceLevel: true,
      startedAt: true,
    },
  });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  return NextResponse.json({
    batchId: batch.id,
    batchName: batch.name,
    status: batch.status as "RUNNING" | "SEALED" | "DRAFT" | "CLOSED",
    mandateLevel: batch.mandateLevel,
    holdoutRatio: batch.holdoutRatio,
    analysisPlan: batch.analysisPlan ?? "Not pre-registered.",
    methodologyHash: batch.methodologyHash ?? "—",
    preRegisteredAt: batch.preRegisteredAt ?? batch.startedAt ?? new Date().toISOString(),
    primaryMetric: batch.primaryMetric,
    significanceLevel: batch.significanceLevel,
    startedAt: batch.startedAt,
    sealed: batch.status !== "DRAFT",
  });
}
