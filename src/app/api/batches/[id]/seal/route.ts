import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { round0 } from "@/lib/recovery-stats";

// POST /api/batches/[id]/seal
// Flips a RUNNING batch to SEALED — locks the ground-truth amounts so the
// batch can be used for meta-validation of future batches. Writes an audit
// event and returns the sealed incremental-recovery ground truth.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const batch = await db.recoveryBatch.findUnique({ where: { id } });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  if (batch.status === "SEALED") {
    return NextResponse.json(
      { error: "Batch already sealed" },
      { status: 409 },
    );
  }

  const debtors = await db.debtor.findMany({
    where: { batchId: id },
    select: { isHoldout: true, recoveredAmount: true },
  });
  const treated = debtors.filter((d) => !d.isHoldout);
  const holdout = debtors.filter((d) => d.isHoldout);
  const treatedMean = treated.length
    ? treated.reduce((a, d) => a + d.recoveredAmount, 0) / treated.length
    : 0;
  const holdoutMean = holdout.length
    ? holdout.reduce((a, d) => a + d.recoveredAmount, 0) / holdout.length
    : 0;
  const incrementalRupees = round0((treatedMean - holdoutMean) * treated.length);

  const updated = await db.recoveryBatch.update({
    where: { id },
    data: { status: "SEALED", closedAt: new Date() },
  });

  await db.auditEvent.create({
    data: {
      batchId: id,
      actor: "operator@console",
      action: "BATCH_SEALED",
      detail: `Batch sealed. Ground truth: treated=${treated.length}, holdout=${holdout.length}, incremental=₹${incrementalRupees}.`,
    },
  });

  return NextResponse.json({
    ok: true,
    batch: {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      closedAt: updated.closedAt as unknown as string,
    },
    groundTruth: {
      treatedN: treated.length,
      holdoutN: holdout.length,
      incrementalRupees,
    },
  });
}
