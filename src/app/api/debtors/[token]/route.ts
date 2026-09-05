import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { round0, round2 } from "@/lib/recovery-stats";

// GET /api/debtors/[token]
// Per-debtor drill-down: attempts timeline, opt-out records, audit trail.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const debtor = await db.debtor.findUnique({
    where: { token },
    include: { batch: { select: { id: true, name: true } } },
  });
  if (!debtor) {
    return NextResponse.json({ error: "Debtor not found" }, { status: 404 });
  }

  const [attempts, optOuts, audit] = await Promise.all([
    db.recoveryAttempt.findMany({
      where: { debtorId: debtor.id },
      orderBy: { attemptedAt: "desc" },
      take: 50,
    }),
    db.optOutRecord.findMany({
      where: { debtorId: debtor.id },
      orderBy: { detectedAt: "desc" },
    }),
    db.auditEvent.findMany({
      where: { debtorId: debtor.id },
      orderBy: { at: "desc" },
      take: 50,
    }),
  ]);

  const recoveryPct = debtor.outstandingAmount > 0
    ? round2((debtor.recoveredAmount / debtor.outstandingAmount) * 100)
    : 0;

  return NextResponse.json({
    id: debtor.id,
    token: debtor.token,
    region: debtor.region,
    preferredLanguage: debtor.preferredLanguage,
    outstandingAmount: round0(debtor.outstandingAmount),
    recoveredAmount: round0(debtor.recoveredAmount),
    isHoldout: debtor.isHoldout,
    optOut: debtor.optOut,
    optOutReason: debtor.optOutReason,
    stoppedReason: debtor.stoppedReason,
    currentLevel: debtor.currentLevel,
    attemptCountToday: debtor.attemptCountToday,
    attemptCountTotal: debtor.attemptCountTotal,
    lastAttemptAt: debtor.lastAttemptAt,
    batchId: debtor.batch.id,
    batchName: debtor.batch.name,
    recoveryPct,
    attempts: attempts.map((a) => ({
      id: a.id,
      channel: a.channel,
      escalationLevel: a.escalationLevel,
      outcome: a.outcome,
      amountCollected: round0(a.amountCollected),
      transcriptSnippet: a.transcriptSnippet,
      attemptedAt: a.attemptedAt,
    })),
    optOuts: optOuts.map((o) => ({
      id: o.id,
      source: o.source,
      reason: o.reason,
      rawPhrase: o.rawPhrase,
      language: o.language,
      detectedAt: o.detectedAt,
    })),
    audit: audit.map((e) => ({
      id: e.id,
      at: e.at,
      actor: e.actor,
      action: e.action,
      detail: e.detail ?? undefined,
    })),
  });
}
