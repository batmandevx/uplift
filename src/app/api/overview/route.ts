import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meanCI, round0, round2 } from "@/lib/recovery-stats";

// GET /api/overview
// Returns the default (RUNNING) batch, headline KPIs (pre-registered
// incremental recovery vs holdout with Wilson/mean CIs), and meta-validation
// against the sealed ground-truth batch.
export async function GET() {
  // Default batch = the RUNNING one (fallback to most recent).
  let batch = await db.recoveryBatch.findFirst({
    where: { status: "RUNNING" },
    orderBy: { startedAt: "desc" },
  });
  if (!batch) {
    batch = await db.recoveryBatch.findFirst({ orderBy: { createdAt: "desc" } });
  }
  if (!batch) {
    return NextResponse.json(
      { error: "No batches found. Run `bun run db:seed`." },
      { status: 404 },
    );
  }

  const debtors = await db.debtor.findMany({
    where: { batchId: batch.id },
    select: {
      isHoldout: true,
      recoveredAmount: true,
      outstandingAmount: true,
      optOut: true,
    },
  });

  const treated = debtors.filter((d) => !d.isHoldout);
  const holdout = debtors.filter((d) => d.isHoldout);

  const treatedVals = treated.map((d) => d.recoveredAmount);
  const holdoutVals = holdout.map((d) => d.recoveredAmount);

  const treatedMean = treatedVals.length
    ? treatedVals.reduce((a, b) => a + b, 0) / treatedVals.length
    : 0;
  const holdoutMean = holdoutVals.length
    ? holdoutVals.reduce((a, b) => a + b, 0) / holdoutVals.length
    : 0;

  const treatedCI = meanCI(treatedVals);
  const holdoutCI = meanCI(holdoutVals);

  const totalRecovered = debtors.reduce((a, d) => a + d.recoveredAmount, 0);
  const treatedN = treated.length;
  const holdoutN = holdout.length;

  // Incremental recovery = (treated mean - holdout mean) * treated N
  // This is the pre-registered, holdout-adjusted incremental rupees recovered
  // attributable to the treatment (the recovery program).
  const incrementalRupees = round0((treatedMean - holdoutMean) * treatedN);
  const incrementalPct = holdoutMean > 0
    ? round2(((treatedMean - holdoutMean) / holdoutMean) * 100)
    : 0;

  // --- Meta-validation against the SEALED ground-truth batch ---
  // We compare the *estimate* (this batch's observed incremental recovery per
  // treated debtor) against the *sealed truth* (the closed batch's actual
  // incremental recovery per treated debtor). If within ±15%, "validated".
  const sealed = await db.recoveryBatch.findFirst({
    where: { status: "SEALED" },
    orderBy: { closedAt: "desc" },
  });

  let sealedValidation;
  if (sealed) {
    const sealedDebtors = await db.debtor.findMany({
      where: { batchId: sealed.id },
      select: { isHoldout: true, recoveredAmount: true },
    });
    const sTreated = sealedDebtors.filter((d) => !d.isHoldout);
    const sHoldout = sealedDebtors.filter((d) => d.isHoldout);
    const sTreatedMean = sTreated.length
      ? sTreated.reduce((a, d) => a + d.recoveredAmount, 0) / sTreated.length
      : 0;
    const sHoldoutMean = sHoldout.length
      ? sHoldout.reduce((a, d) => a + d.recoveredAmount, 0) / sHoldout.length
      : 0;
    const sealedTruthRupees = round0((sTreatedMean - sHoldoutMean) * sTreated.length);
    // Estimate = current batch's per-treated-debtor lift * sealed treated N
    const estimateRupees = round0(
      (treatedMean - holdoutMean) * sTreated.length,
    );
    const deltaRupees = round0(estimateRupees - sealedTruthRupees);
    const deltaPct = sealedTruthRupees !== 0
      ? round2((deltaRupees / Math.abs(sealedTruthRupees)) * 100)
      : 0;
    const validated = Math.abs(deltaPct) <= 15;
    sealedValidation = {
      estimateRupees,
      sealedTruthRupees,
      deltaRupees,
      deltaPct,
      validated,
      sealedBatchName: sealed.name,
    };
  } else {
    sealedValidation = {
      estimateRupees: 0,
      sealedTruthRupees: 0,
      deltaRupees: 0,
      deltaPct: 0,
      validated: false,
      sealedBatchName: null,
    };
  }

  const debtorCount = debtors.length;

  return NextResponse.json({
    batch: {
      id: batch.id,
      name: batch.name,
      region: batch.region,
      mandateLevel: batch.mandateLevel,
      holdoutRatio: batch.holdoutRatio,
      status: batch.status,
      startedAt: batch.startedAt,
      closedAt: batch.closedAt,
      debtorCount,
      recoveredTotal: round0(totalRecovered),
    },
    kpis: {
      totalRecovered: round0(totalRecovered),
      incrementalRupees,
      incrementalPct,
      holdoutRatio: batch.holdoutRatio,
      treatedN,
      holdoutN,
      treatedMean: round0(treatedMean),
      holdoutMean: round0(holdoutMean),
      treatedCI: [round0(treatedCI[0]), round0(treatedCI[1])] as [number, number],
      holdoutCI: [round0(holdoutCI[0]), round0(holdoutCI[1])] as [number, number],
    },
    sealedValidation,
  });
}
