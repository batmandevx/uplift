import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectStopPhrase } from "@/lib/recovery-stats";

// POST /api/stop-rule
// Body: { phrase: string, debtorToken?: string }
//
// Demonstrates the live stopping-rule path: an operator (or the ASR pipeline)
// submits a phrase. We detect the language (en / hi / hinglish), match a rule,
// and — if matched — immediately:
//   1. write an OptOutRecord (immutable opt-out registry),
//   2. set debtor.optOut = true and stop further outreach,
//   3. write a StopRuleEvent for the audit feed,
//   4. write an AuditEvent for compliance evidence.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { phrase?: string; debtorToken?: string }
    | null;
  if (!body || !body.phrase || typeof body.phrase !== "string") {
    return NextResponse.json(
      { error: "Missing 'phrase' in body" },
      { status: 400 },
    );
  }

  const phrase = body.phrase.trim();
  const match = detectStopPhrase(phrase);

  // Resolve a target debtor: explicit token, else pick a random treated
  // (non-holdout, non-opted-out) debtor from the RUNNING batch.
  let debtor: { id: string; token: string; batchId: string } | null = null;
  if (body.debtorToken) {
    debtor = await db.debtor.findUnique({
      where: { token: body.debtorToken },
      select: { id: true, token: true, batchId: true },
    });
  }
  if (!debtor) {
    const running = await db.recoveryBatch.findFirst({
      where: { status: "RUNNING" },
      orderBy: { startedAt: "desc" },
    });
    if (running) {
      debtor = await db.debtor.findFirst({
        where: {
          batchId: running.id,
          isHoldout: false,
          optOut: false,
        },
        orderBy: { lastAttemptAt: "desc" },
        select: { id: true, token: true, batchId: true },
      });
    }
  }
  if (!debtor) {
    return NextResponse.json(
      { error: "No eligible debtor found to attach the stop event" },
      { status: 404 },
    );
  }

  if (!match.matched) {
    // Not a stop phrase — log as audit but do NOT opt out.
    await db.auditEvent.create({
      data: {
        batchId: debtor.batchId,
        debtorId: debtor.id,
        actor: "stop-rule-engine",
        action: "STOP_PHRASE_NOT_MATCHED",
        detail: `Phrase not classified as stop: "${phrase.slice(0, 80)}"`,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Phrase did not match any stop rule.",
        detected: match,
      },
      { status: 200 },
    );
  }

  // Matched — halt outreach, write opt-out + stop event + audit.
  const [optOutRecord, stopEvent] = await db.$transaction([
    db.optOutRecord.create({
      data: {
        debtorId: debtor.id,
        source: "CONSOLE",
        reason: "STOP_PHRASE_DETECTED",
        rawPhrase: phrase,
        language: match.language,
      },
    }),
    db.stopRuleEvent.create({
      data: {
        batchId: debtor.batchId,
        debtorId: debtor.id,
        rawPhrase: phrase,
        detectedLanguage: match.language,
        matchedRule: match.rule,
        actionTaken: "HALT_OUTREACH",
        confidence: match.confidence,
      },
    }),
    db.debtor.update({
      where: { id: debtor.id },
      data: {
        optOut: true,
        optOutReason: "STOP_PHRASE_DETECTED",
        stoppedReason: match.rule,
      },
    }),
    db.auditEvent.create({
      data: {
        batchId: debtor.batchId,
        debtorId: debtor.id,
        actor: "stop-rule-engine",
        action: "STOP_RULE_TRIGGERED",
        detail: `${match.rule} (${match.language}) · confidence ${match.confidence.toFixed(2)} · outreach halted for ${debtor.token}`,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    event: {
      id: stopEvent.id,
      debtorToken: debtor.token,
      rawPhrase: stopEvent.rawPhrase,
      detectedLanguage: stopEvent.detectedLanguage,
      matchedRule: stopEvent.matchedRule,
      actionTaken: stopEvent.actionTaken,
      confidence: stopEvent.confidence,
      at: stopEvent.at,
    },
    optOutRecord: {
      id: optOutRecord.id,
      debtorToken: debtor.token,
      reason: optOutRecord.reason,
      createdAt: optOutRecord.detectedAt,
    },
  });
}
